import express from 'express'
import subscriptionService from '../services/subscription'
const router = express.Router()

router.get('/plans', async (req, res) => {
  try {
    const plans = await subscriptionService.getPlans()
    res.json(plans)
  } catch (error) {
    console.error('Error fetching plans:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch plans'
    })
  }
})

router.get('/plans/:id', async (req, res) => {
  try {
    const { id } = req.params
    const plan = await subscriptionService.getPlan(id)
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plan not found'
      })
    }
    res.json(plan)
  } catch (error) {
    console.error('Error fetching plan:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch plan'
    })
  }
})

router.get('/user/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params
    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address'
      })
    }
    const subscription = await subscriptionService.getUserSubscription(walletAddress)
    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'No active subscription found'
      })
    }
    res.json(subscription)
  } catch (error) {
    console.error('Error fetching user subscription:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user subscription'
    })
  }
})

router.get('/user/:walletAddress/all', async (req, res) => {
  try {
    const { walletAddress } = req.params
    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address'
      })
    }
    const subscriptions = await subscriptionService.getUserSubscriptions(walletAddress)
    res.json(subscriptions)
  } catch (error) {
    console.error('Error fetching user subscriptions:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user subscriptions'
    })
  }
})

router.post('/checkout', async (req, res) => {
  try {
    const { walletAddress, planId, amount, currency = 'USD', paymentMethod } = req.body
    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address'
      })
    }
    if (!planId || !amount || paymentMethod !== 'crypto') {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters or invalid payment method'
      })
    }
    const session = await subscriptionService.createCryptoCheckoutSession(
      walletAddress,
      planId,
      amount,
      currency
    )
    res.json({
      success: true,
      data: session
    })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create checkout session'
    })
  }
})

router.post('/checkout/:sessionId/complete', async (req, res) => {
  try {
    const { sessionId } = req.params
    await subscriptionService.completeCheckoutSession(sessionId)
    res.json({
      success: true,
      message: 'Checkout session completed successfully'
    })
  } catch (error) {
    console.error('Error completing checkout session:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to complete checkout session'
    })
  }
})

router.post('/:subscriptionId/cancel', async (req, res) => {
  try {
    const { subscriptionId } = req.params
    await subscriptionService.cancelSubscription(subscriptionId)
    res.json({
      success: true,
      message: 'Subscription cancelled successfully'
    })
  } catch (error) {
    console.error('Error cancelling subscription:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to cancel subscription'
    })
  }
})

router.post('/:subscriptionId/reactivate', async (req, res) => {
  try {
    const { subscriptionId } = req.params
    await subscriptionService.reactivateSubscription(subscriptionId)
    res.json({
      success: true,
      message: 'Subscription reactivated successfully'
    })
  } catch (error) {
    console.error('Error reactivating subscription:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to reactivate subscription'
    })
  }
})

router.get('/access/:walletAddress/:feature', async (req, res) => {
  try {
    const { walletAddress, feature } = req.params
    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address'
      })
    }
    const hasAccess = await subscriptionService.checkFeatureAccess(walletAddress, feature)
    res.json({
      success: true,
      data: {
        hasAccess,
        feature
      }
    })
  } catch (error) {
    console.error('Error checking user access:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to check user access'
    })
  }
})

router.get('/platform-fees', async (req, res) => {
  try {
    const feeRates = await subscriptionService.getPlatformFeeRates()
    res.json({
      success: true,
      data: feeRates
    })
  } catch (error) {
    console.error('Error getting platform fee rates:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get platform fee rates'
    })
  }
})

router.get('/deployment-permission/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params
    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address'
      })
    }
    const permission = await subscriptionService.checkDeploymentPermission(walletAddress)
    res.json({
      success: true,
      data: permission
    })
  } catch (error) {
    console.error('Error checking deployment permissions:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to check deployment permissions'
    })
  }
})

router.post('/usage', async (req, res) => {
  try {
    const { walletAddress, usageType, details } = req.body
    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address'
      })
    }
    if (!usageType) {
      return res.status(400).json({
        success: false,
        error: 'Usage type is required'
      })
    }
    await subscriptionService.trackUsage(walletAddress, usageType, details || {})
    res.json({
      success: true,
      message: 'Usage tracked successfully'
    })
  } catch (error) {
    console.error('Error tracking usage:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to track usage'
    })
  }
})

router.get('/usage/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params
    const { startDate, endDate } = req.query
    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address'
      })
    }
    let start: Date | undefined
    let end: Date | undefined
    if (startDate) {
      start = new Date(startDate as string)
    }
    if (endDate) {
      end = new Date(endDate as string)
    }
    const usage = await subscriptionService.getUserUsage(walletAddress, start, end)
    res.json({
      success: true,
      data: usage
    })
  } catch (error) {
    console.error('Error fetching user usage:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user usage'
    })
  }
})
export default router