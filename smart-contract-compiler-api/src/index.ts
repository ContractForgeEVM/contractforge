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
import healthRoutes from './routes/health'

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

// Rate limiter général (plus permissif)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Augmenté de 100 à 500
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

// Rate limiter spécifique pour les health checks (très permissif)
const healthLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // 20 requêtes par 5 minutes (largement suffisant pour 1 check toutes les 5 minutes)
  message: 'Too many health checks from this IP',
  standardHeaders: true,
  legacyHeaders: false,
})

app.use('/api/', generalLimiter)
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
app.use('/api/compiler', healthLimiter, healthRoutes) // Applique le rate limiter spécifique aux health checks
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
      'POST /api/web/clear-cache',
      'POST /api/compiler/health'
    ]
  })
})

app.listen(PORT, () => {
  console.log(`🚀 Smart Contract Compiler API server is running on port ${PORT}`)
  console.log(`📊 Rate limits configured:`)
  console.log(`   - General: 500 requests per 15 minutes`)
  console.log(`   - Health checks: 20 requests per 5 minutes`)
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`)
})