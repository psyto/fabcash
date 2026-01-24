# Fabcash — 3-Minute Demo Script

## Solana Privacy Hack 2026
**Track:** Private Payments | **Bounty:** Privacy Cash

---

## Video Structure (3:00 total)

| Section | Duration | Content |
|---------|----------|---------|
| Hook & Problem | 0:30 | Why wallets are broken |
| Solution Overview | 0:30 | Fabcash introduction |
| Live Demo | 1:30 | App walkthrough |
| Closing | 0:30 | Summary & call to action |

---

## Script

### [0:00-0:30] Hook & Problem

**[Show comparison graphic or text on screen]**

"When you empty a physical wallet, forensic analysis reveals nothing. But when you empty a digital wallet? Everything is still there. Every transaction. Every counterparty. Forever.

At border crossings, during device seizures, in internet crackdowns — your wallet's history becomes a liability.

This is the broken standard of digital wallets. We built Fabcash to fix it."

---

### [0:30-1:00] Solution Overview

**[Show Fabcash logo and key features]**

"Fabcash is a true burner wallet for Solana, built on Privacy Cash SDK.

Three things make it different:

**One:** No seed phrase. There's nothing to recover, nothing to coerce. If someone demands your seed phrase — there isn't one.

**Two:** Offline payments. Send money over Bluetooth or QR codes. No internet required.

**Three:** Privacy Cash integration. Funds move through shielded pools, breaking the transaction graph.

Let me show you how it works."

---

### [1:00-2:30] Live Demo

**[Screen recording of iOS Simulator]**

#### Home Screen (15 sec)
"Here's the home screen. You can see public SOL balance and shielded balance separately.

The shielded balance uses Privacy Cash — funds here are protected from chain analysis."

**[Tap Shield SOL button]**

"Tapping 'Shield SOL' moves funds into the Privacy Cash pool."

**[Confirm shield]**

"The Privacy Cash SDK handles the ZK proofs. My SOL is now in the shielded pool."

---

#### Send Payment (30 sec)
**[Navigate to Send tab]**

"Sending a payment. I'll enter a recipient address and amount."

**[Enter address and 0.01 SOL]**

"Here's where Privacy Cash integration matters. I can choose my privacy mode."

**[Select Shielded mode]**

"Shielded mode uses Privacy Cash for maximum privacy. The recipient gets funds, but the transaction graph is broken."

**[Tap Continue, show confirmation]**

"Transaction ready. If I were offline, this would transfer via Bluetooth and settle later."

---

#### Receive Payment (20 sec)
**[Navigate to Receive tab]**

"For receiving, Fabcash generates a fresh ephemeral address every time."

**[Show QR code]**

"This address is single-use. After receiving funds, they're swept through the Privacy Cash pool to my main wallet."

**[Tap to copy address]**

"Each payment is unlinkable to the next."

---

#### Crackdown Mode (25 sec)
**[Navigate to Settings → Emergency]**

"This is our unique feature: Crackdown Mode.

One tap, and everything changes."

**[Tap Activate Crackdown Mode]**

"All SOL instantly shields to Privacy Cash. Transaction history cleared. Ephemeral keys deleted. The wallet looks freshly installed."

**[Show progress, then completion]**

"Funds are safe in the Privacy Cash pool. The app reveals nothing about its past.

This is what 'true burner wallet' means."

---

### [2:30-3:00] Closing

**[Show GitHub and summary slide]**

"Fabcash demonstrates what's possible when you design privacy into the architecture, not bolt it on after.

Built on Privacy Cash SDK. Deployed on Solana devnet. Fully open source.

**The problem:** Every digital wallet exposes your entire history.
**The solution:** An empty Fabcash wallet reveals nothing about its past.

Check out the code at github.com/psyto/fabcash.

Thank you."

**[End with logo and GitHub link]**

---

## Recording Notes

### Technical Setup
- iOS Simulator: iPhone 16 Pro
- App: Development build with demo mode enabled
- Screen recording: `xcrun simctl io recordVideo`

### Demo Mode
The app runs in demo mode with:
- Pre-loaded balances (2.5 SOL, 150 USDC)
- Mock Privacy Cash responses (instant)
- No network delays

### Key Moments to Capture
1. Shield SOL → Privacy Cash deposit
2. Send with Shielded mode selected
3. Ephemeral address generation
4. Crackdown Mode activation and completion

### Automated Recording
Use the demo script for consistent recording:
```bash
./scripts/record-demo.sh
```

---

## Submission Checklist

- [ ] Demo video (max 3 minutes)
- [ ] GitHub repository (open source)
- [ ] README with documentation
- [ ] Deployed to Solana devnet
- [ ] Privacy Cash SDK integration documented

---

## Tracks & Bounties

### Primary Track
**Track 01: Private Payments** ($15,000 prize pool)
- Fabcash is a confidential/private transfer solution
- Uses Privacy Cash for shielded transactions
- Offline capability for crackdown scenarios

### Sponsor Bounty
**Privacy Cash** ($15,000 total)
- Best Overall App: $6,000 ← Primary target
- Best Integration: $6,000
- Honorable Mentions: $3,000

### Why We Qualify

| Requirement | Fabcash |
|-------------|---------|
| Uses Privacy Cash SDK | ✅ Core integration |
| Privacy-enabled app | ✅ Burner wallet |
| Novel use case | ✅ Crackdown Mode |
| Open source | ✅ MIT License |
| Solana devnet | ✅ Deployed |
