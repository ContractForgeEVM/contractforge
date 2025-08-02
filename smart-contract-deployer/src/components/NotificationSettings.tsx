import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  TextField,
  Alert,
  Divider,
  Chip,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  LinearProgress,
  Tooltip,
  InputAdornment
} from '@mui/material'
import {
  Notifications,
  Telegram,
  Email,
  Delete,
  ExpandMore,
  PlayArrow,
  CheckCircle,
  Error,
  Warning,
  Info,
  Security,
  TrendingUp,
  AccountBalance,
  Settings,
  Send,
  Verified
} from '@mui/icons-material'
import { useAccount } from 'wagmi'
import { useTranslation } from 'react-i18next'
import { contractToast } from './notifications/ToastSystem'

interface NotificationChannel {
  id: string
  channel_type: 'telegram' | 'discord' | 'email'
  channel_id: string
  is_verified: boolean
  is_active: boolean
}

interface NotificationSettings {
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
  transaction_threshold: number
  gas_threshold_multiplier: number
}

const NotificationSettings: React.FC = () => {
  const { address } = useAccount()
  const { t } = useTranslation()

  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [channels, setChannels] = useState<NotificationChannel[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testingChannel, setTestingChannel] = useState<string | null>(null)

  // États pour les modales de configuration
  const [telegramDialogOpen, setTelegramDialogOpen] = useState(false)
  const [discordDialogOpen, setDiscordDialogOpen] = useState(false)
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)

  // États pour les champs de configuration
  const [telegramChatId, setTelegramChatId] = useState('')
  const [discordUserId, setDiscordUserId] = useState('')
  const [emailAddress, setEmailAddress] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (address) {
      fetchNotificationSettings()
    }
  }, [address])

  const fetchNotificationSettings = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!address) {
        setError('Please connect your wallet first')
        return
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/settings?wallet_address=${encodeURIComponent(address)}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setSettings(data.settings)
        setChannels(data.channels || [])
      } else {
        setError(data.error || 'Failed to fetch notification settings')
      }

    } catch (err) {
      console.error('Error fetching notification settings:', err)
      setError('Failed to load notification settings')
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = async (updates: Partial<NotificationSettings>) => {
    try {
      setSaving(true)
      setError(null)

      if (!address) {
        setError('Please connect your wallet first')
        return
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ wallet_address: address, ...updates })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setSettings(data.settings)
        setSuccess('Settings updated successfully!')
        contractToast.success('Notification settings updated')
      } else {
        setError(data.error || 'Failed to update settings')
      }

    } catch (err) {
      console.error('Error updating settings:', err)
      setError('Failed to update settings')
    } finally {
      setSaving(false)
    }
  }

  const setupTelegramChannel = async () => {
    try {
      setSaving(true)
      setError(null)

      if (!address) {
        setError('Please connect your wallet first')
        return
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/channels/telegram`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ wallet_address: address, chat_id: telegramChatId })
      })

      const data = await response.json()
      
      if (data.success) {
        setSuccess('Telegram notifications configured!')
        contractToast.success('Telegram configured successfully')
        setTelegramDialogOpen(false)
        setTelegramChatId('')
        fetchNotificationSettings() // Refresh
      } else {
        setError(data.error || 'Failed to configure Telegram')
      }

    } catch (err) {
      console.error('Error configuring Telegram:', err)
      setError('Failed to configure Telegram')
    } finally {
      setSaving(false)
    }
  }

  const setupDiscordChannel = async () => {
    try {
      setSaving(true)
      setError(null)

      if (!address) {
        setError('Please connect your wallet first')
        return
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/channels/discord`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ wallet_address: address, user_id: discordUserId })
      })

      const data = await response.json()
      
      if (data.success) {
        setSuccess('Discord notifications configured!')
        contractToast.success('Discord configured successfully')
        setDiscordDialogOpen(false)
        setDiscordUserId('')
        fetchNotificationSettings()
      } else {
        setError(data.error || 'Failed to configure Discord')
      }

    } catch (err) {
      console.error('Error configuring Discord:', err)
      setError('Failed to configure Discord')
    } finally {
      setSaving(false)
    }
  }

  const setupEmailChannel = async () => {
    try {
      setSaving(true)
      setError(null)

      if (!address) {
        setError('Please connect your wallet first')
        return
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/channels/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ wallet_address: address, email: emailAddress })
      })

      const data = await response.json()
      
      if (data.success) {
        setSuccess('Verification email sent! Please check your inbox.')
        contractToast.info('Check your email for verification link')
        setEmailDialogOpen(false)
        setEmailAddress('')
        fetchNotificationSettings()
      } else {
        setError(data.error || 'Failed to configure email')
      }

    } catch (err) {
      console.error('Error configuring email:', err)
      setError('Failed to configure email')
    } finally {
      setSaving(false)
    }
  }

  const removeChannel = async (channelType: string) => {
    try {
      setSaving(true)
      setError(null)

      if (!address) {
        setError('Please connect your wallet first')
        return
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/channels/${channelType}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ wallet_address: address })
      })

      const data = await response.json()
      
      if (data.success) {
        setSuccess(`${channelType} notifications disabled`)
        contractToast.success(`${channelType} channel removed`)
        fetchNotificationSettings()
      } else {
        setError(data.error || 'Failed to remove channel')
      }

    } catch (err) {
      console.error('Error removing channel:', err)
      setError('Failed to remove channel')
    } finally {
      setSaving(false)
    }
  }

  const testNotification = async (channelType: string) => {
    try {
      setTestingChannel(channelType)
      setError(null)

      if (!address) {
        setError('Please connect your wallet first')
        return
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ wallet_address: address, channel_type: channelType })
      })

      const data = await response.json()
      
      if (data.success) {
        contractToast.success(`Test notification sent via ${channelType}`)
      } else {
        setError(data.error || 'Failed to send test notification')
      }

    } catch (err) {
      console.error('Error testing notification:', err)
      setError('Failed to send test notification')
    } finally {
      setTestingChannel(null)
    }
  }

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'telegram': return <Telegram />
      case 'discord': return <Settings /> // Discord icon approximation
      case 'email': return <Email />
      default: return <Notifications />
    }
  }

  const getChannelStatus = (channel: NotificationChannel) => {
    if (!channel.is_verified) {
      return <Chip icon={<Warning />} label="Pending Verification" color="warning" size="small" />
    }
    if (!channel.is_active) {
      return <Chip icon={<Error />} label="Inactive" color="error" size="small" />
    }
    return <Chip icon={<CheckCircle />} label="Active" color="success" size="small" />
  }

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🔔 Notification Settings
          </Typography>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading notification settings...
          </Typography>
        </CardContent>
      </Card>
    )
  }

  if (!address) {
    return (
      <Card>
        <CardContent>
          <Alert severity="info">
            Please connect your wallet to configure notifications.
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        🔔 Notification Settings
      </Typography>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Channels Configuration */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📱 Notification Channels
          </Typography>
          
          <Grid container spacing={2}>
            {/* Telegram */}
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <Telegram color="primary" />
                    <Typography variant="h6">Telegram</Typography>
                  </Stack>
                  
                  {channels.find(c => c.channel_type === 'telegram') ? (
                    <Box>
                      {getChannelStatus(channels.find(c => c.channel_type === 'telegram')!)}
                      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                        <Button
                          size="small"
                          startIcon={<PlayArrow />}
                          onClick={() => testNotification('telegram')}
                          disabled={testingChannel === 'telegram'}
                        >
                          Test
                        </Button>
                        <Button
                          size="small"
                          startIcon={<Delete />}
                          color="error"
                          onClick={() => removeChannel('telegram')}
                          disabled={saving}
                        >
                          Remove
                        </Button>
                      </Stack>
                    </Box>
                  ) : (
                    <Button
                      variant="outlined"
                      startIcon={<Send />}
                      onClick={() => setTelegramDialogOpen(true)}
                      disabled={saving}
                    >
                      Configure
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Discord */}
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <Settings color="primary" />
                    <Typography variant="h6">Discord</Typography>
                  </Stack>
                  
                  {channels.find(c => c.channel_type === 'discord') ? (
                    <Box>
                      {getChannelStatus(channels.find(c => c.channel_type === 'discord')!)}
                      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                        <Button
                          size="small"
                          startIcon={<PlayArrow />}
                          onClick={() => testNotification('discord')}
                          disabled={testingChannel === 'discord'}
                        >
                          Test
                        </Button>
                        <Button
                          size="small"
                          startIcon={<Delete />}
                          color="error"
                          onClick={() => removeChannel('discord')}
                          disabled={saving}
                        >
                          Remove
                        </Button>
                      </Stack>
                    </Box>
                  ) : (
                    <Button
                      variant="outlined"
                      startIcon={<Send />}
                      onClick={() => setDiscordDialogOpen(true)}
                      disabled={saving}
                    >
                      Configure
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Email */}
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <Email color="primary" />
                    <Typography variant="h6">Email</Typography>
                  </Stack>
                  
                  {channels.find(c => c.channel_type === 'email') ? (
                    <Box>
                      {getChannelStatus(channels.find(c => c.channel_type === 'email')!)}
                      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                        <Button
                          size="small"
                          startIcon={<PlayArrow />}
                          onClick={() => testNotification('email')}
                          disabled={testingChannel === 'email'}
                        >
                          Test
                        </Button>
                        <Button
                          size="small"
                          startIcon={<Delete />}
                          color="error"
                          onClick={() => removeChannel('email')}
                          disabled={saving}
                        >
                          Remove
                        </Button>
                      </Stack>
                    </Box>
                  ) : (
                    <Button
                      variant="outlined"
                      startIcon={<Send />}
                      onClick={() => setEmailDialogOpen(true)}
                      disabled={saving}
                    >
                      Configure
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      {settings && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              ⚙️ Notification Preferences
            </Typography>

            <Stack spacing={2}>
              {/* Global Channel Settings */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle1">
                    📱 Channel Settings
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={2}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.telegram_enabled}
                          onChange={(e) => updateSettings({ telegram_enabled: e.target.checked })}
                          disabled={saving || !channels.find(c => c.channel_type === 'telegram')}
                        />
                      }
                      label="Enable Telegram Notifications"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.discord_enabled}
                          onChange={(e) => updateSettings({ discord_enabled: e.target.checked })}
                          disabled={saving || !channels.find(c => c.channel_type === 'discord')}
                        />
                      }
                      label="Enable Discord Notifications"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.email_enabled}
                          onChange={(e) => updateSettings({ email_enabled: e.target.checked })}
                          disabled={saving || !channels.find(c => c.channel_type === 'email')}
                        />
                      }
                      label="Enable Email Notifications"
                    />
                  </Stack>
                </AccordionDetails>
              </Accordion>

              {/* Deployment Notifications */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CheckCircle color="success" />
                    <Typography variant="subtitle1">Deployment Notifications</Typography>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={2}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.deployment_success}
                          onChange={(e) => updateSettings({ deployment_success: e.target.checked })}
                          disabled={saving}
                        />
                      }
                      label="Successful Deployments"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.deployment_failed}
                          onChange={(e) => updateSettings({ deployment_failed: e.target.checked })}
                          disabled={saving}
                        />
                      }
                      label="Failed Deployments"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.gas_optimization}
                          onChange={(e) => updateSettings({ gas_optimization: e.target.checked })}
                          disabled={saving}
                        />
                      }
                      label="Gas Optimization Suggestions"
                    />
                  </Stack>
                </AccordionDetails>
              </Accordion>

              {/* Monitoring & Security */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Security color="error" />
                    <Typography variant="subtitle1">Monitoring & Security</Typography>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={2}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.unusual_activity}
                          onChange={(e) => updateSettings({ unusual_activity: e.target.checked })}
                          disabled={saving}
                        />
                      }
                      label="Unusual Contract Activity"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.milestone_reached}
                          onChange={(e) => updateSettings({ milestone_reached: e.target.checked })}
                          disabled={saving}
                        />
                      }
                      label="Contract Milestones"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.security_alerts}
                          onChange={(e) => updateSettings({ security_alerts: e.target.checked })}
                          disabled={saving}
                        />
                      }
                      label="Security Alerts"
                    />
                  </Stack>
                </AccordionDetails>
              </Accordion>

              {/* Business & Billing */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <AccountBalance color="info" />
                    <Typography variant="subtitle1">Business & Billing</Typography>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={2}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.subscription_expiry}
                          onChange={(e) => updateSettings({ subscription_expiry: e.target.checked })}
                          disabled={saving}
                        />
                      }
                      label="Subscription Expiry Warnings"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.usage_limits}
                          onChange={(e) => updateSettings({ usage_limits: e.target.checked })}
                          disabled={saving}
                        />
                      }
                      label="Usage Limit Alerts"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.billing_updates}
                          onChange={(e) => updateSettings({ billing_updates: e.target.checked })}
                          disabled={saving}
                        />
                      }
                      label="Billing Updates"
                    />
                  </Stack>
                </AccordionDetails>
              </Accordion>

              {/* Advanced Settings */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <TrendingUp color="primary" />
                    <Typography variant="subtitle1">Advanced & Digest</Typography>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={3}>
                    <Stack spacing={2}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.daily_digest}
                            onChange={(e) => updateSettings({ daily_digest: e.target.checked })}
                            disabled={saving}
                          />
                        }
                        label="Daily Activity Digest"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.weekly_summary}
                            onChange={(e) => updateSettings({ weekly_summary: e.target.checked })}
                            disabled={saving}
                          />
                        }
                        label="Weekly Summary Report"
                      />
                    </Stack>

                    <Divider />

                    <Typography variant="subtitle2" color="text.secondary">
                      Alert Thresholds
                    </Typography>
                    
                    <TextField
                      label="Transaction Threshold"
                      type="number"
                      value={settings.transaction_threshold}
                      onChange={(e) => updateSettings({ transaction_threshold: parseInt(e.target.value) || 100 })}
                      helperText="Alert after this many transactions on your contracts"
                      disabled={saving}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">transactions</InputAdornment>
                      }}
                    />

                    <TextField
                      label="Gas Price Alert Multiplier"
                      type="number"
                      step="0.1"
                      value={settings.gas_threshold_multiplier}
                      onChange={(e) => updateSettings({ gas_threshold_multiplier: parseFloat(e.target.value) || 2.0 })}
                      helperText="Alert when gas price is X times higher than normal"
                      disabled={saving}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">×</InputAdornment>
                      }}
                    />
                  </Stack>
                </AccordionDetails>
              </Accordion>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Telegram Configuration Dialog */}
      <Dialog open={telegramDialogOpen} onClose={() => setTelegramDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Telegram />
            <Typography>Configure Telegram Notifications</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            1. Start a chat with our bot: @ContractForgeBot<br/>
            2. Send /start to get your Chat ID<br/>
            3. Enter your Chat ID below
          </Alert>
          <TextField
            fullWidth
            label="Telegram Chat ID"
            value={telegramChatId}
            onChange={(e) => setTelegramChatId(e.target.value)}
            placeholder="123456789"
            helperText="Your unique Telegram Chat ID"
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTelegramDialogOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button 
            onClick={setupTelegramChannel} 
            variant="contained" 
            disabled={saving || !telegramChatId}
          >
            Configure
          </Button>
        </DialogActions>
      </Dialog>

      {/* Discord Configuration Dialog */}
      <Dialog open={discordDialogOpen} onClose={() => setDiscordDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Settings />
            <Typography>Configure Discord Notifications</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            1. Right-click your username in Discord<br/>
            2. Select "Copy User ID" (Developer Mode required)<br/>
            3. Enter your User ID below
          </Alert>
          <TextField
            fullWidth
            label="Discord User ID"
            value={discordUserId}
            onChange={(e) => setDiscordUserId(e.target.value)}
            placeholder="123456789012345678"
            helperText="Your Discord User ID (18 digits)"
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDiscordDialogOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button 
            onClick={setupDiscordChannel} 
            variant="contained" 
            disabled={saving || !discordUserId}
          >
            Configure
          </Button>
        </DialogActions>
      </Dialog>

      {/* Email Configuration Dialog */}
      <Dialog open={emailDialogOpen} onClose={() => setEmailDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Email />
            <Typography>Configure Email Notifications</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Enter your email address. We'll send you a verification link to confirm your email.
          </Alert>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={emailAddress}
            onChange={(e) => setEmailAddress(e.target.value)}
            placeholder="your@email.com"
            helperText="A verification email will be sent to this address"
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmailDialogOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button 
            onClick={setupEmailChannel} 
            variant="contained" 
            disabled={saving || !emailAddress}
          >
            Send Verification
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default NotificationSettings