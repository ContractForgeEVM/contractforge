import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Paper,
  Typography,
  Box,
  Chip,
  Stack,
  Checkbox,
  FormControlLabel,
  Divider,
  Alert,
  Collapse,
  IconButton,
  Tooltip,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  List,
  ListItem,
  ListItemText,
  InputAdornment,
} from '@mui/material'
import {
  Star as StarIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  LocalOffer as PriceIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material'
import type { ContractTemplate, PremiumFeature, PremiumFeatureConfig } from '../types'
import { getCompatibleFeatures, getTotalPremiumPrice } from '../data/premiumFeatures'
interface PremiumFeaturesProps {
  template: ContractTemplate
  selectedFeatures: string[]
  onFeaturesChange: (features: string[]) => void
  featureConfigs?: PremiumFeatureConfig
  onFeatureConfigChange?: (configs: PremiumFeatureConfig) => void
}
const PremiumFeatures = ({ template, selectedFeatures, onFeaturesChange, featureConfigs, onFeatureConfigChange }: PremiumFeaturesProps) => {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(true)
  const [openDialog, setOpenDialog] = useState<string | null>(null)
  const [newAddress, setNewAddress] = useState('')
  const [addressError, setAddressError] = useState('')
  const [featureConfig, setFeatureConfig] = useState<PremiumFeatureConfig>(featureConfigs || {})
  useEffect(() => {
    if (featureConfigs) {
      console.log('Syncing featureConfig with props:', featureConfigs)
      setFeatureConfig(featureConfigs)
    }
  }, [featureConfigs])
  const [newTaxRate, setNewTaxRate] = useState('')
  const [newTaxRecipient, setNewTaxRecipient] = useState('')
  const [newMaxSupply, setNewMaxSupply] = useState('')
  const [newMultisigSigner, setNewMultisigSigner] = useState('')
  const [newMultisigThreshold, setNewMultisigThreshold] = useState('')
  const [newAirdropAddress, setNewAirdropAddress] = useState('')
  const [newAirdropAmount, setNewAirdropAmount] = useState('')
  const [newTimelockDelay, setNewTimelockDelay] = useState('')
  const [vestingStartTime, setVestingStartTime] = useState('');
  const [vestingDuration, setVestingDuration] = useState('');
  const [vestingCliff, setVestingCliff] = useState('');
  const compatibleFeatures = getCompatibleFeatures(template.id, selectedFeatures)
  const totalPrice = getTotalPremiumPrice(selectedFeatures)
  const handleFeatureToggle = (featureId: string) => {
    const newSelectedFeatures = selectedFeatures.includes(featureId)
      ? selectedFeatures.filter(id => id !== featureId)
      : [...selectedFeatures, featureId]
    onFeaturesChange(newSelectedFeatures)
    if (!newSelectedFeatures.includes(featureId)) {
      const newConfig = { ...featureConfig }
      if (featureId === 'whitelist') {
        delete newConfig.whitelist
      } else if (featureId === 'blacklist') {
        delete newConfig.blacklist
      } else if (featureId === 'tax') {
        delete newConfig.tax
      } else if (featureId === 'capped') {
        delete newConfig.capped
      } else if (featureId === 'vesting') {
        delete newConfig.vesting
      } else if (featureId === 'multisig') {
        delete newConfig.multisig
      } else if (featureId === 'airdrop') {
        delete newConfig.airdrop
      } else if (featureId === 'timelock') {
        delete newConfig.timelock
      }
      setFeatureConfig(newConfig)
      onFeatureConfigChange?.(newConfig)
    }
  }
  const formatPrice = (price: number) => {
    return `$${price.toFixed(3)} ETH`
  }
  const getFeatureName = (feature: PremiumFeature) => {
    const key = `premiumFeatures.${feature.id}.name`
    const translated = t(key)
    return translated !== key ? translated : feature.name
  }
  const getFeatureDescription = (feature: PremiumFeature) => {
    const key = `premiumFeatures.${feature.id}.description`
    const translated = t(key)
    return translated !== key ? translated : feature.description
  }
  const handleOpenConfig = (feature: string) => {
    setOpenDialog(feature)
    setNewAddress('')
    setAddressError('')
    setNewTaxRate('')
    setNewTaxRecipient('')
    setNewMaxSupply('')
    setNewMultisigSigner('')
    setNewMultisigThreshold('')
    setNewTimelockDelay('')
  }
  const handleCloseConfig = () => {
    setOpenDialog(null)
    setNewAddress('')
    setAddressError('')
    setNewTaxRate('')
    setNewTaxRecipient('')
    setNewMaxSupply('')
    setNewMultisigSigner('')
    setNewMultisigThreshold('')
    setNewTimelockDelay('')
  }
  const validateAddress = (address: string): boolean => {
    const addressRegex = /^0x[a-fA-F0-9]{40}$/
    return addressRegex.test(address)
  }
  const getAddressesForFeature = (feature: string): string[] => {
    if (feature === 'whitelist') {
      return featureConfig.whitelist?.addresses || []
    } else if (feature === 'blacklist') {
      return featureConfig.blacklist?.addresses || []
    }
    return []
  }
  const updateAddressesForFeature = (feature: string, addresses: string[]) => {
    const updatedConfig = { ...featureConfig }
    if (feature === 'whitelist') {
      updatedConfig.whitelist = { addresses }
    } else if (feature === 'blacklist') {
      updatedConfig.blacklist = { addresses }
    }
    console.log('Updating addresses for feature:', feature, addresses)
    setFeatureConfig(updatedConfig)
    onFeatureConfigChange?.(updatedConfig)
  }
  const handleAddAddress = (feature: string) => {
    if (!validateAddress(newAddress)) {
      setAddressError('Invalid Ethereum address format')
      return
    }
    const currentAddresses = getAddressesForFeature(feature)
    if (currentAddresses.includes(newAddress.toLowerCase())) {
      setAddressError('Address already in list')
      return
    }
    const updatedAddresses = [...currentAddresses, newAddress.toLowerCase()]
    updateAddressesForFeature(feature, updatedAddresses)
    setNewAddress('')
    setAddressError('')
  }
  const handleRemoveAddress = (feature: string, index: number) => {
    const currentAddresses = getAddressesForFeature(feature)
    const updatedAddresses = currentAddresses.filter((_, i) => i !== index)
    updateAddressesForFeature(feature, updatedAddresses)
  }
  const handleTaxConfigUpdate = (rate: number, recipient: string) => {
    const updatedConfig = { ...featureConfig }
    updatedConfig.tax = { rate, recipient }
    setFeatureConfig(updatedConfig)
    onFeatureConfigChange?.(updatedConfig)
  }
  const handleCappedConfigUpdate = (maxSupply: number) => {
    const updatedConfig = { ...featureConfig }
    updatedConfig.capped = { maxSupply }
    setFeatureConfig(updatedConfig)
    onFeatureConfigChange?.(updatedConfig)
  }
  const handleMultisigConfigUpdate = (signers: string[], threshold: number) => {
    const updatedConfig = { ...featureConfig }
    updatedConfig.multisig = { signers, threshold }
    setFeatureConfig(updatedConfig)
    onFeatureConfigChange?.(updatedConfig)
  }
  const handleTimelockConfigUpdate = (delay: number) => {
    const updatedConfig = { ...featureConfig }
    updatedConfig.timelock = { delay }
    setFeatureConfig(updatedConfig)
    onFeatureConfigChange?.(updatedConfig)
  }
  const handleFileUpload = async (feature: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const content = await file.text()
      const fileName = file.name.toLowerCase()
      let addresses: string[] = []
      if (fileName.endsWith('.json')) {
        const parsed = JSON.parse(content)
        if (Array.isArray(parsed)) {
          addresses = parsed
        } else if (parsed.addresses && Array.isArray(parsed.addresses)) {
          addresses = parsed.addresses
        } else if (parsed.whitelist && Array.isArray(parsed.whitelist)) {
          addresses = parsed.whitelist
        } else if (parsed.blacklist && Array.isArray(parsed.blacklist)) {
          addresses = parsed.blacklist
        } else {
          throw new Error('Invalid JSON format. Expected array or object with addresses field')
        }
      } else if (fileName.endsWith('.csv')) {
        const lines = content.split('\n').filter(line => line.trim())
        const firstLine = lines[0]?.toLowerCase()
        const hasHeader = firstLine?.includes('address') || firstLine?.includes('wallet') ||
                         firstLine?.includes('account') || firstLine?.includes('whitelist') ||
                         firstLine?.includes('blacklist')
        const startIndex = hasHeader ? 1 : 0
        for (let i = startIndex; i < lines.length; i++) {
          const columns = lines[i].split(',').map(col => col.trim())
          const addressColumn = columns.find(col => /^0x[a-fA-F0-9]{40}$/i.test(col))
          if (addressColumn) {
            addresses.push(addressColumn)
          }
        }
      } else if (fileName.endsWith('.txt')) {
        const lines = content.split(/[\n,;]/).map(line => line.trim()).filter(Boolean)
        for (const line of lines) {
          const matches = line.match(/0x[a-fA-F0-9]{40}/gi)
          if (matches) {
            addresses.push(...matches)
          }
        }
      } else {
        throw new Error('Unsupported file format. Please use .json, .csv, or .txt')
      }
      const validAddresses = addresses
        .map(addr => addr.trim())
        .filter(addr => /^0x[a-fA-F0-9]{40}$/i.test(addr))
        .map(addr => addr.toLowerCase())
      const uniqueAddresses = [...new Set(validAddresses)]
      if (uniqueAddresses.length === 0) {
        throw new Error('No valid Ethereum addresses found in the file')
      }
      const currentAddresses = getAddressesForFeature(feature)
      const combinedAddresses = [...new Set([...currentAddresses, ...uniqueAddresses])]
      updateAddressesForFeature(feature, combinedAddresses)
      alert(`Successfully imported ${uniqueAddresses.length} addresses from ${file.name}`)
    } catch (error) {
      console.error('Error parsing file:', error)
      alert(error instanceof Error ? error.message : 'Failed to parse file')
    }
    event.target.value = ''
  }
  const isConfigurableFeature = (featureId: string): boolean => {
    return ['whitelist', 'blacklist', 'tax', 'capped', 'vesting', 'multisig', 'airdrop', 'timelock'].includes(featureId)
  }
  return (
    <Paper
      elevation={1}
      sx={{
        p: 0,
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%)',
        border: '1px solid rgba(139, 92, 246, 0.2)',
      }}
    >
      {}
      <Box
        sx={{
          p: 2.5,
          pb: 1.5,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: expanded ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <StarIcon sx={{ color: 'secondary.main', fontSize: 20 }} />
          <Typography variant="h6" fontWeight={700}>
            {t('premiumFeatures.title')}
          </Typography>
          <Chip
            label={t('premiumFeatures.optional')}
            size="small"
            sx={{
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              color: 'secondary.main',
              fontWeight: 600,
              height: 20,
              '& .MuiChip-label': { px: 1, fontSize: '0.7rem' }
            }}
          />
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center">
          {selectedFeatures.length > 0 && (
            <Chip
              icon={<PriceIcon sx={{ fontSize: 16 }} />}
              label={`+${formatPrice(totalPrice)}`}
              color="secondary"
              sx={{ fontWeight: 700 }}
            />
          )}
          <IconButton onClick={() => setExpanded(!expanded)} size="small">
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Stack>
      </Box>
      <Collapse in={expanded}>
        <Box sx={{ p: 2.5, pt: 2 }}>
          {compatibleFeatures.length === 0 ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              {t('premiumFeatures.noFeatures')}
            </Alert>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.875rem' }}>
                {t('premiumFeatures.description')}
              </Typography>
              <Stack spacing={1}>
                {compatibleFeatures.map((feature) => (
                  <Box
                    key={feature.id}
                    sx={{
                      p: 1.5,
                      borderRadius: 1.5,
                      border: '1px solid',
                      borderColor: selectedFeatures.includes(feature.id)
                        ? 'secondary.main'
                        : 'rgba(255, 255, 255, 0.05)',
                      backgroundColor: selectedFeatures.includes(feature.id)
                        ? 'rgba(139, 92, 246, 0.05)'
                        : 'transparent',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      '&:hover': {
                        borderColor: 'secondary.main',
                        backgroundColor: 'rgba(139, 92, 246, 0.05)',
                      },
                    }}
                    onClick={() => handleFeatureToggle(feature.id)}
                  >
                    <Stack spacing={0.5}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={selectedFeatures.includes(feature.id)}
                              sx={{ p: 0, pr: 0.5 }}
                              color="secondary"
                              size="small"
                            />
                          }
                          label={
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              <Typography variant="h6" fontSize="1.2rem">
                                {feature.icon}
                              </Typography>
                              <Typography variant="body2" fontWeight={600}>
                                {getFeatureName(feature)}
                              </Typography>
                            </Stack>
                          }
                          sx={{ m: 0 }}
                        />
                        <Chip
                          label={formatPrice(feature.price)}
                          size="small"
                          sx={{
                            backgroundColor: 'rgba(99, 102, 241, 0.1)',
                            color: 'primary.main',
                            fontWeight: 600,
                            height: 22,
                            '& .MuiChip-label': { px: 0.5, fontSize: '0.75rem' }
                          }}
                        />
                      </Stack>
                      <Typography variant="caption" color="text.secondary" sx={{ pl: 3.5, display: 'block' }}>
                        {getFeatureDescription(feature)}
                      </Typography>
                      {}
                      {selectedFeatures.includes(feature.id) && isConfigurableFeature(feature.id) && (
                        <Box sx={{ pl: 3.5, mt: 1 }}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<SettingsIcon />}
                            onClick={() => handleOpenConfig(feature.id)}
                            sx={{
                              textTransform: 'none',
                              borderColor: 'secondary.main',
                              color: 'secondary.main',
                              '&:hover': {
                                borderColor: 'secondary.light',
                                backgroundColor: 'rgba(139, 92, 246, 0.1)'
                              }
                            }}
                          >
                            Configure {getFeatureName(feature)}
                            {feature.id === 'whitelist' && getAddressesForFeature('whitelist').length > 0 && (
                              <Chip
                                label={getAddressesForFeature('whitelist').length}
                                size="small"
                                sx={{ ml: 1, height: 20 }}
                              />
                            )}
                            {feature.id === 'blacklist' && getAddressesForFeature('blacklist').length > 0 && (
                              <Chip
                                label={getAddressesForFeature('blacklist').length}
                                size="small"
                                sx={{ ml: 1, height: 20 }}
                              />
                            )}
                          </Button>
                        </Box>
                      )}
                      {feature.incompatibleWith && feature.incompatibleWith.length > 0 && (
                        <Alert severity="warning" sx={{ py: 0.25, px: 1, mt: 0.5 }}>
                          <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                            {t('premiumFeatures.incompatibleWith')}: {
                              feature.incompatibleWith.map(id => {
                                const incompatibleFeature = compatibleFeatures.find(f => f.id === id)
                                return incompatibleFeature ? getFeatureName(incompatibleFeature) : id
                              }).join(', ')
                            }
                          </Typography>
                        </Alert>
                      )}
                    </Stack>
                  </Box>
                ))}
              </Stack>
              {selectedFeatures.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary">
                      {selectedFeatures.length} {selectedFeatures.length !== 1 ? t('premiumFeatures.selectedPlural') : t('premiumFeatures.selected')}
                    </Typography>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Typography variant="caption" color="text.secondary">
                        {t('premiumFeatures.additionalCost')}:
                      </Typography>
                      <Typography variant="body2" color="secondary" fontWeight={700}>
                        {formatPrice(totalPrice)}
                      </Typography>
                      <Tooltip title="Premium features are paid in ETH on top of deployment costs">
                        <InfoIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                      </Tooltip>
                    </Stack>
                  </Stack>
                </>
              )}
            </>
          )}
        </Box>
      </Collapse>
      {}
      {}
      {['whitelist', 'blacklist'].map(feature => (
        <Dialog
          key={feature}
          open={openDialog === feature}
          onClose={handleCloseConfig}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Configure {feature === 'whitelist' ? 'Whitelist' : 'Blacklist'}
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 3 }}>
              {feature === 'whitelist'
                ? 'Configure addresses that are allowed to transfer tokens'
                : 'Configure addresses that are blocked from transfers'
              }
            </DialogContentText>
            {}
            <Box sx={{ mb: 3 }}>
              <input
                type="file"
                accept=".json,.csv,.txt"
                onChange={(e) => handleFileUpload(feature, e)}
                style={{ display: 'none' }}
                id={`${feature}-file-upload`}
              />
              <label htmlFor={`${feature}-file-upload`}>
                <Button
                  component="span"
                  variant="outlined"
                  startIcon={<CloudUploadIcon />}
                  fullWidth
                  sx={{ mb: 1 }}
                >
                  Upload Address File
                </Button>
              </label>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Supported formats:
                <br />
                • JSON: {`["0x123...", "0x456..."]`} or {`{"addresses": ["0x123..."]}`}
                <br />
                • CSV: One address per row or comma-separated
                <br />
                • TXT: One address per line or any delimiter
              </Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
            {}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Manual Entry
              </Typography>
              <TextField
                fullWidth
                label="Ethereum Address"
                value={newAddress}
                onChange={(e) => {
                  setNewAddress(e.target.value)
                  if (addressError) setAddressError('')
                }}
                error={!!addressError}
                helperText={addressError || 'Enter a valid Ethereum address (0x...)'}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddAddress(feature)
                  }
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => handleAddAddress(feature)}
                        disabled={!newAddress || !!addressError}
                        edge="end"
                      >
                        <AddIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            {}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Address List
                {getAddressesForFeature(feature).length > 0 &&
                  ` (${getAddressesForFeature(feature).length})`
                }
              </Typography>
              {getAddressesForFeature(feature).length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  No addresses configured yet
                </Typography>
              ) : (
                <Box sx={{
                  maxHeight: 300,
                  overflowY: 'auto',
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 1
                }}>
                  <List dense>
                    {getAddressesForFeature(feature).map((address: string, index: number) => (
                      <ListItem
                        key={index}
                        secondaryAction={
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={() => handleRemoveAddress(feature, index)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        }
                      >
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                              {address}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
              {getAddressesForFeature(feature).length > 10 && (
                <Typography variant="caption" color="warning.main" sx={{ mt: 1, display: 'block' }}>
                  Large address lists may increase deployment gas costs
                </Typography>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseConfig}>Close</Button>
          </DialogActions>
        </Dialog>
      ))}
      {}
      <Dialog
        open={openDialog === 'tax'}
        onClose={handleCloseConfig}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Configure Transfer Tax</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            Set up automatic tax on token transfers
          </DialogContentText>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Tax Rate (%)"
              type="number"
              value={newTaxRate}
              onChange={(e) => setNewTaxRate(e.target.value)}
              placeholder="2.5"
              helperText="Enter tax rate as percentage (e.g., 2.5 for 2.5%)"
            />
            <TextField
              fullWidth
              label="Tax Recipient Address"
              value={newTaxRecipient}
              onChange={(e) => setNewTaxRecipient(e.target.value)}
              placeholder="0x..."
              helperText="Address that will receive the collected tax"
              error={!!(newTaxRecipient && !validateAddress(newTaxRecipient))}
            />
            {featureConfig.tax && (
              <Alert severity="info">
                Current configuration: {featureConfig.tax.rate}% tax to {featureConfig.tax.recipient}
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfig}>Cancel</Button>
          <Button
            onClick={() => {
              const rate = parseFloat(newTaxRate)
              if (rate > 0 && rate <= 25 && validateAddress(newTaxRecipient)) {
                handleTaxConfigUpdate(rate, newTaxRecipient)
                handleCloseConfig()
              }
            }}
            disabled={!newTaxRate || !newTaxRecipient || !validateAddress(newTaxRecipient)}
          >
            Save Configuration
          </Button>
        </DialogActions>
      </Dialog>
      {}
      <Dialog
        open={openDialog === 'capped'}
        onClose={handleCloseConfig}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Configure Capped Supply</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            Set the maximum token supply that cannot be exceeded
          </DialogContentText>
          <TextField
            fullWidth
            label="Maximum Supply"
            type="number"
            value={newMaxSupply}
            onChange={(e) => setNewMaxSupply(e.target.value)}
            placeholder="1000000"
            helperText="Enter the maximum number of tokens that can ever exist"
          />
          {featureConfig.capped && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Current configuration: Maximum supply of {featureConfig.capped.maxSupply.toLocaleString()} tokens
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfig}>Cancel</Button>
          <Button
            onClick={() => {
              const maxSupply = parseInt(newMaxSupply)
              if (maxSupply > 0) {
                handleCappedConfigUpdate(maxSupply)
                handleCloseConfig()
              }
            }}
            disabled={!newMaxSupply || parseInt(newMaxSupply) <= 0}
          >
            Save Configuration
          </Button>
        </DialogActions>
      </Dialog>
      {}
      <Dialog
        open={openDialog === 'multisig'}
        onClose={handleCloseConfig}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Configure Multi-Signature</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            Set up multi-signature requirements for owner actions
          </DialogContentText>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Signer Address"
              value={newMultisigSigner}
              onChange={(e) => setNewMultisigSigner(e.target.value)}
              placeholder="0x..."
              helperText="Add a signer address"
              error={!!(newMultisigSigner && !validateAddress(newMultisigSigner))}
            />
            <TextField
              fullWidth
              label="Required Signatures"
              type="number"
              value={newMultisigThreshold}
              onChange={(e) => setNewMultisigThreshold(e.target.value)}
              placeholder="2"
              helperText="Number of signatures required to execute actions"
            />
            {featureConfig.multisig && (
              <Alert severity="info">
                Current configuration: {featureConfig.multisig.threshold} of {featureConfig.multisig.signers.length} signatures required
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfig}>Cancel</Button>
          <Button
            onClick={() => {
              const threshold = parseInt(newMultisigThreshold)
              if (validateAddress(newMultisigSigner) && threshold > 0) {
                const currentSigners = featureConfig.multisig?.signers || []
                const newSigners = [...currentSigners, newMultisigSigner.toLowerCase()]
                handleMultisigConfigUpdate(newSigners, threshold)
                setNewMultisigSigner('')
              }
            }}
            disabled={!newMultisigSigner || !newMultisigThreshold || !validateAddress(newMultisigSigner)}
          >
            Add Signer
          </Button>
        </DialogActions>
      </Dialog>
      {}
      <Dialog
        open={openDialog === 'timelock'}
        onClose={handleCloseConfig}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Configure Timelock</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            Set the delay for critical function executions
          </DialogContentText>
          <TextField
            fullWidth
            label="Delay (seconds)"
            type="number"
            value={newTimelockDelay}
            onChange={(e) => setNewTimelockDelay(e.target.value)}
            placeholder="86400"
            helperText="Delay in seconds before critical functions can be executed (86400 = 24 hours)"
          />
          {featureConfig.timelock && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Current configuration: {featureConfig.timelock.delay} seconds delay
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfig}>Cancel</Button>
          <Button
            onClick={() => {
              const delay = parseInt(newTimelockDelay)
              if (delay > 0) {
                handleTimelockConfigUpdate(delay)
                handleCloseConfig()
              }
            }}
            disabled={!newTimelockDelay || parseInt(newTimelockDelay) <= 0}
          >
            Save Configuration
          </Button>
        </DialogActions>
      </Dialog>
      {}
      <Dialog
        open={openDialog === 'airdrop'}
        onClose={handleCloseConfig}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Configure Batch Airdrop</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            Add addresses and amounts for the batch airdrop.
          </DialogContentText>
          <Stack spacing={2}>
            {}
            <Box sx={{ mb: 1 }}>
              <input
                type="file"
                accept=".json,.csv,.txt"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  try {
                    const content = await file.text()
                    const fileName = file.name.toLowerCase()
                    let recipients: { address: string; amount: number }[] = []
                    if (fileName.endsWith('.json')) {
                      const parsed = JSON.parse(content)
                      if (Array.isArray(parsed)) {
                        recipients = parsed.filter(
                          (r) => r.address && validateAddress(r.address) && r.amount > 0
                        ).map(r => ({ address: r.address.toLowerCase(), amount: Number(r.amount) }))
                      } else {
                        throw new Error('Invalid JSON format. Expected array of {address, amount}')
                      }
                    } else if (fileName.endsWith('.csv')) {
                      const lines = content.split(/\r?\n/).filter(line => line.trim())
                      let startIndex = 0
                      if (lines[0].toLowerCase().includes('address') && lines[0].toLowerCase().includes('amount')) {
                        startIndex = 1
                      }
                      for (let i = startIndex; i < lines.length; i++) {
                        const cols = lines[i].split(/[,;\t ]/).map(c => c.trim()).filter(Boolean)
                        const addr = cols.find(col => /^0x[a-fA-F0-9]{40}$/.test(col))
                        const amt = cols.find(col => /^\d+(\.\d+)?$/.test(col))
                        if (addr && amt && validateAddress(addr)) {
                          recipients.push({ address: addr.toLowerCase(), amount: Number(amt) })
                        }
                      }
                    } else if (fileName.endsWith('.txt')) {
                      const lines = content.split(/\r?\n/).filter(line => line.trim())
                      for (const line of lines) {
                        const parts = line.split(/[,;\t ]/).map(p => p.trim()).filter(Boolean)
                        const addr = parts.find(col => /^0x[a-fA-F0-9]{40}$/.test(col))
                        const amt = parts.find(col => /^\d+(\.\d+)?$/.test(col))
                        if (addr && amt && validateAddress(addr)) {
                          recipients.push({ address: addr.toLowerCase(), amount: Number(amt) })
                        }
                      }
                    } else {
                      throw new Error('Unsupported file format. Please use .json, .csv, or .txt')
                    }
                    if (recipients.length === 0) throw new Error('No valid recipients found in the file')
                    const existing = featureConfig.airdrop?.recipients || []
                    const merged = [...existing, ...recipients]
                    const updatedConfig = { ...featureConfig, airdrop: { recipients: merged } }
                    setFeatureConfig(updatedConfig)
                    onFeatureConfigChange?.(updatedConfig)
                    alert(`Successfully imported ${recipients.length} recipients from ${file.name}`)
                  } catch (err) {
                    alert(err instanceof Error ? err.message : 'Failed to parse file')
                  }
                  e.target.value = ''
                }}
                style={{ display: 'none' }}
                id="airdrop-file-upload"
              />
              <label htmlFor="airdrop-file-upload">
                <Button
                  component="span"
                  variant="outlined"
                  startIcon={<CloudUploadIcon />}
                  fullWidth
                  sx={{ mb: 1 }}
                >
                  Upload Recipients File
                </Button>
              </label>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Supported formats:<br />
                • JSON: [{'{'}"address": "0x...", "amount": 1000{'}'}]<br />
                • CSV: address,amount<br />
                • TXT: 0x... 1000 (one per line)
              </Typography>
            </Box>
            {}
            <TextField
              fullWidth
              label="Recipient Address"
              value={newAirdropAddress}
              onChange={e => setNewAirdropAddress(e.target.value)}
              placeholder="0x..."
              helperText="Enter a valid Ethereum address"
              error={!!(newAirdropAddress && !validateAddress(newAirdropAddress))}
            />
            <TextField
              fullWidth
              label="Amount"
              type="number"
              value={newAirdropAmount}
              onChange={e => setNewAirdropAmount(e.target.value)}
              placeholder="1000"
              helperText="Enter the amount to airdrop"
            />
            <Button
              onClick={() => {
                if (!validateAddress(newAirdropAddress) || !newAirdropAmount) return;
                const recipients = [
                  ...(featureConfig.airdrop?.recipients || []),
                  { address: newAirdropAddress.toLowerCase(), amount: Number(newAirdropAmount) }
                ];
                const updatedConfig = { ...featureConfig, airdrop: { recipients } };
                setFeatureConfig(updatedConfig);
                onFeatureConfigChange?.(updatedConfig);
                setNewAirdropAddress('');
                setNewAirdropAmount('');
              }}
              disabled={!newAirdropAddress || !newAirdropAmount || !validateAddress(newAirdropAddress)}
            >
              Add Recipient
            </Button>
            {}
            <List dense>
              {(featureConfig.airdrop?.recipients || []).map((r, i) => (
                <ListItem
                  key={i}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => {
                        const recipients = featureConfig.airdrop?.recipients?.filter((_, idx) => idx !== i) || [];
                        const updatedConfig = { ...featureConfig, airdrop: { recipients } };
                        setFeatureConfig(updatedConfig);
                        onFeatureConfigChange?.(updatedConfig);
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <ListItemText
                    primary={`${r.address} — ${r.amount}`}
                    primaryTypographyProps={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
                  />
                </ListItem>
              ))}
            </List>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfig}>Close</Button>
        </DialogActions>
      </Dialog>
      {}
      <Dialog
        open={openDialog === 'vesting'}
        onClose={handleCloseConfig}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Configure Vesting Schedule</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            Add vesting schedules (beneficiary, amount, start time, duration, cliff).
          </DialogContentText>
          <Stack spacing={2}>
            {}
            <Box sx={{ mb: 1 }}>
              <input
                type="file"
                accept=".json,.csv,.txt"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  try {
                    const content = await file.text()
                    const fileName = file.name.toLowerCase()
                    let schedules: { beneficiary: string; amount: number; startTime: number; duration: number; cliff: number }[] = []
                    if (fileName.endsWith('.json')) {
                      const parsed = JSON.parse(content)
                      if (Array.isArray(parsed)) {
                        schedules = parsed.filter(
                          (s) => s.beneficiary && validateAddress(s.beneficiary) && s.amount > 0 && s.startTime && s.duration > 0 && s.cliff >= 0
                        ).map(s => ({
                          beneficiary: s.beneficiary.toLowerCase(),
                          amount: Number(s.amount),
                          startTime: Number(s.startTime),
                          duration: Number(s.duration),
                          cliff: Number(s.cliff)
                        }))
                      } else {
                        throw new Error('Invalid JSON format. Expected array of vesting schedules')
                      }
                    } else if (fileName.endsWith('.csv')) {
                      const lines = content.split(/\r?\n/).filter(line => line.trim())
                      let startIndex = 0
                      if (lines[0].toLowerCase().includes('beneficiary')) {
                        startIndex = 1
                      }
                      for (let i = startIndex; i < lines.length; i++) {
                        const cols = lines[i].split(/[,;\t ]/).map(c => c.trim()).filter(Boolean)
                        const ben = cols.find(col => /^0x[a-fA-F0-9]{40}$/.test(col))
                        const amt = cols.find(col => /^\d+(\.\d+)?$/.test(col))
                        const start = cols.find(col => /^\d{8,}$/.test(col))
                        const dur = cols.length > 2 ? Number(cols[cols.length-2]) : undefined
                        const cliff = cols.length > 3 ? Number(cols[cols.length-1]) : undefined
                        if (ben && amt && start && dur && cliff !== undefined && validateAddress(ben)) {
                          schedules.push({
                            beneficiary: ben.toLowerCase(),
                            amount: Number(amt),
                            startTime: Number(start),
                            duration: Number(dur),
                            cliff: Number(cliff)
                          })
                        }
                      }
                    } else if (fileName.endsWith('.txt')) {
                      const lines = content.split(/\r?\n/).filter(line => line.trim())
                      for (const line of lines) {
                        const parts = line.split(/[,;\t ]/).map(p => p.trim()).filter(Boolean)
                        const ben = parts.find(col => /^0x[a-fA-F0-9]{40}$/.test(col))
                        const amt = parts.find(col => /^\d+(\.\d+)?$/.test(col))
                        const start = parts.find(col => /^\d{8,}$/.test(col))
                        const dur = parts.length > 2 ? Number(parts[parts.length-2]) : undefined
                        const cliff = parts.length > 3 ? Number(parts[parts.length-1]) : undefined
                        if (ben && amt && start && dur && cliff !== undefined && validateAddress(ben)) {
                          schedules.push({
                            beneficiary: ben.toLowerCase(),
                            amount: Number(amt),
                            startTime: Number(start),
                            duration: Number(dur),
                            cliff: Number(cliff)
                          })
                        }
                      }
                    } else {
                      throw new Error('Unsupported file format. Please use .json, .csv, or .txt')
                    }
                    if (schedules.length === 0) throw new Error('No valid vesting schedules found in the file')
                    const existing = featureConfig.vesting?.schedules || []
                    const merged = [...existing, ...schedules]
                    const updatedConfig = { ...featureConfig, vesting: { schedules: merged } }
                    setFeatureConfig(updatedConfig)
                    onFeatureConfigChange?.(updatedConfig)
                    alert(`Successfully imported ${schedules.length} vesting schedules from ${file.name}`)
                  } catch (err) {
                    alert(err instanceof Error ? err.message : 'Failed to parse file')
                  }
                  e.target.value = ''
                }}
                style={{ display: 'none' }}
                id="vesting-file-upload"
              />
              <label htmlFor="vesting-file-upload">
                <Button
                  component="span"
                  variant="outlined"
                  startIcon={<CloudUploadIcon />}
                  fullWidth
                  sx={{ mb: 1 }}
                >
                  Upload Vesting File
                </Button>
              </label>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Supported formats:<br />
                • JSON: [{'{'}"beneficiary": "0x...", "amount": 1000, "startTime": 1700000000, "duration": 31536000, "cliff": 15768000{'}'}]<br />
                • CSV: beneficiary,amount,startTime,duration,cliff<br />
                • TXT: 0x... 1000 1700000000 31536000 15768000 (one per line)
              </Typography>
            </Box>
            {}
            <TextField
              fullWidth
              label="Beneficiary Address"
              value={newAirdropAddress}
              onChange={e => setNewAirdropAddress(e.target.value)}
              placeholder="0x..."
              helperText="Enter a valid Ethereum address"
              error={!!(newAirdropAddress && !validateAddress(newAirdropAddress))}
            />
            <TextField
              fullWidth
              label="Amount"
              type="number"
              value={newAirdropAmount}
              onChange={e => setNewAirdropAmount(e.target.value)}
              placeholder="1000"
              helperText="Enter the amount to vest"
            />
            <TextField
              fullWidth
              label="Start Time (timestamp)"
              type="number"
              value={vestingStartTime}
              onChange={e => setVestingStartTime(e.target.value)}
              placeholder="1700000000"
              helperText="Unix timestamp (e.g. 1700000000)"
            />
            <TextField
              fullWidth
              label="Duration (seconds)"
              type="number"
              value={vestingDuration}
              onChange={e => setVestingDuration(e.target.value)}
              placeholder="31536000"
              helperText="Total duration in seconds (e.g. 31536000 = 1 year)"
            />
            <TextField
              fullWidth
              label="Cliff (seconds)"
              type="number"
              value={vestingCliff}
              onChange={e => setVestingCliff(e.target.value)}
              placeholder="15768000"
              helperText="Cliff period in seconds (e.g. 15768000 = 6 months)"
            />
            <Button
              onClick={() => {
                if (!validateAddress(newAirdropAddress) || !newAirdropAmount || !vestingStartTime || !vestingDuration || vestingCliff === undefined) return;
                const schedules = [
                  ...(featureConfig.vesting?.schedules || []),
                  {
                    beneficiary: newAirdropAddress.toLowerCase(),
                    amount: Number(newAirdropAmount),
                    startTime: Number(vestingStartTime),
                    duration: Number(vestingDuration),
                    cliff: Number(vestingCliff)
                  }
                ];
                const updatedConfig = { ...featureConfig, vesting: { schedules } };
                setFeatureConfig(updatedConfig);
                onFeatureConfigChange?.(updatedConfig);
                setNewAirdropAddress('');
                setNewAirdropAmount('');
                setVestingStartTime('');
                setVestingDuration('');
                setVestingCliff('');
              }}
              disabled={!newAirdropAddress || !newAirdropAmount || !vestingStartTime || !vestingDuration || vestingCliff === undefined || !validateAddress(newAirdropAddress)}
            >
              Add Vesting Schedule
            </Button>
            {}
            <List dense>
              {(featureConfig.vesting?.schedules || []).map((s, i) => (
                <ListItem
                  key={i}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => {
                        const schedules = featureConfig.vesting?.schedules?.filter((_, idx) => idx !== i) || [];
                        const updatedConfig = { ...featureConfig, vesting: { schedules } };
                        setFeatureConfig(updatedConfig);
                        onFeatureConfigChange?.(updatedConfig);
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <ListItemText
                    primary={`${s.beneficiary} — ${s.amount} — ${s.startTime} — ${s.duration} — ${s.cliff}`}
                    primaryTypographyProps={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
                  />
                </ListItem>
              ))}
            </List>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfig}>Close</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  )
}
export default PremiumFeatures