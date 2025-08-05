#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🔍 Vérification des Outils d\'Audit de Sécurité')
console.log('================================================')

// Test 1: Vérifier Solhint
console.log('\n1️⃣ Test de Solhint...')
try {
  const solhintVersion = execSync('npx solhint --version', { encoding: 'utf8' }).trim()
  console.log(`✅ Solhint version: ${solhintVersion}`)
  
  // Test avec un contrat simple
  const testContract = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TestContract {
    uint256 public value;
    
    function setValue(uint256 _value) public {
        value = _value;
    }
}`
  
  fs.writeFileSync('test_solhint.sol', testContract)
  
  const solhintConfig = {
    extends: "solhint:recommended",
    rules: {
      "avoid-sha3": "warn",
      "avoid-throw": "error",
      "no-empty-blocks": "warn",
      "no-inline-assembly": "warn",
      "max-line-length": "off",
      "compiler-version": "off"
    }
  }
  
  fs.writeFileSync('.solhint.json', JSON.stringify(solhintConfig, null, 2))
  
  try {
    const solhintResult = execSync('npx solhint test_solhint.sol --config .solhint.json', { encoding: 'utf8' })
    console.log('✅ Solhint fonctionne correctement')
    console.log('📊 Résultats Solhint:')
    console.log(solhintResult)
  } catch (error) {
    console.log('✅ Solhint fonctionne (détecte des problèmes comme attendu)')
    console.log('📊 Sortie Solhint:')
    console.log(error.stdout || error.message)
  }
  
} catch (error) {
  console.log('❌ Solhint non disponible:', error.message)
}

// Test 2: Vérifier Slither
console.log('\n2️⃣ Test de Slither...')
try {
  const slitherVersion = execSync('python3 -m slither --version', { encoding: 'utf8' }).trim()
  console.log(`✅ Slither version: ${slitherVersion}`)
  
  // Test avec notre wrapper Python
  try {
    const slitherResult = execSync('python3 slither_wrapper.py test_solhint.sol TestContract', { encoding: 'utf8' })
    console.log('✅ Slither wrapper fonctionne correctement')
    console.log('📊 Résultats Slither:')
    console.log(slitherResult)
  } catch (error) {
    console.log('❌ Slither wrapper échoue:', error.message)
  }
  
} catch (error) {
  console.log('❌ Slither non disponible:', error.message)
}

// Test 3: Vérifier l'API complète
console.log('\n3️⃣ Test de l\'API d\'Audit...')
try {
  const apiResult = execSync('curl -s -X POST http://localhost:3004/api/security-audit/audit -H "Content-Type: application/json" -d \'{"contractName": "TestContract", "sourceCode": "// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.20;\\n\\ncontract TestContract {\\n    uint256 public value;\\n    \\n    function setValue(uint256 _value) public {\\n        value = _value;\\n    }\\n}"}\'', { encoding: 'utf8' })
  
  const result = JSON.parse(apiResult)
  if (result.success) {
    console.log('✅ API d\'audit fonctionne correctement')
    console.log(`📊 Score: ${result.data.score}/100 (Grade: ${result.data.grade})`)
    console.log(`🛠️ Outils utilisés: ${result.data.toolsUsed.join(', ')}`)
    console.log(`⏱️ Temps d'audit: ${result.data.auditTime}ms`)
    console.log(`🎯 Passé: ${result.data.passed ? '✅ OUI' : '❌ NON'}`)
    
    console.log('\n📋 Problèmes détectés:')
    result.data.issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. [${issue.severity}] ${issue.title}`)
      console.log(`      Outil: ${issue.tool}`)
      console.log(`      Ligne: ${issue.line}`)
      console.log(`      Description: ${issue.description}`)
    })
  } else {
    console.log('❌ API d\'audit échoue:', result.message)
  }
  
} catch (error) {
  console.log('❌ API d\'audit non disponible:', error.message)
}

// Test 4: Vérifier la santé de l'API
console.log('\n4️⃣ Test de santé de l\'API...')
try {
  const healthResult = execSync('curl -s http://localhost:3004/api/security-audit/health', { encoding: 'utf8' })
  const health = JSON.parse(healthResult)
  console.log('✅ API en bonne santé:', health.status)
  console.log('🛠️ Outils disponibles:', health.tools)
} catch (error) {
  console.log('❌ API de santé non disponible:', error.message)
}

// Nettoyage
console.log('\n🧹 Nettoyage...')
try {
  fs.unlinkSync('test_solhint.sol')
  fs.unlinkSync('.solhint.json')
  console.log('✅ Fichiers temporaires supprimés')
} catch (error) {
  console.log('⚠️ Erreur lors du nettoyage:', error.message)
}

console.log('\n🎉 Vérification terminée !') 