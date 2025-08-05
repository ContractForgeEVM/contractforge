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
  Stepper,
  Step,
  StepLabel,
  StepContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Avatar,
  IconButton,
  Tooltip,
} from '@mui/material'
import {
  CheckCircle as CheckIcon,
  ContentCopy as CopyIcon,
  Palette as PaletteIcon,
  Settings as SettingsIcon,
  Link as LinkIcon,
  Store as StoreIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Public as PublicIcon,
  Star as StarIcon,
  Rocket as RocketIcon,
} from '@mui/icons-material'
import { useState } from 'react'

const MintPageGeneration = () => {
  const [activeStep, setActiveStep] = useState(0)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(label)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const steps = [
    {
      title: '1. Select NFT Contract',
      description: 'Choose your deployed NFT contract',
      icon: <StoreIcon sx={{ color: '#6366f1' }} />,
      content: [
        'Connect your wallet to ContractForge',
        'Navigate to "Mint Pages" section',
        'Your deployed NFT contracts will be automatically detected',
        'Select the contract you want to create a mint page for'
      ],
      tips: [
        'Only successfully deployed NFT contracts are shown',
        'Contracts must have minting functionality enabled',
        'Both mainnet and testnet contracts are supported'
      ]
    },
    {
      title: '2. Configure Subdomain',
      description: 'Choose your unique mint page URL',
      icon: <LinkIcon sx={{ color: '#8b5cf6' }} />,
      content: [
        'Enter your desired subdomain (3-30 characters)',
        'Only lowercase letters, numbers, and hyphens allowed',
        'System checks availability in real-time',
        'Your page will be accessible at: yourdomain.contractforge.io'
      ],
      tips: [
        'Choose a memorable and brand-relevant subdomain',
        'Reserved words like "admin", "api", "www" are blocked',
        'Subdomain cannot be changed once created'
      ]
    },
    {
      title: '3. Design & Branding',
      description: 'Customize the visual appearance',
      icon: <PaletteIcon sx={{ color: '#10b981' }} />,
      content: [
        'Set page title and description',
        'Choose primary and background colors',
        'Upload hero image (JPG, PNG, WebP - max 2MB)',
        'Preview changes in real-time'
      ],
      tips: [
        'Use high-quality images for better visual impact',
        'Ensure good contrast between text and background',
        'Keep descriptions concise but informative'
      ]
    },
    {
      title: '4. Mint Configuration',
      description: 'Configure minting parameters',
      icon: <SettingsIcon sx={{ color: '#f59e0b' }} />,
      content: [
        'Set mint price in ETH',
        'Configure maximum supply',
        'Set maximum per wallet limit',
        'Toggle supply and count display options'
      ],
      tips: [
        'Prices should match your smart contract settings',
        'Consider gas fees when setting prices',
        'Max per wallet helps prevent whale accumulation'
      ]
    },
    {
      title: '5. Social Links',
      description: 'Add social media presence',
      icon: <PublicIcon sx={{ color: '#06b6d4' }} />,
      content: [
        'Add Twitter/X profile link',
        'Include Discord server invite',
        'Set official website URL',
        'All links are optional but recommended'
      ],
      tips: [
        'Verify all links work correctly',
        'Use full URLs including https://',
        'Social proof increases trust and engagement'
      ]
    },
    {
      title: '6. Preview & Deploy',
      description: 'Review and publish your mint page',
      icon: <RocketIcon sx={{ color: '#ef4444' }} />,
      content: [
        'Preview your mint page before publishing',
        'Test all functionality and links',
        'Deploy to ContractForge subdomain',
        'Share your mint page URL'
      ],
      tips: [
        'Test on different devices and screen sizes',
        'Verify wallet connection works properly',
        'Page goes live immediately after creation'
      ]
    }
  ]

  const features = [
    {
      icon: '🎨',
      title: 'Custom Branding',
      description: 'Full control over colors, images, and styling to match your brand identity',
      benefits: ['Custom color schemes', 'Hero image upload', 'Brand consistency', 'Professional appearance']
    },
    {
      icon: '🔗',
      title: 'Subdomain Hosting',
      description: 'Get your own branded subdomain on contractforge.io with instant deployment',
      benefits: ['Professional URL', 'Instant activation', 'SSL certificate included', 'Custom subdomain']
    },
    {
      icon: '⚡',
      title: 'Real-time Preview',
      description: 'See exactly how your mint page will look before publishing',
      benefits: ['Live preview', 'Instant updates', 'Mobile responsive', 'Cross-browser testing']
    },
    {
      icon: '🛡️',
      title: 'Secure Integration',
      description: 'Direct integration with your smart contract, no intermediaries',
      benefits: ['Direct contract calls', 'Wallet security', 'No private keys', 'Trustless minting']
    },
    {
      icon: '📱',
      title: 'Mobile Optimized',
      description: 'Fully responsive design that works perfectly on all devices',
      benefits: ['Mobile-first design', 'Touch optimized', 'Fast loading', 'App-like experience']
    },
    {
      icon: '🚀',
      title: 'Instant Deployment',
      description: 'Your mint page goes live immediately after creation',
      benefits: ['Zero downtime', 'Global CDN', 'High availability', 'Instant updates']
    }
  ]

  const exampleConfig = {
    contractAddress: '0x1234...abcd',
    subdomain: 'my-awesome-nft',
    title: 'Awesome NFT Collection',
    description: 'A unique collection of 10,000 hand-drawn NFTs with amazing utility and community benefits.',
    primaryColor: '#6366f1',
    backgroundColor: '#1a202c',
    price: '0.08',
    maxSupply: '10000',
    maxPerWallet: '3',
    socialLinks: {
      twitter: 'https://twitter.com/awesomenft',
      discord: 'https://discord.gg/awesomenft',
      website: 'https://awesomenft.com'
    }
  }

  const handleNext = () => {
    setActiveStep((prev) => prev + 1)
  }

  const handleBack = () => {
    setActiveStep((prev) => prev - 1)
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
        🎨 Mint Page Generation
      </Typography>
      
      <Typography variant="h5" sx={{ color: '#94a3b8', mb: 4 }}>
        Create beautiful, custom mint pages for your NFT collections
      </Typography>

      <Alert severity="info" sx={{ 
        mb: 4,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        '& .MuiAlert-icon': { color: '#6366f1' }
      }}>
        <Typography variant="body2" sx={{ color: '#ffffff' }}>
          <strong>💡 Pro Tip:</strong> The Mint Page Generator allows you to create professional, 
          branded mint pages for your NFT collections with custom subdomains (e.g., yourproject.contractforge.io). 
          No coding required!
        </Typography>
      </Alert>

      {/* Overview Section */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" gutterBottom sx={{ color: '#ffffff', mb: 3 }}>
          📋 What is Mint Page Generation?
        </Typography>
        
        <Paper sx={{ p: 4, mb: 4, backgroundColor: '#1a1a2e' }}>
          <Typography variant="body1" sx={{ color: '#94a3b8', mb: 3, lineHeight: 1.7 }}>
            The Mint Page Generator is a powerful tool that allows you to create custom, professional mint pages 
            for your NFT collections without any coding knowledge. Each mint page gets its own subdomain on 
            contractforge.io and integrates directly with your deployed smart contracts.
          </Typography>
          
          <Typography variant="h6" gutterBottom sx={{ color: '#ffffff', mb: 2 }}>
            🎯 Key Benefits:
          </Typography>
          
          <List>
            <ListItem>
              <ListItemIcon><CheckIcon sx={{ color: '#10b981' }} /></ListItemIcon>
              <ListItemText 
                primary="Professional Appearance" 
                secondary="Custom branding with your colors, images, and social links"
                sx={{ '& .MuiListItemText-primary': { color: '#ffffff' }, '& .MuiListItemText-secondary': { color: '#94a3b8' } }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckIcon sx={{ color: '#10b981' }} /></ListItemIcon>
              <ListItemText 
                primary="Custom Subdomain" 
                secondary="Get your own branded URL: yourproject.contractforge.io"
                sx={{ '& .MuiListItemText-primary': { color: '#ffffff' }, '& .MuiListItemText-secondary': { color: '#94a3b8' } }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckIcon sx={{ color: '#10b981' }} /></ListItemIcon>
              <ListItemText 
                primary="Direct Contract Integration" 
                secondary="Secure, direct connection to your smart contract - no intermediaries"
                sx={{ '& .MuiListItemText-primary': { color: '#ffffff' }, '& .MuiListItemText-secondary': { color: '#94a3b8' } }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckIcon sx={{ color: '#10b981' }} /></ListItemIcon>
              <ListItemText 
                primary="Mobile Responsive" 
                secondary="Perfect experience on desktop, tablet, and mobile devices"
                sx={{ '& .MuiListItemText-primary': { color: '#ffffff' }, '& .MuiListItemText-secondary': { color: '#94a3b8' } }}
              />
            </ListItem>
          </List>
        </Paper>
      </Box>

      {/* Features Overview */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" gutterBottom sx={{ color: '#ffffff', mb: 3 }}>
          ✨ Features & Capabilities
        </Typography>
        
        <Grid container spacing={3}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card sx={{ height: '100%', backgroundColor: '#1a1a2e' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Typography variant="h4">{feature.icon}</Typography>
                    <Typography variant="h6" sx={{ color: '#ffffff' }}>
                      {feature.title}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
                    {feature.description}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {feature.benefits.map((benefit, idx) => (
                      <Chip
                        key={idx}
                        label={benefit}
                        size="small"
                        variant="outlined"
                        sx={{
                          borderColor: '#6366f1',
                          color: '#6366f1',
                          fontSize: '0.7rem'
                        }}
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Step-by-Step Tutorial */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" gutterBottom sx={{ color: '#ffffff', mb: 3 }}>
          📖 Step-by-Step Tutorial
        </Typography>
        
        <Paper sx={{ p: 4, backgroundColor: '#1a1a2e' }}>
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((step, index) => (
              <Step key={index}>
                <StepLabel
                  StepIconComponent={() => (
                    <Avatar sx={{ 
                      width: 40, 
                      height: 40, 
                      backgroundColor: activeStep >= index ? '#6366f1' : '#374151'
                    }}>
                      {step.icon}
                    </Avatar>
                  )}
                >
                  <Typography variant="h6" sx={{ color: '#ffffff' }}>
                    {step.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                    {step.description}
                  </Typography>
                </StepLabel>
                <StepContent>
                  <Box sx={{ mt: 2, mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ color: '#ffffff' }}>
                      �� What to do:
                    </Typography>
                    <List dense>
                      {step.content.map((item, idx) => (
                        <ListItem key={idx} sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 30 }}>
                            <CheckIcon sx={{ color: '#10b981', fontSize: 18 }} />
                          </ListItemIcon>
                          <ListItemText 
                            primary={item}
                            sx={{ '& .MuiListItemText-primary': { color: '#94a3b8', fontSize: '0.9rem' } }}
                          />
                        </ListItem>
                      ))}
                    </List>
                    
                    <Typography variant="subtitle2" gutterBottom sx={{ color: '#f59e0b', mt: 2 }}>
                      💡 Tips:
                    </Typography>
                    <List dense>
                      {step.tips.map((tip, idx) => (
                        <ListItem key={idx} sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 30 }}>
                            <StarIcon sx={{ color: '#f59e0b', fontSize: 16 }} />
                          </ListItemIcon>
                          <ListItemText 
                            primary={tip}
                            sx={{ '& .MuiListItemText-primary': { color: '#94a3b8', fontSize: '0.85rem' } }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      sx={{ mr: 1 }}
                      disabled={index === steps.length - 1}
                    >
                      {index === steps.length - 1 ? 'Complete' : 'Next Step'}
                    </Button>
                    <Button
                      disabled={index === 0}
                      onClick={handleBack}
                      sx={{ mr: 1 }}
                    >
                      Back
                    </Button>
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </Paper>
      </Box>

      {/* Configuration Example */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" gutterBottom sx={{ color: '#ffffff', mb: 3 }}>
          ⚙️ Configuration Example
        </Typography>
        
        <Paper sx={{ p: 4, backgroundColor: '#1a1a2e' }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#ffffff' }}>
            Sample Mint Page Configuration
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
              This example shows a typical mint page setup for an NFT collection:
            </Typography>
            <Tooltip title={copiedCode === 'mint-config' ? 'Copied!' : 'Copy Configuration'}>
              <IconButton
                onClick={() => copyToClipboard(JSON.stringify(exampleConfig, null, 2), 'mint-config')}
                sx={{ color: '#94a3b8' }}
              >
                <CopyIcon />
              </IconButton>
            </Tooltip>
          </Box>
          
          <Paper sx={{ 
            p: 3, 
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            mb: 3
          }}>
            <Typography component="pre" variant="body2" sx={{ 
              fontFamily: 'monospace',
              color: '#10b981',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontSize: '0.85rem'
            }}>
              {JSON.stringify(exampleConfig, null, 2)}
            </Typography>
          </Paper>
          
          <Alert severity="success" sx={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <Typography variant="body2" sx={{ color: '#ffffff' }}>
              <strong>✅ Result:</strong> This configuration would create a mint page at 
              <code style={{ color: '#10b981', marginLeft: 4 }}>https://my-awesome-nft.contractforge.io</code>
            </Typography>
          </Alert>
        </Paper>
      </Box>

      {/* Requirements & Limitations */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" gutterBottom sx={{ color: '#ffffff', mb: 3 }}>
          �� Requirements & Considerations
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ backgroundColor: '#1a1a2e', height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckIcon /> Requirements
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="✅ Deployed NFT Contract"
                      secondary="Must be successfully deployed via ContractForge"
                      sx={{ '& .MuiListItemText-primary': { color: '#ffffff', fontSize: '0.9rem' }, '& .MuiListItemText-secondary': { color: '#94a3b8', fontSize: '0.8rem' } }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="✅ Wallet Connection"
                      secondary="Connected wallet must be the contract deployer"
                      sx={{ '& .MuiListItemText-primary': { color: '#ffffff', fontSize: '0.9rem' }, '& .MuiListItemText-secondary': { color: '#94a3b8', fontSize: '0.8rem' } }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="✅ Minting Functionality"
                      secondary="Contract must have public mint function"
                      sx={{ '& .MuiListItemText-primary': { color: '#ffffff', fontSize: '0.9rem' }, '& .MuiListItemText-secondary': { color: '#94a3b8', fontSize: '0.8rem' } }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="✅ Valid Subdomain"
                      secondary="3-30 characters, alphanumeric + hyphens only"
                      sx={{ '& .MuiListItemText-primary': { color: '#ffffff', fontSize: '0.9rem' }, '& .MuiListItemText-secondary': { color: '#94a3b8', fontSize: '0.8rem' } }}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card sx={{ backgroundColor: '#1a1a2e', height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SecurityIcon /> Important Notes
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="⚠️ Subdomain Permanence"
                      secondary="Subdomains cannot be changed once created"
                      sx={{ '& .MuiListItemText-primary': { color: '#ffffff', fontSize: '0.9rem' }, '& .MuiListItemText-secondary': { color: '#94a3b8', fontSize: '0.8rem' } }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="⚠️ Image Size Limit"
                      secondary="Hero images must be under 2MB"
                      sx={{ '& .MuiListItemText-primary': { color: '#ffffff', fontSize: '0.9rem' }, '& .MuiListItemText-secondary': { color: '#94a3b8', fontSize: '0.8rem' } }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="⚠️ Contract Parameters"
                      secondary="Mint price and limits should match contract settings"
                      sx={{ '& .MuiListItemText-primary': { color: '#ffffff', fontSize: '0.9rem' }, '& .MuiListItemText-secondary': { color: '#94a3b8', fontSize: '0.8rem' } }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="⚠️ Network Support"
                      secondary="Available on all supported networks"
                      sx={{ '& .MuiListItemText-primary': { color: '#ffffff', fontSize: '0.9rem' }, '& .MuiListItemText-secondary': { color: '#94a3b8', fontSize: '0.8rem' } }}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Best Practices */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" gutterBottom sx={{ color: '#ffffff', mb: 3 }}>
          🎯 Best Practices
        </Typography>
        
        <Paper sx={{ p: 4, backgroundColor: '#1a1a2e' }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="h6" gutterBottom sx={{ color: '#6366f1', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PaletteIcon /> Design Tips
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Use high-contrast colors for readability"
                      sx={{ '& .MuiListItemText-primary': { color: '#94a3b8', fontSize: '0.9rem' } }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Keep descriptions concise but informative"
                      sx={{ '& .MuiListItemText-primary': { color: '#94a3b8', fontSize: '0.9rem' } }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Use quality images that represent your brand"
                      sx={{ '& .MuiListItemText-primary': { color: '#94a3b8', fontSize: '0.9rem' } }}
                    />
                  </ListItem>
                </List>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="h6" gutterBottom sx={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SpeedIcon /> Performance
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Optimize images before uploading"
                      sx={{ '& .MuiListItemText-primary': { color: '#94a3b8', fontSize: '0.9rem' } }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Test on multiple devices and browsers"
                      sx={{ '& .MuiListItemText-primary': { color: '#94a3b8', fontSize: '0.9rem' } }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Verify all links work correctly"
                      sx={{ '& .MuiListItemText-primary': { color: '#94a3b8', fontSize: '0.9rem' } }}
                    />
                  </ListItem>
                </List>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="h6" gutterBottom sx={{ color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SecurityIcon /> Security
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Double-check contract address accuracy"
                      sx={{ '& .MuiListItemText-primary': { color: '#94a3b8', fontSize: '0.9rem' } }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Verify mint price matches contract"
                      sx={{ '& .MuiListItemText-primary': { color: '#94a3b8', fontSize: '0.9rem' } }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Test minting process before going live"
                      sx={{ '& .MuiListItemText-primary': { color: '#94a3b8', fontSize: '0.9rem' } }}
                    />
                  </ListItem>
                </List>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {/* Get Started CTA */}
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom sx={{ color: '#ffffff' }}>
          🚀 Ready to Create Your Mint Page?
        </Typography>
        <Typography variant="body1" sx={{ color: '#94a3b8', mb: 3 }}>
          Deploy your NFT contract first, then use the Mint Page Generator to create a beautiful, 
          professional mint experience for your community.
        </Typography>
        
        <Paper sx={{ 
          p: 3,
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          maxWidth: 600,
          mx: 'auto'
        }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#6366f1' }}>
            �� Mint Page Features Summary:
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 800 }}>∞</Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>Custom Branding</Typography>
            </Box>
            <Box>
              <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 800 }}>⚡</Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>Instant Deploy</Typography>
            </Box>
            <Box>
              <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 800 }}>📱</Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>Mobile Ready</Typography>
            </Box>
            <Box>
              <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 800 }}>🔒</Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>Secure</Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}

export default MintPageGeneration
