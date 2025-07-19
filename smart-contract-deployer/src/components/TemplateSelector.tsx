import { useTranslation } from 'react-i18next'
import {
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Box,
  Chip,
  Stack,
} from '@mui/material'
import {
  TrendingUp as TrendingIcon,
  Verified as VerifiedIcon,
  Construction as ConstructionIcon,
  GitHub as GitHubIcon,
} from '@mui/icons-material'
import type { ContractTemplate } from '../types'
import { templates } from '../data/templates'
import SupportedNetworks from './SupportedNetworks'
interface TemplateSelectorProps {
  selectedTemplate: ContractTemplate | null
  onSelectTemplate: (template: ContractTemplate) => void
}
const TemplateSelector = ({ selectedTemplate, onSelectTemplate }: TemplateSelectorProps) => {
  const { t } = useTranslation()
  const getPopularityBadge = (templateId: string) => {
    const popularity: Record<string, string> = {
      token: 'Most Popular',
      nft: 'Trending',
      dao: 'Advanced',
      lock: 'Security',
    }
    return popularity[templateId]
  }
  return (
    <Box>
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
          Choose from our battle-tested smart contract templates
        </Typography>
      </Stack>
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
                  {t(template.id)}
                  {template.id === 'token' && (
                    <VerifiedIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                  )}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ lineHeight: 1.6 }}
                >
                  {t(`${template.id}Desc`)}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
        {}
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
            label="Coming Soon"
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
      <SupportedNetworks />
    </Box>
  )
}
export default TemplateSelector