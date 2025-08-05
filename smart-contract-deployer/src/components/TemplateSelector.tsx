import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Box,
  Chip,
  Stack,
  Grid,
  Container,
  LinearProgress,
  Avatar,
  Paper,
  Button
} from '@mui/material'
import {
  TrendingUp as TrendingIcon,
  Verified as VerifiedIcon,
  Construction as ConstructionIcon,
  GitHub as GitHubIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  AccountBalance as BankIcon,
  Code as CodeIcon,
  Bolt as BoltIcon,
  Public as PublicIcon,
  Analytics as AnalyticsIcon,
  AutoAwesome as AutoAwesomeIcon,
  Palette as PaletteIcon,
  IntegrationInstructions as IntegrationIcon,
  Shield as ShieldIcon,
  CloudDone as CloudDoneIcon,
  Rocket as RocketIcon,
  Star as StarIcon,
} from '@mui/icons-material'
import type { ContractTemplate } from '../types'
import { templates } from '../data/templates'
import { SupportedNetworksHeader } from './SupportedNetworks'

interface TemplateSelectorProps {
  selectedTemplate: ContractTemplate | null
  onSelectTemplate: (template: ContractTemplate) => void
  showHomepage?: boolean
  onShowTemplates?: () => void
  onNavigateDocs?: () => void
}

const HeroSection: React.FC<{ onNavigateDocs?: () => void }> = ({ onNavigateDocs }) => {
  const { t } = useTranslation()
  
  const platformStats = [
    { icon: <RocketIcon />, value: '12+', label: t('templateSelector.platformStats.smartContractTemplates') },
    { icon: <AutoAwesomeIcon />, value: '44+', label: t('templateSelector.platformStats.premiumFeatures') },
    { icon: <PublicIcon />, value: '15+', label: t('templateSelector.platformStats.supportedNetworks') },
    { icon: <ShieldIcon />, value: '100%', label: t('templateSelector.platformStats.securityAudited') }
  ]

  const keyFeatures = [
    {
      icon: <SpeedIcon />,
      title: t('templateSelector.keyFeatures.deployInMinutes.title'),
      description: t('templateSelector.keyFeatures.deployInMinutes.description')
    },
    {
      icon: <PaletteIcon />,
      title: t('templateSelector.keyFeatures.customMintPages.title'),
      description: t('templateSelector.keyFeatures.customMintPages.description')
    },
    {
      icon: <AnalyticsIcon />,
      title: t('templateSelector.keyFeatures.advancedAnalytics.title'),
      description: t('templateSelector.keyFeatures.advancedAnalytics.description')
    },
    {
      icon: <IntegrationIcon />,
      title: t('templateSelector.keyFeatures.fullWeb3Integration.title'),
      description: t('templateSelector.keyFeatures.fullWeb3Integration.description')
    }
  ]

  const premiumHighlights = [
    t('templateSelector.premiumHighlights.auctionSystems'),
    t('templateSelector.premiumHighlights.priceOracles'), 
    t('templateSelector.premiumHighlights.stakingRewards'),
    t('templateSelector.premiumHighlights.daoGovernance'),
    t('templateSelector.premiumHighlights.multisigSecurity'),
    t('templateSelector.premiumHighlights.royalties'),
    t('templateSelector.premiumHighlights.whitelistControl'),
    t('templateSelector.premiumHighlights.dynamicNfts')
  ]

  return (
    <Box sx={{ mb: 6 }}>
      <Container maxWidth="lg" sx={{ textAlign: 'center', mb: 6 }}>
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: '2.5rem', md: '4rem' },
            fontWeight: 900,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            mb: 2,
          }}
        >
          {t('templateSelector.heroTitle')}
          <br />
          <Box component="span" sx={{ color: '#10b981' }}>{t('templateSelector.heroTitleHighlight')}</Box>
        </Typography>
        
        <Typography 
          variant="h5" 
          color="text.secondary" 
          sx={{ mb: 4, maxWidth: '600px', mx: 'auto', lineHeight: 1.4 }}
        >
          {t('templateSelector.heroSubtitle')}
        </Typography>

        <Box sx={{ mb: 4 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<RocketIcon />}
            onClick={() => {
              const templatesSection = document.getElementById('templates-section')
              if (templatesSection) {
                templatesSection.scrollIntoView({ behavior: 'smooth' })
              }
            }}
            sx={{
              background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
              px: 6,
              py: 2,
              fontSize: '1.3rem',
              fontWeight: 700,
              borderRadius: 3,
              boxShadow: '0 8px 24px rgba(236, 72, 153, 0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #db2777 0%, #7c3aed 100%)',
                transform: 'translateY(-4px) scale(1.05)',
                boxShadow: '0 12px 32px rgba(236, 72, 153, 0.6)',
              },
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%, 100%': {
                  boxShadow: '0 8px 24px rgba(236, 72, 153, 0.4)',
                },
                '50%': {
                  boxShadow: '0 8px 24px rgba(236, 72, 153, 0.8)',
                },
              },
            }}
          >
            {t('templateSelector.startBuildingNow')}
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap', mb: 4 }}>
          {platformStats.map((stat, index) => (
            <Box key={index} sx={{ flex: '1 1 250px', maxWidth: '300px' }}>
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  textAlign: 'center',
                  background: 'rgba(26, 26, 46, 0.6)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 24px rgba(99, 102, 241, 0.2)',
                  }
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: 'primary.main',
                    width: 48,
                    height: 48,
                    mx: 'auto',
                    mb: 1,
                  }}
                >
                  {stat.icon}
                </Avatar>
                <Typography variant="h4" fontWeight={700} color="primary">
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stat.label}
                </Typography>
              </Paper>
            </Box>
          ))}
        </Box>
      </Container>

      <Container maxWidth="lg" sx={{ mb: 5 }}>
        <Typography variant="h3" align="center" fontWeight={700} sx={{ mb: 4 }}>
          {t('templateSelector.whyChoose')}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
          {keyFeatures.map((feature, index) => (
            <Box key={index} sx={{ flex: '1 1 250px', maxWidth: '300px' }}>
              <Card
                sx={{
                  height: '100%',
                  background: 'rgba(26, 26, 46, 0.4)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    borderColor: 'primary.main',
                    boxShadow: '0 16px 32px rgba(99, 102, 241, 0.3)',
                  }
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Avatar
                    sx={{
                      bgcolor: 'primary.main',
                      width: 56,
                      height: 56,
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    {feature.icon}
                  </Avatar>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      </Container>

      <Container maxWidth="lg" sx={{ mb: 5 }}>
        <Paper
          sx={{
            p: 4,
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            borderRadius: 3,
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <StarIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
              {t('templateSelector.premiumFeaturesTitle')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('templateSelector.premiumFeaturesSubtitle')}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mb: 4 }}>
            {premiumHighlights.map((feature, index) => (
              <Chip
                key={index}
                label={feature}
                variant="outlined"
                sx={{
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.main',
                    color: 'white',
                  }
                }}
              />
            ))}
            <Chip
              label={t('templateSelector.evmNetworks')}
              variant="outlined"
              icon={<PublicIcon />}
              sx={{
                borderColor: 'success.main',
                color: 'success.main',
                '&:hover': {
                  backgroundColor: 'success.main',
                  color: 'white',
                }
              }}
            />
          </Box>

          <Box sx={{ 
            background: 'rgba(0, 0, 0, 0.2)', 
            borderRadius: 2, 
            p: 3,
            border: '1px solid rgba(255, 255, 255, 0.1)' 
          }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <PublicIcon sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
              <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                {t('templateSelector.deployAnywhere')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('templateSelector.deployAnywhereSubtitle')}
              </Typography>
            </Box>
            <SupportedNetworksHeader />
          </Box>
        </Paper>
      </Container>

      <Container maxWidth="md" sx={{ textAlign: 'center' }}>
        <Paper
          sx={{
            p: 4,
            background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
            border: '2px solid',
            borderColor: 'primary.main',
            borderRadius: 3,
          }}
        >
          <Typography variant="h4" fontWeight={700} sx={{ mb: 2 }}>
            {t('templateSelector.readyToDeploy')}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {t('templateSelector.readyToDeploySubtitle')}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<RocketIcon />}
              onClick={() => {
                const templatesSection = document.getElementById('templates-section')
                if (templatesSection) {
                  templatesSection.scrollIntoView({ behavior: 'smooth' })
                }
              }}
              sx={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              {t('templateSelector.chooseTemplate')}
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<CodeIcon />}
              onClick={onNavigateDocs || (() => {})}
              sx={{ 
                px: 4, 
                py: 1.5, 
                fontSize: '1.1rem',
                '&:hover': {
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              {t('templateSelector.viewDocumentation')}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  )
}

export const Homepage: React.FC<{ onShowTemplates: () => void; onNavigateDocs?: () => void }> = ({ onShowTemplates, onNavigateDocs }) => {
  const { t } = useTranslation()
  
  const platformStats = [
    { icon: <RocketIcon />, value: '12+', label: t('templateSelector.platformStats.smartContractTemplates') },
    { icon: <AutoAwesomeIcon />, value: '44+', label: t('templateSelector.platformStats.premiumFeatures') },
    { icon: <PublicIcon />, value: '15+', label: t('templateSelector.platformStats.supportedNetworks') },
    { icon: <ShieldIcon />, value: '100%', label: t('templateSelector.platformStats.securityAudited') }
  ]

  const keyFeatures = [
    {
      icon: <SpeedIcon />,
      title: t('templateSelector.keyFeatures.deployInMinutes.title'),
      description: t('templateSelector.keyFeatures.deployInMinutes.description')
    },
    {
      icon: <PaletteIcon />,
      title: t('templateSelector.keyFeatures.customMintPages.title'),
      description: t('templateSelector.keyFeatures.customMintPages.description')
    },
    {
      icon: <AnalyticsIcon />,
      title: t('templateSelector.keyFeatures.advancedAnalytics.title'),
      description: t('templateSelector.keyFeatures.advancedAnalytics.description')
    },
    {
      icon: <IntegrationIcon />,
      title: t('templateSelector.keyFeatures.fullWeb3Integration.title'),
      description: t('templateSelector.keyFeatures.fullWeb3Integration.description')
    }
  ]

  const premiumHighlights = [
    t('templateSelector.premiumHighlights.auctionSystems'),
    t('templateSelector.premiumHighlights.priceOracles'), 
    t('templateSelector.premiumHighlights.stakingRewards'),
    t('templateSelector.premiumHighlights.daoGovernance'),
    t('templateSelector.premiumHighlights.multisigSecurity'),
    t('templateSelector.premiumHighlights.royalties'),
    t('templateSelector.premiumHighlights.whitelistControl'),
    t('templateSelector.premiumHighlights.dynamicNfts')
  ]

  return (
    <Box sx={{ mb: 6 }}>
      <Container maxWidth="lg" sx={{ textAlign: 'center', mb: 6 }}>
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: '2.5rem', md: '4rem' },
            fontWeight: 900,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            mb: 2,
          }}
        >
          {t('templateSelector.heroTitle')}
          <br />
          <Box component="span" sx={{ color: '#10b981' }}>{t('templateSelector.heroTitleHighlight')}</Box>
        </Typography>
        
        <Typography 
          variant="h5" 
          color="text.secondary" 
          sx={{ mb: 4, maxWidth: '600px', mx: 'auto', lineHeight: 1.4 }}
        >
          {t('templateSelector.heroSubtitle')}
        </Typography>

        <Box sx={{ mb: 4 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<RocketIcon />}
            onClick={onShowTemplates}
            sx={{
              background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
              px: 6,
              py: 2,
              fontSize: '1.3rem',
              fontWeight: 700,
              borderRadius: 3,
              boxShadow: '0 8px 24px rgba(236, 72, 153, 0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #db2777 0%, #7c3aed 100%)',
                transform: 'translateY(-4px) scale(1.05)',
                boxShadow: '0 12px 32px rgba(236, 72, 153, 0.6)',
              },
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%, 100%': {
                  boxShadow: '0 8px 24px rgba(236, 72, 153, 0.4)',
                },
                '50%': {
                  boxShadow: '0 8px 24px rgba(236, 72, 153, 0.8)',
                },
              },
            }}
          >
            {t('templateSelector.startBuildingNow')}
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap', mb: 4 }}>
          {platformStats.map((stat, index) => (
            <Box key={index} sx={{ flex: '1 1 250px', maxWidth: '300px' }}>
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  textAlign: 'center',
                  background: 'rgba(26, 26, 46, 0.6)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 24px rgba(99, 102, 241, 0.2)',
                  }
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: 'primary.main',
                    width: 48,
                    height: 48,
                    mx: 'auto',
                    mb: 1,
                  }}
                >
                  {stat.icon}
                </Avatar>
                <Typography variant="h4" fontWeight={700} color="primary">
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stat.label}
                </Typography>
              </Paper>
            </Box>
          ))}
        </Box>
      </Container>

      <Container maxWidth="lg" sx={{ mb: 5 }}>
        <Typography variant="h3" align="center" fontWeight={700} sx={{ mb: 4 }}>
          {t('templateSelector.whyChoose')}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
          {keyFeatures.map((feature, index) => (
            <Box key={index} sx={{ flex: '1 1 250px', maxWidth: '300px' }}>
              <Card
                sx={{
                  height: '100%',
                  background: 'rgba(26, 26, 46, 0.4)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    borderColor: 'primary.main',
                    boxShadow: '0 16px 32px rgba(99, 102, 241, 0.3)',
                  }
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Avatar
                    sx={{
                      bgcolor: 'primary.main',
                      width: 56,
                      height: 56,
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    {feature.icon}
                  </Avatar>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      </Container>

      <Container maxWidth="lg" sx={{ mb: 5 }}>
        <Paper
          sx={{
            p: 4,
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            borderRadius: 3,
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <StarIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
              {t('templateSelector.premiumFeaturesTitle')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('templateSelector.premiumFeaturesSubtitle')}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mb: 4 }}>
            {premiumHighlights.map((feature, index) => (
              <Chip
                key={index}
                label={feature}
                variant="outlined"
                sx={{
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.main',
                    color: 'white',
                  }
                }}
              />
            ))}
            <Chip
              label={t('templateSelector.evmNetworks')}
              variant="outlined"
              icon={<PublicIcon />}
              sx={{
                borderColor: 'success.main',
                color: 'success.main',
                '&:hover': {
                  backgroundColor: 'success.main',
                  color: 'white',
                }
              }}
            />
          </Box>

          <Box sx={{ 
            background: 'rgba(0, 0, 0, 0.2)', 
            borderRadius: 2, 
            p: 3,
            border: '1px solid rgba(255, 255, 255, 0.1)' 
          }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <PublicIcon sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
              <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                {t('templateSelector.deployAnywhere')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('templateSelector.deployAnywhereSubtitle')}
              </Typography>
            </Box>
            <SupportedNetworksHeader />
          </Box>
        </Paper>
      </Container>

      <Container maxWidth="md" sx={{ textAlign: 'center' }}>
        <Paper
          sx={{
            p: 4,
            background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
            border: '2px solid',
            borderColor: 'primary.main',
            borderRadius: 3,
          }}
        >
          <Typography variant="h4" fontWeight={700} sx={{ mb: 2 }}>
            {t('templateSelector.readyToDeploy')}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {t('templateSelector.readyToDeploySubtitle')}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<RocketIcon />}
              onClick={onShowTemplates}
              sx={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              {t('templateSelector.chooseTemplate')}
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<CodeIcon />}
              onClick={onNavigateDocs || (() => {})}
              sx={{ 
                px: 4, 
                py: 1.5, 
                fontSize: '1.1rem',
                '&:hover': {
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              {t('templateSelector.viewDocumentation')}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  )
}

const TemplateSelector = ({ selectedTemplate, onSelectTemplate, showHomepage = true, onShowTemplates, onNavigateDocs }: TemplateSelectorProps) => {
  const { t } = useTranslation()
  
  if (showHomepage && onShowTemplates) {
    return <Homepage onShowTemplates={onShowTemplates} onNavigateDocs={onNavigateDocs} />
  }
  
  const getPopularityBadge = (templateId: string) => {
    const popularity: Record<string, string> = {
      token: t('templateSelector.popularity.mostPopular'),
      nft: t('templateSelector.popularity.trending'),
      dao: t('templateSelector.popularity.advanced'),
      lock: t('templateSelector.popularity.security'),
    }
    return popularity[templateId]
  }
  
  return (
    <Box>
      {showHomepage && (
        <>
          <HeroSection onNavigateDocs={onNavigateDocs} />
          
          <Box id="templates-section" sx={{ scrollMarginTop: '100px' }}>
            <Stack spacing={1} alignItems="center" sx={{ mb: 4 }}>
              <Typography
                variant="h2"
                align="center"
                sx={{
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {t('selectTemplate')}
              </Typography>
              <Typography variant="body1" color="text.secondary" align="center">
                {t('templateSelector.battleTestedTemplates')}
              </Typography>
            </Stack>
          </Box>
        </>
      )}

      {!showHomepage && (
      <Stack spacing={1} alignItems="center" sx={{ mb: 4 }}>
        <Typography
          variant="h2"
          align="center"
          sx={{
            fontWeight: 800,
            background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {t('selectTemplate')}
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center">
          {t('templateSelector.battleTestedTemplates')}
        </Typography>
      </Stack>
      )}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)',
          },
          gap: 3,
        }}
      >
        {templates.map((template, index) => (
          <Card
            key={template.id}
            sx={{
              height: '100%',
              position: 'relative',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer',
              border: selectedTemplate?.id === template.id ? 2 : 1,
              borderColor: selectedTemplate?.id === template.id ? 'primary.main' : 'transparent',
              background: selectedTemplate?.id === template.id
                ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)'
                : 'rgba(26, 26, 46, 0.6)',
              backdropFilter: 'blur(10px)',
              overflow: 'visible',
              animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`,
              '@keyframes fadeInUp': {
                from: {
                  opacity: 0,
                  transform: 'translateY(20px)',
                },
                to: {
                  opacity: 1,
                  transform: 'translateY(0)',
                },
              },
              '&:hover': {
                transform: 'translateY(-8px) scale(1.02)',
                boxShadow: '0 20px 40px rgba(99, 102, 241, 0.3)',
                borderColor: 'primary.main',
                '& .template-icon': {
                  transform: 'scale(1.2) rotate(5deg)',
                },
              },
            }}
            onClick={() => onSelectTemplate(template)}
          >
            {getPopularityBadge(template.id) && (
              <Chip
                label={getPopularityBadge(template.id)}
                size="small"
                color={template.id === 'token' ? 'primary' : 'default'}
                icon={template.id === 'token' ? <TrendingIcon sx={{ fontSize: 16 }} /> : undefined}
                sx={{
                  position: 'absolute',
                  top: -10,
                  right: 16,
                  zIndex: 1,
                  fontWeight: 600,
                  fontSize: '0.75rem',
                }}
              />
            )}
            <CardActionArea sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Box
                  className="template-icon"
                  sx={{
                    fontSize: '4rem',
                    mb: 2,
                    transition: 'transform 0.3s ease',
                    filter: selectedTemplate?.id === template.id ? 'drop-shadow(0 0 20px rgba(99, 102, 241, 0.5))' : 'none',
                  }}
                >
                  {template.icon}
                </Box>
                <Typography
                  variant="h5"
                  gutterBottom
                  fontWeight={700}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                  }}
                >
                  {template.name}
                  {template.id === 'token' && (
                    <VerifiedIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                  )}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ lineHeight: 1.6 }}
                >
                  {template.description}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
        <Card
          sx={{
            height: '100%',
            position: 'relative',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer',
            background: 'linear-gradient(135deg, rgba(156, 163, 175, 0.1) 0%, rgba(107, 114, 128, 0.1) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px dashed rgba(156, 163, 175, 0.4)',
            overflow: 'visible',
            animation: `fadeInUp 0.5s ease-out ${templates.length * 0.1}s both`,
            '@keyframes fadeInUp': {
              from: {
                opacity: 0,
                transform: 'translateY(20px)',
              },
              to: {
                opacity: 1,
                transform: 'translateY(0)',
              },
            },
            '&:hover': {
              transform: 'translateY(-8px) scale(1.02)',
              boxShadow: '0 20px 40px rgba(156, 163, 175, 0.2)',
              borderColor: 'rgba(156, 163, 175, 0.6)',
              '& .coming-soon-icon': {
                transform: 'scale(1.2) rotate(10deg)',
              },
            },
          }}
          onClick={() => window.open('https://contractforge.io/premium', '_blank')}
        >
          <Chip
            label={t('templateSelector.comingSoon')}
            size="small"
            color="default"
            icon={<ConstructionIcon sx={{ fontSize: 16 }} />}
            sx={{
              position: 'absolute',
              top: -10,
              right: 16,
              zIndex: 1,
              fontWeight: 600,
              fontSize: '0.75rem',
              backgroundColor: 'rgba(156, 163, 175, 0.2)',
            }}
          />
          <CardActionArea sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Box
                className="coming-soon-icon"
                sx={{
                  fontSize: '4rem',
                  mb: 2,
                  transition: 'transform 0.3s ease',
                  color: 'text.secondary',
                }}
              >
                🚀
              </Box>
              <Typography
                variant="h5"
                gutterBottom
                fontWeight={700}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  color: 'text.secondary',
                }}
              >
                {t('moreSoon')}
                <GitHubIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ lineHeight: 1.6 }}
              >
                {t('moreSoonDesc')}
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      </Box>
    </Box>
  )
}
export default TemplateSelector