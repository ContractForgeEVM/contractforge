// Configuration Google Analytics
const GA_MEASUREMENT_ID = import.meta.env.VITE_GOOGLE_ANALYTICS_ID || 'G-XXXXXXXXXX'

// Déclaration TypeScript pour gtag
declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
  }
}

// Initialiser dataLayer globalement si pas déjà fait
if (typeof window !== 'undefined' && !window.dataLayer) {
  window.dataLayer = []
}

// Fonction gtag helper
const gtag = (...args: any[]) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag(...args)
  }
}

// Interface pour les événements personnalisés
interface AnalyticsEvent {
  action: string
  category: string
  label?: string
  value?: number
  custom_parameters?: Record<string, any>
}

// Interface pour les événements de déploiement
interface DeploymentEvent {
  template: string
  network: string
  premium_features: string[]
  premium_features_count: number
  total_cost: string
  success: boolean
  error?: string
}

class AnalyticsService {
  private isInitialized = false

  // Initialiser Google Analytics
  initialize() {
    if (this.isInitialized || !GA_MEASUREMENT_ID || GA_MEASUREMENT_ID === 'G-XXXXXXXXXX') {
      return
    }

    try {
      // Initialiser window.dataLayer si pas déjà fait
      if (!window.dataLayer) {
        window.dataLayer = []
      }

      // Charger le script Google Analytics gtag.js
      const script = document.createElement('script')
      script.async = true
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
      document.head.appendChild(script)

      // Créer la fonction gtag
      window.gtag = function() {
        window.dataLayer.push(arguments)
      }

      // Initialiser gtag immédiatement
      gtag('js', new Date())
      gtag('config', GA_MEASUREMENT_ID, {
        page_title: 'ContractForge - No Code Smart Contract Platform',
        page_location: window.location.href,
        custom_map: {
          custom_template: 'template_type',
          custom_network: 'blockchain_network',
          custom_features: 'premium_features'
        }
      })
      
      this.isInitialized = true
      console.log('📊 Google Analytics initialized successfully with ID:', GA_MEASUREMENT_ID)
      
    } catch (error) {
      console.error('Failed to initialize Google Analytics:', error)
    }
  }

  // Tracker une page vue
  trackPageView(page_title: string, page_location?: string) {
    if (!this.isInitialized) return

    gtag('event', 'page_view', {
      page_title,
      page_location: page_location || window.location.href,
      page_referrer: document.referrer
    })
  }

  // Tracker un événement générique
  trackEvent({ action, category, label, value, custom_parameters }: AnalyticsEvent) {
    if (!this.isInitialized) return

    gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
      ...custom_parameters
    })
  }

  // === ÉVÉNEMENTS SPÉCIFIQUES CONTRACTFORGE ===

  // Tracker la sélection d'un template
  trackTemplateSelection(template: string, previous_template?: string) {
    this.trackEvent({
      action: 'template_selected',
      category: 'Contract Creation',
      label: template,
      custom_parameters: {
        template_type: template,
        previous_template: previous_template
      }
    })
  }

  // Tracker la sélection d'une premium feature
  trackPremiumFeatureToggle(feature_id: string, enabled: boolean, template: string) {
    this.trackEvent({
      action: enabled ? 'premium_feature_enabled' : 'premium_feature_disabled',
      category: 'Premium Features',
      label: feature_id,
      custom_parameters: {
        feature_id,
        template_type: template,
        feature_enabled: enabled
      }
    })
  }

  // Tracker la configuration d'une feature
  trackFeatureConfiguration(feature_id: string, template: string) {
    this.trackEvent({
      action: 'feature_configured',
      category: 'Premium Features',
      label: feature_id,
      custom_parameters: {
        feature_id,
        template_type: template
      }
    })
  }

  // Tracker un déploiement de contrat
  trackContractDeployment(deploymentData: DeploymentEvent) {
    this.trackEvent({
      action: deploymentData.success ? 'contract_deployed' : 'deployment_failed',
      category: 'Contract Deployment',
      label: `${deploymentData.template}_${deploymentData.network}`,
      value: deploymentData.premium_features_count,
      custom_parameters: {
        template_type: deploymentData.template,
        blockchain_network: deploymentData.network,
        premium_features: deploymentData.premium_features.join(','),
        premium_features_count: deploymentData.premium_features_count,
        total_cost: deploymentData.total_cost,
        deployment_success: deploymentData.success,
        error_message: deploymentData.error
      }
    })
  }

  // Tracker la connexion wallet
  trackWalletConnection(wallet_type: string, success: boolean, address?: string) {
    this.trackEvent({
      action: success ? 'wallet_connected' : 'wallet_connection_failed',
      category: 'Wallet Integration',
      label: wallet_type,
      custom_parameters: {
        wallet_type,
        connection_success: success,
        wallet_address: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : undefined
      }
    })
  }

  // Tracker le changement de réseau
  trackNetworkSwitch(from_network: string, to_network: string) {
    this.trackEvent({
      action: 'network_switched',
      category: 'Network Management',
      label: `${from_network}_to_${to_network}`,
      custom_parameters: {
        from_network,
        to_network
      }
    })
  }

  // Tracker l'estimation de gas
  trackGasEstimation(template: string, network: string, estimated_cost: string, premium_features_count: number) {
    this.trackEvent({
      action: 'gas_estimated',
      category: 'Cost Estimation',
      label: `${template}_${network}`,
      custom_parameters: {
        template_type: template,
        blockchain_network: network,
        estimated_cost,
        premium_features_count
      }
    })
  }

  // Tracker les erreurs
  trackError(error_type: string, error_message: string, context: string) {
    this.trackEvent({
      action: 'error_occurred',
      category: 'Errors',
      label: error_type,
      custom_parameters: {
        error_type,
        error_message: error_message.substring(0, 100), // Limiter la longueur
        error_context: context
      }
    })
  }

  // Tracker les conversions (premium feature usage)
  trackConversion(conversion_type: 'premium_feature_used' | 'contract_deployed' | 'subscription_started', value?: number) {
    gtag('event', 'conversion', {
      send_to: GA_MEASUREMENT_ID,
      value: value || 1,
      currency: 'USD',
      conversion_type
    })
  }

  // Tracker les performances
  trackPerformance(metric_name: string, value: number, unit: string) {
    this.trackEvent({
      action: 'performance_metric',
      category: 'Performance',
      label: metric_name,
      value: Math.round(value),
      custom_parameters: {
        metric_name,
        metric_value: value,
        metric_unit: unit
      }
    })
  }

  // Tracker l'engagement utilisateur
  trackEngagement(action: string, duration_seconds?: number) {
    this.trackEvent({
      action: 'user_engagement',
      category: 'Engagement',
      label: action,
      value: duration_seconds,
      custom_parameters: {
        engagement_action: action,
        duration_seconds
      }
    })
  }
}

// Instance singleton
export const analytics = new AnalyticsService()

// Hook personnalisé pour React
export const useAnalytics = () => {
  return {
    trackPageView: analytics.trackPageView.bind(analytics),
    trackEvent: analytics.trackEvent.bind(analytics),
    trackTemplateSelection: analytics.trackTemplateSelection.bind(analytics),
    trackPremiumFeatureToggle: analytics.trackPremiumFeatureToggle.bind(analytics),
    trackFeatureConfiguration: analytics.trackFeatureConfiguration.bind(analytics),
    trackContractDeployment: analytics.trackContractDeployment.bind(analytics),
    trackWalletConnection: analytics.trackWalletConnection.bind(analytics),
    trackNetworkSwitch: analytics.trackNetworkSwitch.bind(analytics),
    trackGasEstimation: analytics.trackGasEstimation.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    trackConversion: analytics.trackConversion.bind(analytics),
    trackPerformance: analytics.trackPerformance.bind(analytics),
    trackEngagement: analytics.trackEngagement.bind(analytics)
  }
}

export default analytics