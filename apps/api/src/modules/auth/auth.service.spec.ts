import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { User } from '@prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from './auth.service';
import type { WalletChallengeService } from './wallet-challenge.service';

const ADDRESS = 'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H';

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: '4f1c2a4e-1111-4b3b-9c1d-000000000001',
    stellarAddress: ADDRESS,
    role: 'startup',
    verificationStatus: 'not_submitted',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('AuthService', () => {
  const jwt = new JwtService({ secret: 'test-secret' });
  let challenges: { verify: jest.Mock; consume: jest.Mock };
  let prisma: { user: { findUnique: jest.Mock; create: jest.Mock } };
  let service: AuthService;

  beforeEach(() => {
    challenges = { verify: jest.fn().mockResolvedValue(true), consume: jest.fn() };
    prisma = { user: { findUnique: jest.fn(), create: jest.fn() } };
    service = new AuthService(
      prisma as unknown as PrismaService,
      jwt,
      challenges as unknown as WalletChallengeService,
    );
  });

  it('rejects an invalid signature', async () => {
    challenges.verify.mockResolvedValue(false);
    await expect(
      service.login({ stellarAddress: ADDRESS, signedXdr: 'x' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(challenges.consume).not.toHaveBeenCalled();
  });

  it('asks for a role on first login and keeps the challenge', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(
      service.login({ stellarAddress: ADDRESS, signedXdr: 'x' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(challenges.consume).not.toHaveBeenCalled();
  });

  it('creates the account when a role is given', async () => {
    const user = makeUser({ role: 'specialist' });
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue(user);

    const result = await service.login({
      stellarAddress: ADDRESS,
      signedXdr: 'x',
      role: 'specialist',
    });

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: { stellarAddress: ADDRESS, role: 'specialist' },
    });
    expect(result.isNewUser).toBe(true);
    expect(challenges.consume).toHaveBeenCalledWith(ADDRESS);
  });

  it('signs in an existing user and ignores the role field', async () => {
    const user = makeUser();
    prisma.user.findUnique.mockResolvedValue(user);

    const result = await service.login({
      stellarAddress: ADDRESS,
      signedXdr: 'x',
      role: 'specialist',
    });

    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(result.isNewUser).toBe(false);
    const claims = await jwt.verifyAsync(result.accessToken);
    expect(claims).toMatchObject({
      sub: user.id,
      role: 'startup',
      stellarAddress: ADDRESS,
    });
  });
});
