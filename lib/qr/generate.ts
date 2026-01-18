import { TokenType } from '../solana/transactions';

export interface QRPaymentData {
  version: 1;
  type: 'payment_request';
  recipient: string;
  ephemeralId?: string;
  amount?: string;
  token?: TokenType;
  nonce: string;
  expiresAt: number;
}

/**
 * Generate QR code data for a payment request
 */
export function generatePaymentQRData(params: {
  recipientPubkey: string;
  ephemeralId?: string;
  amount?: string;
  token?: TokenType;
  expirationMinutes?: number;
}): QRPaymentData {
  const expirationMs = (params.expirationMinutes ?? 15) * 60 * 1000;

  return {
    version: 1,
    type: 'payment_request',
    recipient: params.recipientPubkey,
    ephemeralId: params.ephemeralId,
    amount: params.amount,
    token: params.token,
    nonce: generateNonce(),
    expiresAt: Date.now() + expirationMs,
  };
}

/**
 * Encode QR payment data to string for QR code
 */
export function encodeQRData(data: QRPaymentData): string {
  // Use a compact JSON format
  const json = JSON.stringify(data);
  // Encode as base64 for reliable QR scanning
  return Buffer.from(json).toString('base64');
}

/**
 * Create a full QR code value (with protocol prefix)
 */
export function createQRCodeValue(params: {
  recipientPubkey: string;
  ephemeralId?: string;
  amount?: string;
  token?: TokenType;
  expirationMinutes?: number;
}): string {
  const data = generatePaymentQRData(params);
  const encoded = encodeQRData(data);

  // Use a custom URI scheme for easy identification
  return `fabcash://pay/${encoded}`;
}

/**
 * Generate a simple Solana Pay-compatible URL (alternative format)
 */
export function createSolanaPayUrl(params: {
  recipientPubkey: string;
  amount?: number;
  token?: TokenType;
  memo?: string;
  label?: string;
}): string {
  const baseUrl = `solana:${params.recipientPubkey}`;
  const searchParams = new URLSearchParams();

  if (params.amount !== undefined) {
    searchParams.set('amount', params.amount.toString());
  }

  if (params.token === 'USDC') {
    // Devnet USDC mint
    searchParams.set('spl-token', '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');
  }

  if (params.memo) {
    searchParams.set('memo', params.memo);
  }

  if (params.label) {
    searchParams.set('label', params.label);
  }

  const queryString = searchParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Generate a random nonce
 */
function generateNonce(): string {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Validate QR payment data
 */
export function validateQRPaymentData(data: unknown): data is QRPaymentData {
  if (!data || typeof data !== 'object') return false;

  const d = data as Record<string, unknown>;
  return (
    d.version === 1 &&
    d.type === 'payment_request' &&
    typeof d.recipient === 'string' &&
    typeof d.nonce === 'string' &&
    typeof d.expiresAt === 'number'
  );
}

/**
 * Check if QR data has expired
 */
export function isQRDataExpired(data: QRPaymentData): boolean {
  return Date.now() > data.expiresAt;
}
