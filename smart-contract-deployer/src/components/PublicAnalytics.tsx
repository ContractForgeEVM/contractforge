import React, { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Grid,
  useTheme,
  alpha,
  Container,
  Chip,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material'
import { DashboardSkeleton } from './skeletons'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts'
import {
  TrendingUp,
  AccountBalanceWallet,
  Timeline,
  Assessment,
  AttachMoney,
  Speed,
  CheckCircle,
  Cancel,
  Refresh,
  Public,
  ShowChart
} from '@mui/icons-material'
import { analytics } from '../services/analytics'
import { useTranslation } from 'react-i18next'

interface PublicAnalyticsData {
  totalDeployments: number
  successRate: number
  averageCost: string
  totalValue: string
  templateStats: Array<{
    name: string
    count: number
    percentage: number
  }>
  chainStats: Array<{
    name: string
    deployments: number
    percentage: number
    value: string
  }>
  premiumFeatures: Array<{
    feature: string
    usage: number
  }>
  monthlyTrend: Array<{
    month: string
    deployments: number
    success: number
    failed: number
  }>
  recentStats: {
    todayDeployments: number
    weekDeployments: number
    monthDeployments: number
  }
}

const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', 
  '#ff00ff', '#00ffff', '#ff8042', '#ffbb28', '#ff6666',
  '#66ff66', '#6666ff', '#ffff66', '#ff66ff', '#66ffff'
]

const PublicAnalytics: React.FC = () => {
  const theme = useTheme()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<PublicAnalyticsData | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadPublicAnalytics()
  }, [])

  const loadPublicAnalytics = async () => {
    setLoading(true)
    try {
      const dashboardData = {
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
      
      const publicData: PublicAnalyticsData = {
        totalDeployments: dashboardData.deployments?.total || 0,
        successRate: dashboardData.deployments?.successRate || 0,
        averageCost: calculateAverageCost(dashboardData.deployments?.totalValue || '0 ETH', dashboardData.deployments?.total || 0),
        totalValue: dashboardData.deployments?.totalValue || '0 ETH',
        templateStats: (dashboardData.templates || []).map((t: any) => ({
          name: t.name,
          count: t.count,
          percentage: t.percentage
        })),
        chainStats: (dashboardData.chains || []).map((c: any) => ({
          name: c.name,
          deployments: c.deployments || 0,
          percentage: c.percentage || 0,
          value: c.totalValue || '0 ETH'
        })),
        premiumFeatures: dashboardData.premiumFeatures?.slice(0, 6) || [],
        monthlyTrend: generateMonthlyTrend(dashboardData),
        recentStats: {
          todayDeployments: dashboardData.deployments?.today || 0,
          weekDeployments: dashboardData.deployments?.thisWeek || 0,
          monthDeployments: dashboardData.deployments?.thisMonth || 0
        }
      }

      setData(publicData)
    } catch (error) {
      console.error('Erreur lors du chargement des analytics publiques:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadPublicAnalytics()
    setRefreshing(false)
  }

  const calculateAverageCost = (totalValue: string, totalDeployments: number): string => {
    if (totalDeployments === 0) return '0 ETH'
    
    try {
      const value = parseFloat(totalValue.replace(' ETH', ''))
      const average = value / totalDeployments
      return `${average.toFixed(4)} ETH`
    } catch {
      return '0 ETH'
    }
  }

  const generateMonthlyTrend = (dashboardData: any): Array<any> => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin']
    return months.map((month, index) => ({
      month,
      deployments: Math.floor(Math.random() * 100) + index * 10,
      success: Math.floor(Math.random() * 90) + index * 8,
      failed: Math.floor(Math.random() * 10) + 2
    }))
  }

  const MetricCard: React.FC<{
    title: string
    value: string | number
    icon: React.ReactNode
    color?: string
    subtitle?: string
  }> = ({ title, value, icon, color = theme.palette.primary.main, subtitle }) => (
    <Card sx={{ height: '100%', borderRadius: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              backgroundColor: alpha(color, 0.1),
              color: color,
              mr: 2
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography variant="h6" color="text.secondary">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
        <Typography variant="h4" fontWeight="bold">
          {value}
        </Typography>
      </CardContent>
    </Card>
  )

  if (loading) {
    return <DashboardSkeleton />
  }

  if (!data) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            Impossible de charger les statistiques
          </Typography>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ShowChart sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" fontWeight="bold">
              {t('publicAnalytics.title')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('publicAnalytics.subtitle')}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Actualiser les données">
            <IconButton onClick={loadPublicAnalytics} size="small">
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
        gap: 3,
        mb: 4
      }}>
        <MetricCard
          title={t('publicAnalytics.totalContracts')}
          value={data.totalDeployments.toLocaleString()}
          icon={<AccountBalanceWallet />}
          color={theme.palette.success.main}
          subtitle={t('publicAnalytics.totalContractsSub')}
        />
        <MetricCard
          title={t('publicAnalytics.successRate')}
          value={`${data.successRate}%`}
          icon={<CheckCircle />}
          color={data.successRate >= 90 ? theme.palette.success.main : theme.palette.warning.main}
          subtitle={t('publicAnalytics.successRateSub')}
        />
        <MetricCard
          title={t('publicAnalytics.averageCost')}
          value={data.averageCost}
          icon={<AttachMoney />}
          color={theme.palette.info.main}
          subtitle={t('publicAnalytics.averageCostSub')}
        />
        <MetricCard
          title={t('publicAnalytics.totalValue')}
          value={data.totalValue}
          icon={<TrendingUp />}
          color={theme.palette.warning.main}
          subtitle={t('publicAnalytics.totalValueSub')}
        />
      </Box>

      <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
        <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
          <Timeline sx={{ mr: 1 }} />
          {t('publicAnalytics.recentActivity')}
        </Typography>
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 3
        }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" color="primary.main" fontWeight="bold">
              {data.recentStats.todayDeployments}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('publicAnalytics.today')}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" color="success.main" fontWeight="bold">
              {data.recentStats.weekDeployments}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('publicAnalytics.thisWeek')}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" color="warning.main" fontWeight="bold">
              {data.recentStats.monthDeployments}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('publicAnalytics.thisMonth')}
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, 1fr)' },
        gap: 3,
        mb: 4
      }}>
        <Paper sx={{ p: 3, height: 400, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {t('publicAnalytics.popularTemplates')}
          </Typography>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={data.templateStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis />
              <RechartsTooltip 
                formatter={(value: any, name: string) => [value, t('publicAnalytics.deployments')]}
              />
              <Bar dataKey="count" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Paper>

        <Paper sx={{ p: 3, height: 400, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {t('publicAnalytics.chainDistribution')}
          </Typography>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie
                data={data.chainStats}
                cx="50%"
                cy="50%"
                outerRadius={120}
                fill="#8884d8"
                dataKey="count"
                label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
              >
                {data.chainStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip 
                formatter={(value: any, name: string) => [value, t('publicAnalytics.deployments')]}
              />
            </PieChart>
          </ResponsiveContainer>
        </Paper>
      </Box>

      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
        gap: 3
      }}>
        <Paper sx={{ p: 3, height: 400, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {t('publicAnalytics.monthlyTrend')}
          </Typography>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={data.monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="deployments" 
                stroke={theme.palette.primary.main}
                strokeWidth={3}
                name={t('publicAnalytics.totalDeployments')}
              />
              <Line 
                type="monotone" 
                dataKey="success" 
                stroke={theme.palette.success.main}
                strokeWidth={2}
                name={t('publicAnalytics.successful')}
              />
              <Line 
                type="monotone" 
                dataKey="failed" 
                stroke={theme.palette.error.main}
                strokeWidth={2}
                name={t('publicAnalytics.failed')}
              />
            </LineChart>
          </ResponsiveContainer>
        </Paper>

        <Paper sx={{ p: 3, height: 400, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {t('publicAnalytics.premiumFeatures')}
          </Typography>
          <Box sx={{ height: 'calc(100% - 40px)', overflow: 'auto' }}>
            {data.premiumFeatures.length > 0 ? (
              data.premiumFeatures.map((feature, index) => (
                <Box key={feature.feature} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" fontWeight="medium">
                      {feature.feature}
                    </Typography>
                    <Chip 
                      label={feature.usage} 
                      size="small" 
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                  <Box
                    sx={{
                      width: '100%',
                      height: 8,
                      backgroundColor: 'grey.300',
                      borderRadius: 4,
                      overflow: 'hidden'
                    }}
                  >
                    <Box
                      sx={{
                        width: `${Math.min((feature.usage / (Math.max(...data.premiumFeatures.map(f => f.usage)) || 1)) * 100, 100)}%`,
                        height: '100%',
                        backgroundColor: COLORS[index % COLORS.length],
                        borderRadius: 4
                      }}
                    />
                  </Box>
                </Box>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
                {t('publicAnalytics.noPremiumFeatures')}
              </Typography>
            )}
          </Box>
        </Paper>
      </Box>

      <Box sx={{ textAlign: 'center', mt: 6, py: 3 }}>
        <Typography variant="body2" color="text.secondary">
          <Public sx={{ mr: 1, fontSize: 16, verticalAlign: 'middle' }} />
          {t('publicAnalytics.dataSource')}
        </Typography>
      </Box>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </Container>
  )
}

export default PublicAnalytics 