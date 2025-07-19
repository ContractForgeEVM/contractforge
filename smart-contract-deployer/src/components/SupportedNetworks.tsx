import React from 'react'
import {
  Box,
  Typography,
  Chip,
  Paper,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
const SupportedNetworks: React.FC = () => {
  const { t } = useTranslation()
  const networks = [
    {
      name: 'Ethereum',
      logo: '/logos/ethereum.png',
      fallbackIcon: 'Ξ',
      color: '#627EEA'
    },
    {
      name: 'Polygon',
      logo: '/logos/polygon.png',
      fallbackIcon: '⬟',
      color: '#8247E5'
    },
    {
      name: 'Arbitrum',
      logo: '/logos/arbitrum.png',
      fallbackIcon: 'Ⓐ',
      color: '#28A0F0'
    },
    {
      name: 'Optimism',
      logo: '/logos/optimism.png',
      fallbackIcon: 'Ⓞ',
      color: '#FF0420'
    },
    {
      name: 'BSC',
      logo: '/logos/bsc.png',
      fallbackIcon: 'Ⓑ',
      color: '#F3BA2F'
    },
    {
      name: 'Avalanche',
      logo: '/logos/avalanche.png',
      fallbackIcon: '△',
      color: '#E84142'
    },
    {
      name: 'Base',
      logo: '/logos/base.svg',
      fallbackIcon: 'Ⓑ',
      color: '#0052FF'
    },
    {
      name: 'Fantom',
      logo: '/logos/fantom.png',
      fallbackIcon: 'Ⓕ',
      color: '#1969FF'
    },
    {
      name: 'Moonbeam',
      logo: '/logos/moonbeam.svg',
      fallbackIcon: '🌙',
      color: '#53CBC9'
    },
    {
      name: 'Gnosis',
      logo: '/logos/gnosis.png',
      fallbackIcon: 'Ⓖ',
      color: '#04795B'
    },
    {
      name: 'Celo',
      logo: '/logos/celo.png',
      fallbackIcon: '◉',
      color: '#35D07F'
    },
    {
      name: 'zkSync',
      logo: '/logos/zksync.png',
      fallbackIcon: 'Ⓩ',
      color: '#8C8DFC'
    },
    {
      name: 'Scroll',
      logo: '/logos/scroll.png',
      fallbackIcon: '◷',
      color: '#FFEEDA'
    },
    {
      name: 'Linea',
      logo: '/logos/linea.png',
      fallbackIcon: 'Ⓛ',
      color: '#61DFFF'
    },
    {
      name: 'HyperEVM',
      logo: '/logos/hyperliquid.png',
      fallbackIcon: 'Ⓗ',
      color: '#00D4FF'
    },
    {
      name: 'Monad',
      logo: '/logos/monad.png',
      fallbackIcon: 'Ⓜ',
      color: '#A855F7'
    },
    {
      name: 'Zora',
      logo: '/logos/zora.png',
      fallbackIcon: 'Ⓩ',
      color: '#000000'
    },
  ]
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mt: 4,
        background: 'linear-gradient(135deg, rgba(26, 32, 46, 0.9) 0%, rgba(17, 24, 39, 0.95) 100%)',
        backdropFilter: 'blur(10px)',
        border: '1px solid',
        borderColor: 'rgba(92, 107, 192, 0.2)',
        borderRadius: 2,
      }}
    >
      <Typography
        variant="h6"
        sx={{
          mb: 2,
          fontWeight: 600,
          color: 'primary.main',
          textAlign: 'center'
        }}
      >
        {t('supportedNetworks')}
      </Typography>
      <Box sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 1.5,
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        {networks.map((network) => (
          <Chip
            key={network.name}
            icon={
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img
                  src={network.logo}
                  alt={network.name}
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallbackElement = target.nextElementSibling as HTMLElement;
                    if (fallbackElement) {
                      fallbackElement.style.display = 'inline';
                    }
                  }}
                />
                <span
                  style={{
                    display: 'none',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: network.color
                  }}
                >
                  {network.fallbackIcon}
                </span>
              </Box>
            }
            label={network.name}
            variant="outlined"
            sx={{
              color: 'text.primary',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderColor: network.color,
                color: network.color,
              },
              transition: 'all 0.3s ease',
            }}
          />
        ))}
      </Box>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          mt: 2,
          textAlign: 'center',
          fontSize: '0.875rem'
        }}
      >
        {t('evmCompatible')}
      </Typography>
    </Paper>
  )
}
export default SupportedNetworks