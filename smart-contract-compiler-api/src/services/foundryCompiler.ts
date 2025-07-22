import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'
import { getOpenZeppelinSources } from './openzeppelin'
interface CompilationResult {
  bytecode: string
  abi: any[]
  warnings: string[]
  compilationTime?: number
  memoryUsage?: number
}
const OPENZEPPELIN_CACHE_DIR = '/tmp/openzeppelin-cache'
async function ensureOpenZeppelinCache() {
  if (!fs.existsSync(OPENZEPPELIN_CACHE_DIR)) {
    console.log('📦 Setting up OpenZeppelin cache (one-time setup)...')
    execSync(`mkdir -p ${OPENZEPPELIN_CACHE_DIR}`, { shell: '/bin/bash' })
    execSync(`git init`, { cwd: OPENZEPPELIN_CACHE_DIR, shell: '/bin/bash' })
    execSync(`git remote add origin https://github.com/OpenZeppelin/openzeppelin-contracts.git`, {
      cwd: OPENZEPPELIN_CACHE_DIR,
      shell: '/bin/bash'
    })
    execSync(`git fetch origin v4.9.0 --depth=1`, {
      cwd: OPENZEPPELIN_CACHE_DIR,
      shell: '/bin/bash'
    })
    execSync(`git checkout FETCH_HEAD`, {
      cwd: OPENZEPPELIN_CACHE_DIR,
      shell: '/bin/bash'
    })
    console.log('✅ OpenZeppelin cache created successfully')
  }
}
export async function compileWithFoundry(
  sourceCode: string,
  contractName: string
): Promise<CompilationResult> {
  const startTime = process.hrtime.bigint()
  const initialMemory = process.memoryUsage()
  try {
    console.log(`🔥 Foundry compilation for: ${contractName}`)
    const tempDir = `/tmp/foundry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const execOptions = {
      shell: '/bin/bash',
      cwd: tempDir,
      encoding: 'utf8' as const,
      timeout: 30000,
      stdio: 'pipe' as const
    }
    console.log(`📁 Creating temp directory: ${tempDir}`)
    execSync(`mkdir -p ${tempDir}/src ${tempDir}/lib`, { shell: '/bin/bash' })
    execSync(`git init`, { ...execOptions, cwd: tempDir })
    execSync(`git config user.email "forge@foundry.local"`, { ...execOptions, cwd: tempDir })
    execSync(`git config user.name "Foundry"`, { ...execOptions, cwd: tempDir })
    const foundryConfig = `
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
optimizer = true
optimizer_runs = 1000
via_ir = false
solc_version = "0.8.28"
evm_version = "paris"
[fmt]
line_length = 120
tab_width = 4
bracket_spacing = false
`
    fs.writeFileSync(path.join(tempDir, 'foundry.toml'), foundryConfig)
    fs.writeFileSync(path.join(tempDir, 'src', 'Contract.sol'), sourceCode)
    if (sourceCode.includes('@openzeppelin')) {
      console.log('📦 Installing OpenZeppelin for Foundry...')
      try {
        await ensureOpenZeppelinCache()
        const ozTargetPath = path.join(tempDir, 'lib', 'openzeppelin-contracts')
        console.log('⚡ Copying OpenZeppelin from cache...')
        execSync(`cp -r ${OPENZEPPELIN_CACHE_DIR}/. ${ozTargetPath}`, { shell: '/bin/bash' })
        if (!fs.existsSync(ozTargetPath)) {
          throw new Error('OpenZeppelin installation failed')
        }
        console.log('✅ OpenZeppelin installed successfully')
        const remappings = [
          '@openzeppelin/contracts/=lib/openzeppelin-contracts/contracts/',
          '@openzeppelin/=lib/openzeppelin-contracts/'
        ]
        fs.writeFileSync(path.join(tempDir, 'remappings.txt'), remappings.join('\n'))
        console.log('✅ OpenZeppelin remappings configured')
      } catch (e: any) {
        console.error('❌ OpenZeppelin installation failed:', e.message)
        throw new Error(`OpenZeppelin installation failed: ${e.message}`)
      }
    } else {
      fs.writeFileSync(path.join(tempDir, 'remappings.txt'), '')
    }
    const compileStart = process.hrtime.bigint()
    console.log(`⚡ Starting Foundry compilation...`)
    try {
      const compileResult = execSync(`forge build --json`, execOptions)
      const compileEnd = process.hrtime.bigint()
      const compilationTime = Number(compileEnd - compileStart) / 1000000
      console.log(`⚡ Foundry compilation took: ${compilationTime.toFixed(2)}ms`)
      const outDir = path.join(tempDir, 'out', 'Contract.sol')
      const artifactPath = path.join(outDir, `${contractName}.json`)
      if (!fs.existsSync(artifactPath)) {
        throw new Error(`Artifact not found for contract ${contractName}`)
      }
      const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'))
      const endTime = process.hrtime.bigint()
      const totalTime = Number(endTime - startTime) / 1000000
      const finalMemory = process.memoryUsage()
      const memoryDelta = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024
      console.log(`✅ Foundry compilation successful in ${totalTime.toFixed(2)}ms`)
      console.log(`📊 Memory usage: ${memoryDelta.toFixed(2)}MB`)
      console.log(`💾 Available system memory: ${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`)
      try {
        execSync(`rm -rf ${tempDir}`, { shell: '/bin/bash' })
      } catch (e) {
        console.log('⚠️  Cleanup warning:', e)
      }
      return {
        bytecode: artifact.bytecode?.object || artifact.bytecode,
        abi: artifact.abi,
        warnings: [],
        compilationTime: totalTime,
        memoryUsage: memoryDelta
      }
    } catch (compileError: any) {
      console.error('❌ Foundry compilation error:', compileError.message)
      console.error('❌ Foundry compilation stderr:', compileError.stderr)
      const error: any = new Error('Foundry compilation failed')
      error.errors = [{
        message: compileError.message || 'Unknown compilation error',
        type: 'foundry-error',
        component: 'forge',
        stderr: compileError.stderr
      }]
      throw error
    }
  } catch (error: any) {
    console.error('❌ Foundry service error:', error)
    if (error.code === 'ENOENT') {
      console.error('❌ Shell or command not found. Available tools:')
      try {
        execSync('which bash && which forge && ls -la /bin/', {
          shell: '/bin/bash',
          stdio: 'inherit'
        })
      } catch (debugError) {
        console.error('❌ Debug command failed:', debugError)
      }
    }
    throw error
  }
}