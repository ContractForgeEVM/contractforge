require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Configuration simplifiée pour le déploiement des contrats de souscription
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: "./contracts",
    artifacts: "./artifacts",
    cache: "./cache"
  },
  networks: {
    // Mainnets seulement
    ethereum: {
      url: process.env.ETHEREUM_RPC || `https://mainnet.infura.io/v3/${process.env.VITE_INFURA_PROJECT_ID}`,
      accounts: (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY !== "your_private_key_here") ? [process.env.PRIVATE_KEY] : [],
      chainId: 1,
      gasPrice: 2000000000, // 2 gwei (plus élevé pour débloquer)
      gas: 6000000, // 6M gas limit
    },
    base: {
      url: process.env.BASE_RPC || "https://mainnet.base.org",
      accounts: (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY !== "your_private_key_here") ? [process.env.PRIVATE_KEY] : [],
      chainId: 8453,
      gasPrice: 1000000000, // 1 gwei
      gas: 6000000, // 6M gas limit
    },
    arbitrum: {
      url: process.env.ARBITRUM_RPC || "https://arb1.arbitrum.io/rpc",
      accounts: (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY !== "your_private_key_here") ? [process.env.PRIVATE_KEY] : [],
      chainId: 42161,
      gasPrice: 100000000, // 0.1 gwei
    },
  },
  paths: {
    sources: "./src/contracts-simple",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
}; 