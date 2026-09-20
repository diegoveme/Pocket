import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type User, type VerificationRequest } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SubmitVerificationDto } from './dto/submit-verification.dto';

@Injectable()
export class VerificationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Submit the account for review. Allowed when the user has never submitted
   * or was rejected, so a rejected user can fix their details and try again.
   * Approved users and users already waiting cannot submit again.
   */
  async submit(userId: string, dto: SubmitVerificationDto): Promise<VerificationRequest> {
    const user = await this.getUser(userId);

    if (user.role === 'manager') {
      throw new BadRequestException('Managers do not go through verification');
    }
    if (user.verificationStatus === 'pending') {
      throw new BadRequestException('Your verification is already under review');
    }
    if (user.verificationStatus === 'approved') {
      throw new BadRequestException('Your account is already verified');
    }
    if (user.role === 'startup' && !dto.companyName) {
      throw new BadRequestException('companyName is required for startups');
    }

    const [request] = await this.prisma.$transaction([
      this.prisma.verificationRequest.create({
        data: {
          ...dto,
          userId,
          status: 'pending',
        } satisfies Prisma.VerificationRequestUncheckedCreateInput,
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { verificationStatus: 'pending' },
      }),
    ]);

    return request;
  }

  /** The user's latest request, or null when they never submitted one. */
  latestFor(userId: string): Promise<VerificationRequest | null> {
    return this.prisma.verificationRequest.findFirst({
      where: { userId },
      orderBy: { submittedAt: 'desc' },
    });
  }

  private async getUser(userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
