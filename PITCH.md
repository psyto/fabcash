# Fabcash Pitch Deck

## Solana Privacy Hack 2026

---

# Slide 1: The Problem

## Every Digital Wallet is Broken

```
Physical wallet (empty):     Digital wallet (empty):
├─ Past contents: Unknown    ├─ Past contents: EVERYTHING
├─ Previous txs: Unknown     ├─ Previous txs: Complete history
└─ Forensic value: Zero      └─ Forensic value: Total
```

**The broken standard:** Digital wallets permanently expose your entire financial history — even when empty.

**Real-world impact:**
- Border crossings: "Unlock your wallet" → Full history exposed
- Device seizure: Seed phrase recovery reveals everything
- Internet crackdowns: Uganda & Iran showed people need offline-capable, private payments

---

# Slide 2: The Solution

## Fabcash: True Burner Wallet for Solana

> *"A wallet you can lose. A wallet you can deny. A wallet that works like cash."*

| Feature | Traditional Wallet | Fabcash |
|---------|-------------------|---------|
| Seed phrase | Required | **None** |
| Empty wallet reveals | Everything | **Nothing** |
| Offline payments | No | **Yes (BLE/QR)** |
| Recovery under coercion | Full history | **Impossible** |

**An empty Fabcash wallet is as forensically useless as an empty physical wallet.**

---

# Slide 3: How It Works

## Three Privacy Layers

```
┌─────────────────────────────────────────────────────────┐
│  1. NO SEED PHRASE                                      │
│     └─ Nothing to recover, nothing to coerce            │
├─────────────────────────────────────────────────────────┤
│  2. OFFLINE PAYMENTS                                    │
│     └─ Bluetooth/QR transfer → Settle when online       │
│     └─ No network activity at payment time              │
├─────────────────────────────────────────────────────────┤
│  3. ZK PRIVACY (Light Protocol + Privacy Cash)          │
│     └─ Ephemeral addresses per payment                  │
│     └─ Shielded pools break transaction graph           │
│     └─ 99% smaller on-chain footprint                   │
└─────────────────────────────────────────────────────────┘
```

**Crackdown Mode:** One-tap emergency button shields all funds instantly.

---

# Slide 4: Why Only Solana?

## The Economics of Privacy

Fabcash requires many small transactions (ephemeral addresses, privacy sweeps, ZK operations).

| Chain | Fee/Tx | 10 Payments/Day | Monthly |
|-------|--------|-----------------|---------|
| **Solana** | $0.0002 | $0.002 | **$0.06** |
| Bitcoin | $3.00 | $30 | $900 |
| Ethereum | $5.00 | $50 | $1,500 |

**This privacy model is economically impossible on any other L1.**

Solana's fees make true disposable wallets viable for everyday use.

---

# Slide 5: Technical Stack

## Built on Solana's Privacy Infrastructure

```
┌──────────────────────────────────────────┐
│              FABCASH APP                 │
│         (React Native / Expo)            │
├──────────────────────────────────────────┤
│  Offline Layer     │  Privacy Layer      │
│  ├─ BLE transfers  │  ├─ Light Protocol  │
│  ├─ QR codes       │  │   (ZK Compression)│
│  └─ Deferred settle│  └─ Privacy Cash    │
│                    │      (Shielded txs) │
├──────────────────────────────────────────┤
│              SOLANA DEVNET               │
│         ($0.0002 per transaction)        │
└──────────────────────────────────────────┘
```

**What we built:**
- Offline payment protocol (BLE + QR with deferred settlement)
- Light Protocol integration (compressed accounts)
- Privacy Cash integration (shielded transactions)
- Crackdown Mode (emergency fund shielding)

---

# Slide 6: Demo Flow

## See It In Action

**1. Receive Payment (Offline)**
```
Sender                          Receiver
  │                                │
  │──── BLE/QR signed tx ────────▶│
  │                                │
  │    (No internet needed)        │
```

**2. Settlement (When Online)**
```
Receiver connects to internet
        │
        ▼
Broadcasts deferred transaction
        │
        ▼
Funds arrive in shielded account
```

**3. Crackdown Mode**
```
Emergency detected → One tap → All funds shielded instantly
```

---

# What's Next

| Completed | Roadmap |
|-----------|---------|
| Offline BLE/QR payments | Mainnet deployment |
| Light Protocol (ZK Compression) | Solana dApp Store |
| Privacy Cash (Shielded txs) | NFC tap-to-pay (Seeker) |
| Crackdown Mode | Multi-device mesh payments |

---

## The Vision

**Era 1:** Decentralized money (Bitcoin)
**Era 2:** Decentralized compute (Ethereum)
**Era 3:** Decentralized privacy (**Fabcash**)

> *An empty Fabcash wallet reveals nothing about its past.*

---

**GitHub:** [fabrknt/cash](https://github.com/fabrknt/cash)
**Built with:** Light Protocol | Privacy Cash | Solana

