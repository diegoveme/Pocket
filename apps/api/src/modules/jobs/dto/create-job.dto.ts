import { ApiProperty } from '@nestjs/swagger';
import { ServiceCategory } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';

/** What a startup fills in to post a job. Budget is in USDC. */
export class CreateJobDto {
  @ApiProperty({ example: 'Outbound campaign for our B2B wallet' })
  @IsString()
  @Length(10, 120)
  title: string;

  @ApiProperty({ description: 'Scope of the work' })
  @IsString()
  @Length(50, 5000)
  description: string;

  @ApiProperty({ enum: ServiceCategory })
  @IsEnum(ServiceCategory)
  category: ServiceCategory;

  @ApiProperty({ description: 'What the startup expects to receive at the end' })
  @IsString()
  @Length(10, 2000)
  deliverables: string;

  @ApiProperty({ description: 'Budget in USDC', example: 500 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 7 })
  @Min(1)
  @Max(1_000_000)
  budget: number;

  @ApiProperty({
    description: 'Calendar date the work is needed by',
    example: '2026-10-31',
  })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'deadline must be a date as YYYY-MM-DD' })
  @IsDateString({ strict: true })
  deadline: string;
}
