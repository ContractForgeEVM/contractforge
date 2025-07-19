import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Grid,
  Alert,
  Divider,
  Stack,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material'
import {
  Star,
  Check,
  Upgrade,
  AccountBalanceWallet,
  Schedule,
  TrendingUp,
  Settings,
  CreditCard,
  CurrencyBitcoin,
  Close,
  Info,
  Warning,
  CheckCircle
} from '@mui/icons-material'
import { useAccount, useChainId } from 'wagmi'
import { useTranslation } from 'react-i18next'
import { useDeploymentPermissions } from '../hooks/useDeploymentPermissions'
import { getChainConfig, SUPPORTED_CHAINS } from '../config/cryptoConfig'
import SubscriptionPlans from './SubscriptionPlans'
import CryptoPayment from './CryptoPayment'
interface SubscriptionStatus {
  plan: 'free' | 'starter' | 'pro' | 'enterprise'
  status: 'active' | 'expired' | 'canceled' | 'trial'
  expiresAt?: Date
  usage: {
    deployments: number
    deploymentsLimit: number
    compilations: number
    apiCalls?: number
    apiCallsLimit?: number
  }
  paymentMethod?: 'crypto'
  chainId?: number
}
const SubscriptionDashboard: React.FC = () => {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPlans, setShowPlans] = useState(false)
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<string | null>(null)
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { permissions } = useDeploymentPermissions()
  const chainConfig = getChainConfig(chainId)
  const { t } = useTranslation()
  useEffect(() => {
    if (isConnected && address) {
      fetchSubscriptionStatus()
    } else {
      setSubscriptionStatus(null)
      setLoading(false)
    }
  }, [address, isConnected])
  const fetchSubscriptionStatus = async () => {
    setLoading(true)
    try {
       const lastDigit = parseInt(address!.slice(-1), 16)
       let mockStatus: SubscriptionStatus
       if (lastDigit < 5) {
         mockStatus = {
           plan: 'free',
           status: 'active',
           usage: {
             deployments: 0,
             deploymentsLimit: 0,
             compilations: 25,
             apiCalls: 150
           }
         }
       } else if (lastDigit < 9) {
        mockStatus = {
          plan: 'starter',
          status: 'active',
          expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), 
          usage: {
            deployments: 2,
            deploymentsLimit: 5,
            compilations: 45,
            apiCalls: 1200,
            apiCallsLimit: 5000
          },
          paymentMethod: 'crypto',
          chainId: 42161 
        }
             } else if (lastDigit < 13) {
         mockStatus = {
           plan: 'pro',
           status: 'active',
           expiresAt: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000), 
           usage: {
             deployments: 15,
             deploymentsLimit: 100,
             compilations: 156,
             apiCalls: 3400,
             apiCallsLimit: 10000
           },
           paymentMethod: 'crypto'
         }
       } else {
        mockStatus = {
          plan: 'enterprise',
          status: 'active',
          expiresAt: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), 
          usage: {
            deployments: 45,
            deploymentsLimit: 1000,
            compilations: 890,
            apiCalls: 25000,
            apiCallsLimit: 100000
          },
          paymentMethod: 'crypto',
          chainId: 1 
        }
      }
      setSubscriptionStatus(mockStatus)
    } catch (error) {
      console.error('Error fetching subscription status:', error)
    } finally {
      setLoading(false)
    }
  }
  const handleUpgrade = (planId: string) => {
    setSelectedUpgradePlan(planId)
    setShowUpgradeDialog(true)
  }
  const handleSubscriptionSuccess = () => {
    setShowUpgradeDialog(false)
    setShowPlans(false)
    fetchSubscriptionStatus() 
  }
  const getPlanDisplayName = (plan: string) => {
    const validPlan = plan || 'free'
    return t(`subscription.plans.${validPlan}.name`)
  }
  const getPlanColor = (plan: string) => {
    const colors = {
      free: 'default',
      starter: 'info',
      pro: 'primary',
      enterprise: 'warning'
    }
    return colors[plan as keyof typeof colors] || 'default'
  }
  const getStatusColor = (status: string) => {
    const colors = {
      active: 'success',
      expired: 'error',
      canceled: 'warning',
      trial: 'info'
    }
    return colors[status as keyof typeof colors] || 'default'
  }
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }
  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === 0) return 0
    return Math.min((used / limit) * 100, 100)
  }
  const getDaysRemaining = (expiresAt?: Date) => {
    if (!expiresAt) return null
    const now = new Date()
    const diffTime = expiresAt.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }
  if (!isConnected) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <AccountBalanceWallet sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          {t('subscription.connectWallet')}
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={3}>
          {t('subscription.connectWalletDesc')}
        </Typography>
      </Box>
    )
  }
  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          {t('subscription.loading')}
        </Typography>
        <LinearProgress />
      </Box>
    )
  }
  if (!subscriptionStatus) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Warning sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          {t('subscription.loadingError')}
        </Typography>
        <Button variant="contained" onClick={fetchSubscriptionStatus}>
          {t('subscription.retry')}
        </Button>
      </Box>
    )
  }
  const daysRemaining = getDaysRemaining(subscriptionStatus.expiresAt)
  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            {t('subscription.title')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('subscription.subtitle')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<TrendingUp />}
            onClick={() => setShowPlans(true)}
          >
            {t('subscription.viewAllPlans')}
          </Button>
          <IconButton onClick={() => window.location.reload()}>
            <Settings />
          </IconButton>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        {}
        <Box sx={{ flex: '1 1 65%' }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {t('subscription.currentPlan')}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                         <Chip
                       label={getPlanDisplayName(subscriptionStatus.plan)}
                       color={getPlanColor(subscriptionStatus.plan) as any}
                       size="medium"
                       icon={<Star />}
                     />
                    <Chip
                      label={subscriptionStatus.status}
                      color={getStatusColor(subscriptionStatus.status) as any}
                      size="small"
                    />
                  </Box>
                </Box>
                                 {subscriptionStatus.plan !== 'enterprise' && (
                   <Button
                     variant="contained"
                     startIcon={<Upgrade />}
                     onClick={() => setShowPlans(true)}
                     sx={{
                       background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
                       '&:hover': {
                         background: 'linear-gradient(135deg, #E55A2B 0%, #E8841B 100%)',
                       }
                     }}
                   >
                     {subscriptionStatus.plan === 'free' ? t('subscription.start') : t('subscription.upgrade')}
                   </Button>
                 )}
              </Box>
              {}
              {subscriptionStatus.expiresAt && (
                <Alert 
                  severity={daysRemaining && daysRemaining < 7 ? 'warning' : 'info'}
                  sx={{ mb: 3 }}
                >
                                     <Typography variant="body2">
                     {daysRemaining && daysRemaining > 0 ? (
                       <>{t('subscription.expiresIn')} <strong>{daysRemaining} {t('subscription.days')}</strong> ({formatDate(subscriptionStatus.expiresAt)})</>
                     ) : (
                       <>{t('subscription.expiredOn')} {formatDate(subscriptionStatus.expiresAt)}</>
                     )}
                   </Typography>
                </Alert>
              )}
              {}
              {subscriptionStatus.paymentMethod && (
                                 <Box sx={{ mb: 3 }}>
                   <Typography variant="subtitle2" gutterBottom>
                     {t('subscription.paymentMethod')}
                   </Typography>
                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                     {subscriptionStatus.paymentMethod === 'crypto' ? (
                       <>
                         <CurrencyBitcoin color="warning" />
                         <Typography variant="body2">
                           {t('subscription.crypto')} ({subscriptionStatus.chainId ? getChainConfig(subscriptionStatus.chainId)?.name : t('subscription.multichain')})
                         </Typography>
                         <Chip label={t('subscription.noncustodial')} size="small" color="success" />
                       </>
                     ) : (
                       <>
                         <CreditCard color="primary" />
                         <Typography variant="body2">{t('subscription.creditCard')}</Typography>
                         <Chip label={t('subscription.recurring')} size="small" color="info" />
                       </>
                     )}
                   </Box>
                 </Box>
              )}
              <Divider sx={{ my: 3 }} />
                             {}
               <Typography variant="h6" gutterBottom>
                 {t('subscription.usageThisMonth')}
               </Typography>
               <Stack spacing={2}>
                 {}
                 <Box>
                   <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                     <Typography variant="body2">
                       {t('subscription.deployments')}
                     </Typography>
                     <Typography variant="body2" color="text.secondary">
                       {subscriptionStatus.usage.deployments} / {subscriptionStatus.usage.deploymentsLimit || '∞'}
                     </Typography>
                   </Box>
                  <LinearProgress
                    variant="determinate"
                    value={getUsagePercentage(subscriptionStatus.usage.deployments, subscriptionStatus.usage.deploymentsLimit)}
                    color={getUsagePercentage(subscriptionStatus.usage.deployments, subscriptionStatus.usage.deploymentsLimit) > 80 ? 'warning' : 'primary'}
                  />
                </Box>
                                 {}
                 <Box>
                   <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                     <Typography variant="body2">
                       {t('subscription.compilations')}
                     </Typography>
                     <Typography variant="body2" color="text.secondary">
                       {subscriptionStatus.usage.compilations} ({t('subscription.unlimited')})
                     </Typography>
                   </Box>
                  <LinearProgress variant="determinate" value={25} color="success" />
                </Box>
                                 {}
                 {subscriptionStatus.usage.apiCalls && subscriptionStatus.usage.apiCallsLimit && (
                   <Box>
                     <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                       <Typography variant="body2">
                         {t('subscription.apiCalls')}
                       </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {subscriptionStatus.usage.apiCalls} / {subscriptionStatus.usage.apiCallsLimit}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={getUsagePercentage(subscriptionStatus.usage.apiCalls, subscriptionStatus.usage.apiCallsLimit)}
                      color={getUsagePercentage(subscriptionStatus.usage.apiCalls, subscriptionStatus.usage.apiCallsLimit) > 80 ? 'warning' : 'primary'}
                    />
                  </Box>
                )}
              </Stack>
            </CardContent>
                     </Card>
         </Box>
         {}
         <Box sx={{ flex: '1 1 35%' }}>
          <Stack spacing={3}>
                         {}
             <Card>
               <CardContent>
                 <Typography variant="h6" gutterBottom>
                   {t('subscription.includedBenefits')}
                 </Typography>
                <List dense>
                                     {(() => {
                     const validPlan = subscriptionStatus.plan || 'free'
                     const features = t(`subscription.plans.${validPlan}.features`, { returnObjects: true }) as string[]
                     return features.map((feature: string, index: number) => (
                       <ListItem key={index}>
                         <ListItemIcon><Check color="success" /></ListItemIcon>
                         <ListItemText primary={feature} />
                       </ListItem>
                     ))
                   })()}
                </List>
              </CardContent>
            </Card>
                         {}
             {chainConfig && (
               <Card>
                 <CardContent>
                   <Typography variant="h6" gutterBottom>
                     {t('subscription.currentNetwork')}
                   </Typography>
                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                     <Chip
                       label={chainConfig.name}
                       color="secondary"
                       icon={<CheckCircle />}
                     />
                   </Box>
                   <Typography variant="body2" color="text.secondary">
                     {chainConfig.chainId === 1 
                       ? t('subscription.maxSecurity')
                       : t('subscription.reducedFees')
                     }
                   </Typography>
                 </CardContent>
               </Card>
             )}
                     </Stack>
         </Box>
       </Box>
      {}
      <Dialog
        open={showPlans}
        onClose={() => setShowPlans(false)}
        maxWidth="lg"
        fullWidth
      >
                 <DialogTitle>
           <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <Typography variant="h6">{t('subscription.subscriptionPlans')}</Typography>
             <IconButton onClick={() => setShowPlans(false)}>
               <Close />
             </IconButton>
           </Box>
         </DialogTitle>
        <DialogContent>
          <SubscriptionPlans onSubscribe={handleSubscriptionSuccess} />
        </DialogContent>
      </Dialog>
      {}
      <Dialog
        open={showUpgradeDialog}
        onClose={() => setShowUpgradeDialog(false)}
        maxWidth="sm"
        fullWidth
      >
                 <DialogTitle>
           <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <Typography variant="h6">{t('subscription.upgradeTo')} {selectedUpgradePlan}</Typography>
             <IconButton onClick={() => setShowUpgradeDialog(false)}>
               <Close />
             </IconButton>
           </Box>
         </DialogTitle>
        <DialogContent>
          {selectedUpgradePlan && (
            <CryptoPayment
              planId={selectedUpgradePlan}
              planName={getPlanDisplayName(selectedUpgradePlan)}
              monthlyPrice={selectedUpgradePlan === 'starter' ? 9 : selectedUpgradePlan === 'pro' ? 19 : 99}
              yearlyPrice={selectedUpgradePlan === 'starter' ? 90 : selectedUpgradePlan === 'pro' ? 190 : 990}
              isYearly={false}
              onSuccess={handleSubscriptionSuccess}
              onCancel={() => setShowUpgradeDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  )
}
export default SubscriptionDashboard