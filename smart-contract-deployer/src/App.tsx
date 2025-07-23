import { useState, useEffect } from 'react'
import { useAccount, useChainId, useWalletClient, usePublicClient } from 'wagmi'
import { Container, Box, Snackbar, Alert, Typography } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import Header from './components/Header'
import Footer from './components/Footer'
import TemplateSelector from './components/TemplateSelector'
import ContractForm from './components/ContractForm'
import PremiumFeatures from './components/PremiumFeatures'
import CodeViewer from './components/CodeViewer'
import DeploymentInfo from './components/DeploymentInfo'
// import DeploymentSuccessModal from './components/DeploymentSuccessModal' // Supprimé - remplacé par toasts
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

// 🎯 Nouveaux imports pour les améliorations UX
import { ToastProvider, contractToast } from './components/notifications/ToastSystem'
import { PageErrorBoundary, Web3ErrorBoundary } from './components/errors/ErrorBoundary'

// 🧠 Import du système d'erreurs intelligentes
import { useSmartError } from './hooks/useSmartError'
import { SmartErrorDialog } from './components/errors/SmartErrorDialog'

// 🧪 IMPORT DE TEST - Retirez en production
import { SmartErrorExample } from './components/SmartErrorExample'

type PageType = 'deploy' | 'documentation' | 'account' | 'analytics' | 'public-analytics'

function App() {
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null)
  const [contractParams, setContractParams] = useState<Record<string, any>>({})
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
  const [featureConfigs, setFeatureConfigs] = useState<PremiumFeatureConfig>({})
  const [isDeploying, setIsDeploying] = useState(false)
  const [showHomepage, setShowHomepage] = useState(true)
  const [deploymentResult, setDeploymentResult] = useState<{
    address?: string
    hash?: string
    error?: string
  } | null>(null)

  const [gasEstimate, setGasEstimate] = useState<GasEstimate | null>(null)
  const [estimatingGas, setEstimatingGas] = useState(false)
  const [currentPage, setCurrentPage] = useState<PageType>('deploy')

  // 🧠 Hook du système d'erreurs intelligentes
  const {
    currentError,
    isErrorDialogOpen,
    handleError,
    closeError,
    retryLastAction
  } = useSmartError(async () => {
    // Fonction de retry - relance le déploiement
    await handleDeploy()
  })
  
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
      // 🌟 Passer l'adresse wallet pour les prix premium dev
      estimateGas(chainId, selectedTemplate.id, selectedFeatures, address)
        .then(setGasEstimate)
        .catch(error => {
          console.error('Gas estimation failed:', error)
          // 🎯 Toast notification au lieu de console.error
          contractToast.error('Failed to estimate gas costs')
          setGasEstimate(null)
        })
        .finally(() => setEstimatingGas(false))
    }
  }, [selectedTemplate, contractParams, selectedFeatures, chainId, isConnected, publicClient, address])

  const handleTemplateSelect = (template: ContractTemplate) => {
    setSelectedTemplate(template)
    setContractParams({})
    setSelectedFeatures([])
    setFeatureConfigs({})
    setDeploymentResult(null)
    setShowHomepage(false)
    trackTemplateSelection(template.id)
    
    // 🎯 Toast de sélection
    contractToast.info(`Selected ${template.name} template`)
  }

  const handleShowTemplates = () => {
    setShowHomepage(false)
    setSelectedTemplate(null)
  }

  const handleBackToHomepage = () => {
    setShowHomepage(true)
    setSelectedTemplate(null)
    setContractParams({})
    setSelectedFeatures([])
    setFeatureConfigs({})
    setDeploymentResult(null)
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
      contractToast.error('Missing required data for deployment')
      return
    }

    console.log('🎯🎯🎯 APP.TSX HANDLE DEPLOY CALLED 🎯🎯🎯')
    
    setIsDeploying(true)
    setDeploymentResult(null)

    // 🎯 Toast de déploiement en cours
    contractToast.deploymentLoading("Deploying your contract...", {
      network: getChainName(),
      cost: gasEstimate.deploymentCost.toString()
    })

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
        // 🎯 Toast de succès avec détails
        contractToast.deploymentSuccess("Contract deployed successfully! 🎉", {
          contractAddress: result.address,
          txHash: result.hash,
          explorerUrl: `https://arbiscan.io/tx/${result.hash}`,
          gasUsed: gasEstimate.gasLimit.toString(),
          cost: gasEstimate.deploymentCost.toString(),
          network: getChainName()
        })
        // Modal success supprimée - le toast est suffisant
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
      
      // 🧠 Utilisation du système d'erreurs intelligentes
      await handleError(
        error,
        selectedTemplate.name,  // Template name for context
        selectedFeatures,       // Premium features selected
        gasEstimate,           // Gas estimation for cost context
        {
          stage: 'deployment',
          chainName: getChainName(),
          userAddress: address
        }
      )
      
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
    // Si on est déjà sur la page deploy, basculer entre homepage et templates
    if (currentPage === 'deploy') {
      if (selectedTemplate) {
        handleBackToHomepage()
      } else if (!showHomepage) {
        setShowHomepage(true)
      }
    }
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
        return (
          <PageErrorBoundary pageName="Documentation">
            <Documentation />
          </PageErrorBoundary>
        )
      
      case 'analytics':
        return (
          <PageErrorBoundary pageName="Analytics">
            <ProtectedAnalytics />
          </PageErrorBoundary>
        )
      
      case 'public-analytics':
        return (
          <PageErrorBoundary pageName="Public Analytics">
            <PublicAnalytics />
          </PageErrorBoundary>
        )
      
      case 'account':
        return (
          <PageErrorBoundary pageName="Account Dashboard">
            <AccountDashboard />
          </PageErrorBoundary>
        )
      
      case 'deploy':
      default:
        return (
          <PageErrorBoundary pageName="Deploy">
            <Container maxWidth="xl" sx={{ py: 4, flex: 1 }}>
              {!selectedTemplate ? (
                <TemplateSelector
                  selectedTemplate={selectedTemplate}
                  onSelectTemplate={handleTemplateSelect}
                  showHomepage={showHomepage}
                  onShowTemplates={handleShowTemplates}
                  onNavigateDocs={handleNavigateToDocs}
                />
              ) : (
                <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
                  {/* Left Panel - Forms */}
                  <Box sx={{ flex: '0 0 35%', maxWidth: { xs: '100%', md: '35%' } }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {/* 🎯 Web3 Error Boundary pour les composants blockchain */}
                      <Web3ErrorBoundary>
                        <ContractForm
                          template={selectedTemplate}
                          onChange={handleParamsChange}
                          onBack={handleBackToHomepage}
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
                      </Web3ErrorBoundary>
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

                    {/* 🧪 TEST PANEL - Mode développement seulement */}
                    {process.env.NODE_ENV === 'development' && (
                      <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                        <Typography variant="h6" gutterBottom>
                          🧪 Test Système d'Erreurs Intelligentes
                        </Typography>
                        <SmartErrorExample />
                      </Box>
                    )}
                  </Box>
                </Box>
              )}
            </Container>
          </PageErrorBoundary>
        )
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SEOHead template={selectedTemplate?.id || null} />
      <Analytics />
      
      {/* 🎯 Toast Provider pour toute l'app */}
      <ToastProvider>
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

          {/* DeploymentSuccessModal supprimée - remplacée par des toasts riches */}

          {/* 🧠 Dialog d'erreurs intelligentes global */}
          <SmartErrorDialog
            error={currentError}
            open={isErrorDialogOpen}
            onClose={closeError}
            onRetry={retryLastAction}
          />

          {/* 🎯 Garder le Snackbar de fallback pour compatibilité */}
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
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App