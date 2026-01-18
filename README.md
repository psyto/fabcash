# Fabcash

### Offline P2P Payments on Solana

**Bluetooth / QR × Solana**

---

## 1. Core Concept

**Feels like handing over cash — settles on Solana later.**

This product enables in-person, mobile, peer-to-peer payments using Bluetooth or QR codes, even when the internet is unavailable or unstable.

* **At the moment of exchange:** Devices communicate directly via Bluetooth or QR.
* **Behind the scenes:** A signed Solana transaction is broadcast later when connectivity is restored.
* **Privacy by design:** One-time addresses and ephemeral keys minimize on-chain linkage.

From the user's perspective, the payment is completed on the spot.

### Inspiration

This project was inspired by [how Ugandans and Iranians turned to offline-capable tools during internet crackdowns](https://www.reuters.com/business/media-telecom/ugandans-iranians-turn-dorseys-messaging-app-bitchat-web-crackdowns-2026-01-14/). When governments restrict internet access, people need payment systems that work without constant connectivity. Fabcash brings that resilience to digital payments.

---

## 2. Product Philosophy

### 2.1 Core Belief

The transfer of value should be completed at the moment two people meet. Internet connectivity, KYC, account registration, and centralized servers are not the essence of payments.

**The essence is simple:** Value moves, here and now, with certainty. Blockchain exists to finalize settlement — not to dominate the user experience.

### 2.2 Problems With Existing Web3 Payments

* **Contradictions:** "Decentralized" tools often rely on constant online RPC and server dependency. "Anonymous" tools use permanent addresses that create fully traceable behavior.
* **Mismatch with Real-World Use:** Flea markets, splitting bills, tipping, and casual P2P transfers are face-to-face interactions that currently still require internet access.

### 2.3 Target Experience (UX First)

The ideal flow: **Meet → Bring phones close → Confirm amount → Send → Done.**

* No login.
* No accounts.
* Transaction history is optional, not mandatory.

---

## 3. Design Principles

* **Local-First:** Bluetooth/QR (and eventually NFC) as the primary transport. The internet is optional and can be used later. Blockchain stays in the background.
* **Ephemeral Addresses by Default:** New keypair per transaction. In-person payments ≠ persistent identity. Addresses are closer to banknotes than business cards.
* **Trustless by Construction:** Do not trust the counterparty or the device; trust only cryptographic signatures and verification.
* **Deterministic Outcomes:** No "maybe it fails later" UX (Lightning-style uncertainty). The transaction is either formed correctly or rejected on the spot.

---

## 4. User Experience Design

### 4.1 Typical Scenarios

* Cafés, bars, and events.
* Friends splitting expenses.
* Flea markets and pop-up shops.
* Situations requiring immediate payment without Wi-Fi/Cellular.
* **Regions with internet restrictions or crackdowns.**

### 4.2 Bluetooth Payment Flow (Primary)

1. **Payee (Receiver):** Opens app → "Receive" → Generates ephemeral address → Waits for Bluetooth connection.
2. **Payer (Sender):** Opens app → "Pay" → Detects nearby device → Enters amount → Confirms.
3. **Device Handoff:** Sender creates a signed Solana transaction. Transaction is sent via Bluetooth. Receiver verifies signature and amount.
4. **Completion:** Both devices display: "Payment complete (pending settlement)." Either party can later broadcast the transaction to Solana.

### 4.3 QR Code Flow (Fallback)

Used when Bluetooth is unavailable.

* **Payee** displays QR containing: `{ recipient, amount, memo, nonce }`
* **Payer** scans QR → signs transaction → broadcasts immediately or later.

---

## 5. Technical Architecture

### 5.1 Key & Address Strategy

* **Policy:** Never reuse addresses; never directly link to a main wallet.
* **Implementation:** New ephemeral keypair per transaction. Funds are later swept to the main wallet. This is simple and idiomatic for Solana.

### 5.2 Transaction Structure

* **Instruction:** `SystemProgram::Transfer`
* **From:** Sender main wallet
* **To:** Ephemeral address
* **Amount:** SOL or SPL token
* **Memo (Mandatory):** Includes transaction ID, timestamp, and optional hash for reconciliation.

### 5.3 Bluetooth Payload

```json
{
  "tx_base64": "...",
  "sender_pubkey": "...",
  "amount": "1.25",
  "token": "USDC",
  "expires_at": 1730000000
}
```

*Bluetooth is merely a transport layer. Trust comes solely from cryptographic signatures.*

### 5.4 Deferred Broadcasting

Either sender or receiver may broadcast using `sendRawTransaction` via Solana RPC. On success, status updates to finalized.

---

## 6. Security & Fraud Considerations

### 6.1 Double-Spend Reality

Offline double-spend prevention is impossible in a decentralized manner.

* Offline payments are marked "pending."
* Finality exists only after on-chain confirmation.
* **Context:** This mirrors physical cash; counterfeit detection happens after acceptance. High-value payments are explicitly out of scope.

### 6.2 Replay Protection

* Unique Nonces.
* Expiry timestamps.
* Memo hashing.

### 6.3 Network-Layer Privacy

* Bluetooth MAC randomization
* Session keys
* No fixed device identifiers

---

## 7. Why Solana

Solana is chosen for alignment, not just speed:

* **Low fees:** Viable for small, in-person payments.
* **Fast finality:** Socially acceptable waiting time once online.
* **Ed25519:** Lightweight mobile signing.
* **Cash-like:** Solana is the blockchain closest to behaving like physical currency.

---

## 8. Architecture Overview

```
[ Mobile A ]  <-- Bluetooth / QR -->  [ Mobile B ]
      |                                     |
      |---- signed tx (offline) ----------->|
      |                                     |
      |------------ later RPC broadcast ---> Solana
```

---

## 9. Trade-offs

| Aspect | Rating |
| --- | --- |
| **User Experience** | ⭐⭐⭐⭐⭐ |
| **Immediacy** | ⭐⭐⭐⭐ |
| **Absolute Security** | ⭐⭐ |
| **Privacy** | ⭐⭐⭐ |
| **High-Value Use** | ❌ (Not Recommended) |

Best suited for small, in-person, instant payments.

---

## 10. This Is Not "Just a Payment App"

This is:

* **Digital cash.**
* A private value-transfer protocol.
* Web3 that does not feel like Web3.
* *"Payments more flexible than cash, without thinking about blockchains."*

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

## Requirements Specification

### Scope

* P2P, in-person payments (mobile only).
* Small to medium amounts.
* No KYC, no accounts.

### Functional Requirements

* BLE and QR communication.
* Ephemeral key generation per transaction.
* Online and offline transaction flows.
* Clear pending / finalized status display.

### Non-Functional Requirements

* Ed25519 signatures.
* No server-side secret storage.
* Address reuse rate: 0%.
* Average in-person payment time: < 5 seconds.

### Constraints

* Offline payments are provisional.
* No fiat on/off-ramps.
* No guarantee against offline double spending.

---

## Roadmap

- [ ] NFC support for tap-to-pay
- [ ] Mainnet deployment
- [ ] Multi-token support
- [ ] Transaction history sync
- [ ] Mesh network broadcasting (device-to-device relay)

---

## License

MIT
