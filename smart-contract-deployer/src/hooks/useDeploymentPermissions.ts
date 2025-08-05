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

// 🎯 DEV LOCAL : Compte avec toutes les options
const DEV_PREMIUM_ADDRESS = '0xA3Cb5B568529b27e93AE726C7d8aEF18Cd551621'.toLowerCase()

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

      // 🌟 COMPTE DEV PREMIUM : Accès complet pour l'adresse spécifiée
      if (address.toLowerCase() === DEV_PREMIUM_ADDRESS) {
        console.log('🎯 Compte développeur détecté - Accès premium complet activé')
        setPermissions({
          canDeploy: true,
          platformFeeRate: 0.5, // Frais réduits au minimum
          plan: 'enterprise',
          subscriptionStatus: 'active',
          payAsYouGo: false,
          hasSubscriptionLimits: false, // Pas de limites
          reason: 'Developer account - Full premium access enabled'
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
            
            const plan = result.data.plan || 'free'
            const isFree = plan === 'free'
            
            setPermissions({
              canDeploy: isFree ? true : result.data.allowed, // Free plan = toujours autorisé
              platformFeeRate: isFree ? 2.0 : (result.data.platformFeeRate || 1.0), // Free = 2%, Payant = selon backend
              plan: plan,
              subscriptionStatus: isFree ? undefined : 'active',
              payAsYouGo: isFree, // Free = pay-as-you-go, Payant = subscription
              hasSubscriptionLimits: !isFree, // Free = pas de limites, Payant = limites
              reason: isFree ? 'Pay-as-you-go deployments available' : result.data.reason
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