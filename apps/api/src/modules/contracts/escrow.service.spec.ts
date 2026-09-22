import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { ChainOperationsService } from '../stellar/chain-operations.service';
import type { StellarService } from '../stellar/stellar.service';
import type { TrustlessWorkClient } from '../stellar/trustless-work.client';
import { EscrowService } from './escrow.service';

describe('EscrowService', () => {
  let trustlessWork: { deployMultiRelease: jest.Mock };
  let operations: { executeAsPlatform: jest.Mock; markFailed: jest.Mock };
  let service: EscrowService;

  const input = {
    contract: { id: 'contract-1' },
    title: 'Fix our outbound funnel',
    description: 'Scope',
    milestones: [
      { position: 1, title: 'Report', amount: new Prisma.Decimal('49.5') },
      { position: 0, title: 'Lead list', amount: new Prisma.Decimal('450.5') },
    ],
    startupAddress: 'GSTARTUP',
    specialistAddress: 'GSPECIALIST',
  };

  beforeEach(() => {
    trustlessWork = { deployMultiRelease: jest.fn().mockResolvedValue('unsigned-xdr') };
    operations = {
      executeAsPlatform: jest.fn().mockResolvedValue({
        operation: { id: 'op-1', txHash: 'hash-1' },
        contractId: 'CESCROW',
      }),
      markFailed: jest.fn(),
    };
    service = new EscrowService(
      { platformAddress: 'GPOCKET', usdcIssuer: 'GUSDC' } as unknown as StellarService,
      trustlessWork as unknown as TrustlessWorkClient,
      operations as unknown as ChainOperationsService,
    );
  });

  describe('deploy', () => {
    it('gives the startup approval, pays the specialist and keeps the platform roles for Pocket', async () => {
      await expect(service.deploy(input)).resolves.toBe('CESCROW');
      expect(trustlessWork.deployMultiRelease).toHaveBeenCalledWith(
        expect.objectContaining({
          signer: 'GPOCKET',
          engagementId: 'contract-1',
          roles: {
            approver: 'GSTARTUP',
            serviceProvider: 'GSPECIALIST',
            platformAddress: 'GPOCKET',
            releaseSigner: 'GPOCKET',
            disputeResolver: 'GPOCKET',
          },
          platformFee: 0,
          milestones: [
            { description: 'Lead list', amount: 450.5, receiver: 'GSPECIALIST' },
            { description: 'Report', amount: 49.5, receiver: 'GSPECIALIST' },
          ],
          trustline: { address: 'GUSDC', symbol: 'USDC' },
        }),
      );
    });

    it('frees the deploy step when Trustless Work returns no contract id', async () => {
      operations.executeAsPlatform.mockResolvedValue({
        operation: { id: 'op-1', txHash: 'hash-1' },
      });
      await expect(service.deploy(input)).rejects.toBeInstanceOf(ConflictException);
      expect(operations.markFailed).toHaveBeenCalledWith('hash-1', expect.any(Error));
    });
  });
});
