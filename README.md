# 🚀 ContractForge - Smart Contract Platform

A comprehensive smart contract platform for generating, compiling, deploying, and managing Solidity contracts with advanced features and multi-chain support.

## 📋 Overview

ContractForge is a complete smart contract platform that allows you to quickly generate, compile, and deploy smart contracts using predefined templates and customizable configurations. It includes basic contracts (ERC20, ERC721, DAO, Lock) and advanced contracts (Liquidity Pool, Yield Farming, NFT Marketplace, etc.) with multi-chain deployment capabilities.

## 🏗️ Technology Stack

### Frontend (`smart-contract-deployer/`)
- **React 18** + TypeScript
- **Vite** Build Tool  
- **Material-UI v5** (User Interface)
- **RainbowKit v2** (Wallet connection)
- **wagmi + viem** (Ethereum interactions)
- **Supabase** (Database & Analytics)
- **i18n** (Multi-language support)

### Backend API (`smart-contract-compiler-api/`)
- **Node.js 18+** (Backend runtime)
- **Express.js** with TypeScript
- **Foundry** (Primary fast compilation)
- **Hardhat** (Fallback compiler)
- **Supabase** (Database & Storage)
- **Rate Limiting** & **Authentication**

### Smart Contracts
- **OpenZeppelin Contracts v4.9.6** (Secure library)
- **Solidity ^0.8.20** (Smart contract language)
- **Foundry + Solc** (Primary compiler)
- **Hardhat** (Fallback compiler)
- **EIP Standards Compliant** (Ethereum standards)
- **Multi-chain Support** (15+ networks)

### Infrastructure & DevOps
- **Docker** (Containerization)
- **Multi-chain Deployment Scripts**
- **Hardware Wallet Support** (Ledger/Trezor)
- **Analytics & Monitoring**
- **Subscription Management (USDC)**

## 🚀 Quick Start

### 1. Backend API Setup
```bash
cd smart-contract-compiler-api
npm install
npm run build
npm start
```
Starts the compilation API server on port 3004.

### 2. Frontend Setup
```bash
cd smart-contract-deployer
npm install
npm run dev
```
Starts the frontend development server on port 5173.

### 3. Docker Deployment
```bash
# Build and run API
cd smart-contract-compiler-api
docker build -t contractforge-api .
docker run -p 3004:3004 contractforge-api

# Build and run Frontend
cd smart-contract-deployer
docker build -t contractforge-frontend .
docker run -p 5173:5173 contractforge-frontend
```

## 🏗️ Project Structure

### 📁 Core Components

| Directory | Technology Stack | Description | Purpose |
|-----------|------------------|-------------|---------|
| `smart-contract-compiler-api/` | Node.js + Express + Foundry | Backend compilation API server | Contract compilation, template generation, and REST API endpoints |
| `smart-contract-deployer/` | React 18 + TypeScript + Vite | Frontend web application | User interface for contract creation, deployment, and management |

### 🚀 Deployment Scripts

| File | Purpose | Description |
|------|---------|-------------|
| `deploy-production.sh` | Full production deployment | Complete platform deployment with both frontend and backend |
| `deploy-backend.sh` | Backend-only deployment | API server deployment script |
| `deploy-frontend.sh` | Frontend-only deployment | React application deployment script |

### 📂 Configuration Files

| File | Purpose | Description |
|------|---------|-------------|
| `.gitignore` | Git exclusions | Main gitignore with 100+ patterns for clean repository |
| `.gitmodules` | Git submodules | Submodule configuration |
| `README.md` | Project documentation | Complete project overview and setup guide |

## ⚙️ Configuration

### Environment Variables

#### Backend API (`.env`)
```env
NODE_ENV=development
PORT=3004
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
FOUNDRY_PATH=/root/.foundry/bin
OPENAI_API_KEY=your_openai_key (optional)
```

#### Frontend (`.env.local`)
```env
VITE_API_URL=http://localhost:3004
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_id
VITE_ALCHEMY_API_KEY=your_alchemy_key
```

## 🔧 Available Features

### 🪙 ERC20 Tokens
- ✅ **Pausable** (Transfer pause functionality)
- ✅ **Mintable** (Create new tokens)
- ✅ **Burnable** (Burn tokens)
- ✅ **Capped** (Supply limit)
- ✅ **Whitelist** (Allowed addresses)
- ✅ **Tax** (Transfer fees)
- ✅ **Permit** (Gasless approvals)
- ✅ **Votes** (Governance voting power)
- ✅ **Snapshot** (Point-in-time balances)
- ✅ **Flashmint** (Flash loan minting)

### 🎨 ERC721 NFTs
- ✅ **Pausable** (Transfer pause functionality)
- ✅ **Mintable** (Create new NFTs)
- ✅ **Burnable** (Burn NFTs)
- ✅ **Royalties** (Creator royalties EIP-2981)
- ✅ **URI Storage** (Metadata storage)
- ✅ **Capped** (Supply limit)
- ✅ **Snapshot** (Point-in-time ownership)
- ✅ **Auction** (Bidding system)
- ✅ **Oracle** (Price feeds integration)

### 🏛️ DAOs & Governance
- ✅ **Pausable** (Emergency pause)
- ✅ **Mintable** (Governance token minting)
- ✅ **Burnable** (Token burning)
- ✅ **Capped** (Token supply cap)
- ✅ **Snapshot** (Voting snapshots)
- ✅ **Timelock** (Execution delay)

### 🔒 Token Locks & Vesting
- ✅ **Vesting** (Progressive token release)
- ✅ **Timelock** (Time-based locks)
- ✅ **Multisig** (Multi-signature control)

### 🏊 DeFi Protocols
- ✅ **Liquidity Pool** (AMM pools)
- ✅ **Yield Farming** (Reward distribution)
- ✅ **Social Token** (Community tokens)
- ✅ **Revenue Sharing** (Profit distribution)
- ✅ **Loyalty Program** (Customer rewards)

### 🎮 Advanced Contracts
- ✅ **Dynamic NFT** (Upgradeable metadata)
- ✅ **NFT Marketplace** (Trading platform)
- ✅ **GameFi Token** (Gaming rewards)

### 🌐 Multi-Chain Support
- ✅ **Ethereum** (Mainnet & Sepolia)
- ✅ **Polygon** (MATIC & Mumbai)
- ✅ **Arbitrum** (L2 scaling)
- ✅ **Optimism** (L2 scaling)
- ✅ **Base** (Coinbase L2)
- ✅ **BSC** (Binance Smart Chain)
- ✅ **Avalanche** (AVAX)
- ✅ **Fantom** (FTM)
- ✅ **Gnosis** (xDAI)
- ✅ **Celo** (Mobile-first)
- ✅ **Scroll** (zkEVM)
- ✅ **Linea** (ConsenSys zkEVM)
- ✅ **zkSync Era** (Matter Labs)
- ✅ **Zora** (NFT-focused)
- ✅ **Monad** (Testnet)

## 📊 Platform Statistics

```
🚀 ContractForge Platform Status
==================================================
📊 Contract Templates: 12+ types available
🌐 Supported Networks: 15+ blockchains
🔧 Features Available: 25+ premium features
⚡ Compilation: Foundry + Hardhat support
💾 Database: Supabase integration
🔐 Security: Audited templates

📈 Recent Updates (2024)
==============================
✅ Cleaned repository (removed 80+ .md files)
✅ Updated .gitignore (added 100+ patterns)
✅ Multi-chain deployment scripts
✅ Hardware wallet support (Ledger/Trezor)
✅ Subscription system (USDC payments)
✅ Analytics & monitoring dashboard
✅ Docker containerization
```

## 🎯 Recommended Usage

### 🆕 For Beginners
1. **Start Frontend**: `cd smart-contract-deployer && npm run dev`
2. **Choose Template**: Select from ERC20, ERC721, or DAO
3. **Configure**: Add your token name, symbol, and features
4. **Deploy**: Connect wallet and deploy to testnet first

### 🏗️ For Developers
1. **Setup API**: `cd smart-contract-compiler-api && npm start`
2. **Custom Templates**: Modify templates in `/src/utils/`
3. **Test Compilation**: Use `/api/compile` endpoint
4. **Integrate**: Use REST API for custom applications

### 🏢 For Production
1. **Deploy Backend**: Use `deploy-package-backend/`
2. **Setup Environment**: Configure all `.env` variables
3. **Enable Analytics**: Setup Supabase database
4. **Scale**: Use Docker containers for production

## 🛠️ API Endpoints

```bash
# Compilation
POST /api/compile - Compile Solidity contracts
POST /api/web/compile/template - Generate from template

# Analytics  
GET /api/analytics/dashboard - Get platform metrics
POST /api/analytics/pageview - Track page views

# Deployment
POST /api/deploy - Deploy contracts
GET /api/gas-estimate - Estimate gas costs

# Management
GET /api/health - Check API status
POST /api/verify - Verify contract source
```

## 📚 Documentation

- **Repository**: Clean and organized (recently cleaned 80+ docs)
- **API Documentation**: Available at `/api/health` endpoint
- **Frontend**: React components with TypeScript
- **Smart Contracts**: OpenZeppelin-based secure templates

## ⚠️ Security

- ✅ **Always audit** contracts before mainnet deployment
- ✅ **Test thoroughly** on testnets first (Sepolia, Mumbai, etc.)
- ✅ **Use audited** OpenZeppelin dependencies (v4.9.6)
- ✅ **Verify contracts** on block explorers after deployment
- ✅ **Rate limiting** on API endpoints
- ✅ **Input validation** for all template parameters
- ✅ **Hardware wallet** support for secure deployments

## 🔗 Dependencies

### Core Dependencies
- **Node.js 18+** (Runtime environment)
- **OpenZeppelin Contracts v4.9.6** (Secure smart contract library)
- **Solidity ^0.8.20** (Smart contract language)
- **Foundry** (Primary compilation toolkit)
- **Hardhat** (Fallback compiler & testing)

### Frontend Dependencies
- **React 18** + **TypeScript** (UI framework)
- **Vite** (Build tool & dev server)
- **Material-UI v5** (Component library)
- **RainbowKit v2** (Wallet connection)
- **wagmi + viem** (Ethereum interaction)

### Backend Dependencies
- **Express.js** (API framework)
- **Supabase** (Database & analytics)
- **Docker** (Containerization)
- **Axios** (HTTP client)

## 📝 Generated Contract Examples

### ERC20 Token with Premium Features
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ContractForgeToken is ERC20, ERC20Pausable, ERC20Permit, Ownable {
    constructor(
        string memory name,
        string memory symbol,
        uint256 totalSupply
    ) ERC20(name, symbol) ERC20Permit(name) {
        _mint(msg.sender, totalSupply * 10**decimals());
    }
    
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Pausable) {
        super._beforeTokenTransfer(from, to, amount);
    }
}
```

### NFT Collection with Royalties & Minting
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract ContractForgeNFT is ERC721, ERC721URIStorage, ERC2981, Ownable, ReentrancyGuard {
    uint256 private _tokenIdCounter;
    uint256 public maxSupply;
    uint256 public mintPrice;
    
    constructor(
        string memory name,
        string memory symbol,
        uint256 _maxSupply,
        uint256 _mintPrice
    ) ERC721(name, symbol) {
        maxSupply = _maxSupply;
        mintPrice = _mintPrice;
        _setDefaultRoyalty(msg.sender, 500); // 5% royalty
    }
    
    function mint(string memory uri) external payable nonReentrant {
        require(_tokenIdCounter < maxSupply, "Max supply reached");
        require(msg.value >= mintPrice, "Insufficient payment");
        
        uint256 tokenId = _tokenIdCounter++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);
    }
    
    function tokenURI(uint256 tokenId)
        public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721, ERC721URIStorage, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
```

## 🆘 Troubleshooting

If you encounter issues:

1. **Check Node.js version**: `node --version` (requires 18+)
2. **Verify API is running**: Visit `http://localhost:3004/health`
3. **Check environment variables**: Ensure all `.env` files are configured
4. **Review compilation logs**: Check API logs for Foundry/Hardhat errors
5. **Verify network connection**: Ensure RPC endpoints are accessible
6. **Check wallet connection**: Ensure RainbowKit is properly configured

### Common Issues
- **Compilation fails**: Check OpenZeppelin version compatibility
- **Deployment fails**: Verify network configuration and gas settings
- **Wallet not connecting**: Check WalletConnect project ID
- **API not responding**: Verify Docker containers are running

## 🚀 Recent Major Updates (2024)

- ✅ **Repository Cleanup**: Removed 80+ documentation files for cleaner structure
- ✅ **Enhanced .gitignore**: Added 100+ patterns to exclude development/build files
- ✅ **Multi-chain Support**: Added 15+ blockchain networks
- ✅ **Hardware Wallet Integration**: Ledger & Trezor support for secure deployments
- ✅ **USDC Subscription System**: Payment processing for premium features
- ✅ **Analytics Dashboard**: Real-time platform metrics and user analytics
- ✅ **Docker Containerization**: Production-ready deployment packages
- ✅ **Security Enhancements**: Rate limiting, input validation, and audit tools

## 📄 License

MIT License - Generated by ContractForge.io

---

**⚠️ Important**: Always audit smart contracts before production deployment. ContractForge provides templates - thorough testing and security reviews are essential for mainnet launches.
