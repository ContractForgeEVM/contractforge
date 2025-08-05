import React, { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  useTheme,
  alpha
} from '@mui/material'
import { DashboardSkeleton } from './skeletons'
import {
  TrendingUp,
  Visibility,
  AccountBalanceWallet,
  Timeline,
  Refresh,
  GetApp,
  Analytics as AnalyticsIcon,
  Assessment,
  AttachMoney,
  SwapHoriz,
  Language,
  DeviceHub
} from '@mui/icons-material'
interface AnalyticsData {
  pageViews: {
    total: number
    today: number
    thisWeek: number
    thisMonth: number
    trend: number
  }
  deployments: {
    total: number
    today: number
    thisWeek: number
    thisMonth: number
    successful: number
    failed: number
    totalValue: string
    trend: number
  }
  templates: {
    name: string
    count: number
    percentage: number
  }[]
  chains: {
    name: string
    deployments: number
    percentage: number
    totalValue: string
  }[]
  recentDeployments: {
    id: string
    template: string
    chain: string
    address: string
    timestamp: string
    success: boolean
    value: string
  }[]
  users: {
    unique: number
    returning: number
    newUsers: number
    conversionRate: number
  }
  premiumFeatures: {
    feature: string
    usage: number
    revenue: string
  }[]
  performance: {
    avgLoadTime: number
    bounceRate: number
    avgSessionDuration: number
  }
}
interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}
const AnalyticsDashboard: React.FC = () => {
  const theme = useTheme()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [selectedTab, setSelectedTab] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  useEffect(() => {
    loadAnalyticsData()
  }, [])
  const loadAnalyticsData = async () => {
    setLoading(true)
    try {
              const { analytics } = await import('../services/analytics')
        const realData = {
          pageViews: { total: 0, today: 0, thisWeek: 0, thisMonth: 0, trend: 0 },
          deployments: { total: 0, today: 0, thisWeek: 0, thisMonth: 0, successful: 0, failed: 0, totalValue: "0 ETH", trend: 0, successRate: 0 },
          templates: [],
          chains: [],
          recentDeployments: [],
          users: { unique: 0, returning: 0, newUsers: 0, conversionRate: 0 },
          premiumFeatures: [],
          performance: { avgLoadTime: 0, bounceRate: 0, avgSessionDuration: 0 },
          lastUpdated: new Date().toISOString()
        }
      setData(realData)
    } catch (error) {
      console.error('Failed to load analytics data:', error)
      setData({
        pageViews: { total: 0, today: 0, thisWeek: 0, thisMonth: 0, trend: 0 },
        deployments: { total: 0, today: 0, thisWeek: 0, thisMonth: 0, successful: 0, failed: 0, totalValue: "0 ETH", trend: 0 },
        templates: [],
        chains: [],
        recentDeployments: [],
        users: { unique: 0, returning: 0, newUsers: 0, conversionRate: 0 },
        premiumFeatures: [],
        performance: { avgLoadTime: 0, bounceRate: 0, avgSessionDuration: 0 }
      })
    } finally {
      setLoading(false)
    }
  }
  const handleRefresh = async () => {
    setRefreshing(true)
    await loadAnalyticsData()
    setRefreshing(false)
  }
  const handleExport = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      data: data
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `analytics-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    setExportDialogOpen(false)
  }
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue)
  }
  const MetricCard: React.FC<{
    title: string
    value: string | number
    trend?: number
    icon: React.ReactNode
    color?: string
  }> = ({ title, value, trend, icon, color = theme.palette.primary.main }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 1,
              backgroundColor: alpha(color, 0.1),
              color: color,
              mr: 2
            }}
          >
            {icon}
          </Box>
          <Typography variant="h6" color="text.secondary">
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" sx={{ mb: 1 }}>
          {value}
        </Typography>
        {trend !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TrendingUp
              color={trend >= 0 ? 'success' : 'error'}
              sx={{ fontSize: 16, mr: 0.5 }}
            />
            <Typography
              variant="body2"
              color={trend >= 0 ? 'success.main' : 'error.main'}
            >
              {trend >= 0 ? '+' : ''}{trend}%
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
              ce mois
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
  if (loading) {
    return <DashboardSkeleton />
  }
  if (!data) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          Impossible de charger les données analytics
        </Typography>
        <Button onClick={loadAnalyticsData} sx={{ mt: 2 }}>
          Réessayer
        </Button>
      </Box>
    )
  }
  return (
    <Box sx={{ width: '100%' }}>
      {}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <AnalyticsIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4">
            Tableau de Bord Analytics
          </Typography>
        </Box>
        <Box>
          <IconButton onClick={handleRefresh} disabled={refreshing}>
            <Refresh sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          </IconButton>
          <Button
            variant="outlined"
            startIcon={<GetApp />}
            onClick={() => setExportDialogOpen(true)}
            sx={{ ml: 1 }}
          >
            Exporter
          </Button>
        </Box>
      </Box>
      {}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Vue d'ensemble" />
          <Tab label="Déploiements" />
          <Tab label="Utilisateurs" />
          <Tab label="Performance" />
        </Tabs>
      </Paper>
      {}
      <TabPanel value={selectedTab} index={0}>
        {}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
              <MetricCard
                title="Visites Totales"
                value={data.pageViews.total.toLocaleString()}
                trend={data.pageViews.trend}
                icon={<Visibility />}
                color={theme.palette.primary.main}
              />
            </Box>
            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
              <MetricCard
                title="Contrats Déployés"
                value={data.deployments.total.toLocaleString()}
                trend={data.deployments.trend}
                icon={<AccountBalanceWallet />}
                color={theme.palette.success.main}
              />
            </Box>
            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
              <MetricCard
                title="Valeur Totale"
                value={data.deployments.totalValue}
                icon={<AttachMoney />}
                color={theme.palette.warning.main}
              />
            </Box>
            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
              <MetricCard
                title="Taux de Conversion"
                value={`${data.users.conversionRate}%`}
                icon={<TrendingUp />}
                color={theme.palette.info.main}
              />
            </Box>
          </Box>
          {}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(50% - 12px)' } }}>
              <Paper sx={{ p: 3, height: 400 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Templates Populaires
                </Typography>
                <List>
                  {data.templates.map((template, index) => (
                    <React.Fragment key={template.name}>
                      <ListItem>
                        <ListItemText
                          primary={template.name}
                          secondary={`${template.count} déploiements`}
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                            {template.percentage}%
                          </Typography>
                          <Box
                            sx={{
                              width: 60,
                              height: 8,
                              backgroundColor: 'grey.300',
                              borderRadius: 4,
                              overflow: 'hidden'
                            }}
                          >
                            <Box
                              sx={{
                                width: `${template.percentage}%`,
                                height: '100%',
                                backgroundColor: 'primary.main'
                              }}
                            />
                          </Box>
                        </Box>
                      </ListItem>
                      {index < data.templates.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </Paper>
            </Box>
            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(50% - 12px)' } }}>
              <Paper sx={{ p: 3, height: 400 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Répartition par Blockchain
                </Typography>
                <List>
                  {data.chains.map((chain, index) => (
                    <React.Fragment key={chain.name}>
                      <ListItem>
                        <ListItemText
                          primary={chain.name}
                          secondary={`${chain.deployments} déploiements • ${chain.totalValue}`}
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                            {chain.percentage}%
                          </Typography>
                          <Box
                            sx={{
                              width: 60,
                              height: 8,
                              backgroundColor: 'grey.300',
                              borderRadius: 4,
                              overflow: 'hidden'
                            }}
                          >
                            <Box
                              sx={{
                                width: `${chain.percentage}%`,
                                height: '100%',
                                backgroundColor: 'success.main'
                              }}
                            />
                          </Box>
                        </Box>
                      </ListItem>
                      {index < data.chains.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </Paper>
            </Box>
          </Box>
        </Box>
      </TabPanel>
      <TabPanel value={selectedTab} index={1}>
        {}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Déploiements Récents
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Template</TableCell>
                    <TableCell>Blockchain</TableCell>
                    <TableCell>Adresse</TableCell>
                    <TableCell>Valeur</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell>Timestamp</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.recentDeployments.map((deployment) => (
                    <TableRow key={deployment.id}>
                      <TableCell>{deployment.template}</TableCell>
                      <TableCell>{deployment.chain}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {deployment.address}
                        </Typography>
                      </TableCell>
                      <TableCell>{deployment.value}</TableCell>
                      <TableCell>
                        <Chip
                          label={deployment.success ? 'Succès' : 'Échec'}
                          color={deployment.success ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{deployment.timestamp}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      </TabPanel>
      <TabPanel value={selectedTab} index={2}>
        {}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
              <MetricCard
                title="Utilisateurs Uniques"
                value={data.users.unique.toLocaleString()}
                icon={<Language />}
              />
            </Box>
            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
              <MetricCard
                title="Utilisateurs Récurrents"
                value={data.users.returning.toLocaleString()}
                icon={<SwapHoriz />}
              />
            </Box>
            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
              <MetricCard
                title="Nouveaux Utilisateurs"
                value={data.users.newUsers.toLocaleString()}
                icon={<TrendingUp />}
              />
            </Box>
            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
              <MetricCard
                title="Taux de Conversion"
                value={`${data.users.conversionRate}%`}
                icon={<Assessment />}
              />
            </Box>
          </Box>
          {}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Fonctionnalités Premium
            </Typography>
            <List>
              {data.premiumFeatures.map((feature, index) => (
                <React.Fragment key={feature.feature}>
                  <ListItem>
                    <ListItemText
                      primary={feature.feature}
                      secondary={`${feature.usage} utilisations`}
                    />
                    <Typography variant="body1" fontWeight="bold">
                      {feature.revenue}
                    </Typography>
                  </ListItem>
                  {index < data.premiumFeatures.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Box>
      </TabPanel>
      <TabPanel value={selectedTab} index={3}>
        {}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(33.333% - 16px)' } }}>
            <MetricCard
              title="Temps de Chargement Moyen"
              value={`${data.performance.avgLoadTime}s`}
              icon={<Timeline />}
            />
          </Box>
          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(33.333% - 16px)' } }}>
            <MetricCard
              title="Taux de Rebond"
              value={`${data.performance.bounceRate}%`}
              icon={<DeviceHub />}
            />
          </Box>
          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(33.333% - 16px)' } }}>
            <MetricCard
              title="Durée de Session Moyenne"
              value={`${data.performance.avgSessionDuration}min`}
              icon={<Assessment />}
            />
          </Box>
        </Box>
      </TabPanel>
      {}
      <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)}>
        <DialogTitle>
          Exporter les Données Analytics
        </DialogTitle>
        <DialogContent>
          <Typography>
            Les données analytics seront exportées au format JSON avec toutes les métriques actuelles.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>
            Annuler
          </Button>
          <Button onClick={handleExport} variant="contained">
            Exporter
          </Button>
        </DialogActions>
      </Dialog>
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </Box>
  )
}
export default AnalyticsDashboard