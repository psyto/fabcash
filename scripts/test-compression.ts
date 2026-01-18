/**
 * Test Light Protocol ZK Compression on Devnet
 *
 * Usage:
 *   1. First run to get wallet address:
 *      npx ts-node scripts/test-compression.ts
 *
 *   2. Fund the wallet:
 *      solana airdrop 1 <ADDRESS> --url devnet
 *
 *   3. Run again to test compression:
 *      npx ts-node scripts/test-compression.ts
 */

import { Keypair, Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { ComputeBudgetProgram } from '@solana/web3.js';
import {
  Rpc,
  createRpc,
  LightSystemProgram,
  buildAndSignTx,
  sendAndConfirmTx,
  defaultTestStateTreeAccounts,
  TreeType,
} from '@lightprotocol/stateless.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file
import 'dotenv/config';

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
if (!HELIUS_API_KEY) {
  console.error('HELIUS_API_KEY not found. Create a .env file with HELIUS_API_KEY=your_key');
  process.exit(1);
}
const RPC_URL = `https://devnet.helius-rpc.com?api-key=${HELIUS_API_KEY}`;
const WALLET_FILE = path.join(__dirname, '.test-wallet.json');

// Get or create persistent test wallet
function getTestWallet(): Keypair {
  if (fs.existsSync(WALLET_FILE)) {
    const data = JSON.parse(fs.readFileSync(WALLET_FILE, 'utf-8'));
    return Keypair.fromSecretKey(Uint8Array.from(data));
  }

  const keypair = Keypair.generate();
  fs.writeFileSync(WALLET_FILE, JSON.stringify(Array.from(keypair.secretKey)));
  console.log('Created new test wallet (saved to .test-wallet.json)');
  return keypair;
}

async function main() {
  console.log('='.repeat(60));
  console.log('Light Protocol ZK Compression Test');
  console.log('='.repeat(60));
  console.log();

  const wallet = getTestWallet();
  console.log('Test Wallet:', wallet.publicKey.toBase58());
  console.log();

  // Check balance
  const connection = new Connection(RPC_URL, 'confirmed');
  const balance = await connection.getBalance(wallet.publicKey);
  console.log(`Balance: ${balance / LAMPORTS_PER_SOL} SOL`);

  if (balance < 0.01 * LAMPORTS_PER_SOL) {
    console.log();
    console.log('⚠ Insufficient balance. Please fund the wallet:');
    console.log();
    console.log(`  solana airdrop 1 ${wallet.publicKey.toBase58()} --url devnet`);
    console.log();
    console.log('Then run this script again.');
    return;
  }

  // Initialize Light Protocol RPC
  console.log('\nInitializing Light Protocol RPC...');
  const rpc = createRpc(RPC_URL, RPC_URL);

  // Check compressed balance before
  console.log('\nChecking compressed balance...');
  let compressedBalance: number;
  try {
    const balanceResult = await rpc.getCompressedBalanceByOwner(wallet.publicKey);
    compressedBalance = balanceResult?.toNumber?.() ?? 0;
  } catch {
    compressedBalance = 0;
  }
  console.log(`Compressed balance before: ${compressedBalance / LAMPORTS_PER_SOL} SOL`);

  // Compress 0.001 SOL
  const compressAmount = 0.001 * LAMPORTS_PER_SOL;
  console.log(`\nCompressing ${compressAmount / LAMPORTS_PER_SOL} SOL...`);

  try {
    const { blockhash } = await rpc.getLatestBlockhash();
    const treeAccounts = defaultTestStateTreeAccounts();

    console.log('Building compression transaction...');
    console.log('  Merkle tree:', treeAccounts.merkleTree.toBase58());
    console.log('  Nullifier queue:', treeAccounts.nullifierQueue.toBase58());

    const compressIx = await LightSystemProgram.compress({
      payer: wallet.publicKey,
      toAddress: wallet.publicKey,
      lamports: compressAmount,
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
      wallet,
      blockhash
    );

    console.log('Sending transaction...');
    const signature = await sendAndConfirmTx(rpc, tx);

    console.log();
    console.log('✓ Compression successful!');
    console.log();
    console.log('Transaction signature:', signature);
    console.log(`View on Solana Explorer: https://explorer.solana.com/tx/${signature}?cluster=devnet`);

    // Check compressed balance after
    console.log('\nVerifying compressed balance...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for indexing

    try {
      const newBalanceResult = await rpc.getCompressedBalanceByOwner(wallet.publicKey);
      const newCompressedBalance = newBalanceResult?.toNumber?.() ?? 0;
      console.log(`Compressed balance after: ${newCompressedBalance / LAMPORTS_PER_SOL} SOL`);
    } catch (e) {
      console.log('Could not fetch compressed balance (may need Helius RPC for indexing)');
    }

    // Check regular balance
    const newBalance = await connection.getBalance(wallet.publicKey);
    console.log(`Regular balance after: ${newBalance / LAMPORTS_PER_SOL} SOL`);

  } catch (error: any) {
    console.error('\n✗ Compression failed:');
    console.error(error.message || error);

    if (error.logs) {
      console.log('\nTransaction logs:');
      error.logs.forEach((log: string) => console.log('  ', log));
    }
  }

  console.log();
  console.log('='.repeat(60));
}

main().catch(console.error);
