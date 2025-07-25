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
import DeploymentSuccessModal from './components/DeploymentSuccessModal'
import DeploymentSkeleton from './components/DeploymentSkeleton'
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
import { ToastProviderWithRef, contractToast } from './components/notifications'
import { PageErrorBoundary, Web3ErrorBoundary } from './components/errors/ErrorBoundary'

// 🧠 Import du système d'erreurs intelligentes
import { useSmartError } from './hooks/useSmartError'
import { SmartErrorDialog } from './components/errors/SmartErrorDialog'

// 🧪 IMPORT DE TEST - Retirez en production
import { SmartErrorExample } from './components/SmartErrorExample'

// 🌐 Import pour les traductions
import { useTranslation } from 'react-i18next'

type PageType = 'deploy' | 'documentation' | 'account' | 'analytics' | 'public-analytics'

function App() {
  const { t } = useTranslation()
  
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null)
  const [contractParams, setContractParams] = useState<Record<string, any>>({})
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
  const [featureConfigs, setFeatureConfigs] = useState<PremiumFeatureConfig>({})
  const [isDeploying, setIsDeploying] = useState(false)
  const [deploymentStatus, setDeploymentStatus] = useState<'pending' | 'confirmed'>('pending')
  const [showHomepage, setShowHomepage] = useState(true)
  const [deploymentResult, setDeploymentResult] = useState<{
    address?: string
    hash?: string
    error?: string
  } | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

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
      console.warn(t('app.configWarning'))
    }
  }, [t])

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const pathname = window.location.pathname
    
    if (urlParams.get('admin') === 'true' || pathname.includes('/analytics')) {
      setCurrentPage('analytics')
    } else if (urlParams.get('docs') === 'true' || pathname.includes('/docs') || urlParams.get('page') === 'documentation') {
      setCurrentPage('documentation')
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
                      contractToast.error(t('app.gasEstimationFailed'), t('app.notifications.gasEstimationFailed'))
          setGasEstimate(null)
        })
        .finally(() => setEstimatingGas(false))
    }
  }, [selectedTemplate, contractParams, selectedFeatures, chainId, isConnected, publicClient, address, t])

  const handleTemplateSelect = (template: ContractTemplate) => {
    setSelectedTemplate(template)
    setContractParams({})
    setSelectedFeatures([])
    setFeatureConfigs({})
    setDeploymentResult(null)
    setShowHomepage(false)
    trackTemplateSelection(template.id)
    
    // 🎯 Toast de sélection
    contractToast.info(t('app.templateSelected', { templateName: template.name }), t('app.notifications.templateSelected'))
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
      contractToast.error(t('app.missingRequiredData'), t('app.notifications.missingData'))
      return
    }

    console.log('🎯🎯🎯 APP.TSX HANDLE DEPLOY CALLED 🎯🎯🎯')
    
    setIsDeploying(true)
    setDeploymentStatus('pending')
    setDeploymentResult(null)

    // Pas de toast de déploiement - le skeleton gère déjà l'affichage

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
        featureConfigs,
        (status) => {
          // Tous les états intermédiaires sont considérés comme 'pending'
          setDeploymentStatus('pending')
          // Pas de notifications multiples - on garde seulement le skeleton
        }
      )

      // Pas de notification de confirmation - le skeleton gère déjà l'affichage

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
        setDeploymentStatus('confirmed')
        // 🎯 Toast de succès avec détails
        contractToast.success(t('app.deploymentSuccess', { address: result.address?.slice(0, 10) }), t('app.notifications.deploymentSuccess'))
        // Afficher le modal de succès détaillé
        setShowSuccessModal(true)
      }
    } catch (error: any) {
      console.error('Deployment failed:', error)
      setDeploymentStatus('pending') // En cas d'erreur, on reste en pending
      
      // 🎯 Toast d'erreur de déploiement
      contractToast.error(error.message || t('app.deploymentFailed'), t('app.notifications.deploymentFailed'))
      
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
        error: error.message || t('app.deploymentFailed')
      })
    } finally {
      // Attendre un peu avant de masquer le skeleton pour que l'utilisateur voie le résultat
      setTimeout(() => {
        setIsDeploying(false)
        setDeploymentStatus('pending')
      }, 2000)
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
    return chainNames[chainId] || t('app.unknownChain')
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
          <PageErrorBoundary pageName={t('app.pages.documentation')}>
            <Documentation />
          </PageErrorBoundary>
        )
      
      case 'analytics':
        return (
          <PageErrorBoundary pageName={t('app.pages.analytics')}>
            <ProtectedAnalytics />
          </PageErrorBoundary>
        )
      
      case 'public-analytics':
        return (
          <PageErrorBoundary pageName={t('app.pages.publicAnalytics')}>
            <PublicAnalytics />
          </PageErrorBoundary>
        )
      
      case 'account':
        return (
          <PageErrorBoundary pageName={t('app.pages.accountDashboard')}>
            <AccountDashboard />
          </PageErrorBoundary>
        )
      
      case 'deploy':
      default:
        return (
          <PageErrorBoundary pageName={t('app.pages.deploy')}>
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
                                {isDeploying && deploymentStatus === 'pending' ? (
          <DeploymentSkeleton
            status="pending"
                            chainName={getChainName()}
                            templateName={selectedTemplate?.name}
                            transactionHash={deploymentResult?.hash}
                            chainId={chainId}
                          />
                        ) : (
                          <ContractForm
                            template={selectedTemplate}
                            onChange={handleParamsChange}
                            onBack={handleBackToHomepage}
                            onDeploy={handleDeploy}
                            isDeploying={isDeploying}
                            deploymentStatus={deploymentStatus}
                          />
                        )}
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
                          {t('app.testSmartErrorSystem')}
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
      <ToastProviderWithRef>
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

          {/* Modal de succès détaillé */}
          <DeploymentSuccessModal
            open={showSuccessModal}
            onClose={() => setShowSuccessModal(false)}
            deploymentResult={deploymentResult}
            chainName={getChainName()}
            gasEstimate={gasEstimate}
            templateName={selectedTemplate?.name}
            selectedFeatures={selectedFeatures}
          />

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
      </ToastProviderWithRef>
    </ThemeProvider>
  )
}

export default App