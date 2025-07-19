# ContractForge.io - No-Code Smart Contract Deployment Platform

A professional platform for deploying smart contracts without writing code. Deploy ERC20 tokens, NFT collections, DAOs, and token locks with premium features and multi-chain support.

## Features

### Core Features
- 🚀 **No-Code Deployment** - Deploy contracts through an intuitive UI
- 📝 **Multiple Templates** - ERC20 Token, NFT Collection, DAO, Token Lock
- 🔍 **Real-time Code Preview** - See the Solidity code before deployment
- ⛽ **Gas Estimation** - Real-time gas cost estimation with Infura/Alchemy
- 🌐 **Multi-Chain Support** - Ethereum, Polygon, Arbitrum, Optimism, BSC, and more
- 🌍 **Multi-Language** - English and French support
- 💰 **Platform Fee** - 2% commission on deployments

### Premium Features
- ⏸️ **Pausable** - Emergency pause functionality
- 🔥 **Burnable** - Token burning capability
- 🪙 **Mintable** - Mint new tokens after deployment
- 🎯 **Capped Supply** - Maximum supply limit
- 📸 **Snapshot** - Token balance snapshots
- ✍️ **Permit** - Gasless approvals
- 🗳️ **Voting Power** - Governance functionality
- 💎 **Royalties** - NFT royalty support
- And many more...

## Technology Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Framework**: Material-UI v5 with custom dark theme
- **Wallet Integration**: RainbowKit v2 + wagmi + viem
- **Internationalization**: i18next
- **Code Highlighting**: react-syntax-highlighter

### Smart Contracts
- **Solidity Version**: ^0.8.20
- **Standards**: OpenZeppelin Contracts v5
- **Compilation**: Foundry + Solc (primary) & Hardhat (fallback)
- **Testing**: Foundry Test Suite
- **Deployment**: Custom factory contracts
- **Standards**: EIP Standards Compliant

### Infrastructure
- **Platform Fee Address**: `0x09789515d075Ad4f657cF33a7f4adCe485Ee4f2E`
- **Factory Contracts**: Deployed on 10+ networks
- **Multi-Network Support**: Ethereum, Polygon, Arbitrum, Scroll, Gnosis, etc.

## Factory Contract Addresses

### Mainnet Deployments

| Network | Chain ID | Factory Address | Status |
|---------|----------|-----------------|--------|
| **Ethereum** | 1 | `0x2f9258a0024d389ee69bf9f4e44ab9120a359dc7` | ✅ Active |
| **Polygon** | 137 | `0x9ba797d0968bf4b48b639988c7ffedf28d3fee5a` | ✅ Active |
| **Arbitrum** | 42161 | `0x2F9258A0024d389eE69BF9F4E44aB9120a359DC7` | ✅ Active |
| **Optimism** | 10 | `0x2F9258A0024d389eE69BF9F4E44aB9120a359DC7` | ✅ Active |
| **BSC** | 56 | `0x2F9258A0024d389eE69BF9F4E44aB9120a359DC7` | ✅ Active |
| **Avalanche** | 43114 | `0x2F9258A0024d389eE69BF9F4E44aB9120a359DC7` | ✅ Active |
| **Base** | 8453 | `0x2F9258A0024d389eE69BF9F4E44aB9120a359DC7` | ✅ Active |
| **Scroll** | 534352 | `0x2F9258A0024d389eE69BF9F4E44aB9120a359DC7` | ✅ Active |
| **Gnosis** | 100 | `0x2F9258A0024d389eE69BF9F4E44aB9120a359DC7` | ✅ Active |
| **Celo** | 42220 | `0x2F9258A0024d389eE69BF9F4E44aB9120a359DC7` | ✅ Active |
| **Linea** | 59144 | `0x836ef37aa08F6089B4efEAdc55A864f6caff4a16` | ✅ Active |
| **Zora** | 7777777 | `0x2F9258A0024d389eE69BF9F4E44aB9120a359DC7` | ✅ Active |
| **HyperEVM** | 999 | `0x661b30Bf65e46B3Ae775e6Ac7Cdb5Fa7dab54df9` | ✅ Active |

### Pending Deployments

| Network | Chain ID | Status |
|---------|----------|--------|
| **Polygon zkEVM** | 1101 | 🟡 Scheduled |
| **zkSync Era** | 324 | 🟡 Scheduled |

### Testnet Deployments

| Network | Chain ID | Factory Address | Status |
|---------|----------|-----------------|--------|
| **Monad Testnet** | 10143 | `0x2F9258A0024d389eE69BF9F4E44aB9120a359DC7` | ✅ Active |

### Features by Factory

- **Full Factory** (8 premium features): Scroll, Gnosis, HyperEVM Big Blocks, Linea
- **Standard Factory** (6 features): Ethereum, Polygon, Arbitrum, Optimism, BSC, Avalanche, Base, Celo
- **Lite Factory** (2 features): HyperEVM Fast Blocks, Testnet deployments

## Prerequisites

- Node.js v18+ and npm/yarn
- Infura Project ID
- Alchemy API Key
- WalletConnect Project ID

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/contractforge.git
cd contractforge/smart-contract-deployer
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your API keys:
```
VITE_INFURA_PROJECT_ID=your_infura_project_id
VITE_ALCHEMY_API_KEY=your_alchemy_api_key
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

4. Start development server:
```bash
npm run dev
```

## Production Deployment

### Build for Production

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

### Environment Configuration

For production, ensure all environment variables are properly set:

- **API Keys**: Infura, Alchemy, WalletConnect (required)
- **Platform Fee Address**: Update to your production address
- **Chain Configuration**: Set default chain and testnet availability
- **Security**: Enable contract verification with Etherscan API key

### Deployment Options

1. **Static Hosting** (Vercel, Netlify, AWS S3 + CloudFront):
   ```bash
   npm run build
   # Deploy the dist/ folder
   ```

2. **Docker**:
   ```dockerfile
   FROM node:18-alpine as builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build

   FROM nginx:alpine
   COPY --from=builder /app/dist /usr/share/nginx/html
   EXPOSE 80
   ```

3. **Traditional Server**:
   - Build the project
   - Serve the `dist/` folder with nginx/Apache
   - Configure SSL certificates

### Security Considerations

1. **API Keys**: Never expose sensitive keys in frontend code
2. **Platform Fee Address**: Use a multi-sig wallet for production
3. **Contract Verification**: Always verify deployed contracts on Etherscan
4. **Rate Limiting**: Implement rate limiting for API calls
5. **CORS**: Configure proper CORS policies
6. **CSP**: Set Content Security Policy headers

### Performance Optimization

1. **CDN**: Use a CDN for static assets
2. **Compression**: Enable gzip/brotli compression
3. **Caching**: Set proper cache headers
4. **Code Splitting**: Already implemented with Vite
5. **Image Optimization**: Optimize all images

## Monitoring & Analytics

1. **Error Tracking**: Integrate Sentry or similar
2. **Analytics**: Google Analytics / Mixpanel integration ready
3. **Performance**: Use Web Vitals monitoring
4. **Uptime**: Monitor with services like UptimeRobot

## Maintenance

### Regular Updates
- Update OpenZeppelin contracts regularly
- Keep dependencies up to date
- Monitor gas price APIs for changes
- Update chain configurations as needed

### Backup & Recovery
- Regular database backups (if using backend)
- Store deployment history
- Keep contract source code verified

## Support

For issues and feature requests, please use the GitHub issue tracker.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

Users are responsible for understanding the smart contracts they deploy. Always review the generated code and understand the implications before deployment. This platform is provided as-is without warranties.