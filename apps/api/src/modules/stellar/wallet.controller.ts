import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth';
import { SignedTransactionDto } from './dto/signed-transaction.dto';
import { WalletService } from './wallet.service';

@ApiTags('wallet')
@ApiBearerAuth()
@Controller('wallet')
export class WalletController {
  constructor(private readonly wallet: WalletService) {}

  /** Whether the signed-in wallet can send and receive USDC. */
  @Get('usdc')
  usdc(@CurrentUser() user: AuthUser) {
    return this.wallet.usdcStatus(user);
  }

  /** Trustline transaction for the wallet to sign. */
  @Post('usdc-trustline/prepare')
  prepareTrustline(@CurrentUser() user: AuthUser) {
    return this.wallet.prepareTrustline(user);
  }

  @Post('usdc-trustline/submit')
  submitTrustline(@CurrentUser() user: AuthUser, @Body() dto: SignedTransactionDto) {
    return this.wallet.submitTrustline(user, dto.signedXdr);
  }
}
