import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'
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
    execSync(`git fetch origin v4.9.6 --depth=1`, {
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
    
    console.log(`🔍 DEBUG: Generated contract (first 1000 chars):`)
    console.log(sourceCode.substring(0, 1000))
    console.log(`🔍 DEBUG: Full contract length: ${sourceCode.length} characters`)
    
    // Utiliser le nom du contrat pour le fichier
    const fileName = `${contractName}.sol`
    fs.writeFileSync(path.join(tempDir, 'src', fileName), sourceCode)
    if (sourceCode.includes('@openzeppelin')) {
      console.log('📦 Installing OpenZeppelin for Foundry...')
      try {
        await ensureOpenZeppelinCache()
        const ozTargetPath = path.join(tempDir, 'lib', 'openzeppelin-contracts')
        console.log('⚡ Copying OpenZeppelin from cache...')
        console.log(`🔍 DEBUG: Source: ${OPENZEPPELIN_CACHE_DIR}`)
        console.log(`🔍 DEBUG: Target: ${ozTargetPath}`)
        execSync(`cp -r ${OPENZEPPELIN_CACHE_DIR}/. ${ozTargetPath}`, { shell: '/bin/bash' })
        if (!fs.existsSync(ozTargetPath)) {
          throw new Error('OpenZeppelin installation failed')
        }
        console.log(`🔍 DEBUG: Files copied successfully`)
        console.log(`🔍 DEBUG: ERC721.sol exists: ${fs.existsSync(path.join(ozTargetPath, 'contracts/token/ERC721/ERC721.sol'))}`)
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
      console.log(`🔍 DEBUG: Executing forge build --json...`)
      const compileResult = execSync(`forge build --json`, execOptions)
      const compileEnd = process.hrtime.bigint()
      const compilationTime = Number(compileEnd - compileStart) / 1000000
      console.log(`⚡ Foundry compilation took: ${compilationTime.toFixed(2)}ms`)
      
      console.log(`🔍 DEBUG: Forge output length: ${compileResult.length} characters`)
      console.log(`🔍 DEBUG: Forge output (first 500 chars):`, compileResult.toString().substring(0, 500))
      
      // Tenter de parser le JSON pour voir s'il y a des erreurs
      try {
        const forgeOutput = JSON.parse(compileResult.toString())
        console.log(`🔍 DEBUG: Forge JSON parsed successfully`)
        console.log(`🔍 DEBUG: Forge errors:`, forgeOutput.errors || 'none')
        console.log(`🔍 DEBUG: Forge contracts keys:`, Object.keys(forgeOutput.contracts || {}))
      } catch (parseError: any) {
        console.log(`🔍 DEBUG: Failed to parse forge output as JSON:`, parseError.message)
      }
      
      // DEBUG: Vérifier la structure des fichiers de sortie
      console.log(`🔍 DEBUG: Checking output structure for contract ${contractName}`)
      const outDir = path.join(tempDir, 'out', fileName)
      console.log(`🔍 DEBUG: Looking in directory: ${outDir}`)
      
      if (fs.existsSync(outDir)) {
        const files = fs.readdirSync(outDir)
        console.log(`🔍 DEBUG: Files found in output directory:`, files)
      } else {
        console.log(`🔍 DEBUG: Output directory does not exist, checking ${tempDir}/out`)
        if (fs.existsSync(path.join(tempDir, 'out'))) {
          const outContents = fs.readdirSync(path.join(tempDir, 'out'))
          console.log(`🔍 DEBUG: Contents of out directory:`, outContents)
          
          // Regarder dans chaque sous-dossier
          outContents.forEach(item => {
            const itemPath = path.join(tempDir, 'out', item)
            if (fs.statSync(itemPath).isDirectory()) {
              console.log(`🔍 DEBUG: Contents of ${item}:`, fs.readdirSync(itemPath))
            }
          })
        } else {
          console.log(`🔍 DEBUG: NO out directory found at all!`)
        }
      }
      
      const artifactPath = path.join(outDir, `${contractName}.json`)
      console.log(`🔍 DEBUG: Expected artifact path: ${artifactPath}`)
      console.log(`🔍 DEBUG: Artifact exists: ${fs.existsSync(artifactPath)}`)
      
      // DEBUG: Lister tous les fichiers JSON dans le répertoire de sortie
      if (fs.existsSync(path.join(tempDir, 'out'))) {
        console.log(`🔍 DEBUG: Searching for all JSON files in output...`)
        const searchForJsonFiles = (dir: string, prefix = '') => {
          const items = fs.readdirSync(dir)
          items.forEach(item => {
            const itemPath = path.join(dir, item)
            const stat = fs.statSync(itemPath)
            if (stat.isDirectory()) {
              searchForJsonFiles(itemPath, prefix + '  ')
            } else if (item.endsWith('.json')) {
              console.log(`🔍 DEBUG: ${prefix}Found JSON: ${itemPath}`)
            }
          })
        }
        searchForJsonFiles(path.join(tempDir, 'out'))
      }
      
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