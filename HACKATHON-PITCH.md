# Fabcash — 3-Minute Demo Script

## Solana Privacy Hack 2026
**Track:** Private Payments | **Bounty:** Privacy Cash

---

## Philosophy-First Structure (3:00 total)

| Section | Duration | Focus |
|---------|----------|-------|
| **The Question** | 0:40 | Philosophy hook — the broken standard |
| **The Answer** | 0:25 | Fabcash introduction |
| **The Proof** | 1:25 | Demo showing philosophy in action |
| **The Vision** | 0:30 | Close with manifesto |

---

## Script

### [0:00-0:40] The Question (Philosophy Hook)

**[Black screen with white text, then transition to physical vs digital wallet comparison]**

*"Privacy is necessary for an open society."*

That's the opening line of the Cypherpunk Manifesto. Written in 1993.

Thirty years later, I want to ask a simple question.

**[Show physical wallet image]**

When you empty a physical wallet, what does forensic analysis reveal?

Nothing. Past contents unknown. Previous transactions unknown. Forensic value: zero.

**[Show digital wallet image]**

When you empty a digital wallet, what does forensic analysis reveal?

Everything. Every transaction you ever made. Every counterparty you ever paid. Forever.

**[Pause]**

This is the broken standard of digital wallets.

Every wallet — Phantom, MetaMask, Coinbase — accepts this as normal.

We don't.

---

### [0:40-1:05] The Answer (Fabcash Introduction)

**[Show Fabcash logo]**

Fabcash is a true burner wallet for Solana.

Our philosophy fits in one sentence:

**[Text on screen]**

> *"An empty Fabcash wallet reveals nothing about its past."*

**[Show three principles]**

Three principles make this possible:

**One: Nothing to coerce.** There is no seed phrase. If someone demands your recovery phrase — there isn't one.

**Two: Nothing to monitor.** Payments happen offline via Bluetooth. No network activity to surveil.

**Three: Nothing to trace.** Settlement happens through Privacy Cash and Light Protocol. ZK compression plus shielded pools — the transaction graph is broken.

Let me show you.

---

### [1:05-2:30] The Proof (Demo)

**[Screen recording of iOS Simulator]**

#### Home Screen — "See What Matters" (15 sec)

**[Show home screen]**

Here's the home screen. Two balances: public SOL and shielded SOL.

The shielded balance is in Privacy Cash — invisible to chain analysis.

**[Tap Shield SOL]**

Watch what happens when I shield funds.

**[Confirm and wait]**

The SOL moves into Privacy Cash. One moment it's visible on-chain. The next, it's not.

This is "nothing to trace" in action.

---

#### Crackdown Mode — "Nothing to Reveal" (35 sec)

**[Navigate to Settings → Emergency]**

Now the unique feature. Crackdown Mode.

Imagine: border crossing. Protest. Device seizure imminent.

**[Show the Crackdown Mode button]**

One tap.

**[Tap Activate, then Confirm]**

Watch what happens.

**[Show progress: shielding, clearing keys, clearing history]**

All SOL instantly shields to Privacy Cash. Ephemeral keys deleted. Transaction history gone. Wallet destroyed.

**[Show completion]**

The app now looks freshly installed. There is nothing to reveal.

But my funds? Safe in Privacy Cash. Recoverable later, elsewhere.

**[Pause]**

*This* is what "true burner wallet" means. Not hidden history. No history.

---

#### Send Payment — "Choice of Privacy" (20 sec)

**[Navigate to Send tab]**

Sending a payment.

**[Enter address and amount]**

I enter the recipient and amount. But here's where philosophy meets practice.

**[Show privacy mode selector]**

Three privacy modes. Standard. Compressed — that's Light Protocol's ZK compression. And Shielded — Privacy Cash's private pool.

**[Select Shielded]**

Shielded uses Privacy Cash. The recipient gets funds, but the transaction graph? Broken.

**[Tap Continue]**

---

#### Receive Payment — "No Persistent Identity" (15 sec)

**[Navigate to Receive tab]**

Receiving a payment.

**[Show QR code with address]**

Fresh ephemeral address. Every. Single. Time.

**[Tap to copy]**

This address will never be used again. Nothing links this payment to the next one.

---

### [2:30-3:00] The Vision (Close with Manifesto)

**[Return to philosophy slides]**

Fabcash isn't just a wallet. It's a proof of concept.

**[Show Era 3 concept]**

A proof that Era 3 wallets are possible. Wallets where:

- Empty means empty
- Coercion yields nothing
- Privacy is the architecture, not a feature

**[Show Cypherpunk quote]**

> *"Privacy is necessary for an open society."*

Thirty years ago, the cypherpunks wrote that manifesto.

Today, we built a wallet that finally delivers it.

**[Show GitHub and final tagline]**

Fabcash. An empty wallet that reveals nothing about its past.

github.com/psyto/fabcash

Thank you.

---

## Recording Notes

### Key Philosophy Moments to Emphasize

1. **The Question** (0:00-0:40)
   - Pause after "What does forensic analysis reveal?"
   - Let the comparison sink in
   - "We don't." should land with conviction

2. **The Single Sentence** (0:50)
   - Display on screen for 3+ seconds
   - This is the most quotable moment

3. **Crackdown Mode** (1:25-2:00)
   - This is the emotional peak
   - "Nothing to reveal" should feel powerful
   - Pause after showing completion

4. **The Close** (2:40-3:00)
   - Return to philosophical tone
   - End on the manifesto callback

### Technical Setup

- iOS Simulator: iPhone 16 Pro
- Demo mode: Enabled (instant responses)
- Screen recording: `./scripts/record-demo.sh`

### Pacing Notes

- **Slower than you think.** Philosophy needs room to breathe.
- Pause after key statements. Let them land.
- The demo should feel deliberate, not rushed.

---

## Quotable Lines

Use these for maximum impact:

1. *"An empty Fabcash wallet reveals nothing about its past."*

2. *"No seed phrase is not a missing feature. It IS the privacy feature."*

3. *"Not hidden history. No history."*

4. *"Privacy is the architecture, not a feature."*

5. *"A wallet you can lose. A wallet you can deny. A wallet that works like cash."*

6. *"Thirty years ago, the cypherpunks wrote that manifesto. Today, we built a wallet that finally delivers it."*

---

## Submission Checklist

- [ ] Demo video (max 3 minutes) — Philosophy-first structure
- [ ] GitHub repository (open source) — github.com/psyto/fabcash
- [ ] README with documentation
- [ ] Deployed to Solana devnet
- [ ] Privacy Cash SDK integration documented
- [ ] Light Protocol API integration documented

---

## Target Tracks & Bounties

### Primary Track
**Track 01: Private Payments** ($15,000 prize pool)

### Sponsor Bounty
**Privacy Cash** ($15,000 total)
- **Best Overall App: $6,000** ← Primary target
- Best Integration: $6,000
- Honorable Mentions: $3,000

### Why Philosophy Wins

| Typical Submission | Fabcash |
|--------------------|---------|
| "We built X with Y" | "We questioned a fundamental assumption" |
| Technical-first | Philosophy-first |
| Feature list | Manifesto |
| "Privacy features" | "Privacy architecture" |

**Judges remember philosophy. They forget feature lists.**
