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

## Learn More

**[Read PRIVACY.md](PRIVACY.md)** for the full deep dive:
- Philosophical background (Balaji's privacy era, Lightning inspiration)
- Why Solana is the only viable chain
- Breaking the digital wallet standard
- Complete threat model
- Privacy modes and code examples
- Crackdown Mode details

---

## Contributing

Contributions welcome. See PRIVACY.md to understand the design philosophy first.

## License

MIT

---

<p align="center">
  <strong>Solana Privacy Hack 2026</strong><br/>
  <em>An empty Fabcash wallet reveals nothing about its past.</em>
</p>
