import React, { useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  InputAdornment,
  IconButton,
  Container
} from '@mui/material'
import { Visibility, VisibilityOff, Lock, Analytics } from '@mui/icons-material'
interface AnalyticsAuthProps {
  onAuthenticated: () => void
}
const AnalyticsAuth: React.FC<AnalyticsAuthProps> = ({ onAuthenticated }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'analytics2024'
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    await new Promise(resolve => setTimeout(resolve, 1000))
    if (
      credentials.username === ADMIN_CREDENTIALS.username &&
      credentials.password === ADMIN_CREDENTIALS.password
    ) {
      localStorage.setItem('analytics_auth_token', 'authenticated')
      localStorage.setItem('analytics_auth_timestamp', Date.now().toString())
      onAuthenticated()
    } else {
      setError('Identifiants invalides')
    }
    setLoading(false)
  }
  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials(prev => ({
      ...prev,
      [field]: e.target.value
    }))
  }
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          background: 'linear-gradient(135deg, rgba(26, 32, 46, 0.95) 0%, rgba(17, 24, 39, 0.98) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid',
          borderColor: 'rgba(92, 107, 192, 0.2)',
          borderRadius: 3
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: 'center' }}>
          <Analytics sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Analytics
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, justifyContent: 'center' }}>
          <Lock sx={{ mr: 1, color: 'warning.main' }} />
          <Typography variant="body1" color="text.secondary">
            Accès Restreint - Authentification Requise
          </Typography>
        </Box>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Nom d'utilisateur"
            variant="outlined"
            value={credentials.username}
            onChange={handleChange('username')}
            required
            sx={{ mb: 3 }}
            disabled={loading}
          />
          <TextField
            fullWidth
            label="Mot de passe"
            type={showPassword ? 'text' : 'password'}
            variant="outlined"
            value={credentials.password}
            onChange={handleChange('password')}
            required
            sx={{ mb: 3 }}
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading || !credentials.username || !credentials.password}
            sx={{
              mt: 2,
              py: 1.5,
              background: 'linear-gradient(135deg, #5C6BC0 0%, #7E57C2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #4E5EE4 0%, #6B47C2 100%)',
              }
            }}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </Button>
        </form>
        <Box sx={{ mt: 4, p: 2, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            <strong>Identifiants de démonstration :</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Nom d'utilisateur : <code>admin</code>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Mot de passe : <code>analytics2024</code>
          </Typography>
        </Box>
      </Paper>
    </Container>
  )
}
export default AnalyticsAuth