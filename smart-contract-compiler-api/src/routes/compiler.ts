import { Router } from 'express'
import { compileContract } from '../services/compiler'

const router = Router()

interface CompileRequest {
  sourceCode: string
  contractName: string
  templateType?: 'token' | 'nft' | 'dao' | 'lock'
  features?: string[]
  params?: Record<string, any>
}

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