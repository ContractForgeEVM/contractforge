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
  TrendingUp
} from '@mui/icons-material'
import { useAccount, useChainId } from 'wagmi'
import { useTranslation } from 'react-i18next'
import SubscriptionStatus from './SubscriptionStatus'
import DeployedContracts from './DeployedContracts'
import MintPageGenerator from './MintPageGenerator'
import SubscriptionPlans from './SubscriptionPlans'
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
      // Utiliser les vraies données des permissions et analytiques
      if (permissions) {
        let realUsageData = {
          deployments: 0,
          compilations: 0,
          apiCalls: 0
        }

        try {
          // Import correct de la configuration Supabase
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
          
          // Récupérer les données spécifiques à l'utilisateur
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

          // Mettre à jour realUsageData avec les vraies données
          realUsageData = {
            deployments: deploymentsCount || 0,
            compilations: premiumCount || 0,
            apiCalls: pageViewsCount || 0
          }
          
          console.log('✅ Statistiques récupérées:', realUsageData)
          
        } catch (error) {
          console.error('❌ Erreur récupération statistiques:', error)
          // En cas d'erreur, tout à 0 - PAS de données mock
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
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 jours par défaut
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
      // Fallback avec les données des permissions seulement
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
      {/* Header Section */}
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

        {/* Quick Stats */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Card sx={{ flex: 1 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {subscriptionData?.usage.deployments || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('account.stats.contractsDeployed')}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {subscriptionData?.usage.compilations || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('account.stats.compilations')}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">
                {subscriptionData?.usage.apiCalls || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('account.stats.apiCalls')}
              </Typography>
            </CardContent>
          </Card>
        </Stack>
      </Box>

      {/* Tabs Navigation */}
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
          <Tab icon={<Build />} label={t('account.tabs.tools')} />
          <Tab icon={<CreditCard />} label={t('account.tabs.billing')} />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        {/* Overview Tab */}
        <Stack spacing={3}>
          {/* Subscription Overview */}
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

          {/* Recent Activity */}
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
        {/* Deployments Tab */}
        <DeployedContracts />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {/* Tools Tab */}
        <Stack spacing={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('account.tools.mintPages')}
              </Typography>
              <Divider sx={{ my: 2 }} />
              {permissions?.plan === 'free' ? (
                <Alert severity="warning">
                  {t('account.tools.mintPagesUpgradeRequired')}
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

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('account.tools.apiKeys')}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Alert severity="info">
                {t('account.tools.apiKeysComingSoon')}
              </Alert>
            </CardContent>
          </Card>
        </Stack>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        {/* Billing Tab */}
        <SubscriptionPlans onSubscribe={() => {
          setShowPlans(false)
          fetchSubscriptionData()
        }} />
      </TabPanel>

      {/* Subscription Plans Dialog */}
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