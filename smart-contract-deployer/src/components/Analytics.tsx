import { useEffect } from 'react'
import { config } from '../config'
export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, {
      event_category: 'smart_contract',
      event_label: parameters?.template || 'unknown',
      value: parameters?.value || 0,
      ...parameters
    })
  }
}
export const trackTemplateSelection = (template: string) => {
  trackEvent('template_selected', {
    template,
    event_category: 'user_interaction',
    event_label: `template_${template}`
  })
}
export const trackContractDeployment = (template: string, chainId: number, success: boolean) => {
  trackEvent('contract_deployed', {
    template,
    chain_id: chainId,
    success,
    event_category: 'conversion',
    event_label: success ? 'deployment_success' : 'deployment_failed'
  })
}
export const trackPremiumFeature = (feature: string, template: string) => {
  trackEvent('premium_feature_selected', {
    feature,
    template,
    event_category: 'monetization',
    event_label: `premium_${feature}`
  })
}
export const trackWalletConnection = (walletType: string) => {
  trackEvent('wallet_connected', {
    wallet_type: walletType,
    event_category: 'user_engagement',
    event_label: `wallet_${walletType}`
  })
}
export const trackPageView = (pagePath: string, pageTitle: string) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('config', config.googleAnalyticsId, {
      page_path: pagePath,
      page_title: pageTitle,
      page_location: window.location.href
    })
  }
}
const Analytics = () => {
  useEffect(() => {
    if (config.googleAnalyticsId && typeof window !== 'undefined') {
      const script1 = document.createElement('script')
      script1.async = true
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${config.googleAnalyticsId}`
      document.head.appendChild(script1)
      const script2 = document.createElement('script')
      script2.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${config.googleAnalyticsId}', {
          page_title: document.title,
          page_location: window.location.href,
          send_page_view: true,
          cookie_flags: 'SameSite=None;Secure',
          anonymize_ip: true,
          allow_google_signals: false,
          allow_ad_personalization_signals: false
        });
        gtag('event', 'page_view', {
          page_title: document.title,
          page_location: window.location.href,
          page_path: window.location.pathname
        });
        gtag('config', '${config.googleAnalyticsId}', {
          custom_map: {
            'custom_parameter_1': 'template_type',
            'custom_parameter_2': 'chain_id',
            'custom_parameter_3': 'premium_features'
          }
        });
      `
      document.head.appendChild(script2)
      ;(window as any).gtag = function() {
        ;(window as any).dataLayer = (window as any).dataLayer || []
        ;(window as any).dataLayer.push(arguments)
      }
    }
    if (config.mixpanelToken && typeof window !== 'undefined') {
      const script = document.createElement('script')
      script.innerHTML = `
        (function(c,a){if(!a.__SV){var b=window;try{var d,m,j,k=b.location,f=k.hash;d=function(a,b){return(m=a.match(RegExp(b+"=([^&]*)")))?m[1]:null};f&&d(f,"state")&&(j=JSON.parse(decodeURIComponent(d(f,"state"))),"mpeditor"===j.action&&(b.sessionStorage.setItem("_mpcehash",f),history.replaceState(j.desiredHash||"",c.title,k.pathname+k.search)))}catch(n){}var l,h;window.mixpanel=a;a._i=[];a.init=function(b,d,g){function c(b,i){var a=i.split(".");2==a.length&&(b=b[a[0]],i=a[1]);b[i]=function(){b.push([i].concat(Array.prototype.slice.call(arguments,0)))}}var e=a;"undefined"!==typeof g?e=a[g]=[]:g="mixpanel";e.people=e.people||[];e.toString=function(b){var a="mixpanel";"mixpanel"!==g&&(a+="."+g);b||(a+=" (stub)");return a};e.people.toString=function(){return e.toString(1)+".people (stub)"};l="disable time_event track track_pageview track_links track_forms track_with_groups add_group set_group remove_group register register_once alias unregister identify name_tag set_config reset opt_in_tracking opt_out_tracking has_opted_in_tracking has_opted_out_tracking clear_opt_in_out_tracking start_batch_senders people.set people.set_once people.unset people.increment people.append people.union people.track_charge people.clear_charges people.delete_user people.remove".split(" ");for(h=0;h<l.length;h++)c(e,l[h]);var f="set_config";a[f]=function(){var b=e[f].apply(e,arguments);a[g]=e;return b};a.init=function(){return a};a[f].apply(a,arguments)};a.__SV=1.2;b=c.createElement("script");b.type="text/javascript";b.async=!0;b.src="undefined"!==typeof MIXPANEL_CUSTOM_LIB_URL?MIXPANEL_CUSTOM_LIB_URL:"file:"===c.location.protocol&&"
        mixpanel.init("${config.mixpanelToken}", {
          debug: false,
          track_pageview: true,
          persistence: 'localStorage',
          api_host: 'https://api.mixpanel.com',
        });
        mixpanel.track('Page View', {
          'Page': document.title,
          'URL': window.location.href,
          'Path': window.location.pathname
        });
      `
      document.head.appendChild(script)
    }
    return () => {
      const scripts = document.querySelectorAll('script[src*="googletagmanager"], script[src*="mixpanel"]')
      scripts.forEach(script => script.remove())
    }
  }, [])
  return null
}
export default Analytics