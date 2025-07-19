import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { authenticateApiKey } from './middleware/auth'
import { apiKeyRateLimit } from './middleware/rateLimit'
import compilerRoutes from './routes/compiler'
import apiKeyRoutes from './routes/apiKeys'
import contractRoutes from './routes/contract'
import deployRoutes from './routes/deploy'
import gasEstimateRoutes from './routes/gasEstimate'
import verifyRoutes from './routes/verify'
import analyticsRoutes from './routes/analytics'
import subscriptionRoutes from './routes/subscription'

import cryptoPaymentRoutes from './routes/cryptoPayment'
import mintPagesRoutes from './routes/mintPages'

const app = express()
const PORT = process.env.PORT || 3004
app.set('trust proxy', 1)
app.use(helmet({
  contentSecurityPolicy: false  // Désactiver CSP global pour permettre nos pages de mint
}))
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:3004',
      'https://contractforge.io',
      'http://192.168.1.188:3000'
    ]
    if (process.env.FRONTEND_URL) {
      allowedOrigins.push(process.env.FRONTEND_URL)
    }
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
}))
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
})
app.use('/api/', limiter)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'smart-contract-compiler-api',
    version: '2.0.0-foundry'
  })
})
app.use('/api/web', compilerRoutes)
app.use('/api/keys', authenticateApiKey, apiKeyRoutes)
app.use('/api/compile', authenticateApiKey, apiKeyRateLimit, compilerRoutes)
app.use('/api/contract', authenticateApiKey, contractRoutes)
app.use('/api/deploy', authenticateApiKey, deployRoutes)
app.use('/api/gas-estimate', authenticateApiKey, gasEstimateRoutes)
app.use('/api/verify', authenticateApiKey, verifyRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/subscription', subscriptionRoutes)
app.use('/api/crypto', cryptoPaymentRoutes)
app.use('/api/mint-pages', mintPagesRoutes)
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Error:', err)
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  })
})
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /health',
      'POST /api/web/compile',
      'GET /api/web/cache-stats',
      'POST /api/web/warmup-cache',
      'POST /api/web/clear-cache'
    ]
  })
})
async function startServer() {
  try {
    console.log('🚀 Starting Smart Contract Compiler API v2.0.0 with Foundry...')
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`)
      console.log(`🌐 Health check: http://localhost:${PORT}/health`)
      console.log(`📡 Public API: http://localhost:${PORT}/api/web`)
      console.log(`🔒 Private API: http://localhost:${PORT}/api/compile`)
      console.log(`⚡ Compiler: Foundry (Real-time compilation)`)
      console.log(`🎯 Performance optimization: FOUNDRY-POWERED`)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}
startServer()