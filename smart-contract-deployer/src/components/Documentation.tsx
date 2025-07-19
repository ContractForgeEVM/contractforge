import React, { useState } from 'react'
import {
  Box,
  Container,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Chip,
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
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Button,
  Alert,
  Divider,
  Tab,
  Tabs,
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  Code as CodeIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Public as PublicIcon,
  AccountBalance as AccountBalanceIcon,
  Token as TokenIcon,
  Palette as PaletteIcon,
  Gavel as GavelIcon,
  Lock as LockIcon,
  ContentCopy as CopyIcon,
  Launch as LaunchIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { templates } from '../data/templates'
import { premiumFeatures } from '../data/premiumFeatures'
interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}
function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`documentation-tabpanel-${index}`}
      aria-labelledby={`documentation-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}
const Documentation = () => {
  const { t } = useTranslation()
  const [tabValue, setTabValue] = useState(0)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(label)
    setTimeout(() => setCopiedCode(null), 2000)
  }
  const networkInfo = [
    // Mainnet Networks with Primary Factory (0x2F9258A0024d389eE69BF9F4E44aB9120a359DC7)
    { name: 'Ethereum Mainnet', chainId: 1, status: t('documentation.networks.live'), gasToken: 'ETH', factoryType: 'Primary', tier: 'mainnet' },
    { name: 'Arbitrum One', chainId: 42161, status: t('documentation.networks.live'), gasToken: 'ETH', factoryType: 'Primary', tier: 'mainnet' },
    { name: 'Optimism', chainId: 10, status: t('documentation.networks.live'), gasToken: 'ETH', factoryType: 'Primary', tier: 'mainnet' },
    { name: 'BNB Smart Chain', chainId: 56, status: t('documentation.networks.live'), gasToken: 'BNB', factoryType: 'Primary', tier: 'mainnet' },
    { name: 'Avalanche C-Chain', chainId: 43114, status: t('documentation.networks.live'), gasToken: 'AVAX', factoryType: 'Primary', tier: 'mainnet' },
    { name: 'Base', chainId: 8453, status: t('documentation.networks.live'), gasToken: 'ETH', factoryType: 'Primary', tier: 'mainnet' },
    { name: 'Scroll', chainId: 534352, status: t('documentation.networks.live'), gasToken: 'ETH', factoryType: 'Primary', tier: 'mainnet' },
    { name: 'Gnosis Chain', chainId: 100, status: t('documentation.networks.live'), gasToken: 'XDAI', factoryType: 'Primary', tier: 'mainnet' },
    { name: 'Celo', chainId: 42220, status: t('documentation.networks.live'), gasToken: 'CELO', factoryType: 'Primary', tier: 'mainnet' },
    { name: 'Zora', chainId: 7777777, status: t('documentation.networks.live'), gasToken: 'ETH', factoryType: 'Primary', tier: 'mainnet' },
    
    // Special Factory Networks
    { name: 'Polygon', chainId: 137, status: t('documentation.networks.live'), gasToken: 'MATIC', factoryType: 'Special', tier: 'mainnet', factoryAddress: '0x9ba797d0968bf4b48b639988c7ffedf28d3fee5a' },
    { name: 'Linea', chainId: 59144, status: t('documentation.networks.live'), gasToken: 'ETH', factoryType: 'Special', tier: 'mainnet', factoryAddress: '0x836ef37aa08F6089B4efEAdc55A864f6caff4a16' },
    { name: 'HyperEVM', chainId: 999, status: t('documentation.networks.live'), gasToken: 'HYPE', factoryType: 'Special', tier: 'mainnet', factoryAddress: '0x2F9258A0024d389eE69BF9F4E44aB9120a359DC7' },
    
    // Testnet Networks
    { name: 'Monad Testnet', chainId: 10143, status: t('documentation.networks.testnet'), gasToken: 'MON', factoryType: 'Primary', tier: 'testnet' },
    { name: 'Base Sepolia', chainId: 84532, status: t('documentation.networks.testnet'), gasToken: 'ETH', factoryType: 'Primary', tier: 'testnet' },
  ]
  const apiEndpoints = [
    { method: 'POST', endpoint: '/api/compile', description: t('documentation.api.compileContract') },
    { method: 'POST', endpoint: '/api/deploy', description: t('documentation.api.deployContract') },
    { method: 'GET', endpoint: '/api/gas-estimate', description: t('documentation.api.gasEstimate') },
    { method: 'GET', endpoint: '/api/contract/{address}', description: t('documentation.api.contractInfo') },
    { method: 'POST', endpoint: '/api/verify', description: t('documentation.api.verifyContract') },
  ]
  const featureCompatibility = {
    token: ['pausable', 'burnable', 'mintable', 'capped', 'snapshot', 'permit', 'votes', 'whitelist', 'blacklist', 'tax', 'multisig', 'upgradeable', 'vesting', 'airdrop', 'staking', 'flashmint'],
    nft: ['pausable', 'burnable', 'royalties', 'enumerable', 'uristorage', 'whitelist', 'blacklist', 'multisig', 'upgradeable', 'airdrop'],
    dao: ['snapshot', 'votes', 'timelock', 'multisig'],
    lock: ['vesting', 'multisig']
  }
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h2" component="h1" gutterBottom sx={{
          fontWeight: 800,
          background: 'linear-gradient(135deg, #5C6BC0 0%, #7E57C2 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          mb: 2
        }}>
          {t('documentation.title')}
        </Typography>
        <Typography variant="h5" color="text.secondary" gutterBottom sx={{ mb: 4 }}>
          {t('documentation.subtitle')}
        </Typography>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="documentation tabs">
            <Tab label={t('documentation.tabs.overview')} />
            <Tab label={t('documentation.tabs.templates')} />
            <Tab label={t('documentation.tabs.premiumFeatures')} />
            <Tab label={t('documentation.tabs.apiReference')} />
            <Tab label={t('documentation.tabs.networks')} />
            <Tab label={t('documentation.tabs.deployment')} />
            <Tab label={t('documentation.tabs.security')} />
          </Tabs>
        </Box>
        {}
        <CustomTabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
            <Box sx={{ flex: { xs: '1', md: '2' } }}>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CodeIcon color="primary" />
                  {t('documentation.overview.platformTitle')}
                </Typography>
                <Typography paragraph>
                  {t('documentation.overview.platformDesc')}
                </Typography>
                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>{t('documentation.overview.keyFeatures')}</Typography>
                <List>
                  <ListItem>
                    <ListItemIcon><TokenIcon color="primary" /></ListItemIcon>
                    <ListItemText primary={t('documentation.overview.multiTemplate')} secondary={t('documentation.overview.multiTemplateDesc')} />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><SecurityIcon color="primary" /></ListItemIcon>
                    <ListItemText primary={t('documentation.overview.premiumFeaturesTitle')} secondary={t('documentation.overview.premiumFeaturesDesc')} />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><PublicIcon color="primary" /></ListItemIcon>
                    <ListItemText primary={t('documentation.overview.multiChain')} secondary={t('documentation.overview.multiChainDesc')} />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><SpeedIcon color="primary" /></ListItemIcon>
                    <ListItemText primary={t('documentation.overview.realTimeComp')} secondary={t('documentation.overview.realTimeCompDesc')} />
                  </ListItem>
                </List>
              </Paper>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>{t('documentation.overview.techStack')}</Typography>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" gutterBottom>{t('documentation.overview.frontend')}</Typography>
                    <List dense>
                      <ListItem><ListItemText primary="React 18 + TypeScript" /></ListItem>
                      <ListItem><ListItemText primary="Vite Build Tool" /></ListItem>
                      <ListItem><ListItemText primary="Material-UI v5" /></ListItem>
                      <ListItem><ListItemText primary="RainbowKit v2" /></ListItem>
                      <ListItem><ListItemText primary="wagmi + viem" /></ListItem>
                    </List>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" gutterBottom>{t('documentation.overview.smartContracts')}</Typography>
                    <List dense>
                      <ListItem><ListItemText primary="OpenZeppelin Contracts v5" /></ListItem>
                      <ListItem><ListItemText primary="Solidity ^0.8.20" /></ListItem>
                      <ListItem><ListItemText primary="Foundry + Solc (primary)" /></ListItem>
                      <ListItem><ListItemText primary="Hardhat (fallback)" /></ListItem>
                      <ListItem><ListItemText primary="EIP Standards Compliant" /></ListItem>
                    </List>
                  </Box>
                </Box>
              </Paper>
            </Box>
            <Box sx={{ flex: { xs: '1', md: '1' } }}>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">{t('documentation.overview.quickStats')}</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>{t('documentation.overview.templates')}:</Typography>
                      <Chip label="4" size="small" color="primary" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>{t('premiumFeatures.title')}:</Typography>
                      <Chip label="20+" size="small" color="secondary" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>{t('documentation.overview.supportedNetworks')}:</Typography>
                      <Chip label="18+" size="small" color="success" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>{t('documentation.overview.platformFee')}:</Typography>
                      <Chip label="2%" size="small" color="warning" />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">📋 Platform Summary</Typography>
                  
                  {/* Treasury Info */}
                  <Box sx={{ mb: 2, p: 2, bgcolor: 'primary.50', borderRadius: 1, border: '1px solid', borderColor: 'primary.200' }}>
                    <Typography variant="subtitle2" fontWeight="bold" color="primary.dark" gutterBottom>
                      🏛️ Treasury Address
                    </Typography>
                    <Typography component="code" variant="caption" fontFamily="monospace" sx={{ 
                      bgcolor: 'primary.100', 
                      p: 0.5, 
                      borderRadius: 0.5,
                      color: 'primary.dark',
                      display: 'block',
                      wordBreak: 'break-all'
                    }}>
                      0x09789515d075Ad4f657cF33a7f4adCe485Ee4f2E
                    </Typography>
                    <Typography variant="caption" color="primary.dark" sx={{ mt: 0.5, display: 'block' }}>
                      Receives all platform fees (2% of deployment value)
                    </Typography>
                  </Box>

                                     {/* Deployer Info */}
                   <Box sx={{ mb: 2, p: 2, bgcolor: 'secondary.50', borderRadius: 1, border: '1px solid', borderColor: 'secondary.200' }}>
                     <Typography variant="subtitle2" fontWeight="bold" color="secondary.dark" gutterBottom>
                       👤 Contract Deployer
                     </Typography>
                     <Typography component="code" variant="caption" fontFamily="monospace" sx={{ 
                       bgcolor: 'secondary.100', 
                       p: 0.5, 
                       borderRadius: 0.5,
                       color: 'secondary.dark',
                       display: 'block',
                       wordBreak: 'break-all'
                     }}>
                       0x661b30Bf65e46B3Ae775e6Ac7Cdb5Fa7dab54df9
                     </Typography>
                     <Typography variant="caption" color="secondary.dark" sx={{ mt: 0.5, display: 'block' }}>
                       EOA that deployed all factory contracts
                     </Typography>
                   </Box>

                  {/* Main Factory */}
                  <Box sx={{ mb: 2, p: 2, bgcolor: 'success.50', borderRadius: 1, border: '1px solid', borderColor: 'success.200' }}>
                    <Typography variant="subtitle2" fontWeight="bold" color="success.dark" gutterBottom>
                      🏭 Primary Factory Contract
                    </Typography>
                    <Typography component="code" variant="caption" fontFamily="monospace" sx={{ 
                      bgcolor: 'success.100', 
                      p: 0.5, 
                      borderRadius: 0.5,
                      color: 'success.dark',
                      display: 'block',
                      wordBreak: 'break-all'
                    }}>
                      0x2F9258A0024d389eE69BF9F4E44aB9120a359DC7
                    </Typography>
                    <Typography variant="caption" color="success.dark" sx={{ mt: 0.5, display: 'block' }}>
                      Used on 10+ networks (Ethereum, Arbitrum, Optimism, BSC, etc.)
                    </Typography>
                  </Box>

                  {/* Special Networks */}
                  <Box sx={{ p: 2, bgcolor: 'warning.50', borderRadius: 1, border: '1px solid', borderColor: 'warning.200' }}>
                    <Typography variant="subtitle2" fontWeight="bold" color="orange" gutterBottom>
                      ⚠️ Special Network Addresses
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box>
                        <Typography variant="caption" color="text.primary" sx={{ fontWeight: 'medium' }}>Polygon: </Typography>
                        <Typography component="code" variant="caption" fontFamily="monospace" sx={{ bgcolor: 'grey.200', p: 0.3, borderRadius: 0.3, color: 'grey.800', border: '1px solid', borderColor: 'grey.300' }}>
                          0x9ba797d0968bf4b48b639988c7ffedf28d3fee5a
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.primary" sx={{ fontWeight: 'medium' }}>Linea: </Typography>
                        <Typography component="code" variant="caption" fontFamily="monospace" sx={{ bgcolor: 'grey.200', p: 0.3, borderRadius: 0.3, color: 'grey.800', border: '1px solid', borderColor: 'grey.300' }}>
                          0x836ef37aa08F6089B4efEAdc55A864f6caff4a16
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.primary" sx={{ fontWeight: 'medium' }}>HyperEVM: </Typography>
                        <Typography component="code" variant="caption" fontFamily="monospace" sx={{ bgcolor: 'grey.200', p: 0.3, borderRadius: 0.3, color: 'grey.800', border: '1px solid', borderColor: 'grey.300' }}>
                          0x2F9258A0024d389eE69BF9F4E44aB9120a359DC7
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  {t('documentation.overview.securityNote')}
                </Typography>
              </Alert>
              <Alert severity="warning">
                <Typography variant="body2">
                  {t('documentation.overview.reviewWarning')}
                </Typography>
              </Alert>
                        </Box>
          </Box>
        </CustomTabPanel>
        {}
        <CustomTabPanel value={tabValue} index={1}>
          <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>{t('documentation.templates.title')}</Typography>
          {templates.map((template, index) => (
            <Accordion key={template.id} sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Typography variant="h2" sx={{ fontSize: '2rem' }}>{template.icon}</Typography>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6">{t(`documentation.templates.${template.id}.name`)}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t(`documentation.templates.${template.id}.description`)}
                    </Typography>
                  </Box>
                  <Chip
                    label={`${template.fields.length} ${t('documentation.templates.fields')}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" gutterBottom>{t('documentation.templates.requiredFields')}</Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>{t('documentation.templates.field')}</TableCell>
                            <TableCell>{t('documentation.templates.type')}</TableCell>
                            <TableCell>{t('documentation.templates.required')}</TableCell>
                            <TableCell>{t('documentation.templates.default')}</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {template.fields.map((field) => (
                            <TableRow key={field.name}>
                              <TableCell component="th" scope="row">
                                <Typography variant="body2" fontWeight="medium">
                                  {t(field.label)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip label={field.type} size="small" variant="outlined" />
                              </TableCell>
                              <TableCell>
                                {field.validation?.required ? (
                                  <CheckCircleIcon color="error" fontSize="small" />
                                ) : (
                                  <Typography variant="body2" color="text.secondary">{t('documentation.templates.optional')}</Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                  {field.defaultValue?.toString() || '-'}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" gutterBottom>{t('documentation.templates.compatibleFeatures')}</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {featureCompatibility[template.id as keyof typeof featureCompatibility]?.map((featureId) => {
                        const feature = premiumFeatures.find(f => f.id === featureId)
                        return feature ? (
                          <Chip
                            key={featureId}
                            label={`${feature.icon} ${t(`premiumFeatures.${featureId}.name`)}`}
                            size="small"
                            variant="outlined"
                            color="secondary"
                          />
                        ) : null
                      })}
                    </Box>
                    <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>{t('documentation.templates.usageExample')}</Typography>
                    <Paper sx={{ p: 2, bgcolor: 'grey.900', color: 'common.white' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="caption" color="grey.400">{t('documentation.templates.exampleParams')}</Typography>
                        <Tooltip title={copiedCode === template.id ? t('documentation.templates.copied') : t('documentation.templates.copyExample')}>
                          <IconButton
                            size="small"
                            onClick={() => copyToClipboard(
                              JSON.stringify(
                                Object.fromEntries(
                                  template.fields.map(f => [f.name, f.defaultValue || f.placeholder])
                                ),
                                null,
                                2
                              ),
                              template.id
                            )}
                            sx={{ color: 'grey.400' }}
                          >
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <Typography component="pre" variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {JSON.stringify(
                          Object.fromEntries(
                            template.fields.map(f => [f.name, f.defaultValue || f.placeholder])
                          ),
                          null,
                          2
                        )}
                      </Typography>
                    </Paper>
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </CustomTabPanel>
        {}
        <CustomTabPanel value={tabValue} index={2}>
          <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>{t('documentation.premiumFeatures.title')}</Typography>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              {t('documentation.premiumFeatures.description')}
            </Typography>
          </Alert>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {premiumFeatures.map((feature) => (
              <Box key={feature.id} sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(33.333% - 8px)' } }}>
                <Card sx={{ height: '100%', border: 1, borderColor: 'divider' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Typography variant="h5">{feature.icon}</Typography>
                      <Typography variant="h6" component="h3">
                        {t(`premiumFeatures.${feature.id}.name`)}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {t(`premiumFeatures.${feature.id}.description`)}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Chip
                        label={`${feature.price.toFixed(3)} ETH`}
                        color="primary"
                        size="small"
                      />
                      {feature.requiredFor && (
                        <Chip
                          label={`${feature.requiredFor.length} ${t('documentation.premiumFeatures.templates')}`}
                          variant="outlined"
                          size="small"
                        />
                      )}
                    </Box>
                    {feature.requiredFor && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary">{t('documentation.premiumFeatures.compatibleWith')}</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                          {feature.requiredFor.map((templateId) => (
                            <Chip
                              key={templateId}
                              label={templateId.toUpperCase()}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                    {feature.incompatibleWith && (
                      <Box>
                        <Typography variant="caption" color="error">{t('documentation.premiumFeatures.incompatibleWith')}</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                          {feature.incompatibleWith.map((incompatibleId) => (
                            <Chip
                              key={incompatibleId}
                              label={incompatibleId}
                              size="small"
                              color="error"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        </CustomTabPanel>
        {}
        <CustomTabPanel value={tabValue} index={3}>
          <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>{t('documentation.api.title')}</Typography>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>{t('documentation.api.baseUrl')}</Typography>
            <Paper sx={{ p: 2, bgcolor: 'grey.200', border: '1px solid', borderColor: 'grey.300' }}>
              <Typography component="code" variant="body2" fontFamily="monospace" sx={{ color: 'grey.800' }}>
                https://contractforge.io/api
              </Typography>
            </Paper>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Production API endpoint for all smart contract operations
            </Typography>
          </Paper>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>🏛️ Platform Smart Contract Addresses</Typography>
            
            {/* Treasury Address */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
                Treasury & Fee Recipient
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Address that receives all platform fees (2% of deployment value):
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'grey.200', display: 'flex', alignItems: 'center', gap: 1, border: '1px solid', borderColor: 'grey.300' }}>
                <Typography component="code" variant="body2" fontFamily="monospace" sx={{ flex: 1, color: 'grey.800' }}>
                  0x09789515d075Ad4f657cF33a7f4adCe485Ee4f2E
                </Typography>
                <Tooltip title={copiedCode === 'treasury-address' ? 'Copied!' : 'Copy Address'}>
                  <IconButton
                    size="small"
                    onClick={() => copyToClipboard('0x09789515d075Ad4f657cF33a7f4adCe485Ee4f2E', 'treasury-address')}
                  >
                    <CopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Paper>
            </Box>

                         {/* Deployer Address */}
             <Box sx={{ mb: 3 }}>
               <Typography variant="subtitle1" fontWeight="bold" color="secondary" gutterBottom>
                 Factory Contract Deployer
               </Typography>
               <Typography variant="body2" color="text.secondary" gutterBottom>
                 EOA that deployed all factory contracts across networks:
               </Typography>
               <Paper sx={{ p: 2, bgcolor: 'grey.200', display: 'flex', alignItems: 'center', gap: 1, border: '1px solid', borderColor: 'grey.300' }}>
                 <Typography component="code" variant="body2" fontFamily="monospace" sx={{ flex: 1, color: 'grey.800' }}>
                   0x661b30Bf65e46B3Ae775e6Ac7Cdb5Fa7dab54df9
                 </Typography>
                 <Tooltip title={copiedCode === 'deployer-address' ? 'Copied!' : 'Copy Address'}>
                   <IconButton
                     size="small"
                     onClick={() => copyToClipboard('0x661b30Bf65e46B3Ae775e6Ac7Cdb5Fa7dab54df9', 'deployer-address')}
                   >
                     <CopyIcon fontSize="small" />
                   </IconButton>
                 </Tooltip>
               </Paper>
             </Box>

            {/* Factory Addresses */}
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" color="success.main" gutterBottom>
                Primary Factory Contract (Most Networks)
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Main factory contract deployed on Ethereum, Polygon, Arbitrum, Optimism, BSC, Avalanche, Base, Scroll, Gnosis, Celo, Zora:
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'grey.200', display: 'flex', alignItems: 'center', gap: 1, border: '1px solid', borderColor: 'grey.300' }}>
                <Typography component="code" variant="body2" fontFamily="monospace" sx={{ flex: 1, color: 'grey.800' }}>
                  0x2F9258A0024d389eE69BF9F4E44aB9120a359DC7
                </Typography>
                <Tooltip title={copiedCode === 'primary-factory-address' ? 'Copied!' : 'Copy Address'}>
                  <IconButton
                    size="small"
                    onClick={() => copyToClipboard('0x2F9258A0024d389eE69BF9F4E44aB9120a359DC7', 'primary-factory-address')}
                  >
                    <CopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Paper>
            </Box>

            {/* Special Factory Addresses */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="warning.main" gutterBottom>
                Special Network Factory Addresses:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body2" sx={{ minWidth: 120 }}>Polygon:</Typography>
                  <Typography component="code" variant="caption" fontFamily="monospace" sx={{ 
                    bgcolor: 'grey.200', 
                    color: 'grey.800', 
                    p: 0.5, 
                    borderRadius: 0.5,
                    border: '1px solid',
                    borderColor: 'grey.300' 
                  }}>
                    0x9ba797d0968bf4b48b639988c7ffedf28d3fee5a
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body2" sx={{ minWidth: 120 }}>Linea:</Typography>
                  <Typography component="code" variant="caption" fontFamily="monospace" sx={{ 
                    bgcolor: 'grey.200', 
                    color: 'grey.800', 
                    p: 0.5, 
                    borderRadius: 0.5,
                    border: '1px solid',
                    borderColor: 'grey.300' 
                  }}>
                    0x836ef37aa08F6089B4efEAdc55A864f6caff4a16
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body2" sx={{ minWidth: 120 }}>HyperEVM:</Typography>
                  <Typography component="code" variant="caption" fontFamily="monospace" sx={{ 
                    bgcolor: 'grey.200', 
                    color: 'grey.800', 
                    p: 0.5, 
                    borderRadius: 0.5,
                    border: '1px solid',
                    borderColor: 'grey.300' 
                  }}>
                    0x2F9258A0024d389eE69BF9F4E44aB9120a359DC7
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>{t('documentation.api.authentication')}</Typography>
            <Typography paragraph>
              {t('documentation.api.authDesc')}
            </Typography>
            <Paper sx={{ p: 2, bgcolor: 'grey.900', color: 'common.white' }}>
              <Typography component="pre" variant="body2" fontFamily="monospace">
{`Authorization: Bearer YOUR_API_KEY
Content-Type: application/json`}
              </Typography>
            </Paper>
          </Paper>
          <Typography variant="h6" gutterBottom>{t('documentation.api.endpoints')}</Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('documentation.api.method')}</TableCell>
                  <TableCell>{t('documentation.api.endpoint')}</TableCell>
                  <TableCell>{t('documentation.api.description')}</TableCell>
                  <TableCell>{t('documentation.api.authRequired')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {apiEndpoints.map((endpoint, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Chip
                        label={endpoint.method}
                        size="small"
                        color={endpoint.method === 'GET' ? 'primary' : 'secondary'}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography component="code" variant="body2" fontFamily="monospace">
                        {endpoint.endpoint}
                      </Typography>
                    </TableCell>
                    <TableCell>{endpoint.description}</TableCell>
                    <TableCell>
                      <CheckCircleIcon color="success" fontSize="small" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>{t('documentation.api.exampleRequest')}</Typography>
          <Paper sx={{ p: 2, bgcolor: 'grey.900', color: 'common.white' }}>
            <Typography component="pre" variant="body2" fontFamily="monospace">
{`POST /api/compile
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
{
  "template": "token",
  "params": {
    "name": "MyToken",
    "symbol": "MTK",
    "totalSupply": 1000000,
    "decimals": 18
  },
  "premiumFeatures": ["pausable", "burnable"]
}`}
            </Typography>
          </Paper>
        </CustomTabPanel>
        {}
        <CustomTabPanel value={tabValue} index={4}>
          <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>{t('documentation.networks.title')}</Typography>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              {t('documentation.networks.description')}
            </Typography>
          </Alert>
          {/* Mainnet Networks */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              🌐 Mainnet Networks
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('documentation.networks.network')}</TableCell>
                    <TableCell>{t('documentation.networks.chainId')}</TableCell>
                    <TableCell>Factory Type</TableCell>
                    <TableCell>{t('documentation.networks.gasToken')}</TableCell>
                    <TableCell>Factory Address</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {networkInfo.filter(network => network.tier === 'mainnet').map((network) => (
                    <TableRow key={network.chainId}>
                      <TableCell component="th" scope="row">
                        <Typography fontWeight="medium">{network.name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography component="code" variant="body2" fontFamily="monospace">
                          {network.chainId}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={network.factoryType}
                          size="small"
                          color={network.factoryType === 'Primary' ? 'success' : 'warning'}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip label={network.gasToken} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography 
                            component="code" 
                            variant="caption" 
                            fontFamily="monospace"
                            sx={{ 
                              bgcolor: network.factoryType === 'Primary' ? 'success.100' : 'grey.200',
                              color: network.factoryType === 'Primary' ? 'success.dark' : 'grey.800',
                              p: 0.5, 
                              borderRadius: 0.5,
                              border: '1px solid',
                              borderColor: network.factoryType === 'Primary' ? 'success.300' : 'grey.300'
                            }}
                          >
                            {network.factoryAddress || '0x2F9258A0024d389eE69BF9F4E44aB9120a359DC7'}
                          </Typography>
                          <Tooltip title={copiedCode === `network-${network.chainId}` ? 'Copied!' : 'Copy Address'}>
                            <IconButton
                              size="small"
                              onClick={() => copyToClipboard(network.factoryAddress || '0x2F9258A0024d389eE69BF9F4E44aB9120a359DC7', `network-${network.chainId}`)}
                            >
                              <CopyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Testnet Networks */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              🧪 Testnet Networks
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('documentation.networks.network')}</TableCell>
                    <TableCell>{t('documentation.networks.chainId')}</TableCell>
                    <TableCell>Factory Type</TableCell>
                    <TableCell>{t('documentation.networks.gasToken')}</TableCell>
                    <TableCell>Factory Address</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {networkInfo.filter(network => network.tier === 'testnet').map((network) => (
                    <TableRow key={network.chainId}>
                      <TableCell component="th" scope="row">
                        <Typography fontWeight="medium">{network.name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography component="code" variant="body2" fontFamily="monospace">
                          {network.chainId}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={network.factoryType}
                          size="small"
                          color="info"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip label={network.gasToken} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography 
                            component="code" 
                            variant="caption" 
                            fontFamily="monospace"
                            sx={{ 
                              bgcolor: 'info.100',
                              color: 'info.dark',
                              p: 0.5, 
                              borderRadius: 0.5,
                              border: '1px solid',
                              borderColor: 'info.300'
                            }}
                          >
                            0x2F9258A0024d389eE69BF9F4E44aB9120a359DC7
                          </Typography>
                          <Tooltip title={copiedCode === `testnet-${network.chainId}` ? 'Copied!' : 'Copy Address'}>
                            <IconButton
                              size="small"
                              onClick={() => copyToClipboard('0x2F9258A0024d389eE69BF9F4E44aB9120a359DC7', `testnet-${network.chainId}`)}
                            >
                              <CopyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
          <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>{t('documentation.networks.gasEstimation')}</Typography>
          <Paper sx={{ p: 3 }}>
            <Typography paragraph>
              {t('documentation.networks.gasEstDesc')}
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                <ListItemText primary={t('documentation.networks.deploymentCost')} />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                <ListItemText primary={t('documentation.networks.premiumOverhead')} />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                <ListItemText primary={t('documentation.networks.platformFeeDesc')} />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                <ListItemText primary={t('documentation.networks.currentGasPrice')} />
              </ListItem>
            </List>
          </Paper>
        </CustomTabPanel>
        {}
        <CustomTabPanel value={tabValue} index={5}>
          <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>{t('documentation.deployment.title')}</Typography>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
            <Box sx={{ flex: { xs: '1', md: '2' } }}>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>{t('documentation.deployment.process')}</Typography>
                <List>
                  <ListItem>
                    <ListItemIcon><Typography variant="h6" color="primary">1</Typography></ListItemIcon>
                    <ListItemText
                      primary={t('documentation.deployment.step1')}
                      secondary={t('documentation.deployment.step1Desc')}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Typography variant="h6" color="primary">2</Typography></ListItemIcon>
                    <ListItemText
                      primary={t('documentation.deployment.step2')}
                      secondary={t('documentation.deployment.step2Desc')}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Typography variant="h6" color="primary">3</Typography></ListItemIcon>
                    <ListItemText
                      primary={t('documentation.deployment.step3')}
                      secondary={t('documentation.deployment.step3Desc')}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Typography variant="h6" color="primary">4</Typography></ListItemIcon>
                    <ListItemText
                      primary={t('documentation.deployment.step4')}
                      secondary={t('documentation.deployment.step4Desc')}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Typography variant="h6" color="primary">5</Typography></ListItemIcon>
                    <ListItemText
                      primary={t('documentation.deployment.step5')}
                      secondary={t('documentation.deployment.step5Desc')}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Typography variant="h6" color="primary">6</Typography></ListItemIcon>
                    <ListItemText
                      primary={t('documentation.deployment.step6')}
                      secondary={t('documentation.deployment.step6Desc')}
                    />
                  </ListItem>
                </List>
              </Paper>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>{t('documentation.deployment.gasOptimization')}</Typography>
                <List>
                  <ListItem>
                    <ListItemIcon><SpeedIcon color="primary" /></ListItemIcon>
                    <ListItemText
                      primary={t('documentation.deployment.deployLowUsage')}
                      secondary={t('documentation.deployment.deployLowUsageDesc')}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><TokenIcon color="primary" /></ListItemIcon>
                    <ListItemText
                      primary={t('documentation.deployment.considerL2')}
                      secondary={t('documentation.deployment.considerL2Desc')}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><SecurityIcon color="primary" /></ListItemIcon>
                    <ListItemText
                      primary={t('documentation.deployment.selectNeeded')}
                      secondary={t('documentation.deployment.selectNeededDesc')}
                    />
                  </ListItem>
                </List>
              </Paper>
            </Box>
            <Box sx={{ flex: { xs: '1', md: '1' } }}>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">🏭 Factory Contracts</Typography>
                  
                  {/* Primary Factory */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" fontWeight="bold" color="success.main" gutterBottom>
                      Primary Factory (Most Networks)
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Used on Ethereum, Arbitrum, Optimism, BSC, Avalanche, Base, Scroll, Gnosis, Celo, Zora:
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography
                        component="code"
                        variant="body2"
                        fontFamily="monospace"
                        sx={{
                          bgcolor: 'success.100',
                          p: 1,
                          borderRadius: 1,
                          fontSize: '0.75rem',
                          wordBreak: 'break-all',
                          flex: 1,
                          color: 'success.dark',
                          border: '1px solid',
                          borderColor: 'success.300'
                        }}
                      >
                        0x2F9258A0024d389eE69BF9F4E44aB9120a359DC7
                      </Typography>
                      <Tooltip title={copiedCode === 'primary-factory-deploy-address' ? 'Copied!' : 'Copy Address'}>
                        <IconButton
                          size="small"
                          onClick={() => copyToClipboard('0x2F9258A0024d389eE69BF9F4E44aB9120a359DC7', 'primary-factory-deploy-address')}
                        >
                          <CopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  {/* Special Factories */}
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold" color="warning.main" gutterBottom>
                      Special Network Factories
                    </Typography>
                                         <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                       <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                         <Typography variant="caption" color="text.primary" sx={{ minWidth: 60, fontWeight: 'medium' }}>Polygon:</Typography>
                         <Typography component="code" variant="caption" fontFamily="monospace" sx={{ 
                           bgcolor: 'grey.200', 
                           p: 0.5, 
                           borderRadius: 0.5,
                           color: 'grey.800',
                           border: '1px solid',
                           borderColor: 'grey.300',
                           fontSize: '0.75rem'
                         }}>
                           0x9ba797d0968bf4b48b639988c7ffedf28d3fee5a
                         </Typography>
                       </Box>
                       <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                         <Typography variant="caption" color="text.primary" sx={{ minWidth: 60, fontWeight: 'medium' }}>Linea:</Typography>
                         <Typography component="code" variant="caption" fontFamily="monospace" sx={{ 
                           bgcolor: 'grey.200', 
                           p: 0.5, 
                           borderRadius: 0.5,
                           color: 'grey.800',
                           border: '1px solid',
                           borderColor: 'grey.300',
                           fontSize: '0.75rem'
                         }}>
                           0x836ef37aa08F6089B4efEAdc55A864f6caff4a16
                         </Typography>
                       </Box>
                       <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                         <Typography variant="caption" color="text.primary" sx={{ minWidth: 60, fontWeight: 'medium' }}>HyperEVM:</Typography>
                         <Typography component="code" variant="caption" fontFamily="monospace" sx={{ 
                           bgcolor: 'grey.200', 
                           p: 0.5, 
                           borderRadius: 0.5,
                           color: 'grey.800',
                           border: '1px solid',
                           borderColor: 'grey.300',
                           fontSize: '0.75rem'
                         }}>
                           0x2F9258A0024d389eE69BF9F4E44aB9120a359DC7
                         </Typography>
                       </Box>
                     </Box>
                  </Box>
                </CardContent>
              </Card>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">{t('documentation.deployment.costBreakdown')}</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary={t('documentation.deployment.baseDeployment')}
                        secondary={t('documentation.deployment.networkGasFees')}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary={t('premiumFeatures.title')}
                        secondary={t('documentation.deployment.premiumFeaturesPrice')}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary={t('platformFee')}
                        secondary={t('documentation.deployment.platformFeePercent')}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  {t('documentation.deployment.testnetWarning')}
                </Typography>
              </Alert>
              <Alert severity="success">
                <Typography variant="body2">
                  {t('documentation.deployment.autoVerification')}
                </Typography>
              </Alert>
            </Box>
          </Box>
        </CustomTabPanel>
        {}
        <CustomTabPanel value={tabValue} index={6}>
          <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>{t('documentation.security.title')}</Typography>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
            <Box sx={{ flex: 1 }}>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SecurityIcon color="primary" />
                  {t('documentation.security.smartContractSecurity')}
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                    <ListItemText
                      primary={t('documentation.security.openzeppelinBase')}
                      secondary={t('documentation.security.openzeppelinBaseDesc')}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                    <ListItemText
                      primary={t('documentation.security.latestSolidity')}
                      secondary={t('documentation.security.latestSolidityDesc')}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                    <ListItemText
                      primary={t('documentation.security.autoVerification')}
                      secondary={t('documentation.security.autoVerificationDesc')}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                    <ListItemText
                      primary={t('documentation.security.standardCompliance')}
                      secondary={t('documentation.security.standardComplianceDesc')}
                    />
                  </ListItem>
                </List>
              </Paper>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WarningIcon color="warning" />
                  {t('documentation.security.importantWarnings')}
                </Typography>
                <Alert severity="error" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    {t('documentation.security.immutableWarning')}
                  </Typography>
                </Alert>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    {t('documentation.security.testnetFirst')}
                  </Typography>
                </Alert>
                <Alert severity="info">
                  <Typography variant="body2">
                    {t('documentation.security.privateKeySecurity')}
                  </Typography>
                </Alert>
              </Paper>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>{t('documentation.security.platformSecurity')}</Typography>
                <List>
                  <ListItem>
                    <ListItemIcon><LockIcon color="primary" /></ListItemIcon>
                    <ListItemText
                      primary={t('documentation.security.clientSideComp')}
                      secondary={t('documentation.security.clientSideCompDesc')}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><SecurityIcon color="primary" /></ListItemIcon>
                    <ListItemText
                      primary={t('documentation.security.noPrivateKeyStorage')}
                      secondary={t('documentation.security.noPrivateKeyStorageDesc')}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><PublicIcon color="primary" /></ListItemIcon>
                    <ListItemText
                      primary={t('documentation.security.openSource')}
                      secondary={t('documentation.security.openSourceDesc')}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><SpeedIcon color="primary" /></ListItemIcon>
                    <ListItemText
                      primary={t('documentation.security.noBackendDeps')}
                      secondary={t('documentation.security.noBackendDepsDesc')}
                    />
                  </ListItem>
                </List>
              </Paper>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>{t('documentation.security.bestPractices')}</Typography>
                <List dense>
                  <ListItem>
                    <ListItemText primary={t('documentation.security.reviewCode')} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary={t('documentation.security.testFirst')} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary={t('documentation.security.useMultisig')} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary={t('documentation.security.separateKeys')} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary={t('documentation.security.documentParams')} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary={t('documentation.security.considerUpgrade')} />
                  </ListItem>
                </List>
              </Paper>
            </Box>
          </Box>
        </CustomTabPanel>
      </Box>
    </Container>
  )
}
export default Documentation