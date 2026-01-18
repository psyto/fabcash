import * as SecureStore from 'expo-secure-store';
import { Keypair, PublicKey } from '@solana/web3.js';

const WALLET_KEY = 'fabcash_wallet_keypair';

export interface WalletState {
  publicKey: PublicKey;
  keypair: Keypair;
}

let cachedWallet: WalletState | null = null;

/**
 * Generate a new Ed25519 keypair for the wallet
 * Uses @solana/web3.js Keypair which is React Native compatible
 */
export async function generateWallet(): Promise<WalletState> {
  // Generate Ed25519 keypair
  const keypair = Keypair.generate();

  // Store the secret key (64 bytes) securely
  await SecureStore.setItemAsync(WALLET_KEY, bytesToBase64(keypair.secretKey));

  cachedWallet = {
    publicKey: keypair.publicKey,
    keypair,
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
    const secretKey = base64ToBytes(stored);
    const keypair = Keypair.fromSecretKey(secretKey);

    cachedWallet = {
      publicKey: keypair.publicKey,
      keypair,
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
  return base64ToBytes(stored);
}

/**
 * Import wallet from private key bytes
 */
export async function importWallet(secretKey: Uint8Array): Promise<WalletState> {
  const keypair = Keypair.fromSecretKey(secretKey);

  await SecureStore.setItemAsync(WALLET_KEY, bytesToBase64(secretKey));

  cachedWallet = {
    publicKey: keypair.publicKey,
    keypair,
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
export function shortenAddress(addr: PublicKey | string, chars = 4): string {
  const str = typeof addr === 'string' ? addr : addr.toBase58();
  return `${str.slice(0, chars)}...${str.slice(-chars)}`;
}

// Helper functions for base64 encoding (React Native compatible)
function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
