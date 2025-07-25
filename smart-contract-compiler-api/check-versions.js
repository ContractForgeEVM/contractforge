#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification des versions OpenZeppelin...');

// Lire package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const packageVersion = packageJson.dependencies['@openzeppelin/contracts'];

// Lire le code de compilation
const foundryCompilerPath = 'src/services/foundryCompiler.ts';
const foundryCompilerCode = fs.readFileSync(foundryCompilerPath, 'utf8');

// Extraire la version du code
const versionMatch = foundryCompilerCode.match(/git fetch origin v(\d+\.\d+\.\d+)/);
const codeVersion = versionMatch ? versionMatch[1] : 'non trouvée';

console.log(`📦 Package.json version: ${packageVersion}`);
console.log(`🔧 Code compilation version: v${codeVersion}`);

// Vérifier la cohérence
const packageVersionClean = packageVersion.replace('^', '');
if (packageVersionClean === codeVersion) {
  console.log('✅ Versions cohérentes !');
  process.exit(0);
} else {
  console.log('❌ Versions incohérentes !');
  console.log(`   Mettez à jour le code pour utiliser v${packageVersionClean}`);
  process.exit(1);
} 