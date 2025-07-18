import { AppBar, Toolbar, Box, Chip, Button, IconButton, Menu, MenuItem } from '@mui/material'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import {
  Code,
  MenuBook,
  AccountCircle,
  Menu as MenuIcon
} from '@mui/icons-material'
import { useState } from 'react'
import LanguageToggle from './LanguageToggle'
import SubscriptionStatus from './SubscriptionStatus'
import { useTranslation } from 'react-i18next'

interface HeaderProps {
  onNavigateDeploy?: () => void
  onNavigateDocs?: () => void
  onNavigateAccount?: () => void
  currentPage?: 'deploy' | 'documentation' | 'account' | 'analytics'
}

const Header = ({ onNavigateDeploy, onNavigateDocs, onNavigateAccount, currentPage = 'deploy' }: HeaderProps) => {
  const { t } = useTranslation()
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState<null | HTMLElement>(null)
  
  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchor(event.currentTarget)
  }
  
  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null)
  }

  const navigationItems = [
    { key: 'deploy', label: t('nav.deploy'), icon: <Code />, action: onNavigateDeploy },
    { key: 'documentation', label: t('nav.documentation'), icon: <MenuBook />, action: onNavigateDocs },
    { key: 'account', label: t('nav.account'), icon: <AccountCircle />, action: onNavigateAccount }
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
        py: 1,
        minHeight: '64px',
        gap: 2,
        px: { xs: 1, sm: 2, md: 3 }
      }}>
        {/* Logo */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          minWidth: 0,
          flex: '0 0 auto'
        }}>
          <img
            src="/ContractForge.io.png"
            alt="ContractForge.io"
            style={{
              height: '40px',
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
              display: { xs: 'none', md: 'flex' },
              backgroundColor: 'rgba(78, 94, 228, 0.1)',
              color: '#4E5EE4',
              fontWeight: 500,
              fontSize: '0.7rem',
              height: 20,
              border: '1px solid rgba(78, 94, 228, 0.3)',
              '& .MuiChip-label': {
                px: 1,
              },
            }}
          />
        </Box>

        {/* Desktop Navigation */}
        <Box sx={{ 
          display: { xs: 'none', md: 'flex' }, 
          gap: 1,
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
                fontSize: '0.875rem',
                padding: '6px 16px',
                minWidth: 'auto',
                fontWeight: currentPage === item.key ? 600 : 400,
                whiteSpace: 'nowrap'
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>

        {/* Right Side Actions */}
        <Box sx={{ 
          display: 'flex', 
          gap: { xs: 0.5, sm: 1 }, 
          alignItems: 'center',
          minWidth: 0,
          flex: '0 0 auto'
        }}>
          {/* Desktop Only Items */}
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 1, alignItems: 'center' }}>
            <LanguageToggle />
            <SubscriptionStatus />
          </Box>
          
          {/* Connect Button - Always Visible */}
          <Box sx={{ 
            '& button': {
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              padding: { xs: '4px 8px', sm: '6px 12px' },
            }
          }}>
            <ConnectButton />
          </Box>

          {/* Mobile Menu */}
          <IconButton
            sx={{ display: { xs: 'flex', md: 'none' }, ml: 1 }}
            onClick={handleMobileMenuOpen}
            color="inherit"
          >
            <MenuIcon />
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