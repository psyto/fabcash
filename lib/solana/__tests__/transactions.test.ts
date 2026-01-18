import { Keypair, PublicKey, Connection } from '@solana/web3.js';
import {
  toSmallestUnit,
  fromSmallestUnit,
  formatAmount,
  buildSolTransfer,
  buildTransfer,
  createConnection,
  SOL_DECIMALS,
  USDC_DECIMALS,
  DEVNET_USDC_MINT,
} from '../transactions';

// Mock Connection for transaction building tests
jest.mock('@solana/web3.js', () => {
  const actual = jest.requireActual('@solana/web3.js');
  return {
    ...actual,
    Connection: jest.fn().mockImplementation(() => ({
      getLatestBlockhash: jest.fn().mockResolvedValue({
        blockhash: 'EkSnNWid2cvwEVnVx9aBqawnmiCNiDgp3gUdkDPTKN1N',
        lastValidBlockHeight: 100000,
      }),
      getBalance: jest.fn().mockResolvedValue(1000000000), // 1 SOL
    })),
  };
});

describe('transactions', () => {
  describe('constants', () => {
    it('should have correct SOL decimals', () => {
      expect(SOL_DECIMALS).toBe(9);
    });

    it('should have correct USDC decimals', () => {
      expect(USDC_DECIMALS).toBe(6);
    });

    it('should have valid DEVNET_USDC_MINT', () => {
      expect(DEVNET_USDC_MINT).toBeInstanceOf(PublicKey);
    });
  });

  describe('toSmallestUnit', () => {
    it('should convert SOL to lamports', () => {
      expect(toSmallestUnit(1, 'SOL')).toBe(BigInt(1_000_000_000));
      expect(toSmallestUnit(0.5, 'SOL')).toBe(BigInt(500_000_000));
      expect(toSmallestUnit(0.001, 'SOL')).toBe(BigInt(1_000_000));
    });

    it('should convert USDC to micro-USDC', () => {
      expect(toSmallestUnit(1, 'USDC')).toBe(BigInt(1_000_000));
      expect(toSmallestUnit(0.5, 'USDC')).toBe(BigInt(500_000));
      expect(toSmallestUnit(100, 'USDC')).toBe(BigInt(100_000_000));
    });

    it('should handle zero', () => {
      expect(toSmallestUnit(0, 'SOL')).toBe(BigInt(0));
      expect(toSmallestUnit(0, 'USDC')).toBe(BigInt(0));
    });

    it('should floor fractional smallest units', () => {
      // 0.0000000001 SOL = 0.1 lamports, should floor to 0
      expect(toSmallestUnit(0.0000000001, 'SOL')).toBe(BigInt(0));
    });
  });

  describe('fromSmallestUnit', () => {
    it('should convert lamports to SOL', () => {
      expect(fromSmallestUnit(BigInt(1_000_000_000), 'SOL')).toBe(1);
      expect(fromSmallestUnit(BigInt(500_000_000), 'SOL')).toBe(0.5);
      expect(fromSmallestUnit(BigInt(1_000_000), 'SOL')).toBe(0.001);
    });

    it('should convert micro-USDC to USDC', () => {
      expect(fromSmallestUnit(BigInt(1_000_000), 'USDC')).toBe(1);
      expect(fromSmallestUnit(BigInt(500_000), 'USDC')).toBe(0.5);
      expect(fromSmallestUnit(BigInt(100_000_000), 'USDC')).toBe(100);
    });

    it('should handle number input', () => {
      expect(fromSmallestUnit(1_000_000_000, 'SOL')).toBe(1);
      expect(fromSmallestUnit(1_000_000, 'USDC')).toBe(1);
    });

    it('should handle zero', () => {
      expect(fromSmallestUnit(BigInt(0), 'SOL')).toBe(0);
      expect(fromSmallestUnit(BigInt(0), 'USDC')).toBe(0);
    });
  });

  describe('formatAmount', () => {
    it('should format SOL with 4 decimal places', () => {
      expect(formatAmount(BigInt(1_000_000_000), 'SOL')).toBe('1.0000 SOL');
      expect(formatAmount(BigInt(1_234_567_890), 'SOL')).toBe('1.2346 SOL');
    });

    it('should format USDC with 2 decimal places', () => {
      expect(formatAmount(BigInt(1_000_000), 'USDC')).toBe('1.00 USDC');
      expect(formatAmount(BigInt(12_345_678), 'USDC')).toBe('12.35 USDC');
    });

    it('should handle zero amounts', () => {
      expect(formatAmount(BigInt(0), 'SOL')).toBe('0.0000 SOL');
      expect(formatAmount(BigInt(0), 'USDC')).toBe('0.00 USDC');
    });
  });

  describe('createConnection', () => {
    it('should create a Connection instance', () => {
      const connection = createConnection();
      expect(Connection).toHaveBeenCalledWith(
        'https://api.devnet.solana.com',
        'confirmed'
      );
    });
  });

  describe('buildSolTransfer', () => {
    it('should build a valid signed transaction', async () => {
      const sender = Keypair.generate();
      const recipient = Keypair.generate().publicKey;

      const tx = await buildSolTransfer({
        sender,
        recipient,
        amount: BigInt(100_000_000), // 0.1 SOL
        token: 'SOL',
      });

      expect(tx).toBeDefined();
      expect(tx.id).toMatch(/^tx_[a-z0-9]+_[a-z0-9]+$/);
      expect(tx.base64).toBeTruthy();
      expect(tx.sender).toBe(sender.publicKey.toBase58());
      expect(tx.recipient).toBe(recipient.toBase58());
      expect(tx.amount).toBe('100000000');
      expect(tx.token).toBe('SOL');
      expect(tx.createdAt).toBeLessThanOrEqual(Date.now());
      expect(tx.expiresAt).toBeGreaterThan(Date.now());
    });

    it('should include memo if provided', async () => {
      const sender = Keypair.generate();
      const recipient = Keypair.generate().publicKey;

      const tx = await buildSolTransfer({
        sender,
        recipient,
        amount: BigInt(100_000_000),
        token: 'SOL',
        memo: 'Test payment',
      });

      expect(tx.memo).toBe('Test payment');
    });

    it('should set expiration to 2 minutes', async () => {
      const sender = Keypair.generate();
      const recipient = Keypair.generate().publicKey;
      const before = Date.now();

      const tx = await buildSolTransfer({
        sender,
        recipient,
        amount: BigInt(100_000_000),
        token: 'SOL',
      });

      const expectedExpiration = before + 120000;
      expect(tx.expiresAt).toBeGreaterThanOrEqual(expectedExpiration - 1000);
      expect(tx.expiresAt).toBeLessThanOrEqual(expectedExpiration + 1000);
    });
  });

  describe('buildTransfer', () => {
    it('should route SOL transfers to buildSolTransfer', async () => {
      const sender = Keypair.generate();
      const recipient = Keypair.generate().publicKey;

      const tx = await buildTransfer({
        sender,
        recipient,
        amount: BigInt(100_000_000),
        token: 'SOL',
      });

      expect(tx.token).toBe('SOL');
      expect(tx.base64).toBeTruthy(); // SOL transfers have real base64
    });

    it('should route USDC transfers to buildUsdcTransfer', async () => {
      const sender = Keypair.generate();
      const recipient = Keypair.generate().publicKey;

      const tx = await buildTransfer({
        sender,
        recipient,
        amount: BigInt(1_000_000),
        token: 'USDC',
      });

      expect(tx.token).toBe('USDC');
      // USDC is mock for now
    });
  });

  describe('conversion roundtrip', () => {
    it('should roundtrip SOL amounts', () => {
      const original = 1.5;
      const lamports = toSmallestUnit(original, 'SOL');
      const back = fromSmallestUnit(lamports, 'SOL');

      expect(back).toBe(original);
    });

    it('should roundtrip USDC amounts', () => {
      const original = 25.99;
      const microUsdc = toSmallestUnit(original, 'USDC');
      const back = fromSmallestUnit(microUsdc, 'USDC');

      expect(back).toBe(original);
    });
  });
});
