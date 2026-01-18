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

**Key insight**: Ephemeral addresses protect privacy at payment time. Privacy Cash protects privacy at settlement time

---

## Privacy Stack

Fabcash uses a layered privacy approach:

```
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                         │
│  • Ephemeral addresses (new keypair per transaction)         │
│  • No persistent identity                                    │
│  • Optional transaction history                              │
├─────────────────────────────────────────────────────────────┤
│                    TRANSPORT LAYER                           │
│  • Bluetooth with MAC randomization                          │
│  • Direct device-to-device (no server)                       │
│  • Session keys per connection                               │
├─────────────────────────────────────────────────────────────┤
│                    COMPRESSION LAYER                         │
│  • Light Protocol ZK Compression                             │
│  • 99% smaller on-chain footprint                            │
│  • Reduced data for chain analysis                           │
├─────────────────────────────────────────────────────────────┤
│                    SHIELDING LAYER                           │
│  • Privacy Cash shielded pool                                │
│  • ZK proofs for unlinkable withdrawals                      │
│  • Deposits and withdrawals cryptographically separated      │
├─────────────────────────────────────────────────────────────┤
│                    SETTLEMENT LAYER                          │
│  • Solana L1                                                 │
│  • Fast finality                                             │
│  • Low fees enable privacy-preserving patterns               │
└─────────────────────────────────────────────────────────────┘
```

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

**Why:** Less on-chain data = less information for chain analysis.

**How:**
```typescript
// lib/solana/zk-compression.ts
import { LightSystemProgram } from '@lightprotocol/stateless.js';

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

Fabcash supports different privacy levels:

### Standard Mode
- Ephemeral addresses only
- Direct transfer from sender to receiver
- Privacy: Moderate (receiver address is unlinkable, but sender address is visible)

### Compressed Mode
- Ephemeral addresses + Light Protocol compression
- 99% smaller on-chain footprint
- Privacy: Good (less data for analysis)

### Shielded Mode
- Ephemeral addresses + Privacy Cash shielding
- Sender shields, then withdraws to receiver
- Privacy: High (deposit and withdrawal are cryptographically unlinkable)

### Maximum Privacy Mode
- All layers: Ephemeral + Compression + Shielding
- Privacy: Highest (minimal on-chain trace + unlinkable transactions)

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

---

## Privacy Recommendations for Users

1. **Shield funds in advance**: Don't shield right before paying. This creates timing correlation.

2. **Use common amounts**: Round numbers (0.1 SOL, 1 USDC) blend in better.

3. **Wait before sweeping**: Don't immediately sweep ephemeral keys to main wallet.

4. **Use shielded mode for sensitive payments**: When privacy matters most.

5. **Keep transaction history off**: Disable optional history for maximum privacy.

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
