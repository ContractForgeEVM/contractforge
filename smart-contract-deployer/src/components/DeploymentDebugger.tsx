import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  LinearProgress,
  Stack,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  BugReport as BugIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
} from '@mui/icons-material'
import { testApiConnectivity, compileWithBackend } from '../utils/backendCompiler'
import { estimateFactoryGas } from '../utils/factoryGasEstimator'
import { useAccount, useChainId } from 'wagmi'
import type { TemplateType } from '../types'

interface DiagnosticResult {
  test: string
  status: 'success' | 'error' | 'warning'
  message: string
  details?: string
}

const DeploymentDebugger: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<DiagnosticResult[]>([])
  const [testTemplate, setTestTemplate] = useState<TemplateType>('token')
  const [testFeatures, setTestFeatures] = useState<string[]>(['pausable'])
  
  const { address, isConnected } = useAccount()
  const chainId = useChainId()

  const testParams: Record<TemplateType, Record<string, any>> = {
    token: { name: 'Test Token', symbol: 'TEST', totalSupply: 1000000, decimals: 18 },
    nft: { name: 'Test NFT', symbol: 'TNFT', maxSupply: 10000, baseURI: 'https://example.com/' },
    dao: { name: 'Test DAO', governanceTokenAddress: '0x1234567890123456789012345678901234567890', proposalThreshold: 100, votingPeriod: 50400 },
    lock: { tokenAddress: '0x1234567890123456789012345678901234567890', beneficiary: '0x1234567890123456789012345678901234567890', unlockTime: '2025-01-01' },
    'social-token': { creatorName: 'Test Creator', symbol: 'SOCIAL', initialSupply: 1000000, creatorShare: 20, communityGoverned: true },
    'liquidity-pool': { name: 'Test Pool', tokenA: '0x1234567890123456789012345678901234567890', tokenB: '0x1234567890123456789012345678901234567890', fee: 3000, initialPrice: 1.0 },
    'yield-farming': { name: 'Test Farm', stakingToken: '0x1234567890123456789012345678901234567890', rewardToken: '0x1234567890123456789012345678901234567890', rewardRate: 0.001, duration: 30 },
    'gamefi-token': { name: 'Test Game Token', symbol: 'TGAME', maxSupply: 1000000, mintPrice: 0.01, burnRate: 2 },
    'nft-marketplace': { name: 'Test Market', nftContract: '0x1234567890123456789012345678901234567890', platformFee: 2.5, creatorFee: 5.0, allowMinting: false },
    'revenue-sharing': { name: 'Test Revenue Token', symbol: 'TREV', totalSupply: 1000000, businessWallet: '0x1234567890123456789012345678901234567890', distributionPeriod: 30 },
    'loyalty-program': { name: 'Test Loyalty', pointsPerPurchase: 10, redemptionRate: 0.01, transferable: false, expirable: true },
    'dynamic-nft': { name: 'Test Dynamic NFT', symbol: 'TDNFT', maxSupply: 10000, evolvable: true, mergeable: false }
  }

  const runDiagnostics = async () => {
    setIsRunning(true)
    setResults([])
    
    const newResults: DiagnosticResult[] = []

    try {
      // 1. Test de connectivité API
      addResult(newResults, 'Testing API connectivity...', 'warning', 'In progress')
      
      const connectivityTest = await testApiConnectivity()
      if (connectivityTest.success) {
        addResult(newResults, 'API Connectivity', 'success', connectivityTest.message)
      } else {
        addResult(newResults, 'API Connectivity', 'error', connectivityTest.message, 'Check if the backend server is running on the correct port')
      }

      // 2. Test de compilation
      addResult(newResults, 'Testing contract compilation...', 'warning', 'In progress')
      
      try {
        const { bytecode, abi } = await compileWithBackend(
          testTemplate,
          testParams[testTemplate] || {},
          testFeatures
        )
        
        if (bytecode && bytecode !== '0x' && abi) {
          addResult(newResults, 'Contract Compilation', 'success', `Compiled successfully (${bytecode.length} chars bytecode, ${abi.length} ABI functions)`)
        } else {
          addResult(newResults, 'Contract Compilation', 'error', 'Empty bytecode or ABI received')
        }
      } catch (compileError: any) {
        addResult(newResults, 'Contract Compilation', 'error', compileError.message, 'Check console logs for detailed compilation errors')
      }

      // 3. Test d'estimation de gas
      if (isConnected && chainId) {
        addResult(newResults, 'Testing gas estimation...', 'warning', 'In progress')
        
        try {
          const gasEstimate = await estimateFactoryGas(chainId, testTemplate, testFeatures)
          addResult(newResults, 'Gas Estimation', 'success', `Total cost: ${(Number(gasEstimate.totalCost) / 1e18).toFixed(6)} ETH`)
        } catch (gasError: any) {
          addResult(newResults, 'Gas Estimation', 'error', gasError.message, 'Factory may not be deployed on this network')
        }
      } else {
        addResult(newResults, 'Gas Estimation', 'warning', 'Wallet not connected - skipping gas estimation')
      }

      // 4. Test des mappings
      addResult(newResults, 'Testing feature mappings...', 'warning', 'In progress')
      
      try {
        const { convertFeatureIdsToUint8, getContractTemplateType } = await import('../utils/contractMappings')
        
        const mappedFeatures = convertFeatureIdsToUint8(testFeatures)
        const mappedTemplate = getContractTemplateType(testTemplate)
        
        if (mappedFeatures.length === testFeatures.length && mappedTemplate !== undefined) {
          addResult(newResults, 'Feature Mappings', 'success', `Template: ${mappedTemplate}, Features: [${mappedFeatures.join(', ')}]`)
        } else {
          addResult(newResults, 'Feature Mappings', 'error', 'Some features could not be mapped')
        }
      } catch (mappingError: any) {
        addResult(newResults, 'Feature Mappings', 'error', mappingError.message)
      }

      // 5. Test de l'environnement
      addResult(newResults, 'Environment Check', 'success', `Connected: ${isConnected}, Chain: ${chainId}, Address: ${address?.substring(0, 8)}...`)

    } catch (error: any) {
      addResult(newResults, 'Diagnostics Failed', 'error', error.message)
    }

    setResults(newResults)
    setIsRunning(false)
  }

  const addResult = (results: DiagnosticResult[], test: string, status: DiagnosticResult['status'], message: string, details?: string) => {
    results.push({ test, status, message, details })
    setResults([...results]) // Update state to show progress
  }

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success': return <CheckIcon color="success" />
      case 'error': return <ErrorIcon color="error" />
      case 'warning': return <WarningIcon color="warning" />
    }
  }

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success': return 'success'
      case 'error': return 'error'
      case 'warning': return 'warning'
    }
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <BugIcon color="primary" />
          <Typography variant="h6">🔧 Deployment Debugger</Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          Si vous rencontrez une <strong>erreur 400</strong>, utilisez cet outil pour diagnostiquer le problème.
        </Alert>

        {/* Configuration des tests */}
        <Accordion sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>⚙️ Configuration des tests</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Template à tester</InputLabel>
                <Select
                  value={testTemplate}
                  label="Template à tester"
                  onChange={(e) => setTestTemplate(e.target.value as TemplateType)}
                >
                  <MenuItem value="token">ERC20 Token</MenuItem>
                  <MenuItem value="nft">NFT Collection</MenuItem>
                  <MenuItem value="dao">DAO</MenuItem>
                  <MenuItem value="lock">Token Lock</MenuItem>
                  <MenuItem value="social-token">Social Token</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Premium Features (séparées par virgules)"
                value={testFeatures.join(', ')}
                onChange={(e) => setTestFeatures(e.target.value.split(',').map(f => f.trim()).filter(f => f))}
                size="small"
                helperText="Ex: pausable, burnable, mintable"
              />
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Button
          variant="contained"
          onClick={runDiagnostics}
          disabled={isRunning}
          startIcon={<BugIcon />}
          sx={{ mb: 2 }}
          fullWidth
        >
          {isRunning ? 'Running Diagnostics...' : 'Run Full Diagnostics'}
        </Button>

        {isRunning && <LinearProgress sx={{ mb: 2 }} />}

        {/* Résultats */}
        {results.length > 0 && (
          <Stack spacing={1}>
            {results.map((result, index) => (
              <Alert
                key={index}
                severity={getStatusColor(result.status)}
                icon={getStatusIcon(result.status)}
                sx={{
                  '& .MuiAlert-message': {
                    width: '100%'
                  }
                }}
              >
                <Box>
                  <Typography variant="subtitle2" component="div">
                    {result.test}
                  </Typography>
                  <Typography variant="body2">
                    {result.message}
                  </Typography>
                  {result.details && (
                    <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                      💡 {result.details}
                    </Typography>
                  )}
                </Box>
              </Alert>
            ))}
          </Stack>
        )}

        {/* Solutions communes */}
        {results.some(r => r.status === 'error') && (
          <Accordion sx={{ mt: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>🛠️ Solutions courantes</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={1}>
                <Typography variant="subtitle2">Si l'API n'est pas accessible :</Typography>
                <Typography variant="body2">• Vérifiez que le backend tourne sur le bon port</Typography>
                <Typography variant="body2">• Vérifiez votre connexion internet</Typography>
                <Typography variant="body2">• Vérifiez les variables d'environnement VITE_API_URL</Typography>
                
                <Typography variant="subtitle2" sx={{ mt: 2 }}>Si la compilation échoue :</Typography>
                <Typography variant="body2">• Vérifiez les paramètres du template</Typography>
                <Typography variant="body2">• Vérifiez que les premium features sont supportées</Typography>
                <Typography variant="body2">• Regardez les logs de la console pour plus de détails</Typography>
                
                <Typography variant="subtitle2" sx={{ mt: 2 }}>Si l'estimation de gas échoue :</Typography>
                <Typography variant="body2">• La factory n'est peut-être pas déployée sur ce réseau</Typography>
                <Typography variant="body2">• Changez de réseau ou déployez la factory</Typography>
              </Stack>
            </AccordionDetails>
          </Accordion>
        )}
      </CardContent>
    </Card>
  )
}

export default DeploymentDebugger 