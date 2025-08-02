import { createClient } from '@supabase/supabase-js'
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.includes('supabase.co') &&
  supabaseAnonKey.length > 50 &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  supabaseAnonKey !== 'your-anon-key-here'
)
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://your-project.supabase.co', 'your-anon-key-here')
export interface PageView {
  id?: string
  user_id: string
  session_id: string
  page: string
  referrer?: string
  user_agent?: string
  timestamp: string
  ip_address?: string
}
export interface Deployment {
  id?: string
  user_id: string
  session_id: string
  template: string
  chain: string
  success: boolean
  contract_address?: string
  transaction_hash?: string
  value?: string
  gas_used?: string
  timestamp: string
  error_message?: string
}
export interface PremiumFeature {
  id?: string
  user_id: string
  session_id: string
  feature: string
  template: string
  timestamp: string
}
export interface UserSession {
  id?: string
  user_id: string
  session_id: string
  start_time: string
  end_time?: string
  duration?: number
  pages_visited: number
  deployments_count: number
  premium_features_used: number
}
export const isSupabaseEnabled = isSupabaseConfigured
export class SupabaseAnalytics {
  private client = supabase
  async trackPageView(data: Omit<PageView, 'id'>): Promise<void> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured')
    }
    const { error } = await this.client
      .from('page_views')
      .insert(data)
    if (error) {
      console.error('Error tracking page view:', error)
      throw error
    }
  }
  async trackDeployment(data: Omit<Deployment, 'id'>): Promise<void> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured')
    }
    const { error } = await this.client
      .from('deployments')
      .insert(data)
    if (error) {
      console.error('Error tracking deployment:', error)
      throw error
    }
  }
  async trackPremiumFeature(data: Omit<PremiumFeature, 'id'>): Promise<void> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured')
    }
    const { error } = await this.client
      .from('premium_features')
      .insert(data)
    if (error) {
      console.error('Error tracking premium feature:', error)
      throw error
    }
  }
  async createSession(data: Omit<UserSession, 'id'>): Promise<void> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured')
    }
    const { error } = await this.client
      .from('user_sessions')
      .insert(data)
    if (error) {
      console.error('Error creating session:', error)
      throw error
    }
  }
  async updateSession(sessionId: string, data: Partial<UserSession>): Promise<void> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured')
    }
    const { error } = await this.client
      .from('user_sessions')
      .update(data)
      .eq('session_id', sessionId)
    if (error) {
      console.error('Error updating session:', error)
      throw error
    }
  }
  async getDashboardData(): Promise<any> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured')
    }
    try {
      const pageViewsQuery = await this.client
        .from('page_views')
        .select('*')
      const deploymentsQuery = await this.client
        .from('deployments')
        .select('*')
      const premiumFeaturesQuery = await this.client
        .from('premium_features')
        .select('*')
      const sessionsQuery = await this.client
        .from('user_sessions')
        .select('*')
      const [pageViewsResult, deploymentsResult, premiumFeaturesResult, sessionsResult] = await Promise.all([
        pageViewsQuery,
        deploymentsQuery,
        premiumFeaturesQuery,
        sessionsQuery
      ])
      if (pageViewsResult.error || deploymentsResult.error || premiumFeaturesResult.error || sessionsResult.error) {
        throw new Error('Failed to fetch analytics data')
      }
      const pageViews = pageViewsResult.data || []
      const deployments = deploymentsResult.data || []
      const premiumFeatures = premiumFeaturesResult.data || []
      const sessions = sessionsResult.data || []
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const pageViewsToday = pageViews.filter(pv => new Date(pv.timestamp) >= today).length
      const pageViewsWeek = pageViews.filter(pv => new Date(pv.timestamp) >= thisWeek).length
      const pageViewsMonth = pageViews.filter(pv => new Date(pv.timestamp) >= thisMonth).length
      const deploymentsToday = deployments.filter(d => new Date(d.timestamp) >= today).length
      const deploymentsWeek = deployments.filter(d => new Date(d.timestamp) >= thisWeek).length
      const deploymentsMonth = deployments.filter(d => new Date(d.timestamp) >= thisMonth).length
      const successfulDeployments = deployments.filter(d => d.success).length
      const failedDeployments = deployments.filter(d => !d.success).length
      const templateStats = deployments.reduce((acc, d) => {
        acc[d.template] = (acc[d.template] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      const templates = Object.entries(templateStats).map(([name, count]) => ({
        name,
        count: count as number,
        percentage: ((count as number) / deployments.length) * 100
      }))
      const chainStats = deployments.reduce((acc, d) => {
        acc[d.chain] = (acc[d.chain] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      const chains = Object.entries(chainStats).map(([name, deploymentCount]) => ({
        name,
        deployments: deploymentCount as number,
        percentage: ((deploymentCount as number) / deployments.length) * 100,
        totalValue: '0 ETH'
      }))
      const recentDeployments = deployments
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10)
        .map(d => ({
          id: d.id,
          template: d.template,
          chain: d.chain,
          address: d.contract_address || 'N/A',
          timestamp: new Date(d.timestamp).toLocaleString(),
          success: d.success,
          value: d.value || '0 ETH'
        }))
      const premiumFeatureStats = premiumFeatures.reduce((acc, pf) => {
        acc[pf.feature] = (acc[pf.feature] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      const premiumFeaturesList = Object.entries(premiumFeatureStats).map(([feature, usage]) => ({
        feature,
        usage,
        revenue: '0 ETH'
      }))
      const uniqueUsers = new Set(pageViews.map(pv => pv.user_id)).size
      const uniqueSessionsToday = new Set(
        pageViews.filter(pv => new Date(pv.timestamp) >= today).map(pv => pv.session_id)
      ).size
      const conversionRate = pageViews.length > 0 ? (deployments.length / pageViews.length) * 100 : 0
      const successRate = deployments.length > 0 ? (successfulDeployments / deployments.length) * 100 : 0
      return {
        pageViews: {
          total: pageViews.length,
          today: pageViewsToday,
          week: pageViewsWeek,
          month: pageViewsMonth,
          trend: 0
        },
        deployments: {
          total: deployments.length,
          today: deploymentsToday,
          week: deploymentsWeek,
          month: deploymentsMonth,
          successful: successfulDeployments,
          failed: failedDeployments,
          trend: 0,
          successRate: successRate
        },
        templates: templates,
        chains: chains,
        recentDeployments: recentDeployments,
        users: {
          unique: uniqueUsers,
          returning: 0,
          newUsers: uniqueUsers,
          conversionRate: conversionRate
        },
        premiumFeatures: premiumFeaturesList,
        performance: {
          avgLoadTime: 0,
          bounceRate: 0,
          avgSessionDuration: 0
        },
        lastUpdated: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      throw error
    }
  }
  async getRecentDeployments(limit = 10): Promise<any[]> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured')
    }
    const { data, error } = await this.client
      .from('deployments')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit)
    if (error) {
      console.error('Error fetching recent deployments:', error)
      throw error
    }
    return data || []
  }
  async exportData(): Promise<any> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured')
    }
    const [pageViews, deployments, premiumFeatures, sessions] = await Promise.all([
      this.client.from('page_views').select('*'),
      this.client.from('deployments').select('*'),
      this.client.from('premium_features').select('*'),
      this.client.from('user_sessions').select('*')
    ])
    return {
      pageViews: pageViews.data || [],
      deployments: deployments.data || [],
      premiumFeatures: premiumFeatures.data || [],
      sessions: sessions.data || []
    }
  }
}
export const supabaseAnalytics = new SupabaseAnalytics()