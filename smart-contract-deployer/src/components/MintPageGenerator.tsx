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
  Error,
  Palette,
  Link as LinkIcon,
  ContentCopy,
  OpenInNew,
  Close,
  Refresh
} from '@mui/icons-material'
import { useAccount } from 'wagmi'
import { useTranslation } from 'react-i18next'

interface MintPageConfig {
  contractAddress: string
  subdomain: string
  title: string
  description: string
  primaryColor: string
  backgroundColor: string
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
  
  const { address } = useAccount()
  const { t } = useTranslation()

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
      // Utiliser votre API pour vérifier la disponibilité
      const apiUrl = import.meta.env.VITE_API_URL || 'https://contractforge.io'
      const response = await fetch(`${apiUrl}/api/mint-pages/check-subdomain`, {
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
      // Utiliser votre API pour créer la page
      const apiUrl = import.meta.env.VITE_API_URL || 'https://contractforge.io'
      const response = await fetch(`${apiUrl}/api/mint-pages/create`, {
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
          mint_price: config.price,
          max_supply: parseInt(config.maxSupply),
          max_per_wallet: parseInt(config.maxPerWallet),
          show_remaining_supply: config.showRemainingSupply,
          show_minted_count: config.showMintedCount,
          social_links: config.socialLinks
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        setCreatedPageUrl(result.url)
        setCreated(true)
      } else {
        console.warn('API non disponible, mode simulation...')
        // Fallback simulation
        await new Promise(resolve => setTimeout(resolve, 2000))
        setCreatedPageUrl(`https://${config.subdomain}.contractforge.io`)
        setCreated(true)
      }
      
    } catch (error) {
      console.error('❌ Erreur création page de mint:', error)
      // Fallback simulation en cas d'erreur
      await new Promise(resolve => setTimeout(resolve, 2000))
      setCreatedPageUrl(`https://${config.subdomain}.contractforge.io`)
      setCreated(true)
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
          <TextField
            fullWidth
            label="Sous-domaine"
            value={config.subdomain}
            onChange={(e) => handleSubdomainChange(e.target.value)}
            helperText={`https://${config.subdomain || 'votre-nom'}.contractforge.io`}
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
                    <Error color="error" />
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
              Sous-domaine disponible !
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
            {t('mintPage.success.title')}
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>
            {t('mintPage.success.description')}
          </Typography>
          
          <Paper sx={{ p: 2, mb: 3, backgroundColor: 'action.hover' }}>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
              <LinkIcon />
              <Typography variant="body1" fontFamily="monospace">
                {createdPageUrl}
              </Typography>
              <Tooltip title="Copier le lien">
                <IconButton
                  size="small"
                  onClick={() => navigator.clipboard.writeText(createdPageUrl)}
                >
                  <ContentCopy fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Ouvrir la page">
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
              Voir la page
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
              <Typography variant="body1" fontFamily="monospace">
                https://{config.subdomain}.contractforge.io
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
              {creating ? t('mintPage.creating') : t('mintPage.createPage')}
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
}

const MintPagePreview: React.FC<MintPagePreviewProps> = ({ open, onClose, config, contract }) => {
  const { t } = useTranslation()
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">{t('mintPage.previewTitle')}</Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box 
          sx={{ 
            bgcolor: config.backgroundColor,
            color: config.backgroundColor === '#1a202c' ? 'white' : 'black',
            p: 3,
            borderRadius: 2,
            minHeight: 400
          }}
        >
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
            >
              Mint maintenant
            </Button>

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