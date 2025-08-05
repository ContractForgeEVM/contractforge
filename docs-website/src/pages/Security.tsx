import {
  Box,
  Container,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Grid,
  Chip,
} from '@mui/material'
import {
  Security as SecurityIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Lock as LockIcon,
  Public as PublicIcon,
  Speed as SpeedIcon,
  BugReport as BugIcon,
  AutoAwesome as AutoAwesomeIcon,
  Code as CodeIcon,
  Shield as ShieldIcon,
  Analytics as AnalyticsIcon,
  Timer as TimerIcon,
  Grade as GradeIcon,
} from '@mui/icons-material'

const Security = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h1" component="h1" gutterBottom sx={{
        fontWeight: 800,
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        mb: 2,
        letterSpacing: '-0.02em',
      }}>
        🔒 Security & Audit Services
      </Typography>
      
      <Typography variant="h5" sx={{ color: '#94a3b8', mb: 4 }}>
        Built-in security for our templates + Professional audit service for custom contracts
      </Typography>

      {/* Built-in Template Security Section */}
      <Paper sx={{ p: 4, mb: 4, background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <ShieldIcon sx={{ fontSize: 40, color: '#10b981' }} />
          <Box>
            <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 700 }}>
              Built-in Template Security
            </Typography>
            <Typography variant="body1" sx={{ color: '#94a3b8' }}>
              All our contract templates come with enterprise-grade security built-in
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ color: '#ffffff', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckIcon sx={{ color: '#10b981' }} />
              Security Features
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon><CheckIcon sx={{ color: '#10b981' }} /></ListItemIcon>
                <ListItemText
                  primary="OpenZeppelin Libraries"
                  secondary="All templates use battle-tested, audited security components"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckIcon sx={{ color: '#10b981' }} /></ListItemIcon>
                <ListItemText
                  primary="Latest Solidity ^0.8.20"
                  secondary="Built-in overflow protection and latest security features"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckIcon sx={{ color: '#10b981' }} /></ListItemIcon>
                <ListItemText
                  primary="Access Control Patterns"
                  secondary="Standardized onlyOwner and role-based access controls"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckIcon sx={{ color: '#10b981' }} /></ListItemIcon>
                <ListItemText
                  primary="Reentrancy Protection"
                  secondary="Built-in guards against reentrancy attacks"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckIcon sx={{ color: '#10b981' }} /></ListItemIcon>
                <ListItemText
                  primary="EIP Standards Compliance"
                  secondary="ERC-20, ERC-721, EIP-2612, and other standards"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
            </List>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ color: '#ffffff', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <SecurityIcon sx={{ color: '#6366f1' }} />
              Template Benefits
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon><CheckIcon sx={{ color: '#10b981' }} /></ListItemIcon>
                <ListItemText
                  primary="Pre-Audited Code"
                  secondary="All templates have been security-reviewed"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckIcon sx={{ color: '#10b981' }} /></ListItemIcon>
                <ListItemText
                  primary="Production Ready"
                  secondary="Deploy directly to mainnet with confidence"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckIcon sx={{ color: '#10b981' }} /></ListItemIcon>
                <ListItemText
                  primary="Auto-Verification"
                  secondary="Contracts automatically verified on block explorers"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckIcon sx={{ color: '#10b981' }} /></ListItemIcon>
                <ListItemText
                  primary="No Additional Cost"
                  secondary="Security features included at no extra charge"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
            </List>
          </Grid>
        </Grid>
      </Paper>

      {/* Professional Audit Service Section */}
      <Paper sx={{ p: 4, mb: 4, background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <AutoAwesomeIcon sx={{ fontSize: 40, color: '#6366f1' }} />
          <Box>
            <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 700 }}>
              Professional Audit Service
            </Typography>
            <Typography variant="body1" sx={{ color: '#94a3b8' }}>
              Additional security analysis service for custom contracts and advanced users
            </Typography>
          </Box>
        </Box>

                 <Grid container spacing={3}>
           <Grid item xs={12} md={6}>
             <Typography variant="h6" sx={{ color: '#ffffff', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
               <ShieldIcon sx={{ color: '#6366f1' }} />
               Audit Service Standards
             </Typography>
            <List>
              <ListItem>
                <ListItemIcon><CheckIcon sx={{ color: '#10b981' }} /></ListItemIcon>
                <ListItemText
                  primary="Minimum Score: 70/100"
                  secondary="Contracts must achieve a minimum security score"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckIcon sx={{ color: '#10b981' }} /></ListItemIcon>
                <ListItemText
                  primary="Zero Critical Vulnerabilities"
                  secondary="No critical security issues allowed"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckIcon sx={{ color: '#10b981' }} /></ListItemIcon>
                <ListItemText
                  primary="Zero High Severity Issues"
                  secondary="No high-risk vulnerabilities permitted"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckIcon sx={{ color: '#10b981' }} /></ListItemIcon>
                <ListItemText
                  primary="Zero Medium Severity Issues"
                  secondary="No medium-risk vulnerabilities allowed"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
                             <ListItem>
                 <ListItemIcon><CheckIcon sx={{ color: '#10b981' }} /></ListItemIcon>
                 <ListItemText
                   primary="OpenZeppelin Integration Required"
                   secondary="Mandatory use of OpenZeppelin security libraries for audit approval"
                   primaryTypographyProps={{ color: '#ffffff' }}
                   secondaryTypographyProps={{ color: '#94a3b8' }}
                 />
               </ListItem>
            </List>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ color: '#ffffff', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AnalyticsIcon sx={{ color: '#6366f1' }} />
              Audit Tools & Analysis
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon><CodeIcon sx={{ color: '#8b5cf6' }} /></ListItemIcon>
                <ListItemText
                  primary="Solhint Analysis"
                  secondary="Static analysis for Solidity best practices"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><BugIcon sx={{ color: '#ef4444' }} /></ListItemIcon>
                <ListItemText
                  primary="Slither Security Scanner"
                  secondary="Comprehensive vulnerability detection"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><SecurityIcon sx={{ color: '#f59e0b' }} /></ListItemIcon>
                <ListItemText
                  primary="Not So Smart Contracts Analysis"
                  secondary="Detection of 12+ vulnerability patterns"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><TimerIcon sx={{ color: '#10b981' }} /></ListItemIcon>
                <ListItemText
                  primary="Gas Optimization Analysis"
                  secondary="Efficiency and cost optimization checks"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><GradeIcon sx={{ color: '#6366f1' }} /></ListItemIcon>
                <ListItemText
                  primary="Security Scoring System"
                  secondary="A-F grading with detailed recommendations"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
            </List>
          </Grid>
        </Grid>
      </Paper>

      {/* Service Comparison */}
      <Paper sx={{ p: 4, mb: 4, background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}>
        <Typography variant="h4" sx={{ color: '#ffffff', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <SecurityIcon sx={{ color: '#6366f1' }} />
          Security Service Comparison
        </Typography>
        
        <Typography variant="body1" sx={{ color: '#94a3b8', mb: 3 }}>
          Understand the difference between our built-in template security and the professional audit service
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ color: '#10b981', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckIcon sx={{ color: '#10b981' }} />
              Built-in Template Security
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon><CheckIcon sx={{ color: '#10b981' }} /></ListItemIcon>
                <ListItemText
                  primary="Included with all templates"
                  secondary="No additional cost"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckIcon sx={{ color: '#10b981' }} /></ListItemIcon>
                <ListItemText
                  primary="Pre-audited code"
                  secondary="Security-reviewed templates"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckIcon sx={{ color: '#10b981' }} /></ListItemIcon>
                <ListItemText
                  primary="Production ready"
                  secondary="Deploy directly to mainnet"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckIcon sx={{ color: '#10b981' }} /></ListItemIcon>
                <ListItemText
                  primary="Standard features"
                  secondary="OpenZeppelin, access controls, etc."
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
            </List>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ color: '#6366f1', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AutoAwesomeIcon sx={{ color: '#6366f1' }} />
              Professional Audit Service
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon><CheckIcon sx={{ color: '#6366f1' }} /></ListItemIcon>
                <ListItemText
                  primary="Additional service"
                  secondary="For custom contracts and advanced users"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckIcon sx={{ color: '#6366f1' }} /></ListItemIcon>
                <ListItemText
                  primary="Real-time analysis"
                  secondary="Analyze any Solidity contract"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckIcon sx={{ color: '#6366f1' }} /></ListItemIcon>
                <ListItemText
                  primary="Advanced detection"
                  secondary="12+ vulnerability patterns"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckIcon sx={{ color: '#6366f1' }} /></ListItemIcon>
                <ListItemText
                  primary="Detailed reports"
                  secondary="A-F grading and recommendations"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
            </List>
          </Grid>
        </Grid>
      </Paper>

      {/* Vulnerability Detection Section */}
      <Paper sx={{ p: 4, mb: 4, background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}>
        <Typography variant="h4" sx={{ color: '#ffffff', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <BugIcon sx={{ color: '#ef4444' }} />
          Professional Audit: Advanced Vulnerability Detection
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
              🔴 Critical Vulnerabilities
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon><WarningIcon sx={{ color: '#ef4444' }} fontSize="small" /></ListItemIcon>
                <ListItemText 
                  primary="Reentrancy Attacks"
                  primaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><WarningIcon sx={{ color: '#ef4444' }} fontSize="small" /></ListItemIcon>
                <ListItemText 
                  primary="Integer Overflow/Underflow"
                  primaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><WarningIcon sx={{ color: '#ef4444' }} fontSize="small" /></ListItemIcon>
                <ListItemText 
                  primary="Unchecked External Calls"
                  primaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
            </List>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
              🟡 High Severity Issues
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon><WarningIcon sx={{ color: '#f59e0b' }} fontSize="small" /></ListItemIcon>
                <ListItemText 
                  primary="Access Control Issues"
                  primaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><WarningIcon sx={{ color: '#f59e0b' }} fontSize="small" /></ListItemIcon>
                <ListItemText 
                  primary="Race Conditions"
                  primaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><WarningIcon sx={{ color: '#f59e0b' }} fontSize="small" /></ListItemIcon>
                <ListItemText 
                  primary="Honeypot Detection"
                  primaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
            </List>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
              🔵 Medium Severity Issues
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon><WarningIcon sx={{ color: '#3b82f6' }} fontSize="small" /></ListItemIcon>
                <ListItemText 
                  primary="Gas Inefficiencies"
                  primaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><WarningIcon sx={{ color: '#3b82f6' }} fontSize="small" /></ListItemIcon>
                <ListItemText 
                  primary="Bad Randomness"
                  primaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><WarningIcon sx={{ color: '#3b82f6' }} fontSize="small" /></ListItemIcon>
                <ListItemText 
                  primary="Denial of Service"
                  primaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
            </List>
          </Grid>
        </Grid>
      </Paper>

      {/* Not So Smart Contracts Analysis */}
      <Paper sx={{ p: 4, mb: 4, background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}>
        <Typography variant="h4" sx={{ color: '#ffffff', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <SecurityIcon sx={{ color: '#f59e0b' }} />
          Not So Smart Contracts Analysis
        </Typography>
        
        <Typography variant="body1" sx={{ color: '#94a3b8', mb: 3 }}>
          Advanced pattern recognition based on the comprehensive "Not So Smart Contracts" vulnerability database, 
          detecting sophisticated attack vectors and malicious patterns.
        </Typography>

        <Grid container spacing={2}>
          {[
            'Bad Randomness', 'Race Condition', 'Denial of Service', 'Forced Ether Reception',
            'Honeypot Detection', 'Rug Pull Patterns', 'Variable Shadowing', 'Constructor Errors',
            'Integer Overflow', 'Unchecked External Calls', 'Incorrect Interfaces', 'Wrong Constructor Names'
          ].map((vuln, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Chip
                label={vuln}
                variant="outlined"
                sx={{ 
                  color: '#94a3b8', 
                  borderColor: '#6366f1',
                  '&:hover': { borderColor: '#8b5cf6' }
                }}
              />
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Audit Process */}
      <Paper sx={{ p: 4, mb: 4, background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}>
        <Typography variant="h4" sx={{ color: '#ffffff', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <SpeedIcon sx={{ color: '#10b981' }} />
          Audit Process & Workflow
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
              📝 Submission Phase
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon><CheckIcon sx={{ color: '#10b981' }} /></ListItemIcon>
                <ListItemText
                  primary="Contract Source Code Input"
                  secondary="Paste your Solidity contract code"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckIcon sx={{ color: '#10b981' }} /></ListItemIcon>
                <ListItemText
                  primary="Contract Name Specification"
                  secondary="Provide the main contract name"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckIcon sx={{ color: '#10b981' }} /></ListItemIcon>
                <ListItemText
                  primary="Example Contracts Available"
                  secondary="Test with pre-built vulnerable contracts"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
            </List>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
              🔍 Analysis Phase
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon><TimerIcon sx={{ color: '#6366f1' }} /></ListItemIcon>
                <ListItemText
                  primary="Multi-Tool Analysis"
                  secondary="Solhint, Slither, and custom patterns"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><AnalyticsIcon sx={{ color: '#8b5cf6' }} /></ListItemIcon>
                <ListItemText
                  primary="Vulnerability Detection"
                  secondary="Comprehensive security scanning"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><GradeIcon sx={{ color: '#f59e0b' }} /></ListItemIcon>
                <ListItemText
                  primary="Security Scoring"
                  secondary="A-F grade with detailed breakdown"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
            </List>
          </Grid>
        </Grid>
      </Paper>

      {/* Results & Recommendations */}
      <Paper sx={{ p: 4, mb: 4, background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}>
        <Typography variant="h4" sx={{ color: '#ffffff', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckIcon sx={{ color: '#10b981' }} />
          Results & Recommendations
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
              📊 Audit Results
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon><GradeIcon sx={{ color: '#6366f1' }} /></ListItemIcon>
                <ListItemText
                  primary="Security Score (0-100)"
                  secondary="Numerical security assessment"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><ShieldIcon sx={{ color: '#10b981' }} /></ListItemIcon>
                <ListItemText
                  primary="Grade (A-F)"
                  secondary="Letter grade classification"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><BugIcon sx={{ color: '#ef4444' }} /></ListItemIcon>
                <ListItemText
                  primary="Vulnerability Count"
                  secondary="Detailed breakdown by severity"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><TimerIcon sx={{ color: '#f59e0b' }} /></ListItemIcon>
                <ListItemText
                  primary="Audit Duration"
                  secondary="Performance metrics"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
            </List>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
              💡 Smart Recommendations
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon><CheckIcon sx={{ color: '#10b981' }} /></ListItemIcon>
                <ListItemText
                  primary="Actionable Fixes"
                  secondary="Specific code improvements"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><SecurityIcon sx={{ color: '#6366f1' }} /></ListItemIcon>
                <ListItemText
                  primary="Security Best Practices"
                  secondary="Industry-standard recommendations"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><CodeIcon sx={{ color: '#8b5cf6' }} /></ListItemIcon>
                <ListItemText
                  primary="Code Examples"
                  secondary="Secure implementation patterns"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><LockIcon sx={{ color: '#f59e0b' }} /></ListItemIcon>
                <ListItemText
                  primary="Access Control"
                  secondary="Permission management guidance"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
            </List>
          </Grid>
        </Grid>
      </Paper>

      {/* Security Best Practices */}
      <Paper sx={{ p: 4, mb: 4, background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}>
        <Typography variant="h4" sx={{ color: '#ffffff', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <LockIcon sx={{ color: '#6366f1' }} />
          Security Best Practices
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
              🛡️ Contract Security
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon><CheckIcon sx={{ color: '#10b981' }} /></ListItemIcon>
                <ListItemText
                  primary="Use OpenZeppelin Libraries"
                  secondary="Battle-tested, audited security components"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckIcon sx={{ color: '#10b981' }} /></ListItemIcon>
                <ListItemText
                  primary="Implement Access Controls"
                  secondary="Use modifiers like onlyOwner"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckIcon sx={{ color: '#10b981' }} /></ListItemIcon>
                <ListItemText
                  primary="Use ReentrancyGuard"
                  secondary="Protect against reentrancy attacks"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckIcon sx={{ color: '#10b981' }} /></ListItemIcon>
                <ListItemText
                  primary="Avoid tx.origin"
                  secondary="Use msg.sender for authentication"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
            </List>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
              🔧 Development Practices
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon><CheckIcon sx={{ color: '#10b981' }} /></ListItemIcon>
                <ListItemText
                  primary="Test on Testnets"
                  secondary="Deploy to test networks first"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckIcon sx={{ color: '#10b981' }} /></ListItemIcon>
                <ListItemText
                  primary="Use SafeMath (if needed)"
                  secondary="Protect against integer overflow"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckIcon sx={{ color: '#10b981' }} /></ListItemIcon>
                <ListItemText
                  primary="Chainlink VRF for Randomness"
                  secondary="Secure random number generation"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckIcon sx={{ color: '#10b981' }} /></ListItemIcon>
                <ListItemText
                  primary="Document Security Decisions"
                  secondary="Maintain security documentation"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
            </List>
          </Grid>
        </Grid>
      </Paper>

      {/* Important Warnings */}
      <Alert severity="warning" sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ color: '#ffffff', mb: 1 }}>
          ⚠️ Important Security Warnings
        </Typography>
        <Typography variant="body1" sx={{ color: '#94a3b8', mb: 2 }}>
          While our automated security audit provides comprehensive analysis, it should not replace professional security audits for high-value contracts. 
          Always consider additional security measures for production deployments.
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon><WarningIcon sx={{ color: '#f59e0b' }} fontSize="small" /></ListItemIcon>
            <ListItemText 
              primary="Automated audits complement but don't replace manual security reviews"
              primaryTypographyProps={{ color: '#94a3b8' }}
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><WarningIcon sx={{ color: '#f59e0b' }} fontSize="small" /></ListItemIcon>
            <ListItemText 
              primary="Test thoroughly on testnets before mainnet deployment"
              primaryTypographyProps={{ color: '#94a3b8' }}
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><WarningIcon sx={{ color: '#f59e0b' }} fontSize="small" /></ListItemIcon>
            <ListItemText 
              primary="Consider professional audits for high-value contracts"
              primaryTypographyProps={{ color: '#94a3b8' }}
            />
          </ListItem>
        </List>
      </Alert>

      {/* Platform Security */}
      <Paper sx={{ p: 4, background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}>
        <Typography variant="h4" sx={{ color: '#ffffff', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <PublicIcon sx={{ color: '#6366f1' }} />
          Platform Security Features
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <List>
              <ListItem>
                <ListItemIcon><SecurityIcon sx={{ color: '#6366f1' }} /></ListItemIcon>
                <ListItemText
                  primary="No Private Key Storage"
                  secondary="We never store or have access to your private keys"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><LockIcon sx={{ color: '#6366f1' }} /></ListItemIcon>
                <ListItemText
                  primary="Hardware Wallet Security"
                  secondary="All platform addresses secured by Ledger hardware wallets"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><PublicIcon sx={{ color: '#6366f1' }} /></ListItemIcon>
                <ListItemText
                  primary="Open Source"
                  secondary="Platform code is open source and auditable"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
            </List>
          </Grid>

          <Grid item xs={12} md={6}>
            <List>
              <ListItem>
                <ListItemIcon><SpeedIcon sx={{ color: '#6366f1' }} /></ListItemIcon>
                <ListItemText
                  primary="Direct Blockchain Interaction"
                  secondary="No backend servers handling your transactions"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckIcon sx={{ color: '#6366f1' }} /></ListItemIcon>
                <ListItemText
                  primary="Auto-Verification"
                  secondary="All contracts automatically verified on block explorers"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><CodeIcon sx={{ color: '#6366f1' }} /></ListItemIcon>
                <ListItemText
                  primary="Latest Solidity"
                  secondary="Uses Solidity ^0.8.20 with latest security improvements"
                  primaryTypographyProps={{ color: '#ffffff' }}
                  secondaryTypographyProps={{ color: '#94a3b8' }}
                />
              </ListItem>
            </List>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  )
}

export default Security
