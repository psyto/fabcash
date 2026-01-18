# Fabcash

### Offline P2P Payments on Solana

**Bluetooth / QR × Solana × Zero-Knowledge Privacy**

<p align="center">
  <strong>Built with</strong><br/>
  <a href="https://www.zkcompression.com">Light Protocol</a> •
  <a href="https://github.com/Privacy-Cash/privacy-cash">Privacy Cash</a> •
  <a href="https://solana.com">Solana</a>
</p>

---

## 1. Core Concept

**Feels like handing over cash — settles on Solana later.**

Fabcash enables in-person, mobile, peer-to-peer payments using Bluetooth or QR codes, even when the internet is unavailable or unstable.

* **At the moment of exchange:** Devices communicate directly via Bluetooth or QR.
* **Behind the scenes:** A signed Solana transaction is broadcast later when connectivity is restored.
* **Privacy by design:** ZK compression, shielded pools, and ephemeral keys ensure minimal on-chain linkage.

From the user's perspective, the payment is completed on the spot.

### Inspiration

This project was inspired by [how Ugandans and Iranians turned to offline-capable tools during internet crackdowns](https://www.reuters.com/business/media-telecom/ugandans-iranians-turn-dorseys-messaging-app-bitchat-web-crackdowns-2026-01-14/). When governments restrict internet access, people need payment systems that work without constant connectivity. Fabcash brings that resilience to digital payments.

---

## 2. Privacy Technology

Fabcash integrates cutting-edge privacy protocols from the Solana ecosystem:

### Light Protocol - ZK Compression

[Light Protocol](https://www.zkcompression.com) provides ZK Compression for Solana, reducing on-chain footprint by up to 99%.

**How we use it:**
- Ephemeral receive addresses are created as compressed accounts
- Smaller on-chain trace = harder to analyze payment patterns
- Lower cost for creating many one-time addresses

```typescript
import { LightSystemProgram } from '@lightprotocol/stateless.js';

// Compress SOL into a ZK-compressed account
await LightSystemProgram.compress({
  payer: wallet.publicKey,
  toAddress: ephemeralAddress,
  lamports: amount,
});
```

### Privacy Cash - Shielded Payments

[Privacy Cash](https://github.com/Privacy-Cash/privacy-cash) enables shielded transactions where deposits and withdrawals are cryptographically unlinkable.

**How we use it:**
- Sender shields SOL/USDC into a privacy pool
- ZK proof generated for withdrawal
- Withdrawal to recipient's ephemeral address
- On-chain: deposit and withdrawal cannot be linked

```typescript
import { PrivacyCash } from 'privacycash';

// Shield funds into privacy pool
await privacyCash.deposit({ lamports: amount });

// Private withdrawal - unlinkable to deposit
await privacyCash.withdraw({
  lamports: amount,
  recipientAddress: ephemeralAddress,
});
```

### Privacy Stack

```
┌─────────────────────────────────────────────────────────┐
│                       FABCASH                           │
├─────────────────────────────────────────────────────────┤
│           Bluetooth / QR Transport (offline)            │
├─────────────────────┬───────────────────────────────────┤
│   Light Protocol    │         Privacy Cash              │
│   ZK Compression    │        Shielded Pool              │
│  (99% less data)    │    (Unlinkable txs)               │
├─────────────────────┴───────────────────────────────────┤
│                      Solana L1                          │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Product Philosophy

### 3.1 Core Belief

The transfer of value should be completed at the moment two people meet. Internet connectivity, KYC, account registration, and centralized servers are not the essence of payments.

**The essence is simple:** Value moves, here and now, with certainty. Blockchain exists to finalize settlement — not to dominate the user experience.

### 3.2 Problems With Existing Web3 Payments

* **Contradictions:** "Decentralized" tools often rely on constant online RPC and server dependency. "Anonymous" tools use permanent addresses that create fully traceable behavior.
* **Mismatch with Real-World Use:** Flea markets, splitting bills, tipping, and casual P2P transfers are face-to-face interactions that currently still require internet access.

### 3.3 Target Experience (UX First)

The ideal flow: **Meet → Bring phones close → Confirm amount → Send → Done.**

* No login.
* No accounts.
* Transaction history is optional, not mandatory.

---

## 4. Design Principles

* **Local-First:** Bluetooth/QR (and eventually NFC) as the primary transport. The internet is optional and can be used later. Blockchain stays in the background.
* **Ephemeral Addresses by Default:** New keypair per transaction. In-person payments ≠ persistent identity. Addresses are closer to banknotes than business cards.
* **ZK-Enhanced Privacy:** Light Protocol compression and Privacy Cash shielding provide cryptographic privacy guarantees.
* **Trustless by Construction:** Do not trust the counterparty or the device; trust only cryptographic signatures and verification.
* **Deterministic Outcomes:** No "maybe it fails later" UX. The transaction is either formed correctly or rejected on the spot.

---

## 5. User Experience Design

### 5.1 Typical Scenarios

* Cafés, bars, and events.
* Friends splitting expenses.
* Flea markets and pop-up shops.
* Situations requiring immediate payment without Wi-Fi/Cellular.
* **Regions with internet restrictions or crackdowns.**

### 5.2 Payment Flows

**Standard Payment (Bluetooth/QR):**
1. Receiver opens app → "Receive" → Generates ephemeral address
2. Sender opens app → "Send" → Detects device or scans QR
3. Sender enters amount → Confirms → Transaction sent
4. Both devices show "Payment complete (pending settlement)"

**Private Payment (with Privacy Cash):**
1. Sender shields funds into privacy pool (when online)
2. At payment time: ZK proof generated for withdrawal
3. Withdrawal goes to receiver's ephemeral address
4. On-chain: no link between sender's deposit and receiver's payment

---

## 6. Technical Architecture

### 6.1 Privacy-Enhanced Address Strategy

* **Policy:** Never reuse addresses; never directly link to a main wallet.
* **Implementation:**
  - New ephemeral keypair per transaction
  - ZK-compressed accounts via Light Protocol
  - Optional: Shielded pool via Privacy Cash

### 6.2 Transaction Structure

| Field | Value |
|-------|-------|
| Instruction | `SystemProgram::Transfer` or `LightSystemProgram::transfer` |
| From | Sender wallet or Privacy Cash pool |
| To | ZK-compressed ephemeral address |
| Amount | SOL or USDC |
| Privacy | Light Protocol compression + optional Privacy Cash shielding |

### 6.3 Bluetooth Payload

```json
{
  "tx_base64": "...",
  "sender_pubkey": "...",
  "amount": "1.25",
  "token": "USDC",
  "expires_at": 1730000000,
  "privacy_mode": "shielded"
}
```

*Bluetooth is merely a transport layer. Trust comes solely from cryptographic signatures.*

---

## 7. Security & Privacy

### 7.1 On-Chain Privacy

| Layer | Technology | Benefit |
|-------|------------|---------|
| Address | Ephemeral keys | No address reuse |
| Compression | Light Protocol | 99% smaller footprint |
| Shielding | Privacy Cash | Unlinkable transactions |

### 7.2 Network-Layer Privacy

* Bluetooth MAC randomization
* Session keys per connection
* No fixed device identifiers

### 7.3 Double-Spend Considerations

Offline double-spend prevention is impossible in a decentralized manner.

* Offline payments are marked "pending"
* Finality exists only after on-chain confirmation
* This mirrors physical cash — suitable for small amounts

---

## 8. Architecture Overview

```
[ Mobile A ]  <-- Bluetooth / QR -->  [ Mobile B ]
      |                                     |
      |---- signed tx (offline) ----------->|
      |                                     |
      v                                     v
┌─────────────────────────────────────────────────┐
│              Privacy Layer                       │
│  ┌─────────────────┐  ┌─────────────────────┐   │
│  │ Light Protocol  │  │   Privacy Cash      │   │
│  │ ZK Compression  │  │   Shielded Pool     │   │
│  └─────────────────┘  └─────────────────────┘   │
└─────────────────────────────────────────────────┘
                        |
                        v
                   [ Solana ]
```

---

## 9. Trade-offs

| Aspect | Rating |
| --- | --- |
| **User Experience** | Excellent |
| **Immediacy** | High |
| **On-Chain Privacy** | High (with ZK + shielding) |
| **Absolute Security** | Moderate |
| **High-Value Use** | Not Recommended |

Best suited for small, in-person, instant payments with strong privacy.

---

## 10. This Is Not "Just a Payment App"

This is:

* **Digital cash** with cryptographic privacy.
* A **ZK-enhanced** private value-transfer protocol.
* Web3 that does not feel like Web3.
* *"Payments more flexible than cash, private by default, without thinking about blockchains."*

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
│   ├── broadcast.ts       # RPC broadcasting with retry
│   ├── zk-compression.ts  # Light Protocol integration
│   └── privacy-cash.ts    # Privacy Cash SDK integration
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

## Built With

* **[Solana](https://solana.com)** - High-performance L1 blockchain
* **[Light Protocol](https://www.zkcompression.com)** - ZK Compression for Solana
* **[Privacy Cash](https://github.com/Privacy-Cash/privacy-cash)** - Shielded transaction protocol
* **[Expo](https://expo.dev)** - React Native framework
* **[@solana/kit](https://github.com/solana-labs/solana-web3.js)** - Solana JavaScript SDK

---

## Roadmap

- [x] Core offline payment flow (BLE + QR)
- [x] Light Protocol ZK Compression integration
- [x] Privacy Cash shielded payments integration
- [ ] UI for privacy mode selection
- [ ] NFC support for tap-to-pay
- [ ] Mainnet deployment
- [ ] Multi-token support
- [ ] Mesh network broadcasting (device-to-device relay)

---

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a PR.

---

## License

MIT

---

<p align="center">
  <strong>Solana Privacy Hack 2026</strong><br/>
  <em>Building private, offline-first payments for everyone.</em>
</p>
