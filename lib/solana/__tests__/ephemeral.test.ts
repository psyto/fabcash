import { Keypair, PublicKey } from '@solana/web3.js';
import {
  generateEphemeralKey,
  getEphemeralKey,
  markEphemeralKeyUsed,
  deleteEphemeralKey,
  getKeysToSweep,
  cleanupExpiredKeys,
  getActiveKeyCount,
  clearAllEphemeralKeys,
} from '../ephemeral';
import * as SecureStore from 'expo-secure-store';

describe('ephemeral', () => {
  // Clear all ephemeral keys before each test to reset state
  beforeEach(async () => {
    await clearAllEphemeralKeys();
  });
  describe('generateEphemeralKey', () => {
    it('should generate a valid ephemeral key', async () => {
      const key = await generateEphemeralKey();

      expect(key).toBeDefined();
      expect(key.id).toBeTruthy();
      expect(key.publicKey).toBeInstanceOf(PublicKey);
      expect(key.keypair).toBeInstanceOf(Keypair);
      expect(key.keypair.publicKey.equals(key.publicKey)).toBe(true);
      expect(key.used).toBe(false);
      expect(key.createdAt).toBeLessThanOrEqual(Date.now());
      expect(key.expiresAt).toBeGreaterThan(Date.now());
    });

    it('should store key in SecureStore', async () => {
      const key = await generateEphemeralKey();

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        expect.stringContaining('fabcash_ephemeral_'),
        expect.any(String)
      );
    });

    it('should use default 15 minute expiration', async () => {
      const before = Date.now();
      const key = await generateEphemeralKey();

      const expectedExpiration = before + 15 * 60 * 1000;
      expect(key.expiresAt).toBeGreaterThanOrEqual(expectedExpiration - 1000);
      expect(key.expiresAt).toBeLessThanOrEqual(expectedExpiration + 1000);
    });

    it('should use custom expiration time', async () => {
      const before = Date.now();
      const key = await generateEphemeralKey(30); // 30 minutes

      const expectedExpiration = before + 30 * 60 * 1000;
      expect(key.expiresAt).toBeGreaterThanOrEqual(expectedExpiration - 1000);
      expect(key.expiresAt).toBeLessThanOrEqual(expectedExpiration + 1000);
    });

    it('should generate unique keys each time', async () => {
      const key1 = await generateEphemeralKey();
      const key2 = await generateEphemeralKey();

      expect(key1.id).not.toBe(key2.id);
      expect(key1.publicKey.toBase58()).not.toBe(key2.publicKey.toBase58());
    });
  });

  describe('getEphemeralKey', () => {
    it('should return null for non-existent key', async () => {
      const key = await getEphemeralKey('nonexistent_id');
      expect(key).toBeNull();
    });

    it('should retrieve generated key by ID', async () => {
      const generated = await generateEphemeralKey();
      const retrieved = await getEphemeralKey(generated.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(generated.id);
      expect(retrieved!.publicKey.toBase58()).toBe(generated.publicKey.toBase58());
    });

    it('should return cached key without hitting storage', async () => {
      const generated = await generateEphemeralKey();

      // Clear mock call count
      (SecureStore.getItemAsync as jest.Mock).mockClear();

      // Get from cache
      const retrieved = await getEphemeralKey(generated.id);

      expect(retrieved).not.toBeNull();
      // Should not have called getItemAsync because it's cached
      expect(SecureStore.getItemAsync).not.toHaveBeenCalled();
    });
  });

  describe('markEphemeralKeyUsed', () => {
    it('should mark key as used', async () => {
      const key = await generateEphemeralKey();
      expect(key.used).toBe(false);

      await markEphemeralKeyUsed(key.id);

      const updated = await getEphemeralKey(key.id);
      expect(updated!.used).toBe(true);
    });

    it('should update storage when marking as used', async () => {
      const key = await generateEphemeralKey();

      // Clear mock calls from generation
      (SecureStore.setItemAsync as jest.Mock).mockClear();

      await markEphemeralKeyUsed(key.id);

      expect(SecureStore.setItemAsync).toHaveBeenCalled();
    });

    it('should handle non-existent key gracefully', async () => {
      // Should not throw
      await expect(markEphemeralKeyUsed('nonexistent')).resolves.toBeUndefined();
    });
  });

  describe('deleteEphemeralKey', () => {
    it('should delete key from storage', async () => {
      const key = await generateEphemeralKey();
      await deleteEphemeralKey(key.id);

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
        `fabcash_ephemeral_${key.id}`
      );
    });

    it('should make key unretrievable', async () => {
      const key = await generateEphemeralKey();
      await deleteEphemeralKey(key.id);

      const retrieved = await getEphemeralKey(key.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('getActiveKeyCount', () => {
    it('should return 0 when no keys exist', () => {
      expect(getActiveKeyCount()).toBe(0);
    });

    it('should count active keys', async () => {
      await generateEphemeralKey();
      await generateEphemeralKey();
      await generateEphemeralKey();

      expect(getActiveKeyCount()).toBe(3);
    });

    it('should decrease after deletion', async () => {
      const key1 = await generateEphemeralKey();
      await generateEphemeralKey();

      expect(getActiveKeyCount()).toBe(2);

      await deleteEphemeralKey(key1.id);

      expect(getActiveKeyCount()).toBe(1);
    });
  });

  describe('getKeysToSweep', () => {
    it('should return empty array when no keys to sweep', async () => {
      const keys = await getKeysToSweep();
      expect(keys).toEqual([]);
    });

    it('should return used but unexpired keys', async () => {
      const key1 = await generateEphemeralKey();
      const key2 = await generateEphemeralKey();

      // Mark one as used
      await markEphemeralKeyUsed(key1.id);

      const keysToSweep = await getKeysToSweep();

      expect(keysToSweep.length).toBe(1);
      expect(keysToSweep[0].id).toBe(key1.id);
    });

    it('should not return unused keys', async () => {
      await generateEphemeralKey();
      await generateEphemeralKey();

      const keysToSweep = await getKeysToSweep();
      expect(keysToSweep).toEqual([]);
    });
  });

  describe('clearAllEphemeralKeys', () => {
    it('should clear all keys', async () => {
      // Generate fresh keys after beforeEach cleared the cache
      await generateEphemeralKey();
      await generateEphemeralKey();
      await generateEphemeralKey();

      const countBefore = getActiveKeyCount();
      expect(countBefore).toBe(3);

      const cleared = await clearAllEphemeralKeys();

      expect(cleared).toBe(3);
      expect(getActiveKeyCount()).toBe(0);
    });

    it('should return 0 when no keys exist', async () => {
      // beforeEach already cleared all keys, so count should be 0
      expect(getActiveKeyCount()).toBe(0);

      const cleared = await clearAllEphemeralKeys();
      expect(cleared).toBe(0);
    });
  });

  describe('cleanupExpiredKeys', () => {
    it('should return 0 when no expired keys', async () => {
      await generateEphemeralKey();
      await generateEphemeralKey();

      const cleaned = await cleanupExpiredKeys();
      expect(cleaned).toBe(0);
    });

    it('should not clean up used keys even if expired', async () => {
      // Generate key with very short expiration (for testing)
      const key = await generateEphemeralKey(0); // 0 minutes = already expired

      // Mark as used
      await markEphemeralKeyUsed(key.id);

      const initialCount = getActiveKeyCount();
      await cleanupExpiredKeys();

      // Used keys should not be cleaned up even if expired
      // (they need to be swept first)
      expect(getActiveKeyCount()).toBe(initialCount);
    });
  });

  describe('key ID format', () => {
    it('should generate valid ID format', async () => {
      const key = await generateEphemeralKey();

      // ID should be timestamp_random format
      expect(key.id).toMatch(/^[a-z0-9]+_[a-z0-9]+$/);
    });
  });
});
