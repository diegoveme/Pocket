import { ConfigService } from '@nestjs/config';
import { Keypair, TransactionBuilder } from '@stellar/stellar-sdk';
import type { PrismaService } from '../../prisma/prisma.service';
import { WalletChallengeService } from './wallet-challenge.service';

type Challenge = { stellarAddress: string; nonce: string; expiresAt: Date };

/** Minimal in-memory stand-in for the authChallenge table. */
function fakePrisma() {
  const rows = new Map<string, Challenge>();
  return {
    rows,
    authChallenge: {
      upsert: jest.fn(async ({ create }: { create: Challenge }) => {
        rows.set(create.stellarAddress, create);
        return create;
      }),
      findUnique: jest.fn(async ({ where }: { where: { stellarAddress: string } }) =>
        rows.get(where.stellarAddress) ?? null,
      ),
      deleteMany: jest.fn(async ({ where }: { where: { stellarAddress: string } }) => {
        rows.delete(where.stellarAddress);
        return { count: 1 };
      }),
    },
  };
}

describe('WalletChallengeService', () => {
  const config = new ConfigService({ stellar: { network: 'testnet' } });
  let prisma: ReturnType<typeof fakePrisma>;
  let service: WalletChallengeService;

  beforeEach(() => {
    prisma = fakePrisma();
    service = new WalletChallengeService(prisma as unknown as PrismaService, config);
  });

  async function signedChallenge(signer: Keypair, address = signer.publicKey()) {
    const { xdr, networkPassphrase } = await service.issue(address);
    const tx = TransactionBuilder.fromXDR(xdr, networkPassphrase);
    tx.sign(signer);
    return tx.toXDR();
  }

  it('rejects an invalid stellar address', async () => {
    await expect(service.issue('not-an-address')).rejects.toThrow('Invalid Stellar address');
  });

  it('issues a zero fee challenge for the address', async () => {
    const wallet = Keypair.random();
    const { xdr, networkPassphrase } = await service.issue(wallet.publicKey());
    const tx = TransactionBuilder.fromXDR(xdr, networkPassphrase);
    expect(tx.fee).toBe('0');
    expect(prisma.rows.has(wallet.publicKey())).toBe(true);
  });

  it('accepts a challenge signed by the address owner', async () => {
    const wallet = Keypair.random();
    const signed = await signedChallenge(wallet);
    await expect(service.verify(wallet.publicKey(), signed)).resolves.toBe(true);
  });

  it('rejects a challenge signed by another key', async () => {
    const wallet = Keypair.random();
    const signed = await signedChallenge(Keypair.random(), wallet.publicKey());
    await expect(service.verify(wallet.publicKey(), signed)).resolves.toBe(false);
  });

  it('rejects an expired challenge', async () => {
    const wallet = Keypair.random();
    const signed = await signedChallenge(wallet);
    prisma.rows.get(wallet.publicKey())!.expiresAt = new Date(Date.now() - 1000);
    await expect(service.verify(wallet.publicKey(), signed)).resolves.toBe(false);
  });

  it('rejects a reused challenge after it is consumed', async () => {
    const wallet = Keypair.random();
    const signed = await signedChallenge(wallet);
    await service.consume(wallet.publicKey());
    await expect(service.verify(wallet.publicKey(), signed)).resolves.toBe(false);
  });

  it('rejects an old signature once a new challenge replaces it', async () => {
    const wallet = Keypair.random();
    const oldSigned = await signedChallenge(wallet);
    await service.issue(wallet.publicKey());
    await expect(service.verify(wallet.publicKey(), oldSigned)).resolves.toBe(false);
  });

  it('rejects garbage xdr', async () => {
    const wallet = Keypair.random();
    await service.issue(wallet.publicKey());
    await expect(service.verify(wallet.publicKey(), 'AAAA')).resolves.toBe(false);
  });
});
