import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class ChallengeDto {
  @ApiProperty({ description: 'Stellar public key (G...) of the wallet signing in' })
  @IsString()
  @Length(56, 56)
  stellarAddress: string;
}
