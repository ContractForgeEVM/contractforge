import React from 'react'
import { 
  Skeleton, 
  Card, 
  CardContent, 
  Box, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  Stack,
  Divider
} from '@mui/material'
import { keyframes } from '@mui/system'

const shimmer = keyframes`
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
`

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
`

const skeletonBaseStyle = {
  background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
  backgroundSize: '200px 100%',
  animation: `${shimmer} 2s ease-in-out infinite`,
  borderRadius: 1,
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    transform: 'translateX(-100%)',
    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent)',
    animation: `${shimmer} 2s ease-in-out infinite`,
  }
}

export const StatCardSkeleton: React.FC = () => (
  <Card 
    elevation={2}
    sx={{ 
      position: 'relative',
      overflow: 'hidden',
      height: '120px',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
        opacity: 0.6,
        animation: `${pulse} 2s ease-in-out infinite`
      }
    }}
  >
    <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Skeleton 
          variant="circular" 
          width={32} 
          height={32}
          animation="wave"
          sx={{ 
            ...skeletonBaseStyle,
            flexShrink: 0
          }}
        />
        <Skeleton 
          variant="text" 
          width="60%"
          height={16}
          animation="wave"
          sx={{ 
            ...skeletonBaseStyle,
            animationDelay: '0.1s'
          }}
        />
      </Box>
      
      <Box>
        <Skeleton 
          variant="text" 
          width="40%"
          height={32}
          animation="wave"
          sx={{ 
            ...skeletonBaseStyle,
            mb: 1,
            animationDelay: '0.2s'
          }}
        />
        <Skeleton 
          variant="text" 
          width="80%"
          height={14}
          animation="wave"
          sx={{ 
            ...skeletonBaseStyle,
            animationDelay: '0.3s'
          }}
        />
      </Box>
    </CardContent>
  </Card>
)

export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 5 }) => (
  <TableRow sx={{ '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' } }}>
    {Array.from({ length: columns }).map((_, index) => (
      <TableCell key={index} sx={{ py: 2 }}>
        <Skeleton 
          variant="text" 
          width={`${Math.random() * 40 + 60}%`}
          height={20}
          animation="wave"
          sx={{ 
            ...skeletonBaseStyle,
            animationDelay: `${index * 0.1}s`
          }}
        />
      </TableCell>
    ))}
  </TableRow>
)

export const TableSkeleton: React.FC<{ rows?: number, columns?: number }> = ({ 
  rows = 5, 
  columns = 5 
}) => (
  <TableContainer component={Paper} elevation={1}>
    <Table>
      <TableHead sx={{ backgroundColor: 'rgba(0, 0, 0, 0.04)' }}>
        <TableRow>
          {Array.from({ length: columns }).map((_, index) => (
            <TableCell key={index} sx={{ py: 2, fontWeight: 600 }}>
              <Skeleton 
                variant="text" 
                width={`${Math.random() * 30 + 50}%`}
                height={18}
                animation="wave"
                sx={{ 
                  ...skeletonBaseStyle,
                  animationDelay: `${index * 0.05}s`
                }}
              />
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {Array.from({ length: rows }).map((_, index) => (
          <TableRowSkeleton key={index} columns={columns} />
        ))}
      </TableBody>
    </Table>
  </TableContainer>
)

export const ContractCardSkeleton: React.FC = () => (
  <Card 
    elevation={3}
    sx={{ 
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: (theme) => theme.shadows[8]
      }
    }}
  >
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 3 }}>
        <Box sx={{ flex: 1 }}>
          <Skeleton 
            variant="text" 
            width="75%"
            height={28}
            animation="wave"
            sx={{ 
              ...skeletonBaseStyle,
              mb: 1,
              fontSize: '1.2rem'
            }}
          />
          <Skeleton 
            variant="text" 
            width="45%"
            height={16}
            animation="wave"
            sx={{ 
              ...skeletonBaseStyle,
              animationDelay: '0.1s'
            }}
          />
        </Box>
        <Skeleton 
          variant="circular" 
          width={16} 
          height={16}
          animation="pulse"
          sx={{ 
            backgroundColor: '#4ade80',
            flexShrink: 0
          }}
        />
      </Box>
      
      <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
        <Skeleton 
          variant="rounded" 
          width={70} 
          height={28}
          animation="wave"
          sx={{ 
            ...skeletonBaseStyle,
            borderRadius: 2
          }}
        />
        <Skeleton 
          variant="rounded" 
          width={90} 
          height={28}
          animation="wave"
          sx={{ 
            ...skeletonBaseStyle,
            borderRadius: 2,
            animationDelay: '0.1s'
          }}
        />
      </Stack>
      
      <Divider sx={{ my: 2, opacity: 0.1 }} />
      
      <Stack direction="row" spacing={3} sx={{ mb: 3 }}>
        <Box sx={{ flex: 1 }}>
          <Skeleton 
            variant="text" 
            width="100%"
            height={18}
            animation="wave"
            sx={{ 
              ...skeletonBaseStyle,
              mb: 1,
              animationDelay: '0.2s'
            }}
          />
          <Skeleton 
            variant="text" 
            width="70%"
            height={18}
            animation="wave"
            sx={{ 
              ...skeletonBaseStyle,
              animationDelay: '0.3s'
            }}
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Skeleton 
            variant="text" 
            width="90%"
            height={18}
            animation="wave"
            sx={{ 
              ...skeletonBaseStyle,
              mb: 1,
              animationDelay: '0.4s'
            }}
          />
          <Skeleton 
            variant="text" 
            width="60%"
            height={18}
            animation="wave"
            sx={{ 
              ...skeletonBaseStyle,
              animationDelay: '0.5s'
            }}
          />
        </Box>
      </Stack>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
        <Skeleton 
          variant="circular" 
          width={40} 
          height={40}
          animation="wave"
          sx={{ 
            ...skeletonBaseStyle,
            animationDelay: '0.6s'
          }}
        />
        <Skeleton 
          variant="circular" 
          width={40} 
          height={40}
          animation="wave"
          sx={{ 
            ...skeletonBaseStyle,
            animationDelay: '0.7s'
          }}
        />
      </Box>
    </CardContent>
  </Card>
)

export const DashboardSkeleton: React.FC = () => (
  <Box sx={{ p: { xs: 2, md: 3 } }}>
    <Box sx={{ mb: 4 }}>
      <Skeleton 
        variant="text" 
        width="350px"
        height={48}
        animation="wave"
        sx={{ 
          ...skeletonBaseStyle,
          mb: 2,
          fontSize: '2rem'
        }}
      />
      <Skeleton 
        variant="text" 
        width="600px"
        height={20}
        animation="wave"
        sx={{ 
          ...skeletonBaseStyle,
          animationDelay: '0.1s'
        }}
      />
    </Box>
    
    <Paper elevation={1} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
      <Stack 
        direction={{ xs: 'column', md: 'row' }} 
        spacing={2}
        alignItems={{ xs: 'stretch', md: 'center' }}
      >
        <Box sx={{ minWidth: { xs: 'auto', md: '200px' } }}>
          <Skeleton 
            variant="rectangular" 
            height={56}
            animation="wave"
            sx={{ 
              ...skeletonBaseStyle,
              borderRadius: 1
            }}
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Skeleton 
            variant="rectangular" 
            height={56}
            animation="wave"
            sx={{ 
              ...skeletonBaseStyle,
              borderRadius: 1,
              animationDelay: '0.1s'
            }}
          />
        </Box>
        <Box sx={{ minWidth: { xs: 'auto', md: '140px' } }}>
          <Skeleton 
            variant="rectangular" 
            height={56}
            animation="wave"
            sx={{ 
              ...skeletonBaseStyle,
              borderRadius: 1,
              animationDelay: '0.2s'
            }}
          />
        </Box>
      </Stack>
    </Paper>
    
    <Box sx={{ 
      display: 'grid',
      gridTemplateColumns: { 
        xs: '1fr',
        sm: 'repeat(2, 1fr)',
        md: 'repeat(4, 1fr)'
      },
      gap: 3,
      mb: 4
    }}>
      {Array.from({ length: 4 }).map((_, index) => (
        <Box key={index}>
          <StatCardSkeleton />
        </Box>
      ))}
    </Box>
    
    <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ p: 3, pb: 0 }}>
        <Skeleton 
          variant="text" 
          width="250px"
          height={28}
          animation="wave"
          sx={{ 
            ...skeletonBaseStyle,
            mb: 3,
            fontSize: '1.25rem'
          }}
        />
      </Box>
      <TableSkeleton rows={8} columns={8} />
    </Paper>
  </Box>
)

export const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 300 }) => (
  <Card elevation={2} sx={{ position: 'relative', overflow: 'hidden' }}>
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Skeleton 
          variant="text" 
          width="40%"
          height={24}
          animation="wave"
          sx={{ ...skeletonBaseStyle }}
        />
        <Skeleton 
          variant="rectangular" 
          width={120}
          height={32}
          animation="wave"
          sx={{ 
            ...skeletonBaseStyle,
            borderRadius: 1,
            animationDelay: '0.1s'
          }}
        />
      </Box>
      
      <Box sx={{ position: 'relative', height: height }}>
        <Skeleton 
          variant="rectangular" 
          width="100%"
          height="100%"
          animation="wave"
          sx={{ 
            ...skeletonBaseStyle,
            borderRadius: 2,
            animationDelay: '0.2s'
          }}
        />
        
        <Box sx={{ 
          position: 'absolute',
          bottom: 20,
          left: 20,
          right: 20,
          display: 'flex',
          alignItems: 'end',
          gap: 1,
          opacity: 0.3
        }}>
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton
              key={index}
              variant="rectangular"
              width="100%"
              height={`${Math.random() * 80 + 20}%`}
              animation="wave"
              sx={{
                ...skeletonBaseStyle,
                borderRadius: '4px 4px 0 0',
                animationDelay: `${index * 0.05}s`
              }}
            />
          ))}
        </Box>
      </Box>
    </CardContent>
  </Card>
)

export const FormSkeleton: React.FC<{ fields?: number }> = ({ fields = 4 }) => (
  <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
    <Skeleton 
      variant="text" 
      width="60%"
      height={32}
      animation="wave"
      sx={{ 
        ...skeletonBaseStyle,
        mb: 4,
        fontSize: '1.5rem'
      }}
    />
    
    <Stack spacing={4}>
      {Array.from({ length: fields }).map((_, index) => (
        <Box key={index}>
          <Skeleton 
            variant="text" 
            width="140px"
            height={18}
            animation="wave"
            sx={{ 
              ...skeletonBaseStyle,
              mb: 1,
              animationDelay: `${index * 0.1}s`
            }}
          />
          <Skeleton 
            variant="rectangular" 
            height={56}
            animation="wave"
            sx={{ 
              ...skeletonBaseStyle,
              borderRadius: 1,
              animationDelay: `${index * 0.1 + 0.05}s`
            }}
          />
        </Box>
      ))}
      
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', pt: 2 }}>
        <Skeleton 
          variant="rectangular" 
          width={100}
          height={42}
          animation="wave"
          sx={{ 
            ...skeletonBaseStyle,
            borderRadius: 1,
            animationDelay: '0.6s'
          }}
        />
        <Skeleton 
          variant="rectangular" 
          width={140}
          height={42}
          animation="wave"
          sx={{ 
            ...skeletonBaseStyle,
            borderRadius: 1,
            animationDelay: '0.7s'
          }}
        />
      </Box>
    </Stack>
  </Paper>
)

export const ModalSkeleton: React.FC = () => (
  <Box sx={{ p: 4, minHeight: '400px' }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
      <Skeleton 
        variant="text" 
        width="70%"
        height={36}
        animation="wave"
        sx={{ 
          ...skeletonBaseStyle,
          fontSize: '1.5rem'
        }}
      />
      <Skeleton 
        variant="circular" 
        width={32}
        height={32}
        animation="wave"
        sx={{ 
          ...skeletonBaseStyle,
          animationDelay: '0.1s'
        }}
      />
    </Box>
    
    <Box sx={{ 
      display: 'grid',
      gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
      gap: 3,
      mb: 4
    }}>
      {Array.from({ length: 4 }).map((_, index) => (
        <Box key={index}>
          <StatCardSkeleton />
        </Box>
      ))}
    </Box>
    
    <Divider sx={{ my: 3 }} />
    
    <Box>
      <Skeleton 
        variant="text" 
        width="50%"
        height={24}
        animation="wave"
        sx={{ 
          ...skeletonBaseStyle,
          mb: 3
        }}
      />
      
      <Stack spacing={2}>
        {Array.from({ length: 5 }).map((_, index) => (
          <Box key={index} sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 2,
            borderRadius: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.02)'
          }}>
            <Skeleton 
              variant="text" 
              width="35%"
              height={18}
              animation="wave"
              sx={{ 
                ...skeletonBaseStyle,
                animationDelay: `${index * 0.05}s`
              }}
            />
            <Skeleton 
              variant="text" 
              width="25%"
              height={18}
              animation="wave"
              sx={{ 
                ...skeletonBaseStyle,
                animationDelay: `${index * 0.05 + 0.1}s`
              }}
            />
          </Box>
        ))}
      </Stack>
    </Box>
  </Box>
)

export const NotificationSkeleton: React.FC<{ variant?: 'info' | 'warning' | 'error' | 'success' }> = ({ 
  variant = 'info' 
}) => {
  const borderColor = {
    info: '#3b82f6',
    warning: '#f59e0b',
    error: '#ef4444',
    success: '#10b981'
  }

  return (
    <Paper 
      elevation={1}
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2, 
        p: 3,
        borderLeft: `4px solid ${borderColor[variant]}`,
        borderRadius: 1,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <Skeleton 
        variant="circular" 
        width={28}
        height={28}
        animation="pulse"
        sx={{ 
          backgroundColor: borderColor[variant],
          opacity: 0.6,
          flexShrink: 0
        }}
      />
      
      <Box sx={{ flex: 1 }}>
        <Skeleton 
          variant="text" 
          width="85%"
          height={20}
          animation="wave"
          sx={{ 
            ...skeletonBaseStyle,
            mb: 1
          }}
        />
        <Skeleton 
          variant="text" 
          width="65%"
          height={16}
          animation="wave"
          sx={{ 
            ...skeletonBaseStyle,
            animationDelay: '0.1s'
          }}
        />
      </Box>
      
      <Skeleton 
        variant="circular" 
        width={24}
        height={24}
        animation="wave"
        sx={{ 
          ...skeletonBaseStyle,
          flexShrink: 0,
          animationDelay: '0.2s'
        }}
      />
    </Paper>
  )
}

export const PageSkeleton: React.FC = () => (
  <Box sx={{ minHeight: '100vh', backgroundColor: '#fafafa' }}>
    <Paper elevation={1} sx={{ p: 3, mb: 0, borderRadius: 0 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Skeleton 
          variant="text" 
          width={200}
          height={32}
          animation="wave"
          sx={{ ...skeletonBaseStyle }}
        />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Skeleton 
            variant="circular" 
            width={40}
            height={40}
            animation="wave"
            sx={{ 
              ...skeletonBaseStyle,
              animationDelay: '0.1s'
            }}
          />
          <Skeleton 
            variant="rectangular" 
            width={100}
            height={40}
            animation="wave"
            sx={{ 
              ...skeletonBaseStyle,
              borderRadius: 1,
              animationDelay: '0.2s'
            }}
          />
        </Box>
      </Box>
    </Paper>
    
    <DashboardSkeleton />
  </Box>
)

export default {
  StatCardSkeleton,
  TableRowSkeleton,
  TableSkeleton,
  ContractCardSkeleton,
  DashboardSkeleton,
  ChartSkeleton,
  FormSkeleton,
  ModalSkeleton,
  NotificationSkeleton,
  PageSkeleton
} 