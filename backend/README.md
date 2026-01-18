# Fabcash Privacy Backend

Vercel serverless backend for Privacy Cash operations.

## Architecture

```
Mobile App ──> This Backend ──> Privacy Cash SDK ──> Solana
                    │
                    └── Service wallet handles shielding/withdrawing
```

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/balance` | Get shielded balance |
| POST | `/api/shield` | Shield SOL into privacy pool |
| POST | `/api/withdraw` | Withdraw from pool to address |

## Setup

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Generate service wallet

```bash
node -e "
const { Keypair } = require('@solana/web3.js');
const wallet = Keypair.generate();
console.log('Public Key:', wallet.publicKey.toBase58());
console.log('Secret Key (for Vercel env):', JSON.stringify(Array.from(wallet.secretKey)));
"
```

### 3. Fund the service wallet (devnet)

```bash
solana airdrop 2 <SERVICE_WALLET_PUBLIC_KEY> --url devnet
```

### 4. Configure Vercel environment variables

In Vercel dashboard or via CLI:

```bash
vercel env add SERVICE_WALLET_SECRET
# Paste the secret key JSON array

vercel env add SOLANA_RPC_URL
# Use: https://api.devnet.solana.com
```

### 5. Deploy

```bash
vercel --prod
```

## API Usage

### Shield SOL

```bash
curl -X POST https://your-backend.vercel.app/api/shield \
  -H "Content-Type: application/json" \
  -d '{"lamports": 10000000, "userPubkey": "..."}'
```

### Withdraw SOL

```bash
curl -X POST https://your-backend.vercel.app/api/withdraw \
  -H "Content-Type: application/json" \
  -d '{"lamports": 10000000, "recipientAddress": "..."}'
```

### Get Balance

```bash
curl https://your-backend.vercel.app/api/balance
```

## Security Notes

- The service wallet holds funds temporarily during shielding
- In production, implement proper authentication
- Consider rate limiting and request validation
- Use encrypted environment variables for secrets
