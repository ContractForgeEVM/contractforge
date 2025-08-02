/// <reference types="vite/client" />

declare module '@rainbow-me/rainbowkit/styles.css';
declare module '*.css';

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_INFURA_PROJECT_ID?: string
  readonly VITE_ALCHEMY_API_KEY?: string
  readonly VITE_WALLETCONNECT_PROJECT_ID?: string
  readonly VITE_ETHERSCAN_API_KEY?: string
  readonly VITE_PLATFORM_FEE_ADDRESS?: string
  readonly VITE_PLATFORM_FEE_PERCENTAGE?: string
  readonly VITE_DEFAULT_CHAIN_ID?: string
  readonly VITE_ENABLE_TESTNETS?: string
  readonly VITE_API_URL?: string
  readonly VITE_API_KEY?: string
  readonly VITE_BACKEND_URL?: string
  readonly VITE_GOOGLE_ANALYTICS_ID?: string
  readonly VITE_MIXPANEL_TOKEN?: string
  readonly VITE_ENABLE_PREMIUM_FEATURES?: string
  readonly VITE_ENABLE_MULTI_LANGUAGE?: string
  readonly VITE_ENABLE_GAS_ESTIMATION?: string
  readonly VITE_ENABLE_CONTRACT_VERIFICATION?: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}