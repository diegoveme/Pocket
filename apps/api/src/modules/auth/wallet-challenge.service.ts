import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Account,
  type FeeBumpTransaction,
  Keypair,
  Networks,
  Operation,
  type Transaction,
  TransactionBuilder,
} from '@stellar/stellar-sdk';
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
      config.get<string>('stellar.network') === 'mainnet'
        ? Networks.PUBLIC
        : Networks.TESTNET;
  }

  async issue(
    stellarAddress: string,
  ): Promise<{ xdr: string; networkPassphrase: string }> {
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

  /**
   * True only when `signedXdr` is the challenge we issued to this address
   * (same nonce, not expired) and carries a valid signature from its key.
   * Does not consume the challenge: call `consume` after a successful login.
   */
  async verify(stellarAddress: string, signedXdr: string): Promise<boolean> {
    const challenge = await this.prisma.authChallenge.findUnique({
      where: { stellarAddress },
    });
    if (!challenge || challenge.expiresAt.getTime() < Date.now()) return false;

    let tx: Transaction | FeeBumpTransaction;
    try {
      tx = TransactionBuilder.fromXDR(signedXdr, this.networkPassphrase);
    } catch {
      return false;
    }

    if ('innerTransaction' in tx) return false;
    if (tx.source !== stellarAddress || tx.operations.length !== 1) return false;
    const [op] = tx.operations;
    if (op.type !== 'manageData' || op.name !== CHALLENGE_DATA_NAME) return false;
    if (!op.value || Buffer.from(op.value).toString('utf8') !== challenge.nonce)
      return false;

    const keypair = Keypair.fromPublicKey(stellarAddress);
    const hash = tx.hash();
    return tx.signatures.some((sig) => {
      try {
        return keypair.verify(hash, sig.signature);
      } catch {
        return false;
      }
    });
  }

  /** Invalidate the challenge so a captured signature cannot be replayed. */
  async consume(stellarAddress: string): Promise<void> {
    await this.prisma.authChallenge.deleteMany({ where: { stellarAddress } });
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
