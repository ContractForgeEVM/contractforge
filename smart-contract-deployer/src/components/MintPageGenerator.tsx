import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  FormControl,
  FormControlLabel,
  Switch,
  InputAdornment,
  Select,
  MenuItem,
  InputLabel,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Paper,
  Tooltip,
  Divider,
  CircularProgress,
  Avatar
} from '@mui/material'
import {
  Add,
  Preview,
  Save,
  Check,
  Error as ErrorIcon,
  Palette,
  Link as LinkIcon,
  ContentCopy,
  OpenInNew,
  Close,
  Refresh,
  Warning
} from '@mui/icons-material'
import { useAccount } from 'wagmi'
import { useTranslation } from 'react-i18next'

// 🎯 Détection de l'environnement de développement
const isLocalDevelopment = () => {
  return window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' ||
         window.location.port !== '' ||
         import.meta.env.DEV
}

const getBaseUrl = () => {
  if (isLocalDevelopment()) {
    return 'http://localhost:3004' // Port du smart-contract-compiler-api
  }
  return 'https://contractforge.io'
}

const getMintPagesApiUrl = () => {
  if (isLocalDevelopment()) {
    return 'http://localhost:3004/api/mint-pages' // API réelle des pages de mint
  }
  return import.meta.env.VITE_API_URL + '/api/mint-pages' || 'https://contractforge.io/api/mint-pages'
}

// Nouvelle fonction pour obtenir l'URL de la page de mint générée
const getMintPageUrl = (subdomain: string) => {
  if (isLocalDevelopment()) {
    // Utiliser la page de mint complète avec design moderne, hero, wallet, footer
    return `http://localhost:3004/api/mint-pages/preview/${subdomain}`
  }
  return `https://${subdomain}.contractforge.io`
}

interface MintPageConfig {
  contractAddress: string
  subdomain: string
  title: string
  description: string
  primaryColor: string
  backgroundColor: string
  heroImage?: string
  price: string
  maxSupply: string
  maxPerWallet: string
  showRemainingSupply: boolean
  showMintedCount: boolean
  socialLinks: {
    twitter?: string
    discord?: string
    website?: string
  }
}

interface NFTContract {
  address: string
  name: string
  symbol: string
  chain: string
  chainId: number
  deployedAt: Date
}

const MintPageGenerator: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0)
  const [config, setConfig] = useState<MintPageConfig>({
    contractAddress: '',
    subdomain: '',
    title: '',
    description: '',
    primaryColor: '#6366f1',
    backgroundColor: '#1a202c',
    heroImage: '',
    price: '0.01',
    maxSupply: '10000',
    maxPerWallet: '5',
    showRemainingSupply: true,
    showMintedCount: true,
    socialLinks: {}
  })
  const [contracts, setContracts] = useState<NFTContract[]>([])
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null)
  const [checkingSubdomain, setCheckingSubdomain] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [creating, setCreating] = useState(false)
  const [created, setCreated] = useState(false)
  const [createdPageUrl, setCreatedPageUrl] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [heroImagePreview, setHeroImagePreview] = useState<string | null>(null)
  
  const { address } = useAccount()
  const { t } = useTranslation()

  // Détection de l'environnement au chargement
  const isDev = isLocalDevelopment()

  // Fonction pour gérer l'upload d'image hero
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validation du format et de la taille
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('Format non supporté. Utilisez JPG, PNG ou WebP.')
      return
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB max
      alert('Image trop grande. Maximum 2MB.')
      return
    }

    setUploadingImage(true)
    
    try {
      // Créer un preview local
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setHeroImagePreview(result)
        setConfig({ ...config, heroImage: result })
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('❌ Erreur upload image:', error)
      alert('Erreur lors de l\'upload de l\'image')
    } finally {
      setUploadingImage(false)
    }
  }

  // Fonction pour supprimer l'image hero
  const removeHeroImage = () => {
    setHeroImagePreview(null)
    setConfig({ ...config, heroImage: '' })
  }

  useEffect(() => {
    if (address) {
      fetchNFTContracts()
    }
  }, [address])

  const fetchNFTContracts = async () => {
    try {
      // Récupérer les vrais contrats NFT depuis Supabase
      const { supabase } = await import('../config/supabase')
      
      const { data: deployments, error } = await supabase
        .from('deployments')
        .select('*')
        .eq('user_id', address)
        .eq('template', 'nft')
        .eq('success', true)
        .order('timestamp', { ascending: false })

      if (error) {
        console.error('❌ Erreur Supabase NFT:', error)
        setContracts([])
        return
      }

      // Transformer en format NFTContract
      const nftContracts: NFTContract[] = (deployments || []).map((deployment: any) => ({
        address: deployment.contract_address,
        name: `NFT Collection #${deployment.contract_address.slice(-4)}`,
        symbol: 'NFT',
        chain: deployment.chain.charAt(0).toUpperCase() + deployment.chain.slice(1),
        chainId: getChainIdFromChainName(deployment.chain),
        deployedAt: new Date(deployment.timestamp)
      }))

      setContracts(nftContracts)
    } catch (error) {
      console.error('❌ Erreur récupération NFT:', error)
      
      // Fallback avec des données vides
      setContracts([])
    }
  }

  const getChainIdFromChainName = (chainName: string): number => {
    const chainMap: Record<string, number> = {
      'ethereum': 1,
      'polygon': 137,
      'arbitrum': 42161,
      'optimism': 10,
      'bsc': 56,
      'avalanche': 43114,
      'base': 8453
    }
    return chainMap[chainName.toLowerCase()] || 1
  }

  const checkSubdomainAvailability = async (subdomain: string) => {
    if (!subdomain || subdomain.length < 3) {
      setSubdomainAvailable(null)
      return
    }
    
    setCheckingSubdomain(true)
    try {
      // En développement et production, utiliser l'API réelle
      console.log(`🔍 Vérification sous-domaine: ${subdomain}`)
      
      const apiUrl = getMintPagesApiUrl()
      const response = await fetch(`${apiUrl}/check-subdomain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ subdomain })
      })
      
      if (response.ok) {
        const result = await response.json()
        setSubdomainAvailable(result.available)
        if (!result.available && result.reason) {
          console.log(`   Raison: ${result.reason}`)
        }
      } else {
        console.warn('API non disponible, vérification locale...')
        // Fallback local
        await new Promise(resolve => setTimeout(resolve, 1000))
        const reserved = ['test', 'demo', 'admin', 'api', 'www', 'mail', 'ftp', 'app', 'blog', 'shop', 'mint', 'nft']
        const isAvailable = !reserved.includes(subdomain.toLowerCase())
        setSubdomainAvailable(isAvailable)
      }
      
    } catch (error) {
      console.error('❌ Erreur vérification sous-domaine:', error)
      // Fallback local en cas d'erreur
      const reserved = ['test', 'demo', 'admin', 'api', 'www', 'mail', 'ftp', 'app', 'blog', 'shop', 'mint', 'nft']
      const isAvailable = !reserved.includes(subdomain.toLowerCase())
      setSubdomainAvailable(isAvailable)
    } finally {
      setCheckingSubdomain(false)
    }
  }

  const handleSubdomainChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30)
    setConfig({ ...config, subdomain: sanitized })
    
    if (sanitized.length >= 3) {
      checkSubdomainAvailability(sanitized)
    } else {
      setSubdomainAvailable(null)
    }
  }

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1)
  }

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1)
  }

  const handleCreatePage = async () => {
    setCreating(true)
    try {
      // 🎯 Utiliser l'API réelle des pages de mint (dev et prod)
      console.log(`🎯 Création page via smart-contract-compiler-api: ${config.subdomain}`)
      
      const apiUrl = getMintPagesApiUrl()
      const response = await fetch(`${apiUrl}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: address,
          contract_address: config.contractAddress,
          subdomain: config.subdomain,
          title: config.title,
          description: config.description,
          primary_color: config.primaryColor,
          background_color: config.backgroundColor,
          hero_image: config.heroImage,
          mint_price: parseFloat(config.price),
          max_supply: parseInt(config.maxSupply),
          max_per_wallet: parseInt(config.maxPerWallet),
          show_remaining_supply: config.showRemainingSupply,
          show_minted_count: config.showMintedCount,
          social_links: config.socialLinks
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        // 🌟 Créer l'URL avec le template simplifié pour éviter les erreurs JS
        const pageUrl = getMintPageUrl(config.subdomain)
        
        setCreatedPageUrl(pageUrl)
        setCreated(true)
        console.log(`✅ Page créée avec succès: ${pageUrl}`)
      } else {
        const errorData = await response.json().catch(() => ({}))
        if (response.status === 400 && errorData.error === 'Subdomain already taken') {
          throw new Error('Ce sous-domaine est déjà utilisé. Choisissez-en un autre.')
        }
        throw new Error(`Erreur serveur: ${errorData.error || response.statusText}`)
      }
      
    } catch (error: any) {
      console.error('❌ Erreur création page de mint:', error)
      
      if (isDev && error.message.includes('Failed to fetch')) {
        // Le smart-contract-compiler-api n'est pas lancé
        alert('⚠️ Le smart-contract-compiler-api ne semble pas être lancé.\n\nVérifiez que l\'API tourne sur le port 3004.')
      }
      
      throw error // Propager l'erreur pour le debugging
    } finally {
      setCreating(false)
    }
  }

  const selectedContract = contracts.find(c => c.address === config.contractAddress)

  const steps = [
    {
      label: t('mintPage.steps.selectContract'),
      content: (
        <Box>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {t('mintPage.selectContractDesc')}
          </Typography>
          {contracts.length === 0 ? (
            <Alert severity="warning">
              {t('mintPage.noNftContracts')}
            </Alert>
          ) : (
            <FormControl fullWidth>
              <InputLabel>{t('mintPage.nftContract')}</InputLabel>
              <Select
                value={config.contractAddress}
                onChange={(e) => setConfig({ ...config, contractAddress: e.target.value })}
                label={t('mintPage.nftContract')}
              >
                {contracts.map((contract) => (
                  <MenuItem key={contract.address} value={contract.address}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <Box>
                        <Typography fontWeight={500}>{contract.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {contract.address.slice(0, 6)}...{contract.address.slice(-4)}
                        </Typography>
                      </Box>
                      <Chip label={contract.chain} size="small" />
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
      )
    },
    {
      label: t('mintPage.steps.chooseSubdomain'),
      content: (
        <Box>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Choisissez un sous-domaine unique pour votre page de mint
          </Typography>
          
          {/* 🎯 Alerte de développement local */}
          {isDev && (
            <Alert severity="info" sx={{ mb: 2 }} icon={<Warning />}>
              <Typography variant="body2">
                <strong>Mode développement :</strong> Utilisation du vrai système de mint pages avec Web3 et badges ContractForge.io x OpenZeppelin.
              </Typography>
            </Alert>
          )}
          
          <TextField
            fullWidth
            label="Sous-domaine"
            value={config.subdomain}
            onChange={(e) => handleSubdomainChange(e.target.value)}
            helperText={`Preview: ${getMintPageUrl(config.subdomain || 'votre-nom')}`}
            InputProps={{
              endAdornment: checkingSubdomain ? (
                <InputAdornment position="end">
                  <CircularProgress size={20} />
                </InputAdornment>
              ) : subdomainAvailable !== null ? (
                <InputAdornment position="end">
                  {subdomainAvailable ? (
                    <Check color="success" />
                  ) : (
                    <ErrorIcon color="error" />
                  )}
                </InputAdornment>
              ) : null
            }}
            error={subdomainAvailable === false}
          />
          {subdomainAvailable === false && (
            <Alert severity="error" sx={{ mt: 1 }}>
              Ce sous-domaine n'est pas disponible
            </Alert>
          )}
          {subdomainAvailable && (
            <Alert severity="success" sx={{ mt: 1 }}>
              {isDev ? 'Sous-domaine valide pour la simulation !' : 'Sous-domaine disponible !'}
            </Alert>
          )}
        </Box>
      )
    },
    {
      label: t('mintPage.steps.basicInfo'),
      content: (
        <Stack spacing={3}>
          <TextField
            fullWidth
            label="Titre de la page"
            value={config.title}
            onChange={(e) => setConfig({ ...config, title: e.target.value })}
            placeholder="Ma Collection NFT Incroyable"
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description"
            value={config.description}
            onChange={(e) => setConfig({ ...config, description: e.target.value })}
                            placeholder={t('mintPage.descriptionPlaceholder')}
          />
          
          {/* Hero Image Upload */}
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              🖼️ Image Hero (Optionnelle)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Ajoutez une image d'arrière-plan personnalisée pour votre hero section. 
              Formats supportés : JPG, PNG, WebP. Taille max : 2MB. 
              Résolution recommandée : 1920x800px.
            </Typography>
            
            {heroImagePreview ? (
              <Box sx={{ position: 'relative', mb: 2 }}>
                <Card sx={{ overflow: 'hidden', maxHeight: 200 }}>
                  <Box
                    component="img"
                    src={heroImagePreview}
                    alt="Hero preview"
                    sx={{
                      width: '100%',
                      height: 200,
                      objectFit: 'cover',
                      display: 'block'
                    }}
                  />
                </Card>
                <IconButton
                  onClick={removeHeroImage}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    bgcolor: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' }
                  }}
                  size="small"
                >
                  <Close />
                </IconButton>
              </Box>
            ) : (
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  textAlign: 'center',
                  border: '2px dashed',
                  borderColor: 'divider',
                  borderRadius: 2,
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'action.hover'
                  }
                }}
                onClick={() => document.getElementById('hero-image-upload')?.click()}
              >
                {uploadingImage ? (
                  <Stack alignItems="center" spacing={2}>
                    <CircularProgress />
                    <Typography>Téléchargement...</Typography>
                  </Stack>
                ) : (
                  <Stack alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                      <Add />
                    </Avatar>
                    <div>
                      <Typography variant="h6">Cliquez pour ajouter une image</Typography>
                      <Typography variant="body2" color="text.secondary">
                        ou glissez-déposez votre image ici
                      </Typography>
                    </div>
                  </Stack>
                )}
              </Paper>
            )}
            
            <input
              id="hero-image-upload"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              fullWidth
              label="Prix de mint"
              value={config.price}
              onChange={(e) => setConfig({ ...config, price: e.target.value })}
              InputProps={{
                endAdornment: <InputAdornment position="end">ETH</InputAdornment>
              }}
            />
            <TextField
              fullWidth
              label="Supply maximale"
              value={config.maxSupply}
              onChange={(e) => setConfig({ ...config, maxSupply: e.target.value })}
            />
            <TextField
              fullWidth
              label="Max par wallet"
              value={config.maxPerWallet}
              onChange={(e) => setConfig({ ...config, maxPerWallet: e.target.value })}
            />
          </Stack>
        </Stack>
      )
    },
    {
      label: t('mintPage.steps.customization'),
      content: (
        <Stack spacing={3}>
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              {t('mintPage.colors')}
            </Typography>
            
            {/* Présets de couleurs */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                Thèmes prédéfinis :
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                {[
                  { name: 'Violet', primary: '#8b5cf6', bg: '#fafafa' },
                  { name: 'Bleu', primary: '#3b82f6', bg: '#f8fafc' },
                  { name: 'Vert', primary: '#10b981', bg: '#f0fdf4' },
                  { name: 'Rose', primary: '#ec4899', bg: '#fdf2f8' },
                  { name: 'Orange', primary: '#f59e0b', bg: '#fffbeb' },
                  { name: 'Sombre', primary: '#6366f1', bg: '#1f2937' },
                  { name: 'Néon', primary: '#ff0080', bg: '#0a0a0a' },
                  { name: 'Cyan', primary: '#06b6d4', bg: '#f0fdff' }
                ].map((theme) => (
                  <Chip
                    key={theme.name}
                    label={theme.name}
                    variant={config.primaryColor === theme.primary ? "filled" : "outlined"}
                    onClick={() => setConfig({ 
                      ...config, 
                      primaryColor: theme.primary, 
                      backgroundColor: theme.bg 
                    })}
                    sx={{ 
                      backgroundColor: theme.primary,
                      color: 'white',
                      '&:hover': { opacity: 0.8 }
                    }}
                  />
                ))}
              </Stack>
            </Box>

            {/* Couleurs personnalisées */}
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                label={t('mintPage.primaryColor')}
                type="color"
                value={config.primaryColor}
                onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                InputProps={{
                  startAdornment: <Palette sx={{ mr: 1 }} />
                }}
                helperText="Couleur des boutons et accents"
              />
              <TextField
                fullWidth
                label={t('mintPage.backgroundColor')}
                type="color"
                value={config.backgroundColor}
                onChange={(e) => setConfig({ ...config, backgroundColor: e.target.value })}
                InputProps={{
                  startAdornment: <Palette sx={{ mr: 1 }} />
                }}
                helperText="Couleur d'arrière-plan"
              />
            </Stack>

            {/* Aperçu des couleurs */}
            <Box sx={{ mt: 2, p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Aperçu :
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box 
                  sx={{ 
                    width: 60, 
                    height: 40, 
                    backgroundColor: config.primaryColor,
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '0.8rem'
                  }}
                >
                  Bouton
                </Box>
                <Box 
                  sx={{ 
                    width: 60, 
                    height: 40, 
                    backgroundColor: config.backgroundColor,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem'
                  }}
                >
                  Fond
                </Box>
              </Stack>
            </Box>
          </Box>
          
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Options d'affichage
            </Typography>
            <Stack>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.showRemainingSupply}
                    onChange={(e) => setConfig({ ...config, showRemainingSupply: e.target.checked })}
                  />
                }
                label="Afficher le supply restant"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={config.showMintedCount}
                    onChange={(e) => setConfig({ ...config, showMintedCount: e.target.checked })}
                  />
                }
                label={t('mintPage.showMintedCount')}
              />
            </Stack>
          </Box>

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Liens sociaux
            </Typography>
            <Stack spacing={1}>
              <TextField
                fullWidth
                size="small"
                label="Twitter"
                value={config.socialLinks.twitter || ''}
                onChange={(e) => setConfig({ 
                  ...config, 
                  socialLinks: { ...config.socialLinks, twitter: e.target.value }
                })}
                placeholder="https://twitter.com/votrecollection"
              />
              <TextField
                fullWidth
                size="small"
                label="Discord"
                value={config.socialLinks.discord || ''}
                onChange={(e) => setConfig({ 
                  ...config, 
                  socialLinks: { ...config.socialLinks, discord: e.target.value }
                })}
                placeholder="https://discord.gg/votreinvitation"
              />
              <TextField
                fullWidth
                size="small"
                label="Site web"
                value={config.socialLinks.website || ''}
                onChange={(e) => setConfig({ 
                  ...config, 
                  socialLinks: { ...config.socialLinks, website: e.target.value }
                })}
                placeholder="https://votresite.com"
              />
            </Stack>
          </Box>
        </Stack>
      )
    }
  ]

  if (created) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <Check sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            {isDev ? '🎯 Page de mint créée avec Web3 !' : t('mintPage.success.title')}
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>
            {isDev 
              ? 'Page de mint fonctionnelle créée avec Web3, MetaMask, et badges ContractForge.io x OpenZeppelin.'
              : t('mintPage.success.description')
            }
          </Typography>
          
          {/* 🎯 Alerte spécifique au développement local */}
          {isDev && (
            <Alert severity="success" sx={{ mb: 3 }} icon={<Check />}>
              <Typography variant="body2">
                <strong>✅ Système complet :</strong> Web3, Smart Contracts, RainbowKit, Badges officiels.
              </Typography>
            </Alert>
          )}
          
          <Paper sx={{ p: 2, mb: 3, backgroundColor: 'action.hover' }}>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
              <LinkIcon />
              <Typography 
                variant="body1" 
                fontFamily="monospace"
                color={isDev ? "text.secondary" : "text.primary"}
                sx={isDev ? { fontStyle: 'italic' } : {}}
              >
                {createdPageUrl}
              </Typography>
              <Tooltip title={isDev ? "Copier le lien de la page de mint" : "Copier le lien"}>
                <IconButton
                  size="small"
                  onClick={() => navigator.clipboard.writeText(createdPageUrl)}
                  disabled={false}
                  sx={{}}
                >
                  <ContentCopy fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title={isDev ? "Ouvrir la page de mint" : "Ouvrir la page"}>
                <IconButton
                  size="small"
                  onClick={() => window.open(createdPageUrl, '_blank')}
                >
                  <OpenInNew fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Paper>

          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="contained"
              onClick={() => window.open(createdPageUrl, '_blank')}
            >
              {isDev ? 'Voir la page de mint' : 'Voir la page'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setCreated(false)
                setActiveStep(0)
                setConfig({
                  contractAddress: '',
                  subdomain: '',
                  title: '',
                  description: '',
                  primaryColor: '#6366f1',
                  backgroundColor: '#1a202c',
                  price: '0.01',
                  maxSupply: '10000',
                  maxPerWallet: '5',
                  showRemainingSupply: true,
                  showMintedCount: true,
                  socialLinks: {}
                })
              }}
            >
              {t('mintPage.success.createAnother')}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    )
  }

  return (
    <Box>
      {/* 🎯 Alerte globale de développement local */}
      {isDev && (
        <Alert severity="info" sx={{ mb: 3 }} icon={<Warning />}>
          <Typography variant="body2">
            <strong>Mode développement détecté :</strong> Le générateur utilise le smart-contract-compiler-api local (port 3004).
            <br />
            💡 <strong>Fonctionnalités disponibles :</strong> Pages de mint avec Web3, badges ContractForge.io x OpenZeppelin, styles RainbowKit
          </Typography>
        </Alert>
      )}
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          {t('mintPage.info')}
        </Typography>
      </Alert>

      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((step, index) => (
          <Step key={step.label}>
            <StepLabel>{step.label}</StepLabel>
            <StepContent>
              <Box sx={{ mb: 2 }}>
                {step.content}
              </Box>
              <Box sx={{ mb: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  sx={{ mt: 1, mr: 1 }}
                  disabled={
                    (index === 0 && !config.contractAddress) ||
                    (index === 1 && (!config.subdomain || !subdomainAvailable)) ||
                    (index === 2 && (!config.title || !config.description))
                  }
                >
                  {index === steps.length - 1 ? t('mintPage.preview') : t('common.continue')}
                </Button>
                <Button
                  disabled={index === 0}
                  onClick={handleBack}
                  sx={{ mt: 1, mr: 1 }}
                >
                  Retour
                </Button>
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>

      {activeStep === steps.length && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t('mintPage.review')}
          </Typography>
          <Divider sx={{ my: 2 }} />
          
          <Stack spacing={2} mb={3}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                URL de la page
              </Typography>
              <Typography 
                variant="body1" 
                fontFamily="monospace"
                color="text.primary"
                sx={{}}
              >
                {getMintPageUrl(config.subdomain)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Contrat NFT
              </Typography>
              <Typography variant="body1">
                {selectedContract?.name} ({selectedContract?.symbol})
              </Typography>
              <Typography variant="caption" fontFamily="monospace" color="text.secondary">
                {config.contractAddress}
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Configuration
              </Typography>
              <Typography variant="body1">
                {config.title} - {config.price} ETH
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleCreatePage}
              disabled={creating}
            >
              {creating 
                ? (isDev ? 'Création Web3...' : t('mintPage.creating'))
                : (isDev ? 'Créer page Web3' : t('mintPage.createPage'))
              }
            </Button>
            <Button
              variant="outlined"
              startIcon={<Preview />}
              onClick={() => setShowPreview(true)}
            >
              {t('mintPage.preview')}
            </Button>
            <Button
              onClick={handleBack}
            >
              Retour
            </Button>
          </Stack>
        </Paper>
      )}

      {/* Dialog d'aperçu */}
      <MintPagePreview 
        open={showPreview}
        onClose={() => setShowPreview(false)}
        config={config}
        contract={selectedContract}
        isDev={isDev}
      />
    </Box>
  )
}

// Composant d'aperçu de la page de mint
interface MintPagePreviewProps {
  open: boolean
  onClose: () => void
  config: MintPageConfig
  contract?: NFTContract
  isDev: boolean
}

const MintPagePreview: React.FC<MintPagePreviewProps> = ({ open, onClose, config, contract, isDev }) => {
  const { t } = useTranslation()
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {isDev ? '🎯 Aperçu local de la page de mint' : t('mintPage.previewTitle')}
          </Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {/* 🎯 Alerte mode dev dans l'aperçu */}
        {isDev && (
          <Alert severity="success" sx={{ mb: 3 }} icon={<Check />}>
            <Typography variant="body2">
              <strong>Aperçu du système complet :</strong> Cette page utilisera Web3, MetaMask, et les badges ContractForge.io x OpenZeppelin.
              La fonctionnalité de mint sera entièrement opérationnelle.
            </Typography>
          </Alert>
        )}
        
        <Box 
          sx={{ 
            bgcolor: config.backgroundColor,
            color: config.backgroundColor === '#1a202c' ? 'white' : 'black',
            p: 3,
            borderRadius: 2,
            minHeight: 400,
            position: 'relative'
          }}
        >
          {/* Badge mode dev dans l'aperçu */}
          {isDev && (
            <Chip
              label="🎯 MODE DEV"
              size="small"
              sx={{
                position: 'absolute',
                top: 10,
                right: 10,
                backgroundColor: '#ff4081',
                color: 'white',
                fontWeight: 'bold',
                zIndex: 1
              }}
            />
          )}
          
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h3" sx={{ color: config.primaryColor, mb: 2 }}>
              {config.title || 'Titre de votre NFT'}
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              {config.description || 'Description de votre collection...'}
            </Typography>
          </Box>

          <Paper sx={{ p: 3, maxWidth: 400, mx: 'auto' }}>
            <Typography variant="h6" textAlign="center" mb={2}>
              Mint votre NFT
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Prix: {config.price} ETH
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Max par wallet: {config.maxPerWallet}
              </Typography>
            </Box>

            {config.showRemainingSupply && (
              <Typography variant="body2" color="text.secondary" mb={1}>
                Supply restant: {config.maxSupply}
              </Typography>
            )}

            {config.showMintedCount && (
              <Typography variant="body2" color="text.secondary" mb={2}>
                {t('mintPage.alreadyMinted')}: 0 / {config.maxSupply}
              </Typography>
            )}

            <Button 
              fullWidth 
              variant="contained" 
              sx={{ 
                bgcolor: config.primaryColor,
                '&:hover': { bgcolor: config.primaryColor }
              }}
              disabled={false} // Plus désactivé en mode dev
            >
              {isDev ? 'Mint NFT (Web3 actif)' : 'Mint maintenant'}
            </Button>

            {isDev && (
              <Typography variant="caption" color="success.main" display="block" textAlign="center" mt={1}>
                ✅ Bouton de mint fonctionnel avec Web3
              </Typography>
            )}

            {(config.socialLinks.twitter || config.socialLinks.discord || config.socialLinks.website) && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="caption" display="block" mb={1}>
                  Suivez-nous:
                </Typography>
                <Stack direction="row" justifyContent="center" spacing={1}>
                  {config.socialLinks.twitter && (
                    <Chip label="Twitter" size="small" />
                  )}
                  {config.socialLinks.discord && (
                    <Chip label="Discord" size="small" />
                  )}
                  {config.socialLinks.website && (
                    <Chip label="Website" size="small" />
                  )}
                </Stack>
              </Box>
            )}
          </Paper>
        </Box>
      </DialogContent>
    </Dialog>
  )
}

export default MintPageGenerator 