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
            BigInt(params.totalSupply || '1000000'), // 🛠️ FIX: Send raw value, backend multiplies by decimals
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
            BigInt(params.maxSupply || '1000000'), // 🛠️ FIX: Send raw value, backend multiplies by decimals
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
            BigInt(params.totalSupply || '1000000'), // 🛠️ FIX: Send raw value, backend multiplies by decimals
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
            BigInt(params.initialSupply || '1000000'), // 🛠️ FIX: Send raw value, backend multiplies by decimals
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
  featureConfigs?: PremiumFeatureConfig,
  onStatusChange?: (status: 'preparing' | 'sending' | 'confirming') => void
): Promise<DeploymentResult> {
  try {
    console.log('🏭 Starting deployment via UniversalFactory...')
    console.log('📋 Template:', templateType)
    console.log('🎨 Premium features:', premiumFeatures)
    
    // 1. Obtenir l'adresse de la factory
    const chainId = await walletClient.getChainId()
    const factoryAddress = getFactoryAddress(chainId)
    
    // 🔄 Status: Preparing
    onStatusChange?.('preparing')
    
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

    // 🔄 Status: Sending
    onStatusChange?.('sending')

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
    
    // 🔄 Status: Confirming
    onStatusChange?.('confirming')
    
    const receipt = await publicClient.waitForTransactionReceipt({ hash })

    if (receipt.status === 'reverted') {
      throw new Error('Transaction reverted')
    }

    console.log('✅ Transaction confirmed in block:', receipt.blockNumber)

    // 9. Extraire l'adresse du contrat déployé depuis les logs
    console.log('🔍 Extracting deployed contract address from logs...')
    console.log('📋 Receipt logs count:', receipt.logs.length)
    console.log('📋 Receipt status:', receipt.status)
    console.log('📋 Receipt blockNumber:', receipt.blockNumber)
    console.log('📋 Receipt transactionHash:', receipt.transactionHash)
    
    const contractAddress = await extractDeployedAddress(publicClient, receipt.logs, factoryAddress)

    if (!contractAddress) {
      console.error('❌ Could not extract deployed contract address from logs')
      console.log('📋 Available logs:', receipt.logs.map((log, i) => ({
        index: i,
        address: log.address,
        topics: log.topics,
        data: log.data
      })))
      
      // Fallback: Essayer de prédire l'adresse CREATE2
      console.log('🔄 Attempting CREATE2 address prediction as fallback...')
      try {
        const predictedAddress = await predictDeployedAddress(
          factoryAddress,
          walletClient.account?.address || '0x0',
          templateType,
          Date.now()
        )
        console.log('🎯 Predicted CREATE2 address:', predictedAddress)
        
        if (predictedAddress) {
          console.log('✅ Using predicted address as fallback')
          return {
            address: predictedAddress,
            hash: hash
          }
        }
      } catch (predictionError) {
        console.error('❌ Address prediction failed:', predictionError)
      }
      
      // Dernier recours: Utiliser l'API de l'explorateur
      console.log('🔄 Attempting explorer API fallback...')
      try {
        const explorerAddress = await getContractAddressFromExplorer(hash, chainId)
        if (explorerAddress) {
          console.log('✅ Found address from explorer API:', explorerAddress)
          return {
            address: explorerAddress,
            hash: hash
          }
        }
      } catch (explorerError) {
        console.error('❌ Explorer API failed:', explorerError)
      }
      
      throw new Error('Could not extract deployed contract address')
    }

    console.log('🎉 Contract deployed at:', contractAddress)
    console.log('🔍 Address validation:', {
      isAddress: contractAddress.startsWith('0x') && contractAddress.length === 42,
      address: contractAddress,
      isCreator: contractAddress.toLowerCase() === walletClient.account?.address?.toLowerCase()
    })

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
 * Récupère l'adresse du contrat déployé depuis l'API de l'explorateur
 */
async function getContractAddressFromExplorer(txHash: string, chainId: number): Promise<string | null> {
  try {
    const explorers: Record<number, string> = {
      1: 'https://api.etherscan.io',
      137: 'https://api.polygonscan.com',
      42161: 'https://api.arbiscan.io',
      10: 'https://api-optimistic.etherscan.io',
      56: 'https://api.bscscan.com',
      43114: 'https://api.snowtrace.io'
    }
    
    const explorerUrl = explorers[chainId]
    if (!explorerUrl) {
      console.log('❌ No explorer API available for chain:', chainId)
      return null
    }
    
    // Pour l'instant, on retourne null car les APIs d'explorateur nécessitent des clés API
    // Cette fonction peut être implémentée plus tard si nécessaire
    console.log('🔍 Explorer API not implemented yet for chain:', chainId)
    return null
  } catch (error) {
    console.error('Error getting address from explorer:', error)
    return null
  }
}

/**
 * Prédit l'adresse du contrat déployé en utilisant CREATE2
 */
function predictDeployedAddress(
  factoryAddress: string,
  deployerAddress: string,
  templateType: string,
  timestamp: number
): string {
  try {
    // Générer le même salt que celui utilisé pour le déploiement
    const salt = generateSalt(deployerAddress, templateType, timestamp)
    
    // Pour CREATE2, nous avons besoin du bytecode du contrat
    // Comme nous ne l'avons pas ici, nous allons utiliser une approche différente
    // Nous allons essayer de récupérer l'adresse depuis les logs de la factory
    
    console.log('🔮 CREATE2 prediction attempt:', {
      factoryAddress,
      deployerAddress,
      salt,
      timestamp
    })
    
    // Pour l'instant, retourner une adresse vide car nous ne pouvons pas prédire
    // l'adresse CREATE2 sans le bytecode exact
    console.log('❌ CREATE2 prediction requires bytecode - not implemented yet')
    return ''
  } catch (error) {
    console.error('Error predicting CREATE2 address:', error)
    return ''
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
    console.log('🔍 Searching for ContractDeployed event in logs...')
    console.log('🏭 Factory address to match:', factoryAddress)
    console.log('📋 Total logs to analyze:', logs.length)
    
    // Rechercher l'événement ContractDeployed
    for (let i = 0; i < logs.length; i++) {
      const log = logs[i]
      console.log(`📋 Log ${i}:`, {
        address: log.address,
        topicsCount: log.topics?.length || 0,
        topics: log.topics,
        data: log.data
      })
      
      if (log.address?.toLowerCase() === factoryAddress.toLowerCase()) {
        console.log('✅ Found log from factory address')
        
        // Vérifier si c'est l'événement ContractDeployed
        // La signature de l'événement est: ContractDeployed(address,address,uint8,uint256,uint256)
        // Le topic[0] devrait être la signature de l'événement
        if (log.topics && log.topics.length >= 3) { // Au moins 3 topics: signature + deployer + deployedContract
          console.log('📋 Topics found:', log.topics)
          
          // Le troisième topic (index 2) est l'adresse du contrat déployé
          const deployedContractHex = log.topics[2]
          if (deployedContractHex) {
            console.log('🔍 Deployed contract hex from topic[2]:', deployedContractHex)
            
            // Convertir le bytes32 en adresse (prendre les 20 derniers bytes)
            const address = '0x' + deployedContractHex.slice(-40)
            console.log('🎯 Extracted address:', address)
            
            // Validation de l'adresse
            if (address.startsWith('0x') && address.length === 42) {
              console.log('✅ Address validation passed')
              
              // Vérifier que ce n'est pas l'adresse du déployeur
              const deployerHex = log.topics[1] // Le deuxième topic est le déployeur
              const deployerAddress = '0x' + deployerHex.slice(-40)
              console.log('🔍 Deployer address from topic[1]:', deployerAddress)
              
              if (address.toLowerCase() !== deployerAddress.toLowerCase()) {
                console.log('✅ Address is different from deployer - this is the deployed contract!')
                return address
              } else {
                console.log('❌ Address is same as deployer - this is not the deployed contract')
              }
            } else {
              console.log('❌ Address validation failed:', address)
            }
          }
        } else {
          console.log('❌ Not enough topics for ContractDeployed event (need at least 3)')
        }
      }
      
      // Alternative: Chercher d'autres types d'événements qui pourraient contenir l'adresse du contrat
      if (log.topics && log.topics.length > 0) {
        const firstTopic = log.topics[0]
        
        // Signature de l'événement Transfer(address,address,uint256)
        if (firstTopic === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef') {
          console.log('🔍 Found Transfer event - this is likely a fee transfer, not contract creation')
          // Ne pas traiter les événements Transfer comme des créations de contrat
          continue
        }
        
        // Chercher d'autres types d'événements qui pourraient contenir l'adresse du contrat
        console.log('🔍 Checking other event types for contract address...')
        console.log('📋 Event signature:', firstTopic)
        
        // Si c'est un événement personnalisé, l'adresse pourrait être dans les topics
        if (log.topics.length >= 2) {
          // Le deuxième topic pourrait contenir l'adresse du contrat
          const potentialAddress = log.topics[1]
          if (potentialAddress && potentialAddress.length === 66) { // 32 bytes + 0x
            const address = '0x' + potentialAddress.slice(-40) // Prendre les 20 derniers bytes
            console.log('🔍 Potential address from topic[1]:', address)
            
            if (address.startsWith('0x') && address.length === 42 && !address.startsWith('0x00000000000000000000')) {
              console.log('✅ Valid non-zero address found in topic[1]')
              return address
            }
          }
        }
      }
    }
    
    console.log('❌ No ContractDeployed event found in logs')
    console.log('🔍 All logs analyzed. Factory address not found or event not emitted.')
    
    // Méthode de fallback: Analyser tous les logs pour des adresses valides
    console.log('🔄 Trying fallback method: scanning all logs for valid addresses...')
    
    const validAddresses: string[] = []
    
    for (const log of logs) {
      if (log.topics) {
        for (const topic of log.topics) {
          if (topic && topic.length === 66) { // 32 bytes + 0x
            const address = '0x' + topic.slice(-40) // Prendre les 20 derniers bytes
            if (address.startsWith('0x') && address.length === 42 && !address.startsWith('0x00000000000000000000')) {
              console.log('🔍 Found valid address in log:', address)
              validAddresses.push(address)
            }
          }
        }
      }
    }
    
    // Si nous avons trouvé des adresses valides, prendre la première qui n'est pas la factory
    for (const address of validAddresses) {
      if (address.toLowerCase() !== factoryAddress.toLowerCase()) {
        console.log('🎯 Using first valid non-factory address from fallback scan:', address)
        return address
      }
    }
    
    console.log('❌ No valid contract address found in any logs')
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