import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Paper,
  Chip,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  useTheme,
  Stack,
  Divider,
  Avatar,
  LinearProgress
} from '@mui/material'
import {
  Refresh,
  TrendingUp,
  AccountBalance,
  LocalGasStation,
  Receipt,
  Speed,
  ShowChart,
  Timeline,
  AttachMoney,
  SwapHoriz,
  CheckCircle,
  Error as ErrorIcon,
  Warning,
  Analytics as AnalyticsIcon,
  CompareArrows,
  Schedule
} from '@mui/icons-material'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
  ComposedChart
} from 'recharts'
import { useTranslation } from 'react-i18next'
import { useAccount } from 'wagmi'
import { formatEther, parseEther } from 'ethers'

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff', '#00ffff', '#ff8042']

interface ContractData {
  id: string
  address: string
  template: string
  templateName: string
  contractName: string
  chain: string
  chainId: number
  deploymentDate: Date
  transactionHash: string
  status: 'success' | 'failed' | 'pending'
  gasUsed: string
  deploymentCost: string
  totalTransactions: number
  totalGasConsumed: string
  totalFeesSpent: string
  averageGasPerTx: number
  lastActivity: Date
  successRate: number
  estimatedValue: string
}

interface MonitoringStats {
  totalContracts: number
  activeContracts: number
  totalGasUsed: string
  totalFeesSpent: string
  totalTransactions: number
  averageSuccessRate: number
  totalValue: string
}

interface ChartData {
  gasUsageByContract: Array<{
    name: string
    gasUsed: number
    fees: number
    transactions: number
    successRate: number
  }>
  dailyActivity: Array<{
    date: string
    transactions: number
    gasUsed: number
    fees: number
    contracts: number
  }>
  templateComparison: Array<{
    template: string
    count: number
    averageGas: number
    totalFees: number
    successRate: number
  }>
  networkDistribution: Array<{
    network: string
    contracts: number
    gasUsed: number
    fees: number
    value: number
  }>
}

const ContractMonitoring: React.FC = () => {
  const { t } = useTranslation()
  const theme = useTheme()
  const { address } = useAccount()
  
  const [contracts, setContracts] = useState<ContractData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<MonitoringStats | null>(null)
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d')
  const [selectedNetwork, setSelectedNetwork] = useState('all')
  const [selectedTemplate, setSelectedTemplate] = useState('all')
  const [detailsDialog, setDetailsDialog] = useState(false)
  const [selectedContract, setSelectedContract] = useState<ContractData | null>(null)

  const networks = [
    { id: 'all', name: t('contractMonitoring.networks.all'), color: '#666' },
    { id: 'ethereum', name: 'Ethereum', color: '#627EEA' },
    { id: 'arbitrum', name: 'Arbitrum', color: '#28A0F0' },
    { id: 'polygon', name: 'Polygon', color: '#8247E5' },
    { id: 'bnb', name: 'BNB Chain', color: '#F3BA2F' },
    { id: 'base', name: 'Base', color: '#0052FF' },
    { id: 'optimism', name: 'Optimism', color: '#FF0420' },
    { id: 'avalanche', name: 'Avalanche', color: '#E84142' },
    { id: 'celo', name: 'Celo', color: '#35D07F' },
    { id: 'linea', name: 'Linea', color: '#121212' },
    { id: 'hyperevm', name: 'HyperEVM', color: '#00D4FF' },
    { id: 'scroll', name: 'Scroll', color: '#FFEEDA' },
    { id: 'zora', name: 'Zora Network', color: '#000000' },
    { id: 'monad', name: 'Monad Testnet', color: '#7B68EE' }
  ]

  useEffect(() => {
    if (address) {
      fetchContractData()
    }
  }, [address, selectedTimeframe, selectedNetwork, selectedTemplate])

  const fetchContractData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      if (!address) {
        setError(t('contractMonitoring.errors.connectWalletFirst'))
        return
      }

      console.log('📊 Fetching real monitoring data...')

      const dashboardResponse = await fetch(`/api/monitoring/dashboard?userId=${address}`)
      
      if (!dashboardResponse.ok) {
        setError(`Failed to fetch dashboard: ${dashboardResponse.status} ${dashboardResponse.statusText}`)
        return
      }

      let dashboardData
      try {
        dashboardData = await dashboardResponse.json()
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        setError('Invalid response format from dashboard API')
        return
      }

      if (!dashboardData.success) {
        setError(dashboardData.error || 'Dashboard API returned error')
        return
      }

      const dashboard = dashboardData.data

      if (dashboard.overview.totalContracts === 0) {
        console.log('ℹ️ No monitored contracts found')
        setContracts([])
        setStats({
          totalContracts: 0,
          activeContracts: 0,
          totalGasUsed: '0',
          totalFeesSpent: '0',
          totalTransactions: 0,
          averageSuccessRate: 0,
          totalValue: '0'
        })
        setChartData({
          gasUsageByContract: [],
          dailyActivity: [],
          templateComparison: [],
          networkDistribution: []
        })
        return
      }

      const contractsResponse = await fetch(`/api/monitoring/contracts?userId=${address}`)
      
      if (!contractsResponse.ok) {
        setError(`Failed to fetch contracts: ${contractsResponse.status} ${contractsResponse.statusText}`)
        return
      }

      let contractsData
      try {
        contractsData = await contractsResponse.json()
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        setError('Invalid response format from contracts API')
        return
      }

      if (!contractsData.success) {
        setError(contractsData.error || 'Contracts API returned error')
        return
      }

      const monitoredContracts = contractsData.data.contracts || []

      const { supabase } = await import('../config/supabase')
      
      const { data: deployments, error: deploymentsError } = await supabase
        .from('deployments')
        .select('*')
        .eq('user_id', address)
        .order('timestamp', { ascending: false })

      if (deploymentsError) {
        console.error('❌ Error fetching deployments:', deploymentsError)
        setError('Failed to fetch deployment data')
        return
      }


      const contractsWithMetrics = monitoredContracts.slice(0, 20).map((contract: any) => {
        const deployment = deployments?.find(d => 
          d.contract_address?.toLowerCase() === contract.contract_address?.toLowerCase()
        )
        
        const realGasUsed = deployment?.gas_used ? parseInt(deployment.gas_used) : 0
        const realDeploymentCost = deployment?.value || '0 ETH'
        const realTransactionHash = deployment?.transaction_hash || ''
        const deploymentSuccess = deployment?.success !== false
        
        const totalTransactions = 0
        const totalGasConsumed = realGasUsed
        
        let totalFeesSpent = 0
        if (realDeploymentCost && realDeploymentCost !== '0 ETH' && realDeploymentCost !== '0') {
          let costString = realDeploymentCost.replace(' ETH', '').trim()
          const costWei = parseFloat(costString) || 0
          
          totalFeesSpent = costWei / 1e18
        }
        

        const estimatedValue = calculateContractValue(contract, {
          template: contract.template_type
        })
        
        const lastActivity = new Date(contract.started_at)
        const successRate = deploymentSuccess ? 100 : 0

        return {
          id: contract.id,
          address: contract.contract_address,
          template: contract.template_type || 'unknown',
          templateName: getTemplateDisplayName(contract.template_type || 'unknown'),
          contractName: `${getTemplateDisplayName(contract.template_type || 'unknown')} Contract`,
          chain: getChainNameFromId(contract.chain_id),
          chainId: contract.chain_id,
          deploymentDate: new Date(contract.started_at),
          transactionHash: realTransactionHash,
          status: contract.is_active && deploymentSuccess ? 'success' : 'failed' as 'success' | 'failed' | 'pending',
          gasUsed: realGasUsed.toString(),
          deploymentCost: totalFeesSpent.toFixed(6) + ' ETH',
          totalTransactions: totalTransactions,
          totalGasConsumed: totalGasConsumed.toString(),
          totalFeesSpent: totalFeesSpent.toFixed(6),
          averageGasPerTx: 0,
          lastActivity,
          successRate,
          estimatedValue: estimatedValue.toFixed(4) + ' ETH'
        }
      })

      setContracts(contractsWithMetrics)
      
      const totalRealGas = contractsWithMetrics.reduce((sum: number, c: ContractData) => {
        const gas = parseInt(c.totalGasConsumed) || 0
        return sum + gas
      }, 0)
      
      const totalRealFees = contractsWithMetrics.reduce((sum: number, c: ContractData) => {
        const fees = parseFloat(c.totalFeesSpent) || 0
        return sum + fees
      }, 0)
      
      const totalRealTransactions = contractsWithMetrics.reduce((sum: number, c: ContractData) => sum + c.totalTransactions, 0)
      const successfulContracts = contractsWithMetrics.filter((c: ContractData) => c.status === 'success').length
      const totalRealValue = contractsWithMetrics.reduce((sum: number, c: ContractData) => {
        const value = parseFloat(c.estimatedValue.replace(' ETH', '')) || 0
        return sum + value
      }, 0)
      
      let gasDisplay = '0'
      if (totalRealGas > 1000000) {
        gasDisplay = (totalRealGas / 1000000).toFixed(1) + 'M'
      } else if (totalRealGas > 1000) {
        gasDisplay = (totalRealGas / 1000).toFixed(0) + 'K'  
      } else if (totalRealGas > 0) {
        gasDisplay = totalRealGas.toString()
      }
      
      let feesDisplay = '0.000000 ETH'
      if (totalRealFees > 0) {
        if (totalRealFees >= 1) {
          feesDisplay = totalRealFees.toFixed(4) + ' ETH'
        } else if (totalRealFees >= 0.001) {
          feesDisplay = totalRealFees.toFixed(6) + ' ETH'
        } else {
          feesDisplay = totalRealFees.toExponential(2) + ' ETH'
        }
      }
      
      let valueDisplay = '0.000000 ETH'
      if (totalRealValue > 0) {
        valueDisplay = totalRealValue.toFixed(6) + ' ETH'
      }
      
      setStats({
        totalContracts: contractsWithMetrics.length,
        activeContracts: successfulContracts,
        totalGasUsed: gasDisplay,
        totalFeesSpent: feesDisplay,
        totalTransactions: totalRealTransactions,
        averageSuccessRate: contractsWithMetrics.length > 0 ? Math.round(successfulContracts / contractsWithMetrics.length * 100) : 0,
        totalValue: valueDisplay
      })

      generateChartData(contractsWithMetrics)

    } catch (err) {
      console.error('Error fetching contract data:', err)
      setError('Failed to load monitoring data')
    } finally {
      setLoading(false)
    }
  }

  const generateChartData = (contractsData: ContractData[]) => {
    const gasUsageByContract = contractsData.slice(0, 10).map(contract => ({
      name: contract.templateName + '\n' + contract.address.slice(0, 6) + '...',
      gasUsed: parseInt(contract.totalGasConsumed) / 1000000,
      fees: parseFloat(contract.totalFeesSpent),
      transactions: contract.totalTransactions,
      successRate: contract.successRate
    }))

    const dailyActivity = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59)
      
      const dayDeployments = contractsData.filter(c => 
        c.deploymentDate >= startOfDay && c.deploymentDate <= endOfDay
      )
      
      dailyActivity.push({
        date: date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
        transactions: dayDeployments.length,
        gasUsed: dayDeployments.reduce((sum, c) => sum + parseInt(c.totalGasConsumed), 0) / 1000000,
        fees: dayDeployments.reduce((sum, c) => sum + parseFloat(c.totalFeesSpent), 0),
        contracts: dayDeployments.length
      })
    }

    const templateGroups = contractsData.reduce((acc, contract) => {
      const normalizedTemplate = normalizeTemplateName(contract.template)
      if (!acc[normalizedTemplate]) {
        acc[normalizedTemplate] = []
      }
      acc[normalizedTemplate].push(contract)
      return acc
    }, {} as Record<string, ContractData[]>)

    const templateComparison = Object.entries(templateGroups).map(([normalizedTemplate, contracts]) => ({
      template: getTemplateDisplayName(normalizedTemplate),
      count: contracts.length,
      averageGas: contracts.reduce((sum, c) => sum + parseInt(c.totalGasConsumed), 0) / contracts.length / 1000000,
      totalFees: contracts.reduce((sum, c) => sum + parseFloat(c.totalFeesSpent), 0),
      successRate: contracts.reduce((sum, c) => sum + c.successRate, 0) / contracts.length
    }))

    const networkGroups = contractsData.reduce((acc, contract) => {
      if (!acc[contract.chain]) {
        acc[contract.chain] = []
      }
      acc[contract.chain].push(contract)
      return acc
    }, {} as Record<string, ContractData[]>)

    const networkDistribution = Object.entries(networkGroups).map(([network, contracts]) => ({
      network: getChainDisplayName(network),
      contracts: contracts.length,
      gasUsed: contracts.reduce((sum, c) => sum + parseInt(c.totalGasConsumed), 0) / 1000000,
      fees: contracts.reduce((sum, c) => sum + parseFloat(c.totalFeesSpent), 0),
      value: contracts.reduce((sum, c) => sum + parseFloat(c.estimatedValue.replace(' ETH', '')), 0)
    }))

    setChartData({
      gasUsageByContract,
      dailyActivity,
      templateComparison,
      networkDistribution
    })
  }

  const normalizeTemplateName = (template: string): string => {
    const normalizeMap: Record<string, string> = {
      'erc20': 'token',
      'ERC20': 'token', 
      'ERC-20': 'token',
      'Token ERC20': 'token',
      'ERC20 Token': 'token'
    }
    return normalizeMap[template] || template.toLowerCase()
  }

  const getTemplateDisplayName = (template: string): string => {
    const names: Record<string, string> = {
      'token': 'ERC20 Token',
      'nft': 'NFT Collection',
      'dao': 'DAO',
      'lock': 'Token Lock',
      'social-token': 'Social Token',
      'liquidity-pool': 'Liquidity Pool',
      'yield-farming': 'Yield Farming',
      'gamefi-token': 'GameFi Token',
      'nft-marketplace': 'NFT Marketplace',
      'revenue-sharing': 'Revenue Sharing',
      'loyalty-program': 'Loyalty Program',
      'dynamic-nft': 'Dynamic NFT (dNFT)',
      'erc20': 'ERC20 Token',
      'multisig': 'MultiSig Wallet',
      'staking': 'Staking Pool',
      'lottery': 'Lottery System'
    }
    return names[template] || template.toUpperCase()
  }

  const getChainDisplayName = (chain: string): string => {
    const names: Record<string, string> = {
      'ethereum': 'Ethereum',
      'arbitrum': 'Arbitrum',
      'polygon': 'Polygon',
      'bnb': 'BNB Chain',
      'bsc': 'BNB Chain',
      'base': 'Base',
      'optimism': 'Optimism',
      'avalanche': 'Avalanche',
      'celo': 'Celo',
      'linea': 'Linea',
      'hyperevm': 'HyperEVM',
      'scroll': 'Scroll',
      'zora': 'Zora Network',
      'monad': 'Monad Testnet'
    }
    return names[chain.toLowerCase()] || chain
  }

  const getChainIdFromName = (chainName: string): number => {
    const chainMap: Record<string, number> = {
      'ethereum': 1,
      'arbitrum': 42161,
      'polygon': 137,
      'bnb': 56,
      'bsc': 56,
      'base': 8453,
      'optimism': 10,
      'avalanche': 43114,
      'celo': 42220,
      'linea': 59144,
      'hyperevm': 999,
      'scroll': 534352,
      'zora': 7777777,
      'monad': 10143
    }
    return chainMap[chainName.toLowerCase()] || 1
  }

  const getChainNameFromId = (chainId: number): string => {
    const chainMap: Record<number, string> = {
      1: 'ethereum',
      42161: 'arbitrum',
      137: 'polygon',
      56: 'bnb',
      8453: 'base',
      10: 'optimism',
      43114: 'avalanche',
      42220: 'celo',
      59144: 'linea',
      999: 'hyperevm',
      534352: 'scroll',
      7777777: 'zora',
      10143: 'monad'
    }
    return chainMap[chainId] || 'unknown'
  }


  const getBaseTransactionsByTemplate = (template: string): number => {
    const transactionPatterns: Record<string, number> = {
      'token': 85,
      'nft': 45,
      'dao': 25,
      'lock': 5,
      'social-token': 55,
      'liquidity-pool': 120,
      'yield-farming': 60,
      'gamefi-token': 75,
      'nft-marketplace': 95,
      'revenue-sharing': 40,
      'loyalty-program': 30,
      'dynamic-nft': 35,
      'erc20': 85,
      'multisig': 15,
      'staking': 35,
      'lottery': 20
    }
    return transactionPatterns[template] || 30
  }

  const getBaseGasUsageByTemplate = (template: string): number => {
    const gasPatterns: Record<string, number> = {
      'token': 65000,
      'nft': 180000,
      'dao': 150000,
      'lock': 80000,
      'social-token': 70000,
      'liquidity-pool': 200000,
      'yield-farming': 120000,
      'gamefi-token': 90000,
      'nft-marketplace': 160000,
      'revenue-sharing': 100000,
      'loyalty-program': 85000,
      'dynamic-nft': 220000,
      'erc20': 65000,
      'multisig': 120000,
      'staking': 100000,
      'lottery': 90000
    }
    return gasPatterns[template] || 75000
  }

  const getSuccessRateByTemplate = (template: string): number => {
    const successRates: Record<string, number> = {
      'token': 96,
      'nft': 92,
      'dao': 89,
      'lock': 99,
      'social-token': 93,
      'liquidity-pool': 94,
      'yield-farming': 95,
      'gamefi-token': 91,
      'nft-marketplace': 90,
      'revenue-sharing': 96,
      'loyalty-program': 97,
      'dynamic-nft': 88,
      'erc20': 96,
      'multisig': 98,
      'staking': 95,
      'lottery': 91
    }
    return successRates[template] || 90
  }

  const getGasPriceByChain = (chainId: number): number => {
    const gasPrices: Record<number, number> = {
      1: 35,
      42161: 0.5,
      137: 50,
      56: 8,
      8453: 0.2,
      10: 0.3,
      43114: 30,
      42220: 1,
      59144: 2,
      999: 0.1,
      534352: 3,
      7777777: 0.1,
      10143: 0.05
    }
    const basePrice = gasPrices[chainId] || 25
    return basePrice * (0.8 + Math.random() * 0.4)
  }

  const calculateContractValue = (contract: any, metrics: any): number => {
    const { template } = metrics
    
    const baseValues: Record<string, number> = {
      'token': 0.001,
      'nft': 0.001,
      'dao': 0.001,
      'lock': 0.001,
      'social-token': 0.001,
      'liquidity-pool': 0.001,
      'yield-farming': 0.001,
      'gamefi-token': 0.001,
      'nft-marketplace': 0.001,
      'revenue-sharing': 0.001,
      'loyalty-program': 0.001,
      'dynamic-nft': 0.001,
      'erc20': 0.001,
      'multisig': 0.001,
      'staking': 0.001,
      'lottery': 0.001
    }
    
    return baseValues[template] || 0.001
  }

  const openContractDetails = (contract: ContractData) => {
    setSelectedContract(contract)
    setDetailsDialog(true)
  }

  const MetricCard: React.FC<{
    title: string
    value: string
    icon: React.ReactNode
    color: string
    subtitle?: string
  }> = ({ title, value, icon, color, subtitle }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              backgroundColor: color + '20',
              color: color,
              mr: 2
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={600}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )

  if (!address) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Speed sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          {t('contractMonitoring.connectWallet')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('contractMonitoring.connectWalletDesc')}
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <AnalyticsIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" fontWeight={600}>
                {t('contractMonitoring.title')}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {t('contractMonitoring.subtitle')}
              </Typography>
            </Box>
          </Stack>
          <Button
            variant="outlined"
            startIcon={loading ? <CircularProgress size={20} /> : <Refresh />}
            onClick={fetchContractData}
            disabled={loading}
          >
            {loading ? t('contractMonitoring.loading') : t('contractMonitoring.refresh')}
          </Button>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>{t('contractMonitoring.filters.timeframe')}</InputLabel>
            <Select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              label={t('contractMonitoring.filters.timeframe')}
            >
              <MenuItem value="24h">{t('contractMonitoring.timeframes.last24h')}</MenuItem>
              <MenuItem value="7d">{t('contractMonitoring.timeframes.last7d')}</MenuItem>
              <MenuItem value="30d">{t('contractMonitoring.timeframes.last30d')}</MenuItem>
              <MenuItem value="90d">{t('contractMonitoring.timeframes.last90d')}</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>{t('contractMonitoring.filters.network')}</InputLabel>
            <Select
              value={selectedNetwork}
              onChange={(e) => setSelectedNetwork(e.target.value)}
              label={t('contractMonitoring.filters.network')}
            >
              {networks.map((network) => (
                <MenuItem key={network.id} value={network.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: network.color
                      }}
                    />
                    {network.name}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>{t('contractMonitoring.filters.template')}</InputLabel>
            <Select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              label={t('contractMonitoring.filters.template')}
            >
              <MenuItem value="all">{t('contractMonitoring.templates.all')}</MenuItem>
              <MenuItem value="token">{t('contractMonitoring.templates.token')}</MenuItem>
              <MenuItem value="nft">{t('contractMonitoring.templates.nft')}</MenuItem>
              <MenuItem value="dao">{t('contractMonitoring.templates.dao')}</MenuItem>
              <MenuItem value="lock">{t('contractMonitoring.templates.lock')}</MenuItem>
              <MenuItem value="social-token">{t('contractMonitoring.templates.socialToken')}</MenuItem>
              <MenuItem value="liquidity-pool">{t('contractMonitoring.templates.liquidityPool')}</MenuItem>
              <MenuItem value="yield-farming">{t('contractMonitoring.templates.yieldFarming')}</MenuItem>
              <MenuItem value="gamefi-token">{t('contractMonitoring.templates.gamefiToken')}</MenuItem>
              <MenuItem value="nft-marketplace">{t('contractMonitoring.templates.nftMarketplace')}</MenuItem>
              <MenuItem value="revenue-sharing">{t('contractMonitoring.templates.revenueSharing')}</MenuItem>
              <MenuItem value="loyalty-program">{t('contractMonitoring.templates.loyaltyProgram')}</MenuItem>
              <MenuItem value="dynamic-nft">{t('contractMonitoring.templates.dynamicNft')}</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {stats && (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
          gap: 3,
          mb: 4
        }}>
          <MetricCard
            title={t('contractMonitoring.metrics.totalContracts')}
            value={stats.totalContracts.toString()}
            icon={<AccountBalance />}
            color={theme.palette.primary.main}
            subtitle={t('contractMonitoring.metrics.highlyActive', { count: stats.activeContracts })}
          />
          <MetricCard
            title={t('contractMonitoring.metrics.totalGasUsed')}
            value={stats.totalGasUsed}
            icon={<LocalGasStation />}
            color={theme.palette.warning.main}
            subtitle={t('contractMonitoring.metrics.acrossAllContracts')}
          />
          <MetricCard
            title={t('contractMonitoring.metrics.totalFeesSpent')}
            value={stats.totalFeesSpent}
            icon={<Receipt />}
            color={theme.palette.error.main}
            subtitle={t('contractMonitoring.metrics.networkTransactionFees')}
          />
          <MetricCard
            title={t('contractMonitoring.metrics.totalTransactions')}
            value={stats.totalTransactions.toLocaleString()}
            icon={<SwapHoriz />}
            color={theme.palette.info.main}
            subtitle={t('contractMonitoring.metrics.postDeploymentActivity')}
          />
          <MetricCard
            title={t('contractMonitoring.metrics.averageSuccessRate')}
            value={`${stats.averageSuccessRate}%`}
            icon={<CheckCircle />}
            color={theme.palette.success.main}
            subtitle={t('contractMonitoring.metrics.transactionSuccessRate')}
          />
          <MetricCard
            title={t('contractMonitoring.metrics.estimatedTotalValue')}
            value={stats.totalValue}
            icon={<AttachMoney />}
            color={theme.palette.secondary.main}
            subtitle={t('contractMonitoring.metrics.currentEstimatedValue')}
          />
        </Box>
      )}

      {chartData && (
        <Box sx={{ mb: 4 }}>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' },
            gap: 3,
            mb: 3
          }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocalGasStation /> {t('contractMonitoring.charts.gasUsageByContract')}
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.gasUsageByContract}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={11}
                    />
                    <YAxis />
                    <RechartsTooltip 
                      formatter={(value: any, name: string) => [
                        name === 'gasUsed' ? `${value.toFixed(2)}M gas` :
                        name === 'fees' ? `${value.toFixed(4)} ETH` :
                        name === 'transactions' ? `${value} txs` :
                        `${value.toFixed(1)}%`,
                        name === 'gasUsed' ? t('contractMonitoring.tooltips.gasUsed') :
                        name === 'fees' ? t('contractMonitoring.tooltips.feesSpent') :
                        name === 'transactions' ? t('contractMonitoring.tooltips.transactions') : t('contractMonitoring.tooltips.successRate')
                      ]}
                    />
                    <Bar dataKey="gasUsed" fill={theme.palette.warning.main} name="gasUsed" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Receipt /> {t('contractMonitoring.charts.feesSpentByContract')}
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.gasUsageByContract}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={11}
                    />
                    <YAxis />
                    <RechartsTooltip 
                      formatter={(value: any) => [`${value.toFixed(4)} ETH`, t('contractMonitoring.tooltips.feesSpent')]}
                    />
                    <Bar dataKey="fees" fill={theme.palette.error.main} name="fees" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Box>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Timeline /> {t('contractMonitoring.charts.dailyActivity')}
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={chartData.dailyActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <RechartsTooltip 
                    formatter={(value: any, name: string) => [
                      name === 'transactions' ? `${value} ${t('contractMonitoring.tooltips.transactions')}` :
                      name === 'gasUsed' ? `${value.toFixed(2)}M ${t('contractMonitoring.tooltips.gas')}` :
                      name === 'fees' ? `${value.toFixed(4)} ETH` :
                      `${value} ${t('contractMonitoring.tooltips.contracts')}`,
                      name === 'transactions' ? t('contractMonitoring.tooltips.transactions') :
                      name === 'gasUsed' ? t('contractMonitoring.tooltips.gasUsed') :
                      name === 'fees' ? t('contractMonitoring.tooltips.fees') : t('contractMonitoring.tooltips.activeContracts')
                    ]}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="transactions" fill={theme.palette.primary.main} name="transactions" />
                  <Line yAxisId="right" type="monotone" dataKey="gasUsed" stroke={theme.palette.warning.main} strokeWidth={3} name="gasUsed" />
                  <Line yAxisId="right" type="monotone" dataKey="fees" stroke={theme.palette.error.main} strokeWidth={2} name="fees" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' },
            gap: 3
          }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CompareArrows /> {t('contractMonitoring.charts.templateComparison')}
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData.templateComparison}
                      dataKey="count"
                      nameKey="template"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={40}
                      paddingAngle={2}
                      fill="#8884d8"
                    >
                      {chartData.templateComparison.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: any, name: any, props: any) => [
                        `${value} ${t('contractMonitoring.tooltips.contracts')} (${props.payload.totalFees.toFixed(4)} ETH ${t('contractMonitoring.tooltips.fees')})`,
                        props.payload.template
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUp /> {t('contractMonitoring.charts.networkDistribution')}
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.networkDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="network" />
                    <YAxis />
                    <RechartsTooltip 
                      formatter={(value: any, name: string) => [
                        name === 'contracts' ? `${value} ${t('contractMonitoring.tooltips.contracts')}` :
                        name === 'gasUsed' ? `${value.toFixed(2)}M ${t('contractMonitoring.tooltips.gas')}` :
                        name === 'fees' ? `${value.toFixed(4)} ETH` :
                        `${value.toFixed(4)} ETH`,
                        name === 'contracts' ? t('contractMonitoring.tooltips.contracts') :  
                        name === 'gasUsed' ? t('contractMonitoring.tooltips.gasUsed') :
                        name === 'fees' ? t('contractMonitoring.tooltips.fees') : t('contractMonitoring.tooltips.totalValue')
                      ]}
                    />
                    <Bar dataKey="contracts" fill={theme.palette.primary.main} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Box>
        </Box>
      )}

      {contracts.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ShowChart /> {t('contractMonitoring.contractDetails.title')}
            </Typography>
            <Box sx={{ display: 'grid', gap: 2 }}>
              {contracts
                .filter(contract => {
                  if (selectedNetwork !== 'all' && contract.chain.toLowerCase() !== selectedNetwork) {
                    return false
                  }
                  
                  if (selectedTemplate !== 'all' && contract.template !== selectedTemplate) {
                    return false
                  }
                  
                  return true
                })
                .slice(0, 10)
                .map((contract) => (
                  <Paper
                    key={contract.id}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: 'grey.50' }
                    }}
                    onClick={() => openContractDetails(contract)}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                          sx={{
                            bgcolor: networks.find(n => n.id === contract.chain.toLowerCase())?.color || theme.palette.primary.main,
                            width: 32,
                            height: 32
                          }}
                        >
                          {contract.templateName.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {contract.templateName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                            {contract.address.slice(0, 10)}...{contract.address.slice(-8)}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Stack direction="row" spacing={3} alignItems="center">
                        <Box textAlign="center">
                          <Typography variant="body2" fontWeight={600}>
                            {contract.totalTransactions}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {t('contractMonitoring.contractDetails.transactions')}
                          </Typography>
                        </Box>
                        <Box textAlign="center">
                          <Typography variant="body2" fontWeight={600}>
                            {(parseInt(contract.totalGasConsumed) / 1000000).toFixed(2)}M
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {t('contractMonitoring.contractDetails.gasUsed')}
                          </Typography>
                        </Box>
                        <Box textAlign="center">
                          <Typography variant="body2" fontWeight={600}>
                            {contract.totalFeesSpent} ETH
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {t('contractMonitoring.contractDetails.feesSpent')}
                          </Typography>
                        </Box>
                        <Box textAlign="center">
                          <Typography variant="body2" fontWeight={600} color="success.main">
                            {contract.successRate.toFixed(1)}%
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {t('contractMonitoring.contractDetails.success')}
                          </Typography>
                        </Box>
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {selectedContract && (
        <Dialog 
          open={detailsDialog}
          onClose={() => setDetailsDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ShowChart />
            {t('contractMonitoring.dialog.title')} - {selectedContract.templateName}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">{t('contractMonitoring.dialog.contractAddress')}</Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                  {selectedContract.address}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 3 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">{t('contractMonitoring.dialog.network')}</Typography>
                  <Typography variant="body1">{selectedContract.chain}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">{t('contractMonitoring.dialog.template')}</Typography>
                  <Typography variant="body1">{selectedContract.templateName}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">{t('contractMonitoring.dialog.deploymentDate')}</Typography>
                  <Typography variant="body1">{selectedContract.deploymentDate.toLocaleDateString()}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">{t('contractMonitoring.dialog.lastActivity')}</Typography>
                  <Typography variant="body1">{selectedContract.lastActivity.toLocaleDateString()}</Typography>
                </Box>
              </Box>

              <Divider />

              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 3 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">{t('contractMonitoring.dialog.totalTransactions')}</Typography>
                  <Typography variant="h6">{selectedContract.totalTransactions.toLocaleString()}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">{t('contractMonitoring.dialog.successRate')}</Typography>
                  <Typography variant="h6" color="success.main">{selectedContract.successRate.toFixed(1)}%</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">{t('contractMonitoring.dialog.totalGasUsed')}</Typography>
                  <Typography variant="h6">{(parseInt(selectedContract.totalGasConsumed) / 1000000).toFixed(2)}M</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">{t('contractMonitoring.dialog.totalFeesSpent')}</Typography>
                  <Typography variant="h6">{selectedContract.totalFeesSpent} ETH</Typography>
                </Box>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>{t('contractMonitoring.dialog.performance')}</Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={selectedContract.successRate} 
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {t('contractMonitoring.dialog.successRateLabel', { rate: selectedContract.successRate.toFixed(1) })}
                </Typography>
              </Box>
            </Stack>
          </DialogContent>
        </Dialog>
      )}
    </Box>
  )
}

export default ContractMonitoring 