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
  Chip,
  Alert,
} from '@mui/material'
import {
  Code as CodeIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Public as PublicIcon,
  Token as TokenIcon,
} from '@mui/icons-material'

const Overview = () => {
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
        Welcome to ContractForge
      </Typography>
      
      <Typography variant="h5" sx={{ color: '#94a3b8', mb: 4 }}>
        The most advanced smart contract deployment platform
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
        <Box sx={{ flex: { xs: '1', md: '2' } }}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              color: '#ffffff'
            }}>
              <CodeIcon sx={{ color: '#6366f1' }} />
              Platform Overview
            </Typography>
            <Typography paragraph sx={{ color: '#94a3b8' }}>
              ContractForge is a comprehensive smart contract development and deployment platform that simplifies the process of creating, customizing, and deploying smart contracts across multiple blockchain networks.
            </Typography>
            <Typography variant="h6" gutterBottom sx={{ mt: 3, color: '#ffffff' }}>Key Features</Typography>
            <List>
              <ListItem>
                <ListItemIcon><TokenIcon sx={{ color: '#6366f1' }} /></ListItemIcon>
                <ListItemText 
                  primary="Multi-Template Support" 
                  secondary="Create tokens, NFTs, DAOs, and lock contracts with ease"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><SecurityIcon sx={{ color: '#6366f1' }} /></ListItemIcon>
                <ListItemText 
                  primary="Built-in Security + Audit Service" 
                  secondary="Secure templates included + Professional audit service for custom contracts"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><TokenIcon sx={{ color: '#6366f1' }} /></ListItemIcon>
                <ListItemText 
                  primary="Premium Features" 
                  secondary="Advanced features like multisig, vesting, staking, and more"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><PublicIcon sx={{ color: '#6366f1' }} /></ListItemIcon>
                <ListItemText 
                  primary="Multi-Chain Support" 
                  secondary="Deploy on 14+ networks including Ethereum, Arbitrum, Polygon, and more"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><SpeedIcon sx={{ color: '#6366f1' }} /></ListItemIcon>
                <ListItemText 
                  primary="Real-Time Compilation" 
                  secondary="Instant contract compilation with Foundry and Hardhat support"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
            </List>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ color: '#ffffff' }}>Technology Stack</Typography>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#ffffff' }}>Frontend</Typography>
                <List dense>
                  <ListItem><ListItemText primary="React 18 + TypeScript" primaryTypographyProps={{ color: '#94a3b8' }} /></ListItem>
                  <ListItem><ListItemText primary="Vite Build Tool" primaryTypographyProps={{ color: '#94a3b8' }} /></ListItem>
                  <ListItem><ListItemText primary="Material-UI v5" primaryTypographyProps={{ color: '#94a3b8' }} /></ListItem>
                  <ListItem><ListItemText primary="RainbowKit v2" primaryTypographyProps={{ color: '#94a3b8' }} /></ListItem>
                  <ListItem><ListItemText primary="wagmi + viem" primaryTypographyProps={{ color: '#94a3b8' }} /></ListItem>
                </List>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#ffffff' }}>Smart Contracts</Typography>
                <List dense>
                  <ListItem><ListItemText primary="OpenZeppelin Contracts v4.9.6" primaryTypographyProps={{ color: '#94a3b8' }} /></ListItem>
                  <ListItem><ListItemText primary="Solidity ^0.8.20" primaryTypographyProps={{ color: '#94a3b8' }} /></ListItem>
                  <ListItem><ListItemText primary="Foundry + Solc (primary)" primaryTypographyProps={{ color: '#94a3b8' }} /></ListItem>
                  <ListItem><ListItemText primary="Hardhat (fallback)" primaryTypographyProps={{ color: '#94a3b8' }} /></ListItem>
                  <ListItem><ListItemText primary="EIP Standards Compliant" primaryTypographyProps={{ color: '#94a3b8' }} /></ListItem>
                </List>
              </Box>
            </Box>
          </Paper>
        </Box>

        <Box sx={{ flex: { xs: '1', md: '1' } }}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#6366f1' }}>Quick Stats</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ color: '#ffffff' }}>Templates:</Typography>
                  <Chip label="12" size="small" sx={{ 
                    backgroundColor: '#6366f1', 
                    color: '#ffffff',
                    fontWeight: 600
                  }} />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ color: '#ffffff' }}>Premium Features:</Typography>
                  <Chip label="20+" size="small" sx={{ 
                    backgroundColor: '#8b5cf6', 
                    color: '#ffffff',
                    fontWeight: 600
                  }} />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ color: '#ffffff' }}>Supported Networks:</Typography>
                  <Chip label="14" size="small" sx={{ 
                    backgroundColor: '#10b981', 
                    color: '#ffffff',
                    fontWeight: 600
                  }} />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ color: '#ffffff' }}>Platform Fee:</Typography>
                  <Chip label="2%" size="small" sx={{ 
                    backgroundColor: '#f59e0b', 
                    color: '#ffffff',
                    fontWeight: 600
                  }} />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ color: '#ffffff' }}>Security Tools:</Typography>
                  <Chip label="3+" size="small" sx={{ 
                    backgroundColor: '#ef4444', 
                    color: '#ffffff',
                    fontWeight: 600
                  }} />
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Alert 
            severity="info" 
            sx={{ 
              mb: 2,
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              '& .MuiAlert-icon': { color: '#6366f1' }
            }}
          >
            <Typography variant="body2" sx={{ color: '#ffffff' }}>
              All smart contracts are based on OpenZeppelin's audited libraries and follow industry best practices.
            </Typography>
          </Alert>

          <Alert 
            severity="success" 
            sx={{ 
              mb: 2,
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              '& .MuiAlert-icon': { color: '#10b981' }
            }}
          >
            <Typography variant="body2" sx={{ color: '#ffffff' }}>
              <strong>New:</strong> Professional Audit Service for custom contracts with Solhint, Slither, and advanced vulnerability detection.
            </Typography>
          </Alert>

          <Alert 
            severity="warning"
            sx={{ 
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              '& .MuiAlert-icon': { color: '#f59e0b' }
            }}
          >
            <Typography variant="body2" sx={{ color: '#ffffff' }}>
              Always review and test your contracts on testnets before mainnet deployment.
            </Typography>
          </Alert>
        </Box>
      </Box>
    </Container>
  )
}

export default Overview
