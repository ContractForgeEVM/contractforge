import { compileWithFoundry } from './foundryCompiler'
import { getOpenZeppelinSources } from './openzeppelin'
import { Worker, isMainThread, parentPort } from 'worker_threads'
import * as os from 'os'
interface CompilationResult {
  bytecode: string
  abi: any[]
  warnings: string[]
  compilationTime?: number
  memoryUsage?: number
}
const WORKER_COUNT = Math.min(os.cpus().length, 8)
const workers: Worker[] = []
let workerIndex = 0
if (isMainThread) {
  console.log(`🔧 Initializing ${WORKER_COUNT} compilation workers for high-performance compilation`)
}
export async function compileContract(
  sourceCode: string,
  contractName: string
): Promise<CompilationResult> {
  try {
    console.log(`🔥 Compiling contract with Foundry: ${contractName}`)
    return await compileWithFoundry(sourceCode, contractName)
  } catch (error: any) {
    console.error('❌ Foundry compilation failed:', error)
    throw error
  }
}