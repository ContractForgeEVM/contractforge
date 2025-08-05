import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  CircularProgress,
  Divider,
  Grid
} from '@mui/material'
import {
  Add as AddIcon,
  ContentCopy as CopyIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Key as KeyIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material'
import { useAccount } from 'wagmi'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@mui/material/styles'
import PremiumApiTester from './PremiumApiTester'
import subscriptionService from '../services/subscriptionService'
import { isDevAccount, getDevSubscriptionTier, logDevAccountDetection } from '../utils/devAccount'

interface ApiKey {
  id: string
  name: string
  key: string
  subscriptionTier: 'free' | 'basic' | 'premium' | 'enterprise'
  isActive: boolean
  createdAt: string
  lastUsed?: string
  usageCount: number
  rateLimit: {
    requestsPerMinute: number
    requestsPerHour: number
    requestsPerDay: number
  }
}

interface ApiKeyManagerProps {
  onApiKeyChange?: (apiKey: string | null) => void
}

const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ onApiKeyChange }) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [userSubscriptionTier, setUserSubscriptionTier] = useState<'free' | 'basic' | 'premium' | 'enterprise'>('free')
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  })
  const [currentApiKey, setCurrentApiKey] = useState<string | null>(null)

  const { address, isConnected } = useAccount()
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3004'

  useEffect(() => {
    if (isConnected && address) {
      // Charger la clé API actuelle depuis localStorage (isolée par utilisateur)
      const userApiKeyStorageKey = `contractforge_api_key_${address.toLowerCase()}`
      const savedApiKey = localStorage.getItem(userApiKeyStorageKey)
      setCurrentApiKey(savedApiKey)
      
      fetchApiKeys()
    } else {
      // Nettoyer l'état quand on se déconnecte
      setCurrentApiKey(null)
      setApiKeys([])
      setUserSubscriptionTier('free')
    }
  }, [isConnected, address])

  const fetchApiKeys = async () => {
    try {
      setLoading(true)
      
      // Récupérer le niveau d'abonnement de l'utilisateur
      if (address) {
        // 🌟 COMPTE DEV PREMIUM : Accès enterprise
        if (isDevAccount(address)) {
          logDevAccountDetection(address, 'ApiKeyManager')
          setUserSubscriptionTier(getDevSubscriptionTier())
        } else {
          try {
            const subscription = await subscriptionService.getUserSubscription(address)
            if (subscription) {
              // Mapper les noms d'abonnement du contrat vers nos tiers
              const tierMapping: Record<string, 'free' | 'basic' | 'premium' | 'enterprise'> = {
                'STARTER': 'basic',
                'PRO': 'premium', 
                'ENTERPRISE': 'enterprise'
              }
              setUserSubscriptionTier(tierMapping[subscription.plan_id] || 'free')
            } else {
              setUserSubscriptionTier('free')
            }
          } catch (error) {
            console.log('No subscription found, using free tier')
            setUserSubscriptionTier('free')
          }
        }
      }

      // Récupérer les clés API existantes depuis le backend
      try {
        if (!import.meta.env.VITE_MASTER_API_KEY) {
          console.warn('VITE_MASTER_API_KEY non configurée - impossible de récupérer les clés API')
          setApiKeys([])
          return
        }

        const response = await fetch(`${API_BASE}/api/keys/user/${address}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_MASTER_API_KEY}`
          }
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success && result.keys) {
            // Transformer les clés du backend vers le format frontend
            const transformedKeys = result.keys.map((key: any) => ({
              id: key.id,
              name: key.name,
              key: key.hashedKey, // On ne montre que les premiers caractères
              tier: key.subscriptionTier,
              createdAt: key.createdAt,
              lastUsed: key.lastUsed || null,
              isActive: key.isActive,
              permissions: key.permissions || []
            }))
            setApiKeys(transformedKeys)
            console.log(`✅ ${transformedKeys.length} clé(s) API récupérée(s) pour ${address}`)
          } else {
            setApiKeys([])
          }
        } else {
          console.warn('Impossible de récupérer les clés API:', response.status)
          setApiKeys([])
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des clés API:', error)
        setApiKeys([])
      }
      
    } catch (error) {
      console.error('Error fetching API keys:', error)
      showSnackbar('Erreur lors du chargement des clés API', 'error')
    } finally {
      setLoading(false)
    }
  }

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      showSnackbar('Veuillez entrer un nom pour la clé API', 'error')
      return
    }

    if (!address) {
      showSnackbar('Adresse wallet requise', 'error')
      return
    }

    try {
      // Vérifier que la clé master est configurée
      if (!import.meta.env.VITE_MASTER_API_KEY) {
        throw new Error('Clé master API non configurée. Contactez l\'administrateur.')
      }

      // Utiliser la vraie API backend
      const response = await fetch(`${API_BASE}/api/keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_MASTER_API_KEY}`
        },
        body: JSON.stringify({
          name: newKeyName.trim(),
          userId: address,
          subscriptionTier: userSubscriptionTier,
          permissions: ['compile', 'deploy', 'verify', 'analytics'],
          walletAddress: address
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erreur lors de la création de la clé API')
      }

      const result = await response.json()
      setCreatedKey(result.apiKey?.key || result.key)
      setNewKeyName('')
      showSnackbar('Clé API créée avec succès !', 'success')
      
      // Recharger la liste
      await fetchApiKeys()
    } catch (error: any) {
      console.error('Error creating API key:', error)
      showSnackbar(error.message || 'Erreur lors de la création de la clé API', 'error')
    }
  }

  const toggleApiKeyVisibility = (keyId: string) => {
    setShowKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    showSnackbar('Clé copiée dans le presse-papiers !', 'success')
  }

  const setAsCurrentApiKey = (apiKey: string) => {
    if (!address) return
    
    const userApiKeyStorageKey = `contractforge_api_key_${address.toLowerCase()}`
    localStorage.setItem(userApiKeyStorageKey, apiKey)
    // Maintenir la compatibilité avec l'ancienne clé globale pour les autres composants
    localStorage.setItem('contractforge_api_key', apiKey)
    setCurrentApiKey(apiKey)
    onApiKeyChange?.(apiKey)
    showSnackbar(t("apiKeys.setAsActive"), 'success')
  }

  const removeCurrentApiKey = () => {
    if (!address) return
    
    const userApiKeyStorageKey = `contractforge_api_key_${address.toLowerCase()}`
    localStorage.removeItem(userApiKeyStorageKey)
    localStorage.removeItem('contractforge_api_key')
    setCurrentApiKey(null)
    onApiKeyChange?.(null)
    showSnackbar('Clé API supprimée !', 'success')
  }

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'enterprise': return 'error'
      case 'premium': return 'primary'
      case 'basic': return 'secondary'
      default: return 'default'
    }
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'enterprise': return <SecurityIcon />
      case 'premium': return <SpeedIcon />
      case 'basic': return <AnalyticsIcon />
      default: return <KeyIcon />
    }
  }

  if (!isConnected) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <KeyIcon color="primary" />
            <Typography variant="h6">{t("apiKeys.title")}</Typography>
          </Box>
          <Alert severity="info">
            {t("apiKeys.connectWallet")}
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Box>
      {/* En-tête */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" alignItems="center" gap={2}>
              <KeyIcon color="primary" />
              <Typography variant="h6">{t("apiKeys.title")}</Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
              disabled={loading}
            >
              {t("apiKeys.createKey")}
            </Button>
          </Box>

          {/* Clé API actuelle */}
          {currentApiKey && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {t("apiKeys.activeApiKey")}
              </Typography>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <TextField
                  value={currentApiKey}
                  variant="outlined"
                  size="small"
                  fullWidth
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <Box display="flex" gap={1}>
                        <IconButton size="small" onClick={() => copyToClipboard(currentApiKey)}>
                          <CopyIcon />
                        </IconButton>
                        <IconButton size="small" onClick={removeCurrentApiKey} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    )
                  }}
                />
              </Box>
            </Box>
          )}

          {!currentApiKey && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {t("apiKeys.noActiveKey")}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Liste des clés */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {t("apiKeys.myKeys")}
          </Typography>

          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : apiKeys.length === 0 ? (
            <Alert severity="info">
              {t("apiKeys.noKeysFound")}
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nom</TableCell>
                    <TableCell>Clé</TableCell>
                    <TableCell>Abonnement</TableCell>
                    <TableCell>{t("apiKeys.limits")}</TableCell>
                    <TableCell>Usage</TableCell>
                    <TableCell>{t("apiKeys.lastUsed")}</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {apiKeys.map((apiKey) => (
                    <TableRow key={apiKey.id}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          {getTierIcon(apiKey.subscriptionTier)}
                          <Typography variant="body2" fontWeight="medium">
                            {apiKey.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography 
                            variant="body2" 
                            fontFamily="monospace"
                            sx={{ 
                              minWidth: '200px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {showKeys[apiKey.id] 
                              ? apiKey.key 
                              : apiKey.key.substring(0, 12) + '••••••••••••••••'
                            }
                          </Typography>
                          <IconButton 
                            size="small" 
                            onClick={() => toggleApiKeyVisibility(apiKey.id)}
                          >
                            {showKeys[apiKey.id] ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => copyToClipboard(apiKey.key)}
                          >
                            <CopyIcon />
                          </IconButton>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={apiKey.subscriptionTier.toUpperCase()}
                          color={getTierColor(apiKey.subscriptionTier)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2">
                          {apiKey.rateLimit.requestsPerMinute}/min<br />
                          {apiKey.rateLimit.requestsPerHour}/h<br />
                          {apiKey.rateLimit.requestsPerDay}/jour
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2">
                          {apiKey.usageCount.toLocaleString()} requêtes
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2">
                          {apiKey.lastUsed ? formatDate(apiKey.lastUsed) : t("apiKeys.never")}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title="Définir comme clé active">
                            <IconButton
                              size="small"
                              onClick={() => setAsCurrentApiKey(apiKey.key)}
                              color={currentApiKey === apiKey.key ? 'primary' : 'default'}
                            >
                              <KeyIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Dialog de création */}
      <Dialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t("apiKeys.createNewKey")}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3} mt={1}>
            <TextField
              label={t("apiKeys.keyNameLabel")}
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              fullWidth
              placeholder={t("apiKeys.keyNameExample")}
            />
            
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                {t("apiKeys.subscriptionLevel")}
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Box display="flex" alignItems="center" gap={1}>
                  {getTierIcon(userSubscriptionTier)}
                  <Typography variant="body2">
                    <strong>{userSubscriptionTier.toUpperCase()}</strong>
                    {userSubscriptionTier === 'free' && ` (${t("apiKeys.freeLimit")})`}
                    {userSubscriptionTier === 'basic' && ' (30/min, 500/h, 2K/jour)'}
                    {userSubscriptionTier === 'premium' && ' (60/min, 1K/h, 10K/jour)'}
                    {userSubscriptionTier === 'enterprise' && ' (200/min, 5K/h, 50K/jour)'}
                  </Typography>
                </Box>
                {userSubscriptionTier === 'free' && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {t("apiKeys.upgradeMessage")}
                  </Typography>
                )}
              </Alert>
            </Box>

            <Alert severity="info">
              <Typography variant="body2">
                {t("apiKeys.importantNote")}
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>
            {t("apiKeys.cancel")}
          </Button>
          <Button 
            onClick={createApiKey} 
            variant="contained"
            disabled={!newKeyName.trim()}
          >
            {t("apiKeys.create")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de clé créée */}
      <Dialog 
        open={!!createdKey} 
        onClose={() => setCreatedKey(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{t("apiKeys.keyCreated")}</DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mb: 3 }}>
            {t("apiKeys.keyCreatedMessage")}
          </Alert>
          
          <TextField
            label={t("apiKeys.newApiKey")}
            value={createdKey || ''}
            fullWidth
            multiline
            rows={3}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <IconButton onClick={() => createdKey && copyToClipboard(createdKey)}>
                  <CopyIcon />
                </IconButton>
              )
            }}
            sx={{ 
      fontFamily: 'monospace',
      '& input': {
        color: 'text.primary'
      }
    }}
          />

          <Box mt={3}>
            <Typography variant="h6" gutterBottom>
              {t("apiKeys.nextSteps")}
            </Typography>
            <Typography variant="body2" component="div">
              1. {t("apiKeys.step1")}<br />
              2. {t("apiKeys.step2")}<br />
              <code style={{ 
      background: 'rgba(0, 0, 0, 0.1)', 
      color: 'inherit', 
      padding: '4px 8px', 
      borderRadius: '4px',
      border: '1px solid rgba(0, 0, 0, 0.2)'
    }}>
                Authorization: Bearer {createdKey}
              </code><br />
              3. {t("apiKeys.step3")}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => createdKey && copyToClipboard(createdKey)}
            startIcon={<CopyIcon />}
          >
            {t("apiKeys.copyKey")}
          </Button>
          <Button 
            onClick={() => {
              if (createdKey) {
                setAsCurrentApiKey(createdKey)
              }
              setCreatedKey(null)
              setCreateDialogOpen(false)
            }}
            variant="contained"
          >
            {t("apiKeys.setAsActive")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Testeur Premium */}
      {currentApiKey && (
        <Box mt={3}>
          <PremiumApiTester apiKey={currentApiKey} />
        </Box>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default ApiKeyManager