import { Router } from 'express'
import { ethers } from 'ethers'
const router = Router()
interface DeployRequest {
  bytecode: string
  abi: any[]
  constructorArgs?: any[]
  chainId: number
  gasLimit?: number
  gasPrice?: string
  value?: string
}
const NETWORK_CONFIGS: Record<number, { name: string; rpcUrl: string; symbol: string }> = {
  1: { name: 'Ethereum Mainnet', rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com', symbol: 'ETH' },
  137: { name: 'Polygon', rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon.llamarpc.com', symbol: 'MATIC' },
  42161: { name: 'Arbitrum', rpcUrl: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc', symbol: 'ETH' },
  10: { name: 'Optimism', rpcUrl: process.env.OPTIMISM_RPC_URL || 'https://mainnet.optimism.io', symbol: 'ETH' },
  56: { name: 'BSC', rpcUrl: process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org', symbol: 'BNB' },
  43114: { name: 'Avalanche', rpcUrl: process.env.AVALANCHE_RPC_URL || 'https://api.avax.network/ext/bc/C/rpc', symbol: 'AVAX' },
  8453: { name: 'Base', rpcUrl: process.env.BASE_RPC_URL || 'https://mainnet.base.org', symbol: 'ETH' },
  11155111: { name: 'Sepolia', rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org', symbol: 'ETH' },
  80001: { name: 'Mumbai', rpcUrl: process.env.MUMBAI_RPC_URL || 'https://rpc-mumbai.maticvigil.com', symbol: 'MATIC' }
}
router.post('/', async (req, res) => {
  try {
    const { bytecode, abi, constructorArgs = [], chainId, gasLimit, gasPrice, value = '0' }: DeployRequest = req.body
    if (!bytecode || !bytecode.startsWith('0x')) {
      return res.status(400).json({ error: 'Valid bytecode is required' })
    }
    if (!abi || !Array.isArray(abi)) {
      return res.status(400).json({ error: 'Valid ABI is required' })
    }
    if (!chainId || !NETWORK_CONFIGS[chainId]) {
      return res.status(400).json({
        error: 'Invalid chainId',
        supportedChains: Object.keys(NETWORK_CONFIGS).map(id => ({
          chainId: parseInt(id),
          name: NETWORK_CONFIGS[parseInt(id)].name
        }))
      })
    }
    const network = NETWORK_CONFIGS[chainId]
    const provider = new ethers.JsonRpcProvider(network.rpcUrl)
    const factory = new ethers.ContractFactory(abi, bytecode, provider)
    let deploymentTx
    try {
      deploymentTx = await factory.getDeployTransaction(...constructorArgs)
      const estimatedGas = await provider.estimateGas(deploymentTx)
      const currentGasPrice = await provider.getFeeData()
      const estimatedCost = estimatedGas * (currentGasPrice.gasPrice || BigInt(0))
      res.json({
        success: true,
        network: network.name,
        chainId,
        deployment: {
          bytecode,
          abi,
          constructorArgs,
          estimatedGas: estimatedGas.toString(),
          estimatedGasPrice: currentGasPrice.gasPrice?.toString(),
          estimatedCost: estimatedCost.toString(),
          estimatedCostFormatted: ethers.formatEther(estimatedCost) + ' ' + network.symbol,
          deploymentData: deploymentTx.data
        },
        instructions: {
          message: 'For security reasons, contracts must be deployed directly from your wallet',
          steps: [
            '1. Copy the deployment data above',
            '2. Use your preferred wallet or deployment tool',
            '3. Send a transaction to the zero address (0x0000...0000) with the deployment data',
            `4. Include the estimated gas limit: ${estimatedGas.toString()}`,
            '5. Verify the contract on the block explorer after deployment'
          ]
        }
      })
    } catch (gasError: any) {
      console.error('Gas estimation error:', gasError)
      res.json({
        success: true,
        network: network.name,
        chainId,
        deployment: {
          bytecode,
          abi,
          constructorArgs,
          estimatedGas: 'Could not estimate',
          estimatedGasPrice: 'Could not estimate',
          estimatedCost: 'Could not estimate',
          deploymentData: bytecode
        },
        warning: 'Could not estimate gas costs. Please verify manually before deployment.',
        instructions: {
          message: 'For security reasons, contracts must be deployed directly from your wallet',
          steps: [
            '1. Copy the bytecode above',
            '2. Use your preferred wallet or deployment tool',
            '3. Send a transaction to the zero address (0x0000...0000) with the bytecode',
            '4. Include appropriate gas limit (typically 2-5M for complex contracts)',
            '5. Verify the contract on the block explorer after deployment'
          ]
        }
      })
    }
  } catch (error: any) {
    console.error('Deployment preparation error:', error)
    res.status(400).json({
      success: false,
      error: error.message || 'Deployment preparation failed'
    })
  }
})
export default router