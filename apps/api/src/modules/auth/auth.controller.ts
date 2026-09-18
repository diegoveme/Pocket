import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ChallengeDto } from './dto/challenge.dto';
import { WalletChallengeService } from './wallet-challenge.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly challenges: WalletChallengeService) {}

  /** Step 1: get an unsigned transaction for the wallet to sign. */
  @Post('challenge')
  @HttpCode(200)
  challenge(@Body() dto: ChallengeDto) {
    return this.challenges.issue(dto.stellarAddress);
  }
}
