require('@nomicfoundation/hardhat-toolbox')
require('dotenv').config()

/**
 * Configuration Hardhat spécifique pour Arbitrum
 * Utiliser avec: npx hardhat --config hardhat.arbitrum.config.cjs <command>
 */

const PRIVATE_KEY = process.env.PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000001'
const ARBITRUM_RPC = process.env.ARBITRUM_RPC || 'https://arb1.arbitrum.io/rpc'
const ARBISCAN_API_KEY = process.env.ARBISCAN_API_KEY || ''

module.exports = {
  solidity: {
    version: '0.8.20',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true // Améliore l'optimisation pour les gros contrats
    }
  },
  
  networks: {
    arbitrum: {
      url: ARBITRUM_RPC,
      chainId: 42161,
      accounts: [PRIVATE_KEY],
      gas: 'auto',
      gasPrice: 'auto',
      gasMultiplier: 1.2, // +20% marge de sécurité
      timeout: 60000, // 60 secondes timeout
      confirmations: 2 // Attendre 2 confirmations
    },
    arbitrumGoerli: {
      url: 'https://goerli-rollup.arbitrum.io/rpc',
      chainId: 421613,
      accounts: [PRIVATE_KEY],
      gas: 'auto',
      gasPrice: 'auto',
      gasMultiplier: 1.2
    },
    arbitrumSepolia: {
      url: 'https://sepolia-rollup.arbitrum.io/rpc', 
      chainId: 421614,
      accounts: [PRIVATE_KEY],
      gas: 'auto',
      gasPrice: 'auto',
      gasMultiplier: 1.2
    }
  },

  etherscan: {
    apiKey: {
      arbitrumOne: ARBISCAN_API_KEY,
      arbitrumGoerli: ARBISCAN_API_KEY,
      arbitrumSepolia: ARBISCAN_API_KEY
    },
    customChains: [
      {
        network: 'arbitrumOne',
        chainId: 42161,
        urls: {
          apiURL: 'https://api.arbiscan.io/api',
          browserURL: 'https://arbiscan.io/'
        }
      },
      {
        network: 'arbitrumGoerli', 
        chainId: 421613,
        urls: {
          apiURL: 'https://api-goerli.arbiscan.io/api',
          browserURL: 'https://goerli.arbiscan.io/'
        }
      },
      {
        network: 'arbitrumSepolia',
        chainId: 421614, 
        urls: {
          apiURL: 'https://api-sepolia.arbiscan.io/api',
          browserURL: 'https://sepolia.arbiscan.io/'
        }
      }
    ]
  },

  // Configuration spéciale pour Arbitrum
  mocha: {
    timeout: 120000 // 2 minutes pour les tests sur Arbitrum
  },

  // Configuration du gas reporter
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: 'USD',
    gasPrice: 0.1, // Arbitrum gas price approximatif en Gwei
    coinmarketcap: process.env.COINMARKETCAP_API_KEY
  },

  // Paths personnalisés si nécessaire
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts'
  }
}

// Log de configuration
console.log('🔧 Configuration Hardhat pour Arbitrum')
console.log('📡 RPC Arbitrum:', ARBITRUM_RPC)
console.log('🔑 Clé privée configurée:', PRIVATE_KEY !== '0x0000000000000000000000000000000000000000000000000000000000000001' ? '✅' : '❌')
console.log('🔍 Arbiscan API Key:', ARBISCAN_API_KEY ? '✅' : '❌')
console.log() 