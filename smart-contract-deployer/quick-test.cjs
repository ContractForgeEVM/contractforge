const https = require('https')

const USER_ID = 'quick_test_' + Date.now()

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

async function quickTest() {
  console.log('🚀 Quick API test...\n')

  const tests = [
    {
      name: 'Basic Token',
      template: 'token',
      params: { name: 'TestToken', symbol: 'TEST', totalSupply: '1000000', decimals: 18 },
      features: []
    },
    {
      name: 'Basic NFT', 
      template: 'nft',
      params: { name: 'TestNFT', symbol: 'TNFT', maxSupply: '10000', baseURI: 'https://test.com/', mintPrice: '0.01', maxPerWallet: 5 },
      features: []
    },
    {
      name: 'Token with Pausable',
      template: 'token',
      params: { name: 'TestToken', symbol: 'TEST', totalSupply: '1000000', decimals: 18 },
      features: ['pausable']
    }
  ]

  let passed = 0
  let failed = 0

  for (const test of tests) {
    try {
      console.log(`🧪 Testing: ${test.name}`)
      const result = await makeRequest('/api/web/compile/template', {
        userId: USER_ID,
        templateType: test.template,
        params: test.params,
        features: test.features,
        chainId: 1
      })

      if (result.success && result.bytecode && result.abi) {
        console.log(`✅ PASSED: ${test.name}`)
        passed++
      } else {
        console.log(`❌ FAILED: ${test.name} - No bytecode/ABI`)
        console.log(`   Response: ${JSON.stringify(result, null, 2)}`)
        failed++
      }
    } catch (error) {
      console.log(`❌ FAILED: ${test.name} - ${error.status || 'Error'}: ${error.data?.error || error.error || 'Unknown error'}`)
      failed++
    }
  }

  console.log('\n📊 QUICK TEST RESULTS')
  console.log('='.repeat(30))
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(2)}%`)
}

quickTest().catch(console.error) 