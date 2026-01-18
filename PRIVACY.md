# Fabcash Privacy Architecture

This document details the privacy technologies integrated into Fabcash and how they work together to provide strong privacy guarantees for P2P payments.

---

## Privacy Goals

1. **Sender Privacy**: Observers cannot determine who sent a payment
2. **Receiver Privacy**: Observers cannot determine who received a payment
3. **Amount Privacy**: Transaction amounts are not easily analyzable
4. **Relationship Privacy**: Cannot link sender and receiver on-chain
5. **Pattern Privacy**: Cannot build behavioral profiles from payment history
6. **Settlement Privacy**: Sweeping funds to main wallet doesn't expose payment history

---

## Designed for Hostile Environments

Fabcash is built for users in regions with internet crackdowns and government surveillance. The privacy architecture addresses a specific threat model:

```
┌────────────────────────────────────────────────────────────────┐
│                     INTERNET CRACKDOWN                         │
├────────────────────────────────────────────────────────────────┤
│  During crackdown (offline):                                   │
│    Alice ─── Bluetooth ───> Bob's ephemeral address            │
│    (No network trace, no server logs)                          │
├────────────────────────────────────────────────────────────────┤
│  When connectivity returns (government monitoring):            │
│                                                                │
│    Without Privacy Cash:                                       │
│      Bob's ephemeral ──> Bob's main wallet                     │
│      └─ Government chain analysis sees this link               │
│      └─ All Bob's payments now exposed                         │
│                                                                │
│    With Privacy Cash shielded settlement:                      │
│      Bob's ephemeral ──> Privacy Pool ──> Bob's main wallet    │
│      └─ Link cryptographically broken                          │
│      └─ Post-crackdown forensics cannot trace                  │
└────────────────────────────────────────────────────────────────┘
```

**Key insight**: Ephemeral addresses protect privacy at payment time. Privacy Cash protects privacy at settlement time.

---

## Offline vs Online: When Privacy Technologies Apply

A core principle of Fabcash is **separation of payment and settlement**. This table clarifies when each privacy technology is used:

| Technology | Payment (Offline) | Settlement (Online) |
|------------|------------------|---------------------|
| Ephemeral addresses | ✓ Used | ✓ Used |
| Bluetooth/QR transport | ✓ Used | Not applicable |
| Light Protocol compression | Not needed | ✓ Applied at broadcast |
| Privacy Cash shielding | Not needed | ✓ Applied at sweep |

**Why this matters for crackdowns:**

```
During internet blackout:
  └─> Payments continue via Bluetooth/QR
  └─> Signed transactions stored locally
  └─> No privacy technology requires internet at this stage

When internet returns:
  └─> Transactions broadcast with compression (smaller trace)
  └─> Funds swept through shielded pool (unlinkable)
  └─> Even if government monitors the network, privacy is preserved
```

This design ensures that **offline capability is never compromised** by privacy features

---

## Privacy Stack

Fabcash uses a layered privacy approach with clear separation between **offline payment** and **online settlement**:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   ░░░░░░░░░░░░░░  OFFLINE PHASE  ░░░░░░░░░░░░░░░░░░░░░░░   │
│   ░░░░░░░░░░░░░░  (no internet)  ░░░░░░░░░░░░░░░░░░░░░░░   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                    APPLICATION LAYER                         │
│  • Ephemeral addresses (new keypair per transaction)         │
│  • No persistent identity                                    │
│  • Signed transaction stored locally                         │
├─────────────────────────────────────────────────────────────┤
│                    TRANSPORT LAYER                           │
│  • Bluetooth with MAC randomization                          │
│  • Direct device-to-device (no server)                       │
│  • Session keys per connection                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ONLINE PHASE  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   │
│   ▓▓▓▓▓▓▓▓▓▓▓▓  (when connected)  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                    COMPRESSION LAYER                         │
│  • Light Protocol ZK Compression                             │
│  • 99% smaller on-chain footprint                            │
│  • Applied when broadcasting transactions                    │
├─────────────────────────────────────────────────────────────┤
│                    SHIELDING LAYER                           │
│  • Privacy Cash shielded pool                                │
│  • ZK proofs for unlinkable withdrawals                      │
│  • Applied when sweeping to main wallet                      │
├─────────────────────────────────────────────────────────────┤
│                    SETTLEMENT LAYER                          │
│  • Solana L1                                                 │
│  • Fast finality                                             │
│  • Low fees enable privacy-preserving patterns               │
└─────────────────────────────────────────────────────────────┘
```

**Key design principle:** Payment and settlement are decoupled. Privacy technologies enhance settlement without requiring internet during payment.

---

## Technology Deep Dive

### 1. Ephemeral Addresses

**What:** New Ed25519 keypair generated for each receive request.

**Why:** Prevents address reuse, which is the primary vector for on-chain surveillance.

**How:**
```typescript
// lib/solana/ephemeral.ts
import { Keypair } from '@solana/web3.js';

export async function generateEphemeralKey(): Promise<EphemeralKey> {
  const keypair = Keypair.generate();
  // Store temporarily, sweep to main wallet later
  return {
    id: generateKeyId(),
    publicKey: keypair.publicKey,
    keypair,
    expiresAt: Date.now() + 15 * 60 * 1000,
  };
}
```

**Privacy benefit:** Each payment goes to a unique address. Without additional context, an observer cannot link multiple payments to the same person.

**Limitation:** When funds are swept from ephemeral to main wallet, this creates an on-chain link. Over time, all ephemeral addresses can be traced to the same main wallet. This is where Privacy Cash becomes essential.

---

### 2. Light Protocol ZK Compression

**What:** Zero-knowledge compression that reduces on-chain data by up to 99%.

**When used:** At settlement time, when transactions are broadcast to Solana. Not required during offline payment.

**Why:** Less on-chain data = less information for chain analysis.

**How:**
```typescript
// lib/solana/zk-compression.ts
import { LightSystemProgram } from '@lightprotocol/stateless.js';

// Called at SETTLEMENT time (when online), not at payment time
export async function compressSol(payer: Keypair, lamports: number) {
  const compressIx = await LightSystemProgram.compress({
    payer: payer.publicKey,
    toAddress: payer.publicKey,
    lamports,
    outputStateTreeInfo: {
      tree: treeAccounts.merkleTree,
      queue: treeAccounts.nullifierQueue,
      treeType: TreeType.StateV1,
    },
  });
  // Execute transaction
}
```

**Privacy benefit:**
- Compressed accounts are stored in Merkle trees
- Only the root hash is on-chain
- Individual account data is not directly visible
- Reduces the "surface area" for analysis

**Offline compatibility:** ZK Compression does not affect the offline payment capability. Payments happen via Bluetooth/QR without internet. Compression is applied when the transaction is eventually broadcast.

---

### 3. Privacy Cash Shielded Pool

**What:** A mixing pool using zero-knowledge proofs to break the link between deposits and withdrawals.

**Why:** Ephemeral addresses protect you at payment time, but not at settlement time. When you sweep funds from ephemeral addresses to your main wallet, that creates traceable links. In surveillance scenarios (post-crackdown forensics), this exposes all your payment history.

**Architecture:**
```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   Mobile App    │ ───> │  Backend API    │ ───> │     Solana      │
│  (React Native) │      │   (Node.js)     │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
                               │
                               │ Privacy Cash SDK
                               │ (ZK proof generation)
                               v
                         ┌─────────────────┐
                         │  Shielded Pool  │
                         └─────────────────┘
```

The Privacy Cash SDK requires Node.js runtime for ZK proof generation and cannot run directly in React Native. The mobile app communicates with a backend service.

**How:**
```typescript
// Backend API handles Privacy Cash operations

// When user wants to sweep ephemeral funds privately:
// 1. Mobile app sends request to backend
// 2. Backend deposits ephemeral funds into pool
await privacyCash.deposit({ lamports: amount });

// 3. Backend withdraws to user's main wallet
await privacyCash.withdraw({
  lamports: amount,
  recipientAddress: mainWallet,
});
// 4. On-chain: ephemeral address and main wallet are unlinkable
```

**Privacy benefit:**
- Deposits go into a shared pool
- Withdrawals are proven via ZK proof
- Proof shows "I deposited enough" without revealing which deposit
- On-chain: ephemeral address and main wallet are cryptographically unlinkable
- **Post-crackdown forensics cannot reconstruct payment relationships**

---

### 4. Bluetooth Transport Privacy

**What:** Direct device-to-device communication with privacy protections.

**Why:** Network-level metadata can deanonymize users even with on-chain privacy.

**How:**
- BLE MAC address randomization (OS-level)
- Session keys negotiated per connection
- No persistent device identifiers transmitted
- No server intermediary to log metadata

**Privacy benefit:** The payment exchange leaves no network trace that could be correlated with on-chain activity.

---

## Privacy Modes

Fabcash supports different privacy levels. All modes support **offline payment** - the difference is in how settlement is handled.

### Standard Mode
- **Payment (offline):** Ephemeral addresses, Bluetooth/QR transfer
- **Settlement (online):** Direct broadcast to Solana
- Privacy: Moderate (receiver address is unlinkable, but sweep can be traced)

### Compressed Mode
- **Payment (offline):** Same as standard
- **Settlement (online):** Broadcast with Light Protocol ZK compression
- Privacy: Good (99% smaller on-chain footprint, less data for analysis)

### Shielded Mode
- **Payment (offline):** Same as standard
- **Settlement (online):** Sweep through Privacy Cash shielded pool
- Privacy: High (ephemeral and main wallet cryptographically unlinkable)

### Maximum Privacy Mode
- **Payment (offline):** Same as standard
- **Settlement (online):** Compression + Shielded sweep
- Privacy: Highest (minimal on-chain trace + unlinkable transactions)

**Important:** The privacy mode selection affects settlement, not payment. All payments happen offline via Bluetooth/QR regardless of the selected privacy level.

---

## Threat Model

### Primary Threats (Authoritarian Contexts)

| Threat | Scenario | Protection |
|--------|----------|------------|
| **Post-crackdown chain analysis** | Government analyzes blockchain after restoring internet | Privacy Cash shielded settlement |
| **Payment relationship mapping** | Identify who paid whom | Ephemeral addresses + shielding |
| **ISP/RPC monitoring** | Track which wallets are active | Deferred settlement, Tor-compatible |
| **Wallet balance surveillance** | Track wealth accumulation | Funds dispersed across ephemeral keys |

### Secondary Threats (General Privacy)

| Threat | Protection |
|--------|------------|
| Address reuse tracking | Ephemeral addresses |
| Transaction graph analysis | Privacy Cash shielding |
| Amount pattern analysis | Variable denominations |
| Network surveillance | Bluetooth (no internet at payment time) |
| Server data collection | No server for payments (P2P only) |
| On-chain data mining | ZK Compression |

### What we don't protect against:

| Threat | Limitation |
|--------|------------|
| Physical observation | Someone watching the payment |
| Device compromise | Malware on the phone |
| Timing analysis | Deposit/withdrawal timing correlation |
| Large amount analysis | Very large amounts may stand out in pool |
| Voluntary disclosure | User sharing their own data |
| Backend compromise | If Privacy Cash backend is compromised (mitigate with self-hosting) |

### No Seed Phrase by Design

**Fabcash does not support seed phrase backup.** This is intentional.

In authoritarian contexts, a seed phrase is a liability:

| Scenario | With Seed Phrase | Without Seed Phrase |
|----------|-----------------|---------------------|
| Detention/interrogation | Can be coerced to reveal | Nothing to reveal |
| Device seizure | Funds recoverable by adversary | Funds inaccessible |
| Border crossing | Must hide or memorize seed | Plausible deniability |

**Coercion resistance:**

```
Traditional Wallet:
  "Give us your seed phrase or face consequences"
  → User must comply or resist
  → Adversary gains full access to funds AND transaction history

Fabcash:
  "Give us your seed phrase"
  → "There is no seed phrase"
  → Adversary sees only current balance (if any)
  → No recovery possible, even under coercion
```

**Best practice for high-value amounts:**
1. Keep daily spending money in Fabcash
2. Regularly sweep larger amounts through Privacy Cash to a cold wallet
3. Cold wallet can have seed phrase backup (stored securely, not on device)

This separation ensures:
- Daily wallet: Maximum privacy, coercion-resistant, expendable
- Cold storage: Backed up, recoverable, but not carried daily

---

## Privacy Visualization

Fabcash includes a **Privacy Visualization** component that shows users exactly what chain analysts can see for each privacy mode. This helps users make informed decisions about which privacy level to use.

```
┌─────────────────────────────────────────────────────────────┐
│                    STANDARD MODE                             │
│                                                             │
│  [You] ─── 0.1 SOL ───> [Recipient]                        │
│                                                             │
│  Chain analyst sees:                                        │
│  ✗ Your wallet address                                      │
│  ✗ Recipient's ephemeral address                            │
│  ✗ Payment amount (0.1 SOL)                                 │
│  ✗ Transaction timestamp                                    │
│                                                             │
│  Chain analyst cannot see:                                  │
│  ✓ Recipient's main wallet                                  │
│  ✓ Real-world identity                                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    SHIELDED MODE                             │
│                                                             │
│  [You] ─── ? ───> [Privacy Pool] ─── ? ───> [Recipient]   │
│                                                             │
│  Chain analyst sees:                                        │
│  ✗ You deposited to privacy pool                            │
│  ✗ Someone withdrew from pool                               │
│                                                             │
│  Chain analyst cannot see:                                  │
│  ✓ Your wallet address                                      │
│  ✓ Recipient address                                        │
│  ✓ Payment amount                                           │
│  ✓ Connection between deposit and withdrawal                │
└─────────────────────────────────────────────────────────────┘
```

The visualization is shown during payment confirmation, allowing users to understand the privacy implications before sending.

---

## Crackdown Mode (Emergency Protocol)

For users in hostile environments, Fabcash includes a **Crackdown Mode** - an emergency button that maximizes privacy in crisis situations.

### What Crackdown Mode Does

1. **Shields all funds**: Moves entire balance into Privacy Cash shielded pool
2. **Clears transaction history**: Removes local pending transaction records
3. **Purges ephemeral keys**: Deletes all stored ephemeral keypairs
4. **Prepares for surveillance**: Leaves no traceable state on device

### When to Use

- Internet crackdown is expected or occurring
- Device may be inspected by authorities
- Need to quickly minimize on-chain exposure
- Preparing for border crossing or checkpoint

### Architecture

```
Before Crackdown Mode:
  Main Wallet: 1.5 SOL
  Ephemeral Keys: 5 stored
  Pending TXs: 3 queued

  Chain analyst can see:
  ✗ Main wallet balance
  ✗ Ephemeral address connections (when swept)
  ✗ Transaction patterns

After Crackdown Mode:
  Main Wallet: 0 SOL (shielded)
  Ephemeral Keys: 0 (purged)
  Pending TXs: 0 (cleared)
  Privacy Pool: Contains your funds (unlinkable)

  Chain analyst sees:
  ✓ Empty main wallet
  ✓ Deposit to privacy pool (but cannot link to you)
```

### Implementation

```typescript
// lib/solana/crackdown.ts
export async function activateCrackdownMode(
  onProgress?: CrackdownProgressCallback
): Promise<CrackdownResult> {
  // 1. Shield all SOL balance
  await shieldAllFunds(balance);

  // 2. Clear pending transactions
  await clearAllTransactions();

  // 3. Purge ephemeral keys
  await clearAllEphemeralKeys();

  return { success: true };
}
```

### Recovery

After the crisis, use the **Private Withdraw** feature to move funds from the privacy pool back to your wallet. The connection between your previous activity and new wallet is cryptographically broken.

---

## Privacy Recommendations for Users

1. **Shield funds in advance**: Don't shield right before paying. This creates timing correlation.

2. **Use common amounts**: Round numbers (0.1 SOL, 1 USDC) blend in better.

3. **Wait before sweeping**: Don't immediately sweep ephemeral keys to main wallet.

4. **Use shielded mode for sensitive payments**: When privacy matters most.

5. **Keep transaction history off**: Disable optional history for maximum privacy.

6. **Familiarize with Crackdown Mode**: Know how to activate it quickly in emergencies.

7. **Use Privacy Visualization**: Check what analysts can see before confirming payments.

---

## Comparison with Other Solutions

| Feature | Fabcash | Traditional Wallet | CEX | Cash |
|---------|---------|-------------------|-----|------|
| Address reuse | Never | Common | N/A | N/A |
| On-chain linkability | Low (shielded) | High | N/A | None |
| Works offline | Yes | No | No | Yes |
| KYC required | No | No | Yes | No |
| Seizure resistant | High | Medium | Low | Medium |
| Digital | Yes | Yes | Yes | No |

---

## Ephemeral Addresses vs. Shielded Settlement

A common question: "If we use ephemeral addresses, why do we need Privacy Cash?"

### What Ephemeral Addresses Provide

```
Payment time:
  Sender ──> Ephemeral Address (fresh)

  ✓ Sender doesn't learn receiver's main wallet
  ✓ Each payment uses different address
  ✓ Casual observers can't link payments
```

### What Ephemeral Addresses Don't Provide

```
Settlement time (when receiver sweeps funds):
  Ephemeral1 ──> Main Wallet
  Ephemeral2 ──> Main Wallet
  Ephemeral3 ──> Main Wallet

  ✗ Chain analyst can link all ephemeral addresses
  ✗ Entire payment history exposed
  ✗ In crackdown scenario: government sees everything
```

### What Privacy Cash Adds

```
Shielded settlement:
  Ephemeral1 ──> Privacy Pool ──> Main Wallet
  Ephemeral2 ──> Privacy Pool ──> Main Wallet
  Ephemeral3 ──> Privacy Pool ──> Main Wallet

  ✓ Each sweep is unlinkable
  ✓ Chain analysis cannot connect ephemeral to main wallet
  ✓ Post-crackdown forensics blocked
```

### When Each is Sufficient

| Use Case | Ephemeral Only | + Privacy Cash |
|----------|---------------|----------------|
| Friends splitting dinner | Sufficient | Overkill |
| Flea market purchase | Sufficient | Optional |
| **Activist receiving donations** | Insufficient | **Required** |
| **Journalist protecting sources** | Insufficient | **Required** |
| **Citizen in authoritarian regime** | Insufficient | **Required** |

---

## Future Privacy Enhancements

1. **Stealth Addresses**: Cryptographic scheme for receiver to derive one-time addresses without interaction.

2. **Encrypted Memos**: ZK-encrypted memo field for payment context.

3. **Multi-hop Mixing**: Route payments through multiple pool hops.

4. **Decoy Outputs**: Add fake outputs to confuse analysis.

5. **Timing Randomization**: Automated delays for deposits/withdrawals.

---

## Audits and Verification

- **Privacy Cash**: Audited by [Zigtur](https://x.com/zigtur)
- **Light Protocol**: Multiple audits, see [GitHub](https://github.com/Lightprotocol/light-protocol/tree/main/audits)
- **Fabcash**: Open source, available for review

---

## References

- [Light Protocol Documentation](https://www.zkcompression.com)
- [Privacy Cash SDK](https://github.com/Privacy-Cash/privacy-cash-sdk)
- [ZK Compression Whitepaper](https://www.zkcompression.com/references/whitepaper)
- [Solana Privacy Ecosystem](https://www.helius.dev/blog/solana-privacy)

---

<p align="center">
  <em>Privacy is not about having something to hide.<br/>
  Privacy is about having the freedom to choose what to share.</em>
</p>
