import { Router } from 'express'
import { ethers } from 'ethers'
const router = Router()
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
router.get('/:address', async (req, res) => {
  try {
    const { address } = req.params
    const { chainId } = req.query
    if (!address || !ethers.isAddress(address)) {
      return res.status(400).json({
        error: 'Valid contract address is required',
        example: '/api/contract/0x1234567890123456789012345678901234567890'
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
    const provider = new ethers.JsonRpcProvider(network.rpcUrl)
    try {
      const code = await provider.getCode(address)
      if (code === '0x') {
        return res.status(404).json({
          success: false,
          error: 'No contract found at this address',
          address,
          network: network.name,
          suggestion: 'Verify the address and network are correct'
        })
      }
      const balance = await provider.getBalance(address)
      const transactionCount = await provider.getTransactionCount(address)
      const contractInfo = analyzeContract(code)
      const blockNumber = await provider.getBlockNumber()
      const block = await provider.getBlock(blockNumber)
      res.json({
        success: true,
        contract: {
          address,
          balance: balance.toString(),
          balanceFormatted: ethers.formatEther(balance) + ' ' + network.symbol,
          transactionCount,
          bytecodeSize: code.length,
          bytecode: code.substring(0, 100) + '...',
          analysis: contractInfo
        },
        network: {
          name: network.name,
          chainId: targetChainId,
          symbol: network.symbol,
          explorer: network.explorer,
          explorerUrl: `${network.explorer}/address/${address}`
        },
        context: {
          blockNumber,
          blockTimestamp: block?.timestamp,
          blockHash: block?.hash
        },
        timestamp: new Date().toISOString()
      })
    } catch (providerError: any) {
      console.error('Provider error:', providerError)
      res.status(503).json({
        success: false,
        error: 'Failed to connect to blockchain network',
        details: providerError.message,
        network: network.name,
        suggestions: [
          'Check if the network RPC is accessible',
          'Verify the address format is correct',
          'Try again in a few moments'
        ]
      })
    }
  } catch (error: any) {
    console.error('Contract info error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get contract information',
      message: error.message
    })
  }
})
function analyzeContract(bytecode: string): any {
  const analysis = {
    type: 'Unknown',
    features: [] as string[],
    standards: [] as string[],
    functions: [] as string[]
  }
  if (bytecode.includes('a9059cbb')) {
    analysis.standards.push('ERC20')
    analysis.features.push('Token Transfer')
  }
  if (bytecode.includes('095ea7b3')) {
    analysis.features.push('Token Approval')
  }
  if (bytecode.includes('42842e0e')) {
    analysis.standards.push('ERC721')
    analysis.features.push('NFT Transfer')
  }
  if (bytecode.includes('01ffc9a7')) {
    analysis.features.push('Interface Support (ERC165)')
  }
  if (bytecode.includes('8456cb59')) {
    analysis.features.push('Pausable')
  }
  if (bytecode.includes('5c975abb')) {
    analysis.features.push('Pause State Check')
  }
  if (bytecode.includes('40c10f19')) {
    analysis.features.push('Mintable')
  }
  if (bytecode.includes('42966c68')) {
    analysis.features.push('Burnable')
  }
  if (bytecode.includes('9dc29fac')) {
    analysis.features.push('Burn From')
  }
  if (analysis.standards.includes('ERC20')) {
    analysis.type = 'ERC20 Token'
  } else if (analysis.standards.includes('ERC721')) {
    analysis.type = 'ERC721 NFT'
  } else if (analysis.features.length > 0) {
    analysis.type = 'Smart Contract with Features'
  }
  const size = bytecode.length / 2
  if (size > 24576) {
    analysis.features.push('Large Contract (Near Size Limit)')
  }
  return analysis
}
export default router