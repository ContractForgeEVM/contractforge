import { supabase } from '../config/supabase'
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
class SubscriptionService {
  async getOrCreateUser(walletAddress: string): Promise<AnonymousUser> {
    const { data, error } = await supabase
      .rpc('get_or_create_user', { wallet_address_param: walletAddress })
      .single()
    if (error) {
      throw new Error(`Erreur lors de la création/récupération de l'utilisateur: ${error.message}`)
    }
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data)
      .single()
    if (userError) {
      throw new Error(`Erreur lors de la récupération de l'utilisateur: ${userError.message}`)
    }
    return user
  }
  async getPlans(): Promise<SubscriptionPlan[]> {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('price_monthly', { ascending: true })
    if (error) {
      throw new Error(`Erreur lors de la récupération des plans: ${error.message}`)
    }
    return data || []
  }
  async getPlan(planId: string): Promise<SubscriptionPlan | null> {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single()
    if (error) {
      throw new Error(`Erreur lors de la récupération du plan: ${error.message}`)
    }
    return data
  }
  async getUserSubscription(walletAddress: string): Promise<UserSubscription | null> {
    const user = await this.getOrCreateUser(walletAddress)
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'past_due'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Erreur lors de la récupération de l'abonnement: ${error.message}`)
    }
    return data
  }
  async getUserSubscriptions(walletAddress: string): Promise<UserSubscription[]> {
    const user = await this.getOrCreateUser(walletAddress)
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (error) {
      throw new Error(`Erreur lors de la récupération des abonnements: ${error.message}`)
    }
    return data || []
  }
  async createCryptoCheckoutSession(
    walletAddress: string,
    planId: string,
    amount: number,
    currency: string = 'USD'
  ): Promise<CheckoutSession> {
    const user = await this.getOrCreateUser(walletAddress)
    const { data, error } = await supabase
      .from('checkout_sessions')
      .insert({
        user_id: user.id,
        plan_id: planId,
        amount,
        currency,
        status: 'pending',
        payment_method: 'crypto',
      })
      .select()
      .single()
    if (error) {
      throw new Error(`Erreur lors de la création de la session: ${error.message}`)
    }
    return data
  }
  async completeCheckoutSession(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('checkout_sessions')
      .update({ status: 'completed' })
      .eq('id', sessionId)
    if (error) {
      throw new Error(`Erreur lors de la mise à jour de la session: ${error.message}`)
    }
  }
  async createSubscription(
    walletAddress: string,
    planId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<UserSubscription> {
    const user = await this.getOrCreateUser(walletAddress)
    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        plan_id: planId,
        status: 'active',
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false,
        payment_method: 'crypto',
      })
      .select()
      .single()
    if (error) {
      throw new Error(`Erreur lors de la création de l'abonnement: ${error.message}`)
    }
    return data
  }
  async cancelSubscription(subscriptionId: string): Promise<void> {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId)
    if (error) {
      throw new Error(`Erreur lors de l'annulation de l'abonnement: ${error.message}`)
    }
  }
  async reactivateSubscription(subscriptionId: string): Promise<void> {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId)
    if (error) {
      throw new Error(`Erreur lors de la réactivation de l'abonnement: ${error.message}`)
    }
  }
  async checkFeatureAccess(walletAddress: string, feature: string): Promise<boolean> {
    const subscription = await this.getUserSubscription(walletAddress)
    if (!subscription) {
      return false
    }
    const plan = await this.getPlan(subscription.plan_id)
    if (!plan) {
      return false
    }
    switch (feature) {
      case 'analytics':
        return plan.analytics_access
      case 'custom_templates':
        return plan.custom_templates
      case 'priority_support':
        return plan.priority_support
      default:
        return false
    }
  }
  async getPlatformFeeRates(): Promise<{
    deployment_fee_percent: number
    crypto_payment_fee_percent: number
  }> {
    const { data, error } = await supabase
      .from('platform_settings')
      .select('deployment_fee_percent, crypto_payment_fee_percent')
      .single()
    if (error) {
      return {
        deployment_fee_percent: 0.5,
        crypto_payment_fee_percent: 0.1,
      }
    }
    return data
  }
  async checkDeploymentPermission(walletAddress: string): Promise<{
    allowed: boolean
    reason?: string
    remaining_deployments?: number
  }> {
    const subscription = await this.getUserSubscription(walletAddress)
    if (!subscription) {
      return {
        allowed: false,
        reason: 'Aucun abonnement actif',
      }
    }
    const plan = await this.getPlan(subscription.plan_id)
    if (!plan) {
      return {
        allowed: false,
        reason: 'Plan d\'abonnement invalide',
      }
    }
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    const user = await this.getOrCreateUser(walletAddress)
    const { count, error } = await supabase
      .from('usage_tracking')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('usage_type', 'deployment')
      .gte('created_at', startOfMonth.toISOString())
    if (error) {
      throw new Error(`Erreur lors du comptage des déploiements: ${error.message}`)
    }
    const usedDeployments = count || 0
    const remainingDeployments = plan.max_deployments_per_month - usedDeployments
    return {
      allowed: remainingDeployments > 0,
      reason: remainingDeployments <= 0 ? 'Limite de déploiements mensuels atteinte' : undefined,
      remaining_deployments: remainingDeployments,
    }
  }
  async trackUsage(walletAddress: string, usageType: string, details?: any): Promise<void> {
    const user = await this.getOrCreateUser(walletAddress)
    const { error } = await supabase
      .from('usage_tracking')
      .insert({
        user_id: user.id,
        usage_type: usageType,
        details: details || {},
      })
    if (error) {
      console.error(`Erreur lors du suivi de l'utilisation: ${error.message}`)
    }
  }
  async getUserUsage(walletAddress: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    const user = await this.getOrCreateUser(walletAddress)
    let query = supabase
      .from('usage_tracking')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (startDate) {
      query = query.gte('created_at', startDate.toISOString())
    }
    if (endDate) {
      query = query.lte('created_at', endDate.toISOString())
    }
    const { data, error } = await query
    if (error) {
      throw new Error(`Erreur lors de la récupération de l'utilisation: ${error.message}`)
    }
    return data || []
  }
}
export default new SubscriptionService()