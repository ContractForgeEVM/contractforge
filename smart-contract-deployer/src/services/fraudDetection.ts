import { ethers } from 'ethers'

// Types pour l'analyse de sécurité
export interface SecurityAnalysis {
  overallScore: number // Score de 0 à 100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  detectedIssues: SecurityIssue[]
  recommendations: string[]
  aiAnalysis?: AIAnalysisResult
}

export interface SecurityIssue {
  type: SecurityIssueType
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
  description: string
  line?: number
  recommendation: string
  codeSnippet?: string
}

export enum SecurityIssueType {
  // Vulnérabilités critiques
  REENTRANCY = 'REENTRANCY',
  UNCHECKED_EXTERNAL_CALLS = 'UNCHECKED_EXTERNAL_CALLS',
  ARBITRARY_SEND = 'ARBITRARY_SEND',
  
  // Vulnérabilités élevées
  INTEGER_OVERFLOW = 'INTEGER_OVERFLOW',
  ACCESS_CONTROL = 'ACCESS_CONTROL',
  TIMESTAMP_DEPENDENCE = 'TIMESTAMP_DEPENDENCE',
  
  // Vulnérabilités moyennes
  UNSAFE_DELEGATECALL = 'UNSAFE_DELEGATECALL',
  UNINITIALIZED_STORAGE = 'UNINITIALIZED_STORAGE',
  FLOATING_PRAGMA = 'FLOATING_PRAGMA',
  
  // Patterns suspects
  HIDDEN_BACKDOOR = 'HIDDEN_BACKDOOR',
  SUSPICIOUS_OWNERSHIP = 'SUSPICIOUS_OWNERSHIP',
  UNUSUAL_PERMISSIONS = 'UNUSUAL_PERMISSIONS',
  
  // Code malveillant
  MALICIOUS_FUNCTIONS = 'MALICIOUS_FUNCTIONS',
  OBFUSCATED_CODE = 'OBFUSCATED_CODE',
  COPY_PASTE_DETECTION = 'COPY_PASTE_DETECTION'
}

export interface AIAnalysisResult {
  confidence: number
  summary: string
  detectedPatterns: string[]
  similarContracts: string[]
  riskFactors: string[]
}

// Détecteur principal de fraude
export class FraudDetectionSystem {
  private static instance: FraudDetectionSystem
  private knownMaliciousPatterns: RegExp[] = []
  private whitelistedPatterns: RegExp[] = []
  private suspiciousKeywords: string[] = []

  private constructor() {
    this.initializePatterns()
  }

  public static getInstance(): FraudDetectionSystem {
    if (!FraudDetectionSystem.instance) {
      FraudDetectionSystem.instance = new FraudDetectionSystem()
    }
    return FraudDetectionSystem.instance
  }

  private initializePatterns() {
    // Patterns malveillants connus
    this.knownMaliciousPatterns = [
      /selfdestruct\s*\(/gi,
      /delegatecall\s*\(/gi,
      /assembly\s*\{[\s\S]*?\}/gi,
      /suicide\s*\(/gi,
      /tx\.origin/gi,
      /block\.coinbase/gi,
      /block\.gaslimit/gi,
      /msg\.gas/gi,
      /sha3\s*\(/gi, // Deprecated
      /throw\s*;/gi, // Deprecated
    ]

    // Patterns suspects mais légitimes dans certains contextes
    this.whitelistedPatterns = [
      /@openzeppelin\/contracts/gi,
      /SPDX-License-Identifier/gi,
      /pragma solidity/gi,
    ]

    // Mots-clés suspects
    this.suspiciousKeywords = [
      'backdoor', 'exploit', 'hack', 'steal', 'drain', 'rug', 'honeypot',
      'scam', 'ponzi', 'pump', 'dump', 'exit', 'hidden', 'secret'
    ]
  }

  /**
   * Analyse complète de sécurité d'un contrat
   */
  public async analyzeContract(sourceCode: string, contractName: string): Promise<SecurityAnalysis> {
    const issues: SecurityIssue[] = []
    let overallScore = 100

    // 1. Analysis statique de base
    issues.push(...this.performStaticAnalysis(sourceCode))
    
    // 2. Détection de patterns malveillants
    issues.push(...this.detectMaliciousPatterns(sourceCode))
    
    // 3. Analyse des permissions et accès
    issues.push(...this.analyzeAccessControl(sourceCode))
    
    // 4. Détection de vulnérabilités communes
    issues.push(...this.detectCommonVulnerabilities(sourceCode))
    
    // 5. Analyse des mots-clés suspects
    issues.push(...this.analyzeSuspiciousKeywords(sourceCode))
    
    // 6. Vérification de la structure du contrat
    issues.push(...this.analyzeContractStructure(sourceCode))
    
    // 7. Simulation d'analyse IA (dans un vrai projet, appeler un service IA)
    const aiAnalysis = await this.performAIAnalysis(sourceCode, contractName)

    // Calcul du score final
    for (const issue of issues) {
      switch (issue.severity) {
        case 'CRITICAL':
          overallScore -= 25
          break
        case 'ERROR':
          overallScore -= 15
          break
        case 'WARNING':
          overallScore -= 8
          break
        case 'INFO':
          overallScore -= 2
          break
      }
    }

    overallScore = Math.max(0, overallScore)

    // Déterminer le niveau de risque
    let riskLevel: SecurityAnalysis['riskLevel']
    if (overallScore >= 80) riskLevel = 'LOW'
    else if (overallScore >= 60) riskLevel = 'MEDIUM'
    else if (overallScore >= 30) riskLevel = 'HIGH'
    else riskLevel = 'CRITICAL'

    // Générer des recommandations
    const recommendations = this.generateRecommendations(issues)

    return {
      overallScore,
      riskLevel,
      detectedIssues: issues,
      recommendations,
      aiAnalysis
    }
  }

  private performStaticAnalysis(sourceCode: string): SecurityIssue[] {
    const issues: SecurityIssue[] = []
    const lines = sourceCode.split('\n')

    lines.forEach((line, index) => {
      const lineNumber = index + 1
      const trimmedLine = line.trim()

      // Vérifier les appels externes non vérifiés
      if (trimmedLine.includes('.call(') && !trimmedLine.includes('require(')) {
        issues.push({
          type: SecurityIssueType.UNCHECKED_EXTERNAL_CALLS,
          severity: 'ERROR',
          description: 'Appel externe non vérifié détecté',
          line: lineNumber,
          recommendation: 'Vérifiez toujours le retour des appels externes avec require() ou des conditions',
          codeSnippet: trimmedLine
        })
      }

      // Vérifier la reentrancy
      if (trimmedLine.includes('call.value(') || (trimmedLine.includes('.call(') && trimmedLine.includes('msg.value'))) {
        issues.push({
          type: SecurityIssueType.REENTRANCY,
          severity: 'CRITICAL',
          description: 'Vulnérabilité de reentrancy potentielle',
          line: lineNumber,
          recommendation: 'Utilisez le pattern checks-effects-interactions ou ReentrancyGuard d\'OpenZeppelin',
          codeSnippet: trimmedLine
        })
      }

      // Vérifier tx.origin
      if (trimmedLine.includes('tx.origin')) {
        issues.push({
          type: SecurityIssueType.ACCESS_CONTROL,
          severity: 'ERROR',
          description: 'Utilisation de tx.origin détectée',
          line: lineNumber,
          recommendation: 'Utilisez msg.sender au lieu de tx.origin pour l\'authentification',
          codeSnippet: trimmedLine
        })
      }

      // Vérifier block.timestamp
      if (trimmedLine.includes('block.timestamp') || trimmedLine.includes('now')) {
        issues.push({
          type: SecurityIssueType.TIMESTAMP_DEPENDENCE,
          severity: 'WARNING',
          description: 'Dépendance au timestamp détectée',
          line: lineNumber,
          recommendation: 'Évitez de dépendre de block.timestamp pour la logique critique',
          codeSnippet: trimmedLine
        })
      }
    })

    return issues
  }

  private detectMaliciousPatterns(sourceCode: string): SecurityIssue[] {
    const issues: SecurityIssue[] = []

    this.knownMaliciousPatterns.forEach(pattern => {
      const matches = sourceCode.match(pattern)
      if (matches) {
        matches.forEach(match => {
          issues.push({
            type: SecurityIssueType.MALICIOUS_FUNCTIONS,
            severity: 'CRITICAL',
            description: `Pattern malveillant détecté: ${match}`,
            recommendation: 'Ce pattern est potentiellement dangereux et doit être justifié',
            codeSnippet: match
          })
        })
      }
    })

    return issues
  }

  private analyzeAccessControl(sourceCode: string): SecurityIssue[] {
    const issues: SecurityIssue[] = []

    // Vérifier si le contrat a des modificateurs d'accès
    const hasOnlyOwner = sourceCode.includes('onlyOwner') || sourceCode.includes('onlyAdmin')
    const hasOwnership = sourceCode.includes('owner') || sourceCode.includes('_owner')
    
    if (hasOwnership && !hasOnlyOwner) {
      issues.push({
        type: SecurityIssueType.ACCESS_CONTROL,
        severity: 'WARNING',
        description: 'Le contrat a un système de propriété mais pas de modificateurs d\'accès clairs',
        recommendation: 'Implémentez des modificateurs comme onlyOwner pour protéger les fonctions sensibles'
      })
    }

    // Vérifier les fonctions publiques dangereuses
    const dangerousFunctions = ['mint', 'burn', 'transfer', 'approve', 'withdraw', 'emergencyWithdraw']
    dangerousFunctions.forEach(func => {
      const regex = new RegExp(`function\\s+${func}\\s*\\([^)]*\\)\\s*(public|external)`, 'gi')
      if (regex.test(sourceCode) && !sourceCode.includes(`${func}`) && !sourceCode.includes('onlyOwner')) {
        issues.push({
          type: SecurityIssueType.UNUSUAL_PERMISSIONS,
          severity: 'ERROR',
          description: `Fonction dangereuse ${func} est publique sans protection d'accès`,
          recommendation: `Protégez la fonction ${func} avec des modificateurs d'accès appropriés`
        })
      }
    })

    return issues
  }

  private detectCommonVulnerabilities(sourceCode: string): SecurityIssue[] {
    const issues: SecurityIssue[] = []

    // Vérifier les overflows/underflows (si pas SafeMath)
    if (!sourceCode.includes('SafeMath') && !sourceCode.includes('pragma solidity ^0.8')) {
      const arithmeticOps = sourceCode.match(/[\+\-\*\/]\s*=/g)
      if (arithmeticOps && arithmeticOps.length > 0) {
        issues.push({
          type: SecurityIssueType.INTEGER_OVERFLOW,
          severity: 'ERROR',
          description: 'Opérations arithmétiques sans protection contre overflow/underflow',
          recommendation: 'Utilisez SafeMath ou Solidity 0.8+ pour la protection automatique'
        })
      }
    }

    // Vérifier le pragma flottant
    const pragmaMatch = sourceCode.match(/pragma\s+solidity\s+([^;]+);/)
    if (pragmaMatch) {
      const version = pragmaMatch[1]
      if (version.includes('^') || version.includes('~')) {
        issues.push({
          type: SecurityIssueType.FLOATING_PRAGMA,
          severity: 'WARNING',
          description: `Version Solidity flottante détectée: ${version}`,
          recommendation: 'Utilisez une version fixe de Solidity pour éviter les changements inattendus'
        })
      }
    }

    return issues
  }

  private analyzeSuspiciousKeywords(sourceCode: string): SecurityIssue[] {
    const issues: SecurityIssue[] = []
    const lowerCaseCode = sourceCode.toLowerCase()

    this.suspiciousKeywords.forEach(keyword => {
      if (lowerCaseCode.includes(keyword)) {
        issues.push({
          type: SecurityIssueType.SUSPICIOUS_OWNERSHIP,
          severity: 'WARNING',
          description: `Mot-clé suspect détecté: "${keyword}"`,
          recommendation: 'Vérifiez le contexte d\'utilisation de ce mot-clé'
        })
      }
    })

    return issues
  }

  private analyzeContractStructure(sourceCode: string): SecurityIssue[] {
    const issues: SecurityIssue[] = []

    // Vérifier la licence
    if (!sourceCode.includes('SPDX-License-Identifier')) {
      issues.push({
        type: SecurityIssueType.FLOATING_PRAGMA,
        severity: 'INFO',
        description: 'Licence SPDX manquante',
        recommendation: 'Ajoutez un identifiant de licence SPDX au début du fichier'
      })
    }

    // Vérifier les imports OpenZeppelin
    const hasOZImports = sourceCode.includes('@openzeppelin/contracts')
    if (!hasOZImports && (sourceCode.includes('ERC20') || sourceCode.includes('ERC721'))) {
      issues.push({
        type: SecurityIssueType.COPY_PASTE_DETECTION,
        severity: 'WARNING',
        description: 'Implémentation de standards sans utiliser OpenZeppelin',
        recommendation: 'Utilisez les contrats OpenZeppelin pour les standards ERC plutôt que des implémentations personnalisées'
      })
    }

    return issues
  }

  private async performAIAnalysis(sourceCode: string, contractName: string): Promise<AIAnalysisResult> {
    // Simulation d'analyse IA - dans un vrai projet, ceci ferait appel à un service d'IA
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulation d'appel API

    const patterns: string[] = []
    const riskFactors: string[] = []

    // Analyse de patterns
    if (sourceCode.includes('delegatecall')) patterns.push('Utilisation de delegatecall')
    if (sourceCode.includes('assembly')) patterns.push('Code assembly inline')
    if (sourceCode.includes('selfdestruct')) patterns.push('Auto-destruction du contrat')

    // Facteurs de risque
    if (sourceCode.length < 500) riskFactors.push('Contrat très court, possiblement incomplet')
    if (sourceCode.split('\n').length < 20) riskFactors.push('Peu de lignes de code')
    if (!sourceCode.includes('require(')) riskFactors.push('Aucune validation avec require()')

    const confidence = Math.max(70, 95 - riskFactors.length * 5)

    return {
      confidence,
      summary: `Analyse IA du contrat ${contractName}: ${confidence}% de confiance`,
      detectedPatterns: patterns,
      similarContracts: [], // Dans un vrai projet, recherche de contrats similaires
      riskFactors
    }
  }

  private generateRecommendations(issues: SecurityIssue[]): string[] {
    const recommendations = new Set<string>()

    // Recommandations génériques basées sur les issues trouvées
    const criticalIssues = issues.filter(i => i.severity === 'CRITICAL')
    const errorIssues = issues.filter(i => i.severity === 'ERROR')

    if (criticalIssues.length > 0) {
      recommendations.add('⚠️ CRITIQUE: Ce contrat présente des vulnérabilités critiques qui doivent être corrigées avant déploiement')
    }

    if (errorIssues.length > 0) {
      recommendations.add('🛡️ Effectuez un audit de sécurité complet avant le déploiement')
    }

    if (issues.some(i => i.type === SecurityIssueType.REENTRANCY)) {
      recommendations.add('Implémentez le pattern Checks-Effects-Interactions ou utilisez ReentrancyGuard')
    }

    if (issues.some(i => i.type === SecurityIssueType.ACCESS_CONTROL)) {
      recommendations.add('Vérifiez et renforcez les contrôles d\'accès')
    }

    if (issues.some(i => i.type === SecurityIssueType.INTEGER_OVERFLOW)) {
      recommendations.add('Utilisez SafeMath ou Solidity 0.8+ pour éviter les overflows')
    }

    // Recommandations génériques
    recommendations.add('Testez le contrat sur un testnet avant le mainnet')
    recommendations.add('Considérez un audit externe pour les contrats de valeur élevée')
    recommendations.add('Documentez clairement toutes les fonctions publiques')

    return Array.from(recommendations)
  }

  /**
   * Analyse rapide pour validation communautaire
   */
  public async quickSecurityCheck(sourceCode: string): Promise<{ score: number; critical: boolean }> {
    const maliciousDetected = this.knownMaliciousPatterns.some(pattern => pattern.test(sourceCode))
    const hasReentrancy = sourceCode.includes('call.value(') || sourceCode.includes('.call(')
    const usesTxOrigin = sourceCode.includes('tx.origin')
    
    let score = 100
    let critical = false

    if (maliciousDetected) {
      score -= 50
      critical = true
    }

    if (hasReentrancy && !sourceCode.includes('nonReentrant')) {
      score -= 30
      critical = true
    }

    if (usesTxOrigin) {
      score -= 20
    }

    return { score: Math.max(0, score), critical }
  }
}

// Export de l'instance singleton
export const fraudDetection = FraudDetectionSystem.getInstance()

// Utilitaire pour formatter les résultats d'analyse
export const formatSecurityAnalysis = (analysis: SecurityAnalysis): string => {
  const { overallScore, riskLevel, detectedIssues } = analysis
  
  let report = `# Rapport de Sécurité\n\n`
  report += `**Score Global:** ${overallScore}/100\n`
  report += `**Niveau de Risque:** ${riskLevel}\n\n`
  
  if (detectedIssues.length > 0) {
    report += `## Issues Détectées (${detectedIssues.length})\n\n`
    
    detectedIssues.forEach((issue, index) => {
      report += `### ${index + 1}. ${issue.description}\n`
      report += `- **Sévérité:** ${issue.severity}\n`
      report += `- **Type:** ${issue.type}\n`
      if (issue.line) report += `- **Ligne:** ${issue.line}\n`
      report += `- **Recommandation:** ${issue.recommendation}\n`
      if (issue.codeSnippet) report += `- **Code:** \`${issue.codeSnippet}\`\n`
      report += `\n`
    })
  }
  
  if (analysis.recommendations && analysis.recommendations.length > 0) {
    report += `## Recommandations\n\n`
    analysis.recommendations.forEach(rec => {
      report += `- ${rec}\n`
    })
  }
  
  return report
}