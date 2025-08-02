// Configuration des adresses de la UniversalFactory par réseau
export const UNIVERSAL_FACTORY_ADDRESSES: Record<number, string> = {
  // 🚨 REDÉPLOIEMENTS COMPLETS AVEC NOUVELLE PLATFORM_FEE_ADDRESS (Août 2025) 🚨
  
  // ✅ DÉPLOIEMENTS LEDGER #1 - NOUVELLE ADRESSE FEE: 0x2A5954bA696AD11BabD9B5398fa3ecA6Da98420C
  1: '0xbCEabbe19292e64408AA168f8e39Eb05f92bcfd0', // Ethereum Mainnet ✅
  42161: '0x5077b0ebbf5854c701f580e6921b19a05fdfadf3', // Arbitrum ✅ (ancienne fee addr)
  137: '0xB18FF5A80F6C34cf31C026a0225847aF2552366D', // Polygon ✅
  56: '0xbCEabbe19292e64408AA168f8e39Eb05f92bcfd0', // BNB Smart Chain ✅ (ancienne fee addr)
  10: '0x7ee5BbF0023011AF23592e67A2bb1b551746b1E4', // Optimism ✅
  8453: '0x7ee5BbF0023011AF23592e67A2bb1b551746b1E4', // Base ✅
  59144: '0xbCEabbe19292e64408AA168f8e39Eb05f92bcfd0', // Linea ✅
  534352: '0x320649FF14aB842D1e5047AEf2Db33661FEc9942', // Scroll ✅
  7777777: '0xbCEabbe19292e64408AA168f8e39Eb05f92bcfd0', // Zora Network ✅
  42220: '0xbCEabbe19292e64408AA168f8e39Eb05f92bcfd0', // Celo ✅
  43114: '0x3dAE8C5D28F02C2b2F04DF97f7d785BB1761B544', // Avalanche C-Chain ✅
  100: '0xbCEabbe19292e64408AA168f8e39Eb05f92bcfd0', // Gnosis Chain ✅
  999: '0xbCEabbe19292e64408AA168f8e39Eb05f92bcfd0', // HyperEVM Mainnet (Big Blocks) ✅
  
  // Testnets  
  10143: '0x57cf238111014032FF4c0A981B021eF96bc1E09F', // Monad Testnet - ✅ DÉPLOYÉ LEDGER
  41454: '0x836ef37aa08F6089B4efEAdc55A864f6caff4a16', // Monad Testnet (alt chain ID) - ✅ DÉPLOYÉ
  84532: '0x57cf238111014032FF4c0A981B021eF96bc1E09F', // Base Sepolia - ✅ DÉPLOYÉ LEDGER
  11155111: '0x57cf238111014032FF4c0A981B021eF96bc1E09F', // Ethereum Sepolia - ✅ DÉPLOYÉ LEDGER
  80001: '0x0000000000000000000000000000000000000000', // Mumbai - À DÉPLOYER
  
  // Local/Development  
  31337: '0x5FbDB2315678afecb367f032d93F642f64180aa3', // Hardhat local - ADRESSE HARDHAT OK
  1337: '0x0000000000000000000000000000000000000000', // Ganache - À définir
}

// Import de l'ABI complète du UniversalFactory
export { UNIVERSAL_FACTORY_ABI, UNIVERSAL_FACTORY_BYTECODE } from './universalFactoryAbi'

export const getFactoryAddress = (chainId: number): string | null => {
  const address = UNIVERSAL_FACTORY_ADDRESSES[chainId]
  return address !== '0x0000000000000000000000000000000000000000' ? address : null
} 