# Fabcash

### True Burner Wallet for Solana

**Offline P2P Payments × No Seed Phrase × Zero-Knowledge Privacy**

> *"A wallet you can lose. A wallet you can deny. A wallet that works like cash."*

<p align="center">
  <strong>Built with</strong><br/>
  <a href="https://www.zkcompression.com">Light Protocol</a> •
  <a href="https://github.com/Privacy-Cash/privacy-cash">Privacy Cash</a> •
  <a href="https://solana.com">Solana</a>
</p>

---

## 1. Why Fabcash?

### The Problem

Every digital wallet has a fundamental flaw that physical wallets don't:

| Physical Wallet (empty) | Digital Wallet (empty) |
|-------------------------|------------------------|
| Reveals nothing | Reveals **entire history** |
| No forensic value | Every transaction forever |
| Past contents unknown | All counterparties linked |

**This is a broken standard.** Fabcash breaks it.

### The Solution

| Feature | Fabcash |
|---------|---------|
| **True Burner Wallet** | No seed phrase. No backup. No recovery. |
| **Empty Wallet = Empty** | No history. Nothing to reveal. |
| **Offline Payments** | Bluetooth/QR. No internet needed. |
| **Only on Solana** | $0.0002 fees make this possible. |

### At a Glance

```
Traditional wallet at border crossing:
  "Unlock your wallet" → Must comply → Full history exposed

Fabcash at border crossing:
  "Unlock your wallet" → "It's just a payment app" → Nothing to recover
```

---

## 2. Philosophical Background

### Real-World Inspiration

This project was inspired by [how Ugandans and Iranians turned to offline-capable tools during internet crackdowns](https://www.reuters.com/business/media-telecom/ugandans-iranians-turn-dorseys-messaging-app-bitchat-web-crackdowns-2026-01-14/). When governments restrict internet access, people need payment systems that work without constant connectivity. Fabcash brings that resilience to digital payments.

### The Third Era of Crypto

[Balaji Srinivasan](https://www.youtube.com/watch?v=u3B8xqsf66w) argues crypto is entering its third era:

| Era | Focus |
|-----|-------|
| Era 1 | Bitcoin — decentralized money |
| Era 2 | Ethereum — decentralized compute |
| **Era 3** | **Privacy — decentralized privacy** |

Fabcash is built for Era 3. Not "private transactions" — but wallet architecture where privacy is the foundation, not a feature.

### Lightning Network, Simplified

Bitcoin's Lightning Network pioneered a key insight: **payments don't need to settle immediately**.

Fabcash borrows this philosophy, implemented simply on Solana:

| Lightning Network | Fabcash |
|-------------------|---------|
| Channel setup required | No setup |
| Channel funding required | No funding |
| Complex routing | Direct P2P (Bluetooth/QR) |
| Close channel to settle | Broadcast when online |

**Same insight:** Separate payment from settlement.
**Simpler implementation:** Solana's $0.0002 fees mean no channel complexity needed.

*Lightning proved the concept. Solana made it simple.*

### Why Only Solana?

**Fabcash is only possible on Solana.** This isn't preference — it's economics.

| Chain | Tx Fee | Finality | Small Payments |
|-------|--------|----------|----------------|
| **Solana** | $0.0002 | 400ms | Practical |
| Bitcoin | $1-10+ | 10 min | Impractical |
| Ethereum L1 | $1-50+ | 12 sec | Impractical |
| Ethereum L2 | $0.01-0.10 | Varies | Possible but complex |

**The math:**

```
Buying coffee with Fabcash (Solana):
  Coffee: $5.00
  Tx fee: $0.0002
  Total:  $5.0002
  Fee %:  0.004%  ✓ Negligible

Buying coffee with Bitcoin:
  Coffee: $5.00
  Tx fee: $3.00
  Total:  $8.00
  Fee %:  60%  ✗ Absurd
```

On Bitcoin or Ethereum L1, Fabcash would be economically unusable. The burner wallet concept requires negligible fees.

**Solana's economics made Fabcash possible. The concept wouldn't be practical elsewhere.**

---

## 3. Core Features

### True Burner Wallet

Most wallets are designed to be permanent. Fabcash assumes the opposite.

| Traditional Wallet | Fabcash |
|-------------------|---------|
| "Never lose your seed phrase" | There is no seed phrase |
| "Back up your keys" | Keys cannot be backed up |
| "Recover from any device" | Cannot be recovered |
| "Store your life savings" | Store daily spending only |
| "Prove ownership" | Plausible deniability |

**This is not a limitation — it's the core feature.**

### Offline Payments

```
Payment (offline):     Alice ──Bluetooth──> Bob  [no internet needed]
                              │
Settlement (online):          └──> Broadcast when connected
                                   └──> ZK Compression applied
```

- Bluetooth Low Energy for device-to-device transfer
- QR code fallback
- Signed transactions stored locally
- Settlement when internet returns

### The Cash Metaphor

| Physical Cash | Fabcash |
|--------------|---------|
| Lose wallet → lose money | Lose phone → lose funds |
| No transaction history | History is optional |
| Instant transfer | Instant (settlement later) |
| Anonymous by default | Privacy by default |
| Carry spending money, not savings | Keep small amounts |

This is intentional. For larger amounts, sweep to a backed-up cold wallet.

---

## 4. Privacy Technology

Fabcash integrates cutting-edge privacy protocols from the Solana ecosystem:

### Privacy Stack

```
┌─────────────────────────────────────────────────────────┐
│                       FABCASH                           │
├─────────────────────────────────────────────────────────┤
│  PAYMENT LAYER (offline - no internet needed)           │
│  ├─ Bluetooth / QR Transport                            │
│  └─ Ephemeral addresses per transaction                 │
├─────────────────────────────────────────────────────────┤
│  SETTLEMENT LAYER (online - when connectivity returns)  │
│  ├─ Light Protocol ZK Compression (99% less data)       │
│  └─ Privacy Cash Shielded Pool (unlinkable sweeps)      │
├─────────────────────────────────────────────────────────┤
│                      Solana L1                          │
└─────────────────────────────────────────────────────────┘
```

### Light Protocol — ZK Compression

[Light Protocol](https://www.zkcompression.com) provides ZK Compression for Solana, reducing on-chain footprint by up to 99%.

**When it's used:** At settlement time (when transactions are broadcast), not at payment time. This preserves Fabcash's offline-first design.

**How we use it:**
- When connectivity returns, transactions are broadcast with ZK compression
- Smaller on-chain trace = harder to analyze payment patterns
- Lower cost for settlement transactions

```typescript
import { LightSystemProgram } from '@lightprotocol/stateless.js';

// At settlement: Compress SOL into a ZK-compressed account
await LightSystemProgram.compress({
  payer: wallet.publicKey,
  toAddress: ephemeralAddress,
  lamports: amount,
});
```

### Privacy Cash — Shielded Settlement

[Privacy Cash](https://github.com/Privacy-Cash/privacy-cash) enables shielded transactions where deposits and withdrawals are cryptographically unlinkable.

**Why it matters for crackdown scenarios:**
- During offline payments, funds accumulate in ephemeral addresses
- When connectivity returns, users must sweep funds to their main wallet
- Without shielding, this sweep creates an on-chain link that surveillance can trace
- Privacy Cash breaks this link through a shielded pool

```
Without Privacy Cash:
  Ephemeral ──> Main Wallet  ← Government sees link

With Privacy Cash:
  Ephemeral ──> Privacy Pool ──> Main Wallet  ← Link broken
```

**Architecture:**
```
Mobile App ──> Backend API ──> Privacy Cash SDK ──> Solana
                   │
                   └── ZK proof generation requires Node.js runtime
```

**How we use it:**
```typescript
// Backend API handles Privacy Cash operations
// Mobile app sends sweep request to backend

// Backend: Shield funds from ephemeral into privacy pool
await privacyCash.deposit({ lamports: amount });

// Backend: Private withdrawal to main wallet - unlinkable
await privacyCash.withdraw({
  lamports: amount,
  recipientAddress: mainWallet,
});
```

**Key insight:** Ephemeral addresses protect you at payment time. Privacy Cash protects you at settlement time.

---

## 5. Technical Architecture

### Privacy-Enhanced Address Strategy

* **Policy:** Never reuse addresses; never directly link to a main wallet.
* **Implementation:**
  - New ephemeral keypair per transaction
  - ZK-compressed accounts via Light Protocol
  - Optional: Shielded pool via Privacy Cash

### Transaction Structure

| Field | Value |
|-------|-------|
| Instruction | `SystemProgram::Transfer` or `LightSystemProgram::transfer` |
| From | Sender wallet or Privacy Cash pool |
| To | ZK-compressed ephemeral address |
| Amount | SOL or USDC |
| Privacy | Light Protocol compression + optional Privacy Cash shielding |

### Bluetooth Payload

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

### Architecture Overview

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

## 6. Security & Privacy

### Threat Model

Fabcash is designed for users in hostile environments where:

| Threat | Description | Mitigation |
|--------|-------------|------------|
| **Coercion** | Forced to reveal wallet | No seed phrase to reveal |
| **Sender surveillance** | Sender tries to track receiver's wallet | Ephemeral addresses |
| **Chain analysis** | Third party analyzes on-chain patterns | ZK compression reduces footprint |
| **Post-crackdown forensics** | Government analyzes chain after connectivity returns | Privacy Cash shielded settlement |
| **Network monitoring** | ISP/government monitors RPC calls | Deferred settlement, Tor-compatible |
| **Device seizure** | Phone taken by adversary | No recovery possible |

### Layered Privacy Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                    PRIVACY LAYERS                               │
├────────────────────────────────────────────────────────────────┤
│  Layer 1: Payment Privacy (Ephemeral Addresses)                │
│  └─ Sender cannot learn receiver's main wallet                 │
├────────────────────────────────────────────────────────────────┤
│  Layer 2: Footprint Privacy (Light Protocol ZK Compression)    │
│  └─ Compressed accounts = harder to analyze patterns           │
├────────────────────────────────────────────────────────────────┤
│  Layer 3: Settlement Privacy (Privacy Cash Shielded Pool)      │
│  └─ Sweep transactions unlinkable to main wallet               │
└────────────────────────────────────────────────────────────────┘
```

### Network-Layer Privacy

* Bluetooth MAC randomization
* Session keys per connection
* No fixed device identifiers

### Double-Spend Considerations

Offline double-spend prevention is impossible in a decentralized manner.

* Offline payments are marked "pending"
* Finality exists only after on-chain confirmation
* This mirrors physical cash — suitable for small amounts

### Why No Seed Phrase?

**Fabcash intentionally does not support seed phrase backup.** This is a security feature, not a missing feature.

| Traditional Wallet | Fabcash |
|-------------------|---------|
| Seed phrase = can recover funds | No seed phrase = nothing to reveal |
| Seed phrase = can be coerced | No backup = plausible deniability |
| Long-term storage | Burner wallet for daily spending |

**In hostile environments:**

```
Scenario: Border crossing or detention

Traditional wallet:
  Authority: "Give us your seed phrase"
  User: Has to comply or face consequences
  Result: All funds and transaction history exposed

Fabcash:
  Authority: "Give us your seed phrase"
  User: "There is no seed phrase. It's a burner wallet."
  Result: Only current balance visible, no history, no recovery possible
```

**Best practice:**
1. Keep small amounts in Fabcash (daily spending money)
2. Use Privacy Cash to sweep larger amounts to a backed-up cold wallet
3. Treat Fabcash like a physical wallet, not a savings account

---

## 7. User Experience

### Typical Scenarios

* Cafés, bars, and events
* Friends splitting expenses
* Flea markets and pop-up shops
* Situations requiring immediate payment without Wi-Fi/Cellular
* **Regions with internet restrictions or crackdowns**

### Payment Flows

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

## 8. Trade-offs

| Aspect | Rating |
| --- | --- |
| **User Experience** | Excellent |
| **Immediacy** | High |
| **On-Chain Privacy** | High (with ZK + shielding) |
| **Absolute Security** | Moderate |
| **High-Value Use** | Not Recommended |

Best suited for small, in-person, instant payments with strong privacy.

---

## 9. Solana Mobile

Fabcash is designed with **Solana Mobile** as a primary target platform. The offline-first philosophy aligns perfectly with how Solana Mobile users interact with their devices.

### Why Solana Mobile?

| Feature | Benefit for Fabcash |
|---------|-------------------|
| **Offline users** | Many Solana Mobile users operate in low-connectivity environments |
| **dApp Store** | Distribution without Google Play's crypto restrictions |
| **NFC (Seeker)** | Enables tap-to-pay for even faster transactions |
| **Crypto-native** | Users already understand wallet concepts |

### Why NOT Seed Vault?

Fabcash intentionally does **not** use Solana Mobile's Seed Vault. This is a privacy decision:

| Seed Vault | Fabcash Approach |
|------------|------------------|
| Creates permission trail | No special permissions |
| Hardware proves wallet exists | Plausible deniability |
| Saga/Seeker only | Works on any phone |
| Designed for permanent wallets | True burner wallet |

**For maximum privacy:** No Seed Vault = no evidence = better for hostile environments.

### Planned Integration

```
Current:     Bluetooth + QR
Future:      Bluetooth + QR + NFC tap-to-pay (Seeker)

Key storage: expo-secure-store (intentionally software-only)
            → No hardware binding
            → Works on any device
            → True burner wallet
```

### Target Devices

* **Saga** - First-generation Solana phone
* **Seeker** - Next-generation with NFC tap-to-pay
* **Any Android/iOS** - Fabcash works everywhere (not locked to Solana phones)

---

## 10. Getting Started

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

## 11. Project Structure

```
app/
├── _layout.tsx            # Root layout with providers
├── settings.tsx           # Wallet backup/import, Crackdown Mode
└── (tabs)/
    ├── _layout.tsx        # Tab navigation
    ├── index.tsx          # Home - balance display, Shield SOL
    ├── send.tsx           # Send payment flow with privacy modes
    └── receive.tsx        # Receive payment flow

lib/
├── solana/
│   ├── wallet.ts          # Ed25519 keypair, secure storage
│   ├── transactions.ts    # SOL/USDC transfer building
│   ├── ephemeral.ts       # Ephemeral key management
│   ├── broadcast.ts       # RPC broadcasting with retry
│   ├── zk-compression.ts  # Light Protocol integration
│   ├── privacy-cash.ts    # Privacy Cash client
│   └── crackdown.ts       # Emergency shield all funds
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
├── ConfirmPayment.tsx     # Payment confirmation with privacy viz
├── PrivacyModeSelector.tsx # 4-level privacy mode picker
├── PrivacyVisualization.tsx # Chain analysis visibility diagram
├── PendingBadge.tsx       # Pending tx indicator
└── TransactionStatus.tsx  # Tx status display

backend-server/            # Privacy Cash backend (for AWS/EC2)
├── server.js              # Express API with Privacy Cash SDK
├── package.json
└── README.md              # Deployment instructions
```

---

## 12. Built With

* **[Solana](https://solana.com)** - The only L1 where this concept is economically viable ($0.0002 fees, 400ms finality)
* **[Light Protocol](https://www.zkcompression.com)** - ZK Compression for Solana
* **[Privacy Cash](https://github.com/Privacy-Cash/privacy-cash)** - Shielded transaction protocol
* **[Expo](https://expo.dev)** - React Native framework
* **[@solana/web3.js](https://github.com/solana-labs/solana-web3.js)** - Solana JavaScript SDK

---

## 13. Roadmap

### Completed
- [x] Core offline payment flow (BLE + QR)
- [x] Light Protocol ZK Compression integration
- [x] Privacy Cash shielded payments integration
- [x] 4-level privacy mode selector UI
- [x] Privacy Visualization (chain analysis view)
- [x] Crackdown Mode (emergency shield all funds)
- [x] Shield SOL button on home screen
- [x] Privacy Cash backend server (AWS/EC2 ready)

### In Progress
- [ ] Deploy backend to production
- [ ] Mainnet deployment

### Solana Mobile Integration
- [ ] NFC tap-to-pay (Seeker has NFC)
- [ ] Solana dApp Store submission
- [ ] Android-native BLE optimizations
- [x] Decided: No Seed Vault (intentional for burner wallet philosophy)

### Future
- [ ] Multi-token support
- [ ] Mesh network broadcasting (device-to-device relay)
- [ ] Tor integration for RPC calls

---

## 14. This Is Not "Just a Payment App"

This is:

* A **true burner wallet** — designed to be lost, denied, discarded
* **Digital cash** with cryptographic privacy and no recovery mechanism
* A **ZK-enhanced** private value-transfer protocol
* Web3 that does not feel like Web3
* *"The only wallet where 'I forgot my seed phrase' is the intended behavior."*

---

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a PR.

---

## License

MIT

---

<p align="center">
  <strong>Solana Privacy Hack 2026</strong><br/>
  <em>An empty Fabcash wallet reveals nothing about its past — just like an empty physical wallet.</em>
</p>
