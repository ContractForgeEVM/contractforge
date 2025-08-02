export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price_monthly: number
  price_yearly: number
  features: string[]
  max_deployments_per_month: number
  max_contract_size_kb: number
  priority_support: boolean
  custom_templates: boolean
  analytics_access: boolean
}
export interface AnonymousUser {
  id: string
  wallet_address: string
  created_at: string
  last_activity: string
  is_active: boolean
}
export interface UserSubscription {
  id: string
  user_id: string
  plan_id: string
  status: 'active' | 'canceled' | 'past_due' | 'unpaid'
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  payment_method: 'crypto'
  created_at: string
  updated_at: string
}
export interface CheckoutSession {
  id: string
  user_id: string
  plan_id: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed'
  payment_method: 'crypto'
  created_at: string
}
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://contractforge.io'
class SubscriptionService {
  async getPlans(): Promise<SubscriptionPlan[]> {
    const response = await fetch(`${API_BASE_URL}/api/subscription/plans`)
    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération des plans: ${response.statusText}`)
    }
    return response.json()
  }
  async getPlan(planId: string): Promise<SubscriptionPlan | null> {
    const response = await fetch(`${API_BASE_URL}/api/subscription/plans/${planId}`)
    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération du plan: ${response.statusText}`)
    }
    return response.json()
  }
  async getUserSubscription(walletAddress: string): Promise<UserSubscription | null> {
    const response = await fetch(`${API_BASE_URL}/api/subscription/user/${walletAddress}`)
    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`Erreur lors de la récupération de l'abonnement: ${response.statusText}`)
    }
    return response.json()
  }
  async getUserSubscriptions(walletAddress: string): Promise<UserSubscription[]> {
    const response = await fetch(`${API_BASE_URL}/api/subscription/user/${walletAddress}/all`)
    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération des abonnements: ${response.statusText}`)
    }
    return response.json()
  }
  async createCryptoCheckoutSession(
    walletAddress: string,
    planId: string,
    amount: number,
    currency: string = 'USD'
  ): Promise<CheckoutSession> {
    const response = await fetch(`${API_BASE_URL}/api/subscription/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress,
        planId,
        amount,
        currency,
        paymentMethod: 'crypto',
      }),
    })
    if (!response.ok) {
      throw new Error(`Erreur lors de la création de la session: ${response.statusText}`)
    }
    return response.json()
  }
  async completeCheckoutSession(sessionId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/subscription/checkout/${sessionId}/complete`, {
      method: 'POST',
    })
    if (!response.ok) {
      throw new Error(`Erreur lors de la mise à jour de la session: ${response.statusText}`)
    }
  }
  async cancelSubscription(subscriptionId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/subscription/${subscriptionId}/cancel`, {
      method: 'POST',
    })
    if (!response.ok) {
      throw new Error(`Erreur lors de l'annulation de l'abonnement: ${response.statusText}`)
    }
  }
  async reactivateSubscription(subscriptionId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/subscription/${subscriptionId}/reactivate`, {
      method: 'POST',
    })
    if (!response.ok) {
      throw new Error(`Erreur lors de la réactivation de l'abonnement: ${response.statusText}`)
    }
  }
  async checkFeatureAccess(walletAddress: string, feature: string): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/api/subscription/access/${walletAddress}/${feature}`)
    if (!response.ok) {
      return false
    }
    const result = await response.json()
    return result.data.hasAccess
  }
  async getPlatformFeeRates(): Promise<{
    deployment_fee_percent: number
    crypto_payment_fee_percent: number
  }> {
    const response = await fetch(`${API_BASE_URL}/api/subscription/platform-fees`)
    if (!response.ok) {
      return {
        deployment_fee_percent: 0.5,
        crypto_payment_fee_percent: 0.1,
      }
    }
    return response.json()
  }
  async checkDeploymentPermission(walletAddress: string): Promise<{
    allowed: boolean
    reason?: string
    remaining_deployments?: number
  }> {
    const response = await fetch(`${API_BASE_URL}/api/subscription/deployment-permission/${walletAddress}`)
    if (!response.ok) {
      return {
        allowed: false,
        reason: 'Erreur lors de la vérification des permissions',
      }
    }
    return response.json()
  }
  async trackUsage(walletAddress: string, usageType: string, details?: any): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/subscription/usage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress,
        usageType,
        details: details || {},
      }),
    })
    if (!response.ok) {
      console.error(`Erreur lors du suivi de l'utilisation: ${response.statusText}`)
    }
  }
  async getUserUsage(walletAddress: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    let url = `${API_BASE_URL}/api/subscription/usage/${walletAddress}`
    const params = new URLSearchParams()
    if (startDate) {
      params.append('startDate', startDate.toISOString())
    }
    if (endDate) {
      params.append('endDate', endDate.toISOString())
    }
    if (params.toString()) {
      url += `?${params.toString()}`
    }
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération de l'utilisation: ${response.statusText}`)
    }
    return response.json()
  }
}
export default new SubscriptionService()