import type { PremiumFeature } from '../types'
export const premiumFeatures: PremiumFeature[] = [
  {
    id: 'pausable',
    name: 'Pausable',
    description: 'Add ability to pause/unpause all contract operations',
    price: 0.01,
    icon: '⏸️',
  },
  {
    id: 'burnable',
    name: 'Burnable',
    description: 'Allow token holders to burn (destroy) their tokens',
    price: 0.005,
    icon: '🔥',
    requiredFor: ['token'],
  },
  {
    id: 'mintable',
    name: 'Mintable',
    description: 'Owner can mint new tokens after deployment',
    price: 0.01,
    icon: '🪙',
    requiredFor: ['token'],
    incompatibleWith: ['capped'],
  },
  {
    id: 'capped',
    name: 'Capped Supply',
    description: 'Set a maximum supply that cannot be exceeded',
    price: 0.005,
    icon: '🔒',
    requiredFor: ['token'],
    incompatibleWith: ['mintable'],
  },
  {
    id: 'snapshot',
    name: 'Snapshot',
    description: 'Take snapshots of balances for voting or dividends',
    price: 0.02,
    icon: '📸',
    requiredFor: ['token', 'dao'],
  },
  {
    id: 'permit',
    name: 'EIP-2612 Permit',
    description: 'Gasless approvals with signatures',
    price: 0.015,
    icon: '✍️',
    requiredFor: ['token'],
  },
  {
    id: 'votes',
    name: 'Voting Power',
    description: 'Enable token-based voting (required for DAO)',
    price: 0.02,
    icon: '🗳️',
    requiredFor: ['token', 'dao'],
  },
  {
    id: 'royalties',
    name: 'EIP-2981 Royalties',
    description: 'Built-in royalty support for secondary sales',
    price: 0.015,
    icon: '💰',
    requiredFor: ['nft'],
  },
  {
    id: 'enumerable',
    name: 'Enumerable',
    description: 'List all tokens and owners on-chain',
    price: 0.01,
    icon: '📋',
    requiredFor: ['nft'],
  },
  {
    id: 'uristorage',
    name: 'URI Storage',
    description: 'Store metadata URIs on-chain',
    price: 0.01,
    icon: '💾',
    requiredFor: ['nft'],
  },
  {
    id: 'whitelist',
    name: 'Whitelist',
    description: 'Restrict transfers to whitelisted addresses',
    price: 0.02,
    icon: '📝',
  },
  {
    id: 'blacklist',
    name: 'Blacklist',
    description: 'Block specific addresses from transfers',
    price: 0.02,
    icon: '🚫',
    incompatibleWith: ['whitelist'],
  },
  {
    id: 'tax',
    name: 'Transfer Tax',
    description: 'Automatic tax on transfers (customizable rate)',
    price: 0.025,
    icon: '💸',
    requiredFor: ['token'],
  },
  {
    id: 'timelock',
    name: 'Timelock Controller',
    description: 'Add time delays to critical functions',
    price: 0.03,
    icon: '⏰',
    requiredFor: ['dao'],
  },
  {
    id: 'multisig',
    name: 'Multi-signature',
    description: 'Require multiple signatures for owner actions',
    price: 0.04,
    icon: '🔐',
  },
  {
    id: 'upgradeable',
    name: 'Upgradeable (Proxy)',
    description: 'Deploy as upgradeable proxy contract',
    price: 0.05,
    icon: '🔄',
  },
  {
    id: 'vesting',
    name: 'Vesting Schedule',
    description: 'Built-in token vesting functionality',
    price: 0.03,
    icon: '📈',
    requiredFor: ['token', 'lock'],
  },
  {
    id: 'airdrop',
    name: 'Batch Airdrop',
    description: 'Efficient batch token distribution',
    price: 0.02,
    icon: '🎁',
    requiredFor: ['token', 'nft'],
  },
  {
    id: 'staking',
    name: 'Staking Rewards',
    description: 'Built-in staking mechanism with rewards',
    price: 0.04,
    icon: '💎',
    requiredFor: ['token'],
  },
  {
    id: 'flashmint',
    name: 'Flash Minting',
    description: 'Enable flash loans for your token',
    price: 0.03,
    icon: '⚡',
    requiredFor: ['token'],
  },
  // === NOUVELLES FONCTIONNALITÉS PREMIUM ===
  {
    id: 'oracle',
    name: 'Price Oracle',
    description: 'Integrate with Chainlink or other price oracles',
    price: 0.035,
    icon: '📊',
    requiredFor: ['liquidity-pool', 'yield-farming', 'revenue-sharing'],
  },
  {
    id: 'automated',
    name: 'Automated Operations',
    description: 'Automated rebalancing and optimization',
    price: 0.04,
    icon: '🤖',
    requiredFor: ['liquidity-pool', 'yield-farming'],
  },
  {
    id: 'antiBot',
    name: 'Anti-Bot Protection',
    description: 'Protect against bot manipulation and MEV',
    price: 0.025,
    icon: '🛡️',
    requiredFor: ['gamefi-token', 'liquidity-pool'],
  },
  {
    id: 'evolution',
    name: 'NFT Evolution',
    description: 'Allow NFTs to evolve based on conditions',
    price: 0.03,
    icon: '🧬',
    requiredFor: ['dynamic-nft'],
  },
  {
    id: 'merging',
    name: 'NFT Merging',
    description: 'Allow combining multiple NFTs into one',
    price: 0.025,
    icon: '🔗',
    requiredFor: ['dynamic-nft'],
  },
  {
    id: 'breeding',
    name: 'NFT Breeding',
    description: 'Allow NFTs to create offspring',
    price: 0.035,
    icon: '👶',
    requiredFor: ['dynamic-nft'],
  },
  {
    id: 'auction',
    name: 'Auction System',
    description: 'Built-in auction functionality for NFTs',
    price: 0.03,
    icon: '🏷️',
    requiredFor: ['nft-marketplace'],
  },
  {
    id: 'escrow',
    name: 'Escrow Protection',
    description: 'Secure escrow for marketplace transactions',
    price: 0.025,
    icon: '🔒',
    requiredFor: ['nft-marketplace'],
  },
  {
    id: 'curation',
    name: 'Curation System',
    description: 'Curated collections and featured items',
    price: 0.02,
    icon: '⭐',
    requiredFor: ['nft-marketplace'],
  },
  {
    id: 'lazyMint',
    name: 'Lazy Minting',
    description: 'Mint NFTs only when purchased',
    price: 0.015,
    icon: '🎭',
    requiredFor: ['nft-marketplace'],
  },
  {
    id: 'tiered',
    name: 'Tiered System',
    description: 'Multiple tiers with different benefits',
    price: 0.025,
    icon: '🏆',
    requiredFor: ['loyalty-program', 'social-token'],
  },
  {
    id: 'rewards',
    name: 'Rewards System',
    description: 'Automated reward distribution',
    price: 0.03,
    icon: '🎁',
    requiredFor: ['loyalty-program', 'gamefi-token'],
  },
  {
    id: 'partnership',
    name: 'Partnership Integration',
    description: 'Integrate with external partners and APIs',
    price: 0.04,
    icon: '🤝',
    requiredFor: ['loyalty-program', 'social-token'],
  },
  {
    id: 'governance',
    name: 'Community Governance',
    description: 'Community voting and proposal system',
    price: 0.035,
    icon: '🏛️',
    requiredFor: ['social-token', 'revenue-sharing'],
  },
  {
    id: 'tipping',
    name: 'Tipping System',
    description: 'Allow users to tip creators',
    price: 0.02,
    icon: '💝',
    requiredFor: ['social-token'],
  },
  {
    id: 'exclusive',
    name: 'Exclusive Content',
    description: 'Gated content for token holders',
    price: 0.025,
    icon: '🔐',
    requiredFor: ['social-token'],
  },
  {
    id: 'accounting',
    name: 'Automated Accounting',
    description: 'Automatic revenue tracking and distribution',
    price: 0.03,
    icon: '📊',
    requiredFor: ['revenue-sharing'],
  },
  {
    id: 'insurance',
    name: 'Insurance Pool',
    description: 'Insurance against smart contract risks',
    price: 0.05,
    icon: '🛡️',
    requiredFor: ['liquidity-pool', 'yield-farming'],
  },
  {
    id: 'crossChain',
    name: 'Cross-Chain Bridge',
    description: 'Deploy on multiple chains simultaneously',
    price: 0.06,
    icon: '🌉',
  },
  {
    id: 'analytics',
    name: 'Advanced Analytics',
    description: 'Detailed analytics and reporting',
    price: 0.02,
    icon: '📈',
  },
  {
    id: 'api',
    name: 'API Access',
    description: 'REST API for contract interactions',
    price: 0.03,
    icon: '🔌',
  },
  {
    id: 'webhook',
    name: 'Webhook Notifications',
    description: 'Real-time event notifications',
    price: 0.015,
    icon: '🔔',
  },
  {
    id: 'backup',
    name: 'Automated Backup',
    description: 'Automatic contract state backup',
    price: 0.02,
    icon: '💾',
  },
  {
    id: 'monitoring',
    name: '24/7 Monitoring',
    description: 'Continuous contract monitoring and alerts',
    price: 0.04,
    icon: '👁️',
  }
]
export const getFeaturePrice = (featureId: string): number => {
  const feature = premiumFeatures.find(f => f.id === featureId)
  return feature?.price || 0
}
export const getTotalPremiumPrice = (featureIds: string[]): number => {
  return featureIds.reduce((total, id) => total + getFeaturePrice(id), 0)
}
export const getCompatibleFeatures = (
  templateType: string,
  selectedFeatures: string[]
): PremiumFeature[] => {
  return premiumFeatures.filter(feature => {
    if (feature.requiredFor && !feature.requiredFor.includes(templateType as any)) {
      return false
    }
    if (feature.incompatibleWith) {
      const hasIncompatible = feature.incompatibleWith.some(id =>
        selectedFeatures.includes(id)
      )
      if (hasIncompatible) return false
    }
    const isIncompatibleWithSelected = selectedFeatures.some(selectedId => {
      const selectedFeature = premiumFeatures.find(f => f.id === selectedId)
      return selectedFeature?.incompatibleWith?.includes(feature.id)
    })
    return !isIncompatibleWithSelected
  })
}