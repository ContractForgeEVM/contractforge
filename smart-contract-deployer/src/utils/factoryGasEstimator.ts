import { createPublicClient, http } from 'viem'
import { getFactoryAddress, UNIVERSAL_FACTORY_ABI } from '../config/factories'
import { getContractTemplateType, getContractPremiumFeatures } from './contractMappings'
import type { GasEstimate, TemplateType } from '../types'
import { getGasPrice } from './web3Utils'

// Configuration des RPCs pour chaque chaîne
const RPC_URLS: Record<number, string> = {
  1: 'https://eth-mainnet.g.alchemy.com/v2/iV2r1fZGy1Aeyie6-XpaYa8UNnV8hTWp',
  137: 'https://polygon-mainnet.g.alchemy.com/v2/iV2r1fZGy1Aeyie6-XpaYa8UNnV8hTWp',
  42161: 'https://arb-mainnet.g.alchemy.com/v2/iV2r1fZGy1Aeyie6-XpaYa8UNnV8hTWp',
  10: 'https://opt-mainnet.g.alchemy.com/v2/iV2r1fZGy1Aeyie6-XpaYa8UNnV8hTWp',
  8453: 'https://base-mainnet.g.alchemy.com/v2/iV2r1fZGy1Aeyie6-XpaYa8UNnV8hTWp',
  56: 'https://bsc-mainnet.nodereal.io/v1/64a9df0874fb4a93b9d0a3849de012d3',
  43114: 'https://api.avax.network/ext/bc/C/rpc',
  11155111: 'https://eth-sepolia.g.alchemy.com/v2/iV2r1fZGy1Aeyie6-XpaYa8UNnV8hTWp',
  80001: 'https://polygon-mumbai.g.alchemy.com/v2/iV2r1fZGy1Aeyie6-XpaYa8UNnV8hTWp',
  31337: 'http://localhost:8545', // Hardhat
  1337: 'http://localhost:7545'   // Ganache
}

/**
 * Obtient les détails de la chaîne selon l'ID
 */
function getChainConfig(chainId: number) {
  const rpcUrl = RPC_URLS[chainId] || RPC_URLS[1]
  
  const chains = {
    1: { 
      id: 1, 
      name: 'Ethereum', 
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: { default: { http: [rpcUrl] }, public: { http: [rpcUrl] } }
    },
    137: { 
      id: 137, 
      name: 'Polygon', 
      nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
      rpcUrls: { default: { http: [rpcUrl] }, public: { http: [rpcUrl] } }
    },
    42161: { 
      id: 42161, 
      name: 'Arbitrum One', 
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: { default: { http: [rpcUrl] }, public: { http: [rpcUrl] } }
    },
    10: { 
      id: 10, 
      name: 'Optimism', 
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: { default: { http: [rpcUrl] }, public: { http: [rpcUrl] } }
    },
    8453: { 
      id: 8453, 
      name: 'Base', 
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: { default: { http: [rpcUrl] }, public: { http: [rpcUrl] } }
    },
    56: { 
      id: 56, 
      name: 'BNB Smart Chain', 
      nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
      rpcUrls: { default: { http: [rpcUrl] }, public: { http: [rpcUrl] } }
    },
    43114: { 
      id: 43114, 
      name: 'Avalanche', 
      nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 },
      rpcUrls: { default: { http: [rpcUrl] }, public: { http: [rpcUrl] } }
    },
    11155111: { 
      id: 11155111, 
      name: 'Sepolia', 
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: { default: { http: [rpcUrl] }, public: { http: [rpcUrl] } }
    },
    80001: { 
      id: 80001, 
      name: 'Mumbai', 
      nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
      rpcUrls: { default: { http: [rpcUrl] }, public: { http: [rpcUrl] } }
    },
    31337: { 
      id: 31337, 
      name: 'Hardhat', 
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: { default: { http: [rpcUrl] }, public: { http: [rpcUrl] } }
    },
    1337: { 
      id: 1337, 
      name: 'Ganache', 
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: { default: { http: [rpcUrl] }, public: { http: [rpcUrl] } }
    }
  }
  
  return chains[chainId as keyof typeof chains] || chains[1]
}

/**
 * Estime le coût de déploiement via la UniversalFactory
 */
export async function estimateFactoryGas(
  chainId: number,
  templateType: TemplateType,
  premiumFeatures: string[] = []
): Promise<GasEstimate> {
  try {
    console.log(`🔍 Estimating gas for ${templateType} on chain ${chainId}...`)
    
    // 1. Vérifier que la factory est déployée sur cette chaîne
    const factoryAddress = getFactoryAddress(chainId)
    if (!factoryAddress) {
      const chainNames: Record<number, string> = {
        1: 'Ethereum Mainnet',
        137: 'Polygon',
        42161: 'Arbitrum One',
        10: 'Optimism',
        8453: 'Base',
        56: 'BSC',
        43114: 'Avalanche',
        11155111: 'Sepolia',
        80001: 'Mumbai',
        31337: 'Hardhat Local',
        1337: 'Ganache Local'
      }
      
      const networkName = chainNames[chainId] || `Chain ${chainId}`
      console.warn(`⚠️ UniversalFactory not deployed on ${networkName}`)
      
      if (chainId === 31337 || chainId === 1337) {
        console.log(`💡 Pour tester en local, exécutez : npx hardhat run scripts/setup-factory.js --network localhost`)
      } else {
        console.log(`💡 La factory doit être déployée sur ${networkName} avant de pouvoir l'utiliser`)
      }
      
      throw new Error(`UniversalFactory not deployed on ${networkName}. Please deploy the factory first or switch to a supported network.`)
    }

    // 2. Créer un client pour lire le contrat
    const rpcUrl = RPC_URLS[chainId]
    if (!rpcUrl) {
      throw new Error(`No RPC configured for chain ${chainId}`)
    }

    const chainConfig = getChainConfig(chainId)
    const publicClient = createPublicClient({
      chain: chainConfig,
      transport: http(rpcUrl)
    })

    // 3. Mapper les paramètres
    const contractTemplateType = getContractTemplateType(templateType)
    const contractPremiumFeatures = getContractPremiumFeatures(premiumFeatures)

    console.log(`🔄 Template type: ${contractTemplateType}, Features: [${contractPremiumFeatures.join(', ')}]`)

    // 4. Vérifier que le contrat existe à cette adresse
    const contractCode = await publicClient.getCode({
      address: factoryAddress as `0x${string}`
    })
    
    if (!contractCode || contractCode === '0x') {
      console.warn(`⚠️ No contract deployed at ${factoryAddress} on chain ${chainId}`)
      return await getFallbackEstimation(chainId, templateType, premiumFeatures)
    }

    console.log(`✅ UniversalFactoryV2 contract found at ${factoryAddress}`)

    // 5. Appeler la fonction d'estimation du contrat UniversalFactoryV2
    const totalCost = await publicClient.readContract({
      address: factoryAddress as `0x${string}`,
      abi: UNIVERSAL_FACTORY_ABI,
      functionName: 'estimateDeploymentCostWithFeatures',
      args: [contractTemplateType, contractPremiumFeatures]
    }) as bigint

    console.log(`✅ UniversalFactoryV2 estimation successful: ${totalCost.toString()}`)

    // Calculer les composants séparément pour l'affichage et la logique
    const deploymentCost = 1000000000000000n // BASE_DEPLOYMENT_COST (0.001 ETH)
    const platformFee = (deploymentCost * 2n) / 100n // PLATFORM_FEE_PERCENTAGE = 2%
    const premiumFee = totalCost - deploymentCost - platformFee

    console.log('💰 Factory estimation (V2 - valeur unique):')
    console.log(`  - Deployment cost: ${deploymentCost.toString()} wei (calculé)`)
    console.log(`  - Platform fee: ${platformFee.toString()} wei (calculé)`)
    console.log(`  - Premium fee: ${premiumFee.toString()} wei (calculé)`)
    console.log(`  - Total cost: ${totalCost.toString()} wei (depuis contrat)`)

    // 6. Obtenir le prix du gas actuel
    const gasPrice = await getGasPrice(chainId)
    console.log(`⛽ Current gas price: ${gasPrice.toString()} wei`)

    // 7. Estimer le gas limit pour la transaction de déploiement
    // Le gas limit dépend de la complexité du contrat et des features
    let baseGasLimit = 500000n // Base pour l'appel à la factory

    // Ajouter du gas selon le template
    const templateGasMap: Record<TemplateType, bigint> = {
      'token': 300000n,
      'nft': 400000n,
      'dao': 600000n,
      'lock': 200000n,
      'liquidity-pool': 800000n,
      'yield-farming': 900000n,
      'gamefi-token': 700000n,
      'nft-marketplace': 1000000n,
      'revenue-sharing': 500000n,
      'loyalty-program': 400000n,
      'dynamic-nft': 600000n,
      'social-token': 500000n
    }

    baseGasLimit += templateGasMap[templateType] || 400000n

    // Ajouter du gas pour chaque premium feature
    baseGasLimit += BigInt(premiumFeatures.length * 50000)

    // Ajouter une marge de sécurité de 20%
    const gasLimit = (baseGasLimit * 120n) / 100n

    console.log(`⛽ Estimated gas limit: ${gasLimit.toString()}`)

    return {
      gasLimit,
      gasPrice,
      deploymentCost: totalCost, // Utiliser le coût total de la factory
      platformFee,
      premiumFee,
      totalCost: totalCost + (gasLimit * gasPrice) // Ajouter les frais de gas
    }

  } catch (error: any) {
    console.error('❌ Factory gas estimation failed:', error)
    
    // Si erreur dans l'estimation via contrat, utiliser le fallback
    console.warn('⚠️ Contract estimation failed, falling back to static estimation...')
    return await getFallbackEstimation(chainId, templateType, premiumFeatures)
  }
}



/**
 * Estimation de fallback si la factory n'est pas disponible
 */
async function getFallbackEstimation(
  chainId: number,
  templateType: TemplateType,
  premiumFeatures: string[]
): Promise<GasEstimate> {
  try {
    const gasPrice = await getGasPrice(chainId)
    
    // Estimations statiques basées sur les coûts moyens
    const templateCosts: Record<TemplateType, bigint> = {
      'token': 1000000000000000n, // 0.001 ETH
      'nft': 1500000000000000n,   // 0.0015 ETH
      'dao': 2000000000000000n,   // 0.002 ETH
      'lock': 800000000000000n,   // 0.0008 ETH
      'liquidity-pool': 3000000000000000n,  // 0.003 ETH
      'yield-farming': 3500000000000000n,   // 0.0035 ETH
      'gamefi-token': 2500000000000000n,    // 0.0025 ETH
      'nft-marketplace': 4000000000000000n, // 0.004 ETH
      'revenue-sharing': 2000000000000000n, // 0.002 ETH
      'loyalty-program': 1800000000000000n, // 0.0018 ETH
      'dynamic-nft': 2200000000000000n,     // 0.0022 ETH
      'social-token': 1800000000000000n     // 0.0018 ETH
    }

    const baseCost = templateCosts[templateType] || 1500000000000000n
    const premiumFee = BigInt(premiumFeatures.length * 10) * 1000000000000000n // 0.01 ETH par feature
    const platformFee = (baseCost * 2n) / 100n // 2%
    const deploymentCost = baseCost
    const totalCost = deploymentCost + platformFee + premiumFee

    const gasLimit = 1000000n
    
    return {
      gasLimit,
      gasPrice,
      deploymentCost,
      platformFee,
      premiumFee,
      totalCost
    }
  } catch (error) {
    console.error('❌ Fallback estimation also failed:', error)
    
    // Dernier recours: valeurs par défaut
    return {
      gasLimit: 1000000n,
      gasPrice: 20000000000n, // 20 gwei
      deploymentCost: 1000000000000000n, // 0.001 ETH
      platformFee: 20000000000000n,      // 0.00002 ETH
      premiumFee: 0n,
      totalCost: 1020000000000000n       // 0.00102 ETH
    }
  }
}

// Maintenir la compatibilité avec l'ancien système
export { estimateFactoryGas as estimateGas } 