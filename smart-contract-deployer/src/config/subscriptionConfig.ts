// Configuration des contrats de souscription multi-chain
// Ce fichier sera automatiquement généré après déploiement

export interface SubscriptionContractConfig {
  SubscriptionManager: string
  name: string
  symbol: string
  chainId: number
  rpcUrl: string
  blockExplorer: string
}

export const SUBSCRIPTION_CONTRACTS: Record<number, SubscriptionContractConfig> = {
  // Base Mainnet
  8453: {
    SubscriptionManager: "0x...", // À mettre à jour avec SubscriptionManagerUSDC
    name: "Base",
    symbol: "ETH",
    chainId: 8453,
    rpcUrl: "https://mainnet.base.org",
    blockExplorer: "https://basescan.org"
  },

  // Arbitrum Mainnet
  42161: {
    SubscriptionManager: "0x...", // À mettre à jour avec SubscriptionManagerUSDC
    name: "Arbitrum",
    symbol: "ETH",
    chainId: 42161,
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    blockExplorer: "https://arbiscan.io"
  },

  // Ethereum Mainnet
  1: {
    SubscriptionManager: "0x...", // À mettre à jour avec SubscriptionManagerUSDC
    name: "Ethereum",
    symbol: "ETH",
    chainId: 1,
    rpcUrl: "https://eth.llamarpc.com",
    blockExplorer: "https://etherscan.io"
  }
};

// Fonction pour obtenir la configuration d'un contrat
export const getSubscriptionContract = (chainId: number): SubscriptionContractConfig | null => {
  return SUBSCRIPTION_CONTRACTS[chainId] || null;
};

// Fonction pour vérifier si une chaîne est supportée
export const isSubscriptionChainSupported = (chainId: number): boolean => {
  return chainId in SUBSCRIPTION_CONTRACTS;
};

// Plans de souscription disponibles (USDC uniquement)
export const SUBSCRIPTION_PLANS = {
  STARTER: {
    id: "starter",
    name: "Starter",
    monthlyUSDC: "9.0",
    yearlyUSDC: "90.0",
    deploymentsLimit: "5",
    platformFeeRate: "1.5%",
    features: [
      "5 déploiements par mois",
      "Support communautaire",
      "Frais de plateforme réduits (1.5%)"
    ]
  },
  PRO: {
    id: "pro", 
    name: "Pro",
    monthlyUSDC: "19.0",
    yearlyUSDC: "190.0", 
    deploymentsLimit: "100",
    platformFeeRate: "2%",
    features: [
      "100 déploiements par mois",
      "Support prioritaire",
      "Analytics avancées",
      "API access"
    ]
  },
  ENTERPRISE: {
    id: "enterprise",
    name: "Enterprise", 
    monthlyUSDC: "99.0",
    yearlyUSDC: "990.0",
    deploymentsLimit: "1000", 
    platformFeeRate: "1.5%",
    features: [
      "1000 déploiements par mois",
      "Support dédié 24/7",
      "Custom solutions",
      "White label",
      "Frais réduits (1.5%)"
    ]
  }
};

// Configuration par défaut
export const DEFAULT_CONFIG = {
  preferredChain: 42161, // Arbitrum par défaut (moins cher)
  fallbackChain: 8453,   // Base en fallback
  supportedChains: [8453, 42161, 1], // Base, Arbitrum, Ethereum
  treasury: "0x2A5954bA696AD11BabD9B5398fa3ecA6Da98420C",
  platformFee: "0x2A5954bA696AD11BabD9B5398fa3ecA6Da98420C"
};

// Adresses USDC par réseau
export const USDC_ADDRESSES: Record<number, string> = {
  1: "0xA0b86a33E6441e085C781A3E936c7Ec56C5E9b84", // Ethereum USDC
  42161: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // Arbitrum USDC
  8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" // Base USDC
};

// Fonction pour obtenir l'adresse USDC
export const getUSDCAddress = (chainId: number): string | null => {
  return USDC_ADDRESSES[chainId] || null;
};

// ABIs des contrats (versions simplifiées pour frontend - USDC uniquement)
export const SUBSCRIPTION_MANAGER_ABI = [
  "function subscribe(uint8 planType, uint8 duration, bool autoRenew) external",
  "function getPricing(uint8 planType, uint8 duration) external view returns (uint256 priceUSDC, uint256 durationSeconds)",
  "function hasActiveSubscription(address user) external view returns (bool)",
  "function getSubscription(address user) external view returns (uint8 planType, uint8 duration, uint256 expiresAt, uint16 platformFeeRate, uint32 deploymentsLimit, bool canDeploy)",
  "event SubscriptionCreated(address indexed subscriber, uint8 planType, uint8 duration, uint256 expiresAt)",
  "event PaymentReceived(address indexed subscriber, uint256 amount, uint8 duration)"
];

// ABI USDC pour les approvals
export const USDC_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)"
];

// Types d'énumérations pour les contrats
export enum PlanType {
  STARTER = 0,
  PRO = 1,
  ENTERPRISE = 2
}

export enum Duration {
  MONTHLY = 0,
  YEARLY = 1
}

// Fonctions utilitaires
export const getPlanFromType = (planType: PlanType): typeof SUBSCRIPTION_PLANS.STARTER => {
  switch (planType) {
    case PlanType.STARTER:
      return SUBSCRIPTION_PLANS.STARTER
    case PlanType.PRO:
      return SUBSCRIPTION_PLANS.PRO
    case PlanType.ENTERPRISE:
      return SUBSCRIPTION_PLANS.ENTERPRISE
    default:
      return SUBSCRIPTION_PLANS.STARTER
  }
};

export const calculateUSDCAmount = (usdPrice: number): bigint => {
  // USDC a 6 decimals
  return BigInt(Math.floor(usdPrice * 10**6))
};

export const formatUSDCAmount = (amount: bigint): string => {
  // Convertir de wei USDC (6 decimals) vers USD string
  return (Number(amount) / 10**6).toFixed(2)
}; 