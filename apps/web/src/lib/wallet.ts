import {
  getAddress,
  isConnected,
  signTransaction,
} from "@stellar/freighter-api";

const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";

export class WalletError extends Error {}

export async function connectWallet(): Promise<string> {
  const connected = await isConnected();
  if (connected.error || !connected.isConnected) {
    throw new WalletError("No Stellar wallet found. Install the Freighter browser extension to continue.");
  }

  const result = await getAddress();
  if (result.error || !result.address) {
    throw new WalletError(result.error?.message ?? "Could not read your wallet address.");
  }

  return result.address;
}

export async function signWithWallet(unsignedXdr: string, address: string): Promise<string> {
  const result = await signTransaction(unsignedXdr, { networkPassphrase: NETWORK_PASSPHRASE, address });
  if (result.error || !result.signedTxXdr) {
    throw new WalletError(result.error?.message ?? "Wallet signing was cancelled or failed.");
  }
  return result.signedTxXdr;
}
