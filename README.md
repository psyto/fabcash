# Fabcash

### Offline P2P Payments on Solana

**Bluetooth / QR × Solana**

---

## Overview

**Feels like handing over cash — settles on Solana later.**

Fabcash enables in-person, mobile, peer-to-peer payments using Bluetooth or QR codes, even when the internet is unavailable.

* **At the moment of exchange:** Devices communicate directly via Bluetooth or QR.
* **Behind the scenes:** A signed Solana transaction is broadcast later when connectivity is restored.
* **Privacy by design:** Ephemeral addresses minimize on-chain linkage.

From the user's perspective, the payment is completed on the spot.

---

## Getting Started

### Prerequisites

- Node.js 18+
- iOS Simulator / Android Emulator (or physical device)
- Expo CLI

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build development client (required for BLE/Camera)
npx expo run:ios    # or run:android
```

### Testing on Devnet

```bash
# Get test SOL
solana airdrop 2 <YOUR_ADDRESS> --url devnet
```

---

## Project Structure

```
app/
├── _layout.tsx            # Root layout with providers
├── settings.tsx           # Wallet backup/import
└── (tabs)/
    ├── _layout.tsx        # Tab navigation
    ├── index.tsx          # Home - balance display
    ├── send.tsx           # Send payment flow
    └── receive.tsx        # Receive payment flow

lib/
├── solana/
│   ├── wallet.ts          # Ed25519 keypair, secure storage
│   ├── transactions.ts    # SOL/USDC transfer building
│   ├── ephemeral.ts       # Ephemeral key management
│   └── broadcast.ts       # RPC broadcasting with retry
├── bluetooth/
│   ├── protocol.ts        # BLE payload serialization
│   ├── peripheral.ts      # Receiver (BLE advertise)
│   └── central.ts         # Sender (BLE scan/connect)
├── qr/
│   ├── generate.ts        # QR code generation
│   └── scan.ts            # QR code parsing
└── store/
    └── pending-txs.ts     # Offline transaction queue

components/
├── AmountInput.tsx        # Amount entry with token selector
├── ConfirmPayment.tsx     # Payment confirmation modal
├── PendingBadge.tsx       # Pending tx indicator
└── TransactionStatus.tsx  # Tx status display
```

---

## Features

### Wallet Management
- Ed25519 keypairs stored in device secure storage
- Export/import for backup and recovery
- No account registration required

### Supported Tokens
- SOL (native)
- USDC (SPL token)

### Payment Methods

**Bluetooth (Primary)**
1. Receiver opens app → "Receive" → Generates ephemeral address
2. Sender opens app → "Send" → Detects nearby device
3. Sender enters amount → Confirms → Transaction sent via BLE
4. Both devices show completion; transaction broadcasts when online

**QR Code (Fallback)**
- Receiver displays QR with payment request
- Sender scans → signs → broadcasts immediately or later
- Compatible with Solana Pay URLs

### Offline Queue
- Signed transactions stored locally when offline
- Automatic broadcast when connectivity returns
- Retry with exponential backoff

### Privacy
- Ephemeral addresses for each receive request
- Funds swept to main wallet after confirmation
- Minimal on-chain linkage

---

## Technical Details

### Transaction Structure

```typescript
interface SignedTransaction {
  id: string;
  base64: string;           // Serialized transaction
  sender: Address;
  recipient: Address;
  amount: string;
  token: 'SOL' | 'USDC';
  createdAt: number;
  expiresAt: number;        // Blockhash lifetime
}
```

### BLE Payload

```typescript
interface TransactionPayload {
  type: 'transaction';
  version: 1;
  txBase64: string;
  senderPubkey: string;
  amount: string;
  token: 'SOL' | 'USDC';
  expiresAt: number;
}
```

### QR Format

```
fabcash://pay/<base64-encoded-payment-request>
```

Also supports standard Solana Pay URLs:
```
solana:<address>?amount=1.5&spl-token=<mint>
```

---

## Security Considerations

### Double-Spend
- Offline payments are marked "pending"
- Finality exists only after on-chain confirmation
- Similar to physical cash acceptance

### Replay Protection
- Unique transaction IDs
- Expiry timestamps (blockhash lifetime)
- Nonce in payment requests

### Key Storage
- Private keys in expo-secure-store (Keychain/Keystore)
- Never transmitted over network
- Ephemeral keys cleaned up after use

---

## Trade-offs

| Aspect | Rating |
| --- | --- |
| **User Experience** | Excellent |
| **Immediacy** | High |
| **Absolute Security** | Moderate |
| **Privacy** | Good |
| **High-Value Use** | Not Recommended |

---

## Why Solana?

- **Low fees:** Viable for small, casual payments
- **Fast finality:** Quick confirmation when online
- **Ed25519:** Lightweight mobile signing
- **Cash-like:** Closest blockchain experience to physical currency

---

## Roadmap

- [ ] NFC support for tap-to-pay
- [ ] Mainnet deployment
- [ ] Multi-token support
- [ ] Transaction history sync
- [ ] Contact/nickname system

---

## License

MIT
