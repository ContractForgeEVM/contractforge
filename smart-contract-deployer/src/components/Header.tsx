import { AppBar, Toolbar, Box, Chip, Button, IconButton, Menu, MenuItem } from '@mui/material'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import {
  Code,
  MenuBook,
  AccountCircle,
  Assessment,
  Menu as MenuIcon
} from '@mui/icons-material'
import { useState } from 'react'
import LanguageToggle from './LanguageToggle'
import SubscriptionStatus from './SubscriptionStatus'
import { useTranslation } from 'react-i18next'
import { isDevAccount } from '../data/premiumFeatures'
import { useAccount } from 'wagmi'

interface HeaderProps {
  onNavigateDeploy?: () => void
  onNavigateDocs?: () => void
  onNavigateAccount?: () => void
  onNavigateAnalytics?: () => void
  currentPage?: 'deploy' | 'documentation' | 'account' | 'analytics' | 'public-analytics'
}

const Header = ({ onNavigateDeploy, onNavigateDocs, onNavigateAccount, onNavigateAnalytics, currentPage = 'deploy' }: HeaderProps) => {
  const { t } = useTranslation()
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState<null | HTMLElement>(null)
  const { address } = useAccount() // 🎯 Pour détecter le compte dev
  
  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchor(event.currentTarget)
  }
  
  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null)
  }

  const navigationItems = [
    { key: 'deploy', label: t('nav.deploy'), icon: <Code />, action: onNavigateDeploy },
    { key: 'documentation', label: t('nav.documentation'), icon: <MenuBook />, action: onNavigateDocs },
    { key: 'account', label: t('nav.account'), icon: <AccountCircle />, action: onNavigateAccount },
    { key: 'public-analytics', label: 'Analytics', icon: <Assessment />, action: onNavigateAnalytics }
  ]

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: 'rgba(26, 32, 46, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar sx={{ 
        justifyContent: 'space-between', 
        py: 0.5, // Réduit de 1 à 0.5
        minHeight: '56px', // Réduit de 64px à 56px
        gap: 1, // Réduit de 2 à 1
        px: { xs: 1, sm: 2, md: 2 } // Réduit le padding md de 3 à 2
      }}>
        {/* Logo */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 0.5, // Réduit de 1 à 0.5
          minWidth: 0,
          flex: '0 0 auto'
        }}>
          <img
            src="/ContractForge.io.png"
            alt="ContractForge.io"
            style={{
              height: '36px', // Réduit de 40px à 36px
              width: 'auto',
              objectFit: 'contain',
              cursor: 'pointer'
            }}
            onClick={onNavigateDeploy || (() => window.location.reload())}
          />
          <Chip
            label="OpenZeppelin"
            size="small"
            sx={{
              display: { xs: 'none', lg: 'flex' }, // Masqué sur md, visible seulement sur lg+
              backgroundColor: 'rgba(78, 94, 228, 0.1)',
              color: '#4E5EE4',
              fontWeight: 500,
              fontSize: '0.65rem', // Réduit de 0.7rem à 0.65rem
              height: 18, // Réduit de 20 à 18
              border: '1px solid rgba(78, 94, 228, 0.3)',
              '& .MuiChip-label': {
                px: 0.5, // Réduit de 1 à 0.5
              },
            }}
          />
          
          {/* 🌟 Indicateur compte développeur */}
          {isDevAccount(address) && (
            <Chip
              label="DEV"
              size="small"
              sx={{
                backgroundColor: '#ff4081',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '0.65rem', // Réduit de 0.75rem
                height: 18, // Plus petit
                minWidth: 'auto',
                '& .MuiChip-label': {
                  px: 0.5,
                },
                animation: 'pulse 2s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%': { opacity: 1 },
                  '50%': { opacity: 0.7 },
                  '100%': { opacity: 1 },
                },
              }}
            />
          )}
        </Box>

        {/* Desktop Navigation */}
        <Box sx={{ 
          display: { xs: 'none', md: 'flex' }, 
          gap: 0.5, // Réduit de 1 à 0.5
          alignItems: 'center',
          flex: 1,
          justifyContent: 'center'
        }}>
          {navigationItems.map((item) => (
            <Button
              key={item.key}
              color={currentPage === item.key ? 'primary' : 'inherit'}
              onClick={item.action}
              startIcon={item.icon}
              sx={{ 
                textTransform: 'none',
                fontSize: '0.75rem', // Réduit de 0.875rem à 0.75rem
                padding: '4px 8px', // Réduit de 6px 16px à 4px 8px
                minWidth: 'auto',
                fontWeight: currentPage === item.key ? 600 : 400,
                whiteSpace: 'nowrap',
                '& .MuiButton-startIcon': {
                  fontSize: '1rem', // Icônes plus petites
                  marginRight: '4px' // Moins d'espace entre icône et texte
                }
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>

        {/* Right Side Actions */}
        <Box sx={{ 
          display: 'flex', 
          gap: { xs: 0.25, sm: 0.5 }, // Réduit les gaps
          alignItems: 'center',
          minWidth: 0,
          flex: '0 0 auto'
        }}>
          {/* Desktop Only Items */}
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 0.5, alignItems: 'center' }}>
            <LanguageToggle />
            <SubscriptionStatus />
          </Box>
          
          {/* Connect Button - Always Visible */}
          <Box sx={{ 
            '& button': {
              fontSize: { xs: '0.7rem', sm: '0.75rem' }, // Encore plus petit
              padding: { xs: '3px 6px', sm: '4px 8px' }, // Padding réduit
              minHeight: { xs: '28px', sm: '32px' }, // Hauteur limitée
              '& > div': {
                fontSize: { xs: '0.7rem', sm: '0.75rem' } // Pour les éléments internes du ConnectButton
              }
            },
            // Styles spécifiques pour RainbowKit
            '& [data-testid="rk-connect-button"]': {
              fontSize: { xs: '0.7rem', sm: '0.75rem' },
              padding: { xs: '3px 6px', sm: '4px 8px' },
              minHeight: { xs: '28px', sm: '32px' }
            }
          }}>
            <ConnectButton />
          </Box>

          {/* Mobile Menu */}
          <IconButton
            sx={{ 
              display: { xs: 'flex', md: 'none' }, 
              ml: 0.5, // Réduit de 1 à 0.5
              padding: '6px' // Padding réduit pour l'icône
            }}
            onClick={handleMobileMenuOpen}
            color="inherit"
          >
            <MenuIcon sx={{ fontSize: '1.2rem' }} />
          </IconButton>
        </Box>

        {/* Mobile Menu Dropdown */}
        <Menu
          anchorEl={mobileMenuAnchor}
          open={Boolean(mobileMenuAnchor)}
          onClose={handleMobileMenuClose}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiPaper-root': {
              backgroundColor: 'background.paper',
              minWidth: 200
            }
          }}
        >
          {navigationItems.map((item) => (
            <MenuItem
              key={item.key}
              onClick={() => {
                item.action?.()
                handleMobileMenuClose()
              }}
              selected={currentPage === item.key}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {item.icon}
                {item.label}
              </Box>
            </MenuItem>
          ))}
          <MenuItem divider />
          
          {/* Mobile Only Items */}
          <Box sx={{ px: 2, py: 1 }}>
            <Box sx={{ mb: 1 }}>
              <SubscriptionStatus />
            </Box>
            <LanguageToggle />
          </Box>
        </Menu>
      </Toolbar>
    </AppBar>
  )
}

export default Header