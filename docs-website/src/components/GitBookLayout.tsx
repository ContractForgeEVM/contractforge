import { useState } from 'react'
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  useTheme,
  useMediaQuery,
  Collapse,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Code as CodeIcon,
  Security as SecurityIcon,
  Public as PublicIcon,
  RocketLaunch as DeployIcon,
  Api as ApiIcon,
  Star as StarIcon,
  Help as HelpIcon,
  ExpandLess,
  ExpandMore,
  Web as WebIcon,
  GitHub as GitHubIcon,
  History as HistoryIcon,
} from '@mui/icons-material'
import { SvgIcon } from '@mui/material'
import { useNavigate, useLocation } from 'react-router-dom'

const DRAWER_WIDTH = 280

interface GitBookLayoutProps {
  children: React.ReactNode
}

// Composant X (Twitter) personnalisé avec le nouveau logo
const XIcon = (props: any) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="currentColor"/>
  </SvgIcon>
)

// Composant Discord personnalisé avec le logo officiel
const DiscordIcon = (props: any) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" fill="currentColor"/>
  </SvgIcon>
)

const navigationItems = [
  {
    id: 'overview',
    title: 'Overview',
    icon: <HomeIcon />,
    path: '/',
    description: 'Platform introduction'
  },
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: <CodeIcon />,
    children: [
      { id: 'quick-start', title: 'Quick Start', path: '/quick-start' },
      { id: 'templates', title: 'Templates', path: '/templates' },
      { id: 'mint-page-generation', title: 'Mint Page Generation', path: '/mint-page-generation', icon: <WebIcon /> },
    ]
  },
  {
    id: 'features',
    title: 'Features',
    icon: <StarIcon />,
    children: [
      { id: 'premium-features', title: 'Premium Features', path: '/premium-features' },
      { id: 'networks', title: 'Supported Networks', path: '/networks' },
    ]
  },
  {
    id: 'deployment',
    title: 'Deployment',
    icon: <DeployIcon />,
    path: '/deployment',
    description: 'Deploy smart contracts'
  },
  {
    id: 'api',
    title: 'API Reference',
    icon: <ApiIcon />,
    path: '/api-reference',
    description: 'REST API documentation'
  },
  {
    id: 'security',
    title: 'Security',
    icon: <SecurityIcon />,
    path: '/security',
    description: 'Security best practices'
  },
  {
    id: 'faq',
    title: 'FAQ',
    icon: <HelpIcon />,
    path: '/faq',
    description: 'Frequently asked questions'
  },
  {
    id: 'changelog',
    title: 'Changelog',
    icon: <HistoryIcon />,
    path: '/changelog',
    description: 'Version history & updates'
  },
]

const GitBookLayout: React.FC<GitBookLayoutProps> = ({ children }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>(['getting-started', 'features'])
  const navigate = useNavigate()
  const location = useLocation()

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleExpandClick = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const handleNavigation = (path: string) => {
    navigate(path)
    if (isMobile) {
      setMobileOpen(false)
    }
  }

  const renderNavigationItem = (item: any, depth = 0) => {
    const isExpanded = expandedItems.includes(item.id)
    const isSelected = location.pathname === item.path
    const hasChildren = item.children && item.children.length > 0

    return (
      <Box key={item.id}>
        <ListItemButton
          onClick={() => {
            if (hasChildren) {
              handleExpandClick(item.id)
            } else if (item.path) {
              handleNavigation(item.path)
            }
          }}
          selected={isSelected}
          sx={{
            pl: 2 + depth * 2,
            py: 1,
            minHeight: 40,
            borderRadius: 1,
            mx: 1,
            mb: 0.5,
            '&.Mui-selected': {
              backgroundColor: 'rgba(99, 102, 241, 0.15)',
              borderLeft: '3px solid #6366f1',
              '&:hover': {
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
              }
            },
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 1,
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 36, color: isSelected ? '#6366f1' : '#94a3b8' }}>
            {item.icon}
          </ListItemIcon>
          <ListItemText 
            primary={item.title}
            sx={{
              '& .MuiListItemText-primary': {
                fontSize: depth === 0 ? '0.95rem' : '0.9rem',
                fontWeight: depth === 0 ? 600 : 500,
                color: isSelected ? '#ffffff' : '#e2e8f0',
              }
            }}
          />
          {hasChildren && (
            <IconButton size="small" sx={{ color: '#94a3b8' }}>
              {isExpanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          )}
        </ListItemButton>
        
        {hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children.map((child: any) => renderNavigationItem(child, depth + 1))}
            </List>
          </Collapse>
        )}
      </Box>
    )
  }

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ 
        p: 3, 
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <img
            src="/ContractForge.io.png"
            alt="ContractForge.io"
            style={{
              height: '32px',
              width: 'auto',
              objectFit: 'contain'
            }}
          />
          <Box>
            <Typography variant="h6" sx={{ 
              fontWeight: 800,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 0.5,
              fontSize: '1.1rem'
            }}>
              ContractForge
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>
              Documentation & Guides
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, overflow: 'auto', py: 2 }}>
        <List component="nav" disablePadding>
          {navigationItems.map(item => renderNavigationItem(item))}
        </List>
      </Box>

      {/* Footer */}
      <Box sx={{ 
        p: 2, 
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(0, 0, 0, 0.2)'
      }}>
        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', textAlign: 'center' }}>
          ContractForge Docs v1.0
        </Typography>
        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', textAlign: 'center', mt: 0.5 }}>
          Deploy smart contracts with ease
        </Typography>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar - Position absolue sur desktop pour ne pas affecter le layout */}
      <Box
        component="nav"
        sx={{ 
          position: { xs: 'relative', md: 'fixed' },
          top: { md: 0 },
          left: { md: 0 },
          width: { md: DRAWER_WIDTH }, 
          height: { md: '100vh' },
          zIndex: { md: 1200 },
          flexShrink: 0
        }}
        aria-label="documentation navigation"
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              backgroundColor: '#1a1a2e',
              borderRight: '1px solid rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop Drawer */}
        <Box
          sx={{
            display: { xs: 'none', md: 'block' },
            width: DRAWER_WIDTH,
            height: '100vh',
            backgroundColor: '#1a1a2e',
            borderRight: '1px solid rgba(255, 255, 255, 0.1)',
            overflow: 'hidden'
          }}
        >
          {drawer}
        </Box>
      </Box>

      {/* Main Content Area */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          marginLeft: { xs: 0, md: `${DRAWER_WIDTH}px` },
        }}
      >
        {/* App Bar */}
        <AppBar
          position="sticky"
          sx={{
            backgroundColor: '#0f0f23',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
            zIndex: 1100,
          }}
        >
          <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
              <Typography 
                variant="h6" 
                noWrap 
                component="div"
                sx={{ 
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Smart Contract Documentation
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                color="inherit"
                href="https://x.com/contractforgeio"
                target="_blank"
                sx={{ 
                  color: '#94a3b8',
                  '&:hover': { 
                    color: '#000000',
                    transform: 'translateY(-1px)'
                  }
                }}
                title="Suivez-nous sur X"
              >
                <XIcon />
              </IconButton>
              
              <IconButton
                color="inherit"
                href="https://github.com/contractforgeevm"
                target="_blank"
                sx={{ 
                  color: '#94a3b8',
                  '&:hover': { 
                    color: '#ffffff',
                    transform: 'translateY(-1px)'
                  }
                }}
                title="GitHub"
              >
                <GitHubIcon />
              </IconButton>
              
              <IconButton
                color="inherit"
                href="https://discord.gg/jj56fzgMBB"
                target="_blank"
                sx={{ 
                  color: '#94a3b8',
                  '&:hover': { 
                    color: '#7289da',
                    transform: 'translateY(-1px)'
                  }
                }}
                title="Rejoignez notre Discord"
              >
                <DiscordIcon />
              </IconButton>
              
              <IconButton
                color="inherit"
                href="https://contractforge.io"
                target="_blank"
                sx={{ 
                  color: '#94a3b8',
                  '&:hover': { 
                    color: '#6366f1',
                    transform: 'translateY(-1px)'
                  }
                }}
                title="Site principal"
              >
                <PublicIcon />
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Page Content */}
        <Box
          component="main"
          sx={{
            flex: 1,
            backgroundColor: '#0f0f23',
            minHeight: 0, // Permet au contenu de prendre la hauteur disponible
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  )
}

export default GitBookLayout
