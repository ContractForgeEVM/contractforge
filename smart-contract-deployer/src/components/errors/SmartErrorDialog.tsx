import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  PlayArrow as PlayArrowIcon,
  Launch as LaunchIcon,
  Build as BuildIcon,
  Person as PersonIcon,
  Link as LinkIcon
} from '@mui/icons-material'
import { SmartError, Solution, ErrorSeverity } from '../../utils/errorSystem/types'
import { ErrorAnalytics } from '../../utils/errorSystem/ErrorAnalytics'

interface SmartErrorDialogProps {
  error: SmartError | null
  open: boolean
  onClose: () => void
  onRetry?: () => void
}

export const SmartErrorDialog: React.FC<SmartErrorDialogProps> = ({
  error,
  open,
  onClose,
  onRetry
}) => {
  const { t } = useTranslation()
  const [executingSolution, setExecutingSolution] = useState<string | null>(null)
  const [executedSolutions, setExecutedSolutions] = useState<Set<string>>(new Set())

  if (!error) return null

  const getSeverityIcon = (severity: ErrorSeverity) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <ErrorIcon color="error" />
      case 'medium':
        return <WarningIcon color="warning" />
      default:
        return <InfoIcon color="info" />
    }
  }

  const getSeverityColor = (severity: ErrorSeverity) => {
    switch (severity) {
      case 'critical':
        return 'error'
      case 'high':
        return 'error'
      case 'medium':
        return 'warning'  
      default:
        return 'info'
    }
  }

  const getSeverityLabel = (severity: ErrorSeverity) => {
    return t(`smartErrors.severity.${severity}`)
  }

  const getCategoryLabel = (category: string) => {
    return t(`smartErrors.category.${category}`)
  }

  const getSolutionIcon = (solution: Solution, isExecuted: boolean, isExecuting: boolean) => {
    if (isExecuted) {
      return <CheckCircleIcon color="success" />
    }
    if (isExecuting) {
      return <CircularProgress size={20} />
    }
    
    switch (solution.type) {
      case 'automatic':
        return <BuildIcon color="primary" />
      case 'link':
        return <LinkIcon color="primary" />
      default:
        return <PersonIcon color="primary" />
    }
  }

  const handleExecuteSolution = async (solution: Solution) => {
    if (!solution.action) return

    setExecutingSolution(solution.titleKey)
    try {
      await solution.action()
      setExecutedSolutions(prev => new Set(prev).add(solution.titleKey))
      
      ErrorAnalytics.trackResolution(error.id, 'automatic')
    } catch (err) {
      console.error('Solution execution failed:', err)
    } finally {
      setExecutingSolution(null)
    }
  }

  const handleClose = () => {
    ErrorAnalytics.trackResolution(error.id, 'manual')
    onClose()
  }

  const handleRetry = () => {
    if (onRetry) {
      ErrorAnalytics.trackResolution(error.id, 'retry')
      onRetry()
    }
  }

  const renderSolution = (solution: Solution, index: number) => {
    const isExecuting = executingSolution === solution.titleKey
    const isExecuted = executedSolutions.has(solution.titleKey)

    return (
      <ListItem key={`${solution.titleKey}-${index}`} sx={{ px: 0 }}>
        <ListItemIcon>
          {getSolutionIcon(solution, isExecuted, isExecuting)}
        </ListItemIcon>
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="subtitle2" component="span">
                {t(solution.titleKey)}
              </Typography>
              
              {solution.type === 'automatic' && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleExecuteSolution(solution)}
                  disabled={isExecuting || isExecuted}
                  startIcon={isExecuting ? <CircularProgress size={16} /> : <BuildIcon />}
                  sx={{ minWidth: 'auto' }}
                >
                  {isExecuted 
                    ? t('smartErrors.solutions.executed') 
                    : isExecuting 
                      ? t('smartErrors.solutions.executing')
                      : t('smartErrors.solutions.autoFix')
                  }
                </Button>
              )}
              
              {solution.type === 'link' && (
                <Button
                  size="small"
                  variant="text"
                  startIcon={<LaunchIcon />}
                  onClick={() => window.open(error.helpUrl, '_blank')}
                  sx={{ minWidth: 'auto' }}
                >
                  {t('smartErrors.solutions.openHelp')}
                </Button>
              )}
            </Box>
          }
          secondary={t(solution.descriptionKey)}
        />
      </ListItem>
    )
  }

  const renderContextInfo = () => {
    if (!error.context) return null

    const contextItems = [
      { key: 'template', icon: '📋', value: error.context.template },
      { key: 'network', icon: '🌐', value: error.context.network },
      { key: 'userBalance', icon: '💰', value: error.context.userBalance },
      { key: 'estimatedCost', icon: '⛽', value: error.context.estimatedCost },
      { key: 'gasPrice', icon: '🔥', value: error.context.gasPrice },
      { key: 'features', icon: '⭐', value: error.context.features?.join(', ') }
    ].filter(item => item.value)

         return (
       <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 }}>
         {contextItems.map(item => (
           <Card variant="outlined" sx={{ p: 1 }} key={item.key}>
             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
               <Typography variant="body2" component="span">
                 {item.icon}
               </Typography>
               <Typography variant="caption" color="text.secondary">
                 {t(`smartErrors.context.${item.key}`)}:
               </Typography>
               <Typography variant="body2" sx={{ fontWeight: 500 }}>
                 {item.value}
               </Typography>
             </Box>
           </Card>
         ))}
       </Box>
     )
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { maxHeight: '90vh' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getSeverityIcon(error.severity)}
          <Typography variant="h6" component="span">
            {t(error.titleKey)}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
          <Chip 
            label={getCategoryLabel(error.category)}
            size="small" 
            variant="outlined"
          />
          <Chip 
            label={getSeverityLabel(error.severity)}
            size="small" 
            color={getSeverityColor(error.severity) as any}
          />
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pb: 1 }}>
        <Alert 
          severity={getSeverityColor(error.severity) as any} 
          sx={{ mb: 3 }}
        >
          {t(error.messageKey, error.messageParams)}
        </Alert>

        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          💡 {t('smartErrors.solutions.title')}
        </Typography>
        <List dense sx={{ mb: 2 }}>
          {error.solutions.map(renderSolution)}
        </List>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              📊 {t('smartErrors.context.title')}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {renderContextInfo()}
          </AccordionDetails>
        </Accordion>

        <Accordion sx={{ mt: 1 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              🔧 {t('smartErrors.technical.title')}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography 
              variant="body2" 
              component="pre" 
              sx={{ 
                backgroundColor: 'grey.100', 
                p: 2, 
                borderRadius: 1,
                fontSize: '0.75rem',
                overflow: 'auto',
                maxHeight: '200px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}
            >
              {error.technical}
            </Typography>
          </AccordionDetails>
        </Accordion>
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 1 }}>
        {error.helpUrl && (
          <Button 
            startIcon={<LaunchIcon />}
            onClick={() => window.open(error.helpUrl, '_blank')}
            sx={{ mr: 'auto' }}
          >
            {t('smartErrors.actions.documentation')}
          </Button>
        )}
        
        <Button onClick={handleClose}>
          {t('smartErrors.actions.close')}
        </Button>
        
        {error.canRetry && onRetry && (
          <Button 
            variant="contained" 
            onClick={handleRetry}
            startIcon={<PlayArrowIcon />}
          >
            {t('smartErrors.actions.retry')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
} 