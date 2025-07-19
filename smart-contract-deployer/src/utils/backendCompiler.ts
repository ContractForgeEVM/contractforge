import { generateContractCode } from './contractGenerator'
import type { TemplateType } from '../types'

const API_BASE_URL = 'https://contractforge.io'
const COMPILER_API_URL = `${API_BASE_URL}/api/web/compile/foundry`

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
  premiumFeatures: string[] = []
): Promise<{ bytecode: string; abi: any[] }> {
  try {
    const sourceCode = generateContractCode(templateType, params)
    const contractName = getContractName(templateType, params)
    
    console.log(`🚀 Compiling ${contractName} with Foundry via backend API...`)
    console.log(`📋 Template: ${templateType}, Features: ${premiumFeatures.length > 0 ? premiumFeatures.join(', ') : 'none'}`)
    
    const response = await fetch(COMPILER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sourceCode: sourceCode,
        contractName,
        templateType,
        features: premiumFeatures,
        params
      })
    })
    
    const result: CompilationResponse = await response.json()
    
    if (!result.success) {
      throw new Error(result.error || 'Compilation failed')
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
    if (error.message.includes('fetch failed') || error.message.includes('Failed to fetch')) {
      throw new Error('Compiler backend is not available. Please check your network connection.')
    }
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

// Fonctions simplifiées pour la compatibilité - désactivées car nous utilisons Foundry
export async function getCacheStats(): Promise<{ success: boolean }> {
  console.log('📊 Cache stats disabled - using Foundry compilation')
  return { success: true }
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