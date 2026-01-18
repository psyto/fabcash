import {
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstructions,
  signTransactionMessageWithSigners,
  getBase64EncodedWireTransaction,
  Address,
  address,
  KeyPairSigner,
  lamports,
  type Instruction,
} from '@solana/kit';
import { getTransferSolInstruction } from '@solana-program/system';
import {
  getTransferInstruction,
  findAssociatedTokenPda,
  TOKEN_PROGRAM_ADDRESS,
  getCreateAssociatedTokenIdempotentInstruction,
} from '@solana-program/token';
import { getAddMemoInstruction } from '@solana-program/memo';

// Devnet USDC mint address
export const DEVNET_USDC_MINT = address('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');

// Token decimals
export const SOL_DECIMALS = 9;
export const USDC_DECIMALS = 6;

export type TokenType = 'SOL' | 'USDC';

export interface TransferParams {
  sender: KeyPairSigner;
  recipient: Address;
  amount: bigint; // In smallest units (lamports for SOL, micro-USDC for USDC)
  token: TokenType;
  memo?: string;
}

export interface SignedTransaction {
  id: string;
  base64: string;
  sender: Address;
  recipient: Address;
  amount: string;
  token: TokenType;
  memo?: string;
  createdAt: number;
  expiresAt: number;
}

const RPC_URL = 'https://api.devnet.solana.com';
const RPC_WS_URL = 'wss://api.devnet.solana.com';

/**
 * Create RPC client for devnet
 */
export function createRpc() {
  return createSolanaRpc(RPC_URL);
}

/**
 * Create RPC subscriptions client
 */
export function createRpcSubscriptions() {
  return createSolanaRpcSubscriptions(RPC_WS_URL);
}

/**
 * Build and sign a SOL transfer transaction
 */
export async function buildSolTransfer(
  params: TransferParams
): Promise<SignedTransaction> {
  const { sender, recipient, amount, memo } = params;
  const rpc = createRpc();

  // Get latest blockhash
  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

  // Build the transaction
  const instructions: Instruction[] = [];

  // Add transfer instruction
  instructions.push(
    getTransferSolInstruction({
      source: sender,
      destination: recipient,
      amount: lamports(amount),
    })
  );

  // Add memo instruction if provided
  if (memo) {
    instructions.push(
      getAddMemoInstruction({
        memo,
      })
    );
  }

  // Create and sign the transaction
  const transactionMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayer(sender.address, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
    (tx) => appendTransactionMessageInstructions(instructions, tx)
  );

  const signedTx = await signTransactionMessageWithSigners(transactionMessage);
  const base64 = getBase64EncodedWireTransaction(signedTx);

  const txId = generateTransactionId();

  return {
    id: txId,
    base64,
    sender: sender.address,
    recipient,
    amount: amount.toString(),
    token: 'SOL',
    memo,
    createdAt: Date.now(),
    expiresAt: Date.now() + 120000, // 2 minutes (blockhash lifetime)
  };
}

/**
 * Build and sign a USDC transfer transaction
 */
export async function buildUsdcTransfer(
  params: TransferParams
): Promise<SignedTransaction> {
  const { sender, recipient, amount, memo } = params;
  const rpc = createRpc();

  // Get latest blockhash
  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

  // Find token accounts
  const [senderAta] = await findAssociatedTokenPda({
    mint: DEVNET_USDC_MINT,
    owner: sender.address,
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
  });

  const [recipientAta] = await findAssociatedTokenPda({
    mint: DEVNET_USDC_MINT,
    owner: recipient,
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
  });

  const instructions: Instruction[] = [];

  // Create recipient ATA if needed (idempotent)
  instructions.push(
    getCreateAssociatedTokenIdempotentInstruction({
      payer: sender,
      owner: recipient,
      mint: DEVNET_USDC_MINT,
      ata: recipientAta,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    })
  );

  // Add transfer instruction
  instructions.push(
    getTransferInstruction({
      source: senderAta,
      destination: recipientAta,
      authority: sender,
      amount,
    })
  );

  // Add memo if provided
  if (memo) {
    instructions.push(
      getAddMemoInstruction({
        memo,
      })
    );
  }

  // Create and sign the transaction
  const transactionMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayer(sender.address, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
    (tx) => appendTransactionMessageInstructions(instructions, tx)
  );

  const signedTx = await signTransactionMessageWithSigners(transactionMessage);
  const base64 = getBase64EncodedWireTransaction(signedTx);

  const txId = generateTransactionId();

  return {
    id: txId,
    base64,
    sender: sender.address,
    recipient,
    amount: amount.toString(),
    token: 'USDC',
    memo,
    createdAt: Date.now(),
    expiresAt: Date.now() + 120000,
  };
}

/**
 * Build transfer based on token type
 */
export async function buildTransfer(
  params: TransferParams
): Promise<SignedTransaction> {
  if (params.token === 'SOL') {
    return buildSolTransfer(params);
  } else {
    return buildUsdcTransfer(params);
  }
}

/**
 * Convert human-readable amount to smallest units
 */
export function toSmallestUnit(amount: number, token: TokenType): bigint {
  const decimals = token === 'SOL' ? SOL_DECIMALS : USDC_DECIMALS;
  return BigInt(Math.floor(amount * Math.pow(10, decimals)));
}

/**
 * Convert smallest units to human-readable amount
 */
export function fromSmallestUnit(amount: bigint, token: TokenType): number {
  const decimals = token === 'SOL' ? SOL_DECIMALS : USDC_DECIMALS;
  return Number(amount) / Math.pow(10, decimals);
}

/**
 * Format amount for display
 */
export function formatAmount(amount: bigint, token: TokenType): string {
  const value = fromSmallestUnit(amount, token);
  const decimals = token === 'SOL' ? 4 : 2;
  return `${value.toFixed(decimals)} ${token}`;
}

/**
 * Generate a unique transaction ID
 */
function generateTransactionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `tx_${timestamp}_${random}`;
}

/**
 * Get SOL balance for an address
 */
export async function getSolBalance(addr: Address): Promise<bigint> {
  const rpc = createRpc();
  const { value } = await rpc.getBalance(addr).send();
  return value;
}

/**
 * Get USDC balance for an address
 */
export async function getUsdcBalance(addr: Address): Promise<bigint> {
  const rpc = createRpc();

  const [ata] = await findAssociatedTokenPda({
    mint: DEVNET_USDC_MINT,
    owner: addr,
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
  });

  try {
    const { value } = await rpc
      .getTokenAccountBalance(ata)
      .send();
    return BigInt(value.amount);
  } catch {
    // Account doesn't exist yet
    return BigInt(0);
  }
}
