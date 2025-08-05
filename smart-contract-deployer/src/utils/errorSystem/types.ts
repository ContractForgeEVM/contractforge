export enum ErrorCategory {
  WALLET = 'wallet',
  NETWORK = 'network', 
  COMPILATION = 'compilation',
  DEPLOYMENT = 'deployment',
  VALIDATION = 'validation',
  SYSTEM = 'system'
}

export enum ErrorSeverity {
  LOW = 'low',        // Avertissement
  MEDIUM = 'medium',  // Erreur récupérable
  HIGH = 'high',      // Erreur critique
  CRITICAL = 'critical' // Échec total
}

export interface Solution {
  titleKey: string        // Clé de traduction pour le titre
  descriptionKey: string  // Clé de traduction pour la description
  action?: () => Promise<void>
  type: 'manual' | 'automatic' | 'link'
  priority: number
  actionParams?: Record<string, any> // Paramètres pour l'action
}

export interface SmartError {
  id: string
  category: ErrorCategory
  severity: ErrorSeverity
  titleKey: string        // Clé de traduction
  messageKey: string      // Clé de traduction
  messageParams?: Record<string, any> // Paramètres pour interpolation
  solutions: Solution[]
  context?: ErrorContext
  technical?: string
  helpUrl?: string
  canRetry: boolean
}

export interface ErrorContext {
  template?: string
  network?: string
  userBalance?: string
  estimatedCost?: string
  gasPrice?: string
  features?: string[]
  userAddress?: string
  contractAddress?: string
  chainId?: number
}

export interface ErrorTemplate {
  category: ErrorCategory
  severity: ErrorSeverity
  titleKey: string
  detector: (error: any, context: ErrorContext) => {
    messageKey: string
    messageParams?: Record<string, any>
    solutions: Omit<Solution, 'titleKey' | 'descriptionKey'>[]
  }
}

export interface ErrorPattern {
  pattern: RegExp
  template: ErrorTemplate
} 