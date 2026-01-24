# Fabcash — Solana Privacy Hack 2026

## Submission for: Track 01 (Private Payments) + Privacy Cash Bounty

---

# Slide 1: Title

## Fabcash
### True Burner Wallet for Solana

**No Seed Phrase. Offline Payments. Zero-Knowledge Privacy.**

> *"A wallet you can lose. A wallet you can deny. A wallet that works like cash."*

**Built with:** Privacy Cash SDK | Light Protocol | Solana

**GitHub:** [psyto/fabcash](https://github.com/psyto/fabcash)

---

# Slide 2: The Problem

## Every Digital Wallet is Broken

```
Physical wallet (empty):     Digital wallet (empty):
├─ Past contents: Unknown    ├─ Past contents: EVERYTHING
├─ Previous txs: Unknown     ├─ Previous txs: Complete history
└─ Forensic value: Zero      └─ Forensic value: Total
```

### Real-World Impact

- **Border crossings:** "Unlock your wallet" → Full history exposed
- **Device seizure:** Seed phrase recovery reveals everything
- **Internet crackdowns:** Uganda & Iran showed the need for offline, private payments

**An empty digital wallet still exposes your entire financial history.**

---

# Slide 3: The Solution

## Fabcash: Privacy by Architecture

| Feature | Traditional Wallet | Fabcash |
|---------|-------------------|---------|
| Seed phrase | Required | **None** |
| Empty wallet reveals | Everything | **Nothing** |
| Offline payments | No | **Yes (BLE/QR)** |
| Recovery under coercion | Full history | **Impossible** |

**An empty Fabcash wallet is as forensically useless as an empty physical wallet.**

---

# Slide 4: Privacy Cash Integration

## Core Privacy Layer

Fabcash uses **Privacy Cash SDK** for shielded transactions:

```
┌─────────────────────────────────────────────────────────┐
│  FABCASH APP                                            │
│  ├─ Offline Payments (BLE/QR)                          │
│  ├─ No Seed Phrase Architecture                        │
│  └─ Crackdown Mode (Emergency Shield)                  │
├─────────────────────────────────────────────────────────┤
│  PRIVACY CASH SDK                                       │
│  ├─ Shielded SOL Deposits (shield)                     │
│  ├─ Private Withdrawals (withdraw)                     │
│  └─ ZK Proofs for Unlinkability                        │
├─────────────────────────────────────────────────────────┤
│  SOLANA DEVNET                                          │
│  └─ $0.0002 per transaction                            │
└─────────────────────────────────────────────────────────┘
```

### Privacy Cash API Endpoints Used
- `POST /api/shield` — Move SOL to shielded pool
- `POST /api/withdraw` — Private withdrawal to any address
- `GET /api/balance` — Check shielded balance

---

# Slide 5: Three Privacy Layers

## 1. No Seed Phrase
- Nothing to recover = Nothing to coerce
- Private key exists only on device
- Plausible deniability built-in

## 2. Offline Payments
- Bluetooth/QR signed transaction transfer
- No network activity at payment time
- Deferred settlement when online

## 3. Privacy Cash Shielded Settlement
- Ephemeral addresses per payment
- Funds swept through Privacy Cash pool
- Transaction graph cryptographically broken

---

# Slide 6: Crackdown Mode

## Emergency Privacy Protection

One-tap button shields all funds instantly:

```
[Activate Crackdown Mode]
        │
        ▼
┌─────────────────────────────┐
│ 1. Shield all SOL           │ ← Privacy Cash SDK
│ 2. Clear ephemeral keys     │
│ 3. Clear transaction history│
│ 4. Delete wallet            │
└─────────────────────────────┘
        │
        ▼
[App appears freshly installed]
```

**Use case:** Border crossing, protest, device seizure imminent

**Result:** Empty wallet with no history, funds safe in Privacy Cash pool

---

# Slide 7: Demo Flow

## 1. Home Screen
- View balances (Public SOL + Shielded SOL)
- Shield SOL button → Privacy Cash deposit

## 2. Send Payment
- Enter recipient address
- Select privacy mode (Standard/Compressed/Shielded)
- Send via Privacy Cash for maximum privacy

## 3. Receive Payment
- Generate ephemeral address
- Display QR code
- Funds automatically swept to shielded pool

## 4. Crackdown Mode
- Settings → Emergency → Activate
- All funds shielded, history cleared

---

# Slide 8: Why Only Solana?

## Economics of True Privacy

| Chain | Fee/Tx | Monthly (10 tx/day) |
|-------|--------|---------------------|
| **Solana** | $0.0002 | **$0.06** |
| Bitcoin | $3.00 | $900 |
| Ethereum | $5.00 | $1,500 |

**This privacy model requires many small transactions:**
- New ephemeral address per payment
- Privacy sweeps through shielded pools
- ZK compression operations

**Economically impossible on any other L1.**

---

# Slide 9: Technical Stack

| Component | Technology |
|-----------|------------|
| **App** | React Native + Expo |
| **Privacy** | Privacy Cash SDK |
| **Compression** | Light Protocol |
| **Blockchain** | Solana Devnet |
| **Offline** | BLE + QR Code |
| **Storage** | expo-secure-store |

### Key Files
- `lib/solana/privacy-cash.ts` — Privacy Cash integration
- `lib/solana/crackdown.ts` — Emergency shield logic
- `lib/bluetooth/` — Offline payment protocol

---

# Slide 10: What We Built

## Completed Features

- [x] **Privacy Cash Integration** — Shield/withdraw SOL
- [x] **No Seed Phrase** — True burner wallet architecture
- [x] **Offline Payments** — BLE and QR code transfer
- [x] **Crackdown Mode** — One-tap emergency shield
- [x] **Ephemeral Addresses** — New address per receive
- [x] **Demo Mode** — Full app demonstration

## Deployed

- App: iOS Simulator (dev client)
- Backend: Vercel (Privacy Cash API relay)
- Network: Solana Devnet

---

# Slide 11: Target Users

## Who Needs Fabcash?

1. **Activists & Journalists**
   - Operating in surveillance states
   - Need deniable payment history

2. **Travelers**
   - Border crossing privacy
   - Device inspection scenarios

3. **Privacy-Conscious Users**
   - Don't want permanent financial history
   - Prefer cash-like digital payments

4. **Crackdown Regions**
   - Internet blackouts (offline payments)
   - Post-crackdown forensic protection

---

# Slide 12: Roadmap

| Phase | Status |
|-------|--------|
| Privacy Cash SDK integration | ✅ Complete |
| Offline BLE/QR payments | ✅ Complete |
| Crackdown Mode | ✅ Complete |
| Light Protocol (ZK Compression) | ✅ Complete |
| iOS Development Build | ✅ Complete |
| Mainnet deployment | 🔜 Next |
| Android build | 🔜 Next |
| Solana dApp Store | 🔜 Planned |

---

# Slide 13: Why Fabcash Wins

## Unique Value Proposition

1. **Only true burner wallet** — No seed phrase by design
2. **Privacy Cash native** — Not bolted on, architecturally integrated
3. **Offline-first** — Works during internet crackdowns
4. **Crackdown Mode** — Unique emergency feature
5. **Real-world tested concept** — Inspired by Uganda/Iran needs

## Perfect for Privacy Cash Bounty

- Uses Privacy Cash SDK as core privacy layer
- Demonstrates practical use case
- Full working app, not just a concept

---

# Slide 14: Team & Links

## Fabcash

**GitHub:** [github.com/psyto/fabcash](https://github.com/psyto/fabcash)

**Documentation:**
- [README.md](https://github.com/psyto/fabcash/blob/main/README.md) — Philosophy & overview
- [PRIVACY.md](https://github.com/psyto/fabcash/blob/main/PRIVACY.md) — Technical privacy architecture
- [SECURITY.md](https://github.com/psyto/fabcash/blob/main/SECURITY.md) — Security implementation
- [API.md](https://github.com/psyto/fabcash/blob/main/API.md) — Backend API reference
- [GUIDE.md](https://github.com/psyto/fabcash/blob/main/GUIDE.md) — User guide

**Network:** Solana Devnet

**License:** MIT (Open Source)

---

# Thank You

## Fabcash
### An empty wallet that reveals nothing about its past.

**Track:** Private Payments
**Bounty:** Privacy Cash — Best Overall App

*Built for Solana Privacy Hack 2026*
