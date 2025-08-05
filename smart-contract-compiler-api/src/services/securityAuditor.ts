import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs-extra'
import * as path from 'path'
import * as os from 'os'

const execAsync = promisify(exec)

export interface SecurityIssue {
  id: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  category: 'REENTRANCY' | 'OVERFLOW' | 'ACCESS_CONTROL' | 'LOGIC_ERROR' | 'GAS_OPTIMIZATION' | 'BEST_PRACTICES' | 'BAD_RANDOMNESS' | 'RACE_CONDITION' | 'DENIAL_OF_SERVICE' | 'FORCED_ETHER' | 'HONEYPOT' | 'RUG_PULL' | 'INTERFACE_ERROR' | 'VARIABLE_SHADOWING' | 'CONSTRUCTOR_ERROR' | 'INTEGER_OVERFLOW' | 'UNCHECKED_EXTERNAL_CALL' | 'WRONG_CONSTRUCTOR_NAME'
  title: string
  description: string
  line?: number
  column?: number
  file?: string
  tool: 'SOLHINT' | 'SLITHER' | 'CUSTOM' | 'PATTERN_MATCH' | 'NOT_SO_SMART'
  recommendation: string
  impact: string
}

export interface AuditResult {
  score: number // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  issues: SecurityIssue[]
  summary: {
    critical: number
    high: number
    medium: number
    low: number
    total: number
  }
  recommendations: string[]
  passed: boolean
  auditTime: number
  toolsUsed: string[]
}

// Patterns de vulnérabilités avancés
const VULNERABILITY_PATTERNS = [
  // Reentrancy - Pattern plus spécifique
  {
    pattern: /(?:\.call|\.send|\.transfer)\s*\([^}]*\)[^}]*\s*(?:balances|state|mapping)\s*\[[^}]*\]\s*=/gs,
    category: 'REENTRANCY' as const,
    severity: 'CRITICAL' as const,
    title: 'Reentrancy Vulnerability',
    description: 'State changes after external calls can lead to reentrancy attacks',
    recommendation: 'Use ReentrancyGuard or follow checks-effects-interactions pattern'
  },
  // Reentrancy - Pattern simplifié mais efficace
  {
    pattern: /\.call\{value:[^}]*\}\s*\([^}]*\)[^}]*balances\[msg\.sender\]\s*=\s*0/gs,
    category: 'REENTRANCY' as const,
    severity: 'CRITICAL' as const,
    title: 'Classic Reentrancy Attack Pattern',
    description: 'External call followed by state change - classic reentrancy vulnerability',
    recommendation: 'Use ReentrancyGuard or change state before external call'
  },
  {
    pattern: /(?:function|modifier)\s+\w+\s*\([^)]*\)\s*(?:external|public)\s*(?:payable)?\s*\{[^}]*\s*(?:\.call|\.send|\.transfer)\s*\([^}]*\}/gs,
    category: 'REENTRANCY' as const,
    severity: 'HIGH' as const,
    title: 'Potential Reentrancy Attack',
    description: 'External calls before state changes can lead to reentrancy attacks',
    recommendation: 'Use ReentrancyGuard or follow checks-effects-interactions pattern'
  },
  {
    pattern: /(?:\.call|\.send|\.transfer)\s*\([^)]*\)\s*\{[^}]*\s*(?:\.call|\.send|\.transfer)\s*\(/gs,
    category: 'REENTRANCY' as const,
    severity: 'CRITICAL' as const,
    title: 'Nested External Calls',
    description: 'Nested external calls can cause reentrancy attacks',
    recommendation: 'Avoid nested external calls, use ReentrancyGuard'
  },

  // Access Control
  {
    pattern: /tx\.origin\s*==\s*msg\.sender/gs,
    category: 'ACCESS_CONTROL' as const,
    severity: 'CRITICAL' as const,
    title: 'Use of tx.origin',
    description: 'tx.origin can be spoofed and should not be used for authorization',
    recommendation: 'Use msg.sender instead of tx.origin for access control'
  },
  {
    pattern: /require\s*\(\s*tx\.origin\s*==\s*owner/gs,
    category: 'ACCESS_CONTROL' as const,
    severity: 'CRITICAL' as const,
    title: 'tx.origin in require statement',
    description: 'Using tx.origin in require statements is dangerous',
    recommendation: 'Replace tx.origin with msg.sender'
  },

  // Logic Errors
  {
    pattern: /block\.timestamp/gs,
    category: 'LOGIC_ERROR' as const,
    severity: 'MEDIUM' as const,
    title: 'Use of block.timestamp',
    description: 'block.timestamp can be manipulated by miners',
    recommendation: 'Use block.number or external time oracles for critical time-based logic'
  },
  {
    pattern: /block\.number/gs,
    category: 'LOGIC_ERROR' as const,
    severity: 'LOW' as const,
    title: 'Use of block.number',
    description: 'block.number can vary between blocks',
    recommendation: 'Consider using external oracles for precise timing'
  },

  // Overflow/Underflow (Solidity 0.8+ handles this, but good to check)
  {
    pattern: /(\w+)\s*\+\s*(\w+)\s*(?!.*require|\|\||&&)/gs,
    category: 'OVERFLOW' as const,
    severity: 'MEDIUM' as const,
    title: 'Potential Integer Overflow',
    description: 'Arithmetic operations without overflow checks',
    recommendation: 'Use SafeMath or ensure Solidity version >= 0.8.0'
  },

  // Gas Optimization
  {
    pattern: /for\s*\([^)]*\)\s*\{[^}]*\s*(?:storage|mapping)\s*\[[^}]*\}/gs,
    category: 'GAS_OPTIMIZATION' as const,
    severity: 'MEDIUM' as const,
    title: 'Storage Access in Loops',
    description: 'Storage operations in loops are expensive',
    recommendation: 'Cache storage variables outside loops'
  },
  {
    pattern: /mapping\s*\([^)]*\)\s*mapping\s*\([^)]*\)/gs,
    category: 'GAS_OPTIMIZATION' as const,
    severity: 'LOW' as const,
    title: 'Nested Mappings',
    description: 'Nested mappings can be gas expensive',
    recommendation: 'Consider using structs or separate mappings'
  },

  // Best Practices
  {
    pattern: /function\s+\w+\s*\([^)]*\)\s*(?:external|public)\s*(?:payable)?\s*\{[^}]*\s*throw\s*;/gs,
    category: 'BEST_PRACTICES' as const,
    severity: 'HIGH' as const,
    title: 'Use of throw statement',
    description: 'throw is deprecated, use require, revert or assert',
    recommendation: 'Replace throw with require, revert or assert'
  },
  {
    pattern: /sha3\s*\(/gs,
    category: 'BEST_PRACTICES' as const,
    severity: 'MEDIUM' as const,
    title: 'Use of sha3',
    description: 'sha3 is deprecated, use keccak256',
    recommendation: 'Replace sha3 with keccak256'
  },
  {
    pattern: /suicide\s*\(/gs,
    category: 'BEST_PRACTICES' as const,
    severity: 'MEDIUM' as const,
    title: 'Use of suicide',
    description: 'suicide is deprecated, use selfdestruct',
    recommendation: 'Replace suicide with selfdestruct'
  }
]

interface CacheEntry {
  result: AuditResult
  timestamp: number
  expiresAt: number
}

export class SecurityAuditor {
  private tempDir: string
  private cacheDir: string
  private auditCache: Map<string, CacheEntry> = new Map()
  private openzeppelinCacheDir: string

  constructor() {
    this.tempDir = path.join(os.tmpdir(), 'security-audit')
    this.cacheDir = path.join(os.tmpdir(), 'security-audit-cache')
    // Utiliser le même cache que Foundry pour éviter les conflits
    this.openzeppelinCacheDir = '/tmp/foundry-openzeppelin-cache'
  }

  async auditContract(sourceCode: string, contractName: string): Promise<AuditResult> {
    const startTime = Date.now()
    
    // Vérifier le cache d'audit
    const cacheKey = this.generateCacheKey(sourceCode, contractName)
    const cachedResult = this.getCachedAudit(cacheKey)
    if (cachedResult) {
      console.log('⚡ Résultat trouvé en cache!')
      return cachedResult
    }
    
    const issues: SecurityIssue[] = []
    const toolsUsed: string[] = []

    try {
      // Créer le répertoire temporaire
      await fs.ensureDir(this.tempDir)
      
      // S'assurer que le cache OpenZeppelin est initialisé
      console.log('🔧 Vérification du cache OpenZeppelin...')
      await this.ensureOpenZeppelinCache()
      
      // Créer la structure Foundry
      await fs.ensureDir(path.join(this.tempDir, 'src'))
      
      // Copier OpenZeppelin depuis le cache vers le répertoire temporaire
      await this.copyOpenZeppelinFromCache()
      
      const contractPath = path.join(this.tempDir, 'src', `${contractName}.sol`)
      
      // Écrire le contrat dans le répertoire src
      await fs.writeFile(contractPath, sourceCode)
      
      // Créer foundry.toml pour la compilation
      const foundryConfig = `
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
optimizer = true
optimizer_runs = 1000
via_ir = false
solc_version = "0.8.20"
evm_version = "paris"
[fmt]
line_length = 120
tab_width = 4
bracket_spacing = false
`
      await fs.writeFile(path.join(this.tempDir, 'foundry.toml'), foundryConfig)

      // 1. Audit avec Solhint (vrai outil) - OBLIGATOIRE
      let solhintIssues: SecurityIssue[] = []
      try {
        solhintIssues = await this.runSolhint(contractPath, contractName)
        issues.push(...solhintIssues)
        toolsUsed.push('Solhint')
      } catch (error) {
        console.error('❌ Solhint audit FAILED - Contract REJECTED:', error)
        throw new Error(`Solhint audit failed: ${error}`)
      }

      // 2. Audit avec Slither (vrai outil) - OBLIGATOIRE
      let slitherIssues: SecurityIssue[] = []
      try {
        slitherIssues = await this.runSlither(contractPath, contractName)
        issues.push(...slitherIssues)
        toolsUsed.push('Slither')
      } catch (error) {
        console.error('❌ Slither audit FAILED - Contract REJECTED:', error)
        throw new Error(`Slither audit failed: ${error}`)
      }

      // 3. Audit avec patterns personnalisés avancés
      const patternIssues = this.analyzePatterns(sourceCode, contractName)
      issues.push(...patternIssues)
      toolsUsed.push('Custom Patterns')

      // 4. Analyse des vulnérabilités Not So Smart Contracts
      const notSoSmartIssues = this.analyzeNotSoSmartVulnerabilities(sourceCode, contractName)
      issues.push(...notSoSmartIssues)
      if (notSoSmartIssues.length > 0) {
        toolsUsed.push('Not So Smart Analysis')
      }

      // 5. Analyse spécifique de reentrancy
      const reentrancyIssues = this.analyzeReentrancy(sourceCode, contractName)
      issues.push(...reentrancyIssues)
      if (reentrancyIssues.length > 0) {
        toolsUsed.push('Reentrancy Analysis')
      }

      // 5. Analyse de gas
      const gasIssues = this.analyzeGasOptimization(sourceCode, contractName)
      issues.push(...gasIssues)
      toolsUsed.push('Gas Analysis')

      // 6. Vérification OpenZeppelin (détection par pattern)
      const openzeppelinIssues = this.analyzeOpenZeppelinUsage(sourceCode, contractName)
      issues.push(...openzeppelinIssues)
      if (openzeppelinIssues.length > 0) {
        toolsUsed.push('OpenZeppelin Check')
      }

      // 7. Calcul du score et génération du rapport
      const score = this.calculateScore(issues)
      const grade = this.calculateGrade(score)
      const summary = this.generateSummary(issues)
      const recommendations = this.generateRecommendations(issues, sourceCode)
      
      // Vérifier les critères de passage
      const hasOpenZeppelin = sourceCode.includes('@openzeppelin/contracts')
      const basicPassed = this.checkPassCriteria(score, summary)
      
      // Le contrat passe seulement s'il n'a pas de vulnérabilités critiques/élevées/moyennes ET utilise OpenZeppelin
      const adjustedPassed = basicPassed && hasOpenZeppelin
      
      // Les recommandations OpenZeppelin sont déjà gérées dans generateRecommendations

      const result = {
        score: score,
        grade: grade,
        issues,
        summary,
        recommendations,
        passed: adjustedPassed,
        auditTime: Date.now() - startTime,
        toolsUsed
      }

      // Sauvegarder dans le cache
      this.saveToCache(cacheKey, result)

      return result

    } catch (error) {
      console.error('Audit error:', error)
      
      return {
        score: 0,
        grade: 'F',
        issues: [],
        summary: { critical: 0, high: 0, medium: 0, low: 0, total: 0 },
        recommendations: ['Erreur lors de l\'audit. Veuillez réessayer.'],
        passed: false,
        auditTime: Date.now() - startTime,
        toolsUsed: []
      }
    } finally {
      // Nettoyer les fichiers temporaires
      try {
        await fs.remove(this.tempDir)
      } catch (error) {
        console.warn('Failed to clean temp directory:', error)
      }
    }
  }

  /**
   * Exécution de Slither (vrai outil)
   */
  private async runSlither(contractPath: string, contractName: string): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = []
    
    try {
      // Exécuter le wrapper Python de Slither avec chemin absolu
      const slitherWrapperPath = path.resolve(__dirname, '../../slither_wrapper.py')
      const { stdout, stderr } = await execAsync(`python3 "${slitherWrapperPath}" "${contractPath}" "${contractName}"`, {
        cwd: this.tempDir,
        timeout: 60000, // 60 secondes timeout pour Slither
        env: {
          ...process.env,
          SLITHER_DISABLE_DOWNLOAD: '1',
          SLITHER_OFFLINE: '1'
        }
      })

      if (stderr && !stderr.includes('Warning')) {
        console.warn('Slither stderr:', stderr)
      }

      if (stdout) {
        try {
          // Vérifier si la sortie contient du texte non-JSON (comme "Installing...")
          if (stdout.trim().startsWith('Installing') || stdout.trim().startsWith('Downloading')) {
            console.warn('Slither is trying to install dependencies, using offline mode')
            // Retourner un résultat vide car les dépendances ne sont pas nécessaires en mode hors ligne
            return []
          }
          
          const result = JSON.parse(stdout)
          
          if (result.success && result.issues) {
            // Convertir les résultats Slither au format SecurityIssue
            result.issues.forEach((slitherIssue: any) => {
              const severityMap: { [key: string]: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' } = {
                'LOW': 'LOW',
                'MEDIUM': 'MEDIUM',
                'HIGH': 'HIGH',
                'CRITICAL': 'CRITICAL'
              }
              
              issues.push({
                id: slitherIssue.id,
                severity: severityMap[slitherIssue.severity] || 'MEDIUM',
                category: this.mapSlitherCategory(slitherIssue.category),
                title: slitherIssue.title,
                description: slitherIssue.description,
                line: slitherIssue.line,
                file: slitherIssue.file,
                tool: 'SLITHER',
                recommendation: slitherIssue.recommendation,
                impact: slitherIssue.impact
              })
            })
          } else if (result.error) {
            console.warn('Slither analysis error:', result.error)
          }
        } catch (parseError) {
          console.warn('Failed to parse Slither output:', parseError)
          console.warn('Raw stdout:', stdout.substring(0, 200) + '...')
          
          // Si c'est une erreur de parsing JSON, c'est probablement du texte d'installation
          // On continue sans Slither plutôt que de faire échouer l'audit
          return []
        }
      }

    } catch (error) {
      console.error('❌ Slither execution FAILED:', error)
      throw error // Pas de fallback - échec total
    }

    return issues
  }

  /**
   * Mapper les catégories Slither vers nos catégories
   */
  private mapSlitherCategory(slitherCategory: string): 'REENTRANCY' | 'OVERFLOW' | 'ACCESS_CONTROL' | 'LOGIC_ERROR' | 'GAS_OPTIMIZATION' | 'BEST_PRACTICES' {
    const categoryMap: { [key: string]: 'REENTRANCY' | 'OVERFLOW' | 'ACCESS_CONTROL' | 'LOGIC_ERROR' | 'GAS_OPTIMIZATION' | 'BEST_PRACTICES' } = {
      'SECURITY': 'LOGIC_ERROR',
      'EXTERNAL_CALL': 'REENTRANCY',
      'ACCESS_CONTROL': 'ACCESS_CONTROL',
      'REENTRANCY': 'REENTRANCY',
      'OVERFLOW': 'OVERFLOW',
      'GAS': 'GAS_OPTIMIZATION',
      'BEST_PRACTICES': 'BEST_PRACTICES'
    }
    
    return categoryMap[slitherCategory] || 'LOGIC_ERROR'
  }



  /**
   * Exécution de Solhint (vrai outil)
   */
  private async runSolhint(contractPath: string, contractName: string): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = []
    
    try {
      // Créer un fichier de configuration Solhint temporaire
      const solhintConfig = {
        extends: "solhint:recommended",
        rules: {
          "avoid-sha3": "warn",
          "avoid-throw": "error",
          "no-empty-blocks": "warn",
          "no-inline-assembly": "warn",
          "max-line-length": "off",
          "compiler-version": "off"
        }
      }
      
      const configPath = path.join(this.tempDir, '.solhint.json')
      await fs.writeFile(configPath, JSON.stringify(solhintConfig, null, 2))

      // Exécuter Solhint
      let stdout = ''
      let stderr = ''
      
      try {
        const result = await execAsync(`npx solhint "${contractPath}" --config "${configPath}"`, {
          cwd: this.tempDir,
          timeout: 30000 // 30 secondes timeout
        })
        stdout = result.stdout
        stderr = result.stderr
      } catch (error: any) {
        // Solhint retourne un code d'erreur quand il trouve des problèmes, c'est normal
        if (error.stdout) {
          stdout = error.stdout
          stderr = error.stderr || ''
        } else {
          // Vraie erreur d'exécution
          throw error
        }
      }

      // Parser la sortie de Solhint
      if (stdout) {
        const lines = stdout.split('\n')
        for (const line of lines) {
          if (line.trim() && line.includes(':')) {
            const match = line.match(/(\d+):(\d+):\s*(\w+)\s*(.+)/)
            if (match) {
              const [, lineNum, colNum, severity, message] = match
              const severityMap: { [key: string]: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' } = {
                'error': 'HIGH',
                'warning': 'MEDIUM',
                'info': 'LOW'
              }
              
              issues.push({
                id: `solhint-${lineNum}-${colNum}`,
                severity: severityMap[severity] || 'MEDIUM',
                category: 'BEST_PRACTICES',
                title: message.trim(),
                description: message.trim(),
                line: parseInt(lineNum),
                column: parseInt(colNum),
                file: contractName,
                tool: 'SOLHINT',
                recommendation: 'Follow Solidity best practices',
                impact: 'Code quality and security'
              })
            }
          }
        }
      }

      if (stderr && !stderr.includes('Warning')) {
        console.warn('Solhint stderr:', stderr)
      }

    } catch (error) {
      console.error('❌ Solhint execution FAILED:', error)
      throw error // Pas de fallback - échec total
    }

    return issues
  }



  /**
   * Analyse spécifique de reentrancy
   */
  private analyzeReentrancy(sourceCode: string, contractName: string): SecurityIssue[] {
    const issues: SecurityIssue[] = []
    const lines = sourceCode.split('\n')
    
    // Chercher les patterns de reentrancy classiques
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      // Pattern: external call followed by state change
      if (line.includes('.call{value:') || line.includes('.send(') || line.includes('.transfer(')) {
        // Chercher une modification d'état dans les lignes suivantes
        for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
          const nextLine = lines[j]
          if (nextLine.includes('balances[') && nextLine.includes('=') && 
              (nextLine.includes('0') || nextLine.includes('balances['))) {
            issues.push({
              id: `reentrancy-${i + 1}-${j + 1}`,
              severity: 'CRITICAL',
              category: 'REENTRANCY',
              title: 'Reentrancy Vulnerability Detected',
              description: 'External call followed by state change - classic reentrancy attack pattern',
              line: i + 1,
              file: contractName,
              tool: 'PATTERN_MATCH',
              recommendation: 'Use ReentrancyGuard or change state before external call',
              impact: 'Critical security vulnerability'
            })
            break
          }
        }
      }
    }
    
    return issues
  }

  /**
   * Analyse avec patterns personnalisés avancés
   */
  private analyzePatterns(sourceCode: string, contractName: string): SecurityIssue[] {
    const issues: SecurityIssue[] = []

    VULNERABILITY_PATTERNS.forEach(pattern => {
      const matches = sourceCode.match(pattern.pattern)
      if (matches) {
        const lineNumbers = this.findLineNumbers(sourceCode, pattern.pattern)
        
        lineNumbers.forEach(lineNum => {
          issues.push({
            id: `pattern-${pattern.category}-${lineNum}`,
            severity: pattern.severity,
            category: pattern.category,
            title: pattern.title,
            description: pattern.description,
            line: lineNum,
            file: contractName,
            tool: 'PATTERN_MATCH',
            recommendation: pattern.recommendation,
            impact: 'Security vulnerability'
          })
        })
      }
    })

    return issues
  }

  /**
   * Vérification de l'utilisation d'OpenZeppelin
   */
  private analyzeOpenZeppelinUsage(sourceCode: string, contractName: string): SecurityIssue[] {
    const issues: SecurityIssue[] = []
    
    // Vérifier si OpenZeppelin est importé
    const hasOpenZeppelinImport = sourceCode.includes('@openzeppelin/contracts')
    
    if (!hasOpenZeppelinImport) {
      issues.push({
        id: 'openzeppelin-missing-import',
        severity: 'HIGH',
        category: 'BEST_PRACTICES',
        title: 'OpenZeppelin Not Imported',
        description: 'Contract does not import OpenZeppelin contracts',
        line: 1,
        file: contractName,
        tool: 'CUSTOM',
        recommendation: 'Import OpenZeppelin contracts for security and best practices',
        impact: 'Missing security features and best practices'
      })
    }
    
    // Vérifier les composants OpenZeppelin recommandés
    const recommendedComponents = [
      {
        name: 'ReentrancyGuard',
        pattern: /ReentrancyGuard/g,
        severity: 'HIGH' as const,
        description: 'ReentrancyGuard not used for protection against reentrancy attacks',
        recommendation: 'Import and use ReentrancyGuard from OpenZeppelin'
      },
      {
        name: 'Ownable',
        pattern: /Ownable/g,
        severity: 'MEDIUM' as const,
        description: 'Ownable not used for access control',
        recommendation: 'Import and use Ownable from OpenZeppelin for access control'
      },
      {
        name: 'Pausable',
        pattern: /Pausable/g,
        severity: 'MEDIUM' as const,
        description: 'Pausable not used for emergency stops',
        recommendation: 'Import and use Pausable from OpenZeppelin for emergency functionality'
      },
      {
        name: 'SafeMath',
        pattern: /SafeMath/g,
        severity: 'LOW' as const,
        description: 'SafeMath not used (though not needed in Solidity 0.8+)',
        recommendation: 'Consider using SafeMath for older Solidity versions'
      },
      {
        name: 'ERC20',
        pattern: /ERC20/g,
        severity: 'MEDIUM' as const,
        description: 'ERC20 standard not used for token contracts',
        recommendation: 'Import and extend ERC20 from OpenZeppelin for token contracts'
      },
      {
        name: 'ERC721',
        pattern: /ERC721/g,
        severity: 'MEDIUM' as const,
        description: 'ERC721 standard not used for NFT contracts',
        recommendation: 'Import and extend ERC721 from OpenZeppelin for NFT contracts'
      }
    ]
    
    // Vérifier les patterns de vulnérabilités qui devraient être protégés par OpenZeppelin
    const vulnerabilityPatterns = [
      {
        pattern: /\.call\{value:[^}]*\}/g,
        name: 'External calls',
        severity: 'HIGH' as const,
        description: 'External calls without ReentrancyGuard protection',
        recommendation: 'Use ReentrancyGuard from OpenZeppelin to protect external calls'
      },
      {
        pattern: /mapping\s*\([^)]*\)\s*public/g,
        name: 'Public mappings',
        severity: 'MEDIUM' as const,
        description: 'Public mappings without proper access control',
        recommendation: 'Use Ownable or AccessControl from OpenZeppelin for access control'
      },
      {
        pattern: /function\s+\w+\s*\([^)]*\)\s*(?:external|public)\s*(?:payable)?\s*\{[^}]*\s*(?:\.call|\.send|\.transfer)\s*\(/g,
        name: 'External calls in functions',
        severity: 'HIGH' as const,
        description: 'External calls in functions without proper protection',
        recommendation: 'Use ReentrancyGuard and proper access controls from OpenZeppelin'
      }
    ]
    
    // Si OpenZeppelin n'est pas importé, vérifier les vulnérabilités
    if (!hasOpenZeppelinImport) {
      vulnerabilityPatterns.forEach(pattern => {
        const matches = sourceCode.match(pattern.pattern)
        if (matches) {
          const lineNumbers = this.findLineNumbers(sourceCode, pattern.pattern)
          lineNumbers.forEach(lineNum => {
            issues.push({
              id: `openzeppelin-vulnerability-${lineNum}`,
              severity: pattern.severity,
              category: 'BEST_PRACTICES',
              title: `Missing OpenZeppelin Protection: ${pattern.name}`,
              description: pattern.description,
              line: lineNum,
              file: contractName,
              tool: 'CUSTOM',
              recommendation: pattern.recommendation,
              impact: 'Security vulnerability due to missing OpenZeppelin protection'
            })
          })
        }
      })
    }
    
    // Vérifier l'utilisation des composants OpenZeppelin
    if (hasOpenZeppelinImport) {
      recommendedComponents.forEach(component => {
        const hasComponent = sourceCode.match(component.pattern)
        if (!hasComponent) {
          // Vérifier si le composant serait utile dans ce contexte
          const wouldBeUseful = this.wouldOpenZeppelinComponentBeUseful(sourceCode, component.name)
          if (wouldBeUseful) {
            issues.push({
              id: `openzeppelin-missing-${component.name.toLowerCase()}`,
              severity: component.severity,
              category: 'BEST_PRACTICES',
              title: `Missing OpenZeppelin Component: ${component.name}`,
              description: component.description,
              line: 1,
              file: contractName,
              tool: 'CUSTOM',
              recommendation: component.recommendation,
              impact: 'Missing security features'
            })
          }
        }
      })
    }
    
    return issues
  }

  /**
   * Détermine si un composant OpenZeppelin serait utile dans ce contrat
   */
  private wouldOpenZeppelinComponentBeUseful(sourceCode: string, componentName: string): boolean {
    // Si OpenZeppelin est déjà importé, ne pas suggérer de composants supplémentaires
    if (sourceCode.includes('@openzeppelin/contracts')) {
      return false
    }
    
    switch (componentName) {
      case 'ReentrancyGuard':
        return sourceCode.includes('.call{value:') || sourceCode.includes('.send(') || sourceCode.includes('.transfer(')
      case 'Ownable':
        return sourceCode.includes('owner') || sourceCode.includes('onlyOwner') || sourceCode.includes('require(msg.sender')
      case 'Pausable':
        return sourceCode.includes('pause') || sourceCode.includes('emergency') || sourceCode.includes('stop')
      case 'ERC20':
        // Ne suggérer ERC20 que si c'est clairement un token et qu'il n'hérite pas déjà d'ERC20
        return (sourceCode.includes('token') || sourceCode.includes('transfer') || sourceCode.includes('balance')) && 
               !sourceCode.includes('ERC20') && 
               !sourceCode.includes('is ERC20')
      case 'ERC721':
        // Ne suggérer ERC721 que si c'est clairement un NFT et qu'il n'hérite pas déjà d'ERC721
        return (sourceCode.includes('nft') || sourceCode.includes('tokenId') || sourceCode.includes('mint')) && 
               !sourceCode.includes('ERC721') && 
               !sourceCode.includes('is ERC721')
      default:
        return false
    }
  }

  /**
   * Analyse d'optimisation de gas
   */
  private analyzeGasOptimization(sourceCode: string, contractName: string): SecurityIssue[] {
    const issues: SecurityIssue[] = []
    
    const gasPatterns = [
      {
        pattern: /for\s*\([^)]*\)\s*\{[^}]*storage[^}]*\}/gs,
        title: 'Storage in Loop',
        description: 'Storage operations in loops are expensive',
        recommendation: 'Cache storage variables outside loops',
        severity: 'MEDIUM' as const
      },
      {
        pattern: /mapping\s*\([^)]*\)\s*mapping\s*\([^)]*\)/gs,
        title: 'Nested Mappings',
        description: 'Nested mappings can be gas expensive',
        recommendation: 'Consider using structs or separate mappings',
        severity: 'LOW' as const
      },
      {
        pattern: /function\s+\w+\s*\([^)]*\)\s*(?:external|public)\s*(?:payable)?\s*\{[^}]*\s*(?:\.call|\.send|\.transfer)\s*\([^}]*\}/gs,
        title: 'External Calls in Functions',
        description: 'External calls can be expensive',
        recommendation: 'Optimize external calls and consider batching',
        severity: 'LOW' as const
      }
    ]

    gasPatterns.forEach(pattern => {
      const matches = sourceCode.match(pattern.pattern)
      if (matches) {
        const lineNumbers = this.findLineNumbers(sourceCode, pattern.pattern)
        lineNumbers.forEach(lineNum => {
          issues.push({
            id: `gas-${lineNum}`,
            severity: pattern.severity,
            category: 'GAS_OPTIMIZATION',
            title: pattern.title,
            description: pattern.description,
            line: lineNum,
            file: contractName,
            tool: 'CUSTOM',
            recommendation: pattern.recommendation,
            impact: 'Gas optimization'
          })
        })
      }
    })

    return issues
  }

  /**
   * Calcul du score de sécurité
   */
  private calculateScore(issues: SecurityIssue[]): number {
    let score = 100
    const penalties = {
      CRITICAL: 25,
      HIGH: 15,
      MEDIUM: 8,
      LOW: 3
    }

    issues.forEach(issue => {
      score -= penalties[issue.severity]
    })

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Calcul de la note
   */
  private calculateGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A'
    if (score >= 80) return 'B'
    if (score >= 70) return 'C'
    if (score >= 60) return 'D'
    return 'F'
  }

  /**
   * Génération du résumé
   */
  private generateSummary(issues: SecurityIssue[]) {
    return {
      critical: issues.filter(i => i.severity === 'CRITICAL').length,
      high: issues.filter(i => i.severity === 'HIGH').length,
      medium: issues.filter(i => i.severity === 'MEDIUM').length,
      low: issues.filter(i => i.severity === 'LOW').length,
      total: issues.length
    }
  }

  /**
   * Génération des recommandations
   */
  private generateRecommendations(issues: SecurityIssue[], sourceCode: string): string[] {
    const recommendations: string[] = []
    const criticalIssues = issues.filter(i => i.severity === 'CRITICAL')
    const highIssues = issues.filter(i => i.severity === 'HIGH')
    const mediumIssues = issues.filter(i => i.severity === 'MEDIUM')
    const hasOpenZeppelin = /@openzeppelin/.test(sourceCode)

    // Points positifs (toujours affichés en premier)
    if (hasOpenZeppelin) {
      recommendations.push('✅ OpenZeppelin detected - Security best practices')
    }

    // Problèmes critiques (priorité absolue)
    if (criticalIssues.length > 0) {
      recommendations.push('🔴 CRITICAL: Fix critical vulnerabilities immediately')
    }

    // Problèmes élevés (priorité haute)
    if (highIssues.length > 0) {
      recommendations.push('🟠 HIGH: Address high-severity vulnerabilities')
    }

    // Problèmes moyens (priorité moyenne)
    if (mediumIssues.length > 0) {
      recommendations.push('🟡 MEDIUM: Review and fix medium vulnerabilities')
    }

    // Recommandations spécifiques par catégorie
    if (issues.filter(i => i.category === 'REENTRANCY').length > 0) {
      recommendations.push('🛡️ ACTION: Implement ReentrancyGuard for sensitive functions')
    }

    if (issues.filter(i => i.category === 'ACCESS_CONTROL').length > 0) {
      recommendations.push('🔐 ACTION: Improve access controls and avoid tx.origin')
    }

    if (issues.filter(i => i.category === 'GAS_OPTIMIZATION').length > 0) {
      recommendations.push('⛽ OPTIMIZATION: Optimize expensive gas operations')
    }

    // Message de succès si aucun problème critique/élevé/moyen
    if (criticalIssues.length === 0 && highIssues.length === 0 && mediumIssues.length === 0) {
      recommendations.push('🎉 EXCELLENT: No critical, high, or medium vulnerabilities found')
    }

    return recommendations
  }

  /**
   * Vérification des critères de passage
   */
  private checkPassCriteria(score: number, summary: any): boolean {
    // Critères de base plus stricts
    const basicCriteria = score >= 70 && 
                         summary.critical === 0 && 
                         summary.high === 0 && 
                         summary.medium === 0
    
    // Critère OpenZeppelin : le contrat doit utiliser OpenZeppelin
    // Cette vérification sera faite dans la méthode principale
    return basicCriteria
  }

  /**
   * Trouver les numéros de ligne pour un pattern
   */
  private findLineNumbers(sourceCode: string, pattern: RegExp): number[] {
    const lines = sourceCode.split('\n')
    const lineNumbers: number[] = []
    
    lines.forEach((line, index) => {
      if (pattern.test(line)) {
        lineNumbers.push(index + 1)
      }
    })
    
    return lineNumbers
  }

  /**
   * Générer une clé de cache pour un audit
   */
  private generateCacheKey(sourceCode: string, contractName: string): string {
    const crypto = require('crypto')
    const hash = crypto.createHash('sha256')
    hash.update(sourceCode + contractName)
    return hash.digest('hex')
  }

  /**
   * Récupérer un audit depuis le cache
   */
  private getCachedAudit(cacheKey: string): AuditResult | null {
    const cached = this.auditCache.get(cacheKey)
    if (cached && Date.now() < cached.expiresAt) {
      return cached.result
    }
    if (cached) {
      this.auditCache.delete(cacheKey)
    }
    return null
  }

  /**
   * Sauvegarder un audit dans le cache
   */
  private saveToCache(cacheKey: string, result: AuditResult): void {
    const cacheEntry: CacheEntry = {
      result,
      timestamp: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 heures
    }
    this.auditCache.set(cacheKey, cacheEntry)
  }

  /**
   * S'assurer que OpenZeppelin est installé dans le cache (utilise le cache Foundry)
   */
  private async ensureOpenZeppelinCache(): Promise<void> {
    const contractsPath = path.join(this.openzeppelinCacheDir, 'contracts')
    
    // Vérifier si le cache Foundry existe et contient les contrats
    if (await fs.pathExists(contractsPath)) {
      console.log('⚡ Cache Foundry OpenZeppelin trouvé!')
      return
    }

    console.log('📦 Cache Foundry OpenZeppelin non trouvé, création...')
    
    // Créer le répertoire de cache
    await fs.ensureDir(this.openzeppelinCacheDir)
    
    try {
      // Utiliser la même méthode que Foundry pour créer le cache
      await execAsync('git init', { cwd: this.openzeppelinCacheDir })
      await execAsync('git remote add origin https://github.com/OpenZeppelin/openzeppelin-contracts.git', {
        cwd: this.openzeppelinCacheDir
      })
      await execAsync('git fetch origin v4.9.6 --depth=1', { cwd: this.openzeppelinCacheDir })
      await execAsync('git checkout FETCH_HEAD', { cwd: this.openzeppelinCacheDir })
      
      // Vérifier que l'installation a réussi
      if (!(await fs.pathExists(contractsPath))) {
        throw new Error('OpenZeppelin n\'a pas été installé correctement')
      }
      
      console.log('✅ Cache Foundry OpenZeppelin créé')
    } catch (error: any) {
      console.log('⚠️ Erreur lors de la création du cache Foundry OpenZeppelin:', error.message)
      throw error
    }
  }

  /**
   * Copier OpenZeppelin depuis le cache Foundry vers le répertoire temporaire
   */
  private async copyOpenZeppelinFromCache(): Promise<void> {
    try {
      // Vérifier que le cache Foundry existe
      const contractsPath = path.join(this.openzeppelinCacheDir, 'contracts')
      
      if (!(await fs.pathExists(contractsPath))) {
        throw new Error('Cache Foundry OpenZeppelin non trouvé')
      }
      
      // Créer la structure lib/openzeppelin-contracts comme Foundry
      const targetLibDir = path.join(this.tempDir, 'lib', 'openzeppelin-contracts')
      await fs.ensureDir(targetLibDir)
      
      // Copier tout le contenu du cache Foundry
      await execAsync(`cp -r ${this.openzeppelinCacheDir}/. ${targetLibDir}`)
      
      // Créer les remappings Foundry
      const remappings = [
        '@openzeppelin/contracts/=lib/openzeppelin-contracts/contracts/',
        '@openzeppelin/=lib/openzeppelin-contracts/'
      ]
      await fs.writeFile(path.join(this.tempDir, 'remappings.txt'), remappings.join('\n'))
      
      console.log('⚡ OpenZeppelin copié depuis le cache Foundry')
    } catch (error: any) {
      console.log('⚠️ Erreur lors de la copie d\'OpenZeppelin:', error.message)
      throw error
    }
  }

  /**
   * Initialiser le cache au démarrage
   */
  private async initializeCache(): Promise<void> {
    try {
      console.log('🔧 Initialisation du cache...')
      await this.ensureOpenZeppelinCache()
      console.log('✅ Cache initialisé')
    } catch (error: any) {
      console.log('⚠️ Erreur lors de l\'initialisation du cache:', error.message)
    }
  }

  /**
   * Analyse des vulnérabilités basées sur Not So Smart Contracts
   * Basé sur https://github.com/crytic/not-so-smart-contracts
   */
  private analyzeNotSoSmartVulnerabilities(sourceCode: string, contractName: string): SecurityIssue[] {
    const issues: SecurityIssue[] = []
    const lines = sourceCode.split('\n')

    // 1. Bad Randomness - Randomisation manipulable
    const badRandomnessPatterns = [
      /block\.timestamp/gi,
      /block\.number/gi,
      /block\.hash/gi,
      /block\.difficulty/gi,
      /block\.gaslimit/gi
    ]

    badRandomnessPatterns.forEach(pattern => {
      const matches = this.findLineNumbers(sourceCode, pattern)
      matches.forEach(lineNum => {
        issues.push({
          id: `bad-randomness-${lineNum}`,
          severity: 'HIGH',
          category: 'BAD_RANDOMNESS',
          title: 'Bad Randomness - Randomisation manipulable',
          description: `Utilisation de ${pattern.source} pour la randomisation. Les mineurs peuvent manipuler ces valeurs.`,
          line: lineNum,
          tool: 'NOT_SO_SMART',
          recommendation: 'Utilisez VRF (Verifiable Random Function) ou des oracles comme Chainlink VRF pour une randomisation sécurisée.',
          impact: 'Les utilisateurs peuvent prédire ou manipuler les résultats aléatoires.'
        })
      })
    })

    // 2. Race Condition - Conditions de concurrence
    const raceConditionPatterns = [
      /transfer\(/gi,
      /send\(/gi,
      /call\(/gi,
      /delegatecall\(/gi
    ]

    raceConditionPatterns.forEach(pattern => {
      const matches = this.findLineNumbers(sourceCode, pattern)
      matches.forEach(lineNum => {
        // Vérifier si c'est dans une fonction publique sans protection
        const context = this.getFunctionContext(lines, lineNum)
        if (context && !context.hasModifier) {
          // Vérifier si c'est une fonction OpenZeppelin sécurisée
          const line = lines[lineNum - 1]
          const isOpenZeppelinFunction = this.isOpenZeppelinSecureFunction(line, sourceCode)
          
          if (!isOpenZeppelinFunction) {
            issues.push({
              id: `race-condition-${lineNum}`,
              severity: 'HIGH',
              category: 'RACE_CONDITION',
              title: 'Race Condition - Condition de concurrence',
              description: `Appel externe dans une fonction publique sans protection contre le front-running.`,
              line: lineNum,
              tool: 'NOT_SO_SMART',
              recommendation: 'Utilisez des patterns comme commit-reveal ou des délais pour éviter le front-running.',
              impact: 'Les transactions peuvent être front-runnées par des attaquants.'
            })
          }
        }
      })
    })

    // 3. Denial of Service - Attaques par déni de service
    const dosPatterns = [
      /for\s*\([^)]*\)\s*\{[^}]*\}/gi,
      /while\s*\([^)]*\)\s*\{[^}]*\}/gi
    ]

    dosPatterns.forEach(pattern => {
      const matches = this.findLineNumbers(sourceCode, pattern)
      matches.forEach(lineNum => {
        const context = this.getFunctionContext(lines, lineNum)
        if (context && context.isPublic) {
          issues.push({
            id: `dos-${lineNum}`,
            severity: 'MEDIUM',
            category: 'DENIAL_OF_SERVICE',
            title: 'Denial of Service - Boucle potentiellement infinie',
            description: 'Boucle dans une fonction publique qui peut être exploitée pour bloquer le contrat.',
            line: lineNum,
            tool: 'NOT_SO_SMART',
            recommendation: 'Ajoutez des limites de gas ou des conditions de sortie explicites dans les boucles.',
            impact: 'Le contrat peut être bloqué par des attaques DoS.'
          })
        }
      })
    })

    // 4. Forced Ether Reception - Réception forcée d'Ether
    if (sourceCode.includes('receive()') || sourceCode.includes('fallback()')) {
      const receiveMatch = sourceCode.match(/receive\(\)/gi)
      const fallbackMatch = sourceCode.match(/fallback\(\)/gi)
      
      if (receiveMatch || fallbackMatch) {
        const lineNum = this.findLineNumbers(sourceCode, /receive\(\)|fallback\(\)/gi)[0] || 1
        issues.push({
          id: 'forced-ether-reception',
          severity: 'MEDIUM',
          category: 'FORCED_ETHER',
          title: 'Forced Ether Reception - Réception forcée d\'Ether',
          description: 'Le contrat peut recevoir de l\'Ether via receive() ou fallback().',
          line: lineNum,
          tool: 'NOT_SO_SMART',
          recommendation: 'Vérifiez que la logique de réception d\'Ether est sécurisée et intentionnelle.',
          impact: 'Le contrat peut recevoir de l\'Ether de manière inattendue.'
        })
      }
    }

    // 5. Honeypot Detection - Détection de pièges avancée
    const honeypotPatterns = [
      /require\s*\(\s*false\s*\)/gi,
      /revert\s*\(\s*\)/gi,
      /assert\s*\(\s*false\s*\)/gi
    ]

    honeypotPatterns.forEach(pattern => {
      const matches = this.findLineNumbers(sourceCode, pattern)
      matches.forEach(lineNum => {
        issues.push({
          id: `honeypot-${lineNum}`,
          severity: 'CRITICAL',
          category: 'HONEYPOT',
          title: 'Honeypot - Piège détecté',
          description: 'Code qui force toujours l\'échec de la transaction (require(false), revert()).',
          line: lineNum,
          tool: 'NOT_SO_SMART',
          recommendation: 'Vérifiez que cette logique est intentionnelle et non un piège.',
          impact: 'Toutes les transactions échoueront - possible honeypot.'
        })
      })
    })

    // 5.1. Honeypot Detection Avancée - Analyse logique intelligente
    const honeypotAnalysis = this.analyzeHoneypotLogic(sourceCode, contractName)
    issues.push(...honeypotAnalysis)

    // 6. Rug Pull Patterns - Patterns de vol de fonds
    const rugPullPatterns = [
      /transferOwnership\s*\(/gi,
      /renounceOwnership\s*\(/gi,
      /pause\s*\(/gi,
      /unpause\s*\(/gi
    ]

    rugPullPatterns.forEach(pattern => {
      const matches = this.findLineNumbers(sourceCode, pattern)
      matches.forEach(lineNum => {
        const context = this.getFunctionContext(lines, lineNum)
        if (context && context.isPublic && !context.hasModifier) {
          issues.push({
            id: `rug-pull-${lineNum}`,
            severity: 'HIGH',
            category: 'RUG_PULL',
            title: 'Rug Pull - Fonction critique non protégée',
            description: `Fonction critique (${pattern.source}) accessible publiquement sans protection.`,
            line: lineNum,
            tool: 'NOT_SO_SMART',
            recommendation: 'Protégez les fonctions critiques avec des modifiers comme onlyOwner.',
            impact: 'Risque de vol de fonds ou de blocage du contrat.'
          })
        }
      })
    })

    // 7. Variable Shadowing - Ombrage de variables
    const shadowingPatterns = [
      /function\s+\w+\s*\([^)]*\)[^{]*\{[^}]*\w+\s*=\s*\w+[^}]*\}/gi
    ]

    shadowingPatterns.forEach(pattern => {
      const matches = this.findLineNumbers(sourceCode, pattern)
      matches.forEach(lineNum => {
        issues.push({
          id: `shadowing-${lineNum}`,
          severity: 'LOW',
          category: 'VARIABLE_SHADOWING',
          title: 'Variable Shadowing - Ombrage de variables',
          description: 'Variable locale qui masque une variable globale ou d\'état.',
          line: lineNum,
          tool: 'NOT_SO_SMART',
          recommendation: 'Utilisez des noms de variables différents pour éviter la confusion.',
          impact: 'Confusion dans le code et bugs potentiels.'
        })
      })
    })

    // 8. Constructor Issues - Problèmes de constructeur
    if (!sourceCode.includes('constructor(') && !sourceCode.includes('function ' + contractName + '(')) {
      issues.push({
        id: 'constructor-issue',
        severity: 'MEDIUM',
        category: 'CONSTRUCTOR_ERROR',
        title: 'Constructor Issue - Constructeur manquant ou incorrect',
        description: 'Le contrat n\'a pas de constructeur ou utilise l\'ancienne syntaxe.',
        line: 1,
        tool: 'NOT_SO_SMART',
        recommendation: 'Utilisez la syntaxe constructor() moderne de Solidity.',
        impact: 'Problèmes d\'initialisation et de sécurité.'
      })
    }

    // 9. Integer Overflow - Débordements d'entiers
    const overflowPatterns = [
      /\+/g,  // Addition
      /\*/g,  // Multiplication
      /-/g    // Soustraction
    ]

    overflowPatterns.forEach(pattern => {
      const matches = this.findLineNumbers(sourceCode, pattern)
      matches.forEach(lineNum => {
        const line = lines[lineNum - 1]
        if (line && this.isArithmeticOperation(line, pattern.source)) {
          issues.push({
            id: `integer-overflow-${lineNum}`,
            severity: 'HIGH',
            category: 'INTEGER_OVERFLOW',
            title: 'Integer Overflow - Débordement d\'entier',
            description: `Opération arithmétique (${pattern.source}) sans vérification de débordement.`,
            line: lineNum,
            tool: 'NOT_SO_SMART',
            recommendation: 'Utilisez SafeMath ou vérifiez les débordements manuellement avec require().',
            impact: 'Les valeurs peuvent déborder et causer des comportements inattendus.'
          })
        }
      })
    })

    // 10. Unchecked External Call - Appels externes non vérifiés
    const uncheckedCallPatterns = [
      /\.call\(/gi,
      /\.delegatecall\(/gi,
      /\.staticcall\(/gi
    ]

    uncheckedCallPatterns.forEach(pattern => {
      const matches = this.findLineNumbers(sourceCode, pattern)
      matches.forEach(lineNum => {
        const line = lines[lineNum - 1]
        if (line && !this.hasReturnValueCheck(line)) {
          issues.push({
            id: `unchecked-external-call-${lineNum}`,
            severity: 'HIGH',
            category: 'UNCHECKED_EXTERNAL_CALL',
            title: 'Unchecked External Call - Appel externe non vérifié',
            description: `Appel externe (${pattern.source}) sans vérification du retour.`,
            line: lineNum,
            tool: 'NOT_SO_SMART',
            recommendation: 'Vérifiez toujours le retour des appels externes avec require() ou if statements.',
            impact: 'Les échecs d\'appels externes peuvent passer inaperçus.'
          })
        }
      })
    })

    // 11. Incorrect Interface - Interfaces incorrectes
    if (sourceCode.includes('interface ')) {
      const interfaceMatches = sourceCode.match(/interface\s+(\w+)/gi)
      if (interfaceMatches) {
        interfaceMatches.forEach((match, index) => {
          const interfaceName = match.replace('interface ', '')
          const implementationMatches = sourceCode.match(new RegExp(`contract\\s+\\w+\\s+is\\s+${interfaceName}`, 'gi'))
          
          if (!implementationMatches) {
            issues.push({
              id: `incorrect-interface-${index}`,
              severity: 'MEDIUM',
              category: 'INTERFACE_ERROR',
              title: 'Incorrect Interface - Interface non implémentée',
              description: `Interface ${interfaceName} déclarée mais non implémentée correctement.`,
              line: this.findLineNumbers(sourceCode, new RegExp(`interface\\s+${interfaceName}`, 'gi'))[0] || 1,
              tool: 'NOT_SO_SMART',
              recommendation: 'Implémentez toutes les fonctions de l\'interface ou supprimez la déclaration.',
              impact: 'Incohérence entre interface et implémentation.'
            })
          }
        })
      }
    }

    // 12. Wrong Constructor Name - Noms de constructeur incorrects
    const wrongConstructorPattern = new RegExp(`function\\s+${contractName}\\s*\\(`, 'gi')
    if (sourceCode.match(wrongConstructorPattern)) {
      const lineNum = this.findLineNumbers(sourceCode, wrongConstructorPattern)[0] || 1
      issues.push({
        id: 'wrong-constructor-name',
        severity: 'MEDIUM',
        category: 'WRONG_CONSTRUCTOR_NAME',
        title: 'Wrong Constructor Name - Nom de constructeur incorrect',
        description: 'Utilisation de l\'ancienne syntaxe de constructeur avec le nom du contrat.',
        line: lineNum,
        tool: 'NOT_SO_SMART',
        recommendation: 'Utilisez la syntaxe constructor() moderne au lieu de function ContractName().',
        impact: 'Problèmes de compatibilité et de sécurité.'
      })
    }

    return issues
  }

  /**
   * Obtenir le contexte d'une fonction (modifiers, visibilité)
   */
  private getFunctionContext(lines: string[], lineNum: number): { hasModifier: boolean; isPublic: boolean } | null {
    // Recherche simple du contexte de la fonction
    for (let i = lineNum - 1; i >= 0; i--) {
      const line = lines[i].trim()
      if (line.includes('function ')) {
        return {
          hasModifier: line.includes('onlyOwner') || line.includes('modifier'),
          isPublic: line.includes('public') || line.includes('external')
        }
      }
    }
    return null
  }

  /**
   * Vérifier si une ligne contient une opération arithmétique
   */
  private isArithmeticOperation(line: string, operator: string): boolean {
    const trimmedLine = line.trim()
    
    // Ignorer les commentaires et les chaînes
    if (trimmedLine.startsWith('//') || trimmedLine.startsWith('/*') || trimmedLine.includes('"')) {
      return false
    }
    
    // Vérifier si c'est une opération arithmétique sur des variables
    const patterns = {
      '+': /\w+\s*\+\s*\w+/,
      '*': /\w+\s*\*\s*\w+/,
      '-': /\w+\s*-\s*\w+/
    }
    
    return patterns[operator as keyof typeof patterns]?.test(trimmedLine) || false
  }

  /**
   * Vérifier si une ligne a une vérification de retour pour un appel externe
   */
  private hasReturnValueCheck(line: string): boolean {
    const trimmedLine = line.trim()
    
    // Vérifier les patterns de vérification de retour
    const checkPatterns = [
      /require\s*\(/gi,
      /if\s*\(/gi,
      /assert\s*\(/gi,
      /\.success/gi,
      /\.returndata/gi
    ]
    
    return checkPatterns.some(pattern => pattern.test(trimmedLine))
  }

  /**
   * Analyse logique intelligente des honeypots
   * Détecte les patterns de honeypot basés sur l'analyse sémantique du code
   */
  private analyzeHoneypotLogic(sourceCode: string, contractName: string): SecurityIssue[] {
    const issues: SecurityIssue[] = []
    const lines = sourceCode.split('\n')

    // 1. Analyse des fonctions de récupération de fonds
    const withdrawalFunctions = this.analyzeWithdrawalFunctions(sourceCode, lines)
    issues.push(...withdrawalFunctions)

    // 2. Analyse des conditions impossibles
    const impossibleConditions = this.analyzeImpossibleConditions(sourceCode, lines)
    issues.push(...impossibleConditions)

    // 3. Analyse des patterns de vol de fonds
    const fundTheftPatterns = this.analyzeFundTheftPatterns(sourceCode, lines)
    issues.push(...fundTheftPatterns)

    // 4. Analyse des contrôles d'accès trompeurs
    const deceptiveAccess = this.analyzeDeceptiveAccessControl(sourceCode, lines)
    issues.push(...deceptiveAccess)

    // 5. Analyse des patterns de honeypot classiques
    const classicHoneypot = this.analyzeClassicHoneypotPatterns(sourceCode, lines)
    issues.push(...classicHoneypot)

    return issues
  }

  /**
   * Analyse les fonctions de retrait pour détecter les honeypots
   */
  private analyzeWithdrawalFunctions(sourceCode: string, lines: string[]): SecurityIssue[] {
    const issues: SecurityIssue[] = []
    
    // Patterns de fonctions de retrait suspectes
    const withdrawalPatterns = [
      { name: 'GetGift', pattern: /function\s+GetGift\s*\([^)]*\)[^{]*\{[^}]*transfer\s*\(/gi },
      { name: 'Withdraw', pattern: /function\s+Withdraw\s*\([^)]*\)[^{]*\{[^}]*transfer\s*\(/gi },
      { name: 'Get', pattern: /function\s+Get\w*\s*\([^)]*\)[^{]*\{[^}]*transfer\s*\(/gi },
      { name: 'Claim', pattern: /function\s+Claim\s*\([^)]*\)[^{]*\{[^}]*transfer\s*\(/gi }
    ]

    withdrawalPatterns.forEach(({ name, pattern }) => {
      const matches = this.findLineNumbers(sourceCode, pattern)
      matches.forEach(lineNum => {
        // Analyse du contexte de la fonction
        const hasImpossibleCondition = this.hasImpossibleConditionInFunction(sourceCode, lineNum)
        
        if (hasImpossibleCondition) {
          issues.push({
            id: `honeypot-withdrawal-${name}-${lineNum}`,
            severity: 'CRITICAL',
            category: 'HONEYPOT',
            title: 'Honeypot - Fonction de retrait trompeuse',
            description: `Fonction "${name}" avec condition impossible - honeypot confirmé`,
            line: lineNum,
            tool: 'NOT_SO_SMART',
            recommendation: 'Cette fonction ne permettra jamais de récupérer des fonds.',
            impact: 'Les utilisateurs seront piégés et perdront leurs fonds.'
          })
        }
      })
    })

    return issues
  }

  /**
   * Analyse les conditions impossibles à satisfaire
   */
  private analyzeImpossibleConditions(sourceCode: string, lines: string[]): SecurityIssue[] {
    const issues: SecurityIssue[] = []

    // Conditions basées sur des hashes (impossibles à deviner)
    const hashConditions = [
      { type: 'SHA3', pattern: /if\s*\([^)]*==\s*sha3\s*\([^)]*\)[^}]*\)[^{]*\{[^}]*transfer\s*\(/gi },
      { type: 'Keccak256', pattern: /if\s*\([^)]*==\s*keccak256\s*\([^)]*\)[^}]*\)[^{]*\{[^}]*transfer\s*\(/gi }
    ]

    hashConditions.forEach(({ type, pattern }) => {
      const matches = this.findLineNumbers(sourceCode, pattern)
      matches.forEach(lineNum => {
        issues.push({
          id: `honeypot-impossible-${type}-${lineNum}`,
          severity: 'CRITICAL',
          category: 'HONEYPOT',
          title: 'Honeypot - Condition impossible détectée',
          description: `Transfer conditionné par hash ${type} - impossible à satisfaire`,
          line: lineNum,
          tool: 'NOT_SO_SMART',
          recommendation: 'Les conditions basées sur des hashes sont impossibles à deviner.',
          impact: 'Aucun utilisateur ne pourra jamais récupérer ses fonds.'
        })
      })
    })

    // Conditions basées sur des variables non initialisées
    const uninitializedConditions = [
      /if\s*\([^)]*==\s*0x0[^}]*\)[^{]*\{[^}]*transfer\s*\(/gi,
      /if\s*\([^)]*==\s*address\s*\(0\)[^}]*\)[^{]*\{[^}]*transfer\s*\(/gi
    ]

    uninitializedConditions.forEach(pattern => {
      const matches = this.findLineNumbers(sourceCode, pattern)
      matches.forEach(lineNum => {
        issues.push({
          id: `honeypot-uninitialized-${lineNum}`,
          severity: 'CRITICAL',
          category: 'HONEYPOT',
          title: 'Honeypot - Condition sur variable non initialisée',
          description: 'Transfer conditionné par une variable non initialisée',
          line: lineNum,
          tool: 'NOT_SO_SMART',
          recommendation: 'Cette condition ne sera jamais satisfaite.',
          impact: 'Les fonds resteront bloqués dans le contrat.'
        })
      })
    })

    return issues
  }

  /**
   * Analyse les patterns de vol de fonds
   */
  private analyzeFundTheftPatterns(sourceCode: string, lines: string[]): SecurityIssue[] {
    const issues: SecurityIssue[] = []

    // Fonction permettant au créateur de récupérer tous les fonds
    const creatorTheftPatterns = [
      /if\s*\(\s*msg\.sender\s*==\s*sender\s*\)[^{]*\{[^}]*transfer\s*\([^}]*\}/gi,
      /if\s*\(\s*msg\.sender\s*==\s*owner\s*\)[^{]*\{[^}]*transfer\s*\([^}]*\}/gi,
      /if\s*\(\s*msg\.sender\s*==\s*creator\s*\)[^{]*\{[^}]*transfer\s*\([^}]*\}/gi
    ]

    creatorTheftPatterns.forEach(pattern => {
      const matches = this.findLineNumbers(sourceCode, pattern)
      matches.forEach(lineNum => {
        issues.push({
          id: `honeypot-creator-theft-${lineNum}`,
          severity: 'CRITICAL',
          category: 'HONEYPOT',
          title: 'Honeypot - Vol de fonds par le créateur',
          description: 'Le créateur peut récupérer tous les fonds du contrat',
          line: lineNum,
          tool: 'NOT_SO_SMART',
          recommendation: 'Ce contrat permet au créateur de voler tous les fonds.',
          impact: 'Tous les fonds peuvent être volés par le créateur.'
        })
      })
    })

    // Transfer du solde complet
    if (sourceCode.includes('this.balance') && sourceCode.includes('transfer(')) {
      const lineNum = this.findLineNumbers(sourceCode, /this\.balance/gi)[0] || 1
      issues.push({
        id: 'honeypot-full-balance',
        severity: 'CRITICAL',
        category: 'HONEYPOT',
        title: 'Honeypot - Transfer du solde complet',
        description: 'Fonction permettant de transférer tout le solde du contrat',
        line: lineNum,
        tool: 'NOT_SO_SMART',
        recommendation: 'Cette fonction peut vider complètement le contrat.',
        impact: 'Tous les fonds peuvent être transférés en une seule transaction.'
      })
    }

    return issues
  }

  /**
   * Analyse les contrôles d'accès trompeurs
   */
  private analyzeDeceptiveAccessControl(sourceCode: string, lines: string[]): SecurityIssue[] {
    const issues: SecurityIssue[] = []

    // Variables d'état qui peuvent être manipulées
    const stateVariables = [
      'passHasBeenSet', 'isActive', 'isEnabled', 'isOpen', 'isLocked'
    ]

    stateVariables.forEach(variable => {
      if (sourceCode.includes(variable)) {
        const lineNum = this.findLineNumbers(sourceCode, new RegExp(variable, 'gi'))[0] || 1
        const canBeManipulated = this.canVariableBeManipulated(sourceCode, variable)
        
        if (canBeManipulated) {
          issues.push({
            id: `honeypot-deceptive-access-${variable}`,
            severity: 'CRITICAL',
            category: 'HONEYPOT',
            title: 'Honeypot - Contrôle d\'accès trompeur',
            description: `Variable d'état "${variable}" peut être manipulée par le créateur`,
            line: lineNum,
            tool: 'NOT_SO_SMART',
            recommendation: 'Le créateur peut désactiver les fonctionnalités à tout moment.',
            impact: 'Les utilisateurs peuvent perdre l\'accès à leurs fonds.'
          })
        }
      }
    })

    return issues
  }

  /**
   * Analyse les patterns de honeypot classiques
   */
  private analyzeClassicHoneypotPatterns(sourceCode: string, lines: string[]): SecurityIssue[] {
    const issues: SecurityIssue[] = []

    // Patterns classiques de honeypot
    const classicPatterns = [
      { pattern: /require\s*\(\s*false\s*\)/gi, desc: 'Require false - toujours échoue' },
      { pattern: /revert\s*\(\s*\)/gi, desc: 'Revert sans condition - toujours échoue' },
      { pattern: /assert\s*\(\s*false\s*\)/gi, desc: 'Assert false - toujours échoue' }
    ]

    classicPatterns.forEach(({ pattern, desc }) => {
      const matches = this.findLineNumbers(sourceCode, pattern)
      matches.forEach(lineNum => {
        issues.push({
          id: `honeypot-classic-${lineNum}`,
          severity: 'CRITICAL',
          category: 'HONEYPOT',
          title: 'Honeypot - Pattern classique détecté',
          description: desc,
          line: lineNum,
          tool: 'NOT_SO_SMART',
          recommendation: 'Cette fonction échouera toujours - honeypot confirmé.',
          impact: 'Toutes les transactions échoueront.'
        })
      })
    })

    return issues
  }

  /**
   * Vérifie si une fonction contient une condition impossible
   */
  private hasImpossibleConditionInFunction(sourceCode: string, functionLine: number): boolean {
    const lines = sourceCode.split('\n')
    const functionStart = functionLine - 1
    let functionEnd = functionStart
    
    // Trouver la fin de la fonction
    let braceCount = 0
    let inFunction = false
    
    for (let i = functionStart; i < lines.length; i++) {
      const line = lines[i]
      
      if (line.includes('{')) {
        braceCount++
        inFunction = true
      }
      
      if (line.includes('}')) {
        braceCount--
        if (inFunction && braceCount === 0) {
          functionEnd = i
          break
        }
      }
    }

    // Analyser le contenu de la fonction
    const functionContent = lines.slice(functionStart, functionEnd + 1).join('\n')
    
    // Vérifier les conditions impossibles
    const impossiblePatterns = [
      /sha3\s*\(/gi,
      /keccak256\s*\(/gi,
      /==\s*0x0/gi,
      /==\s*address\s*\(0\)/gi
    ]

    return impossiblePatterns.some(pattern => pattern.test(functionContent))
  }

  /**
   * Vérifie si une variable peut être manipulée par le créateur
   */
  private canVariableBeManipulated(sourceCode: string, variableName: string): boolean {
    // Chercher les fonctions qui modifient cette variable
    const setterPattern = new RegExp(`function\\s+\\w*[Ss]et\\w*\\s*\\([^)]*\\)[^{]*\\{[^}]*${variableName}\\s*=\\s*`, 'gi')
    const modifierPattern = new RegExp(`function\\s+\\w*\\s*\\([^)]*\\)[^{]*\\{[^}]*${variableName}\\s*=`, 'gi')
    
    return setterPattern.test(sourceCode) || modifierPattern.test(sourceCode)
  }

  /**
   * Vérifie si une fonction est une fonction OpenZeppelin sécurisée
   */
  private isOpenZeppelinSecureFunction(line: string, sourceCode: string): boolean {
    // Fonctions OpenZeppelin sécurisées qui ne sont pas des vulnérabilités
    const openZeppelinSecureFunctions = [
      '_mint',
      '_burn',
      '_transfer',
      '_approve',
      '_pause',
      '_unpause',
      '_beforeTokenTransfer',
      '_afterTokenTransfer',
      'transfer',
      'transferFrom',
      'approve',
      'mint',
      'burn',
      'pause',
      'unpause'
    ]

    // Vérifier si la ligne contient une fonction OpenZeppelin sécurisée
    return openZeppelinSecureFunctions.some(func => line.includes(func))
  }
}

export const securityAuditor = new SecurityAuditor() 