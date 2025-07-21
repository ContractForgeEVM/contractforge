import { useState, useEffect } from 'react'
import { useAccount, useChainId, useWalletClient, usePublicClient } from 'wagmi'
import { Container, Box, Snackbar, Alert } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import Header from './components/Header'
import Footer from './components/Footer'
import TemplateSelector from './components/TemplateSelector'
import ContractForm from './components/ContractForm'
import PremiumFeatures from './components/PremiumFeatures'
import CodeViewer from './components/CodeViewer'
import DeploymentInfo from './components/DeploymentInfo'
import DeploymentSuccessModal from './components/DeploymentSuccessModal'
import Documentation from './components/Documentation'
import ProtectedAnalytics from './components/ProtectedAnalytics'
import AccountDashboard from './components/AccountDashboard'
import SEOHead from './components/SEOHead'
import Analytics from './components/Analytics'
import PublicAnalytics from './components/PublicAnalytics'
import { estimateGas } from './utils/factoryGasEstimator'
import { deployContractWithWagmi } from './utils/factoryDeployer'
import { trackDeployment, trackTemplateSelection } from './services/analytics'
import type { ContractTemplate, GasEstimate, PremiumFeatureConfig } from './types'
import theme from './theme'
import { validateConfig } from './config'
import './i18n'

type PageType = 'deploy' | 'documentation' | 'account' | 'analytics' | 'public-analytics'

function App() {
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null)
  const [contractParams, setContractParams] = useState<Record<string, any>>({})
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
  const [featureConfigs, setFeatureConfigs] = useState<PremiumFeatureConfig>({})
  const [isDeploying, setIsDeploying] = useState(false)
  const [deploymentResult, setDeploymentResult] = useState<{
    address?: string
    hash?: string
    error?: string
  } | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [gasEstimate, setGasEstimate] = useState<GasEstimate | null>(null)
  const [estimatingGas, setEstimatingGas] = useState(false)
  const [currentPage, setCurrentPage] = useState<PageType>('deploy')
  
  const { isConnected, address } = useAccount()
  const chainId = useChainId()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()

  useEffect(() => {
    const isValid = validateConfig()
    if (!isValid) {
      console.warn('Some configuration values are missing. The app may not work correctly.')
    }
  }, [])

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const pathname = window.location.pathname
    
    if (urlParams.get('admin') === 'true' || pathname.includes('/analytics')) {
      setCurrentPage('analytics')
    }
  }, [])

  useEffect(() => {
    if (selectedTemplate && contractParams && isConnected && publicClient) {
      setEstimatingGas(true)
      estimateGas(chainId, selectedTemplate.id, selectedFeatures)
        .then(setGasEstimate)
        .catch(error => {
          console.error('Gas estimation failed:', error)
          setGasEstimate(null)
        })
        .finally(() => setEstimatingGas(false))
    }
  }, [selectedTemplate, contractParams, selectedFeatures, chainId, isConnected, publicClient])

  const handleTemplateSelect = (template: ContractTemplate) => {
    setSelectedTemplate(template)
    setContractParams({})
    setSelectedFeatures([])
    setFeatureConfigs({})
    setDeploymentResult(null)
    trackTemplateSelection(template.id)
  }

  const handleParamsChange = (params: Record<string, any>) => {
    setContractParams(params)
  }

  // Add handlers for premium features
  const handleFeaturesChange = (features: string[]) => {
    setSelectedFeatures(features)
  }

  const handleFeatureConfigsChange = (configs: any) => {
    setFeatureConfigs(configs)
  }

  const handleDeploy = async () => {
    if (!selectedTemplate || !walletClient || !publicClient || !gasEstimate || !address) {
      console.error('Missing required deployment data:', { selectedTemplate: !!selectedTemplate, walletClient: !!walletClient, publicClient: !!publicClient, gasEstimate: !!gasEstimate, address: !!address })
      return
    }

    console.log('🎯🎯🎯 APP.TSX HANDLE DEPLOY CALLED 🎯🎯🎯')
    
    setIsDeploying(true)
    setDeploymentResult(null)

    try {
      // 🔍 DEBUG LOGS - TEMPORAIRE
      console.log('🎯 === DÉPLOIEMENT DEBUG ===')
      console.log('🏭 Template:', selectedTemplate.id)
      console.log('📊 ChainId:', chainId)
      console.log('🎨 Premium Features:', selectedFeatures)
      console.log('🔧 Params:', contractParams)
      console.log('===============================')

      const result = await deployContractWithWagmi(
        selectedTemplate.id,
        contractParams,
        walletClient,
        publicClient,
        gasEstimate,
        selectedFeatures,
        featureConfigs
      )

      setDeploymentResult(result)
      
      // Track deployment with wallet address and gas data
      trackDeployment({
        template: selectedTemplate.id,
        chain: getChainName(),
        success: !!result.address,
        value: gasEstimate.deploymentCost.toString(),
        address: result.address,
        transactionHash: result.hash,
        gasUsed: gasEstimate.gasLimit.toString() // Estimation du gas utilisé
      }, address)

      if (result.address) {
        setShowSuccessModal(true)
      }
    } catch (error: any) {
      console.error('Deployment failed:', error)
      
      // Track failed deployment with error details
      trackDeployment({
        template: selectedTemplate.id,
        chain: getChainName(),
        success: false,
        value: gasEstimate.deploymentCost.toString(),
        gasUsed: gasEstimate.gasLimit.toString()
      }, address)
      
      setDeploymentResult({
        error: error.message || 'Deployment failed'
      })
    } finally {
      setIsDeploying(false)
    }
  }

  const getChainName = (): string => {
    const chainNames: Record<number, string> = {
      1: 'Ethereum',
      137: 'Polygon',
      42161: 'Arbitrum',
      10: 'Optimism',
      56: 'BSC',
      43114: 'Avalanche',
      8453: 'Base'
    }
    return chainNames[chainId] || 'Unknown'
  }

  const handleNavigateToDeploy = () => {
    setCurrentPage('deploy')
  }

  const handleNavigateToDocs = () => {
    setCurrentPage('documentation')
  }

  const handleNavigateToAccount = () => {
    setCurrentPage('account')
  }

  const handleNavigateToAnalytics = () => {
    setCurrentPage('public-analytics')
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'documentation':
        return <Documentation />
      
      case 'analytics':
        return <ProtectedAnalytics />
      
      case 'public-analytics':
        return <PublicAnalytics />
      
      case 'account':
        return <AccountDashboard />
      
      case 'deploy':
      default:
        return (
          <Container maxWidth="xl" sx={{ py: 4, flex: 1 }}>
            {!selectedTemplate ? (
              <TemplateSelector
                selectedTemplate={selectedTemplate}
                onSelectTemplate={handleTemplateSelect}
              />
            ) : (
              <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
                {/* Left Panel - Forms */}
                <Box sx={{ flex: '0 0 35%', maxWidth: { xs: '100%', md: '35%' } }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <ContractForm
                      template={selectedTemplate}
                      onChange={handleParamsChange}
                      onBack={() => setSelectedTemplate(null)}
                      onDeploy={handleDeploy}
                      isDeploying={isDeploying}
                    />
                    <PremiumFeatures
                      template={selectedTemplate}
                      selectedFeatures={selectedFeatures}
                      onFeaturesChange={handleFeaturesChange}
                      featureConfigs={featureConfigs}
                      onFeatureConfigChange={handleFeatureConfigsChange}
                    />
                    <DeploymentInfo
                      gasEstimate={gasEstimate}
                      loading={estimatingGas}
                      chainName={getChainName()}
                    />
                  </Box>
                </Box>

                {/* Right Panel - Code Preview */}
                <Box sx={{ flex: 1 }}>
                  <CodeViewer
                    template={selectedTemplate}
                    params={{
                      ...contractParams,
                      premiumFeatures: selectedFeatures,
                      featureConfigs: featureConfigs
                    }}
                  />
                </Box>
              </Box>
            )}
          </Container>
        )
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SEOHead template={selectedTemplate?.id || null} />
      <Analytics />
      
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'background.default' }}>
        <Header
          onNavigateDeploy={handleNavigateToDeploy}
          onNavigateDocs={handleNavigateToDocs}
          onNavigateAccount={handleNavigateToAccount}
          onNavigateAnalytics={handleNavigateToAnalytics}
          currentPage={currentPage}
        />
        
        {renderPage()}
        
        <Footer />

        <DeploymentSuccessModal
          open={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          deploymentResult={deploymentResult}
          chainName={getChainName()}
        />

        <Snackbar
          open={!!deploymentResult?.error}
          autoHideDuration={6000}
          onClose={() => setDeploymentResult(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setDeploymentResult(null)}
            severity="error"
            sx={{ width: '100%' }}
          >
            {deploymentResult?.error}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  )
}

export default App