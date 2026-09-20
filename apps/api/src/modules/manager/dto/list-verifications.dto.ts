import { ApiPropertyOptional } from '@nestjs/swagger';
import { VerificationStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class ListVerificationsDto {
  @ApiPropertyOptional({ enum: VerificationStatus, default: VerificationStatus.pending })
  @IsOptional()
  @IsEnum(VerificationStatus)
  status?: VerificationStatus;
}
