import React, { useState, useEffect } from 'react'
import { Box, IconButton, Tooltip } from '@mui/material'
import { Logout } from '@mui/icons-material'
import AnalyticsAuth from './AnalyticsAuth'
import AnalyticsDashboard from './AnalyticsDashboard'
const ProtectedAnalytics: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    checkAuthentication()
  }, [])
  const checkAuthentication = () => {
    const token = localStorage.getItem('analytics_auth_token')
    const timestamp = localStorage.getItem('analytics_auth_timestamp')
    if (token && timestamp) {
      const authTime = parseInt(timestamp)
      const currentTime = Date.now()
      const sessionDuration = 24 * 60 * 60 * 1000
      if (currentTime - authTime < sessionDuration) {
        setIsAuthenticated(true)
      } else {
        localStorage.removeItem('analytics_auth_token')
        localStorage.removeItem('analytics_auth_timestamp')
      }
    }
    setLoading(false)
  }
  const handleAuthenticated = () => {
    setIsAuthenticated(true)
  }
  const handleLogout = () => {
    localStorage.removeItem('analytics_auth_token')
    localStorage.removeItem('analytics_auth_timestamp')
    setIsAuthenticated(false)
  }
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh'
        }}
      >
        Chargement...
      </Box>
    )
  }
  if (!isAuthenticated) {
    return <AnalyticsAuth onAuthenticated={handleAuthenticated} />
  }
  return (
    <Box sx={{ position: 'relative', minHeight: '100vh' }}>
      {}
      <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1000 }}>
        <Tooltip title="Déconnexion">
          <IconButton
            onClick={handleLogout}
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
              }
            }}
          >
            <Logout />
          </IconButton>
        </Tooltip>
      </Box>
      <AnalyticsDashboard />
    </Box>
  )
}
export default ProtectedAnalytics