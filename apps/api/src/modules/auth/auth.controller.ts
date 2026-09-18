import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { ChallengeDto } from './dto/challenge.dto';
import { LoginDto } from './dto/login.dto';
import { WalletChallengeService } from './wallet-challenge.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly challenges: WalletChallengeService,
  ) {}

  /** Step 1: get an unsigned transaction for the wallet to sign. */
  @Post('challenge')
  @HttpCode(200)
  challenge(@Body() dto: ChallengeDto) {
    return this.challenges.issue(dto.stellarAddress);
  }

  /** Step 2: send the signed transaction back and receive an access token. */
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }
}
