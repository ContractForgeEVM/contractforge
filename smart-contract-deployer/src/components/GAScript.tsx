import { useEffect } from 'react'

const GAScript = () => {
  useEffect(() => {
    const GA_MEASUREMENT_ID = import.meta.env.VITE_GOOGLE_ANALYTICS_ID

    if (!GA_MEASUREMENT_ID || GA_MEASUREMENT_ID === 'G-XXXXXXXXXX') {
      console.warn('⚠️ Google Analytics Measurement ID not configured')
      return
    }

    if (document.querySelector(`script[src*="gtag/js?id=${GA_MEASUREMENT_ID}"]`)) {
      console.log('📊 Google Analytics script already loaded')
      return
    }

    if (!window.dataLayer) {
      window.dataLayer = []
    }

    function gtag(...args: any[]) {
      window.dataLayer.push(arguments)
    }

    window.gtag = gtag

    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
    document.head.appendChild(script)

    const initScript = document.createElement('script')
    initScript.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA_MEASUREMENT_ID}');
    `
    document.head.appendChild(initScript)

    console.log('📊 Google Analytics script injected with ID:', GA_MEASUREMENT_ID)

    return () => {
    }
  }, [])

  return null
}

export default GAScript 