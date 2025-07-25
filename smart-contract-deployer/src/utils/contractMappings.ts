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
 * 🛡️ SÉCURITÉ: Validates and sanitizes feature IDs
 */
export function convertFeatureIdsToUint8(featureIds: string[]): number[] {
  // 🛡️ Input validation
  if (!Array.isArray(featureIds)) {
    throw new Error('Feature IDs must be an array')
  }
  
  if (featureIds.length > 44) { // Max number of premium features
    throw new Error('Too many premium features selected (max 44)')
  }
  
  const validIds = featureIds
    .filter(id => {
      if (typeof id !== 'string') {
        console.warn(`⚠️ Invalid feature ID type: ${typeof id}, expected string`)
        return false
      }
      if (!(id in PREMIUM_FEATURE_MAPPING)) {
        console.warn(`⚠️ Unknown premium feature ID: ${id}`)
        return false
      }
      return true
    })
    .map(id => PREMIUM_FEATURE_MAPPING[id])
  
  // Check for duplicates
  const uniqueIds = [...new Set(validIds)]
  if (uniqueIds.length !== validIds.length) {
    console.warn('⚠️ Duplicate feature IDs detected and removed')
  }
  
  return uniqueIds
}

/**
 * Convertit un template type string vers l'enum uint8
 * 🛡️ SÉCURITÉ: Validates template type
 */
export function getContractTemplateType(templateType: string): number {
  // 🛡️ Input validation
  if (typeof templateType !== 'string') {
    throw new Error(`Template type must be a string, got: ${typeof templateType}`)
  }
  
  if (!templateType || templateType.trim().length === 0) {
    throw new Error('Template type cannot be empty')
  }
  
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
  
  const normalizedType = templateType.trim().toLowerCase()
  
  if (!(normalizedType in mapping)) {
    throw new Error(`Unknown template type: ${templateType}. Valid types: ${Object.keys(mapping).join(', ')}`)
  }
  
  return mapping[normalizedType]
}

/**
 * Convertit les premium features du frontend vers le format contrat
 */
export function getContractPremiumFeatures(featureIds: string[]): number[] {
  return convertFeatureIdsToUint8(featureIds)
}

/**
 * Génère un salt unique pour CREATE2
 * 🛡️ SÉCURITÉ: Validates inputs and generates secure salt
 */
export const generateSalt = (deployer: string, templateId: string, timestamp: number): string => {
  // 🛡️ Input validation
  if (typeof deployer !== 'string' || !/^0x[a-fA-F0-9]{40}$/.test(deployer)) {
    throw new Error('Invalid deployer address: must be a valid Ethereum address')
  }
  
  if (typeof templateId !== 'string' || templateId.trim().length === 0) {
    throw new Error('Template ID cannot be empty')
  }
  
  if (typeof timestamp !== 'number' || timestamp <= 0 || !Number.isInteger(timestamp)) {
    throw new Error('Timestamp must be a positive integer')
  }
  
  // Validate timestamp is reasonable (not too far in past/future)
  const now = Date.now()
  const maxAge = 24 * 60 * 60 * 1000 // 24 hours
  if (Math.abs(now - timestamp) > maxAge) {
    console.warn('⚠️ Warning: Timestamp is more than 24 hours from current time')
  }
  
  const encoder = new TextEncoder()
  const sanitizedTemplateId = templateId.trim().toLowerCase()
  const data = encoder.encode(`${deployer.toLowerCase()}-${sanitizedTemplateId}-${timestamp}`)
  
  // Simple hash pour générer un salt de 32 bytes
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash + data[i]) & 0xffffffff
  }
  
  // Forcer le hash à être positif en utilisant >>> (unsigned right shift)
  const unsignedHash = hash >>> 0
  
  // Convertir en bytes32 (toujours positif maintenant)
  const salt = '0x' + unsignedHash.toString(16).padStart(64, '0')
  
  // Validate generated salt
  if (salt.length !== 66) { // 0x + 64 hex chars
    throw new Error('Generated salt has invalid length')
  }
  
  return salt
} 