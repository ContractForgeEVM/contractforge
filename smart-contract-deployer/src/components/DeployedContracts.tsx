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
  CircularProgress,
  Avatar
} from '@mui/material'
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
    console.log('🔍 Récupération des contrats pour:', address)
    
    try {
      // Récupérer les vrais contrats déployés depuis Supabase
      const { supabase } = await import('../config/supabase')
      
      console.log('📡 Requête Supabase pour user_id:', address)
      
      const { data: deployments, error } = await supabase
        .from('deployments')
        .select('*')
        .eq('user_id', address)
        .eq('success', true)
        .order('timestamp', { ascending: false })

      if (error) {
        console.error('❌ Erreur Supabase:', error)
        setContracts([])
        return
      }

      console.log('📊 Données brutes reçues de Supabase:', deployments)

      // Filtrer les données mock/test (adresses qui contiennent des patterns de test)
      const filteredDeployments = (deployments || []).filter((deployment: any) => {
        const address = deployment.contract_address || ''
        // Exclure les adresses mock communes
        const mockPatterns = [
          /0x1234.*5678/i,
          /0x123456789012345678901234567890123456/i,
          /0xabcdef/i,
          /0x000000/i
        ]
        const isMock = mockPatterns.some(pattern => pattern.test(address))
        if (isMock) {
          console.log(`🚫 Données mock filtrées: ${address}`)
        }
        return !isMock
      })

      console.log(`📊 Contrats après filtrage: ${filteredDeployments.length}/${(deployments || []).length}`)

      // Transformer les données Supabase pour correspondre à notre interface  
      const formattedContracts: DeployedContract[] = filteredDeployments.map((deployment: any) => ({
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
      }))

      setContracts(formattedContracts)
      console.log('✅ Contrats formatés:', formattedContracts)
    } catch (error) {
      console.error('❌ Erreur lors de la récupération:', error)
      setContracts([])
    } finally {
      setLoading(false)
    }
  }

  // Helper pour convertir le nom de chaîne en ID
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
      'token': 'ERC-20 Token',
      'nft': 'NFT Collection',
      'dao': 'DAO Governance',
      'lock': 'Token Lock',
      'multisig': 'Multi-Signature Wallet',
      'vesting': 'Token Vesting',
      'marketplace': 'NFT Marketplace'
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
      // Convertir de wei vers ETH/token natif
      const ethValue = formatEther(value)
      const numValue = parseFloat(ethValue)
      
      // Formater avec un nombre approprié de décimales
      let formattedValue: string
      if (numValue === 0) {
        formattedValue = '0'
      } else if (numValue < 0.000001) {
        formattedValue = numValue.toFixed(8).replace(/\.?0+$/, '')
      } else if (numValue < 0.01) {
        formattedValue = numValue.toFixed(6).replace(/\.?0+$/, '')
      } else if (numValue < 1) {
        formattedValue = numValue.toFixed(4).replace(/\.?0+$/, '')
      } else {
        formattedValue = numValue.toFixed(4).replace(/\.?0+$/, '')
      }
      
      return `${formattedValue} ${getNativeToken(chainName)}`
    } catch (error) {
      console.error('Erreur formatage coût:', error)
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
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Chargement de vos contrats...</Typography>
      </Box>
    )
  }

  return (
    <Box>
      {/* Header avec filtres */}
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

      {/* Table des contrats */}
      {filteredContracts.length === 0 ? (
        <Alert severity="info">
          {contracts.length === 0 
            ? t('deployments.noContracts')
            : t('deployments.noMatchingContracts')
          }
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

      {/* Résumé */}
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
              {/* Afficher les pages personnalisées seulement pour les plans payants */}
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