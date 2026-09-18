import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { WalletChallengeService } from './wallet-challenge.service';

@Module({
  controllers: [AuthController],
  providers: [WalletChallengeService],
})
export class AuthModule {}
