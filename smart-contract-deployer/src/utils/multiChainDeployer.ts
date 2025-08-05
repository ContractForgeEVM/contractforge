import { writeContract, waitForTransactionReceipt, switchChain } from '@wagmi/core'
import { config } from '../wagmi'
import { UNIVERSAL_FACTORY_ADDRESSES } from '../config/factories'
import { chains } from '../config/chains'
import type { Chain } from 'viem'

export interface MultiChainDeploymentConfig {
  selectedChains: number[]
  useSameAddress: boolean
  autoVerify: boolean
  gasLimitOverride?: number
}

export interface ChainDeploymentResult {
  chainId: number
  chainName: string
  contractAddress: string
  transactionHash: string
  gasUsed: bigint
  status: 'success' | 'failed' | 'pending'
  error?: string
}

export interface MultiChainDeploymentResult {
  results: ChainDeploymentResult[]
  totalGasUsed: bigint
  successCount: number
  failedCount: number
}

/**
 * Déploie un contrat sur plusieurs chaînes simultanément
 */
export class MultiChainDeployer {
  
  /**
   * Estime le coût total de déploiement sur plusieurs chaînes
   */
  static estimateMultiChainCost(selectedChains: number[]): {
    totalCostUSD: { min: number; max: number }
    baseCost: number // 0.06 ETH
    perChainEstimates: Array<{
      chainId: number
      name: string
      costUSD: { min: number; max: number }
    }>
  } {
    const baseCostUSD = 0.06 * 3000 // 0.06 ETH * $3000 ETH price estimate
    
    const chainCosts = [
      { id: 1, name: 'Ethereum', min: 50, max: 200 },
      { id: 42161, name: 'Arbitrum', min: 0.10, max: 1 },
      { id: 8453, name: 'Base', min: 0.10, max: 1 },
      { id: 10, name: 'Optimism', min: 0.10, max: 1 },
      { id: 137, name: 'Polygon', min: 0.01, max: 0.10 },
      { id: 56, name: 'BNB Chain', min: 0.05, max: 0.50 },
      { id: 43114, name: 'Avalanche', min: 0.50, max: 5 },
      { id: 42220, name: 'Celo', min: 0.01, max: 0.10 },
    ]

    const perChainEstimates = selectedChains.map(chainId => {
      const chainCost = chainCosts.find(c => c.id === chainId) || { id: chainId, name: 'Unknown', min: 1, max: 10 }
      return {
        chainId,
        name: chainCost.name,
        costUSD: { min: chainCost.min, max: chainCost.max }
      }
    })

    const totalGasCost = perChainEstimates.reduce(
      (acc, chain) => ({
        min: acc.min + chain.costUSD.min,
        max: acc.max + chain.costUSD.max
      }),
      { min: 0, max: 0 }
    )

    return {
      totalCostUSD: {
        min: baseCostUSD + totalGasCost.min,
        max: baseCostUSD + totalGasCost.max
      },
      baseCost: baseCostUSD,
      perChainEstimates
    }
  }

  /**
   * Déploie sur plusieurs chaînes
   */
  static async deployToMultipleChains(
    templateType: number,
    bytecode: `0x${string}`,
    constructorParams: `0x${string}`,
    features: number[],
    deploymentConfig: MultiChainDeploymentConfig,
    salt?: `0x${string}`
  ): Promise<MultiChainDeploymentResult> {
    const results: ChainDeploymentResult[] = []
    let totalGasUsed = 0n

    for (const chainId of deploymentConfig.selectedChains) {
      try {
        // Vérifier que la factory existe sur cette chaîne
        const factoryAddress = UNIVERSAL_FACTORY_ADDRESSES[chainId]
        if (!factoryAddress || factoryAddress === '0x0000000000000000000000000000000000000000') {
          results.push({
            chainId,
            chainName: chains.find(c => c.id === chainId)?.name || `Chain ${chainId}`,
            contractAddress: '',
            transactionHash: '',
            gasUsed: 0n,
            status: 'failed',
            error: 'Factory not deployed on this chain'
          })
          continue
        }

        // Changer de chaîne
        await switchChain(config, { chainId })

        // Calculer le coût premium
        const premiumFee = await this.calculatePremiumFee(factoryAddress as `0x${string}`, features)
        const baseCost = BigInt('1000000000000000') // 0.001 ETH
        const platformFee = (baseCost * 2n) / 100n // 2%
        const totalValue = baseCost + platformFee + premiumFee

        // Déployer le contrat
        const hash = await writeContract(config, {
          address: factoryAddress as `0x${string}`,
          abi: [
            {
              inputs: [
                { internalType: 'enum UniversalFactoryV2.TemplateType', name: 'templateType', type: 'uint8' },
                { internalType: 'bytes', name: 'bytecode', type: 'bytes' },
                { internalType: 'bytes', name: 'constructorParams', type: 'bytes' },
                { internalType: 'uint8[]', name: 'features', type: 'uint8[]' },
                { internalType: 'bytes32', name: 'salt', type: 'bytes32' }
              ],
              name: 'deployContract',
              outputs: [{ internalType: 'address', name: 'deployedContract', type: 'address' }],
              stateMutability: 'payable',
              type: 'function'
            }
          ],
          functionName: 'deployContract',
          args: [templateType, bytecode, constructorParams, features, salt || '0x0000000000000000000000000000000000000000000000000000000000000000'],
          value: totalValue,
          gas: deploymentConfig.gasLimitOverride ? BigInt(deploymentConfig.gasLimitOverride) : undefined
        })

        // Attendre la confirmation
        const receipt = await waitForTransactionReceipt(config, { hash })
        
        // Extraire l'adresse du contrat déployé depuis les logs
        const contractAddress = receipt.logs[0]?.address || ''

        results.push({
          chainId,
          chainName: chains.find(c => c.id === chainId)?.name || `Chain ${chainId}`,
          contractAddress,
          transactionHash: hash,
          gasUsed: receipt.gasUsed,
          status: 'success'
        })

        totalGasUsed += receipt.gasUsed

      } catch (error) {
        console.error(`Deployment failed on chain ${chainId}:`, error)
        results.push({
          chainId,
          chainName: chains.find(c => c.id === chainId)?.name || `Chain ${chainId}`,
          contractAddress: '',
          transactionHash: '',
          gasUsed: 0n,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    const successCount = results.filter(r => r.status === 'success').length
    const failedCount = results.filter(r => r.status === 'failed').length

    return {
      results,
      totalGasUsed,
      successCount,
      failedCount
    }
  }

  /**
   * Calcule les frais premium pour les features sélectionnées
   */
  private static async calculatePremiumFee(factoryAddress: `0x${string}`, features: number[]): Promise<bigint> {
    // Pour l'instant, utilisons une estimation simple
    // Dans un cas réel, on ferait un appel au contrat
    const featurePrices = [
      0.001, 0.002, 0.003, 0.004, 0.005, // 0-4
      0.006, 0.007, 0.008, 0.009, 0.01,  // 5-9
      0.011, 0.012, 0.013, 0.014, 0.015, // 10-14
      0.016, 0.017, 0.018, 0.019, 0.02,  // 15-19
      0.021, 0.022, 0.023, 0.024, 0.025, // 20-24
      0.026, 0.027, 0.028, 0.029, 0.03,  // 25-29
      0.031, 0.032, 0.033, 0.034, 0.035, // 30-34
      0.036, 0.037, 0.06, 0.039, 0.04,   // 35-39 (crosschain = 0.06 à l'index 38)
      0.041, 0.042, 0.043 // 40-42
    ]

    let totalFee = 0
    for (const feature of features) {
      if (feature < featurePrices.length) {
        totalFee += featurePrices[feature]
      }
    }

    // Convertir en wei
    return BigInt(Math.floor(totalFee * 1e18))
  }

  /**
   * Génère un rapport de déploiement
   */
  static generateDeploymentReport(result: MultiChainDeploymentResult): string {
    const report = [
      '🌉 Multi-Chain Deployment Report',
      '================================',
      '',
      `✅ Successful: ${result.successCount}`,
      `❌ Failed: ${result.failedCount}`,
      `⛽ Total Gas Used: ${result.totalGasUsed.toString()}`,
      '',
      'Deployment Details:',
      '-------------------'
    ]

    result.results.forEach(r => {
      const status = r.status === 'success' ? '✅' : '❌'
      report.push(`${status} ${r.chainName} (${r.chainId})`)
      if (r.status === 'success') {
        report.push(`   📍 Contract: ${r.contractAddress}`)
        report.push(`   🔗 TX: ${r.transactionHash}`)
        report.push(`   ⛽ Gas: ${r.gasUsed.toString()}`)
      } else {
        report.push(`   ❌ Error: ${r.error}`)
      }
      report.push('')
    })

    return report.join('\n')
  }
} 