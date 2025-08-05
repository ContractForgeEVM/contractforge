import { useState, useEffect } from 'react'
import { useAccount, useChainId, useWalletClient, usePublicClient } from 'wagmi'
import { formatEther } from 'viem'
import { Container, Box, Snackbar, Alert, Typography } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import Header from './components/Header'
import Footer from './components/Footer'
import TemplateSelector from './components/TemplateSelector'
import ContractForm from './components/ContractForm'
import PremiumFeatures from './components/PremiumFeatures'
import CodeViewer from './components/CodeViewer'
import CompilerMonitoring from './components/CompilerMonitoring'
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
import { analytics, useAnalytics } from './services/analytics'
import GAScript from './components/GAScript'
import type { ContractTemplate, GasEstimate, PremiumFeatureConfig } from './types'
import theme from './theme'
import { validateConfig } from './config'
import './i18n'

import { ToastProviderWithRef, contractToast } from './components/notifications'
import { PageErrorBoundary, Web3ErrorBoundary } from './components/errors/ErrorBoundary'

import { useSmartError } from './hooks/useSmartError'
import { SmartErrorDialog } from './components/errors/SmartErrorDialog'
import { useNotifications } from './services/notificationService'
import EmailVerification from './components/EmailVerification'

import { DeploymentSkeleton, DeploymentSuccessModal } from './components/skeletons'


import { useTranslation } from 'react-i18next'

type PageType = 'deploy' | 'documentation' | 'account' | 'analytics' | 'public-analytics'

function App() {
  const { t } = useTranslation()
  const {
    trackTemplateSelection,
    trackContractDeployment,
    trackPageView,
    trackWalletConnection,
    trackError
  } = useAnalytics()
  
  useEffect(() => {
    analytics.initialize()
    trackPageView('ContractForge - Deploy')
  }, [])
  
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
  
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const {
    currentError,
    isErrorDialogOpen,
    handleError,
    closeError,
    retryLastAction
  } = useSmartError(async () => {
    await handleDeploy()
  })
  
  const { isConnected, address } = useAccount()
  const chainId = useChainId()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()

  const { notifyDeploymentSuccess, notifyDeploymentFailure } = useNotifications()

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

  // Vérification de l'URL pour email verification
  const isEmailVerificationPage = window.location.pathname.includes('/verify-email') || 
                                  window.location.search.includes('verify-email') ||
                                  new URLSearchParams(window.location.search).has('token')

  useEffect(() => {
    if (selectedTemplate && contractParams && isConnected && publicClient) {
      setEstimatingGas(true)
      console.log('🔄 Starting gas estimation...', {
        templateId: selectedTemplate.id,
        chainId,
        featuresCount: selectedFeatures.length,
        hasAddress: !!address
      })
      
      estimateGas(chainId, selectedTemplate.id, selectedFeatures, address)
        .then(estimate => {
          console.log('✅ Gas estimation successful:', estimate)
          setGasEstimate(estimate)
        })
        .catch(error => {
          console.error('❌ Gas estimation failed:', {
            error: error.message,
            templateId: selectedTemplate.id,
            chainId,
            isConnected,
            hasPublicClient: !!publicClient,
            hasAddress: !!address
          })
          
          contractToast.error(`Gas estimation failed: ${error.message || 'Unknown error'}`)
          setGasEstimate(null)
        })
        .finally(() => setEstimatingGas(false))
    } else {
      console.log('⏸️ Gas estimation skipped - missing requirements:', {
        hasTemplate: !!selectedTemplate,
        hasParams: Object.keys(contractParams).length > 0,
        isConnected,
        hasPublicClient: !!publicClient
      })
    }
  }, [selectedTemplate, contractParams, selectedFeatures, chainId, isConnected, publicClient, address, t])

  const handleTemplateSelect = (template: ContractTemplate) => {
    setSelectedTemplate(template)
    setContractParams({})
    setSelectedFeatures([])
    setFeatureConfigs({})
    setDeploymentResult(null)
    setShowHomepage(false)
    trackTemplateSelection(template.id, selectedTemplate?.id)
    
    contractToast.info(t('app.templateSelected', { templateName: template.name }))
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

  const handleFeaturesChange = (features: string[]) => {
    setSelectedFeatures(features)
  }

  const handleFeatureConfigsChange = (configs: any) => {
    setFeatureConfigs(configs)
  }

  const handleDeploy = async () => {
    const deploymentData = {
      selectedTemplate: !!selectedTemplate,
      walletClient: !!walletClient,
      publicClient: !!publicClient,
      gasEstimate: !!gasEstimate,
      address: !!address
    }
    
    if (!selectedTemplate || !walletClient || !publicClient || !address) {
      console.error('❌ Missing critical deployment data:', deploymentData)
      contractToast.error(t('app.missingRequiredData'))
      return
    }
    
    let finalGasEstimate = gasEstimate
    if (!finalGasEstimate) {
      console.warn('⚠️ Gas estimation failed, using default values')
      contractToast.warning('Gas estimation failed, using default values for deployment')
      
      finalGasEstimate = {
        gasLimit: 1000000n,
        gasPrice: 20000000000n,
        deploymentCost: 1000000000000000n,
        platformFee: 20000000000000n,
        premiumFee: 0n,
        totalCost: 1020000000000000n
      }
      
      setGasEstimate(finalGasEstimate)
    }

    setIsDeploying(true)
    setDeploymentResult(null)

    contractToast.info(t('app.deployingContract', { chainName: getChainName() }))

    try {

      const result = await deployContractWithWagmi(
        selectedTemplate.id,
        contractParams,
        walletClient,
        publicClient,
        finalGasEstimate,
        selectedFeatures,
        featureConfigs
      )

      setDeploymentResult(result)
      
      trackContractDeployment({
        template: selectedTemplate.id,
        network: getChainName(),
        success: !!result.address,
        premium_features: selectedFeatures,
        premium_features_count: selectedFeatures.length,
        total_cost: (parseFloat(formatEther(finalGasEstimate.totalCost))).toFixed(6) + ' ETH'
      })

      if (result.address) {
        contractToast.success(t('app.deploymentSuccess', { address: result.address?.slice(0, 10) }))
        setShowSuccessModal(true)
        
        // 🔔 Envoyer notification de succès
        await notifyDeploymentSuccess({
          contractName: selectedTemplate.name,
          contractAddress: result.address,
          transactionHash: result.hash || '',
          chainId: chainId,
          gasUsed: finalGasEstimate.gasLimit.toString() || '',
          deploymentCost: parseFloat(formatEther(finalGasEstimate.totalCost)).toFixed(6),
          templateName: selectedTemplate.id
        }, address)
      }
    } catch (error: any) {
      console.error('Deployment failed:', error)
      
      trackContractDeployment({
        template: selectedTemplate.id,
        network: getChainName(),
        success: false,
        premium_features: selectedFeatures,
        premium_features_count: selectedFeatures.length,
        total_cost: (parseFloat(formatEther(finalGasEstimate.totalCost))).toFixed(6) + ' ETH',
        error: error.message
      })

      // 🔔 Envoyer notification d'échec
      await notifyDeploymentFailure({
        contractName: selectedTemplate.name,
        chainId: chainId,
        errorMessage: error.message || t('app.deploymentFailed'),
        templateName: selectedTemplate.id
      }, address)
      
      await handleError(
        error,
        selectedTemplate.name,
        selectedFeatures,
        gasEstimate,
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
    return chainNames[chainId] || t('app.unknownChain')
  }

  const handleNavigateToDeploy = () => {
    setCurrentPage('deploy')
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
              {isDeploying && selectedTemplate && (
                <DeploymentSkeleton
                  status="pending"
                  chainName={getChainName()}
                  templateName={selectedTemplate.name}
                  chainId={chainId}
                />
              )}
              
              {!isDeploying && !selectedTemplate ? (
                <TemplateSelector
                  selectedTemplate={selectedTemplate}
                  onSelectTemplate={handleTemplateSelect}
                  showHomepage={showHomepage}
                  onShowTemplates={handleShowTemplates}
                  onNavigateDocs={handleNavigateToDocs}
                />
              ) : !isDeploying && selectedTemplate && (
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', lg: 'row' } }}>
                  <Box sx={{ flex: '0 0 25%', maxWidth: { xs: '100%', lg: '25%' } }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Web3ErrorBoundary>
                        <ContractForm
                          template={selectedTemplate}
                          onChange={handleParamsChange}
                          onBack={handleBackToHomepage}
                          onDeploy={handleDeploy}
                          isDeploying={isDeploying}
                        />
                      </Web3ErrorBoundary>
                    </Box>
                  </Box>

                  <Box sx={{ flex: '0 0 50%', maxWidth: { xs: '100%', lg: '50%' } }}>
                    <CompilerMonitoring template={selectedTemplate} />
                    <DeploymentInfo
                      gasEstimate={gasEstimate}
                      loading={estimatingGas}
                      chainName={getChainName()}
                    />
                    <CodeViewer
                      template={selectedTemplate}
                      params={{
                        ...contractParams,
                        premiumFeatures: selectedFeatures,
                        featureConfigs: featureConfigs
                      }}
                    />


                  </Box>

                  <Box sx={{ flex: '0 0 25%', maxWidth: { xs: '100%', lg: '25%' } }}>
                    <Web3ErrorBoundary>
                      <PremiumFeatures
                        template={selectedTemplate}
                        selectedFeatures={selectedFeatures}
                        onFeaturesChange={handleFeaturesChange}
                        featureConfigs={featureConfigs}
                        onFeatureConfigChange={handleFeatureConfigsChange}
                        isVerticalCompact={true}
                      />
                    </Web3ErrorBoundary>
                  </Box>
                </Box>
              )}
            </Container>
          </PageErrorBoundary>
        )
    }
  }

  // Afficher la page de vérification email si nécessaire
  if (isEmailVerificationPage) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <EmailVerification />
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SEOHead template={selectedTemplate?.id || null} />
                      <GAScript />
        <Analytics />
      
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

          <DeploymentSuccessModal
            open={showSuccessModal}
            onClose={() => setShowSuccessModal(false)}
            deploymentResult={deploymentResult}
            chainName={getChainName()}
            gasEstimate={gasEstimate}
            templateName={selectedTemplate?.name}
            selectedFeatures={selectedFeatures}
          />

          <SmartErrorDialog
            error={currentError}
            open={isErrorDialogOpen}
            onClose={closeError}
            onRetry={retryLastAction}
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
      </ToastProviderWithRef>
    </ThemeProvider>
  )
}

export default App