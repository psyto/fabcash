# Fabcash Privacy Backend

Production Privacy Cash backend for Fabcash.

## EC2 Deployment

### 1. Launch EC2 Instance

- Go to AWS Console → EC2 → Launch Instance
- **AMI**: Amazon Linux 2023 or Ubuntu 22.04
- **Instance type**: t3.micro (free tier) or t3.small
- **Key pair**: Create or select existing
- **Security group**: Allow inbound on port 3000 (or 80/443)
- Launch and note the public IP

### 2. Connect to Instance

```bash
ssh -i your-key.pem ec2-user@YOUR_EC2_IP
# or for Ubuntu:
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
```

### 3. Install Node.js

```bash
# Amazon Linux 2023
sudo yum install -y nodejs npm

# Ubuntu
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 4. Clone and Setup

```bash
git clone https://github.com/fabrknt/cash.git
cd cash/backend-server
npm install
```

### 5. Configure Environment

```bash
cp .env.example .env
nano .env
```

Set your values:
- `SERVICE_WALLET_KEY` - Your service wallet private key
- `RPC_URL` - Solana RPC (devnet or mainnet)

### 6. Run with PM2 (Production)

```bash
sudo npm install -g pm2
pm2 start server.js --name fabcash-backend
pm2 startup
pm2 save
```

### 7. Test

```bash
curl http://YOUR_EC2_IP:3000/api/health
```

## Security Notes

- Use HTTPS in production (nginx + certbot)
- Restrict security group to your app's IP if possible
- Never commit .env file
