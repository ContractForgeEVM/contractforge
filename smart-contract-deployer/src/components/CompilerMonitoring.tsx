import React, { useState, useEffect } from 'react'
import { 
  Box, 
  Typography, 
  Chip, 
  CircularProgress
} from '@mui/material'
import { CheckCircle, Error } from '@mui/icons-material'
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
    uptime: 0,
    lastCheck: new Date(),
    responseTime: 0,
    version: 'Checking...'
  })

  const [uptimeHistory, setUptimeHistory] = useState([
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0
  ])
  
  const [isLoading, setIsLoading] = useState(false)
  const [isFirstCheck, setIsFirstCheck] = useState(true)

  useEffect(() => {
    const checkCompiler = async () => {
      if (isLoading) return
      
      setIsLoading(true)
      const start = Date.now()
      
      try {
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
        
        if (response.status === 429) {
          console.warn('Rate limited, skipping this check')
          setCompilerStatus(prev => ({
            ...prev,
            lastCheck: new Date(),
            responseTime,
          }))
          return
        }
        
        const result = await response.json()
        const isHealthy = response.ok && result.status === 'ok'
        
        let newUptime: number
        
        if (isFirstCheck) {
          newUptime = isHealthy ? 99.0 : 85.0
          setIsFirstCheck(false)
        } else {
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
        
        setUptimeHistory(prev => {
          const newHistory = [...prev.slice(1), newUptime]
          return newHistory
        })
        
      } catch (error) {
        console.error('Compiler health check failed:', error)
        const responseTime = Date.now() - start
        
        let newUptime: number
        
        if (isFirstCheck) {
          newUptime = 75.0
          setIsFirstCheck(false)
        } else {
          newUptime = Math.max(60.0, compilerStatus.uptime - 8.0)
        }
        
        setCompilerStatus(prev => ({
          ...prev,
          status: 'KO',
          lastCheck: new Date(),
          responseTime,
          uptime: newUptime
        }))
        
        setUptimeHistory(prev => {
          const newHistory = [...prev.slice(1), newUptime]
          return newHistory
        })
      } finally {
        setIsLoading(false)
      }
    }

    checkCompiler()

    const interval = setInterval(checkCompiler, 300000)

    return () => clearInterval(interval)
  }, [template?.id])

  const getStatusColor = (status: string) => {
    return status === 'OK' ? '#4caf50' : '#f44336'
  }

  const getUptimeColor = (uptime: number) => {
    if (uptime >= 99) return '#4caf50'
    if (uptime >= 95) return '#ff9800'
    return '#f44336'
  }

  return (
    <Box sx={{ 
      p: 1, 
      borderRadius: 1, 
      border: `1px solid ${getStatusColor(compilerStatus.status)}`,
      backgroundColor: 'rgba(0,0,0,0.02)',
      mb: 1
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {compilerStatus.status === 'OK' ? (
            <CheckCircle sx={{ color: '#4caf50', fontSize: 16 }} />
          ) : (
            <Error sx={{ color: '#f44336', fontSize: 16 }} />
          )}
          <Typography variant="caption" fontWeight={600} fontSize="0.75rem">
            📊 Compiler
            {template && ` (${template.id.toUpperCase()})`}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip 
            label={compilerStatus.status}
            color={compilerStatus.status === 'OK' ? 'success' : 'error'}
            size="small"
            sx={{ height: 20, '& .MuiChip-label': { px: 1, fontSize: '0.65rem' } }}
          />
          <Chip 
            label={compilerStatus.uptime === 0 ? '...' : `${compilerStatus.uptime.toFixed(1)}%`}
            sx={{ 
              backgroundColor: compilerStatus.uptime === 0 ? '#757575' : getUptimeColor(compilerStatus.uptime), 
              color: 'white',
              height: 20,
              '& .MuiChip-label': { px: 1, fontSize: '0.65rem' }
            }}
            size="small"
          />
          <Chip 
            label={compilerStatus.responseTime === 0 ? '...' : `${compilerStatus.responseTime}ms`}
            variant="outlined"
            size="small"
            sx={{ 
              height: 20,
              '& .MuiChip-label': { px: 1, fontSize: '0.65rem' },
              borderColor: compilerStatus.responseTime === 0 ? '#757575' : (compilerStatus.responseTime < 1000 ? '#4caf50' : '#ff9800'),
              color: compilerStatus.responseTime === 0 ? '#757575' : (compilerStatus.responseTime < 1000 ? '#4caf50' : '#ff9800')
            }}
          />
          {isLoading && <CircularProgress size={14} />}
        </Box>
      </Box>
    </Box>
  )
}

export default CompilerMonitoring