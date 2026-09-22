import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import type { PrismaService } from '../../prisma/prisma.service';
import { ChainOperationsService } from './chain-operations.service';
import type { StellarService } from './stellar.service';
import type { TrustlessWorkClient } from './trustless-work.client';

describe('ChainOperationsService', () => {
  let prisma: {
    chainOperation: {
      create: jest.Mock;
      updateMany: jest.Mock;
      update: jest.Mock;
      findUniqueOrThrow: jest.Mock;
    };
  };
  let stellar: {
    networkPassphrase: string;
    hashOf: jest.Mock;
    signAsPlatform: jest.Mock;
    submitToHorizon: jest.Mock;
  };
  let trustlessWork: { send: jest.Mock };
  let service: ChainOperationsService;

  beforeEach(() => {
    prisma = {
      chainOperation: {
        create: jest.fn(async ({ data }: { data: object }) => ({ id: 'op-1', ...data })),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn(async ({ data }: { data: object }) => ({ id: 'op-1', ...data })),
        findUniqueOrThrow: jest
          .fn()
          .mockResolvedValue({ id: 'op-1', status: 'confirmed' }),
      },
    };
    stellar = {
      networkPassphrase: 'Test SDF Network ; September 2015',
      hashOf: jest.fn().mockReturnValue('hash-1'),
      signAsPlatform: jest.fn().mockReturnValue('signed-by-platform'),
      submitToHorizon: jest.fn().mockResolvedValue('hash-1'),
    };
    trustlessWork = { send: jest.fn().mockResolvedValue({}) };
    service = new ChainOperationsService(
      prisma as unknown as PrismaService,
      stellar as unknown as StellarService,
      trustlessWork as unknown as TrustlessWorkClient,
    );
  });

  it('records a prepared transaction with its hash and signer', async () => {
    const prepared = await service.prepare(
      { kind: 'fund', contractId: 'contract-1' },
      'unsigned-xdr',
      'user-1',
      3,
    );

    expect(prisma.chainOperation.create).toHaveBeenCalledWith({
      data: {
        kind: 'fund',
        contractId: 'contract-1',
        txHash: 'hash-1',
        signerId: 'user-1',
        amount: 3,
      },
    });
    expect(prepared).toEqual({
      operationId: 'op-1',
      xdr: 'unsigned-xdr',
      networkPassphrase: stellar.networkPassphrase,
    });
  });

  it('only accepts a signed transaction prepared for this user, purpose and contract', async () => {
    await service.submitSigned(
      { kind: 'approve', contractId: 'contract-1', milestoneId: 'milestone-1' },
      'signed-xdr',
      'user-1',
    );

    expect(prisma.chainOperation.updateMany).toHaveBeenCalledWith({
      where: {
        txHash: 'hash-1',
        signerId: 'user-1',
        status: 'prepared',
        kind: 'approve',
        contractId: 'contract-1',
        milestoneId: 'milestone-1',
      },
      data: expect.objectContaining({ status: 'confirmed' }),
    });
    expect(trustlessWork.send).toHaveBeenCalledWith('signed-xdr');
  });

  it('refuses a transaction it did not prepare, or one already submitted', async () => {
    prisma.chainOperation.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      service.submitSigned(
        { kind: 'fund', contractId: 'contract-1' },
        'signed-xdr',
        'user-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(trustlessWork.send).not.toHaveBeenCalled();
  });

  it('refuses something that is not a transaction', async () => {
    stellar.hashOf.mockImplementation(() => {
      throw new Error('bad xdr');
    });
    await expect(
      service.submitSigned(
        { kind: 'fund', contractId: 'contract-1' },
        'garbage',
        'user-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.chainOperation.updateMany).not.toHaveBeenCalled();
  });

  it('sends trustlines straight to Horizon', async () => {
    await service.submitSigned({ kind: 'trustline' }, 'signed-xdr', 'user-1');
    expect(stellar.submitToHorizon).toHaveBeenCalledWith('signed-xdr');
    expect(trustlessWork.send).not.toHaveBeenCalled();
  });

  it('marks the operation failed when the network refuses it', async () => {
    trustlessWork.send.mockRejectedValue(new ServiceUnavailableException('boom'));
    await expect(
      service.submitSigned(
        { kind: 'fund', contractId: 'contract-1' },
        'signed-xdr',
        'user-1',
      ),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(prisma.chainOperation.update).toHaveBeenCalledWith({
      where: { txHash: 'hash-1' },
      data: expect.objectContaining({ status: 'failed', error: 'boom' }),
    });
  });

  it('signs platform operations and returns the deployed contract id', async () => {
    trustlessWork.send.mockResolvedValue({ contractId: 'CESCROW' });

    const result = await service.executeAsPlatform(
      { kind: 'deploy', contractId: 'contract-1' },
      'unsigned-xdr',
    );

    expect(stellar.signAsPlatform).toHaveBeenCalledWith('unsigned-xdr');
    expect(trustlessWork.send).toHaveBeenCalledWith('signed-by-platform');
    expect(result.contractId).toBe('CESCROW');
    expect(result.operation.status).toBe('confirmed');
  });
});
