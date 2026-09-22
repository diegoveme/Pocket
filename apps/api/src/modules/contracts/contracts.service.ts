import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ApiErrorCode } from '@pocket/shared';
import { Prisma, type Contract } from '@prisma/client';
import type { AuthUser } from '../../common/types/auth';
import { PrismaService } from '../../prisma/prisma.service';
import type { PreparedTransaction } from '../stellar/chain-operations.service';
import { StellarService } from '../stellar/stellar.service';
import { JobsService } from '../jobs/jobs.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { EscrowService } from './escrow.service';

const DETAIL_INCLUDE = {
  job: {
    select: { id: true, title: true, category: true, deadline: true, status: true },
  },
  startup: {
    select: {
      id: true,
      stellarAddress: true,
      startupProfile: { select: { companyName: true, logoUrl: true } },
    },
  },
  specialist: {
    select: {
      id: true,
      stellarAddress: true,
      specialistProfile: { select: { displayName: true, avatarUrl: true } },
    },
  },
  milestones: {
    orderBy: { position: 'asc' },
    include: {
      deliverables: { orderBy: { version: 'asc' } },
      disputes: { orderBy: { createdAt: 'asc' } },
    },
  },
  chainOperations: {
    where: { status: 'confirmed' },
    orderBy: { confirmedAt: 'asc' },
    select: {
      id: true,
      kind: true,
      txHash: true,
      amount: true,
      milestoneId: true,
      confirmedAt: true,
    },
  },
} satisfies Prisma.ContractInclude;

@Injectable()
export class ContractsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jobs: JobsService,
    private readonly escrow: EscrowService,
    private readonly stellar: StellarService,
  ) {}

  /**
   * The startup chooses an applicant and splits the agreed price into
   * milestones. The job stops taking applications; the other applicants stay
   * on hold until the specialist accepts, so the startup can pick someone else
   * if they decline.
   */
  async create(user: AuthUser, dto: CreateContractDto): Promise<Contract> {
    const application = await this.prisma.application.findUnique({
      where: { id: dto.applicationId },
    });
    if (!application) throw new NotFoundException('Application not found');
    const jobId = application.jobId;
    const job = await this.jobs.ownedJob(user, jobId);
    if (job.status !== 'open') {
      throw new BadRequestException('This job is not open for hiring');
    }
    if (application.status !== 'submitted') {
      throw new BadRequestException('This application is no longer available');
    }

    const today = new Date().toISOString().slice(0, 10);
    if (dto.milestones.some((milestone) => milestone.dueDate < today)) {
      throw new BadRequestException('A milestone cannot be due in the past');
    }
    const total = dto.milestones.reduce(
      (sum, milestone) => sum.plus(milestone.amount),
      new Prisma.Decimal(0),
    );
    if (!total.equals(application.price)) {
      throw new BadRequestException(
        `The milestones add up to ${total.toString()} USDC but the agreed price is ${application.price.toString()} USDC`,
      );
    }

    const [contract] = await this.prisma.$transaction([
      this.prisma.contract.create({
        data: {
          jobId,
          applicationId: application.id,
          startupId: user.sub,
          specialistId: application.specialistId,
          amount: application.price,
          milestones: {
            create: dto.milestones.map((milestone, position) => ({
              ...milestone,
              position,
              dueDate: new Date(milestone.dueDate),
            })),
          },
        },
        include: { milestones: { orderBy: { position: 'asc' } } },
      }),
      this.prisma.application.update({
        where: { id: application.id },
        data: { status: 'accepted', decidedAt: new Date() },
      }),
      this.prisma.job.update({ where: { id: jobId }, data: { status: 'in_progress' } }),
    ]);
    return contract;
  }

  /** Contracts the signed-in user is a party to, newest first. */
  mine(user: AuthUser) {
    return this.prisma.contract.findMany({
      where:
        user.role === 'startup' ? { startupId: user.sub } : { specialistId: user.sub },
      orderBy: { createdAt: 'desc' },
      include: {
        job: { select: { id: true, title: true, category: true } },
        milestones: {
          orderBy: { position: 'asc' },
          select: { id: true, position: true, title: true, amount: true, status: true },
        },
      },
    });
  }

  /**
   * Full contract for its two parties and for managers. Once there is a
   * contract, each party can see the other's contact email, since they talk
   * outside the platform.
   */
  async detail(user: AuthUser, contractId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: DETAIL_INCLUDE,
    });
    if (!contract) throw new NotFoundException('Contract not found');
    assertCanView(user, contract);

    const contacts = await this.contactEmails([
      contract.startupId,
      contract.specialistId,
    ]);
    return {
      ...contract,
      contacts: {
        startup: contacts.get(contract.startupId) ?? null,
        specialist: contacts.get(contract.specialistId) ?? null,
      },
    };
  }

  /**
   * The specialist turns the terms down. The contract is cancelled and the job
   * opens again, so the startup can choose another applicant.
   */
  async decline(user: AuthUser, contractId: string): Promise<Contract> {
    const contract = await this.specialistContract(user, contractId);
    if (contract.status !== 'awaiting_specialist') {
      throw new BadRequestException('Only terms still waiting for you can be declined');
    }

    const [cancelled] = await this.prisma.$transaction([
      this.prisma.contract.update({
        where: { id: contractId },
        data: { status: 'cancelled', cancelledAt: new Date() },
      }),
      this.prisma.application.update({
        where: { id: contract.applicationId },
        data: { status: 'rejected' },
      }),
      this.prisma.job.update({ where: { id: contract.jobId }, data: { status: 'open' } }),
    ]);
    return cancelled;
  }

  /**
   * The specialist accepts the terms and Pocket deploys the escrow. Their
   * wallet must already trust USDC, or it could not receive the payments.
   */
  async accept(user: AuthUser, contractId: string): Promise<Contract> {
    const contract = await this.specialistContract(user, contractId);
    if (contract.status !== 'awaiting_specialist') {
      throw new BadRequestException('Only terms still waiting for you can be accepted');
    }
    await this.requireUsdcReady(user.stellarAddress);

    // Claim the contract so a double click cannot deploy two escrows.
    const claimed = await this.prisma.contract.updateMany({
      where: { id: contractId, status: 'awaiting_specialist', acceptedAt: null },
      data: { acceptedAt: new Date() },
    });
    if (claimed.count !== 1) {
      throw new ConflictException('This contract is already being accepted');
    }

    const full = await this.prisma.contract.findUniqueOrThrow({
      where: { id: contractId },
      include: {
        job: { select: { title: true, description: true } },
        startup: { select: { stellarAddress: true } },
        milestones: true,
      },
    });

    let escrowId: string;
    try {
      escrowId = await this.escrow.deploy({
        contract: full,
        title: full.job.title,
        description: full.job.description,
        milestones: full.milestones,
        startupAddress: full.startup.stellarAddress,
        specialistAddress: user.stellarAddress,
      });
    } catch (error) {
      await this.prisma.contract.update({
        where: { id: contractId },
        data: { acceptedAt: null },
      });
      throw error;
    }

    const [accepted] = await this.prisma.$transaction([
      this.prisma.contract.update({
        where: { id: contractId },
        data: { status: 'awaiting_funding', escrowId },
      }),
      // The hire is final now: the applicants who were on hold are turned down.
      this.prisma.application.updateMany({
        where: { jobId: contract.jobId, status: 'submitted' },
        data: { status: 'rejected', decidedAt: new Date() },
      }),
    ]);
    return accepted;
  }

  /** Funding transaction for the startup's wallet to sign. */
  async prepareFund(user: AuthUser, contractId: string): Promise<PreparedTransaction> {
    const contract = await this.startupContract(user, contractId);
    if (contract.status !== 'awaiting_funding') {
      throw new BadRequestException('This contract is not waiting for funding');
    }
    await this.requireUsdcReady(user.stellarAddress);
    return this.escrow.prepareFund(contract, user.sub, user.stellarAddress);
  }

  /**
   * Broadcast the startup's signed funding transaction. The contract becomes
   * active only once the escrow's balance on chain covers the full amount.
   */
  async submitFund(user: AuthUser, contractId: string, signedXdr: string) {
    const contract = await this.startupContract(user, contractId);
    if (contract.status !== 'awaiting_funding') {
      throw new BadRequestException('This contract is not waiting for funding');
    }
    await this.escrow.submitFund(contractId, signedXdr, user.sub);
    return this.syncFunding(user, contractId);
  }

  /**
   * Check the escrow's balance and activate the contract if it is funded.
   * Safe to call again, for when the chain took a moment to show the deposit.
   */
  async syncFunding(user: AuthUser, contractId: string): Promise<Contract> {
    const contract = await this.startupContract(user, contractId);
    if (contract.status !== 'awaiting_funding') return contract;
    if (!(await this.escrow.isFunded(contract))) {
      throw new ConflictException(
        'The escrow does not hold the full amount yet. Try again in a few seconds',
      );
    }
    return this.prisma.contract.update({
      where: { id: contractId },
      data: { status: 'active', fundedAt: new Date() },
    });
  }

  private async specialistContract(
    user: AuthUser,
    contractId: string,
  ): Promise<Contract> {
    const contract = await this.prisma.contract.findUnique({ where: { id: contractId } });
    if (!contract) throw new NotFoundException('Contract not found');
    if (contract.specialistId !== user.sub) {
      throw new ForbiddenException('Only the hired specialist can do this');
    }
    return contract;
  }

  private async startupContract(user: AuthUser, contractId: string): Promise<Contract> {
    const contract = await this.prisma.contract.findUnique({ where: { id: contractId } });
    if (!contract) throw new NotFoundException('Contract not found');
    if (contract.startupId !== user.sub) {
      throw new ForbiddenException('Only the startup that hired can do this');
    }
    return contract;
  }

  private async requireUsdcReady(address: string): Promise<void> {
    const readiness = await this.stellar.usdcReadiness(address);
    if (readiness === 'no_account') {
      throw new BadRequestException({
        code: ApiErrorCode.StellarAccountNotFound,
        message: 'Your wallet is not active on Stellar yet. Fund it with some XLM first',
      });
    }
    if (readiness === 'no_trustline') {
      throw new BadRequestException({
        code: ApiErrorCode.UsdcTrustlineRequired,
        message: 'Enable USDC in your wallet first',
      });
    }
  }

  /** Contact email from each user's approved verification. */
  private async contactEmails(userIds: string[]): Promise<Map<string, string>> {
    const requests = await this.prisma.verificationRequest.findMany({
      where: { userId: { in: userIds }, status: 'approved' },
      orderBy: { submittedAt: 'desc' },
      select: { userId: true, contactEmail: true },
    });
    const emails = new Map<string, string>();
    for (const request of requests) {
      if (!emails.has(request.userId)) emails.set(request.userId, request.contactEmail);
    }
    return emails;
  }
}

/** Parties see their own contracts; managers see every contract. */
export function assertCanView(
  user: AuthUser,
  contract: Pick<Contract, 'startupId' | 'specialistId'>,
): void {
  if (
    user.role !== 'manager' &&
    contract.startupId !== user.sub &&
    contract.specialistId !== user.sub
  ) {
    throw new ForbiddenException('You are not a party to this contract');
  }
}
