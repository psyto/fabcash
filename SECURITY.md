# Fabcash Security Architecture

Technical documentation of Fabcash security design, cryptographic primitives, and threat model.

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Key Management](#key-management)
3. [Cryptographic Primitives](#cryptographic-primitives)
4. [Offline Synchronization](#offline-synchronization)
5. [BLE Protocol Security](#ble-protocol-security)
6. [Threat Model](#threat-model)
7. [Crackdown Mode Implementation](#crackdown-mode-implementation)

---

## Design Philosophy

Fabcash security is based on **minimizing attack surface through absence**:

```
Traditional wallet security: Encrypt and protect the seed phrase
Fabcash security: Don't create a seed phrase
```

### Core Principles

1. **Nothing to coerce** - No seed phrase or backup to extract
2. **Nothing to recover** - Wallet loss = fund loss (feature, not bug)
3. **Plausible deniability** - Empty wallet reveals nothing about past
4. **Ephemeral by design** - Single-use receiving addresses

---

## Key Management

### Main Wallet Key

**Generation:**

```typescript
// lib/solana/wallet.ts:17-30
const keypair = Keypair.generate();  // Ed25519 keypair
await SecureStore.setItemAsync(WALLET_KEY, bytesToBase64(keypair.secretKey));
```

| Property | Value |
|----------|-------|
| Algorithm | Ed25519 |
| Key size | 256-bit private key, 256-bit public key |
| Storage | expo-secure-store (iOS Keychain / Android Keystore) |
| Format | Base64-encoded 64-byte secret key |

**Storage key:** `fabcash_wallet_keypair`

**Lifecycle:**

```
[First Launch] → Generate → Store in SecureStore
[Subsequent launches] → Load from SecureStore → Cache in memory
[Crackdown Mode] → Delete from SecureStore → Clear memory cache
```

### Ephemeral Keys

**Generation:**

```typescript
// lib/solana/ephemeral.ts:22-57
const keypair = Keypair.generate();
const ephemeralKey = {
  id: generateKeyId(),
  keypair,
  expiresAt: Date.now() + 15 * 60 * 1000,  // 15 minutes
};
```

| Property | Value |
|----------|-------|
| Algorithm | Ed25519 (same as main wallet) |
| Lifetime | 15 minutes (configurable) |
| Storage | SecureStore + in-memory cache |
| Purpose | Single-use receiving addresses |

**Storage key prefix:** `fabcash_ephemeral_`

**Stored data structure:**

```typescript
{
  id: string;           // Unique identifier
  publicKey: string;    // Base58 public key
  secretKey: string;    // Base64 secret key
  createdAt: number;    // Unix timestamp
  expiresAt: number;    // Expiration timestamp
  used: boolean;        // Whether funds received
}
```

**Lifecycle:**

```
[Receive request] → Generate ephemeral key → Advertise via BLE
[Payment received] → Mark as used → Schedule for sweep
[Sweep completed] → Delete key
[Expired + unused] → Delete key
[Crackdown Mode] → Delete all keys immediately
```

### Key Sweep Process

Funds received to ephemeral addresses are swept to the main wallet:

```typescript
// lib/solana/ephemeral.ts:128-140
async function getKeysToSweep(): Promise<EphemeralKey[]> {
  // Returns used, unexpired ephemeral keys
}
```

Sweep transaction:
1. Load ephemeral keypair from storage
2. Build SOL transfer: ephemeral → main wallet
3. Sign with ephemeral key
4. Broadcast to Solana
5. Delete ephemeral key after confirmation

---

## Cryptographic Primitives

### Transaction Signing

**Algorithm:** Ed25519 (via `@solana/web3.js`)

```typescript
// lib/solana/transactions.ts:52-91
const transaction = new Transaction().add(
  SystemProgram.transfer({
    fromPubkey: sender.publicKey,
    toPubkey: recipient,
    lamports: Number(amount),
  })
);
transaction.sign(sender);  // Ed25519 signature
```

**Signature properties:**
- 64-byte Ed25519 signature
- Non-malleable
- Deterministic

### Transaction Serialization

```typescript
// lib/solana/transactions.ts:76-77
const serialized = transaction.serialize();
const base64 = bytesToBase64(serialized);
```

**Format:** Solana wire format, base64 encoded

### Blockhash

```typescript
// lib/solana/transactions.ts:58-69
const { blockhash } = await getLatestBlockhashWithRetry();
transaction.recentBlockhash = blockhash;
```

- Transaction valid for ~2 minutes (150 blocks)
- Prevents replay attacks
- Requires internet for fresh blockhash

---

## Offline Synchronization

### Deferred Settlement Model

Inspired by Bitcoin Lightning Network, simplified for Solana:

```
[Offline] Sender signs TX → BLE transfer → Receiver stores TX
[Online] Receiver broadcasts TX → Solana confirms → Settlement complete
```

### Pending Transaction Storage

```typescript
// lib/store/pending-txs.ts
interface PendingTransaction {
  id: string;
  base64: string;           // Serialized, signed transaction
  status: TransactionStatus;
  broadcastAttempts: number;
  expiresAt: number;        // 2 minutes from creation
}
```

**Storage:** AsyncStorage (`fabcash_pending_transactions`)

**Status flow:**

```
pending → broadcasting → confirmed → finalized
                     ↘ failed
                     ↘ expired
```

### Broadcast Logic

```typescript
// lib/solana/broadcast.ts:33-97
async function broadcastTransaction(tx: SignedTransaction) {
  if (Date.now() > tx.expiresAt) {
    return { status: 'expired' };
  }

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const sig = await sendRawTransactionWithRetry(rawTransaction);
      const confirmed = await waitForConfirmation(sig);
      if (confirmed) return { status: 'confirmed', signature: sig };
    } catch (error) {
      // Exponential backoff
      await delay(1000 * Math.pow(2, attempt));
    }
  }

  return { status: 'failed' };
}
```

**Retry configuration:**
- Max retries: 3
- Initial delay: 1000ms
- Backoff: Exponential (1s, 2s, 4s)
- Rate limit delay: 2000ms

### Connectivity Check

```typescript
// lib/solana/broadcast.ts:139-147
async function checkNetworkConnectivity(): Promise<boolean> {
  try {
    await connection.getVersion();
    return true;
  } catch {
    return false;
  }
}
```

---

## BLE Protocol Security

### Service UUIDs

```typescript
// lib/bluetooth/protocol.ts:4-6
FABRKNT_SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
PAYMENT_REQUEST_CHAR_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
TRANSACTION_CHAR_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';
```

### Payload Format

**Payment Request (Receiver → Sender):**

```typescript
interface PaymentRequest {
  type: 'payment_request';
  version: 1;
  recipientPubkey: string;   // Ephemeral address
  ephemeralId: string;
  amount?: string;
  token?: 'SOL' | 'USDC';
  expiresAt: number;
}
```

**Transaction Payload (Sender → Receiver):**

```typescript
interface TransactionPayload {
  type: 'transaction';
  version: 1;
  txBase64: string;          // Signed transaction
  senderPubkey: string;
  amount: string;
  token: 'SOL' | 'USDC';
  expiresAt: number;
  memoHash?: string;
}
```

### Chunking

BLE MTU is typically 20-512 bytes. Fabcash uses 180-byte chunks:

```typescript
// lib/bluetooth/protocol.ts:165-177
const CHUNK_SIZE = 180;

function chunkPayload(base64: string): string[] {
  const chunks = [];
  for (let i = 0; i < base64.length; i += CHUNK_SIZE) {
    chunks.push(base64.slice(i, i + CHUNK_SIZE));
  }
  return chunks;
}
```

### Validation

```typescript
// lib/bluetooth/protocol.ts:66-99
function validatePaymentRequest(payload): boolean {
  return (
    payload.type === 'payment_request' &&
    payload.version === 1 &&
    typeof payload.recipientPubkey === 'string' &&
    typeof payload.expiresAt === 'number'
  );
}
```

### Security Considerations

| Threat | Mitigation |
|--------|------------|
| Replay attack | Transaction expires in 2 minutes (blockhash) |
| Man-in-middle | Transaction is pre-signed; tampering invalidates signature |
| Eavesdropping | Amount visible in payload; use Shielded mode for privacy |
| Fake receiver | Sender verifies address before signing |

---

## Threat Model

### In-Scope Threats

| Threat | Protection |
|--------|------------|
| **Physical device seizure** | No seed phrase to extract; Crackdown Mode erases all |
| **Coercion ("unlock your wallet")** | Empty wallet reveals nothing about past |
| **Border crossing inspection** | App appears as empty payment app |
| **Transaction history analysis** | Ephemeral addresses break linkability |
| **On-chain surveillance** | Use Compressed/Shielded modes |

### Out-of-Scope Threats

| Threat | Reason |
|--------|--------|
| **Device malware** | OS-level security required |
| **Hardware attacks** | Beyond app-level protection |
| **$5 wrench attack** | Social/physical; no technical solution |
| **Network-level attacks** | Solana network security |

### Security Guarantees

**What Fabcash guarantees:**
- No recoverable seed phrase on device
- No transaction history after Crackdown Mode
- Ephemeral addresses for receiving
- Offline transaction signing

**What Fabcash does NOT guarantee:**
- Protection against device compromise
- Privacy from Solana blockchain analysis (use Shielded mode)
- Fund recovery after wallet deletion

---

## Crackdown Mode Implementation

### Activation Flow

```typescript
// Pseudocode for Crackdown Mode
async function activateCrackdownMode() {
  // 1. Shield all SOL to Privacy Cash pool
  const balance = await getSolBalance(wallet.publicKey);
  if (balance > 0) {
    await privacyCashAPI.shield(balance);
  }

  // 2. Clear ephemeral keys
  await clearAllEphemeralKeys();

  // 3. Clear transaction history
  await clearAllTransactions();

  // 4. Delete main wallet
  await deleteWallet();
}
```

### Data Cleared

| Data | Storage | Action |
|------|---------|--------|
| Main wallet keypair | SecureStore | Delete |
| Ephemeral keys | SecureStore | Delete all |
| Pending transactions | AsyncStorage | Delete all |
| Transaction history | AsyncStorage | Delete all |
| In-memory caches | RAM | Clear |

### Post-Activation State

```
SecureStore: Empty (no fabcash_* keys)
AsyncStorage: Empty (no fabcash_* keys)
Memory: Cleared
App state: Fresh install appearance
```

### Fund Recovery

After Crackdown Mode, funds are in the Privacy Cash shielded pool:

1. Access backend with SERVICE_WALLET_KEY
2. Call `/api/balance` to check shielded balance
3. Call `/api/withdraw` to recover funds

**Note:** This requires backend access. Without it, funds remain in the pool.

---

## Secure Storage Details

### iOS (Keychain)

expo-secure-store uses iOS Keychain with:
- `kSecAttrAccessibleWhenUnlockedThisDeviceOnly`
- Encrypted at rest
- Not backed up to iCloud

### Android (Keystore)

expo-secure-store uses Android Keystore with:
- Hardware-backed keys (if available)
- Encrypted shared preferences
- Not backed up

### Storage Keys

| Key | Purpose | Cleared by Crackdown |
|-----|---------|---------------------|
| `fabcash_wallet_keypair` | Main wallet secret key | Yes |
| `fabcash_ephemeral_*` | Ephemeral key data | Yes |
| `fabcash_pending_transactions` | Pending TX queue | Yes |

---

## Related Documentation

- [GUIDE.md](GUIDE.md) - User guide
- [API.md](API.md) - Backend API reference
- [PRIVACY.md](PRIVACY.md) - Privacy deep dive
