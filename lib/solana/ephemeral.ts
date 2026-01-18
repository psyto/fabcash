import * as SecureStore from 'expo-secure-store';
import { Keypair, PublicKey } from '@solana/web3.js';

const EPHEMERAL_KEYS_PREFIX = 'fabcash_ephemeral_';

export interface EphemeralKey {
  id: string;
  publicKey: PublicKey;
  keypair: Keypair;
  createdAt: number;
  expiresAt: number;
  used: boolean;
}

// In-memory cache of active ephemeral keys
const ephemeralKeysCache = new Map<string, EphemeralKey>();

/**
 * Generate a new ephemeral keypair for receiving payments
 * Uses @solana/web3.js Keypair which is React Native compatible
 */
export async function generateEphemeralKey(
  expirationMinutes = 15
): Promise<EphemeralKey> {
  const keypair = Keypair.generate();
  const id = generateKeyId();
  const now = Date.now();

  const ephemeralKey: EphemeralKey = {
    id,
    publicKey: keypair.publicKey,
    keypair,
    createdAt: now,
    expiresAt: now + expirationMinutes * 60 * 1000,
    used: false,
  };

  // Store in secure storage
  const storageData = {
    id,
    publicKey: keypair.publicKey.toBase58(),
    secretKey: bytesToBase64(keypair.secretKey),
    createdAt: now,
    expiresAt: ephemeralKey.expiresAt,
    used: false,
  };

  await SecureStore.setItemAsync(
    `${EPHEMERAL_KEYS_PREFIX}${id}`,
    JSON.stringify(storageData)
  );

  // Cache in memory
  ephemeralKeysCache.set(id, ephemeralKey);

  return ephemeralKey;
}

/**
 * Get an ephemeral key by ID
 */
export async function getEphemeralKey(id: string): Promise<EphemeralKey | null> {
  // Check cache first
  if (ephemeralKeysCache.has(id)) {
    return ephemeralKeysCache.get(id)!;
  }

  // Load from storage
  const stored = await SecureStore.getItemAsync(`${EPHEMERAL_KEYS_PREFIX}${id}`);
  if (!stored) {
    return null;
  }

  try {
    const data = JSON.parse(stored);
    const secretKey = base64ToBytes(data.secretKey);
    const keypair = Keypair.fromSecretKey(secretKey);

    const ephemeralKey: EphemeralKey = {
      id: data.id,
      publicKey: keypair.publicKey,
      keypair,
      createdAt: data.createdAt,
      expiresAt: data.expiresAt,
      used: data.used,
    };

    ephemeralKeysCache.set(id, ephemeralKey);
    return ephemeralKey;
  } catch (error) {
    console.error('Failed to load ephemeral key:', error);
    return null;
  }
}

/**
 * Mark an ephemeral key as used
 */
export async function markEphemeralKeyUsed(id: string): Promise<void> {
  const key = await getEphemeralKey(id);
  if (!key) return;

  key.used = true;

  // Update in storage
  const stored = await SecureStore.getItemAsync(`${EPHEMERAL_KEYS_PREFIX}${id}`);
  if (stored) {
    const data = JSON.parse(stored);
    data.used = true;
    await SecureStore.setItemAsync(
      `${EPHEMERAL_KEYS_PREFIX}${id}`,
      JSON.stringify(data)
    );
  }
}

/**
 * Delete an ephemeral key
 */
export async function deleteEphemeralKey(id: string): Promise<void> {
  await SecureStore.deleteItemAsync(`${EPHEMERAL_KEYS_PREFIX}${id}`);
  ephemeralKeysCache.delete(id);
}

/**
 * Get all unexpired ephemeral keys that have received funds (for sweeping)
 */
export async function getKeysToSweep(): Promise<EphemeralKey[]> {
  const keysToSweep: EphemeralKey[] = [];
  const now = Date.now();

  for (const [_, key] of ephemeralKeysCache) {
    // Include keys that are used but not yet swept
    if (key.used && !isExpired(key, now)) {
      keysToSweep.push(key);
    }
  }

  return keysToSweep;
}

/**
 * Clean up expired ephemeral keys
 */
export async function cleanupExpiredKeys(): Promise<number> {
  const now = Date.now();
  let cleaned = 0;

  for (const [id, key] of ephemeralKeysCache) {
    if (isExpired(key, now) && !key.used) {
      await deleteEphemeralKey(id);
      cleaned++;
    }
  }

  return cleaned;
}

/**
 * Check if a key is expired
 */
function isExpired(key: EphemeralKey, now: number): boolean {
  return now > key.expiresAt;
}

/**
 * Generate a unique key ID
 */
function generateKeyId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `${timestamp}_${random}`;
}

/**
 * Get the current active ephemeral key count
 */
export function getActiveKeyCount(): number {
  return ephemeralKeysCache.size;
}

// Helper functions for base64 encoding
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
