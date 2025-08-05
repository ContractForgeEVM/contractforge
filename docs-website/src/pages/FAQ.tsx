import {
  Box,
  Container,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  Token as TokenIcon,
  Security as SecurityIcon,
  AccountBalance as AccountBalanceIcon,
  CheckCircle as CheckIcon,
  Launch as LaunchIcon,
  Lock as LockIcon,
} from '@mui/icons-material'

const FAQ = () => {
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
        ❓ Frequently Asked Questions
      </Typography>
      
      <Typography variant="h5" sx={{ color: '#94a3b8', mb: 4 }}>
        Find answers to the most common questions about ContractForge
      </Typography>

      {/* General Questions */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2, color: '#6366f1' }}>
        🏗️ General Questions
      </Typography>
      
      <Accordion sx={{ mb: 1, backgroundColor: '#1a1a2e' }}>
        <AccordionSummary 
          expandIcon={<ExpandMoreIcon sx={{ color: '#94a3b8' }} />}
          sx={{ '& .MuiAccordionSummary-content': { my: 2 } }}
        >
          <Typography variant="h6" sx={{ color: '#ffffff' }}>What is ContractForge?</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography sx={{ color: '#94a3b8' }}>
            ContractForge is a comprehensive smart contract development and deployment platform that 
            simplifies the process of creating, customizing, and deploying smart contracts across 
            multiple blockchain networks. It's designed for both beginners and experienced developers 
            who want to deploy professional-grade contracts without writing code from scratch.
          </Typography>
        </AccordionDetails>
      </Accordion>
      
      <Accordion sx={{ mb: 1, backgroundColor: '#1a1a2e' }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#94a3b8' }} />}>
          <Typography variant="h6" sx={{ color: '#ffffff' }}>How does ContractForge work?</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography sx={{ color: '#94a3b8' }}>
            ContractForge uses a template-based system where you select a contract type (Token, NFT, DAO, or Lock), 
            configure the parameters, optionally add premium features, and then deploy directly to your chosen blockchain. 
            All contracts are based on OpenZeppelin's audited libraries and are automatically verified on block explorers.
          </Typography>
        </AccordionDetails>
      </Accordion>
      
      <Accordion sx={{ mb: 1, backgroundColor: '#1a1a2e' }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#94a3b8' }} />}>
          <Typography variant="h6" sx={{ color: '#ffffff' }}>Which blockchain networks are supported?</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography sx={{ color: '#94a3b8', mb: 2 }}>
            ContractForge supports 13 mainnet networks and 3 testnet networks:
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ color: '#6366f1' }}>Mainnet Networks:</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {['Ethereum', 'Arbitrum', 'Polygon', 'BNB Chain', 'Avalanche', 'Base', 'Optimism', 'Celo', 'Linea', 'Scroll', 'Zora', 'Gnosis', 'HyperEVM'].map((network) => (
                <Chip key={network} label={network} size="small" variant="outlined" sx={{ borderColor: '#6366f1', color: '#6366f1' }} />
              ))}
            </Box>
          </Box>
          <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ color: '#6366f1' }}>Testnet Networks:</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {['Ethereum Sepolia', 'Base Sepolia', 'Monad Testnet'].map((network) => (
                <Chip key={network} label={network} size="small" variant="outlined" sx={{ borderColor: '#6366f1', color: '#6366f1' }} />
              ))}
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Cost Questions */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2, color: '#6366f1' }}>
        💰 Costs & Pricing
      </Typography>
      
      <Accordion sx={{ mb: 1, backgroundColor: '#1a1a2e' }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#94a3b8' }} />}>
          <Typography variant="h6" sx={{ color: '#ffffff' }}>How much does it cost to deploy a contract?</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography sx={{ color: '#94a3b8', mb: 2 }}>
            The cost depends on several factors:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon><TokenIcon sx={{ color: '#6366f1' }} fontSize="small" /></ListItemIcon>
              <ListItemText 
                primary="Network Gas Fees: Variable based on network congestion"
                primaryTypographyProps={{ color: '#94a3b8' }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><SecurityIcon sx={{ color: '#8b5cf6' }} fontSize="small" /></ListItemIcon>
              <ListItemText 
                primary="Premium Features: 0.001 - 0.008 ETH per feature"
                primaryTypographyProps={{ color: '#94a3b8' }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><AccountBalanceIcon sx={{ color: '#f59e0b' }} fontSize="small" /></ListItemIcon>
              <ListItemText 
                primary="Platform Fee: 2% of total deployment value"
                primaryTypographyProps={{ color: '#94a3b8' }}
              />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>
      
      <Accordion sx={{ mb: 1, backgroundColor: '#1a1a2e' }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#94a3b8' }} />}>
          <Typography variant="h6" sx={{ color: '#ffffff' }}>What is the 2% platform fee?</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography sx={{ color: '#94a3b8', mb: 2 }}>
            The platform fee is 2% of the total deployment value (gas costs + premium features). 
            This fee supports platform development, security audits, and infrastructure maintenance.
          </Typography>
          <Alert severity="info" sx={{ 
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            '& .MuiAlert-icon': { color: '#6366f1' }
          }}>
            <Typography variant="body2" sx={{ color: '#ffffff' }}>
              The platform fee is sent to our treasury address secured by Ledger hardware wallet: 
              0x2A5954bA696AD11BabD9B5398fa3ecA6Da98420C
            </Typography>
          </Alert>
        </AccordionDetails>
      </Accordion>
      
      <Accordion sx={{ mb: 1, backgroundColor: '#1a1a2e' }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#94a3b8' }} />}>
          <Typography variant="h6" sx={{ color: '#ffffff' }}>Which network is cheapest for deployment?</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography sx={{ color: '#94a3b8', mb: 2 }}>
            Layer 2 networks and alternative chains typically offer the lowest gas fees:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Chip label="Polygon" sx={{ backgroundColor: '#10b981', color: '#ffffff' }} size="small" />
            <Chip label="BNB Chain" sx={{ backgroundColor: '#10b981', color: '#ffffff' }} size="small" />
            <Chip label="Avalanche" sx={{ backgroundColor: '#10b981', color: '#ffffff' }} size="small" />
            <Chip label="Arbitrum" sx={{ backgroundColor: '#6366f1', color: '#ffffff' }} size="small" />
            <Chip label="Base" sx={{ backgroundColor: '#6366f1', color: '#ffffff' }} size="small" />
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Security Questions */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2, color: '#6366f1' }}>
        🔒 Security & Safety
      </Typography>
      
      <Accordion sx={{ mb: 1, backgroundColor: '#1a1a2e' }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#94a3b8' }} />}>
          <Typography variant="h6" sx={{ color: '#ffffff' }}>Is ContractForge safe to use?</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography sx={{ color: '#94a3b8', mb: 2 }}>
            Yes! ContractForge prioritizes security at every level:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon><CheckIcon sx={{ color: '#10b981' }} fontSize="small" /></ListItemIcon>
              <ListItemText 
                primary="Based on OpenZeppelin's audited and battle-tested libraries"
                primaryTypographyProps={{ color: '#94a3b8' }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckIcon sx={{ color: '#10b981' }} fontSize="small" /></ListItemIcon>
              <ListItemText 
                primary="All generated contracts follow industry best practices"
                primaryTypographyProps={{ color: '#94a3b8' }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckIcon sx={{ color: '#10b981' }} fontSize="small" /></ListItemIcon>
              <ListItemText 
                primary="Open source platform code available for audit"
                primaryTypographyProps={{ color: '#94a3b8' }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><LockIcon sx={{ color: '#10b981' }} fontSize="small" /></ListItemIcon>
              <ListItemText 
                primary="All platform addresses secured by Ledger hardware wallets"
                primaryTypographyProps={{ color: '#94a3b8' }}
              />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>
      
      <Accordion sx={{ mb: 1, backgroundColor: '#1a1a2e' }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#94a3b8' }} />}>
          <Typography variant="h6" sx={{ color: '#ffffff' }}>Do you store my private keys?</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography sx={{ color: '#94a3b8', mb: 2 }}>
            No, absolutely not! ContractForge never stores, has access to, or can see your private keys. 
            All wallet interactions happen directly between your browser and your wallet extension. 
            We use client-side compilation and direct blockchain interaction.
          </Typography>
          <Alert severity="success" sx={{ 
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            '& .MuiAlert-icon': { color: '#10b981' }
          }}>
            <Typography variant="body2" sx={{ color: '#ffffff' }}>
              Your private keys never leave your device. ContractForge is a client-side application 
              that interacts directly with your wallet and the blockchain.
            </Typography>
          </Alert>
        </AccordionDetails>
      </Accordion>
      
      <Accordion sx={{ mb: 1, backgroundColor: '#1a1a2e' }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#94a3b8' }} />}>
          <Typography variant="h6" sx={{ color: '#ffffff' }}>Should I test on testnets first?</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography sx={{ color: '#94a3b8', mb: 2 }}>
            Yes, absolutely! Always test your contracts on testnets before mainnet deployment. 
            This helps you verify parameters, test functionality, and avoid costly mistakes on mainnet.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip label="Ethereum Sepolia" sx={{ backgroundColor: '#6366f1', color: '#ffffff' }} size="small" />
            <Chip label="Base Sepolia" sx={{ backgroundColor: '#6366f1', color: '#ffffff' }} size="small" />
            <Chip label="Monad Testnet" sx={{ backgroundColor: '#6366f1', color: '#ffffff' }} size="small" />
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Technical Questions */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2, color: '#6366f1' }}>
        ⚙️ Technical Questions
      </Typography>
      
      <Accordion sx={{ mb: 1, backgroundColor: '#1a1a2e' }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#94a3b8' }} />}>
          <Typography variant="h6" sx={{ color: '#ffffff' }}>Are contracts automatically verified?</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography sx={{ color: '#94a3b8' }}>
            Yes! All contracts deployed through ContractForge are automatically verified on their 
            respective block explorers. This means the source code, constructor arguments, and ABI 
            are publicly available for transparency and easier interaction.
          </Typography>
        </AccordionDetails>
      </Accordion>
      
      <Accordion sx={{ mb: 1, backgroundColor: '#1a1a2e' }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#94a3b8' }} />}>
          <Typography variant="h6" sx={{ color: '#ffffff' }}>Can I customize my contracts?</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography sx={{ color: '#94a3b8', mb: 2 }}>
            Yes! ContractForge offers extensive customization through premium features. 
            You can add advanced functionality to your contracts:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {['Pausable', 'Burnable', 'Mintable', 'Capped', 'Snapshot', 'Whitelist', 'Multisig', 'Upgradeable', 'Vesting', 'Staking'].map((feature) => (
              <Chip key={feature} label={feature} size="small" variant="outlined" sx={{ borderColor: '#8b5cf6', color: '#8b5cf6' }} />
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>
      
      <Accordion sx={{ mb: 1, backgroundColor: '#1a1a2e' }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#94a3b8' }} />}>
          <Typography variant="h6" sx={{ color: '#ffffff' }}>How accurate is gas estimation?</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography sx={{ color: '#94a3b8' }}>
            Our gas estimation is highly accurate as it uses real-time network data and actual 
            contract compilation. We simulate the deployment transaction to provide precise estimates 
            including base deployment cost, premium feature overhead, and current network gas prices.
          </Typography>
        </AccordionDetails>
      </Accordion>

      {/* Future Plans */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2, color: '#6366f1' }}>
        🚀 Future Plans
      </Typography>
      
      <Accordion sx={{ mb: 1, backgroundColor: '#1a1a2e' }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#94a3b8' }} />}>
          <Typography variant="h6" sx={{ color: '#ffffff' }}>Will there be a ContractForge token?</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography sx={{ color: '#94a3b8' }}>
            Yes! A ContractForge governance token is planned for Q2 2025. Token holders will be able 
            to participate in platform governance, receive fee discounts, and access exclusive features. 
            Stay tuned for more details about tokenomics and distribution.
          </Typography>
        </AccordionDetails>
      </Accordion>
      
      <Accordion sx={{ mb: 1, backgroundColor: '#1a1a2e' }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#94a3b8' }} />}>
          <Typography variant="h6" sx={{ color: '#ffffff' }}>Will there be an airdrop?</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography sx={{ color: '#94a3b8' }}>
            Early users and active community members will be rewarded! We're tracking user activity 
            and deployments for a potential retroactive airdrop when the token launches. 
            Keep using ContractForge to maximize your potential allocation.
          </Typography>
        </AccordionDetails>
      </Accordion>
      
      <Accordion sx={{ mb: 1, backgroundColor: '#1a1a2e' }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#94a3b8' }} />}>
          <Typography variant="h6" sx={{ color: '#ffffff' }}>Will you support Solana?</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography sx={{ color: '#94a3b8', mb: 2 }}>
            Solana support is being researched for late 2025. The technical differences between 
            Solana programs and EVM smart contracts require significant development work, but we're 
            committed to expanding to other ecosystems.
          </Typography>
          <Alert severity="info" sx={{ 
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            '& .MuiAlert-icon': { color: '#6366f1' }
          }}>
            <Typography variant="body2" sx={{ color: '#ffffff' }}>
              Join our Telegram community to stay updated on new network integrations and features.
            </Typography>
          </Alert>
        </AccordionDetails>
      </Accordion>

      {/* Security & Audit */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2, color: '#6366f1' }}>
        🔒 Security & Audit Services
      </Typography>
      
      <Accordion sx={{ mb: 1, backgroundColor: '#1a1a2e' }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#94a3b8' }} />}>
          <Typography variant="h6" sx={{ color: '#ffffff' }}>What's the difference between template security and the audit service?</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography sx={{ color: '#94a3b8', mb: 2 }}>
            We offer two levels of security:
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ color: '#10b981' }}>Built-in Template Security (Included):</Typography>
            <Typography sx={{ color: '#94a3b8', mb: 1 }}>
              All our contract templates come with enterprise-grade security built-in using OpenZeppelin libraries, latest Solidity features, and pre-audited code. This is included at no additional cost.
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ color: '#6366f1' }}>Professional Audit Service (Additional):</Typography>
            <Typography sx={{ color: '#94a3b8' }}>
              A separate service for analyzing custom contracts using Solhint, Slither, and advanced vulnerability detection. This is for users who want to audit their own custom code.
            </Typography>
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion sx={{ mb: 1, backgroundColor: '#1a1a2e' }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#94a3b8' }} />}>
          <Typography variant="h6" sx={{ color: '#ffffff' }}>What is the Professional Audit Service?</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography sx={{ color: '#94a3b8', mb: 2 }}>
            Our Professional Audit Service is an additional security analysis tool that uses multiple industry-leading tools to detect vulnerabilities in any Solidity contract:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon><SecurityIcon sx={{ color: '#6366f1' }} fontSize="small" /></ListItemIcon>
              <ListItemText 
                primary="Solhint Analysis"
                secondary="Static analysis for Solidity best practices"
                primaryTypographyProps={{ color: '#ffffff' }}
                secondaryTypographyProps={{ color: '#94a3b8' }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><SecurityIcon sx={{ color: '#ef4444' }} fontSize="small" /></ListItemIcon>
              <ListItemText 
                primary="Slither Security Scanner"
                secondary="Comprehensive vulnerability detection"
                primaryTypographyProps={{ color: '#ffffff' }}
                secondaryTypographyProps={{ color: '#94a3b8' }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><SecurityIcon sx={{ color: '#f59e0b' }} fontSize="small" /></ListItemIcon>
              <ListItemText 
                primary="Not So Smart Contracts Analysis"
                secondary="Detection of 12+ vulnerability patterns"
                primaryTypographyProps={{ color: '#ffffff' }}
                secondaryTypographyProps={{ color: '#94a3b8' }}
              />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>

      <Accordion sx={{ mb: 1, backgroundColor: '#1a1a2e' }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#94a3b8' }} />}>
          <Typography variant="h6" sx={{ color: '#ffffff' }}>What are the security approval criteria?</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography sx={{ color: '#94a3b8', mb: 2 }}>
            Contracts must meet strict security standards to be approved:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon><CheckIcon sx={{ color: '#10b981' }} fontSize="small" /></ListItemIcon>
              <ListItemText 
                primary="Minimum Security Score: 70/100"
                primaryTypographyProps={{ color: '#ffffff' }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckIcon sx={{ color: '#10b981' }} fontSize="small" /></ListItemIcon>
              <ListItemText 
                primary="Zero Critical Vulnerabilities"
                primaryTypographyProps={{ color: '#ffffff' }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckIcon sx={{ color: '#10b981' }} fontSize="small" /></ListItemIcon>
              <ListItemText 
                primary="Zero High Severity Issues"
                primaryTypographyProps={{ color: '#ffffff' }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckIcon sx={{ color: '#10b981' }} fontSize="small" /></ListItemIcon>
              <ListItemText 
                primary="Zero Medium Severity Issues"
                primaryTypographyProps={{ color: '#ffffff' }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckIcon sx={{ color: '#10b981' }} fontSize="small" /></ListItemIcon>
              <ListItemText 
                primary="OpenZeppelin Integration Required"
                primaryTypographyProps={{ color: '#ffffff' }}
              />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>

      <Accordion sx={{ mb: 1, backgroundColor: '#1a1a2e' }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#94a3b8' }} />}>
          <Typography variant="h6" sx={{ color: '#ffffff' }}>What types of vulnerabilities does the system detect?</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography sx={{ color: '#94a3b8', mb: 2 }}>
            The system detects a comprehensive range of vulnerabilities:
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ color: '#ef4444' }}>Critical:</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {['Reentrancy Attacks', 'Integer Overflow', 'Unchecked External Calls'].map((vuln) => (
                <Chip key={vuln} label={vuln} size="small" sx={{ backgroundColor: '#ef4444', color: '#ffffff' }} />
              ))}
            </Box>
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ color: '#f59e0b' }}>High:</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {['Access Control Issues', 'Race Conditions', 'Honeypot Detection'].map((vuln) => (
                <Chip key={vuln} label={vuln} size="small" sx={{ backgroundColor: '#f59e0b', color: '#ffffff' }} />
              ))}
            </Box>
          </Box>
          <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ color: '#3b82f6' }}>Medium:</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {['Gas Inefficiencies', 'Bad Randomness', 'Denial of Service'].map((vuln) => (
                <Chip key={vuln} label={vuln} size="small" sx={{ backgroundColor: '#3b82f6', color: '#ffffff' }} />
              ))}
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion sx={{ mb: 1, backgroundColor: '#1a1a2e' }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#94a3b8' }} />}>
          <Typography variant="h6" sx={{ color: '#ffffff' }}>How does the security scoring work?</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography sx={{ color: '#94a3b8', mb: 2 }}>
            The security scoring system provides a comprehensive assessment:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon><CheckIcon sx={{ color: '#10b981' }} fontSize="small" /></ListItemIcon>
              <ListItemText 
                primary="Numerical Score (0-100)"
                secondary="Based on vulnerability count and severity"
                primaryTypographyProps={{ color: '#ffffff' }}
                secondaryTypographyProps={{ color: '#94a3b8' }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckIcon sx={{ color: '#6366f1' }} fontSize="small" /></ListItemIcon>
              <ListItemText 
                primary="Letter Grade (A-F)"
                secondary="A = Excellent, F = Failed"
                primaryTypographyProps={{ color: '#ffffff' }}
                secondaryTypographyProps={{ color: '#94a3b8' }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckIcon sx={{ color: '#f59e0b' }} fontSize="small" /></ListItemIcon>
              <ListItemText 
                primary="Detailed Recommendations"
                secondary="Actionable fixes and best practices"
                primaryTypographyProps={{ color: '#ffffff' }}
                secondaryTypographyProps={{ color: '#94a3b8' }}
              />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>

      {/* Support */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2, color: '#6366f1' }}>
        🆘 Support & Help
      </Typography>
      
      <Accordion sx={{ mb: 1, backgroundColor: '#1a1a2e' }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#94a3b8' }} />}>
          <Typography variant="h6" sx={{ color: '#ffffff' }}>How can I get help?</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography sx={{ color: '#94a3b8', mb: 2 }}>
            We offer multiple support channels:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button 
              variant="outlined" 
              size="small" 
              startIcon={<LaunchIcon />}
              href="https://github.com/contractforgeevm/issues" 
              target="_blank"
              sx={{ borderColor: '#6366f1', color: '#6366f1' }}
            >
              GitHub Issues
            </Button>
            <Button 
              variant="outlined" 
              size="small" 
              startIcon={<LaunchIcon />}
              href="https://t.me/contractforge" 
              target="_blank"
              sx={{ borderColor: '#6366f1', color: '#6366f1' }}
            >
              Telegram
            </Button>
            <Button 
              variant="outlined" 
              size="small" 
              startIcon={<LaunchIcon />}
              href="mailto:contact@contractforge.io"
              sx={{ borderColor: '#6366f1', color: '#6366f1' }}
            >
              Email
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Contact Card */}
      <Card sx={{ mt: 4, backgroundColor: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: '#6366f1' }}>
            Still Need Help?
          </Typography>
          <Typography variant="body2" sx={{ color: '#ffffff', mb: 3 }}>
            If you couldn't find the answer to your question, don't hesitate to reach out. 
            Our team is here to help you succeed with your smart contract deployments.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button 
              variant="contained" 
              size="small" 
              startIcon={<LaunchIcon />}
              href="mailto:contact@contractforge.io"
              sx={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                }
              }}
            >
              Email Support
            </Button>
            <Button 
              variant="outlined" 
              size="small" 
              startIcon={<LaunchIcon />}
              href="https://github.com/contractforgeevm/smart-contract-deployer"
              target="_blank"
              sx={{ borderColor: '#6366f1', color: '#6366f1' }}
            >
              GitHub
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  )
}

export default FAQ
