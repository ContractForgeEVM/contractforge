import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  Alert,
  AlertTitle,
  Link,
  Paper
} from '@mui/material'
import { CheckCircle, Cancel, Warning } from '@mui/icons-material'
import { useChainId } from 'wagmi'
import { getFactoryAddress } from '../config/factories'

interface NetworkInfo {
  chainId: number
  name: string
  rpcUrl?: string
  blockExplorer?: string
  factoryAddress: string | null
  status: 'deployed' | 'pending' | 'local'
  nativeCurrency?: string
  tier?: 'mainnet' | 'testnet'
}

export const NetworkLogo = ({ chainId, name, size = 24 }: { chainId: number, name: string, size?: number }) => {
  const getLogoStyle = (chainId: number) => ({
    width: size,
    height: size,
    borderRadius: chainId === 1 ? '50%' : '6px',
    marginRight: '8px'
  })

  const logoMapping: Record<number, { svg?: string, png: string }> = {
    1: { svg: '/logos/ethereum.svg', png: '/logos/ethereum.png' },
    42161: { png: '/logos/arbitrum.png' },
    137: { svg: '/logos/polygon.svg', png: '/logos/polygon.png' },
    56: { png: '/logos/bsc.png' },
    8453: { svg: '/logos/base.svg', png: '/logos/base.png' },
    43114: { png: '/logos/avalanche.png' },
    42220: { svg: '/logos/celo.svg', png: '/logos/celo.png' },
    59144: { svg: '/logos/linea.svg', png: '/logos/linea.png' },
    999: { svg: '/logos/hyperliquid.svg', png: '/logos/hyperliquid.png' },
    10: { svg: '/logos/optimism.svg', png: '/logos/optimism.png' },
    534352: { svg: '/logos/scroll.svg', png: '/logos/scroll.png' },
    7777777: { png: '/logos/zora.png' },
    10143: { png: '/logos/monad.png' },
    100: { png: '/logos/gnosis.png' }, // Gnosis Chain
    84532: { svg: '/logos/base.svg', png: '/logos/base.png' }, // Base Sepolia
    11155111: { svg: '/logos/ethereum.svg', png: '/logos/ethereum.png' } // Ethereum Sepolia
  }

  const logoConfig = logoMapping[chainId]
  const logoPath = logoConfig?.svg || logoConfig?.png
  
  return logoPath ? (
    <img 
      src={logoPath} 
      alt={`${name} logo`} 
      style={getLogoStyle(chainId)}
      onError={(e) => {
        const target = e.currentTarget as HTMLImageElement
        if (logoConfig?.svg && logoConfig?.png && target.src.includes('.svg')) {
          target.src = logoConfig.png
          return
        }
        
        target.style.display = 'none'
        const parent = target.parentElement
        if (parent && !parent.querySelector('.fallback-emoji')) {
          const fallback = document.createElement('span')
          fallback.className = 'fallback-emoji'
          fallback.style.fontSize = '20px'
          fallback.style.marginRight = '8px'
          fallback.textContent = chainId === 10143 ? '⚡' : '🌐'
          parent.insertBefore(fallback, target)
        }
      }}
    />
  ) : (
    <span style={{ fontSize: '20px', marginRight: '8px' }}>
      {chainId === 10143 ? '⚡' : '🌐'}
    </span>
  )
}

const networks: NetworkInfo[] = [
  { 
    chainId: 1, 
    name: 'Ethereum Mainnet', 
    nativeCurrency: 'ETH', 
    status: 'deployed',
    factoryAddress: '0xbCEabbe19292e64408AA168f8e39Eb05f92bcfd0',
    tier: 'mainnet'
  },
  { 
    chainId: 42161, 
    name: 'Arbitrum One', 
    nativeCurrency: 'ETH', 
    status: 'deployed',
    factoryAddress: '0x5077b0ebbf5854c701f580e6921b19a05fdfadf3',
    tier: 'mainnet'
  },
  { 
    chainId: 137, 
    name: 'Polygon', 
    nativeCurrency: 'MATIC', 
    status: 'deployed',
    factoryAddress: '0xB18FF5A80F6C34cf31C026a0225847aF2552366D',
    tier: 'mainnet'
  },
  { 
    chainId: 56, 
    name: 'BNB Chain', 
    nativeCurrency: 'BNB', 
    status: 'deployed',
    factoryAddress: '0xbCEabbe19292e64408AA168f8e39Eb05f92bcfd0',
    tier: 'mainnet'
  },
  { 
    chainId: 8453, 
    name: 'Base', 
    nativeCurrency: 'ETH', 
    status: 'deployed',
    factoryAddress: '0x7ee5BbF0023011AF23592e67A2bb1b551746b1E4',
    tier: 'mainnet'
  },
  { 
    chainId: 10, 
    name: 'Optimism', 
    nativeCurrency: 'ETH', 
    status: 'deployed',
    factoryAddress: '0x7ee5BbF0023011AF23592e67A2bb1b551746b1E4',
    tier: 'mainnet'
  },
  { 
    chainId: 43114, 
    name: 'Avalanche', 
    nativeCurrency: 'AVAX', 
    status: 'deployed',
    factoryAddress: '0x3dAE8C5D28F02C2b2F04DF97f7d785BB1761B544',
    tier: 'mainnet'
  },
  { 
    chainId: 42220, 
    name: 'Celo', 
    nativeCurrency: 'CELO', 
    status: 'deployed',
    factoryAddress: '0xbCEabbe19292e64408AA168f8e39Eb05f92bcfd0',
    tier: 'mainnet'
  },
  { 
    chainId: 59144, 
    name: 'Linea', 
    nativeCurrency: 'ETH', 
    status: 'deployed',
    factoryAddress: '0xbCEabbe19292e64408AA168f8e39Eb05f92bcfd0',
    tier: 'mainnet'
  },
  { 
    chainId: 999, 
    name: 'HyperEVM', 
    nativeCurrency: 'HYPE', 
    status: 'deployed',
    factoryAddress: '0xbCEabbe19292e64408AA168f8e39Eb05f92bcfd0',
    tier: 'mainnet'
  },
  { 
    chainId: 534352, 
    name: 'Scroll', 
    nativeCurrency: 'ETH', 
    status: 'deployed',
    factoryAddress: '0x320649FF14aB842D1e5047AEf2Db33661FEc9942',
    tier: 'mainnet'
  },
  { 
    chainId: 7777777, 
    name: 'Zora Network', 
    nativeCurrency: 'ETH', 
    status: 'deployed',
    factoryAddress: '0xbCEabbe19292e64408AA168f8e39Eb05f92bcfd0',
    tier: 'mainnet'
  },
  { 
    chainId: 100, 
    name: 'Gnosis Chain', 
    nativeCurrency: 'xDAI', 
    status: 'deployed',
    factoryAddress: '0xbCEabbe19292e64408AA168f8e39Eb05f92bcfd0',
    tier: 'mainnet'
  },
  
  { 
    chainId: 10143, 
    name: 'Monad Testnet', 
    nativeCurrency: 'testMON', 
    status: 'deployed',
    factoryAddress: '0x57cf238111014032FF4c0A981B021eF96bc1E09F',
    tier: 'testnet'
  },
  { 
    chainId: 84532, 
    name: 'Base Sepolia', 
    nativeCurrency: 'ETH', 
    status: 'deployed',
    factoryAddress: '0x57cf238111014032FF4c0A981B021eF96bc1E09F',
    tier: 'testnet'
  },
  { 
    chainId: 11155111, 
    name: 'Ethereum Sepolia', 
    nativeCurrency: 'ETH', 
    status: 'deployed',
    factoryAddress: '0x57cf238111014032FF4c0A981B021eF96bc1E09F',
    tier: 'testnet'
  },
  { 
    chainId: 31337, 
    name: 'Hardhat Local', 
    nativeCurrency: 'ETH', 
    status: 'local',
    factoryAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    tier: 'testnet'
  }
]

export const SupportedNetworksHeader: React.FC = () => {
  const { t } = useTranslation()
  
  const deployedNetworks = [
    { chainId: 1, name: 'Ethereum', shortName: 'ETH' },
    { chainId: 59144, name: 'Linea', shortName: 'Linea' },
    { chainId: 999, name: 'HyperEVM', shortName: 'HyperEVM' },
    { chainId: 42161, name: 'Arbitrum', shortName: 'ARB' },
    { chainId: 137, name: 'Polygon', shortName: 'MATIC' },
    { chainId: 56, name: 'BNB Chain', shortName: 'BNB' },
    { chainId: 8453, name: 'Base', shortName: 'Base' },
    { chainId: 43114, name: 'Avalanche', shortName: 'AVAX' },
    { chainId: 42220, name: 'Celo', shortName: 'Celo' },
    { chainId: 10, name: 'Optimism', shortName: 'OP' },
    { chainId: 534352, name: 'Scroll', shortName: 'Scroll' },
    { chainId: 7777777, name: 'Zora', shortName: 'Zora' },
    { chainId: 10143, name: 'Monad Testnet', shortName: 'Monad' },
  ]

  return (
    <Paper sx={{ 
      p: 3, 
      mb: 4, 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      borderRadius: 2
    }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center' }}>
        {t('supportedNetworksHeader.title')}
      </Typography>
      <Typography variant="body2" sx={{ textAlign: 'center', mb: 3, opacity: 0.9 }}>
        {t('supportedNetworksHeader.subtitle')}
      </Typography>
      
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        justifyContent: 'center', 
        gap: 2,
        alignItems: 'center'
      }}>
        {deployedNetworks.map((network) => (
          <Box
            key={network.chainId}
            sx={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: 2,
              padding: '8px 12px',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                transform: 'translateY(-2px)'
              }
            }}
          >
            <NetworkLogo chainId={network.chainId} name={network.name} />
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {network.shortName}
            </Typography>
          </Box>
        ))}
      </Box>
      
      <Typography variant="caption" sx={{ 
        display: 'block', 
        textAlign: 'center', 
        mt: 2, 
        opacity: 0.8 
      }}>
        {t('supportedNetworksHeader.footer')}
      </Typography>
    </Paper>
  )
}

const SupportedNetworks: React.FC = () => {
  const { t } = useTranslation()
  const currentChainId = useChainId()

  const getNetworkStatus = (network: NetworkInfo): NetworkInfo => {
    return network
  }

  const getStatusIcon = (status: NetworkInfo['status']) => {
    switch (status) {
      case 'deployed':
        return <CheckCircle color="success" fontSize="small" />
      case 'local':
        return <Warning color="warning" fontSize="small" />
      default:
        return <Cancel color="error" fontSize="small" />
    }
  }

  const getStatusColor = (status: NetworkInfo['status']) => {
    switch (status) {
      case 'deployed':
        return 'success'
      case 'local':
        return 'warning'
      default:
        return 'error'
    }
  }

  const getStatusText = (status: NetworkInfo['status']) => {
    switch (status) {
      case 'deployed':
        return t('supportedNetworks.status.deployed')
      case 'local':
        return t('supportedNetworks.status.testnet')
      default:
        return t('supportedNetworks.status.pending')
    }
  }

  return (
    <Box>
      <Typography variant="h4" component="h2" gutterBottom>
        {t('supportedNetworks.title')}
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>{t('supportedNetworks.alert.title')}</AlertTitle>
        {t('supportedNetworks.alert.description')}
      </Alert>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom color="success.main">
          ✅ {t('supportedNetworks.mainnet.title')} ({networks.filter(n => n.tier === 'mainnet' && n.status === 'deployed').length})
        </Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {networks.filter(n => n.tier === 'mainnet' && n.status === 'deployed').map(network => {
            const networkStatus = getNetworkStatus(network)
            return (
              <Card
                key={network.chainId}
                sx={{
                  minWidth: 280,
                  mb: 1,
                  border: currentChainId === network.chainId ? '2px solid' : '1px solid',
                  borderColor: currentChainId === network.chainId ? 'primary.main' : 'divider'
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <NetworkLogo chainId={network.chainId} name={network.name} />
                    <Typography variant="h6" component="div">
                      {network.name}
                    </Typography>
                    {getStatusIcon(networkStatus.status)}
                  </Box>
                  
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Chain ID: {network.chainId} • {network.nativeCurrency}
                    </Typography>
                  </Box>

                  <Chip
                    label={getStatusText(networkStatus.status)}
                    color={getStatusColor(networkStatus.status) as any}
                    size="small"
                    sx={{ mb: 1 }}
                  />

                  {network.factoryAddress && (
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        display: 'block',
                        fontFamily: 'monospace',
                        wordBreak: 'break-all',
                        bgcolor: 'grey.100',
                        p: 0.5,
                        borderRadius: 0.5
                      }}
                    >
                      {network.factoryAddress}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </Box>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom color="warning.main">
          🧪 {t('supportedNetworks.testnet.title')} ({networks.filter(n => n.tier === 'testnet').length})
        </Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {networks.filter(n => n.tier === 'testnet').map(network => {
            const networkStatus = getNetworkStatus(network)
            return (
              <Card
                key={network.chainId}
                sx={{
                  minWidth: 280,
                  mb: 1,
                  border: currentChainId === network.chainId ? '2px solid' : '1px solid',
                  borderColor: currentChainId === network.chainId ? 'primary.main' : 'divider'
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <NetworkLogo chainId={network.chainId} name={network.name} />
                    <Typography variant="h6" component="div">
                      {network.name}
                    </Typography>
                    {getStatusIcon(networkStatus.status)}
                  </Box>
                  
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Chain ID: {network.chainId} • {network.nativeCurrency}
                    </Typography>
                  </Box>

                  <Chip
                    label={getStatusText(networkStatus.status)}
                    color={getStatusColor(networkStatus.status) as any}
                    size="small"
                    sx={{ mb: 1 }}
                  />

                  {network.factoryAddress && (
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        display: 'block',
                        fontFamily: 'monospace',
                        wordBreak: 'break-all',
                        bgcolor: 'grey.100',
                        p: 0.5,
                        borderRadius: 0.5
                      }}
                    >
                      {network.factoryAddress}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </Box>
      </Box>
    </Box>
  )
}

export const CompactNetworkList: React.FC<{ 
  showStatus?: boolean, 
  size?: 'small' | 'medium' | 'large',
  maxNetworks?: number 
}> = ({ 
  showStatus = false, 
  size = 'medium', 
  maxNetworks = 12 
}) => {
  const deployedNetworks = [
    { chainId: 1, name: 'Ethereum', status: 'deployed' },
    { chainId: 59144, name: 'Linea', status: 'deployed' },
    { chainId: 999, name: 'HyperEVM', status: 'deployed' },
    { chainId: 42161, name: 'Arbitrum', status: 'deployed' },
    { chainId: 137, name: 'Polygon', status: 'deployed' },
    { chainId: 56, name: 'BNB Chain', status: 'deployed' },
    { chainId: 8453, name: 'Base', status: 'deployed' },
    { chainId: 43114, name: 'Avalanche', status: 'deployed' },
    { chainId: 42220, name: 'Celo', status: 'deployed' },
    { chainId: 10, name: 'Optimism', status: 'deployed' },
    { chainId: 534352, name: 'Scroll', status: 'deployed' },
    { chainId: 7777777, name: 'Zora', status: 'deployed' },
    { chainId: 10143, name: 'Monad Testnet', status: 'deployed' },
  ]

  const logoSize = size === 'small' ? 16 : size === 'large' ? 32 : 24
  const displayNetworks = deployedNetworks.slice(0, maxNetworks)

  return (
    <Box sx={{ 
      display: 'flex', 
      flexWrap: 'wrap', 
      gap: 1,
      alignItems: 'center'
    }}>
      {displayNetworks.map((network) => (
        <Box
          key={network.chainId}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            padding: size === 'small' ? '4px 6px' : '6px 8px',
            backgroundColor: 'grey.100',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'grey.300',
            '&:hover': {
              backgroundColor: 'grey.200'
            }
          }}
        >
          <NetworkLogo chainId={network.chainId} name={network.name} size={logoSize} />
          {size !== 'small' && (
            <Typography variant="caption" sx={{ fontWeight: 'medium' }}>
              {network.name}
            </Typography>
          )}
          {showStatus && (
            <CheckCircle 
              color="success" 
              fontSize={size === 'small' ? 'small' : 'inherit'}
            />
          )}
        </Box>
      ))}
    </Box>
  )
}

export default SupportedNetworks