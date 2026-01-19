require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Connection, Keypair, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { PrivacyCash } = require('privacycash');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const RPC_URL = process.env.RPC_URL || 'https://api.devnet.solana.com';
const SERVICE_WALLET_KEY = process.env.SERVICE_WALLET_KEY;

let privacyCash = null;
let serviceKeypair = null;

// Initialize Privacy Cash
async function initPrivacyCash() {
  if (!SERVICE_WALLET_KEY) {
    console.error('SERVICE_WALLET_KEY not set in environment');
    return false;
  }

  try {
    // Parse service wallet from base64 or JSON array
    let secretKey;
    try {
      secretKey = new Uint8Array(JSON.parse(SERVICE_WALLET_KEY));
    } catch {
      secretKey = new Uint8Array(Buffer.from(SERVICE_WALLET_KEY, 'base64'));
    }

    serviceKeypair = Keypair.fromSecretKey(secretKey);
    console.log('Service wallet:', serviceKeypair.publicKey.toBase58());

    // Initialize Privacy Cash SDK
    privacyCash = new PrivacyCash({
      RPC_url: RPC_URL,
      owner: serviceKeypair,
    });

    console.log('Privacy Cash initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize Privacy Cash:', error);
    return false;
  }
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    privacyCashReady: privacyCash !== null,
    serviceWallet: serviceKeypair?.publicKey.toBase58(),
  });
});

// Get shielded balance
app.get('/api/balance', async (req, res) => {
  try {
    if (!privacyCash) {
      return res.status(503).json({ success: false, error: 'Privacy Cash not initialized' });
    }

    const { lamports: balance } = await privacyCash.getPrivateBalance();

    res.json({
      success: true,
      balance: {
        lamports: balance,
        sol: balance / LAMPORTS_PER_SOL,
      },
    });
  } catch (error) {
    console.error('Balance error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Shield SOL
app.post('/api/shield', async (req, res) => {
  try {
    if (!privacyCash) {
      return res.status(503).json({ success: false, error: 'Privacy Cash not initialized' });
    }

    const { lamports } = req.body;

    if (!lamports || lamports <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid lamports amount' });
    }

    console.log(`Shielding ${lamports} lamports...`);
    const result = await privacyCash.deposit({ lamports });

    res.json({
      success: true,
      signature: result.tx,
      message: `Shielded ${lamports / LAMPORTS_PER_SOL} SOL`,
    });
  } catch (error) {
    console.error('Shield error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Withdraw from shielded pool
app.post('/api/withdraw', async (req, res) => {
  try {
    if (!privacyCash) {
      return res.status(503).json({ success: false, error: 'Privacy Cash not initialized' });
    }

    const { lamports, recipientAddress } = req.body;

    if (!lamports || lamports <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid lamports amount' });
    }

    if (!recipientAddress) {
      return res.status(400).json({ success: false, error: 'Recipient address required' });
    }

    console.log(`Withdrawing ${lamports} lamports to ${recipientAddress}...`);
    const result = await privacyCash.withdraw({ lamports, recipientAddress });

    res.json({
      success: true,
      signature: result.tx,
      recipient: result.recipient,
      amount: result.amount_in_lamports,
      fee: result.fee_in_lamports,
      message: `Withdrew ${result.amount_in_lamports / LAMPORTS_PER_SOL} SOL to ${result.recipient}`,
    });
  } catch (error) {
    console.error('Withdraw error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`RPC: ${RPC_URL}`);

  const initialized = await initPrivacyCash();
  if (!initialized) {
    console.warn('Privacy Cash not initialized - endpoints will return 503');
  }
});
