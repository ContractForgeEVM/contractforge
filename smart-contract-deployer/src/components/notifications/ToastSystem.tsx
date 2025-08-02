import React, { createContext, useContext, useState, ReactNode } from 'react'
import { Snackbar, Alert, AlertColor, Slide, SlideProps, Box, Typography, IconButton, Link } from '@mui/material'
import { Close, CheckCircle, Error as ErrorIcon, Warning, Info, OpenInNew } from '@mui/icons-material'

interface Toast {
  id: string
  message: string
  severity: AlertColor
  duration?: number
  title?: string
  transactionHash?: string
  chainId?: number
}

interface ToastContextType {
  showToast: (message: string, severity?: AlertColor, duration?: number, title?: string, transactionHash?: string, chainId?: number) => void
  showSuccess: (message: string, title?: string, transactionHash?: string, chainId?: number) => void
  showError: (message: string, title?: string, transactionHash?: string, chainId?: number) => void
  showWarning: (message: string, title?: string, transactionHash?: string, chainId?: number) => void
  showInfo: (message: string, title?: string, transactionHash?: string, chainId?: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="down" />
}

const getToastIcon = (severity: AlertColor) => {
  switch (severity) {
    case 'success':
      return <CheckCircle sx={{ color: '#10b981', fontSize: 24 }} />
    case 'error':
      return <ErrorIcon sx={{ color: '#ef4444', fontSize: 24 }} />
    case 'warning':
      return <Warning sx={{ color: '#f59e0b', fontSize: 24 }} />
    case 'info':
    default:
      return <Info sx={{ color: '#6366f1', fontSize: 24 }} />
  }
}

const getToastColors = (severity: AlertColor) => {
  switch (severity) {
    case 'success':
      return {
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.1) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        color: '#10b981'
      }
    case 'error':
      return {
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.1) 100%)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        color: '#ef4444'
      }
    case 'warning':
      return {
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.1) 100%)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        color: '#f59e0b'
      }
    case 'info':
    default:
      return {
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.1) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        color: '#6366f1'
      }
  }
}

const getExplorerUrl = (chainId: number, transactionHash: string): string => {
  const explorers: Record<number, string> = {
    1: 'https://etherscan.io',
    5: 'https://goerli.etherscan.io',
    11155111: 'https://sepolia.etherscan.io',
    137: 'https://polygonscan.com',
    80001: 'https://mumbai.polygonscan.com',
    42161: 'https://arbiscan.io',
    421614: 'https://sepolia.arbiscan.io',
    10: 'https://optimistic.etherscan.io',
    420: 'https://goerli-optimism.etherscan.io',
    11155420: 'https://sepolia-optimism.etherscan.io',
    56: 'https://bscscan.com',
    97: 'https://testnet.bscscan.com',
    43114: 'https://snowtrace.io',
    43113: 'https://testnet.snowtrace.io',
    250: 'https://ftmscan.com',
    4002: 'https://testnet.ftmscan.com',
    1284: 'https://moonscan.io',
    1285: 'https://moonbase.moonscan.io',
    100: 'https://gnosisscan.io',
    42220: 'https://celoscan.io',
    44787: 'https://alfajores.celoscan.io',
    1666600000: 'https://explorer.harmony.one',
    324: 'https://explorer.zksync.io',
    534352: 'https://scrollscan.com',
    534351: 'https://sepolia.scrollscan.com',
    59144: 'https://lineascan.build',
    59141: 'https://goerli.lineascan.build',
    999: 'https://explorer.hyperevm.com',
    998: 'https://testnet.explorer.hyperevm.com',
    10143: 'https://explorer.monad.xyz'
  }
  const baseUrl = explorers[chainId] || 'https://etherscan.io'
  return `${baseUrl}/tx/${transactionHash}`
}

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = (message: string, severity: AlertColor = 'info', duration: number = 6000, title?: string, transactionHash?: string, chainId?: number) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: Toast = { id, message, severity, duration, title, transactionHash, chainId }
    
    setToasts(prev => [...prev, newToast])
    
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id))
    }, duration)
  }

  const showSuccess = (message: string, title?: string, transactionHash?: string, chainId?: number) => showToast(message, 'success', 8000, title, transactionHash, chainId)
  const showError = (message: string, title?: string, transactionHash?: string, chainId?: number) => showToast(message, 'error', 10000, title, transactionHash, chainId)
  const showWarning = (message: string, title?: string, transactionHash?: string, chainId?: number) => showToast(message, 'warning', 7000, title, transactionHash, chainId)
  const showInfo = (message: string, title?: string, transactionHash?: string, chainId?: number) => showToast(message, 'info', 6000, title, transactionHash, chainId)

  const handleClose = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo }}>
      {children}
      {toasts.map((toast, index) => {
        const colors = getToastColors(toast.severity)
        const explorerUrl = toast.transactionHash && toast.chainId ? getExplorerUrl(toast.chainId, toast.transactionHash) : null
        
        return (
          <Snackbar
            key={toast.id}
            open={true}
            autoHideDuration={toast.duration}
            onClose={() => handleClose(toast.id)}
            TransitionComponent={SlideTransition}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            sx={{ 
              transform: `translateY(${index * 80}px)`,
              zIndex: 9999,
              '& .MuiSnackbarContent-root': {
                minWidth: '400px',
                maxWidth: '500px'
              }
            }}
          >
            <Box
              sx={{
                background: colors.background,
                border: colors.border,
                borderRadius: 3,
                padding: 2,
                backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                minWidth: '400px',
                maxWidth: '500px',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: colors.color,
                  opacity: 0.6
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                  {getToastIcon(toast.severity)}
                </Box>
                
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  {toast.title && (
                    <Typography
                      variant="subtitle2"
                      sx={{
                        color: colors.color,
                        fontWeight: 600,
                        mb: 0.5,
                        fontSize: '0.875rem'
                      }}
                    >
                      {toast.title}
                    </Typography>
                  )}
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#ffffff',
                      lineHeight: 1.5,
                      fontSize: '0.875rem'
                    }}
                  >
                    {toast.message}
                  </Typography>
                  
                  {explorerUrl && (
                    <Link
                      href={explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.5,
                        mt: 1,
                        color: colors.color,
                        textDecoration: 'none',
                        fontSize: '0.75rem',
                        '&:hover': {
                          textDecoration: 'underline',
                        }
                      }}
                    >
                      Voir sur l'explorateur
                      <OpenInNew fontSize="small" />
                    </Link>
                  )}
                </Box>
                
                <IconButton
                  size="small"
                  onClick={() => handleClose(toast.id)}
                  sx={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    '&:hover': {
                      color: '#ffffff',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    },
                    mt: -0.5,
                    mr: -0.5
                  }}
                >
                  <Close fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </Snackbar>
        )
      })}
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider') as Error
  }
  return context
}

let globalToastRef: ToastContextType | null = null

export const contractToast = {
  success: (message: string, title?: string, transactionHash?: string, chainId?: number) => {
    if (globalToastRef) {
      globalToastRef.showSuccess(message, title, transactionHash, chainId)
    } else {
      console.log('✅ Toast (fallback):', message)
    }
  },
  error: (message: string, title?: string, transactionHash?: string, chainId?: number) => {
    if (globalToastRef) {
      globalToastRef.showError(message, title, transactionHash, chainId)
    } else {
      console.error('❌ Toast (fallback):', message)
    }
  },
  warning: (message: string, title?: string, transactionHash?: string, chainId?: number) => {
    if (globalToastRef) {
      globalToastRef.showWarning(message, title, transactionHash, chainId)
    } else {
      console.warn('⚠️ Toast (fallback):', message)
    }
  },
  info: (message: string, title?: string, transactionHash?: string, chainId?: number) => {
    if (globalToastRef) {
      globalToastRef.showInfo(message, title, transactionHash, chainId)
    } else {
      console.info('ℹ️ Toast (fallback):', message)
    }
  }
}

export const ToastProviderWithRef: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = (message: string, severity: AlertColor = 'info', duration: number = 6000, title?: string, transactionHash?: string, chainId?: number) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: Toast = { id, message, severity, duration, title, transactionHash, chainId }
    
    setToasts(prev => [...prev, newToast])
    
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id))
    }, duration)
  }

  const showSuccess = (message: string, title?: string, transactionHash?: string, chainId?: number) => showToast(message, 'success', 8000, title, transactionHash, chainId)
  const showError = (message: string, title?: string, transactionHash?: string, chainId?: number) => showToast(message, 'error', 10000, title, transactionHash, chainId)
  const showWarning = (message: string, title?: string, transactionHash?: string, chainId?: number) => showToast(message, 'warning', 7000, title, transactionHash, chainId)
  const showInfo = (message: string, title?: string, transactionHash?: string, chainId?: number) => showToast(message, 'info', 6000, title, transactionHash, chainId)

  const toastContext: ToastContextType = { showToast, showSuccess, showError, showWarning, showInfo }

  React.useEffect(() => {
    globalToastRef = toastContext
    return () => {
      globalToastRef = null
    }
  }, [])

  const handleClose = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  return (
    <ToastContext.Provider value={toastContext}>
      {children}
      {toasts.map((toast, index) => {
        const colors = getToastColors(toast.severity)
        const explorerUrl = toast.transactionHash && toast.chainId ? getExplorerUrl(toast.chainId, toast.transactionHash) : null
        
        return (
          <Snackbar
            key={toast.id}
            open={true}
            autoHideDuration={toast.duration}
            onClose={() => handleClose(toast.id)}
            TransitionComponent={SlideTransition}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            sx={{ 
              transform: `translateY(${index * 80}px)`,
              zIndex: 9999,
              '& .MuiSnackbarContent-root': {
                minWidth: '400px',
                maxWidth: '500px'
              }
            }}
          >
            <Box
              sx={{
                background: colors.background,
                border: colors.border,
                borderRadius: 3,
                padding: 2,
                backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                minWidth: '400px',
                maxWidth: '500px',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: colors.color,
                  opacity: 0.6
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                  {getToastIcon(toast.severity)}
                </Box>
                
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  {toast.title && (
                    <Typography
                      variant="subtitle2"
                      sx={{
                        color: colors.color,
                        fontWeight: 600,
                        mb: 0.5,
                        fontSize: '0.875rem'
                      }}
                    >
                      {toast.title}
                    </Typography>
                  )}
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#ffffff',
                      lineHeight: 1.5,
                      fontSize: '0.875rem'
                    }}
                  >
                    {toast.message}
                  </Typography>
                  
                  {explorerUrl && (
                    <Link
                      href={explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.5,
                        mt: 1,
                        color: colors.color,
                        textDecoration: 'none',
                        fontSize: '0.75rem',
                        '&:hover': {
                          textDecoration: 'underline',
                        }
                      }}
                    >
                      Voir sur l'explorateur
                      <OpenInNew fontSize="small" />
                    </Link>
                  )}
                </Box>
                
                <IconButton
                  size="small"
                  onClick={() => handleClose(toast.id)}
                  sx={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    '&:hover': {
                      color: '#ffffff',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    },
                    mt: -0.5,
                    mr: -0.5
                  }}
                >
                  <Close fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </Snackbar>
        )
      })}
    </ToastContext.Provider>
  )
}

export default ToastProvider 