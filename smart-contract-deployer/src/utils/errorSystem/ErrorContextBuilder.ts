import { ErrorContext } from './types'
import { formatEther } from 'viem'

export class ErrorContextBuilder {
  static async buildContext(
    template?: string,
    features?: string[],
    userAddress?: string,
    chainId?: number,
    publicClient?: any,
    gasEstimate?: any
  ): Promise<ErrorContext> {
    const context: ErrorContext = {
      template,
      features,
      userAddress,
      chainId
    }

    try {
      // Récupérer info réseau
      if (chainId) {
        context.network = this.getNetworkName(chainId)
        
        // Récupérer prix du gas si client disponible
        if (publicClient) {
          context.gasPrice = await this.getCurrentGasPrice(publicClient)
        }
      }

      // Récupérer solde utilisateur
      if (userAddress && publicClient) {
        context.userBalance = await this.getUserBalance(userAddress, publicClient)
      }

      // Ajouter coût estimé si disponible
      if (gasEstimate?.totalCost) {
        context.estimatedCost = formatEther(gasEstimate.totalCost) + ' ETH'
      }

      return context
    } catch (error) {
      console.warn('Failed to build error context:', error)
      return context
    }
  }

  private static getNetworkName(chainId: number): string {
    const networks: Record<number, string> = {
      1: 'Ethereum',
      137: 'Polygon',
      42161: 'Arbitrum',
      10: 'Optimism',
      56: 'BSC',
      43114: 'Avalanche',
      8453: 'Base',
      100: 'Gnosis',
      534352: 'Scroll',
      59144: 'Linea',
      42220: 'Celo',
      7777777: 'Zora',
      999: 'HyperEVM',
      31337: 'Hardhat Local'
    }
    return networks[chainId] || `Network ${chainId}`
  }

  private static async getCurrentGasPrice(publicClient: any): Promise<string> {
    try {
      const gasPrice = await publicClient.getGasPrice()
      const gweiPrice = Number(gasPrice) / 1e9
      return `${gweiPrice.toFixed(2)} gwei`
    } catch (error) {
      console.warn('Failed to get gas price:', error)
      return '? gwei'
    }
  }

  private static async getUserBalance(address: string, publicClient: any): Promise<string> {
    try {
      const balance = await publicClient.getBalance({ address })
      const ethBalance = formatEther(balance)
      return `${parseFloat(ethBalance).toFixed(4)} ETH`
    } catch (error) {
      console.warn('Failed to get user balance:', error)
      return '? ETH'
    }
  }

  // Méthode pour enrichir le contexte avec des informations spécifiques
  static enrichContext(
    context: ErrorContext, 
    additionalData: Partial<ErrorContext>
  ): ErrorContext {
    return {
      ...context,
      ...additionalData
    }
  }

  // Méthode pour nettoyer les données sensibles du contexte avant logging
  static sanitizeForLogging(context: ErrorContext): ErrorContext {
    const sanitized = { ...context }
    
    // Masquer l'adresse complète pour privacy
    if (sanitized.userAddress) {
      sanitized.userAddress = `${sanitized.userAddress.slice(0, 6)}...${sanitized.userAddress.slice(-4)}`
    }
    
    return sanitized
  }
} 