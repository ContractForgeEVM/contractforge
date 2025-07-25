import { generateContract } from './contractGenerator'
import type { TemplateType, PremiumFeatureConfig } from '../types'
import { createCompilationError, wrapHttpError } from './smartErrorHelper'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004'
const COMPILER_API_URL = `${API_BASE_URL}/api/web/compile`
const TEMPLATE_COMPILER_API_URL = `${API_BASE_URL}/api/web/compile/template`
const FOUNDRY_COMPILER_API_URL = `${API_BASE_URL}/api/web/compile/foundry`

interface CompilationResponse {
  success: boolean
  bytecode?: string
  abi?: any[]
  warnings?: string[]
  error?: string
  compilationTime?: number
}

export async function compileWithBackend(
  templateType: TemplateType,
  params: Record<string, any>,
  premiumFeatures: string[] = [],
  featureConfigs?: PremiumFeatureConfig
): Promise<{ bytecode: string; abi: any[] }> {
  try {
    console.log(`🚀 Compiling ${templateType} with Foundry via backend API...`)
    console.log(`📋 Template: ${templateType}, Features: ${premiumFeatures.length > 0 ? premiumFeatures.join(', ') : 'none'}`)
    
    // 🔍 DEBUG - Vérifier les données d'entrée
    console.log('🔍 DEBUG - Input validation:')
    console.log('  templateType:', typeof templateType, templateType)
    console.log('  params:', typeof params, Object.keys(params))
    console.log('  premiumFeatures:', typeof premiumFeatures, premiumFeatures)
    console.log('  featureConfigs:', featureConfigs ? 'provided' : 'none')
    
    // Déterminer quelle route utiliser selon le template
    const isNewTemplate = ['token', 'nft', 'dao', 'lock', 'social-token', 'liquidity-pool', 'yield-farming', 'gamefi-token', 'nft-marketplace', 'revenue-sharing', 'loyalty-program', 'dynamic-nft'].includes(templateType)
    const apiUrl = isNewTemplate ? TEMPLATE_COMPILER_API_URL : FOUNDRY_COMPILER_API_URL
    
    console.log(`🔗 Using API route: ${apiUrl}`)
    console.log(`🔗 Full API Base URL: ${API_BASE_URL}`)
    console.log(`🔗 Is new template: ${isNewTemplate}`)
    
    // 🔍 DEBUG - Préparer les données à envoyer
    const requestData = {
      templateType,
      features: premiumFeatures,
      params,
      featureConfigs: featureConfigs || {}
    }
    
    console.log('📤 Request data being sent:')
    console.log('  Full payload:', JSON.stringify(requestData, null, 2))
    console.log('  Payload size:', JSON.stringify(requestData).length, 'characters')
    
    // 🔍 DEBUG - Vérifier la connectivité
    console.log('🔍 Checking API connectivity...')
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer cfk_master_key_contractforge_production_2024_SECURE'
      },
      body: JSON.stringify(requestData)
    })
    
    // 🔍 DEBUG - Analyser la réponse
    console.log('📥 Response received:')
    console.log('  Status:', response.status)
    console.log('  Status text:', response.statusText)
    console.log('  Headers:', Object.fromEntries(response.headers.entries()))
    
    // Lire la réponse raw avant de l'analyser
    const responseText = await response.text()
    console.log('📥 Raw response:', responseText.substring(0, 500), responseText.length > 500 ? '...' : '')
    
    // Si l'erreur est 400, donner des détails précis
    if (!response.ok) {
      console.error('❌ HTTP Error Details:')
      console.error('  Status:', response.status)
      console.error('  Status Text:', response.statusText)
      console.error('  URL:', apiUrl)
      
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      let errorDetails = ''
      
      try {
        const errorData = JSON.parse(responseText)
        console.error('  Error data:', errorData)
        
        if (errorData.error) {
          errorMessage = errorData.error
        }
        
        if (errorData.message) {
          errorDetails = errorData.message
        }
        
        if (errorData.details) {
          errorDetails += ' ' + JSON.stringify(errorData.details)
        }
        
      } catch (parseError) {
        console.error('  Could not parse error response as JSON')
        errorDetails = responseText
      }
      
      // 🧠 Utiliser les erreurs enrichies du système intelligent
      const errorData = responseText ? (() => {
        try { return JSON.parse(responseText) } catch { return null }
      })() : null

      throw wrapHttpError(
        response.status, 
        response.statusText, 
        errorData,
        {
          apiUrl,
          templateType,
          features: premiumFeatures,
          stage: 'compilation'
        }
      )
    }
    
    // Analyser la réponse de succès
    let result: CompilationResponse
    try {
      result = JSON.parse(responseText)
    } catch (parseError) {
      console.error('❌ Could not parse success response:', parseError)
      throw new Error('Invalid JSON response from compilation API')
    }
    
    console.log('📥 Parsed response:', {
      success: result.success,
      hasBytecode: !!result.bytecode,
      hasAbi: !!result.abi,
      warningsCount: result.warnings?.length || 0
    })
    
    if (!result.success) {
      throw createCompilationError(
        result.error || 'Compilation failed',
        undefined,
        {
          templateType,
          features: premiumFeatures
        }
      )
    }
    
    if (!result.bytecode || result.bytecode === '0x') {
      throw new Error('Compilation succeeded but bytecode is empty')
    }
    
    console.log(`✅ Contract compiled successfully in ${result.compilationTime || 0}ms!`)
    
    if (result.warnings && result.warnings.length > 0) {
      console.warn('⚠️  Compilation warnings:', result.warnings)
    }
    
    return {
      bytecode: result.bytecode,
      abi: result.abi || []
    }
  } catch (error: any) {
    console.error('❌ Backend compilation error:', error)
    
    // Erreurs de connectivité
    if (error.message.includes('fetch failed') || error.message.includes('Failed to fetch')) {
      throw new Error('🔌 Compiler backend is not available. Please check your network connection.\n\nPossible solutions:\n- Check if the backend is running\n- Verify your internet connection\n- Try again in a few moments')
    }
    
    // Erreurs CORS
    if (error.message.includes('CORS')) {
      throw new Error('🔐 CORS error: Backend configuration issue. Please contact support.')
    }
    
    // Erreurs de timeout
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      throw new Error('⏱️ Request timeout: The compilation is taking too long. Please try again.')
    }
    
    // Re-lancer l'erreur avec plus de contexte
    throw error
  }
}

function getContractName(templateType: TemplateType, params: Record<string, any>): string {
  switch (templateType) {
    case 'token':
      return params.name?.replace(/\s+/g, '') || 'MyToken'
    case 'nft':
      return (params.name?.replace(/\s+/g, '') || 'MyNFT') + 'NFT'
    case 'dao':
      return (params.name?.replace(/\s+/g, '') || 'MyDAO') + 'DAO'
    case 'lock':
      return 'TokenLock'
    default:
      return 'Contract'
  }
}

/**
 * Test de connectivité API
 */
export async function testApiConnectivity(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('🔍 Testing API connectivity to:', API_BASE_URL)
    
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (response.ok) {
      return { success: true, message: 'Backend API is accessible' }
    } else {
      return { success: false, message: `API returned ${response.status}: ${response.statusText}` }
    }
  } catch (error: any) {
    return { success: false, message: `API connectivity failed: ${error.message}` }
  }
}

export async function warmupCache(): Promise<{ success: boolean }> {
  console.log('🔥 Cache warmup disabled - using Foundry compilation')
  return { success: true }
}

export async function clearCache(): Promise<{ success: boolean }> {
  console.log('🧹 Cache clear disabled - using Foundry compilation')
  return { success: true }
}

export async function getPerformanceInfo(): Promise<{
  precompiledTemplates: boolean
  cacheStats: any
  recommendations: string[]
}> {
  return {
    precompiledTemplates: false,
    cacheStats: null,
    recommendations: ['Using Foundry for real-time compilation - no pre-compilation needed']
  }
}