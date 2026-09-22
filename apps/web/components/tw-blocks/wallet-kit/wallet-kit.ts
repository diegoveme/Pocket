import type { ModuleInterface } from '@creit-tech/stellar-wallets-kit/types';
type SdkModule = typeof import('@creit-tech/stellar-wallets-kit/sdk');
type TypesModule = typeof import('@creit-tech/stellar-wallets-kit/types');
type ModulesUtilsModule = typeof import('@creit-tech/stellar-wallets-kit/modules/utils');
type StellarWalletsKitStatic = SdkModule['StellarWalletsKit'];
type NetworksEnum = TypesModule['Networks'];

/**
 * Stellar Wallet Kit helpers
 *
 * We only load and initialize the kit
 * on the client, and only in response to effects or user actions.
 */
let walletKitPromise: Promise<{
  StellarWalletsKit: StellarWalletsKitStatic;
  Networks: NetworksEnum;
}> | null = null;

const loadWalletKit = async () => {
  if (typeof window === 'undefined') {
    throw new Error('StellarWalletsKit is only available in the browser');
  }

  if (!walletKitPromise) {
    walletKitPromise = (async () => {
      const [sdk, types, modules] = await Promise.all([
        import('@creit-tech/stellar-wallets-kit/sdk') as Promise<SdkModule>,
        import('@creit-tech/stellar-wallets-kit/types') as Promise<TypesModule>,
        import('@creit-tech/stellar-wallets-kit/modules/utils') as Promise<ModulesUtilsModule>,
      ]);

      const { StellarWalletsKit } = sdk;
      const { Networks } = types;
      const { defaultModules } = modules;

      StellarWalletsKit.init({
        network:
          process.env.NEXT_PUBLIC_STELLAR_NETWORK === 'mainnet'
            ? Networks.PUBLIC
            : Networks.TESTNET,
        modules: defaultModules(),
      });

      return { StellarWalletsKit, Networks };
    })();
  }

  return walletKitPromise;
};

interface SignTransactionParams {
  unsignedTransaction: string;
  address: string;
  /** Network the transaction was built for. Defaults to the configured one. */
  networkPassphrase?: string;
}

/**
 * Open the authentication modal and request the user's address.
 */
export const openAuthModal = async (): Promise<{ address: string }> => {
  const { StellarWalletsKit } = await loadWalletKit();
  return StellarWalletsKit.authModal();
};

/**
 * Get the currently selected wallet module.
 */
export const getSelectedWallet = async (): Promise<ModuleInterface> => {
  const { StellarWalletsKit } = await loadWalletKit();
  return StellarWalletsKit.selectedModule;
};

/**
 * The network the selected wallet is on. Not every wallet can tell
 * (Lobstr, Rabet and xBull cannot), so this rejects for those.
 */
export const getWalletNetwork = async (): Promise<{ networkPassphrase?: string }> => {
  const { StellarWalletsKit } = await loadWalletKit();
  return StellarWalletsKit.getNetwork();
};

/**
 * Disconnect the current wallet.
 */
export const disconnectWalletKit = async (): Promise<void> => {
  const { StellarWalletsKit } = await loadWalletKit();
  return StellarWalletsKit.disconnect();
};

/**
 * Helper to sign a transaction XDR with the active wallet.
 */
export const signTransaction = async ({
  unsignedTransaction,
  address,
  networkPassphrase,
}: SignTransactionParams): Promise<string> => {
  const { StellarWalletsKit, Networks } = await loadWalletKit();

  const { signedTxXdr } = await StellarWalletsKit.signTransaction(unsignedTransaction, {
    address,
    networkPassphrase:
      networkPassphrase ??
      (process.env.NEXT_PUBLIC_STELLAR_NETWORK === 'mainnet'
        ? Networks.PUBLIC
        : Networks.TESTNET),
  });

  return signedTxXdr;
};
