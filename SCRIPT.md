# Fabcash Pitch Script

## Solana Privacy Hack 2026

---

## Slide 1: Title

**[OPENING - 30 seconds]**

"Fabcash is a true burner wallet for Solana.

A wallet you can lose. A wallet you can deny. A wallet that works like cash.

We built it because every digital wallet today has a fundamental problem that physical wallets don't have."

---

## Slide 2: The Problem

**[PROBLEM - 45 seconds]**

"Here's the problem: When you empty a physical wallet, forensic analysis reveals nothing. No one can tell what was in it yesterday, or who you paid last month.

But when you empty a digital wallet? Everything is still there. Every transaction. Every counterparty. Forever.

This isn't a theoretical concern. At border crossings, people are forced to unlock their phones. Their entire financial history is exposed. During internet crackdowns in Uganda and Iran, we saw people desperately need payment systems that work offline — and protect their privacy when connectivity returns.

The current standard of digital wallets is broken. We're here to fix it."

---

## Slide 3: The Solution

**[SOLUTION - 45 seconds]**

"Fabcash is a true burner wallet. Here's what that means:

No seed phrase. There's nothing to recover, nothing to coerce out of you. If someone seizes your device and demands your seed phrase, there isn't one.

Empty wallet reveals nothing. Unlike every other wallet where an empty balance still exposes your entire history.

Offline payments. You can send money over Bluetooth or QR codes without any internet connection. Settlement happens later.

And recovery under coercion? Impossible. That's not a bug — that's the entire point.

An empty Fabcash wallet is as forensically useless as an empty physical wallet."

---

## Slide 4: How It Works

**[TECHNICAL - 45 seconds]**

"We achieve this through three privacy layers:

First, no seed phrase. The private key exists only on device, only in memory when needed. Nothing to backup means nothing to extract.

Second, offline payments. Transactions are signed and transferred via Bluetooth or QR code. They settle when you're back online. This means there's no network activity at the moment of payment — nothing to correlate, nothing to monitor.

Third, ZK privacy through Light Protocol and Privacy Cash. Every payment uses a new ephemeral address. Funds move through shielded pools that break the transaction graph. And ZK compression means 99% smaller on-chain footprint.

Plus Crackdown Mode — one tap to shield all funds instantly when you need it."

---

## Slide 5: Why Solana

**[ECONOMICS - 30 seconds]**

"Why did we build this on Solana? Because it's the only chain where this is economically possible.

Our privacy model requires lots of small transactions — new addresses for every payment, privacy sweeps, ZK operations.

On Solana, that costs 6 cents a month. On Bitcoin, $900 a month. On Ethereum, $1,500.

This concept — true disposable wallets for everyday use — is economically impossible on any other Layer 1. Solana's fees make it viable."

---

## Slide 6: Demo Flow

**[DEMO - 60 seconds]**

"Let me show you how it works.

**Offline payment:** The sender signs a transaction on their device. It transfers to the receiver over Bluetooth or QR code. No internet required on either side. The receiver now has a valid signed transaction.

**Deferred settlement:** When the receiver gets back online — could be minutes, could be days — they broadcast the transaction. The funds arrive in their shielded account. Because settlement is deferred, there's no network traffic at the moment of payment. You can't correlate when the payment happened with any network activity.

**Crackdown Mode:** If you're in an emergency situation — protest, border crossing, whatever — one tap. All your funds are instantly shielded. The wallet looks empty, and there's no history to reveal."

---

## Slide 7: Vision & Roadmap

**[CLOSING - 45 seconds]**

"We believe crypto is entering its third era.

Era 1 was decentralized money — Bitcoin proved it was possible.

Era 2 was decentralized compute — Ethereum and smart contracts.

Era 3 is decentralized privacy. Not privacy as a feature bolted on top, but privacy as the foundation.

We've already built the core: offline Bluetooth and QR payments, Light Protocol integration for ZK compression, Privacy Cash integration for shielded transactions, and Crackdown Mode.

Next: mainnet deployment, Solana dApp Store, and NFC tap-to-pay on Seeker devices.

**Fabcash.** An empty wallet that reveals nothing about its past.

Thank you."

---

## Q&A Prep

**Q: Why no seed phrase? Isn't that dangerous?**
> "That's the point. If you want a permanent wallet with recovery, use Phantom. Fabcash is for funds you're willing to lose in exchange for funds that can't be traced or coerced. It's a burner — like a prepaid phone."

**Q: What if the device is lost before settlement?**
> "Those funds are gone. That's the trade-off for true privacy. Keep small amounts in Fabcash, larger holdings in a traditional wallet."

**Q: How do you prevent double-spending with offline transactions?**
> "The receiver takes on settlement risk. For small everyday payments, this is acceptable. For large amounts, wait for on-chain confirmation."

**Q: Why not just use Tornado Cash / mixers?**
> "Mixers hide the trail but your wallet still has a history. Fabcash has no history to hide. Plus: offline payments, no seed phrase, and Crackdown Mode."

**Q: Is this legal?**
> "Fabcash is a payment tool, like cash. Cash isn't illegal. Privacy isn't illegal. We're building for activists, journalists, and anyone who needs financial privacy."

---

## Timing

| Slide | Duration | Cumulative |
|-------|----------|------------|
| 1. Title | 30s | 0:30 |
| 2. Problem | 45s | 1:15 |
| 3. Solution | 45s | 2:00 |
| 4. How It Works | 45s | 2:45 |
| 5. Why Solana | 30s | 3:15 |
| 6. Demo | 60s | 4:15 |
| 7. Vision | 45s | 5:00 |

**Total: ~5 minutes** (leaves time for Q&A in a typical 7-10 minute slot)
