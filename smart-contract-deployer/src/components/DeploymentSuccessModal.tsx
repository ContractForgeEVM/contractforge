import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Link,
  Divider,
  Chip,
} from '@mui/material'
import {
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  OpenInNew as OpenInNewIcon,
  ContentCopy as ContentCopyIcon,
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
interface DeploymentSuccessModalProps {
  open: boolean
  onClose: () => void
  deploymentResult: {
    address?: string
    hash?: string
    error?: string
  } | null
  chainName: string
}
const getExplorerUrl = (chainId: number, type: 'address' | 'tx', hash: string): string => {
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
  const path = type === 'address' ? 'address' : 'tx'
  return `${baseUrl}/${path}/${hash}`
}
const DeploymentSuccessModal: React.FC<DeploymentSuccessModalProps> = ({
  open,
  onClose,
  deploymentResult,
  chainName,
}) => {
  const { t } = useTranslation()
  if (!deploymentResult?.address) {
    return null
  }
  const contractAddress = deploymentResult.address
  const transactionHash = deploymentResult.hash || ''
  const handleCopyAddress = () => {
    navigator.clipboard.writeText(contractAddress)
  }
  const handleCopyTxHash = () => {
    navigator.clipboard.writeText(transactionHash)
  }
  const getChainIdFromName = (name: string): number => {
    const chainMap: Record<string, number> = {
      'Ethereum': 1,
      'Polygon': 137,
      'Arbitrum': 42161,
      'Optimism': 10,
      'BSC': 56,
      'Avalanche': 43114,
      'Fantom': 250,
      'Gnosis': 100,
      'zkSync Era': 324,
      'Scroll': 534352,
      'Linea': 59144,
      'HyperEVM': 999,
      'Monad Testnet': 10143,
      'Sepolia': 11155111,
      'Mumbai': 80001,
      'Arbitrum Sepolia': 421614,
      'Optimism Sepolia': 11155420,
      'BSC Testnet': 97,
      'Avalanche Fuji': 43113,
      'Scroll Sepolia': 534351,
      'Linea Sepolia': 59141,
      'HyperEVM Testnet': 998,
    }
    return chainMap[name] || 1
  }
  const chainId = getChainIdFromName(chainName)
  const contractExplorerUrl = getExplorerUrl(chainId, 'address', contractAddress)
  const txExplorerUrl = getExplorerUrl(chainId, 'tx', transactionHash)
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CheckCircleIcon sx={{ color: 'success.main', fontSize: 32 }} />
          <Typography variant="h5" component="span" fontWeight="bold">
            {t('deployment.success.title')}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2 }}>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            {t('deployment.success.description')}
          </Typography>
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {t('deployment.success.network')}
            </Typography>
            <Chip
              label={chainName}
              color="primary"
              variant="outlined"
              sx={{ mb: 3 }}
            />
            <Divider sx={{ my: 2 }} />
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {t('deployment.success.contractAddress')}
              </Typography>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 2,
                bgcolor: 'background.paper',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
              }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: 'monospace',
                    wordBreak: 'break-all',
                    flex: 1,
                  }}
                >
                  {contractAddress}
                </Typography>
                <IconButton
                  onClick={handleCopyAddress}
                  size="small"
                  sx={{ flexShrink: 0 }}
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Box>
              <Link
                href={contractExplorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  mt: 1,
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  }
                }}
              >
                {t('deployment.success.viewOnExplorer')}
                <OpenInNewIcon fontSize="small" />
              </Link>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {t('deployment.success.transactionHash')}
              </Typography>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 2,
                bgcolor: 'background.paper',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
              }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: 'monospace',
                    wordBreak: 'break-all',
                    flex: 1,
                  }}
                >
                  {transactionHash}
                </Typography>
                <IconButton
                  onClick={handleCopyTxHash}
                  size="small"
                  sx={{ flexShrink: 0 }}
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Box>
              <Link
                href={txExplorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  mt: 1,
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  }
                }}
              >
                {t('deployment.success.viewTransaction')}
                <OpenInNewIcon fontSize="small" />
              </Link>
            </Box>
          </Box>
          <Box sx={{
            mt: 3,
            p: 2,
            bgcolor: 'rgba(46, 125, 50, 0.1)',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'success.main',
          }}>
            <Typography variant="body2" color="success.main">
              {t('deployment.success.nextSteps')}
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button
          onClick={onClose}
          variant="contained"
          fullWidth
          sx={{
            background: 'linear-gradient(135deg, #4F46E5 0%, #9333EA 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #4338CA 0%, #7C3AED 100%)',
            }
          }}
        >
          {t('deployment.success.close')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
export default DeploymentSuccessModal