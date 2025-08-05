import React, { useState, useCallback } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  LinearProgress,
  Alert,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Rating,
  Paper,
  Divider,
  Container,
  Fade,
  Slide,
  Fab,
  Tooltip
} from '@mui/material'
import {
  Security as SecurityIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  BugReport as BugIcon,
  Shield as ShieldIcon,
  Timer as TimerIcon,
  Settings as SettingsIcon,
  Code as CodeIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { useSecurityAudit, AuditResult, SecurityIssue } from '../services/securityAuditor'
import { contractToast } from './notifications'
import { AUDIT_EXAMPLES_WITH_INFO, AuditExample } from '../data/auditExamples'

interface SecurityAuditInterfaceProps {
  onAuditComplete?: (result: AuditResult) => void
  initialSourceCode?: string
  contractName?: string
}

const SecurityAuditInterface: React.FC<SecurityAuditInterfaceProps> = ({
  onAuditComplete,
  initialSourceCode = '',
  contractName = ''
}) => {
  const { t } = useTranslation()
  const { auditContract } = useSecurityAudit()

  const [sourceCode, setSourceCode] = useState(initialSourceCode)
  const [contractNameInput, setContractNameInput] = useState(contractName)
  const [isAuditing, setIsAuditing] = useState(false)
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null)
  const [showExamplesDialog, setShowExamplesDialog] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const handleAudit = async () => {
    if (!sourceCode.trim()) {
      contractToast.error('Veuillez entrer le code source du contrat')
      return
    }

    if (!contractNameInput.trim()) {
      contractToast.error('Veuillez entrer le nom du contrat')
      return
    }

    setIsAuditing(true)
    setShowResults(false)
    
    try {
      const result = await auditContract(sourceCode, contractNameInput)
      setAuditResult(result)
      setShowResults(true)
      
      if (result.passed) {
        contractToast.success(`Audit réussi ! Score: ${result.score}/100 (${result.grade})`)
      } else {
        contractToast.warning(`Audit échoué. Score: ${result.score}/100 (${result.grade})`)
      }

      if (onAuditComplete) {
        onAuditComplete(result)
      }
    } catch (error) {
      console.error('Audit error:', error)
      contractToast.error('Erreur lors de l\'audit')
    } finally {
      setIsAuditing(false)
    }
  }

  const resetAudit = () => {
    setAuditResult(null)
    setShowResults(false)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'error'
      case 'HIGH': return 'warning'
      case 'MEDIUM': return 'info'
      case 'LOW': return 'default'
      default: return 'default'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return <ErrorIcon color="error" />
      case 'HIGH': return <WarningIcon color="warning" />
      case 'MEDIUM': return <InfoIcon color="info" />
      case 'LOW': return <InfoIcon color="action" />
      default: return <InfoIcon />
    }
  }

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'success'
      case 'B': return 'success'
      case 'C': return 'warning'
      case 'D': return 'warning'
      case 'F': return 'error'
      default: return 'default'
    }
  }

  const handleLoadExample = (example: AuditExample) => {
    setSourceCode(example.code)
    setContractNameInput(example.name)
    setShowExamplesDialog(false)
    resetAudit()
  }

  const renderAuditResult = () => {
    if (!auditResult) return null

    return (
      <Slide direction="up" in={showResults} mountOnEnter unmountOnExit>
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          {/* Header avec score et statut */}
                     <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: 'white', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.3)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Résultat de l'Audit
                  </Typography>
                                   <Typography variant="h6" sx={{ opacity: 0.9 }}>
                   {auditResult.passed ? t('securityAudit.results.secureContract') : t('securityAudit.results.vulnerabilitiesDetected')}
                 </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h2" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
                      {auditResult.score}
                    </Typography>
                                       <Typography variant="body1" sx={{ opacity: 0.9 }}>
                     /100
                   </Typography>
                   <Typography variant="body2" sx={{ opacity: 0.9 }}>
                     {t('securityAudit.results.score')}
                   </Typography>
                  </Box>
                  
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', color: getGradeColor(auditResult.grade) === 'success' ? '#2e7d32' : getGradeColor(auditResult.grade) === 'error' ? '#d32f2f' : '#ed6c02' }}>
                      {auditResult.grade}
                    </Typography>
                                       <Typography variant="body2" sx={{ opacity: 0.9 }}>
                     {t('securityAudit.results.grade')}
                   </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Statistiques rapides */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ textAlign: 'center', p: 2, boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <Typography variant="h4" color="error" sx={{ fontWeight: 'bold' }}>
                  {auditResult.summary.critical}
                </Typography>
                                 <Typography variant="body2" color="text.secondary">
                   {t('securityAudit.results.critical')}
                 </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ textAlign: 'center', p: 2, boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
                  {auditResult.summary.high}
                </Typography>
                                 <Typography variant="body2" color="text.secondary">
                   {t('securityAudit.results.high')}
                 </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ textAlign: 'center', p: 2, boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <Typography variant="h4" color="info.main" sx={{ fontWeight: 'bold' }}>
                  {auditResult.summary.medium}
                </Typography>
                                 <Typography variant="body2" color="text.secondary">
                   {t('securityAudit.results.medium')}
                 </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ textAlign: 'center', p: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '1px solid rgba(0,0,0,0.1)' }}>
                <Typography variant="h4" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                  {auditResult.summary.low}
                </Typography>
                                 <Typography variant="body2" color="text.secondary">
                   {t('securityAudit.results.low')}
                 </Typography>
              </Card>
            </Grid>
          </Grid>

          {/* Recommandations principales */}
          {auditResult.recommendations.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InfoIcon color="primary" />
                                     {t('securityAudit.results.mainRecommendations')}
                 </Typography>
                <Grid container spacing={2}>
                  {auditResult.recommendations.slice(0, 3).map((rec, index) => (
                    <Grid item xs={12} md={4} key={index}>
                      <Alert severity={index === 0 ? 'success' : index === 1 ? 'warning' : 'info'} sx={{ height: '100%' }}>
                        {rec}
                      </Alert>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Détails des vulnérabilités */}
          {auditResult.issues.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BugIcon color="error" />
                                     {t('securityAudit.results.vulnerabilityDetails')} ({auditResult.issues.length})
                 </Typography>
                
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1">
                                           {t('securityAudit.results.viewAllVulnerabilities')}
                   </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List>
                      {auditResult.issues.map((issue, index) => (
                        <ListItem key={index} sx={{ flexDirection: 'column', alignItems: 'flex-start', mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, width: '100%', flexWrap: 'wrap' }}>
                            {getSeverityIcon(issue.severity)}
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                              {issue.title}
                            </Typography>
                            <Chip
                              label={issue.severity}
                              color={getSeverityColor(issue.severity)}
                              size="small"
                            />
                            <Chip
                              label={issue.tool}
                              variant="outlined"
                              size="small"
                            />
                            {issue.line && (
                              <Chip
                                label={`Ligne ${issue.line}`}
                                variant="outlined"
                                size="small"
                              />
                            )}
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {issue.description}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                            💡 {issue.recommendation}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Impact: {issue.impact}
                          </Typography>
                          <Divider sx={{ width: '100%', mt: 1 }} />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              </CardContent>
            </Card>
          )}
        </Container>
      </Slide>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', py: 4 }}>
      {/* Formulaire d'audit */}
      <Container maxWidth="md">
                 <Card sx={{ 
           background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
           boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
           borderRadius: 3,
           border: '1px solid rgba(255, 255, 255, 0.05)',
           backdropFilter: 'blur(10px)'
         }}>
          <CardContent sx={{ p: 4 }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <SecurityIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                {t('securityAudit.title')}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {t('securityAudit.description.text')}
              </Typography>
            </Box>

            {/* Formulaire */}
            <Box sx={{ mb: 4 }}>
              <TextField
                fullWidth
                label={t('securityAudit.form.contractName')}
                placeholder={t('securityAudit.form.contractNamePlaceholder')}
                value={contractNameInput}
                onChange={(e) => setContractNameInput(e.target.value)}
                sx={{ mb: 3 }}
              />

              <TextField
                fullWidth
                multiline
                rows={12}
                label={t('securityAudit.form.sourceCode')}
                placeholder={t('securityAudit.form.sourceCodePlaceholder')}
                value={sourceCode}
                onChange={(e) => setSourceCode(e.target.value)}
                sx={{
                  mb: 3,
                  '& .MuiInputBase-root': {
                    backgroundColor: '#1e1e1e',
                    borderRadius: 2,
                    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                    fontSize: '0.875rem',
                                       '&::before': {
                     content: '"Solidity"',
                     position: 'absolute',
                     top: 8,
                     right: 16,
                     fontSize: '0.75rem',
                     color: 'rgba(255, 255, 255, 0.6)',
                     fontFamily: 'monospace',
                     zIndex: 1,
                   },
                  },
                                     '& .MuiInputBase-input': {
                     color: '#ffffff',
                     '&::placeholder': {
                       color: 'rgba(255, 255, 255, 0.5)',
                       opacity: 1,
                     },
                   },
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none',
                  },
                }}
              />
            </Box>

            {/* Actions */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                             <Button
                 variant="outlined"
                 startIcon={<BugIcon />}
                 onClick={() => setShowExamplesDialog(true)}
                 sx={{ minWidth: 150 }}
               >
                 {t('securityAudit.examples')}
               </Button>
              
              <Button
                variant="contained"
                size="large"
                startIcon={<SecurityIcon />}
                onClick={handleAudit}
                disabled={isAuditing || !sourceCode.trim() || !contractNameInput.trim()}
                sx={{ minWidth: 200 }}
              >
                {isAuditing ? t('securityAudit.form.auditing') : t('securityAudit.form.startAudit')}
              </Button>
            </Box>

            {isAuditing && (
              <Box sx={{ mt: 3 }}>
                <LinearProgress />
                <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                  {t('securityAudit.form.analyzing')}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>

      {/* Résultat de l'audit */}
      {renderAuditResult()}

      {/* FAB pour réinitialiser */}
      {auditResult && (
        <Fade in={showResults}>
          <Fab
            color="primary"
                         aria-label={t('securityAudit.results.newAudit')}
            sx={{ position: 'fixed', bottom: 16, right: 16 }}
            onClick={resetAudit}
          >
            <RefreshIcon />
          </Fab>
        </Fade>
      )}

      {/* Dialog des exemples */}
      <Dialog open={showExamplesDialog} onClose={() => setShowExamplesDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BugIcon />
            {t('securityAudit.examplesTitle')}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t('securityAudit.examplesDescription')}
          </Typography>
          
          <Grid container spacing={2}>
            {Object.entries(AUDIT_EXAMPLES_WITH_INFO).map(([key, example]) => (
              <Grid item xs={12} key={key}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {example.name}
                      </Typography>
                      <Chip
                        label={`${t('securityAudit.expectedScore')}: ${example.expectedScore}/100 (${example.expectedGrade})`}
                        color={example.expectedGrade === 'A' ? 'success' : example.expectedGrade === 'F' ? 'error' : 'warning'}
                        size="small"
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {example.description}
                    </Typography>
                    
                    {example.vulnerabilities.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {t('securityAudit.includedVulnerabilities')}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {example.vulnerabilities.map((vuln, index) => (
                            <Chip
                              key={index}
                              label={vuln}
                              size="small"
                              variant="outlined"
                              color="warning"
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                    
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => handleLoadExample(example)}
                    >
                      {t('securityAudit.loadExample')}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowExamplesDialog(false)}>
            {t('securityAudit.close')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default SecurityAuditInterface 