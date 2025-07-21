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