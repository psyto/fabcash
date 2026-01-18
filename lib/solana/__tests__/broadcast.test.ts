import { Connection } from '@solana/web3.js';
import {
  broadcastTransaction,
  checkNetworkConnectivity,
  getTransactionStatus,
  parseTransactionFromBase64,
  TransactionStatus,
} from '../broadcast';
import { SignedTransaction } from '../transactions';

// Mock Connection
const mockSendRawTransaction = jest.fn();
const mockGetSignatureStatuses = jest.fn();
const mockGetVersion = jest.fn();

jest.mock('@solana/web3.js', () => {
  const actual = jest.requireActual('@solana/web3.js');
  return {
    ...actual,
    Connection: jest.fn().mockImplementation(() => ({
      sendRawTransaction: mockSendRawTransaction,
      getSignatureStatuses: mockGetSignatureStatuses,
      getVersion: mockGetVersion,
    })),
  };
});

// Helper to create a mock transaction
function createMockTransaction(overrides?: Partial<SignedTransaction>): SignedTransaction {
  return {
    id: 'tx_test123_abc',
    base64: btoa('mock transaction data'),
    sender: 'SenderPubkey11111111111111111111111111111111',
    recipient: 'RecipientPubkey111111111111111111111111111',
    amount: '100000000',
    token: 'SOL',
    createdAt: Date.now(),
    expiresAt: Date.now() + 120000, // 2 minutes from now
    ...overrides,
  };
}

describe('broadcast', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('broadcastTransaction', () => {
    it('should return expired status for expired transactions', async () => {
      const tx = createMockTransaction({
        expiresAt: Date.now() - 1000, // Already expired
      });

      const result = await broadcastTransaction(tx);

      expect(result.success).toBe(false);
      expect(result.status).toBe('expired');
      expect(result.error).toBe('Transaction expired');
      expect(mockSendRawTransaction).not.toHaveBeenCalled();
    });

    it('should broadcast valid transaction successfully', async () => {
      const tx = createMockTransaction();
      const mockSignature = 'mock_signature_12345';

      mockSendRawTransaction.mockResolvedValue(mockSignature);
      mockGetSignatureStatuses.mockResolvedValue({
        value: [{ confirmationStatus: 'confirmed', err: null }],
      });

      const resultPromise = broadcastTransaction(tx);

      // Fast-forward through confirmation polling
      await jest.advanceTimersByTimeAsync(1000);

      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.signature).toBe(mockSignature);
      expect(result.status).toBe('confirmed');
    });

    it('should handle "already processed" as success', async () => {
      const tx = createMockTransaction();

      mockSendRawTransaction.mockRejectedValue(
        new Error('Transaction simulation failed: This transaction has already been processed')
      );

      const result = await broadcastTransaction(tx);

      expect(result.success).toBe(true);
      expect(result.status).toBe('confirmed');
    });

    it('should handle AlreadyProcessed error as success', async () => {
      const tx = createMockTransaction();

      mockSendRawTransaction.mockRejectedValue(
        new Error('AlreadyProcessed')
      );

      const result = await broadcastTransaction(tx);

      expect(result.success).toBe(true);
      expect(result.status).toBe('confirmed');
    });

    it('should retry on failure with exponential backoff', async () => {
      const tx = createMockTransaction();

      // Fail first two attempts, succeed on third
      mockSendRawTransaction
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce('mock_signature');

      mockGetSignatureStatuses.mockResolvedValue({
        value: [{ confirmationStatus: 'confirmed', err: null }],
      });

      const resultPromise = broadcastTransaction(tx);

      // Advance timers for retries
      await jest.advanceTimersByTimeAsync(1000); // First retry delay
      await jest.advanceTimersByTimeAsync(2000); // Second retry delay
      await jest.advanceTimersByTimeAsync(1000); // Confirmation check

      const result = await resultPromise;

      expect(mockSendRawTransaction).toHaveBeenCalledTimes(3);
      expect(result.success).toBe(true);
    });

    it('should fail after max retries', async () => {
      const tx = createMockTransaction();

      mockSendRawTransaction.mockRejectedValue(new Error('Persistent error'));

      const resultPromise = broadcastTransaction(tx);

      // Advance through all retries
      await jest.advanceTimersByTimeAsync(10000);

      const result = await resultPromise;

      expect(mockSendRawTransaction).toHaveBeenCalledTimes(3); // MAX_RETRIES
      expect(result.success).toBe(false);
      expect(result.status).toBe('failed');
      expect(result.error).toBe('Persistent error');
    });
  });

  describe('checkNetworkConnectivity', () => {
    it('should return true when RPC is reachable', async () => {
      mockGetVersion.mockResolvedValue({ 'feature-set': 1, 'solana-core': '1.14.0' });

      const result = await checkNetworkConnectivity();

      expect(result).toBe(true);
      expect(mockGetVersion).toHaveBeenCalled();
    });

    it('should return false when RPC is unreachable', async () => {
      mockGetVersion.mockRejectedValue(new Error('Network error'));

      const result = await checkNetworkConnectivity();

      expect(result).toBe(false);
    });
  });

  describe('getTransactionStatus', () => {
    it('should return null for unknown signature', async () => {
      mockGetSignatureStatuses.mockResolvedValue({
        value: [null],
      });

      const result = await getTransactionStatus('unknown_sig');

      expect(result).toBeNull();
    });

    it('should return confirmed status', async () => {
      mockGetSignatureStatuses.mockResolvedValue({
        value: [{ confirmationStatus: 'confirmed', err: null }],
      });

      const result = await getTransactionStatus('some_sig');

      expect(result).toBe('confirmed');
    });

    it('should return finalized status', async () => {
      mockGetSignatureStatuses.mockResolvedValue({
        value: [{ confirmationStatus: 'finalized', err: null }],
      });

      const result = await getTransactionStatus('some_sig');

      expect(result).toBe('finalized');
    });

    it('should return failed for errored transactions', async () => {
      mockGetSignatureStatuses.mockResolvedValue({
        value: [{ confirmationStatus: 'confirmed', err: { InstructionError: [0, 'Custom'] } }],
      });

      const result = await getTransactionStatus('some_sig');

      expect(result).toBe('failed');
    });

    it('should return broadcasting for processing transactions', async () => {
      mockGetSignatureStatuses.mockResolvedValue({
        value: [{ confirmationStatus: 'processed', err: null }],
      });

      const result = await getTransactionStatus('some_sig');

      expect(result).toBe('broadcasting');
    });

    it('should return null on network error', async () => {
      mockGetSignatureStatuses.mockRejectedValue(new Error('Network error'));

      const result = await getTransactionStatus('some_sig');

      expect(result).toBeNull();
    });
  });

  describe('parseTransactionFromBase64', () => {
    it('should decode base64 to Uint8Array', () => {
      const original = 'Hello, World!';
      const base64 = btoa(original);

      const result = parseTransactionFromBase64(base64);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(original.length);

      // Verify content
      const decoded = String.fromCharCode(...result);
      expect(decoded).toBe(original);
    });

    it('should handle empty string', () => {
      const result = parseTransactionFromBase64(btoa(''));
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(0);
    });

    it('should handle binary data', () => {
      // Create some binary data
      const binaryData = new Uint8Array([0, 1, 2, 255, 254, 253]);
      let binary = '';
      for (let i = 0; i < binaryData.length; i++) {
        binary += String.fromCharCode(binaryData[i]);
      }
      const base64 = btoa(binary);

      const result = parseTransactionFromBase64(base64);

      expect(result).toEqual(binaryData);
    });
  });

  describe('TransactionStatus type', () => {
    it('should have all expected status values', () => {
      const statuses: TransactionStatus[] = [
        'pending',
        'broadcasting',
        'confirmed',
        'finalized',
        'failed',
        'expired',
      ];

      // This test just verifies the type exists and has these values
      expect(statuses).toHaveLength(6);
    });
  });
});
