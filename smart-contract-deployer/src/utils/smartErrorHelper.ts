/**
 * 🧠 Smart Error Helper - Utilitaire pour enrichir les erreurs
 * 
 * Ce module permet aux fonctions utilitaires de créer des erreurs
 * enrichies qui seront mieux gérées par notre système d'erreur intelligent.
 */

export interface EnrichedError extends Error {
  category?: 'compilation' | 'network' | 'deployment' | 'validation' | 'wallet' | 'system'
  severity?: 'low' | 'medium' | 'high' | 'critical'
  context?: Record<string, any>
  httpStatus?: number
  recoverable?: boolean
}

/**
 * Créer une erreur enrichie pour le backend compiler
 */
export function createCompilationError(
  message: string,
  originalError?: Error,
  context?: {
    templateType?: string
    features?: string[]
    httpStatus?: number
  }
): EnrichedError {
  const error = new Error(message) as EnrichedError
  error.category = 'compilation'
  error.severity = 'high'
  error.context = {
    stage: 'compilation',
    ...context
  }
  error.httpStatus = context?.httpStatus
  error.recoverable = context?.httpStatus !== 500 // Server errors moins récupérables

  // Préserver la stack trace originale si disponible
  if (originalError?.stack) {
    error.stack = originalError.stack
  }

  return error
}

/**
 * Créer une erreur enrichie pour le déployeur
 */
export function createDeploymentError(
  message: string,
  originalError?: Error,
  context?: {
    chainId?: number
    gasEstimate?: any
    stage?: 'preparation' | 'simulation' | 'execution' | 'confirmation'
  }
): EnrichedError {
  const error = new Error(message) as EnrichedError
  error.category = 'deployment'
  error.context = {
    stage: 'deployment',
    ...context
  }

  // Déterminer la sévérité selon le type d'erreur
  if (message.includes('insufficient')) {
    error.category = 'wallet'
    error.severity = 'high'
  } else if (message.includes('simulation')) {
    error.severity = 'high'
    error.recoverable = true
  } else if (message.includes('gas')) {
    error.severity = 'high'
    error.recoverable = true
  } else {
    error.severity = 'medium'
  }

  if (originalError?.stack) {
    error.stack = originalError.stack
  }

  return error
}

/**
 * Créer une erreur enrichie pour les problèmes réseau
 */
export function createNetworkError(
  message: string,
  originalError?: Error,
  context?: {
    url?: string
    timeout?: boolean
    chainId?: number
  }
): EnrichedError {
  const error = new Error(message) as EnrichedError
  error.category = 'network'
  error.severity = context?.timeout ? 'medium' : 'high'
  error.recoverable = true
  error.context = {
    stage: 'network',
    ...context
  }

  if (originalError?.stack) {
    error.stack = originalError.stack
  }

  return error
}

/**
 * Créer une erreur enrichie pour les problèmes de validation
 */
export function createValidationError(
  message: string,
  context?: {
    field?: string
    value?: any
    expected?: string
  }
): EnrichedError {
  const error = new Error(message) as EnrichedError
  error.category = 'validation'
  error.severity = 'medium'
  error.recoverable = true
  error.context = {
    stage: 'validation',
    ...context
  }

  return error
}

/**
 * Wrapper pour les erreurs HTTP du backend
 */
export function wrapHttpError(
  status: number,
  statusText: string,
  responseData?: any,
  context?: Record<string, any>
): EnrichedError {
  let message = `HTTP ${status}: ${statusText}`
  
  if (responseData?.error) {
    message = responseData.error
  } else if (responseData?.message) {
    message = responseData.message
  }

  const error = new Error(message) as EnrichedError
  error.httpStatus = status
  error.context = {
    httpStatus: status,
    httpStatusText: statusText,
    responseData,
    ...context
  }

  // Catégoriser selon le code HTTP
  if (status >= 400 && status < 500) {
    error.category = status === 400 ? 'validation' : 'system'
    error.severity = 'medium'
    error.recoverable = true
  } else if (status >= 500) {
    error.category = 'system'
    error.severity = 'high'
    error.recoverable = false
  } else {
    error.category = 'network'
    error.severity = 'medium'
    error.recoverable = true
  }

  return error
}

/**
 * Utilitaire pour déterminer si une erreur est critique
 */
export function isErrorCritical(error: Error | EnrichedError): boolean {
  const enriched = error as EnrichedError
  return enriched.severity === 'critical' || 
         enriched.severity === 'high' && !enriched.recoverable
}

/**
 * Utilitaire pour extraire le contexte d'une erreur
 */
export function extractErrorContext(error: Error | EnrichedError): Record<string, any> {
  const enriched = error as EnrichedError
  return {
    category: enriched.category || 'system',
    severity: enriched.severity || 'medium',
    recoverable: enriched.recoverable !== false,
    httpStatus: enriched.httpStatus,
    ...enriched.context
  }
} 