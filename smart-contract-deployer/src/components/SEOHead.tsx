import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
interface SEOHeadProps {
  template?: string | null
  title?: string
  description?: string
  image?: string
  url?: string
}
const SEOHead = ({
  template,
  title,
  description,
  image = '/ContractForge.io.png',
  url = 'https://contractforge.io',
}: SEOHeadProps) => {
  const { t, i18n } = useTranslation()
  useEffect(() => {
    const updateMetaTags = () => {
      let pageTitle = title
      let pageDescription = description
      let pageImage = image
      let pageUrl = url
      if (template) {
        switch (template) {
          case 'token':
            pageTitle = `${t('token')} Creator - ContractForge.io | Deploy ERC20 Tokens Without Code`
            pageDescription = t('tokenDesc') + ' ' + t('evmCompatible')
            pageUrl = `${url}/templates/erc20`
            break
          case 'nft':
            pageTitle = `${t('nft')} Creator - ContractForge.io | Deploy NFT Collections Without Code`
            pageDescription = t('nftDesc') + ' ' + t('evmCompatible')
            pageUrl = `${url}/templates/nft`
            break
          case 'dao':
            pageTitle = `${t('dao')} Creator - ContractForge.io | Create Decentralized Organizations`
            pageDescription = t('daoDesc') + ' ' + t('evmCompatible')
            pageUrl = `${url}/templates/dao`
            break
          case 'lock':
            pageTitle = `${t('lock')} Creator - ContractForge.io | Token Vesting & Timelock`
            pageDescription = t('lockDesc') + ' ' + t('evmCompatible')
            pageUrl = `${url}/templates/token-lock`
            break
          default:
            pageTitle = title || `ContractForge.io - Deploy Smart Contracts Without Code | No-Code Blockchain Platform`
            pageDescription = description || t('evmCompatible')
        }
      }
      if (pageTitle) {
        document.title = pageTitle
      }
      const metaDescription = document.querySelector('meta[name="description"]')
      if (metaDescription && pageDescription) {
        metaDescription.setAttribute('content', pageDescription)
      }
      const ogTitle = document.querySelector('meta[property="og:title"]')
      if (ogTitle && pageTitle) {
        ogTitle.setAttribute('content', pageTitle)
      }
      const ogDescription = document.querySelector('meta[property="og:description"]')
      if (ogDescription && pageDescription) {
        ogDescription.setAttribute('content', pageDescription)
      }
      const ogImage = document.querySelector('meta[property="og:image"]')
      if (ogImage && pageImage) {
        ogImage.setAttribute('content', pageImage.startsWith('http') ? pageImage : `${url}${pageImage}`)
      }
      const ogUrl = document.querySelector('meta[property="og:url"]')
      if (ogUrl && pageUrl) {
        ogUrl.setAttribute('content', pageUrl)
      }
      const twitterTitle = document.querySelector('meta[name="twitter:title"]')
      if (twitterTitle && pageTitle) {
        twitterTitle.setAttribute('content', pageTitle)
      }
      const twitterDescription = document.querySelector('meta[name="twitter:description"]')
      if (twitterDescription && pageDescription) {
        twitterDescription.setAttribute('content', pageDescription)
      }
      const twitterImage = document.querySelector('meta[name="twitter:image"]')
      if (twitterImage && pageImage) {
        twitterImage.setAttribute('content', pageImage.startsWith('http') ? pageImage : `${url}${pageImage}`)
      }
      let canonical = document.querySelector('link[rel="canonical"]')
      if (!canonical) {
        canonical = document.createElement('link')
        canonical.setAttribute('rel', 'canonical')
        document.head.appendChild(canonical)
      }
      canonical.setAttribute('href', pageUrl)
      const currentLang = i18n.language
      const alternateLangs = ['en', 'fr']
      const existingAlternates = document.querySelectorAll('link[rel="alternate"][hreflang]')
      existingAlternates.forEach(link => link.remove())
      alternateLangs.forEach(lang => {
        const alternateLink = document.createElement('link')
        alternateLink.setAttribute('rel', 'alternate')
        alternateLink.setAttribute('hreflang', lang)
        const langUrl = lang === 'en' ? pageUrl : `${pageUrl}/${lang}`
        alternateLink.setAttribute('href', langUrl)
        document.head.appendChild(alternateLink)
      })
      const defaultLink = document.createElement('link')
      defaultLink.setAttribute('rel', 'alternate')
      defaultLink.setAttribute('hreflang', 'x-default')
      defaultLink.setAttribute('href', pageUrl)
      document.head.appendChild(defaultLink)
      const existingSchema = document.querySelector('script[type="application/ld+json"]')
      if (existingSchema && template) {
        const schemaData = {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": pageTitle,
          "description": pageDescription,
          "url": pageUrl,
          "image": pageImage.startsWith('http') ? pageImage : `${url}${pageImage}`,
          "inLanguage": currentLang,
          "isPartOf": {
            "@type": "WebSite",
            "name": "ContractForge.io",
            "url": "https://contractforge.io",
          },
          "mainEntity": {
            "@type": "SoftwareApplication",
            "name": `ContractForge.io ${template.toUpperCase()} Creator`,
            "applicationCategory": "DeveloperApplication",
            "operatingSystem": "Web Browser",
            "description": pageDescription,
            "url": pageUrl,
            "creator": {
              "@type": "Organization",
              "name": "ContractForge.io"
            }
          }
        }
        const newSchema = document.createElement('script')
        newSchema.type = 'application/ld+json'
        newSchema.textContent = JSON.stringify(schemaData, null, 2)
        existingSchema.parentNode?.replaceChild(newSchema, existingSchema)
      }
    }
    updateMetaTags()
  }, [template, title, description, image, url, t, i18n.language])
  return null
}
export default SEOHead