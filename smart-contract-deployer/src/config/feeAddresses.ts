// Configuration des adresses de frais par réseau (plateforme ET premium)
export const PLATFORM_FEE_ADDRESSES: Record<number, string> = {
  // Local
  31337: '0x2A5954bA696AD11BabD9B5398fa3ecA6Da98420C', // Local Hardhat
  // Mainnet
  1: '0x2A5954bA696AD11BabD9B5398fa3ecA6Da98420C', // Ethereum
  137: '0x2A5954bA696AD11BabD9B5398fa3ecA6Da98420C', // Polygon
  42161: '0x2A5954bA696AD11BabD9B5398fa3ecA6Da98420C', // Arbitrum
  10: '0x2A5954bA696AD11BabD9B5398fa3ecA6Da98420C', // Optimism
  56: '0x2A5954bA696AD11BabD9B5398fa3ecA6Da98420C', // BSC
  43114: '0x2A5954bA696AD11BabD9B5398fa3ecA6Da98420C', // Avalanche
  8453: '0x2A5954bA696AD11BabD9B5398fa3ecA6Da98420C', // Base
  1101: '0x0000000000000000000000000000000000000000', // Polygon zkEVM
  324: '0x0000000000000000000000000000000000000000', // zkSync Era
  7777777: '0x2A5954bA696AD11BabD9B5398fa3ecA6Da98420C', // Zora
  534352: '0x2A5954bA696AD11BabD9B5398fa3ecA6Da98420C', // Scroll
  59144: '0x2A5954bA696AD11BabD9B5398fa3ecA6Da98420C', // Linea
  999: '0x2A5954bA696AD11BabD9B5398fa3ecA6Da98420C', // HyperEVM
  100: '0x2A5954bA696AD11BabD9B5398fa3ecA6Da98420C', // Gnosis
  42220: '0x2A5954bA696AD11BabD9B5398fa3ecA6Da98420C', // Celo
  
  // Testnets
  11155111: '0x0000000000000000000000000000000000000000', // Sepolia
  80001: '0x0000000000000000000000000000000000000000', // Mumbai
  421614: '0x0000000000000000000000000000000000000000', // Arbitrum Sepolia
  11155420: '0x0000000000000000000000000000000000000000', // Optimism Sepolia
  97: '0x0000000000000000000000000000000000000000', // BSC Testnet
  43113: '0x0000000000000000000000000000000000000000', // Fuji
  84532: '0x0000000000000000000000000000000000000000', // Base Sepolia
  534351: '0x0000000000000000000000000000000000000000', // Scroll Sepolia
  59141: '0x0000000000000000000000000000000000000000', // Linea Sepolia
  10143: '0x2A5954bA696AD11BabD9B5398fa3ecA6Da98420C', // HyperEVM Testnet
  998: '0x0000000000000000000000000000000000000000', // Zora Testnet
}

// Fonction pour obtenir l'adresse de frais pour un réseau
export function getPlatformFeeAddress(chainId: number): string {
  const address = PLATFORM_FEE_ADDRESSES[chainId]
  if (!address || address === '0x0000000000000000000000000000000000000000') {
    throw new Error(`No platform fee address configured for chain ${chainId}`)
  }
  return address
}

// Fonction pour vérifier si les frais sont supportés sur un réseau
export function isFeeSupported(chainId: number): boolean {
  const address = PLATFORM_FEE_ADDRESSES[chainId]
  return Boolean(address && address !== '0x0000000000000000000000000000000000000000')
}

// Configuration des frais par réseau (en pourcentage)
export const PLATFORM_FEE_PERCENTAGES: Record<number, number> = {
  // Mainnet - 2%
  1: 2, // Ethereum
  137: 2, // Polygon
  42161: 2, // Arbitrum
  10: 2, // Optimism
  56: 2, // BSC
  43114: 2, // Avalanche
  8453: 2, // Base
  7777777: 2, // Zora
  534352: 2, // Scroll
  59144: 2, // Linea
  999: 2, // HyperEVM
  100: 2, // Gnosis
  42220: 2, // Celo
  
  // Testnets - 0% (gratuit pour les tests)
  11155111: 0, // Sepolia
  80001: 0, // Mumbai
  421614: 0, // Arbitrum Sepolia
  11155420: 0, // Optimism Sepolia
  97: 0, // BSC Testnet
  43113: 0, // Fuji
  84532: 0, // Base Sepolia
  534351: 0, // Scroll Sepolia
  59141: 0, // Linea Sepolia
  10143: 0, // HyperEVM Testnet
  998: 0, // Zora Testnet
  1101: 0, // Polygon zkEVM
  324: 0, // zkSync Era
}

// Fonction pour obtenir le pourcentage de frais pour un réseau
export function getPlatformFeePercentage(chainId: number): number {
  return PLATFORM_FEE_PERCENTAGES[chainId] || 2 // Par défaut 2%
} 