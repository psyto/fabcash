# Fabcash — Solana Privacy Hack 2026

## Submission for: Track 01 (Private Payments) + Privacy Cash Bounty

---

# Slide 1: The Manifesto

## "Privacy is necessary for an open society."
### — Cypherpunk Manifesto, 1993

Every cypherpunk knows this truth.

But 30 years later, **every digital wallet still betrays it.**

We built Fabcash to finally fix this.

---

# Slide 2: The Broken Standard

## A Question No One Asks

**What does an empty physical wallet reveal about its past?**

```
Physical wallet (empty):
├─ Past contents: Unknown
├─ Previous transactions: Unknown
├─ Previous counterparties: Unknown
└─ Forensic value: Zero
```

**What does an empty digital wallet reveal about its past?**

```
Digital wallet (empty):
├─ Past contents: EVERYTHING
├─ Previous transactions: Complete history
├─ Previous counterparties: Linked forever
└─ Forensic value: Total surveillance
```

**This is the broken standard of digital wallets.**

Every wallet — Phantom, MetaMask, Coinbase — accepts this as normal.

We don't.

---

# Slide 3: The Insight

## An Empty Wallet Should Be Empty

> *"An empty Fabcash wallet reveals nothing about its past."*

This single sentence is our entire philosophy.

| After emptying wallet | Traditional | Fabcash |
|-----------------------|-------------|---------|
| Past balance visible? | Yes | **No** |
| Transaction history? | Complete | **Gone** |
| Counterparties linked? | Forever | **Unlinkable** |
| Forensic value? | Total | **Zero** |

**An empty Fabcash wallet is as forensically useless as an empty physical wallet.**

This is not a feature. This is the point.

---

# Slide 4: Real-World Inspiration

## Why This Matters Now

In January 2025, [Reuters reported](https://www.reuters.com/business/media-telecom/ugandans-iranians-turn-dorseys-messaging-app-bitchat-web-crackdowns-2026-01-14/) how Ugandans and Iranians turned to offline-capable tools during internet crackdowns.

**The problem they faced:**
- Government shuts down internet
- Need to transact during blackout
- When internet returns, government monitors everything
- Your payment history becomes evidence

**What they needed:**
- Payments that work offline
- History that can disappear
- Wallets that can be denied

**Fabcash is what they needed.**

---

# Slide 5: The Third Era

## Where Crypto Is Going

[Balaji Srinivasan](https://www.youtube.com/watch?v=u3B8xqsf66w) argues crypto is entering its third era:

| Era | Focus | Philosophy |
|-----|-------|------------|
| Era 1 | Decentralized money | "Not your keys, not your coins" |
| Era 2 | Decentralized compute | "Code is law" |
| **Era 3** | **Decentralized privacy** | **"Nothing to hide = Nothing to reveal"** |

Previous eras treated privacy as optional — something encrypted on top.

**Era 3 makes privacy the foundation.**

Not "add encryption." Design so **there's nothing to encrypt.**

Fabcash is an Era 3 wallet.

---

# Slide 6: True Burner Wallet

## A New Category

**Fabcash is a true burner wallet.** We're defining the category.

| Property | Traditional Wallet | Fabcash |
|----------|-------------------|---------|
| Seed phrase | Required | **None** |
| Private key backup | Encouraged | **Impossible** |
| Recovery | From any device | **Never** |
| Longevity | Permanent | **Expendable** |
| Coercion resistance | Weak | **Strong** |

**The scenario:**

```
Traditional wallet under coercion:
  "Where is your seed phrase?"
  → Must comply
  → Adversary recovers ENTIRE wallet history

Fabcash under coercion:
  "Where is your seed phrase?"
  → "There isn't one."
  → Nothing to recover, even under torture
```

**No seed phrase is not a missing feature. It IS the privacy feature.**

---

# Slide 7: The Philosophy in Practice

## Three Principles, Three Features

### Principle 1: Nothing to Coerce
**Feature:** No seed phrase architecture
- Key exists only on device, only when needed
- Lose device = lose funds (intentional)
- Plausible deniability by design

### Principle 2: Nothing to Monitor
**Feature:** Offline payments
- Bluetooth/QR signed transaction transfer
- No network activity at payment time
- Settlement happens later, elsewhere

### Principle 3: Nothing to Trace
**Feature:** Privacy Cash shielded settlement
- Ephemeral addresses per payment
- Funds swept through Privacy Cash pool
- Transaction graph cryptographically broken

---

# Slide 8: Privacy Cash Integration

## The Privacy Layer

Fabcash uses **Privacy Cash SDK** as its core privacy infrastructure:

```
┌─────────────────────────────────────────────────────────┐
│  FABCASH PHILOSOPHY                                     │
│  "An empty wallet reveals nothing"                      │
├─────────────────────────────────────────────────────────┤
│  FABCASH APP                                            │
│  ├─ No Seed Phrase (nothing to coerce)                 │
│  ├─ Offline Payments (nothing to monitor)              │
│  └─ Crackdown Mode (emergency disappear)               │
├─────────────────────────────────────────────────────────┤
│  PRIVACY CASH SDK                                       │
│  ├─ shield() — Move funds to private pool              │
│  ├─ withdraw() — Private withdrawal anywhere           │
│  └─ ZK proofs — Break transaction graph                │
├─────────────────────────────────────────────────────────┤
│  SOLANA                                                 │
│  └─ $0.0002/tx makes this economically possible        │
└─────────────────────────────────────────────────────────┘
```

**Privacy Cash makes our philosophy technically achievable.**

---

# Slide 9: Crackdown Mode

## The Emergency Button

**Scenario:** Border crossing. Protest. Device seizure imminent.

**One tap:**

```
[Activate Crackdown Mode]
        │
        ▼
┌─────────────────────────────┐
│ 1. Shield ALL SOL           │ ← Privacy Cash
│ 2. Clear ephemeral keys     │
│ 3. Clear transaction history│
│ 4. Delete wallet            │
└─────────────────────────────┘
        │
        ▼
[App appears freshly installed]
[Funds safe in Privacy Cash pool]
[Nothing to reveal under coercion]
```

**This is what "true burner wallet" means in practice.**

The philosophy made real: An empty wallet that reveals nothing.

---

# Slide 10: Why Only Solana?

## The Economics of Philosophy

Our philosophy requires many small transactions:
- New address per payment (privacy)
- Privacy sweeps through pools (unlinkability)
- Instant settlement when online (usability)

**Only Solana makes this economically viable:**

| Chain | Fee/Tx | Monthly (10 tx/day) |
|-------|--------|---------------------|
| **Solana** | $0.0002 | **$0.06** |
| Bitcoin | $3.00 | $900 |
| Ethereum | $5.00 | $1,500 |

On Bitcoin or Ethereum, our philosophy would cost users $1,000+/month.

**True burner wallets are economically impossible elsewhere.**

Solana's fees don't just enable our tech. They enable our philosophy.

---

# Slide 11: Demo Summary

## The Philosophy in Action

| Feature | Philosophy | Implementation |
|---------|------------|----------------|
| **Home Screen** | See what matters | Public + Shielded balance |
| **Shield SOL** | Funds can disappear | Privacy Cash deposit |
| **Send** | Choice of privacy | Standard/Compressed/Shielded modes |
| **Receive** | No persistent identity | Fresh ephemeral address each time |
| **Crackdown Mode** | Nothing to reveal | One-tap emergency shield |

**Watch the demo video to see each principle in action.**

---

# Slide 12: What We Built

## Philosophy → Code → Working App

### Completed
- [x] Privacy Cash SDK integration (shield, withdraw, balance)
- [x] No seed phrase architecture (true burner)
- [x] Offline payment protocol (BLE + QR)
- [x] Crackdown Mode (emergency shield)
- [x] Ephemeral addresses (per-payment unlinkability)
- [x] iOS development build (working demo)

### Deployed
- **App:** iOS Simulator (dev client)
- **Backend:** Vercel (Privacy Cash relay)
- **Network:** Solana Devnet
- **Source:** Open source (MIT)

---

# Slide 13: Why Fabcash Wins

## Not Just Another Wallet

| Other Projects | Fabcash |
|----------------|---------|
| "We added privacy features" | "We removed the need for them" |
| "Encrypt your seed phrase" | "Don't create one" |
| "Hide your transactions" | "Have nothing to hide" |
| "Privacy is an option" | "Privacy is the architecture" |

### For Privacy Cash Bounty

We don't just *use* Privacy Cash. We built an entire wallet philosophy around what Privacy Cash makes possible.

**Privacy Cash enables:**
- Crackdown Mode (instant shield)
- Shielded settlement (unlinkable receives)
- Private sends (break transaction graph)

**Without Privacy Cash, Fabcash's philosophy is impossible.**

---

# Slide 14: The Vision

## What We're Really Building

Fabcash is a proof of concept for **Era 3 wallets**.

A future where:
- Empty wallets reveal nothing
- Coercion yields nothing
- Surveillance finds nothing
- Privacy is the default, not the option

> *"Privacy is necessary for an open society."*

We agree. So we built a wallet that actually delivers it.

---

# Thank You

## Fabcash

### An empty wallet that reveals nothing about its past.

**GitHub:** [github.com/psyto/fabcash](https://github.com/psyto/fabcash)

**Track:** Private Payments
**Bounty:** Privacy Cash — Best Overall App

---

*"A wallet you can lose. A wallet you can deny. A wallet that works like cash."*

**Built for Solana Privacy Hack 2026**
