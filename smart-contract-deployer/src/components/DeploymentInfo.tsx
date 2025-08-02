import { useTranslation } from 'react-i18next'
import { formatUnits } from 'viem'
import {
  Typography,
  Box,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material'
import {
  AccountBalanceWallet as WalletIcon,
} from '@mui/icons-material'
import type { GasEstimate } from '../types'
interface DeploymentInfoProps {
  gasEstimate: GasEstimate | null
  loading?: boolean
  chainName?: string
}
const DeploymentInfo = ({ gasEstimate, loading, chainName = 'Ethereum' }: DeploymentInfoProps) => {
  const { t } = useTranslation()
  if (loading) {
    return (
      <Box sx={{ p: 1, border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: 1, backgroundColor: 'rgba(99, 102, 241, 0.02)', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress size={14} />
          <Typography variant="caption" sx={{ ml: 1 }}>{t('deployment.estimatingGas')}</Typography>
        </Box>
      </Box>
    )
  }
  if (!gasEstimate) {
    return (
      <Box sx={{ p: 1, border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: 1, backgroundColor: 'rgba(99, 102, 241, 0.02)', mb: 1 }}>
        <Alert severity="info">{t('deployment.connectWallet')}</Alert>
      </Box>
    )
  }
  const formatCost = (value: bigint) => {
    const eth = formatUnits(value, 18)
    return `${parseFloat(eth).toFixed(6)} ETH`
  }

  const costs = [
    {
      value: formatCost(gasEstimate.deploymentCost),
    },
    {
      value: formatCost(gasEstimate.platformFee),
    },
  ]
  if (gasEstimate.premiumFee > 0n) {
    costs.push({
      value: formatCost(gasEstimate.premiumFee),
    })
  }
  return (
    <Box sx={{ 
      p: 1, 
      borderRadius: 1, 
      border: '1px solid rgba(99, 102, 241, 0.3)',
      backgroundColor: 'rgba(99, 102, 241, 0.02)',
      mb: 1
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WalletIcon sx={{ color: 'primary.main', fontSize: 16 }} />
          <Typography variant="caption" fontWeight={600} fontSize="0.75rem">
            💰 Costs ({chainName})
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {costs.map((cost, index) => (
            <Chip 
              key={index}
              label={cost.value}
              size="small"
              sx={{ 
                height: 20, 
                '& .MuiChip-label': { px: 1, fontSize: '0.65rem' },
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                color: 'primary.main',
                fontWeight: 500
              }}
            />
          ))}
          <Typography variant="caption" fontWeight={700} fontSize="0.75rem" color="primary.main">
            = {formatCost(gasEstimate.totalCost)}
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
export default DeploymentInfo