import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Tabs,
  Tab
} from '@mui/material'
import {
  Store as StoreIcon,
  Construction as ConstructionIcon,
  Rocket as RocketIcon,
  Security as SecurityIcon
} from '@mui/icons-material'
import SecurityAuditInterface from './SecurityAuditInterface'

interface MarketplacePageProps {
  onSelectTemplate?: (template: any) => void
}

const MarketplacePage: React.FC<MarketplacePageProps> = ({ onSelectTemplate }) => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState(0)

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* En-tête avec onglets */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 3 }}>
          <StoreIcon sx={{ fontSize: 60, color: 'primary.main' }} />
          <Typography
            variant="h2"
            sx={{
              fontWeight: 900,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            MarketPlace
          </Typography>
        </Box>

        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          centered
          sx={{ 
            '& .MuiTab-root': { 
              fontSize: '1.1rem', 
              fontWeight: 'bold',
              minHeight: 60
            } 
          }}
        >
          <Tab 
            label="Coming Soon" 
            icon={<ConstructionIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Security Audit" 
            icon={<SecurityIcon />} 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Contenu des onglets */}
      {activeTab === 0 && (
        <Box sx={{ textAlign: 'center' }}>
          {/* Message Coming Soon */}
          <Card sx={{ 
            maxWidth: 600, 
            mx: 'auto', 
            mb: 4,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}>
            <CardContent sx={{ p: 6, textAlign: 'center' }}>
              <ConstructionIcon sx={{ fontSize: 80, color: 'white', mb: 3 }} />
              <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                🚧 Coming Soon
              </Typography>
              <Typography variant="h6" sx={{ mb: 3, opacity: 0.9 }}>
                Our Community Marketplace is under development
              </Typography>
              <Typography variant="body1" sx={{ mb: 4, opacity: 0.8, lineHeight: 1.6 }}>
                We are working on a revolutionary smart contract template system
                with community validation, decentralized reputation and anti-fraud protection.
              </Typography>
              
              {/* Upcoming features */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'center' }}>
                  <RocketIcon color="inherit" />
                  <Typography variant="body2">Community-validated templates</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'center' }}>
                  <RocketIcon color="inherit" />
                  <Typography variant="body2">Decentralized reputation system</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'center' }}>
                  <RocketIcon color="inherit" />
                  <Typography variant="body2">Blind audit to protect code</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'center' }}>
                  <RocketIcon color="inherit" />
                  <Typography variant="body2">Monetization for creators</Typography>
                </Box>
              </Box>

              <Button
                variant="outlined"
                size="large"
                sx={{ 
                  color: 'white', 
                  borderColor: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)'
                  }
                }}
                onClick={() => window.open('https://discord.gg/jj56fzgMBB', '_blank')}
              >
                Join the Waitlist
              </Button>
            </CardContent>
          </Card>

          {/* Additional information */}
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto' }}>
            Stay informed of the latest news and be among the first to test 
            our revolutionary Marketplace!
          </Typography>
        </Box>
      )}

      {activeTab === 1 && (
        <SecurityAuditInterface />
      )}
    </Container>
  )
}

export default MarketplacePage