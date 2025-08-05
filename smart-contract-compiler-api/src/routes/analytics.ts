import express from 'express'
import { authenticateApiKey } from '../middleware/auth'
import { apiKeyManager } from '../models/ApiKey'
const router = express.Router()
const analyticsData = {
  pageViews: {
    total: 15847,
    today: 234,
    thisWeek: 1876,
    thisMonth: 7432,
    history: [] as { date: string; views: number }[]
  },
  deployments: {
    total: 892,
    today: 8,
    thisWeek: 67,
    thisMonth: 234,
    successful: 856,
    failed: 36,
    totalValue: "45.67 ETH",
    history: [] as { date: string; count: number; success: boolean; value: string; template: string; chain: string }[]
  },
  templates: {
    'erc20': { name: "ERC20 Token", count: 423 },
    'nft': { name: "NFT Collection", count: 187 },
    'tokenlock': { name: "Token Lock", count: 145 },
    'dao': { name: "DAO", count: 89 },
    'other': { name: "Autres", count: 48 }
  },
  chains: {
    'ethereum': { name: "Ethereum", deployments: 312, totalValue: "23.45 ETH" },
    'polygon': { name: "Polygon", deployments: 198, totalValue: "8,432 MATIC" },
    'arbitrum': { name: "Arbitrum", deployments: 156, totalValue: "12.34 ETH" },
    'optimism': { name: "Optimism", deployments: 134, totalValue: "9.87 ETH" },
    'bsc': { name: "BSC", deployments: 92, totalValue: "4.56 BNB" }
  },
  users: {
    unique: 3421,
    returning: 1876,
    newUsers: 1545,
    sessions: [] as { timestamp: string; userId: string; duration: number }[]
  },
  premiumFeatures: {
    'mintable': { feature: "Mintable", usage: 187, revenue: "3.74 ETH" },
    'pausable': { feature: "Pausable", usage: 156, revenue: "3.12 ETH" },
    'burnable': { feature: "Burnable", usage: 134, revenue: "2.68 ETH" },
    'voting': { feature: "Voting Power", usage: 98, revenue: "1.96 ETH" }
  }
}
const calculateTrend = (current: number, previous: number): number => {
  if (previous === 0) return 0
  return ((current - previous) / previous) * 100
}
const getTimeRange = (range: 'today' | 'week' | 'month') => {
  const now = new Date()
  const start = new Date()
  switch (range) {
    case 'today':
      start.setHours(0, 0, 0, 0)
      break
    case 'week':
      start.setDate(now.getDate() - 7)
      break
    case 'month':
      start.setMonth(now.getMonth() - 1)
      break
  }
  return { start, end: now }
}
router.post('/pageview', async (req, res) => {
  try {
    const { page, userId, timestamp } = req.body
    analyticsData.pageViews.total++
    analyticsData.pageViews.today++
    analyticsData.pageViews.history.push({
      date: new Date().toISOString(),
      views: 1
    })
    if (analyticsData.pageViews.history.length > 1000) {
      analyticsData.pageViews.history = analyticsData.pageViews.history.slice(-1000)
    }
    res.json({
      success: true,
      message: 'Page view tracked'
    })
  } catch (error: any) {
    console.error('Analytics tracking error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to track page view',
      message: error.message
    })
  }
})
router.post('/deployment', async (req, res) => {
  try {
    const { template, chain, success, value, address, userId } = req.body
    analyticsData.deployments.total++
    analyticsData.deployments.today++
    if (success) {
      analyticsData.deployments.successful++
    } else {
      analyticsData.deployments.failed++
    }
    if (template && analyticsData.templates[template as keyof typeof analyticsData.templates]) {
      analyticsData.templates[template as keyof typeof analyticsData.templates].count++
    }
    if (chain && analyticsData.chains[chain as keyof typeof analyticsData.chains]) {
      analyticsData.chains[chain as keyof typeof analyticsData.chains].deployments++
    }
    analyticsData.deployments.history.push({
      date: new Date().toISOString(),
      count: 1,
      success,
      value: value || '0',
      template,
      chain
    })
    if (analyticsData.deployments.history.length > 1000) {
      analyticsData.deployments.history = analyticsData.deployments.history.slice(-1000)
    }
    res.json({
      success: true,
      message: 'Deployment tracked'
    })
  } catch (error: any) {
    console.error('Deployment tracking error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to track deployment',
      message: error.message
    })
  }
})
router.post('/premium', async (req, res) => {
  try {
    const { feature, template, revenue } = req.body
    if (feature && analyticsData.premiumFeatures[feature as keyof typeof analyticsData.premiumFeatures]) {
      analyticsData.premiumFeatures[feature as keyof typeof analyticsData.premiumFeatures].usage++
    }
    res.json({
      success: true,
      message: 'Premium feature usage tracked'
    })
  } catch (error: any) {
    console.error('Premium tracking error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to track premium feature',
      message: error.message
    })
  }
})
router.post('/template_selection', async (req, res) => {
  try {
    const { template, userId, timestamp } = req.body
    if (template && analyticsData.templates[template as keyof typeof analyticsData.templates]) {
      console.log(`Template selected: ${template} by user: ${userId}`)
    }
    res.json({
      success: true,
      message: 'Template selection tracked'
    })
  } catch (error: any) {
    console.error('Template selection tracking error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to track template selection',
      message: error.message
    })
  }
})
router.get('/dashboard', authenticateApiKey, async (req, res) => {
  try {
    const templatesArray = Object.values(analyticsData.templates).map(template => ({
      ...template,
      percentage: (template.count / analyticsData.deployments.total) * 100
    }))
    const chainsArray = Object.values(analyticsData.chains).map(chain => ({
      ...chain,
      percentage: (chain.deployments / analyticsData.deployments.total) * 100
    }))
    const recentDeployments = analyticsData.deployments.history
      .slice(-10)
      .reverse()
      .map((deployment, index) => ({
        id: `${index + 1}`,
        template: deployment.template,
        chain: deployment.chain,
        address: `0x${Math.random().toString(16).substr(2, 6)}...${Math.random().toString(16).substr(2, 3)}`,
        timestamp: new Date(deployment.date).toLocaleDateString(),
        success: deployment.success,
        value: deployment.value
      }))
    const conversionRate = analyticsData.pageViews.total > 0
      ? (analyticsData.deployments.total / analyticsData.pageViews.total) * 100
      : 0
    const dashboardData = {
      pageViews: {
        ...analyticsData.pageViews,
        trend: calculateTrend(analyticsData.pageViews.thisMonth, analyticsData.pageViews.thisMonth - 1000)
      },
      deployments: {
        ...analyticsData.deployments,
        trend: calculateTrend(analyticsData.deployments.thisMonth, analyticsData.deployments.thisMonth - 50)
      },
      templates: templatesArray,
      chains: chainsArray,
      recentDeployments,
      users: {
        ...analyticsData.users,
        conversionRate: parseFloat(conversionRate.toFixed(1))
      },
      premiumFeatures: Object.values(analyticsData.premiumFeatures),
      performance: {
        avgLoadTime: 1.2,
        bounceRate: 23.4,
        avgSessionDuration: 4.7
      }
    }
    res.json({
      success: true,
      data: dashboardData
    })
  } catch (error: any) {
    console.error('Dashboard data error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard data',
      message: error.message
    })
  }
})
router.get('/api-usage', authenticateApiKey, async (req, res) => {
  try {
    const apiKeys = await apiKeyManager.listApiKeys()
    const usage = apiKeys.map((apiKey: any) => ({
      id: apiKey.id,
      name: apiKey.name,
      userId: apiKey.userId,
      totalUsage: apiKey.usageCount,
      lastUsed: apiKey.lastUsed,
      createdAt: apiKey.createdAt,
      isActive: apiKey.isActive,
      rateLimit: apiKey.rateLimit
    }))
    const totalUsage = usage.reduce((sum: number, key: any) => sum + key.totalUsage, 0)
    const activeKeys = usage.filter((key: any) => key.isActive).length
    res.json({
      success: true,
      data: {
        totalApiCalls: totalUsage,
        activeApiKeys: activeKeys,
        totalApiKeys: usage.length,
        usage
      }
    })
  } catch (error: any) {
    console.error('API usage error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get API usage data',
      message: error.message
    })
  }
})
router.get('/export', authenticateApiKey, async (req, res) => {
  try {
    const exportData = {
      timestamp: new Date().toISOString(),
      analytics: analyticsData,
      apiUsage: await apiKeyManager.listApiKeys()
    }
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename=analytics-${new Date().toISOString().split('T')[0]}.json`)
    res.json({
      success: true,
      data: exportData
    })
  } catch (error: any) {
    console.error('Export error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to export analytics data',
      message: error.message
    })
  }
})
export default router