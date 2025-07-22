import { encodeAbiParameters, encodeFunctionData, parseUnits, type WalletClient, type PublicClient } from 'viem'
import { compileWithBackend } from './backendCompiler'
import { 
  UNIVERSAL_FACTORY_ABI, 
  UNIVERSAL_FACTORY_ADDRESSES, 
  getFactoryAddress 
} from '../config/factories'
import { 
  getContractTemplateType, 
  getContractPremiumFeatures, 
  generateSalt 
} from './contractMappings'
import type { TemplateType, GasEstimate, PremiumFeatureConfig } from '../types'
import { Contract } from 'ethers'
import { fixSimulationError } from './simulationErrorFix'

export interface DeploymentResult {
  address?: string
  hash?: string
  error?: string
}

/**
 * Encode les paramètres de construction du contrat selon le template
 */
function encodeConstructorParams(
  templateType: TemplateType,
  params: Record<string, any>
): string {
  try {
    switch (templateType) {
      case 'token':
        return encodeAbiParameters(
          [
            { name: 'name', type: 'string' },
            { name: 'symbol', type: 'string' },
            { name: 'totalSupply', type: 'uint256' },
            { name: 'decimals', type: 'uint8' }
          ],
          [
            params.name || 'MyToken',
            params.symbol || 'MTK',
            parseUnits((params.totalSupply || '1000000').toString(), params.decimals || 18), // Convert to wei
            params.decimals || 18
          ]
        )

      case 'nft':
        return encodeAbiParameters(
          [
            { name: 'name', type: 'string' },
            { name: 'symbol', type: 'string' },
            { name: 'maxSupply', type: 'uint256' },
            { name: 'baseURI', type: 'string' }
          ],
          [
            params.name || 'MyNFT',
            params.symbol || 'MNFT',
            BigInt(params.maxSupply || 10000),
            params.baseURI || ''
          ]
        )

      case 'dao':
        return encodeAbiParameters(
          [
            { name: 'name', type: 'string' },
            { name: 'governanceToken', type: 'address' },
            { name: 'proposalThreshold', type: 'uint256' },
            { name: 'votingPeriod', type: 'uint256' }
          ],
          [
            params.name || 'MyDAO',
            params.governanceTokenAddress as `0x${string}`,
            BigInt(params.proposalThreshold || 100),
            BigInt(params.votingPeriod || 50400)
          ]
        )

      case 'lock':
        return encodeAbiParameters(
          [
            { name: 'token', type: 'address' },
            { name: 'beneficiary', type: 'address' },
            { name: 'unlockTime', type: 'uint256' }
          ],
          [
            params.tokenAddress as `0x${string}`,
            params.beneficiary as `0x${string}`,
            BigInt(new Date(params.unlockTime).getTime() / 1000)
          ]
        )

      case 'liquidity-pool':
        return encodeAbiParameters(
          [
            { name: 'name', type: 'string' },
            { name: 'tokenA', type: 'address' },
            { name: 'tokenB', type: 'address' },
            { name: 'fee', type: 'uint24' },
            { name: 'initialPrice', type: 'uint256' }
          ],
          [
            params.name || 'Liquidity Pool',
            params.tokenA as `0x${string}`,
            params.tokenB as `0x${string}`,
            params.fee || 3000,
            BigInt(Math.floor((params.initialPrice || 1) * 1e18))
          ]
        )

      case 'yield-farming':
        return encodeAbiParameters(
          [
            { name: 'name', type: 'string' },
            { name: 'stakingToken', type: 'address' },
            { name: 'rewardToken', type: 'address' },
            { name: 'rewardRate', type: 'uint256' },
            { name: 'duration', type: 'uint256' }
          ],
          [
            params.name || 'Yield Farm',
            params.stakingToken as `0x${string}`,
            params.rewardToken as `0x${string}`,
            BigInt(Math.floor((params.rewardRate || 0.001) * 1e18)),
            BigInt((params.duration || 30) * 24 * 60 * 60) // Convert days to seconds
          ]
        )

      case 'gamefi-token':
        return encodeAbiParameters(
          [
            { name: 'name', type: 'string' },
            { name: 'symbol', type: 'string' },
            { name: 'maxSupply', type: 'uint256' },
            { name: 'mintPrice', type: 'uint256' },
            { name: 'burnRate', type: 'uint256' }
          ],
          [
            params.name || 'GameToken',
            params.symbol || 'GAME',
            parseUnits((params.maxSupply || '1000000').toString(), 18), // CORRECT: Convert to wei
            BigInt(Math.floor((parseFloat(params.mintPrice) || 0.01) * 1e18)),
            BigInt((parseFloat(params.burnRate) || 2) * 100) // Convert to basis points
          ]
        )

      case 'nft-marketplace':
        return encodeAbiParameters(
          [
            { name: 'name', type: 'string' },
            { name: 'nftContract', type: 'address' },
            { name: 'platformFee', type: 'uint256' },
            { name: 'creatorFee', type: 'uint256' },
            { name: 'allowMinting', type: 'bool' }
          ],
          [
            params.name || 'NFT Market',
            params.nftContract as `0x${string}`,
            BigInt(Math.floor((params.platformFee || 2.5) * 100)), // Convert to basis points
            BigInt(Math.floor((params.creatorFee || 5.0) * 100)), // Convert to basis points
            !!params.allowMinting
          ]
        )

      case 'revenue-sharing':
        return encodeAbiParameters(
          [
            { name: 'name', type: 'string' },
            { name: 'symbol', type: 'string' },
            { name: 'totalSupply', type: 'uint256' },
            { name: 'businessWallet', type: 'address' },
            { name: 'distributionPeriod', type: 'uint256' }
          ],
          [
            params.name || 'Revenue Token',
            params.symbol || 'REV',
            parseUnits((params.totalSupply || '1000000').toString(), 18), // Convert to wei
            params.businessWallet as `0x${string}`,
            BigInt((params.distributionPeriod || 30) * 24 * 60 * 60)
          ]
        )

      case 'loyalty-program':
        return encodeAbiParameters(
          [
            { name: 'name', type: 'string' },
            { name: 'pointsPerPurchase', type: 'uint256' },
            { name: 'redemptionRate', type: 'uint256' },
            { name: 'transferable', type: 'bool' },
            { name: 'expirable', type: 'bool' }
          ],
          [
            params.name || 'Loyalty Program',
            BigInt(params.pointsPerPurchase || 10),
            BigInt(Math.floor((params.redemptionRate || 0.01) * 1e18)),
            !!params.transferable,
            params.expirable !== false // Default to true
          ]
        )

      case 'dynamic-nft':
        return encodeAbiParameters(
          [
            { name: 'name', type: 'string' },
            { name: 'symbol', type: 'string' },
            { name: 'maxSupply', type: 'uint256' },
            { name: 'evolvable', type: 'bool' },
            { name: 'mergeable', type: 'bool' }
          ],
          [
            params.name || 'Dynamic NFTs',
            params.symbol || 'DNFT',
            BigInt(params.maxSupply || 10000),
            params.evolvable !== false, // Default to true
            !!params.mergeable
          ]
        )

      case 'social-token':
        return encodeAbiParameters(
          [
            { name: 'name', type: 'string' },
            { name: 'symbol', type: 'string' },
            { name: 'initialSupply', type: 'uint256' },
            { name: 'creatorShare', type: 'uint256' },
            { name: 'communityGoverned', type: 'bool' }
          ],
          [
            params.creatorName || 'Social Token',
            params.symbol || 'SOCIAL',
            parseUnits((params.initialSupply || '1000000').toString(), 18), // Convert to wei
            BigInt((params.creatorShare || 20) * 100), // Convert to basis points
            params.communityGoverned !== false // Default to true
          ]
        )

      default:
        return '0x'
    }
  } catch (error) {
    console.error('Error encoding constructor params:', error)
    return '0x'
  }
}

/**
 * Déploie un contrat via la UniversalFactory
 */
export async function deployContractWithFactory(
  templateType: TemplateType,
  params: Record<string, any>,
  walletClient: WalletClient,
  publicClient: PublicClient,
  gasEstimate: GasEstimate,
  premiumFeatures: string[] = [],
  featureConfigs?: PremiumFeatureConfig
): Promise<DeploymentResult> {
  try {
    console.log('🏭 Starting deployment via UniversalFactory...')
    console.log('📋 Template:', templateType)
    console.log('🎨 Premium features:', premiumFeatures)
    
    // 1. Obtenir l'adresse de la factory
    const chainId = await walletClient.getChainId()
    const factoryAddress = getFactoryAddress(chainId)
    
    if (!factoryAddress) {
      throw new Error(`UniversalFactory not deployed on chain ${chainId}`)
    }

    console.log('🏭 Factory address:', factoryAddress)

    // 2. Compiler le contrat
    console.log('⚙️ Compiling contract...')
    const { bytecode, abi } = await compileWithBackend(templateType, params, premiumFeatures, featureConfigs)
    
    if (!bytecode || !abi) {
      throw new Error('Failed to compile contract')
    }

    console.log('✅ Contract compiled successfully')
    console.log('📦 Bytecode length:', bytecode.length)

    // 3. Encoder les paramètres du constructeur
    console.log('🔧 Encoding constructor parameters...')
    const constructorParams = encodeConstructorParams(templateType, params)
    
    console.log('✅ Constructor params encoded:', constructorParams.length, 'characters')

    // 4. Mapper les types pour le contrat
    const contractTemplateType = getContractTemplateType(templateType)
    const contractPremiumFeatures = getContractPremiumFeatures(premiumFeatures)
    
    console.log('🔄 Mapped template type:', contractTemplateType)
    console.log('🔄 Mapped premium features:', contractPremiumFeatures)

    // 5. Générer un salt unique
    const salt = generateSalt(
      walletClient.account?.address || '0x0',
      templateType,
      Date.now()
    )

    console.log('🧂 Generated salt:', salt)

    // 6. Préparer la transaction - UNE SEULE fonction deployContract (plus sûr)
    const deployData = encodeFunctionData({
      abi: UNIVERSAL_FACTORY_ABI,
      functionName: 'deployContract', // SEULE fonction disponible maintenant
      args: [contractTemplateType, bytecode as `0x${string}`, constructorParams as `0x${string}`, contractPremiumFeatures, salt as `0x${string}`]
    })

    console.log('📤 Sending transaction...')

    // 🔍 DEBUG - Analyser les données de transaction
    console.log('🔍 TRANSACTION DEBUG:')
    console.log('  Function: deployContract (seule fonction disponible)')
    console.log('  Deploy data length:', deployData.length)
    console.log('  Deploy data preview:', deployData.substring(0, 100) + '...')
    console.log('  Factory address:', factoryAddress)
    console.log('  Value to send:', gasEstimate.totalCost.toString(), 'wei')
    console.log('  Gas limit:', gasEstimate.gasLimit.toString())
    
    // Vérifier la signature de fonction
    const functionSelector = deployData.substring(0, 10)
    console.log('  Function selector:', functionSelector)
    
    console.log('  Contract simplifié: une seule fonction deployContract (plus sûr)')
    
    // Vérifier l'ABI
    console.log('🔍 ABI VERIFICATION:')
    const functionName = 'deployContract' // Seule fonction disponible dans le contrat
    const functions = UNIVERSAL_FACTORY_ABI.filter(item => item.type === 'function')
    const targetFunction = functions.find((item: any) => item.name === functionName)
    
    if (targetFunction) {
      console.log('  ✅ Function found in ABI:', targetFunction.name)
      console.log('  Inputs count:', targetFunction.inputs?.length || 0)
      console.log('  Args provided: 5 (templateType, bytecode, constructorParams, features, salt)')
    } else {
      console.log('  ❌ Function NOT found in ABI!')
      console.log('  Available functions:', functions.map((f: any) => f.name))
    }
    
    // Test de validation des paramètres
    console.log('🔍 PARAMETER VALIDATION:')
    console.log('  Contract template type:', contractTemplateType, typeof contractTemplateType)
    console.log('  Bytecode valid:', bytecode.startsWith('0x'), bytecode.length)
    console.log('  Constructor params valid:', constructorParams.startsWith('0x'), constructorParams.length)
    console.log('  Premium features:', contractPremiumFeatures)
    console.log('  Salt valid:', salt.startsWith('0x'), salt.length)

    // 7. Envoyer la transaction avec gestion des erreurs de simulation
    let hash: `0x${string}`
    
    try {
      console.log('📤 Attempting transaction...')
      
      hash = await walletClient.sendTransaction({
      account: walletClient.account!,
      to: factoryAddress as `0x${string}`,
      data: deployData,
      value: gasEstimate.totalCost,
      gas: gasEstimate.gasLimit,
      gasPrice: gasEstimate.gasPrice,
      chain: walletClient.chain
    })
      
    } catch (txError: any) {
      console.error('❌ Transaction failed:', txError)
      
      // Si c'est une erreur de simulation, tentative de fix
      if (txError.message.includes('1002') || 
          txError.message.includes('Unknown Signature') ||
          txError.message.includes('simulation failed')) {
        
        console.log('🔧 Attempting to fix simulation error...')
        
        try {
          const { diagnosis, fixes, solutions } = await fixSimulationError(
            walletClient,
            publicClient,
            factoryAddress,
            deployData,
            gasEstimate.totalCost,
            gasEstimate.gasLimit,
            txError
          )
          
          console.log('🚨 ERREUR DE SIMULATION DÉTECTÉE:')
          console.log('📋 Diagnostic:', diagnosis.message)
          console.log('🔧 Tentatives de fix:', fixes.map(f => `${f.method}: ${f.success ? '✅' : '❌'}`))
          console.log('💡 Solutions recommandées:')
          solutions.forEach((solution, i) => console.log(`  ${i + 1}. ${solution}`))
          
          // Si l'estimation manuelle a marché, on propose d'utiliser ce gas
          const gasEstimation = fixes.find(f => f.method === 'manual_gas_estimation' && f.success)
          if (gasEstimation?.gasUsed) {
            console.log('💡 Tentative avec gas estimé manuellement...')
            
            try {
              hash = await walletClient.sendTransaction({
                account: walletClient.account!,
                to: factoryAddress as `0x${string}`,
                data: deployData,
                value: gasEstimate.totalCost,
                gas: BigInt(Math.floor(Number(gasEstimation.gasUsed) * 1.3)), // Marge 30%
                gasPrice: gasEstimate.gasPrice,
                chain: walletClient.chain
              })
              
              console.log('✅ Transaction réussie avec gas manuel!')
              
            } catch (retryError) {
              console.error('❌ Retry with manual gas also failed:', retryError)
              throw new Error(`Simulation error: ${diagnosis.message}\n\nSolutions:\n${solutions.join('\n')}\n\nOriginal error: ${txError.message}`)
            }
          } else {
            throw new Error(`Simulation error: ${diagnosis.message}\n\nSolutions:\n${solutions.join('\n')}\n\nOriginal error: ${txError.message}`)
          }
          
        } catch (fixError) {
          console.error('❌ Fix attempt failed:', fixError)
          throw txError // Rethrow original error
        }
        
      } else {
        // Pour les autres erreurs, on relance telle quelle
        throw txError
      }
    }

    console.log('📝 Transaction sent:', hash)

    // 8. Attendre la confirmation
    console.log('⏳ Waiting for transaction confirmation...')
    const receipt = await publicClient.waitForTransactionReceipt({ hash })

    if (receipt.status === 'reverted') {
      throw new Error('Transaction reverted')
    }

    console.log('✅ Transaction confirmed in block:', receipt.blockNumber)

    // 9. Extraire l'adresse du contrat déployé depuis les logs
    const contractAddress = await extractDeployedAddress(publicClient, receipt.logs, factoryAddress)

    if (!contractAddress) {
      throw new Error('Could not extract deployed contract address')
    }

    console.log('🎉 Contract deployed at:', contractAddress)

    return {
      address: contractAddress,
      hash: hash
    }

  } catch (error: any) {
    console.error('❌ Deployment failed:', error)
    return {
      error: error.message || 'Deployment failed'
    }
  }
}

/**
 * Extrait l'adresse du contrat déployé depuis les logs de la transaction
 */
async function extractDeployedAddress(
  publicClient: PublicClient,
  logs: any[],
  factoryAddress: string
): Promise<string | null> {
  try {
    // Rechercher l'événement ContractDeployed
    for (const log of logs) {
      if (log.address?.toLowerCase() === factoryAddress.toLowerCase()) {
        // Le premier topic après l'event signature est l'adresse du contrat
        if (log.topics && log.topics.length >= 2) {
          // Décoder l'adresse depuis le premier topic (après l'event signature)
          const addressHex = log.topics[1]
          if (addressHex) {
            // Convertir le bytes32 en adresse (prendre les 20 derniers bytes)
            const address = '0x' + addressHex.slice(-40)
            return address
          }
        }
      }
    }
    return null
  } catch (error) {
    console.error('Error extracting deployed address:', error)
    return null
  }
}

// Alias pour maintenir la compatibilité avec l'ancienne API
export const deployContractWithWagmi = deployContractWithFactory 

// Exemple d'utilisation de l'ABI complète :
export const getUniversalFactoryContract = (chainId: number, signer: any) => {
  const factoryAddress = getFactoryAddress(chainId)
  if (!factoryAddress) {
    throw new Error(`Factory not deployed on chain ${chainId}`)
  }
  
  // Utilisation avec ethers/viem/wagmi
  return new Contract(factoryAddress, UNIVERSAL_FACTORY_ABI, signer)
}

// Fonctions disponibles avec l'ABI complète :
// - deployContract() : Déploiement avec fonctionnalités premium
// - deploySimpleContract() : Déploiement simple 
// - estimateDeploymentCostWithFeatures() : Estimation des coûts
// - predictDeploymentAddress() : Prédiction d'adresse CREATE2
// - getUserDeployments() : Historique utilisateur
// - totalDeployments() : Statistiques globales
// - BASE_DEPLOYMENT_COST() : Coût de base
// - PLATFORM_FEE_ADDRESS() : Adresse des frais
// - Et 17+ autres fonctions disponibles ! 