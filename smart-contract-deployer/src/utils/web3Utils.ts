import axios from 'axios'
const INFURA_API_KEY = 'f1d695fdf63a4f89ae1295908550ee43'
const ALCHEMY_API_KEY = 'iV2r1fZGy1Aeyie6-XpaYa8UNnV8hTWp'
const INFURA_NETWORKS: Record<number, string> = {
  1: 'mainnet',
  137: 'polygon-mainnet',
  10: 'optimism-mainnet',
  42161: 'arbitrum-mainnet',
  43114: 'avalanche-mainnet',
  11155111: 'sepolia',
  80001: 'polygon-mumbai',
}
const ALCHEMY_NETWORKS: Record<number, string> = {
  1: 'eth-mainnet',
  137: 'polygon-mainnet',
  10: 'opt-mainnet',
  42161: 'arb-mainnet',
  8453: 'base-mainnet',
  11155111: 'eth-sepolia',
  80001: 'polygon-mumbai',
}
export const getGasPrice = async (chainId: number): Promise<bigint> => {
  try {
    if (ALCHEMY_NETWORKS[chainId]) {
      const alchemyUrl = `https://${ALCHEMY_NETWORKS[chainId]}.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
      const response = await axios.post(alchemyUrl, {
        jsonrpc: '2.0',
        method: 'eth_gasPrice',
        params: [],
        id: 1,
      })
      if (response.data.result) {
        return BigInt(response.data.result)
      }
    }
    if (INFURA_NETWORKS[chainId]) {
      const infuraUrl = `https://${INFURA_NETWORKS[chainId]}.infura.io/v3/${INFURA_API_KEY}`
      const response = await axios.post(infuraUrl, {
        jsonrpc: '2.0',
        method: 'eth_gasPrice',
        params: [],
        id: 1,
      })
      if (response.data.result) {
        return BigInt(response.data.result)
      }
    }
    return 20000000000n
  } catch (error) {
    console.error('Error fetching gas price:', error)
    return 20000000000n
  }
}
export const getBlockNumber = async (chainId: number): Promise<number> => {
  try {
    if (ALCHEMY_NETWORKS[chainId]) {
      const alchemyUrl = `https://${ALCHEMY_NETWORKS[chainId]}.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
      const response = await axios.post(alchemyUrl, {
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1,
      })
      if (response.data.result) {
        return parseInt(response.data.result, 16)
      }
    }
    return 0
  } catch (error) {
    console.error('Error fetching block number:', error)
    return 0
  }
}