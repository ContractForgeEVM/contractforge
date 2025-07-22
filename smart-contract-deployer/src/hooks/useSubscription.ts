import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'

// 🎯 DEV LOCAL : Compte avec toutes les options
const DEV_PREMIUM_ADDRESS = '0xA3Cb5B568529b27e93AE726C7d8aEF18Cd551621'.toLowerCase()

interface SubscriptionPlan {
  id: string
  name: string
  display_name: string
  description: string
  price_monthly: number
  price_yearly: number
  features: Record<string, boolean>
  limits: Record<string, any>
}
interface UserSubscription {
  id: string
  plan_name: string
  plan_display_name: string
  status: string
  current_period_start: string
  current_period_end: string
  billing_cycle: 'monthly' | 'yearly'
  is_active: boolean
  features: Record<string, boolean>
  limits: Record<string, any>
}
interface UsageData {
  resourceType: string
  currentUsage: number
  limit: number
  period: string
}
interface UseSubscriptionReturn {
  plans: SubscriptionPlan[]
  plansLoading: boolean
  subscription: UserSubscription | null
  subscriptionLoading: boolean
  usage: UsageData[]
  usageLoading: boolean
  subscribe: (planId: string, billingCycle: 'monthly' | 'yearly') => Promise<string>
  cancelSubscription: () => Promise<void>
  reactivateSubscription: () => Promise<void>
  refreshSubscription: () => Promise<void>
  hasFeatureAccess: (feature: string) => boolean
  canUseResource: (resourceType: string, quantity?: number) => boolean
  error: string | null
}
export const useSubscription = (): UseSubscriptionReturn => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [plansLoading, setPlansLoading] = useState(false)
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(false)
  const [usage, setUsage] = useState<UsageData[]>([])
  const [usageLoading, setUsageLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { isConnected, address } = useAccount()
  const API_BASE = process.env.REACT_APP_API_URL || 'https://contractforge.io'
  const apiCall = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    const apiKey = localStorage.getItem('contractforge_api_key')
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
        ...options.headers,
      },
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP ${response.status}`)
    }
    return response.json()
  }, [API_BASE])
  const fetchPlans = useCallback(async () => {
    setPlansLoading(true)
    setError(null)
    try {
      const response = await apiCall('/subscription/plans')
      setPlans(response.data || [])
    } catch (err: any) {
      console.error('Error fetching plans:', err)
      setError('Failed to load subscription plans')
    } finally {
      setPlansLoading(false)
    }
  }, [apiCall])
  const fetchSubscription = useCallback(async () => {
    if (!isConnected) {
      setSubscription(null)
      return
    }
    setSubscriptionLoading(true)
    setError(null)
    try {
      const response = await apiCall('/subscription/subscription')
      setSubscription(response.data)
    } catch (err: any) {
      console.error('Error fetching subscription:', err)
      if (err.message.includes('404') || err.message.includes('not found')) {
        setSubscription(null) 
      } else {
        setError('Failed to load subscription details')
      }
    } finally {
      setSubscriptionLoading(false)
    }
  }, [apiCall, isConnected])
  const fetchUsage = useCallback(async () => {
    if (!isConnected || !subscription) {
      setUsage([])
      return
    }
    setUsageLoading(true)
    try {
      const resourceTypes = ['deployments', 'premium_features', 'api_calls', 'custom_domains']
      const usagePromises = resourceTypes.map(async (resourceType) => {
        try {
          const response = await apiCall(`/subscription/usage/${resourceType}`)
          return {
            resourceType,
            currentUsage: response.data.currentUsage,
            limit: subscription.limits[`${resourceType}_per_month`] || 0,
            period: 'monthly'
          }
        } catch (err) {
          console.error(`Error fetching ${resourceType} usage:`, err)
          return {
            resourceType,
            currentUsage: 0,
            limit: subscription.limits[`${resourceType}_per_month`] || 0,
            period: 'monthly'
          }
        }
      })
      const usageData = await Promise.all(usagePromises)
      setUsage(usageData)
    } catch (err) {
      console.error('Error fetching usage:', err)
    } finally {
      setUsageLoading(false)
    }
  }, [apiCall, isConnected, subscription])
  const subscribe = useCallback(async (planId: string, billingCycle: 'monthly' | 'yearly' = 'monthly'): Promise<string> => {
    if (!isConnected) {
      throw new Error('Please connect your wallet first')
    }
    setError(null)
    try {
      const response = await apiCall('/subscription/checkout', {
        method: 'POST',
        body: JSON.stringify({ planId, billingCycle })
      })
      return response.data.url
    } catch (err: any) {
      setError(err.message || 'Failed to create checkout session')
      throw err
    }
  }, [apiCall, isConnected])
  const cancelSubscription = useCallback(async () => {
    if (!subscription) {
      throw new Error('No active subscription to cancel')
    }
    setError(null)
    try {
      await apiCall('/subscription/cancel', {
        method: 'POST'
      })
      await fetchSubscription()
    } catch (err: any) {
      setError(err.message || 'Failed to cancel subscription')
      throw err
    }
  }, [apiCall, subscription, fetchSubscription])
  const reactivateSubscription = useCallback(async () => {
    if (!subscription) {
      throw new Error('No subscription to reactivate')
    }
    setError(null)
    try {
      await apiCall('/subscription/reactivate', {
        method: 'POST'
      })
      await fetchSubscription()
    } catch (err: any) {
      setError(err.message || 'Failed to reactivate subscription')
      throw err
    }
  }, [apiCall, subscription, fetchSubscription])
  const refreshSubscription = useCallback(async () => {
    await Promise.all([
      fetchSubscription(),
      fetchUsage()
    ])
  }, [fetchSubscription, fetchUsage])
  const hasFeatureAccess = useCallback((feature: string): boolean => {
    if (!isConnected) {
      const freeFeatures = ['basic_templates', 'testnet_deployment', 'community_support', 'random_subdomain']
      return freeFeatures.includes(feature)
    }

    // 🌟 COMPTE DEV PREMIUM : Accès à toutes les fonctionnalités
    if (address?.toLowerCase() === DEV_PREMIUM_ADDRESS) {
      console.log(`🎯 Dev account - Feature access granted: ${feature}`)
      return true // Accès complet à toutes les fonctionnalités
    }

    return subscription?.features?.[feature] === true
  }, [isConnected, subscription, address])
  const canUseResource = useCallback((resourceType: string, quantity: number = 1): boolean => {
    // 🌟 COMPTE DEV PREMIUM : Pas de limites de ressources
    if (address?.toLowerCase() === DEV_PREMIUM_ADDRESS) {
      console.log(`🎯 Dev account - Resource access unlimited: ${resourceType}`)
      return true // Pas de limites pour le compte dev
    }

    if (!subscription) {
      const freeLimits: Record<string, number> = {
        deployments: 5,
        premium_features: 0,
        api_calls: 100,
        custom_domains: 0
      }
      const currentUsage = usage.find(u => u.resourceType === resourceType)?.currentUsage || 0
      const limit = freeLimits[resourceType] || 0
      return currentUsage + quantity <= limit
    }
    const currentUsage = usage.find(u => u.resourceType === resourceType)?.currentUsage || 0
    const limit = subscription.limits[`${resourceType}_per_month`] || 0
    if (limit === 'unlimited' || limit === -1) {
      return true
    }
    return currentUsage + quantity <= limit
  }, [subscription, usage, address])
  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])
  useEffect(() => {
    if (isConnected) {
      fetchSubscription()
    }
  }, [isConnected, fetchSubscription])
  useEffect(() => {
    if (subscription) {
      fetchUsage()
    }
  }, [subscription, fetchUsage])
  return {
    plans,
    plansLoading,
    subscription,
    subscriptionLoading,
    usage,
    usageLoading,
    subscribe,
    cancelSubscription,
    reactivateSubscription,
    refreshSubscription,
    hasFeatureAccess,
    canUseResource,
    error
  }
}