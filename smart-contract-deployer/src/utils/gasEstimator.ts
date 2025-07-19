import { parseUnits } from 'viem'
import type { GasEstimate } from '../types'
import { getTotalPremiumPrice } from '../data/premiumFeatures'
import { config } from '../config'
const INFURA_API_KEY = config.infuraProjectId
const ALCHEMY_API_KEY = config.alchemyApiKey
interface GasPrice {
  standard: bigint
  fast: bigint
  instant: bigint
}
export const estimateGas = async (
  chainId: number,
  premiumFeatures: string[] = []
): Promise<GasEstimate> => {
  try {
    const gasPrice = await getGasPrice(chainId)
    let baseGasLimit = 800000n
    if (premiumFeatures.length > 0) {
      const featureGas = BigInt(premiumFeatures.length * 50000)
      baseGasLimit += featureGas
    }
    const gasLimit = (baseGasLimit * 110n) / 100n
    const deploymentCost = gasLimit * gasPrice.fast
    const platformFee = (deploymentCost * 2n) / 100n
    const premiumPriceETH = getTotalPremiumPrice(premiumFeatures)
    const premiumFee = parseUnits(premiumPriceETH.toString(), 18)
    const totalCost = deploymentCost + platformFee + premiumFee
    return {
      gasLimit,
      gasPrice: gasPrice.fast,
      deploymentCost,
      platformFee,
      premiumFee,
      totalCost,
    }
  } catch (error) {
    console.error('Error estimating gas:', error)
    const defaultGasPrice = getDefaultGasPrice(chainId)
    const gasLimit = 1000000n
    const deploymentCost = gasLimit * defaultGasPrice
    const platformFee = (deploymentCost * 2n) / 100n
    const premiumFee = parseUnits(getTotalPremiumPrice(premiumFeatures).toString(), 18)
    return {
      gasLimit,
      gasPrice: defaultGasPrice,
      deploymentCost,
      platformFee,
      premiumFee,
      totalCost: deploymentCost + platformFee + premiumFee,
    }
  }
}
export const estimateContractDeployment = async (
  _template: { id: string },
  params: Record<string, any>,
  _publicClient: any,
  chainId: number
): Promise<GasEstimate> => {
  const premiumFeatures = (params as any).premiumFeatures || []
  return estimateGas(chainId, premiumFeatures)
}
async function getGasPrice(chainId: number): Promise<GasPrice> {
  // 🔗 Essayer les vraies APIs avec fallback robuste
  console.log('⚡ Récupération des prix de gas en temps réel pour la chaîne:', chainId)

  // 1. Essayer Alchemy en premier (plus fiable)
  if (ALCHEMY_API_KEY) {
    try {
      const networkMap: Record<number, string> = {
        1: 'eth-mainnet',
        137: 'polygon-mainnet', 
        42161: 'arb-mainnet',
        10: 'opt-mainnet',
        8453: 'base-mainnet',
        43114: 'avax-mainnet'
      }

      const network = networkMap[chainId]
      if (network) {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5s timeout
        
        const response = await fetch(
          `https://${network}.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'eth_gasPrice',
              params: [],
              id: 1,
            }),
            signal: controller.signal
          }
        )
        
        clearTimeout(timeoutId)
        
        if (response.ok) {
          const data = await response.json()
          if (data && data.result) {
            const basePrice = BigInt(data.result)
            console.log('✅ Prix Alchemy récupéré:', (Number(basePrice) / 1e9).toFixed(2), 'gwei')
            return {
              standard: basePrice,
              fast: basePrice * 120n / 100n,
              instant: basePrice * 150n / 100n,
            }
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Alchemy failed:', error)
    }
  }

  // 2. Essayer Infura en fallback
  if (INFURA_API_KEY) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5s timeout
      
      const response = await fetch(
        `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_gasPrice',
            params: [],
            id: 1,
          }),
          signal: controller.signal
        }
      )
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const data = await response.json()
        if (data && data.result) {
          const basePrice = BigInt(data.result)
          console.log('✅ Prix Infura récupéré:', (Number(basePrice) / 1e9).toFixed(2), 'gwei')
          return {
            standard: basePrice,
            fast: basePrice * 120n / 100n,
            instant: basePrice * 150n / 100n,
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Infura failed:', error)
    }
  }

  // 3. Fallback vers les prix par défaut
  console.warn('🔄 Utilisation des prix par défaut pour la chaîne:', chainId)
  const defaultPrices: Record<number, GasPrice> = {
    1: {
      standard: parseUnits('30', 9),
      fast: parseUnits('50', 9),
      instant: parseUnits('70', 9),
    },
    137: {
      standard: parseUnits('30', 9),
      fast: parseUnits('50', 9),
      instant: parseUnits('100', 9),
    },
    42161: {
      standard: parseUnits('0.1', 9),
      fast: parseUnits('0.2', 9),
      instant: parseUnits('0.3', 9),
    },
    10: {
      standard: parseUnits('0.1', 9),
      fast: parseUnits('0.2', 9),
      instant: parseUnits('0.3', 9),
    },
    56: {
      standard: parseUnits('3', 9),
      fast: parseUnits('5', 9),
      instant: parseUnits('10', 9),
    },
    43114: {
      standard: parseUnits('25', 9),
      fast: parseUnits('35', 9),
      instant: parseUnits('50', 9),
    },
  }
  return defaultPrices[chainId] || defaultPrices[1]
}
function getDefaultGasPrice(chainId: number): bigint {
  const defaultPrices: Record<number, bigint> = {
    1: parseUnits('50', 9),
    137: parseUnits('50', 9),
    42161: parseUnits('0.2', 9),
    10: parseUnits('0.2', 9),
    56: parseUnits('5', 9),
    43114: parseUnits('35', 9),
    250: parseUnits('50', 9),
    1284: parseUnits('50', 9),
    1285: parseUnits('50', 9),
    100: parseUnits('5', 9),
    42220: parseUnits('5', 9),
    1666600000: parseUnits('30', 9),
  }
  return defaultPrices[chainId] || parseUnits('50', 9)
}