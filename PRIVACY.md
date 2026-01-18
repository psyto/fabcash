# Fabcash Privacy Architecture

This document details the privacy technologies integrated into Fabcash and how they work together to provide strong privacy guarantees for P2P payments.

---

## Privacy Goals

1. **Sender Privacy**: Observers cannot determine who sent a payment
2. **Receiver Privacy**: Observers cannot determine who received a payment
3. **Amount Privacy**: Transaction amounts are not easily analyzable
4. **Relationship Privacy**: Cannot link sender and receiver on-chain
5. **Pattern Privacy**: Cannot build behavioral profiles from payment history

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
export async function generateEphemeralKey(): Promise<EphemeralKey> {
  const signer = await generateKeyPairSigner();
  // Store temporarily, sweep to main wallet later
  return {
    id: generateKeyId(),
    publicKey: signer.address,
    signer,
    expiresAt: Date.now() + 15 * 60 * 1000,
  };
}
```

**Privacy benefit:** Each payment goes to a unique address. Without additional context, an observer cannot link multiple payments to the same person.

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

**Why:** Even with ephemeral addresses, the flow of funds from sender's known address to receiver can be traced. Shielding breaks this link.

**How:**
```typescript
// lib/solana/privacy-cash.ts
import { PrivacyCash } from 'privacycash';

// Step 1: Shield funds (can be done in advance)
await privacyCash.deposit({ lamports: amount });

// Step 2: When paying, withdraw to receiver's ephemeral address
await privacyCash.withdraw({
  lamports: amount,
  recipientAddress: ephemeralAddress,
});
```

**Privacy benefit:**
- Deposits go into a shared pool
- Withdrawals are proven via ZK proof
- Proof shows "I deposited enough" without revealing which deposit
- On-chain: deposit tx and withdrawal tx are unlinkable

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

### What we protect against:

| Threat | Protection |
|--------|------------|
| Address reuse tracking | Ephemeral addresses |
| Transaction graph analysis | Privacy Cash shielding |
| Amount pattern analysis | Variable denominations |
| Network surveillance | Bluetooth (no internet at payment time) |
| Server data collection | No server (P2P only) |
| On-chain data mining | ZK Compression |

### What we don't protect against:

| Threat | Limitation |
|--------|------------|
| Physical observation | Someone watching the payment |
| Device compromise | Malware on the phone |
| Timing analysis | Deposit/withdrawal timing correlation |
| Large amount analysis | Very large amounts may stand out in pool |
| Voluntary disclosure | User sharing their own data |

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
