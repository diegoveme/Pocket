import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNumber,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class MilestoneInputDto {
  @ApiProperty({ example: 'Lead list' })
  @IsString()
  @Length(3, 120)
  title: string;

  @ApiProperty({ description: 'What has to be delivered for this milestone' })
  @IsString()
  @Length(10, 2000)
  description: string;

  @ApiProperty({ description: 'Amount in USDC', example: 200 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 7 })
  @Min(1)
  @Max(1_000_000)
  amount: number;

  @ApiProperty({ example: '2026-10-15' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'dueDate must be a date as YYYY-MM-DD' })
  @IsDateString({ strict: true })
  dueDate: string;
}

/** The startup picks an applicant and splits the agreed price into milestones. */
export class CreateContractDto {
  @ApiProperty()
  @IsUUID()
  applicationId: string;

  @ApiProperty({ type: [MilestoneInputDto], minItems: 1, maxItems: 5 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => MilestoneInputDto)
  milestones: MilestoneInputDto[];
}
