import { Keypair, PublicKey } from '@solana/web3.js';
import {
  generateWallet,
  loadWallet,
  getOrCreateWallet,
  hasWallet,
  exportWalletBytes,
  importWallet,
  deleteWallet,
  shortenAddress,
} from '../wallet';
import * as SecureStore from 'expo-secure-store';

describe('wallet', () => {
  // Clear wallet state before each test
  beforeEach(async () => {
    await deleteWallet();
  });
  describe('generateWallet', () => {
    it('should generate a valid wallet with keypair', async () => {
      const wallet = await generateWallet();

      expect(wallet).toBeDefined();
      expect(wallet.publicKey).toBeInstanceOf(PublicKey);
      expect(wallet.keypair).toBeInstanceOf(Keypair);
      expect(wallet.keypair.publicKey.equals(wallet.publicKey)).toBe(true);
    });

    it('should store wallet in SecureStore', async () => {
      await generateWallet();

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'fabcash_wallet_keypair',
        expect.any(String)
      );
    });

    it('should generate different keypairs each time', async () => {
      // Clear between generations
      await deleteWallet();
      const wallet1 = await generateWallet();

      await deleteWallet();
      const wallet2 = await generateWallet();

      expect(wallet1.publicKey.toBase58()).not.toBe(wallet2.publicKey.toBase58());
    });
  });

  describe('loadWallet', () => {
    it('should return null when no wallet exists', async () => {
      const wallet = await loadWallet();
      expect(wallet).toBeNull();
    });

    it('should load existing wallet from SecureStore', async () => {
      const original = await generateWallet();

      // Clear cache to force reload from storage
      await deleteWallet();

      // Re-store the wallet
      await importWallet(original.keypair.secretKey);

      const loaded = await loadWallet();

      expect(loaded).not.toBeNull();
      expect(loaded!.publicKey.toBase58()).toBe(original.publicKey.toBase58());
    });
  });

  describe('getOrCreateWallet', () => {
    it('should create wallet if none exists', async () => {
      const wallet = await getOrCreateWallet();

      expect(wallet).toBeDefined();
      expect(wallet.publicKey).toBeInstanceOf(PublicKey);
    });

    it('should return existing wallet if one exists', async () => {
      const first = await getOrCreateWallet();
      const second = await getOrCreateWallet();

      expect(first.publicKey.toBase58()).toBe(second.publicKey.toBase58());
    });
  });

  describe('hasWallet', () => {
    it('should return false when no wallet exists', async () => {
      const exists = await hasWallet();
      expect(exists).toBe(false);
    });

    it('should return true when wallet exists', async () => {
      await generateWallet();
      const exists = await hasWallet();
      expect(exists).toBe(true);
    });
  });

  describe('exportWalletBytes', () => {
    it('should return null when no wallet exists', async () => {
      const bytes = await exportWalletBytes();
      expect(bytes).toBeNull();
    });

    it('should export valid secret key bytes', async () => {
      const wallet = await generateWallet();
      const bytes = await exportWalletBytes();

      expect(bytes).not.toBeNull();
      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes!.length).toBe(64); // Ed25519 secret key is 64 bytes

      // Verify the bytes can recreate the same keypair
      const recreated = Keypair.fromSecretKey(bytes!);
      expect(recreated.publicKey.equals(wallet.publicKey)).toBe(true);
    });
  });

  describe('importWallet', () => {
    it('should import wallet from secret key bytes', async () => {
      // Generate a keypair externally
      const original = Keypair.generate();

      const imported = await importWallet(original.secretKey);

      expect(imported.publicKey.equals(original.publicKey)).toBe(true);
    });

    it('should store imported wallet in SecureStore', async () => {
      const keypair = Keypair.generate();
      await importWallet(keypair.secretKey);

      expect(SecureStore.setItemAsync).toHaveBeenCalled();
    });

    it('should make imported wallet loadable', async () => {
      const keypair = Keypair.generate();
      await importWallet(keypair.secretKey);

      // Force reload
      const loaded = await loadWallet();
      expect(loaded!.publicKey.equals(keypair.publicKey)).toBe(true);
    });
  });

  describe('deleteWallet', () => {
    it('should delete wallet from SecureStore', async () => {
      await generateWallet();
      await deleteWallet();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('fabcash_wallet_keypair');
    });

    it('should make hasWallet return false after deletion', async () => {
      await generateWallet();
      expect(await hasWallet()).toBe(true);

      await deleteWallet();
      expect(await hasWallet()).toBe(false);
    });
  });

  describe('shortenAddress', () => {
    it('should shorten string address', () => {
      const addr = 'BDx3rGmwC8jXFTa1cVqeCuN99GuR2LQgnmYn237R1E3m';
      const shortened = shortenAddress(addr);

      expect(shortened).toBe('BDx3...1E3m');
    });

    it('should shorten PublicKey address', () => {
      const pubkey = new PublicKey('BDx3rGmwC8jXFTa1cVqeCuN99GuR2LQgnmYn237R1E3m');
      const shortened = shortenAddress(pubkey);

      expect(shortened).toBe('BDx3...1E3m');
    });

    it('should respect custom char count', () => {
      const addr = 'BDx3rGmwC8jXFTa1cVqeCuN99GuR2LQgnmYn237R1E3m';
      const shortened = shortenAddress(addr, 6);

      expect(shortened).toBe('BDx3rG...7R1E3m');
    });
  });
});
