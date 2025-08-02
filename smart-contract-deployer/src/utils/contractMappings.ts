import type { TemplateType } from '../types'

// Mapping des templates frontend vers les enums du contrat UniversalFactory
export const TEMPLATE_TYPE_MAPPING: Record<TemplateType, number> = {
  'token': 0,          // TOKEN
  'nft': 1,            // NFT  
  'dao': 2,            // DAO
  'lock': 3,           // LOCK
  'liquidity-pool': 4, // LIQUIDITY_POOL
  'yield-farming': 5,  // YIELD_FARMING
  'gamefi-token': 6,   // GAMEFI_TOKEN
  'nft-marketplace': 7, // NFT_MARKETPLACE
  'revenue-sharing': 8, // REVENUE_SHARING
  'loyalty-program': 9, // LOYALTY_PROGRAM
  'dynamic-nft': 10,   // DYNAMIC_NFT
  'social-token': 11   // SOCIAL_TOKEN
}

// Mapping des IDs de premium features entre frontend (string) et contrat (uint8)
export const PREMIUM_FEATURE_MAPPING: Record<string, number> = {
  // Ordre EXACT selon l'enum PremiumFeature dans UniversalFactoryV2.sol
  'pausable': 0,      // PAUSABLE
  'burnable': 1,      // BURNABLE
  'mintable': 2,      // MINTABLE
  'capped': 3,        // CAPPED
  'snapshot': 4,      // SNAPSHOT
  'permit': 5,        // PERMIT
  'votes': 6,         // VOTES
  'royalties': 7,     // ROYALTIES
  'enumerable': 8,    // ENUMERABLE
  'uristorage': 9,    // URISTORAGE
  'whitelist': 10,    // WHITELIST
  'blacklist': 11,    // BLACKLIST
  'tax': 12,          // TAX
  'timelock': 13,     // TIMELOCK
  'multisig': 14,     // MULTISIG
  'upgradeable': 15,  // UPGRADEABLE
  'vesting': 16,      // VESTING
  'airdrop': 17,      // AIRDROP
  'staking': 18,      // STAKING
  'flashmint': 19,    // FLASHMINT
  'oracle': 20,       // ORACLE
  'automated': 21,    // AUTOMATED
  'antiBot': 22,      // ANTIBOT
  'evolution': 23,    // EVOLUTION
  'merging': 24,      // MERGING
  'breeding': 25,     // BREEDING
  'auction': 26,      // AUCTION
  'escrow': 27,       // ESCROW
  'curation': 28,     // CURATION
  'lazyMint': 29,     // LAZYMINT
  'tiered': 30,       // TIERED
  'rewards': 31,      // REWARDS
  'partnership': 32,  // PARTNERSHIP
  'governance': 33,   // GOVERNANCE
  'tipping': 34,      // TIPPING
  'exclusive': 35,    // EXCLUSIVE
  'accounting': 36,   // ACCOUNTING
  'insurance': 37,    // INSURANCE
  'crossChain': 38,   // CROSSCHAIN
  'analytics': 39,    // ANALYTICS
  'api': 40,          // API
  'webhook': 41,      // WEBHOOK
  'backup': 42,       // BACKUP
  'monitoring': 43    // MONITORING
}

// Mapping inverse pour debug
export const UINT8_TO_FEATURE_ID: Record<number, string> = Object.fromEntries(
  Object.entries(PREMIUM_FEATURE_MAPPING).map(([key, value]) => [value, key])
)

/**
 * Convertit les IDs string du frontend vers les uint8 pour le contrat
 */
export function convertFeatureIdsToUint8(featureIds: string[]): number[] {
  return featureIds
    .map(id => PREMIUM_FEATURE_MAPPING[id])
    .filter(id => id !== undefined) // Filtrer les IDs non reconnus
}

/**
 * Convertit un template type string vers l'enum uint8
 */
export function getContractTemplateType(templateType: string): number {
  const mapping: Record<string, number> = {
    'token': 0,           // TOKEN
    'nft': 1,            // NFT
    'dao': 2,            // DAO
    'lock': 3,           // LOCK
    'liquidity-pool': 4, // LIQUIDITY_POOL
    'yield-farming': 5,  // YIELD_FARMING
    'gamefi-token': 6,   // GAMEFI_TOKEN
    'nft-marketplace': 7, // NFT_MARKETPLACE
    'revenue-sharing': 8, // REVENUE_SHARING
    'loyalty-program': 9, // LOYALTY_PROGRAM
    'dynamic-nft': 10,   // DYNAMIC_NFT
    'social-token': 11   // SOCIAL_TOKEN
  }
  return mapping[templateType] ?? 0
}

/**
 * Convertit les premium features du frontend vers le format contrat
 */
export function getContractPremiumFeatures(featureIds: string[]): number[] {
  return convertFeatureIdsToUint8(featureIds)
}

/**
 * Génère un salt unique pour CREATE2
 */
export const generateSalt = (deployer: string, templateId: string, timestamp: number): string => {
  const encoder = new TextEncoder()
  const data = encoder.encode(`${deployer}-${templateId}-${timestamp}`)
  
  // Simple hash pour générer un salt de 32 bytes
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash + data[i]) & 0xffffffff
  }
  
  // Forcer le hash à être positif en utilisant >>> (unsigned right shift)
  const unsignedHash = hash >>> 0
  
  // Convertir en bytes32 (toujours positif maintenant)
  return '0x' + unsignedHash.toString(16).padStart(64, '0')
} 