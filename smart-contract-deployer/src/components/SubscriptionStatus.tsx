import React from 'react'
import { Chip, Box, Typography, Tooltip } from '@mui/material'
import { Star, Lock, VpnKey } from '@mui/icons-material'
import { useAccount } from 'wagmi'
import { useTranslation } from 'react-i18next'
import { useDeploymentPermissions } from '../hooks/useDeploymentPermissions'
const SubscriptionStatus: React.FC = () => {
  const { isConnected } = useAccount()
  const { permissions, loading } = useDeploymentPermissions()
  const { t } = useTranslation()
  if (!isConnected || loading || !permissions) {
    return null
  }
  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'free':
        return <Lock />
      case 'starter':
      case 'pro':
      case 'enterprise':
        return <Star />
      default:
        return <VpnKey />
    }
  }
  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'free':
        return 'default'
      case 'starter':
        return 'info'
      case 'pro':
        return 'primary'
      case 'enterprise':
        return 'warning'
      default:
        return 'default'
    }
  }
  const getPlanDisplayName = (plan: string) => {
    const validPlan = plan || 'free'
    return t(`subscription.plans.${validPlan}.name`)
  }
  const getTooltipContent = () => {
    if (permissions.plan === 'free') {
      return (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            {t('subscription.freePlanTooltip.title')}
          </Typography>
          <Typography variant="caption">
            {t('subscription.freePlanTooltip.features.0')}<br/>
            {t('subscription.freePlanTooltip.features.1')}<br/>
            {t('subscription.freePlanTooltip.features.2')}<br/>
            <strong>{t('subscription.freePlanTooltip.features.3')}</strong>
          </Typography>
        </Box>
      )
    }
    return (
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          {t('subscription.paidPlanTooltip.title', { plan: getPlanDisplayName(permissions.plan) })}
        </Typography>
        <Typography variant="caption">
          {t('subscription.paidPlanTooltip.deployments')}<br/>
          {t('subscription.paidPlanTooltip.fees', { rate: permissions.platformFeeRate })}<br/>
          {permissions.plan === 'starter' && t('subscription.paidPlanTooltip.starterLimit')}
          {permissions.plan === 'pro' && t('subscription.paidPlanTooltip.proLimit')}
          {permissions.plan === 'enterprise' && t('subscription.paidPlanTooltip.enterpriseLimit')}
        </Typography>
      </Box>
    )
  }
  return (
    <Tooltip title={getTooltipContent()} arrow>
      <Chip
        icon={getPlanIcon(permissions.plan)}
        label={getPlanDisplayName(permissions.plan)}
        color={getPlanColor(permissions.plan) as any}
        size="small"
        sx={{
          cursor: 'pointer',
          '&:hover': {
            transform: 'scale(1.05)',
          },
          transition: 'transform 0.2s ease'
        }}
      />
    </Tooltip>
  )
}
export default SubscriptionStatus