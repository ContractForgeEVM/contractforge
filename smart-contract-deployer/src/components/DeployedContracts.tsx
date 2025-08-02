import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Alert,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Avatar
} from '@mui/material'
import { TableSkeleton } from './skeletons'
import {
  OpenInNew,
  ContentCopy,
  Search,
  Refresh,
  Code,
  CheckCircle,
  Error,
  AccessTime,
  Visibility
} from '@mui/icons-material'
import { useAccount, useChainId } from 'wagmi'
import { useTranslation } from 'react-i18next'
import { formatDistanceToNow } from 'date-fns'
import { formatEther } from 'ethers'
import { useDeploymentPermissions } from '../hooks/useDeploymentPermissions'

interface DeployedContract {
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
  gasUsed?: string
  deploymentCost?: string
  hasCustomPage?: boolean
}

const DeployedContracts: React.FC = () => {
  const [contracts, setContracts] = useState<DeployedContract[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterChain, setFilterChain] = useState<string>('all')
  const [filterTemplate, setFilterTemplate] = useState<string>('all')
  
  const { address } = useAccount()
  const chainId = useChainId()
  const { t } = useTranslation()
  const { permissions } = useDeploymentPermissions()

  useEffect(() => {
    if (address) {
      fetchDeployedContracts()
    }
  }, [address])

  const fetchDeployedContracts = async () => {
    setLoading(true)
    
    try {
      const { supabase, isSupabaseEnabled } = await import('../config/supabase')
      
  
      if (!isSupabaseEnabled) {
        console.warn('⚠️ Supabase non configuré')
        setContracts([])
        return
      }
      
      const { data: deployments, error } = await supabase
        .from('deployments')
        .select('*')
        .eq('user_id', address)
        .eq('success', true)
        .order('timestamp', { ascending: false })

      if (error) {
        console.error('❌ Erreur Supabase:', error.message)
        setContracts([])
        return
      }

      if (!deployments || deployments.length === 0) {
        console.log('ℹ️ Aucun contrat trouvé pour cet utilisateur')
        setContracts([])
        return
      }

      console.log(`✅ ${deployments.length} contrats récupérés`)

      const formattedContracts: DeployedContract[] = deployments.map(deployment => {
        return {
          id: deployment.id,
          address: deployment.contract_address || 'N/A',
          template: deployment.template,
          templateName: getTemplateDisplayName(deployment.template),
          contractName: `${getTemplateDisplayName(deployment.template)} Contract`,
          chain: getChainDisplayName(deployment.chain),
          chainId: getChainIdFromName(deployment.chain),
          deploymentDate: new Date(deployment.timestamp),
          transactionHash: deployment.transaction_hash || '',
          status: deployment.success ? 'success' : 'failed',
          gasUsed: deployment.gas_used || 'N/A',
          deploymentCost: formatDeploymentCost(deployment.value, deployment.chain),
          hasCustomPage: deployment.template === 'nft'
        }
      })

      console.log('✅ Contrats formatés:', formattedContracts)
      setContracts(formattedContracts)
      
    } catch (error) {
      console.error('❌ Erreur récupération contrats:', error)
      setContracts([])
    } finally {
      setLoading(false)
    }
  }

  const getChainIdFromName = (chainName: string): number => {
    const chainMap: Record<string, number> = {
      'ethereum': 1,
      'polygon': 137,
      'arbitrum': 42161,
      'optimism': 10,
      'bsc': 56,
      'avalanche': 43114,
      'base': 8453
    }
    return chainMap[chainName.toLowerCase()] || 1
  }

  const getTemplateDisplayName = (template: string): string => {
    const templateNames: Record<string, string> = {
      'token': 'ERC20 Token',
      'nft': 'NFT Collection',
      'dao': 'DAO',
      'lock': 'Token Lock',
      'multisig': 'Multi-Signature Wallet',
      'vesting': 'Token Vesting',
      'marketplace': 'NFT Marketplace',
      'social-token': 'Social Token',
      'liquidity-pool': 'Liquidity Pool',
      'yield-farming': 'Yield Farming',
      'gamefi-token': 'GameFi Token',
      'nft-marketplace': 'NFT Marketplace',
      'revenue-sharing': 'Revenue Sharing',
      'loyalty-program': 'Loyalty Program',
      'dynamic-nft': 'Dynamic NFT (dNFT)'
    }
    return templateNames[template] || template.toUpperCase()
  }

  const getChainDisplayName = (chainName: string): string => {
    const chainDisplayNames: Record<string, string> = {
      'ethereum': 'Ethereum',
      'polygon': 'Polygon',
      'arbitrum': 'Arbitrum',
      'optimism': 'Optimism',
      'bsc': 'BSC',
      'avalanche': 'Avalanche',
      'base': 'Base',
      'fantom': 'Fantom',
      'gnosis': 'Gnosis',
      'zksync': 'zkSync Era',
      'scroll': 'Scroll',
      'linea': 'Linea'
    }
    return chainDisplayNames[chainName.toLowerCase()] || chainName.charAt(0).toUpperCase() + chainName.slice(1)
  }

  const getNativeToken = (chainName: string): string => {
    const nativeTokens: Record<string, string> = {
      'ethereum': 'ETH',
      'polygon': 'POL',
      'arbitrum': 'ETH',
      'optimism': 'ETH',
      'bsc': 'BNB',
      'avalanche': 'AVAX',
      'base': 'ETH',
      'fantom': 'FTM',
      'gnosis': 'xDAI',
      'zksync': 'ETH',
      'scroll': 'ETH',
      'linea': 'ETH',
      'hyperevm': 'HYPE',
      'celo': 'CELO',
      'zora': 'ETH',
      'monad': 'MON'
    }
    return nativeTokens[chainName.toLowerCase()] || 'ETH'
  }

  const formatDeploymentCost = (value: string, chainName: string): string => {
    if (!value || value === '0') return 'N/A'
    
    try {
      const numValue = parseFloat(value)
      
      let finalValue: number
      
      if (value.includes('.') && numValue < 1000000) {
        finalValue = numValue
      } else {
        const ethValue = formatEther(value)
        finalValue = parseFloat(ethValue)
      }
      
      let formattedValue: string
      if (finalValue === 0) {
        formattedValue = '0'
      } else if (finalValue < 0.000001) {
        formattedValue = finalValue.toFixed(8).replace(/\.?0+$/, '')
      } else if (finalValue < 0.01) {
        formattedValue = finalValue.toFixed(6).replace(/\.?0+$/, '')
      } else if (finalValue < 1) {
        formattedValue = finalValue.toFixed(4).replace(/\.?0+$/, '')
      } else {
        formattedValue = finalValue.toFixed(4).replace(/\.?0+$/, '')
      }
      
      return `${formattedValue} ${getNativeToken(chainName)}`
    } catch (error) {
      console.error('Erreur formatage coût:', error)
      try {
        const directValue = parseFloat(value)
        if (!isNaN(directValue)) {
          return `${directValue.toFixed(4).replace(/\.?0+$/, '')} ${getNativeToken(chainName)}`
        }
      } catch (e) {
        console.error('Erreur fallback formatage:', e)
      }
      return `${value} ${getNativeToken(chainName)}`
    }
  }

  const getChainName = (chainId: number): string => {
    const chainNames: Record<number, string> = {
      1: 'Ethereum',
      137: 'Polygon',
      42161: 'Arbitrum',
      10: 'Optimism',
      56: 'BSC',
      43114: 'Avalanche',
      8453: 'Base',
      250: 'Fantom',
      100: 'Gnosis',
      324: 'zkSync Era',
      534352: 'Scroll',
      59144: 'Linea'
    }
    return chainNames[chainId] || `Chain ${chainId}`
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getExplorerUrl = (chainId: number, type: 'address' | 'tx', value: string) => {
    const explorers: Record<number, string> = {
      1: 'https://etherscan.io',
      137: 'https://polygonscan.com',
      42161: 'https://arbiscan.io',
      10: 'https://optimistic.etherscan.io',
      56: 'https://bscscan.com',
      43114: 'https://snowtrace.io',
      8453: 'https://basescan.org',
      250: 'https://ftmscan.com',
      100: 'https://gnosisscan.io',
      324: 'https://explorer.zksync.io',
      534352: 'https://scrollscan.com',
      59144: 'https://lineascan.build'
    }
    const baseUrl = explorers[chainId] || 'https://etherscan.io'
    return `${baseUrl}/${type}/${value}`
  }

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = searchTerm === '' || 
      contract.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.contractName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.templateName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesChain = filterChain === 'all' || contract.chain === filterChain
    const matchesTemplate = filterTemplate === 'all' || contract.template === filterTemplate
    
    return matchesSearch && matchesChain && matchesTemplate
  })

  const uniqueChains = Array.from(new Set(contracts.map(c => c.chain)))
  const uniqueTemplates = Array.from(new Set(contracts.map(c => c.template)))

  if (loading) {
    return (
      <Box sx={{ py: 4 }}>
        <TableSkeleton rows={8} columns={6} />
      </Box>
    )
  }

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField
              placeholder={t('deployments.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{ flex: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                )
              }}
            />
            
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>{t('deployments.filterByChain')}</InputLabel>
              <Select
                value={filterChain}
                onChange={(e) => setFilterChain(e.target.value)}
                label={t('deployments.filterByChain')}
              >
                <MenuItem value="all">{t('deployments.allChains')}</MenuItem>
                {uniqueChains.map(chain => (
                  <MenuItem key={chain} value={chain}>{chain}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>{t('deployments.filterByTemplate')}</InputLabel>
              <Select
                value={filterTemplate}
                onChange={(e) => setFilterTemplate(e.target.value)}
                label={t('deployments.filterByTemplate')}
              >
                <MenuItem value="all">{t('deployments.allTemplates')}</MenuItem>
                {uniqueTemplates.map(template => (
                  <MenuItem key={template} value={template}>
                    {getTemplateDisplayName(template)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <IconButton onClick={fetchDeployedContracts} color="primary">
              <Refresh />
            </IconButton>
          </Stack>
        </CardContent>
      </Card>

      {filteredContracts.length === 0 ? (
        <Alert severity="info" sx={{ my: 2 }}>
          {contracts.length === 0 ? (
            <Box>
              <Typography variant="body2" gutterBottom>
                {t('deployments.noContractsFound', { address })}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('deployments.realDataOnly')}
                <br />
                {t('deployments.deployToSee')}
              </Typography>
            </Box>
          ) : (
            <Typography>
              {t('deployments.noMatchingContracts')}
            </Typography>
          )}
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('deployments.contract')}</TableCell>
                <TableCell>{t('deployments.template')}</TableCell>
                <TableCell>{t('deployments.chain')}</TableCell>
                <TableCell>{t('deployments.date')}</TableCell>
                <TableCell>{t('deployments.status')}</TableCell>
                <TableCell>{t('deployments.cost')}</TableCell>
                <TableCell align="right">{t('deployments.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredContracts.map((contract) => (
                <TableRow key={contract.id} hover>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Typography variant="body2" fontWeight={500}>
                        {contract.contractName}
                      </Typography>
                      <Typography variant="caption" fontFamily="monospace" color="text.secondary">
                        {contract.address.slice(0, 6)}...{contract.address.slice(-4)}
                      </Typography>
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Copier l'adresse">
                          <IconButton
                            size="small"
                            onClick={() => copyToClipboard(contract.address)}
                          >
                            <ContentCopy fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Voir sur l'explorateur">
                          <IconButton
                            size="small"
                            onClick={() => window.open(getExplorerUrl(contract.chainId, 'address', contract.address), '_blank')}
                          >
                            <OpenInNew fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>
                  </TableCell>
                  
                  <TableCell>
                    <Chip
                      label={contract.templateName}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  
                  <TableCell>
                    <Chip
                      label={contract.chain}
                      size="small"
                      color="secondary"
                    />
                  </TableCell>
                  
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Typography variant="body2">
                        {contract.deploymentDate.toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDistanceToNow(contract.deploymentDate, { addSuffix: true })}
                      </Typography>
                    </Stack>
                  </TableCell>
                  
                  <TableCell>
                    <Chip
                      icon={contract.status === 'success' ? <CheckCircle /> : 
                            contract.status === 'failed' ? <Error /> : <AccessTime />}
                      label={contract.status === 'success' ? 'Succès' : 
                             contract.status === 'failed' ? 'Échec' : 'En attente'}
                      size="small"
                      color={contract.status === 'success' ? 'success' : 
                             contract.status === 'failed' ? 'error' : 'warning'}
                    />
                  </TableCell>
                  
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Typography variant="body2">
                        {contract.deploymentCost || 'N/A'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Gas: {contract.gasUsed || 'N/A'}
                      </Typography>
                    </Stack>
                  </TableCell>
                  
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Tooltip title="Voir le code">
                        <IconButton
                          size="small"
                          onClick={() => window.open(getExplorerUrl(contract.chainId, 'address', contract.address) + '#code', '_blank')}
                        >
                          <Code fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      {contract.hasCustomPage && (
                        <Tooltip title="Voir la page de mint">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => window.open(`https://${contract.id}.contractforge.io`, '_blank')}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {contracts.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {t('deployments.summary')}
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {t('deployments.totalContracts')}
                </Typography>
                <Typography variant="h5">
                  {contracts.length}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {t('deployments.uniqueChains')}
                </Typography>
                <Typography variant="h5">
                  {uniqueChains.length}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {t('deployments.successRate')}
                </Typography>
                <Typography variant="h5" color="success.main">
                  {contracts.length > 0 
                    ? Math.round((contracts.filter(c => c.status === 'success').length / contracts.length) * 100)
                    : 0}%
                </Typography>
              </Box>
              {permissions && permissions.plan !== 'free' && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {t('deployments.customPages')}
                  </Typography>
                  <Typography variant="h5" color="warning.main">
                    {contracts.filter(c => c.hasCustomPage).length}
                  </Typography>
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}

export default DeployedContracts 