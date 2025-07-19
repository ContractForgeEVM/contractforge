import { useTranslation } from 'react-i18next'
import { formatUnits } from 'viem'
import {
  Paper,
  Typography,
  Box,
  Stack,
  Divider,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material'
import {
  LocalGasStation as GasIcon,
  AccountBalanceWallet as WalletIcon,
  Receipt as FeeIcon,
  Star as PremiumIcon,
  TrendingDown as DiscountIcon,
} from '@mui/icons-material'
import type { GasEstimate } from '../types'
import { useDeploymentPermissions } from '../hooks/useDeploymentPermissions'
interface DeploymentInfoProps {
  gasEstimate: GasEstimate | null
  loading?: boolean
  chainName?: string
}
const DeploymentInfo = ({ gasEstimate, loading, chainName = 'Ethereum' }: DeploymentInfoProps) => {
  const { t } = useTranslation()
  const { permissions } = useDeploymentPermissions()
  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress size={24} />
          <Typography sx={{ ml: 2 }}>{t('deployment.estimatingGas')}</Typography>
        </Box>
      </Paper>
    )
  }
  if (!gasEstimate) {
    return (
      <Paper sx={{ p: 3 }}>
        <Alert severity="info">{t('deployment.connectWallet')}</Alert>
      </Paper>
    )
  }
  const formatCost = (value: bigint) => {
    const eth = formatUnits(value, 18)
    return `${parseFloat(eth).toFixed(6)} ETH`
  }
  const platformFeeRate = permissions?.platformFeeRate || 2.0
  const hasReducedFees = platformFeeRate < 2.0
  const costs = [
    {
      label: t('deployment.gasCost'),
      value: formatCost(gasEstimate.deploymentCost),
      icon: <GasIcon />,
      color: 'primary.main',
    },
    {
      label: hasReducedFees 
        ? `Platform Fee (${platformFeeRate}% - Reduced!)` 
        : `Platform Fee (${platformFeeRate}%)`,
      value: formatCost(gasEstimate.platformFee),
      icon: hasReducedFees ? <DiscountIcon /> : <FeeIcon />,
      color: hasReducedFees ? 'success.main' : 'secondary.main',
    },
  ]
  if (gasEstimate.premiumFee > 0n) {
    costs.push({
      label: 'Premium Features',
      value: formatCost(gasEstimate.premiumFee),
      icon: <PremiumIcon />,
      color: 'warning.main',
    })
  }
  return (
    <Paper
      sx={{
        p: 0,
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.2)',
      }}
    >
      <Box sx={{ p: 3, pb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={2} mb={3}>
          <WalletIcon sx={{ color: 'primary.main' }} />
          <Typography variant="h6" fontWeight={600}>
            {t('deployment.estimatedCosts')}
          </Typography>
          <Chip
            label={chainName}
            size="small"
            sx={{
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              color: 'primary.main',
              fontWeight: 600,
            }}
          />
        </Stack>
        <Stack spacing={2}>
          {costs.map((cost, index) => (
            <Stack
              key={index}
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ color: cost.color }}>{cost.icon}</Box>
                <Typography variant="body2" color="text.secondary">
                  {cost.label}
                </Typography>
              </Stack>
              <Typography variant="body1" fontWeight={600}>
                {cost.value}
              </Typography>
            </Stack>
          ))}
        </Stack>
        <Divider sx={{ my: 2 }} />
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{
            p: 2,
            borderRadius: 2,
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
          }}
        >
          <Typography variant="h6" fontWeight={700}>
            {t('deployment.totalCost')}
          </Typography>
          <Typography variant="h6" color="primary" fontWeight={700}>
            {formatCost(gasEstimate.totalCost)}
          </Typography>
        </Stack>
        {permissions && (
          <Box
            sx={{
              mt: 2,
              p: 2,
              backgroundColor: permissions.payAsYouGo 
                ? 'rgba(33, 150, 243, 0.1)' 
                : 'rgba(46, 125, 50, 0.1)',
              borderRadius: 1,
              border: '1px solid',
              borderColor: permissions.payAsYouGo ? 'info.main' : 'success.main',
            }}
          >
            {permissions.payAsYouGo ? (
              <>
                <Typography variant="body2" color="info.main" fontWeight={600}>
                  💳 Pay-as-you-go deployment
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Standard 2% platform fees. Subscribe for reduced fees and monthly limits!
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="body2" color="success.main" fontWeight={600}>
                  🎉 Subscription Benefits Active!
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Your {permissions.plan} plan includes reduced platform fees ({platformFeeRate}% instead of 2%)
                </Typography>
              </>
            )}
          </Box>
        )}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: 'block',
            mt: 2,
            textAlign: 'center',
            opacity: 0.7,
          }}
        >
          {t('deployment.gasInfo')}
        </Typography>
      </Box>
    </Paper>
  )
}
export default DeploymentInfo