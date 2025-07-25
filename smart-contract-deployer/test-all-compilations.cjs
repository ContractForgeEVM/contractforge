const https = require('https')
const fs = require('fs')

// Configuration
const API_BASE = 'https://contractforge.io/api/web'
const USER_ID = 'test_user_' + Date.now()

// All templates to test
const TEMPLATES = [
  'token',
  'nft', 
  'dao',
  'lock',
  'liquidity-pool',
  'yield-farming',
  'gamefi-token',
  'nft-marketplace',
  'revenue-sharing',
  'loyalty-program',
  'dynamic-nft',
  'social-token'
]

// All premium features to test
const PREMIUM_FEATURES = [
  'pausable',
  'mintable',
  'burnable',
  'capped',
  'snapshot',
  'votes',
  'permit',
  'flashmint',
  'whitelist',
  'blacklist',
  'tax',
  'multisig',
  'airdrop',
  'royalties',
  'auction',
  'oracle',
  'escrow',
  'tiered',
  'governance',
  'insurance',
  'crossChain',
  'rewards',
  'staking',
  'uristorage'
]

// Template-specific parameters
const TEMPLATE_PARAMS = {
  token: {
    name: 'TestToken',
    symbol: 'TEST',
    totalSupply: '1000000',
    decimals: 18
  },
  nft: {
    name: 'TestNFT',
    symbol: 'TNFT',
    maxSupply: '10000',
    baseURI: 'https://test.com/',
    mintPrice: '0.01',
    maxPerWallet: 5
  },
  dao: {
    name: 'TestDAO',
    governanceTokenAddress: '0x1234567890123456789012345678901234567890',
    proposalThreshold: '100',
    votingPeriod: '50400'
  },
  lock: {
    tokenAddress: '0x1234567890123456789012345678901234567890',
    beneficiary: '0x1234567890123456789012345678901234567890',
    unlockTime: '2025-01-01'
  },
  'liquidity-pool': {
    name: 'TestPool',
    tokenA: '0x1234567890123456789012345678901234567890',
    tokenB: '0x1234567890123456789012345678901234567890',
    fee: 3000,
    initialPrice: 1.0
  },
  'yield-farming': {
    name: 'TestFarm',
    stakingToken: '0x1234567890123456789012345678901234567890',
    rewardToken: '0x1234567890123456789012345678901234567890',
    rewardRate: 0.001,
    duration: 30
  },
  'gamefi-token': {
    name: 'TestGameToken',
    symbol: 'TGAME',
    maxSupply: '1000000',
    mintPrice: '0.01',
    burnRate: 2
  },
  'nft-marketplace': {
    name: 'TestMarket',
    nftContract: '0x1234567890123456789012345678901234567890',
    platformFee: 2.5,
    creatorFee: 5.0,
    allowMinting: false
  },
  'revenue-sharing': {
    name: 'TestRevenue',
    symbol: 'TREV',
    totalSupply: '1000000',
    businessWallet: '0x1234567890123456789012345678901234567890',
    distributionPeriod: 30
  },
  'loyalty-program': {
    name: 'TestLoyalty',
    pointsPerPurchase: 10,
    redemptionRate: 0.01,
    transferable: false,
    expirable: true
  },
  'dynamic-nft': {
    name: 'TestDynamicNFT',
    symbol: 'TDNFT',
    maxSupply: '10000',
    evolvable: true,
    mergeable: false
  },
  'social-token': {
    creatorName: 'TestCreator',
    symbol: 'SOCIAL',
    initialSupply: '1000000',
    creatorShare: 20,
    communityGoverned: true
  }
}

// Feature compatibility matrix
const FEATURE_COMPATIBILITY = {
  token: ['pausable', 'mintable', 'burnable', 'capped', 'snapshot', 'votes', 'permit', 'flashmint', 'whitelist', 'blacklist', 'tax', 'multisig', 'airdrop'],
  nft: ['pausable', 'burnable', 'royalties', 'auction', 'oracle', 'rewards', 'staking', 'uristorage', 'whitelist', 'blacklist'],
  dao: ['timelock'],
  lock: ['vesting']
}

// Test results storage
const results = {
  passed: [],
  failed: [],
  summary: {}
}

async function makeRequest(endpoint, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data)
    const options = {
      hostname: 'contractforge.io',
      port: 443,
      path: endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }

    const req = https.request(options, (res) => {
      let responseData = ''
      res.on('data', (chunk) => {
        responseData += chunk
      })
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData)
          if (res.statusCode === 200) {
            resolve(parsedData)
          } else {
            reject({ status: res.statusCode, data: parsedData })
          }
        } catch (e) {
          reject({ status: res.statusCode, data: responseData })
        }
      })
    })

    req.on('error', (e) => {
      reject({ error: e.message })
    })

    req.write(postData)
    req.end()
  })
}

async function testCompilation(template, features = []) {
  const testName = `${template} + [${features.join(', ')}]`
  console.log(`🧪 Testing: ${testName}`)

  try {
    const result = await makeRequest('/api/web/compile/template', {
      userId: USER_ID,
      templateType: template,
      params: TEMPLATE_PARAMS[template] || {},
      features: features,
      chainId: 1
    })

    if (result.success && result.bytecode && result.abi) {
      console.log(`✅ PASSED: ${testName}`)
      results.passed.push({ template, features, testName })
      return true
    } else {
      console.log(`❌ FAILED: ${testName} - No bytecode/ABI`)
      results.failed.push({ template, features, testName, error: 'No bytecode/ABI', details: result })
      return false
    }
  } catch (error) {
    console.log(`❌ FAILED: ${testName} - ${error.status || 'Error'}: ${error.data?.error || error.error || 'Unknown error'}`)
    results.failed.push({ 
      template, 
      features, 
      testName, 
      error: error.data?.error || error.error || 'Request failed',
      details: error.data?.details || error
    })
    return false
  }
}

async function runTests() {
  console.log('🚀 Starting comprehensive compilation tests...\n')

  // Test 1: Basic templates without features
  console.log('📋 PHASE 1: Testing basic templates without features')
  for (const template of TEMPLATES) {
    await testCompilation(template, [])
  }

  // Test 2: Templates with single premium features
  console.log('\n📋 PHASE 2: Testing templates with single premium features')
  for (const template of TEMPLATES) {
    const compatibleFeatures = FEATURE_COMPATIBILITY[template] || PREMIUM_FEATURES
    for (const feature of compatibleFeatures.slice(0, 5)) { // Test first 5 features per template
      await testCompilation(template, [feature])
    }
  }

  // Test 3: Templates with multiple premium features
  console.log('\n📋 PHASE 3: Testing templates with multiple premium features')
  for (const template of TEMPLATES) {
    const compatibleFeatures = FEATURE_COMPATIBILITY[template] || PREMIUM_FEATURES
    if (compatibleFeatures.length >= 2) {
      await testCompilation(template, compatibleFeatures.slice(0, 2)) // Test first 2 features combined
    }
  }

  // Test 4: Focus on problematic combinations
  console.log('\n📋 PHASE 4: Testing known problematic combinations')
  const problematicTests = [
    ['nft', ['pausable', 'uristorage']],
    ['nft', ['royalties', 'auction']],
    ['token', ['pausable', 'whitelist']],
    ['token', ['votes', 'snapshot']],
    ['dao', ['timelock']],
    ['lock', ['vesting']]
  ]

  for (const [template, features] of problematicTests) {
    await testCompilation(template, features)
  }

  // Generate report
  console.log('\n📊 TEST RESULTS SUMMARY')
  console.log('='.repeat(50))
  console.log(`✅ Passed: ${results.passed.length}`)
  console.log(`❌ Failed: ${results.failed.length}`)
  console.log(`📈 Success Rate: ${((results.passed.length / (results.passed.length + results.failed.length)) * 100).toFixed(2)}%`)

  if (results.failed.length > 0) {
    console.log('\n❌ FAILED TESTS:')
    results.failed.forEach((failure, index) => {
      console.log(`${index + 1}. ${failure.testName}`)
      console.log(`   Error: ${failure.error}`)
      if (failure.details?.details) {
        console.log(`   Details: ${JSON.stringify(failure.details.details, null, 2)}`)
      }
      console.log('')
    })
  }

  // Save detailed results to file
  fs.writeFileSync('compilation-test-results.json', JSON.stringify(results, null, 2))
  console.log('💾 Detailed results saved to compilation-test-results.json')
}

// Run the tests
runTests().catch(console.error) 