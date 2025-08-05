// Configuration IPFS pour le marketplace
export const IPFS_CONFIG = {
  apiKey: process.env.REACT_APP_PINATA_API_KEY || 'demo-key',
  secretKey: process.env.REACT_APP_PINATA_SECRET_KEY || 'demo-secret',
  uploadEndpoint: 'https://api.pinata.cloud/pinning/pinFileToIPFS',
  gateway: 'https://gateway.pinata.cloud/ipfs/',
  fallbackGateway: 'https://ipfs.io/ipfs/'
}

// Configuration du marketplace
export const MARKETPLACE_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: ['.sol', '.md', '.json', '.txt'],
  maxTemplatesPerUser: 50,
  validationRequired: true,
  moderationEnabled: true
}

// Types pour le marketplace
export interface MarketplaceTemplate {
  id: string
  name: string
  description: string
  category: string
  author: string
  version: string
  ipfsHash: string
  securityScore: number
  validationCount: number
  reportCount: number
  createdAt: number
  updatedAt: number
  tags: string[]
  license: string
  downloads: number
  rating: number
}

export interface MarketplaceValidation {
  templateId: string
  validator: string
  timestamp: number
  isPositive: boolean
  securityScore: number
  justification: string
}

export interface MarketplaceReport {
  templateId: string
  reporter: string
  timestamp: number
  reportType: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  description: string
  evidence?: string[]
} 