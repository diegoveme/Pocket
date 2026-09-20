import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceCategory } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Min,
} from 'class-validator';

/** The fixed template every specialist fills in. Rates are in USDC. */
export class SpecialistProfileDto {
  @ApiProperty()
  @IsString()
  @Length(2, 120)
  displayName: string;

  @ApiProperty({ example: 'B2B SaaS outbound specialist' })
  @IsString()
  @Length(10, 160)
  headline: string;

  @ApiProperty()
  @IsString()
  @Length(50, 2000)
  bio: string;

  @ApiProperty({ enum: ServiceCategory, isArray: true })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(4)
  @IsEnum(ServiceCategory, { each: true })
  categories: ServiceCategory[];

  @ApiPropertyOptional({ type: [String], example: ['cold email', 'HubSpot'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Links to past work' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsUrl({}, { each: true })
  caseStudies?: string[];

  @ApiPropertyOptional({ description: 'Hourly rate in USDC' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  hourlyRate?: number;

  @ApiPropertyOptional({ description: 'Smallest project they take, in USDC' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minProjectBudget?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  portfolioUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  linkedinUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 120)
  location?: string;
}
