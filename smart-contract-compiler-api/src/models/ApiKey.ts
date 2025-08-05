import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'
export interface ApiKeyData {
  id: string
  name: string
  keyHash: string
  userId: string
  createdAt: Date
  lastUsed?: Date
  usageCount: number
  rateLimit: {
    requestsPerMinute: number
    requestsPerHour: number
    requestsPerDay: number
  }
  permissions: string[]
  isActive: boolean
  // Nouvelles propriétés pour les abonnements
  subscriptionTier?: 'free' | 'basic' | 'premium' | 'enterprise'
  walletAddress?: string
  subscriptionExpiresAt?: Date
}
const DATA_FILE = path.join(__dirname, '../../data/apiKeys.json')
class ApiKeyManager {
  private apiKeys: Map<string, ApiKeyData> = new Map()
  constructor() {
    this.loadApiKeys()
  }
  private loadApiKeys() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const data = fs.readFileSync(DATA_FILE, 'utf-8')
        const keys = JSON.parse(data)
        keys.forEach((key: any) => {
          this.apiKeys.set(key.id, {
            ...key,
            createdAt: new Date(key.createdAt),
            lastUsed: key.lastUsed ? new Date(key.lastUsed) : undefined
          })
        })
      }
    } catch (error) {
      console.error('Error loading API keys:', error)
    }
  }
  private saveApiKeys() {
    try {
      const dir = path.dirname(DATA_FILE)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      const keysArray = Array.from(this.apiKeys.values())
      fs.writeFileSync(DATA_FILE, JSON.stringify(keysArray, null, 2))
    } catch (error) {
      console.error('Error saving API keys:', error)
    }
  }
  async createApiKey(
    name: string, 
    userId: string, 
    permissions: string[] = ['compile'],
    subscriptionTier: 'free' | 'basic' | 'premium' | 'enterprise' = 'free',
    walletAddress?: string
  ): Promise<{ id: string, key: string }> {
    const id = uuidv4()
    const key = `cfk_${Buffer.from(uuidv4()).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 32)}`
    const keyHash = await bcrypt.hash(key, 12)
    // Définir les limites selon le tier d'abonnement
    const rateLimits = {
      free: { requestsPerMinute: 5, requestsPerHour: 100, requestsPerDay: 500 },
      basic: { requestsPerMinute: 30, requestsPerHour: 500, requestsPerDay: 2000 },
      premium: { requestsPerMinute: 60, requestsPerHour: 1000, requestsPerDay: 10000 },
      enterprise: { requestsPerMinute: 200, requestsPerHour: 5000, requestsPerDay: 50000 }
    }

    const apiKeyData: ApiKeyData = {
      id,
      name,
      keyHash,
      userId,
      createdAt: new Date(),
      usageCount: 0,
      rateLimit: rateLimits[subscriptionTier],
      permissions,
      isActive: true,
      subscriptionTier,
      walletAddress,
      subscriptionExpiresAt: subscriptionTier !== 'free' ? 
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : // 30 jours par défaut
        undefined
    }
    this.apiKeys.set(id, apiKeyData)
    this.saveApiKeys()
    return { id, key }
  }
  async validateApiKey(key: string): Promise<ApiKeyData | null> {
    try {
      for (const [id, apiKeyData] of this.apiKeys) {
        if (apiKeyData.isActive && await bcrypt.compare(key, apiKeyData.keyHash)) {
          apiKeyData.lastUsed = new Date()
          apiKeyData.usageCount++
          this.saveApiKeys()
          return apiKeyData
        }
      }
      return null
    } catch (error) {
      console.error('Error validating API key:', error)
      return null
    }
  }
  async revokeApiKey(id: string): Promise<boolean> {
    const apiKey = this.apiKeys.get(id)
    if (apiKey) {
      apiKey.isActive = false
      this.saveApiKeys()
      return true
    }
    return false
  }
  async getApiKey(id: string): Promise<ApiKeyData | null> {
    return this.apiKeys.get(id) || null
  }
  async listApiKeys(userId?: string): Promise<ApiKeyData[]> {
    const keys = Array.from(this.apiKeys.values())
    return userId ? keys.filter(key => key.userId === userId) : keys
  }
  async updateRateLimit(id: string, rateLimit: Partial<ApiKeyData['rateLimit']>): Promise<boolean> {
    const apiKey = this.apiKeys.get(id)
    if (apiKey) {
      apiKey.rateLimit = { ...apiKey.rateLimit, ...rateLimit }
      this.saveApiKeys()
      return true
    }
    return false
  }

  async updateSubscription(
    id: string, 
    subscriptionTier: 'free' | 'basic' | 'premium' | 'enterprise',
    walletAddress?: string,
    subscriptionExpiresAt?: Date
  ): Promise<boolean> {
    const apiKey = this.apiKeys.get(id)
    if (apiKey) {
      // Mettre à jour le tier
      apiKey.subscriptionTier = subscriptionTier
      apiKey.walletAddress = walletAddress
      apiKey.subscriptionExpiresAt = subscriptionExpiresAt

      // Mettre à jour les rate limits selon le nouveau tier
      const rateLimits = {
        free: { requestsPerMinute: 5, requestsPerHour: 100, requestsPerDay: 500 },
        basic: { requestsPerMinute: 30, requestsPerHour: 500, requestsPerDay: 2000 },
        premium: { requestsPerMinute: 60, requestsPerHour: 1000, requestsPerDay: 10000 },
        enterprise: { requestsPerMinute: 200, requestsPerHour: 5000, requestsPerDay: 50000 }
      }
      apiKey.rateLimit = rateLimits[subscriptionTier]

      // Mettre à jour les permissions selon le tier
      const tierPermissions = {
        free: ['compile'],
        basic: ['compile', 'contract'],
        premium: ['compile', 'contract', 'deploy', 'verify'],
        enterprise: ['compile', 'contract', 'deploy', 'verify', 'analytics', 'monitoring']
      }
      apiKey.permissions = tierPermissions[subscriptionTier]

      this.saveApiKeys()
      return true
    }
    return false
  }

  async checkSubscriptionValidity(id: string): Promise<boolean> {
    const apiKey = this.apiKeys.get(id)
    if (!apiKey) return false
    
    if (apiKey.subscriptionTier === 'free') return true
    
    if (apiKey.subscriptionExpiresAt && apiKey.subscriptionExpiresAt < new Date()) {
      // Abonnement expiré, revenir au tier gratuit
      await this.updateSubscription(id, 'free')
      return false
    }
    
    return true
  }
}
export const apiKeyManager = new ApiKeyManager()