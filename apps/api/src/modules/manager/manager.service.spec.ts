import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../../prisma/prisma.service';
import { ManagerService } from './manager.service';

describe('ManagerService', () => {
  let prisma: {
    verificationRequest: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    user: { update: jest.Mock };
    $transaction: jest.Mock;
  };
  let service: ManagerService;

  beforeEach(() => {
    prisma = {
      verificationRequest: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      user: { update: jest.fn() },
      $transaction: jest.fn(async (ops: unknown[]) => ops),
    };
    service = new ManagerService(prisma as unknown as PrismaService);
  });

  it('lists pending requests oldest first by default', async () => {
    await service.list();
    expect(prisma.verificationRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'pending' },
        orderBy: { submittedAt: 'asc' },
      }),
    );
  });

  it('approves a pending request and verifies the user', async () => {
    prisma.verificationRequest.findUnique.mockResolvedValue({
      id: 'req-1',
      userId: 'user-1',
      status: 'pending',
    });
    prisma.verificationRequest.update.mockReturnValue({
      id: 'req-1',
      status: 'approved',
    });

    await service.approve('req-1', 'manager-1', 'Looks good');

    expect(prisma.verificationRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'req-1' },
        data: expect.objectContaining({
          status: 'approved',
          reviewNote: 'Looks good',
          reviewedById: 'manager-1',
        }),
      }),
    );
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { verificationStatus: 'approved' },
    });
  });

  it('refuses to reject without a reason', async () => {
    await expect(service.reject('req-1', 'manager-1', '  ')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.verificationRequest.findUnique).not.toHaveBeenCalled();
  });

  it('rejects with a reason and marks the user rejected', async () => {
    prisma.verificationRequest.findUnique.mockResolvedValue({
      id: 'req-1',
      userId: 'user-1',
      status: 'pending',
    });
    prisma.verificationRequest.update.mockReturnValue({
      id: 'req-1',
      status: 'rejected',
    });

    await service.reject('req-1', 'manager-1', 'Company site is offline');

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { verificationStatus: 'rejected' },
    });
  });

  it('fails when the request does not exist', async () => {
    prisma.verificationRequest.findUnique.mockResolvedValue(null);
    await expect(service.approve('missing', 'manager-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('does not review the same request twice', async () => {
    prisma.verificationRequest.findUnique.mockResolvedValue({
      id: 'req-1',
      userId: 'user-1',
      status: 'approved',
    });
    await expect(service.approve('req-1', 'manager-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
