import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Typography,
  Tab,
  Tabs,
  Paper,
  Card,
  CardContent,
  Button,
  Chip,
  Stack,
  Alert,
  IconButton,
  LinearProgress,
  Divider
} from '@mui/material'
import {
  AccountCircle,
  Wallet,
  History,
  Build,
  Star,
  Add,
  Visibility,
  CreditCard,
  TrendingUp,
  Speed,
  Api,
  Notifications
} from '@mui/icons-material'
import { useAccount, useChainId } from 'wagmi'
import { useTranslation } from 'react-i18next'
import SubscriptionStatus from './SubscriptionStatus'
import DeployedContracts from './DeployedContracts'
import MintPageGenerator from './MintPageGenerator'
import SubscriptionPlans from './SubscriptionPlans'
import ContractMonitoring from './ContractMonitoring'
import NotificationSettings from './NotificationSettings'
import { useDeploymentPermissions } from '../hooks/useDeploymentPermissions'
import { getChainConfig } from '../config/cryptoConfig'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`account-tabpanel-${index}`}
      aria-labelledby={`account-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  )
}

const AccountDashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0)
  const [showPlans, setShowPlans] = useState(false)
  const [subscriptionData, setSubscriptionData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { permissions } = useDeploymentPermissions()
  const { t } = useTranslation()

  useEffect(() => {
    if (isConnected && address) {
      fetchSubscriptionData()
    } else {
      setLoading(false)
    }
  }, [address, isConnected])

    const fetchSubscriptionData = async () => {
    setLoading(true)
    try {
      if (permissions) {
        let realUsageData = {
          deployments: 0,
          compilations: 0,
          apiCalls: 0
        }

        try {
          const { supabase, isSupabaseEnabled } = await import('../config/supabase')
          
          console.log('📊 Récupération statistiques pour:', address)
          
          if (!address) {
            console.warn('⚠️ Pas d\'adresse utilisateur')
            return
          }
          
          if (!isSupabaseEnabled) {
            console.warn('⚠️ Supabase n\'est pas configuré')
            realUsageData = {
              deployments: 0,
              compilations: 0,
              apiCalls: 0
            }
            return
          }
          
          const [deploymentsResult, premiumResult, pageViewsResult] = await Promise.all([
            supabase
              .from('deployments')
              .select('*', { count: 'exact' })
              .eq('user_id', address)
              .eq('success', true),
            
            supabase
              .from('premium_features')  
              .select('*', { count: 'exact' })
              .eq('user_id', address),
              
            supabase
              .from('page_views')
              .select('*', { count: 'exact' })
              .eq('user_id', address)
          ])

          const { data: deployments, count: deploymentsCount, error: deploymentsError } = deploymentsResult
          const { data: premiumFeatures, count: premiumCount, error: premiumError } = premiumResult  
          const { data: pageViews, count: pageViewsCount, error: pageViewsError } = pageViewsResult

          if (deploymentsError || premiumError || pageViewsError) {
            console.error('❌ Erreurs Supabase:', { deploymentsError, premiumError, pageViewsError })
          }

          realUsageData = {
            deployments: deploymentsCount || 0,
            compilations: premiumCount || 0,
            apiCalls: pageViewsCount || 0
          }
          
          console.log('✅ Statistiques récupérées:', realUsageData)
          
        } catch (error) {
          console.error('❌ Erreur récupération statistiques:', error)
          realUsageData = {
            deployments: 0,
            compilations: 0,
            apiCalls: 0
          }
        }

        const subscriptionData = {
          plan: permissions.plan,
          status: 'active',
          expiresAt: permissions.plan !== 'free' 
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            : null,
          usage: {
            deployments: realUsageData.deployments || 0,
            deploymentsLimit: permissions.plan === 'free' ? 0 : 
                            permissions.plan === 'starter' ? 10 :
                            permissions.plan === 'pro' ? 100 : 1000,
            compilations: realUsageData.compilations || 0,
            apiCalls: realUsageData.apiCalls || 0,
            apiCallsLimit: permissions.plan === 'free' ? 1000 :
                         permissions.plan === 'starter' ? 5000 :
                         permissions.plan === 'pro' ? 50000 : 100000
          },
          platformFeeRate: permissions.platformFeeRate || 2.0
        }
        setSubscriptionData(subscriptionData)
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error)
      if (permissions) {
        setSubscriptionData({
          plan: permissions.plan,
          status: 'active',
          expiresAt: null,
          usage: {
            deployments: 0,
            deploymentsLimit: permissions.plan === 'free' ? 0 : 
                            permissions.plan === 'starter' ? 10 :
                            permissions.plan === 'pro' ? 100 : 1000,
            compilations: 0,
            apiCalls: 0,
            apiCallsLimit: permissions.plan === 'free' ? 1000 : 5000
          },
          platformFeeRate: permissions.platformFeeRate || 2.0
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  if (!isConnected) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <Wallet sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          {t('account.connectWallet')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('account.connectWalletDesc')}
        </Typography>
      </Container>
    )
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <LinearProgress />
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          justifyContent="space-between" 
          alignItems={{ xs: 'flex-start', sm: 'center' }} 
          spacing={2}
          mb={3}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <AccountCircle sx={{ fontSize: 40, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" fontWeight={600} sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
                {t('account.title')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </Typography>
            </Box>
          </Stack>
          
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={1} 
            alignItems={{ xs: 'stretch', sm: 'center' }}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            <SubscriptionStatus />
            {permissions?.plan === 'free' && (
              <Button
                variant="contained"
                startIcon={<Star />}
                onClick={() => setShowPlans(true)}
                size="small"
                sx={{
                  background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #E55A2B 0%, #E8841B 100%)',
                  },
                  textTransform: 'none',
                  fontWeight: 500,
                  px: 2
                }}
              >
                {t('account.upgrade')}
              </Button>
            )}
          </Stack>
        </Stack>

      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500
            }
          }}
        >
          <Tab icon={<TrendingUp />} label={t('account.tabs.overview')} />
          <Tab icon={<History />} label={t('account.tabs.deployments')} />
          <Tab 
            icon={<Speed />} 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {t('account.tabs.monitoring')}
                <Chip
                  label="Pro"
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.6rem',
                    fontWeight: 'bold',
                    backgroundColor: '#FFD700',
                    color: '#1a1a1a',
                    '& .MuiChip-label': {
                      px: 0.5,
                    },
                  }}
                />
              </Box>
            } 
          />
          <Tab icon={<Build />} label={t('account.tabs.mintPages')} />
          <Tab 
            icon={<Api />} 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {t('account.tabs.api')}
                <Chip
                  label="Pro"
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.6rem',
                    fontWeight: 'bold',
                    backgroundColor: '#FFD700',
                    color: '#1a1a1a',
                    '& .MuiChip-label': {
                      px: 0.5,
                    },
                  }}
                />
              </Box>
            } 
          />
          <Tab icon={<Notifications />} label="Notifications" />
          <Tab icon={<CreditCard />} label={t('account.tabs.billing')} />
        </Tabs>
      </Paper>

      <TabPanel value={tabValue} index={0}>
        <Stack spacing={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('account.subscription.title')}
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1">
                    {t('account.subscription.currentPlan')}
                  </Typography>
                  <Chip
                    label={t(`subscription.plans.${subscriptionData?.plan || 'free'}.name`)}
                    color={subscriptionData?.plan === 'free' ? 'default' : 'primary'}
                    icon={<Star />}
                  />
                </Box>

                {subscriptionData?.expiresAt && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1">
                      {t('account.subscription.expiresOn')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(subscriptionData.expiresAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                )}

                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">
                      {t('account.subscription.monthlyDeployments')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {subscriptionData?.usage.deployments} / {subscriptionData?.usage.deploymentsLimit || '∞'}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={subscriptionData?.usage.deploymentsLimit ? 
                      (subscriptionData.usage.deployments / subscriptionData.usage.deploymentsLimit) * 100 : 0
                    }
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              </Stack>

              {permissions?.plan !== 'enterprise' && (
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Star />}
                  onClick={() => setShowPlans(true)}
                  sx={{ mt: 3 }}
                >
                  {t('account.subscription.viewPlans')}
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('account.recentActivity')}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Alert severity="info">
                {t('account.noRecentActivity')}
              </Alert>
            </CardContent>
          </Card>
        </Stack>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <DeployedContracts />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {permissions?.plan !== 'pro' && permissions?.plan !== 'enterprise' ? (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('account.monitoring.title', 'Contract Monitoring')}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Alert severity="warning">
                {t('account.monitoring.upgradeRequired', 'Contract monitoring is available for Pro and Enterprise plans. Upgrade to monitor your contracts in real-time with advanced analytics and alerts.')}
                <Button
                  size="small"
                  startIcon={<Star />}
                  onClick={() => setShowPlans(true)}
                  sx={{ mt: 1 }}
                >
                  {t('account.upgrade')}
                </Button>
              </Alert>
            </CardContent>
          </Card>
        ) : (
          <ContractMonitoring />
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Stack spacing={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('account.mintPages.title')}
              </Typography>
              <Divider sx={{ my: 2 }} />
              {permissions?.plan === 'free' ? (
                <Alert severity="warning">
                  {t('account.mintPages.upgradeRequired')}
                  <Button
                    size="small"
                    startIcon={<Star />}
                    onClick={() => setShowPlans(true)}
                    sx={{ mt: 1 }}
                  >
                    {t('account.upgrade')}
                  </Button>
                </Alert>
              ) : (
                <MintPageGenerator />
              )}
            </CardContent>
          </Card>
        </Stack>
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        <Stack spacing={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('account.api.title')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t('account.api.description')}
              </Typography>
              <Divider sx={{ my: 2 }} />
              {permissions?.plan !== 'pro' && permissions?.plan !== 'enterprise' ? (
                <Alert severity="warning">
                  {t('account.api.upgradeRequired', 'API management is available for Pro and Enterprise plans. Upgrade to manage your API keys and access advanced integration features.')}
                  <Button
                    size="small"
                    startIcon={<Star />}
                    onClick={() => setShowPlans(true)}
                    sx={{ mt: 1 }}
                  >
                    {t('account.upgrade')}
                  </Button>
                </Alert>
              ) : (
                <Alert severity="info">
                  {t('account.api.keysComingSoon')}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Stack>
      </TabPanel>

      <TabPanel value={tabValue} index={5}>
        <NotificationSettings />
      </TabPanel>

      <TabPanel value={tabValue} index={6}>
        <Box>
          <Typography variant="h4" gutterBottom>
            💳 Billing Tab Content
          </Typography>
          <SubscriptionPlans onSubscribe={() => {
            setShowPlans(false)
            fetchSubscriptionData()
          }} />
        </Box>
      </TabPanel>

      {showPlans && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'background.default',
            zIndex: 1300,
            overflow: 'auto'
          }}
        >
          <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
              <Typography variant="h4">
                {t('subscription.choosePlan')}
              </Typography>
              <IconButton onClick={() => setShowPlans(false)}>
                <Add sx={{ transform: 'rotate(45deg)' }} />
              </IconButton>
            </Box>
            <SubscriptionPlans onSubscribe={() => {
              setShowPlans(false)
              fetchSubscriptionData()
            }} />
          </Container>
        </Box>
      )}
    </Container>
  )
}

export default AccountDashboard 