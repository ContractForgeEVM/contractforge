import React, { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  Stack
} from '@mui/material'
import {
  AccountBalanceWallet,
  Security,
  Speed,
  CheckCircle
} from '@mui/icons-material'
import { useAccount, useWalletClient, usePublicClient, useChainId } from 'wagmi'
import { encodeFunctionData } from 'viem'
import { useTranslation } from 'react-i18next'
import { 
  SUPPORTED_CHAINS, 
  SUPPORTED_TOKENS, 
  getChainConfig, 
  getContractAddress, 
  isChainSupported,
  getUSDCAmount,
  getPlanTypeFromString,
  calculateYearlySavings
} from '../config/cryptoConfig'

interface CryptoPaymentProps {
  planId: string
  planName: string
  monthlyPrice: number
  yearlyPrice: number
  isYearly: boolean
  onSuccess: () => void
  onCancel: () => void
}

const SUBSCRIPTION_ABI = [
  {
    "inputs": [{"type": "uint8"}, {"type": "uint8"}, {"type": "bool"}],
    "name": "subscribe",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const

const USDC_ABI = [
  {
    "inputs": [{"type": "address"}, {"type": "uint256"}],
    "name": "approve",
    "outputs": [{"type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const

const CryptoPayment: React.FC<CryptoPaymentProps> = ({
  planId,
  planName,
  monthlyPrice,
  yearlyPrice,
  isYearly,
  onSuccess,
  onCancel
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoRenew, setAutoRenew] = useState(false)

  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const chainId = useChainId()
  const { t } = useTranslation()

  const price = isYearly ? yearlyPrice : monthlyPrice
  const chainConfig = getChainConfig(chainId)
  const contractAddress = getContractAddress(chainId)
  const usdcToken = SUPPORTED_TOKENS.USDC

  const getPlanTypeEnum = (plan: string): number => {
    switch (plan.toLowerCase()) {
      case 'starter': return 0
      case 'pro': return 1
      case 'enterprise': return 2
      default: return 0
    }
  }

  const getDurationEnum = (yearly: boolean): number => {
    return yearly ? 1 : 0 
  }

  const handlePayment = async () => {
    if (!walletClient || !publicClient || !address) {
      setError('Please connect your wallet')
      return
    }

    if (!isChainSupported(chainId)) {
      setError(t('cryptoPayment.switchNetwork', 'Switch to a supported network to continue') + ': Ethereum, Arbitrum, Base')
      return
    }

    if (!contractAddress) {
      setError('Smart contract not deployed on this network')
      return
    }

    if (!chainConfig?.usdcAddress) {
      setError('USDC not available on this network')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const planTypeEnum = getPlanTypeFromString(planId)
      const usdcAmount = getUSDCAmount(price)

      console.log('Approving USDC...')
      const approveHash = await walletClient.sendTransaction({
        account: address,
        to: chainConfig.usdcAddress as `0x${string}`,
        data: encodeFunctionData({
          abi: USDC_ABI,
          functionName: 'approve',
          args: [contractAddress as `0x${string}`, usdcAmount]
        })
      })

      await publicClient.waitForTransactionReceipt({ hash: approveHash })
      console.log('USDC approved')

      console.log('Subscribing...')
      const subscribeHash = await walletClient.sendTransaction({
        account: address,
        to: contractAddress as `0x${string}`,
        data: encodeFunctionData({
          abi: SUBSCRIPTION_ABI,
          functionName: 'subscribe',
          args: [planTypeEnum, getDurationEnum(isYearly), autoRenew]
        })
      })

      await publicClient.waitForTransactionReceipt({ hash: subscribeHash })
      console.log('Subscription successful')

      onSuccess()
    } catch (err: any) {
      console.error('Payment failed:', err)
      setError(err.message || 'Payment failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card sx={{ maxWidth: 500, mx: 'auto' }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h2" sx={{ fontSize: '3rem', mb: 1 }}>💵</Typography>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            {t('cryptoPayment.title', 'Pay with USDC')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {t('cryptoPayment.subtitle', 'Stable payments on Ethereum, Arbitrum & Base networks')}
          </Typography>
          <Chip
            label={`${t('cryptoPayment.currentNetwork', 'Current')}: ${chainConfig?.name || 'Unknown'}`}
            size="small"
            color={chainConfig ? 'success' : 'warning'}
            variant="outlined"
          />
        </Box>

        <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            {planName} Plan
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isYearly ? 'Annual' : 'Monthly'} subscription
          </Typography>
          <Typography variant="h6" color="primary.main" sx={{ mt: 1 }}>
            ${price} USD
          </Typography>
          
          {isYearly && (() => {
            const savings = calculateYearlySavings(planId)
            return (
              <Box sx={{ mt: 2, p: 1.5, bgcolor: 'success.light', borderRadius: 1, color: 'success.contrastText' }}>
                <Typography variant="body2" fontWeight="bold">
                  🎉 Annual Savings: ${savings.savingsUSD} ({savings.savingsPercentage}% off)
                </Typography>
                <Typography variant="caption">
                  You save 2 months compared to monthly billing!
                </Typography>
              </Box>
            )
          })()}
        </Box>

        <Box sx={{ mb: 3, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            You will pay:
          </Typography>
          <Typography variant="h6" fontWeight="bold">
            ${price} {usdcToken.symbol}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Stable price • No volatility
          </Typography>
          
          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip 
              label="USDC ≈ $1.00"
              size="small"
              color="success"
              variant="outlined"
            />
          </Box>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            USDC Payment Benefits:
          </Typography>
          <Stack spacing={1}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Security fontSize="small" color="success" />
              <Typography variant="body2">Stable price - no volatility</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Speed fontSize="small" color="success" />
              <Typography variant="body2">Fast & low cost transactions</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle fontSize="small" color="success" />
              <Typography variant="body2">
                1:1 USD backed stablecoin
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Button
            variant={autoRenew ? "contained" : "outlined"}
            size="small"
            onClick={() => setAutoRenew(!autoRenew)}
            sx={{ textTransform: 'none' }}
          >
            {autoRenew ? '✅ Auto-renew enabled' : 'Enable auto-renew'}
          </Button>
          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
            {autoRenew ? 'Subscription will auto-renew' : 'Manual renewal required each period'}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Stack spacing={2}>
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handlePayment}
            disabled={!isConnected || isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : <AccountBalanceWallet />}
            sx={{
              py: 1.5,
              background: 'linear-gradient(135deg, #2775CA 0%, #1557B0 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1557B0 0%, #0F4C96 100%)',
              }
            }}
          >
            {isLoading 
              ? 'Processing Payment...' 
              : `Pay $${price} USDC`
            }
          </Button>
          <Button
            fullWidth
            variant="outlined"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </Stack>

        <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            {t('cryptoPayment.supportedNetworks', 'Supported networks: Ethereum, Arbitrum, Base')}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
            <Chip
              label={chainConfig?.name || 'Unknown Network'}
              size="small"
              color={chainConfig ? 'success' : 'warning'}
              variant="filled"
            />
            <Typography variant="caption" color="text.secondary">
              • Paying with USDC stablecoin
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default CryptoPayment