import React from 'react'
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  LinearProgress,
  Chip,
  Stack,
  Fade,
  Zoom,
} from '@mui/material'
import {
  Build as BuildIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  LocalGasStation as GasIcon,
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'

interface DeploymentSkeletonProps {
  status: 'pending' | 'confirmed'
  chainName?: string
  templateName?: string
  transactionHash?: string
  chainId?: number
}

const getExplorerUrl = (chainId: number, transactionHash: string): string => {
  const explorers: Record<number, string> = {
    1: 'https://etherscan.io',
    5: 'https://goerli.etherscan.io',
    11155111: 'https://sepolia.etherscan.io',
    137: 'https://polygonscan.com',
    80001: 'https://mumbai.polygonscan.com',
    42161: 'https://arbiscan.io',
    421614: 'https://sepolia.arbiscan.io',
    10: 'https://optimistic.etherscan.io',
    420: 'https://goerli-optimism.etherscan.io',
    11155420: 'https://sepolia-optimism.etherscan.io',
    56: 'https://bscscan.com',
    97: 'https://testnet.bscscan.com',
    43114: 'https://snowtrace.io',
    43113: 'https://testnet.snowtrace.io',
    250: 'https://ftmscan.com',
    4002: 'https://testnet.ftmscan.com',
    1284: 'https://moonscan.io',
    1285: 'https://moonbase.moonscan.io',
    100: 'https://gnosisscan.io',
    42220: 'https://celoscan.io',
    44787: 'https://alfajores.celoscan.io',
    1666600000: 'https://explorer.harmony.one',
    324: 'https://explorer.zksync.io',
    534352: 'https://scrollscan.com',
    534351: 'https://sepolia.scrollscan.com',
    59144: 'https://lineascan.build',
    59141: 'https://goerli.lineascan.build',
    999: 'https://explorer.hyperevm.com',
    998: 'https://testnet.explorer.hyperevm.com',
    10143: 'https://explorer.monad.xyz'
  }
  const baseUrl = explorers[chainId] || 'https://etherscan.io'
  return `${baseUrl}/tx/${transactionHash}`
}

const DeploymentSkeleton: React.FC<DeploymentSkeletonProps> = ({
  status,
  chainName = 'Ethereum',
  templateName = 'Smart Contract',
  transactionHash,
  chainId
}) => {
  const { t } = useTranslation()

  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          icon: <BuildIcon sx={{ fontSize: 32, color: '#6366f1' }} />,
          title: t('deployment.skeleton.preparing.title'),
          subtitle: t('deployment.skeleton.preparing.subtitle'),
          color: '#6366f1',
          progress: 50
        }
      case 'confirmed':
        return {
          icon: <CheckCircleIcon sx={{ fontSize: 32, color: '#10b981' }} />,
          title: 'Deployment Successful!',
          subtitle: 'Your contract has been deployed successfully',
          color: '#10b981',
          progress: 100
        }
      default:
        return {
          icon: <BuildIcon sx={{ fontSize: 32, color: '#6366f1' }} />,
          title: t('deployment.skeleton.preparing.title'),
          subtitle: t('deployment.skeleton.preparing.subtitle'),
          color: '#6366f1',
          progress: 0
        }
    }
  }

  const config = getStatusConfig()
  const explorerUrl = transactionHash && chainId ? getExplorerUrl(chainId, transactionHash) : null

  return (
    <Fade in={true} timeout={500}>
      <Paper
        sx={{
          p: 4,
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%)',
          border: `1px solid rgba(${config.color}, 0.2)`,
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: `linear-gradient(90deg, ${config.color} 0%, rgba(${config.color}, 0.3) 100%)`,
            animation: 'pulse 2s ease-in-out infinite',
          },
          '@keyframes pulse': {
            '0%, 100%': { opacity: 0.6 },
            '50%': { opacity: 1 },
          }
        }}
      >
        <Zoom in={true} timeout={800}>
          <Box sx={{ mb: 3 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: `linear-gradient(135deg, rgba(${config.color}, 0.1) 0%, rgba(${config.color}, 0.05) 100%)`,
                border: `2px solid rgba(${config.color}, 0.3)`,
                mb: 2,
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: -2,
                  left: -2,
                  right: -2,
                  bottom: -2,
                  borderRadius: '50%',
                  border: `2px solid transparent`,
                  borderTop: `2px solid ${config.color}`,
                  animation: 'spin 1s linear infinite',
                },
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' },
                }
              }}
            >
              {config.icon}
            </Box>
          </Box>
        </Zoom>

        <Typography
          variant="h5"
          component="h2"
          gutterBottom
          sx={{
            fontWeight: 600,
            color: config.color,
            mb: 1
          }}
        >
          {config.title}
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}
        >
          {config.subtitle}
        </Typography>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          justifyContent="center"
          sx={{ mb: 3 }}
        >
          <Chip
            icon={<GasIcon />}
            label={chainName}
            variant="outlined"
            sx={{
              borderColor: `rgba(${config.color}, 0.3)`,
              color: config.color,
              background: `rgba(${config.color}, 0.05)`
            }}
          />
          <Chip
            label={templateName}
            variant="outlined"
            sx={{
              borderColor: `rgba(${config.color}, 0.3)`,
              color: config.color,
              background: `rgba(${config.color}, 0.05)`
            }}
          />
        </Stack>

        <Box sx={{ mb: 3 }}>
                     <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
             <Typography variant="body2" color="text.secondary">
               {t('deployment.skeleton.progress')}
             </Typography>
            <Typography variant="body2" color="text.secondary">
              {config.progress}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={config.progress}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: `rgba(${config.color}, 0.1)`,
              '& .MuiLinearProgress-bar': {
                background: `linear-gradient(90deg, ${config.color} 0%, rgba(${config.color}, 0.7) 100%)`,
                borderRadius: 4,
              }
            }}
          />
        </Box>

        {status === 'pending' && explorerUrl && (
          <Fade in={true} timeout={1000}>
            <Box
              sx={{
                p: 2,
                bgcolor: `rgba(${config.color}, 0.05)`,
                borderRadius: 2,
                border: `1px solid rgba(${config.color}, 0.2)`,
                mt: 2
              }}
            >
                             <Typography variant="body2" color="text.secondary" gutterBottom>
                 {t('deployment.skeleton.confirming.followTransaction')}
               </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: 'monospace',
                  color: config.color,
                  wordBreak: 'break-all',
                  fontSize: '0.75rem'
                }}
              >
                {transactionHash}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: config.color,
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  mt: 1,
                  '&:hover': {
                    opacity: 0.8
                  }
                }}
                onClick={() => window.open(explorerUrl, '_blank')}
              >
                                 {t('deployment.skeleton.confirming.viewOnExplorer')}
              </Typography>
            </Box>
          </Fade>
        )}

                 <Typography
           variant="body2"
           color="text.secondary"
           sx={{ mt: 3, fontStyle: 'italic' }}
         >
           {status === 'pending' && t('deployment.skeleton.preparing.message')}
           {status === 'confirmed' && 'Your contract has been successfully deployed!'}
         </Typography>
      </Paper>
    </Fade>
  )
}

export default DeploymentSkeleton 