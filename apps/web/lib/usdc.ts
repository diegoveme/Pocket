/**
 * USDC amounts as integers of 10^-7, the precision Stellar uses. Adding up
 * milestones with plain numbers drifts (0.1 + 0.2), and the API refuses totals
 * that do not match to the last decimal.
 */
const UNITS_PER_USDC = BigInt(10_000_000);

/** Reads what the user typed. Anything that is not an amount counts as zero. */
export function toUnits(amount: string): bigint {
  const [whole = '0', fraction = ''] = amount.trim().split('.');
  if (!/^\d*$/.test(whole) || !/^\d*$/.test(fraction)) return BigInt(0);
  return (
    BigInt(whole || '0') * UNITS_PER_USDC + BigInt((fraction + '0000000').slice(0, 7))
  );
}

export function fromUnits(units: bigint): string {
  const sign = units < BigInt(0) ? '-' : '';
  const absolute = units < BigInt(0) ? -units : units;
  const whole = absolute / UNITS_PER_USDC;
  const fraction = (absolute % UNITS_PER_USDC)
    .toString()
    .padStart(7, '0')
    .replace(/0+$/, '');
  return `${sign}${whole}${fraction ? `.${fraction}` : ''}`;
}
