import { useState, useEffect } from 'react'
import { useAccount, usePublicClient } from 'wagmi'
import { estimateContractDeployment } from '../utils/gasEstimator'
import type { ContractTemplate, GasEstimate } from '../types'
export const useGasEstimate = (template: ContractTemplate | null, params: Record<string, any>, premiumFeatures: string[] = []) => {
  const { chain } = useAccount()
  const publicClient = usePublicClient()
  const [gasEstimate, setGasEstimate] = useState<GasEstimate | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  useEffect(() => {
    const fetchGasEstimate = async () => {
      if (!chain || !publicClient || !template) {
        setGasEstimate(null)
        return
      }
      setIsLoading(true)
      try {
        const estimate = await estimateContractDeployment(
          template,
          { ...params, premiumFeatures },
          publicClient,
          chain.id
        )
        setGasEstimate(estimate)
      } catch (error) {
        console.error('Error estimating gas:', error)
        // 🛡️ Fallback : fournir une estimation basique en cas d'erreur
        setGasEstimate({
          gasLimit: 800000n,
          gasPrice: BigInt('50000000000'), // 50 gwei par défaut
          deploymentCost: BigInt('40000000000000000'), // ~0.04 ETH
          platformFee: BigInt('800000000000000'), // ~0.0008 ETH
          premiumFee: 0n,
          totalCost: BigInt('40800000000000000') // ~0.0408 ETH
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchGasEstimate()
  }, [template, params, premiumFeatures, chain, publicClient])
  return { gasEstimate, isLoading }
}