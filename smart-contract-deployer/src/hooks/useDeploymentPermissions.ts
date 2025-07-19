import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
interface DeploymentPermissions {
  canDeploy: boolean
  platformFeeRate: number
  plan: string
  subscriptionStatus?: string
  reason?: string
  payAsYouGo: boolean 
  hasSubscriptionLimits: boolean 
}
interface DeploymentPermissionsResult {
  permissions: DeploymentPermissions | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}
export const useDeploymentPermissions = (): DeploymentPermissionsResult => {
  const [permissions, setPermissions] = useState<DeploymentPermissions | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { address, isConnected } = useAccount()
  const fetchPermissions = async () => {
    try {
      setLoading(true)
      setError(null)
      if (!isConnected || !address) {
        setPermissions({
          canDeploy: false,
          platformFeeRate: 2.0,
          plan: 'free',
          reason: 'Please connect your wallet to deploy contracts',
          payAsYouGo: true,
          hasSubscriptionLimits: false
        })
        return
      }
              // 🔗 Vérifier si le backend de subscription est disponible
      const backendUrl = import.meta.env.VITE_API_URL || 'https://contractforge.io'
      
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 2000) // 2s timeout
        
        const response = await fetch(`${backendUrl}/api/subscription/deployment-permission/${address}`, {
          headers: {
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            console.log('✅ Permissions récupérées depuis le backend')
            // Utiliser les vraies données de l'API
            setPermissions({
              canDeploy: result.data.allowed,
              platformFeeRate: result.data.platformFeeRate || 1.0,
              plan: result.data.plan || 'free',
              subscriptionStatus: 'active',
              payAsYouGo: false,
              hasSubscriptionLimits: true,
              reason: result.data.reason
            })
            return
          }
        }
      } catch (error) {
        console.warn('🔄 Backend subscription non disponible (normal avec compiler-api), utilisation du mode simulé')
      }

      // 🔧 FALLBACK : Mode par défaut sans backend
      // Tous les utilisateurs sont en mode free par défaut
      const defaultPermissions: DeploymentPermissions = {
        canDeploy: true,
        platformFeeRate: 2.0, // Plan free : 2% de frais
        plan: 'free',
        payAsYouGo: true,
        hasSubscriptionLimits: false,
        reason: 'Pay-as-you-go deployments available'
      }
      
      setPermissions(defaultPermissions)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch deployment permissions')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    fetchPermissions()
  }, [address, isConnected])
  return {
    permissions,
    loading,
    error,
    refetch: fetchPermissions
  }
}
export default useDeploymentPermissions