import React, { useEffect, useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Container
} from '@mui/material'
import {
  CheckCircle,
  Error,
  Email
} from '@mui/icons-material'

const EmailVerification: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading')
  const [message, setMessage] = useState('')
  const [isRequestingNew, setIsRequestingNew] = useState(false)

  // Récupérer le token depuis l'URL sans react-router
  const urlParams = new URLSearchParams(window.location.search)
  const token = urlParams.get('token')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Invalid verification link. No token provided.')
      return
    }

    verifyEmail(token)
  }, [token])

  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/verify-email?token=${verificationToken}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (data.success) {
        setStatus('success')
        setMessage('Your email has been successfully verified! You can now receive notifications.')
      } else {
        if (data.error === 'expired_token') {
          setStatus('expired')
          setMessage('This verification link has expired. Please request a new verification email.')
        } else if (data.error === 'invalid_token') {
          setStatus('error')
          setMessage('Invalid verification link. Please request a new verification email.')
        } else {
          setStatus('error')
          setMessage(data.message || 'Failed to verify email. Please try again.')
        }
      }
    } catch (err) {
      console.error('Email verification error:', err)
      setStatus('error')
      setMessage('Network error. Please check your connection and try again.')
    }
  }

  const requestNewVerification = async () => {
    setIsRequestingNew(true)
    try {
      // Essayer de récupérer l'email depuis le localStorage ou demander à l'utilisateur
      const email = prompt('Please enter your email address to receive a new verification link:')
      if (!email) {
        setIsRequestingNew(false)
        return
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/channels/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          wallet_address: 'verification_request', // Placeholder for new verification
          email: email
        })
      })

      const data = await response.json()
      if (data.success) {
        alert('New verification email sent! Please check your inbox.')
      } else {
        alert('Failed to send verification email. Please try again.')
      }
    } catch (error) {
      console.error('Error requesting new verification:', error)
      alert('Network error. Please try again.')
    } finally {
      setIsRequestingNew(false)
    }
  }

  const getIcon = () => {
    switch (status) {
      case 'loading':
        return <CircularProgress size={48} color="primary" />
      case 'success':
        return <CheckCircle sx={{ fontSize: 48, color: 'success.main' }} />
      case 'error':
      case 'expired':
        return <Error sx={{ fontSize: 48, color: 'error.main' }} />
      default:
        return <Email sx={{ fontSize: 48, color: 'primary.main' }} />
    }
  }

  const getTitle = () => {
    switch (status) {
      case 'loading':
        return 'Verifying Your Email...'
      case 'success':
        return 'Email Verified Successfully!'
      case 'expired':
        return 'Verification Link Expired'
      case 'error':
        return 'Verification Failed'
      default:
        return 'Email Verification'
    }
  }

  const getAlertSeverity = () => {
    switch (status) {
      case 'success':
        return 'success'
      case 'expired':
        return 'warning'
      case 'error':
        return 'error'
      default:
        return 'info'
    }
  }

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Card 
        elevation={8}
        sx={{ 
          borderRadius: 3,
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          overflow: 'visible',
          position: 'relative'
        }}
      >
        <Box
          sx={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%)',
            p: 3,
            textAlign: 'center',
            borderRadius: '12px 12px 0 0',
            color: 'white',
            position: 'relative'
          }}
        >
          <Typography variant="h5" component="h1" fontWeight="bold">
            🚀 ContractForge.io
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.9, letterSpacing: 1 }}>
            DEPLOY • VERIFY • SCALE
          </Typography>
        </Box>

        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            {getIcon()}
          </Box>

          <Typography variant="h5" component="h2" gutterBottom textAlign="center" fontWeight="600">
            {getTitle()}
          </Typography>

          {status !== 'loading' && (
            <Alert 
              severity={getAlertSeverity()} 
              sx={{ mb: 3, borderRadius: 2 }}
              variant="filled"
            >
              {message}
            </Alert>
          )}

          {status === 'loading' && (
            <Typography variant="body1" textAlign="center" color="text.secondary" sx={{ mb: 3 }}>
              Please wait while we verify your email address...
            </Typography>
          )}

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            {status === 'success' && (
              <Button
                variant="contained"
                size="large"
                onClick={() => window.location.href = '/?page=account'}
                sx={{
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  borderRadius: 2,
                  px: 4
                }}
              >
                Go to Account Settings
              </Button>
            )}

            {(status === 'error' || status === 'expired') && (
              <>
                <Button
                  variant="contained"
                  size="large"
                  onClick={requestNewVerification}
                  disabled={isRequestingNew}
                  sx={{
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    borderRadius: 2,
                    px: 3,
                    mr: 2
                  }}
                >
                  {isRequestingNew ? 'Sending...' : '📧 Request New Link'}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => window.location.href = '/?page=account'}
                  sx={{ borderRadius: 2, px: 3 }}
                >
                  Go to Account
                </Button>
              </>
            )}

            {status === 'loading' && (
              <Button
                variant="text"
                onClick={() => window.location.href = '/'}
                sx={{ mt: 2 }}
              >
                Cancel
              </Button>
            )}
          </Box>
        </CardContent>

        <Box
          sx={{
            background: '#1f2937',
            p: 2,
            textAlign: 'center',
            borderRadius: '0 0 12px 12px'
          }}
        >
          <Typography variant="caption" sx={{ color: '#9ca3af' }}>
            © 2025 ContractForge.io - Professional Smart Contract Platform
          </Typography>
        </Box>
      </Card>
    </Container>
  )
}

export default EmailVerification