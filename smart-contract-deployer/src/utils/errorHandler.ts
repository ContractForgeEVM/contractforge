/**
 * 🛠️ Gestionnaire d'erreurs global pour ContractForge.io
 * 
 * Ce module gère les erreurs communes liées aux extensions de navigateur
 * et autres problèmes de runtime.
 */

// Gestionnaire pour les erreurs d'extensions de navigateur
export const suppressBrowserExtensionErrors = () => {
  // Supprimer les erreurs de runtime des extensions
  const originalError = console.error
  console.error = (...args) => {
    const message = args[0]?.toString() || ''
    
    // Ignorer les erreurs communes d'extensions
    if (
      message.includes('Unchecked runtime.lastError') ||
      message.includes('Could not establish connection') ||
      message.includes('Receiving end does not exist') ||
      message.includes('Extension context invalidated') ||
      message.includes('chrome-extension://') ||
      message.includes('moz-extension://')
    ) {
      return // Ignorer silencieusement
    }
    
    // Afficher les autres erreurs normalement
    originalError.apply(console, args)
  }
}

// Gestionnaire pour les erreurs non capturées
export const setupGlobalErrorHandling = () => {
  // Erreurs JavaScript non capturées
  window.addEventListener('error', (event) => {
    const message = event.message || ''
    
    // Ignorer les erreurs d'extensions
    if (
      message.includes('Unchecked runtime.lastError') ||
      message.includes('Could not establish connection') ||
      event.filename?.includes('extension')
    ) {
      event.preventDefault()
      return false
    }
    
    // Laisser les autres erreurs se propager
    return true
  })

  // Promesses rejetées non capturées
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason?.toString() || ''
    
    // Ignorer les erreurs d'extensions
    if (
      reason.includes('Unchecked runtime.lastError') ||
      reason.includes('Could not establish connection')
    ) {
      event.preventDefault()
      return false
    }
    
    // Laisser les autres erreurs se propager
    return true
  })
}

// Initialisation automatique
export const initErrorHandling = () => {
  suppressBrowserExtensionErrors()
  setupGlobalErrorHandling()
  
  console.log('🛡️ Gestionnaire d\'erreurs ContractForge.io initialisé')
}