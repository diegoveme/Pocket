import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsString, Length, Max, Min } from 'class-validator';

/** A specialist's offer on a job. The price may differ from the posted budget. */
export class ApplyDto {
  @ApiProperty({ description: 'Why they are the right person and how they would do it' })
  @IsString()
  @Length(50, 5000)
  proposal: string;

  @ApiProperty({ description: 'Price in USDC', example: 450 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 7 })
  @Min(1)
  @Max(1_000_000)
  price: number;

  @ApiProperty({ description: 'How many days the work would take', example: 14 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  estimatedDays: number;
}
