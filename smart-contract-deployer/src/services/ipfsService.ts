import { IPFS_CONFIG } from '../config/marketplaceConfig'

// Types pour IPFS
export interface IPFSUploadResult {
  hash: string
  url: string
  size: number
  timestamp: number
}

export interface IPFSFileMetadata {
  name: string
  description?: string
  version?: string
  author?: string
  tags?: string[]
  created: number
  modified: number
}

export interface TemplateIPFSData {
  metadata: {
    name: string
    description: string
    category: string
    version: string
    author: string
    license: string
    created: number
    tags: string[]
  }
  sourceCode: string
  documentation: string
  examples?: string[]
  tests?: string[]
  dependencies?: string[]
}

export interface ValidationIPFSData {
  templateId: number
  validator: string
  timestamp: number
  isPositive: boolean
  securityScore: number
  justification: string
  detailedAnalysis?: {
    staticAnalysis: any[]
    manualReview: string
    recommendations: string[]
  }
}

export interface ReportIPFSData {
  templateId: number
  reporter: string
  timestamp: number
  reportType: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  description: string
  evidence?: string[]
  suggestedFix?: string
}

// Service principal IPFS
export class IPFSService {
  private static instance: IPFSService
  private apiKey: string
  private secretKey: string
  private uploadEndpoint: string
  private gateway: string

  private constructor() {
    this.apiKey = IPFS_CONFIG.apiKey
    this.secretKey = IPFS_CONFIG.secretKey
    this.uploadEndpoint = IPFS_CONFIG.uploadEndpoint
    this.gateway = IPFS_CONFIG.gateway
  }

  public static getInstance(): IPFSService {
    if (!IPFSService.instance) {
      IPFSService.instance = new IPFSService()
    }
    return IPFSService.instance
  }

  /**
   * Upload un template complet vers IPFS
   */
  public async uploadTemplate(templateData: TemplateIPFSData): Promise<IPFSUploadResult> {
    try {
      // Valider les données
      this.validateTemplateData(templateData)

      // Créer le package complet
      const templatePackage = {
        ...templateData,
        ipfsVersion: '1.0.0',
        uploadedAt: Date.now()
      }

      // Upload vers IPFS
      const result = await this.uploadJSON(templatePackage, `template_${templateData.metadata.name}_${Date.now()}.json`)
      
      console.log(`Template uploaded to IPFS: ${result.hash}`)
      return result

    } catch (error) {
      console.error('Error uploading template to IPFS:', error)
      throw new Error(`Failed to upload template: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Upload une validation vers IPFS
   */
  public async uploadValidation(validationData: ValidationIPFSData): Promise<IPFSUploadResult> {
    try {
      const validationPackage = {
        ...validationData,
        ipfsVersion: '1.0.0',
        uploadedAt: Date.now()
      }

      const result = await this.uploadJSON(
        validationPackage, 
        `validation_${validationData.templateId}_${validationData.validator}_${Date.now()}.json`
      )
      
      console.log(`Validation uploaded to IPFS: ${result.hash}`)
      return result

    } catch (error) {
      console.error('Error uploading validation to IPFS:', error)
      throw new Error(`Failed to upload validation: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Upload un rapport de sécurité vers IPFS
   */
  public async uploadReport(reportData: ReportIPFSData): Promise<IPFSUploadResult> {
    try {
      const reportPackage = {
        ...reportData,
        ipfsVersion: '1.0.0',
        uploadedAt: Date.now()
      }

      const result = await this.uploadJSON(
        reportPackage, 
        `report_${reportData.templateId}_${reportData.reporter}_${Date.now()}.json`
      )
      
      console.log(`Report uploaded to IPFS: ${result.hash}`)
      return result

    } catch (error) {
      console.error('Error uploading report to IPFS:', error)
      throw new Error(`Failed to upload report: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Upload du code source seul
   */
  public async uploadSourceCode(sourceCode: string, contractName: string): Promise<IPFSUploadResult> {
    try {
      // Ajouter des métadonnées au code source
      const sourceCodeWithMetadata = `// IPFS Upload - ${new Date().toISOString()}\n// Contract: ${contractName}\n\n${sourceCode}`
      
      const result = await this.uploadText(sourceCodeWithMetadata, `${contractName}_${Date.now()}.sol`)
      
      console.log(`Source code uploaded to IPFS: ${result.hash}`)
      return result

    } catch (error) {
      console.error('Error uploading source code to IPFS:', error)
      throw new Error(`Failed to upload source code: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Upload de documentation markdown
   */
  public async uploadDocumentation(documentation: string, templateName: string): Promise<IPFSUploadResult> {
    try {
      // Ajouter un header à la documentation
      const docWithHeader = `# ${templateName} Documentation\n\n*Uploaded to IPFS: ${new Date().toISOString()}*\n\n${documentation}`
      
      const result = await this.uploadText(docWithHeader, `${templateName}_docs_${Date.now()}.md`)
      
      console.log(`Documentation uploaded to IPFS: ${result.hash}`)
      return result

    } catch (error) {
      console.error('Error uploading documentation to IPFS:', error)
      throw new Error(`Failed to upload documentation: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Récupérer des données depuis IPFS
   */
  public async retrieveData<T = any>(hash: string): Promise<T> {
    try {
      const url = `${this.gateway}${hash}`
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data as T
      
    } catch (error) {
      console.error(`Error retrieving data from IPFS (${hash}):`, error)
      throw new Error(`Failed to retrieve IPFS data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Récupérer du texte depuis IPFS
   */
  public async retrieveText(hash: string): Promise<string> {
    try {
      const url = `${this.gateway}${hash}`
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const text = await response.text()
      return text
      
    } catch (error) {
      console.error(`Error retrieving text from IPFS (${hash}):`, error)
      throw new Error(`Failed to retrieve IPFS text: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Récupérer un template complet depuis IPFS
   */
  public async retrieveTemplate(hash: string): Promise<TemplateIPFSData> {
    try {
      const data = await this.retrieveData<TemplateIPFSData & { ipfsVersion: string; uploadedAt: number }>(hash)
      
      // Valider la structure
      if (!data.metadata || !data.sourceCode) {
        throw new Error('Invalid template data structure')
      }

      return {
        metadata: data.metadata,
        sourceCode: data.sourceCode,
        documentation: data.documentation,
        examples: data.examples,
        tests: data.tests,
        dependencies: data.dependencies
      }
      
    } catch (error) {
      console.error(`Error retrieving template from IPFS (${hash}):`, error)
      throw new Error(`Failed to retrieve template: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Vérifier si un hash IPFS est accessible
   */
  public async verifyHash(hash: string): Promise<boolean> {
    try {
      const url = `${this.gateway}${hash}`
      const response = await fetch(url, { method: 'HEAD' })
      return response.ok
    } catch (error) {
      console.error(`Error verifying IPFS hash (${hash}):`, error)
      return false
    }
  }

  /**
   * Upload générique d'un objet JSON
   */
  private async uploadJSON(data: any, filename: string): Promise<IPFSUploadResult> {
    const jsonString = JSON.stringify(data, null, 2)
    return this.uploadText(jsonString, filename)
  }

  /**
   * Upload générique de texte
   */
  private async uploadText(content: string, filename: string): Promise<IPFSUploadResult> {
    try {
      // Si on a les clés Pinata, utiliser le vrai service
      if (this.apiKey && this.secretKey && this.uploadEndpoint.includes('pinata')) {
        return this.uploadToPinata(content, filename)
      } else {
        // Sinon, simulation pour développement
        return this.simulateUpload(content, filename)
      }
    } catch (error) {
      console.error('Error in uploadText:', error)
      throw error
    }
  }

  /**
   * Upload vers Pinata (service IPFS)
   */
  private async uploadToPinata(content: string, filename: string): Promise<IPFSUploadResult> {
    try {
      const formData = new FormData()
      const blob = new Blob([content], { type: 'text/plain' })
      formData.append('file', blob, filename)

      // Métadonnées Pinata
      const metadata = JSON.stringify({
        name: filename,
        keyvalues: {
          uploadedBy: 'CommunityMarketplace',
          timestamp: Date.now().toString()
        }
      })
      formData.append('pinataMetadata', metadata)

      const options = JSON.stringify({
        cidVersion: 1
      })
      formData.append('pinataOptions', options)

      const response = await fetch(this.uploadEndpoint, {
        method: 'POST',
        headers: {
          'pinata_api_key': this.apiKey,
          'pinata_secret_api_key': this.secretKey
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Pinata upload failed: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      
      return {
        hash: result.IpfsHash,
        url: `${this.gateway}${result.IpfsHash}`,
        size: result.PinSize,
        timestamp: Date.now()
      }

    } catch (error) {
      console.error('Pinata upload error:', error)
      throw new Error(`Pinata upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Simulation d'upload pour développement
   */
  private async simulateUpload(content: string, filename: string): Promise<IPFSUploadResult> {
    // Simuler un délai d'upload
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

    // Générer un hash IPFS fictif mais réaliste
    const hash = `Qm${this.generateRandomHash(44)}`
    
    console.log(`[SIMULATION] IPFS Upload: ${filename} -> ${hash}`)
    console.log(`[SIMULATION] Content size: ${content.length} bytes`)

    return {
      hash,
      url: `${this.gateway}${hash}`,
      size: content.length,
      timestamp: Date.now()
    }
  }

  /**
   * Valider les données d'un template
   */
  private validateTemplateData(templateData: TemplateIPFSData): void {
    const { metadata, sourceCode, documentation } = templateData

    if (!metadata?.name || !metadata?.description || !metadata?.category) {
      throw new Error('Template metadata is incomplete')
    }

    if (!sourceCode || sourceCode.trim().length === 0) {
      throw new Error('Source code is required')
    }

    if (!documentation || documentation.trim().length === 0) {
      throw new Error('Documentation is required')
    }

    // Vérifier la taille (limites IPFS)
    const totalSize = JSON.stringify(templateData).length
    if (totalSize > 50 * 1024 * 1024) { // 50MB limit
      throw new Error('Template data is too large (>50MB)')
    }
  }

  /**
   * Générer un hash aléatoire pour simulation
   */
  private generateRandomHash(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  /**
   * Nettoyer et formater du code Solidity
   */
  public formatSolidityCode(sourceCode: string): string {
    // Nettoyer le code (supprimer les commentaires de debug, etc.)
    let cleanCode = sourceCode
      .replace(/\/\/ DEBUG:.*$/gm, '') // Supprimer les commentaires DEBUG
      .replace(/\/\/ TODO:.*$/gm, '') // Supprimer les commentaires TODO
      .replace(/console\.log\(.*\);/gm, '') // Supprimer console.log
      .replace(/^\s*$/gm, '') // Supprimer les lignes vides
      .replace(/\n{3,}/g, '\n\n') // Limiter les sauts de ligne consécutifs

    return cleanCode.trim()
  }

  /**
   * Créer un template package complet
   */
  public createTemplatePackage(
    name: string,
    description: string,
    category: string,
    sourceCode: string,
    documentation: string,
    author: string,
    version: string = '1.0.0',
    license: string = 'MIT',
    tags: string[] = []
  ): TemplateIPFSData {
    return {
      metadata: {
        name,
        description,
        category,
        version,
        author,
        license,
        created: Date.now(),
        tags
      },
      sourceCode: this.formatSolidityCode(sourceCode),
      documentation,
      examples: [],
      tests: [],
      dependencies: this.extractDependencies(sourceCode)
    }
  }

  /**
   * Extraire les dépendances depuis le code source
   */
  private extractDependencies(sourceCode: string): string[] {
    const dependencies: string[] = []
    const importRegex = /import\s+(?:.*\s+from\s+)?["']([^"']+)["']/g
    let match

    while ((match = importRegex.exec(sourceCode)) !== null) {
      const importPath = match[1]
      if (importPath.startsWith('@') || importPath.includes('/')) {
        dependencies.push(importPath)
      }
    }

    return [...new Set(dependencies)] // Supprimer les doublons
  }
}

// Export de l'instance singleton
export const ipfsService = IPFSService.getInstance()

// Utilitaires pour les développeurs
export const IPFSUtils = {
  /**
   * Vérifier si un string est un hash IPFS valide
   */
  isValidIPFSHash: (hash: string): boolean => {
    return /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(hash) || 
           /^baf[a-z0-9]{56}$/.test(hash) || 
           /^bafy[a-z0-9]{56}$/.test(hash)
  },

  /**
   * Convertir un hash IPFS en URL
   */
  hashToURL: (hash: string, gateway: string = IPFS_CONFIG.gateway): string => {
    return `${gateway}${hash}`
  },

  /**
   * Extraire le hash depuis une URL IPFS
   */
  extractHashFromURL: (url: string): string | null => {
    const match = url.match(/\/ipfs\/([a-zA-Z0-9]+)/)
    return match ? match[1] : null
  },

  /**
   * Calculer la taille estimée d'un objet pour IPFS
   */
  estimateSize: (data: any): number => {
    return JSON.stringify(data).length
  }
}