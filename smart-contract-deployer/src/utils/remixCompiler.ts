import type { TemplateType } from '../types'
import { compileContract as compileSolidity } from './solidityCompiler'
import { compileWithBackend } from './backendCompiler'
export async function compileWithRemix(
  templateType: TemplateType,
  params: Record<string, any>,
  premiumFeatures: string[] = []
): Promise<{ bytecode: string; abi: any[] }> {
  try {
    console.log('🚀 Attempting ultra-fast Foundry compilation via backend API...')
    return await compileWithBackend(templateType, params, premiumFeatures)
  } catch (error) {
    console.log('⚠️  Backend compiler not available, falling back to local compiler')
    console.warn('Backend error:', error)
    if (premiumFeatures.length > 0) {
      console.warn('🔧 Some premium features may not be available in local compilation mode')
    }
    return compileSolidity(templateType, params)
  }
}