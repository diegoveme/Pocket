import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthUser } from '../../common/types/auth';
import type { PrismaService } from '../../prisma/prisma.service';
import type { StellarService } from '../stellar/stellar.service';
import { JobsService } from '../jobs/jobs.service';
import { ContractsService } from './contracts.service';
import type { CreateContractDto } from './dto/create-contract.dto';
import type { EscrowService } from './escrow.service';

const startup: AuthUser = {
  sub: 'startup-1',
  role: 'startup',
  stellarAddress: 'GSTARTUP',
};
const specialist: AuthUser = {
  sub: 'specialist-1',
  role: 'specialist',
  stellarAddress: 'GSPECIALIST',
};

function future(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
}

const dto: CreateContractDto = {
  applicationId: 'app-1',
  milestones: [
    {
      title: 'Lead list',
      description: 'A list of leads',
      amount: 100,
      dueDate: future(10),
    },
    {
      title: 'Report',
      description: 'A final report',
      amount: 350.5,
      dueDate: future(20),
    },
  ],
};

describe('ContractsService', () => {
  let prisma: {
    application: { findUnique: jest.Mock; update: jest.Mock; updateMany: jest.Mock };
    job: { findUnique: jest.Mock; update: jest.Mock };
    contract: {
      create: jest.Mock;
      findUnique: jest.Mock;
      findUniqueOrThrow: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let escrow: { deploy: jest.Mock; isFunded: jest.Mock };
  let stellar: { usdcReadiness: jest.Mock };
  let service: ContractsService;

  beforeEach(() => {
    prisma = {
      application: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'app-1',
          jobId: 'job-1',
          specialistId: 'specialist-1',
          status: 'submitted',
          price: new Prisma.Decimal('450.5'),
        }),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      job: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'job-1',
          startupId: 'startup-1',
          status: 'open',
        }),
        update: jest.fn(),
      },
      contract: {
        create: jest.fn().mockReturnValue({ id: 'contract-1' }),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        update: jest.fn(async ({ data }: { data: object }) => ({
          id: 'contract-1',
          ...data,
        })),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      $transaction: jest.fn(async (ops: unknown[]) => Promise.all(ops)),
    };
    escrow = { deploy: jest.fn().mockResolvedValue('CESCROW'), isFunded: jest.fn() };
    stellar = { usdcReadiness: jest.fn().mockResolvedValue('ready') };
    const client = prisma as unknown as PrismaService;
    service = new ContractsService(
      client,
      new JobsService(client),
      escrow as unknown as EscrowService,
      stellar as unknown as StellarService,
    );
  });

  describe('create', () => {
    it('hires the applicant with milestones in order and puts the job in progress', async () => {
      await service.create(startup, dto);

      expect(prisma.contract.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            jobId: 'job-1',
            startupId: 'startup-1',
            specialistId: 'specialist-1',
            milestones: {
              create: [
                expect.objectContaining({ title: 'Lead list', position: 0 }),
                expect.objectContaining({ title: 'Report', position: 1 }),
              ],
            },
          }),
        }),
      );
      expect(prisma.application.update).toHaveBeenCalledWith({
        where: { id: 'app-1' },
        data: expect.objectContaining({ status: 'accepted' }),
      });
      expect(prisma.job.update).toHaveBeenCalledWith({
        where: { id: 'job-1' },
        data: { status: 'in_progress' },
      });
    });

    it('requires the milestones to add up to the agreed price exactly', async () => {
      await expect(
        service.create(startup, {
          ...dto,
          milestones: [{ ...dto.milestones[0], amount: 450.4 }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.contract.create).not.toHaveBeenCalled();
    });

    it('refuses a milestone due in the past', async () => {
      await expect(
        service.create(startup, {
          ...dto,
          milestones: [
            { ...dto.milestones[0], dueDate: '2020-01-01' },
            dto.milestones[1],
          ],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("refuses to hire on another startup's job", async () => {
      prisma.job.findUnique.mockResolvedValue({
        id: 'job-1',
        startupId: 'startup-2',
        status: 'open',
      });
      await expect(service.create(startup, dto)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('refuses an application that was withdrawn', async () => {
      prisma.application.findUnique.mockResolvedValue({
        id: 'app-1',
        jobId: 'job-1',
        status: 'withdrawn',
        price: new Prisma.Decimal(450.5),
      });
      await expect(service.create(startup, dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('decline', () => {
    it('cancels the contract and opens the job again', async () => {
      prisma.contract.findUnique.mockResolvedValue({
        id: 'contract-1',
        jobId: 'job-1',
        applicationId: 'app-1',
        specialistId: 'specialist-1',
        status: 'awaiting_specialist',
      });

      await service.decline(specialist, 'contract-1');

      expect(prisma.contract.update).toHaveBeenCalledWith({
        where: { id: 'contract-1' },
        data: expect.objectContaining({ status: 'cancelled' }),
      });
      expect(prisma.job.update).toHaveBeenCalledWith({
        where: { id: 'job-1' },
        data: { status: 'open' },
      });
    });
  });

  describe('accept', () => {
    const waiting = {
      id: 'contract-1',
      jobId: 'job-1',
      specialistId: 'specialist-1',
      status: 'awaiting_specialist',
    };

    beforeEach(() => {
      prisma.contract.findUnique.mockResolvedValue(waiting);
      prisma.contract.findUniqueOrThrow.mockResolvedValue({
        ...waiting,
        job: { title: 'A job', description: 'Scope' },
        startup: { stellarAddress: 'GSTARTUP' },
        milestones: [],
      });
    });

    it('deploys the escrow and turns down the applicants on hold', async () => {
      const accepted = await service.accept(specialist, 'contract-1');

      expect(escrow.deploy).toHaveBeenCalledWith(
        expect.objectContaining({
          startupAddress: 'GSTARTUP',
          specialistAddress: 'GSPECIALIST',
        }),
      );
      expect(accepted).toEqual(
        expect.objectContaining({ status: 'awaiting_funding', escrowId: 'CESCROW' }),
      );
      expect(prisma.application.updateMany).toHaveBeenCalledWith({
        where: { jobId: 'job-1', status: 'submitted' },
        data: expect.objectContaining({ status: 'rejected' }),
      });
    });

    it('asks for a USDC trustline first, with a code the client can act on', async () => {
      stellar.usdcReadiness.mockResolvedValue('no_trustline');
      await expect(service.accept(specialist, 'contract-1')).rejects.toMatchObject({
        response: { code: 'USDC_TRUSTLINE_REQUIRED' },
      });
      expect(escrow.deploy).not.toHaveBeenCalled();
    });

    it('does not deploy twice when two accepts race', async () => {
      prisma.contract.updateMany.mockResolvedValue({ count: 0 });
      await expect(service.accept(specialist, 'contract-1')).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(escrow.deploy).not.toHaveBeenCalled();
    });

    it('releases the claim when the deploy fails, so it can be retried', async () => {
      escrow.deploy.mockRejectedValue(new ServiceUnavailableException('down'));
      await expect(service.accept(specialist, 'contract-1')).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
      expect(prisma.contract.update).toHaveBeenCalledWith({
        where: { id: 'contract-1' },
        data: { acceptedAt: null },
      });
    });

    it('refuses the startup', async () => {
      await expect(service.accept(startup, 'contract-1')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });

  describe('syncFunding', () => {
    const awaiting = {
      id: 'contract-1',
      startupId: 'startup-1',
      status: 'awaiting_funding',
      escrowId: 'CESCROW',
      amount: new Prisma.Decimal(450.5),
    };

    it('activates the contract once the escrow holds the full amount', async () => {
      prisma.contract.findUnique.mockResolvedValue(awaiting);
      escrow.isFunded.mockResolvedValue(true);

      const synced = await service.syncFunding(startup, 'contract-1');

      expect(synced).toEqual(expect.objectContaining({ status: 'active' }));
    });

    it('waits while the chain does not show the deposit', async () => {
      prisma.contract.findUnique.mockResolvedValue(awaiting);
      escrow.isFunded.mockResolvedValue(false);
      await expect(service.syncFunding(startup, 'contract-1')).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prisma.contract.update).not.toHaveBeenCalled();
    });
  });
});
