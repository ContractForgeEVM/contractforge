import { useTranslation } from 'react-i18next'
import { Button } from '@mui/material'
import { Language as LanguageIcon } from '@mui/icons-material'
import { useState, useEffect } from 'react'

const LanguageToggle = () => {
  const { i18n } = useTranslation()
  const [currentLang, setCurrentLang] = useState(i18n.language)
  
  useEffect(() => {
    setCurrentLang(i18n.language)
    
    const handleLanguageChange = (lng: string) => {
      setCurrentLang(lng)
    }
    
    i18n.on('languageChanged', handleLanguageChange)
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange)
    }
  }, [i18n])
  
  const toggleLanguage = async () => {
    const newLang = currentLang === 'en' ? 'fr' : 'en'
    console.log(`🌐 Changement de langue: ${currentLang} → ${newLang}`)
    await i18n.changeLanguage(newLang)
    setCurrentLang(newLang)
  }
  return (
    <Button
      variant="outlined"
      size="small"
      onClick={toggleLanguage}
      startIcon={<LanguageIcon />}
      sx={{
        borderColor: 'rgba(255, 255, 255, 0.2)',
        color: 'text.primary',
        '&:hover': {
          borderColor: 'primary.main',
          backgroundColor: 'rgba(123, 63, 242, 0.1)',
        },
      }}
    >
      {currentLang === 'en' ? 'EN' : 'FR'}
    </Button>
  )
}
export default LanguageToggle