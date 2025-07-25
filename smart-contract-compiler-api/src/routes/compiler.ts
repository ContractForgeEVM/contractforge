import { Router } from 'express'
import { compileContract } from '../services/compiler'
import { generateContractCode } from '../utils/contractGenerator'

const router = Router()

interface CompileRequest {
  sourceCode?: string
  contractName?: string
  templateType?: 'token' | 'nft' | 'dao' | 'lock' | 'liquidity-pool' | 'yield-farming' | 'gamefi-token' | 'nft-marketplace' | 'revenue-sharing' | 'loyalty-program' | 'dynamic-nft' | 'social-token'
  features?: string[]
  params?: Record<string, any>
  featureConfigs?: Record<string, any>
}

// Nouvelle route pour la compilation basée sur les templates
router.post('/compile/template', async (req, res) => {
  try {
    const { templateType, features, params, featureConfigs }: CompileRequest = req.body
    
    if (!templateType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: templateType'
      })
    }

    console.log(`🚀 Template compilation request for: ${templateType}`)
    console.log(`📋 Features: ${features?.length || 0}, Params: ${Object.keys(params || {}).length}`)
    console.log(`⚙️  Feature Configs: ${Object.keys(featureConfigs || {}).length}`)
    
    // Générer le code du contrat à partir du template avec les configurations
    const sourceCode = generateContractCode(templateType, params || {}, features || [], featureConfigs)
    
    // DEBUG: Afficher les premières lignes du code généré
    console.log(`🔍 DEBUG: Generated source code (first 500 chars):`)
    console.log(sourceCode.substring(0, 500))
    
    // Extraire le nom du contrat depuis le code généré avec une regex plus robuste
    let contractName = 'Contract'
    const contractMatch = sourceCode.match(/contract\s+(\w+)(?:\s+is|\s*\{)/)
    if (contractMatch) {
      contractName = contractMatch[1]
    } else {
      // Fallback: générer un nom basé sur le template et les paramètres
      const name = params?.name || templateType
      contractName = name.replace(/\s+/g, '') + (templateType === 'dao' ? 'DAO' : '')
    }
    
    console.log(`📝 Generated contract: ${contractName}`)
    console.log(`🔍 Contract name extracted from: ${contractMatch ? 'regex match' : 'fallback generation'}`)
    console.log(`🔍 Regex match result:`, contractMatch)
    
    const result = await compileContract(sourceCode, contractName)
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
      performance: {
        method: 'foundry-template-compilation',
        speedup: 'real-time'
      }
    })
  } catch (error: any) {
    console.error('Template compilation error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Template compilation failed',
      details: error.errors || [],
      performance: {
        method: 'template-failed',
        speedup: 'none'
      }
    })
  }
})

// Route existante pour la compilation directe
router.post('/compile', async (req, res) => {
  try {
    const { sourceCode, contractName, templateType, features, params }: CompileRequest = req.body
    if (!sourceCode || !contractName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sourceCode and contractName'
      })
    }

    console.log(`🔧 Using Foundry compilation for contract: ${contractName}`)
    console.log(`📋 Template: ${templateType}, Features: ${features?.length || 0}`)
    
    const result = await compileContract(sourceCode, contractName)
    res.json({
      success: true,
      bytecode: result.bytecode,
      abi: result.abi,
      warnings: result.warnings,
      fromCache: false,
      compilationTime: result.compilationTime,
      memoryUsage: result.memoryUsage,
      performance: {
        method: 'foundry-compilation',
        speedup: 'real-time'
      }
    })
  } catch (error: any) {
    console.error('Compilation error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Compilation failed',
      details: error.errors || [],
      performance: {
        method: 'failed',
        speedup: 'none'
      }
    })
  }
})

router.post('/compile/foundry', async (req, res) => {
  try {
    const { sourceCode, contractName, templateType, features, params }: CompileRequest = req.body
    if (!sourceCode || !contractName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sourceCode and contractName'
      })
    }

    console.log(`🚀 Foundry compilation request for ${contractName}`)
    console.log(`📋 Template: ${templateType}, Features: ${features?.length || 0}`)
    
    const result = await compileContract(sourceCode, contractName)
    res.json({
      success: true,
      bytecode: result.bytecode,
      abi: result.abi,
      warnings: result.warnings,
      fromCache: false,
      compilationTime: result.compilationTime,
      memoryUsage: result.memoryUsage,
      performance: {
        method: 'foundry-compilation',
        speedup: 'real-time'
      }
    })
  } catch (error: any) {
    console.error('Foundry compilation error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Foundry compilation failed',
      details: error.errors || [],
      performance: {
        method: 'foundry-failed',
        speedup: 'none'
      }
    })
  }
})

// Routes simplifiées pour la compatibilité - désactivées car nous utilisons Foundry
router.get('/cache-stats', async (req, res) => {
  res.json({
    success: true,
    cache: {
      size: 0,
      maxSize: 0,
      totalAccesses: 0,
      templates: []
    },
    performance: {
      cacheHitRate: '0%',
      recommendation: 'Using Foundry for real-time compilation - no cache needed'
    }
  })
})

router.post('/warmup-cache', async (req, res) => {
  res.json({
    success: true,
    message: 'Cache warmup disabled - using Foundry compilation',
    cache: {
      size: 0,
      maxSize: 0,
      totalAccesses: 0,
      templates: []
    },
    performance: {
      templatesWarmed: 0,
      recommendedAction: 'Foundry handles compilation in real-time'
    }
  })
})

router.post('/clear-cache', async (req, res) => {
  res.json({
    success: true,
    message: 'Cache clear disabled - using Foundry compilation',
    performance: {
      action: 'cache-disabled',
      nextStep: 'Foundry handles all compilation needs'
    }
  })
})

export default router