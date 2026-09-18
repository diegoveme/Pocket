export type StellarNetwork = 'testnet' | 'mainnet';

export interface AppConfig {
  port: number;
  corsOrigins: string[];
  database: { url: string };
  jwt: { secret: string; expiresIn: string };
  stellar: { network: StellarNetwork };
}

const REQUIRED = ['DATABASE_URL', 'JWT_SECRET'] as const;

/** Fail fast at boot when a required variable is missing. */
export function validateEnv(env: Record<string, unknown>): Record<string, unknown> {
  const missing = REQUIRED.filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  const network = env.STELLAR_NETWORK ?? 'testnet';
  if (network !== 'testnet' && network !== 'mainnet') {
    throw new Error('STELLAR_NETWORK must be "testnet" or "mainnet"');
  }
  return env;
}

export default (): AppConfig => ({
  port: Number(process.env.PORT ?? 3000),
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3001')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  database: { url: process.env.DATABASE_URL as string },
  jwt: {
    secret: process.env.JWT_SECRET as string,
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
  stellar: {
    network: (process.env.STELLAR_NETWORK as StellarNetwork | undefined) ?? 'testnet',
  },
});
