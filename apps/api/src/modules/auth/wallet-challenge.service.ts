import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Account, Keypair, Networks, Operation, TransactionBuilder } from '@stellar/stellar-sdk';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

export const CHALLENGE_TTL_SECONDS = 5 * 60;
export const CHALLENGE_DATA_NAME = 'Pocket auth';

/**
 * SEP-10 style wallet login. The server hands out an unsigned transaction that
 * carries a one-time nonce; the user's own wallet (Stellar Wallets Kit) signs it
 * and the signature proves control of the address. The transaction is never
 * submitted to the network, so signing it costs nothing.
 */
@Injectable()
export class WalletChallengeService {
  readonly networkPassphrase: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.networkPassphrase =
      config.get<string>('stellar.network') === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET;
  }

  async issue(stellarAddress: string): Promise<{ xdr: string; networkPassphrase: string }> {
    if (!isValidPublicKey(stellarAddress)) {
      throw new BadRequestException('Invalid Stellar address');
    }

    const nonce = randomBytes(24).toString('hex');
    const tx = new TransactionBuilder(new Account(stellarAddress, '0'), {
      // Zero fee: the wallet shows "0 XLM" and the network would reject the
      // transaction if anyone ever tried to broadcast it.
      fee: '0',
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(Operation.manageData({ name: CHALLENGE_DATA_NAME, value: nonce }))
      .setTimeout(CHALLENGE_TTL_SECONDS)
      .build();

    const expiresAt = new Date(Date.now() + CHALLENGE_TTL_SECONDS * 1000);
    await this.prisma.authChallenge.upsert({
      where: { stellarAddress },
      create: { stellarAddress, nonce, expiresAt },
      update: { nonce, expiresAt },
    });

    return { xdr: tx.toXDR(), networkPassphrase: this.networkPassphrase };
  }
}

function isValidPublicKey(address: string): boolean {
  try {
    Keypair.fromPublicKey(address);
    return true;
  } catch {
    return false;
  }
}
