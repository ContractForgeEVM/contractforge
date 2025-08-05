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
  Card,
  CardContent,
} from '@mui/material'

const Networks = () => {
  const mainnetNetworks = [
    { name: 'Ethereum Mainnet', chainId: 1, factoryAddress: '0xbCEabbe19292e64408AA168f8e39Eb05f92bcfd0', gasToken: 'ETH', type: 'Primary' },
    { name: 'Arbitrum One', chainId: 42161, factoryAddress: '0x5077b0ebbf5854c701f580e6921b19a05fdfadf3', gasToken: 'ETH', type: 'Unique' },
    { name: 'Polygon', chainId: 137, factoryAddress: '0xB18FF5A80F6C34cf31C026a0225847aF2552366D', gasToken: 'MATIC', type: 'Unique' },
    { name: 'BNB Smart Chain', chainId: 56, factoryAddress: '0xbCEabbe19292e64408AA168f8e39Eb05f92bcfd0', gasToken: 'BNB', type: 'Primary' },
    { name: 'Base', chainId: 8453, factoryAddress: '0x7ee5BbF0023011AF23592e67A2bb1b551746b1E4', gasToken: 'ETH', type: 'Shared' },
    { name: 'Optimism', chainId: 10, factoryAddress: '0x7ee5BbF0023011AF23592e67A2bb1b551746b1E4', gasToken: 'ETH', type: 'Shared' },
    { name: 'Avalanche C-Chain', chainId: 43114, factoryAddress: '0x3dAE8C5D28F02C2b2F04DF97f7d785BB1761B544', gasToken: 'AVAX', type: 'Unique' },
    { name: 'Celo', chainId: 42220, factoryAddress: '0xbCEabbe19292e64408AA168f8e39Eb05f92bcfd0', gasToken: 'CELO', type: 'Primary' },
    { name: 'Linea', chainId: 59144, factoryAddress: '0xbCEabbe19292e64408AA168f8e39Eb05f92bcfd0', gasToken: 'ETH', type: 'Primary' },
    { name: 'Scroll', chainId: 534352, factoryAddress: '0x320649FF14aB842D1e5047AEf2Db33661FEc9942', gasToken: 'ETH', type: 'Unique' },
    { name: 'Zora', chainId: 7777777, factoryAddress: '0xbCEabbe19292e64408AA168f8e39Eb05f92bcfd0', gasToken: 'ETH', type: 'Primary' },
    { name: 'Gnosis Chain', chainId: 100, factoryAddress: '0xbCEabbe19292e64408AA168f8e39Eb05f92bcfd0', gasToken: 'xDAI', type: 'Primary' },
    { name: 'HyperEVM', chainId: 999, factoryAddress: '0xbCEabbe19292e64408AA168f8e39Eb05f92bcfd0', gasToken: 'HYPE', type: 'Primary' },
  ]

  const testnetNetworks = [
    { name: 'Ethereum Sepolia', chainId: 11155111, factoryAddress: '0x57cf238111014032FF4c0A981B021eF96bc1E09F', gasToken: 'ETH', type: 'Deterministic' },
    { name: 'Base Sepolia', chainId: 84532, factoryAddress: '0x57cf238111014032FF4c0A981B021eF96bc1E09F', gasToken: 'ETH', type: 'Deterministic' },
    { name: 'Monad Testnet', chainId: 10143, factoryAddress: '0x57cf238111014032FF4c0A981B021eF96bc1E09F', gasToken: 'testMON', type: 'Deterministic' },
  ]

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Primary': return '#10b981'
      case 'Unique': return '#f59e0b'
      case 'Shared': return '#8b5cf6'
      case 'Deterministic': return '#6366f1'
      default: return '#94a3b8'
    }
  }

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
        Supported Networks
      </Typography>
      
      <Typography variant="h5" sx={{ color: '#94a3b8', mb: 4 }}>
        Deploy smart contracts across 16 blockchain networks
      </Typography>

      <Alert 
        severity="info" 
        sx={{ 
          mb: 4,
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          '& .MuiAlert-icon': { color: '#6366f1' }
        }}
      >
        <Typography variant="body2" sx={{ color: '#ffffff' }}>
          ContractForge supports deployment on multiple networks with factory contracts deployed for optimal gas efficiency.
          All networks support the same features and templates.
        </Typography>
      </Alert>

      {/* Mainnet Networks */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          color: '#ffffff'
        }}>
          🌐 Mainnet Networks
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                <TableCell><Typography fontWeight="bold" sx={{ color: '#ffffff' }}>Network</Typography></TableCell>
                <TableCell><Typography fontWeight="bold" sx={{ color: '#ffffff' }}>Chain ID</Typography></TableCell>
                <TableCell><Typography fontWeight="bold" sx={{ color: '#ffffff' }}>Factory Type</Typography></TableCell>
                <TableCell><Typography fontWeight="bold" sx={{ color: '#ffffff' }}>Gas Token</Typography></TableCell>
                <TableCell><Typography fontWeight="bold" sx={{ color: '#ffffff' }}>Factory Address</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mainnetNetworks.map((network) => (
                <TableRow key={network.chainId} sx={{ 
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.02)' }
                }}>
                  <TableCell>
                    <Typography fontWeight="medium" sx={{ color: '#ffffff' }}>{network.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography 
                      component="code" 
                      variant="body2" 
                      sx={{ 
                        fontFamily: 'monospace',
                        color: '#94a3b8',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      {network.chainId}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={network.type}
                      size="small"
                      sx={{
                        backgroundColor: getTypeColor(network.type),
                        color: '#ffffff',
                        fontWeight: 600,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={network.gasToken} 
                      size="small" 
                      variant="outlined"
                      sx={{
                        borderColor: '#94a3b8',
                        color: '#94a3b8',
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography 
                      component="code" 
                      variant="caption" 
                      sx={{ 
                        fontFamily: 'monospace',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        color: '#94a3b8',
                        p: 0.5, 
                        borderRadius: 0.5,
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      {network.factoryAddress}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Testnet Networks */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          color: '#ffffff'
        }}>
          🧪 Testnet Networks
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                <TableCell><Typography fontWeight="bold" sx={{ color: '#ffffff' }}>Network</Typography></TableCell>
                <TableCell><Typography fontWeight="bold" sx={{ color: '#ffffff' }}>Chain ID</Typography></TableCell>
                <TableCell><Typography fontWeight="bold" sx={{ color: '#ffffff' }}>Factory Type</Typography></TableCell>
                <TableCell><Typography fontWeight="bold" sx={{ color: '#ffffff' }}>Gas Token</Typography></TableCell>
                <TableCell><Typography fontWeight="bold" sx={{ color: '#ffffff' }}>Factory Address</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {testnetNetworks.map((network) => (
                <TableRow key={network.chainId} sx={{ 
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.02)' }
                }}>
                  <TableCell>
                    <Typography fontWeight="medium" sx={{ color: '#ffffff' }}>{network.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography 
                      component="code" 
                      variant="body2" 
                      sx={{ 
                        fontFamily: 'monospace',
                        color: '#94a3b8',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      {network.chainId}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={network.type}
                      size="small"
                      sx={{
                        backgroundColor: '#6366f1',
                        color: '#ffffff',
                        fontWeight: 600,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={network.gasToken} 
                      size="small" 
                      variant="outlined"
                      sx={{
                        borderColor: '#94a3b8',
                        color: '#94a3b8',
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography 
                      component="code" 
                      variant="caption" 
                      sx={{ 
                        fontFamily: 'monospace',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        color: '#6366f1',
                        p: 0.5, 
                        borderRadius: 0.5,
                        border: '1px solid rgba(99, 102, 241, 0.2)'
                      }}
                    >
                      {network.factoryAddress}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Factory Types Explanation */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: '#ffffff' }}>
            🏭 Factory Types Explained
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip 
                label="Primary" 
                size="small" 
                sx={{ backgroundColor: '#10b981', color: '#ffffff' }}
              />
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                Main factory address used on 7 networks (Ethereum, BNB, Celo, Linea, HyperEVM, Zora, Gnosis)
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip 
                label="Shared" 
                size="small" 
                sx={{ backgroundColor: '#8b5cf6', color: '#ffffff' }}
              />
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                Shared address between Base and Optimism networks
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip 
                label="Unique" 
                size="small" 
                sx={{ backgroundColor: '#f59e0b', color: '#ffffff' }}
              />
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                Network-specific factory addresses (Arbitrum, Polygon, Avalanche, Scroll)
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip 
                label="Deterministic" 
                size="small" 
                sx={{ backgroundColor: '#6366f1', color: '#ffffff' }}
              />
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                Same address across all testnet networks for consistent testing
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Container>
  )
}

export default Networks
