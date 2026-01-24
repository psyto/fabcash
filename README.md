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

## Why Fabcash?

```
Traditional wallet at border crossing:
  "Unlock your wallet" → Must comply → Full history exposed

Fabcash at border crossing:
  "Unlock your wallet" → "It's just a payment app" → Nothing to recover
```

**The problem:** Every digital wallet reveals its entire history — even when empty. Physical wallets don't.

**Fabcash breaks this standard.**

| Feature | Fabcash |
|---------|---------|
| **True Burner Wallet** | No seed phrase. No backup. No recovery. |
| **Empty Wallet = Empty** | No history. Nothing to reveal. |
| **Offline Payments** | Bluetooth/QR. No internet needed. |
| **Only on Solana** | $0.0002 fees make this economically possible. |

---

## Philosophy

### Breaking the Digital Wallet Standard

Every digital wallet has a fundamental flaw that physical wallets don't:

```
Physical wallet (empty):
  Forensic analysis reveals: Nothing
  Past contents: Unknown
  Previous owners: Unknown

Digital wallet (empty):
  Forensic analysis reveals: EVERYTHING
  Past contents: Every transaction ever made
  Previous owners: All counterparties linked forever
```

**This is the broken standard of digital wallets.**

| After emptying wallet | Traditional | Fabcash |
|-----------------------|-------------|---------|
| Past balance visible? | Yes | No |
| Transaction history? | Complete | Shielded |
| Counterparties linked? | Forever | Unlinkable |
| Forensic value? | Total | Zero |

**The goal:** An empty Fabcash wallet should be as forensically useless as an empty physical wallet.

---

### Real-World Inspiration

This project was inspired by [how Ugandans and Iranians turned to offline-capable tools during internet crackdowns](https://www.reuters.com/business/media-telecom/ugandans-iranians-turn-dorseys-messaging-app-bitchat-web-crackdowns-2026-01-14/). When governments restrict internet access, people need payment systems that work without constant connectivity — and protect their privacy when connectivity returns.

---

### The Third Era of Crypto

[Balaji Srinivasan](https://www.youtube.com/watch?v=u3B8xqsf66w) argues that crypto is entering its third era:

| Era | Focus | Example |
|-----|-------|---------|
| Era 1 | Decentralized money | Bitcoin |
| Era 2 | Decentralized compute | Ethereum |
| **Era 3** | **Decentralized privacy** | **Fabcash** |

Previous eras treated privacy as an optional feature — something bolted on top. Era 3 makes privacy the foundation. Not "add encryption" but "design so there's nothing to encrypt."

---

### True Burner Wallet

**Fabcash is a true burner wallet.** This is the foundation of its privacy model.

| Property | Traditional Wallet | Fabcash |
|----------|-------------------|---------|
| Seed phrase | Required | **None** |
| Private key backup | Encouraged | **Impossible** |
| Recovery | From any device | **Never** |
| Longevity | Permanent | **Expendable** |
| Coercion resistance | Weak | **Strong** |

**Why this matters:**

```
Scenario: Device seizure

Traditional wallet:
  1. Device seized
  2. Forced to unlock phone
  3. Forced to reveal seed phrase
  4. Adversary recovers ENTIRE wallet history

Fabcash:
  1. Device seized
  2. Forced to unlock phone
  3. "Where is your seed phrase?" → "There isn't one"
  4. Adversary sees current balance only (if any)
  5. No recovery possible, even under coercion
```

**This is not a missing feature. This is the privacy feature.**

---

### Why Only Solana?

Fabcash's privacy model requires many small transactions:
- Ephemeral addresses (new address per payment)
- Privacy sweeps (moving funds through shielded pools)
- ZK compression (additional on-chain operations)

**This is only economically viable on Solana.**

| Chain | Fee per Tx | 10 Payments/Day | Monthly Cost |
|-------|------------|-----------------|--------------|
| **Solana** | $0.0002 | $0.002 | **$0.06** |
| Bitcoin | $3.00 | $30.00 | $900 |
| Ethereum L1 | $5.00 | $50.00 | $1,500 |

On Bitcoin or Ethereum, Fabcash's privacy model would cost users hundreds of dollars per month in fees alone. **The concept is economically impossible elsewhere.**

---

### Lightning Network Inspiration

Bitcoin's Lightning Network pioneered a key insight: **payments don't need to settle immediately**.

| Aspect | Lightning | Fabcash |
|--------|-----------|---------|
| Core idea | Deferred settlement | Deferred settlement |
| Privacy benefit | Off-chain = less visible | Offline = no network trace |
| Complexity | Channels, routing, watchtowers | Simple signed transactions |
| Settlement | Close channel | Broadcast when online |

**Privacy advantage of deferred settlement:**

```
Immediate settlement (traditional wallet):
  Payment → Internet → RPC → Blockchain
  └─ ISP sees RPC calls
  └─ Government can monitor in real-time

Deferred settlement (Fabcash):
  Payment → Bluetooth (offline) → [wait] → Broadcast later
  └─ No network activity at payment time
  └─ Cannot correlate payment moment with network traffic
```

Lightning proved that instant settlement isn't necessary. Solana made the simpler version economically viable.

---

## Core Features

- **No Seed Phrase** — Nothing to coerce. Nothing to recover. Plausible deniability.
- **Offline Payments** — Bluetooth/QR transfers. Settlement when internet returns.
- **Privacy by Architecture** — Ephemeral addresses + ZK Compression + Shielded settlement.
- **Crackdown Mode** — Emergency button to shield all funds instantly.

---

## Getting Started

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
solana airdrop 2 <YOUR_ADDRESS> --url devnet
```

---

## Project Structure

```
app/
├── (tabs)/
│   ├── index.tsx          # Home - balance, Shield SOL
│   ├── send.tsx           # Send payment flow
│   └── receive.tsx        # Receive payment flow
└── settings.tsx           # Crackdown Mode

lib/
├── solana/                # Wallet, transactions, privacy
├── bluetooth/             # BLE sender/receiver
└── qr/                    # QR generation/scanning

backend-server/            # Privacy Cash backend (AWS ready)
```

---

## Built With

* **[Solana](https://solana.com)** — The only L1 where this concept is economically viable
* **[Light Protocol](https://www.zkcompression.com)** — ZK Compression (99% smaller footprint)
* **[Privacy Cash](https://github.com/Privacy-Cash/privacy-cash)** — Shielded transactions
* **[Expo](https://expo.dev)** — React Native framework

---

## Roadmap

### Completed
- [x] Offline payment flow (BLE + QR)
- [x] Light Protocol integration
- [x] Privacy Cash integration
- [x] Crackdown Mode

### Next
- [ ] Deploy backend to production
- [ ] Mainnet deployment
- [ ] Solana dApp Store submission
- [ ] NFC tap-to-pay (Seeker)

---

## Documentation

| Doc | Description |
|-----|-------------|
| **[PRIVACY.md](PRIVACY.md)** | Deep dive: threat model, privacy modes, technical details |
| **[SECURITY.md](SECURITY.md)** | Security architecture, key handling, cryptographic primitives |
| **[GUIDE.md](GUIDE.md)** | User guide: payment flows, Crackdown Mode |
| **[API.md](API.md)** | Backend API reference |

---

## Contributing

Contributions welcome. Read the Philosophy section above to understand the design principles first.

## License

MIT

---

<p align="center">
  <strong>Solana Privacy Hack 2026</strong><br/>
  <em>An empty Fabcash wallet reveals nothing about its past.</em>
</p>

---

**GitHub:** [psyto/fabcash](https://github.com/psyto/fabcash)
