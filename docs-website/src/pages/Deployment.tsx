import {
  Box,
  Container,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Card,
  CardContent,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material'
import {
  AccountBalanceWallet as WalletIcon,
  Code as CodeIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  RocketLaunch as DeployIcon,
  Verified as VerifyIcon,
  ContentCopy as CopyIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material'
import { useState } from 'react'

const Deployment = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(label)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const deploymentSteps = [
    {
      label: 'Connect Wallet & Select Network',
      description: 'Connect your Web3 wallet and choose the blockchain network for deployment',
      details: [
        'Supports 13 mainnet and 3 testnet networks',
        'Automatic network switching if needed',
        'Gas price estimation for selected network',
        'Balance verification before deployment'
      ],
      icon: <WalletIcon />,
      gasImpact: 'None'
    },
    {
      label: 'Choose Template & Configure',
      description: 'Select contract template and fill in required parameters',
      details: [
        '4 main templates: Token, NFT, DAO, Lock',
        'Real-time parameter validation',
        'Preview generated contract code',
        'Add premium features if needed'
      ],
      icon: <CodeIcon />,
      gasImpact: 'Varies by features'
    },
    {
      label: 'Premium Features Selection',
      description: 'Add advanced features like multisig, vesting, or staking',
      details: [
        '16+ premium features available',
        'Feature compatibility checking',
        'Additional cost calculation (0.001-0.008 ETH)',
        'Gas overhead estimation per feature'
      ],
      icon: <SecurityIcon />,
      gasImpact: '+10-50% base gas'
    },
    {
      label: 'Gas Estimation & Review',
      description: 'Review complete deployment cost and gas estimation',
      details: [
        'Real-time gas price from network',
        'Total deployment cost breakdown',
        'Platform fee calculation (2%)',
        'Final contract code review'
      ],
      icon: <SpeedIcon />,
      gasImpact: 'Exact calculation'
    },
    {
      label: 'Contract Deployment',
      description: 'Deploy the contract to the blockchain via factory pattern',
      details: [
        'Factory contract creates your contract',
        'Optimized deployment gas costs',
        'Transaction hash provided instantly',
        'Contract address prediction'
      ],
      icon: <DeployIcon />,
      gasImpact: 'Actual network cost'
    },
    {
      label: 'Automatic Verification',
      description: 'Contract source code automatically verified on block explorer',
      details: [
        'Automatic verification on all networks',
        'Source code and ABI published',
        'Constructor arguments included',
        'Ready for immediate interaction'
      ],
      icon: <VerifyIcon />,
      gasImpact: 'Free service'
    }
  ]

  const factoryAddresses = {
    primary: {
      address: '0xbCEabbe19292e64408AA168f8e39Eb05f92bcfd0',
      networks: ['Ethereum', 'BNB Chain', 'Celo', 'Linea', 'HyperEVM', 'Zora', 'Gnosis'],
      description: 'Main factory address used on 7 networks'
    },
    shared: {
      address: '0x7ee5BbF0023011AF23592e67A2bb1b551746b1E4',
      networks: ['Base', 'Optimism'],
      description: 'Shared address for L2 networks'
    },
    unique: [
      { address: '0x5077b0ebbf5854c701f580e6921b19a05fdfadf3', network: 'Arbitrum One' },
      { address: '0xB18FF5A80F6C34cf31C026a0225847aF2552366D', network: 'Polygon' },
      { address: '0x3dAE8C5D28F02C2b2F04DF97f7d785BB1761B544', network: 'Avalanche' },
      { address: '0x320649FF14aB842D1e5047AEf2Db33661FEc9942', network: 'Scroll' }
    ],
    testnet: {
      address: '0x57cf238111014032FF4c0A981B021eF96bc1E09F',
      networks: ['Ethereum Sepolia', 'Base Sepolia', 'Monad Testnet'],
      description: 'Deterministic address across all testnets'
    }
  }

  const gasOptimizationTips = [
    {
      title: 'Deploy During Low Network Usage',
      description: 'Deploy during off-peak hours to reduce gas costs',
      savings: '20-50%',
      icon: <SpeedIcon />
    },
    {
      title: 'Consider Layer 2 Networks',
      description: 'Use Arbitrum, Polygon, or Base for significantly lower fees',
      savings: '90-99%',
      icon: <SecurityIcon />
    },
    {
      title: 'Select Only Needed Features',
      description: 'Each premium feature adds gas overhead to all operations',
      savings: '10-30%',
      icon: <CodeIcon />
    }
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
        🚀 Smart Contract Deployment
      </Typography>
      
      <Typography variant="h5" sx={{ color: '#94a3b8', mb: 4 }}>
        Complete guide to deploying smart contracts with ContractForge
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
        {/* Main Deployment Process */}
        <Box sx={{ flex: { xs: '1', md: '2' } }}>
          <Typography variant="h4" gutterBottom sx={{ color: '#ffffff', mb: 3 }}>
            📋 Deployment Process
          </Typography>

          <Stepper orientation="vertical" sx={{ 
            '& .MuiStepLabel-root': { pb: 2 },
            '& .MuiStepConnector-line': { borderColor: 'rgba(255, 255, 255, 0.1)' }
          }}>
            {deploymentSteps.map((step) => (
              <Step key={step.label} active={true}>
                <StepLabel 
                  StepIconComponent={() => (
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: '#6366f1',
                      color: '#ffffff'
                    }}>
                      {step.icon}
                    </Box>
                  )}
                  sx={{
                    '& .MuiStepLabel-label': {
                      color: '#ffffff',
                      fontWeight: 600,
                      fontSize: '1.1rem'
                    }
                  }}
                >
                  {step.label}
                </StepLabel>
                <StepContent>
                  <Typography sx={{ color: '#94a3b8', mb: 2 }}>
                    {step.description}
                  </Typography>
                  <List dense>
                    {step.details.map((detail, detailIndex) => (
                      <ListItem key={detailIndex} sx={{ py: 0 }}>
                        <ListItemIcon><CheckIcon sx={{ color: '#10b981' }} fontSize="small" /></ListItemIcon>
                        <ListItemText 
                          primary={detail}
                          primaryTypographyProps={{ 
                            color: '#94a3b8',
                            fontSize: '0.9rem'
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                  <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>Gas Impact:</Typography>
                    <Chip
                      label={step.gasImpact}
                      size="small"
                      sx={{
                        backgroundColor: step.gasImpact === 'None' || step.gasImpact === 'Free service' ? '#10b981' :
                                       step.gasImpact === 'Exact calculation' || step.gasImpact === 'Actual network cost' ? '#6366f1' :
                                       '#f59e0b',
                        color: '#ffffff',
                        fontSize: '0.7rem'
                      }}
                    />
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>

          {/* Gas Optimization */}
          <Paper sx={{ p: 3, mt: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#ffffff' }}>
              ⚡ Gas Optimization Tips
            </Typography>
            <List>
              {gasOptimizationTips.map((tip, index) => (
                <ListItem key={index}>
                  <ListItemIcon>{tip.icon}</ListItemIcon>
                  <ListItemText
                    primary={tip.title}
                    secondary={tip.description}
                    primaryTypographyProps={{ color: '#ffffff' }}
                    secondaryTypographyProps={{ color: '#94a3b8' }}
                  />
                  <Chip
                    label={`Save ${tip.savings}`}
                    size="small"
                    sx={{
                      backgroundColor: '#10b981',
                      color: '#ffffff',
                      fontWeight: 600
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Box>

        {/* Sidebar with Factory Info */}
        <Box sx={{ flex: { xs: '1', md: '1' } }}>
          {/* Factory Contracts */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#6366f1' }}>
                🏭 Factory Contracts
              </Typography>
              
              {/* Primary Factory */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#10b981', mb: 1 }}>
                  UniversalFactoryV2 - Primary ({factoryAddresses.primary.networks.length} Networks)
                </Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
                  {factoryAddresses.primary.description}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography
                    component="code"
                    variant="body2"
                    sx={{
                      fontFamily: 'monospace',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      color: '#10b981',
                      p: 1,
                      borderRadius: 1,
                      fontSize: '0.75rem',
                      wordBreak: 'break-all',
                      flex: 1,
                      border: '1px solid rgba(16, 185, 129, 0.2)'
                    }}
                  >
                    {factoryAddresses.primary.address}
                  </Typography>
                  <Tooltip title={copiedCode === 'primary-address' ? 'Copied!' : 'Copy Address'}>
                    <IconButton
                      size="small"
                      onClick={() => copyToClipboard(factoryAddresses.primary.address, 'primary-address')}
                      sx={{ color: '#10b981' }}
                    >
                      <CopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {factoryAddresses.primary.networks.map((network) => (
                    <Chip
                      key={network}
                      label={network}
                      size="small"
                      sx={{
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        color: '#10b981',
                        fontSize: '0.7rem',
                        border: '1px solid rgba(16, 185, 129, 0.2)'
                      }}
                    />
                  ))}
                </Box>
              </Box>

              <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

              {/* Shared Factory */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#8b5cf6', mb: 1 }}>
                  Base & Optimism - Shared Address
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography component="code" variant="caption" sx={{ 
                    fontFamily: 'monospace',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    color: '#8b5cf6',
                    p: 0.5, 
                    borderRadius: 0.5,
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    fontSize: '0.75rem'
                  }}>
                    {factoryAddresses.shared.address}
                  </Typography>
                  <Tooltip title={copiedCode === 'shared-address' ? 'Copied!' : 'Copy Address'}>
                    <IconButton
                      size="small"
                      onClick={() => copyToClipboard(factoryAddresses.shared.address, 'shared-address')}
                      sx={{ color: '#8b5cf6' }}
                    >
                      <CopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

              {/* Testnet Factory */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#6366f1', mb: 1 }}>
                  🧪 Testnet Networks - Deterministic Address
                </Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
                  Same address on all testnet networks for consistent testing
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography
                    component="code"
                    variant="body2"
                    sx={{
                      fontFamily: 'monospace',
                      backgroundColor: 'rgba(99, 102, 241, 0.1)',
                      color: '#6366f1',
                      p: 1,
                      borderRadius: 1,
                      fontSize: '0.75rem',
                      wordBreak: 'break-all',
                      flex: 1,
                      border: '1px solid rgba(99, 102, 241, 0.2)'
                    }}
                  >
                    {factoryAddresses.testnet.address}
                  </Typography>
                  <Tooltip title={copiedCode === 'testnet-address' ? 'Copied!' : 'Copy Address'}>
                    <IconButton
                      size="small"
                      onClick={() => copyToClipboard(factoryAddresses.testnet.address, 'testnet-address')}
                      sx={{ color: '#6366f1' }}
                    >
                      <CopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Alert severity="info" sx={{ 
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  '& .MuiAlert-icon': { color: '#6366f1' }
                }}>
                  <Typography variant="caption" sx={{ color: '#ffffff' }}>
                    <strong>Deterministic Deployment:</strong> Same address across all testnet networks for consistent testing
                  </Typography>
                </Alert>
              </Box>

              <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

              {/* Unique Addresses */}
              <Box>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#f59e0b', mb: 1 }}>
                  🔗 Network-Specific Addresses
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {factoryAddresses.unique.map((item) => (
                    <Box key={item.network} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" sx={{ color: '#ffffff', minWidth: 80, fontWeight: 'medium' }}>
                        {item.network}:
                      </Typography>
                      <Typography component="code" variant="caption" sx={{ 
                        fontFamily: 'monospace',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        color: '#f59e0b',
                        p: 0.5, 
                        borderRadius: 0.5,
                        border: '1px solid rgba(245, 158, 11, 0.2)',
                        fontSize: '0.7rem'
                      }}>
                        {item.address}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Cost Breakdown */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#6366f1' }}>
                💰 Cost Breakdown
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Base Deployment"
                    secondary="Network gas fees only"
                    primaryTypographyProps={{ color: '#ffffff' }}
                    secondaryTypographyProps={{ color: '#94a3b8' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Premium Features"
                    secondary="0.001 - 0.008 ETH per feature"
                    primaryTypographyProps={{ color: '#ffffff' }}
                    secondaryTypographyProps={{ color: '#94a3b8' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Platform Fee"
                    secondary="2% of total deployment value"
                    primaryTypographyProps={{ color: '#ffffff' }}
                    secondaryTypographyProps={{ color: '#94a3b8' }}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          <Alert severity="warning" sx={{ 
            mb: 2,
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            '& .MuiAlert-icon': { color: '#f59e0b' }
          }}>
            <Typography variant="body2" sx={{ color: '#ffffff' }}>
              <strong>Always test first:</strong> Deploy on testnets before mainnet to avoid costly mistakes.
            </Typography>
          </Alert>

          <Alert severity="success" sx={{ 
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            '& .MuiAlert-icon': { color: '#10b981' }
          }}>
            <Typography variant="body2" sx={{ color: '#ffffff' }}>
              <strong>Auto-verification:</strong> All contracts are automatically verified on block explorers for transparency.
            </Typography>
          </Alert>
        </Box>
      </Box>
    </Container>
  )
}

export default Deployment
