import { Request, Response, NextFunction } from 'express'
import { apiKeyManager, ApiKeyData } from '../models/ApiKey'
declare global {
  namespace Express {
    interface Request {
      apiKey?: ApiKeyData
      userId?: string
    }
  }
}
export const authenticateApiKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'API key required. Please provide a valid API key in the Authorization header.',
        format: 'Authorization: Bearer YOUR_API_KEY'
      })
    }
    const apiKey = authHeader.substring(7)
    if (!apiKey) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'API key is missing from Authorization header'
      })
    }
    const apiKeyData = await apiKeyManager.validateApiKey(apiKey)
    if (!apiKeyData) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired API key'
      })
    }
    if (!apiKeyData.isActive) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'API key has been revoked'
      })
    }

    // Vérifier la validité de l'abonnement
    const isSubscriptionValid = await apiKeyManager.checkSubscriptionValidity(apiKeyData.id)
    if (!isSubscriptionValid && apiKeyData.subscriptionTier !== 'free') {
      return res.status(402).json({
        error: 'Subscription Expired',
        message: 'Your subscription has expired. Please renew your subscription to continue using premium features.',
        subscriptionTier: 'free',
        renewalRequired: true
      })
    }

    req.apiKey = apiKeyData
    req.userId = apiKeyData.userId
    next()
  } catch (error) {
    console.error('Authentication error:', error)
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed'
    })
  }
}
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.apiKey) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      })
    }
    if (!req.apiKey.permissions.includes(permission)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Permission '${permission}' required for this endpoint`,
        availablePermissions: req.apiKey.permissions
      })
    }
    next()
  }
}
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const apiKey = authHeader.substring(7)
      if (apiKey) {
        const apiKeyData = await apiKeyManager.validateApiKey(apiKey)
        if (apiKeyData && apiKeyData.isActive) {
          req.apiKey = apiKeyData
          req.userId = apiKeyData.userId
        }
      }
    }
    next()
  } catch (error) {
    console.error('Optional auth error:', error)
    next()
  }
}