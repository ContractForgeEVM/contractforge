/**
 * Utilitaire centralisé pour la gestion du compte développeur
 */

// 🎯 DEV LOCAL : Comptes avec toutes les options
export const DEV_PREMIUM_ADDRESSES = [
  '0xA3Cb5B568529b27e93AE726C7d8aEF18Cd551621'.toLowerCase(),
  '0x101F3a2c8b91b4FC02fA8DB16a81459d3a64b8F1'.toLowerCase()
]

// Maintien de la compatibilité avec l'ancienne variable
export const DEV_PREMIUM_ADDRESS = DEV_PREMIUM_ADDRESSES[0]

/**
 * Vérifie si une adresse est un compte développeur
 */
export const isDevAccount = (address?: string): boolean => {
  if (!address) return false
  const lowerAddress = address.toLowerCase()
  return DEV_PREMIUM_ADDRESSES.includes(lowerAddress)
}

/**
 * Obtient le tier d'abonnement pour le compte dev
 */
export const getDevSubscriptionTier = (): 'enterprise' => {
  return 'enterprise'
}

/**
 * Obtient les permissions de déploiement pour le compte dev
 */
export const getDevDeploymentPermissions = () => ({
  canDeploy: true,
  platformFeeRate: 0.5, // Frais réduits au minimum
  plan: 'enterprise' as const,
  subscriptionStatus: 'active' as const,
  payAsYouGo: false,
  hasSubscriptionLimits: false, // Pas de limites
  reason: 'Developer account - Full premium access enabled'
})

/**
 * Log de débogage pour la détection du compte dev
 */
export const logDevAccountDetection = (address: string, context: string) => {
  console.log(`🔍 [${context}] Vérification adresse:`, address.toLowerCase())
  console.log(`🔍 [${context}] Adresses DEV autorisées:`, DEV_PREMIUM_ADDRESSES)
  console.log(`🔍 [${context}] Match:`, isDevAccount(address))
  
  if (isDevAccount(address)) {
    console.log(`🎯 [${context}] Compte développeur détecté - Accès premium complet activé`)
  }
}