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
    },
  },
  paths: {
    sources: "./contracts",
    artifacts: "./artifacts",
    cache: "./cache"
  },
  networks: {
    hardhat: {
      chainId: 31337
    },
    arbitrum: {
      url: process.env.ARBITRUM_RPC || "https://arb1.arbitrum.io/rpc",
      accounts: (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY !== "your_private_key_here") ? [process.env.PRIVATE_KEY] : [],
      chainId: 42161,
      gasPrice: 100000000, // 0.1 gwei
      gas: 6000000
    },
    base: {
      url: process.env.BASE_RPC || "https://mainnet.base.org",
      accounts: (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY !== "your_private_key_here") ? [process.env.PRIVATE_KEY] : [],
      chainId: 8453,
      gasPrice: 1000000000, // 1 gwei
      gas: 6000000
    },
    ethereum: {
      url: process.env.ETHEREUM_RPC || `https://mainnet.infura.io/v3/${process.env.VITE_INFURA_PROJECT_ID}`,
      accounts: (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY !== "your_private_key_here") ? [process.env.PRIVATE_KEY] : [],
      chainId: 1,
      gasPrice: 1200000000, // 1.2 gwei (gas actuel)
      gas: 3000000 // Réduire un peu la limite
    }
  }
}; 