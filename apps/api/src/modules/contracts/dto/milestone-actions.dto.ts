import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, Length } from 'class-validator';

/** A specialist's submission for a milestone: a link to the work and a note. */
export class DeliverDto {
  @ApiProperty({ description: 'Link to the document, folder, report or campaign' })
  @IsUrl()
  url: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 2000)
  note?: string;
}

export class RequestChangesDto {
  @ApiProperty({ description: 'What the specialist should change' })
  @IsString()
  @Length(5, 2000)
  feedback: string;
}
