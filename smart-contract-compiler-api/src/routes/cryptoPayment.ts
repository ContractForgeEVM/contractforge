import { Router } from 'express'
import axios from 'axios'
const router = Router()
let ethPriceCache: { price: number; timestamp: number } | null = null
const CACHE_DURATION = 5 * 60 * 1000 

const getETHPrice = async () => {
  try {
    if (ethPriceCache && Date.now() - ethPriceCache.timestamp < CACHE_DURATION) {
      return ethPriceCache.price
    }
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price',
      {
        params: {
          ids: 'ethereum',
          vs_currencies: 'usd'
        },
        timeout: 10000
      }
    )
    const data = response.data as any
    if (data?.ethereum?.usd) {
      const price = data.ethereum.usd
      ethPriceCache = {
        price,
        timestamp: Date.now()
      }
      return price
    }
    throw new Error('Invalid response from CoinGecko API')
  } catch (error) {
    console.error('Error fetching ETH price:', error)
    return 3000 
  }
}

router.post('/calculate-payment', async (req, res) => {
  try {
    const { usdAmount, token } = req.body
    if (!usdAmount || isNaN(Number(usdAmount))) {
      return res.status(400).json({
        success: false,
        error: 'USD amount is required and must be a number'
      })
    }
    const ethPrice = await getETHPrice()
    const ethAmount = Number(usdAmount) / ethPrice
    let cryptoAmount: number
    let tokenSymbol: string
    switch (token?.toLowerCase()) {
      case 'eth':
        cryptoAmount = ethAmount
        tokenSymbol = 'ETH'
        break
      case 'usdc':
        cryptoAmount = Number(usdAmount)
        tokenSymbol = 'USDC'
        break
      default:
        return res.status(400).json({
          success: false,
          error: 'Unsupported token. Supported: ETH, USDC'
        })
    }
    res.json({
      success: true,
      data: {
        usdAmount: Number(usdAmount),
        cryptoAmount,
        tokenSymbol,
        ethPrice,
        formatted: {
          usd: new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }).format(Number(usdAmount)),
          crypto: tokenSymbol === 'ETH' 
            ? (cryptoAmount >= 0.01 ? cryptoAmount.toFixed(4) : cryptoAmount.toFixed(6))
            : cryptoAmount.toFixed(2)
        }
      }
    })
  } catch (error) {
    console.error('Error calculating crypto payment:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to calculate crypto payment'
    })
  }
})

router.post('/verify-payment', async (req, res) => {
  try {
    const { 
      userId, 
      planId, 
      billingCycle, 
      txHash, 
      networkId, 
      paidAmount, 
      expectedAmount 
    } = req.body
    if (!userId || !planId || !txHash || !networkId || !paidAmount || !expectedAmount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters'
      })
    }
    const tolerance = 0.05 
    const difference = Math.abs(paidAmount - expectedAmount) / expectedAmount
    if (difference > tolerance) {
      return res.status(400).json({
        success: false,
        error: 'Payment amount does not match expected amount',
        data: {
          paidAmount,
          expectedAmount,
          difference: difference * 100
        }
      })
    }
    res.json({
      success: true,
      data: {
        verified: true,
        txHash,
        networkId,
        paidAmount,
        expectedAmount
      }
    })
  } catch (error) {
    console.error('Error verifying crypto payment:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to verify crypto payment'
    })
  }
})

router.get('/supported-tokens', async (req, res) => {
  try {
    const tokens = [
      {
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 18,
        icon: '⚡',
        color: '#627EEA',
        isNative: true,
        networks: [1, 42161, 8453] 
      },
      {
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        icon: '💵',
        color: '#2775CA',
        isNative: false,
        networks: [1, 42161, 8453]
      }
    ]
    res.json({
      success: true,
      data: tokens
    })
  } catch (error) {
    console.error('Error fetching supported tokens:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch supported tokens'
    })
  }
})

router.get('/network-config/:networkId', async (req, res) => {
  try {
    const { networkId } = req.params
    const networkIdNum = parseInt(networkId)
    const networks = {
      1: {
        name: 'Ethereum',
        symbol: 'ETH',
        rpcUrl: 'https://eth.llamarpc.com',
        blockExplorer: 'https://etherscan.io',
        usdcAddress: '0xA0b86a33E6416c07b15e4a0FC6e583Db72C17C5D',
        gasMultiplier: 1.2
      },
      42161: {
        name: 'Arbitrum',
        symbol: 'ETH',
        rpcUrl: 'https://arb1.arbitrum.io/rpc',
        blockExplorer: 'https://arbiscan.io',
        usdcAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
        gasMultiplier: 1.1
      },
      8453: {
        name: 'Base',
        symbol: 'ETH',
        rpcUrl: 'https://mainnet.base.org',
        blockExplorer: 'https://basescan.org',
        usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        gasMultiplier: 1.1
      }
    }
    const network = networks[networkIdNum as keyof typeof networks]
    if (!network) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported network'
      })
    }
    res.json({
      success: true,
      data: {
        networkId: networkIdNum,
        ...network
      }
    })
  } catch (error) {
    console.error('Error fetching network config:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch network configuration'
    })
  }
})
export default router