import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
} from '@mui/material'
import {
  NewReleases as NewIcon,
  BugReport as BugIcon,
  Security as SecurityIcon,
  Speed as PerformanceIcon,
  Add as AddIcon,
  Update as UpdateIcon,
  Delete as RemoveIcon,
} from '@mui/icons-material'

interface ChangelogEntry {
  version: string
  date: string
  type: 'major' | 'minor' | 'patch'
  changes: {
    type: 'added' | 'updated' | 'fixed' | 'removed' | 'security' | 'performance'
    description: string
  }[]
}

const changelogData: ChangelogEntry[] = [
  {
    version: '1.3.0',
    date: '2025-08-05',
    type: 'minor',
    changes: [
      { type: 'added', description: 'Professional Audit Service for custom contracts with vulnerability detection' },
      { type: 'added', description: 'Multi-tool analysis integration: Solhint, Slither, and custom patterns' },
      { type: 'added', description: 'Not So Smart Contracts analysis with 12+ vulnerability pattern detection' },
      { type: 'added', description: 'Advanced honeypot detection using semantic analysis and logical patterns' },
      { type: 'added', description: 'Security scoring system with A-F grading and detailed recommendations' },
      { type: 'added', description: 'Strict approval criteria: 0 critical, 0 high, 0 medium vulnerabilities required' },
      { type: 'added', description: 'Real-time audit interface with modern dark theme design' },
      { type: 'added', description: 'Comprehensive vulnerability detection: reentrancy, integer overflow, access control, race conditions' },
      { type: 'added', description: 'Gas optimization analysis and efficiency recommendations' },
      { type: 'added', description: 'Example contracts for testing different vulnerability levels' },
      { type: 'security', description: 'Enhanced built-in template security with OpenZeppelin integration' },
      { type: 'security', description: 'Enhanced SSL certificate handling for Slither integration' },
      { type: 'performance', description: 'OpenZeppelin caching system for faster audit processing' },
    ]
  },
  {
    version: '1.2.0',
    date: '2025-08-04',
    type: 'minor',
    changes: [
      { type: 'added', description: 'GitBook-style documentation website with comprehensive content migration' },
      { type: 'added', description: 'Complete mint page generation tutorial with 6-step guide' },
      { type: 'added', description: 'All 12 smart contract templates fully documented with examples' },
      { type: 'updated', description: 'Social media links with official X logo and correct accounts (@contractforgeio, contractforgeevm)' },
      { type: 'updated', description: 'Discord integration with official logo and correct invite link' },
      { type: 'updated', description: 'All email addresses unified to contact@contractforge.io' },
      { type: 'updated', description: 'Responsive layout with fixed sidebar positioning' },
      { type: 'updated', description: 'Template statistics corrected from 4 to 12 templates' },
    ]
  },
  {
    version: '1.1.5',
    date: '2025-07-28',
    type: 'patch',
    changes: [
      { type: 'fixed', description: 'Layout issues with sidebar overlapping main content' },
      { type: 'updated', description: 'Navigation structure for better user experience' },
      { type: 'performance', description: 'Docker container optimization for faster deployment' },
    ]
  },
  {
    version: '1.1.0',
    date: '2025-07-22',
    type: 'minor',
    changes: [
      { type: 'added', description: 'Premium API testing interface' },
      { type: 'added', description: 'API key management system' },
      { type: 'added', description: 'Advanced error handling with smart error detection' },
      { type: 'updated', description: 'Network support expanded to 15+ blockchains' },
      { type: 'security', description: 'Enhanced authentication and rate limiting' },
    ]
  },
  {
    version: '1.0.8',
    date: '2025-07-15',
    type: 'patch',
    changes: [
      { type: 'fixed', description: 'Compilation errors with OpenZeppelin contracts' },
      { type: 'updated', description: 'Solidity compiler to version 0.8.20' },
      { type: 'performance', description: 'Build process optimization for faster contract generation' },
    ]
  },
  {
    version: '1.0.5',
    date: '2025-07-10',
    type: 'patch',
    changes: [
      { type: 'added', description: 'Support for custom token logos and metadata' },
      { type: 'fixed', description: 'Gas estimation accuracy improvements' },
      { type: 'updated', description: 'Factory contract addresses for new networks' },
    ]
  },
  {
    version: '1.0.2',
    date: '2025-07-05',
    type: 'patch',
    changes: [
      { type: 'fixed', description: 'Mobile responsiveness issues on deployment interface' },
      { type: 'updated', description: 'RainbowKit integration for better wallet connectivity' },
      { type: 'performance', description: 'Transaction confirmation speed improvements' },
    ]
  },
  {
    version: '1.0.0',
    date: '2025-07-01',
    type: 'major',
    changes: [
      { type: 'added', description: '🎉 Initial public release of ContractForge platform' },
      { type: 'added', description: 'Smart contract templates: ERC-20, NFT, DAO, Token Lock' },
      { type: 'added', description: 'Multi-chain deployment support (Ethereum, Polygon, BSC, Arbitrum)' },
      { type: 'added', description: 'Factory-based deployment system for cost efficiency' },
      { type: 'added', description: 'Real-time gas estimation and cost breakdown' },
      { type: 'added', description: 'Automatic contract verification on block explorers' },
      { type: 'security', description: 'Client-side compilation for maximum security' },
    ]
  },
]

const getIconForChangeType = (type: string) => {
  switch (type) {
    case 'added': return <AddIcon sx={{ color: '#10b981' }} />
    case 'updated': return <UpdateIcon sx={{ color: '#3b82f6' }} />
    case 'fixed': return <BugIcon sx={{ color: '#f59e0b' }} />
    case 'removed': return <RemoveIcon sx={{ color: '#ef4444' }} />
    case 'security': return <SecurityIcon sx={{ color: '#8b5cf6' }} />
    case 'performance': return <PerformanceIcon sx={{ color: '#06b6d4' }} />
    default: return <NewIcon sx={{ color: '#6b7280' }} />
  }
}

const getChipColorForType = (type: string) => {
  switch (type) {
    case 'major': return { backgroundColor: '#dc2626', color: '#ffffff' }
    case 'minor': return { backgroundColor: '#2563eb', color: '#ffffff' }
    case 'patch': return { backgroundColor: '#059669', color: '#ffffff' }
    default: return { backgroundColor: '#6b7280', color: '#ffffff' }
  }
}

const getVersionIcon = (type: string) => {
  switch (type) {
    case 'major': return '🚀'
    case 'minor': return '✨'
    case 'patch': return '🔧'
    default: return '📝'
  }
}

const Changelog = () => {
  return (
    <Box sx={{ p: 4, maxWidth: '1200px', mx: 'auto' }}>
      <Box sx={{ mb: 6 }}>
        <Typography variant="h3" sx={{ 
          fontWeight: 800,
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          mb: 2
        }}>
          📋 Changelog
        </Typography>
        <Typography variant="h6" sx={{ color: '#94a3b8', mb: 1 }}>
          Version History & Release Notes
        </Typography>
        <Typography variant="body1" sx={{ color: '#cbd5e1', maxWidth: '800px' }}>
          Track all updates, improvements, and changes to the ContractForge platform. 
          We follow semantic versioning: Major.Minor.Patch (e.g., 1.2.0).
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ color: '#e2e8f0', mb: 2 }}>
          📊 Version Types
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip 
            label="Major - Breaking changes, new features" 
            sx={getChipColorForType('major')}
          />
          <Chip 
            label="Minor - New features, backwards compatible" 
            sx={getChipColorForType('minor')}
          />
          <Chip 
            label="Patch - Bug fixes, small improvements" 
            sx={getChipColorForType('patch')}
          />
        </Box>
      </Box>

      <Stack spacing={4}>
        {changelogData.map((entry, index) => (
          <Box key={entry.version} sx={{ position: 'relative' }}>
            {/* Version Badge */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2, 
              mb: 2,
              position: 'relative',
              '&::before': index < changelogData.length - 1 ? {
                content: '""',
                position: 'absolute',
                left: 15,
                top: 40,
                height: 60,
                width: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                zIndex: 0
              } : {}
            }}>
              <Box sx={{ 
                width: 32, 
                height: 32, 
                borderRadius: '50%', 
                backgroundColor: getChipColorForType(entry.type).backgroundColor,
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '1.2rem',
                zIndex: 1
              }}>
                {getVersionIcon(entry.type)}
              </Box>
              <Typography variant="h4" sx={{ 
                fontWeight: 700,
                color: '#ffffff'
              }}>
                v{entry.version}
              </Typography>
              <Chip 
                label={entry.type.toUpperCase()} 
                size="small"
                sx={getChipColorForType(entry.type)}
              />
              <Typography variant="body2" sx={{ 
                color: '#94a3b8',
                ml: 'auto'
              }}>
                {new Date(entry.date).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Typography>
            </Box>

            <Card sx={{ 
              backgroundColor: '#1a1a2e',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 2,
              ml: 5
            }}>
              <CardContent>
                <List dense>
                  {entry.changes.map((change, changeIndex) => (
                    <ListItem key={changeIndex} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        {getIconForChangeType(change.type)}
                      </ListItemIcon>
                      <ListItemText 
                        primary={change.description}
                        sx={{
                          '& .MuiListItemText-primary': {
                            color: '#e2e8f0',
                            fontSize: '0.95rem'
                          }
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Stack>

      <Box sx={{ 
        mt: 6, 
        p: 4, 
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        borderRadius: 2 
      }}>
        <Typography variant="h6" sx={{ color: '#e2e8f0', mb: 2 }}>
          🚀 What's Next?
        </Typography>
        <Typography variant="body1" sx={{ color: '#cbd5e1', mb: 2 }}>
          We're constantly working on new features and improvements. Stay tuned for:
        </Typography>
        <List>
          <ListItem sx={{ py: 0.5 }}>
            <ListItemIcon>
              <AddIcon sx={{ color: '#10b981' }} />
            </ListItemIcon>
            <ListItemText 
              primary="Advanced DeFi templates (DEX, Lending, Staking)"
              sx={{ '& .MuiListItemText-primary': { color: '#e2e8f0' } }}
            />
          </ListItem>
          <ListItem sx={{ py: 0.5 }}>
            <ListItemIcon>
              <AddIcon sx={{ color: '#10b981' }} />
            </ListItemIcon>
            <ListItemText 
              primary="Layer 2 solutions (Optimism, zkSync, Starknet)"
              sx={{ '& .MuiListItemText-primary': { color: '#e2e8f0' } }}
            />
          </ListItem>
          <ListItem sx={{ py: 0.5 }}>
            <ListItemIcon>
              <AddIcon sx={{ color: '#10b981' }} />
            </ListItemIcon>
            <ListItemText 
              primary="Visual contract builder with drag & drop interface"
              sx={{ '& .MuiListItemText-primary': { color: '#e2e8f0' } }}
            />
          </ListItem>
        </List>
      </Box>
    </Box>
  )
}

export default Changelog