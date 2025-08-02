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
  Stack,
  Paper,
  Tooltip,
  Fade,
} from '@mui/material'
import {
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  OpenInNew as OpenInNewIcon,
  ContentCopy as ContentCopyIcon,
  AccountBalanceWallet as WalletIcon,
  LocalGasStation as GasIcon,
  Receipt as ReceiptIcon,
  Star as StarIcon,
  TrendingDown as DiscountIcon,
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { formatUnits } from 'viem'

interface DeploymentSuccessModalProps {
  open: boolean
  onClose: () => void
  deploymentResult: {
    address?: string
    hash?: string
    error?: string
  } | null
  chainName: string
  gasEstimate?: {
    deploymentCost: bigint
    platformFee: bigint
    premiumFee: bigint
    totalCost: bigint
    gasLimit: bigint
    gasPrice: bigint
  } | null
  templateName?: string
  selectedFeatures?: string[]
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
  gasEstimate,
  templateName,
  selectedFeatures = []
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

  const getChainCurrency = (chainId: number): string => {
    const currencies: Record<number, string> = {
      1: 'ETH',
      5: 'ETH',
      11155111: 'ETH',
      137: 'MATIC',
      80001: 'MATIC',
      42161: 'ETH',
      421614: 'ETH',
      10: 'ETH',
      420: 'ETH',
      11155420: 'ETH',
      56: 'BNB',
      97: 'BNB',
      43114: 'AVAX',
      43113: 'AVAX',
      250: 'FTM',
      4002: 'FTM',
      1284: 'GLMR',
      1285: 'MOVR',
      100: 'XDAI',
      42220: 'CELO',
      44787: 'CELO',
      1666600000: 'ONE',
      324: 'ETH',
      534352: 'ETH',
      534351: 'ETH',
      59144: 'ETH',
      59141: 'ETH',
      999: 'ETH',
      998: 'ETH',
      10143: 'MONAD'
    }
    return currencies[chainId] || 'ETH'
  }

  const formatCost = (value: bigint) => {
    const eth = formatUnits(value, 18)
    const currency = getChainCurrency(chainId)
    return `${parseFloat(eth).toFixed(6)} ${currency}`
  }

  const formatGasUsed = (gasLimit: bigint, gasPrice: bigint) => {
    const gasUsed = gasLimit * gasPrice
    return formatCost(gasUsed)
  }

  return (
          <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
      PaperProps={{
        sx: {
          background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 3,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        pb: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
          }}>
            <CheckCircleIcon sx={{ color: 'white', fontSize: 28 }} />
          </Box>
          <Box>
                         <Typography variant="h5" component="span" fontWeight="bold" sx={{ color: '#10b981' }}>
               {t('deployment.success.title')}
             </Typography>
             <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
               {templateName || t('deployment.success.description')}
             </Typography>
          </Box>
        </Box>
        <IconButton 
          onClick={onClose} 
          size="small"
          sx={{
            color: 'rgba(255, 255, 255, 0.6)',
            '&:hover': {
              color: '#ffffff',
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Fade in={open} timeout={800}>
          <Box>
                         <Paper sx={{ 
               p: 3, 
               mb: 3,
               background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
               border: '1px solid rgba(99, 102, 241, 0.2)',
               borderRadius: 2
             }}>
               <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                 <Box sx={{ flex: 1 }}>
                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                     <WalletIcon sx={{ color: '#6366f1', fontSize: 20 }} />
                     <Typography variant="subtitle2" color="text.secondary">
                       {t('deployment.success.network')}
                     </Typography>
                   </Box>
                   <Chip
                     label={chainName}
                     color="primary"
                     variant="outlined"
                     sx={{ 
                       background: 'rgba(99, 102, 241, 0.1)',
                       borderColor: 'rgba(99, 102, 241, 0.3)',
                       color: '#6366f1'
                     }}
                   />
                 </Box>
                 
                 <Box sx={{ flex: 1 }}>
                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                     <StarIcon sx={{ color: '#f59e0b', fontSize: 20 }} />
                     <Typography variant="subtitle2" color="text.secondary">
                       {t('deployment.success.premiumFeatures')}
                     </Typography>
                   </Box>
                   <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                     {selectedFeatures.length > 0 ? (
                       selectedFeatures.map((feature, index) => (
                         <Chip
                           key={index}
                           label={feature}
                           size="small"
                           variant="outlined"
                           sx={{ 
                             background: 'rgba(245, 158, 11, 0.1)',
                             borderColor: 'rgba(245, 158, 11, 0.3)',
                             color: '#f59e0b',
                             fontSize: '0.75rem'
                           }}
                         />
                       ))
                     ) : (
                       <Typography variant="body2" color="text.secondary">
                         {t('deployment.success.noPremiumFeatures')}
                       </Typography>
                     )}
                   </Box>
                 </Box>
               </Box>
             </Paper>

            <Paper sx={{ 
              p: 3, 
              mb: 3,
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: 2
            }}>
                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                 <CheckCircleIcon sx={{ color: '#10b981', fontSize: 20 }} />
                 <Typography variant="subtitle2" color="text.secondary">
                   {t('deployment.success.contractAddressTitle')}
                 </Typography>
               </Box>
              
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 2,
                bgcolor: 'rgba(16, 185, 129, 0.05)',
                borderRadius: 1,
                border: '1px solid rgba(16, 185, 129, 0.2)',
              }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: 'monospace',
                    wordBreak: 'break-all',
                    flex: 1,
                    color: '#10b981',
                    fontWeight: 500
                  }}
                >
                  {contractAddress}
                </Typography>
                                 <Tooltip title={t('deployment.success.copyAddress')}>
                  <IconButton
                    onClick={handleCopyAddress}
                    size="small"
                    sx={{ 
                      color: 'rgba(16, 185, 129, 0.6)',
                      '&:hover': {
                        color: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)'
                      }
                    }}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
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
                  color: '#10b981',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  '&:hover': {
                    textDecoration: 'underline',
                  }
                }}
              >
                                 {t('deployment.success.viewOnExplorerShort')}
                <OpenInNewIcon fontSize="small" />
              </Link>
            </Paper>

            <Paper sx={{ 
              p: 3, 
              mb: 3,
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: 2
            }}>
                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                 <ReceiptIcon sx={{ color: '#3b82f6', fontSize: 20 }} />
                 <Typography variant="subtitle2" color="text.secondary">
                   {t('deployment.success.transactionHashTitle')}
                 </Typography>
               </Box>
              
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 2,
                bgcolor: 'rgba(59, 130, 246, 0.05)',
                borderRadius: 1,
                border: '1px solid rgba(59, 130, 246, 0.2)',
              }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: 'monospace',
                    wordBreak: 'break-all',
                    flex: 1,
                    color: '#3b82f6',
                    fontWeight: 500
                  }}
                >
                  {transactionHash}
                </Typography>
                                 <Tooltip title={t('deployment.success.copyHash')}>
                  <IconButton
                    onClick={handleCopyTxHash}
                    size="small"
                    sx={{ 
                      color: 'rgba(59, 130, 246, 0.6)',
                      '&:hover': {
                        color: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)'
                      }
                    }}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
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
                  color: '#3b82f6',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  '&:hover': {
                    textDecoration: 'underline',
                  }
                }}
              >
                                 {t('deployment.success.viewTransactionOnExplorer')}
                <OpenInNewIcon fontSize="small" />
              </Link>
            </Paper>


            {gasEstimate && (
              <Paper sx={{ 
                p: 3, 
                mb: 3,
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)',
                border: '1px solid rgba(168, 85, 247, 0.2)',
                borderRadius: 2
              }}>
                                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                   <GasIcon sx={{ color: '#a855f7', fontSize: 20 }} />
                   <Typography variant="subtitle2" color="text.secondary">
                     {t('deployment.success.costDetails')}
                   </Typography>
                 </Box>
                
                                 <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                   <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                     <Box sx={{ flex: 1, display: 'flex', justifyContent: 'space-between' }}>
                       <Typography variant="body2" color="text.secondary">
                         {t('deployment.success.deploymentCost')}
                       </Typography>
                       <Typography variant="body2" fontWeight={500}>
                         {formatCost(gasEstimate.deploymentCost)}
                       </Typography>
                     </Box>
                     
                     <Box sx={{ flex: 1, display: 'flex', justifyContent: 'space-between' }}>
                       <Typography variant="body2" color="text.secondary">
                         {t('deployment.success.platformFees')}
                       </Typography>
                       <Typography variant="body2" fontWeight={500}>
                         {formatCost(gasEstimate.platformFee)}
                       </Typography>
                     </Box>
                   </Box>
                   
                   {gasEstimate.premiumFee > 0n && (
                     <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" color="text.secondary">
                           {t('deployment.success.premiumFeaturesCost')}
                         </Typography>
                       <Typography variant="body2" fontWeight={500} color="#f59e0b">
                         {formatCost(gasEstimate.premiumFee)}
                       </Typography>
                     </Box>
                   )}
                   
                                      <Divider sx={{ my: 1 }} />
                   <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                     <Typography variant="subtitle2" fontWeight={600}>
                       {t('deployment.success.totalCost')}
                     </Typography>
                     <Typography variant="subtitle2" fontWeight={600} color="#a855f7">
                       {formatCost(gasEstimate.deploymentCost + gasEstimate.platformFee + gasEstimate.premiumFee)}
                     </Typography>
                   </Box>
                 </Box>
              </Paper>
            )}

            <Paper sx={{ 
              p: 3,
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: 2
            }}>
                             <Typography variant="subtitle2" color="#10b981" fontWeight={600} gutterBottom>
                 {t('deployment.success.nextStepsTitle')}
               </Typography>
               <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                 {t('deployment.success.nextStepsDescription', { chainName })}
               </Typography>
              <Box component="ul" sx={{ mt: 1, pl: 2 }}>
                                 <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                   {t('deployment.success.nextStep1')}
                 </Typography>
                 <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                   {t('deployment.success.nextStep2')}
                 </Typography>
                 <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                   {t('deployment.success.nextStep3')}
                 </Typography>
                 <Typography component="li" variant="body2" color="text.secondary">
                   {t('deployment.success.nextStep4')}
                 </Typography>
              </Box>
            </Paper>
          </Box>
        </Fade>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button
          onClick={onClose}
          variant="contained"
          fullWidth
          sx={{
            background: 'linear-gradient(135deg, #4F46E5 0%, #9333EA 100%)',
            py: 1.5,
            borderRadius: 2,
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