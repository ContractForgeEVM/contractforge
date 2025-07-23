import React from 'react'
import { Button, Container, Typography, Box } from '@mui/material'
import { useAccount } from 'wagmi'
import { useSmartError } from '../hooks/useSmartError'
import { SmartErrorDialog } from './errors/SmartErrorDialog'

/**
 * COMPOSANT D'EXEMPLE : Utilisation du système d'erreurs intelligentes
 * 
 * Ce composant montre comment intégrer le système d'erreurs dans vos composants existants.
 * Remplacez cet exemple par l'intégration dans vos vrais composants comme ContractForm.tsx
 */
export const SmartErrorExample: React.FC = () => {
  const { address } = useAccount()
  
  // 🎯 HOOK PRINCIPAL - Utilisez ceci dans vos composants
  const {
    currentError,
    isErrorDialogOpen,
    handleError,
    closeError,
    clearError,
    retryLastAction
  } = useSmartError(async () => {
    // Cette fonction sera appelée lors du retry
    console.log('Retry action executed')
  })

  // Simuler différents types d'erreurs pour la démonstration
  const simulateInsufficientFunds = async () => {
    try {
      // Simulations d'erreurs réelles
      throw new Error('insufficient funds for intrinsic transaction cost')
    } catch (error) {
      await handleError(
        error,
        'ERC20 Token', // Template
        ['mintable', 'burnable'], // Features
        { totalCost: '5000000000000000000' }, // Gas estimate (5 ETH)
        { additionalInfo: 'Mint transaction' } // Additional context
      )
    }
  }

  const simulateNetworkError = async () => {
    try {
      throw new Error('fetch failed - network connection timeout')
    } catch (error) {
      await handleError(
        error,
        'NFT Collection',
        ['enumerable', 'royalties']
      )
    }
  }

  const simulateCompilationError = async () => {
    try {
      throw new Error('compilation failed: conflicting features')
    } catch (error) {
      await handleError(
        error,
        'DAO Contract',
        ['governance', 'multisig', 'timelock']
      )
    }
  }

  const simulateDeploymentError = async () => {
    try {
      throw new Error('execution reverted: simulation failed')
    } catch (error) {
      await handleError(
        error,
        'Yield Farming',
        ['staking', 'rewards'],
        { totalCost: '2000000000000000000' } // 2 ETH
      )
    }
  }

  const simulateValidationError = async () => {
    try {
      throw new Error('invalid address: missing required field')
    } catch (error) {
      await handleError(
        error,
        'Token Lock',
        []
      )
    }
  }

  const simulateGenericError = async () => {
    try {
      throw new Error('Unknown error occurred during processing')
    } catch (error) {
      await handleError(error)
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        🧠 Système d'Erreurs Intelligentes - Demo
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Testez les différents types d'erreurs pour voir les messages intelligents et solutions personnalisées.
      </Typography>

      {address ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 3 }}>
          <Button 
            variant="outlined" 
            color="error"
            onClick={simulateInsufficientFunds}
          >
            💰 Simuler Solde Insuffisant
          </Button>

          <Button 
            variant="outlined" 
            color="warning"
            onClick={simulateNetworkError}
          >
            🌐 Simuler Erreur Réseau
          </Button>

          <Button 
            variant="outlined" 
            color="error"
            onClick={simulateCompilationError}
          >
            🔧 Simuler Erreur Compilation
          </Button>

          <Button 
            variant="outlined" 
            color="error"
            onClick={simulateDeploymentError}
          >
            🚀 Simuler Erreur Déploiement
          </Button>

          <Button 
            variant="outlined" 
            color="warning"
            onClick={simulateValidationError}
          >
            ✅ Simuler Erreur Validation
          </Button>

          <Button 
            variant="outlined" 
            color="info"
            onClick={simulateGenericError}
          >
            ❓ Simuler Erreur Générique
          </Button>
        </Box>
      ) : (
        <Typography variant="body1" color="text.secondary" sx={{ mt: 3 }}>
          Connectez votre portefeuille pour tester les erreurs intelligentes.
        </Typography>
      )}

      {/* 🎨 DIALOG D'ERREUR - Ajoutez ceci à vos composants */}
      <SmartErrorDialog
        error={currentError}
        open={isErrorDialogOpen}
        onClose={closeError}
        onRetry={retryLastAction}
      />

      {/* Guide d'intégration */}
      <Box sx={{ mt: 4, p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          🔧 Comment intégrer dans vos composants :
        </Typography>
        
        <Typography variant="body2" component="pre" sx={{ 
          bgcolor: 'grey.100', 
          p: 2, 
          borderRadius: 1,
          fontSize: '0.85rem',
          overflow: 'auto',
          whiteSpace: 'pre-wrap'
        }}>
{`// 1. Dans vos composants existants (ex: ContractForm.tsx)
import { useSmartError } from '../hooks/useSmartError'
import { SmartErrorDialog } from './errors/SmartErrorDialog'

const YourComponent = () => {
  const { 
    currentError, 
    isErrorDialogOpen, 
    handleError, 
    closeError, 
    retryLastAction 
  } = useSmartError()

  // 2. Remplacez vos try/catch existants
  const deployContract = async () => {
    try {
      // Votre logique de déploiement
      await deployLogic()
    } catch (error) {
      // 🚀 Utilisez handleError au lieu de console.error
      await handleError(
        error,
        selectedTemplate, // ex: 'ERC20 Token'
        selectedFeatures,  // ex: ['mintable', 'burnable']
        gasEstimate,      // Estimation de coût
        { stage: 'deployment' } // Contexte additionnel
      )
    }
  }

  // 3. Ajoutez le Dialog à votre JSX
  return (
    <>
      {/* Votre composant existant */}
      
      <SmartErrorDialog
        error={currentError}
        open={isErrorDialogOpen}
        onClose={closeError}
        onRetry={retryLastAction}
      />
    </>
  )
}`}
        </Typography>
      </Box>
    </Container>
  )
} 