#!/usr/bin/env ts-node

/**
 * 🔬 ANALYSE PROFONDE DES LOGS FOUNDRY
 * Script pour diagnostiquer en détail les échecs de compilation Foundry
 */

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'
import { generateContractCode } from '../utils/contractGenerator'

interface FoundryDebugResult {
  templateType: string
  contractName: string
  sourceCode: string
  tempDir: string
  foundryOutput?: string
  artifactFound: boolean
  compilationError?: string
  forgeVersion?: string
  dependencies: string[]
  issues: string[]
}

class FoundryDeepDebug {
  
  async debugTemplate(templateType: string, features: string[] = [], params: Record<string, any> = {}): Promise<FoundryDebugResult> {
    console.log(`\n🔬 === DEBUG FOUNDRY POUR ${templateType.toUpperCase()} ===`)
    
    const result: FoundryDebugResult = {
      templateType,
      contractName: '',
      sourceCode: '',
      tempDir: '',
      artifactFound: false,
      dependencies: [],
      issues: []
    }
    
    try {
      // 1. Générer le code source
      console.log('📝 1. Génération du code source...')
      result.sourceCode = generateContractCode(templateType as any, params, features)
      
      // Extraire le nom du contrat
      const contractMatch = result.sourceCode.match(/contract\s+(\w+)\s+is/)
      result.contractName = contractMatch ? contractMatch[1] : `${templateType.replace(/-/g, '')}Contract`
      
      console.log(`   📋 Contrat: ${result.contractName}`)
      console.log(`   📏 Taille: ${result.sourceCode.length} caractères`)
      
      // 2. Créer un environnement Foundry temporaire
      console.log('🏗️  2. Création environnement Foundry...')
      result.tempDir = await this.createFoundryEnvironment(result.sourceCode, result.contractName)
      console.log(`   📁 Répertoire: ${result.tempDir}`)
      
      // 3. Analyser les dépendances
      console.log('📦 3. Analyse des dépendances...')
      result.dependencies = this.analyzeDependencies(result.sourceCode)
      console.log(`   🔍 Dépendances trouvées: ${result.dependencies.join(', ')}`)
      
      // 4. Vérifier Foundry et OpenZeppelin
      console.log('🔧 4. Vérification de l\'environnement...')
      result.forgeVersion = this.getForgeVersion()
      console.log(`   ⚡ Forge version: ${result.forgeVersion}`)
      
      await this.setupOpenZeppelin(result.tempDir)
      
      // 5. Tentative de compilation avec logs détaillés
      console.log('🔥 5. Compilation avec logs détaillés...')
      const compilationResult = await this.attemptCompilation(result.tempDir, result.contractName)
      result.foundryOutput = compilationResult.output
      result.compilationError = compilationResult.error
      
      // 6. Vérifier la présence des artifacts
      console.log('🎯 6. Vérification des artifacts...')
      result.artifactFound = this.checkArtifacts(result.tempDir, result.contractName)
      
      // 7. Analyser les problèmes
      console.log('🚨 7. Analyse des problèmes...')
      result.issues = this.analyzeIssues(result)
      
    } catch (error: any) {
      result.issues.push(`Erreur globale: ${error.message}`)
    }
    
    this.displayResults(result)
    return result
  }
  
  async createFoundryEnvironment(sourceCode: string, contractName: string): Promise<string> {
    const tempDir = `/tmp/foundry-debug-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Créer la structure Foundry
    execSync(`mkdir -p ${tempDir}/src ${tempDir}/lib`, { shell: '/bin/bash' })
    
    // Initialiser git (requis par Foundry)
    execSync(`cd ${tempDir} && git init`, { shell: '/bin/bash' })
    execSync(`cd ${tempDir} && git config user.email "debug@foundry.local"`, { shell: '/bin/bash' })
    execSync(`cd ${tempDir} && git config user.name "Foundry Debug"`, { shell: '/bin/bash' })
    
    // Créer foundry.toml
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
verbosity = 3

[fmt]
line_length = 120
tab_width = 4
bracket_spacing = false
`
    
    fs.writeFileSync(path.join(tempDir, 'foundry.toml'), foundryConfig)
    
    // Écrire le contrat
    fs.writeFileSync(path.join(tempDir, 'src', 'Contract.sol'), sourceCode)
    
    return tempDir
  }
  
  analyzeDependencies(sourceCode: string): string[] {
    const dependencies: string[] = []
    const importLines = sourceCode.match(/import\s+"[^"]+"/g) || []
    
    importLines.forEach(line => {
      const match = line.match(/import\s+"([^"]+)"/)
      if (match) {
        dependencies.push(match[1])
      }
    })
    
    return dependencies
  }
  
  getForgeVersion(): string {
    try {
      return execSync('forge --version', { encoding: 'utf8' }).trim()
    } catch {
      return 'Non installé'
    }
  }
  
  async setupOpenZeppelin(tempDir: string): Promise<void> {
    try {
      // Créer les remappings pour OpenZeppelin
      const remappings = [
        '@openzeppelin/contracts/=lib/openzeppelin-contracts/contracts/',
        '@openzeppelin/=lib/openzeppelin-contracts/'
      ]
      fs.writeFileSync(path.join(tempDir, 'remappings.txt'), remappings.join('\n'))
      
      // Copier OpenZeppelin depuis le cache si disponible
      const cacheDir = '/tmp/openzeppelin-contracts-cache'
      const targetDir = path.join(tempDir, 'lib', 'openzeppelin-contracts')
      
      if (fs.existsSync(cacheDir)) {
        console.log('   📦 Copie OpenZeppelin depuis le cache...')
        execSync(`cp -r ${cacheDir}/. ${targetDir}`, { shell: '/bin/bash' })
      } else {
        console.log('   📦 Installation OpenZeppelin...')
        execSync(`cd ${tempDir} && git submodule add https://github.com/OpenZeppelin/openzeppelin-contracts.git lib/openzeppelin-contracts`, { shell: '/bin/bash' })
      }
      
    } catch (error: any) {
      console.log(`   ⚠️  Erreur setup OpenZeppelin: ${error.message}`)
    }
  }
  
  async attemptCompilation(tempDir: string, contractName: string): Promise<{output: string, error?: string}> {
    try {
      console.log('   🔥 Tentative de compilation...')
      const output = execSync(`cd ${tempDir} && forge build --json --force`, { 
        encoding: 'utf8',
        stdio: 'pipe'
      })
      
      console.log('   ✅ Compilation réussie !')
      return { output }
      
    } catch (error: any) {
      console.log('   ❌ Compilation échouée')
      return { 
        output: error.stdout || '',
        error: error.stderr || error.message
      }
    }
  }
  
  checkArtifacts(tempDir: string, contractName: string): boolean {
    const outDir = path.join(tempDir, 'out')
    
    if (!fs.existsSync(outDir)) {
      console.log('   ❌ Répertoire out/ inexistant')
      return false
    }
    
    // Lister le contenu du répertoire out
    const outContents = fs.readdirSync(outDir)
    console.log(`   📁 Contenu out/: ${outContents.join(', ')}`)
    
    // Chercher le fichier Contract.sol
    const contractDir = path.join(outDir, 'Contract.sol')
    if (!fs.existsSync(contractDir)) {
      console.log('   ❌ Répertoire Contract.sol/ inexistant')
      return false
    }
    
    const contractFiles = fs.readdirSync(contractDir)
    console.log(`   📄 Fichiers dans Contract.sol/: ${contractFiles.join(', ')}`)
    
    // Chercher l'artifact du contrat spécifique
    const expectedArtifact = `${contractName}.json`
    const artifactPath = path.join(contractDir, expectedArtifact)
    
    if (fs.existsSync(artifactPath)) {
      console.log(`   ✅ Artifact trouvé: ${expectedArtifact}`)
      return true
    } else {
      console.log(`   ❌ Artifact manquant: ${expectedArtifact}`)
      console.log(`   🔍 Artifacts disponibles: ${contractFiles.filter(f => f.endsWith('.json')).join(', ')}`)
      return false
    }
  }
  
  analyzeIssues(result: FoundryDebugResult): string[] {
    const issues: string[] = []
    
    // Analyser les erreurs de compilation
    if (result.compilationError) {
      console.log('\n🚨 ERREURS DE COMPILATION:')
      console.log(result.compilationError)
      
      if (result.compilationError.includes('undeclared identifier')) {
        issues.push('Identifiants non déclarés détectés')
      }
      
      if (result.compilationError.includes('DeclarationError')) {
        issues.push('Erreurs de déclaration détectées')
      }
      
      if (result.compilationError.includes('import')) {
        issues.push('Problèmes d\'imports détectés')
      }
    }
    
    // Analyser l'output Foundry
    if (result.foundryOutput) {
      try {
        const forgeData = JSON.parse(result.foundryOutput)
        
        if (forgeData.errors && forgeData.errors.length > 0) {
          console.log('\n🚨 ERREURS FOUNDRY:')
          forgeData.errors.forEach((error: any) => {
            console.log(`   • ${error.message || error}`)
            issues.push(`Foundry: ${error.message || error}`)
          })
        }
        
        if (forgeData.contracts) {
          const contractKeys = Object.keys(forgeData.contracts)
          console.log(`\n📋 Contrats compilés: ${contractKeys.join(', ')}`)
        }
        
      } catch {
        // Output n'est pas du JSON valide
        if (result.foundryOutput.includes('Error')) {
          issues.push('Erreurs dans l\'output Foundry (format non-JSON)')
        }
      }
    }
    
    // Vérifier les noms de contrats
    if (result.contractName.toLowerCase().includes('contract')) {
      issues.push('Nom de contrat potentiellement problématique (contient "Contract")')
    }
    
    // Vérifier les dépendances manquantes
    if (result.dependencies.includes('@openzeppelin/contracts') && result.issues.includes('import')) {
      issues.push('Problème probable avec les imports OpenZeppelin')
    }
    
    return issues
  }
  
  displayResults(result: FoundryDebugResult): void {
    console.log(`\n📊 === RÉSULTATS DEBUG ${result.templateType.toUpperCase()} ===`)
    
    console.log(`✅ Code généré: ${result.sourceCode.length} caractères`)
    console.log(`📋 Nom contrat: ${result.contractName}`)
    console.log(`🔧 Forge: ${result.forgeVersion}`)
    console.log(`📦 Dépendances: ${result.dependencies.length}`)
    console.log(`🎯 Artifact trouvé: ${result.artifactFound ? '✅' : '❌'}`)
    
    if (result.issues.length > 0) {
      console.log(`\n🚨 PROBLÈMES IDENTIFIÉS (${result.issues.length}):`)
      result.issues.forEach(issue => {
        console.log(`   • ${issue}`)
      })
    }
    
    if (result.tempDir) {
      console.log(`\n📁 Répertoire de debug conservé: ${result.tempDir}`)
      console.log(`   Pour analyser manuellement:`)
      console.log(`   cd ${result.tempDir}`)
      console.log(`   forge build --force -vvv`)
      console.log(`   ls -la out/Contract.sol/`)
    }
  }
  
  async cleanup(tempDir: string): Promise<void> {
    try {
      execSync(`rm -rf ${tempDir}`, { shell: '/bin/bash' })
      console.log(`🧹 Nettoyage: ${tempDir} supprimé`)
    } catch (error) {
      console.log(`⚠️  Impossible de nettoyer: ${tempDir}`)
    }
  }
}

// Fonction utilitaire pour tester un seul template
async function debugSingleTemplate(templateType: string, features: string[] = []): Promise<void> {
  const debugTool = new FoundryDeepDebug()
  
  const params = {
    'token': { name: 'TestToken', symbol: 'TTK', totalSupply: '1000000' },
    'nft': { name: 'TestNFT', symbol: 'TNFT', maxSupply: '1000' },
    'dynamic-nft': { name: 'TestDynamicNFT', symbol: 'TDNFT', maxSupply: '1000' },
    'loyalty-program': { name: 'TestLoyalty', pointsPerPurchase: 10 }
  }[templateType] || {}
  
  await debugTool.debugTemplate(templateType, features, params)
}

// Exécution selon les arguments
if (require.main === module) {
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    console.log('🔬 DEBUG FOUNDRY - Usage:')
    console.log('  npx ts-node src/scripts/deepFoundryDebug.ts <template> [features...]')
    console.log('')
    console.log('Exemples:')
    console.log('  npx ts-node src/scripts/deepFoundryDebug.ts token')
    console.log('  npx ts-node src/scripts/deepFoundryDebug.ts token votes snapshot')
    console.log('  npx ts-node src/scripts/deepFoundryDebug.ts dynamic-nft')
    console.log('  npx ts-node src/scripts/deepFoundryDebug.ts loyalty-program')
    process.exit(1)
  }
  
  const templateType = args[0]
  const features = args.slice(1)
  
  debugSingleTemplate(templateType, features).catch(console.error)
}

export { FoundryDeepDebug, debugSingleTemplate } 