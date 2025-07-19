import { Router } from 'express'
const router = Router()
interface VerifyRequest {
  contractAddress: string
  sourceCode: string
  contractName: string
  compilerVersion: string
  constructorArgs?: string
  chainId: number
  optimizationEnabled?: boolean
  optimizationRuns?: number
}
const EXPLORER_APIS: Record<number, { name: string; apiUrl: string; apiKeyRequired: boolean }> = {
  1: {
    name: 'Etherscan',
    apiUrl: 'https://api.etherscan.io/api',
    apiKeyRequired: true
  },
  137: {
    name: 'Polygonscan',
    apiUrl: 'https://api.polygonscan.com/api',
    apiKeyRequired: true
  },
  42161: {
    name: 'Arbiscan',
    apiUrl: 'https://api.arbiscan.io/api',
    apiKeyRequired: true
  },
  10: {
    name: 'Optimistic Etherscan',
    apiUrl: 'https://api-optimistic.etherscan.io/api',
    apiKeyRequired: true
  },
  56: {
    name: 'BscScan',
    apiUrl: 'https://api.bscscan.com/api',
    apiKeyRequired: true
  },
  43114: {
    name: 'Snowtrace',
    apiUrl: 'https://api.snowtrace.io/api',
    apiKeyRequired: true
  },
  8453: {
    name: 'BaseScan',
    apiUrl: 'https://api.basescan.org/api',
    apiKeyRequired: true
  },
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
      optimizationRuns = 200
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
    const verificationData = {
      contractaddress: contractAddress,
      sourceCode: sourceCode,
      codeformat: 'solidity-single-file',
      contractname: contractName,
      compilerversion: compilerVersion,
      optimizationUsed: optimizationEnabled ? '1' : '0',
      runs: optimizationRuns.toString(),
      constructorArguements: constructorArgs,
      licenseType: '3'
    }
    const curlCommand = `curl -d "action=verifysourcecode&${Object.entries(verificationData)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&')}&apikey=YOUR_API_KEY" "${explorer.apiUrl}"`
    res.json({
      success: true,
      explorer: explorer.name,
      chainId,
      contractAddress,
      verification: {
        status: 'prepared',
        message: `Verification data prepared for ${explorer.name}`,
        data: verificationData,
        instructions: {
          manual: [
            `1. Get an API key from ${explorer.name}`,
            '2. Use the curl command below or submit via web interface',
            '3. Check verification status after submission',
            '4. It may take 1-5 minutes for verification to complete'
          ],
          apiEndpoint: explorer.apiUrl,
          curlCommand: curlCommand.substring(0, 200) + '...',
          webInterface: getExplorerWebUrl(chainId, contractAddress)
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
        'Some explorers require waiting 1-2 minutes after deployment before verification'
      ]
    })
  } catch (error: any) {
    console.error('Verification preparation error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to prepare verification data',
      message: error.message
    })
  }
})
router.get('/status/:guid', async (req, res) => {
  try {
    const { guid } = req.params
    const { chainId } = req.query
    if (!chainId || !EXPLORER_APIS[parseInt(chainId as string)]) {
      return res.status(400).json({ error: 'Valid chainId is required' })
    }
    const explorer = EXPLORER_APIS[parseInt(chainId as string)]
    res.json({
      success: true,
      message: 'Check verification status manually',
      explorer: explorer.name,
      guid,
      instructions: [
        `Visit ${explorer.apiUrl}`,
        `Use action=checkverifystatus`,
        `Include guid=${guid}`,
        'Status will be "Pass - Verified" when complete'
      ],
      statusEndpoint: `${explorer.apiUrl}?module=contract&action=checkverifystatus&guid=${guid}&apikey=YOUR_API_KEY`
    })
  } catch (error: any) {
    console.error('Verification status error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get verification status',
      message: error.message
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