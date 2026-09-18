/**
 * Seeds Pocket's internal team. Managers cannot sign up through the app: list
 * their Stellar addresses in MANAGER_STELLAR_ADDRESSES (comma-separated) and
 * run `bun run db:seed`. Safe to run repeatedly.
 */
import { PrismaClient } from '@prisma/client';
import { StrKey } from '@stellar/stellar-sdk';

const prisma = new PrismaClient();

async function main() {
  const addresses = (process.env.MANAGER_STELLAR_ADDRESSES ?? '')
    .split(',')
    .map((address) => address.trim())
    .filter(Boolean);

  if (addresses.length === 0) {
    console.log('MANAGER_STELLAR_ADDRESSES is empty, no managers seeded.');
    return;
  }

  for (const stellarAddress of addresses) {
    if (!StrKey.isValidEd25519PublicKey(stellarAddress)) {
      throw new Error(`Invalid Stellar address in MANAGER_STELLAR_ADDRESSES: ${stellarAddress}`);
    }
    await prisma.user.upsert({
      where: { stellarAddress },
      create: { stellarAddress, role: 'manager', verificationStatus: 'approved' },
      update: { role: 'manager', verificationStatus: 'approved' },
    });
    console.log(`Manager ready: ${stellarAddress}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
