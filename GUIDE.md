# Fabcash User Guide

A complete guide to using Fabcash for private, offline P2P payments.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Receiving Payments](#receiving-payments)
3. [Sending Payments](#sending-payments)
4. [Privacy Modes](#privacy-modes)
5. [Crackdown Mode](#crackdown-mode)
6. [Transaction Status](#transaction-status)
7. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/psyto/fabcash.git
cd fabcash

# Install dependencies
npm install

# Start development server
npm start

# Build development client (required for BLE/Camera)
npx expo run:ios    # or run:android
```

### First Launch

On first launch, Fabcash automatically:

1. **Generates a new wallet** - Ed25519 keypair created locally
2. **No seed phrase shown** - This is intentional (see [Why No Seed Phrase?](#why-no-seed-phrase))
3. **Stores keys securely** - Uses device's secure enclave/keychain

### Getting Test SOL

For devnet testing:

```bash
solana airdrop 2 <YOUR_ADDRESS> --url devnet
```

Or use the [Solana Faucet](https://faucet.solana.com/).

---

## Receiving Payments

### Via Bluetooth (Primary)

1. Open the **Receive** tab
2. Tap **"Request Payment"**
3. (Optional) Enter a specific amount
4. Your device will:
   - Generate an ephemeral address
   - Start BLE advertising
   - Display "Waiting for payment..."

5. The sender brings their phone close
6. On connection:
   - Sender's phone reads your ephemeral address
   - Sender signs and transmits the transaction
   - You receive confirmation

7. The transaction is stored locally
8. Settlement occurs when internet returns

### Via QR Code (Fallback)

If Bluetooth fails:

1. Tap **"Show QR Code"**
2. A QR code appears containing:
   - Your ephemeral address
   - Requested amount (if specified)
   - Expiration time
3. Sender scans the QR code
4. Transaction proceeds as normal

### Ephemeral Addresses

Each receive request generates a **new ephemeral address**:

- Valid for 15 minutes by default
- Funds are automatically swept to main wallet
- Provides unlinkability between transactions

---

## Sending Payments

### Via Bluetooth (Primary)

1. Open the **Send** tab
2. Tap **"Scan for Devices"**
3. Select the recipient from nearby devices
4. Enter the amount to send
5. Review the transaction:
   - Recipient address
   - Amount
   - Token (SOL/USDC)
   - Estimated fee (~$0.0002)
6. Tap **"Confirm"**
7. Transaction is signed and transmitted via BLE

### Via QR Code (Fallback)

1. Tap **"Scan QR Code"**
2. Scan the recipient's QR code
3. Enter amount (if not pre-filled)
4. Confirm and send

### Transaction Flow

```
[Create TX] → [Sign with wallet] → [Send via BLE/QR] → [Store locally]
                                                            ↓
                                   [Internet available] → [Broadcast to Solana]
                                                            ↓
                                                       [Confirmed]
```

---

## Privacy Modes

Fabcash operates in three privacy modes:

### Mode 1: Standard (Default)

- Direct SOL transfers
- Ephemeral addresses for receiving
- Fast, low fees (~$0.0002)
- On-chain visibility after settlement

**Best for:** Daily transactions, small amounts

### Mode 2: Compressed

- Uses Light Protocol ZK Compression
- 99% smaller on-chain footprint
- Compressed state not easily readable

**Best for:** Higher privacy needs

### Mode 3: Shielded

- Uses Privacy Cash shielded pool
- Zero-knowledge proofs hide sender/recipient
- Maximum privacy

**Best for:** Maximum privacy, larger amounts

### Switching Modes

```
Settings → Privacy Mode → [Standard / Compressed / Shielded]
```

---

## Crackdown Mode

Emergency feature to instantly shield all funds.

### When to Use

- Internet crackdown detected
- Crossing borders
- Physical device seizure imminent
- Any situation requiring deniability

### How It Works

1. Go to **Settings**
2. Tap **"Crackdown Mode"**
3. Confirm activation
4. All actions happen automatically:

```
1. Shield all SOL balance to Privacy Cash pool
2. Clear all ephemeral keys
3. Clear transaction history
4. Clear pending transactions
5. Delete main wallet
```

### After Activation

- App appears as empty, freshly installed
- No transaction history visible
- No keys to recover
- New wallet generated on next launch

### Important

**Crackdown Mode is irreversible.** Once activated:
- Funds are in the shielded pool (withdrawable later with backend access)
- Local wallet is destroyed
- No way to prove prior transactions

---

## Transaction Status

### Status Types

| Status | Description |
|--------|-------------|
| `pending` | Received locally, not yet broadcast |
| `broadcasting` | Currently attempting to broadcast |
| `confirmed` | Confirmed on Solana (1-2 seconds) |
| `finalized` | Finalized on Solana (~30 seconds) |
| `failed` | Failed after max retries |
| `expired` | Transaction expired before broadcast |

### Pending Transactions

Transactions created offline are stored locally:

- Automatically broadcast when internet returns
- Retry with exponential backoff on failure
- Expire after 2 minutes (Solana blockhash limit)

### Viewing Status

```
Home Tab → "Pending Transactions" badge
```

Tap to view all pending transactions and their status.

---

## Troubleshooting

### Bluetooth Issues

**"Can't find nearby devices"**

- Ensure Bluetooth is enabled on both devices
- Check location permissions (required for BLE on Android)
- Move devices closer (within 10 meters)
- Restart Bluetooth on both devices

**"Connection failed"**

- Retry the connection
- Check that recipient is still advertising
- Ensure no other BLE apps are interfering

### Transaction Issues

**"Transaction expired"**

- Transactions must be broadcast within 2 minutes
- Create a new transaction and try again
- If offline, wait for internet to return

**"Broadcast failed"**

- Check internet connectivity
- RPC may be rate-limited; wait and retry
- Check Solana network status

**"Insufficient balance"**

- Ensure you have enough SOL for amount + fees
- Minimum balance: 0.001 SOL for fees

### Wallet Issues

**"Wallet not loading"**

- Check SecureStore permissions
- Reinstall the app (creates new wallet)

**"Lost my wallet"**

- Fabcash has **no recovery mechanism by design**
- This provides plausible deniability
- Create a new wallet and start fresh

---

## Best Practices

### For Privacy

1. Use ephemeral addresses for every receive
2. Enable Compressed or Shielded mode for sensitive transactions
3. Don't keep large balances; use Crackdown Mode when needed
4. Treat Fabcash as a true burner wallet

### For Reliability

1. Broadcast pending transactions when internet is stable
2. Keep a small SOL balance for fees
3. Monitor transaction status
4. Clear completed transactions regularly

### For Security

1. Keep your device secure (passcode, biometrics)
2. Don't share your screen while using the app
3. Use Crackdown Mode before crossing borders
4. Remember: No seed phrase = no recovery

---

## Related Documentation

- [SECURITY.md](SECURITY.md) - Security architecture
- [API.md](API.md) - Backend API reference
- [PRIVACY.md](PRIVACY.md) - Privacy deep dive
