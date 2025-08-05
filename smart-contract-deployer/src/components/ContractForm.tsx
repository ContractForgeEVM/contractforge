import { useState, useEffect } from 'react'
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  IconButton,
  Alert,
  CircularProgress,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import { ArrowBack, Lock, Star } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { useAccount } from 'wagmi'
import type { ContractTemplate } from '../types'
import { useDeploymentPermissions } from '../hooks/useDeploymentPermissions'
import { getGasRecommendations } from '../utils/gasEstimator'


interface ContractFormProps {
  template: ContractTemplate
  onChange: (params: Record<string, any>) => void
  onBack: () => void
  onDeploy: () => void
  isDeploying: boolean
}
const ContractForm = ({ template, onChange, onBack, onDeploy, isDeploying }: ContractFormProps) => {
  const { t } = useTranslation()
  const { isConnected } = useAccount()
  const { permissions, loading: permissionsLoading } = useDeploymentPermissions()
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const initialData: Record<string, any> = {}
    template.fields.forEach(field => {
      initialData[field.name] = field.defaultValue || ''
    })
    setFormData(initialData)
    onChange(initialData)
  }, [template])
  const handleChange = (fieldName: string, value: any) => {
    const newData = { ...formData, [fieldName]: value }
    setFormData(newData)
    onChange(newData)
    if (errors[fieldName]) {
      setErrors({ ...errors, [fieldName]: '' })
    }
  }
  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    template.fields.forEach(field => {
      if (field.validation?.required && !formData[field.name]) {
        newErrors[field.name] = t('contractForm.required')
      }
      if (field.type === 'address' && formData[field.name]) {
        const addressRegex = /^0x[a-fA-F0-9]{40}$/
        if (!addressRegex.test(formData[field.name])) {
          newErrors[field.name] = t('contractForm.invalidAddress')
        }
      }
      if (field.type === 'number' && formData[field.name]) {
        const num = Number(formData[field.name])
        if (isNaN(num) || num < 0) {
          newErrors[field.name] = t('contractForm.invalidNumber')
        }
      }
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  const handleDeploy = () => {
    if (validateForm()) {
      onDeploy()
    }
  }
  const showWarning = template.id === 'dao' || template.id === 'lock'
  const gasRecommendations = getGasRecommendations(template.id)
  
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        background: 'linear-gradient(135deg, rgba(26, 32, 46, 0.9) 0%, rgba(17, 24, 39, 0.95) 100%)',
        backdropFilter: 'blur(10px)',
        border: '1px solid',
        borderColor: 'rgba(92, 107, 192, 0.2)',
        borderRadius: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={onBack} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {t(`templates.${template.id}.name`)}
        </Typography>
      </Box>
      {showWarning && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {template.id === 'dao' && t('contractForm.daoWarning', 'DAO contracts require an existing governance token. This template is for demonstration purposes.')}
          {template.id === 'lock' && t('contractForm.lockWarning', 'Token Lock contracts require an existing ERC20 token address to lock.')}
        </Alert>
      )}
      

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {template.fields.map((field) => {
          if (field.type === 'select') {
            return (
              <FormControl key={field.name} fullWidth error={!!errors[field.name]}>
                <InputLabel>{t(`templates.${template.id}.fields.${field.name}`) || field.label}</InputLabel>
                <Select
                  value={formData[field.name] || field.defaultValue || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  label={t(`templates.${template.id}.fields.${field.name}`) || field.label}
                  required={field.validation?.required}
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(92, 107, 192, 0.3)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(92, 107, 192, 0.5)',
                    },
                  }}
                >
                  {field.options?.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors[field.name] && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {errors[field.name]}
                  </Typography>
                )}
              </FormControl>
            )
          }

          if (field.type === 'boolean') {
            return (
              <FormControlLabel
                key={field.name}
                control={
                  <Switch
                    checked={formData[field.name] || field.defaultValue || false}
                    onChange={(e) => handleChange(field.name, e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#5C6BC0',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#5C6BC0',
                      },
                    }}
                  />
                }
                label={t(`templates.${template.id}.fields.${field.name}`) || field.label}
                sx={{
                  '& .MuiFormControlLabel-label': {
                    color: 'text.primary',
                  },
                }}
              />
            )
          }

          return (
            <TextField
              key={field.name}
              label={t(`templates.${template.id}.fields.${field.name}`) || field.label}
              value={formData[field.name] || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              type={field.type === 'number' ? 'number' : 'text'}
              required={field.validation?.required}
              error={!!errors[field.name]}
              helperText={errors[field.name] || t(`templates.${template.id}.placeholders.${field.name}`, { defaultValue: field.placeholder })}
              fullWidth
              variant="outlined"
              InputProps={{
                ...(field.type === 'datetime' && {
                  type: 'datetime-local',
                }),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'rgba(92, 107, 192, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(92, 107, 192, 0.5)',
                  },
                },
              }}
            />
          )
        })}
      </Box>
      {}
      {permissions && !permissionsLoading && (
        <Box sx={{ mt: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Current Plan:
            </Typography>
            <Chip
              label={permissions.plan.charAt(0).toUpperCase() + permissions.plan.slice(1)}
              size="small"
              color={permissions.plan === 'free' ? 'default' : 'primary'}
              icon={permissions.plan === 'free' ? <Lock /> : <Star />}
            />
            <Chip
              label={`${permissions.platformFeeRate}% fees`}
              size="small"
              color={permissions.platformFeeRate < 2.0 ? 'success' : 'default'}
              variant="outlined"
            />
          </Box>

          {permissions.hasSubscriptionLimits && !permissions.payAsYouGo && (
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Subscription active:</strong> Enjoy {permissions.platformFeeRate}% fees
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                Monthly deployment limits and premium features included
              </Typography>
            </Alert>
          )}
        </Box>
      )}


      <Button
        variant="contained"
        fullWidth
        onClick={handleDeploy}
        disabled={!isConnected || isDeploying || !permissions?.canDeploy || permissionsLoading}
        startIcon={isDeploying ? <CircularProgress size={20} color="inherit" /> : null}
        sx={{
          mt: 2,
          py: 1.5,
          background: 'linear-gradient(135deg, #5C6BC0 0%, #7E57C2 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #5C6BC0 0%, #7E57C2 100%)',
            opacity: 0.9,
          },
          '&:disabled': {
            background: 'rgba(255, 255, 255, 0.1)',
          },
        }}
      >
        {!isConnected
          ? t('contractForm.connectWallet')
          : permissionsLoading
          ? 'Loading permissions...'
          : isDeploying
          ? t('contractForm.deploying')
          : !permissions?.canDeploy
          ? 'Deploy not allowed'
          : t('contractForm.deploy')
        }
      </Button>


    </Paper>
  )
}
export default ContractForm