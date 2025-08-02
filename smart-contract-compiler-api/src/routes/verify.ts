import { Router } from 'express'
import axios from 'axios'
import FormData from 'form-data'

const router = Router()

// 🔐 Configuration des clés API (à déplacer vers des variables d'environnement)
const API_KEYS: Partial<Record<number, string>> = {
  1: process.env.ETHERSCAN_API_KEY,
  137: process.env.POLYGONSCAN_API_KEY,
  42161: process.env.ARBISCAN_API_KEY,
  10: process.env.OPTIMISM_API_KEY,
  56: process.env.BSCSCAN_API_KEY,
  43114: process.env.SNOWTRACE_API_KEY,
  8453: process.env.BASESCAN_API_KEY,
  100: process.env.GNOSISSCAN_API_KEY,
  42220: process.env.CELOSCAN_API_KEY,
  534352: process.env.SCROLLSCAN_API_KEY,
  59144: process.env.LINEASCAN_API_KEY,
  11155111: process.env.SEPOLIA_API_KEY,
  84532: process.env.BASE_SEPOLIA_API_KEY,
  // 7777777 (Zora), 999 (HyperEVM), 10143 (Monad) ne nécessitent pas d'API key
}
interface VerifyRequest {
  contractAddress: string
  sourceCode: string
  contractName: string
  compilerVersion: string
  constructorArgs?: string
  chainId: number
  optimizationEnabled?: boolean
  optimizationRuns?: number
  autoVerify?: boolean // 🚀 Nouveau: vérification automatique
  codeFormat?: 'solidity-single-file' | 'solidity-standard-json-input' // Support des formats V2
}
// 🚀 Migration vers Etherscan V2 API - Support complet ContractForge
const EXPLORER_APIS: Record<number, { 
  name: string; 
  apiUrl: string; 
  webUrl: string;
  apiKeyRequired: boolean;
  version: 'v1' | 'v2';
}> = {
  // 🌐 Mainnet Networks - 13 réseaux supportés
  1: {
    name: 'Etherscan',
    apiUrl: 'https://api.etherscan.io/v2/api',
    webUrl: 'https://etherscan.io',
    apiKeyRequired: true,
    version: 'v2'
  },
  137: {
    name: 'Polygonscan',
    apiUrl: 'https://api.polygonscan.com/v2/api',
    webUrl: 'https://polygonscan.com',
    apiKeyRequired: true,
    version: 'v2'
  },
  42161: {
    name: 'Arbiscan',
    apiUrl: 'https://api.arbiscan.io/v2/api', 
    webUrl: 'https://arbiscan.io',
    apiKeyRequired: true,
    version: 'v2'
  },
  10: {
    name: 'Optimistic Etherscan',
    apiUrl: 'https://api-optimistic.etherscan.io/v2/api',
    webUrl: 'https://optimistic.etherscan.io',
    apiKeyRequired: true,
    version: 'v2'
  },
  56: {
    name: 'BscScan',
    apiUrl: 'https://api.bscscan.com/v2/api',
    webUrl: 'https://bscscan.com',
    apiKeyRequired: true,
    version: 'v2'
  },
  43114: {
    name: 'Snowtrace',
    apiUrl: 'https://api.snowtrace.io/v2/api',
    webUrl: 'https://snowtrace.io',
    apiKeyRequired: true,
    version: 'v2'
  },
  8453: {
    name: 'BaseScan',
    apiUrl: 'https://api.basescan.org/v2/api',
    webUrl: 'https://basescan.org',
    apiKeyRequired: true,
    version: 'v2'
  },
  100: {
    name: 'GnosisScan',
    apiUrl: 'https://api.gnosisscan.io/v2/api',
    webUrl: 'https://gnosisscan.io',
    apiKeyRequired: true,
    version: 'v2'
  },
  42220: {
    name: 'CeloScan',
    apiUrl: 'https://api.celoscan.io/v2/api',
    webUrl: 'https://celoscan.io',
    apiKeyRequired: true,
    version: 'v2'
  },
  534352: {
    name: 'ScrollScan',
    apiUrl: 'https://api.scrollscan.com/v2/api',
    webUrl: 'https://scrollscan.com', 
    apiKeyRequired: true,
    version: 'v2'
  },
  59144: {
    name: 'LineaScan',
    apiUrl: 'https://api.lineascan.build/v2/api',
    webUrl: 'https://lineascan.build',
    apiKeyRequired: true,
    version: 'v2'
  },
  7777777: {
    name: 'Zora Explorer',
    apiUrl: 'https://api.explorer.zora.energy/v2/api',
    webUrl: 'https://explorer.zora.energy',
    apiKeyRequired: false, // Zora peut ne pas nécessiter d'API key
    version: 'v2'
  },
  999: {
    name: 'HyperEVM Explorer',
    apiUrl: 'https://api.explorer.hyperevm.com/v2/api',
    webUrl: 'https://explorer.hyperevm.com',
    apiKeyRequired: false, // HyperEVM peut ne pas nécessiter d'API key
    version: 'v2'
  },
  
  // 🧪 Testnet Networks - 3 réseaux supportés  
  11155111: {
    name: 'Sepolia Etherscan',
    apiUrl: 'https://api-sepolia.etherscan.io/v2/api',
    webUrl: 'https://sepolia.etherscan.io',
    apiKeyRequired: true,
    version: 'v2'
  },
  84532: {
    name: 'Base Sepolia',
    apiUrl: 'https://api-sepolia.basescan.org/v2/api',
    webUrl: 'https://sepolia-explorer.base.org',
    apiKeyRequired: true,
    version: 'v2'
  },
  10143: {
    name: 'Monad Testnet Explorer',
    apiUrl: 'https://api.explorer.monad.xyz/v2/api',
    webUrl: 'https://explorer.monad.xyz',
    apiKeyRequired: false, // Monad peut ne pas nécessiter d'API key en testnet
    version: 'v2'
  }
}

// 🚀 Fonction de vérification automatique avec Etherscan V2 API
async function submitVerificationToExplorer(
  chainId: number,
  verificationData: any,
  autoVerify: boolean = false
): Promise<{ success: boolean; guid?: string; error?: string; message: string }> {
  
  const explorer = EXPLORER_APIS[chainId]
  if (!explorer) {
    return { success: false, error: 'Unsupported chain', message: 'Chain not supported for verification' }
  }

  // Si pas de vérification automatique demandée, retourner les instructions
  if (!autoVerify) {
    return { 
      success: true, 
      message: 'Verification data prepared - use manual verification or set autoVerify=true',
    }
  }

  // Vérifier si on a une clé API pour ce réseau
  const apiKey = API_KEYS[chainId]
  if (explorer.apiKeyRequired && !apiKey) {
    return { 
      success: false, 
      error: 'API key required', 
      message: `${explorer.name} requires an API key. Set ${explorer.name.toUpperCase()}_API_KEY environment variable.`
    }
  }

  try {
    // Préparer les données pour l'API V2
    const formData = new FormData()
    formData.append('chainid', chainId.toString())
    formData.append('module', 'contract')
    formData.append('action', 'verifysourcecode')
    
    // Ajouter la clé API si nécessaire
    if (apiKey) {
      formData.append('apikey', apiKey)
    }
    
    // Données de vérification (format V2)
    Object.entries(verificationData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString())
      }
    })

    console.log(`🔍 Submitting verification to ${explorer.name} for chain ${chainId}...`)
    
    // Appel API avec timeout
    const response = await axios.post(explorer.apiUrl, formData, {
      headers: {
        ...formData.getHeaders(),
        'User-Agent': 'ContractForge-Auto-Verifier/1.0'
      },
      timeout: 30000 // 30 secondes
    })

    console.log(`📨 ${explorer.name} response:`, response.data)

    if (response.data.status === '1') {
      return {
        success: true,
        guid: response.data.result,
        message: `Verification submitted successfully to ${explorer.name}. GUID: ${response.data.result}`
      }
    } else {
      return {
        success: false,
        error: response.data.message || 'Verification failed',
        message: `${explorer.name} rejected verification: ${response.data.message || response.data.result}`
      }
    }

  } catch (error: any) {
    console.error(`❌ Error submitting to ${explorer.name}:`, error.message)
    
    if (error.code === 'ETIMEDOUT') {
      return { 
        success: false, 
        error: 'Timeout', 
        message: `Timeout connecting to ${explorer.name}. Try again later.` 
      }
    }
    
    return { 
      success: false, 
      error: error.message, 
      message: `Failed to submit verification to ${explorer.name}: ${error.message}` 
    }
  }
}

// 📊 Fonction pour vérifier le statut de vérification
async function checkVerificationStatus(
  chainId: number, 
  guid: string
): Promise<{ success: boolean; status?: string; error?: string; message: string }> {
  
  const explorer = EXPLORER_APIS[chainId]
  const apiKey = API_KEYS[chainId]
  
  if (!explorer) {
    return { success: false, error: 'Unsupported chain', message: 'Chain not supported' }
  }

  if (explorer.apiKeyRequired && !apiKey) {
    return { 
      success: false, 
      error: 'API key required', 
      message: `${explorer.name} requires an API key for status checking` 
    }
  }

  try {
    const params = new URLSearchParams({
      chainid: chainId.toString(),
      module: 'contract',
      action: 'checkverifystatus',
      guid: guid
    })
    
    if (apiKey) {
      params.append('apikey', apiKey)
    }

    const response = await axios.get(`${explorer.apiUrl}?${params.toString()}`, {
      timeout: 15000,
      headers: { 'User-Agent': 'ContractForge-Status-Checker/1.0' }
    })

    if (response.data.status === '1') {
      return {
        success: true,
        status: response.data.result,
        message: `Verification status: ${response.data.result}`
      }
    } else {
      return {
        success: false,
        error: response.data.message || 'Status check failed',
        message: `Could not check status: ${response.data.message || response.data.result}`
      }
    }

  } catch (error: any) {
    return { 
      success: false, 
      error: error.message, 
      message: `Failed to check verification status: ${error.message}` 
    }
  }
}

router.post('/', async (req, res) => {
  try {
    const {
      contractAddress,
      sourceCode,
      contractName,
      compilerVersion,
      constructorArgs = '',
      chainId,
      optimizationEnabled = false,
      optimizationRuns = 200,
      autoVerify = false,
      codeFormat = 'solidity-single-file'
    }: VerifyRequest = req.body
    if (!contractAddress || !/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
      return res.status(400).json({
        error: 'Valid contract address is required',
        format: '0x followed by 40 hexadecimal characters'
      })
    }
    if (!sourceCode || sourceCode.trim().length === 0) {
      return res.status(400).json({ error: 'Source code is required' })
    }
    if (!contractName || contractName.trim().length === 0) {
      return res.status(400).json({ error: 'Contract name is required' })
    }
    if (!compilerVersion || !compilerVersion.startsWith('v')) {
      return res.status(400).json({
        error: 'Valid compiler version is required',
        example: 'v0.8.20+commit.a1b79de6'
      })
    }
    if (!chainId || !EXPLORER_APIS[chainId]) {
      return res.status(400).json({
        error: 'Invalid chainId',
        supportedChains: Object.keys(EXPLORER_APIS).map(id => ({
          chainId: parseInt(id),
          name: EXPLORER_APIS[parseInt(id)].name
        }))
      })
    }
    
    const explorer = EXPLORER_APIS[chainId]
    
    // 📝 Préparer les données de vérification (format Etherscan V2)
    const verificationData = {
      contractaddress: contractAddress,
      sourceCode: sourceCode,
      codeformat: codeFormat,
      contractname: contractName,
      compilerversion: compilerVersion,
      optimizationUsed: optimizationEnabled ? '1' : '0',
      runs: optimizationRuns.toString(),
      constructorArguements: constructorArgs, // Note: Etherscan utilise cette orthographe
      licenseType: '3' // MIT License
    }

    console.log(`🔍 Processing verification request for ${contractAddress} on ${explorer.name}`)
    console.log(`📋 Auto-verify enabled: ${autoVerify}`)

    // 🚀 Tenter la vérification automatique
    const verificationResult = await submitVerificationToExplorer(chainId, verificationData, autoVerify)
    
    // Préparer les instructions manuelles (toujours utiles)
    const curlCommand = `curl -d "chainid=${chainId}&action=verifysourcecode&${Object.entries(verificationData)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&')}&apikey=YOUR_API_KEY" "${explorer.apiUrl}"`

    const response = {
      success: verificationResult.success,
      explorer: explorer.name,
      chainId,
      contractAddress,
      verification: {
        status: verificationResult.success ? (verificationResult.guid ? 'submitted' : 'prepared') : 'failed',
        message: verificationResult.message,
        guid: verificationResult.guid,
        data: verificationData,
        automatic: autoVerify,
        error: verificationResult.error,
        instructions: {
          manual: [
            `1. Get an API key from ${explorer.name}`,
            '2. Use the curl command below or submit via web interface',
            '3. Check verification status after submission',
            '4. It may take 1-5 minutes for verification to complete'
          ],
          apiEndpoint: explorer.apiUrl,
          curlCommand: curlCommand.substring(0, 300) + '...',
          webInterface: `${explorer.webUrl}/verifyContract?a=${contractAddress}`
        }
      },
      requirements: {
        apiKey: explorer.apiKeyRequired,
        sourceCodeMatch: 'Source code must exactly match deployed bytecode',
        compilerVersion: 'Must use exact compiler version used for deployment',
        optimization: 'Optimization settings must match deployment settings',
        constructorArgs: 'Constructor arguments must be ABI-encoded'
      },
      tips: [
        'Ensure source code is flattened if using imports',
        'Remove any comments about SPDX license if not needed',
        'Double-check constructor arguments encoding',
        'Some explorers require waiting 1-2 minutes after deployment before verification',
        ...(verificationResult.guid ? [`Track verification status with GUID: ${verificationResult.guid}`] : [])
      ]
    }

    // Si vérification automatique réussie, ajouter les détails de suivi
    if (verificationResult.success && verificationResult.guid) {
      response.verification.statusCheck = {
        guid: verificationResult.guid,
        endpoint: `/verify/status/${verificationResult.guid}?chainId=${chainId}`,
        directUrl: `${explorer.apiUrl}?chainid=${chainId}&module=contract&action=checkverifystatus&guid=${verificationResult.guid}&apikey=YOUR_API_KEY`
      }
    }

    res.json(response)
  } catch (error: any) {
    console.error('Verification preparation error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to prepare verification data',
      message: error.message
    })
  }
})
// 🔍 Route pour vérifier le statut de vérification automatiquement
router.get('/status/:guid', async (req, res) => {
  try {
    const { guid } = req.params
    const { chainId } = req.query
    
    if (!chainId || !EXPLORER_APIS[parseInt(chainId as string)]) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid chainId is required',
        supportedChains: Object.keys(EXPLORER_APIS).map(id => ({
          chainId: parseInt(id),
          name: EXPLORER_APIS[parseInt(id)].name
        }))
      })
    }
    
    const chainIdNum = parseInt(chainId as string)
    const explorer = EXPLORER_APIS[chainIdNum]
    
    console.log(`📊 Checking verification status for GUID: ${guid} on ${explorer.name}`)
    
    // 🚀 Vérification automatique du statut
    const statusResult = await checkVerificationStatus(chainIdNum, guid)
    
    const response = {
      success: statusResult.success,
      guid,
      chainId: chainIdNum,
      explorer: explorer.name,
      message: statusResult.message,
      status: statusResult.status,
      error: statusResult.error,
      verification: {
        guid,
        explorer: explorer.name,
        chainId: chainIdNum,
        status: statusResult.status || 'unknown',
        isVerified: statusResult.status === 'Pass - Verified',
        isPending: statusResult.status && statusResult.status.includes('Pending'),
        lastChecked: new Date().toISOString()
      },
      instructions: {
        manual: [
          `Visit ${explorer.webUrl}`,
          `Navigate to contract verification section`,
          `Use GUID: ${guid}`,
          'Status will be "Pass - Verified" when complete'
        ],
        api: {
          endpoint: `${explorer.apiUrl}?chainid=${chainIdNum}&module=contract&action=checkverifystatus&guid=${guid}&apikey=YOUR_API_KEY`,
          method: 'GET'
        }
      }
    }
    
    // Ajouter des conseils selon le statut
    if (statusResult.status) {
      if (statusResult.status.includes('Pass')) {
        response.verification.tips = ['✅ Contract successfully verified!', 'It should now appear as verified on the explorer']
      } else if (statusResult.status.includes('Pending')) {
        response.verification.tips = ['⏳ Verification is in progress', 'Please wait 1-5 minutes and check again']
      } else if (statusResult.status.includes('Fail')) {
        response.verification.tips = ['❌ Verification failed', 'Check that source code and compiler settings match exactly']
      }
    }
    
    res.json(response)
    
  } catch (error: any) {
    console.error('Verification status error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get verification status',
      message: error.message,
      guid: req.params.guid,
      chainId: req.query.chainId
    })
  }
})
function getExplorerWebUrl(chainId: number, contractAddress: string): string {
  const explorers: Record<number, string> = {
    1: 'https://etherscan.io',
    137: 'https://polygonscan.com',
    42161: 'https://arbiscan.io',
    10: 'https://optimistic.etherscan.io',
    56: 'https://bscscan.com',
    43114: 'https://snowtrace.io',
    8453: 'https://basescan.org'
  }
  const baseUrl = explorers[chainId]
  return baseUrl ? `${baseUrl}/address/${contractAddress}#code` : ''
}
export default router