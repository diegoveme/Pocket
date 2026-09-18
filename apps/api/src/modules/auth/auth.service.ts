import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { JwtPayload } from '../../common/types/auth';
import { LoginDto } from './dto/login.dto';
import { WalletChallengeService } from './wallet-challenge.service';

export interface LoginResult {
  accessToken: string;
  user: User;
  isNewUser: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly challenges: WalletChallengeService,
  ) {}

  /**
   * Sign in with a signed wallet challenge. The first login creates the
   * account, so it must say whether the user is a startup or a specialist.
   */
  async login(dto: LoginDto): Promise<LoginResult> {
    const valid = await this.challenges.verify(dto.stellarAddress, dto.signedXdr);
    if (!valid) {
      throw new UnauthorizedException('Invalid or expired wallet signature');
    }

    let user = await this.prisma.user.findUnique({
      where: { stellarAddress: dto.stellarAddress },
    });
    const isNewUser = !user;

    if (!user) {
      if (!dto.role) {
        // The challenge is kept, so the client can resend it with a role
        // without asking the wallet to sign again.
        throw new BadRequestException({
          code: 'ROLE_REQUIRED',
          message: 'Choose startup or specialist to create your account',
        });
      }
      user = await this.prisma.user.create({
        data: { stellarAddress: dto.stellarAddress, role: dto.role },
      });
    }

    await this.challenges.consume(dto.stellarAddress);
    return { accessToken: await this.sign(user), user, isNewUser };
  }

  private sign(user: User): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
      stellarAddress: user.stellarAddress,
    };
    return this.jwt.signAsync(payload);
  }
}
