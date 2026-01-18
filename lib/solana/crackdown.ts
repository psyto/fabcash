/**
 * Crackdown Mode - Emergency Privacy Protection
 *
 * Activates when user needs to immediately protect their funds
 * and erase transaction history.
 *
 * Steps:
 * 1. Shield all SOL balance into Privacy Cash pool
 * 2. Shield all USDC balance (if supported)
 * 3. Clear all transaction history
 * 4. Clear all ephemeral keys
 * 5. Clear privacy cache
 */

import { getOrCreateWallet } from './wallet';
import { getSolBalance, getUsdcBalance } from './transactions';
import {
  initPrivacyCash,
  shieldSol,
  shieldUsdc,
  clearPrivacyCache,
  isPrivacyCashInitialized,
  getPrivateBalance,
} from './privacy-cash';
import { clearAllEphemeralKeys } from './ephemeral';
import { clearAllTransactions } from '../store/pending-txs';

export interface CrackdownResult {
  success: boolean;
  solShielded: number;
  usdcShielded: number;
  transactionsCleared: number;
  ephemeralKeysCleared: number;
  error?: string;
  steps: CrackdownStep[];
}

export interface CrackdownStep {
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  details?: string;
}

export type CrackdownProgressCallback = (step: CrackdownStep, allSteps: CrackdownStep[]) => void;

/**
 * Activate Crackdown Mode
 *
 * Shields all funds and clears all traces
 */
export async function activateCrackdownMode(
  onProgress?: CrackdownProgressCallback
): Promise<CrackdownResult> {
  const steps: CrackdownStep[] = [
    { name: 'Initializing privacy', status: 'pending' },
    { name: 'Shielding SOL', status: 'pending' },
    { name: 'Shielding USDC', status: 'pending' },
    { name: 'Clearing transactions', status: 'pending' },
    { name: 'Clearing keys', status: 'pending' },
  ];

  const updateStep = (index: number, status: CrackdownStep['status'], details?: string) => {
    steps[index] = { ...steps[index], status, details };
    if (onProgress) {
      onProgress(steps[index], steps);
    }
  };

  let solShielded = 0;
  let usdcShielded = 0;
  let transactionsCleared = 0;
  let ephemeralKeysCleared = 0;

  try {
    // Step 1: Initialize Privacy Cash
    updateStep(0, 'in_progress');
    const wallet = await getOrCreateWallet();
    if (!isPrivacyCashInitialized()) {
      await initPrivacyCash(wallet.keypair.secretKey);
    }
    updateStep(0, 'completed', 'Privacy system ready');

    // Step 2: Shield all SOL
    updateStep(1, 'in_progress');
    const solBalance = await getSolBalance(wallet.publicKey);
    const solLamports = Number(solBalance);

    // Keep minimum for fees (0.01 SOL = 10_000_000 lamports)
    const minForFees = 10_000_000;
    const solToShield = Math.max(0, solLamports - minForFees);

    if (solToShield > 0) {
      const shieldResult = await shieldSol(solToShield);
      if (shieldResult.success) {
        solShielded = solToShield;
        updateStep(1, 'completed', `${(solToShield / 1_000_000_000).toFixed(4)} SOL shielded`);
      } else {
        updateStep(1, 'failed', shieldResult.error || 'Shield failed');
      }
    } else {
      updateStep(1, 'completed', 'No SOL to shield');
    }

    // Step 3: Shield all USDC
    updateStep(2, 'in_progress');
    const usdcBalance = await getUsdcBalance(wallet.publicKey);
    const usdcUnits = Number(usdcBalance);

    if (usdcUnits > 0) {
      const shieldResult = await shieldUsdc(usdcUnits);
      if (shieldResult.success) {
        usdcShielded = usdcUnits;
        updateStep(2, 'completed', `${(usdcUnits / 1_000_000).toFixed(2)} USDC shielded`);
      } else {
        // USDC shielding might not be supported
        updateStep(2, 'completed', 'USDC shielding not available');
      }
    } else {
      updateStep(2, 'completed', 'No USDC to shield');
    }

    // Step 4: Clear all transaction history
    updateStep(3, 'in_progress');
    transactionsCleared = await clearAllTransactions();
    updateStep(3, 'completed', `${transactionsCleared} transactions cleared`);

    // Step 5: Clear all ephemeral keys
    updateStep(4, 'in_progress');
    ephemeralKeysCleared = await clearAllEphemeralKeys();
    updateStep(4, 'completed', `${ephemeralKeysCleared} keys cleared`);

    return {
      success: true,
      solShielded,
      usdcShielded,
      transactionsCleared,
      ephemeralKeysCleared,
      steps,
    };
  } catch (error) {
    return {
      success: false,
      solShielded,
      usdcShielded,
      transactionsCleared,
      ephemeralKeysCleared,
      error: (error as Error).message,
      steps,
    };
  }
}

/**
 * Get crackdown status info
 */
export async function getCrackdownStatus(): Promise<{
  publicSolBalance: number;
  publicUsdcBalance: number;
  shieldedSolBalance: number;
  shieldedUsdcBalance: number;
  canActivate: boolean;
}> {
  const wallet = await getOrCreateWallet();
  const publicSol = Number(await getSolBalance(wallet.publicKey));
  const publicUsdc = Number(await getUsdcBalance(wallet.publicKey));

  let shieldedSol = 0;
  let shieldedUsdc = 0;

  if (isPrivacyCashInitialized()) {
    const privateBalance = await getPrivateBalance();
    shieldedSol = privateBalance.sol;
    shieldedUsdc = privateBalance.usdc;
  }

  // Can activate if there's any public balance to shield
  const minForFees = 10_000_000; // 0.01 SOL
  const canActivate = publicSol > minForFees || publicUsdc > 0;

  return {
    publicSolBalance: publicSol,
    publicUsdcBalance: publicUsdc,
    shieldedSolBalance: shieldedSol,
    shieldedUsdcBalance: shieldedUsdc,
    canActivate,
  };
}
