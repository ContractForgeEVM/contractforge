# ContractForge.io API

Professional REST API service for smart contract compilation, deployment assistance, gas estimation, and contract verification. Built with enterprise-grade security, authentication, and rate limiting.

## 🚀 Features

### Core Services
- ✅ **Solidity Compilation** - Full Solidity 0.8.20 compiler with OpenZeppelin support
- ✅ **Deployment Assistance** - Gas estimation and deployment preparation
- ✅ **Contract Analysis** - Bytecode analysis and contract information
- ✅ **Verification Helper** - Contract verification preparation for block explorers
- ✅ **Multi-Chain Support** - Ethereum, Polygon, Arbitrum, Optimism, BSC, Avalanche, Base

### Security & Performance
- 🔐 **API Key Authentication** - Secure Bearer token authentication
- 📊 **Rate Limiting** - Customizable per-key rate limits
- 🛡️ **Security Headers** - Helmet.js security middleware
- 📝 **Request Logging** - Comprehensive Morgan logging
- ⚡ **Performance** - Optimized for high-throughput usage

### Enterprise Features
- 👥 **Multi-User Support** - User-based API key management
- 📈 **Usage Analytics** - Detailed usage statistics and monitoring
- 🔧 **Admin Dashboard** - API key management and analytics
- 🌐 **CORS Support** - Configurable cross-origin resource sharing
- 📦 **Production Ready** - Systemd, Nginx, and Docker support

## 📚 API Documentation

### Base URL
```
https://api.contractforge.io/v1
```

### Authentication
All endpoints require a valid API key in the Authorization header:
```bash
Authorization: Bearer YOUR_API_KEY
```

### Rate Limits
- **Unauthenticated**: 100 requests / 15 minutes
- **With API Key**: Customizable (default: 60/min, 1000/hour, 10000/day)
- **Headers**: Rate limit information included in response headers

## 🔧 Quick Start

### 1. Installation

```bash
git clone <repository>
cd smart-contract-compiler-api
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your configuration
```

**Required Variables:**
```env
PORT=3001
NODE_ENV=development
MASTER_API_KEY=your_secure_master_key
INFURA_PROJECT_ID=your_infura_project_id
```

### 3. Development

```bash
npm run dev
```

### 4. Production Deployment

```bash
chmod +x deploy-api.sh
./deploy-api.sh
```

## 📋 API Endpoints

### 🔨 Compilation

#### `POST /api/compile`
Compile Solidity smart contracts with OpenZeppelin support.

**Permissions Required:** `compile`

**Request:**
```json
{
  "sourceCode": "// SPDX-License-Identifier: MIT\npragma solidity ^0.8.20;\n\ncontract MyToken {\n    // Contract code\n}",
  "contractName": "MyToken"
}
```

**Response:**
```json
{
  "success": true,
  "contractName": "MyToken",
  "bytecode": "0x608060405234801561001057600080fd5b50...",
  "abi": [...],
  "warnings": []
}
```

### 🚀 Deployment

#### `POST /api/deploy`
Prepare contract deployment with gas estimation and instructions.

**Permissions Required:** `deploy`

**Request:**
```json
{
  "bytecode": "0x608060405234801561001057600080fd5b50...",
  "abi": [...],
  "constructorArgs": ["MyToken", "MTK", 1000000],
  "chainId": 1
}
```

**Response:**
```json
{
  "success": true,
  "network": "Ethereum Mainnet",
  "chainId": 1,
  "deployment": {
    "estimatedGas": "2100000",
    "estimatedCost": "42000000000000000",
    "estimatedCostFormatted": "0.042 ETH",
    "deploymentData": "0x..."
  },
  "instructions": {
    "message": "For security reasons, contracts must be deployed directly from your wallet",
    "steps": [...]
  }
}
```

### ⛽ Gas Estimation

#### `GET /api/gas-estimate`
Get detailed gas cost estimates for contract deployment.

**Permissions Required:** `gas-estimate`

**Parameters:**
- `bytecode` - Contract bytecode (required)
- `chainId` - Target network chain ID (optional, default: 1)
- `constructorArgs` - JSON array of constructor arguments (optional)

**Response:**
```json
{
  "success": true,
  "network": {
    "name": "Ethereum Mainnet",
    "chainId": 1,
    "symbol": "ETH"
  },
  "gasEstimate": {
    "estimatedGas": "2100000",
    "costs": {
      "slow": {
        "gasPrice": "20000000000",
        "gasPriceGwei": "20.0",
        "totalCost": "42000000000000000",
        "totalCostFormatted": "0.042 ETH",
        "estimatedConfirmation": "5-10 minutes"
      },
      "standard": {...},
      "fast": {...}
    }
  }
}
```

### 📄 Contract Information

#### `GET /api/contract/{address}`
Get information about deployed contracts.

**Permissions Required:** `contract-info`

**Parameters:**
- `address` - Contract address (required)
- `chainId` - Network chain ID (optional, default: 1)

**Response:**
```json
{
  "success": true,
  "contract": {
    "address": "0x...",
    "balance": "0",
    "balanceFormatted": "0.0 ETH",
    "transactionCount": 0,
    "bytecodeSize": 12345,
    "analysis": {
      "type": "ERC20 Token",
      "features": ["Token Transfer", "Pausable", "Mintable"],
      "standards": ["ERC20"]
    }
  },
  "network": {
    "explorerUrl": "https://etherscan.io/address/0x..."
  }
}
```

### ✅ Verification

#### `POST /api/verify`
Prepare contract verification data for block explorers.

**Permissions Required:** `verify`

**Request:**
```json
{
  "contractAddress": "0x...",
  "sourceCode": "// Contract source code",
  "contractName": "MyToken",
  "compilerVersion": "v0.8.20+commit.a1b79de6",
  "chainId": 1,
  "optimizationEnabled": false,
  "constructorArgs": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "explorer": "Etherscan",
  "verification": {
    "status": "prepared",
    "data": {...},
    "instructions": {
      "manual": [...],
      "webInterface": "https://etherscan.io/address/0x.../code"
    }
  }
}
```

## 🗝️ API Key Management

### Create API Key (Admin Only)

```bash
curl -X POST https://api.contractforge.io/v1/api/keys \
  -H "Authorization: Bearer MASTER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production App Key",
    "userId": "user123",
    "permissions": ["compile", "deploy", "gas-estimate", "contract-info", "verify"]
  }'
```

### List API Keys (Admin Only)

```bash
curl -X GET https://api.contractforge.io/v1/api/keys \
  -H "Authorization: Bearer MASTER_API_KEY"
```

### Revoke API Key (Admin Only)

```bash
curl -X DELETE https://api.contractforge.io/v1/api/keys/{keyId} \
  -H "Authorization: Bearer MASTER_API_KEY"
```

## 🏗️ Architecture

### Technology Stack

#### Backend Services
- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Security**: Helmet.js, CORS, Custom auth middleware
- **Blockchain**: Ethers.js v6

#### Smart Contract Compilation
- **Primary**: Foundry + Solc (fast native compilation)
- **Fallback**: Hardhat (JavaScript runtime)
- **Standards**: OpenZeppelin Contracts v4.9.6
- **Solidity**: ^0.8.20
- **Template Engine**: Custom generator with 15+ templates

#### Production Infrastructure  
- **Process Management**: Systemd
- **Reverse Proxy**: Nginx
- **SSL**: Let's Encrypt
- **Rate Limiting**: Custom middleware with per-key quotas
- **Platform Fee**: `0x2A5954bA696AD11BabD9B5398fa3ecA6Da98420C`

### Directory Structure
```
smart-contract-compiler-api/
├── src/
│   ├── middleware/          # Authentication & rate limiting
│   ├── models/             # API key management
│   ├── routes/             # API endpoints
│   ├── services/           # Core services
│   └── index.ts           # Main application
├── data/                  # API key storage
├── logs/                  # Application logs
├── deploy-api.sh         # Production deployment script
└── .env.example          # Environment configuration
```

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production with Docker
```bash
docker build -t contractforge-api .
docker run -p 3001:3001 --env-file .env contractforge-api
```

### Production with Systemd
```bash
./deploy-api.sh
```

The deployment script automatically:
- ✅ Validates environment configuration
- ✅ Installs dependencies and builds the project
- ✅ Creates systemd service files
- ✅ Configures Nginx with SSL
- ✅ Sets up security headers and rate limiting
- ✅ Starts the service and validates deployment

## 🔒 Security

### Authentication
- Bearer token authentication for all endpoints
- Secure API key generation with bcrypt hashing
- Master key protection for admin operations

### Rate Limiting
- Global rate limits for unauthenticated requests
- Per-API-key customizable rate limits
- Three-tier limiting: per-minute, per-hour, per-day

### Security Headers
- Strict Transport Security (HSTS)
- Content Security Policy (CSP)
- X-Frame-Options, X-Content-Type-Options
- Referrer Policy configuration

### Production Security
- Nginx reverse proxy with rate limiting
- SSL/TLS termination
- Security-focused systemd service configuration
- Log rotation and monitoring

## 📊 Monitoring

### Health Checks
- `GET /health` - Basic health check
- `GET /status` - Detailed service status

### Logging
- Request/response logging with Morgan
- Error logging with stack traces
- API usage statistics per key

### Production Monitoring
```bash
# Service status
sudo systemctl status contractforge-api

# View logs
sudo journalctl -u contractforge-api -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
```

## 🌐 Multi-Chain Support

### Supported Networks
- **Ethereum Mainnet** (Chain ID: 1)
- **Polygon** (Chain ID: 137)
- **Arbitrum One** (Chain ID: 42161)
- **Optimism** (Chain ID: 10)
- **BNB Smart Chain** (Chain ID: 56)
- **Avalanche C-Chain** (Chain ID: 43114)
- **Base** (Chain ID: 8453)

### Testnet Support
- **Sepolia** (Chain ID: 11155111)
- **Mumbai** (Chain ID: 80001)

## 🤝 Integration Examples

### JavaScript/TypeScript
```javascript
const response = await fetch('https://api.contractforge.io/v1/api/compile', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    sourceCode: contractCode,
    contractName: 'MyToken'
  })
});

const result = await response.json();
```

### Python
```python
import requests

response = requests.post(
    'https://api.contractforge.io/v1/api/compile',
    headers={
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
    },
    json={
        'sourceCode': contract_code,
        'contractName': 'MyToken'
    }
)

result = response.json()
```

### cURL
```bash
curl -X POST https://api.contractforge.io/v1/api/compile \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"sourceCode": "contract code", "contractName": "MyToken"}'
```

## 📝 Error Handling

### HTTP Status Codes
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (missing or invalid API key)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (endpoint or resource not found)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

### Error Response Format
```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message",
  "suggestions": ["Possible solutions..."]
}
```

## 🛠️ Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Infura account (for blockchain RPC access)

### Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Copy environment file: `cp .env.example .env`
4. Configure `.env` with your settings
5. Start development server: `npm run dev`

### Testing
```bash
npm test                    # Run tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
```

### Building
```bash
npm run build              # Build for production
npm run lint               # Lint code
npm run type-check         # TypeScript check
```

## 📞 Support

### Documentation
- API Documentation: `https://api.contractforge.io/v1/`
- Frontend Integration: `https://contractforge.io/docs/api`

### Contact
- Technical Issues: Create an issue in the repository
- Business Inquiries: contact@contractforge.io
- Security Issues: security@contractforge.io

### License
This project is proprietary software. All rights reserved.