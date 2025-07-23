import { useState, useCallback } from 'react'
import { useAccount, useChainId, usePublicClient } from 'wagmi'
import { SmartError } from '../utils/errorSystem/types'
import { SmartErrorDetector } from '../utils/errorSystem/SmartErrorDetector'
import { ErrorContextBuilder } from '../utils/errorSystem/ErrorContextBuilder'
import { ErrorAnalytics } from '../utils/errorSystem/ErrorAnalytics'

interface UseSmartErrorReturn {
  currentError: SmartError | null
  isErrorDialogOpen: boolean
  handleError: (
    error: any,
    template?: string,
    features?: string[],
    gasEstimate?: any,
    additionalContext?: Record<string, any>
  ) => Promise<void>
  closeError: () => void
  clearError: () => void
  retryLastAction: () => void
}

export const useSmartError = (
  onRetry?: () => Promise<void>
): UseSmartErrorReturn => {
  const [currentError, setCurrentError] = useState<SmartError | null>(null)
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false)
  const [lastRetryAction, setLastRetryAction] = useState<(() => Promise<void>) | null>(null)

  const { address } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()

  const handleError = useCallback(async (
    error: any,
    template?: string,
    features?: string[],
    gasEstimate?: any,
    additionalContext?: Record<string, any>
  ) => {
    try {
      console.group('🔍 Smart Error Handler')
      console.log('Raw error:', error)
      console.log('Template:', template)
      console.log('Features:', features)
      console.log('Chain ID:', chainId)
      
      // Construire le contexte d'erreur
      const context = await ErrorContextBuilder.buildContext(
        template,
        features,
        address,
        chainId,
        publicClient,
        gasEstimate
      )

      // Enrichir avec contexte additionnel si fourni
      const enrichedContext = additionalContext 
        ? ErrorContextBuilder.enrichContext(context, additionalContext)
        : context

      console.log('Built context:', context)

      // Détecter et classifier l'erreur
      const smartError = SmartErrorDetector.detect(error, enrichedContext)
      
      console.log('Detected smart error:', {
        id: smartError.id,
        category: smartError.category,
        severity: smartError.severity,
        titleKey: smartError.titleKey
      })

      // Tracker l'erreur pour analytics
      ErrorAnalytics.trackError(smartError, {
        template,
        features,
        chainId,
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
        timestamp: Date.now()
      })

      setCurrentError(smartError)
      setIsErrorDialogOpen(true)
      
      console.groupEnd()
    } catch (processingError: any) {
      console.error('❌ Error processing smart error:', processingError)
      
      // Fallback vers erreur générique
      const fallbackError: SmartError = {
        id: `fallback_${Date.now()}`,
        category: 'system' as any,
        severity: 'medium' as any,
        titleKey: 'smartErrors.generic.title',
        messageKey: 'smartErrors.generic.message',
        solutions: [{
          titleKey: 'smartErrors.solutions.generic.solution1.title',
          descriptionKey: 'smartErrors.solutions.generic.solution1.description',
          type: 'manual' as any,
          priority: 1
        }],
        technical: error?.message || error?.toString() || 'Unknown error',
        canRetry: true
      }

      ErrorAnalytics.trackError(fallbackError, {
        template,
        processingError: processingError?.message || 'Unknown processing error',
        fallback: true
      })

      setCurrentError(fallbackError)
      setIsErrorDialogOpen(true)
    }
  }, [address, chainId, publicClient])

  const closeError = useCallback(() => {
    setIsErrorDialogOpen(false)
    // Garder l'erreur pour éventuel retry
  }, [])

  const clearError = useCallback(() => {
    if (currentError) {
      ErrorAnalytics.trackResolution(currentError.id, 'manual')
    }
    setCurrentError(null)
    setIsErrorDialogOpen(false)
    setLastRetryAction(null)
  }, [currentError])

  const retryLastAction = useCallback(async () => {
    if (currentError) {
      ErrorAnalytics.trackResolution(currentError.id, 'retry')
    }
    
    closeError()
    
    if (onRetry) {
      setLastRetryAction(() => onRetry)
      try {
        await onRetry()
      } catch (retryError) {
        // Si le retry échoue, traiter la nouvelle erreur
        await handleError(retryError)
      }
    } else if (lastRetryAction) {
      try {
        await lastRetryAction()
      } catch (retryError) {
        await handleError(retryError)
      }
    }
  }, [currentError, onRetry, lastRetryAction, closeError, handleError])

  return {
    currentError,
    isErrorDialogOpen,
    handleError,
    closeError,
    clearError,
    retryLastAction
  }
} 