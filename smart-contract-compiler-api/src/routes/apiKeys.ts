import { Router } from 'express'
import { apiKeyManager } from '../models/ApiKey'
const router = Router()
const MASTER_API_KEY = process.env.MASTER_API_KEY || 'cfk_master_key_change_in_production'
const requireMasterKey = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Master API key required for key management'
    })
  }
  const providedKey = authHeader.substring(7)
  if (providedKey !== MASTER_API_KEY) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid master API key'
    })
  }
  next()
}
router.post('/', requireMasterKey, async (req, res) => {
  try {
    const { 
      name, 
      userId, 
      permissions,
      subscriptionTier = 'free',
      walletAddress
    } = req.body
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        error: 'Valid name is required for the API key'
      })
    }
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      return res.status(400).json({
        error: 'Valid userId is required'
      })
    }

    if (!['free', 'basic', 'premium', 'enterprise'].includes(subscriptionTier)) {
      return res.status(400).json({
        error: 'Invalid subscription tier. Must be one of: free, basic, premium, enterprise'
      })
    }

    const validPermissions = ['compile', 'deploy', 'gas-estimate', 'contract-info', 'verify', 'analytics', 'monitoring']
    const apiPermissions = permissions || ['compile']
    if (!Array.isArray(apiPermissions) || !apiPermissions.every(p => validPermissions.includes(p))) {
      return res.status(400).json({
        error: 'Invalid permissions',
        validPermissions
      })
    }
    const result = await apiKeyManager.createApiKey(name.trim(), userId.trim(), apiPermissions, subscriptionTier, walletAddress)
    // Obtenir les rate limits selon le tier
    const rateLimits = {
      free: { requestsPerMinute: 5, requestsPerHour: 100, requestsPerDay: 500 },
      basic: { requestsPerMinute: 30, requestsPerHour: 500, requestsPerDay: 2000 },
      premium: { requestsPerMinute: 60, requestsPerHour: 1000, requestsPerDay: 10000 },
      enterprise: { requestsPerMinute: 200, requestsPerHour: 5000, requestsPerDay: 50000 }
    }

    res.status(201).json({
      success: true,
      message: 'API key created successfully',
      apiKey: {
        id: result.id,
        key: result.key,
        name: name.trim(),
        userId: userId.trim(),
        permissions: apiPermissions,
        subscriptionTier,
        walletAddress: walletAddress || null,
        rateLimit: rateLimits[subscriptionTier as keyof typeof rateLimits]
      },
      important: 'Store this API key securely. It will not be shown again.',
      usage: {
        header: 'Authorization: Bearer ' + result.key,
        publicAPI: `curl -H "Authorization: Bearer ${result.key}" https://api.contractforge.io/api/web/compile/template`,
        privateAPI: `curl -H "Authorization: Bearer ${result.key}" https://api.contractforge.io/api/private/compile/template`
      },
      subscriptionInfo: {
        tier: subscriptionTier,
        features: subscriptionTier === 'free' ? 'Basic compilation only' : 'Premium features included',
        upgradeInfo: subscriptionTier === 'free' ? 'Upgrade for premium features access' : null
      }
    })
  } catch (error: any) {
    console.error('API key creation error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create API key',
      message: error.message
    })
  }
})
router.get('/', requireMasterKey, async (req, res) => {
  try {
    const { userId } = req.query
    const apiKeys = await apiKeyManager.listApiKeys(userId as string)
    const safeApiKeys = apiKeys.map(key => ({
      id: key.id,
      name: key.name,
      userId: key.userId,
      createdAt: key.createdAt,
      lastUsed: key.lastUsed,
      usageCount: key.usageCount,
      permissions: key.permissions,
      rateLimit: key.rateLimit,
      isActive: key.isActive
    }))
    res.json({
      success: true,
      apiKeys: safeApiKeys,
      total: safeApiKeys.length,
      active: safeApiKeys.filter(key => key.isActive).length
    })
  } catch (error: any) {
    console.error('API key listing error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to list API keys',
      message: error.message
    })
  }
})
router.get('/:id', requireMasterKey, async (req, res) => {
  try {
    const { id } = req.params
    const apiKey = await apiKeyManager.getApiKey(id)
    if (!apiKey) {
      return res.status(404).json({
        success: false,
        error: 'API key not found'
      })
    }
    const safeApiKey = {
      id: apiKey.id,
      name: apiKey.name,
      userId: apiKey.userId,
      createdAt: apiKey.createdAt,
      lastUsed: apiKey.lastUsed,
      usageCount: apiKey.usageCount,
      permissions: apiKey.permissions,
      rateLimit: apiKey.rateLimit,
      isActive: apiKey.isActive
    }
    res.json({
      success: true,
      apiKey: safeApiKey
    })
  } catch (error: any) {
    console.error('API key retrieval error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get API key',
      message: error.message
    })
  }
})
router.delete('/:id', requireMasterKey, async (req, res) => {
  try {
    const { id } = req.params
    const success = await apiKeyManager.revokeApiKey(id)
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'API key not found'
      })
    }
    res.json({
      success: true,
      message: 'API key revoked successfully',
      id
    })
  } catch (error: any) {
    console.error('API key revocation error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to revoke API key',
      message: error.message
    })
  }
})
router.patch('/:id/rate-limit', requireMasterKey, async (req, res) => {
  try {
    const { id } = req.params
    const { requestsPerMinute, requestsPerHour, requestsPerDay } = req.body
    const rateLimit: any = {}
    if (typeof requestsPerMinute === 'number' && requestsPerMinute > 0) {
      rateLimit.requestsPerMinute = requestsPerMinute
    }
    if (typeof requestsPerHour === 'number' && requestsPerHour > 0) {
      rateLimit.requestsPerHour = requestsPerHour
    }
    if (typeof requestsPerDay === 'number' && requestsPerDay > 0) {
      rateLimit.requestsPerDay = requestsPerDay
    }
    if (Object.keys(rateLimit).length === 0) {
      return res.status(400).json({
        error: 'At least one valid rate limit value is required'
      })
    }
    const success = await apiKeyManager.updateRateLimit(id, rateLimit)
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'API key not found'
      })
    }
    res.json({
      success: true,
      message: 'Rate limits updated successfully',
      id,
      newRateLimit: rateLimit
    })
  } catch (error: any) {
    console.error('Rate limit update error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update rate limits',
      message: error.message
    })
  }
})

// Route pour mettre à jour l'abonnement d'une clé API
router.put('/:id/subscription', requireMasterKey, async (req, res) => {
  try {
    const { id } = req.params
    const { 
      subscriptionTier, 
      walletAddress, 
      subscriptionExpiresAt 
    } = req.body

    if (!subscriptionTier || !['free', 'basic', 'premium', 'enterprise'].includes(subscriptionTier)) {
      return res.status(400).json({
        error: 'Valid subscription tier is required. Must be one of: free, basic, premium, enterprise'
      })
    }

    let expirationDate: Date | undefined
    if (subscriptionExpiresAt) {
      expirationDate = new Date(subscriptionExpiresAt)
      if (isNaN(expirationDate.getTime())) {
        return res.status(400).json({
          error: 'Invalid expiration date format'
        })
      }
    }

    const success = await apiKeyManager.updateSubscription(
      id, 
      subscriptionTier, 
      walletAddress, 
      expirationDate || (subscriptionTier !== 'free' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : undefined)
    )

    if (success) {
      const updatedKey = await apiKeyManager.getApiKey(id)
      res.json({
        success: true,
        message: 'Subscription updated successfully',
        apiKey: {
          id: updatedKey?.id,
          name: updatedKey?.name,
          subscriptionTier: updatedKey?.subscriptionTier,
          walletAddress: updatedKey?.walletAddress,
          subscriptionExpiresAt: updatedKey?.subscriptionExpiresAt,
          rateLimit: updatedKey?.rateLimit,
          permissions: updatedKey?.permissions
        }
      })
    } else {
      res.status(404).json({
        error: 'API key not found'
      })
    }
  } catch (error) {
    console.error('Subscription update error:', error)
    res.status(500).json({
      error: 'Failed to update subscription'
    })
  }
})

router.get('/:id/stats', requireMasterKey, async (req, res) => {
  try {
    const { id } = req.params
    const apiKey = await apiKeyManager.getApiKey(id)
    if (!apiKey) {
      return res.status(404).json({
        success: false,
        error: 'API key not found'
      })
    }
    const stats = {
      id: apiKey.id,
      name: apiKey.name,
      userId: apiKey.userId,
      totalUsage: apiKey.usageCount,
      lastUsed: apiKey.lastUsed,
      createdAt: apiKey.createdAt,
      isActive: apiKey.isActive,
      daysSinceCreation: Math.floor((Date.now() - apiKey.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
      averageUsagePerDay: apiKey.usageCount / Math.max(1, Math.floor((Date.now() - apiKey.createdAt.getTime()) / (1000 * 60 * 60 * 24))),
      rateLimit: apiKey.rateLimit,
      permissions: apiKey.permissions
    }
    res.json({
      success: true,
      stats
    })
  } catch (error: any) {
    console.error('API stats error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get API stats',
      message: error.message
    })
  }
})
export default router