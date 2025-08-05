#!/usr/bin/env node

/**
 * Script pour corriger les traductions et les styles dans ApiKeyManager.tsx
 */

const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, 'src/components/ApiKeyManager.tsx')

// Lecture du fichier
let content = fs.readFileSync(filePath, 'utf8')

// Mappings des textes à remplacer
const translations = {
  // Titres et descriptions
  'Gestion des Clés API': 't("apiKeys.title")',
  'Créez et gérez vos clés API pour accéder aux fonctionnalités avancées': 't("apiKeys.description")',
  
  // Boutons et actions
  'Créer une Clé API': 't("apiKeys.createKey")',
  'Copier la Clé': 't("apiKeys.copyKey")',
  'Définir comme Active': 't("apiKeys.setAsActive")',
  'Supprimer': 't("apiKeys.delete")',
  'Modifier': 't("apiKeys.edit")',
  
  // Messages
  'Clé API créée avec succès ! 🎉': 't("apiKeys.keyCreated")',
  'Clé API supprimée': 't("apiKeys.keyDeleted")',
  'Clé copiée dans le presse-papiers': 't("apiKeys.copySuccess")',
  
  // Labels et statuts
  'Nom de la Clé': 't("apiKeys.keyName")',
  'Ex: Mon Projet API': 't("apiKeys.keyNamePlaceholder")',
  'Clé Active': 't("apiKeys.activeKey")',
  'Créée': 't("apiKeys.created")',
  'Dernière utilisation': 't("apiKeys.lastUsed")',
  'Jamais': 't("apiKeys.never")',
  'Utilisation': 't("apiKeys.usage")',
  'Limites': 't("apiKeys.limits")',
  'Niveau': 't("apiKeys.tier")',
  'Permissions': 't("apiKeys.permissions")',
  'Statut': 't("apiKeys.status")',
  'Active': 't("apiKeys.active")',
  'Inactive': 't("apiKeys.inactive")',
  
  // Messages d'état vide
  'Aucune clé API': 't("apiKeys.noKeys")',
  'Créez votre première clé API pour commencer à utiliser nos services': 't("apiKeys.noKeysDescription")',
  
  // Étapes
  'Prochaines étapes :': 't("apiKeys.nextSteps")',
  'Copiez et sauvegardez cette clé en lieu sûr': 't("apiKeys.step1")',
  'Utilisez-la dans vos requêtes API avec le header :': 't("apiKeys.step2")',
  'Accédez aux fonctionnalités premium de l\'API': 't("apiKeys.step3")',
  
  // Avertissements
  'Cette clé ne sera plus affichée après fermeture': 't("apiKeys.warning")',
  'Êtes-vous sûr de vouloir supprimer cette clé API ?': 't("apiKeys.deleteConfirm")',
  'Cette action est irréversible': 't("apiKeys.deleteWarning")'
}

// Corrections de style pour le contraste
const styleCorrections = [
  // Corriger le style du code pour éviter le texte blanc sur blanc
  {
    from: `<code style={{ background: '#f5f5f5', padding: '4px 8px', borderRadius: '4px' }}>`,
    to: `<code style={{ 
      background: 'rgba(0, 0, 0, 0.1)', 
      color: 'inherit', 
      padding: '4px 8px', 
      borderRadius: '4px',
      border: '1px solid rgba(0, 0, 0, 0.2)'
    }}>`
  },
  // Assurer la lisibilité des textes
  {
    from: `sx={{ fontFamily: 'monospace' }}`,
    to: `sx={{ 
      fontFamily: 'monospace',
      '& input': {
        color: 'text.primary'
      }
    }}`
  }
]

// Application des traductions
console.log('🔧 Application des traductions...')
Object.entries(translations).forEach(([original, translation]) => {
  // Remplacer dans les chaînes simples
  content = content.replace(new RegExp(`'${original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`, 'g'), `{${translation}}`)
  content = content.replace(new RegExp(`"${original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g'), `{${translation}}`)
  
  // Remplacer dans le JSX
  content = content.replace(new RegExp(`>${original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}<`, 'g'), `>{${translation}}<`)
})

// Application des corrections de style
console.log('🎨 Correction des styles pour le contraste...')
styleCorrections.forEach(({ from, to }) => {
  content = content.replace(from, to)
})

// Corrections spéciales pour les éléments plus complexes
content = content.replace(
  /placeholder="Ex: Mon Projet API"/g,
  'placeholder={t("apiKeys.keyNamePlaceholder")}'
)

content = content.replace(
  /label="Nom de la Clé"/g,
  'label={t("apiKeys.keyName")}'
)

// Ajouter les imports nécessaires si pas présents
if (!content.includes('import { useTheme }')) {
  content = content.replace(
    'import { useTranslation } from \'react-i18next\'',
    'import { useTranslation } from \'react-i18next\'\nimport { useTheme } from \'@mui/material/styles\''
  )
}

// Ajouter le hook useTheme si nécessaire
if (!content.includes('const theme = useTheme()')) {
  content = content.replace(
    'const { t } = useTranslation()',
    'const { t } = useTranslation()\n  const theme = useTheme()'
  )
}

// Écriture du fichier corrigé
fs.writeFileSync(filePath, content, 'utf8')

console.log('✅ Corrections appliquées avec succès!')
console.log('📋 Résumé des corrections:')
console.log(`   - ${Object.keys(translations).length} traductions appliquées`)
console.log(`   - ${styleCorrections.length} corrections de style`)
console.log('   - Import useTheme ajouté pour le contraste')
console.log('   - Placeholders et labels corrigés')