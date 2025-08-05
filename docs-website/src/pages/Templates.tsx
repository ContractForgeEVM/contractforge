import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Chip,
  Grid,
  Paper,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  ContentCopy as CopyIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material'
import { useState } from 'react'

const Templates = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(label)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  // Tous les 12 templates de ContractForge
  const templates = [
    {
      id: 'token',
      name: 'ERC-20 Token',
      icon: '🪙',
      description: 'Create your own ERC20 token with customizable supply and decimals',
      features: ['Pausable', 'Burnable', 'Mintable', 'Capped', 'Snapshot', 'Permit', 'Votes', 'Whitelist', 'Blacklist', 'Tax', 'Multisig', 'Upgradeable', 'Vesting', 'Airdrop', 'Staking', 'FlashMint'],
      fields: [
        { name: 'name', type: 'string', required: true, default: 'MyToken', description: 'Full name of the token' },
        { name: 'symbol', type: 'string', required: true, default: 'MTK', description: 'Token symbol (3-5 characters)' },
        { name: 'totalSupply', type: 'uint256', required: true, default: 1000000, description: 'Initial token supply' },
        { name: 'decimals', type: 'uint8', required: false, default: 18, description: 'Number of decimal places' }
      ],
      example: { name: 'MyToken', symbol: 'MTK', totalSupply: 1000000, decimals: 18 },
      gasEstimate: '~2,500,000 gas',
      useCases: ['Utility tokens', 'Governance tokens', 'Reward tokens', 'Payment tokens']
    },
    {
      id: 'nft',
      name: 'NFT Collection',
      icon: '🎨',
      description: 'Deploy an NFT collection with minting capabilities',
      features: ['Pausable', 'Burnable', 'Royalties', 'Enumerable', 'URI Storage', 'Whitelist', 'Blacklist', 'Multisig', 'Upgradeable', 'Airdrop'],
      fields: [
        { name: 'name', type: 'string', required: true, default: 'MyNFTCollection', description: 'Collection name' },
        { name: 'symbol', type: 'string', required: true, default: 'MNFT', description: 'Collection symbol' },
        { name: 'maxSupply', type: 'uint256', required: true, default: 10000, description: 'Maximum number of tokens' },
        { name: 'baseURI', type: 'string', required: false, default: 'https://api.example.com/metadata/', description: 'Base URI for metadata' }
      ],
      example: { name: 'MyNFTCollection', symbol: 'MNFT', maxSupply: 10000, baseURI: 'https://api.example.com/metadata/' },
      gasEstimate: '~3,200,000 gas',
      useCases: ['Art collections', 'Gaming items', 'Membership tokens', 'Digital collectibles']
    },
    {
      id: 'dao',
      name: 'DAO Governance',
      icon: "🏛",
      description: 'Create a decentralized autonomous organization',
      features: ['Snapshot', 'Votes', 'Timelock', 'Multisig'],
      fields: [
        { name: 'name', type: 'string', required: true, default: 'MyDAO', description: 'DAO name' },
        { name: 'governanceTokenAddress', type: 'address', required: true, default: '0x...', description: 'Governance token contract address' },
        { name: 'proposalThreshold', type: 'uint256', required: true, default: 100, description: 'Minimum tokens to create proposal' },
        { name: 'votingPeriod', type: 'uint256', required: true, default: 50400, description: 'Voting period in blocks (~1 week)' }
      ],
      example: { name: 'MyDAO', governanceTokenAddress: '0x...', proposalThreshold: 100, votingPeriod: 50400 },
      gasEstimate: '~4,800,000 gas',
      useCases: ['Protocol governance', 'Community decisions', 'Treasury management', 'Parameter voting']
    },
    {
      id: 'lock',
      name: 'Token Lock',
      icon: '🔒',
      description: 'Lock tokens until a specified time',
      features: ['Vesting', 'Multisig'],
      fields: [
        { name: 'tokenAddress', type: 'address', required: true, default: '0x...', description: 'Token contract address' },
        { name: 'beneficiary', type: 'address', required: true, default: '0x...', description: 'Beneficiary address' },
        { name: 'unlockTime', type: 'datetime', required: true, default: '2025-01-01T00:00:00Z', description: 'Unlock timestamp' }
      ],
      example: { tokenAddress: '0x...', beneficiary: '0x...', unlockTime: '2025-01-01T00:00:00Z' },
      gasEstimate: '~1,800,000 gas',
      useCases: ['Team vesting', 'Investor lockups', 'Reward schedules', 'Escrow services']
    },
    {
      id: 'liquidity-pool',
      name: 'Liquidity Pool',
      icon: '💧',
      description: 'Create a Uniswap V3-style liquidity pool for token trading',
      features: ['Fee Management', 'Price Oracle', 'Slippage Protection'],
      fields: [
        { name: 'name', type: 'string', required: true, default: 'Liquidity Pool', description: 'Pool name' },
        { name: 'tokenA', type: 'address', required: true, default: '0x...', description: 'First token address' },
        { name: 'tokenB', type: 'address', required: true, default: '0x...', description: 'Second token address' },
        { name: 'fee', type: 'uint256', required: true, default: 3000, description: 'Fee tier in basis points (3000 = 0.3%)' },
        { name: 'initialPrice', type: 'uint256', required: true, default: 1.0, description: 'Initial price ratio' }
      ],
      example: { name: 'ETH/USDC Pool', tokenA: '0x...', tokenB: '0x...', fee: 3000, initialPrice: 1.0 },
      gasEstimate: '~5,200,000 gas',
      useCases: ['DEX liquidity', 'Token swaps', 'Automated market making', 'Price discovery']
    },
    {
      id: 'yield-farming',
      name: 'Yield Farming',
      icon: '🌾',
      description: 'Deploy a yield farming protocol with staking rewards',
      features: ['Reward Distribution', 'Staking Mechanism', 'APY Calculation'],
      fields: [
        { name: 'name', type: 'string', required: true, default: 'Yield Farm', description: 'Farm name' },
        { name: 'stakingToken', type: 'address', required: true, default: '0x...', description: 'Token to stake (LP token)' },
        { name: 'rewardToken', type: 'address', required: true, default: '0x...', description: 'Reward token address' },
        { name: 'rewardRate', type: 'uint256', required: true, default: 0.001, description: 'Rewards per second' },
        { name: 'duration', type: 'uint256', required: true, default: 30, description: 'Farming duration in days' }
      ],
      example: { name: 'My Yield Farm', stakingToken: '0x...', rewardToken: '0x...', rewardRate: 0.001, duration: 30 },
      gasEstimate: '~4,100,000 gas',
      useCases: ['Liquidity mining', 'Token incentives', 'Protocol rewards', 'Community farming']
    },
    {
      id: 'gamefi-token',
      name: 'GameFi Token',
      icon: '🎮',
      description: 'Create a gaming token with play-to-earn mechanics',
      features: ['Play-to-Earn', 'Gaming Mechanics', 'NFT Integration'],
      fields: [
        { name: 'name', type: 'string', required: true, default: 'GameToken', description: 'Game token name' },
        { name: 'symbol', type: 'string', required: true, default: 'GAME', description: 'Token symbol' },
        { name: 'maxSupply', type: 'uint256', required: true, default: 1000000, description: 'Maximum token supply' },
        { name: 'mintPrice', type: 'uint256', required: true, default: 0.01, description: 'Mint price in ETH' },
        { name: 'burnRate', type: 'uint256', required: true, default: 2, description: 'Burn rate percentage' }
      ],
      example: { name: 'MyGameToken', symbol: 'GAME', maxSupply: 1000000, mintPrice: 0.01, burnRate: 2 },
      gasEstimate: '~3,800,000 gas',
      useCases: ['Game rewards', 'In-game currency', 'Play-to-earn', 'Gaming NFTs']
    },
    {
      id: 'nft-marketplace',
      name: 'NFT Marketplace',
      icon: '🏪',
      description: 'Deploy a complete NFT marketplace with trading capabilities',
      features: ['Trading Functions', 'Royalty System', 'Auction Mechanism'],
      fields: [
        { name: 'name', type: 'string', required: true, default: 'NFT Market', description: 'Marketplace name' },
        { name: 'nftContract', type: 'address', required: true, default: '0x...', description: 'NFT contract to trade' },
        { name: 'platformFee', type: 'uint256', required: true, default: 2.5, description: 'Platform fee percentage' },
        { name: 'creatorFee', type: 'uint256', required: true, default: 5.0, description: 'Creator royalty percentage' },
        { name: 'allowMinting', type: 'boolean', required: false, default: false, description: 'Allow direct minting' }
      ],
      example: { name: 'My NFT Market', nftContract: '0x...', platformFee: 2.5, creatorFee: 5.0, allowMinting: false },
      gasEstimate: '~6,500,000 gas',
      useCases: ['NFT trading', 'Digital art sales', 'Collectibles market', 'Creator monetization']
    },
    {
      id: 'revenue-sharing',
      name: 'Revenue Sharing',
      icon: '💰',
      description: 'Create a token that distributes business revenue to holders',
      features: ['Revenue Distribution', 'Profit Sharing', 'Dividend Mechanism'],
      fields: [
        { name: 'name', type: 'string', required: true, default: 'Revenue Token', description: 'Revenue token name' },
        { name: 'symbol', type: 'string', required: true, default: 'REV', description: 'Token symbol' },
        { name: 'totalSupply', type: 'uint256', required: true, default: 1000000, description: 'Total token supply' },
        { name: 'businessWallet', type: 'address', required: true, default: '0x...', description: 'Business revenue wallet' },
        { name: 'distributionPeriod', type: 'uint256', required: true, default: 30, description: 'Distribution period in days' }
      ],
      example: { name: 'Revenue Token', symbol: 'REV', totalSupply: 1000000, businessWallet: '0x...', distributionPeriod: 30 },
      gasEstimate: '~3,600,000 gas',
      useCases: ['Business tokenization', 'Profit sharing', 'Investment tokens', 'Revenue streams']
    },
    {
      id: 'loyalty-program',
      name: 'Loyalty Program',
      icon: '🎯',
      description: 'Deploy a customer loyalty program with points and rewards',
      features: ['Points System', 'Reward Mechanism', 'Customer Retention'],
      fields: [
        { name: 'name', type: 'string', required: true, default: 'Loyalty Program', description: 'Program name' },
        { name: 'pointsPerPurchase', type: 'uint256', required: true, default: 10, description: 'Points earned per USD spent' },
        { name: 'redemptionRate', type: 'uint256', required: true, default: 0.01, description: 'USD value per point' },
        { name: 'transferable', type: 'boolean', required: false, default: false, description: 'Can points be transferred' },
        { name: 'expirable', type: 'boolean', required: false, default: true, description: 'Do points expire' }
      ],
      example: { name: 'My Loyalty Program', pointsPerPurchase: 10, redemptionRate: 0.01, transferable: false, expirable: true },
      gasEstimate: '~2,900,000 gas',
      useCases: ['Customer loyalty', 'Reward programs', 'Brand engagement', 'Repeat customers']
    },
    {
      id: 'dynamic-nft',
      name: 'Dynamic NFT (dNFT)',
      icon: '🔄',
      description: 'Create evolvable NFTs that change over time or conditions',
      features: ['Evolution Mechanism', 'Conditional Updates', 'Metadata Changes'],
      fields: [
        { name: 'name', type: 'string', required: true, default: 'Dynamic NFTs', description: 'dNFT collection name' },
        { name: 'symbol', type: 'string', required: true, default: 'DNFT', description: 'Collection symbol' },
        { name: 'maxSupply', type: 'uint256', required: true, default: 10000, description: 'Maximum supply' },
        { name: 'evolvable', type: 'boolean', required: false, default: true, description: 'Can NFTs evolve' },
        { name: 'mergeable', type: 'boolean', required: false, default: false, description: 'Can NFTs be merged' }
      ],
      example: { name: 'My Dynamic NFTs', symbol: 'DNFT', maxSupply: 10000, evolvable: true, mergeable: false },
      gasEstimate: '~4,200,000 gas',
      useCases: ['Evolving characters', 'Progressive art', 'Achievement NFTs', 'Time-based changes']
    },
    {
      id: 'social-token',
      name: 'Social Token',
      icon: '👥',
      description: 'Create a token for creators and communities',
      features: ['Community Governance', 'Creator Economy', 'Social Engagement'],
      fields: [
        { name: 'creatorName', type: 'string', required: true, default: 'Social Token', description: 'Creator/community name' },
        { name: 'symbol', type: 'string', required: true, default: 'SOCIAL', description: 'Token symbol' },
        { name: 'initialSupply', type: 'uint256', required: true, default: 1000000, description: 'Initial token supply' },
        { name: 'creatorShare', type: 'uint256', required: true, default: 20, description: 'Creator share percentage' },
        { name: 'communityGoverned', type: 'boolean', required: false, default: true, description: 'Community governance enabled' }
      ],
      example: { creatorName: 'My Community', symbol: 'SOCIAL', initialSupply: 1000000, creatorShare: 20, communityGoverned: true },
      gasEstimate: '~3,400,000 gas',
      useCases: ['Creator tokens', 'Community currencies', 'Fan engagement', 'Social economies']
    }
  ]

  const featureCompatibility = {
    token: ['pausable', 'burnable', 'mintable', 'capped', 'snapshot', 'permit', 'votes', 'whitelist', 'blacklist', 'tax', 'multisig', 'upgradeable', 'vesting', 'airdrop', 'staking', 'flashmint'],
    nft: ['pausable', 'burnable', 'royalties', 'enumerable', 'uristorage', 'whitelist', 'blacklist', 'multisig', 'upgradeable', 'airdrop'],
    dao: ['snapshot', 'votes', 'timelock', 'multisig'],
    lock: ['vesting', 'multisig'],
    'liquidity-pool': ['fee-management', 'price-oracle', 'slippage-protection'],
    'yield-farming': ['reward-distribution', 'staking-mechanism', 'apy-calculation'],
    'gamefi-token': ['play-to-earn', 'gaming-mechanics', 'nft-integration'],
    'nft-marketplace': ['trading-functions', 'royalty-system', 'auction-mechanism'],
    'revenue-sharing': ['revenue-distribution', 'profit-sharing', 'dividend-mechanism'],
    'loyalty-program': ['points-system', 'reward-mechanism', 'customer-retention'],
    'dynamic-nft': ['evolution-mechanism', 'conditional-updates', 'metadata-changes'],
    'social-token': ['community-governance', 'creator-economy', 'social-engagement']
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
        📝 Smart Contract Templates
      </Typography>
      
      <Typography variant="h5" sx={{ color: '#94a3b8', mb: 4 }}>
        12 pre-built, audited templates for every use case
      </Typography>

      <Alert severity="info" sx={{ 
        mb: 4,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        '& .MuiAlert-icon': { color: '#6366f1' }
      }}>
        <Typography variant="body2" sx={{ color: '#ffffff' }}>
          All 12 templates are based on OpenZeppelin's audited contracts v4.9.6 and can be customized with premium features. 
          Each template includes automatic verification and follows EIP standards.
        </Typography>
      </Alert>

      {/* Template Categories */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#ffffff' }}>
          �� Template Categories
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
          <Chip label="DeFi (4)" sx={{ backgroundColor: '#10b981', color: '#ffffff' }} />
          <Chip label="NFT (3)" sx={{ backgroundColor: '#8b5cf6', color: '#ffffff' }} />
          <Chip label="DAO (1)" sx={{ backgroundColor: '#6366f1', color: '#ffffff' }} />
          <Chip label="Gaming (1)" sx={{ backgroundColor: '#f59e0b', color: '#ffffff' }} />
          <Chip label="Business (2)" sx={{ backgroundColor: '#ef4444', color: '#ffffff' }} />
          <Chip label="Social (1)" sx={{ backgroundColor: '#06b6d4', color: '#ffffff' }} />
        </Box>
      </Box>

      {/* Template Overview Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {templates.map((template) => (
          <Grid item xs={12} md={6} lg={4} key={template.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Typography variant="h3" sx={{ fontSize: '2rem' }}>
                    {template.icon}
                  </Typography>
                  <Box>
                    <Typography variant="h6" component="h3" sx={{ color: '#ffffff' }}>
                      {template.name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                      <Chip 
                        label={`${template.features.length} features`}
                        size="small"
                        sx={{ 
                          backgroundColor: '#6366f1', 
                          color: '#ffffff',
                          fontWeight: 600,
                          fontSize: '0.7rem'
                        }}
                      />
                      <Chip 
                        label={template.gasEstimate}
                        size="small"
                        sx={{ 
                          backgroundColor: '#10b981', 
                          color: '#ffffff',
                          fontWeight: 600,
                          fontSize: '0.7rem'
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
                
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2, fontSize: '0.85rem' }}>
                  {template.description}
                </Typography>

                <Typography variant="subtitle2" gutterBottom sx={{ color: '#ffffff', mb: 1, fontSize: '0.85rem' }}>
                  Use Cases:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                  {template.useCases.slice(0, 3).map((useCase) => (
                    <Chip
                      key={useCase}
                      label={useCase}
                      size="small"
                      variant="outlined"
                      sx={{
                        borderColor: '#94a3b8',
                        color: '#94a3b8',
                        fontSize: '0.65rem',
                        height: '20px'
                      }}
                    />
                  ))}
                  {template.useCases.length > 3 && (
                    <Chip
                      label={`+${template.useCases.length - 3}`}
                      size="small"
                      sx={{
                        backgroundColor: '#94a3b8',
                        color: '#ffffff',
                        fontSize: '0.65rem',
                        height: '20px'
                      }}
                    />
                  )}
                </Box>

                <Typography variant="subtitle2" gutterBottom sx={{ color: '#ffffff', mb: 1, fontSize: '0.85rem' }}>
                  Key Features:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {template.features.slice(0, 4).map((feature) => (
                    <Chip
                      key={feature}
                      label={feature}
                      size="small"
                      variant="outlined"
                      sx={{
                        borderColor: '#8b5cf6',
                        color: '#8b5cf6',
                        fontSize: '0.65rem',
                        height: '20px'
                      }}
                    />
                  ))}
                  {template.features.length > 4 && (
                    <Chip
                      label={`+${template.features.length - 4} more`}
                      size="small"
                      sx={{
                        backgroundColor: '#8b5cf6',
                        color: '#ffffff',
                        fontSize: '0.65rem',
                        height: '20px'
                      }}
                    />
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Detailed Template Specifications */}
      <Typography variant="h4" gutterBottom sx={{ color: '#ffffff', mb: 3 }}>
        📋 Detailed Template Specifications
      </Typography>

      {templates.map((template) => (
        <Accordion key={template.id} sx={{ mb: 2, backgroundColor: '#1a1a2e' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#94a3b8' }} />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
              <Typography variant="h2" sx={{ fontSize: '2rem' }}>{template.icon}</Typography>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ color: '#ffffff' }}>{template.name}</Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                  {template.description}
                </Typography>
              </Box>
              <Chip
                label={`${template.fields.length} fields`}
                size="small"
                sx={{
                  backgroundColor: '#6366f1',
                  color: '#ffffff',
                  fontWeight: 600
                }}
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
              {/* Required Fields */}
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#ffffff' }}>Required Fields</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                        <TableCell><Typography fontWeight="bold" sx={{ color: '#ffffff' }}>Field</Typography></TableCell>
                        <TableCell><Typography fontWeight="bold" sx={{ color: '#ffffff' }}>Type</Typography></TableCell>
                        <TableCell><Typography fontWeight="bold" sx={{ color: '#ffffff' }}>Required</Typography></TableCell>
                        <TableCell><Typography fontWeight="bold" sx={{ color: '#ffffff' }}>Default</Typography></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {template.fields.map((field) => (
                        <TableRow key={field.name} sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.02)' } }}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium" sx={{ color: '#ffffff' }}>
                              {field.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                              {field.description}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={field.type} size="small" variant="outlined" sx={{
                              borderColor: '#94a3b8',
                              color: '#94a3b8',
                              fontSize: '0.7rem'
                            }} />
                          </TableCell>
                          <TableCell>
                            {field.required ? (
                              <CheckIcon sx={{ color: '#ef4444' }} fontSize="small" />
                            ) : (
                              <Typography variant="body2" sx={{ color: '#94a3b8' }}>Optional</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ 
                              color: '#94a3b8',
                              fontFamily: 'monospace',
                              fontSize: '0.8rem'
                            }}>
                              {field.default?.toString() || '-'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              {/* Example Configuration */}
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#ffffff' }}>Example Configuration</Typography>
                <Paper sx={{ 
                  p: 2, 
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  mb: 2
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>JSON Parameters</Typography>
                    <Tooltip title={copiedCode === template.id ? 'Copied!' : 'Copy Example'}>
                      <IconButton
                        size="small"
                        onClick={() => copyToClipboard(
                          JSON.stringify(template.example, null, 2),
                          template.id
                        )}
                        sx={{ color: '#94a3b8' }}
                      >
                        <CopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Typography component="pre" variant="body2" sx={{ 
                    fontFamily: 'monospace',
                    color: '#10b981',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontSize: '0.8rem'
                  }}>
                    {JSON.stringify(template.example, null, 2)}
                  </Typography>
                </Paper>

                <Typography variant="h6" gutterBottom sx={{ color: '#ffffff' }}>Compatible Features</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(featureCompatibility[template.id as keyof typeof featureCompatibility] || []).map((featureId) => (
                    <Chip
                      key={featureId}
                      label={featureId.replace('-', ' ')}
                      size="small"
                      variant="outlined"
                      sx={{
                        borderColor: '#8b5cf6',
                        color: '#8b5cf6',
                        fontSize: '0.7rem'
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}

      {/* Get Started CTA */}
      <Box sx={{ mt: 6, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom sx={{ color: '#ffffff' }}>
          🚀 Ready to Deploy?
        </Typography>
        <Typography variant="body1" sx={{ color: '#94a3b8', mb: 3 }}>
          Visit ContractForge to start deploying your smart contracts with these 12 templates. 
          Each template can be customized with premium features and deployed across 16+ blockchain networks.
        </Typography>
        <Paper sx={{ 
          p: 3,
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          maxWidth: 600,
          mx: 'auto'
        }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#6366f1' }}>
            💡 Template Statistics
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
            <Box>
              <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 800 }}>12</Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>Templates</Typography>
            </Box>
            <Box>
              <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 800 }}>16+</Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>Networks</Typography>
            </Box>
            <Box>
              <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 800 }}>20+</Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>Premium Features</Typography>
            </Box>
            <Box>
              <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 800 }}>100%</Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>OpenZeppelin</Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}

export default Templates
