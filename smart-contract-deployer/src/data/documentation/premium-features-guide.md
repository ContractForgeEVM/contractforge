# Guide des Fonctionnalités Premium Configurables

Ce guide explique comment configurer les fonctionnalités premium configurables dans ContractForge.io.

## Fonctionnalités Configurables

### 1. URI Storage (NFT uniquement)

**Description :** Stockage des URIs de métadonnées on-chain pour chaque token NFT individuel.

**Configuration :**
- **Prix** : 0.01 ETH
- **Formats supportés** : JSON
- **Stockage** : localStorage (éphémère)
- **Compatibilité** : Uniquement pour les contrats NFT

**Exemples de fichiers JSON :**

**Format Objet (recommandé) :**
```json
{
  "1": "https://api.example.com/nft/metadata/1.json",
  "2": "https://api.example.com/nft/metadata/2.json", 
  "3": "ipfs://QmHash123/token3.json",
  "4": "https://gateway.pinata.cloud/ipfs/QmHash456/token4.json"
}
```

**Format Array :**
```json
[
  {"tokenId": "1", "uri": "https://api.example.com/nft/metadata/1.json"},
  {"tokenId": "2", "uri": "https://api.example.com/nft/metadata/2.json"},
  {"tokenId": "3", "uri": "ipfs://QmHash123/token3.json"}
]
```

**Format Array Simple :**
```json
[
  "https://api.example.com/nft/metadata/1.json",
  "https://api.example.com/nft/metadata/2.json",
  "https://api.example.com/nft/metadata/3.json"
]
```

**Fonctions générées dans le contrat :**
- `setTokenURI(tokenId, uri)` - Définir l'URI d'un token spécifique
- `batchSetTokenURI(tokenIds[], uris[])` - Définir les URIs de plusieurs tokens
- `clearTokenURI(tokenId)` - Supprimer l'URI d'un token

**Utilisation après déploiement :**
1. Déployez votre contrat NFT avec URI Storage activé
2. Appelez `batchSetTokenURI` avec vos token IDs et URIs
3. Chaque token aura son URI de métadonnées unique
4. Les URIs peuvent être modifiées plus tard par le propriétaire

### 2. Royalties (NFT uniquement)

**Description :** Configuration des royalties EIP-2981 pour les ventes secondaires.

**Configuration :**
- **Prix** : 0.015 ETH
- **Pourcentage** : 0.1% à 50% (recommandé: 2.5%-10%)
- **Destinataire** : Adresse Ethereum qui recevra les royalties

**Exemple :**
- Pourcentage : 5%
- Destinataire : 0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6

**Fonctions générées :**
- `royaltyInfo(tokenId, salePrice)` - Calcule les royalties
- `setDefaultRoyalty(recipient, feeNumerator)` - Modifier les royalties

### 3. Staking Rewards (Token uniquement)

**Description :** Système de staking avec récompenses automatiques.

**Configuration :**
- **Prix** : 0.04 ETH
- **Taux de récompense** : APY en pourcentage (ex: 10% par an)
- **Durée** : Période de staking en jours (1-3650)
- **Token de récompense** : Optionnel, sinon utilise le même token

**Exemple :**
```json
{
  "rewardRate": 10,
  "duration": 365,
  "rewardToken": "0x..." 
}
```

**Fonctions générées :**
- `stake(amount)` - Staker des tokens
- `unstake(amount)` - Récupérer les tokens
- `claimRewards()` - Réclamer les récompenses
- `getRewards(address)` - Voir les récompenses

### 4. Whitelist/Blacklist

**Description :** Restreindre les transferts à des adresses spécifiques ou bloquer certaines adresses.

**Configuration :**
- **Format de fichier supporté :** JSON, CSV, TXT
- **Saisie manuelle :** Adresses Ethereum individuelles
- **Validation :** Format d'adresse Ethereum valide (0x...)

**Exemples de fichiers :**

**JSON :**
```json
["0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6", "0x8ba1f109551bD432803012645Hac136c772c3c7c"]
```

**CSV :**
```csv
address
0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6
0x8ba1f109551bD432803012645Hac136c772c3c7c
```

### 3. Transfer Tax

**Description :** Taxe automatique sur les transferts de jetons.

**Configuration :**
- **Taux de taxe :** 0.01% à 25% (avec 2 décimales)
- **Destinataire :** Adresse Ethereum qui recevra la taxe
- **Validation :** Taux entre 0.01% et 25%, adresse valide

**Exemple :**
- Taux : 2.5% (250 en base 100)
- Destinataire : 0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6

### 4. Capped Supply

**Description :** Limiter l'approvisionnement maximum de jetons.

**Configuration :**
- **Approvisionnement maximum :** Nombre total de jetons qui peuvent exister
- **Validation :** Doit être supérieur à 0

**Exemple :**
- Approvisionnement maximum : 1,000,000 jetons

### 5. Vesting Schedule

**Description :** Planification d'acquisition de jetons avec cliff et durée.

**Configuration :**
- **Bénéficiaire :** Adresse qui recevra les jetons
- **Montant :** Nombre de jetons à acquérir
- **Temps de début :** Timestamp de début (Unix)
- **Durée :** Durée totale en secondes
- **Cliff :** Période de cliff en secondes

**Exemple :**
```json
{
  "beneficiary": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  "amount": 10000,
  "startTime": 1640995200,
  "duration": 31536000,
  "cliff": 15768000
}
```

### 6. Multi-Signature

**Description :** Exiger plusieurs signatures pour les actions du propriétaire.

**Configuration :**
- **Signataires :** Liste d'adresses des signataires
- **Seuil :** Nombre de signatures requises
- **Validation :** Seuil ≤ nombre de signataires

**Exemple :**
```json
{
  "signers": [
    "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    "0x8ba1f109551bD432803012645Hac136c772c3c7c",
    "0x1234567890123456789012345678901234567890"
  ],
  "threshold": 2
}
```

### 7. Batch Airdrop

**Description :** Distribution efficace de jetons à plusieurs adresses.

**Configuration :**
- **Destinataires :** Liste d'adresses et montants
- **Format :** Adresse Ethereum + montant de jetons
- **Validation :** Adresses valides, montants > 0

**Exemple :**
```json
[
  {
    "address": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    "amount": 1000
  },
  {
    "address": "0x8ba1f109551bD432803012645Hac136c772c3c7c",
    "amount": 500
  }
]
```

### 8. Timelock Controller

**Description :** Délai pour les fonctions critiques.

**Configuration :**
- **Délai :** Délai en secondes avant exécution
- **Validation :** Délai > 0

**Exemple :**
- Délai : 86400 secondes (24 heures)

## Considérations de Sécurité

### Whitelist/Blacklist
- ✅ Vérifiez toutes les adresses avant configuration
- ✅ Utilisez des listes d'adresses de confiance
- ⚠️ Les grandes listes augmentent les coûts de gaz

### Transfer Tax
- ✅ Vérifiez l'adresse du destinataire
- ⚠️ Les taux élevés peuvent décourager les transferts
- ⚠️ Testez avec de petits montants d'abord

### Capped Supply
- ✅ Planifiez l'approvisionnement maximum à l'avance
- ⚠️ Ne peut pas être modifié après déploiement
- ⚠️ Incompatible avec la fonctionnalité "Mintable"

### Vesting Schedule
- ✅ Vérifiez les timestamps (début, durée, cliff)
- ✅ Testez les calculs d'acquisition
- ⚠️ Les erreurs de configuration sont permanentes

### Multi-Signature
- ✅ Utilisez des adresses de confiance
- ✅ Équilibrez le nombre de signataires et le seuil
- ⚠️ Trop de signataires peuvent ralentir les décisions

### Batch Airdrop
- ✅ Vérifiez tous les montants et adresses
- ✅ Testez avec de petits montants
- ⚠️ Les erreurs sont coûteuses en gaz

### Timelock
- ✅ Choisissez un délai approprié pour votre cas d'usage
- ⚠️ Les délais longs peuvent bloquer les actions urgentes

## Coûts de Gaz

Les fonctionnalités configurables ont des coûts de gaz variables :

| Fonctionnalité | Coût de base | Coût par élément |
|----------------|--------------|------------------|
| Whitelist/Blacklist | ~50,000 | ~5,000 par adresse |
| Transfer Tax | ~30,000 | - |
| Capped Supply | ~20,000 | - |
| Vesting Schedule | ~100,000 | ~25,000 par planning |
| Multi-Signature | ~80,000 | ~15,000 par signataire |
| Batch Airdrop | ~60,000 | ~8,000 par destinataire |
| Timelock | ~40,000 | - |

## Bonnes Pratiques

1. **Testez toujours** sur un réseau de test avant le déploiement principal
2. **Vérifiez les configurations** plusieurs fois avant déploiement
3. **Documentez vos choix** de configuration pour référence future
4. **Utilisez des adresses de confiance** pour les fonctionnalités critiques
5. **Planifiez les coûts** de gaz pour les grandes configurations
6. **Sauvegardez vos fichiers** de configuration

## 📋 Nouvelles Fonctionnalités Configurables

### Auction (NFT)
- **Prix** : 0.025 ETH
- **Paramètres** : Durée par défaut, prix minimum, incrément d'enchère
- **Fonctions** : `createAuction()`, `placeBid()`, `endAuction()`

### Oracle Integration
- **Prix** : 0.02 ETH  
- **Paramètres** : Type d'oracle (Chainlink/Custom), adresse du price feed
- **Fonctions** : `getLatestPrice()`, `updatePriceFeed()`

### Escrow Service
- **Prix** : 0.03 ETH
- **Paramètres** : Durée de rétention, adresse arbitre optionnelle
- **Fonctions** : `createEscrow()`, `releaseEscrow()`, `disputeEscrow()`

### Tiered System
- **Prix** : 0.035 ETH
- **Paramètres** : Définition des niveaux et avantages
- **Interface** : Configuration avancée à venir

### Governance (DAO)
- **Prix** : 0.05 ETH
- **Paramètres** : Délai de vote, période de vote, quorum
- **Compatible** : Contrats Token DAO uniquement

### Insurance Pool
- **Prix** : 0.03 ETH
- **Paramètres** : Pourcentage de couverture, taux de prime
- **Fonctions** : Protection automatique des transactions

### Cross-Chain Bridge
- **Prix** : 0.1 ETH
- **Paramètres** : Chaînes supportées, adresse bridge
- **Interface** : Configuration complète à venir

### Rewards System
- **Prix** : 0.025 ETH
- **Paramètres** : Type de récompense (Points/Tokens/NFT), montant, conditions
- **Fonctions** : Distribution automatique des récompenses

## Support

Pour des questions sur les fonctionnalités premium configurables :
- Consultez la documentation technique
- Testez sur les réseaux de test
- Contactez l'équipe de support si nécessaire

---

*Dernière mise à jour : 2024*