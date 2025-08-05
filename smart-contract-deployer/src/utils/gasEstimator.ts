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
  premiumFeatures: string[] = [],
  templateType?: string,
  walletAddress?: string // 🎯 Nouvelle paramètre pour le compte dev
): Promise<GasEstimate> => {
  try {
    const gasPrice = await getGasPrice(chainId)
    
    // Gas limits adaptatifs selon le template
    let baseGasLimit = getTemplateGasLimit(templateType)
    
    if (premiumFeatures.length > 0) {
      const featureGas = BigInt(premiumFeatures.length * 50000)
      baseGasLimit += featureGas
    }
    
    // Marge plus importante pour les contrats complexes
    const margin = templateType && ['social-token', 'gamefi-token', 'liquidity-pool', 'yield-farming'].includes(templateType) 
      ? 140n // +40% pour les contrats complexes
      : 120n // +20% pour les contrats simples
    
    const gasLimit = (baseGasLimit * margin) / 100n
    const deploymentCost = gasLimit * gasPrice.fast
    const platformFee = (deploymentCost * 2n) / 100n
    // 🌟 Passer l'adresse wallet pour les prix premium
    const premiumPriceETH = getTotalPremiumPrice(premiumFeatures, walletAddress)
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
    // 🌟 Passer l'adresse wallet même dans le fallback
    const premiumFee = parseUnits(getTotalPremiumPrice(premiumFeatures, walletAddress).toString(), 18)
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
  template: { id: string },
  params: Record<string, any>,
  _publicClient: any,
  chainId: number
): Promise<GasEstimate> => {
  const premiumFeatures = (params as any).premiumFeatures || []
  return estimateGas(chainId, premiumFeatures, template.id)
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

// Fonction pour obtenir le gas limit selon le template
function getTemplateGasLimit(templateType?: string): bigint {
  const gasLimits: Record<string, bigint> = {
    // Templates simples - gas limit bas
    'token': 800000n,        // ERC20 simple
    'nft': 900000n,          // ERC721 simple
    'dao': 1000000n,         // DAO basique
    'lock': 700000n,         // Token Lock simple
    
    // Templates complexes - gas limit élevé
    'social-token': 2000000n,      // Social Token (complexe) - Augmenté
    'liquidity-pool': 2200000n,    // Liquidity Pool (très complexe) - Augmenté
    'yield-farming': 2500000n,     // Yield Farming (très complexe) - Augmenté
    'gamefi-token': 2200000n,      // GameFi Token (complexe) - Augmenté
    'nft-marketplace': 1600000n,   // NFT Marketplace (complexe)
    'revenue-sharing': 1400000n,   // Revenue Sharing (complexe)
    'loyalty-program': 1200000n,   // Loyalty Program (complexe)
    'dynamic-nft': 1300000n,       // Dynamic NFT (complexe)
  }
  
  return gasLimits[templateType || ''] || 1200000n // Par défaut pour les templates inconnus
}

// Fonction pour obtenir les recommandations de gas selon le template
export const getGasRecommendations = (templateType?: string): {
  recommended: bigint
  safe: bigint
  description: string
} => {
  const baseLimit = getTemplateGasLimit(templateType)
  const recommended = (baseLimit * 120n) / 100n // +20% marge
  const safe = (baseLimit * 150n) / 100n // +50% marge de sécurité
  
  const descriptions: Record<string, string> = {
    'token': 'ERC20 simple - Gas limit bas',
    'nft': 'ERC721 simple - Gas limit modéré',
    'dao': 'DAO basique - Gas limit modéré',
    'lock': 'Token Lock simple - Gas limit bas',
    'social-token': 'Social Token complexe - Gas limit élevé',
    'liquidity-pool': 'Liquidity Pool très complexe - Gas limit très élevé',
    'yield-farming': 'Yield Farming très complexe - Gas limit très élevé',
    'gamefi-token': 'GameFi Token complexe - Gas limit élevé',
    'nft-marketplace': 'NFT Marketplace complexe - Gas limit élevé',
    'revenue-sharing': 'Revenue Sharing complexe - Gas limit élevé',
    'loyalty-program': 'Loyalty Program complexe - Gas limit modéré',
    'dynamic-nft': 'Dynamic NFT complexe - Gas limit modéré',
  }
  
  return {
    recommended,
    safe,
    description: descriptions[templateType || ''] || 'Template standard'
  }
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