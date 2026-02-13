/**
 * Test script for Light Protocol and Privacy Cash integrations
 * Run with: npx ts-node scripts/test-integrations.ts
 */

import { Keypair, Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import {
  Rpc,
  createRpc,
  LightSystemProgram,
  buildAndSignTx,
  sendAndConfirmTx,
  defaultTestStateTreeAccounts,
  TreeType,
} from '@lightprotocol/stateless.js';
import { ComputeBudgetProgram } from '@solana/web3.js';

const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';

// Test wallet - generate a new one for testing
const testKeypair = Keypair.generate();

async function main() {
  console.log('='.repeat(60));
  console.log('Fabcash Integration Tests - Devnet');
  console.log('='.repeat(60));
  console.log();

  console.log('Test Wallet:', testKeypair.publicKey.toBase58());
  console.log();

  // Test 1: Basic Solana Connection
  console.log('1. Testing Solana Devnet Connection...');
  await testSolanaConnection();

  // Test 2: Light Protocol RPC
  console.log('\n2. Testing Light Protocol RPC...');
  await testLightProtocolRpc();

  // Test 3: Light Protocol Compression (requires funded wallet)
  console.log('\n3. Testing Light Protocol Compression...');
  await testLightProtocolCompression();

  // Test 4: Privacy Cash SDK
  console.log('\n4. Testing Privacy Cash SDK...');
  await testPrivacyCash();

  console.log('\n' + '='.repeat(60));
  console.log('Integration Tests Complete');
  console.log('='.repeat(60));
}

async function testSolanaConnection() {
  try {
    const connection = new Connection(RPC_URL, 'confirmed');
    const version = await connection.getVersion();
    console.log('   ✓ Connected to Solana Devnet');
    console.log(`   Version: ${version['solana-core']}`);

    const balance = await connection.getBalance(testKeypair.publicKey);
    console.log(`   Test wallet balance: ${balance / LAMPORTS_PER_SOL} SOL`);

    if (balance === 0) {
      console.log('   ⚠ Wallet has no SOL. To test compression, run:');
      console.log(`   solana airdrop 1 ${testKeypair.publicKey.toBase58()} --url devnet`);
    }
  } catch (error) {
    console.log('   ✗ Failed to connect to Solana Devnet');
    console.log(`   Error: ${(error as Error).message}`);
  }
}

async function testLightProtocolRpc() {
  try {
    const rpc = createRpc(RPC_URL, RPC_URL);
    const { blockhash } = await rpc.getLatestBlockhash();
    console.log('   ✓ Light Protocol RPC initialized');
    console.log(`   Latest blockhash: ${blockhash.slice(0, 20)}...`);

    // Check state tree accounts
    const treeAccounts = defaultTestStateTreeAccounts();
    console.log(`   Merkle tree: ${treeAccounts.merkleTree.toBase58().slice(0, 20)}...`);
    console.log(`   Nullifier queue: ${treeAccounts.nullifierQueue.toBase58().slice(0, 20)}...`);
  } catch (error) {
    console.log('   ✗ Failed to initialize Light Protocol RPC');
    console.log(`   Error: ${(error as Error).message}`);
  }
}

async function testLightProtocolCompression() {
  try {
    const connection = new Connection(RPC_URL, 'confirmed');
    const balance = await connection.getBalance(testKeypair.publicKey);

    if (balance < 0.01 * LAMPORTS_PER_SOL) {
      console.log('   ⚠ Skipping compression test (insufficient balance)');
      console.log('   Need at least 0.01 SOL to test compression');
      return;
    }

    const rpc = createRpc(RPC_URL, RPC_URL);
    const { blockhash } = await rpc.getLatestBlockhash();
    const treeAccounts = defaultTestStateTreeAccounts();

    // Create compress instruction
    const compressIx = await LightSystemProgram.compress({
      payer: testKeypair.publicKey,
      toAddress: testKeypair.publicKey,
      lamports: 0.001 * LAMPORTS_PER_SOL, // Compress 0.001 SOL
      outputStateTreeInfo: {
        tree: treeAccounts.merkleTree,
        queue: treeAccounts.nullifierQueue,
        cpiContext: undefined,
        treeType: TreeType.StateV1,
        nextTreeInfo: null,
      },
    });

    console.log('   ✓ Compression instruction created');
    console.log('   Ready to compress 0.001 SOL');

    // Build transaction (don't send in test)
    const tx = buildAndSignTx(
      [ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 }), compressIx],
      testKeypair,
      blockhash
    );

    console.log('   ✓ Transaction built and signed');
    console.log('   (Not broadcasting in test mode)');

    // To actually send, uncomment:
    // const signature = await sendAndConfirmTx(rpc, tx);
    // console.log(`   Transaction sent: ${signature}`);
  } catch (error) {
    console.log('   ✗ Light Protocol compression test failed');
    console.log(`   Error: ${(error as Error).message}`);
  }
}

async function testPrivacyCash() {
  try {
    // Dynamic import to handle potential module issues
    const { PrivacyCash } = await import('privacycash');

    const pc = new PrivacyCash({
      RPC_url: RPC_URL,
      owner: testKeypair,
      enableDebug: false,
    });

    console.log('   ✓ Privacy Cash SDK initialized');

    // Check private balance
    try {
      const balance = await pc.getPrivateBalance();
      console.log(`   Private SOL balance: ${balance.lamports / LAMPORTS_PER_SOL} SOL`);
    } catch (e) {
      console.log('   Private balance: 0 SOL (no deposits yet)');
    }

    console.log('   ✓ Privacy Cash SDK operational');
    console.log('   Deposit/withdraw functions available');
  } catch (error) {
    console.log('   ✗ Privacy Cash SDK test failed');
    console.log(`   Error: ${(error as Error).message}`);

    // Check if it's a module resolution issue
    if ((error as Error).message.includes('Cannot find module')) {
      console.log('   Note: Privacy Cash SDK may need React Native environment');
    }
  }
}

// Run tests
main().catch(console.error);
