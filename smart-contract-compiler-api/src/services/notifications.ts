import { createClient } from '@supabase/supabase-js'
import * as nodemailer from 'nodemailer'

// Types pour les notifications
export interface NotificationChannel {
  id: string
  user_id: string
  channel_type: 'telegram' | 'discord' | 'email'
  channel_id: string
  is_verified: boolean
  is_active: boolean
}

export interface NotificationSettings {
  user_id: string
  telegram_enabled: boolean
  discord_enabled: boolean
  email_enabled: boolean
  deployment_success: boolean
  deployment_failed: boolean
  gas_optimization: boolean
  unusual_activity: boolean
  milestone_reached: boolean
  security_alerts: boolean
  subscription_expiry: boolean
  usage_limits: boolean
  billing_updates: boolean
  daily_digest: boolean
  weekly_summary: boolean
}

export interface NotificationData {
  contractName?: string
  contractAddress?: string
  networkName?: string
  deploymentCost?: string
  gasUsed?: string
  explorerLink?: string
  errorMessage?: string
  timestamp?: string
  [key: string]: any
}

export interface NotificationTemplate {
  template_key: string
  channel_type: string
  title: string
  message: string
  is_html: boolean
  available_variables: string[]
}

class NotificationService {
  private supabase
  private telegramToken: string
  private discordWebhookUrl: string
  private emailTransporter: nodemailer.Transporter

  constructor() {
    // Configuration Supabase
    this.supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    // Configuration Telegram Bot
    this.telegramToken = process.env.TELEGRAM_BOT_TOKEN || ''

    // Configuration Discord
    this.discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL || ''

    // Configuration Email
    this.emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })
  }

  // 🔔 Envoyer une notification de déploiement
  async sendDeploymentNotification(
    userId: string, 
    type: 'success' | 'failed', 
    data: NotificationData
  ): Promise<void> {
    try {
      console.log(`📤 Sending ${type} notification for user: ${userId}`)

      // Récupérer les paramètres de notification de l'utilisateur
      const settings = await this.getUserNotificationSettings(userId)
      if (!settings) {
        console.log('⚠️ No notification settings found for user')
        return
      }

      // Vérifier si ce type de notification est activé
      const notificationEnabled = type === 'success' 
        ? settings.deployment_success 
        : settings.deployment_failed

      if (!notificationEnabled) {
        console.log(`ℹ️ ${type} notifications disabled for user`)
        return
      }

      // Récupérer les canaux actifs de l'utilisateur
      const channels = await this.getUserActiveChannels(userId)

      // Envoyer sur chaque canal configuré
      for (const channel of channels) {
        if (this.isChannelEnabled(channel.channel_type, settings)) {
          await this.sendToChannel(channel, `deployment_${type}`, data)
        }
      }

    } catch (error) {
      console.error('❌ Error sending deployment notification:', error)
    }
  }

  // 🔔 Envoyer notification de monitoring
  async sendMonitoringAlert(
    userId: string, 
    alertType: 'unusual_activity' | 'milestone_reached' | 'security_alerts',
    data: NotificationData
  ): Promise<void> {
    try {
      const settings = await this.getUserNotificationSettings(userId)
      if (!settings || !settings[alertType]) return

      const channels = await this.getUserActiveChannels(userId)
      
      for (const channel of channels) {
        if (this.isChannelEnabled(channel.channel_type, settings)) {
          await this.sendToChannel(channel, `monitoring_${alertType}`, data)
        }
      }
    } catch (error) {
      console.error('❌ Error sending monitoring alert:', error)
    }
  }

  // 🔔 Envoyer notification d'abonnement
  async sendSubscriptionNotification(
    userId: string,
    notificationType: 'subscription_expiry' | 'usage_limits' | 'billing_updates',
    data: NotificationData
  ): Promise<void> {
    try {
      const settings = await this.getUserNotificationSettings(userId)
      if (!settings || !settings[notificationType]) return

      const channels = await this.getUserActiveChannels(userId)
      
      for (const channel of channels) {
        if (this.isChannelEnabled(channel.channel_type, settings)) {
          await this.sendToChannel(channel, `billing_${notificationType}`, data)
        }
      }
    } catch (error) {
      console.error('❌ Error sending subscription notification:', error)
    }
  }

  // 📨 Envoyer sur un canal spécifique
  private async sendToChannel(
    channel: NotificationChannel, 
    templateKey: string, 
    data: NotificationData
  ): Promise<void> {
    try {
      // Récupérer le template
      const template = await this.getTemplate(templateKey, channel.channel_type)
      if (!template) {
        console.error(`❌ Template not found: ${templateKey}_${channel.channel_type}`)
        return
      }

      // Remplacer les variables dans le message
      const processedMessage = this.processTemplate(template.message, data)
      const processedTitle = template.title ? this.processTemplate(template.title, data) : ''

      // Envoyer selon le type de canal
      let success = false
      let externalId = ''
      let errorMessage = ''

      switch (channel.channel_type) {
        case 'telegram':
          const telegramResult = await this.sendTelegram(channel.channel_id, processedMessage)
          success = telegramResult.success
          externalId = telegramResult.messageId
          errorMessage = telegramResult.error
          break

        case 'discord':
          const discordResult = await this.sendDiscord(channel.channel_id, processedTitle, processedMessage)
          success = discordResult.success
          errorMessage = discordResult.error
          break

        case 'email':
          const emailResult = await this.sendEmail(channel.channel_id, processedTitle, processedMessage, template.is_html)
          success = emailResult.success
          errorMessage = emailResult.error
          break
      }

      // Enregistrer dans l'historique
      await this.logNotification(
        channel.user_id,
        channel.channel_type,
        templateKey,
        processedTitle,
        processedMessage,
        success ? 'sent' : 'failed',
        data,
        externalId,
        errorMessage
      )

    } catch (error) {
      console.error(`❌ Error sending to ${channel.channel_type}:`, error)
    }
  }

  // 📱 Envoyer message Telegram
  private async sendTelegram(chatId: string, message: string): Promise<{success: boolean, messageId: string, error: string}> {
    try {
      if (!this.telegramToken) {
        return { success: false, messageId: '', error: 'Telegram bot token not configured' }
      }

      const response = await fetch(`https://api.telegram.org/bot${this.telegramToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown',
          disable_web_page_preview: false
        })
      })

      const result = await response.json() as any
      
      if (result.ok) {
        return { success: true, messageId: result.result.message_id.toString(), error: '' }
      } else {
        return { success: false, messageId: '', error: result.description || 'Unknown Telegram error' }
      }
    } catch (error) {
      return { success: false, messageId: '', error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // 💬 Envoyer message Discord
  private async sendDiscord(userId: string, title: string, message: string): Promise<{success: boolean, error: string}> {
    try {
      if (!this.discordWebhookUrl) {
        return { success: false, error: 'Discord webhook not configured' }
      }

      // Si le message est au format JSON (embed), l'utiliser directement
      let payload
      try {
        payload = JSON.parse(message)
      } catch {
        // Sinon, créer un embed simple
        payload = {
          embeds: [{
            title: title,
            description: message,
            color: 0x007bff,
            footer: { text: 'ContractForge.io' },
            timestamp: new Date().toISOString()
          }]
        }
      }

      const response = await fetch(this.discordWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        return { success: true, error: '' }
      } else {
        return { success: false, error: `Discord API error: ${response.status}` }
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // 📧 Envoyer email
  private async sendEmail(email: string, subject: string, content: string, isHtml: boolean): Promise<{success: boolean, error: string}> {
    try {
      await this.emailTransporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@contractforge.io',
        to: email,
        subject: subject,
        [isHtml ? 'html' : 'text']: content
      })

      return { success: true, error: '' }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // 📋 Utilitaires pour récupérer les données utilisateur
  private async getUserNotificationSettings(userId: string): Promise<NotificationSettings | null> {
    const { data, error } = await this.supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !data) return null
    return data as NotificationSettings
  }

  private async getUserActiveChannels(userId: string): Promise<NotificationChannel[]> {
    const { data, error } = await this.supabase
      .from('notification_channels')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .eq('is_verified', true)

    if (error || !data) return []
    return data as NotificationChannel[]
  }

  private async getTemplate(templateKey: string, channelType: string): Promise<NotificationTemplate | null> {
    try {
      // D'abord essayer avec le templateKey exact
      let { data, error } = await this.supabase
        .from('notification_templates')
        .select('*')
        .eq('template_key', templateKey)
        .eq('channel_type', channelType)
        .single()

      // Si pas trouvé, essayer avec le format legacy template_key_channel
      if (error || !data) {
        const result = await this.supabase
          .from('notification_templates')
          .select('*')
          .eq('template_key', `${templateKey}_${channelType}`)
          .eq('channel_type', channelType)
          .single()
        
        data = result.data
        error = result.error
      }

      if (error || !data) {
        console.error(`❌ Template not found: ${templateKey} for ${channelType}`)
        return null
      }
      
      return data as NotificationTemplate
    } catch (err) {
      console.error(`❌ Error fetching template ${templateKey}:`, err)
      return null
    }
  }

  // 🔄 Traitement des templates
  private processTemplate(template: string, data: NotificationData): string {
    let processed = template
    
    // Remplacer toutes les variables {{variableName}}
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      let value = data[key]
      
      // Formatage spécial pour certaines variables
      if (key === 'deploymentCost' && value && value !== 'Unknown') {
        value = parseFloat(value as string).toFixed(6)
      }
      if (key === 'gasUsed' && value) {
        value = parseInt(value as string).toLocaleString()
      }
      if (key === 'contractAddress' && value && (value as string).length > 10) {
        // Garder l'adresse complète pour les liens, mais elle peut être tronquée dans l'affichage
      }
      
      processed = processed.replace(regex, String(value || 'N/A'))
    })

    // Nettoyer les variables non remplacées
    processed = processed.replace(/{{[^}]+}}/g, 'N/A')

    return processed
  }

  // ✅ Vérifier si un canal est activé
  private isChannelEnabled(channelType: string, settings: NotificationSettings): boolean {
    switch (channelType) {
      case 'telegram': return settings.telegram_enabled
      case 'discord': return settings.discord_enabled
      case 'email': return settings.email_enabled
      default: return false
    }
  }

  // 📝 Enregistrer la notification dans l'historique
  private async logNotification(
    userId: string,
    channelType: string,
    templateKey: string,
    title: string,
    message: string,
    status: 'sent' | 'failed',
    triggerData: NotificationData,
    externalId: string = '',
    errorMessage: string = ''
  ): Promise<void> {
    try {
      await this.supabase
        .from('notification_history')
        .insert({
          user_id: userId,
          channel_type: channelType,
          template_key: templateKey,
          title: title,
          message: message,
          trigger_type: templateKey,
          trigger_data: triggerData,
          status: status,
          sent_at: status === 'sent' ? new Date().toISOString() : null,
          error_message: errorMessage,
          external_id: externalId
        })
    } catch (error) {
      console.error('❌ Error logging notification:', error)
    }
  }

  // 🔧 Méthodes de configuration utilisateur
  async setupTelegramChannel(userId: string, telegramChatId: string): Promise<boolean> {
    try {
      // Insérer ou mettre à jour le canal Telegram
      const { error } = await this.supabase
        .from('notification_channels')
        .upsert({
          user_id: userId,
          channel_type: 'telegram',
          channel_id: telegramChatId,
          is_verified: true, // Pour Telegram, on considère immédiatement vérifié
          is_active: true
        })

      return !error
    } catch (error) {
      console.error('❌ Error setting up Telegram channel:', error)
      return false
    }
  }

  async setupDiscordChannel(userId: string, discordUserId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('notification_channels')
        .upsert({
          user_id: userId,
          channel_type: 'discord',
          channel_id: discordUserId,
          is_verified: true,
          is_active: true
        })

      return !error
    } catch (error) {
      console.error('❌ Error setting up Discord channel:', error)
      return false
    }
  }

  async setupEmailChannel(userId: string, email: string): Promise<{success: boolean, verificationToken?: string}> {
    try {
      const verificationToken = Math.random().toString(36).substring(2, 15)
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h

      // D'abord essayer de mettre à jour le canal existant
      const { data: updateData, error: updateError } = await this.supabase
        .from('notification_channels')
        .update({
          channel_id: email,
          is_verified: false,
          is_active: true,
          verification_token: verificationToken,
          verification_expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('channel_type', 'email')
        .select()

      // Si aucune ligne mise à jour, insérer un nouveau canal
      if (!updateError && (!updateData || updateData.length === 0)) {
        const { error: insertError } = await this.supabase
          .from('notification_channels')
          .insert({
            user_id: userId,
            channel_type: 'email',
            channel_id: email,
            is_verified: false,
            is_active: true,
            verification_token: verificationToken,
            verification_expires_at: expiresAt.toISOString()
          })

        if (insertError) {
          console.error('❌ Error inserting email channel:', insertError)
          return { success: false }
        }
      } else if (updateError) {
        console.error('❌ Error updating email channel:', updateError)
        return { success: false }
      }

      // Envoyer email de vérification
      await this.sendVerificationEmail(email, verificationToken)

      return { success: true, verificationToken }
    } catch (error) {
      console.error('❌ Error setting up email channel:', error)
      return { success: false }
    }
  }

  private async sendVerificationEmail(email: string, token: string): Promise<void> {
    try {
      // Construire le lien de vérification sécurisé
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
      const verificationLink = `${baseUrl}/verify-email?token=${token}`
      
      // Récupérer le template de vérification
      const template = await this.getTemplate('email_verification', 'email')
      if (!template) {
        console.error('❌ Email verification template not found')
        return
      }

      // Traiter le template avec les données
      const processedMessage = this.processTemplate(template.message, {
        verificationLink: verificationLink
      })
      const processedTitle = template.title ? this.processTemplate(template.title, {}) : '✅ Verify Your Email - ContractForge.io'

      // Envoyer l'email de vérification
      await this.emailTransporter.sendMail({
        from: process.env.SMTP_FROM || 'contact@contractforge.io',
        to: email,
        subject: processedTitle,
        html: processedMessage
      })

      console.log(`📧 Verification email sent to ${email}`)
    } catch (error) {
      console.error('❌ Error sending verification email:', error)
    }
  }

  async verifyEmail(token: string): Promise<{ success: boolean, error?: string }> {
    try {
      // D'abord vérifier si le token existe
      const { data: tokenData, error: tokenError } = await this.supabase
        .from('notification_channels')
        .select('verification_expires_at, is_verified, channel_id')
        .eq('verification_token', token)
        .eq('channel_type', 'email')
        .single()

      if (tokenError || !tokenData) {
        return { success: false, error: 'invalid_token' }
      }

      // Vérifier si déjà vérifié
      if (tokenData.is_verified) {
        return { success: true }
      }

      // Vérifier l'expiration
      const expiresAt = new Date(tokenData.verification_expires_at)
      const now = new Date()
      
      if (expiresAt <= now) {
        return { success: false, error: 'expired_token' }
      }

      // Token valide, effectuer la vérification
      const { data, error } = await this.supabase
        .from('notification_channels')
        .update({ is_verified: true, verification_token: null, verification_expires_at: null })
        .eq('verification_token', token)
        .eq('channel_type', 'email')

      if (error) {
        console.error('❌ Email verification error:', error)
        return { success: false, error: 'database_error' }
      }

      console.log(`✅ Email verified successfully: ${tokenData.channel_id}`)
      return { success: true }
    } catch (error) {
      console.error('❌ Error verifying email:', error)
      return { success: false, error: 'internal_error' }
    }
  }
}

export const notificationService = new NotificationService()