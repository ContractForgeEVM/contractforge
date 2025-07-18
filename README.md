# ContractForge.io - Professional Smart Contract Deployment Platform

A comprehensive no-code platform for deploying and managing smart contracts with subscription-based pricing, analytics, and premium features. Deploy ERC20 tokens, NFT collections, DAOs, token locks, and more across multiple blockchains.

## 🚀 Live Platform

**Website**: [ContractForge.io](https://contractforge.io)  
**Repository**: [GitHub - ContractForgeEVM/contractforge](https://github.com/ContractForgeEVM/contractforge)

## ✨ Key Features

### 🎯 Core Platform
- **No-Code Deployment** - Deploy smart contracts through intuitive UI
- **Real-time Code Preview** - See Solidity code before deployment
- **Gas Estimation** - Live gas cost calculation with multiple providers
- **Multi-Chain Support** - 12+ blockchain networks supported
- **Multi-Language** - English and French localization
- **Wallet Integration** - RainbowKit with multiple wallet support

### 💎 Premium Features
- **Pausable Contracts** - Emergency pause functionality
- **Burnable Tokens** - Token burning capability  
- **Mintable Tokens** - Post-deployment minting
- **Capped Supply** - Maximum supply limits
- **Snapshot Governance** - Token balance snapshots
- **Permit Functionality** - Gasless approvals (EIP-2612)
- **Voting Power** - Governance token features
- **NFT Royalties** - EIP-2981 royalty support
- **Access Control** - Role-based permissions
- **Upgradeable Contracts** - Proxy pattern support

### 🔧 Smart Contract Templates
1. **ERC20 Token** - Standard and premium fungible tokens
2. **NFT Collection** - ERC721 with advanced features
3. **DAO Governance** - Decentralized autonomous organization
4. **Token Lock** - Time-based token vesting
5. **Airdrop** - Bulk token distribution
6. **Multisig** - Multi-signature wallet
7. **Vesting** - Token vesting schedules

### 💳 Subscription System
- **Free Plan** - Basic compilation and testing (2% fees)
- **Starter Plan** - $9/month - 5 deployments, 1.5% fees
- **Pro Plan** - $19/month - 100 deployments, 2% fees, all templates
- **Enterprise Plan** - $99/month - 1000 deployments, 1.5% fees, API access

### 🪙 Crypto Payment Integration
- **USDC Payments** - Stable coin subscription payments
- **Multi-Chain Support** - Pay on Ethereum, Polygon, Arbitrum
- **Auto-Renewal** - Automatic subscription renewal
- **Transparent Pricing** - No hidden fees

### 📊 Analytics Dashboard
- **Real-time Metrics** - Deployment statistics and usage
- **User Analytics** - Session tracking and behavior
- **Performance Monitoring** - Platform health metrics
- **Revenue Tracking** - Subscription and fee analytics

### 🎨 Mint Page Generator
- **Custom Domains** - Branded mint pages
- **Subdomain System** - Free .contractforge.io subdomains
- **Customizable Design** - Color schemes and branding
- **Mobile Responsive** - Optimized for all devices

## 🏗️ Architecture

### Frontend Stack
- **Framework**: React 18 + TypeScript + Vite
- **UI Library**: Material-UI v5 with custom dark theme
- **Web3**: wagmi v2 + viem + RainbowKit
- **State Management**: React Context + Hooks
- **Internationalization**: i18next
- **Code Highlighting**: react-syntax-highlighter
- **Analytics**: Supabase integration

### Backend Services
- **API Server**: Node.js + Express + TypeScript
- **Smart Contract Compiler**: Foundry + Solc integration
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Wallet-based auth
- **File Storage**: Local + cloud integration
- **Rate Limiting**: Express rate limiter

### Smart Contracts
- **Solidity Version**: ^0.8.20
- **Standards**: OpenZeppelin Contracts v5.0
- **Compilation**: Foundry (primary) + Hardhat (fallback)
- **Testing**: Comprehensive test suite
- **Verification**: Etherscan integration
- **Security**: Audited contract templates

## 🌐 Multi-Chain Support

### Production Networks

| Network | Chain ID | Factory Address | Features |
|---------|----------|-----------------|----------|
| **Ethereum** | 1 | `0x2f9258a0024d389ee69bf9f4e44ab9120a359dc7` | Full Suite |
| **Polygon** | 137 | `0x9ba797d0968bf4b48b639988c7ffedf28d3fee5a` | Full Suite |
| **Arbitrum** | 42161 | `0x2F9258A0024d389eE69BF9F4E44aB9120a359DC7` | Full Suite |
| **Optimism** | 10 | `0x2F9258A0024d389eE69BF9F4E44aB9120a359DC7` | Full Suite |
| **BSC** | 56 | `0x2F9258A0024d389eE69BF9F4E44aB9120a359DC7` | Full Suite |
| **Avalanche** | 43114 | `0x2F9258A0024d389eE69BF9F4E44aB9120a359DC7` | Full Suite |
| **Base** | 8453 | `0x2F9258A0024d389eE69BF9F4E44aB9120a359DC7` | Full Suite |
| **Scroll** | 534352 | `0x2F9258A0024d389eE69BF9F4E44aB9120a359DC7` | Premium |
| **Gnosis** | 100 | `0x2F9258A0024d389eE69BF9F4E44aB9120a359DC7` | Premium |
| **Celo** | 42220 | `0x2F9258A0024d389eE69BF9F4E44aB9120a359DC7` | Full Suite |
| **Linea** | 59144 | `0x836ef37aa08F6089B4efEAdc55A864f6caff4a16` | Premium |
| **Zora** | 7777777 | `0x2F9258A0024d389eE69BF9F4E44aB9120a359DC7` | Full Suite |

### Testnet Support
- **Monad Testnet** | 10143 | Full testing environment
- **Base Sepolia** | 84532 | Development testing

## 🛠️ Development Setup

### Prerequisites
- Node.js v18+
- npm or yarn
- Git
- Foundry (for smart contract compilation)

### Installation

1. **Clone the repository**:
```bash
git clone https://github.com/ContractForgeEVM/contractforge.git
cd contractforge
```

2. **Install dependencies**:
```bash
# Frontend
cd smart-contract-deployer
npm install

# Backend API
cd ../smart-contract-compiler-api
npm install

# Frontend Generator
cd ../frontend-generator
npm install
```

3. **Environment Configuration**:

Create `.env` files in each directory:

**smart-contract-deployer/.env**:
```env
VITE_INFURA_PROJECT_ID=your_infura_project_id
VITE_ALCHEMY_API_KEY=your_alchemy_api_key
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
VITE_API_URL=http://localhost:3004
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**smart-contract-compiler-api/.env**:
```env
NODE_ENV=development
PORT=3004
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
FOUNDRY_PATH=/usr/local/bin/forge
ETHERSCAN_API_KEY=your_etherscan_api_key
```

4. **Start development servers**:

```bash
# Terminal 1 - Frontend
cd smart-contract-deployer
npm run dev

# Terminal 2 - Backend API
cd smart-contract-compiler-api
npm run dev

# Terminal 3 - Frontend Generator
cd frontend-generator
npm start
```

## 🚀 Production Deployment

### Automated Deployment Script

The project includes a comprehensive production deployment script:

```bash
./deploy-production.sh
```

This script:
- Builds all services (frontend, backend, frontend-generator)
- Creates Docker containers
- Deploys to production server (192.168.1.60)
- Sets up health checks and monitoring

### Manual Deployment

1. **Build for production**:
```bash
cd smart-contract-deployer
npm run build

cd ../smart-contract-compiler-api
npm run build

cd ../frontend-generator
npm run build
```

2. **Docker deployment**:
```bash
# Frontend
docker build -t contractforge-frontend ./smart-contract-deployer

# Backend
docker build -t contractforge-backend ./smart-contract-compiler-api

# Frontend Generator
docker build -t contractforge-frontend-generator ./frontend-generator
```

3. **Run containers**:
```bash
docker run -d -p 5173:5173 contractforge-frontend
docker run -d -p 3004:3004 contractforge-backend
docker run -d -p 3006:3006 contractforge-frontend-generator
```

## 📊 Database Schema

The platform uses Supabase with comprehensive schemas:

### Analytics Tables
- `page_views` - User navigation tracking
- `deployments` - Contract deployment history
- `premium_features` - Feature usage analytics
- `user_sessions` - Session management

### Subscription Tables
- `subscription_plans` - Available plans and pricing
- `users` - User wallet management
- `subscriptions` - Active subscriptions
- `checkout_sessions` - Payment processing
- `usage_tracking` - Resource usage monitoring

### Features Tables
- `mint_pages` - Custom mint page configurations
- `api_keys` - User API key management

## 🔐 Security Features

- **Wallet-based Authentication** - No passwords required
- **Contract Verification** - Automatic Etherscan verification
- **Rate Limiting** - API and deployment rate limits
- **Input Validation** - Comprehensive parameter validation
- **Audit Trail** - Complete deployment history
- **Multi-sig Support** - Enterprise-grade security

## 📈 Monitoring & Analytics

### Real-time Metrics
- Deployment success rates
- User engagement analytics
- Revenue tracking
- Performance monitoring

### Health Checks
- Service availability monitoring
- Database connection status
- Blockchain network status
- API endpoint health

## 🎨 Frontend Features

### User Interface
- **Dark Theme** - Professional dark mode design
- **Responsive Design** - Mobile-first approach
- **Accessibility** - WCAG compliant
- **Loading States** - Smooth user experience
- **Error Handling** - Comprehensive error messages

### User Experience
- **Step-by-step Wizards** - Guided deployment process
- **Real-time Preview** - Live code generation
- **Gas Estimation** - Accurate cost prediction
- **Transaction Tracking** - Deployment progress monitoring

## 🔧 API Documentation

### Authentication
```javascript
// Wallet-based authentication
const auth = useAccount()
```

### Deployment API
```javascript
POST /api/deploy
{
  "template": "erc20",
  "parameters": { ... },
  "network": "ethereum"
}
```

### Subscription API
```javascript
GET /api/subscription/plans
POST /api/subscription/checkout
GET /api/subscription/status
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenZeppelin for secure contract templates
- Foundry for fast compilation
- Material-UI for beautiful components
- Supabase for backend infrastructure
- The Ethereum community for continuous innovation

## 📞 Support

- **GitHub Issues**: [Report bugs and feature requests](https://github.com/ContractForgeEVM/contractforge/issues)
- **Documentation**: [Full documentation](https://docs.contractforge.io)
- **Community**: [Discord community](https://discord.gg/contractforge)

## ⚠️ Disclaimer

Users are responsible for understanding the smart contracts they deploy. Always review generated code and understand implications before deployment. This platform is provided as-is without warranties. Smart contract deployment involves real cryptocurrency transactions and should be done with caution.
