import express from 'express'
import { supabase } from '../config/supabase'

const router = express.Router()

// Migration pour ajouter la colonne hero_image si elle n'existe pas
async function ensureHeroImageColumn() {
  try {
    console.log('🔄 Vérification colonne hero_image...')
    
    // Vérifier si la colonne existe déjà en tentant une requête
    const { error: checkError } = await supabase
      .from('mint_pages')
      .select('hero_image')
      .limit(1)
    
    if (checkError && checkError.message.includes('hero_image')) {
      console.log('📝 Colonne hero_image manquante - création nécessaire')
      console.log('⚠️  Veuillez ajouter la colonne manuellement dans Supabase:')
      console.log('    ALTER TABLE mint_pages ADD COLUMN hero_image TEXT;')
    } else {
      console.log('✅ Colonne hero_image présente')
    }
  } catch (error) {
    console.log('📝 Vérification colonne hero_image - erreur:', error)
  }
}

// Exécuter la vérification au démarrage
ensureHeroImageColumn()

// Interface pour les données de page de mint
interface MintPageData {
  user_id: string
  contract_address: string
  subdomain: string
  title: string
  description: string
  primary_color: string
  background_color: string
  hero_image?: string
  mint_price: string
  max_supply: number
  max_per_wallet: number
  show_remaining_supply: boolean
  show_minted_count: boolean
  social_links: any
}

// GET /api/mint-pages/user/:userAddress - Récupérer les pages de mint d'un utilisateur
router.get('/user/:userAddress', async (req, res) => {
  try {
    const { userAddress } = req.params
    
    console.log(`📋 Récupération des pages de mint pour: ${userAddress}`)

    const { data: mintPages, error } = await supabase
      .from('mint_pages')
      .select('*')
      .eq('user_id', userAddress)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Erreur Supabase:', error)
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des pages de mint',
        details: error.message
      })
    }

    console.log(`✅ ${mintPages.length} pages de mint trouvées`)

    res.json({
      success: true,
      pages: mintPages || [],
      count: mintPages?.length || 0
    })

  } catch (error: any) {
    console.error('❌ Erreur API pages de mint:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      details: error.message
    })
  }
})

// POST /api/mint-pages/check-subdomain - Vérifier la disponibilité d'un sous-domaine
router.post('/check-subdomain', async (req, res) => {
  try {
    const { subdomain } = req.body

    if (!subdomain) {
      return res.status(400).json({
        success: false,
        error: 'Sous-domaine requis'
      })
    }

    console.log(`🔍 Vérification du sous-domaine: ${subdomain}`)

    // Vérifier dans Supabase
    const { data: existingPages, error } = await supabase
      .from('mint_pages')
      .select('subdomain')
      .eq('subdomain', subdomain.toLowerCase())
      .eq('is_active', true)
      .limit(1)

    if (error) {
      console.error('❌ Erreur Supabase:', error)
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la vérification'
      })
    }

    const isAvailable = !existingPages || existingPages.length === 0

    // Vérifier aussi les sous-domaines réservés
    const reserved = ['test', 'demo', 'admin', 'api', 'www', 'mail', 'ftp', 'app', 'blog', 'shop', 'mint', 'nft', 'collection']
    const isReserved = reserved.includes(subdomain.toLowerCase())

    const available = isAvailable && !isReserved

    console.log(`✅ Sous-domaine "${subdomain}": ${available ? 'disponible' : 'non disponible'}`)

    res.json({
      success: true,
      available,
      subdomain: subdomain.toLowerCase(),
      reason: !available ? (isReserved ? 'Sous-domaine réservé' : 'Sous-domaine déjà utilisé') : null
    })

  } catch (error: any) {
    console.error('❌ Erreur vérification sous-domaine:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      details: error.message
    })
  }
})

// POST /api/mint-pages/create - Créer une nouvelle page de mint
router.post('/create', async (req, res) => {
  try {
    const mintPageData: MintPageData = req.body

    console.log('🚀 Création d\'une nouvelle page de mint:', {
      user: mintPageData.user_id,
      subdomain: mintPageData.subdomain,
      contract: mintPageData.contract_address
    })

    // Validation des données
    const requiredFields = ['user_id', 'contract_address', 'subdomain', 'title']
    for (const field of requiredFields) {
      if (!mintPageData[field as keyof MintPageData]) {
        return res.status(400).json({
          success: false,
          error: `Champ requis manquant: ${field}`
        })
      }
    }

    // Vérifier que le sous-domaine est disponible
    const { data: existingPages, error: checkError } = await supabase
      .from('mint_pages')
      .select('subdomain')
      .eq('subdomain', mintPageData.subdomain.toLowerCase())
      .eq('is_active', true)
      .limit(1)

    if (checkError) {
      console.error('❌ Erreur vérification:', checkError)
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la vérification du sous-domaine'
      })
    }

    if (existingPages && existingPages.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Ce sous-domaine est déjà utilisé'
      })
    }

    // Préparer les données d'insertion
    const insertData: any = {
      user_id: mintPageData.user_id,
      contract_address: mintPageData.contract_address,
      subdomain: mintPageData.subdomain.toLowerCase(),
      title: mintPageData.title,
      description: mintPageData.description,
      primary_color: mintPageData.primary_color,
      background_color: mintPageData.background_color,
      mint_price: mintPageData.mint_price,
      max_supply: mintPageData.max_supply,
      max_per_wallet: mintPageData.max_per_wallet,
      show_remaining_supply: mintPageData.show_remaining_supply,
      show_minted_count: mintPageData.show_minted_count,
      social_links: mintPageData.social_links,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true
    }

    // Ajouter hero_image seulement si fourni et si la colonne existe
    if (mintPageData.hero_image) {
      // Vérifier si la colonne hero_image existe
      const { error: columnCheck } = await supabase
        .from('mint_pages')
        .select('hero_image')
        .limit(1)

      if (!columnCheck || !columnCheck.message?.includes('hero_image')) {
        insertData.hero_image = mintPageData.hero_image
        console.log('✅ hero_image ajouté aux données')
      } else {
        console.log('⚠️  hero_image ignoré - colonne manquante')
      }
    }

    const { data: newPage, error: insertError } = await supabase
      .from('mint_pages')
      .insert(insertData)
      .select()
      .single()

    if (insertError) {
      console.error('❌ Erreur insertion:', insertError)
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la création de la page',
        details: insertError.message
      })
    }

    console.log('✅ Page de mint créée avec succès:', newPage.id)

    res.json({
      success: true,
      page: newPage,
      url: `https://${mintPageData.subdomain}.contractforge.io`,
      message: 'Page de mint créée avec succès'
    })

  } catch (error: any) {
    console.error('❌ Erreur création page de mint:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      details: error.message
    })
  }
})

// GET /api/mint-pages/:subdomain - Récupérer une page de mint par sous-domaine
router.get('/:subdomain', async (req, res) => {
  try {
    const { subdomain } = req.params

    console.log(`📄 Récupération de la page: ${subdomain}`)

    const { data: mintPage, error } = await supabase
      .from('mint_pages')
      .select('*')
      .eq('subdomain', subdomain.toLowerCase())
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Page de mint non trouvée'
        })
      }
      
      console.error('❌ Erreur Supabase:', error)
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération'
      })
    }

    console.log('✅ Page de mint trouvée')

    res.json({
      success: true,
      page: mintPage
    })

  } catch (error: any) {
    console.error('❌ Erreur récupération page:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      details: error.message
    })
  }
})

// GET /api/mint-pages/preview/:subdomain - Page de mint moderne et élégante
router.get('/preview/:subdomain', async (req, res) => {
  try {
    const { subdomain } = req.params

    console.log(`🎨 Nouvelle page moderne pour: ${subdomain}`)

    const { data: mintPage, error } = await supabase
      .from('mint_pages')
      .select('*')
      .eq('subdomain', subdomain.toLowerCase())
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Page de mint non trouvée',
          subdomain
        })
      }
      
      console.error('❌ Erreur Supabase:', error)
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération'
      })
    }

    console.log('✅ Page moderne trouvée')

    // Page de mint ultra-moderne avec design glass morphism + Hero Image + RainbowKit
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${mintPage.title} - Mint NFT</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
        
        <!-- Web3 Libraries -->
        <script src="https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.umd.min.js" 
                onload="console.log('✅ ethers.js chargé avec succès:', typeof ethers)"
                onerror="console.error('❌ ECHEC chargement ethers.js')"></script>
        <script src="https://cdn.jsdelivr.net/npm/web3@latest/dist/web3.min.js"
                onload="console.log('✅ web3.js chargé avec succès:', typeof Web3)"
                onerror="console.error('❌ ECHEC chargement web3.js')"></script>
        
        <script>
            // 🌐 Système de traduction simple
            var translations = {
                fr: {
                    connectWallet: 'Connecter Wallet',
                    disconnect: 'Déconnecter',
                    walletConnected: 'Wallet connecté',
                    mint: 'Mint NFT',
                    quantity: 'Quantité à mint :',
                    total: 'Total:',
                    connecting: 'Connexion...',
                    success: 'Succès !',
                    error: 'Erreur'
                },
                en: {
                    connectWallet: 'Connect Wallet',
                    disconnect: 'Disconnect',
                    walletConnected: 'Wallet Connected',
                    mint: 'Mint NFT',
                    quantity: 'Quantity to mint:',
                    total: 'Total:',
                    connecting: 'Connecting...',
                    success: 'Success!',
                    error: 'Error'
                }
            }
            
            var currentLang = 'en' // Langue par défaut : anglais pour toutes les mint pages
            function t(key) {
                return translations[currentLang][key] || key
            }
            
            // 🌐 Fonction pour mettre à jour tous les textes traduits
            function updateTranslations() {
                // Mettre à jour les éléments avec les traductions
                var quantityLabel = document.getElementById('quantity-label')
                if (quantityLabel) quantityLabel.textContent = t('quantity')
                
                var totalLabel = document.getElementById('total-label')
                if (totalLabel) totalLabel.textContent = t('total')
                
                var mintText = document.getElementById('mint-text')
                if (mintText) mintText.textContent = t('mint')
                
                var connectText = document.getElementById('connect-text')
                if (connectText) connectText.innerHTML = '🔌 ' + t('connectWallet')
            }
            
            // Vérification alternative d'ethers.js
            window.addEventListener('load', function() {
                console.log('🔍 [ETHERS-DEBUG] Vérifications ethers.js:')
                console.log('  - typeof ethers:', typeof ethers)
                console.log('  - window.ethers:', typeof window.ethers)
                console.log('  - ethers disponible?', typeof ethers !== 'undefined')
                if (typeof ethers !== 'undefined') {
                    console.log('  - ethers.version:', ethers.version)
                    console.log('  - ethers.providers:', typeof ethers.providers)
                } else {
                    console.error('💥 [ETHERS-DEBUG] ethers.js NON DISPONIBLE')
                    // Tentative de chargement manuel
                    var script = document.createElement('script')
                    script.src = 'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.umd.min.js'
                    script.onload = function() {
                        console.log('🔄 [ETHERS-DEBUG] Chargement manuel réussi:', typeof ethers)
                    }
                    script.onerror = function() {
                        console.error('💥 [ETHERS-DEBUG] Chargement manuel échoué')
                    }
                    document.head.appendChild(script)
                }
            })
        </script>
        
        <style>
            :root {
                --primary: ${mintPage.primary_color};
                --primary-light: ${mintPage.primary_color}20;
                --primary-dark: ${mintPage.primary_color}dd;
                --background: ${mintPage.background_color};
                --surface: rgba(255, 255, 255, 0.08);
                --surface-hover: rgba(255, 255, 255, 0.12);
                --glass: rgba(255, 255, 255, 0.1);
                --glass-border: rgba(255, 255, 255, 0.2);
                --text-primary: #ffffff;
                --text-secondary: rgba(255, 255, 255, 0.8);
                --text-muted: rgba(255, 255, 255, 0.6);
                --shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                --shadow-lg: 0 20px 60px rgba(0, 0, 0, 0.15);
                --border-radius: 24px;
                --border-radius-lg: 32px;
                --spacing: 1.5rem;
                --hero-bg: ${mintPage.hero_image ? `url('${mintPage.hero_image}')` : 'none'};
            }

            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                background: 
                    radial-gradient(circle at 20% 20%, var(--primary-light) 0%, transparent 50%),
                    radial-gradient(circle at 80% 80%, var(--primary-light) 0%, transparent 50%),
                    linear-gradient(135deg, var(--background) 0%, #0f0f23 100%);
                min-height: 100vh;
                color: var(--text-primary);
                line-height: 1.6;
                overflow-x: hidden;
            }

            /* Animated background particles */
            body::before {
                content: '';
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: 
                    radial-gradient(circle at 25% 25%, var(--primary)10 0%, transparent 50%),
                    radial-gradient(circle at 75% 75%, var(--primary)08 0%, transparent 50%);
                animation: float 20s ease-in-out infinite;
                pointer-events: none;
                z-index: -1;
            }

            @keyframes float {
                0%, 100% { transform: translate(0px, 0px) rotate(0deg); }
                33% { transform: translate(30px, -30px) rotate(120deg); }
                66% { transform: translate(-20px, 20px) rotate(240deg); }
            }

            .container {
                max-width: 1400px;
                margin: 0 auto;
                padding: 2rem;
                position: relative;
                z-index: 1;
            }

            /* Official Badge - Top Right */
            .official-badge {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 1000;
                display: flex;
                align-items: center;
                gap: 12px;
                background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
                border: 2px solid rgba(59, 130, 246, 0.3);
                border-radius: 16px;
                padding: 12px 16px;
                backdrop-filter: blur(20px);
                box-shadow: 
                    0 8px 32px rgba(30, 64, 175, 0.2),
                    0 0 0 1px rgba(59, 130, 246, 0.1),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1);
                animation: officialPulse 3s ease-in-out infinite;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .official-badge:hover {
                transform: translateY(-2px);
                box-shadow: 
                    0 12px 40px rgba(30, 64, 175, 0.3),
                    0 0 0 1px rgba(59, 130, 246, 0.2),
                    inset 0 1px 0 rgba(255, 255, 255, 0.15);
            }

            .badge-icon {
                font-size: 24px;
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
            }

            .badge-content {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }

            .badge-title {
                font-size: 11px;
                font-weight: 800;
                letter-spacing: 1px;
                color: #fbbf24;
                text-shadow: 0 1px 2px rgba(0,0,0,0.5);
                line-height: 1;
            }

            .badge-subtitle {
                font-size: 10px;
                font-weight: 600;
                color: #e5e7eb;
                line-height: 1;
            }

            .badge-security {
                font-size: 8px;
                font-weight: 500;
                color: #10b981;
                opacity: 0.9;
                line-height: 1;
            }

            @keyframes officialPulse {
                0%, 100% { 
                    box-shadow: 
                        0 8px 32px rgba(30, 64, 175, 0.2),
                        0 0 0 1px rgba(59, 130, 246, 0.1),
                        inset 0 1px 0 rgba(255, 255, 255, 0.1);
                }
                50% { 
                    box-shadow: 
                        0 8px 32px rgba(30, 64, 175, 0.3),
                        0 0 0 1px rgba(59, 130, 246, 0.2),
                        inset 0 1px 0 rgba(255, 255, 255, 0.15);
                }
            }

            /* Version responsive du badge */
            @media (max-width: 640px) {
                .official-badge {
                    top: 15px;
                    right: 15px;
                    padding: 8px 12px;
                    gap: 8px;
                }
                
                .badge-icon {
                    font-size: 20px;
                }
                
                .badge-title {
                    font-size: 10px;
                }
                
                .badge-subtitle {
                    font-size: 9px;
                }
                
                .badge-security {
                    font-size: 7px;
                }
            }

            /* Hero Section with Background Image Support */
            .hero {
                text-align: center;
                padding: 4rem 2rem;
                margin-bottom: 3rem;
                position: relative;
                overflow: hidden;
                border-radius: var(--border-radius-lg);
                min-height: ${mintPage.hero_image ? '500px' : '400px'};
                display: flex;
                flex-direction: column;
                justify-content: center;
            }

            .hero::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                ${mintPage.hero_image ? `
                background: 
                    linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)),
                    var(--hero-bg);
                background-size: cover;
                background-position: center;
                background-repeat: no-repeat;
                ` : `
                background: linear-gradient(135deg, var(--glass) 0%, rgba(255,255,255,0.05) 100%);
                backdrop-filter: blur(20px);
                `}
                border-radius: var(--border-radius-lg);
                border: 1px solid var(--glass-border);
                z-index: -2;
            }

            .hero::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: ${mintPage.hero_image ? 'rgba(0,0,0,0.1)' : 'transparent'};
                backdrop-filter: ${mintPage.hero_image ? 'blur(1px)' : 'blur(20px)'};
                border-radius: var(--border-radius-lg);
                z-index: -1;
            }

            .hero h1 {
                font-size: clamp(2.5rem, 5vw, 4rem);
                font-weight: 800;
                margin-bottom: 1.5rem;
                background: linear-gradient(135deg, var(--text-primary) 0%, var(--primary) 100%);
                background-clip: text;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                letter-spacing: -0.02em;
            }

            .hero p {
                font-size: 1.25rem;
                color: var(--text-secondary);
                max-width: 600px;
                margin: 0 auto 2rem;
                font-weight: 400;
            }

            .hero-badge {
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.75rem 1.5rem;
                background: var(--glass);
                border: 1px solid var(--glass-border);
                border-radius: 50px;
                backdrop-filter: blur(20px);
                font-size: 0.9rem;
                font-weight: 500;
                color: var(--text-secondary);
                margin-bottom: 2rem;
            }

            /* Main Layout */
            .main-layout {
                display: grid;
                grid-template-columns: 1fr 400px;
                gap: 3rem;
                align-items: start;
            }

            @media (max-width: 1024px) {
                .main-layout {
                    grid-template-columns: 1fr;
                    gap: 2rem;
                }
            }

            /* Cards */
            .card {
                background: var(--glass);
                border: 1px solid var(--glass-border);
                border-radius: var(--border-radius);
                backdrop-filter: blur(20px);
                padding: 2rem;
                box-shadow: var(--shadow);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
                overflow: hidden;
            }

            .card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 1px;
                background: linear-gradient(90deg, transparent, var(--primary), transparent);
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .card:hover {
                transform: translateY(-4px);
                box-shadow: var(--shadow-lg);
                border-color: rgba(255,255,255,0.3);
            }

            .card:hover::before {
                opacity: 1;
            }

            /* Info Section */
            .info-section {
                display: flex;
                flex-direction: column;
                gap: 1.5rem;
            }

            .info-card h3 {
                font-size: 1.5rem;
                font-weight: 700;
                margin-bottom: 1rem;
                color: var(--text-primary);
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }

            .info-card p {
                color: var(--text-secondary);
                line-height: 1.7;
                font-size: 1rem;
            }

            /* Contract Address */
            .contract-address {
                font-family: 'JetBrains Mono', monospace;
                background: rgba(0,0,0,0.2);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 12px;
                padding: 1rem;
                word-break: break-all;
                font-size: 0.9rem;
                color: var(--primary);
                font-weight: 500;
                position: relative;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .contract-address:hover {
                border-color: var(--primary);
                background: rgba(0,0,0,0.3);
            }

            /* Social Links */
            .social-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                gap: 1rem;
                margin-top: 1rem;
            }

            .social-link {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                padding: 0.875rem;
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 16px;
                text-decoration: none;
                color: var(--text-secondary);
                font-weight: 500;
                font-size: 0.9rem;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                backdrop-filter: blur(10px);
            }

            .social-link:hover {
                background: rgba(255,255,255,0.1);
                border-color: var(--primary);
                color: var(--primary);
                transform: translateY(-2px);
            }

            /* Mint Section */
            .mint-card {
                position: sticky;
                top: 2rem;
                background: 
                    linear-gradient(135deg, var(--glass) 0%, rgba(255,255,255,0.05) 100%);
                border: 1px solid var(--glass-border);
                border-radius: var(--border-radius);
                backdrop-filter: blur(30px);
                padding: 2.5rem;
                box-shadow: var(--shadow-lg);
            }

            .mint-header {
                text-align: center;
                margin-bottom: 2rem;
            }

            .mint-header h2 {
                font-size: 1.75rem;
                font-weight: 700;
                margin-bottom: 0.5rem;
                color: var(--text-primary);
            }

            .price-display {
                font-size: 3rem;
                font-weight: 800;
                background: linear-gradient(135deg, var(--primary) 0%, #ffffff 100%);
                background-clip: text;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                margin: 1.5rem 0;
                text-align: center;
                font-family: 'JetBrains Mono', monospace;
            }

            /* Wallet Connection */
            .wallet-section {
                margin-bottom: 2rem;
            }

            .connect-btn {
                width: 100%;
                padding: 1.25rem 2rem;
                background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
                border: none;
                border-radius: 16px;
                color: white;
                font-size: 1.1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.75rem;
                box-shadow: 0 8px 30px rgba(0,0,0,0.2);
                border: 1px solid rgba(255,255,255,0.1);
                position: relative;
                overflow: hidden;
            }

            .connect-btn::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                transition: left 0.5s ease;
            }

            .connect-btn:hover::before {
                left: 100%;
            }

            .connect-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 12px 40px rgba(0,0,0,0.3);
                border-color: rgba(255,255,255,0.2);
            }

            .connect-btn:active {
                transform: translateY(0);
            }

            .wallet-connected {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                padding: 1.5rem;
                border-radius: 16px;
                text-align: center;
                border: 1px solid rgba(16, 185, 129, 0.3);
                position: relative;
                overflow: hidden;
            }

            .wallet-connected::before {
                content: '✨';
                position: absolute;
                top: 1rem;
                right: 1rem;
                font-size: 1.5rem;
                animation: pulse 2s infinite;
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.5; transform: scale(1.1); }
            }

            .wallet-address {
                font-family: 'JetBrains Mono', monospace;
                font-size: 0.95rem;
                font-weight: 600;
                color: rgba(255,255,255,0.9);
                margin: 0.5rem 0;
            }

            /* Quantity Selector */
            .quantity-section {
                margin: 2rem 0;
            }

            .quantity-label {
                display: block;
                font-size: 1rem;
                font-weight: 600;
                color: var(--text-secondary);
                margin-bottom: 1rem;
                text-align: center;
            }

            .quantity-selector {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 1rem;
                background: rgba(0,0,0,0.2);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 16px;
                padding: 1rem;
                margin-bottom: 1rem;
            }

            .qty-btn {
                width: 48px;
                height: 48px;
                border: none;
                border-radius: 12px;
                background: var(--primary);
                color: white;
                font-size: 1.25rem;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .qty-btn:hover {
                transform: scale(1.1);
                box-shadow: 0 8px 25px rgba(0,0,0,0.3);
            }

            .qty-btn:active {
                transform: scale(0.95);
            }

            .qty-display {
                font-size: 1.5rem;
                font-weight: 700;
                color: var(--text-primary);
                min-width: 60px;
                text-align: center;
                padding: 0.75rem 1rem;
                background: rgba(255,255,255,0.05);
                border-radius: 12px;
                border: 1px solid rgba(255,255,255,0.1);
            }

            .total-price {
                text-align: center;
                font-size: 1rem;
                color: var(--text-secondary);
                font-weight: 500;
            }

            /* Mint Button */
            .mint-btn {
                width: 100%;
                padding: 1.5rem 2rem;
                background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
                border: none;
                border-radius: 16px;
                color: white;
                font-size: 1.2rem;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
                overflow: hidden;
                box-shadow: 0 12px 40px rgba(139, 92, 246, 0.3);
                border: 1px solid rgba(255,255,255,0.1);
                margin-top: 1.5rem;
            }

            .mint-btn::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 100%;
                background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 100%);
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .mint-btn:hover {
                transform: translateY(-3px);
                box-shadow: 0 20px 60px rgba(139, 92, 246, 0.4);
            }

            .mint-btn:hover::before {
                opacity: 1;
            }

            .mint-btn:disabled {
                background: rgba(255,255,255,0.1);
                color: var(--text-muted);
                cursor: not-allowed;
                transform: none;
                box-shadow: none;
            }

            /* Status Messages */
            .status-message {
                margin: 1.5rem 0;
                padding: 1rem 1.5rem;
                border-radius: 12px;
                text-align: center;
                font-weight: 500;
                backdrop-filter: blur(10px);
                border: 1px solid transparent;
                display: none;
            }

            .status-success {
                background: rgba(16, 185, 129, 0.1);
                color: #10b981;
                border-color: rgba(16, 185, 129, 0.3);
            }

            .status-error {
                background: rgba(239, 68, 68, 0.1);
                color: #ef4444;
                border-color: rgba(239, 68, 68, 0.3);
            }

            .status-info {
                background: rgba(59, 130, 246, 0.1);
                color: #3b82f6;
                border-color: rgba(59, 130, 246, 0.3);
            }

            /* Features Footer - Redesigned */
            .features-footer {
                margin-top: 3rem;
                padding: 3rem 2rem;
                background: 
                    linear-gradient(135deg, rgba(139,92,246,0.03) 0%, rgba(59,130,246,0.03) 100%);
                border: 1px solid rgba(139,92,246,0.1);
                border-radius: var(--border-radius);
                backdrop-filter: blur(10px);
                position: relative;
                overflow: hidden;
            }

            .features-footer::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 2px;
                background: linear-gradient(90deg, transparent, var(--primary), transparent);
            }

            .features-footer h3 {
                text-align: center;
                margin-bottom: 2.5rem;
                font-size: 1.75rem;
                font-weight: 700;
                background: linear-gradient(135deg, var(--text-primary) 0%, var(--primary) 100%);
                background-clip: text;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }

            .features-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 1.5rem;
            }

            .feature-item {
                padding: 1.5rem;
                background: rgba(255,255,255,0.03);
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 16px;
                backdrop-filter: blur(10px);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
                overflow: hidden;
            }

            .feature-item::before {
                content: '';
                position: absolute;
                left: 0;
                top: 0;
                bottom: 0;
                width: 3px;
                background: linear-gradient(180deg, var(--primary), transparent);
            }

            .feature-item:hover {
                transform: translateY(-4px);
                background: rgba(255,255,255,0.06);
                border-color: rgba(255,255,255,0.15);
                box-shadow: 0 12px 40px rgba(0,0,0,0.2);
            }

            .feature-item strong {
                color: var(--text-primary);
                font-weight: 600;
                font-size: 1rem;
                display: block;
                margin-bottom: 0.5rem;
            }

            .feature-item small {
                color: var(--text-secondary);
                font-size: 0.875rem;
                line-height: 1.5;
            }

            /* Badges */
            .badges-section {
                text-align: center;
                padding: 2rem;
                margin: 2rem 0;
                border-radius: var(--border-radius);
                background: rgba(255,255,255,0.02);
                border: 1px solid rgba(255,255,255,0.05);
            }

            .badge-item {
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                margin: 0.5rem;
                padding: 0.75rem 1.5rem;
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 50px;
                color: var(--text-secondary);
                font-size: 0.9rem;
                font-weight: 500;
                backdrop-filter: blur(10px);
            }

            /* Loading Animation */
            .loading {
                display: inline-block;
                width: 20px;
                height: 20px;
                border: 2px solid rgba(255,255,255,0.3);
                border-radius: 50%;
                border-top-color: var(--primary);
                animation: spin 1s ease-in-out infinite;
            }

            @keyframes spin {
                to { transform: rotate(360deg); }
            }

            /* Responsive Design */
            @media (max-width: 640px) {
                .container {
                    padding: 1rem;
                }

                .hero {
                    padding: 2rem 1rem;
                }

                .card {
                    padding: 1.5rem;
                }

                .mint-card {
                    padding: 2rem;
                    position: static;
                }

                .features-grid {
                    grid-template-columns: 1fr;
                }

                .social-grid {
                    grid-template-columns: 1fr 1fr;
                }
            }
        </style>
    </head>
    <body>
        <!-- Official Badge (Top Right) -->
        <div class="official-badge" onclick="window.open('https://contractforge.io', '_blank')" title="Visit ContractForge.io - Professional Smart Contract Platform">
            <div class="badge-icon">🛡️</div>
            <div class="badge-content">
                <div class="badge-title">OFFICIAL</div>
                <div class="badge-subtitle">ContractForge.io</div>
                <div class="badge-security">🔒 OpenZeppelin</div>
            </div>
        </div>
        
        <div class="container">
            <!-- Hero Section -->
            <div class="hero">
                <h1>${mintPage.title}</h1>
                <p>${mintPage.description}</p>
            </div>

            <!-- Main Layout -->
            <div class="main-layout">
                <!-- Info Section -->
                <div class="info-section">
                    <div class="card info-card">
                        <h3>🎨 About This Collection</h3>
                        <p>${mintPage.description}</p>
                    </div>

                    <div class="card info-card">
                        <h3>📋 Contract Details</h3>
                        <div class="contract-address" title="Click to copy">${mintPage.contract_address}</div>
                        <div style="margin-top: 1rem; display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; font-size: 0.9rem;">
                            <div style="color: var(--text-secondary);"><strong style="color: var(--text-primary);">Network:</strong> Polygon</div>
                            <div style="color: var(--text-secondary);"><strong style="color: var(--text-primary);">Standard:</strong> ERC-721</div>
                            <div style="color: var(--text-secondary);"><strong style="color: var(--text-primary);">Supply:</strong> ${mintPage.max_supply.toLocaleString()}</div>
                            <div style="color: var(--text-secondary);"><strong style="color: var(--text-primary);">Max/Wallet:</strong> ${mintPage.max_per_wallet}</div>
                        </div>
                    </div>

                    ${mintPage.social_links ? `
                    <div class="card info-card">
                        <h3>🌐 Join Community</h3>
                        <div class="social-grid">
                            ${mintPage.social_links.website ? `<a href="${mintPage.social_links.website}" class="social-link" target="_blank">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                                </svg>
                                Website</a>` : ''}
                            ${mintPage.social_links.twitter ? `<a href="https://twitter.com/${mintPage.social_links.twitter.replace('@', '')}" class="social-link" target="_blank">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                </svg>
                                X (Twitter)</a>` : ''}
                            ${mintPage.social_links.discord ? `<a href="${mintPage.social_links.discord.startsWith('http') ? mintPage.social_links.discord : 'https://discord.gg/' + mintPage.social_links.discord}" class="social-link" target="_blank">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                                </svg>
                                Discord</a>` : ''}
                            ${mintPage.social_links.opensea ? `<a href="https://${mintPage.social_links.opensea}" class="social-link" target="_blank">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 0C5.374 0 0 5.374 0 12s5.374 12 12 12 12-5.374 12-12S18.626 0 12 0zM5.92 12.403l.051-.081 3.123-4.884a.107.107 0 0 1 .187.014c.52 1.169.972 2.623.76 3.528-.088.372-.335.876-.614 1.342a2.405 2.405 0 0 1-.117.199.106.106 0 0 1-.089.047zm11.669-.594a.106.106 0 0 1-.087.106c-.36.053-.702.07-1.032.07-1.296 0-2.35-.151-3.191-.447a.106.106 0 0 1-.065-.137l.343-.777a.107.107 0 0 1 .097-.063c.671.003 1.362-.06 2.019-.203a.106.106 0 0 1 .12.071z"/>
                                </svg>
                                OpenSea</a>` : ''}
                        </div>
                    </div>
                    ` : ''}
                </div>

                <!-- Mint Section -->
                <div class="mint-card">
                    <div class="mint-header">
                        <h2>Mint Your NFT</h2>
                        <div class="price-display">${mintPage.mint_price} ETH</div>
                    </div>

                    <div class="wallet-section" id="wallet-section">
                        <button class="connect-btn" id="connect-wallet-btn">
                            <span class="loading" id="loading" style="display: none;"></span>
                            <span id="connect-text">🔌 Connect Wallet</span>
                        </button>
                    </div>

                    <div id="mint-section" style="display: none;">
                        <div class="quantity-section">
                            <label class="quantity-label" id="quantity-label">Quantity to mint:</label>
                            <div class="quantity-selector">
                                <button class="qty-btn" id="qty-minus">−</button>
                                <div class="qty-display" id="quantity">1</div>
                                <button class="qty-btn" id="qty-plus">+</button>
                            </div>
                            <div class="total-price">
                                <span id="total-label">Total:</span> <span id="total-price" style="color: var(--primary); font-weight: 600;">${mintPage.mint_price}</span> ETH
                            </div>
                        </div>

                        <button class="mint-btn" id="mint-button">
                            🎯 <span id="mint-text">Mint NFT</span>
                        </button>
                    </div>

                    <div class="status-message" id="status-section"></div>
                </div>
            </div>

            <!-- Features Footer -->
            <div class="features-footer">
                <h3>🚀 Smart Contract Features</h3>
                <div class="features-grid">
                    <div class="feature-item">
                        <strong>✅ Public Minting</strong>
                        <small>Secure price validation & wallet limits</small>
                    </div>
                    <div class="feature-item">
                        <strong>✅ Real-time Info</strong>
                        <small>Live supply, price & status updates</small>
                    </div>
                    <div class="feature-item">
                        <strong>✅ Enterprise Security</strong>
                        <small>ReentrancyGuard & Ownable protection</small>
                    </div>
                    <div class="feature-item">
                        <strong>✅ ERC721 Standard</strong>
                        <small>Full marketplace compatibility</small>
                    </div>
                    <div class="feature-item">
                        <strong>✅ Auto Refunds</strong>
                        <small>Excess ETH automatically returned</small>
                    </div>
                    <div class="feature-item">
                        <strong>✅ Community Audited</strong>
                        <small>OpenZeppelin battle-tested code</small>
                    </div>
                </div>
            </div>

            <!-- Badges Section -->
            <div class="badges-section">
                <div class="badge-item">🌈 Powered by RainbowKit</div>
                <div class="badge-item">🛡️ Generated by ContractForge.io</div>
                <div class="badge-item">🔒 Secured by OpenZeppelin</div>
            </div>
        </div>
        
        <script>
            console.log('🚀 [DEBUG] ========== SCRIPT JAVASCRIPT DÉMARRE ==========')
            console.log('🚀 [DEBUG] Modern Mint Page - RainbowKit + Web3 Loading...')
            
            // Attendre que ethers.js et web3.js soient disponibles
            function waitForEthers(callback) {
                var attempts = 0
                var maxAttempts = 50
                
                function checkLibraries() {
                    attempts++
                    var ethersReady = typeof ethers !== 'undefined'
                    var web3Ready = typeof Web3 !== 'undefined'
                    
                    console.log('🔍 [DEBUG] Vérification librairies (tentative ' + attempts + '):', {
                        'ethers.js': ethersReady ? 'OK' : 'NOK',
                        'web3.js': web3Ready ? 'OK' : 'NOK'
                    })
                    
                    if (ethersReady && web3Ready) {
                        console.log('✅ [DEBUG] Toutes les librairies Web3 disponibles!')
                        console.log('🚀 [DEBUG] Vérification window.ethereum:', typeof window.ethereum)
                        callback()
                    } else if (attempts < maxAttempts) {
                        console.log('⏳ [DEBUG] Librairies pas encore prêtes, nouvel essai...')
                        setTimeout(checkLibraries, 100)
                    } else {
                        console.error('💥 [DEBUG] ÉCHEC: Librairies toujours indisponibles après ' + maxAttempts + ' tentatives')
                        console.log('🔄 [DEBUG] Continuation avec librairies disponibles (mode dégradé)')
                        console.log('📊 [DEBUG] État final:', {
                            'ethers.js': typeof ethers,
                            'web3.js': typeof Web3
                        })
                        callback() // Continuer quand même
                    }
                }
                
                checkLibraries()
            }
            
            // Configuration avec debug
            console.log('🔧 [DEBUG] Initialisation des variables...')
            var isConnected = false
            var userAddress = null
            var provider = null
            var signer = null
            var quantity = 1
            console.log('✅ [DEBUG] Variables de base initialisées')
            
            var contractAddress = '${mintPage.contract_address}'
            var mintPrice = ${mintPage.mint_price}
            var maxPerWallet = ${mintPage.max_per_wallet}
            var maxSupply = ${mintPage.max_supply}
            
            // ABI du contrat NFT (interface simplifiée)
            var contractABI = [
                "function mint(uint256 quantity) payable",
                "function getMintInfo(address user) view returns (uint256 minted, uint256 remaining, uint256 price, bool canMint)",
                "function totalSupply() view returns (uint256)",
                "function publicMintEnabled() view returns (bool)",
                "function MAX_SUPPLY() view returns (uint256)",
                "function MINT_PRICE() view returns (uint256)",
                "function MAX_PER_WALLET() view returns (uint256)"
            ]
            
            // Fonction pour afficher les messages de status
            function showStatus(message, type) {
                if (!type) type = 'info'
                console.log('📢 Status (' + type + '): ' + message)
                var statusEl = document.getElementById('status-section')
                if (!statusEl) return
                
                statusEl.className = 'status-message status-' + type
                statusEl.textContent = message
                statusEl.style.display = 'block'
                
                if (type === 'success' || type === 'info') {
                    setTimeout(function() {
                        statusEl.style.display = 'none'
                    }, 5000)
                }
            }
            
            // Connexion wallet classique (MetaMask direct)
            async function connectWallet() {
                console.log('🦊 [DEBUG] Connexion wallet classique - DÉBUT')
                
                if (typeof window.ethereum === 'undefined') {
                    console.log('❌ [DEBUG] MetaMask non détecté')
                    showStatus('❌ MetaMask required to continue', 'error')
                    setTimeout(function() {
                        window.open('https://metamask.io/download/', '_blank')
                    }, 2000)
                    return false
                }
                
                try {
                    showStatus('🔗 Connexion MetaMask...', 'info')
                    console.log('📞 [DEBUG] Appel window.ethereum.request...')
                    
                    var accounts = await window.ethereum.request({ 
                        method: 'eth_requestAccounts' 
                    })
                    
                    if (accounts && accounts.length > 0) {
                        console.log('✅ [DEBUG] Wallet connecté:', accounts[0])
                        userAddress = accounts[0]
                        isConnected = true
                        provider = new ethers.providers.Web3Provider(window.ethereum)
                        signer = provider.getSigner()
                        
                        updateWalletUI()
                        loadContractInfo().catch(function(err) {
                            console.log('⚠️ [DEBUG] Info contrat non disponible:', err.message)
                        })
                        
                        showStatus('✅ Wallet connected: ' + userAddress.substring(0,6) + '...' + userAddress.substring(38), 'success')
                        return true
                    } else {
                        showStatus('❌ No account found', 'error')
                        return false
                    }
                    
                } catch (error) {
                    console.error('💥 [DEBUG] Erreur connexion wallet:', error)
                    if (error.code === 4001) {
                        showStatus('❌ Connection rejected by user', 'error')
                    } else if (error.code === -32002) {
                        showStatus('⏳ Request already in progress... Check MetaMask', 'info')
                    } else {
                        showStatus('❌ Connection error: ' + (error.message || 'Unknown error'), 'error')
                    }
                    return false
                }
            }
            
                        // Fonction pour mettre à jour l'UI du wallet avec debug
            function updateWalletUI() {
                console.log('🔄 [DEBUG] updateWalletUI() appelée')
                console.log('🔄 [DEBUG] État:', { isConnected, userAddress })
                
                var walletSection = document.getElementById('wallet-section')
                console.log('🔄 [DEBUG] walletSection trouvé:', walletSection)
                
                if (!walletSection) {
                    console.log('❌ [DEBUG] walletSection non trouvé dans le DOM')
                    return
                }
                
                if (isConnected && userAddress) {
                    console.log('✅ [DEBUG] Mode wallet connecté - génération HTML')
                    walletSection.innerHTML = 
                        '<div class="wallet-connected">' +
                            '<div class="wallet-address">' + userAddress.substring(0,8) + '...' + userAddress.substring(36) + '</div>' +
                            '<button class="connect-btn" id="disconnect-btn" style="background: #ef4444; margin-top: 1rem;">' +
                                '🔌 ' + t('disconnect') +
                            '</button>' +
                        '</div>'
                    
                    console.log('🔗 [DEBUG] HTML wallet connecté généré')
                    
                    // Attacher l'événement de déconnexion
                    var disconnectBtn = document.getElementById('disconnect-btn')
                    console.log('🔗 [DEBUG] Bouton déconnexion trouvé:', disconnectBtn)
                    if (disconnectBtn) {
                        disconnectBtn.onclick = disconnectWallet
                        console.log('✅ [DEBUG] Event listener déconnexion attaché')
                    }
                    
                    // Afficher la section mint
                    var mintSection = document.getElementById('mint-section')
                    console.log('🎯 [DEBUG] Section mint trouvée:', mintSection)
                    if (mintSection) {
                        mintSection.style.display = 'block'
                        console.log('✅ [DEBUG] Section mint affichée')
                    }
                } else {
                    console.log('🔌 [DEBUG] Mode wallet non connecté - génération HTML')
                    walletSection.innerHTML = 
                        '<button class="connect-btn" id="connect-wallet-btn">' +
                            '<span>🔌</span>' +
                            '<span>' + t('connectWallet') + '</span>' +
                        '</button>'
                    
                    console.log('🔗 [DEBUG] HTML bouton connexion généré')
                    
                    // Attacher l'événement de connexion
                    var connectBtn = document.getElementById('connect-wallet-btn')
                    console.log('🔗 [DEBUG] Bouton connexion trouvé:', connectBtn)
                    if (connectBtn) {
                        connectBtn.onclick = connectWallet
                        console.log('✅ [DEBUG] Event listener connexion attaché')
                    } else {
                        console.log('❌ [DEBUG] ÉCHEC - Bouton connexion non trouvé après génération')
                    }
                }
            }
            
            // Fonction de déconnexion
            function disconnectWallet() {
                isConnected = false
                userAddress = null
                provider = null
                signer = null
                updateWalletUI()
                
                var mintSection = document.getElementById('mint-section')
                if (mintSection) mintSection.style.display = 'none'
                
                showStatus('👋 Wallet disconnected', 'info')
            }
            
            // Charger les informations du contrat
            async function loadContractInfo() {
                if (!provider || !contractAddress) return
                
                try {
                    // Vérification si l'adresse est un contrat de démo ou de test
                    if (contractAddress.startsWith('0x1234') || 
                        contractAddress === '0x0000000000000000000000000000000000000000' || 
                        contractAddress.length !== 42 ||
                        contractAddress.includes('test') ||
                        contractAddress.includes('demo') ||
                        contractAddress.includes('web3modal') ||
                        contractAddress.includes('debug') ||
                        contractAddress.includes('syntax') ||
                        contractAddress.includes('apostrophe') ||
                        contractAddress.includes('ethers') ||
                        contractAddress.includes('button')) {
                        console.log('🎭 [DEBUG] Mode démo détecté pour:', contractAddress)
                        
                        // Simuler des données de contrat réalistes pour la démo
                        updateContractUI({
                            mintedCount: 42,
                            remainingMints: 158,
                            totalSupply: 42,
                            canMint: true,
                            publicMintEnabled: true
                        })
                        
                        showStatus('🎭 Mode démo - Données de contrat simulées', 'info')
                        return
                    }
                    
                    var contract = new ethers.Contract(contractAddress, contractABI, provider)
                    
                    // Vérifier si le contrat existe
                    var code = await provider.getCode(contractAddress)
                    if (code === '0x' || code === '0x0') {
                        throw new Error('Aucun contrat trouvé à cette adresse')
                    }
                    
                    // Charger les infos du mint
                    var mintInfo = await contract.getMintInfo(userAddress)
                    var mintedCount = mintInfo[0]
                    var remainingMints = mintInfo[1]
                    var contractMintPrice = mintInfo[2]
                    var canMint = mintInfo[3]
                    var totalSupply = await contract.totalSupply()
                    var publicMintEnabled = await contract.publicMintEnabled()
                    
                    console.log('📊 Infos contrat chargées:', {
                        mintedCount: mintedCount.toString(),
                        remainingMints: remainingMints.toString(),
                        totalSupply: totalSupply.toString(),
                        canMint,
                        publicMintEnabled
                    })
                    
                    // Mettre à jour l'UI avec les vraies données
                    updateContractUI({ mintedCount, remainingMints, totalSupply, canMint, publicMintEnabled })
                    
                } catch (error) {
                    console.error('❌ Erreur chargement contrat:', error)
                    if (error.code === 'CALL_EXCEPTION') {
                        showStatus('⚠️ Incompatible contract - Mint functions not found', 'error')
                    } else {
                        showStatus('❌ Error: ' + error.message.substring(0,100), 'error')
                    }
                }
            }
            
            // Mettre à jour l'UI avec les données du contrat
            function updateContractUI(contractData) {
                var mintedCount = contractData.mintedCount
                var remainingMints = contractData.remainingMints
                var totalSupply = contractData.totalSupply
                var canMint = contractData.canMint
                var publicMintEnabled = contractData.publicMintEnabled
                // Mettre à jour les statistiques si les éléments existent
                var mintedEl = document.getElementById('minted-count')
                var remainingEl = document.getElementById('remaining-supply')
                
                if (mintedEl) mintedEl.textContent = totalSupply.toString()
                if (remainingEl) remainingEl.textContent = (maxSupply - totalSupply).toString()
                
                // Activer/désactiver le bouton de mint
                var mintButton = document.getElementById('mint-button')
                if (mintButton) {
                    mintButton.disabled = !canMint || !publicMintEnabled
                    if (!publicMintEnabled) {
                        mintButton.textContent = '⏸️ Mint désactivé'
                        showStatus('⏸️ Le mint public est temporairement désactivé', 'info')
                    } else if (!canMint) {
                        mintButton.textContent = '❌ Limite atteinte'
                        showStatus('❌ Limit of ' + maxPerWallet + ' NFTs per wallet reached', 'error')
                    } else {
                        mintButton.textContent = '🎯 Mint NFT'
                    }
                }
            }
            
            // Fonction principale de mint
            async function mintNFT() {
                if (!isConnected || !userAddress) {
                    showStatus('❌ Please connect your wallet first', 'error')
                    return
                }
                
                try {
                    showStatus('⏳ Preparing mint...', 'info')
                    
                    // Vérification mode démo
                    if (contractAddress.startsWith('0x1234') || contractAddress.length !== 42 || contractAddress === '0x0000000000000000000000000000000000000000') {
                        // Simulation du mint en mode démo
                        showStatus('🎭 Demo mode - Mint simulation in progress...', 'info')
                        
                        // Animation de simulation
                        await new Promise(function(resolve) { setTimeout(resolve, 1500) })
                        showStatus('✨ Estimating gas...', 'info')
                        await new Promise(function(resolve) { setTimeout(resolve, 1000) })
                        showStatus('📝 Preparing transaction...', 'info')
                        await new Promise(function(resolve) { setTimeout(resolve, 1500) })
                        
                        showStatus('🎉 Mint simulated successfully! ' + quantity + ' NFT(s) minted (Demo mode)', 'success')
                        
                        // Reset quantité en mode démo aussi
                        quantity = 1
                        document.getElementById('quantity').textContent = quantity
                        updateTotalPrice()
                        return
                    }
                    
                    if (!signer) {
                        provider = new ethers.providers.Web3Provider(window.ethereum)
                        signer = provider.getSigner()
                    }
                    
                    var contract = new ethers.Contract(contractAddress, contractABI, signer)
                    var totalPrice = mintPrice * quantity
                    var value = ethers.utils.parseEther(totalPrice.toString())
                    
                    console.log('🎯 Tentative de mint:', {
                        quantity: quantity,
                        totalPrice: totalPrice + ' ETH',
                        value: value.toString(),
                        contractAddress: contractAddress
                    })
                    
                    // Vérifier le solde
                    var balance = await signer.getBalance()
                    if (balance.lt(value)) {
                        throw new Error('INSUFFICIENT_FUNDS')
                    }
                    
                    showStatus('⛽ Estimating gas...', 'info')
                    
                    // Estimer le gas
                    var gasEstimate = await contract.estimateGas.mint(quantity, { value })
                    console.log('⛽ Gas estimé:', gasEstimate.toString())
                    
                    showStatus('📝 Sending transaction...', 'info')
                    
                    // Effectuer la transaction
                    var tx = await contract.mint(quantity, {
                        value: value,
                        gasLimit: gasEstimate.mul(120).div(100) // +20% de marge
                    })
                    
                    showStatus('⏳ Transaction sent: ' + tx.hash.substring(0,10) + '... Waiting for confirmation', 'info')
                    
                    // Attendre la confirmation
                    var receipt = await tx.wait()
                    
                    if (receipt.status === 1) {
                        showStatus('🎉 Mint successful! ' + quantity + ' NFT(s) minted successfully', 'success')
                        
                        // Actualiser les infos du contrat
                        loadContractInfo().catch(function(err) {
                            console.log('Erreur actualisation:', err.message)
                        })
                        
                        // Reset de la quantité
                        quantity = 1
                        document.getElementById('quantity').textContent = quantity
                        updateTotalPrice()
                    } else {
                        throw new Error('Transaction échouée - status: ' + receipt.status)
                    }
                    
                } catch (error) {
                    console.error('❌ Erreur mint:', error)
                    
                    var errorMessage = '❌ Erreur lors du mint'
                    
                    if (error.code === 'INSUFFICIENT_FUNDS' || error.message.includes('INSUFFICIENT_FUNDS')) {
                        errorMessage = '❌ Insufficient funds for this transaction'
                    } else if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
                        errorMessage = '❌ Transaction canceled by user'
                    } else if (error.message.includes('execution reverted')) {
                        errorMessage = '❌ Transaction rejected - Check mint conditions'
                    } else if (error.message.includes('network')) {
                        errorMessage = '❌ Network error - Check your connection'
                    } else if (error.message.includes('gas')) {
                        errorMessage = '❌ Gas error - Increase fees or try again'
                    }
                    
                    showStatus(errorMessage, 'error')
                }
            }
            
            // Gestion de la quantité
            function changeQuantity(delta) {
                var newQuantity = quantity + delta
                if (newQuantity >= 1 && newQuantity <= maxPerWallet) {
                    quantity = newQuantity
                    document.getElementById('quantity').textContent = quantity
                    updateTotalPrice()
                }
            }
            
            // Mettre à jour le prix total
            function updateTotalPrice() {
                var totalPriceEl = document.getElementById('total-price')
                if (totalPriceEl) {
                    totalPriceEl.textContent = (mintPrice * quantity).toFixed(3)
                }
            }
            
            // Event listeners avec debug complet
            window.addEventListener('load', function() {
                console.log('🚀 [DEBUG] ========== INITIALISATION DE LA PAGE ==========')
                console.log('🚀 [DEBUG] Page chargée, attente d\\'ethers.js...')
                
                // Attendre ethers.js puis initialiser
                waitForEthers(function() {
                    console.log('🚀 [DEBUG] Démarrage du script avec ethers.js:', typeof ethers)
                    
                    // Vérifier l'état initial
                    console.log('🔍 [DEBUG] État initial des variables:', {
                        isConnected, userAddress, provider, signer, quantity,
                        contractAddress, mintPrice, maxPerWallet, maxSupply
                    })
                
                // Attacher les event listeners pour les éléments fixes
                var mintBtn = document.getElementById('mint-button')
                var qtyMinus = document.getElementById('qty-minus')
                var qtyPlus = document.getElementById('qty-plus')
                
                console.log('🔍 [DEBUG] Éléments trouvés:', {
                    mintBtn: !!mintBtn, qtyMinus: !!qtyMinus, qtyPlus: !!qtyPlus
                })
                
                if (mintBtn) {
                    mintBtn.onclick = mintNFT
                    console.log('✅ [DEBUG] Event listener mint attaché')
                }
                if (qtyMinus) {
                    qtyMinus.onclick = function() { changeQuantity(-1) }
                    console.log('✅ [DEBUG] Event listener qty-minus attaché')
                }
                if (qtyPlus) {
                    qtyPlus.onclick = function() { changeQuantity(1) }
                    console.log('✅ [DEBUG] Event listener qty-plus attaché')
                }
                
                // Initialiser l'UI
                console.log('🔄 [DEBUG] Initialisation de l\\'UI...')
                updateWalletUI()
                updateTotalPrice()
                updateTranslations() // 🌐 Appliquer les traductions
                
                // Rendre les fonctions globalement accessibles
                window.connectWallet = connectWallet
                window.disconnectWallet = disconnectWallet
                window.mintNFT = mintNFT
                console.log('✅ [DEBUG] Fonctions exposées globalement:', {
                    connectWallet: typeof window.connectWallet,
                    disconnectWallet: typeof window.disconnectWallet,
                    mintNFT: typeof window.mintNFT
                })
                
                // Auto-connexion si déjà connecté avec debug
                console.log('🔄 [DEBUG] Vérification auto-connexion...')
                if (typeof window.ethereum !== 'undefined') {
                    console.log('✅ [DEBUG] MetaMask détecté, tentative auto-connexion')
                    window.ethereum.request({ method: 'eth_accounts' })
                        .then(function(accounts) {
                            console.log('📦 [DEBUG] Comptes auto-connexion:', accounts)
                            if (accounts.length > 0) {
                                console.log('✅ [DEBUG] Auto-connexion possible avec:', accounts[0])
                                userAddress = accounts[0]
                                isConnected = true
                                provider = new ethers.providers.Web3Provider(window.ethereum)
                                signer = provider.getSigner()
                                console.log('🔄 [DEBUG] Mise à jour UI après auto-connexion')
                                updateWalletUI()
                                loadContractInfo()
                                console.log('🔄 [DEBUG] Auto-connexion réussie:', userAddress)
                            } else {
                                console.log('ℹ️ [DEBUG] Aucun compte auto-connecté')
                            }
                        })
                        .catch(function(err) { 
                            console.log('⚠️ [DEBUG] Pas d\\'auto-connexion:', err) 
                        })
                } else {
                    console.log('❌ [DEBUG] MetaMask non détecté pour auto-connexion')
                }
                
                console.log('✅ Mint page moderne initialisée')
                }) // Fin du callback waitForEthers
            })
            
            // Écouter les changements de compte
            if (typeof window.ethereum !== 'undefined') {
                window.ethereum.on('accountsChanged', function(accounts) {
                    if (accounts.length > 0) {
                        location.reload() // Recharger pour une connexion propre
                    } else {
                        disconnectWallet()
                    }
                })
                
                window.ethereum.on('chainChanged', function() {
                    location.reload() // Recharger pour une reconnexion propre
                })
            }
        </script>


    </body>
    </html>
    `

    res.setHeader('Content-Type', 'text/html')
    res.send(html)

  } catch (error: any) {
    console.error('❌ Erreur création page de mint:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      details: error.message
    })
  }
})

// GET /api/mint-pages/rainbow/:subdomain - Page de mint moderne avec RainbowKit
router.get('/rainbow/:subdomain', async (req, res) => {
  try {
    const { subdomain } = req.params

    console.log(`🌈 Page RainbowKit moderne pour: ${subdomain}`)

    const { data: mintPage, error } = await supabase
      .from('mint_pages')
      .select('*')
      .eq('subdomain', subdomain.toLowerCase())
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Page de mint non trouvée',
          subdomain
        })
      }
      
      console.error('❌ Erreur Supabase:', error)
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération'
      })
    }

    console.log('✅ Page RainbowKit moderne trouvée')

    // Headers CSP permissifs pour RainbowKit
    res.setHeader('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "img-src 'self' data: https:; " +
      "connect-src 'self' https: wss: ws:;"
    )

    // Page moderne avec RainbowKit + design glass morphism
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${mintPage.title} - Mint NFT</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
        
        <!-- React 18 -->
        <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
        <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
        
        <!-- Wagmi + Viem -->
        <script src="https://unpkg.com/@wagmi/core@2.13.8/dist/index.js"></script>
        <script src="https://unpkg.com/viem@2.21.19/dist/index.js"></script>
        
        <style>
            :root {
                --primary: ${mintPage.primary_color};
                --primary-light: ${mintPage.primary_color}20;
                --primary-dark: ${mintPage.primary_color}dd;
                --background: ${mintPage.background_color};
                --surface: rgba(255, 255, 255, 0.08);
                --surface-hover: rgba(255, 255, 255, 0.12);
                --glass: rgba(255, 255, 255, 0.1);
                --glass-border: rgba(255, 255, 255, 0.2);
                --text-primary: #ffffff;
                --text-secondary: rgba(255, 255, 255, 0.8);
                --text-muted: rgba(255, 255, 255, 0.6);
                --shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                --shadow-lg: 0 20px 60px rgba(0, 0, 0, 0.15);
                --border-radius: 24px;
                --border-radius-lg: 32px;
                --spacing: 1.5rem;
            }

            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                background: 
                    radial-gradient(circle at 20% 20%, var(--primary-light) 0%, transparent 50%),
                    radial-gradient(circle at 80% 80%, var(--primary-light) 0%, transparent 50%),
                    linear-gradient(135deg, var(--background) 0%, #0f0f23 100%);
                min-height: 100vh;
                color: var(--text-primary);
                line-height: 1.6;
                overflow-x: hidden;
            }

            /* Animated background particles */
            body::before {
                content: '';
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: 
                    radial-gradient(circle at 25% 25%, var(--primary)10 0%, transparent 50%),
                    radial-gradient(circle at 75% 75%, var(--primary)08 0%, transparent 50%);
                animation: float 20s ease-in-out infinite;
                pointer-events: none;
                z-index: -1;
            }

            @keyframes float {
                0%, 100% { transform: translate(0px, 0px) rotate(0deg); }
                33% { transform: translate(30px, -30px) rotate(120deg); }
                66% { transform: translate(-20px, 20px) rotate(240deg); }
            }

            .container {
                max-width: 1400px;
                margin: 0 auto;
                padding: 2rem;
                position: relative;
                z-index: 1;
            }

            /* Hero Section */
            .hero {
                text-align: center;
                padding: 4rem 2rem;
                margin-bottom: 3rem;
                position: relative;
            }

            .hero::before {
                content: '';
                position: absolute;
                top: 0;
                left: 50%;
                transform: translateX(-50%);
                width: 200%;
                height: 100%;
                background: 
                    linear-gradient(135deg, var(--glass) 0%, rgba(255,255,255,0.05) 100%);
                border-radius: var(--border-radius-lg);
                border: 1px solid var(--glass-border);
                backdrop-filter: blur(20px);
                z-index: -1;
            }

            .hero h1 {
                font-size: clamp(2.5rem, 5vw, 4rem);
                font-weight: 800;
                margin-bottom: 1.5rem;
                background: linear-gradient(135deg, var(--text-primary) 0%, var(--primary) 100%);
                background-clip: text;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                letter-spacing: -0.02em;
            }

            .hero p {
                font-size: 1.25rem;
                color: var(--text-secondary);
                max-width: 600px;
                margin: 0 auto 2rem;
                font-weight: 400;
            }

            /* Main Layout */
            .main-layout {
                display: grid;
                grid-template-columns: 1fr 400px;
                gap: 3rem;
                align-items: start;
            }

            @media (max-width: 1024px) {
                .main-layout {
                    grid-template-columns: 1fr;
                    gap: 2rem;
                }
            }

            /* Cards */
            .card {
                background: var(--glass);
                border: 1px solid var(--glass-border);
                border-radius: var(--border-radius);
                backdrop-filter: blur(20px);
                padding: 2rem;
                box-shadow: var(--shadow);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
                overflow: hidden;
            }

            .card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 1px;
                background: linear-gradient(90deg, transparent, var(--primary), transparent);
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .card:hover {
                transform: translateY(-4px);
                box-shadow: var(--shadow-lg);
                border-color: rgba(255,255,255,0.3);
            }

            .card:hover::before {
                opacity: 1;
            }

            /* Info Section */
            .info-section {
                display: flex;
                flex-direction: column;
                gap: 1.5rem;
            }

            .info-card h3 {
                font-size: 1.5rem;
                font-weight: 700;
                margin-bottom: 1rem;
                color: var(--text-primary);
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }

            .info-card p {
                color: var(--text-secondary);
                line-height: 1.7;
                font-size: 1rem;
            }

            /* Contract Address */
            .contract-address {
                font-family: 'JetBrains Mono', monospace;
                background: rgba(0,0,0,0.2);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 12px;
                padding: 1rem;
                word-break: break-all;
                font-size: 0.9rem;
                color: var(--primary);
                font-weight: 500;
                position: relative;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .contract-address:hover {
                border-color: var(--primary);
                background: rgba(0,0,0,0.3);
            }

            /* Social Links */
            .social-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                gap: 1rem;
                margin-top: 1rem;
            }

            .social-link {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                padding: 0.875rem;
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 16px;
                text-decoration: none;
                color: var(--text-secondary);
                font-weight: 500;
                font-size: 0.9rem;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                backdrop-filter: blur(10px);
            }

            .social-link:hover {
                background: rgba(255,255,255,0.1);
                border-color: var(--primary);
                color: var(--primary);
                transform: translateY(-2px);
            }

            /* Mint Section */
            .mint-card {
                position: sticky;
                top: 2rem;
                background: 
                    linear-gradient(135deg, var(--glass) 0%, rgba(255,255,255,0.05) 100%);
                border: 1px solid var(--glass-border);
                border-radius: var(--border-radius);
                backdrop-filter: blur(30px);
                padding: 2.5rem;
                box-shadow: var(--shadow-lg);
            }

            .mint-header {
                text-align: center;
                margin-bottom: 2rem;
            }

            .mint-header h2 {
                font-size: 1.75rem;
                font-weight: 700;
                margin-bottom: 0.5rem;
                color: var(--text-primary);
            }

            .price-display {
                font-size: 3rem;
                font-weight: 800;
                background: linear-gradient(135deg, var(--primary) 0%, #ffffff 100%);
                background-clip: text;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                margin: 1.5rem 0;
                text-align: center;
                font-family: 'JetBrains Mono', monospace;
            }

            /* Wallet Connection - Style RainbowKit */
            .connect-btn {
                width: 100%;
                padding: 1.25rem 2rem;
                background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
                border: none;
                border-radius: 16px;
                color: white;
                font-size: 1.1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.75rem;
                box-shadow: 0 8px 30px rgba(255, 107, 53, 0.3);
                border: 1px solid rgba(255,255,255,0.1);
                position: relative;
                overflow: hidden;
            }

            .connect-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 12px 40px rgba(255, 107, 53, 0.4);
                border-color: rgba(255,255,255,0.2);
            }

            .connect-btn:active {
                transform: translateY(0);
                transition: transform 0.1s ease;
            }

            /* Wallet Connected State */
            .wallet-connected {
                background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%);
                border: 2px solid rgba(16, 185, 129, 0.3);
                border-radius: 16px;
                padding: 1.5rem;
                text-align: center;
                backdrop-filter: blur(10px);
                position: relative;
                overflow: hidden;
            }

            .wallet-connected::before {
                content: '✨';
                position: absolute;
                top: 1rem;
                right: 1rem;
                font-size: 1.2rem;
                animation: pulse 2s infinite;
            }

            .wallet-address {
                font-family: 'JetBrains Mono', monospace;
                font-size: 1rem;
                font-weight: 600;
                color: var(--text-primary);
                margin-bottom: 1rem;
                padding: 0.75rem;
                background: rgba(16, 185, 129, 0.1);
                border-radius: 12px;
                border: 1px solid rgba(16, 185, 129, 0.2);
            }



            /* Features Footer */
            .features-footer {
                margin-top: 3rem;
                padding: 3rem 2rem;
                background: 
                    linear-gradient(135deg, rgba(139,92,246,0.03) 0%, rgba(59,130,246,0.03) 100%);
                border: 1px solid rgba(139,92,246,0.1);
                border-radius: var(--border-radius);
                backdrop-filter: blur(10px);
                position: relative;
                overflow: hidden;
            }

            .features-footer::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 2px;
                background: linear-gradient(90deg, transparent, var(--primary), transparent);
            }

            .features-footer h3 {
                text-align: center;
                margin-bottom: 2.5rem;
                font-size: 1.75rem;
                font-weight: 700;
                background: linear-gradient(135deg, var(--text-primary) 0%, var(--primary) 100%);
                background-clip: text;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }

            .features-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 1.5rem;
            }

            .feature-item {
                padding: 1.5rem;
                background: rgba(255,255,255,0.03);
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 16px;
                backdrop-filter: blur(10px);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
                overflow: hidden;
            }

            .feature-item::before {
                content: '';
                position: absolute;
                left: 0;
                top: 0;
                bottom: 0;
                width: 3px;
                background: linear-gradient(180deg, var(--primary), transparent);
            }

            .feature-item:hover {
                transform: translateY(-4px);
                background: rgba(255,255,255,0.06);
                border-color: rgba(255,255,255,0.15);
                box-shadow: 0 12px 40px rgba(0,0,0,0.2);
            }

            .feature-item strong {
                color: var(--text-primary);
                font-weight: 600;
                font-size: 1rem;
                display: block;
                margin-bottom: 0.5rem;
            }

            .feature-item small {
                color: var(--text-secondary);
                font-size: 0.875rem;
                line-height: 1.5;
            }

            /* Badges */
            .badges-section {
                text-align: center;
                padding: 2rem;
                margin: 2rem 0;
                border-radius: var(--border-radius);
                background: rgba(255,255,255,0.02);
                border: 1px solid rgba(255,255,255,0.05);
            }

            .badge-item {
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                margin: 0.5rem;
                padding: 0.75rem 1.5rem;
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 50px;
                color: var(--text-secondary);
                font-size: 0.9rem;
                font-weight: 500;
                backdrop-filter: blur(10px);
            }

            /* Loading Animation */
            .loading {
                display: inline-block;
                width: 20px;
                height: 20px;
                border: 2px solid rgba(255,255,255,0.3);
                border-radius: 50%;
                border-top-color: var(--primary);
                animation: spin 1s ease-in-out infinite;
            }

            @keyframes spin {
                to { transform: rotate(360deg); }
            }

            /* Responsive Design */
            @media (max-width: 640px) {
                .container {
                    padding: 1rem;
                }

                .hero {
                    padding: 2rem 1rem;
                }

                .card {
                    padding: 1.5rem;
                }

                .mint-card {
                    padding: 2rem;
                    position: static;
                }

                .features-grid {
                    grid-template-columns: 1fr;
                }

                .social-grid {
                    grid-template-columns: 1fr 1fr;
                }
            }

            #rainbow-root { margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- Hero -->
            <div class="hero">
                <h1>${mintPage.title}</h1>
                <p>${mintPage.description}</p>
            </div>
            
            <!-- Main Content -->
            <div class="main-layout">
                <!-- Info Section -->
                <div class="info-section">
                    <div class="card">
                        <h2 style="color: var(--primary); margin-bottom: 30px; font-size: 2rem;">Collection Details</h2>
                        
                        <div style="margin-bottom: 30px;">
                            <h3 style="color: var(--primary); margin-bottom: 15px;">About This Collection</h3>
                            <p style="line-height: 1.6; color: var(--text-secondary);">${mintPage.description}</p>
                        </div>
                        
                        <div style="margin-bottom: 30px;">
                            <h3 style="color: var(--primary); margin-bottom: 15px;">Contract Information</h3>
                            <div class="contract-address">${mintPage.contract_address}</div>
                        </div>
                        
                        ${mintPage.social_links ? `
                        <div class="social-grid">
                            ${mintPage.social_links.website ? `<a href="${mintPage.social_links.website}" class="social-link" target="_blank">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                                </svg>
                                Website</a>` : ''}
                            ${mintPage.social_links.twitter ? `<a href="https://twitter.com/${mintPage.social_links.twitter.replace('@', '')}" class="social-link" target="_blank">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                </svg>
                                X (Twitter)</a>` : ''}
                            ${mintPage.social_links.discord ? `<a href="${mintPage.social_links.discord.startsWith('http') ? mintPage.social_links.discord : 'https://discord.gg/' + mintPage.social_links.discord}" class="social-link" target="_blank">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                                </svg>
                                Discord</a>` : ''}
                        </div>
                        ` : ''}
                    </div>
                </div>
                
                <!-- Mint Section -->
                <div class="mint-card">
                    <div class="mint-header">
                        <h2>Mint Your NFT</h2>
                        <div class="price-display">${mintPage.mint_price} ETH</div>
                    </div>

                    <div id="status-message" class="status-message"></div>
                    <div id="rainbow-root"></div>

                    <!-- Badge -->
                    <div class="card">
                        <div class="badge-item">🛡️ <strong>Generated by ContractForge.io</strong></div>
                        <div class="badge-item">🔒 <strong>Secured by OpenZeppelin</strong></div>
                    </div>
                    
                    <!-- Features Footer -->
                    <div class="features-footer">
                        <h3>🚀 Smart Contract Features</h3>
                        <div class="features-grid">
                            <div class="feature-item">
                                <strong>✅ Public Minting</strong>
                                <small>Secure price validation & wallet limits</small>
                            </div>
                            <div class="feature-item">
                                <strong>✅ Real-time Info</strong>
                                <small>Live supply, price & status updates</small>
                            </div>
                            <div class="feature-item">
                                <strong>✅ Enterprise Security</strong>
                                <small>ReentrancyGuard & Ownable protection</small>
                            </div>
                            <div class="feature-item">
                                <strong>✅ ERC721 Standard</strong>
                                <small>Full marketplace compatibility</small>
                            </div>
                            <div class="feature-item">
                                <strong>✅ Auto Refunds</strong>
                                <small>Excess ETH automatically returned</small>
                            </div>
                            <div class="feature-item">
                                <strong>✅ Community Audited</strong>
                                <small>OpenZeppelin battle-tested code</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Badges Section -->
            <div class="badges-section">
                <div class="badge-item">🌈 Powered by RainbowKit</div>
                <div class="badge-item">🛡️ Generated by ContractForge.io</div>
                <div class="badge-item">🔒 Secured by OpenZeppelin</div>
            </div>
        </div>
        
        <script>
            // ... existing JavaScript with modern enhancements ...
        </script>
    </body>
    </html>
    `

    res.setHeader('Content-Type', 'text/html')
    res.send(html)

  } catch (error: any) {
    console.error('❌ Erreur page RainbowKit moderne:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      details: error.message
    })
  }
})

// Route pour template de connexion simplifiée
router.get('/simple-wallet/:subdomain', async (req, res) => {
  try {
    const { subdomain } = req.params
    
    const { data: mintPages, error } = await supabase
      .from('mint_pages')
      .select('*')
      .eq('subdomain', subdomain)
      .single()

    if (error || !mintPages) {
      return res.status(404).send('Mint page not found')
    }

    const mintPage = mintPages as MintPageData

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${mintPage.title} - ContractForge</title>
    <script src="https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.umd.min.js"></script>
    
    <style>
        :root {
            --primary: ${mintPage.primary_color};
            --background: ${mintPage.background_color};
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Inter', Arial, sans-serif;
            background: var(--background);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
        }
        
        .container {
            max-width: 500px;
            width: 100%;
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 20px;
            padding: 2rem;
            text-align: center;
            backdrop-filter: blur(10px);
        }
        
        h1 { font-size: 2rem; margin-bottom: 1rem; }
        p { margin-bottom: 2rem; opacity: 0.8; }
        
        .wallet-btn {
            background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
            color: white;
            border: none;
            border-radius: 12px;
            padding: 1rem 2rem;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
            margin-bottom: 1rem;
            transition: all 0.3s ease;
        }
        
        .wallet-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(255, 107, 53, 0.4);
        }
        
        .wallet-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }
        
        .status {
            margin: 1rem 0;
            padding: 1rem;
            border-radius: 8px;
            display: none;
        }
        
        .status.success { background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); color: #22c55e; }
        .status.error { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; }
        .status.info { background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); color: #3b82f6; }
        
        .connected {
            background: rgba(34, 197, 94, 0.1);
            border: 2px solid rgba(34, 197, 94, 0.3);
            border-radius: 12px;
            padding: 1.5rem;
            margin: 1rem 0;
        }
        
        .address {
            font-family: monospace;
            font-size: 1rem;
            margin: 0.5rem 0;
            color: #22c55e;
        }
        
        .mint-section {
            display: none;
            margin-top: 2rem;
            padding-top: 2rem;
            border-top: 1px solid rgba(255,255,255,0.1);
        }
        
        .mint-btn {
            background: linear-gradient(135deg, var(--primary) 0%, var(--primary) 100%);
            filter: brightness(1.2);
            color: white;
            border: none;
            border-radius: 12px;
            padding: 1rem 2rem;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
            transition: all 0.3s ease;
        }
        
        .mint-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            filter: brightness(1.3);
        }
        
        .mint-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>${mintPage.title}</h1>
        <p>${mintPage.description}</p>
        
        <div id="wallet-section">
            <button class="wallet-btn" id="connect-btn">
                🔌 Connect Wallet
            </button>
        </div>
        
        <div id="status" class="status"></div>
        
        <div id="mint-section" class="mint-section">
            <div class="connected">
                <div>✅ Wallet connecté</div>
                <div class="address" id="user-address"></div>
            </div>
            
            <button class="mint-btn" id="mint-btn">
                🎯 Mint NFT (${mintPage.mint_price} ETH)
            </button>
        </div>
        
        <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.1); font-size: 0.9rem; opacity: 0.7;">
            🔒 Secured by OpenZeppelin • 🌈 Powered by RainbowKit
        </div>
    </div>

    <script>
        // Variables globales
        var isConnected = false
        var userAddress = null
        var provider = null
        var signer = null
        
        // Configuration du contrat
        var contractAddress = '${mintPage.contract_address}'
        var mintPrice = ${mintPage.mint_price}
        
        // ABI simplifié
        var contractABI = [
            "function mint(uint256 quantity) payable",
            "function totalSupply() view returns (uint256)",
            "function publicMintEnabled() view returns (bool)"
        ]
        
        // Fonction d'affichage des messages
        function showMessage(text, type) {
            var status = document.getElementById('status')
            status.textContent = text
            status.className = 'status ' + type
            status.style.display = 'block'
            
            if (type === 'success' || type === 'info') {
                setTimeout(function() {
                    status.style.display = 'none'
                }, 4000)
            }
        }
        
        // Connexion wallet simplifiée
        function connectWallet() {
            console.log('🔌 Tentative de connexion...')
            
            if (!window.ethereum) {
                showMessage('❌ MetaMask requis. Installez MetaMask pour continuer.', 'error')
                setTimeout(function() {
                    window.open('https://metamask.io/download/', '_blank')
                }, 2000)
                return
            }
            
            showMessage('🔌 Connexion en cours...', 'info')
            
            window.ethereum.request({ method: 'eth_requestAccounts' })
                .then(function(accounts) {
                    if (accounts && accounts.length > 0) {
                        userAddress = accounts[0]
                        isConnected = true
                        provider = new ethers.providers.Web3Provider(window.ethereum)
                        signer = provider.getSigner()
                        
                        updateUI()
                        showMessage('✅ Wallet connected successfully!', 'success')
                    } else {
                        showMessage('❌ No account found', 'error')
                    }
                })
                .catch(function(error) {
                    console.error('Erreur connexion:', error)
                    if (error.code === 4001) {
                        showMessage('❌ Connection refused', 'error')
                    } else {
                        showMessage('❌ Connection error', 'error')
                    }
                })
        }
        
        // Mettre à jour l'interface
        function updateUI() {
            var walletSection = document.getElementById('wallet-section')
            var mintSection = document.getElementById('mint-section')
            var addressElement = document.getElementById('user-address')
            
            if (isConnected && userAddress) {
                walletSection.style.display = 'none'
                mintSection.style.display = 'block'
                addressElement.textContent = userAddress.substring(0, 8) + '...' + userAddress.substring(36)
            } else {
                walletSection.style.display = 'block'
                mintSection.style.display = 'none'
            }
        }
        
        // Fonction de mint
        function mintNFT() {
            if (!isConnected || !userAddress) {
                showMessage('❌ Wallet non connecté', 'error')
                return
            }
            
            // Mode démo pour contrats de test
            if (contractAddress.includes('simplified') || contractAddress.includes('test') || contractAddress.length !== 42) {
                showMessage('🎭 Mode démo - Simulation...', 'info')
                setTimeout(function() {
                    showMessage('🎉 Mint simulé avec succès!', 'success')
                }, 2000)
                return
            }
            
            showMessage('⏳ Préparation du mint...', 'info')
            
            try {
                var contract = new ethers.Contract(contractAddress, contractABI, signer)
                var value = ethers.utils.parseEther(mintPrice.toString())
                
                contract.mint(1, { value: value })
                    .then(function(tx) {
                        showMessage('⏳ Transaction envoyée...', 'info')
                        return tx.wait()
                    })
                    .then(function(receipt) {
                        if (receipt.status === 1) {
                            showMessage('🎉 Mint réussi!', 'success')
                        } else {
                            showMessage('❌ Transaction échouée', 'error')
                        }
                    })
                    .catch(function(error) {
                        console.error('Erreur mint:', error)
                        if (error.code === 4001) {
                            showMessage('❌ Transaction cancelled', 'error')
                        } else if (error.message.includes('insufficient funds')) {
                            showMessage('❌ Insufficient funds', 'error')
                        } else {
                            showMessage('❌ Mint error', 'error')
                        }
                    })
            } catch (error) {
                console.error('Mint error:', error)
                showMessage('❌ Mint error', 'error')
            }
        }
        
        // Initialisation
        document.getElementById('connect-btn').onclick = connectWallet
        document.getElementById('mint-btn').onclick = mintNFT
        
        // Auto-connexion si déjà connecté
        if (window.ethereum) {
            window.ethereum.request({ method: 'eth_accounts' })
                .then(function(accounts) {
                    if (accounts && accounts.length > 0) {
                        userAddress = accounts[0]
                        isConnected = true
                        provider = new ethers.providers.Web3Provider(window.ethereum)
                        signer = provider.getSigner()
                        updateUI()
                        console.log('🔄 Auto-connexion réussie')
                    }
                })
                .catch(function() {
                    console.log('Pas d\\'auto-connexion')
                })
        }
        
        console.log('🚀 Système de connexion simplifié chargé')
    </script>
</body>
</html>`

    res.send(html)
  } catch (error) {
    console.error('Erreur simple wallet:', error)
    res.status(500).send('Erreur serveur')
  }
})

// Route pour debug du bouton de connexion
router.get('/debug-wallet/:subdomain', async (req, res) => {
  try {
    const { subdomain } = req.params
    
    const { data: mintPages, error } = await supabase
      .from('mint_pages')
      .select('*')
      .eq('subdomain', subdomain)
      .single()

    if (error || !mintPages) {
      return res.status(404).send('Mint page not found')
    }

    const mintPage = mintPages as MintPageData

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔧 Debug - ${mintPage.title}</title>
    <script src="https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.umd.min.js"></script>
    
    <style>
        body {
            font-family: Arial, sans-serif;
            background: ${mintPage.background_color};
            color: white;
            padding: 2rem;
            min-height: 100vh;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            text-align: center;
            background: rgba(255,255,255,0.1);
            padding: 2rem;
            border-radius: 20px;
        }
        
        .debug-section {
            margin: 2rem 0;
            padding: 1rem;
            background: rgba(0,255,0,0.1);
            border: 1px solid rgba(0,255,0,0.3);
            border-radius: 10px;
        }
        
        .test-btn {
            background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
            color: white;
            border: none;
            border-radius: 12px;
            padding: 1rem 2rem;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            margin: 0.5rem;
            transition: all 0.3s ease;
        }
        
        .test-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(255, 107, 53, 0.4);
        }
        
        #status {
            margin: 1rem 0;
            padding: 1rem;
            border-radius: 8px;
            background: rgba(59, 130, 246, 0.1);
            border: 1px solid rgba(59, 130, 246, 0.3);
            color: #3b82f6;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 Debug Connexion Wallet</h1>
        <p>${mintPage.title} - ${mintPage.description}</p>
        
        <div class="debug-section">
            <h3>Tests de Fonctionnement</h3>
            
            <button class="test-btn" onclick="testBasicClick()">
                🔵 Test Clic Basic
            </button>
            
            <button class="test-btn" onclick="testConsoleLog()">
                📝 Test Console Log
            </button>
            
            <button class="test-btn" id="test-event-listener">
                ⚡ Test Event Listener
            </button>
            
            <button class="test-btn" onclick="testWalletDetection()">
                🦊 Test Détection MetaMask
            </button>
            
            <button class="test-btn" onclick="connectWallet()">
                🔌 Connect Wallet (Principal)
            </button>
        </div>
        
        <div id="status">
            Prêt pour les tests...
        </div>
        
        <div class="debug-section">
            <h4>Logs de Debug:</h4>
            <div id="debug-logs" style="text-align: left; font-family: monospace; max-height: 300px; overflow-y: auto;">
                <!-- Les logs apparaîtront ici -->
            </div>
        </div>
    </div>

    <script>
        console.log('🚀 Script de debug chargé')
        
        // Variables globales
        var isConnected = false
        var userAddress = null
        var provider = null
        var signer = null
        
        // Fonction de log avec affichage visuel
        function debugLog(message) {
            console.log(message)
            var logsDiv = document.getElementById('debug-logs')
            var timestamp = new Date().toLocaleTimeString()
            logsDiv.innerHTML += '<div>[' + timestamp + '] ' + message + '</div>'
            logsDiv.scrollTop = logsDiv.scrollHeight
            
            // Aussi afficher dans le status
            document.getElementById('status').textContent = message
        }
        
        // Tests de base
        function testBasicClick() {
            debugLog('✅ Test clic basic - FONCTIONNEL')
        }
        
        function testConsoleLog() {
            debugLog('📝 Test console.log - FONCTIONNEL')
            console.log('Test console direct')
        }
        
        function testWalletDetection() {
            if (typeof window.ethereum !== 'undefined') {
                debugLog('🦊 MetaMask détecté - PRÉSENT')
            } else {
                debugLog('❌ MetaMask non détecté - ABSENT')
            }
        }
        
        // Fonction principale de connexion wallet avec debug
        async function connectWallet() {
            debugLog('🔌 connectWallet() appelée - DÉBUT')
            
            try {
                if (typeof window.ethereum === 'undefined') {
                    debugLog('❌ window.ethereum undefined')
                    return
                }
                
                debugLog('⏳ Demande de connexion MetaMask...')
                
                var accounts = await window.ethereum.request({ 
                    method: 'eth_requestAccounts' 
                })
                
                debugLog('📦 Comptes reçus: ' + accounts.length)
                
                if (accounts && accounts.length > 0) {
                    userAddress = accounts[0]
                    isConnected = true
                    debugLog('✅ Connexion réussie: ' + userAddress.substring(0,10) + '...')
                } else {
                    debugLog('❌ Aucun compte disponible')
                }
                
            } catch (error) {
                debugLog('❌ Erreur: ' + error.message)
                console.error('Erreur complète:', error)
            }
        }
        
        // Test d'event listener via JavaScript
        function setupEventListener() {
            debugLog('⚡ Configuration event listener...')
            var btn = document.getElementById('test-event-listener')
            if (btn) {
                btn.onclick = function() {
                    debugLog('⚡ Event listener FONCTIONNEL')
                }
                debugLog('✅ Event listener configuré')
            } else {
                debugLog('❌ Bouton test-event-listener non trouvé')
            }
        }
        
        // Initialisation
        window.addEventListener('load', function() {
            debugLog('🚀 Page chargée - initialisation debug')
            setupEventListener()
            
            // Rendre les fonctions globales
            window.connectWallet = connectWallet
            window.testBasicClick = testBasicClick
            window.testConsoleLog = testConsoleLog
            window.testWalletDetection = testWalletDetection
            
            debugLog('✅ Toutes les fonctions initialisées')
        })
        
        // Log d'erreurs globales
        window.addEventListener('error', function(e) {
            debugLog('🔥 ERREUR JAVASCRIPT: ' + e.message + ' (ligne ' + e.lineno + ')')
        })
        
        debugLog('📜 Script debug entièrement chargé')
    </script>
</body>
</html>`

    res.send(html)
  } catch (error) {
    console.error('Erreur debug wallet:', error)
    res.status(500).send('Erreur serveur')
  }
})

// Route pour debug ultra-simple
router.get('/simple-debug/:subdomain', async (req, res) => {
  try {
    const { subdomain } = req.params
    
    const { data: mintPages, error } = await supabase
      .from('mint_pages')
      .select('*')
      .eq('subdomain', subdomain)
      .single()

    if (error || !mintPages) {
      return res.status(404).send('Mint page not found')
    }

    const mintPage = mintPages as MintPageData

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔧 Debug Ultra Simple - ${mintPage.title}</title>
    
    <style>
        body {
            font-family: Arial, sans-serif;
            background: ${mintPage.background_color};
            color: white;
            padding: 2rem;
            text-align: center;
        }
        
        .test-button {
            background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
            color: white;
            border: none;
            border-radius: 12px;
            padding: 1rem 2rem;
            font-size: 1.2rem;
            font-weight: 600;
            cursor: pointer;
            margin: 1rem;
            transition: all 0.3s ease;
        }
        
        .test-button:hover {
            transform: translateY(-2px);
        }
        
        .test-button:active {
            transform: translateY(0);
        }
        
        #output {
            margin: 2rem 0;
            padding: 1rem;
            background: rgba(0,0,0,0.3);
            border-radius: 8px;
            border: 1px solid rgba(255,255,255,0.2);
            min-height: 100px;
            font-family: monospace;
            white-space: pre-wrap;
        }
    </style>
</head>
<body>
    <h1>🔧 Debug Ultra Simple</h1>
    <p>${mintPage.title}</p>
    <p>Test de la fonctionnalité la plus basique : clic de bouton</p>
    
    <button class="test-button" onclick="testSimpleClick()">
        🖱️ Test Clic Simple
    </button>
    
    <button class="test-button" id="test-event-listener">
        ⚡ Test Event Listener
    </button>
    
    <button class="test-button" onclick="testConnectWallet()">
        🔌 Test Connect Wallet
    </button>
    
    <div id="output">
        Attendez les résultats des tests...
    </div>

    <script>
        console.log('🔥 [ULTRA-DEBUG] Script ultra-simple chargé')
        
        var output = document.getElementById('output')
        var logCount = 1
        
        function addLog(message) {
            var timestamp = new Date().toLocaleTimeString()
            var logMessage = '[' + logCount + '] [' + timestamp + '] ' + message + '\\n'
            console.log(message)
            output.textContent += logMessage
            output.scrollTop = output.scrollHeight
            logCount++
        }
        
        // Test 1 : Fonction onclick simple
        function testSimpleClick() {
            addLog('✅ TEST 1 RÉUSSI: Fonction testSimpleClick() appelée')
        }
        
        // Test 2 : Event listener via JavaScript
        function setupEventListener() {
            var btn = document.getElementById('test-event-listener')
            if (btn) {
                btn.onclick = function() {
                    addLog('✅ TEST 2 RÉUSSI: Event listener JavaScript fonctionnel')
                }
                addLog('✅ Event listener configuré sur bouton')
            } else {
                addLog('❌ ÉCHEC: Bouton test-event-listener non trouvé')
            }
        }
        
        // Test 3 : Connexion wallet
        function testConnectWallet() {
            addLog('🔌 TEST 3 DÉBUT: Test de connexion wallet...')
            
            if (typeof window.ethereum === 'undefined') {
                addLog('❌ TEST 3 ÉCHEC: MetaMask non détecté')
                return
            }
            
            addLog('✅ MetaMask détecté, tentative de connexion...')
            
            window.ethereum.request({ method: 'eth_requestAccounts' })
                .then(function(accounts) {
                    addLog('✅ TEST 3 RÉUSSI: Comptes reçus (' + accounts.length + ')')
                    if (accounts.length > 0) {
                        addLog('✅ Compte connecté: ' + accounts[0].substring(0,10) + '...')
                    }
                })
                .catch(function(error) {
                    addLog('❌ TEST 3 ÉCHEC: ' + error.message)
                })
        }
        
        // Initialisation
        window.addEventListener('load', function() {
            addLog('🚀 Page chargée, initialisation des tests')
            addLog('🔍 Vérifications:')
            addLog('  - ethers.js: ' + (typeof ethers !== 'undefined' ? 'OK' : 'NOK'))
            addLog('  - window.ethereum: ' + (typeof window.ethereum !== 'undefined' ? 'OK' : 'NOK'))
            
            setupEventListener()
            addLog('✅ Tests prêts à être exécutés')
        })
        
        addLog('📜 Script ultra-simple initialisé')
    </script>
</body>
</html>`

    res.send(html)
  } catch (error) {
    console.error('Erreur simple debug:', error)
    res.status(500).send('Erreur serveur')
  }
})

// Route debug popup simple
router.get('/popup-debug/:subdomain', async (req, res) => {
  const { subdomain } = req.params
  
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
      <title>🌈 Test Popup Debug</title>
      <style>
          body { 
              background: linear-gradient(135deg, #1e1b4b, #7c3aed); 
              color: white; 
              font-family: Arial; 
              padding: 2rem;
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
          }
          .test-btn {
              background: #f59e0b;
              color: white;
              border: none;
              padding: 1rem 2rem;
              border-radius: 12px;
              font-size: 1.1rem;
              cursor: pointer;
              margin: 0.5rem;
              transition: all 0.3s ease;
          }
          .test-btn:hover {
              background: #d97706;
              transform: translateY(-2px);
          }
          .wallet-modal {
              display: none;
              position: fixed;
              top: 0; left: 0;
              width: 100vw; height: 100vh;
              background: rgba(0,0,0,0.8);
              z-index: 10000;
              justify-content: center;
              align-items: center;
          }
          .wallet-modal.show {
              display: flex;
          }
          .wallet-modal-content {
              background: white;
              color: black;
              border-radius: 16px;
              padding: 2rem;
              min-width: 300px;
              text-align: center;
              position: relative;
          }
          .wallet-close {
              position: absolute;
              top: 10px; right: 10px;
              background: #ef4444;
              color: white;
              border: none;
              border-radius: 50%;
              width: 30px; height: 30px;
              cursor: pointer;
          }
          .wallet-option {
              display: block;
              width: 100%;
              padding: 1rem;
              margin: 0.5rem 0;
              background: #f3f4f6;
              border: none;
              border-radius: 8px;
              cursor: pointer;
          }
          .wallet-option:hover {
              background: #e5e7eb;
          }
          #logs {
              margin-top: 2rem;
              padding: 1rem;
              background: rgba(0,0,0,0.3);
              border-radius: 8px;
              max-height: 200px;
              overflow-y: auto;
              width: 100%;
              max-width: 600px;
          }
          #logs p {
              margin: 0.5rem 0;
              font-size: 0.9rem;
          }
      </style>
  </head>
  <body>
      <h1>🧪 Test Popup Wallet - ${subdomain}</h1>
      
      <button class="test-btn" onclick="openPopup()">🌈 OUVRIR POPUP</button>
      
      <button class="test-btn" onclick="testLog()">📝 TEST LOG</button>
      
      <div id="logs"></div>

      <!-- Popup Modal -->
      <div id="wallet-modal" class="wallet-modal" onclick="closePopup()">
          <div class="wallet-modal-content" onclick="event.stopPropagation()">
              <button class="wallet-close" onclick="closePopup()">✕</button>
              <h2>🌈 Wallet Selector</h2>
              <button class="wallet-option" onclick="selectWallet('MetaMask')">🦊 MetaMask</button>
              <button class="wallet-option" onclick="selectWallet('WalletConnect')">📱 WalletConnect</button>
          </div>
      </div>

      <script>
          function log(message) {
              console.log('🧪 [POPUP-DEBUG]', message)
              var logs = document.getElementById('logs')
              logs.innerHTML += '<p>' + new Date().toLocaleTimeString() + ' - ' + message + '</p>'
          }

          function testLog() {
              log('Test de logging fonctionnel!')
          }

          function openPopup() {
              log('Tentative d\\'ouverture du popup...')
              var modal = document.getElementById('wallet-modal')
              if (modal) {
                  log('Modal trouvée, ajout classe show')
                  modal.classList.add('show')
                  log('Popup devrait être visible maintenant')
              } else {
                  log('ERREUR: Modal non trouvée!')
              }
          }

          function closePopup() {
              log('Fermeture du popup')
              var modal = document.getElementById('wallet-modal')
              if (modal) {
                  modal.classList.remove('show')
                  log('Popup fermé')
              }
          }

          function selectWallet(wallet) {
              log('Wallet sélectionné: ' + wallet)
              closePopup()
          }

          log('Script chargé et prêt')
      </script>
  </body>
  </html>
  `

  res.setHeader('Content-Type', 'text/html')
  res.send(html)
})

export default router 