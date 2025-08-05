import React, { Component, ErrorInfo as ReactErrorInfo, ReactNode } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Stack,
  IconButton,
  Divider
} from '@mui/material'
import {
  Error as ErrorIcon,
  ExpandMore,
  Refresh,
  BugReport,
  Home,
  ContentCopy,
  Warning
} from '@mui/icons-material'
import { contractToast } from '../notifications/ToastSystem'

interface CustomErrorInfo {
  error: Error
  errorInfo: ReactErrorInfo
  timestamp: Date
  userAgent: string
  url: string
  userId?: string
  chainId?: number
  context?: Record<string, any>
}

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ReactErrorInfo) => void
  level?: 'page' | 'section' | 'component'
  context?: Record<string, any>
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ReactErrorInfo | null
  errorId: string
  isReporting: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      isReporting: false
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  componentDidCatch(error: Error, errorInfo: ReactErrorInfo) {
    const errorData: CustomErrorInfo = {
      error,
      errorInfo,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      context: this.props.context
    }

    this.setState({ errorInfo })

    console.error('🚨 Error Boundary caught an error:', error)
    console.error('🔍 Error Info:', errorInfo)
    console.error('📝 Context:', this.props.context)

    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    contractToast.error(`An error occurred: ${error.message}`)

    // TODO: Envoyer à un service de monitoring (Sentry, LogRocket, etc.)
    this.reportError(errorData)
  }

  private reportError = async (errorData: CustomErrorInfo) => {
    try {
      console.log('📊 Reporting error to monitoring service:', {
        errorId: this.state.errorId,
        message: errorData.error.message,
        stack: errorData.error.stack,
        timestamp: errorData.timestamp,
        url: errorData.url,
        context: errorData.context
      })

    } catch (reportingError) {
      console.error('❌ Failed to report error:', reportingError)
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    })
  }

  private handleReportBug = async () => {
    this.setState({ isReporting: true })
    
    try {
      const errorReport = {
        errorId: this.state.errorId,
        message: this.state.error?.message,
        stack: this.state.error?.stack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        context: this.props.context
      }

      await navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2))
      contractToast.success('Error report copied to clipboard!')
      
      const githubUrl = `https://github.com/your-repo/issues/new?title=Error%20Report%20${this.state.errorId}&body=${encodeURIComponent('Error details copied to clipboard - please paste here')}`
      window.open(githubUrl, '_blank')
      
    } catch (err) {
      contractToast.error('Failed to copy error report')
    } finally {
      this.setState({ isReporting: false })
    }
  }

  private copyErrorDetails = async () => {
    const errorDetails = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      timestamp: new Date().toISOString(),
      context: this.props.context
    }

    try {
      await navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2))
      contractToast.success('Error details copied!')
    } catch (err) {
      contractToast.error('Failed to copy error details')
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const isPageLevel = this.props.level === 'page'
      const isSectionLevel = this.props.level === 'section'

      return (
        <Box
          sx={{
            p: isPageLevel ? 4 : 3,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: isPageLevel ? '60vh' : 'auto'
          }}
        >
          <Card 
            sx={{ 
              maxWidth: 600, 
              width: '100%',
              border: '1px solid',
              borderColor: 'error.light'
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="flex-start" gap={2} mb={3}>
                <ErrorIcon color="error" sx={{ fontSize: 40, mt: 0.5 }} />
                <Box flex={1}>
                  <Typography variant="h5" color="error" gutterBottom>
                    {isPageLevel ? 'Application Error' : 
                     isSectionLevel ? 'Section Error' : 'Component Error'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Something went wrong. Don't worry, this has been reported and we'll fix it soon.
                  </Typography>
                </Box>
                <Chip 
                  label={this.state.errorId} 
                  size="small" 
                  color="error" 
                  variant="outlined"
                />
              </Box>

              <Alert severity="error" sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {this.state.error?.message || 'Unknown error occurred'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Error ID: {this.state.errorId} • {new Date().toLocaleString()}
                </Typography>
              </Alert>

              <Stack direction="row" spacing={2} mb={3}>
                <Button
                  variant="contained"
                  startIcon={<Refresh />}
                  onClick={this.handleRetry}
                  color="primary"
                >
                  Try Again
                </Button>
                
                {isPageLevel && (
                  <Button
                    variant="outlined"
                    startIcon={<Home />}
                    onClick={() => window.location.href = '/'}
                  >
                    Go Home
                  </Button>
                )}
              </Stack>

              <Divider sx={{ mb: 2 }} />

              <Stack direction="row" spacing={1} mb={2}>
                <Button
                  size="small"
                  startIcon={<BugReport />}
                  onClick={this.handleReportBug}
                  disabled={this.state.isReporting}
                  color="secondary"
                >
                  {this.state.isReporting ? 'Reporting...' : 'Report Bug'}
                </Button>
                
                <Button
                  size="small"
                  startIcon={<ContentCopy />}
                  onClick={this.copyErrorDetails}
                  color="secondary"
                >
                  Copy Details
                </Button>
              </Stack>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="caption" color="text.secondary">
                    Technical Details (for developers)
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
                    <Typography variant="caption" display="block" gutterBottom>
                      <strong>Error:</strong> {this.state.error?.message}
                    </Typography>
                    <Typography variant="caption" display="block" gutterBottom>
                      <strong>Location:</strong> {window.location.href}
                    </Typography>
                    {this.props.context && (
                      <Typography variant="caption" display="block" gutterBottom>
                        <strong>Context:</strong> {JSON.stringify(this.props.context, null, 2)}
                      </Typography>
                    )}
                    {this.state.error?.stack && (
                      <Box mt={1}>
                        <Typography variant="caption" display="block" gutterBottom>
                          <strong>Stack trace:</strong>
                        </Typography>
                        <Box
                          component="pre"
                          sx={{
                            fontSize: '0.7rem',
                            fontFamily: 'monospace',
                            overflow: 'auto',
                            maxHeight: 200,
                            bgcolor: 'grey.100',
                            p: 1,
                            borderRadius: 1
                          }}
                        >
                          {this.state.error.stack}
                        </Box>
                      </Box>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
            </CardContent>
          </Card>
        </Box>
      )
    }

    return this.props.children
  }
}

export const Web3ErrorBoundary: React.FC<{
  children: ReactNode
  fallback?: ReactNode
}> = ({ children, fallback }) => {
  const handleWeb3Error = (error: Error, errorInfo: ReactErrorInfo) => {
    console.group('🌐 Web3 Error Boundary')
    console.error('Error:', error.message)
    console.error('Component stack:', errorInfo.componentStack)
    
    if (error.message.includes('User rejected')) {
      contractToast.info('Transaction cancelled by user')
      return
    }
    
    if (error.message.includes('insufficient funds')) {
      contractToast.error('Insufficient funds for transaction')
      return
    }
    
    if (error.message.includes('network')) {
      contractToast.error('Network error - please check your connection')
      return
    }

    console.groupEnd()
  }

  return (
    <ErrorBoundary
      onError={handleWeb3Error}
      level="section"
      context={{ component: 'Web3', type: 'blockchain' }}
      fallback={fallback}
    >
      {children}
    </ErrorBoundary>
  )
}

export const PageErrorBoundary: React.FC<{
  children: ReactNode
  pageName?: string
}> = ({ children, pageName = 'Unknown' }) => {
  return (
    <ErrorBoundary
      level="page"
      context={{ page: pageName, type: 'page' }}
    >
      {children}
    </ErrorBoundary>
  )
}

export const useErrorHandler = () => {
  return (error: Error, context?: Record<string, any>) => {
    console.error('🚨 Manual error trigger:', error, context)
    throw error
  }
}

export const ErrorState: React.FC<{
  error: Error | string
  onRetry?: () => void
  onHome?: () => void
  context?: string
}> = ({ error, onRetry, onHome, context }) => {
  const errorMessage = typeof error === 'string' ? error : error.message

  return (
    <Box textAlign="center" py={4}>
      <ErrorIcon color="error" sx={{ fontSize: 48, mb: 2 }} />
      <Typography variant="h6" color="error" gutterBottom>
        Something went wrong
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        {errorMessage}
      </Typography>
      {context && (
        <Typography variant="caption" color="text.secondary" display="block" mb={2}>
          Context: {context}
        </Typography>
      )}
      <Stack direction="row" spacing={2} justifyContent="center">
        {onRetry && (
          <Button variant="contained" startIcon={<Refresh />} onClick={onRetry}>
            Try Again
          </Button>
        )}
        {onHome && (
          <Button variant="outlined" startIcon={<Home />} onClick={onHome}>
            Go Home
          </Button>
        )}
      </Stack>
    </Box>
  )
} 