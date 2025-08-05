import { Router, Request, Response } from 'express'
import { notificationService } from '../services/notifications'

const router = Router()

// 🔔 GET /api/notifications/settings - Récupérer les paramètres de notification
router.get('/settings', async (req: Request, res: Response) => {
  try {
    const userId = req.query.wallet_address as string
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'wallet_address parameter is required' 
      })
    }
    
    const { supabase } = await import('../config/supabase')
    
    // Récupérer les paramètres de notification
    const { data: settings, error: settingsError } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    // Si pas de paramètres, créer les paramètres par défaut
    if (settingsError && settingsError.code === 'PGRST116') {
      const { data: newSettings, error: createError } = await supabase
        .rpc('create_default_notification_settings', { wallet_address: userId })

      if (createError) {
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to create notification settings' 
        })
      }

      // Récupérer les nouveaux paramètres
      const { data: defaultSettings } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', userId)
        .single()

      return res.json({ success: true, settings: defaultSettings })
    }

    if (settingsError) {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch notification settings' 
      })
    }

    // Récupérer les canaux configurés
    const { data: channels, error: channelsError } = await supabase
      .from('notification_channels')
      .select('*')
      .eq('user_id', userId)

    if (channelsError) {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch notification channels' 
      })
    }

    res.json({ 
      success: true, 
      settings,
      channels: channels || []
    })

  } catch (error) {
    console.error('❌ Error fetching notification settings:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    })
  }
})

// 🔧 PUT /api/notifications/settings - Mettre à jour les paramètres
router.put('/settings', async (req: Request, res: Response) => {
  try {
    const { wallet_address, ...updates } = req.body
    
    if (!wallet_address) {
      return res.status(400).json({ 
        success: false, 
        error: 'wallet_address is required' 
      })
    }
    
    const userId = wallet_address

    // Valider les champs autorisés
    const allowedFields = [
      'telegram_enabled', 'discord_enabled', 'email_enabled',
      'deployment_success', 'deployment_failed', 'gas_optimization',
      'unusual_activity', 'milestone_reached', 'security_alerts',
      'subscription_expiry', 'usage_limits', 'billing_updates',
      'daily_digest', 'weekly_summary',
      'transaction_threshold', 'gas_threshold_multiplier'
    ]

    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key]
        return obj
      }, {} as any)

    if (Object.keys(filteredUpdates).length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No valid fields to update' 
      })
    }

    const { supabase } = await import('../config/supabase')

    const { data, error } = await supabase
      .from('notification_settings')
      .upsert({
        user_id: userId,
        ...filteredUpdates,
        updated_at: new Date().toISOString()
      })
      .select()

    if (error) {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to update settings' 
      })
    }

    res.json({ 
      success: true, 
      message: 'Notification settings updated',
      settings: data[0]
    })

  } catch (error) {
    console.error('❌ Error updating notification settings:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    })
  }
})

// 📱 POST /api/notifications/channels/telegram - Configurer Telegram
router.post('/channels/telegram', async (req: Request, res: Response) => {
  try {
    const { wallet_address, chat_id } = req.body
    
    if (!wallet_address) {
      return res.status(400).json({ 
        success: false, 
        error: 'wallet_address is required' 
      })
    }
    
    const userId = wallet_address

    if (!chat_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Telegram chat_id is required' 
      })
    }

    const success = await notificationService.setupTelegramChannel(userId, chat_id)

    if (success) {
      // Activer les notifications Telegram dans les paramètres
      const { supabase } = await import('../config/supabase')
      await supabase
        .from('notification_settings')
        .upsert({
          user_id: userId,
          telegram_enabled: true,
          updated_at: new Date().toISOString()
        })

      res.json({ 
        success: true, 
        message: 'Telegram notifications configured successfully' 
      })
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to configure Telegram channel' 
      })
    }

  } catch (error) {
    console.error('❌ Error configuring Telegram:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    })
  }
})

// 💬 POST /api/notifications/channels/discord - Configurer Discord
router.post('/channels/discord', async (req: Request, res: Response) => {
  try {
    const { wallet_address, user_id } = req.body
    
    if (!wallet_address) {
      return res.status(400).json({ 
        success: false, 
        error: 'wallet_address is required' 
      })
    }
    
    const userId = wallet_address

    if (!user_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Discord user_id is required' 
      })
    }

    const success = await notificationService.setupDiscordChannel(userId, user_id)

    if (success) {
      // Activer les notifications Discord dans les paramètres
      const { supabase } = await import('../config/supabase')
      await supabase
        .from('notification_settings')
        .upsert({
          user_id: userId,
          discord_enabled: true,
          updated_at: new Date().toISOString()
        })

      res.json({ 
        success: true, 
        message: 'Discord notifications configured successfully' 
      })
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to configure Discord channel' 
      })
    }

  } catch (error) {
    console.error('❌ Error configuring Discord:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    })
  }
})

// 📧 POST /api/notifications/channels/email - Configurer Email
router.post('/channels/email', async (req: Request, res: Response) => {
  try {
    const { wallet_address, email } = req.body
    
    if (!wallet_address) {
      return res.status(400).json({ 
        success: false, 
        error: 'wallet_address is required' 
      })
    }
    
    const userId = wallet_address

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email address is required' 
      })
    }

    // Valider le format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email format' 
      })
    }

    const result = await notificationService.setupEmailChannel(userId, email)

    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Verification email sent. Please check your inbox and click the verification link.',
        verification_required: true
      })
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to configure email channel' 
      })
    }

  } catch (error) {
    console.error('❌ Error configuring email:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    })
  }
})

// ✅ GET /api/notifications/verify-email - Vérifier l'email
router.get('/verify-email', async (req: Request, res: Response) => {
  try {
    const { token } = req.query

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'missing_token',
        message: 'Verification token is required' 
      })
    }

    const result = await notificationService.verifyEmail(token)

    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Email verified successfully. You can now receive email notifications.' 
      })
    } else {
      // Messages d'erreur plus spécifiques
      let message = 'Verification failed'
      let statusCode = 400
      
      switch (result.error) {
        case 'expired_token':
          message = 'This verification link has expired. Please request a new verification email.'
          break
        case 'invalid_token':
          message = 'Invalid verification link. Please request a new verification email.'
          break
        case 'database_error':
          message = 'Database error during verification. Please try again.'
          statusCode = 500
          break
        default:
          message = 'Internal server error. Please try again.'
          statusCode = 500
      }
      
      res.status(statusCode).json({ 
        success: false, 
        error: result.error,
        message: message
      })
    }

  } catch (error) {
    console.error('❌ Error verifying email:', error)
    res.status(500).json({ 
      success: false, 
      error: 'internal_error',
      message: 'Internal server error' 
    })
  }
})

// 🗑️ DELETE /api/notifications/channels/:type - Supprimer un canal
router.delete('/channels/:type', async (req: Request, res: Response) => {
  try {
    const { wallet_address } = req.body
    const { type } = req.params
    
    if (!wallet_address) {
      return res.status(400).json({ 
        success: false, 
        error: 'wallet_address is required in request body' 
      })
    }
    
    const userId = wallet_address

    if (!['telegram', 'discord', 'email'].includes(type)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid channel type' 
      })
    }

    const { supabase } = await import('../config/supabase')

    // Supprimer le canal
    const { error: deleteError } = await supabase
      .from('notification_channels')
      .delete()
      .eq('user_id', userId)
      .eq('channel_type', type)

    if (deleteError) {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to delete channel' 
      })
    }

    // Désactiver le canal dans les paramètres
    const updateField = `${type}_enabled`
    await supabase
      .from('notification_settings')
      .update({ 
        [updateField]: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    res.json({ 
      success: true, 
      message: `${type} notifications disabled and channel removed` 
    })

  } catch (error) {
    console.error('❌ Error deleting notification channel:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    })
  }
})

// 📊 GET /api/notifications/history - Historique des notifications
router.get('/history', async (req: Request, res: Response) => {
  try {
    const { wallet_address, limit = 50, offset = 0, channel_type, status } = req.query
    
    if (!wallet_address) {
      return res.status(400).json({ 
        success: false, 
        error: 'wallet_address parameter is required' 
      })
    }
    
    const userId = wallet_address as string

    const { supabase } = await import('../config/supabase')

    let query = supabase
      .from('notification_history')
      .select(`
        id,
        channel_type,
        template_key,
        title,
        status,
        sent_at,
        delivered_at,
        error_message,
        trigger_type,
        created_at
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1)

    if (channel_type) {
      query = query.eq('channel_type', channel_type)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error, count } = await query

    if (error) {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch notification history' 
      })
    }

    res.json({ 
      success: true, 
      notifications: data || [],
      total: count || 0,
      limit: Number(limit),
      offset: Number(offset)
    })

  } catch (error) {
    console.error('❌ Error fetching notification history:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    })
  }
})

// 🧪 POST /api/notifications/test - Envoyer une notification de test
router.post('/test', async (req: Request, res: Response) => {
  try {
    const { wallet_address, channel_type } = req.body
    
    if (!wallet_address) {
      return res.status(400).json({ 
        success: false, 
        error: 'wallet_address is required' 
      })
    }
    
    const userId = wallet_address

    if (!channel_type || !['telegram', 'discord', 'email'].includes(channel_type)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid channel_type is required (telegram, discord, email)' 
      })
    }

    // Envoyer une notification de test
    await notificationService.sendDeploymentNotification(userId, 'success', {
      contractName: 'TestContract',
      contractAddress: '0x742d35Cc6567C05E...', 
      networkName: 'Ethereum Mainnet',
      deploymentCost: '0.001',
      gasUsed: '52,341',
      explorerLink: 'https://etherscan.io/tx/0x...',
      timestamp: new Date().toISOString()
    })

    res.json({ 
      success: true, 
      message: `Test notification sent via ${channel_type}` 
    })

  } catch (error) {
    console.error('❌ Error sending test notification:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    })
  }
})

export default router