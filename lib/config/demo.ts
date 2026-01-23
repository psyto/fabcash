/**
 * Demo Mode Configuration
 *
 * Enable this to mock network calls for demo/video capture.
 * The app will show realistic balances without needing network.
 */

// Demo mode flag - set to true for demo video capture
export const DEMO_MODE = true;

// Demo balances (in smallest units)
export const DEMO_SOL_BALANCE = BigInt(2_500_000_000); // 2.5 SOL
export const DEMO_USDC_BALANCE = BigInt(150_000_000);  // 150 USDC
export const DEMO_SHIELDED_SOL_INITIAL = 0; // Set to 0 to show Shield button

// Track demo shielded balance (can be modified at runtime)
let demoShieldedSol = DEMO_SHIELDED_SOL_INITIAL;

export function getDemoShieldedSol(): number {
  return demoShieldedSol;
}

export function addDemoShieldedSol(amount: number): void {
  demoShieldedSol += amount;
}

// Demo transaction history
export const DEMO_TRANSACTIONS = [
  {
    id: 'demo_tx_1',
    status: 'confirmed' as const,
    amount: '500000000', // 0.5 SOL
    token: 'SOL' as const,
    signature: '5xYz...demo1',
    createdAt: Date.now() - 3600000, // 1 hour ago
  },
  {
    id: 'demo_tx_2',
    status: 'confirmed' as const,
    amount: '25000000', // 25 USDC
    token: 'USDC' as const,
    signature: '3aBc...demo2',
    createdAt: Date.now() - 7200000, // 2 hours ago
  },
];

/**
 * Check if demo mode is enabled
 */
export function isDemoMode(): boolean {
  return DEMO_MODE;
}

/**
 * Simulate network delay for realistic demo feel
 */
export function demoDelay(ms: number = 300): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
