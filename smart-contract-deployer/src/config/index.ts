export const config = {
  infuraProjectId: import.meta.env.VITE_INFURA_PROJECT_ID || '',
  alchemyApiKey: import.meta.env.VITE_ALCHEMY_API_KEY || '',
  walletConnectProjectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '',
  etherscanApiKey: import.meta.env.VITE_ETHERSCAN_API_KEY || '',
  platformFeeAddress: import.meta.env.VITE_PLATFORM_FEE_ADDRESS || '0x2A5954bA696AD11BabD9B5398fa3ecA6Da98420C',
  platformFeePercentage: parseInt(import.meta.env.VITE_PLATFORM_FEE_PERCENTAGE || '2'),
  defaultChainId: parseInt(import.meta.env.VITE_DEFAULT_CHAIN_ID || '1'),
  enableTestnets: import.meta.env.VITE_ENABLE_TESTNETS === 'true',
  apiUrl: import.meta.env.VITE_API_URL || '',
  apiKey: import.meta.env.VITE_API_KEY || '',
  googleAnalyticsId: import.meta.env.VITE_GOOGLE_ANALYTICS_ID || '',
  mixpanelToken: import.meta.env.VITE_MIXPANEL_TOKEN || '',
  enablePremiumFeatures: import.meta.env.VITE_ENABLE_PREMIUM_FEATURES !== 'false',
  enableMultiLanguage: import.meta.env.VITE_ENABLE_MULTI_LANGUAGE !== 'false',
  enableGasEstimation: import.meta.env.VITE_ENABLE_GAS_ESTIMATION !== 'false',
  enableContractVerification: import.meta.env.VITE_ENABLE_CONTRACT_VERIFICATION === 'true',
} as const

// Exports essentiels pour les factories et ABI
export * from './factories'
export * from './chains'
export * from './universalFactoryAbi'

export const validateConfig = () => {
  const required = [
    'infuraProjectId',
    'alchemyApiKey',
    'walletConnectProjectId',
  ] as const
  const missing = required.filter(key => !config[key])
  if (missing.length > 0) {
    console.warn('Missing required configuration:', missing)
  }
  return missing.length === 0
}