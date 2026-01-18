/**
 * Privacy Cash Client
 *
 * Communicates with the Fabcash Privacy Backend (Vercel)
 * which runs the Privacy Cash SDK for shielded transactions.
 *
 * Architecture:
 *   Mobile App ──> Privacy Backend ──> Privacy Cash SDK ──> Solana
 *
 * The backend handles ZK proof generation which requires Node.js runtime.
 */

import * as SecureStore from 'expo-secure-store';

// Backend URL for Privacy Cash API
const PRIVACY_BACKEND_URL = process.env.EXPO_PUBLIC_PRIVACY_BACKEND_URL || 'https://backend-fabrknt.vercel.app';

// Flag to indicate if using real backend or fallback mock
export let IS_PRIVACY_CASH_MOCK = false;

const PRIVACY_BALANCE_CACHE_KEY = 'fabcash_privacy_balance_cache';

export interface PrivacyBalance {
  sol: number;      // In lamports
  usdc: number;     // In base units (micro-USDC)
}

export interface ShieldResult {
  success: boolean;
  txSignature?: string;
  error?: string;
}

export interface WithdrawResult {
  success: boolean;
  txSignature?: string;
  recipient?: string;
  amount?: number;
  fee?: number;
  isPartial?: boolean;
  error?: string;
}

let initialized = false;
let cachedBalance: PrivacyBalance = { sol: 0, usdc: 0 };

/**
 * Check if the privacy backend is available
 */
async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${PRIVACY_BACKEND_URL}/api/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Initialize Privacy Cash client
 * Checks backend availability and falls back to mock if unavailable
 */
export async function initPrivacyCash(
  _keypairBytes: Uint8Array
): Promise<void> {
  if (initialized) return;

  // Check if backend is available
  const backendAvailable = await checkBackendHealth();

  if (backendAvailable) {
    IS_PRIVACY_CASH_MOCK = false;
    console.log('[Privacy Cash] Connected to backend:', PRIVACY_BACKEND_URL);
  } else {
    IS_PRIVACY_CASH_MOCK = true;
    console.log('[Privacy Cash] Backend unavailable, using local mock');

    // Load cached balance for mock mode
    try {
      const stored = await SecureStore.getItemAsync(PRIVACY_BALANCE_CACHE_KEY);
      if (stored) {
        cachedBalance = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load cached balance:', error);
    }
  }

  initialized = true;
}

/**
 * Save mock balance to secure storage
 */
async function saveMockBalance(): Promise<void> {
  try {
    await SecureStore.setItemAsync(
      PRIVACY_BALANCE_CACHE_KEY,
      JSON.stringify(cachedBalance)
    );
  } catch (error) {
    console.warn('Failed to save cached balance:', error);
  }
}

/**
 * Shield SOL - deposit into privacy pool
 */
export async function shieldSol(lamports: number): Promise<ShieldResult> {
  if (!initialized) {
    throw new Error('Privacy Cash not initialized');
  }

  if (IS_PRIVACY_CASH_MOCK) {
    // Mock mode
    cachedBalance.sol += lamports;
    await saveMockBalance();
    const mockTxSig = `mock_shield_${Date.now().toString(36)}`;
    console.log(`[MOCK] Shielded ${lamports} lamports`);
    return { success: true, txSignature: mockTxSig };
  }

  try {
    const response = await fetch(`${PRIVACY_BACKEND_URL}/api/shield`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lamports }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Shield failed');
    }

    console.log(`[Privacy Cash] Shielded ${lamports} lamports:`, data.signature);

    return {
      success: true,
      txSignature: data.signature,
    };
  } catch (error) {
    console.error('Shield SOL failed:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Shield USDC - deposit into privacy pool
 */
export async function shieldUsdc(baseUnits: number): Promise<ShieldResult> {
  // USDC shielding not yet implemented in backend
  if (!initialized) {
    throw new Error('Privacy Cash not initialized');
  }

  if (IS_PRIVACY_CASH_MOCK) {
    cachedBalance.usdc += baseUnits;
    await saveMockBalance();
    const mockTxSig = `mock_shield_usdc_${Date.now().toString(36)}`;
    return { success: true, txSignature: mockTxSig };
  }

  return {
    success: false,
    error: 'USDC shielding not yet implemented',
  };
}

/**
 * Private withdraw SOL to any address
 */
export async function privateWithdrawSol(
  lamports: number,
  recipientAddress: string
): Promise<WithdrawResult> {
  if (!initialized) {
    throw new Error('Privacy Cash not initialized');
  }

  if (IS_PRIVACY_CASH_MOCK) {
    // Mock mode
    if (cachedBalance.sol < lamports) {
      return {
        success: false,
        error: `Insufficient shielded balance. Have: ${cachedBalance.sol}, need: ${lamports}`,
      };
    }

    cachedBalance.sol -= lamports;
    await saveMockBalance();

    const fee = Math.floor(lamports * 0.001);
    const mockTxSig = `mock_withdraw_${Date.now().toString(36)}`;
    console.log(`[MOCK] Withdrew ${lamports - fee} lamports to ${recipientAddress}`);

    return {
      success: true,
      txSignature: mockTxSig,
      recipient: recipientAddress,
      amount: lamports - fee,
      fee,
    };
  }

  try {
    const response = await fetch(`${PRIVACY_BACKEND_URL}/api/withdraw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lamports, recipientAddress }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Withdraw failed');
    }

    console.log(`[Privacy Cash] Withdrew ${lamports} lamports to ${recipientAddress}:`, data.signature);

    return {
      success: true,
      txSignature: data.signature,
      recipient: data.recipient,
      amount: data.amount,
    };
  } catch (error) {
    console.error('Private withdraw SOL failed:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Private withdraw USDC to any address
 */
export async function privateWithdrawUsdc(
  baseUnits: number,
  recipientAddress: string
): Promise<WithdrawResult> {
  if (!initialized) {
    throw new Error('Privacy Cash not initialized');
  }

  if (IS_PRIVACY_CASH_MOCK) {
    if (cachedBalance.usdc < baseUnits) {
      return {
        success: false,
        error: `Insufficient shielded USDC balance`,
      };
    }

    cachedBalance.usdc -= baseUnits;
    await saveMockBalance();

    const mockTxSig = `mock_withdraw_usdc_${Date.now().toString(36)}`;
    return {
      success: true,
      txSignature: mockTxSig,
      recipient: recipientAddress,
      amount: baseUnits,
    };
  }

  return {
    success: false,
    error: 'USDC withdrawal not yet implemented',
  };
}

/**
 * Get shielded (private) balance
 */
export async function getPrivateBalance(): Promise<PrivacyBalance> {
  if (!initialized) {
    return { sol: 0, usdc: 0 };
  }

  if (IS_PRIVACY_CASH_MOCK) {
    return { ...cachedBalance };
  }

  try {
    const response = await fetch(`${PRIVACY_BACKEND_URL}/api/balance`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to get balance');
    }

    return {
      sol: data.balance.lamports || 0,
      usdc: 0, // USDC not yet supported
    };
  } catch (error) {
    console.error('Get private balance failed:', error);
    return { sol: 0, usdc: 0 };
  }
}

/**
 * Clear local cache
 */
export async function clearPrivacyCache(): Promise<void> {
  cachedBalance = { sol: 0, usdc: 0 };
  await saveMockBalance();
}

/**
 * Check if Privacy Cash is initialized
 */
export function isPrivacyCashInitialized(): boolean {
  return initialized;
}

/**
 * Destroy Privacy Cash instance
 */
export function destroyPrivacyCash(): void {
  initialized = false;
  cachedBalance = { sol: 0, usdc: 0 };
}

/**
 * Get backend URL (for debugging)
 */
export function getPrivacyBackendUrl(): string {
  return PRIVACY_BACKEND_URL;
}

/**
 * Check if using mock mode
 */
export function isUsingMock(): boolean {
  return IS_PRIVACY_CASH_MOCK;
}
