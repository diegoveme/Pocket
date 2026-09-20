import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewVerificationDto {
  @ApiPropertyOptional({ description: 'Shown to the user. Required when rejecting.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
