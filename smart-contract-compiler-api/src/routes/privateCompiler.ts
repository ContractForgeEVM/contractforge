import { Router } from 'express'
import { compileWithFoundry } from '../services/foundryCompiler'
import { generateContractCode } from '../utils/contractGenerator'
import { authenticateApiKey, requirePermission } from '../middleware/auth'
import { apiKeyRateLimit } from '../middleware/rateLimit'
import subscriptionService from '../services/subscription'

const router = Router()

// Interface pour les requêtes de compilation privée
interface PrivateCompileRequest {
  templateType: string
  features?: string[]
  params?: Record<string, any>
  featureConfigs?: any
  walletAddress?: string
}

// Middleware pour enrichir l'expérience avec les informations d'abonnement (sans bloquer)
const enhanceWithSubscriptionInfo = async (req: any, res: any, next: any) => {
  try {
    const { walletAddress, features = [] } = req.body as PrivateCompileRequest
    
    // Identifier les fonctionnalités premium utilisées
    const premiumFeatures = features.filter(feature => [
      'whitelist', 'blacklist', 'pausable', 'burnable', 'mintable',
      'governance', 'staking', 'vesting', 'multi-sig', 'liquidity-pool',
      'yield-farming', 'nft-marketplace'
    ].includes(feature))

    // Stocker les informations pour la réponse enrichie
    req.premiumFeaturesUsed = premiumFeatures
    req.hasSubscription = false
    req.subscriptionTier = req.apiKey?.subscriptionTier || 'free'

    // Vérifier si l'utilisateur a un abonnement (optionnel, pour info seulement)
    if (walletAddress || req.userId) {
      const addressToCheck = walletAddress || req.userId
      try {
        const subscription = await subscriptionService.getUserSubscription(addressToCheck)
        if (subscription) {
          req.hasSubscription = true
          req.subscriptionTier = subscription.plan_id || req.subscriptionTier
        }
      } catch (error: any) {
        // Pas grave si on ne peut pas récupérer l'abonnement, on continue
        console.log('Could not fetch subscription info:', error.message)
      }
    }

    // Tracker l'utilisation pour analytics
    if (walletAddress) {
      try {
        await subscriptionService.trackUsage(walletAddress, 'private_api_compilation', {
          templateType: req.body.templateType,
          features: features,
          premiumFeatures: premiumFeatures,
          apiKey: req.apiKey?.id,
          subscriptionTier: req.subscriptionTier
        })
              } catch (error: any) {
          // Non bloquant
          console.log('Usage tracking failed:', error.message)
      }
    }

    next()
  } catch (error) {
    console.error('Subscription enhancement error:', error)
    // Ne pas bloquer en cas d'erreur, juste passer au suivant
    next()
  }
}

// Route privée pour la compilation de templates avec authentification
router.post('/compile/template', 
  authenticateApiKey,
  requirePermission('compile'),
  apiKeyRateLimit,
  enhanceWithSubscriptionInfo,
  async (req, res) => {
    try {
      const { 
        templateType, 
        features = [], 
        params = {}, 
        featureConfigs = {},
        walletAddress 
      }: PrivateCompileRequest = req.body

      if (!templateType) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: templateType'
        })
      }

      console.log(`🔐 Private API: Template compilation request for: ${templateType}`)
      console.log(`👤 User: ${req.userId} (API Key: ${req.apiKey?.name})`)
      console.log(`💰 Wallet: ${walletAddress || 'N/A'}`)
      console.log(`📋 Features: ${features.length > 0 ? features.join(', ') : 'none'}`)
      console.log(`⚙️  Params: ${Object.keys(params).length} provided`)

      // Générer le code du contrat à partir du template
      const sourceCode = generateContractCode(templateType, params, features, featureConfigs)
      
      // Extraire le nom du contrat
      let contractName = 'Contract'
      const contractMatch = sourceCode.match(/contract\s+(\w+)(?:\s+is|\s*\{)/)
      if (contractMatch) {
        contractName = contractMatch[1]
      } else {
        const name = params?.name || templateType
        contractName = name.replace(/\s+/g, '') + (templateType === 'dao' ? 'DAO' : '')
      }

      console.log(`📝 Generated contract: ${contractName}`)
      
      // Compiler le contrat
      const result = await compileWithFoundry(sourceCode, contractName)
      
      // Réponse enrichie pour l'API privée
      res.json({
        success: true,
        bytecode: result.bytecode,
        abi: result.abi,
        warnings: result.warnings,
        fromCache: false,
        compilationTime: result.compilationTime,
        memoryUsage: result.memoryUsage,
        templateType,
        contractName,
        features,
        // Informations enrichies sur l'API key
        apiKeyInfo: {
          name: req.apiKey?.name,
          usageCount: req.apiKey?.usageCount,
          rateLimit: req.apiKey?.rateLimit,
          subscriptionTier: (req as any).subscriptionTier
        },
        // Informations de performance
        performance: {
          method: 'foundry-private-template-compilation',
          speedup: 'real-time',
          tier: (req as any).subscriptionTier,
          apiAccess: 'private'
        },
        // Informations sur l'abonnement et les fonctionnalités
        subscription: {
          walletAddress: walletAddress || null,
          hasActiveSubscription: (req as any).hasSubscription,
          subscriptionTier: (req as any).subscriptionTier,
          premiumFeaturesUsed: (req as any).premiumFeaturesUsed || [],
          totalFeaturesUsed: features.length,
          payAsYouGo: !(req as any).hasSubscription && ((req as any).premiumFeaturesUsed?.length > 0)
        },
        // Avantages de l'API privée
        privateApiBenefits: {
          enhancedRateLimit: true,
          detailedAnalytics: true,
          prioritySupport: (req as any).subscriptionTier !== 'free',
          richMetadata: true
        }
      })

    } catch (error: any) {
      console.error('Private template compilation error:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Private template compilation failed',
        details: error.errors || [],
        performance: {
          method: 'private-template-failed',
          speedup: 'none'
        }
      })
    }
  }
)

// Route pour obtenir les informations sur les limitations et permissions
router.get('/info', authenticateApiKey, async (req, res) => {
  try {
    const apiKeyInfo = {
      name: req.apiKey?.name,
      permissions: req.apiKey?.permissions,
      rateLimit: req.apiKey?.rateLimit,
      usageCount: req.apiKey?.usageCount,
      lastUsed: req.apiKey?.lastUsed,
      isActive: req.apiKey?.isActive
    }

    res.json({
      success: true,
      data: {
        apiKey: apiKeyInfo,
        availableEndpoints: [
          'POST /api/private/compile/template - Compile templates with premium features',
          'GET /api/private/info - Get API key information'
        ],
        premiumFeatures: [
          'whitelist', 'blacklist', 'pausable', 'burnable', 'mintable',
          'governance', 'staking', 'vesting', 'multi-sig', 'liquidity-pool',
          'yield-farming', 'nft-marketplace'
        ],
        subscriptionRequired: 'Premium features require an active subscription'
      }
    })
  } catch (error) {
    console.error('Error fetching private API info:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch API information'
    })
  }
})

export default router 