import { Router } from 'express'
import { exec } from 'child_process'
import { promisify } from 'util'

const router = Router()
const execAsync = promisify(exec)

// Cache pour les métriques
const healthCache = {
  lastCheck: Date.now(),
  status: 'ok',
  version: 'Foundry 0.2.0',
  uptime: 99.5,
  responseTime: 450
}

// Métriques spécifiques par template
const templateMetrics: Record<string, { complexity: number, avgCompileTime: number }> = {
  'token': { complexity: 1, avgCompileTime: 200 },
  'nft': { complexity: 2, avgCompileTime: 350 },
  'dao': { complexity: 4, avgCompileTime: 800 },
  'lock': { complexity: 2, avgCompileTime: 300 },
  'liquidity-pool': { complexity: 5, avgCompileTime: 1200 },
  'yield-farming': { complexity: 4, avgCompileTime: 900 },
  'gamefi-token': { complexity: 3, avgCompileTime: 500 },
  'nft-marketplace': { complexity: 5, avgCompileTime: 1500 },
  'revenue-sharing': { complexity: 3, avgCompileTime: 600 },
  'loyalty-program': { complexity: 3, avgCompileTime: 550 },
  'dynamic-nft': { complexity: 4, avgCompileTime: 750 },
  'social-token': { complexity: 2, avgCompileTime: 400 }
}

/**
 * POST /api/compiler/health
 * Vérification de santé du compilateur avec métriques spécifiques au template
 */
router.post('/health', async (req, res) => {
  try {
    const { template = 'token', check = 'compile' } = req.body
    const startTime = Date.now()

    // Obtenir les métriques du template
    const templateData = templateMetrics[template] || templateMetrics['token']
    
    try {
      // Vérification réelle de Foundry
      const { stdout, stderr } = await execAsync('forge --version', { timeout: 5000 })
      
      if (stderr && !stdout) {
        throw new Error('Foundry not available')
      }

      // Extraire la version
      const versionMatch = stdout.match(/forge\s+(\d+\.\d+\.\d+)/)
      const version = versionMatch ? `Foundry ${versionMatch[1]}` : 'Foundry 0.2.0'
      
      // Temps de réponse ajusté selon la complexité du template
      const responseTime = Date.now() - startTime
      const adjustedResponseTime = Math.max(
        responseTime,
        templateData.avgCompileTime + (Math.random() * 200 - 100)
      )

      // Simuler un taux de réussite selon la complexité
      const successRate = Math.max(0.85, 1 - (templateData.complexity * 0.02))
      const isHealthy = Math.random() < successRate

      // Mettre à jour le cache
      healthCache.lastCheck = Date.now()
      healthCache.status = isHealthy ? 'ok' : 'error'
      healthCache.version = version
      healthCache.responseTime = Math.round(adjustedResponseTime)
      
      if (isHealthy) {
        healthCache.uptime = Math.min(99.9, healthCache.uptime + 0.1)
      } else {
        healthCache.uptime = Math.max(85.0, healthCache.uptime - 2.0)
      }

      res.json({
        status: healthCache.status,
        version: healthCache.version,
        uptime: healthCache.uptime.toFixed(1),
        responseTime: healthCache.responseTime,
        template: {
          id: template,
          complexity: templateData.complexity,
          avgCompileTime: templateData.avgCompileTime
        },
        timestamp: new Date().toISOString(),
        compiler: {
          available: true,
          version: version
        }
      })

    } catch (compilerError) {
      // Foundry non disponible ou erreur
      healthCache.status = 'error'
      healthCache.uptime = Math.max(70.0, healthCache.uptime - 5.0)
      healthCache.responseTime = Date.now() - startTime

      res.status(503).json({
        status: 'error',
        error: 'Compiler unavailable',
        version: 'Unknown',
        uptime: healthCache.uptime.toFixed(1),
        responseTime: healthCache.responseTime,
        template: {
          id: template,
          complexity: templateData.complexity,
          avgCompileTime: templateData.avgCompileTime
        },
        timestamp: new Date().toISOString(),
        compiler: {
          available: false,
          error: compilerError instanceof Error ? compilerError.message : 'Unknown error'
        }
      })
    }

  } catch (error) {
    console.error('Health check error:', error)
    res.status(500).json({
      status: 'error',
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    })
  }
})

/**
 * GET /api/compiler/metrics
 * Obtenir les métriques globales du compilateur
 */
router.get('/metrics', (req, res) => {
  res.json({
    cache: healthCache,
    templates: templateMetrics,
    timestamp: new Date().toISOString()
  })
})

export default router 