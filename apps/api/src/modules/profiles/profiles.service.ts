import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { SpecialistProfile, StartupProfile } from '@prisma/client';
import type { AuthUser } from '../../common/types/auth';
import { PrismaService } from '../../prisma/prisma.service';
import { SpecialistProfileDto } from './dto/specialist-profile.dto';
import { StartupProfileDto } from './dto/startup-profile.dto';

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Create or replace the startup profile of the signed-in user. */
  saveStartup(user: AuthUser, dto: StartupProfileDto): Promise<StartupProfile> {
    if (user.role !== 'startup') {
      throw new ForbiddenException('Only startups have a startup profile');
    }
    return this.prisma.startupProfile.upsert({
      where: { userId: user.sub },
      create: { ...dto, userId: user.sub },
      update: dto,
    });
  }

  /** Create or replace the specialist profile of the signed-in user. */
  saveSpecialist(user: AuthUser, dto: SpecialistProfileDto): Promise<SpecialistProfile> {
    if (user.role !== 'specialist') {
      throw new ForbiddenException('Only specialists have a specialist profile');
    }
    return this.prisma.specialistProfile.upsert({
      where: { userId: user.sub },
      create: { ...dto, userId: user.sub },
      update: dto,
    });
  }

  /** The profile of the signed-in user, or null when it is not filled in yet. */
  async mine(user: AuthUser): Promise<StartupProfile | SpecialistProfile | null> {
    if (user.role === 'startup') {
      return this.prisma.startupProfile.findUnique({ where: { userId: user.sub } });
    }
    if (user.role === 'specialist') {
      return this.prisma.specialistProfile.findUnique({ where: { userId: user.sub } });
    }
    return null;
  }

  /** Public profile of an approved user. Unverified accounts stay hidden. */
  async publicProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { startupProfile: true, specialistProfile: true },
    });
    if (!user || user.verificationStatus !== 'approved') {
      throw new NotFoundException('Profile not found');
    }

    const profile = user.startupProfile ?? user.specialistProfile;
    if (!profile) throw new NotFoundException('Profile not found');

    return {
      userId: user.id,
      role: user.role,
      stellarAddress: user.stellarAddress,
      memberSince: user.createdAt,
      profile,
    };
  }
}
