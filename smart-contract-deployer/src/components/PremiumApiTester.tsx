import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  CircularProgress,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import {
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Description as DocsIcon,
  BugReport as TestIcon,
  Star as StarIcon
} from '@mui/icons-material'

interface PremiumApiTesterProps {
  apiKey?: string | null
}

const PremiumApiTester: React.FC<PremiumApiTesterProps> = ({ apiKey }) => {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Record<string, any>>({})
  const [sourceCode, setSourceCode] = useState(`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SimpleToken {
    string public name = "TestToken";
    mapping(address => uint256) public balances;
    
    function transfer(address to, uint256 amount) public {
        balances[msg.sender] -= amount;
        balances[to] += amount;
    }
}`)
  const [contractName, setContractName] = useState('SimpleToken')
  const [optimizationLevel, setOptimizationLevel] = useState<'standard' | 'aggressive' | 'size' | 'gas'>('aggressive')
  const [generateDocs, setGenerateDocs] = useState(true)
  const [runTests, setRunTests] = useState(false)

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3004'

  const testEndpoint = async (endpoint: string, data: any, resultKey: string) => {
    if (!apiKey) {
      setResults(prev => ({
        ...prev,
        [resultKey]: { error: 'Clé API requise pour tester les fonctionnalités premium' }
      }))
      return
    }

    try {
      setLoading(true)
      
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()
      
      setResults(prev => ({
        ...prev,
        [resultKey]: {
          success: response.ok,
          status: response.status,
          data: result
        }
      }))
    } catch (error: any) {
      setResults(prev => ({
        ...prev,
        [resultKey]: {
          success: false,
          error: error.message || 'Erreur de connexion'
        }
      }))
    } finally {
      setLoading(false)
    }
  }

  const testAdvancedCompilation = () => {
    testEndpoint('/api/premium/compile/advanced', {
      sourceCode,
      contractName,
      optimizationLevel,
      generateDocs,
      runTests
    }, 'advanced')
  }

  const testSecurityAnalysis = () => {
    testEndpoint('/api/premium/security/analyze', {
      sourceCode,
      contractName
    }, 'security')
  }

  const testGasOptimization = () => {
    testEndpoint('/api/premium/gas/optimize', {
      sourceCode,
      contractName,
      targetLevel: optimizationLevel
    }, 'gas')
  }

  const testDocGeneration = () => {
    testEndpoint('/api/premium/docs/generate', {
      sourceCode,
      contractName,
      format: 'markdown'
    }, 'docs')
  }

  const testAutoTesting = () => {
    testEndpoint('/api/premium/tests/generate', {
      sourceCode,
      contractName,
      testFramework: 'hardhat'
    }, 'tests')
  }

  const renderResult = (result: any, title: string) => {
    if (!result) return null

    return (
      <Box mt={2}>
        <Typography variant="h6" gutterBottom>
          Résultat - {title}
        </Typography>
        <Paper variant="outlined" sx={{ p: 2, maxHeight: 400, overflow: 'auto' }}>
          {result.error ? (
            <Alert severity="error">
              {result.error}
            </Alert>
          ) : result.success ? (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                ✅ Requête réussie (Status: {result.status})
              </Alert>
              <Typography variant="body2" component="pre" sx={{ 
                whiteSpace: 'pre-wrap', 
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                backgroundColor: '#f5f5f5',
                p: 1,
                borderRadius: 1,
                maxHeight: 300,
                overflow: 'auto'
              }}>
                {JSON.stringify(result.data, null, 2)}
              </Typography>
            </Box>
          ) : (
            <Alert severity="error">
              ❌ Erreur (Status: {result.status})
              <Typography variant="body2" component="pre" sx={{ mt: 1, fontFamily: 'monospace' }}>
                {JSON.stringify(result.data, null, 2)}
              </Typography>
            </Alert>
          )}
        </Paper>
      </Box>
    )
  }

  if (!apiKey) {
    return (
      <Card>
        <CardContent>
          <Alert severity="warning">
            <Typography variant="h6" gutterBottom>
              🔑 Clé API Requise
            </Typography>
            <Typography variant="body2">
              Configurez une clé API dans l'onglet "API" pour tester les fonctionnalités premium.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <StarIcon color="primary" />
            <Typography variant="h5">
              {t("apiKeys.premiumTester")}
            </Typography>
            <Chip label={t("apiKeys.activeApiKey")} color="success" size="small" />
          </Box>
          
          <Typography variant="body2" color="text.secondary" mb={3}>
            {t("apiKeys.testPremiumFeatures")}
          </Typography>

          {/* Configuration du contrat */}
          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} md={8}>
              <TextField
                label={t("apiKeys.solidityCode")}
                multiline
                rows={8}
                fullWidth
                value={sourceCode}
                onChange={(e) => setSourceCode(e.target.value)}
                variant="outlined"
                sx={{ fontFamily: 'monospace' }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Box display="flex" flexDirection="column" gap={2}>
                <TextField
                  label={t("apiKeys.contractName")}
                  value={contractName}
                  onChange={(e) => setContractName(e.target.value)}
                  fullWidth
                />
                
                <FormControl fullWidth>
                  <InputLabel>Niveau d'Optimisation</InputLabel>
                  <Select
                    value={optimizationLevel}
                    onChange={(e) => setOptimizationLevel(e.target.value as any)}
                  >
                    <MenuItem value="standard">Standard</MenuItem>
                    <MenuItem value="aggressive">Aggressive</MenuItem>
                    <MenuItem value="size">Size</MenuItem>
                    <MenuItem value="gas">Gas</MenuItem>
                  </Select>
                </FormControl>

                <FormControlLabel
                  control={
                    <Switch
                      checked={generateDocs}
                      onChange={(e) => setGenerateDocs(e.target.checked)}
                    />
                  }
                  label={t("apiKeys.generateDocs")}
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={runTests}
                      onChange={(e) => setRunTests(e.target.checked)}
                    />
                  }
                  label={t("apiKeys.runTests")}
                />
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Boutons de test */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={2.4}>
              <Button
                variant="contained"
                fullWidth
                startIcon={<StarIcon />}
                onClick={testAdvancedCompilation}
                disabled={loading}
                sx={{ mb: 1 }}
              >
                Compilation Avancée
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Button
                variant="contained"
                fullWidth
                startIcon={<SecurityIcon />}
                onClick={testSecurityAnalysis}
                disabled={loading}
                color="error"
                sx={{ mb: 1 }}
              >
                Analyse Sécurité
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Button
                variant="contained"
                fullWidth
                startIcon={<SpeedIcon />}
                onClick={testGasOptimization}
                disabled={loading}
                color="warning"
                sx={{ mb: 1 }}
              >
                Optimisation Gas
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Button
                variant="contained"
                fullWidth
                startIcon={<DocsIcon />}
                onClick={testDocGeneration}
                disabled={loading}
                color="info"
                sx={{ mb: 1 }}
              >
                Documentation
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Button
                variant="contained"
                fullWidth
                startIcon={<TestIcon />}
                onClick={testAutoTesting}
                disabled={loading}
                color="success"
                sx={{ mb: 1 }}
              >
                Tests Auto
              </Button>
            </Grid>
          </Grid>

          {loading && (
            <Box display="flex" justifyContent="center" mt={2}>
              <CircularProgress />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Résultats */}
      {Object.keys(results).length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📊 Résultats des Tests
            </Typography>
            
            {results.advanced && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <StarIcon />
                    <Typography>Compilation Avancée</Typography>
                    <Chip 
                      label={results.advanced.success ? 'Succès' : 'Erreur'} 
                      color={results.advanced.success ? 'success' : 'error'} 
                      size="small" 
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {renderResult(results.advanced, 'Compilation Avancée')}
                </AccordionDetails>
              </Accordion>
            )}

            {results.security && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <SecurityIcon />
                    <Typography>Analyse de Sécurité</Typography>
                    <Chip 
                      label={results.security.success ? 'Succès' : 'Erreur'} 
                      color={results.security.success ? 'success' : 'error'} 
                      size="small" 
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {renderResult(results.security, 'Analyse de Sécurité')}
                </AccordionDetails>
              </Accordion>
            )}

            {results.gas && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <SpeedIcon />
                    <Typography>Optimisation de Gas</Typography>
                    <Chip 
                      label={results.gas.success ? 'Succès' : 'Erreur'} 
                      color={results.gas.success ? 'success' : 'error'} 
                      size="small" 
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {renderResult(results.gas, 'Optimisation de Gas')}
                </AccordionDetails>
              </Accordion>
            )}

            {results.docs && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <DocsIcon />
                    <Typography>Génération de Documentation</Typography>
                    <Chip 
                      label={results.docs.success ? 'Succès' : 'Erreur'} 
                      color={results.docs.success ? 'success' : 'error'} 
                      size="small" 
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {renderResult(results.docs, 'Génération de Documentation')}
                </AccordionDetails>
              </Accordion>
            )}

            {results.tests && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <TestIcon />
                    <Typography>Tests Automatiques</Typography>
                    <Chip 
                      label={results.tests.success ? 'Succès' : 'Erreur'} 
                      color={results.tests.success ? 'success' : 'error'} 
                      size="small" 
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {renderResult(results.tests, 'Tests Automatiques')}
                </AccordionDetails>
              </Accordion>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  )
}

export default PremiumApiTester