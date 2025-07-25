const axios = require('axios');

// Copy the exact functions from test_extended_templates.js
function getRandomFeatures(templateType, minFeatures = 0, maxFeatures = null) {
  const ALL_FEATURES = {
    'lock': ['vesting', 'timelock', 'multisig']
  };
  
  const availableFeatures = ALL_FEATURES[templateType] || [];
  if (availableFeatures.length === 0) return [];
  
  const max = maxFeatures || availableFeatures.length;
  const numFeatures = Math.floor(Math.random() * (max - minFeatures + 1)) + minFeatures;
  
  // Mélanger et prendre un nombre aléatoire de fonctionnalités
  const shuffled = [...availableFeatures].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, numFeatures);
}

function getRandomParams(templateType) {
  const baseParams = {
    'lock': {
      name: `RandomLock${Math.floor(Math.random() * 1000)}`,
      tokenAddress: `0x${Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
    }
  };
  
  return baseParams[templateType] || {};
}

async function testLockDetailed() {
  console.log('Testing lock template with detailed debugging...');
  
  // Test the exact same combinations that are failing
  const testCases = [
    { 
      name: 'random1', 
      minFeatures: 1, 
      maxFeatures: 1,
      description: 'lock - random1 (1-1 features)'
    },
    { 
      name: 'random2', 
      minFeatures: 1, 
      maxFeatures: 2,
      description: 'lock - random2 (1-2 features)'
    },
    { 
      name: 'random3', 
      minFeatures: 2, 
      maxFeatures: 3,
      description: 'lock - random3 (2-3 features)'
    }
  ];
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n🧪 Testing ${testCase.description}...`);
    
    // Generate the same way as the extended test
    const features = getRandomFeatures('lock', testCase.minFeatures, testCase.maxFeatures);
    const params = getRandomParams('lock');
    
    console.log(`   🔧 Generated features: ${features.join(', ')}`);
    console.log(`   📝 Generated params:`, JSON.stringify(params, null, 2));
    
    try {
      const requestBody = {
        templateType: 'lock',
        features: features,
        params: params
      };
      
      console.log(`   📤 Sending request:`, JSON.stringify(requestBody, null, 2));
      
      const response = await axios.post('http://localhost:3004/api/web/compile/template', requestBody, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });
      
      if (response.data.success) {
        console.log(`✅ ${testCase.name}: SUCCESS`);
        console.log(`   🔧 Contract name: ${response.data.contractName}`);
      } else {
        console.log(`❌ ${testCase.name}: FAILED`);
        console.log(`   🚨 Error: ${response.data.error}`);
      }
    } catch (error) {
      console.log(`❌ ${testCase.name}: ERROR`);
      console.log(`   🚨 ${error.message}`);
      if (error.response?.data?.error) {
        console.log(`   📝 ${error.response.data.error}`);
      }
    }
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

testLockDetailed().catch(console.error); 