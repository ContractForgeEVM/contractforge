import { Router } from 'express'
import { ethers } from 'ethers'
const router = Router()
interface GasEstimateRequest {
  bytecode: string
  abi: any[]
  constructorArgs?: any[]
  chainId: number
}
const NETWORK_CONFIGS: Record<number, { name: string; rpcUrl: string; symbol: string; explorer: string }> = {
  1: {
    name: 'Ethereum Mainnet',
    rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com',
    symbol: 'ETH',
    explorer: 'https://etherscan.io'
  },
  137: {
    name: 'Polygon',
    rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon.llamarpc.com',
    symbol: 'MATIC',
    explorer: 'https://polygonscan.com'
  },
  42161: {
    name: 'Arbitrum',
    rpcUrl: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
    symbol: 'ETH',
    explorer: 'https://arbiscan.io'
  },
  10: {
    name: 'Optimism',
    rpcUrl: process.env.OPTIMISM_RPC_URL || 'https://mainnet.optimism.io',
    symbol: 'ETH',
    explorer: 'https://optimistic.etherscan.io'
  },
  56: {
    name: 'BSC',
    rpcUrl: process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org',
    symbol: 'BNB',
    explorer: 'https://bscscan.com'
  },
  43114: {
    name: 'Avalanche',
    rpcUrl: process.env.AVALANCHE_RPC_URL || 'https://api.avax.network/ext/bc/C/rpc',
    symbol: 'AVAX',
    explorer: 'https://snowtrace.io'
  },
  8453: {
    name: 'Base',
    rpcUrl: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
    symbol: 'ETH',
    explorer: 'https://basescan.org'
  },
}
router.get('/', async (req, res) => {
  try {
    const { bytecode, constructorArgs, chainId } = req.query
    if (!bytecode || typeof bytecode !== 'string' || !bytecode.startsWith('0x')) {
      return res.status(400).json({
        error: 'Valid bytecode is required',
        example: 'bytecode=0x608060405234801561001057600080fd5b50...'
      })
    }
    const targetChainId = chainId ? parseInt(chainId as string) : 1
    if (!NETWORK_CONFIGS[targetChainId]) {
      return res.status(400).json({
        error: 'Invalid chainId',
        supportedChains: Object.keys(NETWORK_CONFIGS).map(id => ({
          chainId: parseInt(id),
          name: NETWORK_CONFIGS[parseInt(id)].name
        }))
      })
    }
    const network = NETWORK_CONFIGS[targetChainId]
    let parsedArgs: any[] = []
    if (constructorArgs) {
      try {
        parsedArgs = JSON.parse(constructorArgs as string)
      } catch (e) {
        return res.status(400).json({
          error: 'Invalid constructorArgs format. Must be valid JSON array.',
          example: 'constructorArgs=["MyToken", "MTK", 1000000]'
        })
      }
    }
    const provider = new ethers.JsonRpcProvider(network.rpcUrl)
    try {
      const deploymentTx = {
        data: bytecode,
        value: 0
      }
      const estimatedGas = await provider.estimateGas(deploymentTx)
      const feeData = await provider.getFeeData()
      const costs = {
        slow: {
          gasPrice: feeData.gasPrice ? (feeData.gasPrice * BigInt(90) / BigInt(100)) : BigInt(0),
          totalCost: estimatedGas * (feeData.gasPrice ? (feeData.gasPrice * BigInt(90) / BigInt(100)) : BigInt(0))
        },
        standard: {
          gasPrice: feeData.gasPrice || BigInt(0),
          totalCost: estimatedGas * (feeData.gasPrice || BigInt(0))
        },
        fast: {
          gasPrice: feeData.gasPrice ? (feeData.gasPrice * BigInt(110) / BigInt(100)) : BigInt(0),
          totalCost: estimatedGas * (feeData.gasPrice ? (feeData.gasPrice * BigInt(110) / BigInt(100)) : BigInt(0))
        }
      }
      const blockNumber = await provider.getBlockNumber()
      const block = await provider.getBlock(blockNumber)
      res.json({
        success: true,
        network: {
          name: network.name,
          chainId: targetChainId,
          symbol: network.symbol,
          explorer: network.explorer
        },
        gasEstimate: {
          estimatedGas: estimatedGas.toString(),
          costs: {
            slow: {
              gasPrice: costs.slow.gasPrice.toString(),
              gasPriceGwei: ethers.formatUnits(costs.slow.gasPrice, 'gwei'),
              totalCost: costs.slow.totalCost.toString(),
              totalCostFormatted: ethers.formatEther(costs.slow.totalCost) + ' ' + network.symbol,
              estimatedConfirmation: '5-10 minutes'
            },
            standard: {
              gasPrice: costs.standard.gasPrice.toString(),
              gasPriceGwei: ethers.formatUnits(costs.standard.gasPrice, 'gwei'),
              totalCost: costs.standard.totalCost.toString(),
              totalCostFormatted: ethers.formatEther(costs.standard.totalCost) + ' ' + network.symbol,
              estimatedConfirmation: '2-5 minutes'
            },
            fast: {
              gasPrice: costs.fast.gasPrice.toString(),
              gasPriceGwei: ethers.formatUnits(costs.fast.gasPrice, 'gwei'),
              totalCost: costs.fast.totalCost.toString(),
              totalCostFormatted: ethers.formatEther(costs.fast.totalCost) + ' ' + network.symbol,
              estimatedConfirmation: '1-2 minutes'
            }
          }
        },
        networkStats: {
          blockNumber,
          gasLimit: block?.gasLimit?.toString(),
          gasUsed: block?.gasUsed?.toString(),
          baseFeePerGas: block?.baseFeePerGas?.toString(),
          timestamp: block?.timestamp
        },
        timestamp: new Date().toISOString()
      })
    } catch (gasError: any) {
      console.error('Gas estimation error:', gasError)
      res.status(400).json({
        success: false,
        error: 'Failed to estimate gas',
        details: gasError.message,
        network: network.name,
        suggestions: [
          'Check if the bytecode is valid',
          'Verify constructor arguments are correct',
          'Ensure the network RPC is accessible',
          'Try again with a different network'
        ]
      })
    }
  } catch (error: any) {
    console.error('Gas estimation request error:', error)
    res.status(500).json({
      success: false,
      error: 'Gas estimation failed',
      message: error.message
    })
  }
})
export default router