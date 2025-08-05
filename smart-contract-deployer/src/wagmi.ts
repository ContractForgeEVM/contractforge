import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { chains } from './config/chains'
import { config as appConfig } from './config'
export const config = getDefaultConfig({
  appName: 'ContractForge.io',
  projectId: appConfig.walletConnectProjectId,
  chains: chains as any,
  ssr: false,
})