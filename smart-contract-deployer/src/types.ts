export type TemplateType = 
  | 'token' 
  | 'nft' 
  | 'dao' 
  | 'lock'
  | 'liquidity-pool'
  | 'yield-farming'
  | 'gamefi-token'
  | 'nft-marketplace'
  | 'revenue-sharing'
  | 'loyalty-program'
  | 'dynamic-nft'
  | 'social-token'

export type ContractTemplate = {
  id: TemplateType
  name: string
  description: string
  icon: string
  fields: TemplateField[]
  premiumFeatures?: PremiumFeature[]
}
export type TemplateField = {
  name: string
  label: string
  type: 'text' | 'number' | 'address' | 'datetime' | 'select' | 'boolean'
  placeholder?: string
  defaultValue?: any
  options?: { value: any; label: string }[]
  validation?: {
    required?: boolean
    min?: number
    max?: number
    pattern?: string
  }
}
export type PremiumFeature = {
  id: string
  name: string
  description: string
  price: number
  icon: string
  incompatibleWith?: string[]
  requiredFor?: TemplateType[]
}
export type PremiumFeatureConfig = {
  whitelist?: {
    addresses: string[]
    maxTransactionAmount?: number
  }
  blacklist?: {
    addresses: string[]
  }
  tax?: {
    rate?: number
    buyTaxRate?: number
    sellTaxRate?: number
    recipient: string
  }
  capped?: {
    maxSupply: number
    maxMintPerAddress?: number
  }
  vesting?: {
    schedules: {
      beneficiary: string
      amount: number
      startTime: number
      duration: number
      cliff: number
      revocable?: boolean
    }[]
  }
  multisig?: {
    signers: string[]
    threshold: number
  }
  airdrop?: {
    recipients: {
      address?: string
      recipient?: string
      amount: number
      claimed?: boolean
    }[]
    totalAmount?: number
    claimDeadline?: number
  }
  timelock?: {
    delay: number
    proposers?: string[]
    executors?: string[]
  }
  uristorage?: {
    tokenUris: {
      tokenId: string
      uri: string
    }[]
    totalTokens?: number
  }
  royalties?: {
    percentage: number
    recipient: string
  }
  staking?: {
    rewardRate: number
    duration: number
    rewardToken?: string
  }
  auction?: {
    defaultDuration: number // in seconds
    minimumStartingPrice: number // in wei
    bidIncrement?: number // minimum bid increment percentage
  }
  oracle?: {
    priceFeedAddress: string
    oracleType: 'chainlink' | 'custom'
  }
  escrow?: {
    defaultDuration: number // in seconds
    conditions: string[]
    arbitrator?: string
  }
  tiered?: {
    tiers: {
      name: string
      minAmount: number // minimum amount to reach this tier
      benefits: string[]
      discount?: number // percentage discount
    }[]
  }
  governance?: {
    votingDelay: number // in blocks
    votingPeriod: number // in blocks
    quorumPercentage: number // percentage needed for quorum
    proposalThreshold: number // tokens needed to create proposal
  }
  insurance?: {
    poolAddress?: string
    coveragePercentage: number // percentage of transaction covered
    premiumRate: number // percentage charged as premium
  }
  crosschain?: {
    supportedChains: string[]
    bridgeAddress?: string
    gasLimit: number
  }
  rewards?: {
    rewardType: 'points' | 'tokens' | 'nft'
    rewardAmount: number
    conditions: string[]
    rewardToken?: string // if reward type is tokens
  }
  
  // NFT Advanced Features
  evolution?: {
    conditions: string[]
  }
  merging?: {
    rules: string[]
  }
  breeding?: {
    cost: number // ETH cost to breed
  }
  curation?: {
    criteria: string[]
  }
  lazyMint?: {
    price: number // ETH price per mint
  }
  
  // Integration Features
  partnership?: {
    apis: string[]
  }
  analytics?: {
    metrics: string[]
  }
  api?: {
    endpoints: string[]
  }
  webhook?: {
    urls: string[]
  }
  
  // Service Features
  monitoring?: {
    alerts: string[]
  }
  backup?: {
    frequency: 'hourly' | 'daily' | 'weekly' | 'monthly'
  }
  tipping?: {
    rate: number // percentage fee
  }
  exclusive?: {
    conditions: string[]
  }
  accounting?: {
    rules: string[]
  }
}
export type DeploymentParams = {
  template: TemplateType
  params: Record<string, any>
  chainId: number
  premiumFeatures: string[]
  premiumFeatureConfigs?: PremiumFeatureConfig
}
export type GasEstimate = {
  gasLimit: bigint
  gasPrice: bigint
  deploymentCost: bigint
  platformFee: bigint
  premiumFee: bigint
  totalCost: bigint
}