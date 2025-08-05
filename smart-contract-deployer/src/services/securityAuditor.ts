import { contractToast } from '../components/notifications'

export interface SecurityIssue {
  id: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  category: 'REENTRANCY' | 'OVERFLOW' | 'ACCESS_CONTROL' | 'LOGIC_ERROR' | 'GAS_OPTIMIZATION' | 'BEST_PRACTICES'
  title: string
  description: string
  line?: number
  column?: number
  file?: string
  tool: 'SOLHINT' | 'SLITHER' | 'CUSTOM' | 'PATTERN_MATCH'
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

// Configuration de l'API backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004'

export class SecurityAuditor {
  async auditContract(sourceCode: string, contractName: string): Promise<AuditResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/security-audit/audit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceCode,
          contractName
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.message || 'Audit failed')
      }

      return result.data

    } catch (error) {
      console.error('Security audit API error:', error)
      contractToast.error('Erreur lors de l\'audit de sécurité')
      
      // Fallback: retourner un résultat d'erreur
      return {
        score: 0,
        grade: 'F',
        issues: [],
        summary: { critical: 0, high: 0, medium: 0, low: 0, total: 0 },
        recommendations: ['Erreur lors de l\'audit. Veuillez réessayer.'],
        passed: false,
        auditTime: 0,
        toolsUsed: []
      }
    }
  }

  /**
   * Vérifier la santé du service d'audit
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/security-audit/health`)
      const result = await response.json()
      return result.success && result.status === 'healthy'
    } catch (error) {
      console.error('Health check failed:', error)
      return false
    }
  }

  /**
   * Obtenir les standards de sécurité
   */
  async getStandards(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/security-audit/standards`)
      const result = await response.json()
      return result.data
    } catch (error) {
      console.error('Failed to get standards:', error)
      return null
    }
  }
}

export const securityAuditor = new SecurityAuditor()

export const useSecurityAudit = () => {
  const auditContract = async (sourceCode: string, contractName: string): Promise<AuditResult> => {
    return await securityAuditor.auditContract(sourceCode, contractName)
  }

  const checkHealth = async (): Promise<boolean> => {
    return await securityAuditor.checkHealth()
  }

  const getStandards = async (): Promise<any> => {
    return await securityAuditor.getStandards()
  }

  return { 
    auditContract,
    checkHealth,
    getStandards
  }
} 