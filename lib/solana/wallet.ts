import * as SecureStore from 'expo-secure-store';
import {
  generateKeyPairSigner,
  createKeyPairSignerFromBytes,
  KeyPairSigner,
  address,
  Address,
} from '@solana/kit';

const WALLET_KEY = 'fabcash_wallet_keypair';

export interface WalletState {
  publicKey: Address;
  signer: KeyPairSigner;
}

let cachedWallet: WalletState | null = null;

/**
 * Generate a new Ed25519 keypair for the wallet
 */
export async function generateWallet(): Promise<WalletState> {
  const signer = await generateKeyPairSigner();

  // Store the private key bytes securely
  const privateKeyBytes = new Uint8Array(await crypto.subtle.exportKey('raw', signer.keyPair.privateKey));
  const publicKeyBytes = new Uint8Array(await crypto.subtle.exportKey('raw', signer.keyPair.publicKey));

  // Combine into 64-byte keypair (32 private + 32 public)
  const keypairBytes = new Uint8Array(64);
  keypairBytes.set(privateKeyBytes.slice(0, 32), 0);
  keypairBytes.set(publicKeyBytes, 32);

  await SecureStore.setItemAsync(WALLET_KEY, Buffer.from(keypairBytes).toString('base64'));

  cachedWallet = {
    publicKey: signer.address,
    signer,
  };

  return cachedWallet;
}

/**
 * Load existing wallet from secure storage
 */
export async function loadWallet(): Promise<WalletState | null> {
  if (cachedWallet) {
    return cachedWallet;
  }

  const stored = await SecureStore.getItemAsync(WALLET_KEY);
  if (!stored) {
    return null;
  }

  try {
    const keypairBytes = new Uint8Array(Buffer.from(stored, 'base64'));
    const signer = await createKeyPairSignerFromBytes(keypairBytes);

    cachedWallet = {
      publicKey: signer.address,
      signer,
    };

    return cachedWallet;
  } catch (error) {
    console.error('Failed to load wallet:', error);
    return null;
  }
}

/**
 * Get or create wallet - main entry point for wallet access
 */
export async function getOrCreateWallet(): Promise<WalletState> {
  const existing = await loadWallet();
  if (existing) {
    return existing;
  }
  return generateWallet();
}

/**
 * Check if a wallet exists
 */
export async function hasWallet(): Promise<boolean> {
  const stored = await SecureStore.getItemAsync(WALLET_KEY);
  return stored !== null;
}

/**
 * Export wallet private key bytes for backup
 */
export async function exportWalletBytes(): Promise<Uint8Array | null> {
  const stored = await SecureStore.getItemAsync(WALLET_KEY);
  if (!stored) {
    return null;
  }
  return new Uint8Array(Buffer.from(stored, 'base64'));
}

/**
 * Import wallet from private key bytes
 */
export async function importWallet(keypairBytes: Uint8Array): Promise<WalletState> {
  const signer = await createKeyPairSignerFromBytes(keypairBytes);

  await SecureStore.setItemAsync(WALLET_KEY, Buffer.from(keypairBytes).toString('base64'));

  cachedWallet = {
    publicKey: signer.address,
    signer,
  };

  return cachedWallet;
}

/**
 * Delete wallet from secure storage (use with caution)
 */
export async function deleteWallet(): Promise<void> {
  await SecureStore.deleteItemAsync(WALLET_KEY);
  cachedWallet = null;
}

/**
 * Get shortened address for display
 */
export function shortenAddress(addr: Address, chars = 4): string {
  const str = addr.toString();
  return `${str.slice(0, chars)}...${str.slice(-chars)}`;
}
