import { Router, Request, Response } from 'express'
import { notificationService } from '../services/notifications'

const router = Router()

interface DeploymentEventData {
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

// 📤 POST /api/deployment-events/notify - Notifier un résultat de déploiement
router.post('/notify', async (req: Request, res: Response) => {
  try {
    const eventData: DeploymentEventData = req.body
    
    if (!eventData.wallet_address) {
      return res.status(400).json({
        success: false,
        error: 'wallet_address is required'
      })
    }
    
    const userId = eventData.wallet_address

    // Validation des données requises
    if (!eventData.contractName || typeof eventData.success !== 'boolean' || !eventData.chainId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: contractName, success, chainId'
      })
    }

    // Mapping des chainId vers les noms de réseau
    const networkNames: Record<number, { name: string; explorer: string }> = {
      1: { name: 'Ethereum Mainnet', explorer: 'https://etherscan.io' },
      137: { name: 'Polygon', explorer: 'https://polygonscan.com' },
      42161: { name: 'Arbitrum', explorer: 'https://arbiscan.io' },
      10: { name: 'Optimism', explorer: 'https://optimistic.etherscan.io' },
      56: { name: 'BSC', explorer: 'https://bscscan.com' },
      43114: { name: 'Avalanche', explorer: 'https://snowtrace.io' },
      8453: { name: 'Base', explorer: 'https://basescan.org' },
      11155111: { name: 'Sepolia', explorer: 'https://sepolia.etherscan.io' },
      80001: { name: 'Mumbai', explorer: 'https://mumbai.polygonscan.com' }
    }

    const network = networkNames[eventData.chainId]
    if (!network) {
      return res.status(400).json({
        success: false,
        error: `Unsupported chainId: ${eventData.chainId}`
      })
    }

    // Construire l'URL de l'explorateur
    let explorerLink = ''
    if (eventData.success && eventData.contractAddress) {
      explorerLink = `${network.explorer}/address/${eventData.contractAddress}`
    } else if (eventData.transactionHash) {
      explorerLink = `${network.explorer}/tx/${eventData.transactionHash}`
    }

    // Préparer les données de notification
    const notificationData = {
      contractName: eventData.contractName,
      contractAddress: eventData.contractAddress || '',
      networkName: network.name,
      deploymentCost: eventData.deploymentCost || 'Unknown',
      gasUsed: eventData.gasUsed || 'Unknown',
      explorerLink: explorerLink,
      errorMessage: eventData.errorMessage || '',
      timestamp: new Date().toISOString(),
      templateName: eventData.templateName || eventData.contractName
    }

    // Envoyer la notification appropriée
    if (eventData.success) {
      console.log(`✅ Notifying successful deployment for user ${userId}`)
      await notificationService.sendDeploymentNotification(userId, 'success', notificationData)
      
      // Enregistrer l'événement dans l'analytics si disponible
      try {
        const { supabase } = await import('../config/supabase')
        await supabase
          .from('deployments')
          .insert({
            user_id: userId,
            session_id: `${userId}-${Date.now()}`,
            template: eventData.templateName || eventData.contractName,
            chain: network.name,
            success: true,
            contract_address: eventData.contractAddress,
            transaction_hash: eventData.transactionHash,
            value: eventData.deploymentCost,
            gas_used: eventData.gasUsed,
            timestamp: new Date().toISOString()
          })
      } catch (analyticsError) {
        console.warn('⚠️ Failed to record deployment analytics:', analyticsError)
      }
    } else {
      console.log(`❌ Notifying failed deployment for user ${userId}`)
      await notificationService.sendDeploymentNotification(userId, 'failed', notificationData)
      
      // Enregistrer l'échec dans l'analytics
      try {
        const { supabase } = await import('../config/supabase')
        await supabase
          .from('deployments')
          .insert({
            user_id: userId,
            session_id: `${userId}-${Date.now()}`,
            template: eventData.templateName || eventData.contractName,
            chain: network.name,
            success: false,
            error_message: eventData.errorMessage,
            timestamp: new Date().toISOString()
          })
      } catch (analyticsError) {
        console.warn('⚠️ Failed to record deployment analytics:', analyticsError)
      }
    }

    res.json({
      success: true,
      message: `${eventData.success ? 'Success' : 'Failure'} notification sent`,
      notificationData: {
        networkName: network.name,
        notificationSent: true
      }
    })

  } catch (error) {
    console.error('❌ Error processing deployment event:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to process deployment event'
    })
  }
})

// 📊 POST /api/deployment-events/milestone - Notifier une étape importante
router.post('/milestone', async (req: Request, res: Response) => {
  try {
    const { wallet_address, milestone, contractAddress, transactionCount, description } = req.body
    
    if (!wallet_address) {
      return res.status(400).json({
        success: false,
        error: 'wallet_address is required'
      })
    }
    
    const userId = wallet_address

    if (!milestone || !contractAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: milestone, contractAddress'
      })
    }

    // Préparer les données de notification pour l'étape importante
    const notificationData = {
      milestone: milestone,
      contractAddress: contractAddress,
      transactionCount: transactionCount || 'Unknown',
      description: description || `Milestone reached: ${milestone}`,
      timestamp: new Date().toISOString()
    }

    await notificationService.sendMonitoringAlert(userId, 'milestone_reached', notificationData)

    res.json({
      success: true,
      message: 'Milestone notification sent'
    })

  } catch (error) {
    console.error('❌ Error processing milestone event:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to process milestone event'
    })
  }
})

// 🚨 POST /api/deployment-events/security-alert - Notifier une alerte de sécurité
router.post('/security-alert', async (req: Request, res: Response) => {
  try {
    const { wallet_address, alertType, contractAddress, severity, description, recommendedAction } = req.body
    
    if (!wallet_address) {
      return res.status(400).json({
        success: false,
        error: 'wallet_address is required'
      })
    }
    
    const userId = wallet_address

    if (!alertType || !contractAddress || !severity) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: alertType, contractAddress, severity'
      })
    }

    const notificationData = {
      alertType: alertType,
      contractAddress: contractAddress,
      severity: severity,
      description: description || `Security alert: ${alertType}`,
      recommendedAction: recommendedAction || 'Please review your contract immediately',
      timestamp: new Date().toISOString()
    }

    await notificationService.sendMonitoringAlert(userId, 'security_alerts', notificationData)

    res.json({
      success: true,
      message: 'Security alert notification sent'
    })

  } catch (error) {
    console.error('❌ Error processing security alert:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to process security alert'
    })
  }
})

// 📈 POST /api/deployment-events/usage-alert - Notifier les limites d'utilisation
router.post('/usage-alert', async (req: Request, res: Response) => {
  try {
    const { wallet_address, usageType, currentUsage, limit, percentage } = req.body
    
    if (!wallet_address) {
      return res.status(400).json({
        success: false,
        error: 'wallet_address is required'
      })
    }
    
    const userId = wallet_address

    if (!usageType || currentUsage === undefined || !limit) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: usageType, currentUsage, limit'
      })
    }

    const notificationData = {
      usageType: usageType,
      currentUsage: currentUsage,
      limit: limit,
      percentage: percentage || Math.round((currentUsage / limit) * 100),
      timestamp: new Date().toISOString()
    }

    await notificationService.sendSubscriptionNotification(userId, 'usage_limits', notificationData)

    res.json({
      success: true,
      message: 'Usage alert notification sent'
    })

  } catch (error) {
    console.error('❌ Error processing usage alert:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to process usage alert'
    })
  }
})

export default router