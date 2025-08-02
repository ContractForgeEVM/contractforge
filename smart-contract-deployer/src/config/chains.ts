import {
  mainnet,
  polygon,
  arbitrum,
  optimism,
  bsc,
  avalanche,
  gnosis,
  celo,
  base,
  baseSepolia,
  sepolia,
  scroll,
  linea,
} from 'wagmi/chains'
import { defineChain } from 'viem'
import { getFactoryAddress } from './factories'

export const hardhatLocal = defineChain({
  id: 31337,
  name: 'Hardhat Local',
  network: 'hardhat-local',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
    },
    public: {
      http: ['http://127.0.0.1:8545'],
    },
  },
  blockExplorers: {
    default: { name: 'Hardhat Local', url: '' },
  },
  testnet: true,
})

export const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  network: 'monad-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'MON',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.monad.xyz'],
    },
    public: {
      http: ['https://rpc.testnet.monad.xyz'],
    },
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: 'https://explorer.monad.xyz' },
  },
  testnet: true,
})
export const hyperEVM = defineChain({
  id: 999,
  name: 'HyperEVM',
  network: 'hyperevm',
  nativeCurrency: {
    decimals: 18,
    name: 'HYPE',
    symbol: 'HYPE',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.hyperevm.com'],
    },
    public: {
      http: ['https://rpc.hyperevm.com'],
    },
  },
  blockExplorers: {
    default: { name: 'HyperEVM Scan', url: 'https://explorer.hyperevm.com' },
  },
  testnet: false,
})
export const hyperEVMTestnet = defineChain({
  id: 998,
  name: 'HyperEVM Testnet',
  network: 'hyperevm-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'HYPE',
    symbol: 'HYPE',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.hyperevm.com'],
    },
    public: {
      http: ['https://rpc.testnet.hyperevm.com'],
    },
  },
  blockExplorers: {
    default: { name: 'HyperEVM Testnet Explorer', url: 'https://testnet.explorer.hyperevm.com' },
  },
  testnet: true,
})
export const zora = defineChain({
  id: 7777777,
  name: 'Zora',
  network: 'zora',
  nativeCurrency: {
    decimals: 18,
    name: 'ETH',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.zora.energy'],
    },
    public: {
      http: ['https://rpc.zora.energy'],
    },
  },
  blockExplorers: {
    default: { name: 'Zora Explorer', url: 'https://explorer.zora.energy' },
  },
  testnet: false,
})
const ENABLE_TESTNETS = import.meta.env.VITE_ENABLE_TESTNETS === 'true'
const IS_DEVELOPMENT = import.meta.env.DEV

export const productionChains = [
  mainnet,      // ✅ Factory: 0xbCEabbe19292e64408AA168f8e39Eb05f92bcfd0
  polygon,      // ✅ Factory: 0xB18FF5A80F6C34cf31C026a0225847aF2552366D
  arbitrum,     // ✅ Factory: 0x5077b0ebbf5854c701f580e6921b19a05fdfadf3
  optimism,     // ✅ Factory: 0x7ee5BbF0023011AF23592e67A2bb1b551746b1E4
  bsc,          // ✅ Factory: 0xbCEabbe19292e64408AA168f8e39Eb05f92bcfd0
  avalanche,    // ✅ Factory: 0x3dAE8C5D28F02C2b2F04DF97f7d785BB1761B544
  base,         // ✅ Factory: 0x7ee5BbF0023011AF23592e67A2bb1b551746b1E4
  gnosis,       // ✅ Factory: 0xbCEabbe19292e64408AA168f8e39Eb05f92bcfd0
  celo,         // ✅ Factory: 0xbCEabbe19292e64408AA168f8e39Eb05f92bcfd0
  scroll,       // ✅ Factory: 0x320649FF14aB842D1e5047AEf2Db33661FEc9942
  linea,        // ✅ Factory: 0xbCEabbe19292e64408AA168f8e39Eb05f92bcfd0
  hyperEVM,     // ✅ Factory: 0xbCEabbe19292e64408AA168f8e39Eb05f92bcfd0
  zora,         // ✅ Factory: 0xbCEabbe19292e64408AA168f8e39Eb05f92bcfd0
  // ❌ Chaînes non supportées supprimées : fantom, moonbeam, moonriver, harmonyOne, zkSync
] as const

export const testnetChains = [
  sepolia,         // ✅ Factory: 0x57cf238111014032FF4c0A981B021eF96bc1E09F
  baseSepolia,     // ✅ Factory: 0x57cf238111014032FF4c0A981B021eF96bc1E09F
  monadTestnet,    // ✅ Factory: 0x57cf238111014032FF4c0A981B021eF96bc1E09F
  // ❌ Testnets non supportés supprimés : polygonMumbai, arbitrumSepolia, optimismSepolia, 
  //    bscTestnet, avalancheFuji, scrollSepolia, lineaSepolia, hyperEVMTestnet
] as const

// En développement, toujours inclure Hardhat
const developmentChains = IS_DEVELOPMENT ? [hardhatLocal] : []

/**
 * Filtre les chaînes pour ne garder que celles qui ont une factory déployée
 */
function filterCompatibleChains(chainList: readonly any[]) {
  return chainList.filter(chain => {
    const factoryAddress = getFactoryAddress(chain.id)
    const isCompatible = factoryAddress !== null
    
    if (!isCompatible) {
      console.log(`🚫 Chain ${chain.name} (${chain.id}) excluded - no factory deployed`)
    } else {
      console.log(`✅ Chain ${chain.name} (${chain.id}) included - factory at ${factoryAddress}`)
    }
    
    return isCompatible
  })
}

// Filtrer toutes les chaînes pour ne garder que celles compatibles
const compatibleProductionChains = filterCompatibleChains(productionChains)
const compatibleTestnetChains = filterCompatibleChains(testnetChains)
const compatibleDevelopmentChains = filterCompatibleChains(developmentChains)

export const chains = ENABLE_TESTNETS
  ? [...compatibleProductionChains, ...compatibleTestnetChains, ...compatibleDevelopmentChains]
  : [...compatibleProductionChains, ...compatibleDevelopmentChains]

// Export pour référence des chaînes compatibles
export const compatibleChains = chains
export const totalChainsBeforeFilter = productionChains.length + testnetChains.length + developmentChains.length
export const totalCompatibleChains = chains.length

// Log des statistiques de filtrage
console.log(`🔗 Chain filtering results:`)
console.log(`📊 Total chains defined: ${totalChainsBeforeFilter}`)
console.log(`✅ Compatible chains: ${totalCompatibleChains}`)
console.log(`🚫 Filtered out: ${totalChainsBeforeFilter - totalCompatibleChains}`)
console.log(`📋 Compatible chain IDs: [${chains.map(c => c.id).join(', ')}]`)

export const defaultChainId = parseInt(import.meta.env.VITE_DEFAULT_CHAIN_ID || '1')