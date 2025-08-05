import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
} from '@mui/material'
import {
  AccountBalanceWallet as WalletIcon,
  Code as CodeIcon,
  Settings as SettingsIcon,
  RocketLaunch as DeployIcon,
  CheckCircle as CheckIcon,
  Launch as LaunchIcon,
} from '@mui/icons-material'

const QuickStart = () => {
  const steps = [
    {
      label: 'Connect Your Wallet',
      content: 'Connect your Web3 wallet using RainbowKit. We support MetaMask, WalletConnect, and many other wallets.',
      icon: <WalletIcon />,
      action: 'Connect Wallet'
    },
    {
      label: 'Choose a Template',
      content: 'Select from our 4 main templates: ERC-20 Token, ERC-721 NFT, DAO Governance, or Token Lock contract.',
      icon: <CodeIcon />,
      action: 'Browse Templates'
    },
    {
      label: 'Configure Parameters',
      content: 'Fill in your contract parameters like name, symbol, supply, and select premium features.',
      icon: <SettingsIcon />,
      action: 'Configure Contract'
    },
    {
      label: 'Deploy Contract',
      content: 'Review gas estimation, confirm the transaction, and deploy your contract to your chosen network.',
      icon: <DeployIcon />,
      action: 'Deploy Now'
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
        🚀 Quick Start Guide
      </Typography>
      
      <Typography variant="h5" sx={{ color: '#94a3b8', mb: 4 }}>
        Get your smart contract deployed in minutes
      </Typography>

      <Alert severity="info" sx={{ 
        mb: 4,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        '& .MuiAlert-icon': { color: '#6366f1' }
      }}>
        <Typography variant="body2" sx={{ color: '#ffffff' }}>
          <strong>New to smart contracts?</strong> No problem! ContractForge makes it easy for anyone to deploy professional-grade contracts without coding knowledge.
        </Typography>
      </Alert>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
        {/* Main Steps */}
        <Box sx={{ flex: { xs: '1', md: '2' } }}>
          <Typography variant="h4" gutterBottom sx={{ color: '#ffffff', mb: 3 }}>
            Step-by-Step Process
          </Typography>

          <Stepper orientation="vertical" sx={{ 
            '& .MuiStepLabel-root': { pb: 2 },
            '& .MuiStepConnector-line': { borderColor: 'rgba(255, 255, 255, 0.1)' }
          }}>
            {steps.map((step) => (
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
                    {step.content}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{
                      borderColor: '#6366f1',
                      color: '#6366f1',
                      '&:hover': {
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        borderColor: '#6366f1',
                      }
                    }}
                  >
                    {step.action}
                  </Button>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </Box>

        {/* Quick Tips */}
        <Box sx={{ flex: { xs: '1', md: '1' } }}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#6366f1' }}>
                💡 Quick Tips
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><CheckIcon sx={{ color: '#10b981' }} fontSize="small" /></ListItemIcon>
                  <ListItemText 
                    primary="Start with testnets"
                    secondary="Test your contracts on Sepolia or Base Sepolia first"
                    primaryTypographyProps={{ color: '#ffffff', fontSize: '0.9rem' }}
                    secondaryTypographyProps={{ color: '#94a3b8', fontSize: '0.8rem' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon sx={{ color: '#10b981' }} fontSize="small" /></ListItemIcon>
                  <ListItemText 
                    primary="Review before deploy"
                    secondary="Always check the generated code and gas estimation"
                    primaryTypographyProps={{ color: '#ffffff', fontSize: '0.9rem' }}
                    secondaryTypographyProps={{ color: '#94a3b8', fontSize: '0.8rem' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon sx={{ color: '#10b981' }} fontSize="small" /></ListItemIcon>
                  <ListItemText 
                    primary="Choose your network"
                    secondary="Consider gas fees - L2s like Arbitrum and Polygon are cheaper"
                    primaryTypographyProps={{ color: '#ffffff', fontSize: '0.9rem' }}
                    secondaryTypographyProps={{ color: '#94a3b8', fontSize: '0.8rem' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon sx={{ color: '#10b981' }} fontSize="small" /></ListItemIcon>
                  <ListItemText 
                    primary="Premium features"
                    secondary="Add advanced features like multisig or vesting for 0.001+ ETH"
                    primaryTypographyProps={{ color: '#ffffff', fontSize: '0.9rem' }}
                    secondaryTypographyProps={{ color: '#94a3b8', fontSize: '0.8rem' }}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#6366f1' }}>
                💰 Cost Breakdown
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ color: '#ffffff', fontSize: '0.9rem' }}>Network Gas:</Typography>
                  <Chip label="Variable" size="small" sx={{ 
                    backgroundColor: '#f59e0b', 
                    color: '#ffffff',
                    fontSize: '0.7rem'
                  }} />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ color: '#ffffff', fontSize: '0.9rem' }}>Platform Fee:</Typography>
                  <Chip label="2%" size="small" sx={{ 
                    backgroundColor: '#6366f1', 
                    color: '#ffffff',
                    fontSize: '0.7rem'
                  }} />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ color: '#ffffff', fontSize: '0.9rem' }}>Premium Features:</Typography>
                  <Chip label="0.001+ ETH" size="small" sx={{ 
                    backgroundColor: '#8b5cf6', 
                    color: '#ffffff',
                    fontSize: '0.7rem'
                  }} />
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#6366f1' }}>
                🌐 Recommended Networks
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ color: '#ffffff', fontSize: '0.9rem' }}>Cheapest:</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Chip label="Polygon" size="small" sx={{ backgroundColor: '#10b981', color: '#ffffff', fontSize: '0.7rem' }} />
                    <Chip label="Arbitrum" size="small" sx={{ backgroundColor: '#10b981', color: '#ffffff', fontSize: '0.7rem' }} />
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ color: '#ffffff', fontSize: '0.9rem' }}>Most Secure:</Typography>
                  <Chip label="Ethereum" size="small" sx={{ backgroundColor: '#6366f1', color: '#ffffff', fontSize: '0.7rem' }} />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ color: '#ffffff', fontSize: '0.9rem' }}>Testing:</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Chip label="Sepolia" size="small" sx={{ backgroundColor: '#94a3b8', color: '#ffffff', fontSize: '0.7rem' }} />
                    <Chip label="Base Sepolia" size="small" sx={{ backgroundColor: '#94a3b8', color: '#ffffff', fontSize: '0.7rem' }} />
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Alert severity="success" sx={{ 
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            '& .MuiAlert-icon': { color: '#10b981' }
          }}>
            <Typography variant="body2" sx={{ color: '#ffffff' }}>
              <strong>Auto-verified:</strong> All deployed contracts are automatically verified on block explorers for transparency.
            </Typography>
          </Alert>
        </Box>
      </Box>

      {/* Quick Action CTA */}
      <Box sx={{ mt: 6, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom sx={{ color: '#ffffff' }}>
          Ready to Deploy?
        </Typography>
        <Typography variant="body1" sx={{ color: '#94a3b8', mb: 3 }}>
          Start creating your smart contract now - no coding required!
        </Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={<LaunchIcon />}
          href="https://contractforge.io"
          target="_blank"
          sx={{
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            },
            px: 4,
            py: 1.5,
            fontSize: '1.1rem',
            fontWeight: 600,
          }}
        >
          Launch ContractForge
        </Button>
      </Box>
    </Container>
  )
}

export default QuickStart
