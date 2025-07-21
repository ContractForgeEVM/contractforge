/**
 * Utilitaire pour résoudre les erreurs de simulation wallet
 * Spécialement pour "Unknown Signature Type" (#1002)
 */

import { encodeFunctionData, type WalletClient, type PublicClient } from 'viem'
import { UNIVERSAL_FACTORY_ABI } from '../config/factories'

interface SimulationError {
  code: number
  message: string
  type: 'simulation_failed' | 'unknown_signature' | 'insufficient_funds' | 'other'
}

interface FixAttempt {
  method: string
  success: boolean
  error?: string
  gasUsed?: bigint
}

export class SimulationErrorFixer {
  private walletClient: WalletClient
  private publicClient: PublicClient
  private factoryAddress: string

  constructor(walletClient: WalletClient, publicClient: PublicClient, factoryAddress: string) {
    this.walletClient = walletClient
    this.publicClient = publicClient
    this.factoryAddress = factoryAddress
  }

  /**
   * Diagnostiquer l'erreur de simulation
   */
  async diagnoseError(error: any): Promise<SimulationError> {
    const errorMessage = error.message || error.toString()
    
    if (errorMessage.includes('1002') || errorMessage.includes('Unknown Signature')) {
      return {
        code: 1002,
        message: 'Unknown Signature Type - Le wallet ne reconnaît pas la fonction',
        type: 'unknown_signature'
      }
    }
    
    if (errorMessage.includes('simulation failed') || errorMessage.includes('Simulation Failed')) {
      return {
        code: 1001,
        message: 'Transaction simulation failed',
        type: 'simulation_failed'
      }
    }
    
    if (errorMessage.includes('insufficient funds')) {
      return {
        code: 1003,
        message: 'Insufficient funds for transaction',
        type: 'insufficient_funds'
      }
    }
    
    return {
      code: 9999,
      message: errorMessage,
      type: 'other'
    }
  }

  /**
   * Vérifier la signature de fonction
   */
  async verifyFunctionSignature(functionName: string, args: any[]): Promise<{ valid: boolean; signature?: string; error?: string }> {
    try {
      console.log(`🔍 Verifying function signature: ${functionName}`)
      
      // Trouver la fonction dans l'ABI
      const functions = UNIVERSAL_FACTORY_ABI.filter(item => item.type === 'function')
      const targetFunction = functions.find((item: any) => item.name === functionName)
      
      if (!targetFunction) {
        return {
          valid: false,
          error: `Function ${functionName} not found in ABI. Available: ${functions.map((f: any) => f.name).join(', ')}`
        }
      }
      
      // Essayer d'encoder la fonction
      const encodedData = encodeFunctionData({
        abi: UNIVERSAL_FACTORY_ABI,
        functionName: functionName as any,
        args: args as any
      })
      
      const signature = encodedData.substring(0, 10)
      console.log(`✅ Function signature generated: ${signature}`)
      
      return {
        valid: true,
        signature
      }
      
    } catch (error: any) {
      console.error('❌ Function signature verification failed:', error)
      return {
        valid: false,
        error: error.message
      }
    }
  }

  /**
   * Tentatives de contournement pour Unknown Signature Type
   */
  async attemptFixes(deployData: `0x${string}`, value: bigint, gasLimit: bigint): Promise<FixAttempt[]> {
    const attempts: FixAttempt[] = []
    
    // Fix 1: Simulation manuelle avec estimateGas
    try {
      console.log('🔧 Fix 1: Manual gas estimation...')
      
      const estimatedGas = await this.publicClient.estimateGas({
        account: this.walletClient.account!,
        to: this.factoryAddress as `0x${string}`,
        data: deployData,
        value: value
      })
      
      attempts.push({
        method: 'manual_gas_estimation',
        success: true,
        gasUsed: estimatedGas
      })
      
      console.log(`✅ Manual gas estimation succeeded: ${estimatedGas.toString()}`)
      
    } catch (error: any) {
      attempts.push({
        method: 'manual_gas_estimation',
        success: false,
        error: error.message
      })
      console.log('❌ Manual gas estimation failed:', error.message)
    }
    
    // Fix 2: Appel simulé avec call
    try {
      console.log('🔧 Fix 2: Static call simulation...')
      
      const result = await this.publicClient.call({
        account: this.walletClient.account!.address,
        to: this.factoryAddress as `0x${string}`,
        data: deployData,
        value: value
      })
      
      attempts.push({
        method: 'static_call',
        success: true,
        error: `Result: ${result.data || 'success'}`
      })
      
      console.log('✅ Static call succeeded')
      
    } catch (error: any) {
      attempts.push({
        method: 'static_call',
        success: false,
        error: error.message
      })
      console.log('❌ Static call failed:', error.message)
    }
    
    // Fix 3: Vérification de l'état du contrat
    try {
      console.log('🔧 Fix 3: Contract state verification...')
      
      const code = await this.publicClient.getCode({
        address: this.factoryAddress as `0x${string}`
      })
      
      const hasCode = Boolean(code && code !== '0x')
      
      attempts.push({
        method: 'contract_verification',
        success: hasCode,
        error: hasCode ? 'Contract has code' : 'Contract has no code - not deployed?'
      })
      
    } catch (error: any) {
      attempts.push({
        method: 'contract_verification',
        success: false,
        error: error.message
      })
    }
    
    return attempts
  }

  /**
   * Proposer des solutions basées sur le diagnostic
   */
  getSolutions(error: SimulationError, fixAttempts: FixAttempt[]): string[] {
    const solutions: string[] = []
    
    if (error.type === 'unknown_signature') {
      solutions.push('🔧 Dans votre wallet, désactivez la simulation des transactions')
      solutions.push('⚡ Augmentez manuellement le gas limit à 2-3M')
      solutions.push('💰 Augmentez légèrement le gas price (priorité)')
      
      const gasEstimation = fixAttempts.find(a => a.method === 'manual_gas_estimation')
      if (gasEstimation?.success && gasEstimation.gasUsed) {
        solutions.push(`📊 Gas estimé avec succès: ${gasEstimation.gasUsed} unités`)
        solutions.push(`💡 Utilisez ${Number(gasEstimation.gasUsed) * 1.2} comme gas limit (marge 20%)`)
      }
    }
    
    if (error.type === 'simulation_failed') {
      solutions.push('🔄 Réessayez avec un gas price plus élevé')
      solutions.push('🌐 Vérifiez que vous êtes sur le bon réseau (Arbitrum)')
      solutions.push('💰 Vérifiez votre solde ETH')
    }
    
    const contractCheck = fixAttempts.find(a => a.method === 'contract_verification')
    if (contractCheck?.success === false) {
      solutions.push('🚨 PROBLÈME: Le contrat factory semble non déployé')
      solutions.push('📍 Vérifiez l\'adresse factory sur Arbiscan')
      solutions.push('🔄 Redéployez la factory si nécessaire')
    }
    
    // Solutions génériques
    solutions.push('🔄 Redémarrez votre wallet et réessayez')
    solutions.push('⏰ Attendez quelques minutes et réessayez')
    solutions.push('📱 Essayez avec un autre wallet si possible')
    
    return solutions
  }
}

/**
 * Helper function pour utiliser facilement le fixer
 */
export async function fixSimulationError(
  walletClient: WalletClient,
  publicClient: PublicClient,
  factoryAddress: string,
  deployData: `0x${string}`,
  value: bigint,
  gasLimit: bigint,
  originalError: any
): Promise<{
  diagnosis: SimulationError
  fixes: FixAttempt[]
  solutions: string[]
}> {
  const fixer = new SimulationErrorFixer(walletClient, publicClient, factoryAddress)
  
  const diagnosis = await fixer.diagnoseError(originalError)
  console.log('🔍 Error diagnosis:', diagnosis)
  
  const fixes = await fixer.attemptFixes(deployData, value, gasLimit)
  console.log('🔧 Fix attempts:', fixes)
  
  const solutions = fixer.getSolutions(diagnosis, fixes)
  console.log('💡 Recommended solutions:', solutions)
  
  return {
    diagnosis,
    fixes,
    solutions
  }
}

export default SimulationErrorFixer 