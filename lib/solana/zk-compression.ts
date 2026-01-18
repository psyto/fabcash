/**
 * Light Protocol ZK Compression Integration
 *
 * Uses ZK Compression to create ephemeral accounts with
 * 99% less on-chain footprint, enhancing privacy.
 *
 * Benefits:
 * - Smaller on-chain trace for ephemeral addresses
 * - Lower cost for creating many one-time addresses
 * - Same security as regular Solana accounts
 */

import {
  Rpc,
  createRpc,
  bn,
  LightSystemProgram,
  buildAndSignTx,
  sendAndConfirmTx,
  defaultTestStateTreeAccounts,
  TreeType,
} from '@lightprotocol/stateless.js';
import { Keypair, PublicKey, ComputeBudgetProgram } from '@solana/web3.js';

let rpcInstance: Rpc | null = null;

export interface CompressedTransferResult {
  success: boolean;
  signature?: string;
  error?: string;
}

// Helius API key for compression RPC (required for ZK Compression)
// Must be set via environment variable EXPO_PUBLIC_HELIUS_API_KEY
const HELIUS_API_KEY = process.env.EXPO_PUBLIC_HELIUS_API_KEY;

/**
 * Initialize ZK Compression RPC
 * Uses Helius RPC which supports Light Protocol compression
 * @param heliusApiKey - Optional API key, falls back to env variable
 * @throws Error if no API key is available
 */
export function initCompressionRpc(heliusApiKey?: string): Rpc {
  if (rpcInstance) {
    return rpcInstance;
  }

  const apiKey = heliusApiKey || HELIUS_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Helius API key required for ZK Compression. ' +
      'Set EXPO_PUBLIC_HELIUS_API_KEY in your .env file. ' +
      'Get a free key at https://helius.dev'
    );
  }
  const rpcUrl = `https://devnet.helius-rpc.com?api-key=${apiKey}`;

  rpcInstance = createRpc(rpcUrl, rpcUrl);
  return rpcInstance;
}

/**
 * Get compression RPC instance
 */
export function getCompressionRpc(): Rpc {
  if (!rpcInstance) {
    return initCompressionRpc();
  }
  return rpcInstance;
}

/**
 * Compress SOL from regular account to compressed account
 * This reduces on-chain footprint by ~99%
 */
export async function compressSol(
  payer: Keypair,
  lamports: number
): Promise<CompressedTransferResult> {
  try {
    const rpc = getCompressionRpc();
    const { blockhash } = await rpc.getLatestBlockhash();

    const treeAccounts = defaultTestStateTreeAccounts();

    // Create compress instruction
    const compressIx = await LightSystemProgram.compress({
      payer: payer.publicKey,
      toAddress: payer.publicKey,
      lamports,
      outputStateTreeInfo: {
        tree: treeAccounts.merkleTree,
        queue: treeAccounts.nullifierQueue,
        cpiContext: undefined,
        treeType: TreeType.StateV1,
        nextTreeInfo: null,
      },
    });

    const tx = buildAndSignTx(
      [ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 }), compressIx],
      payer,
      blockhash
    );

    const signature = await sendAndConfirmTx(rpc, tx);

    return {
      success: true,
      signature,
    };
  } catch (error) {
    console.error('Compress SOL failed:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Get compressed SOL balance for an address
 */
export async function getCompressedSolBalance(owner: PublicKey): Promise<number> {
  try {
    const rpc = getCompressionRpc();
    const balance = await rpc.getCompressedBalanceByOwner(owner);
    // Balance is returned as BN, convert to number
    return balance?.toNumber?.() ?? 0;
  } catch (error) {
    console.error('Get compressed balance failed:', error);
    return 0;
  }
}

/**
 * Check if compression RPC is available
 */
export async function isCompressionAvailable(): Promise<boolean> {
  try {
    const rpc = getCompressionRpc();
    // Try a simple call to check connectivity
    await rpc.getLatestBlockhash();
    return true;
  } catch {
    return false;
  }
}

/**
 * Destroy RPC instance
 */
export function destroyCompressionRpc(): void {
  rpcInstance = null;
}

/**
 * Get state tree accounts for devnet
 */
export function getStateTreeAccounts() {
  return defaultTestStateTreeAccounts();
}
