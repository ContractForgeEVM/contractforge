import { ErrorCategory, ErrorSeverity, SmartError, ErrorContext, ErrorPattern } from './types'

export class SmartErrorDetector {
  // Patterns d'erreurs avec clés de traduction
  private static patterns: ErrorPattern[] = [
    // Erreurs Wallet - Solde insuffisant
    {
      pattern: /insufficient funds|insufficient ether|insufficient balance/i,
      template: {
        category: ErrorCategory.WALLET,
        severity: ErrorSeverity.HIGH,
        titleKey: 'smartErrors.wallet.insufficientFunds.title',
        detector: (error, context) => ({
          messageKey: 'smartErrors.wallet.insufficientFunds.message',
          messageParams: {
            estimatedCost: context?.estimatedCost || '?',
            userBalance: context?.userBalance || '?',
            network: context?.network || 'blockchain'
          },
          solutions: [
            {
              type: 'manual',
              priority: 1
            },
            {
              type: 'manual',
              priority: 2,
              actionParams: { network: context?.network }
            },
            {
              type: 'automatic',
              priority: 3,
              action: async () => {
                // Logique pour suggérer des features à retirer
                console.log('Suggesting features to remove...')
              }
            }
          ]
        })
      }
    },

    // Erreurs Wallet - Transaction rejetée
    {
      pattern: /user rejected|denied transaction|user denied/i,
      template: {
        category: ErrorCategory.WALLET,
        severity: ErrorSeverity.MEDIUM,
        titleKey: 'smartErrors.wallet.transactionRejected.title',
        detector: (error, context) => ({
          messageKey: 'smartErrors.wallet.transactionRejected.message',
          solutions: [
            {
              type: 'manual',
              priority: 1
            },
            {
              type: 'manual',
              priority: 2
            }
          ]
        })
      }
    },

    // Erreurs de simulation/déploiement
    {
      pattern: /simulation failed|execution reverted|unknown signature/i,
      template: {
        category: ErrorCategory.DEPLOYMENT,
        severity: ErrorSeverity.HIGH,
        titleKey: 'smartErrors.deployment.simulationFailed.title',
        detector: (error, context) => ({
          messageKey: 'smartErrors.deployment.simulationFailed.message',
          messageParams: {
            network: context?.network || 'blockchain'
          },
          solutions: [
            {
              type: 'automatic',
              priority: 1,
              action: async () => {
                console.log('Checking network connectivity...')
              }
            },
            {
              type: 'automatic',
              priority: 2,
              action: async () => {
                console.log('Increasing gas limit...')
              }
            },
            {
              type: 'manual',
              priority: 3
            }
          ]
        })
      }
    },

    // Erreurs réseau
    {
      pattern: /network error|fetch failed|connection failed|timeout/i,
      template: {
        category: ErrorCategory.NETWORK,
        severity: ErrorSeverity.MEDIUM,
        titleKey: 'smartErrors.network.connectionFailed.title',
        detector: (error, context) => ({
          messageKey: 'smartErrors.network.connectionFailed.message',
          messageParams: {
            network: context?.network || 'blockchain'
          },
          solutions: [
            {
              type: 'manual',
              priority: 1
            },
            {
              type: 'automatic',
              priority: 2,
              action: async () => {
                console.log('Switching to backup RPC...')
              }
            },
            {
              type: 'manual',
              priority: 3
            }
          ]
        })
      }
    },

    // Erreurs de compilation
    {
      pattern: /compilation failed|solidity error|syntax error/i,
      template: {
        category: ErrorCategory.COMPILATION,
        severity: ErrorSeverity.HIGH,
        titleKey: 'smartErrors.compilation.failed.title',
        detector: (error, context) => ({
          messageKey: 'smartErrors.compilation.failed.message',
          messageParams: {
            template: context?.template || 'contract',
            features: context?.features?.join(', ') || 'none'
          },
          solutions: [
            {
              type: 'manual',
              priority: 1
            },
            {
              type: 'automatic',
              priority: 2,
              action: async () => {
                console.log('Suggesting feature simplification...')
              }
            },
            {
              type: 'link',
              priority: 3
            }
          ]
        })
      }
    },

    // Erreurs de gas
    {
      pattern: /gas required exceeds allowance|out of gas|gas limit/i,
      template: {
        category: ErrorCategory.DEPLOYMENT,
        severity: ErrorSeverity.HIGH,
        titleKey: 'smartErrors.deployment.gasLimit.title',
        detector: (error, context) => ({
          messageKey: 'smartErrors.deployment.gasLimit.message',
          messageParams: {
            gasPrice: context?.gasPrice || '?'
          },
          solutions: [
            {
              type: 'automatic',
              priority: 1,
              action: async () => {
                console.log('Increasing gas limit...')
              }
            },
            {
              type: 'manual',
              priority: 2
            },
            {
              type: 'manual',
              priority: 3
            }
          ]
        })
      }
    },

    // Erreurs de validation
    {
      pattern: /invalid address|invalid parameter|missing required field/i,
      template: {
        category: ErrorCategory.VALIDATION,
        severity: ErrorSeverity.MEDIUM,
        titleKey: 'smartErrors.validation.invalidInput.title',
        detector: (error, context) => ({
          messageKey: 'smartErrors.validation.invalidInput.message',
          solutions: [
            {
              type: 'manual',
              priority: 1
            },
            {
              type: 'manual',
              priority: 2
            }
          ]
        })
      }
    }
  ]

  static detect(error: any, context: ErrorContext = {}): SmartError {
    const errorMessage = error.message || error.toString()
    
    // Trouver le pattern correspondant
    for (const { pattern, template } of this.patterns) {
      if (pattern.test(errorMessage)) {
        const errorData = template.detector(error, context)
        
        // Construire les solutions avec les clés de traduction
        const solutions = errorData.solutions.map((solution, index) => ({
          titleKey: this.getSolutionKey(template.category, index, 'title'),
          descriptionKey: this.getSolutionKey(template.category, index, 'description'),
          ...solution
        }))

        return {
          id: this.generateErrorId(),
          category: template.category,
          severity: template.severity,
          titleKey: template.titleKey,
          messageKey: errorData.messageKey,
          messageParams: errorData.messageParams,
          solutions,
          context,
          technical: errorMessage,
          helpUrl: this.getHelpUrl(template.category),
          canRetry: this.canRetry(template.category)
        }
      }
    }

    // Erreur inconnue - fallback
    return this.createGenericError(error, context)
  }

  private static getSolutionKey(category: ErrorCategory, index: number, type: 'title' | 'description'): string {
    const categoryMap: Record<ErrorCategory, string> = {
      [ErrorCategory.WALLET]: 'wallet',
      [ErrorCategory.NETWORK]: 'network',
      [ErrorCategory.DEPLOYMENT]: 'deployment',
      [ErrorCategory.COMPILATION]: 'compilation',
      [ErrorCategory.VALIDATION]: 'validation',
      [ErrorCategory.SYSTEM]: 'system'
    }
    
    return `smartErrors.solutions.${categoryMap[category]}.solution${index + 1}.${type}`
  }

  private static generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private static getHelpUrl(category: ErrorCategory): string {
    const categoryMap: Record<ErrorCategory, string> = {
      [ErrorCategory.WALLET]: 'wallet-issues',
      [ErrorCategory.NETWORK]: 'network-issues',
      [ErrorCategory.DEPLOYMENT]: 'deployment-issues',
      [ErrorCategory.COMPILATION]: 'compilation-issues',
      [ErrorCategory.VALIDATION]: 'validation-issues',
      [ErrorCategory.SYSTEM]: 'general-issues'
    }
    
    return `/docs/troubleshooting#${categoryMap[category]}`
  }

  private static canRetry(category: ErrorCategory): boolean {
    return [
      ErrorCategory.NETWORK, 
      ErrorCategory.SYSTEM, 
      ErrorCategory.DEPLOYMENT
    ].includes(category)
  }

  private static createGenericError(error: any, context: ErrorContext): SmartError {
    return {
      id: this.generateErrorId(),
      category: ErrorCategory.SYSTEM,
      severity: ErrorSeverity.MEDIUM,
      titleKey: 'smartErrors.generic.title',
      messageKey: 'smartErrors.generic.message',
      solutions: [
        {
          titleKey: 'smartErrors.solutions.generic.solution1.title',
          descriptionKey: 'smartErrors.solutions.generic.solution1.description',
          type: 'manual',
          priority: 1
        },
        {
          titleKey: 'smartErrors.solutions.generic.solution2.title',
          descriptionKey: 'smartErrors.solutions.generic.solution2.description',
          type: 'manual',
          priority: 2
        },
        {
          titleKey: 'smartErrors.solutions.generic.solution3.title',
          descriptionKey: 'smartErrors.solutions.generic.solution3.description',
          type: 'link',
          priority: 3
        }
      ],
      context,
      technical: error.message || error.toString(),
      helpUrl: '/docs/troubleshooting#general-issues',
      canRetry: true
    }
  }
} 