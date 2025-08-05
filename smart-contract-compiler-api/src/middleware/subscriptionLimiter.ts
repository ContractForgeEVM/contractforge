import { Request, Response, NextFunction } from 'express'
import * as fs from 'fs'
import * as path from 'path'
import * as bcrypt from 'bcrypt'

// Interface pour étendre Request avec les informations d'abonnement
declare global {
  namespace Express {
    interface Request {
      subscriptionInfo?: {
        tier: string
        limits: {
          requestsPerMinute: number
          requestsPerHour: number
          requestsPerDay: number
        }
        usage: {
          currentMinute: number
          currentHour: number
          currentDay: number
        }
      }
    }
  }
}

// Cache pour stocker les compteurs d'usage par IP et par clé API
const usageCache = new Map<string, {
  minute: { count: number, resetTime: number }
  hour: { count: number, resetTime: number }
  day: { count: number, resetTime: number }
}>()

// Fonction pour obtenir la clé de cache
function getCacheKey(identifier: string, period: 'minute' | 'hour' | 'day'): string {
  const now = Date.now()
  let resetTime: number
  
  switch (period) {
    case 'minute':
      resetTime = Math.floor(now / (60 * 1000)) * 60 * 1000
      break
    case 'hour':
      resetTime = Math.floor(now / (60 * 60 * 1000)) * 60 * 60 * 1000
      break
    case 'day':
      resetTime = Math.floor(now / (24 * 60 * 60 * 1000)) * 24 * 60 * 60 * 1000
      break
  }
  
  return `${identifier}:${period}:${resetTime}`
}

// Fonction pour vérifier et incrémenter l'usage
function checkAndIncrementUsage(identifier: string, limits: any): boolean {
  const now = Date.now()
  
  // Vérifier et réinitialiser les compteurs si nécessaire
  for (const period of ['minute', 'hour', 'day'] as const) {
    const cacheKey = getCacheKey(identifier, period)
    const current = usageCache.get(cacheKey)
    
    if (!current || now >= current[period].resetTime) {
      // Réinitialiser le compteur
      usageCache.set(cacheKey, {
        minute: { count: 0, resetTime: Math.floor(now / (60 * 1000)) * 60 * 1000 },
        hour: { count: 0, resetTime: Math.floor(now / (60 * 60 * 1000)) * 60 * 60 * 1000 },
        day: { count: 0, resetTime: Math.floor(now / (24 * 60 * 60 * 1000)) * 24 * 60 * 60 * 1000 }
      })
    }
  }
  
  // Vérifier les limites
  const minuteKey = getCacheKey(identifier, 'minute')
  const hourKey = getCacheKey(identifier, 'hour')
  const dayKey = getCacheKey(identifier, 'day')
  
  const minuteUsage = usageCache.get(minuteKey)?.minute.count || 0
  const hourUsage = usageCache.get(hourKey)?.hour.count || 0
  const dayUsage = usageCache.get(dayKey)?.day.count || 0
  
  if (minuteUsage >= limits.requestsPerMinute ||
      hourUsage >= limits.requestsPerHour ||
      dayUsage >= limits.requestsPerDay) {
    return false
  }
  
  // Incrémenter les compteurs
  if (usageCache.has(minuteKey)) {
    usageCache.get(minuteKey)!.minute.count++
  }
  if (usageCache.has(hourKey)) {
    usageCache.get(hourKey)!.hour.count++
  }
  if (usageCache.has(dayKey)) {
    usageCache.get(dayKey)!.day.count++
  }
  
  return true
}

// Fonction pour valider une clé API directement depuis le fichier JSON
async function validateApiKeyDirect(apiKey: string): Promise<{ subscriptionTier: string, isActive: boolean } | null> {
  try {
    const apiKeysPath = path.join(process.cwd(), 'data', 'apiKeys.json')
    
    if (!fs.existsSync(apiKeysPath)) {
      return null
    }
    
    const apiKeysData = JSON.parse(fs.readFileSync(apiKeysPath, 'utf8'))
    
    // Chercher la clé API par hash
    for (const keyData of apiKeysData) {
      if (keyData.isActive && await bcrypt.compare(apiKey, keyData.keyHash)) {
        return {
          subscriptionTier: keyData.subscriptionTier,
          isActive: keyData.isActive
        }
      }
    }
    
    return null
  } catch (error) {
    console.error('Erreur validation directe clé API:', error)
    return null
  }
}

// Middleware principal de limitation d'abonnement
export const subscriptionLimiter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Vérifier s'il y a une clé API dans les headers
    const authHeader = req.headers.authorization
    let subscriptionTier = 'free'
    let limits = {
      requestsPerMinute: 5,
      requestsPerHour: 100,
      requestsPerDay: 500
    }
    let identifier = req.ip || 'unknown' // Utiliser l'IP par défaut
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const apiKey = authHeader.substring(7)
      
      // Vérifier d'abord si c'est la clé master
      const masterApiKey = process.env.MASTER_API_KEY
      if (masterApiKey && apiKey === masterApiKey) {
        // Clé master : accès enterprise sans limites
        subscriptionTier = 'enterprise'
        identifier = 'master_key'
        limits = { requestsPerMinute: 1000, requestsPerHour: 50000, requestsPerDay: 500000 }
        console.log('🔑 Master API key detected - granting enterprise access')
      } else {
        // Valider la clé API utilisateur normale
        const apiKeyData = await validateApiKeyDirect(apiKey)
        
        if (apiKeyData && apiKeyData.isActive) {
          // Utiliser le vrai tier de la clé API
          subscriptionTier = apiKeyData.subscriptionTier
          identifier = `api_key:${apiKey.substring(0, 10)}`
          
          // Définir les limites selon le tier réel
          switch (subscriptionTier) {
            case 'free':
              limits = { requestsPerMinute: 5, requestsPerHour: 100, requestsPerDay: 500 }
              break
            case 'basic':
              limits = { requestsPerMinute: 30, requestsPerHour: 500, requestsPerDay: 2000 }
              break
            case 'premium':
              limits = { requestsPerMinute: 60, requestsPerHour: 1000, requestsPerDay: 10000 }
              break
            case 'enterprise':
              limits = { requestsPerMinute: 200, requestsPerHour: 5000, requestsPerDay: 50000 }
              break
            default:
              limits = { requestsPerMinute: 5, requestsPerHour: 100, requestsPerDay: 500 }
          }
        } else {
          console.log(`❌ Invalid API key provided: ${apiKey.substring(0, 12)}...`)
        }
      }
    }
    
    // Ajouter les informations d'abonnement à la requête
    req.subscriptionInfo = {
      tier: subscriptionTier,
      limits,
      usage: {
        currentMinute: 0,
        currentHour: 0,
        currentDay: 0
      }
    }
    
    // Vérifier et incrémenter l'usage
    const allowed = checkAndIncrementUsage(identifier, limits)
    
    if (!allowed) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: `You have exceeded your ${subscriptionTier} tier limits`,
        limits,
        subscriptionTier,
        upgradeInfo: subscriptionTier === 'free' ? 'Upgrade your subscription for higher limits' : null
      })
    }
    
    // Ajouter les headers de rate limit
    res.set({
      'X-RateLimit-Limit-Minute': limits.requestsPerMinute,
      'X-RateLimit-Limit-Hour': limits.requestsPerHour,
      'X-RateLimit-Limit-Day': limits.requestsPerDay,
      'X-RateLimit-Tier': subscriptionTier
    })
    
    next()
  } catch (error) {
    console.error('Subscription limiter error:', error)
    // En cas d'erreur, permettre la requête avec les limites gratuites
    next()
  }
}

// Middleware pour les fonctionnalités premium
export const premiumFeatureCheck = (requiredTier: 'basic' | 'premium' | 'enterprise') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const subscriptionInfo = req.subscriptionInfo
    
    if (!subscriptionInfo) {
      return res.status(403).json({
        success: false,
        error: 'Premium feature requires authentication',
        message: `This feature requires a ${requiredTier} subscription or higher`,
        requiredTier,
        upgradeInfo: 'Please provide an API key to access premium features'
      })
    }
    
    const tierOrder = ['free', 'basic', 'premium', 'enterprise']
    const userTierIndex = tierOrder.indexOf(subscriptionInfo.tier)
    const requiredTierIndex = tierOrder.indexOf(requiredTier)
    
    if (userTierIndex < requiredTierIndex) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient subscription tier',
        message: `This feature requires a ${requiredTier} subscription or higher`,
        currentTier: subscriptionInfo.tier,
        requiredTier,
        upgradeInfo: `Upgrade to ${requiredTier} or higher to access this feature`
      })
    }
    
    next()
  }
} 