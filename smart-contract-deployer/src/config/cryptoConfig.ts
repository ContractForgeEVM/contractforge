export interface ChainConfig {
  chainId: number
  name: string
  symbol: string
  rpcUrl: string
  blockExplorer: string
  usdcAddress: string
  gasMultiplier: number 
}

export interface SubscriptionPricing {
  starter: {
    monthly: {
      usd: number
    }
    yearly: {
      usd: number
    }
  }
  pro: {
    monthly: {
      usd: number
    }
    yearly: {
      usd: number
    }
  }
  enterprise: {
    monthly: {
      usd: number
    }
    yearly: {
      usd: number
    }
  }
}

export const SUPPORTED_CHAINS: Record<number, ChainConfig> = {
  1: {
    chainId: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    rpcUrl: 'https://eth.llamarpc.com',
    blockExplorer: 'https://etherscan.io',
    usdcAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC officiel
    gasMultiplier: 1.2 
  },
  42161: {
    chainId: 42161,
    name: 'Arbitrum',
    symbol: 'ETH',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    blockExplorer: 'https://arbiscan.io',
    usdcAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC natif
    gasMultiplier: 1.1 
  },
  8453: {
    chainId: 8453,
    name: 'Base',
    symbol: 'ETH',
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org',
    usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC natif
    gasMultiplier: 1.1 
  }
}

export const SUBSCRIPTION_PRICING: SubscriptionPricing = {
  starter: {
    monthly: {
      usd: 9
    },
    yearly: {
      usd: 90 // Économie de 2 mois
    }
  },
  pro: {
    monthly: {
      usd: 19
    },
    yearly: {
      usd: 190 // Économie de 2 mois
    }
  },
  enterprise: {
    monthly: {
      usd: 99
    },
    yearly: {
      usd: 990 // Économie de 2 mois
    }
  }
}

export const CONTRACT_ADDRESSES: Record<number, string> = {
  1: '0x6e18B2Ca9Bc3eF6316634A80047886Cb6bC932db', // Ethereum SubscriptionManagerUSDC
  42161: '0xD7727a34f4f140c6d199edC9DBce0B332A3F812E', // Arbitrum SubscriptionManagerUSDC
  8453: '0xC2a5de60590d0379A5430bfaAf29108A8F32A5E6' // Base SubscriptionManagerUSDC
}

// Uniquement USDC pour les paiements
export const SUPPORTED_TOKENS = {
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    icon: '💵',
    color: '#2775CA',
    isNative: false
  }
}

export const getChainConfig = (chainId: number): ChainConfig | null => {
  return SUPPORTED_CHAINS[chainId] || null
}

export const getContractAddress = (chainId: number): string | null => {
  return CONTRACT_ADDRESSES[chainId] || null
}

export const getSupportedChainIds = (): number[] => {
  return Object.keys(SUPPORTED_CHAINS).map(id => parseInt(id))
}

export const isChainSupported = (chainId: number): boolean => {
  return chainId in SUPPORTED_CHAINS
}

// Fonctions simplifiées pour USDC uniquement
export const getUSDCAmount = (usdAmount: number): bigint => {
  // USDC a 6 decimals
  return BigInt(Math.floor(usdAmount * 10**6))
}

export enum PlanType {
  STARTER = 0,
  PRO = 1,
  ENTERPRISE = 2
}

export const getPlanTypeFromString = (planName: string): PlanType => {
  switch (planName.toLowerCase()) {
    case 'starter':
      return PlanType.STARTER
    case 'pro':
      return PlanType.PRO
    case 'enterprise':
      return PlanType.ENTERPRISE
    default:
      return PlanType.STARTER
  }
}

export const getPlanPricing = (planType: PlanType, isYearly: boolean = false) => {
  const plan = (() => {
    switch (planType) {
      case PlanType.STARTER:
        return SUBSCRIPTION_PRICING.starter
      case PlanType.PRO:
        return SUBSCRIPTION_PRICING.pro
      case PlanType.ENTERPRISE:
        return SUBSCRIPTION_PRICING.enterprise
      default:
        return SUBSCRIPTION_PRICING.starter
    }
  })()
  
  return isYearly ? plan.yearly : plan.monthly
}

export const calculateYearlySavings = (planName: string): { savingsUSD: number; savingsPercentage: number } => {
  const planType = getPlanTypeFromString(planName)
  const plan = (() => {
    switch (planType) {
      case PlanType.STARTER:
        return SUBSCRIPTION_PRICING.starter
      case PlanType.PRO:
        return SUBSCRIPTION_PRICING.pro
      case PlanType.ENTERPRISE:
        return SUBSCRIPTION_PRICING.enterprise
      default:
        return SUBSCRIPTION_PRICING.starter
    }
  })()
  
  const monthlyTotal = plan.monthly.usd * 12
  const yearlyPrice = plan.yearly.usd
  const savings = monthlyTotal - yearlyPrice
  const percentage = Math.round((savings / monthlyTotal) * 100)
  
  return {
    savingsUSD: savings,
    savingsPercentage: percentage
  }
}

export const getContractPricing = (planName: string, isYearly: boolean) => {
  const planType = getPlanTypeFromString(planName)
  const pricing = getPlanPricing(planType, isYearly)
  
  return {
    priceUSDC: BigInt(pricing.usd * 10**6), // USDC a 6 decimals
    duration: BigInt(isYearly ? 365 * 24 * 60 * 60 : 30 * 24 * 60 * 60) 
  }
}

export enum Duration {
  MONTHLY = 0,
  YEARLY = 1
}