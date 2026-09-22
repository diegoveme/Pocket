import { BadRequestException, Injectable } from '@nestjs/common';
import type { ChainOperation, ChainOperationKind, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { StellarService } from './stellar.service';
import { TrustlessWorkClient } from './trustless-work.client';

/** What an operation is about, so a signed transaction can only be used for it. */
export interface OperationScope {
  kind: ChainOperationKind;
  contractId?: string;
  milestoneId?: string;
}

/** A transaction a user has to sign, as the API hands it to the client. */
export interface PreparedTransaction {
  operationId: string;
  xdr: string;
  networkPassphrase: string;
}

@Injectable()
export class ChainOperationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stellar: StellarService,
    private readonly trustlessWork: TrustlessWorkClient,
  ) {}

  /** Record a transaction a user has to sign and return it for their wallet. */
  async prepare(
    scope: OperationScope,
    xdr: string,
    signerId: string,
    amount?: Prisma.Decimal.Value,
  ): Promise<PreparedTransaction> {
    const operation = await this.prisma.chainOperation.create({
      data: { ...scope, txHash: this.stellar.hashOf(xdr), signerId, amount },
    });
    return {
      operationId: operation.id,
      xdr,
      networkPassphrase: this.stellar.networkPassphrase,
    };
  }

  /**
   * Broadcast a transaction a user signed. It is accepted only if Pocket
   * prepared exactly this transaction for this user and this purpose, and only
   * once: the row is claimed before anything is sent.
   */
  async submitSigned(
    scope: OperationScope,
    signedXdr: string,
    signerId: string,
  ): Promise<ChainOperation> {
    let txHash: string;
    try {
      txHash = this.stellar.hashOf(signedXdr);
    } catch {
      throw new BadRequestException('signedXdr is not a valid transaction');
    }

    const claimed = await this.prisma.chainOperation.updateMany({
      where: {
        txHash,
        signerId,
        status: 'prepared',
        kind: scope.kind,
        contractId: scope.contractId ?? null,
        milestoneId: scope.milestoneId ?? null,
      },
      data: { status: 'confirmed', confirmedAt: new Date() },
    });
    if (claimed.count !== 1) {
      throw new BadRequestException(
        'This transaction was not prepared for you, or it was already submitted',
      );
    }

    try {
      if (scope.kind === 'trustline') {
        await this.stellar.submitToHorizon(signedXdr);
      } else {
        await this.trustlessWork.send(signedXdr);
      }
    } catch (error) {
      await this.markFailed(txHash, error);
      throw error;
    }
    return this.prisma.chainOperation.findUniqueOrThrow({ where: { txHash } });
  }

  /**
   * Sign a transaction with the platform key, broadcast it and record it.
   * Used for the roles Pocket holds: deploy, release and dispute resolution.
   */
  async executeAsPlatform(
    scope: OperationScope,
    unsignedXdr: string,
    amount?: Prisma.Decimal.Value,
  ): Promise<{ operation: ChainOperation; contractId?: string }> {
    const signed = this.stellar.signAsPlatform(unsignedXdr);
    const operation = await this.prisma.chainOperation.create({
      data: { ...scope, txHash: this.stellar.hashOf(signed), amount },
    });

    try {
      const { contractId } = await this.trustlessWork.send(signed);
      const confirmed = await this.prisma.chainOperation.update({
        where: { id: operation.id },
        data: { status: 'confirmed', confirmedAt: new Date() },
      });
      return { operation: confirmed, contractId };
    } catch (error) {
      await this.markFailed(operation.txHash, error);
      throw error;
    }
  }

  private async markFailed(txHash: string, error: unknown): Promise<void> {
    await this.prisma.chainOperation.update({
      where: { txHash },
      data: {
        status: 'failed',
        confirmedAt: null,
        error: error instanceof Error ? error.message : String(error),
      },
    });
  }
}
