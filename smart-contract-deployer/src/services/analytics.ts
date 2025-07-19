import { config } from '../config'
import { supabaseAnalytics, isSupabaseEnabled } from '../config/supabase'
const getChainId = (chain: string): number => {
  const chainMap: Record<string, number> = {
    'ethereum': 1,
    'polygon': 137,
    'arbitrum': 42161,
    'optimism': 10,
    'bsc': 56,
    'avalanche': 43114,
    'base': 8453,
    'fantom': 250,
    'moonbeam': 1284,
    'gnosis': 100,
    'celo': 42220,
    'harmony': 1666600000,
    'zkSync': 324,
    'scroll': 534352,
    'linea': 59144,
    'sepolia': 11155111,
    'mumbai': 80001,
    'monad': 10143,
    'hyperevm': 999,
  }
  const numericChain = parseInt(chain)
  if (!isNaN(numericChain)) {
    return numericChain
  }
  const chainKey = Object.keys(chainMap).find(key =>
    key.toLowerCase() === chain.toLowerCase()
  )
  return chainKey ? chainMap[chainKey] : 1
}
interface DeploymentData {
  template: string
  chain: string
  success: boolean
  value?: string
  address?: string
  userId?: string
  timestamp: string
  gasUsed?: string
  transactionHash?: string
}
interface PremiumFeatureData {
  feature: string
  template: string
  revenue?: string
  userId?: string
  timestamp: string
}
interface AnalyticsConfig {
  apiUrl?: string
  apiKey?: string
  enabled: boolean
  batchSize: number
  flushInterval: number
}
class AnalyticsService {
  private config: AnalyticsConfig
  private queue: any[] = []
  private flushTimer: NodeJS.Timeout | null = null
  private userId: string | null = null
  private sessionId: string
  private sessionStartTime: number
  constructor() {
    this.config = {
      apiUrl: config.apiUrl,
      apiKey: config.apiKey,
      enabled: true,
      batchSize: 10,
      flushInterval: 30000
    }
    this.sessionId = this.generateSessionId()
    this.sessionStartTime = Date.now()
    this.userId = this.initializeUserId()
    this.trackPageView(window.location.pathname)
    this.setupAutoFlush()
    this.setupVisibilityTracking()
    this.setupUnloadTracking()
  }
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  private initializeUserId(): string {
    let userId = localStorage.getItem('analytics_user_id')
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('analytics_user_id', userId)
    }
    return userId
  }
  private setupAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }
    this.flushTimer = setInterval(() => {
      this.flush()
    }, this.config.flushInterval)
  }
  private setupVisibilityTracking(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.flush()
      } else {
        this.trackPageView(window.location.pathname)
      }
    })
  }
  private setupUnloadTracking(): void {
    window.addEventListener('beforeunload', () => {
      this.trackSessionEnd()
      this.flush(true)
    })
  }
  private async sendToBackend(data: any): Promise<void> {
    if (!this.config.apiUrl || !this.config.enabled) {
      return
    }
    try {
      const response = await fetch(`${this.config.apiUrl}/api/analytics/${data.type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify(data.payload)
      })
      if (!response.ok) {
        console.warn('Analytics API error:', response.statusText)
      }
    } catch (error) {
      console.warn('Analytics network error:', error)
    }
  }
  private addToQueue(type: string, payload: any): void {
    this.queue.push({
      type,
      payload: {
        ...payload,
        userId: this.userId,
        sessionId: this.sessionId,
        timestamp: new Date().toISOString()
      }
    })
    if (this.queue.length >= this.config.batchSize) {
      this.flush()
    }
  }
  private async flush(immediate: boolean = false): Promise<void> {
    if (this.queue.length === 0) return
    const events = [...this.queue]
    this.queue = []
    this.sendToGoogleAnalytics(events)
    this.sendToMixpanel(events)
    for (const event of events) {
      if (immediate) {
        if (navigator.sendBeacon && this.config.apiUrl) {
          const data = JSON.stringify(event.payload)
          navigator.sendBeacon(
            `${this.config.apiUrl}/api/analytics/${event.type}`,
            data
          )
        }
      } else {
        this.sendToBackend(event)
      }
    }
  }
  private sendToGoogleAnalytics(events: any[]): void {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      events.forEach(event => {
        switch (event.type) {
          case 'pageview':
            (window as any).gtag('config', config.googleAnalyticsId, {
              page_path: event.payload.page,
              page_title: document.title,
              user_id: this.userId
            })
            break
          case 'deployment':
            (window as any).gtag('event', 'contract_deployed', {
              event_category: 'conversion',
              event_label: event.payload.success ? 'success' : 'failed',
              template: event.payload.template,
              chain: event.payload.chain,
              value: event.payload.value,
              user_id: this.userId
            })
            break
          case 'premium':
            (window as any).gtag('event', 'premium_feature_used', {
              event_category: 'monetization',
              event_label: event.payload.feature,
              template: event.payload.template,
              user_id: this.userId
            })
            break
        }
      })
    }
  }
  private sendToMixpanel(events: any[]): void {
    if (typeof window !== 'undefined' && (window as any).mixpanel) {
      events.forEach(event => {
        switch (event.type) {
          case 'pageview':
            (window as any).mixpanel.track('Page View', {
              page: event.payload.page,
              user_id: this.userId,
              session_id: this.sessionId
            })
            break
          case 'deployment':
            (window as any).mixpanel.track('Contract Deployed', {
              template: event.payload.template,
              chain: event.payload.chain,
              success: event.payload.success,
              value: event.payload.value,
              user_id: this.userId,
              session_id: this.sessionId
            })
            break
          case 'premium':
            (window as any).mixpanel.track('Premium Feature Used', {
              feature: event.payload.feature,
              template: event.payload.template,
              user_id: this.userId,
              session_id: this.sessionId
            })
            break
        }
      })
    }
  }
  private async trackWithSupabase(eventType: string, data: any, retryCount: number = 0): Promise<void> {
    if (!isSupabaseEnabled) {
      return
    }
    try {
      switch (eventType) {
        case 'pageview':
          await supabaseAnalytics.trackPageView({
            user_id: this.userId || 'anonymous',
            session_id: this.sessionId,
            page: data.page,
            referrer: data.referrer,
            user_agent: data.userAgent,
            timestamp: new Date().toISOString()
          })
          break
        case 'deployment':
          await supabaseAnalytics.trackDeployment({
            user_id: data.userId || this.userId || 'anonymous',
            session_id: this.sessionId,
            template: data.template,
            chain: data.chain,
            success: data.success,
            contract_address: data.address,
            transaction_hash: data.transactionHash,
            value: data.value,
            gas_used: data.gasUsed,
            timestamp: new Date().toISOString()
          })
          break
        case 'premium':
          await supabaseAnalytics.trackPremiumFeature({
            user_id: this.userId || 'anonymous',
            session_id: this.sessionId,
            feature: data.feature,
            template: data.template,
            timestamp: new Date().toISOString()
          })
          break
      }
    } catch (error) {
      console.warn(`Failed to track with Supabase (attempt ${retryCount + 1}):`, error)
      
      // Retry up to 2 times for deployment events (important)
      if (eventType === 'deployment' && retryCount < 2) {
        console.log(`Retrying Supabase tracking for deployment in ${(retryCount + 1) * 1000}ms...`)
        setTimeout(() => {
          this.trackWithSupabase(eventType, data, retryCount + 1)
        }, (retryCount + 1) * 1000)
      }
    }
  }
  public trackPageView(page: string, additionalData?: Record<string, any>): void {
    const data = {
      page,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      ...additionalData
    }
    this.trackWithSupabase('pageview', data)
    this.addToQueue('pageview', data)
    this.updateRealTimeAnalytics('pageView', { page })
  }
  public trackDeployment(data: Omit<DeploymentData, 'userId' | 'timestamp'>, walletAddress?: string): void {
    // Use wallet address if provided, otherwise fall back to generated userId
    const effectiveUserId = walletAddress || this.userId
    const deploymentData = { ...data, userId: effectiveUserId }
    
    console.log('🔍 Tracking deployment:', {
      template: data.template,
      chain: data.chain,
      success: data.success,
      address: data.address,
      walletAddress,
      effectiveUserId,
      transactionHash: data.transactionHash
    })
    
    this.trackWithSupabase('deployment', deploymentData)
    this.addToQueue('deployment', deploymentData)
    this.updateRealTimeAnalytics('deployment', data)
    if (typeof window !== 'undefined') {
      import('../components/Analytics').then(({ trackContractDeployment }) => {
        trackContractDeployment(data.template, getChainId(data.chain), data.success)
      }).catch(console.error)
    }
  }
  public trackPremiumFeature(data: Omit<PremiumFeatureData, 'userId' | 'timestamp'>): void {
    this.trackWithSupabase('premium', data)
    this.addToQueue('premium', data)
    this.updateRealTimeAnalytics('premium', data)
    if (typeof window !== 'undefined') {
      import('../components/Analytics').then(({ trackPremiumFeature }) => {
        trackPremiumFeature(data.feature, data.template)
      }).catch(console.error)
    }
  }
  public trackTemplateSelection(template: string): void {
    this.addToQueue('template_selection', { template })
    if (typeof window !== 'undefined') {
      import('../components/Analytics').then(({ trackTemplateSelection }) => {
        trackTemplateSelection(template)
      }).catch(console.error)
    }
  }
  public trackWalletConnection(walletType: string): void {
    this.addToQueue('wallet_connection', { walletType })
    if (typeof window !== 'undefined') {
      import('../components/Analytics').then(({ trackWalletConnection }) => {
        trackWalletConnection(walletType)
      }).catch(console.error)
    }
  }
  public trackError(error: string, context?: Record<string, any>): void {
    this.addToQueue('error', {
      error,
      context,
      page: window.location.pathname
    })
  }
  public trackSessionEnd(): void {
    const sessionDuration = Date.now() - this.sessionStartTime
    this.addToQueue('session_end', {
      duration: sessionDuration,
      pages_viewed: this.getSessionPageViews()
    })
  }
  private getSessionPageViews(): number {
    return this.queue.filter(event => event.type === 'pageview').length
  }
  public async getDashboardData(): Promise<any> {
    if (isSupabaseEnabled) {
      try {
        const supabaseData = await supabaseAnalytics.getDashboardData()
        console.log('Using Supabase data for analytics')
        return supabaseData
      } catch (error) {
        console.warn('Supabase unavailable, using localStorage data:', error)
      }
    }
    const storedData = this.getStoredAnalyticsData()
    const deployments = storedData.deployments || 0
    const pageViews = storedData.pageViews || 0
    const conversionRate = pageViews > 0 ? (deployments / pageViews) * 100 : 0
    const successfulDeployments = storedData.successfulDeployments || 0
    const successRate = deployments > 0 ? (successfulDeployments / deployments) * 100 : 0
    const todayViews = storedData.todayViews || 0
    const weekViews = storedData.weekViews || 0
    const monthViews = storedData.monthViews || 0
    const viewsTrend = weekViews > 0 ? ((todayViews - (weekViews / 7)) / (weekViews / 7)) * 100 : 0
    const todayDeployments = storedData.todayDeployments || 0
    const weekDeployments = storedData.weekDeployments || 0
    const deploymentsTrend = weekDeployments > 0 ? ((todayDeployments - (weekDeployments / 7)) / (weekDeployments / 7)) * 100 : 0
    const uniqueUsers = storedData.uniqueUsers || 0
    const returningUsers = storedData.returningUsers || 0
    const newUsers = uniqueUsers - returningUsers
    return {
      pageViews: {
        total: pageViews,
        today: todayViews,
        week: weekViews,
        month: monthViews,
        trend: viewsTrend
      },
      deployments: {
        total: deployments,
        today: todayDeployments,
        week: weekDeployments,
        month: storedData.monthDeployments || 0,
        trend: deploymentsTrend,
        successRate: successRate,
        successful: successfulDeployments,
        failed: storedData.failedDeployments || 0
      },
      revenue: {
        total: storedData.totalRevenue || 0,
        today: storedData.todayRevenue || 0,
        week: storedData.weekRevenue || 0,
        month: storedData.monthRevenue || 0,
        trend: 0,
        avgPerDeployment: deployments > 0 ? (storedData.totalRevenue || 0) / deployments : 0
      },
      conversionRate: {
        rate: conversionRate,
        trend: 0
      },
      templates: storedData.templates || [],
      chains: storedData.chains || [],
      recentDeployments: storedData.recentDeployments || [],
      users: {
        unique: uniqueUsers,
        returning: returningUsers,
        newUsers: newUsers,
        conversionRate: conversionRate
      },
      premiumFeatures: storedData.premiumFeatures || [],
      performance: {
        avgLoadTime: storedData.avgLoadTime || 0,
        bounceRate: storedData.bounceRate || 0,
        avgSessionDuration: storedData.avgSessionDuration || 0
      },
      lastUpdated: new Date().toISOString()
    }
  }
  private getStoredAnalyticsData(): any {
    try {
      const stored = localStorage.getItem('analytics_data')
      return stored ? JSON.parse(stored) : {}
    } catch (error) {
      console.warn('Failed to parse stored analytics data:', error)
      return {}
    }
  }
  private getRecentDeployments(): any[] {
    const stored = localStorage.getItem('recent_deployments')
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch (error) {
        console.warn('Failed to parse recent deployments:', error)
      }
    }
    return []
  }
  public updateStoredAnalytics(data: any): void {
    try {
      const currentData = this.getStoredAnalyticsData()
      const updatedData = { ...currentData, ...data }
      localStorage.setItem('analytics_data', JSON.stringify(updatedData))
    } catch (error) {
      console.warn('Failed to update stored analytics:', error)
    }
  }
  private updateRealTimeAnalytics(event: string, data: any): void {
    try {
      const currentData = this.getStoredAnalyticsData()
      const today = new Date().toDateString()
      switch (event) {
        case 'pageView':
          currentData.pageViews = (currentData.pageViews || 0) + 1
          currentData.todayViews = (currentData.todayViews || 0) + 1
          currentData.weekViews = (currentData.weekViews || 0) + 1
          currentData.monthViews = (currentData.monthViews || 0) + 1
          const uniqueUsers = JSON.parse(localStorage.getItem('unique_users') || '[]')
          if (!uniqueUsers.includes(this.userId)) {
            uniqueUsers.push(this.userId)
            localStorage.setItem('unique_users', JSON.stringify(uniqueUsers))
            currentData.uniqueUsers = uniqueUsers.length
          }
          const dailyViews = JSON.parse(localStorage.getItem('daily_views') || '{}')
          dailyViews[today] = (dailyViews[today] || 0) + 1
          localStorage.setItem('daily_views', JSON.stringify(dailyViews))
          break
        case 'deployment':
          currentData.deployments = (currentData.deployments || 0) + 1
          currentData.todayDeployments = (currentData.todayDeployments || 0) + 1
          currentData.weekDeployments = (currentData.weekDeployments || 0) + 1
          currentData.monthDeployments = (currentData.monthDeployments || 0) + 1
          if (data.success) {
            currentData.successfulDeployments = (currentData.successfulDeployments || 0) + 1
          } else {
            currentData.failedDeployments = (currentData.failedDeployments || 0) + 1
          }
          const templates = currentData.templates || []
          const templateIndex = templates.findIndex((t: any) => t.name === data.template)
          if (templateIndex >= 0) {
            templates[templateIndex].count += 1
          } else {
            templates.push({ name: data.template, count: 1, percentage: 0 })
          }
          const totalTemplates = templates.reduce((sum: number, t: any) => sum + t.count, 0)
          templates.forEach((t: any) => {
            t.percentage = (t.count / totalTemplates) * 100
          })
          currentData.templates = templates
          const chains = currentData.chains || []
          const chainIndex = chains.findIndex((c: any) => c.name === data.chain)
          if (chainIndex >= 0) {
            chains[chainIndex].deployments += 1
          } else {
            chains.push({ name: data.chain, deployments: 1, percentage: 0, totalValue: '0 ETH' })
          }
          const totalChains = chains.reduce((sum: number, c: any) => sum + c.deployments, 0)
          chains.forEach((c: any) => {
            c.percentage = (c.deployments / totalChains) * 100
          })
          currentData.chains = chains
          const recentDeployments = currentData.recentDeployments || []
          recentDeployments.unshift({
            id: Date.now().toString(),
            template: data.template,
            chain: data.chain,
            address: data.address?.substring(0, 6) + '...' + data.address?.substring(data.address.length - 3) || 'N/A',
            timestamp: 'Just now',
            success: data.success,
            value: data.value || '0 ETH'
          })
          currentData.recentDeployments = recentDeployments.slice(0, 10)
          break
        case 'premium':
          const premiumFeatures = currentData.premiumFeatures || []
          const featureIndex = premiumFeatures.findIndex((f: any) => f.feature === data.feature)
          if (featureIndex >= 0) {
            premiumFeatures[featureIndex].usage += 1
          } else {
            premiumFeatures.push({ feature: data.feature, usage: 1, revenue: '0 ETH' })
          }
          currentData.premiumFeatures = premiumFeatures
          break
      }
      this.updateStoredAnalytics(currentData)
    } catch (error) {
      console.warn('Failed to update real-time analytics:', error)
    }
  }
  public setUserId(userId: string): void {
    this.userId = userId
    localStorage.setItem('analytics_user_id', userId)
  }
  public getUserId(): string | null {
    return this.userId
  }
  public getSessionId(): string {
    return this.sessionId
  }
  public forceFlush(): Promise<void> {
    return this.flush()
  }
  public generateSampleData(): void {
    console.log('Generating sample analytics data...')
    for (let i = 0; i < 10; i++) {
      this.trackPageView('/', { source: 'sample_data' })
    }
    const templates = ['ERC20 Token', 'NFT Collection', 'Token Lock', 'DAO', 'Multisig Wallet']
    const chains = ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism', 'BSC']
    for (let i = 0; i < 5; i++) {
      const template = templates[Math.floor(Math.random() * templates.length)]
      const chain = chains[Math.floor(Math.random() * chains.length)]
      const success = Math.random() > 0.2
      this.trackDeployment({
        template,
        chain,
        success,
        address: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 5)}`,
        value: `${(Math.random() * 0.5).toFixed(3)} ETH`,
        gasUsed: (Math.floor(Math.random() * 200000) + 50000).toString()
      })
    }
    const premiumFeatures = ['Mintable', 'Pausable', 'Burnable', 'Voting Power']
    for (let i = 0; i < 3; i++) {
      const feature = premiumFeatures[Math.floor(Math.random() * premiumFeatures.length)]
      const template = templates[Math.floor(Math.random() * templates.length)]
      this.trackPremiumFeature({
        feature,
        template
      })
    }
    console.log('Sample data generated successfully!')
  }
  public clearAnalyticsData(): void {
    console.log('Clearing all analytics data...')
    localStorage.removeItem('analytics_data')
    localStorage.removeItem('recent_deployments')
    localStorage.removeItem('unique_users')
    localStorage.removeItem('daily_views')
    localStorage.removeItem('analytics_user_id')
    localStorage.removeItem('analytics_session_id')
    localStorage.removeItem('analytics_events')
    console.log('Analytics data cleared successfully!')
  }
  public destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }
    this.flush(true)
  }
}
export const analyticsService = new AnalyticsService()
export const trackPageView = (page: string, data?: Record<string, any>) =>
  analyticsService.trackPageView(page, data)
export const trackDeployment = (data: Omit<DeploymentData, 'userId' | 'timestamp'>, walletAddress?: string) =>
  analyticsService.trackDeployment(data, walletAddress)
export const trackPremiumFeature = (data: Omit<PremiumFeatureData, 'userId' | 'timestamp'>) =>
  analyticsService.trackPremiumFeature(data)
export const trackTemplateSelection = (template: string) =>
  analyticsService.trackTemplateSelection(template)
export const trackWalletConnection = (walletType: string) =>
  analyticsService.trackWalletConnection(walletType)
export const trackError = (error: string, context?: Record<string, any>) =>
  analyticsService.trackError(error, context)
export default analyticsService