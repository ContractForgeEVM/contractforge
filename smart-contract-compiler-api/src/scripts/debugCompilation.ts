#!/usr/bin/env ts-node

/**
 * 🔍 DIAGNOSTIC AVANCÉ DE COMPILATION
 * Script pour identifier les causes racines des échecs de compilation
 */

import { generateContractCode } from '../utils/contractGenerator'

interface DiagnosticTest {
  name: string
  templateType: string
  features: string[]
  params: Record<string, any>
}

interface DiagnosticResult {
  test: DiagnosticTest
  success: boolean
  issues: string[]
  sourceCode?: string
  contractName?: string
  sourceCodeLength?: number
  syntaxIssues?: string[]
}

class CompilationDiagnostic {
  
  async runDiagnostic(): Promise<void> {
    console.log('🔍 === DIAGNOSTIC DE COMPILATION AVANCÉ ===\n')
    
    // Tests problématiques identifiés
    const problematicTests: DiagnosticTest[] = [
      {
        name: 'Votes + Snapshot Conflict',
        templateType: 'token',
        features: ['votes', 'snapshot'],
        params: { name: 'TestToken', symbol: 'TTK', totalSupply: '1000000' }
      },
      {
        name: 'Dynamic NFT Basic',
        templateType: 'dynamic-nft',
        features: [],
        params: { name: 'TestNFT', symbol: 'TNFT', maxSupply: '1000' }
      },
      {
        name: 'Loyalty Program Basic',
        templateType: 'loyalty-program',
        features: [],
        params: { name: 'TestLoyalty', pointsPerPurchase: 10 }
      },
      {
        name: 'Token avec toutes features',
        templateType: 'token',
        features: ['votes', 'snapshot', 'pausable', 'mintable'],
        params: { name: 'FullToken', symbol: 'FULL', totalSupply: '1000000' }
      }
    ]

    const results: DiagnosticResult[] = []
    
    for (const test of problematicTests) {
      console.log(`\n🧪 === TEST: ${test.name} ===`)
      const result = await this.diagnoseTest(test)
      results.push(result)
      
      // Affichage immédiat des résultats
      this.displayTestResult(result)
    }
    
    console.log('\n📊 === SYNTHÈSE DU DIAGNOSTIC ===')
    this.displaySummary(results)
  }
  
  async diagnoseTest(test: DiagnosticTest): Promise<DiagnosticResult> {
    const result: DiagnosticResult = {
      test,
      success: false,
      issues: []
    }
    
    try {
      // 1. Génération du code source
      console.log(`📝 Génération du code pour ${test.templateType}...`)
      const sourceCode = generateContractCode(
        test.templateType as any,
        test.params,
        test.features
      )
      
      result.sourceCode = sourceCode
      result.sourceCodeLength = sourceCode.length
      
      // 2. Extraction du nom du contrat
      const contractMatch = sourceCode.match(/contract\s+(\w+)\s+is/)
      result.contractName = contractMatch ? contractMatch[1] : 'UNKNOWN'
      
      console.log(`📋 Contrat détecté: ${result.contractName}`)
      console.log(`📏 Taille du code: ${result.sourceCodeLength} caractères`)
      
      // 3. Analyse syntaxique basique
      result.syntaxIssues = this.analyzeSyntax(sourceCode)
      
      // 4. Test de compilation via API
      const compilationResult = await this.testCompilation(test)
      result.success = compilationResult.success
      
      if (!compilationResult.success) {
        result.issues.push(...compilationResult.issues)
      }
      
    } catch (error: any) {
      result.issues.push(`Erreur génération: ${error.message}`)
    }
    
    return result
  }
  
  analyzeSyntax(sourceCode: string): string[] {
    const issues: string[] = []
    
    // Vérifications syntaxiques de base
    const lines = sourceCode.split('\n')
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      const lineNum = i + 1
      
      // Parenthèses non fermées
      const openParens = (line.match(/\(/g) || []).length
      const closeParens = (line.match(/\)/g) || []).length
      if (openParens !== closeParens && line.includes('function')) {
        issues.push(`Ligne ${lineNum}: Parenthèses non équilibrées`)
      }
      
      // Point-virgules manquants
      if (line.includes('require(') && !line.includes(';') && !line.includes('{')) {
        issues.push(`Ligne ${lineNum}: Point-virgule potentiellement manquant`)
      }
      
      // Imports malformés
      if (line.startsWith('import') && !line.includes(';')) {
        issues.push(`Ligne ${lineNum}: Import malformé`)
      }
      
      // Override issues
      if (line.includes('override(') && line.includes('ERC20,')) {
        const overrideContent = line.match(/override\(([^)]+)\)/)?.[1] || ''
        const extensions = overrideContent.split(',').map(s => s.trim())
        if (extensions.includes('ERC20Votes') && extensions.includes('ERC20Snapshot')) {
          issues.push(`Ligne ${lineNum}: Conflit ERC20Votes + ERC20Snapshot détecté`)
        }
      }
    }
    
    // Vérifications globales
    if (!sourceCode.includes('// SPDX-License-Identifier:')) {
      issues.push('SPDX License manquante')
    }
    
    if (!sourceCode.includes('pragma solidity')) {
      issues.push('Pragma Solidity manquant')
    }
    
    // Vérification des noms de contrat
    const contractNames = sourceCode.match(/contract\s+(\w+)/g) || []
    if (contractNames.length === 0) {
      issues.push('Aucun contrat détecté')
    } else if (contractNames.length > 1) {
      issues.push('Plusieurs contrats détectés (peut causer des conflits)')
    }
    
    return issues
  }
  
  async testCompilation(test: DiagnosticTest): Promise<{success: boolean, issues: string[]}> {
    const issues: string[] = []
    
    try {
      const response = await fetch('http://localhost:3004/api/web/compile/template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateType: test.templateType,
          features: test.features,
          params: test.params,
          featureConfigs: {}
        })
      })
      
      const data = await response.json() as any
      
      if (response.ok && data.success) {
        return { success: true, issues: [] }
      } else {
        issues.push(`API Error: ${response.status}`)
        if (data.error) issues.push(`Erreur: ${data.error}`)
        if (data.details) {
          data.details.forEach((detail: any) => {
            if (detail.message) issues.push(`Détail: ${detail.message}`)
          })
        }
        return { success: false, issues }
      }
      
    } catch (error: any) {
      issues.push(`Erreur réseau: ${error.message}`)
      return { success: false, issues }
    }
  }
  
  displayTestResult(result: DiagnosticResult): void {
    const status = result.success ? '✅ SUCCÈS' : '❌ ÉCHEC'
    console.log(`${status} - ${result.test.name}`)
    
    if (result.contractName) {
      console.log(`   📋 Contrat: ${result.contractName}`)
    }
    
    if (result.sourceCodeLength) {
      console.log(`   📏 Taille: ${result.sourceCodeLength} caractères`)
    }
    
    if (result.syntaxIssues && result.syntaxIssues.length > 0) {
      console.log(`   🚨 Problèmes syntaxiques (${result.syntaxIssues.length}):`)
      result.syntaxIssues.forEach(issue => {
        console.log(`      • ${issue}`)
      })
    }
    
    if (result.issues.length > 0) {
      console.log(`   ❌ Problèmes de compilation (${result.issues.length}):`)
      result.issues.forEach(issue => {
        console.log(`      • ${issue}`)
      })
    }
    
    if (result.success) {
      console.log(`   ✨ Compilation réussie !`)
    }
  }
  
  displaySummary(results: DiagnosticResult[]): void {
    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => r.success === false).length
    
    console.log(`\n📈 Résultats: ${successful}/${results.length} réussis (${Math.round(successful/results.length*100)}%)`)
    
    // Analyse des problèmes les plus fréquents
    const allIssues: string[] = []
    const allSyntaxIssues: string[] = []
    
    results.forEach(result => {
      allIssues.push(...result.issues)
      if (result.syntaxIssues) {
        allSyntaxIssues.push(...result.syntaxIssues)
      }
    })
    
    if (allSyntaxIssues.length > 0) {
      console.log(`\n🚨 Problèmes syntaxiques les plus fréquents:`)
      const syntaxCounts = this.countOccurrences(allSyntaxIssues)
      Object.entries(syntaxCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .forEach(([issue, count]) => {
          console.log(`   • ${issue} (${count}x)`)
        })
    }
    
    if (allIssues.length > 0) {
      console.log(`\n❌ Erreurs de compilation les plus fréquentes:`)
      const issueCounts = this.countOccurrences(allIssues)
      Object.entries(issueCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .forEach(([issue, count]) => {
          console.log(`   • ${issue} (${count}x)`)
        })
    }
    
    console.log('\n💡 RECOMMANDATIONS:')
    
    if (allSyntaxIssues.some(issue => issue.includes('ERC20Votes + ERC20Snapshot'))) {
      console.log('   • Résoudre le conflit ERC20Votes + ERC20Snapshot')
    }
    
    if (allIssues.some(issue => issue.includes('Artifact not found'))) {
      console.log('   • Vérifier les noms de contrats générés')
      console.log('   • Analyser les logs Foundry détaillés')
    }
    
    if (allSyntaxIssues.some(issue => issue.includes('Import malformé'))) {
      console.log('   • Corriger les imports OpenZeppelin')
    }
    
    console.log('\n🔧 Pour un diagnostic plus approfondi:')
    console.log('   • Exécuter: npx ts-node src/scripts/debugCompilation.ts --verbose')
    console.log('   • Analyser: logs/foundry-compilation.log')
    console.log('   • Tester individuellement chaque template avec curl')
  }
  
  countOccurrences(items: string[]): Record<string, number> {
    return items.reduce((acc, item) => {
      // Simplifier les messages pour regrouper les similaires
      const simplified = item
        .replace(/Ligne \d+:/, 'Ligne X:')
        .replace(/contract \w+/, 'contract X')
      acc[simplified] = (acc[simplified] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }
}

// Exécution du diagnostic
if (require.main === module) {
  const diagnostic = new CompilationDiagnostic()
  diagnostic.runDiagnostic().catch(console.error)
}

export { CompilationDiagnostic } 