import { QRPaymentData, validateQRPaymentData, isQRDataExpired } from './generate';
import { TokenType } from '../solana/transactions';

export interface ParsedQRPayment {
  recipient: string;
  ephemeralId?: string;
  amount?: number;
  token: TokenType;
  expiresAt: number;
  source: 'fabcash' | 'solana-pay';
}

export interface QRParseResult {
  success: boolean;
  data?: ParsedQRPayment;
  error?: string;
}

/**
 * Parse QR code data from camera scan
 */
export function parseQRCode(scannedData: string): QRParseResult {
  // Try parsing as Fabcash payment URL
  if (scannedData.startsWith('fabcash://pay/')) {
    return parseFabcashQR(scannedData);
  }

  // Try parsing as Solana Pay URL
  if (scannedData.startsWith('solana:')) {
    return parseSolanaPayQR(scannedData);
  }

  // Try parsing as raw base64 (legacy support)
  try {
    return parseFabcashQR(`fabcash://pay/${scannedData}`);
  } catch {
    return {
      success: false,
      error: 'Unrecognized QR code format',
    };
  }
}

/**
 * Parse Fabcash payment QR code
 */
function parseFabcashQR(url: string): QRParseResult {
  try {
    const base64 = url.replace('fabcash://pay/', '');
    const json = Buffer.from(base64, 'base64').toString('utf-8');
    const data = JSON.parse(json);

    if (!validateQRPaymentData(data)) {
      return {
        success: false,
        error: 'Invalid payment QR code data',
      };
    }

    if (isQRDataExpired(data)) {
      return {
        success: false,
        error: 'Payment request has expired',
      };
    }

    return {
      success: true,
      data: {
        recipient: data.recipient,
        ephemeralId: data.ephemeralId,
        amount: data.amount ? parseFloat(data.amount) : undefined,
        token: data.token ?? 'SOL',
        expiresAt: data.expiresAt,
        source: 'fabcash',
      },
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to parse QR code',
    };
  }
}

/**
 * Parse Solana Pay QR code
 */
function parseSolanaPayQR(url: string): QRParseResult {
  try {
    // Parse solana:ADDRESS?params format
    const [protocol, rest] = url.split(':');
    if (protocol !== 'solana' || !rest) {
      return {
        success: false,
        error: 'Invalid Solana Pay URL',
      };
    }

    const [address, queryString] = rest.split('?');
    if (!address) {
      return {
        success: false,
        error: 'Missing recipient address',
      };
    }

    const params = new URLSearchParams(queryString || '');
    const amount = params.get('amount');
    const splToken = params.get('spl-token');

    // Determine token type
    let token: TokenType = 'SOL';
    if (splToken) {
      // Check if it's USDC (devnet)
      if (splToken === '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU') {
        token = 'USDC';
      } else {
        return {
          success: false,
          error: 'Unsupported token',
        };
      }
    }

    return {
      success: true,
      data: {
        recipient: address,
        amount: amount ? parseFloat(amount) : undefined,
        token,
        expiresAt: Date.now() + 15 * 60 * 1000, // 15 minute default
        source: 'solana-pay',
      },
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to parse Solana Pay URL',
    };
  }
}

/**
 * Validate a Solana address (basic check)
 */
export function isValidSolanaAddress(address: string): boolean {
  // Base58 check: 32-44 characters, only alphanumeric without 0, O, I, l
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(address);
}

/**
 * Extract address from any supported format
 */
export function extractAddress(input: string): string | null {
  // Try as QR code
  const qrResult = parseQRCode(input);
  if (qrResult.success && qrResult.data) {
    return qrResult.data.recipient;
  }

  // Try as raw address
  if (isValidSolanaAddress(input)) {
    return input;
  }

  return null;
}
