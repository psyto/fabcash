import * as SecureStore from 'expo-secure-store';
import {
  generateKeyPairSigner,
  createKeyPairSignerFromBytes,
  KeyPairSigner,
  Address,
} from '@solana/kit';

const EPHEMERAL_KEYS_PREFIX = 'fabcash_ephemeral_';

export interface EphemeralKey {
  id: string;
  publicKey: Address;
  signer: KeyPairSigner;
  createdAt: number;
  expiresAt: number;
  used: boolean;
}

// In-memory cache of active ephemeral keys
const ephemeralKeysCache = new Map<string, EphemeralKey>();

/**
 * Generate a new ephemeral keypair for receiving payments
 */
export async function generateEphemeralKey(
  expirationMinutes = 15
): Promise<EphemeralKey> {
  const signer = await generateKeyPairSigner();
  const id = generateKeyId();
  const now = Date.now();

  // Export keypair bytes
  const privateKeyBytes = new Uint8Array(
    await crypto.subtle.exportKey('raw', signer.keyPair.privateKey)
  );
  const publicKeyBytes = new Uint8Array(
    await crypto.subtle.exportKey('raw', signer.keyPair.publicKey)
  );

  const keypairBytes = new Uint8Array(64);
  keypairBytes.set(privateKeyBytes.slice(0, 32), 0);
  keypairBytes.set(publicKeyBytes, 32);

  const ephemeralKey: EphemeralKey = {
    id,
    publicKey: signer.address,
    signer,
    createdAt: now,
    expiresAt: now + expirationMinutes * 60 * 1000,
    used: false,
  };

  // Store in secure storage
  const storageData = {
    id,
    publicKey: signer.address.toString(),
    keypairBytes: Buffer.from(keypairBytes).toString('base64'),
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
    const keypairBytes = new Uint8Array(Buffer.from(data.keypairBytes, 'base64'));
    const signer = await createKeyPairSignerFromBytes(keypairBytes);

    const ephemeralKey: EphemeralKey = {
      id: data.id,
      publicKey: signer.address,
      signer,
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
