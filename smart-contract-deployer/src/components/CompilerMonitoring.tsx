import React, { useState, useEffect } from 'react'
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Chip, 
  LinearProgress,
  Tooltip,
  CircularProgress
} from '@mui/material'
import { CheckCircle, Error, TrendingUp } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'

interface CompilerStatus {
  status: 'OK' | 'KO'
  uptime: number
  lastCheck: Date
  responseTime: number
  version: string
}

interface CompilerMonitoringProps {
  template?: { id: string; name: string } | null
}

const CompilerMonitoring: React.FC<CompilerMonitoringProps> = ({ template }) => {
  const { t } = useTranslation()
  const [compilerStatus, setCompilerStatus] = useState<CompilerStatus>({
    status: 'OK',
    uptime: 0, // Commence à 0, sera mis à jour après le premier check
    lastCheck: new Date(),
    responseTime: 0,
    version: 'Checking...'
  })

  const [uptimeHistory, setUptimeHistory] = useState([
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0 // Commence avec un historique vide
  ])
  
  const [isLoading, setIsLoading] = useState(false)
  const [isFirstCheck, setIsFirstCheck] = useState(true)

  // Vraie vérification du status du compilateur
  useEffect(() => {
    const checkCompiler = async () => {
      if (isLoading) return
      
      setIsLoading(true)
      const start = Date.now()
      
      try {
        // Appel réel à l'API du compilateur backend
        const response = await fetch('/api/compiler/health', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            template: template?.id || 'token',
            check: 'compile'
          })
        })
        
        const responseTime = Date.now() - start
        
        // Gestion spéciale des erreurs 429 (Too Many Requests)
        if (response.status === 429) {
          console.warn('Rate limited, skipping this check')
          setCompilerStatus(prev => ({
            ...prev,
            lastCheck: new Date(),
            responseTime,
            // On garde le status précédent, 429 n'est pas une vraie panne
            // status reste inchangé
          }))
          return
        }
        
        const result = await response.json()
        const isHealthy = response.ok && result.status === 'ok'
        
        let newUptime: number
        
        if (isFirstCheck) {
          // Premier check : commence à un uptime basé sur le résultat
          newUptime = isHealthy ? 99.0 : 85.0
          setIsFirstCheck(false)
        } else {
          // Checks suivants : ajuste l'uptime existant
          newUptime = isHealthy 
            ? Math.min(99.9, compilerStatus.uptime + 0.1) 
            : Math.max(70.0, compilerStatus.uptime - 5.0)
        }
        
        setCompilerStatus(prev => ({
          ...prev,
          status: isHealthy ? 'OK' : 'KO',
          lastCheck: new Date(),
          responseTime,
          uptime: newUptime,
          version: result.version || 'Foundry 0.2.0'
        }))
        
        // Mettre à jour l'historique d'uptime avec la nouvelle valeur
        setUptimeHistory(prev => {
          const newHistory = [...prev.slice(1), newUptime]
          return newHistory
        })
        
      } catch (error) {
        console.error('Compiler health check failed:', error)
        const responseTime = Date.now() - start
        
        let newUptime: number
        
        if (isFirstCheck) {
          // Premier check échoué : commence avec un uptime bas
          newUptime = 75.0
          setIsFirstCheck(false)
        } else {
          // Checks suivants : diminue l'uptime existant plus fortement
          newUptime = Math.max(60.0, compilerStatus.uptime - 8.0)
        }
        
        setCompilerStatus(prev => ({
          ...prev,
          status: 'KO',
          lastCheck: new Date(),
          responseTime,
          uptime: newUptime
        }))
        
        // Mettre à jour l'historique d'uptime avec la nouvelle valeur
        setUptimeHistory(prev => {
          const newHistory = [...prev.slice(1), newUptime]
          return newHistory
        })
      } finally {
        setIsLoading(false)
      }
    }

    // Vérification initiale
    checkCompiler()

    // Vérification périodique toutes les 5 minutes (300000ms)
    const interval = setInterval(checkCompiler, 300000)

    return () => clearInterval(interval)
  }, [template?.id]) // SUPPRIMÉ isLoading des dépendances pour éviter la boucle infinie

  const getStatusColor = (status: string) => {
    return status === 'OK' ? '#4caf50' : '#f44336'
  }

  const getUptimeColor = (uptime: number) => {
    if (uptime >= 99) return '#4caf50'
    if (uptime >= 95) return '#ff9800'
    return '#f44336'
  }

  return (
    <Card sx={{ mb: 3, borderLeft: `4px solid ${getStatusColor(compilerStatus.status)}` }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box>
            {compilerStatus.status === 'OK' ? (
              <CheckCircle sx={{ color: '#4caf50', fontSize: 32 }} />
            ) : (
              <Error sx={{ color: '#f44336', fontSize: 32 }} />
            )}
          </Box>
          
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              📊 {t('compilerMonitoring.title')}
              {template && (
                <Typography component="span" variant="caption" sx={{ ml: 1, opacity: 0.7 }}>
                  ({template.id.toUpperCase()})
                </Typography>
              )}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              <Chip 
                label={`${t('compilerMonitoring.status')}: ${compilerStatus.status}`}
                color={compilerStatus.status === 'OK' ? 'success' : 'error'}
                size="small"
                icon={isLoading ? <CircularProgress size={12} /> : undefined}
              />
              <Chip 
                label={compilerStatus.uptime === 0 ? 'Checking...' : `${compilerStatus.uptime.toFixed(1)}% ${t('compilerMonitoring.uptime')}`}
                sx={{ 
                  backgroundColor: compilerStatus.uptime === 0 ? '#757575' : getUptimeColor(compilerStatus.uptime), 
                  color: 'white' 
                }}
                size="small"
              />
              <Chip 
                label={compilerStatus.responseTime === 0 ? 'Checking...' : `${compilerStatus.responseTime}ms`}
                variant="outlined"
                size="small"
                sx={{ 
                  color: compilerStatus.responseTime === 0 ? '#757575' : (compilerStatus.responseTime < 1000 ? '#4caf50' : '#ff9800')
                }}
              />
              {template && (
                <Chip 
                  label={`Template: ${template.id}`}
                  variant="outlined"
                  size="small"
                  sx={{ opacity: 0.8 }}
                />
              )}
            </Box>
          </Box>

          <Box>
            <TrendingUp sx={{ color: '#2196f3' }} />
          </Box>
        </Box>

        {/* Graphique d'uptime simplifié */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>
            {t('compilerMonitoring.uptimeHistory')}:
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'flex-end', height: 40 }}>
            {uptimeHistory.map((uptime, index) => (
              <Tooltip key={index} title={uptime === 0 ? 'No data' : `${uptime.toFixed(1)}%`}>
                <Box
                  sx={{
                    width: '20px',
                    height: uptime === 0 ? '3px' : `${(uptime / 100) * 35}px`,
                    backgroundColor: uptime === 0 ? '#424242' : getUptimeColor(uptime),
                    borderRadius: '2px',
                    cursor: 'pointer',
                    opacity: uptime === 0 ? 0.3 : 1
                  }}
                />
              </Tooltip>
            ))}
          </Box>
        </Box>

        {/* Informations supplémentaires */}
        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="caption" color="textSecondary">
                {t('compilerMonitoring.lastCheck')}: {compilerStatus.lastCheck.toLocaleTimeString()}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary">
                {t('compilerMonitoring.version')}: {compilerStatus.version}
              </Typography>
            </Box>
          </Box>
          <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block', fontStyle: 'italic' }}>
            Next check in 5 minutes
          </Typography>
        </Box>

        {/* Barre de progression pour le temps de réponse */}
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="textSecondary">
            {t('compilerMonitoring.responseTime')}
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={Math.min(100, (1000 - compilerStatus.responseTime) / 10)} 
            sx={{ 
              height: 6, 
              borderRadius: 3,
              backgroundColor: '#e0e0e0',
              '& .MuiLinearProgress-bar': {
                backgroundColor: compilerStatus.responseTime < 500 ? '#4caf50' : '#ff9800'
              }
            }}
          />
        </Box>
      </CardContent>
    </Card>
  )
}

export default CompilerMonitoring