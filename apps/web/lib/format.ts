import type { ServiceCategory, StartupStage } from '@pocket/shared';

/** USDC amounts come from the API as strings to keep their decimals. */
export function usdc(amount: string | number | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') return '-';
  const value = Number(amount);
  return `${value.toLocaleString('en-US', { maximumFractionDigits: 7 })} USDC`;
}

export function shortAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

/** Calendar dates come as ISO strings at midnight UTC; show them as that day. */
export function date(value: string | null | undefined): string {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function dateTime(value: string | null | undefined): string {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/** Today in UTC as YYYY-MM-DD, the minimum for date inputs. */
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  growth: 'Growth',
  sales: 'Sales',
  marketing: 'Marketing',
  digital_marketing: 'Digital Marketing',
};

export const STAGE_LABELS: Record<StartupStage, string> = {
  idea: 'Idea',
  pre_seed: 'Pre-seed',
  seed: 'Seed',
  series_a: 'Series A',
  series_b_plus: 'Series B+',
};

/** Link to a transaction on the Stellar explorer of the configured network. */
export function explorerTx(hash: string): string {
  const network =
    process.env.NEXT_PUBLIC_STELLAR_NETWORK === 'mainnet' ? 'public' : 'testnet';
  return `https://stellar.expert/explorer/${network}/tx/${hash}`;
}

export function explorerContract(contractId: string): string {
  const network =
    process.env.NEXT_PUBLIC_STELLAR_NETWORK === 'mainnet' ? 'public' : 'testnet';
  return `https://stellar.expert/explorer/${network}/contract/${contractId}`;
}
