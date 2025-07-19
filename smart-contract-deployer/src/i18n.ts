import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import enTranslations from './locales/en.json'
import frTranslations from './locales/fr.json'
const resources = {
  en: {
    translation: enTranslations
  },
  fr: {
    translation: frTranslations
  }
}
// Récupérer la langue sauvegardée ou utiliser 'en' par défaut
const savedLanguage = localStorage.getItem('language') || 'en'

// Debug: Afficher la langue récupérée
console.log('🌐 Langue sauvegardée:', savedLanguage)

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  })

// Sauvegarder la langue quand elle change
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('language', lng)
})
export default i18n