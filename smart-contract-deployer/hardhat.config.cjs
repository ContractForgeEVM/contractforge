require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  paths: {
    sources: "./contracts",
    artifacts: "./artifacts",
    cache: "./cache"
  },
  networks: {
    // 🌐 LOCAL/DEV NETWORKS
    hardhat: {
      chainId: 31337
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    },

    // 🚀 MAINNET NETWORKS - RPC PUBLICS GRATUITS
    ethereum: {
      url: process.env.ETHEREUM_RPC || "https://eth.llamarpc.com", // RPC public gratuit, pas de MEV
      accounts: (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY !== "your_private_key_here") ? [process.env.PRIVATE_KEY] : [],
      chainId: 1,
      // Paramètres dynamiques - pas de gasPrice fixe
      gas: 3000000 // Augmenté pour assurer le déploiement
    },
    arbitrum: {
      url: process.env.ARBITRUM_RPC || "https://arbitrum.llamarpc.com",
      accounts: (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY !== "your_private_key_here") ? [process.env.PRIVATE_KEY] : [],
      chainId: 42161,
      gasPrice: 100000000, // 0.1 gwei
      gas: 6000000
    },
    base: {
      url: process.env.BASE_RPC || "https://base.llamarpc.com",
      accounts: (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY !== "your_private_key_here") ? [process.env.PRIVATE_KEY] : [],
      chainId: 8453,
      gasPrice: 1000000000, // 1 gwei
      gas: 6000000
    },
    optimism: {
      url: process.env.OPTIMISM_RPC || "https://optimism.llamarpc.com",
      accounts: (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY !== "your_private_key_here") ? [process.env.PRIVATE_KEY] : [],
      chainId: 10,
      gasPrice: 1000000000, // 1 gwei
      gas: 6000000
    },
    polygon: {
      url: process.env.POLYGON_RPC || "https://polygon.llamarpc.com",
      accounts: (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY !== "your_private_key_here") ? [process.env.PRIVATE_KEY] : [],
      chainId: 137,
      gasPrice: 30000000000, // 30 gwei
      gas: 6000000
    },
    bnb: {
      url: process.env.BNB_RPC || "https://bsc-dataseed1.binance.org",
      accounts: (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY !== "your_private_key_here") ? [process.env.PRIVATE_KEY] : [],
      chainId: 56,
      gas: 6000000
    },
    avalanche: {
      url: process.env.AVALANCHE_RPC || "https://api.avax.network/ext/bc/C/rpc",
      accounts: (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY !== "your_private_key_here") ? [process.env.PRIVATE_KEY] : [],
      chainId: 43114,
      gasPrice: 25000000000, // 25 gwei
      gas: 6000000
    },
    celo: {
      url: process.env.CELO_RPC || "https://forno.celo.org",
      accounts: (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY !== "your_private_key_here") ? [process.env.PRIVATE_KEY] : [],
      chainId: 42220,
      gas: 6000000
    },
    linea: {
      url: process.env.LINEA_RPC || "https://rpc.linea.build",
      accounts: (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY !== "your_private_key_here") ? [process.env.PRIVATE_KEY] : [],
      chainId: 59144,
      gasPrice: 400000000, // 0.4 gwei - très économique
      gas: 2200000 // Optimisé pour le budget
    },
    scroll: {
      url: process.env.SCROLL_RPC || "https://rpc.scroll.io",
      accounts: (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY !== "your_private_key_here") ? [process.env.PRIVATE_KEY] : [],
      chainId: 534352,
      gasPrice: 1000000000, // 1 gwei
      gas: 6000000
    },
    zora: {
      url: process.env.ZORA_RPC || "https://rpc.zora.energy",
      accounts: (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY !== "your_private_key_here") ? [process.env.PRIVATE_KEY] : [],
      chainId: 7777777,
      gasPrice: 1000000000, // 1 gwei
      gas: 6000000
    },
    hyperevm: {
      url: process.env.HYPEREVM_RPC || "https://rpc.hyperliquid.xyz/evm",
      accounts: (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY !== "your_private_key_here") ? [process.env.PRIVATE_KEY] : [],
      chainId: 999, // HyperEVM Mainnet
      gasPrice: 1000000000, // 1 gwei
      gas: 6000000
    },

    // 🧪 TESTNET NETWORKS
    sepolia: {
      url: process.env.SEPOLIA_RPC || `https://sepolia.infura.io/v3/${process.env.VITE_INFURA_PROJECT_ID}`,
      accounts: (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY !== "your_private_key_here") ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
      gasPrice: 1000000000, // 1 gwei
      gas: 6000000
    },
    'monad-testnet': {
      url: process.env.MONAD_TESTNET_RPC || "https://testnet-rpc.monad.xyz",
      accounts: (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY !== "your_private_key_here") ? [process.env.PRIVATE_KEY] : [],
      chainId: 10143,
      gasPrice: 60000000000, // 60 gwei pour Monad testnet
      gas: 6000000
    }
  }
}; 