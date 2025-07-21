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

// Interface pour les informations de réseau
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

// Composant pour afficher les logos des réseaux - Exporté pour réutilisation
export const NetworkLogo = ({ chainId, name, size = 24 }: { chainId: number, name: string, size?: number }) => {
  const getLogoStyle = (chainId: number) => ({
    width: size,
    height: size,
    borderRadius: chainId === 1 ? '50%' : '6px', // Ethereum rond, autres carrés arrondis
    marginRight: '8px'
  })

  // Chemins des logos locaux - Préférer SVG quand disponible
  const logoMapping: Record<number, { svg?: string, png: string }> = {
    1: { svg: '/logos/ethereum.svg', png: '/logos/ethereum.png' },        // Ethereum
    42161: { png: '/logos/arbitrum.png' },    // Arbitrum
    137: { svg: '/logos/polygon.svg', png: '/logos/polygon.png' },       // Polygon
    56: { png: '/logos/bsc.png' },           // BNB Chain
    8453: { svg: '/logos/base.svg', png: '/logos/base.png' },        // Base
    43114: { png: '/logos/avalanche.png' },  // Avalanche
    42220: { svg: '/logos/celo.svg', png: '/logos/celo.png' },       // Celo
    59144: { svg: '/logos/linea.svg', png: '/logos/linea.png' },      // Linea
    999: { svg: '/logos/hyperliquid.svg', png: '/logos/hyperliquid.png' },  // HyperEVM
    10: { svg: '/logos/optimism.svg', png: '/logos/optimism.png' },      // Optimism
    534352: { svg: '/logos/scroll.svg', png: '/logos/scroll.png' },    // Scroll
    7777777: { png: '/logos/zora.png' },     // Zora
    10143: { png: '/logos/monad.png' }       // Monad Testnet
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
        // Try PNG fallback if SVG fails
        if (logoConfig?.svg && logoConfig?.png && target.src.includes('.svg')) {
          target.src = logoConfig.png
          return
        }
        
        // Fallback emoji si l'image ne charge pas
        target.style.display = 'none'
        const parent = target.parentElement
        if (parent && !parent.querySelector('.fallback-emoji')) {
          const fallback = document.createElement('span')
          fallback.className = 'fallback-emoji'
          fallback.style.fontSize = '20px'
          fallback.style.marginRight = '8px'
          // Use specific emoji for Monad
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
  // ✅ RÉSEAUX AVEC FACTORY DÉPLOYÉE
  { 
    chainId: 1, 
    name: 'Ethereum Mainnet', 
    nativeCurrency: 'ETH', 
    status: 'deployed',
    factoryAddress: '0x8ec242d45E595105aeB5F1A6278c6e5B1Ae9d7c5',
    tier: 'mainnet'
  },
  { 
    chainId: 42161, 
    name: 'Arbitrum One', 
    nativeCurrency: 'ETH', 
    status: 'deployed',
    factoryAddress: '0xDF735F5Bc4dC567e4cA5d24c05767d72A93a73a9',
    tier: 'mainnet'
  },
  { 
    chainId: 137, 
    name: 'Polygon', 
    nativeCurrency: 'MATIC', 
    status: 'deployed',
    factoryAddress: '0x7a9DEfAfCFf15732860Ed3f598d41bFd392f36EF',
    tier: 'mainnet'
  },
  { 
    chainId: 56, 
    name: 'BNB Chain', 
    nativeCurrency: 'BNB', 
    status: 'deployed',
    factoryAddress: '0x836ef37aa08F6089B4efEAdc55A864f6caff4a16',
    tier: 'mainnet'
  },
  { 
    chainId: 8453, 
    name: 'Base', 
    nativeCurrency: 'ETH', 
    status: 'deployed',
    factoryAddress: '0xa1B049789ABC19c50F9D4c056D5F626f4a2fe4d3',
    tier: 'mainnet'
  },
  { 
    chainId: 10, 
    name: 'Optimism', 
    nativeCurrency: 'ETH', 
    status: 'deployed',
    factoryAddress: '0x836ef37aa08F6089B4efEAdc55A864f6caff4a16',
    tier: 'mainnet'
  },
  { 
    chainId: 43114, 
    name: 'Avalanche', 
    nativeCurrency: 'AVAX', 
    status: 'deployed',
    factoryAddress: '0x836ef37aa08F6089B4efEAdc55A864f6caff4a16',
    tier: 'mainnet'
  },
  { 
    chainId: 42220, 
    name: 'Celo', 
    nativeCurrency: 'CELO', 
    status: 'deployed',
    factoryAddress: '0x836ef37aa08F6089B4efEAdc55A864f6caff4a16',
    tier: 'mainnet'
  },
  { 
    chainId: 59144, 
    name: 'Linea', 
    nativeCurrency: 'ETH', 
    status: 'deployed',
    factoryAddress: '0x7a9DEfAfCFf15732860Ed3f598d41bFd392f36EF',
    tier: 'mainnet'
  },
  { 
    chainId: 999, 
    name: 'HyperEVM', 
    nativeCurrency: 'HYPE', 
    status: 'deployed',
    factoryAddress: '0x836ef37aa08F6089B4efEAdc55A864f6caff4a16',
    tier: 'mainnet'
  },
  { 
    chainId: 534352, 
    name: 'Scroll', 
    nativeCurrency: 'ETH', 
    status: 'deployed',
    factoryAddress: '0x9Ba797D0968bF4b48b639988C7FfedF28d3FEe5a',
    tier: 'mainnet'
  },
  { 
    chainId: 7777777, 
    name: 'Zora Network', 
    nativeCurrency: 'ETH', 
    status: 'deployed',
    factoryAddress: '0x836ef37aa08F6089B4efEAdc55A864f6caff4a16',
    tier: 'mainnet'
  },
  
  // 🧪 TESTNETS
  { 
    chainId: 10143, 
    name: 'Monad Testnet', 
    nativeCurrency: 'testMON', 
    status: 'deployed',
    factoryAddress: '0x836ef37aa08F6089B4efEAdc55A864f6caff4a16',
    tier: 'testnet'
  },
  { 
    chainId: 11155111, 
    name: 'Sepolia', 
    nativeCurrency: 'ETH', 
    status: 'local',
    factoryAddress: null,
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

// Composant header des réseaux supportés
export const SupportedNetworksHeader: React.FC = () => {
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
        🌍 13 Networks Supported - Deploy Anywhere
      </Typography>
      <Typography variant="body2" sx={{ textAlign: 'center', mb: 3, opacity: 0.9 }}>
        Your contracts can be deployed on any of these networks with the same factory
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
        ✅ All factory contracts deployed and verified • 🔄 More networks coming soon
      </Typography>
    </Paper>
  )
}

const SupportedNetworks: React.FC = () => {
  const { t } = useTranslation()
  const currentChainId = useChainId()

  // Vérifier dynamiquement le statut de déploiement
  const getNetworkStatus = (network: NetworkInfo): NetworkInfo => {
    // Les statuts sont déjà corrects dans la définition du réseau
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

      {/* Réseaux principaux déployés */}
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

      {/* Testnets */}
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

// Composant compact pour afficher les réseaux supportés - peut être utilisé ailleurs
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