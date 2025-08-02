interface DeploymentNotificationData {
  wallet_address: string
  contractName: string
  contractAddress?: string
  transactionHash?: string
  chainId: number
  gasUsed?: string
  deploymentCost?: string
  success: boolean
  errorMessage?: string
  templateName?: string
}

class NotificationService {
  private baseUrl: string
  private apiKey: string | null = null

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3004'
    this.apiKey = localStorage.getItem('contractforge_api_key')
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}, walletAddress?: string) {
    try {
      // Pour les GET requests, ajouter wallet_address en query param
      let url = `${this.baseUrl}${endpoint}`
      if (walletAddress && (!options.method || options.method === 'GET')) {
        const separator = endpoint.includes('?') ? '&' : '?'
        url += `${separator}wallet_address=${encodeURIComponent(walletAddress)}`
      }

      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      })

      if (!response.ok) {
        console.error(`❌ Notification API error: ${response.status}`)
        const errorText = await response.text()
        console.error(`❌ Error details: ${errorText}`)
        return null
      }

      return await response.json()
    } catch (error) {
      console.error('❌ Notification service error:', error)
      return null
    }
  }

  // 🎉 Notifier un déploiement réussi
  async notifyDeploymentSuccess(data: {
    contractName: string
    contractAddress: string
    transactionHash: string
    chainId: number
    gasUsed?: string
    deploymentCost?: string
    templateName?: string
  }, walletAddress: string): Promise<boolean> {
    console.log('📤 Sending deployment success notification:', data)

    const notificationData: DeploymentNotificationData = {
      wallet_address: walletAddress,
      ...data,
      success: true
    }

    const result = await this.makeRequest('/api/deployment-events/notify', {
      method: 'POST',
      body: JSON.stringify(notificationData)
    })

    if (result?.success) {
      console.log('✅ Deployment success notification sent')
      return true
    } else {
      console.warn('⚠️ Failed to send deployment success notification')
      return false
    }
  }

  // ❌ Notifier un déploiement échoué
  async notifyDeploymentFailure(data: {
    contractName: string
    chainId: number
    errorMessage: string
    templateName?: string
    transactionHash?: string
  }, walletAddress: string): Promise<boolean> {
    console.log('📤 Sending deployment failure notification:', data)

    const notificationData: DeploymentNotificationData = {
      wallet_address: walletAddress,
      ...data,
      success: false
    }

    const result = await this.makeRequest('/api/deployment-events/notify', {
      method: 'POST',
      body: JSON.stringify(notificationData)
    })

    if (result?.success) {
      console.log('✅ Deployment failure notification sent')
      return true
    } else {
      console.warn('⚠️ Failed to send deployment failure notification')
      return false
    }
  }

  // 🏆 Notifier une étape importante
  async notifyMilestone(data: {
    milestone: string
    contractAddress: string
    transactionCount?: number
    description?: string
  }): Promise<boolean> {
    console.log('📤 Sending milestone notification:', data)

    const result = await this.makeRequest('/api/deployment-events/milestone', {
      method: 'POST',
      body: JSON.stringify(data)
    })

    if (result?.success) {
      console.log('✅ Milestone notification sent')
      return true
    } else {
      console.warn('⚠️ Failed to send milestone notification')
      return false
    }
  }

  // 🚨 Notifier une alerte de sécurité
  async notifySecurityAlert(data: {
    alertType: string
    contractAddress: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    description?: string
    recommendedAction?: string
  }): Promise<boolean> {
    console.log('📤 Sending security alert:', data)

    const result = await this.makeRequest('/api/deployment-events/security-alert', {
      method: 'POST',
      body: JSON.stringify(data)
    })

    if (result?.success) {
      console.log('✅ Security alert sent')
      return true
    } else {
      console.warn('⚠️ Failed to send security alert')
      return false
    }
  }

  // 📊 Notifier une alerte d'utilisation
  async notifyUsageAlert(data: {
    usageType: string
    currentUsage: number
    limit: number
    percentage?: number
  }): Promise<boolean> {
    console.log('📤 Sending usage alert:', data)

    const result = await this.makeRequest('/api/deployment-events/usage-alert', {
      method: 'POST',
      body: JSON.stringify(data)
    })

    if (result?.success) {
      console.log('✅ Usage alert sent')
      return true
    } else {
      console.warn('⚠️ Failed to send usage alert')
      return false
    }
  }

  // 🧪 Envoyer une notification de test
  async sendTestNotification(channelType: 'telegram' | 'discord' | 'email', walletAddress: string): Promise<boolean> {
    console.log(`📤 Sending test notification to ${channelType}`)

    const result = await this.makeRequest('/api/notifications/test', {
      method: 'POST',
      body: JSON.stringify({ wallet_address: walletAddress, channel_type: channelType })
    })

    if (result?.success) {
      console.log(`✅ Test notification sent to ${channelType}`)
      return true
    } else {
      console.warn(`⚠️ Failed to send test notification to ${channelType}`)
      return false
    }
  }

  // 📋 Récupérer les paramètres de notification
  async getNotificationSettings(walletAddress: string): Promise<any> {
    const result = await this.makeRequest('/api/notifications/settings', {}, walletAddress)
    return result
  }

  // ⚙️ Mettre à jour les paramètres
  async updateNotificationSettings(settings: any, walletAddress: string): Promise<boolean> {
    const result = await this.makeRequest('/api/notifications/settings', {
      method: 'PUT',
      body: JSON.stringify({ wallet_address: walletAddress, ...settings })
    })

    return result?.success || false
  }

  // 📱 Configurer un canal Telegram
  async configureTelegram(chatId: string, walletAddress: string): Promise<boolean> {
    const result = await this.makeRequest('/api/notifications/channels/telegram', {
      method: 'POST',
      body: JSON.stringify({ wallet_address: walletAddress, chat_id: chatId })
    })

    return result?.success || false
  }

  // 💬 Configurer un canal Discord
  async configureDiscord(userId: string, walletAddress: string): Promise<boolean> {
    const result = await this.makeRequest('/api/notifications/channels/discord', {
      method: 'POST',
      body: JSON.stringify({ wallet_address: walletAddress, user_id: userId })
    })

    return result?.success || false
  }

  // 📧 Configurer un canal Email
  async configureEmail(email: string, walletAddress: string): Promise<boolean> {
    const result = await this.makeRequest('/api/notifications/channels/email', {
      method: 'POST',
      body: JSON.stringify({ wallet_address: walletAddress, email })
    })

    return result?.success || false
  }

  // 🗑️ Supprimer un canal
  async removeChannel(channelType: string, walletAddress: string): Promise<boolean> {
    const result = await this.makeRequest(`/api/notifications/channels/${channelType}`, {
      method: 'DELETE',
      body: JSON.stringify({ wallet_address: walletAddress })
    })

    return result?.success || false
  }

  // 📊 Récupérer l'historique des notifications
  async getNotificationHistory(walletAddress: string, params: {
    limit?: number
    offset?: number
    channel_type?: string
    status?: string
  } = {}): Promise<any> {
    const queryParams = new URLSearchParams()
    queryParams.append('wallet_address', walletAddress)
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString())
      }
    })

    const result = await this.makeRequest(`/api/notifications/history?${queryParams}`)
    return result
  }

  // 🔄 Rafraîchir la clé API
  refreshApiKey(): void {
    this.apiKey = localStorage.getItem('contractforge_api_key')
  }

  // ✅ Vérifier si les notifications sont configurées
  hasApiKey(): boolean {
    return !!this.apiKey
  }
}

// Instance globale
export const notificationService = new NotificationService()

// Hook React pour les notifications
export const useNotifications = () => {
  const refreshApiKey = () => {
    notificationService.refreshApiKey()
  }

  const hasNotifications = () => {
    return notificationService.hasApiKey()
  }

  const notifyDeploymentSuccess = async (data: Parameters<typeof notificationService.notifyDeploymentSuccess>[0], walletAddress: string) => {
    return await notificationService.notifyDeploymentSuccess(data, walletAddress)
  }

  const notifyDeploymentFailure = async (data: Parameters<typeof notificationService.notifyDeploymentFailure>[0], walletAddress: string) => {
    return await notificationService.notifyDeploymentFailure(data, walletAddress)
  }

  return {
    refreshApiKey,
    hasNotifications,
    notifyDeploymentSuccess,
    notifyDeploymentFailure,
    notifyMilestone: notificationService.notifyMilestone.bind(notificationService),
    notifySecurityAlert: notificationService.notifySecurityAlert.bind(notificationService),
    notifyUsageAlert: notificationService.notifyUsageAlert.bind(notificationService),
    sendTestNotification: notificationService.sendTestNotification.bind(notificationService),
    getNotificationSettings: notificationService.getNotificationSettings.bind(notificationService),
    updateNotificationSettings: notificationService.updateNotificationSettings.bind(notificationService),
    configureTelegram: notificationService.configureTelegram.bind(notificationService),
    configureDiscord: notificationService.configureDiscord.bind(notificationService),
    configureEmail: notificationService.configureEmail.bind(notificationService),
    removeChannel: notificationService.removeChannel.bind(notificationService),
    getNotificationHistory: notificationService.getNotificationHistory.bind(notificationService)
  }
}