'use client';

import {
  getSelectedWallet,
  openAuthModal,
  signTransaction,
} from '@/components/tw-blocks/wallet-kit/wallet-kit';
import { api } from './api';

/** Open the wallet picker and return the chosen address and wallet name. */
export async function connectWallet(): Promise<{ address: string; walletName: string }> {
  const { address } = await openAuthModal();
  const { productName } = await getSelectedWallet();
  return { address, walletName: productName };
}

/** Sign a transaction XDR with the connected wallet. */
export function signXdr(
  xdr: string,
  address: string,
  networkPassphrase?: string,
): Promise<string> {
  return signTransaction({ unsignedTransaction: xdr, address, networkPassphrase });
}

/** A transaction the API prepared for the user's wallet. */
export interface PreparedTransaction {
  operationId: string;
  xdr: string;
  networkPassphrase: string;
}

/**
 * The non-custodial loop every money step follows: the API prepares the
 * transaction, the user's wallet signs it, and the API broadcasts it and
 * checks the result on chain.
 */
export async function prepareSignSubmit<T>(
  address: string,
  preparePath: string,
  submitPath: string,
  extra: Record<string, unknown> = {},
): Promise<T> {
  const prepared = await api<PreparedTransaction>(preparePath, { method: 'POST' });
  const signedXdr = await signXdr(prepared.xdr, address, prepared.networkPassphrase);
  return api<T>(submitPath, { method: 'POST', body: { signedXdr, ...extra } });
}

/** True when the user closed the wallet modal instead of failing. */
export function isWalletDismissed(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === -1
  );
}
