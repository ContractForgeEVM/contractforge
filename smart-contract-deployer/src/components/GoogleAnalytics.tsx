import { useEffect } from 'react'
import { analytics } from '../services/analytics'

interface GoogleAnalyticsProps {
  currentPage?: string
}

const GoogleAnalytics = ({ currentPage = 'deploy' }: GoogleAnalyticsProps) => {
  useEffect(() => {
    analytics.initialize()
  }, [])

  useEffect(() => {
    const pageTitle = getPageTitle(currentPage)
    analytics.trackPageView(
      `ContractForge - ${pageTitle}`,
      window.location.href
    )
  }, [currentPage])

  return null
}

const getPageTitle = (page: string): string => {
  switch (page) {
    case 'deploy':
      return 'Deploy'
    case 'documentation':
      return 'Documentation'
    case 'account':
      return 'Account'
    case 'analytics':
    case 'public-analytics':
      return 'Analytics'
    default:
      return 'Deploy'
  }
}

export default GoogleAnalytics 