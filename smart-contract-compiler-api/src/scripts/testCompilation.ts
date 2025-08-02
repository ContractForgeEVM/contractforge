#!/usr/bin/env ts-node

import * as fs from 'fs'
import * as path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

interface CompilationTest {
  template: string
  features: string[]
  testName: string
}

interface CompilationResult {
  test: CompilationTest
  success: boolean
  error?: string
  details?: any[]
  compilationTime?: number
}

interface TestResults {
  passed: CompilationTest[]
  failed: Array<CompilationResult & { error: string; details: any[] }>
  summary: {
    total: number
    passed: number
    failed: number
    passRate: number
  }
}

// Générer les paramètres de test pour chaque template
function generateTestParams(template: string): Record<string, any> {
  const params: Record<string, any> = {
    'token': {
      name: 'TestToken',
      symbol: 'TTK',
      totalSupply: '1000000',
      decimals: 18
    },
    'nft': {
      name: 'TestNFT',
      symbol: 'TNFT',
      maxSupply: 10000,
      baseURI: 'https://api.test.com/metadata/',
      mintPrice: '0.01'
    },
    'dao': {
      name: 'TestDAO',
      governanceTokenAddress: '0x742d35Cc6634C0532925a3b8D2d1E6D2d2Fdd82a',
      proposalThreshold: '100',
      votingPeriod: '50400'
    },
    'lock': {
      tokenAddress: '0x742d35Cc6634C0532925a3b8D2d1E6D2d2Fdd82a',
      beneficiary: '0x742d35Cc6634C0532925a3b8D2d1E6D2d2Fdd82a',
      unlockTime: '1735689600'
    },
    'liquidity-pool': {
      name: 'TestPool',
      tokenA: '0x742d35Cc6634C0532925a3b8D2d1E6D2d2Fdd82a',
      tokenB: '0x853d35Cc6634C0532925a3b8D2d1E6D2d2Fdd82b',
      fee: '3000'
    },
    'yield-farming': {
      name: 'TestFarm',
      stakingToken: '0x742d35Cc6634C0532925a3b8D2d1E6D2d2Fdd82a',
      rewardToken: '0x853d35Cc6634C0532925a3b8D2d1E6D2d2Fdd82b',
      rewardRate: '0.001'
    }
  }

  return params[template] || {
    name: `Test${template.charAt(0).toUpperCase() + template.slice(1)}`,
    symbol: 'TEST'
  }
}

class CompilationTester {
  private templates = [
    'token', 'nft', 'dao', 'lock', 'liquidity-pool', 'yield-farming',
    'gamefi-token', 'nft-marketplace', 'revenue-sharing', 'loyalty-program',
    'dynamic-nft', 'social-token'
  ]

  private commonFeatures = [
    'pausable', 'mintable', 'burnable', 'capped', 'snapshot'
  ]

  private specificFeatures: Record<string, string[]> = {
    'nft': ['uristorage', 'royalties', 'auction', 'oracle'],
    'dao': ['timelock'],
    'lock': ['vesting'],
    'token': ['permit', 'votes', 'flashmint', 'whitelist']
  }

  generateTests(): CompilationTest[] {
    const tests: CompilationTest[] = []

    for (const template of this.templates) {
      // Test basique sans features
      tests.push({
        template,
        features: [],
        testName: `${template} + []`
      })

      // Tests avec une seule feature
      const availableFeatures = [
        ...this.commonFeatures,
        ...(this.specificFeatures[template] || [])
      ]

      for (const feature of availableFeatures) {
        tests.push({
          template,
          features: [feature],
          testName: `${template} + [${feature}]`
        })
      }

      // Tests avec combinaisons de features
      tests.push({
        template,
        features: ['pausable', 'mintable'],
        testName: `${template} + [pausable, mintable]`
      })

      // Tests spécifiques par template
      if (template === 'nft') {
        tests.push({
          template,
          features: ['pausable', 'burnable'],
          testName: `${template} + [pausable, burnable]`
        }, {
          template,
          features: ['royalties', 'auction'],
          testName: `${template} + [royalties, auction]`
        }, {
          template,
          features: ['pausable', 'uristorage'],
          testName: `${template} + [pausable, uristorage]`
        })
      }

      if (template === 'token') {
        tests.push({
          template,
          features: ['pausable', 'whitelist'],
          testName: `${template} + [pausable, whitelist]`
        }, {
          template,
          features: ['votes', 'snapshot'],
          testName: `${template} + [votes, snapshot]`
        })
      }

      if (template === 'dao') {
        tests.push({
          template,
          features: ['timelock'],
          testName: `${template} + [timelock]`
        })
      }

      if (template === 'lock') {
        tests.push({
          template,
          features: ['vesting'],
          testName: `${template} + [vesting]`
        })
      }
    }

    return tests
  }

  async testCompilation(test: CompilationTest): Promise<CompilationResult> {
    const startTime = Date.now()
    console.log(`  🧪 Testing: ${test.testName}`)

    try {
      // Appeler l'API de compilation
      const apiUrl = 'http://localhost:3004/api/web/compile/template'
      const params = generateTestParams(test.template)

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateType: test.template,
          features: test.features,
          params,
          featureConfigs: {}
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        return {
          test,
          success: false,
          error: `API Error: ${response.status}`,
          details: [errorData],
          compilationTime: Date.now() - startTime
        }
      }

      const result = await response.json() as any

      if (!result.success || !result.bytecode || !result.abi) {
        return {
          test,
          success: false,
          error: result.error || 'Compilation failed',
          details: result.details || [],
          compilationTime: Date.now() - startTime
        }
      }

      console.log(`    ✅ Success (${Date.now() - startTime}ms)`)
      return {
        test,
        success: true,
        compilationTime: Date.now() - startTime
      }

    } catch (error: any) {
      console.log(`    ❌ Failed: ${error.message}`)
      return {
        test,
        success: false,
        error: error.message,
        details: [{ message: error.message, type: 'network-error' }],
        compilationTime: Date.now() - startTime
      }
    }
  }

  async runAllTests(): Promise<TestResults> {
    console.log('🚀 Starting Compilation Test Suite')
    console.log('=' .repeat(50))

    const tests = this.generateTests()
    console.log(`📋 Generated ${tests.length} test cases\n`)

    const results: CompilationResult[] = []
    let passed = 0
    let failed = 0

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i]
      console.log(`[${i + 1}/${tests.length}] ${test.template.toUpperCase()}`)
      
      const result = await this.testCompilation(test)
      results.push(result)

      if (result.success) {
        passed++
      } else {
        failed++
        console.log(`    💥 Error: ${result.error}`)
      }

      // Petit délai pour éviter de surcharger l'API
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    const summary = {
      total: tests.length,
      passed,
      failed,
      passRate: Math.round((passed / tests.length) * 100)
    }

    return {
      passed: results.filter(r => r.success).map(r => r.test),
      failed: results.filter(r => !r.success).map(r => ({
        ...r,
        error: r.error!,
        details: r.details || []
      })) as any[],
      summary
    }
  }

  async checkApiStatus(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:3004/api/compiler/health', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template: 'token',
          check: 'compile'
        })
      })
      return response.ok
    } catch {
      return false
    }
  }
}

async function main() {
  const tester = new CompilationTester()

  // Vérifier que l'API est disponible
  console.log('🔍 Checking API status...')
  const apiAvailable = await tester.checkApiStatus()
  
  if (!apiAvailable) {
    console.log('❌ API not available at http://localhost:3004')
    console.log('💡 Please start the backend API first with: npm run dev')
    process.exit(1)
  }

  console.log('✅ API is available\n')

  // Lancer les tests
  const results = await tester.runAllTests()

  // Afficher le résumé
  console.log('\n📊 TEST RESULTS SUMMARY')
  console.log('=' .repeat(50))
  console.log(`📋 Total tests: ${results.summary.total}`)
  console.log(`✅ Passed: ${results.summary.passed}`)
  console.log(`❌ Failed: ${results.summary.failed}`)
  console.log(`📈 Pass rate: ${results.summary.passRate}%`)

  if (results.failed.length > 0) {
    console.log('\n🚨 FAILED TESTS:')
    console.log('-'.repeat(40))
    results.failed.forEach((failure, index) => {
      console.log(`${index + 1}. ${failure.test.testName}`)
      console.log(`   Error: ${failure.error}`)
      if (failure.details && failure.details.length > 0) {
        failure.details.forEach(detail => {
          console.log(`   Detail: ${JSON.stringify(detail)}`)
        })
      }
      console.log('')
    })
  }

  if (results.passed.length > 0) {
    console.log('\n✅ SUCCESSFUL TESTS:')
    console.log('-'.repeat(40))
    results.passed.slice(0, 10).forEach((test, index) => {
      console.log(`${index + 1}. ${test.testName}`)
    })
    if (results.passed.length > 10) {
      console.log(`... and ${results.passed.length - 10} more`)
    }
  }

  // Sauvegarder les résultats
  const timestamp = new Date().toISOString()
  const resultsPath = path.join(process.cwd(), 'compilation-test-results.json')
  
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2))
  console.log(`\n📄 Results saved to: ${resultsPath}`)

  // Déterminer le code de sortie
  const exitCode = results.summary.passRate >= 95 ? 0 : 1
  console.log(`\n${exitCode === 0 ? '🎉' : '⚠️'} Test ${exitCode === 0 ? 'PASSED' : 'FAILED'} (${results.summary.passRate}% pass rate)`)
  
  process.exit(exitCode)
}

// Lancer les tests
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Test runner failed:', error)
    process.exit(1)
  })
}

export { CompilationTester, CompilationTest, CompilationResult, TestResults } 