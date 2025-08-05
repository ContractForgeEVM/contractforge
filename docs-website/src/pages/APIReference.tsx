import {
  Box,
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material'
import {
  ContentCopy as CopyIcon,
  Api as ApiIcon,
  Security as SecurityIcon,
  Star as StarIcon,
} from '@mui/icons-material'
import { useState } from 'react'

const APIReference = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(label)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const publicApiEndpoints = [
    { method: 'POST', endpoint: '/api/web/compile', description: 'Compile smart contract from template and parameters', tier: 'public' },
    { method: 'POST', endpoint: '/api/web/compile/template', description: 'Compile specific template with custom parameters', tier: 'public' },
    { method: 'POST', endpoint: '/api/web/compile/foundry', description: 'Compile using Foundry compiler (faster)', tier: 'public' },
    { method: 'POST', endpoint: '/api/web/preview', description: 'Preview generated contract code without compilation', tier: 'public' },
    { method: 'POST', endpoint: '/api/deploy', description: 'Deploy compiled contract to blockchain', tier: 'public' },
    { method: 'GET', endpoint: '/api/gas-estimate', description: 'Estimate gas costs for deployment', tier: 'public' },
    { method: 'POST', endpoint: '/api/verify', description: 'Verify deployed contract on block explorer', tier: 'public' },
    { method: 'GET', endpoint: '/api/health', description: 'Check API health and status', tier: 'public' },
  ]

  const apiKeyEndpoints = [
    { method: 'POST', endpoint: '/api/keys', description: 'Create new API key for user', tier: 'master', auth: 'Master Key' },
    { method: 'GET', endpoint: '/api/keys/user/:userId', description: 'List all API keys for specific user', tier: 'master', auth: 'Master Key' },
    { method: 'DELETE', endpoint: '/api/keys/:keyId', description: 'Revoke and delete API key', tier: 'master', auth: 'Master Key' },
  ]

  const premiumApiEndpoints = [
    { method: 'POST', endpoint: '/api/premium/compile/advanced', description: 'Advanced compilation with security analysis', tier: 'premium', auth: 'Premium API Key' },
    { method: 'POST', endpoint: '/api/premium/security/analyze', description: 'Comprehensive security analysis of contract', tier: 'premium', auth: 'Premium API Key' },
    { method: 'POST', endpoint: '/api/premium/gas/optimize', description: 'Gas optimization suggestions and improvements', tier: 'premium', auth: 'Premium API Key' },
    { method: 'POST', endpoint: '/api/premium/docs/generate', description: 'Auto-generate documentation for contract', tier: 'premium', auth: 'Premium API Key' },
    { method: 'POST', endpoint: '/api/premium/tests/generate', description: 'Generate comprehensive test suite', tier: 'premium', auth: 'Premium API Key' },
  ]

  const subscriptionTiers = [
    { 
      tier: 'Free', 
      rateLimit: '5 req/min', 
      features: 'Basic compilation, deployment, verification', 
      apiAccess: 'Public endpoints only',
      color: 'default' as const
    },
    { 
      tier: 'Starter', 
      rateLimit: '30 req/min', 
      features: 'All basic features + API key management', 
      apiAccess: 'Public + Key management',
      color: 'primary' as const
    },
    { 
      tier: 'Pro', 
      rateLimit: '60 req/min', 
      features: 'All features + Premium endpoints + Analytics', 
      apiAccess: 'All endpoints',
      color: 'secondary' as const
    },
    { 
      tier: 'Enterprise', 
      rateLimit: '200 req/min', 
      features: 'All features + Priority support + Custom integrations', 
      apiAccess: 'All endpoints + White-label',
      color: 'success' as const
    },
  ]

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h1" component="h1" gutterBottom sx={{
        fontWeight: 800,
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        mb: 2,
        letterSpacing: '-0.02em',
      }}>
        📚 API Reference
      </Typography>
      
      <Typography variant="h5" sx={{ color: '#94a3b8', mb: 4 }}>
        Complete REST API documentation for developers
      </Typography>

      {/* Base URL */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#ffffff', display: 'flex', alignItems: 'center', gap: 1 }}>
          <ApiIcon sx={{ color: '#6366f1' }} />
          Base URL
        </Typography>
        <Paper sx={{ 
          p: 2, 
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Typography component="code" variant="body1" sx={{ 
            fontFamily: 'monospace',
            color: '#6366f1',
            fontWeight: 600
          }}>
            https://contractforge.io/
          </Typography>
          <Tooltip title={copiedCode === 'base-url' ? 'Copied!' : 'Copy URL'}>
            <IconButton
              size="small"
              onClick={() => copyToClipboard('https://contractforge.io/', 'base-url')}
              sx={{ color: '#6366f1' }}
            >
              <CopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Paper>
        <Typography variant="body2" sx={{ color: '#94a3b8', mt: 1 }}>
          All API endpoints are relative to this base URL. HTTPS is required for all requests.
        </Typography>
      </Paper>

      {/* Authentication */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#ffffff', display: 'flex', alignItems: 'center', gap: 1 }}>
          <SecurityIcon sx={{ color: '#6366f1' }} />
          Authentication
        </Typography>
        <Typography paragraph sx={{ color: '#94a3b8' }}>
          API keys are required for premium endpoints and higher rate limits. Include your API key in the Authorization header:
        </Typography>
        <Paper sx={{ p: 2, backgroundColor: 'rgba(0, 0, 0, 0.4)', mb: 2 }}>
          <Typography component="pre" variant="body2" sx={{ 
            fontFamily: 'monospace',
            color: '#10b981',
            whiteSpace: 'pre-wrap'
          }}>
{`Authorization: Bearer cfio_your_api_key_here
Content-Type: application/json`}
          </Typography>
        </Paper>
        <Alert severity="info" sx={{ 
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          '& .MuiAlert-icon': { color: '#6366f1' }
        }}>
          <Typography variant="body2" sx={{ color: '#ffffff' }}>
            API keys start with <code style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '2px 4px', borderRadius: '4px' }}>cfio_</code> and can be managed through your account dashboard.
          </Typography>
        </Alert>
      </Paper>

      {/* Subscription Tiers */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#ffffff', display: 'flex', alignItems: 'center', gap: 1 }}>
          <StarIcon sx={{ color: '#6366f1' }} />
          Subscription Tiers
        </Typography>
        <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
          Different subscription tiers offer varying rate limits and API access levels.
        </Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                <TableCell><Typography fontWeight="bold" sx={{ color: '#ffffff' }}>Tier</Typography></TableCell>
                <TableCell><Typography fontWeight="bold" sx={{ color: '#ffffff' }}>Rate Limit</Typography></TableCell>
                <TableCell><Typography fontWeight="bold" sx={{ color: '#ffffff' }}>Features</Typography></TableCell>
                <TableCell><Typography fontWeight="bold" sx={{ color: '#ffffff' }}>API Access</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {subscriptionTiers.map((tier) => (
                <TableRow key={tier.tier} sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.02)' } }}>
                  <TableCell>
                    <Chip 
                      label={tier.tier} 
                      size="small" 
                      sx={{
                        backgroundColor: tier.tier === 'Free' ? '#94a3b8' : 
                                       tier.tier === 'Starter' ? '#6366f1' :
                                       tier.tier === 'Pro' ? '#8b5cf6' : '#10b981',
                        color: '#ffffff',
                        fontWeight: 600
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#ffffff' }}>
                      {tier.rateLimit}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      {tier.features}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ 
                      color: tier.tier === 'Free' ? '#ef4444' : '#10b981' 
                    }}>
                      {tier.apiAccess}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Public API Endpoints */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#ffffff', display: 'flex', alignItems: 'center', gap: 1 }}>
          🌐 Public API Endpoints
        </Typography>
        <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
          These endpoints are available to all users with optional API key authentication for higher rate limits.
        </Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                <TableCell><Typography fontWeight="bold" sx={{ color: '#ffffff' }}>Method</Typography></TableCell>
                <TableCell><Typography fontWeight="bold" sx={{ color: '#ffffff' }}>Endpoint</Typography></TableCell>
                <TableCell><Typography fontWeight="bold" sx={{ color: '#ffffff' }}>Description</Typography></TableCell>
                <TableCell><Typography fontWeight="bold" sx={{ color: '#ffffff' }}>Auth Required</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {publicApiEndpoints.map((endpoint, index) => (
                <TableRow key={index} sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.02)' } }}>
                  <TableCell>
                    <Chip
                      label={endpoint.method}
                      size="small"
                      sx={{
                        backgroundColor: endpoint.method === 'GET' ? '#10b981' : '#6366f1',
                        color: '#ffffff',
                        fontWeight: 600
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography component="code" variant="body2" sx={{ 
                      fontFamily: 'monospace',
                      color: '#8b5cf6',
                      backgroundColor: 'rgba(139, 92, 246, 0.1)',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      {endpoint.endpoint}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      {endpoint.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label="Optional" 
                      size="small" 
                      variant="outlined"
                      sx={{
                        borderColor: '#6366f1',
                        color: '#6366f1'
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* API Key Management */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#ffffff', display: 'flex', alignItems: 'center', gap: 1 }}>
          🔐 API Key Management
        </Typography>
        <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
          Master key endpoints for managing user API keys. Requires master key authentication.
        </Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                <TableCell><Typography fontWeight="bold" sx={{ color: '#ffffff' }}>Method</Typography></TableCell>
                <TableCell><Typography fontWeight="bold" sx={{ color: '#ffffff' }}>Endpoint</Typography></TableCell>
                <TableCell><Typography fontWeight="bold" sx={{ color: '#ffffff' }}>Description</Typography></TableCell>
                <TableCell><Typography fontWeight="bold" sx={{ color: '#ffffff' }}>Auth Required</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {apiKeyEndpoints.map((endpoint, index) => (
                <TableRow key={index} sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.02)' } }}>
                  <TableCell>
                    <Chip
                      label={endpoint.method}
                      size="small"
                      sx={{
                        backgroundColor: endpoint.method === 'GET' ? '#10b981' : 
                                       endpoint.method === 'DELETE' ? '#ef4444' : '#8b5cf6',
                        color: '#ffffff',
                        fontWeight: 600
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography component="code" variant="body2" sx={{ 
                      fontFamily: 'monospace',
                      color: '#8b5cf6',
                      backgroundColor: 'rgba(139, 92, 246, 0.1)',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      {endpoint.endpoint}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      {endpoint.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={endpoint.auth} 
                      size="small" 
                      sx={{
                        backgroundColor: '#f59e0b',
                        color: '#ffffff',
                        fontWeight: 600
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Premium API Endpoints */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#ffffff', display: 'flex', alignItems: 'center', gap: 1 }}>
          ⭐ Premium API Endpoints
        </Typography>
        <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
          Advanced endpoints available to Pro and Enterprise subscribers only.
        </Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                <TableCell><Typography fontWeight="bold" sx={{ color: '#ffffff' }}>Method</Typography></TableCell>
                <TableCell><Typography fontWeight="bold" sx={{ color: '#ffffff' }}>Endpoint</Typography></TableCell>
                <TableCell><Typography fontWeight="bold" sx={{ color: '#ffffff' }}>Description</Typography></TableCell>
                <TableCell><Typography fontWeight="bold" sx={{ color: '#ffffff' }}>Auth Required</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {premiumApiEndpoints.map((endpoint, index) => (
                <TableRow key={index} sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.02)' } }}>
                  <TableCell>
                    <Chip
                      label={endpoint.method}
                      size="small"
                      sx={{
                        backgroundColor: '#8b5cf6',
                        color: '#ffffff',
                        fontWeight: 600
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography component="code" variant="body2" sx={{ 
                      fontFamily: 'monospace',
                      color: '#8b5cf6',
                      backgroundColor: 'rgba(139, 92, 246, 0.1)',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      {endpoint.endpoint}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      {endpoint.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={endpoint.auth} 
                      size="small" 
                      sx={{
                        backgroundColor: '#10b981',
                        color: '#ffffff',
                        fontWeight: 600
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Code Examples */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#ffffff', display: 'flex', alignItems: 'center', gap: 1 }}>
          📝 Code Examples
        </Typography>
        
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, mb: 1, color: '#ffffff' }}>
          Compile ERC-20 Token (Public)
        </Typography>
        <Paper sx={{ p: 2, backgroundColor: 'rgba(0, 0, 0, 0.4)', mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>POST /api/web/compile</Typography>
            <Tooltip title={copiedCode === 'public-example' ? 'Copied!' : 'Copy Example'}>
              <IconButton
                size="small"
                onClick={() => copyToClipboard(`POST /api/web/compile
Content-Type: application/json

{
  "template": "token",
  "params": {
    "name": "MyToken",
    "symbol": "MTK",
    "totalSupply": 1000000,
    "decimals": 18
  },
  "premiumFeatures": ["pausable", "burnable"]
}`, 'public-example')}
                sx={{ color: '#94a3b8' }}
              >
                <CopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          <Typography component="pre" variant="body2" sx={{ 
            fontFamily: 'monospace',
            color: '#10b981',
            whiteSpace: 'pre-wrap'
          }}>
{`{
  "template": "token",
  "params": {
    "name": "MyToken",
    "symbol": "MTK",
    "totalSupply": 1000000,
    "decimals": 18
  },
  "premiumFeatures": ["pausable", "burnable"]
}`}
          </Typography>
        </Paper>

        <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, mb: 1, color: '#ffffff' }}>
          Advanced Compilation (Premium)
        </Typography>
        <Paper sx={{ p: 2, backgroundColor: 'rgba(0, 0, 0, 0.4)', mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>POST /api/premium/compile/advanced</Typography>
            <Tooltip title={copiedCode === 'premium-example' ? 'Copied!' : 'Copy Example'}>
              <IconButton
                size="small"
                onClick={() => copyToClipboard(`POST /api/premium/compile/advanced
Authorization: Bearer cfio_your_premium_api_key
Content-Type: application/json

{
  "sourceCode": "pragma solidity ^0.8.20; contract MyContract { ... }",
  "contractName": "MyContract",
  "analysisLevel": "comprehensive",
  "includeOptimizations": true,
  "generateDocs": true
}`, 'premium-example')}
                sx={{ color: '#94a3b8' }}
              >
                <CopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          <Typography component="pre" variant="body2" sx={{ 
            fontFamily: 'monospace',
            color: '#8b5cf6',
            whiteSpace: 'pre-wrap'
          }}>
{`Authorization: Bearer cfio_your_premium_api_key
Content-Type: application/json

{
  "sourceCode": "pragma solidity ^0.8.20; contract MyContract { ... }",
  "contractName": "MyContract",
  "analysisLevel": "comprehensive",
  "includeOptimizations": true,
  "generateDocs": true
}`}
          </Typography>
        </Paper>

        <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, mb: 1, color: '#ffffff' }}>
          Create API Key (Master)
        </Typography>
        <Paper sx={{ p: 2, backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>POST /api/keys</Typography>
            <Tooltip title={copiedCode === 'key-example' ? 'Copied!' : 'Copy Example'}>
              <IconButton
                size="small"
                onClick={() => copyToClipboard(`POST /api/keys
Authorization: Bearer MASTER_API_KEY
Content-Type: application/json

{
  "name": "My Production Key",
  "userId": "0x1234...abcd",
  "subscriptionTier": "premium"
}`, 'key-example')}
                sx={{ color: '#94a3b8' }}
              >
                <CopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          <Typography component="pre" variant="body2" sx={{ 
            fontFamily: 'monospace',
            color: '#f59e0b',
            whiteSpace: 'pre-wrap'
          }}>
{`Authorization: Bearer MASTER_API_KEY
Content-Type: application/json

{
  "name": "My Production Key",
  "userId": "0x1234...abcd",
  "subscriptionTier": "premium"
}`}
          </Typography>
        </Paper>
      </Paper>
    </Container>
  )
}

export default APIReference
