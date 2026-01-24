import { TokenType } from '../solana/transactions';

// BLE Service and Characteristic UUIDs
export const FABCASH_SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
export const PAYMENT_REQUEST_CHAR_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
export const TRANSACTION_CHAR_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

/**
 * Payment request payload (receiver advertises this)
 */
export interface PaymentRequest {
  type: 'payment_request';
  version: 1;
  recipientPubkey: string;
  ephemeralId: string;
  amount?: string;         // Optional pre-set amount
  token?: TokenType;       // Optional token type
  expiresAt: number;
}

/**
 * Transaction payload (sender sends this)
 */
export interface TransactionPayload {
  type: 'transaction';
  version: 1;
  txBase64: string;
  senderPubkey: string;
  amount: string;
  token: TokenType;
  expiresAt: number;
  memoHash?: string;
}

/**
 * Acknowledgement payload
 */
export interface AckPayload {
  type: 'ack';
  success: boolean;
  txId?: string;
  error?: string;
}

export type BlePayload = PaymentRequest | TransactionPayload | AckPayload;

/**
 * Serialize payload to base64 for BLE transmission
 */
export function serializePayload(payload: BlePayload): string {
  const json = JSON.stringify(payload);
  return Buffer.from(json).toString('base64');
}

/**
 * Deserialize base64 payload from BLE
 */
export function deserializePayload(base64: string): BlePayload {
  const json = Buffer.from(base64, 'base64').toString('utf-8');
  return JSON.parse(json) as BlePayload;
}

/**
 * Validate payment request payload
 */
export function validatePaymentRequest(
  payload: unknown
): payload is PaymentRequest {
  if (!payload || typeof payload !== 'object') return false;

  const p = payload as Record<string, unknown>;
  return (
    p.type === 'payment_request' &&
    p.version === 1 &&
    typeof p.recipientPubkey === 'string' &&
    typeof p.ephemeralId === 'string' &&
    typeof p.expiresAt === 'number'
  );
}

/**
 * Validate transaction payload
 */
export function validateTransactionPayload(
  payload: unknown
): payload is TransactionPayload {
  if (!payload || typeof payload !== 'object') return false;

  const p = payload as Record<string, unknown>;
  return (
    p.type === 'transaction' &&
    p.version === 1 &&
    typeof p.txBase64 === 'string' &&
    typeof p.senderPubkey === 'string' &&
    typeof p.amount === 'string' &&
    (p.token === 'SOL' || p.token === 'USDC') &&
    typeof p.expiresAt === 'number'
  );
}

/**
 * Create a payment request payload
 */
export function createPaymentRequest(params: {
  recipientPubkey: string;
  ephemeralId: string;
  amount?: string;
  token?: TokenType;
  expirationMinutes?: number;
}): PaymentRequest {
  return {
    type: 'payment_request',
    version: 1,
    recipientPubkey: params.recipientPubkey,
    ephemeralId: params.ephemeralId,
    amount: params.amount,
    token: params.token,
    expiresAt: Date.now() + (params.expirationMinutes ?? 15) * 60 * 1000,
  };
}

/**
 * Create a transaction payload
 */
export function createTransactionPayload(params: {
  txBase64: string;
  senderPubkey: string;
  amount: string;
  token: TokenType;
  expirationMinutes?: number;
  memoHash?: string;
}): TransactionPayload {
  return {
    type: 'transaction',
    version: 1,
    txBase64: params.txBase64,
    senderPubkey: params.senderPubkey,
    amount: params.amount,
    token: params.token,
    expiresAt: Date.now() + (params.expirationMinutes ?? 2) * 60 * 1000,
    memoHash: params.memoHash,
  };
}

/**
 * Create an ack payload
 */
export function createAckPayload(params: {
  success: boolean;
  txId?: string;
  error?: string;
}): AckPayload {
  return {
    type: 'ack',
    success: params.success,
    txId: params.txId,
    error: params.error,
  };
}

/**
 * Split large payloads into chunks for BLE MTU
 * BLE typically has 20-512 byte MTU, we use 180 bytes for safety
 */
const CHUNK_SIZE = 180;

export function chunkPayload(base64: string): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < base64.length; i += CHUNK_SIZE) {
    chunks.push(base64.slice(i, i + CHUNK_SIZE));
  }
  return chunks;
}

export function reassembleChunks(chunks: string[]): string {
  return chunks.join('');
}
