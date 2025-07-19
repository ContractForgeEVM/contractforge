import { useTranslation } from 'react-i18next'
import { Button } from '@mui/material'
import { Language as LanguageIcon } from '@mui/icons-material'
const LanguageToggle = () => {
  const { i18n } = useTranslation()
  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'fr' : 'en'
    i18n.changeLanguage(newLang)
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
      {i18n.language === 'en' ? 'EN' : 'FR'}
    </Button>
  )
}
export default LanguageToggle