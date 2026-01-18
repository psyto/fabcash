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

## 1. Core Concept

**A true burner wallet. No seed phrase. No recovery. Just cash.**

Fabcash is digital cash for Solana — designed to be lost, denied, and discarded.

* **No seed phrase:** Nothing to reveal under coercion. Nothing to recover.
* **Offline payments:** Bluetooth/QR work without internet. Settlement happens later.
* **Privacy by default:** ZK compression, shielded pools, and ephemeral keys.
* **Expendable by design:** Keep only what you're willing to lose.

From the user's perspective, Fabcash is a physical wallet that happens to be on your phone.

### True Burner Wallet Philosophy

Most crypto wallets are designed to be permanent. Seed phrases, hardware backups, recovery mechanisms — all assume you want to keep your wallet forever.

**Fabcash assumes the opposite.**

| Traditional Wallet | Fabcash |
|-------------------|---------|
| "Never lose your seed phrase" | There is no seed phrase |
| "Back up your keys" | Keys cannot be backed up |
| "Recover from any device" | Cannot be recovered |
| "Store your life savings" | Store daily spending only |
| "Prove ownership" | Plausible deniability |

**Why this matters:**

```
At a border checkpoint:

  Traditional wallet:
    Officer: "Unlock your crypto wallet"
    You: Must comply (seed phrase exists)
    Result: Full transaction history exposed

  Fabcash:
    Officer: "Unlock your crypto wallet"
    You: "There's nothing to unlock. It's just a payment app."
    Result: At most, current balance visible. No history. No recovery.
```

This is not a limitation — it's the core feature.

### Inspiration

This project was inspired by [how Ugandans and Iranians turned to offline-capable tools during internet crackdowns](https://www.reuters.com/business/media-telecom/ugandans-iranians-turn-dorseys-messaging-app-bitchat-web-crackdowns-2026-01-14/). When governments restrict internet access, people need payment systems that work without constant connectivity. Fabcash brings that resilience to digital payments.

### Philosophical Background

**The Third Era of Crypto: Privacy**

[Balaji Srinivasan](https://www.youtube.com/watch?v=u3B8xqsf66w) argues that crypto is entering its third era:

```
Era 1: Bitcoin (decentralized money)
Era 2: Ethereum (decentralized compute)
Era 3: Privacy (decentralized privacy)
```

Fabcash is built for Era 3. Not just "private transactions" — but a wallet architecture where privacy is the foundation, not a feature.

**Lightning Network, Simplified**

The Bitcoin Lightning Network pioneered a powerful idea: **payments don't need to settle immediately**. State channels enable instant transfers that settle on-chain later.

Fabcash borrows this philosophy but implements it more simply on Solana:

| Lightning Network | Fabcash |
|-------------------|---------|
| Requires channel setup | No setup required |
| Requires channel funding | No channel funding |
| Requires routing | Direct P2P (Bluetooth/QR) |
| Complex state management | Simple signed transactions |
| Settlement: close channel | Settlement: broadcast when online |

**Same insight:** Separate the moment of payment from the moment of settlement.

**Simpler implementation:** Solana's low fees and fast finality mean we don't need the complexity of payment channels. A signed transaction can wait — and when internet returns, it settles for $0.0002.

Lightning proved the concept. Solana made it simple.

### Why Privacy Matters in Crackdowns

In authoritarian contexts, the threat model extends beyond the moment of payment:

```
During crackdown (offline):
  Alice ─── Bluetooth ───> Bob's ephemeral address

When internet returns (government monitoring network):

  Without shielded settlement:
    Bob's ephemeral ──> Bob's main wallet  ← Government sees link

  With Privacy Cash shielded settlement:
    Bob's ephemeral ──> Privacy Pool ──> Bob's main wallet  ← Link broken
```

**Ephemeral addresses** protect privacy at the moment of payment — the sender doesn't learn the receiver's main wallet.

**Privacy Cash** protects privacy at settlement — when users eventually go online, government surveillance cannot link their offline payments to their identity through chain analysis.

This layered approach ensures that even post-crackdown forensic analysis cannot reconstruct payment relationships.

### Why Solana? (Economics Matter)

**Fabcash is only possible on Solana.** This isn't brand loyalty — it's economics.

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

**Why this matters for the burner wallet concept:**

- **Ephemeral addresses** = many small transactions = fees must be negligible
- **Privacy sweeps** = additional transactions = fees add up
- **True "cash" UX** = users shouldn't think about fees

On Bitcoin or Ethereum L1, Fabcash would be economically unusable. The fees would exceed the payment amounts for typical daily spending.

**Solana's economics made Fabcash possible. The concept wouldn't be practical elsewhere.**

---

## 2. Privacy Technology

Fabcash integrates cutting-edge privacy protocols from the Solana ecosystem:

### Light Protocol - ZK Compression

[Light Protocol](https://www.zkcompression.com) provides ZK Compression for Solana, reducing on-chain footprint by up to 99%.

**When it's used:** At settlement time (when transactions are broadcast), not at payment time. This preserves Fabcash's offline-first design.

**How we use it:**
- When connectivity returns, transactions are broadcast with ZK compression
- Smaller on-chain trace = harder to analyze payment patterns
- Lower cost for settlement transactions

```
Payment (offline):     Alice ──Bluetooth──> Bob  [no internet needed]
                              │
Settlement (online):          └──> Broadcast with ZK Compression
                                   └──> 99% smaller on-chain footprint
```

```typescript
import { LightSystemProgram } from '@lightprotocol/stateless.js';

// At settlement: Compress SOL into a ZK-compressed account
await LightSystemProgram.compress({
  payer: wallet.publicKey,
  toAddress: ephemeralAddress,
  lamports: amount,
});
```

### Privacy Cash - Shielded Payments

[Privacy Cash](https://github.com/Privacy-Cash/privacy-cash) enables shielded transactions where deposits and withdrawals are cryptographically unlinkable.

**Why it matters for crackdown scenarios:**
- During offline payments, funds accumulate in ephemeral addresses
- When connectivity returns, users must sweep funds to their main wallet
- Without shielding, this sweep creates an on-chain link that surveillance can trace
- Privacy Cash breaks this link through a shielded pool

**When it's used:** At settlement time, when sweeping funds from ephemeral addresses to main wallet. Not required during offline payment.

**Architecture:**
```
Mobile App ──> Backend API ──> Privacy Cash SDK ──> Solana
                   │
                   └── ZK proof generation requires Node.js runtime
```

The Privacy Cash SDK requires server-side execution for ZK proof generation. The mobile app communicates with a backend service that handles shielding and unshielding operations.

**How we use it:**
- Payment happens offline (Bluetooth/QR) - no Privacy Cash involved
- When user goes online: sweep ephemeral funds through privacy pool
- ZK proof generated server-side for withdrawal
- On-chain: ephemeral address and main wallet cannot be linked
- Even post-crackdown chain analysis cannot reconstruct payment relationships

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

**Key insight:** Privacy technologies enhance the settlement phase without compromising offline payment capability.

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
* No seed phrase to write down.
* Transaction history is optional, not mandatory.

### 3.4 The Cash Metaphor

Fabcash is designed to behave like physical cash:

| Physical Cash | Fabcash |
|--------------|---------|
| Lose wallet → lose money | Lose phone → lose funds |
| No transaction history | History is optional |
| Instant transfer | Instant (settlement later) |
| Anonymous by default | Privacy by default |
| Carry spending money, not savings | Keep small amounts |

This is intentional. For larger amounts, sweep to a backed-up cold wallet.

---

## 4. Design Principles

* **True Burner Wallet:** No seed phrase. No backup. No recovery. Lose the phone, lose the funds. This is the point. (See [Why No Seed Phrase?](#why-no-seed-phrase))
* **Expendable by Design:** Keep only what you're willing to lose. Fabcash is a spending wallet, not a savings account.
* **Plausible Deniability:** Nothing to prove you own crypto. No hardware wallet signatures. No seed phrases to coerce.
* **Local-First:** Bluetooth/QR as primary transport. Internet is optional. Blockchain stays in the background.
* **Ephemeral Addresses:** New keypair per transaction. Addresses are banknotes, not identity.
* **ZK-Enhanced Privacy:** Light Protocol compression + Privacy Cash shielding for cryptographic privacy.
* **Trustless:** Trust only cryptographic signatures, not counterparties or devices.

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

### 7.1 Threat Model

Fabcash is designed for users in hostile environments where:

| Threat | Description | Mitigation |
|--------|-------------|------------|
| **Sender surveillance** | Sender tries to track receiver's wallet | Ephemeral addresses |
| **Chain analysis** | Third party analyzes on-chain patterns | ZK compression reduces footprint |
| **Post-crackdown forensics** | Government analyzes chain after connectivity returns | Privacy Cash shielded settlement |
| **Network monitoring** | ISP/government monitors RPC calls | Deferred settlement, Tor-compatible |

### 7.2 Layered Privacy Architecture

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

### 7.3 On-Chain Privacy

| Layer | Technology | Benefit |
|-------|------------|---------|
| Address | Ephemeral keys | No address reuse |
| Compression | Light Protocol | 99% smaller footprint |
| Shielding | Privacy Cash | Unlinkable transactions |

### 7.5 Network-Layer Privacy

* Bluetooth MAC randomization
* Session keys per connection
* No fixed device identifiers

### 7.6 Double-Spend Considerations

Offline double-spend prevention is impossible in a decentralized manner.

* Offline payments are marked "pending"
* Finality exists only after on-chain confirmation
* This mirrors physical cash — suitable for small amounts

### 7.7 Why No Seed Phrase?

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

**The cash metaphor:**
- Physical wallet: Lose it → lose the cash inside
- Fabcash: Lose phone → lose the funds
- Both: Keep only what you're willing to lose

**Best practice:**
1. Keep small amounts in Fabcash (daily spending money)
2. Use Privacy Cash to sweep larger amounts to a backed-up cold wallet
3. Treat Fabcash like a physical wallet, not a savings account

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

* A **true burner wallet** — designed to be lost, denied, discarded.
* **Digital cash** with cryptographic privacy and no recovery mechanism.
* A **ZK-enhanced** private value-transfer protocol.
* Web3 that does not feel like Web3.
* *"The only wallet where 'I forgot my seed phrase' is the intended behavior."*

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

## Built With

* **[Solana](https://solana.com)** - The only L1 where this concept is economically viable ($0.0002 fees, 400ms finality)
* **[Light Protocol](https://www.zkcompression.com)** - ZK Compression for Solana
* **[Privacy Cash](https://github.com/Privacy-Cash/privacy-cash)** - Shielded transaction protocol
* **[Expo](https://expo.dev)** - React Native framework
* **[@solana/web3.js](https://github.com/solana-labs/solana-web3.js)** - Solana JavaScript SDK

---

## Solana Mobile

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

Seed Vault is excellent for main wallets holding significant funds. But Fabcash is daily spending cash where **privacy > fund security**.

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

## Roadmap

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
