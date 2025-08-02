import { SmartError, ErrorCategory, ErrorSeverity } from './types'
import { ErrorContextBuilder } from './ErrorContextBuilder'

interface ErrorEvent {
  error: SmartError
  timestamp: number
  resolved?: boolean
  resolutionMethod?: string
  userAgent?: string
  url?: string
}

interface ErrorStats {
  total: number
  last24h: number
  byCategory: Record<ErrorCategory, number>
  bySeverity: Record<ErrorSeverity, number>
  topSolutions: Array<{ solution: string, count: number }>
  resolutionRate: number
  mostCommon: Array<{ pattern: string, count: number, percentage: number }>
}

export class ErrorAnalytics {
  private static events: ErrorEvent[] = []
  private static maxEvents = 1000 // Limite pour éviter la surcharge mémoire
  
  static trackError(error: SmartError, additionalData?: Record<string, any>) {
    const event: ErrorEvent = {
      error,
      timestamp: Date.now(),
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined
    }

    // Ajouter l'événement
    this.events.push(event)
    
    // Limiter la taille du tableau
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents)
    }

    // Envoyer à l'analytics externe
    this.sendToExternalAnalytics(error, additionalData)
    
    // Logger en mode développement
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Smart Error Tracked: ${error.titleKey}`)
      console.log('Error ID:', error.id)
      console.log('Category:', error.category)
      console.log('Severity:', error.severity)
      console.log('Context:', ErrorContextBuilder.sanitizeForLogging(error.context || {}))
      console.log('Solutions:', error.solutions.length)
      console.groupEnd()
    }
  }

  static trackResolution(errorId: string, method: 'automatic' | 'manual' | 'retry' | 'support') {
    const event = this.events.find(e => e.error.id === errorId)
    if (event) {
      event.resolved = true
      event.resolutionMethod = method
      
      // Envoyer l'événement de résolution
      this.sendResolutionToAnalytics(errorId, method)
    }
  }

  static getStats(timeframe: number = 86400000): ErrorStats { // 24h par défaut
    const now = Date.now()
    const recentEvents = this.events.filter(
      e => e.timestamp > now - timeframe
    )

    const stats: ErrorStats = {
      total: this.events.length,
      last24h: recentEvents.length,
      byCategory: {} as Record<ErrorCategory, number>,
      bySeverity: {} as Record<ErrorSeverity, number>,
      topSolutions: [],
      resolutionRate: 0,
      mostCommon: []
    }

    // Statistiques par catégorie et sévérité
    recentEvents.forEach(event => {
      const { category, severity } = event.error
      
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1
      stats.bySeverity[severity] = (stats.bySeverity[severity] || 0) + 1
    })

    // Solutions les plus utilisées
    const solutionCounts: Record<string, number> = {}
    recentEvents.forEach(event => {
      event.error.solutions.forEach(solution => {
        solutionCounts[solution.titleKey] = (solutionCounts[solution.titleKey] || 0) + 1
      })
    })

    stats.topSolutions = Object.entries(solutionCounts)
      .map(([solution, count]) => ({ solution, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Taux de résolution
    const resolvedEvents = recentEvents.filter(e => e.resolved)
    stats.resolutionRate = recentEvents.length > 0 
      ? (resolvedEvents.length / recentEvents.length) * 100 
      : 0

    // Erreurs les plus communes
    const errorCounts: Record<string, number> = {}
    recentEvents.forEach(event => {
      const key = event.error.titleKey
      errorCounts[key] = (errorCounts[key] || 0) + 1
    })

    stats.mostCommon = Object.entries(errorCounts)
      .map(([pattern, count]) => ({
        pattern,
        count,
        percentage: (count / recentEvents.length) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return stats
  }

  static getTopErrors(limit: number = 5): Array<{
    titleKey: string
    count: number
    lastOccurrence: number
    category: ErrorCategory
    severity: ErrorSeverity
  }> {
    const errorCounts: Record<string, {
      count: number
      lastOccurrence: number
      category: ErrorCategory
      severity: ErrorSeverity
    }> = {}

    this.events.forEach(event => {
      const key = event.error.titleKey
      if (errorCounts[key]) {
        errorCounts[key].count++
        errorCounts[key].lastOccurrence = Math.max(
          errorCounts[key].lastOccurrence,
          event.timestamp
        )
      } else {
        errorCounts[key] = {
          count: 1,
          lastOccurrence: event.timestamp,
          category: event.error.category,
          severity: event.error.severity
        }
      }
    })

    return Object.entries(errorCounts)
      .map(([titleKey, data]) => ({ titleKey, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  }

  static exportData(): string {
    const exportData = {
      version: '1.0',
      timestamp: Date.now(),
      events: this.events.map(event => ({
        ...event,
        error: {
          ...event.error,
          context: ErrorContextBuilder.sanitizeForLogging(event.error.context || {})
        }
      })),
      stats: this.getStats()
    }

    return JSON.stringify(exportData, null, 2)
  }

  static clearData() {
    this.events = []
  }

  private static sendToExternalAnalytics(error: SmartError, additionalData?: Record<string, any>) {
    try {
      // Intégration avec votre système d'analytics existant
      if (typeof window !== 'undefined') {
        // Google Analytics 4
        if ((window as any).gtag) {
          (window as any).gtag('event', 'smart_error_occurred', {
            error_id: error.id,
            error_category: error.category,
            error_severity: error.severity,
            error_title: error.titleKey,
            template: error.context?.template,
            network: error.context?.network,
            solutions_count: error.solutions.length,
            can_retry: error.canRetry,
            ...additionalData
          })
        }

        // Analytics personnalisés (votre service existing)
        if ((window as any).analytics?.track) {
          (window as any).analytics.track('Smart Error Occurred', {
            errorId: error.id,
            category: error.category,
            severity: error.severity,
            titleKey: error.titleKey,
            messageKey: error.messageKey,
            template: error.context?.template,
            network: error.context?.network,
            chainId: error.context?.chainId,
            solutionsCount: error.solutions.length,
            canRetry: error.canRetry,
            context: ErrorContextBuilder.sanitizeForLogging(error.context || {}),
            ...additionalData
          })
        }
      }
    } catch (err) {
      console.warn('Failed to send error to analytics:', err)
    }
  }

  private static sendResolutionToAnalytics(errorId: string, method: string) {
    try {
      if (typeof window !== 'undefined') {
        // Google Analytics 4
        if ((window as any).gtag) {
          (window as any).gtag('event', 'smart_error_resolved', {
            error_id: errorId,
            resolution_method: method
          })
        }

        // Analytics personnalisés
        if ((window as any).analytics?.track) {
          (window as any).analytics.track('Smart Error Resolved', {
            errorId,
            resolutionMethod: method,
            timestamp: Date.now()
          })
        }
      }
    } catch (err) {
      console.warn('Failed to send resolution to analytics:', err)
    }
  }
} 