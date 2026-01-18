# Fabcash API Reference

Backend API for Privacy Cash shielded transactions.

---

## Base URL

```
Development: http://localhost:3000
Production: [Your deployment URL]
```

---

## Authentication

Currently no authentication required. In production, implement:
- API keys for rate limiting
- HMAC signatures for request validation

---

## Endpoints

### Health Check

```
GET /api/health
```

Check server status and Privacy Cash initialization.

**Response:**

```json
{
  "status": "ok",
  "privacyCashReady": true,
  "serviceWallet": "ABC123...XYZ"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Always `"ok"` if server is running |
| `privacyCashReady` | boolean | Whether Privacy Cash SDK is initialized |
| `serviceWallet` | string | Service wallet public key (null if not initialized) |

---

### Get Shielded Balance

```
GET /api/balance
```

Get the current shielded balance of the service wallet.

**Response:**

```json
{
  "success": true,
  "balance": {
    "lamports": 1000000000,
    "sol": 1.0
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Request success status |
| `balance.lamports` | number | Balance in lamports (1 SOL = 1,000,000,000 lamports) |
| `balance.sol` | number | Balance in SOL |

**Errors:**

| Status | Error | Description |
|--------|-------|-------------|
| 503 | `Privacy Cash not initialized` | SDK not ready |
| 500 | `[error message]` | Internal error |

---

### Shield SOL

```
POST /api/shield
```

Move SOL from public balance to shielded pool (Privacy Cash).

**Request Body:**

```json
{
  "lamports": 100000000
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `lamports` | number | Yes | Amount to shield in lamports |

**Response:**

```json
{
  "success": true,
  "signature": "5abc123...",
  "message": "Shielded 0.1 SOL"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Request success status |
| `signature` | string | Solana transaction signature |
| `message` | string | Human-readable confirmation |

**Errors:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | `Invalid lamports amount` | Amount missing or <= 0 |
| 503 | `Privacy Cash not initialized` | SDK not ready |
| 500 | `[error message]` | Shield transaction failed |

---

### Withdraw from Shielded Pool

```
POST /api/withdraw
```

Withdraw SOL from shielded pool to a specified recipient address.

**Request Body:**

```json
{
  "lamports": 100000000,
  "recipientAddress": "RecipientPubkey111111111111111111111111111"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `lamports` | number | Yes | Amount to withdraw in lamports |
| `recipientAddress` | string | Yes | Solana address to receive funds |

**Response:**

```json
{
  "success": true,
  "signature": "5xyz789...",
  "recipient": "RecipientPubkey111111111111111111111111111",
  "amount": 100000000,
  "message": "Withdrew 0.1 SOL to RecipientPubkey111111111111111111111111111"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Request success status |
| `signature` | string | Solana transaction signature |
| `recipient` | string | Recipient address |
| `amount` | number | Amount withdrawn in lamports |
| `message` | string | Human-readable confirmation |

**Errors:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | `Invalid lamports amount` | Amount missing or <= 0 |
| 400 | `Recipient address required` | Missing recipient |
| 503 | `Privacy Cash not initialized` | SDK not ready |
| 500 | `[error message]` | Withdraw transaction failed |

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3000` | Server port |
| `RPC_URL` | No | `https://api.devnet.solana.com` | Solana RPC endpoint |
| `SERVICE_WALLET_KEY` | Yes | - | Service wallet secret key (base64 or JSON array) |

**SERVICE_WALLET_KEY Format:**

```bash
# Base64 format
SERVICE_WALLET_KEY="base64EncodedSecretKey..."

# JSON array format
SERVICE_WALLET_KEY="[1,2,3,...,64]"
```

---

## Error Response Format

All errors follow this format:

```json
{
  "success": false,
  "error": "Error description"
}
```

---

## Rate Limits

Public Solana devnet RPC has rate limits. The backend handles this with:

- Automatic retry with exponential backoff
- Max 3 retries per request
- 1-2 second delays between retries

For production, use a dedicated RPC provider.

---

## Example Usage

### cURL

```bash
# Health check
curl http://localhost:3000/api/health

# Get balance
curl http://localhost:3000/api/balance

# Shield SOL
curl -X POST http://localhost:3000/api/shield \
  -H "Content-Type: application/json" \
  -d '{"lamports": 100000000}'

# Withdraw
curl -X POST http://localhost:3000/api/withdraw \
  -H "Content-Type: application/json" \
  -d '{"lamports": 50000000, "recipientAddress": "YOUR_ADDRESS"}'
```

### JavaScript/TypeScript

```typescript
const API_URL = 'http://localhost:3000';

// Shield SOL
async function shieldSol(lamports: number) {
  const response = await fetch(`${API_URL}/api/shield`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lamports }),
  });
  return response.json();
}

// Withdraw
async function withdraw(lamports: number, recipientAddress: string) {
  const response = await fetch(`${API_URL}/api/withdraw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lamports, recipientAddress }),
  });
  return response.json();
}
```

---

## Running the Backend

```bash
cd backend-server

# Install dependencies
npm install

# Set environment variables
export SERVICE_WALLET_KEY="your-secret-key"
export RPC_URL="https://api.devnet.solana.com"

# Start server
npm start
```

---

## Related Documentation

- [SECURITY.md](SECURITY.md) - Security architecture
- [GUIDE.md](GUIDE.md) - User guide
- [PRIVACY.md](PRIVACY.md) - Privacy deep dive
