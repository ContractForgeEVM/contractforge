/**
 * Configuration centralisée des comptes développeur côté backend
 */

// 🎯 DEV ACCOUNTS : Comptes avec accès premium complet
export const DEV_PREMIUM_ADDRESSES = [
  '0xA3Cb5B568529b27e93AE726C7d8aEF18Cd551621'.toLowerCase(),
  '0x101F3a2c8b91b4FC02fA8DB16a81459d3a64b8F1'.toLowerCase()
]

/**
 * Vérifie si une adresse est un compte développeur
 */
export const isDevAccount = (address?: string): boolean => {
  if (!address) return false
  const lowerAddress = address.toLowerCase()
  return DEV_PREMIUM_ADDRESSES.includes(lowerAddress)
}

/**
 * Configuration des permissions pour les comptes dev
 */
export const getDevAccountConfig = () => ({
  // Frais de plateforme réduits au minimum
  platformFeeRate: 0.5,
  cryptoPaymentFeeRate: 0.05,
  
  // Pas de limites de déploiement
  unlimitedDeployments: true,
  
  // Accès à toutes les fonctionnalités premium
  premiumFeatures: {
    analytics: true,
    custom_templates: true,
    priority_support: true,
    advanced_features: true,
    custom_domains: true
  },
  
  // Rate limits élevés
  rateLimit: {
    requestsPerMinute: 1000,
    requestsPerHour: 10000,
    requestsPerDay: 100000
  }
})

/**
 * Log de débogage pour la détection du compte dev
 */
export const logDevAccountDetection = (address: string, context: string) => {
  console.log(`🔍 [Backend ${context}] Vérification adresse:`, address.toLowerCase())
  console.log(`🔍 [Backend ${context}] Adresses DEV autorisées:`, DEV_PREMIUM_ADDRESSES)
  console.log(`🔍 [Backend ${context}] Match:`, isDevAccount(address))
  
  if (isDevAccount(address)) {
    console.log(`🎯 [Backend ${context}] Compte développeur détecté - Accès premium complet activé`)
  }
}