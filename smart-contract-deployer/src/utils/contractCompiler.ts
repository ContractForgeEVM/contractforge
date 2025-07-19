import type { TemplateType } from '../types'
import { compileWithRemix } from './remixCompiler'
export const compileContract = async (
  templateType: TemplateType,
  contractParams: Record<string, any>,
  premiumFeatures: string[] = []
): Promise<{ bytecode: string; abi: any[] }> => {
  console.log('🚀 Starting contract compilation...')
  console.log(`📋 Template: ${templateType}`)
  console.log(`🎯 Parameters:`, contractParams)
  console.log(`✨ Premium features: ${premiumFeatures.length > 0 ? premiumFeatures.join(', ') : 'none'}`)
  try {
    const compiled = await compileWithRemix(templateType, contractParams, premiumFeatures)
    if (!compiled.bytecode || compiled.bytecode === '0x') {
      throw new Error('Failed to compile contract - bytecode not available')
    }
    console.log('✅ Contract compiled successfully!')
    console.log(`📏 Bytecode length: ${compiled.bytecode.length} characters`)
    console.log(`🔧 ABI entries: ${compiled.abi.length}`)
    if (premiumFeatures.length > 0) {
      console.log(`⚡ Premium features applied: ${premiumFeatures.join(', ')}`)
    }
    return compiled
  } catch (error) {
    console.error('❌ Compilation error:', error)
    throw error
  }
}