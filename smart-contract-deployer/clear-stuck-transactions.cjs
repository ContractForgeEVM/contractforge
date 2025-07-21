const { ethers } = require("hardhat");

async function clearStuckTransactions() {
  console.log('🧹 Nettoyage préventif des transactions bloquées');
  console.log('===============================================\n');

  try {
    const [deployer] = await ethers.getSigners();
    console.log('👤 Adresse du deployer:', deployer.address);
    console.log('🌐 RPC utilisé:', hre.network.config.url);
    
    // Vérifier les nonces
    const currentNonce = await deployer.getNonce();
    const onChainNonce = await ethers.provider.getTransactionCount(deployer.address);
    
    console.log('🔢 Nonce local:', currentNonce);
    console.log('🔢 Nonce on-chain:', onChainNonce);
    
    const stuck = currentNonce - onChainNonce;
    console.log('⚠️  Transactions pendantes:', stuck);
    
    if (stuck > 0) {
      console.log('\n🚨 Transactions bloquées détectées !');
      
      const feeData = await ethers.provider.getFeeData();
      const highGasPrice = (feeData.gasPrice * 150n) / 100n; // +50% pour garantir l'inclusion
      
      console.log('⛽ Gas price pour nettoyage:', ethers.formatUnits(highGasPrice, 'gwei'), 'gwei');
      
      // Annuler chaque transaction bloquée
      for (let i = 0; i < stuck; i++) {
        const targetNonce = onChainNonce + i;
        console.log(`\n🚫 Annulation de la transaction avec nonce ${targetNonce}...`);
        
        try {
          const cancelTx = await deployer.sendTransaction({
            to: deployer.address,
            value: 0,
            gasLimit: 21000,
            gasPrice: highGasPrice,
            nonce: targetNonce
          });
          
          console.log('📝 Hash d\'annulation:', cancelTx.hash);
          console.log('🔗 Etherscan:', `https://etherscan.io/tx/${cancelTx.hash}`);
          
          // Attendre la confirmation
          await cancelTx.wait();
          console.log('✅ Transaction annulée avec succès !');
          
        } catch (error) {
          console.log('❌ Erreur lors de l\'annulation:', error.message);
        }
      }
      
      console.log('\n🎉 Nettoyage terminé !');
    } else {
      console.log('\n✅ Aucune transaction bloquée détectée !');
    }
    
    // Afficher les recommandations
    console.log('\n💡 Recommandations pour éviter les blocages :');
    console.log('1. Toujours utiliser des RPC publics (Ankr, Llama, etc.)');
    console.log('2. Éviter les RPC avec protection MEV (Infura par défaut)');
    console.log('3. Utiliser un gas price suffisant (minimum 4-5 gwei pour Ethereum)');
    console.log('4. Vérifier les nonces avant chaque déploiement');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

// Fonction utilitaire pour vérifier avant déploiement
async function checkBeforeDeploy() {
  console.log('🔍 Vérification pré-déploiement');
  console.log('==============================\n');
  
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const balance = await ethers.provider.getBalance(deployer.address);
  const nonce = await deployer.getNonce();
  const feeData = await ethers.provider.getFeeData();
  
  console.log('✅ Réseau:', network.name, '(Chain ID:', network.chainId.toString(), ')');
  console.log('✅ RPC:', hre.network.config.url);
  console.log('✅ Adresse:', deployer.address);
  console.log('✅ Solde:', ethers.formatEther(balance), 'ETH');
  console.log('✅ Nonce:', nonce);
  console.log('✅ Gas price réseau:', ethers.formatUnits(feeData.gasPrice, 'gwei'), 'gwei');
  
  // Vérifications de sécurité
  const isPublicRpc = !hre.network.config.url.includes('infura') && 
                     !hre.network.config.url.includes('alchemy');
  
  console.log(isPublicRpc ? '✅ RPC public détecté' : '⚠️  RPC privé détecté - risque de mempool privé');
  
  return {
    isReady: balance > ethers.parseEther('0.01') && nonce >= 0,
    isPublicRpc,
    balance,
    nonce
  };
}

// Export pour utilisation dans d'autres scripts
module.exports = { clearStuckTransactions, checkBeforeDeploy };

// Exécution si appelé directement
if (require.main === module) {
  clearStuckTransactions();
} 