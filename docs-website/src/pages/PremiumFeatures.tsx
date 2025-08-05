import {
  Box,
  Container,
  Typography,
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material'

const PremiumFeatures = () => {
  const premiumFeatures = [
    {
      id: 'pausable',
      name: 'Pausable',
      icon: '⏸️',
      description: 'Emergency pause functionality to halt all token transfers and operations',
      price: 0.001,
      requiredFor: ['token', 'nft'],
      benefits: [
        'Emergency stop mechanism for security incidents',
        'Only contract owner can pause/unpause',
        'OpenZeppelin Pausable implementation',
        'Protects against exploits and bugs'
      ],
      gasOverhead: '~2,000 gas per transaction',
      securityLevel: 'High'
    },
    {
      id: 'burnable',
      name: 'Burnable',
      icon: '🔥',
      description: 'Allow token holders to permanently destroy their tokens, reducing total supply',
      price: 0.001,
      requiredFor: ['token', 'nft'],
      benefits: [
        'Deflationary mechanism to increase scarcity',
        'Holders can burn their own tokens',
        'Permanently reduces total supply',
        'OpenZeppelin ERC20Burnable/ERC721Burnable'
      ],
      gasOverhead: '~1,500 gas per burn',
      securityLevel: 'Medium'
    },
    {
      id: 'mintable',
      name: 'Mintable',
      icon: '➕',
      description: 'Allow authorized addresses to create new tokens after deployment',
      price: 0.002,
      requiredFor: ['token', 'nft'],
      benefits: [
        'Create new tokens post-deployment',
        'Role-based access control',
        'Perfect for rewards and incentives',
        'Can be combined with caps for limits'
      ],
      gasOverhead: '~3,000 gas per mint',
      securityLevel: 'High',
      incompatibleWith: ['capped']
    },
    {
      id: 'capped',
      name: 'Capped Supply',
      icon: '🧢',
      description: 'Set a maximum supply limit that cannot be exceeded',
      price: 0.001,
      requiredFor: ['token'],
      benefits: [
        'Guarantees maximum token supply',
        'Prevents inflation beyond cap',
        'Increases investor confidence',
        'OpenZeppelin ERC20Capped implementation'
      ],
      gasOverhead: '~1,000 gas per mint check',
      securityLevel: 'Medium',
      incompatibleWith: ['mintable']
    },
    {
      id: 'snapshot',
      name: 'Snapshot',
      icon: '📸',
      description: 'Take snapshots of token balances at specific block numbers for governance',
      price: 0.003,
      requiredFor: ['token', 'dao'],
      benefits: [
        'Historical balance queries',
        'Governance voting based on past balances',
        'Prevent vote manipulation',
        'Gas-efficient balance lookups'
      ],
      gasOverhead: '~5,000 gas per snapshot',
      securityLevel: 'Medium'
    },
    {
      id: 'permit',
      name: 'Permit (EIP-2612)',
      icon: '✍️',
      description: 'Allow gasless approvals using off-chain signatures',
      price: 0.002,
      requiredFor: ['token'],
      benefits: [
        'Gasless token approvals',
        'Better UX for DeFi integrations',
        'Meta-transaction support',
        'EIP-2612 standard compliance'
      ],
      gasOverhead: '~800 gas per permit',
      securityLevel: 'Medium'
    },
    {
      id: 'votes',
      name: 'Governance Votes',
      icon: '🗳️',
      description: 'Make tokens compatible with governance systems like OpenZeppelin Governor',
      price: 0.003,
      requiredFor: ['token', 'dao'],
      benefits: [
        'Compatible with governance frameworks',
        'Delegation support',
        'Vote weight tracking',
        'Historical voting power queries'
      ],
      gasOverhead: '~4,000 gas per vote operation',
      securityLevel: 'Medium'
    },
    {
      id: 'whitelist',
      name: 'Whitelist',
      icon: '✅',
      description: 'Restrict transfers to only approved addresses',
      price: 0.002,
      requiredFor: ['token', 'nft'],
      benefits: [
        'KYC/AML compliance support',
        'Regulatory compliance',
        'Control over token distribution',
        'Prevent unauthorized transfers'
      ],
      gasOverhead: '~2,500 gas per transfer check',
      securityLevel: 'High',
      incompatibleWith: ['blacklist']
    },
    {
      id: 'blacklist',
      name: 'Blacklist',
      icon: '❌',
      description: 'Block specific addresses from receiving or sending tokens',
      price: 0.002,
      requiredFor: ['token', 'nft'],
      benefits: [
        'Block malicious addresses',
        'Regulatory compliance',
        'Anti-money laundering features',
        'Emergency address blocking'
      ],
      gasOverhead: '~2,000 gas per transfer check',
      securityLevel: 'High',
      incompatibleWith: ['whitelist']
    },
    {
      id: 'multisig',
      name: 'Multi-Signature',
      icon: '👥',
      description: 'Require multiple signatures for critical operations',
      price: 0.005,
      requiredFor: ['token', 'nft', 'dao', 'lock'],
      benefits: [
        'Enhanced security for admin functions',
        'Distributed control among multiple parties',
        'Prevents single point of failure',
        'Customizable signature thresholds'
      ],
      gasOverhead: '~10,000 gas per multi-sig operation',
      securityLevel: 'Very High'
    },
    {
      id: 'upgradeable',
      name: 'Upgradeable Proxy',
      icon: '🔄',
      description: 'Deploy upgradeable contracts using proxy patterns',
      price: 0.008,
      requiredFor: ['token', 'nft', 'dao'],
      benefits: [
        'Fix bugs and add features post-deployment',
        'OpenZeppelin proxy patterns',
        'Transparent or UUPS proxy support',
        'Storage layout protection'
      ],
      gasOverhead: '~3,000 gas per delegatecall',
      securityLevel: 'Very High',
      warning: 'Advanced feature - requires careful upgrade management'
    },
    {
      id: 'vesting',
      name: 'Token Vesting',
      icon: '⏰',
      description: 'Lock tokens with time-based release schedules',
      price: 0.004,
      requiredFor: ['token', 'lock'],
      benefits: [
        'Linear or cliff vesting schedules',
        'Multiple beneficiary support',
        'Revocable or non-revocable vesting',
        'Perfect for team/investor allocations'
      ],
      gasOverhead: '~6,000 gas per release',
      securityLevel: 'High'
    },
    {
      id: 'airdrop',
      name: 'Batch Airdrop',
      icon: '🪂',
      description: 'Efficiently distribute tokens to multiple addresses',
      price: 0.003,
      requiredFor: ['token', 'nft'],
      benefits: [
        'Gas-efficient batch transfers',
        'Support for thousands of recipients',
        'CSV upload compatibility',
        'Merkle tree airdrops for large lists'
      ],
      gasOverhead: '~21,000 gas per recipient',
      securityLevel: 'Medium'
    },
    {
      id: 'staking',
      name: 'Staking Rewards',
      icon: '💰',
      description: 'Built-in staking mechanism with configurable rewards',
      price: 0.007,
      requiredFor: ['token'],
      benefits: [
        'APY-based reward calculation',
        'Flexible staking periods',
        'Emergency unstaking options',
        'Reward token customization'
      ],
      gasOverhead: '~8,000 gas per stake/unstake',
      securityLevel: 'High'
    },
    {
      id: 'royalties',
      name: 'NFT Royalties',
      icon: '💎',
      description: 'EIP-2981 compliant royalty system for NFT secondary sales',
      price: 0.002,
      requiredFor: ['nft'],
      benefits: [
        'Automatic royalty collection',
        'EIP-2981 standard compliance',
        'Marketplace compatibility',
        'Configurable royalty percentages'
      ],
      gasOverhead: '~1,000 gas per royalty query',
      securityLevel: 'Medium'
    },
    {
      id: 'flashmint',
      name: 'Flash Mint',
      icon: '⚡',
      description: 'EIP-3156 compliant flash loan functionality',
      price: 0.006,
      requiredFor: ['token'],
      benefits: [
        'Flash loan capabilities',
        'EIP-3156 standard compliance',
        'Configurable fees',
        'DeFi protocol integration'
      ],
      gasOverhead: '~15,000 gas per flash mint',
      securityLevel: 'Very High',
      warning: 'Advanced DeFi feature - requires thorough testing'
    },
  ]

  const featureCompatibility = {
    token: ['pausable', 'burnable', 'mintable', 'capped', 'snapshot', 'permit', 'votes', 'whitelist', 'blacklist', 'multisig', 'upgradeable', 'vesting', 'airdrop', 'staking', 'flashmint'],
    nft: ['pausable', 'burnable', 'royalties', 'whitelist', 'blacklist', 'multisig', 'upgradeable', 'airdrop'],
    dao: ['snapshot', 'votes', 'multisig'],
    lock: ['vesting', 'multisig']
  }

  const getSecurityColor = (level: string) => {
    switch (level) {
      case 'Very High': return '#ef4444'
      case 'High': return '#f59e0b'
      case 'Medium': return '#10b981'
      default: return '#6366f1'
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
        ⭐ Premium Features
      </Typography>
      
      <Typography variant="h5" sx={{ color: '#94a3b8', mb: 4 }}>
        Advanced smart contract features for professional deployments
      </Typography>

      <Alert severity="info" sx={{ 
        mb: 4,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        '& .MuiAlert-icon': { color: '#6366f1' }
      }}>
        <Typography variant="body2" sx={{ color: '#ffffff' }}>
          Premium features are add-ons that enhance your smart contracts with advanced functionality. 
          Each feature is thoroughly tested and based on OpenZeppelin's audited libraries.
        </Typography>
      </Alert>

      {/* Feature Compatibility Matrix */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#ffffff' }}>
          📋 Feature Compatibility Matrix
        </Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                <TableCell><Typography fontWeight="bold" sx={{ color: '#ffffff' }}>Template</Typography></TableCell>
                <TableCell><Typography fontWeight="bold" sx={{ color: '#ffffff' }}>Compatible Features</Typography></TableCell>
                <TableCell><Typography fontWeight="bold" sx={{ color: '#ffffff' }}>Count</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(featureCompatibility).map(([template, features]) => (
                <TableRow key={template} sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.02)' } }}>
                  <TableCell>
                    <Chip 
                      label={template.toUpperCase()} 
                      size="small" 
                      sx={{
                        backgroundColor: template === 'token' ? '#6366f1' :
                                       template === 'nft' ? '#8b5cf6' :
                                       template === 'dao' ? '#10b981' : '#f59e0b',
                        color: '#ffffff',
                        fontWeight: 600
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {features.slice(0, 8).map((featureId) => {
                        const feature = premiumFeatures.find(f => f.id === featureId)
                        return feature ? (
                          <Chip
                            key={featureId}
                            label={feature.name}
                            size="small"
                            variant="outlined"
                            sx={{
                              fontSize: '0.7rem',
                              height: '20px',
                              borderColor: '#94a3b8',
                              color: '#94a3b8'
                            }}
                          />
                        ) : null
                      })}
                      {features.length > 8 && (
                        <Chip
                          label={`+${features.length - 8} more`}
                          size="small"
                          sx={{
                            fontSize: '0.7rem',
                            height: '20px',
                            backgroundColor: '#6366f1',
                            color: '#ffffff'
                          }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ color: '#ffffff', fontWeight: 600 }}>
                      {features.length}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Individual Features */}
      <Typography variant="h6" gutterBottom sx={{ color: '#ffffff', mb: 3 }}>
        🔧 Available Premium Features
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {premiumFeatures.map((feature) => (
          <Accordion key={feature.id} sx={{ 
            backgroundColor: '#1a1a2e',
            '&:before': { display: 'none' }
          }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#94a3b8' }} />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <Typography variant="h4" sx={{ fontSize: '1.5rem' }}>{feature.icon}</Typography>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ color: '#ffffff' }}>{feature.name}</Typography>
                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                    {feature.description}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={`${feature.price.toFixed(3)} ETH`}
                    size="small"
                    sx={{
                      backgroundColor: '#6366f1',
                      color: '#ffffff',
                      fontWeight: 600
                    }}
                  />
                  <Chip
                    label={feature.securityLevel}
                    size="small"
                    sx={{
                      backgroundColor: getSecurityColor(feature.securityLevel),
                      color: '#ffffff',
                      fontWeight: 600
                    }}
                  />
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                {/* Benefits */}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" gutterBottom sx={{ color: '#ffffff' }}>✨ Benefits</Typography>
                  <List dense>
                    {feature.benefits.map((benefit, index) => (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <ListItemIcon><CheckIcon sx={{ color: '#10b981' }} fontSize="small" /></ListItemIcon>
                        <ListItemText 
                          primary={benefit}
                          primaryTypographyProps={{ 
                            color: '#94a3b8',
                            fontSize: '0.9rem'
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>

                {/* Technical Details */}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" gutterBottom sx={{ color: '#ffffff' }}>⚙️ Technical Details</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography sx={{ color: '#94a3b8', fontSize: '0.9rem' }}>Gas Overhead:</Typography>
                      <Typography sx={{ 
                        color: '#ffffff', 
                        fontSize: '0.9rem',
                        fontFamily: 'monospace'
                      }}>
                        {feature.gasOverhead}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography sx={{ color: '#94a3b8', fontSize: '0.9rem' }}>Security Level:</Typography>
                      <Chip
                        label={feature.securityLevel}
                        size="small"
                        sx={{
                          backgroundColor: getSecurityColor(feature.securityLevel),
                          color: '#ffffff',
                          fontSize: '0.7rem',
                          height: '20px'
                        }}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography sx={{ color: '#94a3b8', fontSize: '0.9rem' }}>Compatible with:</Typography>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {feature.requiredFor.map((template) => (
                          <Chip
                            key={template}
                            label={template.toUpperCase()}
                            size="small"
                            variant="outlined"
                            sx={{
                              fontSize: '0.7rem',
                              height: '20px',
                              borderColor: '#6366f1',
                              color: '#6366f1'
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                    {feature.incompatibleWith && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography sx={{ color: '#ef4444', fontSize: '0.9rem' }}>Incompatible with:</Typography>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {feature.incompatibleWith.map((incompatible) => (
                            <Chip
                              key={incompatible}
                              label={incompatible}
                              size="small"
                              sx={{
                                fontSize: '0.7rem',
                                height: '20px',
                                backgroundColor: '#ef4444',
                                color: '#ffffff'
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Box>
                  {feature.warning && (
                    <Alert severity="warning" sx={{ 
                      mt: 2,
                      backgroundColor: 'rgba(245, 158, 11, 0.1)',
                      border: '1px solid rgba(245, 158, 11, 0.2)',
                      '& .MuiAlert-icon': { color: '#f59e0b' }
                    }}>
                      <Typography variant="body2" sx={{ color: '#ffffff', fontSize: '0.8rem' }}>
                        {feature.warning}
                      </Typography>
                    </Alert>
                  )}
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>

      {/* Pricing Summary */}
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#ffffff' }}>
          💰 Pricing Summary
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" sx={{ color: '#94a3b8', mb: 1 }}>Price Range:</Typography>
            <Typography sx={{ color: '#ffffff', fontSize: '1.1rem', fontWeight: 600 }}>
              0.001 - 0.008 ETH per feature
            </Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" sx={{ color: '#94a3b8', mb: 1 }}>Most Popular:</Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              <Chip label="Pausable" size="small" sx={{ backgroundColor: '#6366f1', color: '#ffffff' }} />
              <Chip label="Burnable" size="small" sx={{ backgroundColor: '#6366f1', color: '#ffffff' }} />
              <Chip label="Multisig" size="small" sx={{ backgroundColor: '#6366f1', color: '#ffffff' }} />
            </Box>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" sx={{ color: '#94a3b8', mb: 1 }}>Advanced Features:</Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              <Chip label="Upgradeable" size="small" sx={{ backgroundColor: '#ef4444', color: '#ffffff' }} />
              <Chip label="Staking" size="small" sx={{ backgroundColor: '#f59e0b', color: '#ffffff' }} />
              <Chip label="Flash Mint" size="small" sx={{ backgroundColor: '#ef4444', color: '#ffffff' }} />
            </Box>
          </Box>
        </Box>
      </Paper>
    </Container>
  )
}

export default PremiumFeatures
