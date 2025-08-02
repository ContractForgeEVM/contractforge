import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Alert,
  Fade
} from '@mui/material'
import {
  Check,
  Star,
  Bolt,
  BusinessCenter,
  Close,
  Savings
} from '@mui/icons-material'
import { useAccount } from 'wagmi'
import { useTranslation } from 'react-i18next'
import CryptoPayment from './CryptoPayment'
interface Plan {
  id: string
  name: string
  displayName: string
  monthlyPrice: number
  yearlyPrice: number
  description: string
  icon: React.ReactNode
  color: 'default' | 'primary' | 'secondary' | 'warning'
  popular?: boolean
  features: string[]
  limits: {
    deployments: number
    platformFee: number
  }
}
interface SubscriptionPlansProps {
  onSubscribe?: () => void
  compact?: boolean
  showOnlyUpgrades?: boolean
  currentPlan?: string
}
const getPlansData = (t: any): Plan[] => [
  {
    id: 'free',
    name: 'free',
    displayName: t('subscription.plans.free.name'),
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: t('subscription.plans.free.description'),
    icon: <Check />,
    color: 'default',
    features: t('subscription.plans.free.features', { returnObjects: true }) as string[],
    limits: {
      deployments: 0,
      platformFee: 2.0
    }
  },
  {
    id: 'starter',
    name: 'starter',
    displayName: t('subscription.plans.starter.name'),
    monthlyPrice: 9,
    yearlyPrice: 90,
    description: t('subscription.plans.starter.description'),
    icon: <Bolt />,
    color: 'primary',
    popular: true,
    features: t('subscription.plans.starter.features', { returnObjects: true }) as string[],
    limits: {
      deployments: 5,
      platformFee: 1.5
    }
  },
  {
    id: 'pro',
    name: 'pro',
    displayName: t('subscription.plans.pro.name'),
    monthlyPrice: 19,
    yearlyPrice: 190,
    description: t('subscription.plans.pro.description'),
    icon: <Star />,
    color: 'secondary',
    features: t('subscription.plans.pro.features', { returnObjects: true }) as string[],
    limits: {
      deployments: 100,
      platformFee: 2.0
    }
  },
  {
    id: 'enterprise',
    name: 'enterprise',
    displayName: t('subscription.plans.enterprise.name'),
    monthlyPrice: 99,
    yearlyPrice: 990,
    description: t('subscription.plans.enterprise.description'),
    icon: <BusinessCenter />,
    color: 'warning',
    features: t('subscription.plans.enterprise.features', { returnObjects: true }) as string[],
    limits: {
      deployments: 1000,
      platformFee: 1.5
    }
  }
]
const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ 
  onSubscribe, 
  compact = false, 
  showOnlyUpgrades = false,
  currentPlan 
}) => {
  const [isYearly, setIsYearly] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'crypto' | null>(null)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const { isConnected } = useAccount()
  const { t } = useTranslation()
  const plans = getPlansData(t)
  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan)
    setShowPaymentDialog(true)
  }
  const handlePaymentMethodSelect = (method: 'crypto') => {
    setPaymentMethod(method)
  }
  const handleCryptoPaymentSuccess = () => {
    setShowPaymentDialog(false)
    setSelectedPlan(null)
    setPaymentMethod(null)
    onSubscribe?.()
  }
     const filteredPlans = showOnlyUpgrades && currentPlan 
     ? plans.filter(plan => {
         const planPriority = { free: 0, starter: 1, pro: 2, enterprise: 3 }
         const currentPriority = planPriority[currentPlan as keyof typeof planPriority] || 0
         const planLevel = planPriority[plan.id as keyof typeof planPriority] || 0
         return planLevel > currentPriority
       })
     : plans
  if (compact) {
    return (
             <Box sx={{ p: 2 }}>
         <Typography variant="h6" gutterBottom align="center">
           {t('subscription.upgradeToUnlock')}
         </Typography>
                 <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
           {filteredPlans.filter(plan => plan.id !== 'free').slice(0, 2).map((plan) => (
            <Card 
              key={plan.id} 
              sx={{ 
                minWidth: 200, 
                cursor: 'pointer',
                '&:hover': { transform: 'scale(1.02)' },
                transition: 'transform 0.2s ease'
              }}
              onClick={() => handleSelectPlan(plan)}
            >
              <CardContent sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h6" color="primary">
                  {plan.displayName}
                </Typography>
                                 <Typography variant="h5" fontWeight="bold">
                   ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                   <Typography component="span" variant="body2" color="text.secondary">
                     /{isYearly ? t('subscription.yearly').toLowerCase() : t('subscription.monthly').toLowerCase()}
                   </Typography>
                 </Typography>
                 <Button variant="contained" size="small" sx={{ mt: 1 }}>
                   {t('subscription.chooseThisPlan')}
                 </Button>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    )
  }
  return (
    <Box sx={{ py: 4 }}>
      {}
             <Box sx={{ textAlign: 'center', mb: 4 }}>
         <Typography variant="h4" gutterBottom fontWeight="bold">
           {showOnlyUpgrades ? t('subscription.upgradeYourPlan') : t('subscription.choosePlan')}
         </Typography>
         <Typography variant="body1" color="text.secondary" mb={3}>
           {showOnlyUpgrades 
             ? t('subscription.upgradeDesc')
             : t('subscription.choosePlanDesc')
           }
         </Typography>
                 <Paper sx={{ display: 'inline-flex', p: 1, alignItems: 'center', gap: 2, bgcolor: 'grey.50' }}>
           <Typography variant="body2" color={!isYearly ? 'primary' : 'text.secondary'}>
             {t('subscription.monthly')}
           </Typography>
           <FormControlLabel
             control={
               <Switch
                 checked={isYearly}
                 onChange={(e) => setIsYearly(e.target.checked)}
                 color="primary"
               />
             }
             label=""
             sx={{ m: 0 }}
           />
           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
             <Typography variant="body2" color={isYearly ? 'primary' : 'text.secondary'}>
               {t('subscription.yearly')}
             </Typography>
             <Chip
               label={t('subscription.save2Months')}
               size="small"
               color="success"
               icon={<Savings />}
               sx={{ fontSize: '0.7rem', height: 20 }}
             />
           </Box>
         </Paper>
      </Box>
      {}
             <Box sx={{ 
         display: 'grid', 
         gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
         gap: 3,
         maxWidth: 1400,
         mx: 'auto',
         pt: 2
       }}>
        {filteredPlans.map((plan) => (
          <Fade in={true} key={plan.id} style={{ transitionDelay: plans.indexOf(plan) * 100 + 'ms' }}>
            <Card
              sx={{
                position: 'relative',
                height: '100%',
                border: plan.popular ? 2 : 1,
                borderColor: plan.popular ? 'primary.main' : 'divider',
                '&:hover': {
                  boxShadow: 8,
                  transform: 'translateY(-4px)'
                },
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onClick={() => handleSelectPlan(plan)}
            >
                             {plan.popular && (
                 <Chip
                   label={t('subscription.mostPopular')}
                   color="primary"
                   size="small"
                   sx={{
                     position: 'absolute',
                     top: -0,
                     left: '50%',
                     transform: 'translateX(-50%)',
                     zIndex: 1,
                     fontWeight: 'bold',
                     fontSize: '0.75rem',
                     boxShadow: 2
                   }}
                 />
               )}
              <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                {}
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                    {React.cloneElement(plan.icon as React.ReactElement, { 
                      sx: { fontSize: 40, color: `${plan.color}.main` } 
                    })}
                  </Box>
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    {plan.displayName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    {plan.description}
                  </Typography>
                  {}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h3" fontWeight="bold" color="primary">
                      ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                    </Typography>
                                       <Typography variant="body2" color="text.secondary">
                     /{isYearly ? t('subscription.yearly').toLowerCase() : t('subscription.monthly').toLowerCase()}
                   </Typography>
                   {isYearly && (
                     <Typography variant="caption" color="success.main" display="block">
                       {t('subscription.save')} ${(plan.monthlyPrice * 12) - plan.yearlyPrice}
                     </Typography>
                   )}
                  </Box>
                                     {}
                   <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 2 }}>
                     <Box sx={{ textAlign: 'center' }}>
                       <Typography variant="h6" color="primary">
                         {plan.limits.deployments}
                       </Typography>
                       <Typography variant="caption" color="text.secondary">
                         {t('subscription.deploymentsPerMonth')}
                       </Typography>
                     </Box>
                     <Box sx={{ textAlign: 'center' }}>
                       <Typography variant="h6" color="primary">
                         {plan.limits.platformFee}%
                       </Typography>
                       <Typography variant="caption" color="text.secondary">
                         {t('subscription.platformFees')}
                       </Typography>
                     </Box>
                   </Box>
                </Box>
                {}
                <List dense sx={{ flex: 1 }}>
                  {plan.features.map((feature, index) => (
                    <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <Check color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={feature}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
                {}
                                                                   <Button
                   variant={plan.popular ? 'contained' : 'outlined'}
                   color={plan.color === 'default' ? 'inherit' : plan.color}
                   size="large"
                   fullWidth
                   sx={{ mt: 2 }}
                   disabled={!isConnected || plan.id === 'free'}
                 >
                   {!isConnected 
                     ? t('subscription.connectWalletToSee')
                     : plan.id === 'free'
                       ? t('subscription.alwaysFree')
                     : currentPlan === plan.id 
                       ? t('subscription.currentPlan')
                       : t('subscription.chooseThisPlan')
                   }
                 </Button>
              </CardContent>
            </Card>
          </Fade>
        ))}
      </Box>
      {}
      <Dialog
        open={showPaymentDialog}
        onClose={() => setShowPaymentDialog(false)}
        maxWidth="sm"
        fullWidth
      >
                 <DialogTitle>
           <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <Typography variant="h6">
               {t('subscription.subscribeToTitle')} {selectedPlan?.displayName}
             </Typography>
             <IconButton onClick={() => setShowPaymentDialog(false)}>
               <Close />
             </IconButton>
           </Box>
         </DialogTitle>
        <DialogContent>
          {!paymentMethod ? (
                         <Box sx={{ py: 2 }}>
               <Alert severity="info" sx={{ mb: 3 }}>
                 {t('subscription.choosePaymentMethod')}
               </Alert>
               <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                 <Button
                   variant="outlined"
                   size="large"
                   startIcon={<Typography sx={{ fontSize: '1.5rem' }}>💵</Typography>}
                   onClick={() => handlePaymentMethodSelect('crypto')}
                   sx={{
                     p: 2,
                     justifyContent: 'flex-start',
                     textAlign: 'left'
                   }}
                 >
                   <Box>
                     <Typography variant="subtitle1" fontWeight="bold">
                       USDC Payment
                     </Typography>
                     <Typography variant="body2" color="text.secondary">
                       Pay with USD Coin - stable, fast & reliable
                     </Typography>
                   </Box>
                 </Button>
               </Box>
             </Box>
          ) : paymentMethod === 'crypto' && selectedPlan ? (
            <CryptoPayment
              planId={selectedPlan.id}
              planName={selectedPlan.displayName}
              monthlyPrice={selectedPlan.monthlyPrice}
              yearlyPrice={selectedPlan.yearlyPrice}
              isYearly={isYearly}
              onSuccess={handleCryptoPaymentSuccess}
              onCancel={() => {
                setPaymentMethod(null)
                setShowPaymentDialog(false)
              }}
            />
                     ) : null}
        </DialogContent>
      </Dialog>
    </Box>
  )
}
export default SubscriptionPlans