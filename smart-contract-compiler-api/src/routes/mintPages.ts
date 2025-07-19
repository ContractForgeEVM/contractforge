import express from 'express'
import { supabase } from '../config/supabase'

const router = express.Router()

// Interface pour les données de page de mint
interface MintPageData {
  user_id: string
  contract_address: string
  subdomain: string
  title: string
  description: string
  primary_color: string
  background_color: string
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

    // Insérer la nouvelle page de mint
    const insertData = {
      ...mintPageData,
      subdomain: mintPageData.subdomain.toLowerCase(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
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

// GET /api/mint-pages/preview/:subdomain - Prévisualiser une page de mint (pour test)
router.get('/preview/:subdomain', async (req, res) => {
  try {
    const { subdomain } = req.params

    console.log(`🔍 Prévisualisation de la page: ${subdomain}`)

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

    console.log('✅ Page de mint trouvée pour prévisualisation')

    // Headers CSP permissifs pour cette route
    res.setHeader('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "img-src 'self' data: https:; " +
      "connect-src 'self' https: wss: ws:;"
    )

    // Page de mint professionnelle avec connexion wallet
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${mintPage.title} - Mint NFT</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.umd.min.js"></script>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: 'Inter', sans-serif; 
                background: linear-gradient(135deg, ${mintPage.background_color}, ${mintPage.primary_color}20);
                min-height: 100vh;
                color: #333;
            }
            .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
            .header { 
                background: linear-gradient(135deg, ${mintPage.primary_color}, ${mintPage.primary_color}dd);
                color: white; 
                padding: 60px 40px; 
                border-radius: 20px; 
                text-align: center; 
                margin-bottom: 40px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            }
            .header h1 { font-size: 3rem; font-weight: 700; margin-bottom: 20px; }
            .header p { font-size: 1.2rem; opacity: 0.9; max-width: 600px; margin: 0 auto; }
            
            .main-content { display: grid; grid-template-columns: 1fr 400px; gap: 40px; }
            @media (max-width: 768px) { .main-content { grid-template-columns: 1fr; } }
            
            .info-section { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
            .mint-section { 
                background: white; 
                padding: 40px; 
                border-radius: 20px; 
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                position: sticky;
                top: 20px;
                height: fit-content;
            }
            
            .info-card { margin-bottom: 30px; }
            .info-card h3 { color: ${mintPage.primary_color}; font-size: 1.3rem; margin-bottom: 15px; font-weight: 600; }
            .info-card p { line-height: 1.6; color: #666; }
            
            .price-display { 
                font-size: 2.5rem; 
                font-weight: 700; 
                color: ${mintPage.primary_color}; 
                text-align: center;
                margin: 20px 0;
            }
            
            .mint-controls { margin: 30px 0; }
            .quantity-selector { 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                gap: 15px; 
                margin: 20px 0; 
            }
            .qty-btn { 
                background: ${mintPage.primary_color}; 
                color: white; 
                border: none; 
                width: 40px; 
                height: 40px; 
                border-radius: 10px; 
                font-size: 18px; 
                cursor: pointer; 
                transition: all 0.3s;
            }
            .qty-btn:hover { transform: scale(1.1); }
            .qty-display { 
                font-size: 1.5rem; 
                font-weight: 600; 
                min-width: 60px; 
                text-align: center; 
                padding: 10px; 
                background: #f8f9fa; 
                border-radius: 10px; 
            }
            
            .connect-btn, .mint-btn { 
                width: 100%; 
                padding: 18px; 
                font-size: 1.1rem; 
                font-weight: 600; 
                border: none; 
                border-radius: 15px; 
                cursor: pointer; 
                transition: all 0.3s;
                margin: 10px 0;
            }
            .connect-btn { 
                background: linear-gradient(135deg, ${mintPage.primary_color}, ${mintPage.primary_color}dd); 
                color: white; 
            }
            .mint-btn { 
                background: linear-gradient(135deg, #10b981, #059669); 
                color: white; 
            }
            .connect-btn:hover, .mint-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(0,0,0,0.2); }
            .mint-btn:disabled { background: #d1d5db; cursor: not-allowed; transform: none; }
            
            .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; }
            .stat-card { background: #f8f9fa; padding: 20px; border-radius: 15px; text-align: center; }
            .stat-number { font-size: 1.8rem; font-weight: 700; color: ${mintPage.primary_color}; }
            .stat-label { font-size: 0.9rem; color: #666; margin-top: 5px; }
            
                         .social-links { display: flex; gap: 15px; justify-content: center; margin: 30px 0; flex-wrap: wrap; }
             .social-link { 
                 padding: 12px 20px; 
                 background: ${mintPage.primary_color}15; 
                 color: ${mintPage.primary_color}; 
                 text-decoration: none; 
                 border-radius: 25px; 
                 font-weight: 500;
                 transition: all 0.3s;
                 display: flex;
                 align-items: center;
                 gap: 8px;
             }
             .social-link:hover { background: ${mintPage.primary_color}; color: white; transform: translateY(-2px); }
             .social-link svg { width: 18px; height: 18px; }
            
            .contract-info { 
                background: #f8f9fa; 
                padding: 20px; 
                border-radius: 15px; 
                margin: 20px 0; 
                font-family: 'Monaco', monospace; 
                word-break: break-all; 
                font-size: 0.9rem;
            }
            
            .powered-by { 
                position: fixed; 
                bottom: 20px; 
                right: 20px; 
                background: white; 
                padding: 15px 20px; 
                border-radius: 50px; 
                box-shadow: 0 5px 20px rgba(0,0,0,0.1); 
                font-size: 0.9rem;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .powered-by img { width: 20px; height: 20px; }
            .badge { 
                background: linear-gradient(135deg, #667eea, #764ba2); 
                color: white; 
                padding: 8px 16px; 
                border-radius: 20px; 
                font-size: 0.8rem; 
                font-weight: 500;
                display: inline-block;
                margin: 10px 0;
            }
            
            .status { padding: 15px; border-radius: 10px; margin: 15px 0; text-align: center; }
            .status.success { background: #dcfce7; color: #166534; }
            .status.error { background: #fef2f2; color: #dc2626; }
            .status.info { background: #dbeafe; color: #1d4ed8; }
            
            .loading { animation: spin 1s linear infinite; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${mintPage.title}</h1>
                <p>${mintPage.description}</p>
                <div class="badge">✨ Generated by ContractForge.io - Secured by OpenZeppelin</div>
            </div>

            <div class="main-content">
                <div class="info-section">
                    <div class="info-card">
                        <h3>🚀 About This Collection</h3>
                        <p>${mintPage.description}</p>
                    </div>
                    
                    <div class="info-card">
                        <h3>📊 Collection Stats</h3>
                        <div class="stats">
                            <div class="stat-card">
                                <div class="stat-number">${mintPage.max_supply.toLocaleString()}</div>
                                <div class="stat-label">Total Supply</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-number">${mintPage.max_per_wallet}</div>
                                <div class="stat-label">Max per Wallet</div>
                            </div>
                        </div>
                        ${mintPage.show_minted_count ? `
                        <div class="stats">
                            <div class="stat-card">
                                <div class="stat-number">0</div>
                                <div class="stat-label">Minted</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-number">${mintPage.max_supply.toLocaleString()}</div>
                                <div class="stat-label">Remaining</div>
                            </div>
                        </div>
                        ` : ''}
                    </div>

                    <div class="info-card">
                        <h3>🔗 Join Our Community</h3>
                                                 <div class="social-links">
                             ${mintPage.social_links.twitter ? `
                             <a href="https://twitter.com/${mintPage.social_links.twitter.replace('@', '')}" class="social-link" target="_blank">
                                 <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                     <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                 </svg>
                                 Twitter
                             </a>` : ''}
                             ${mintPage.social_links.discord ? `
                             <a href="https://${mintPage.social_links.discord}" class="social-link" target="_blank">
                                 <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                     <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                                 </svg>
                                 Discord
                             </a>` : ''}
                             ${mintPage.social_links.website ? `
                             <a href="${mintPage.social_links.website}" class="social-link" target="_blank">
                                 <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                     <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                                 </svg>
                                 Website
                             </a>` : ''}
                             ${mintPage.social_links.opensea ? `
                             <a href="https://${mintPage.social_links.opensea}" class="social-link" target="_blank">
                                 <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                     <path d="M12 0C5.374 0 0 5.374 0 12s5.374 12 12 12 12-5.374 12-12S18.626 0 12 0zM5.92 12.403l.051-.081 3.123-4.884a.107.107 0 0 1 .187.014c.52 1.169.972 2.623.76 3.528-.088.372-.335.876-.614 1.342a2.405 2.405 0 0 1-.117.199.106.106 0 0 1-.089.047zm11.669-.594a.106.106 0 0 1-.087.106c-.36.053-.702.07-1.032.07-1.296 0-2.35-.151-3.191-.447a.106.106 0 0 1-.065-.137l.343-.777a.107.107 0 0 1 .097-.063c.671.003 1.362-.06 2.019-.203a.106.106 0 0 1 .12.071z"/>
                                 </svg>
                                 OpenSea
                             </a>` : ''}
                         </div>
                    </div>

                    <div class="info-card">
                        <h3>📋 Contract Information</h3>
                        <div class="contract-info">
                            Contract: ${mintPage.contract_address}
                        </div>
                        <p><strong>Network:</strong> Polygon</p>
                        <p><strong>Standard:</strong> ERC-721</p>
                        <p><strong>Security:</strong> OpenZeppelin Audited</p>
                    </div>
                </div>

                <div class="mint-section">
                    <h3 style="text-align: center; margin-bottom: 20px;">🎨 Mint Your NFT</h3>
                    
                    <div class="price-display">${mintPage.mint_price} ETH</div>
                    
                                         <div id="wallet-section">
                         <button class="connect-btn" id="connect-wallet-btn">
                             🔌 Connect Wallet
                         </button>
                     </div>

                    <div id="mint-section" style="display: none;">
                        <div class="mint-controls">
                            <p style="text-align: center; margin-bottom: 15px;">Quantity to mint:</p>
                                                         <div class="quantity-selector">
                                 <button class="qty-btn" id="qty-minus">-</button>
                                 <div class="qty-display" id="quantity">1</div>
                                 <button class="qty-btn" id="qty-plus">+</button>
                             </div>
                            <p style="text-align: center; color: #666; font-size: 0.9rem;">
                                Total: <span id="total-price">${mintPage.mint_price}</span> ETH
                            </p>
                        </div>

                                                 <button class="mint-btn" id="mint-button">
                             🎯 Mint NFT
                         </button>
                    </div>

                    <div id="status-section"></div>
                </div>
            </div>
        </div>

        <div class="powered-by">
            🚀 <strong>ContractForge.io</strong> × 🛡️ <strong>OpenZeppelin</strong>
        </div>

                 <script>
             console.log('🚀 Script de mint chargé !');
             
             let currentAccount = null;
             let quantity = 1;
             const maxPerWallet = ${mintPage.max_per_wallet};
             const mintPrice = ${mintPage.mint_price};
             const contractAddress = "${mintPage.contract_address}";
             const primaryColor = "${mintPage.primary_color}";
             
             console.log('📊 Configuration:', {
                 maxPerWallet: maxPerWallet,
                 mintPrice: mintPrice,
                 contractAddress: contractAddress
             });

                            function connectWallet() {
                   console.log('🔌 Fonction connectWallet appelée');
                   
                   if (typeof window.ethereum === 'undefined') {
                       console.error('❌ Pas de wallet Web3 détecté');
                       showStatus('Please install MetaMask!', 'error');
                       return;
                   }
                   
                   console.log('📱 MetaMask détecté, demande de connexion...');
                   
                   window.ethereum.request({ method: 'eth_requestAccounts' })
                       .then(function(accounts) {
                           currentAccount = accounts[0];
                           console.log('✅ Wallet connecté:', currentAccount);
                           updateWalletUI();
                           showStatus('Wallet connected successfully!', 'success');
                           
                           // Vérifier le réseau
                           return window.ethereum.request({ method: 'eth_chainId' });
                       })
                       .then(function(chainId) {
                           console.log('🌐 Réseau détecté:', chainId);
                           if (chainId !== '0x89') {
                               showStatus('Please switch to Polygon network', 'info');
                           }
                       })
                       .catch(function(error) {
                           console.error('❌ Erreur connexion wallet:', error);
                           if (error.code === 4001) {
                               showStatus('Connection rejected by user', 'error');
                           } else {
                               showStatus('Failed to connect: ' + error.message, 'error');
                           }
                       });
               }

             function changeQuantity(delta) {
                 const newQuantity = quantity + delta;
                 if (newQuantity >= 1 && newQuantity <= maxPerWallet) {
                     quantity = newQuantity;
                     document.getElementById('quantity').textContent = quantity;
                     document.getElementById('total-price').textContent = (mintPrice * quantity).toFixed(3);
                 }
             }

                            function mintNFT() {
                   console.log('🎯 Fonction mintNFT appelée');
                   
                   if (!currentAccount) {
                       showStatus('Please connect your wallet first!', 'error');
                       return;
                   }

                   const button = document.getElementById('mint-button');
                   button.disabled = true;
                   button.innerHTML = 'Minting...';

                   showStatus('Preparing transaction...', 'info');
                   console.log('🎯 Démarrage du mint pour:', currentAccount);
                   
                   // Simulation simple
                   setTimeout(function() {
                       showStatus('🎉 Successfully minted ' + quantity + ' NFT! Check your wallet.', 'success');
                       console.log('✅ Mint simulé avec succès');
                       button.disabled = false;
                       button.innerHTML = '🎯 Mint NFT';
                   }, 2000);
               }

             function showStatus(message, type) {
                 const statusSection = document.getElementById('status-section');
                 statusSection.innerHTML = '<div class="status ' + type + '">' + message + '</div>';
                 setTimeout(function() {
                     statusSection.innerHTML = '';
                 }, 5000);
             }

                          // Initialisation simple au chargement
              window.addEventListener('load', function() {
                  console.log('🚀 Page chargée, initialisation...');
                  
                  // Attacher les event listeners
                  document.getElementById('connect-wallet-btn').onclick = connectWallet;
                  document.getElementById('mint-button').onclick = mintNFT;
                  document.getElementById('qty-minus').onclick = function() { changeQuantity(-1); };
                  document.getElementById('qty-plus').onclick = function() { changeQuantity(1); };
                  
                  console.log('✅ Event listeners attachés');
                  
                  // Auto-connexion si disponible
                  if (typeof window.ethereum !== 'undefined') {
                      window.ethereum.request({ method: 'eth_accounts' })
                          .then(function(accounts) {
                              if (accounts.length > 0) {
                                  currentAccount = accounts[0];
                                  console.log('🔄 Auto-connexion:', currentAccount);
                                  updateWalletUI();
                              }
                          })
                          .catch(function(error) {
                              console.log('Pas d auto-connexion');
                          });
                  }
              });
              
              function updateWalletUI() {
                  if (currentAccount) {
                      document.getElementById('wallet-section').innerHTML = 
                          '<div style="text-align: center; padding: 15px; background: #dcfce7; border-radius: 10px; margin-bottom: 20px;">' +
                              '<p style="color: #166534; font-weight: 600;">✅ Wallet Connected</p>' +
                              '<p style="color: #166534; font-size: 0.9rem;">' + 
                                  currentAccount.substring(0, 6) + '...' + currentAccount.substring(38) + 
                              '</p>' +
                          '</div>';
                      
                      document.getElementById('mint-section').style.display = 'block';
                  }
              }
         </script>
    </body>
    </html>
    `

    res.setHeader('Content-Type', 'text/html')
    res.send(html)

  } catch (error: any) {
    console.error('❌ Erreur prévisualisation page:', error)
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

    console.log(`🌈 Page RainbowKit pour: ${subdomain}`)

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

    console.log('✅ Page RainbowKit trouvée')

    // Headers CSP permissifs pour RainbowKit
    res.setHeader('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "img-src 'self' data: https:; " +
      "connect-src 'self' https: wss: ws:;"
    )

    // Page moderne avec RainbowKit + Wagmi + Viem
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${mintPage.title} - Mint NFT</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        
        <!-- React 18 -->
        <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
        <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
        
        <!-- Wagmi + Viem -->
        <script src="https://unpkg.com/@wagmi/core@2.13.8/dist/index.js"></script>
        <script src="https://unpkg.com/viem@2.21.19/dist/index.js"></script>
        
        <!-- RainbowKit -->
        <script src="https://unpkg.com/@rainbow-me/rainbowkit@2.1.6/dist/index.js"></script>
        <link rel="stylesheet" href="https://unpkg.com/@rainbow-me/rainbowkit@2.1.6/dist/index.css">
        
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: 'Inter', sans-serif; 
                background: linear-gradient(135deg, ${mintPage.background_color}, ${mintPage.primary_color}20);
                min-height: 100vh;
                color: #333;
            }
            .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
            
            .header { 
                background: linear-gradient(135deg, ${mintPage.primary_color}, ${mintPage.primary_color}dd);
                color: white; 
                padding: 60px 40px; 
                border-radius: 20px; 
                text-align: center; 
                margin-bottom: 40px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            }
            .header h1 { font-size: 3rem; font-weight: 700; margin-bottom: 20px; }
            .header p { font-size: 1.2rem; opacity: 0.9; max-width: 600px; margin: 0 auto; }
            
            .main-content { display: grid; grid-template-columns: 1fr 400px; gap: 40px; }
            @media (max-width: 768px) { .main-content { grid-template-columns: 1fr; } }
            
            .info-section { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
            .mint-section { 
                background: white; 
                padding: 40px; 
                border-radius: 20px; 
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                position: sticky;
                top: 20px;
                height: fit-content;
            }
            
            .price-display { 
                font-size: 2.5rem; 
                font-weight: 700; 
                color: ${mintPage.primary_color}; 
                text-align: center;
                margin: 20px 0;
            }
            
            .quantity-selector { 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                gap: 15px; 
                margin: 20px 0; 
            }
            .qty-btn { 
                background: ${mintPage.primary_color}; 
                color: white; 
                border: none; 
                width: 40px; 
                height: 40px; 
                border-radius: 10px; 
                font-size: 18px; 
                cursor: pointer; 
                transition: all 0.3s;
            }
            .qty-btn:hover { transform: scale(1.1); }
            .qty-display { 
                font-size: 1.5rem; 
                font-weight: 600; 
                min-width: 60px; 
                text-align: center; 
                padding: 10px; 
                background: #f8f9fa; 
                border-radius: 10px; 
            }
            
            .mint-btn { 
                width: 100%; 
                padding: 18px; 
                font-size: 1.1rem; 
                font-weight: 600; 
                border: none; 
                border-radius: 15px; 
                cursor: pointer; 
                transition: all 0.3s;
                background: linear-gradient(135deg, #10b981, #059669); 
                color: white; 
                margin: 20px 0;
            }
            .mint-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(0,0,0,0.2); }
            .mint-btn:disabled { background: #d1d5db; cursor: not-allowed; transform: none; }
            
            .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; }
            .stat-card { background: #f8f9fa; padding: 20px; border-radius: 15px; text-align: center; }
            .stat-number { font-size: 1.8rem; font-weight: 700; color: ${mintPage.primary_color}; }
            .stat-label { font-size: 0.9rem; color: #666; margin-top: 5px; }
            
            .social-links { display: flex; gap: 15px; justify-content: center; margin: 30px 0; flex-wrap: wrap; }
            .social-link { 
                display: flex; 
                align-items: center; 
                gap: 8px; 
                padding: 12px 20px; 
                background: white; 
                border-radius: 12px; 
                text-decoration: none; 
                color: #666; 
                font-weight: 500; 
                transition: all 0.3s;
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            }
            .social-link:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(0,0,0,0.15); }
            
            .badge { 
                text-align: center; 
                margin-top: 30px; 
                padding: 15px; 
                background: rgba(255,255,255,0.8); 
                border-radius: 12px; 
                font-size: 0.9rem; 
                color: #666; 
            }
            
            .status-message { 
                margin: 20px 0; 
                padding: 15px; 
                border-radius: 12px; 
                text-align: center; 
                font-weight: 500; 
                display: none; 
            }
            .status-success { background: #dcfce7; color: #166534; }
            .status-error { background: #fef2f2; color: #dc2626; }
            .status-info { background: #dbeafe; color: #1d4ed8; }
            
            #rainbow-root { margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- Header -->
            <div class="header">
                <h1>${mintPage.title}</h1>
                <p>${mintPage.description}</p>
            </div>
            
            <!-- Main Content -->
            <div class="main-content">
                <!-- Info Section -->
                <div class="info-section">
                    <h2 style="color: ${mintPage.primary_color}; margin-bottom: 30px; font-size: 2rem;">Collection Details</h2>
                    
                    <div style="margin-bottom: 30px;">
                        <h3 style="color: ${mintPage.primary_color}; margin-bottom: 15px;">About This Collection</h3>
                        <p style="line-height: 1.6; color: #666;">${mintPage.description}</p>
                    </div>
                    
                    <div style="margin-bottom: 30px;">
                        <h3 style="color: ${mintPage.primary_color}; margin-bottom: 15px;">Contract Information</h3>
                        <p style="font-family: monospace; background: #f8f9fa; padding: 15px; border-radius: 10px; word-break: break-all;">${mintPage.contract_address}</p>
                    </div>
                    
                    ${mintPage.social_links ? `
                    <div class="social-links">
                        ${mintPage.social_links.website ? `<a href="${mintPage.social_links.website}" class="social-link" target="_blank">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                            </svg>
                            Website
                        </a>` : ''}
                        ${mintPage.social_links.twitter ? `<a href="https://twitter.com/${mintPage.social_links.twitter.replace('@', '')}" class="social-link" target="_blank">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
                            </svg>
                            Twitter
                        </a>` : ''}
                        ${mintPage.social_links.discord ? `<a href="${mintPage.social_links.discord.startsWith('http') ? mintPage.social_links.discord : 'https://discord.gg/' + mintPage.social_links.discord}" class="social-link" target="_blank">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                            </svg>
                            Discord
                        </a>` : ''}
                    </div>
                    ` : ''}
                </div>
                
                <!-- Mint Section -->
                <div class="mint-section">
                    <h2 style="text-align: center; margin-bottom: 30px; color: ${mintPage.primary_color};">Mint Your NFT</h2>
                    
                    <div class="price-display">${mintPage.mint_price} ETH</div>
                    
                    <!-- RainbowKit Connect Button -->
                    <div id="rainbow-root"></div>
                    
                                         <!-- Quantity Selector -->
                     <div class="quantity-selector">
                         <button class="qty-btn" id="qty-minus">−</button>
                         <div class="qty-display" id="quantity">1</div>
                         <button class="qty-btn" id="qty-plus">+</button>
                     </div>
                     
                     <!-- Mint Button -->
                     <button class="mint-btn" id="mint-button">🎯 Mint NFT</button>
                    
                    <!-- Status Message -->
                    <div id="status-message" class="status-message"></div>
                    
                    <!-- Stats -->
                    <div class="stats">
                        ${mintPage.show_minted_count ? `
                        <div class="stat-card">
                            <div class="stat-number" id="minted-count">0</div>
                            <div class="stat-label">Minted</div>
                        </div>
                        ` : ''}
                        ${mintPage.show_remaining_supply ? `
                        <div class="stat-card">
                            <div class="stat-number" id="remaining-supply">${mintPage.max_supply}</div>
                            <div class="stat-label">Remaining</div>
                        </div>
                        ` : ''}
                    </div>
                    
                    <!-- Badge -->
                    <div class="badge">
                        <p>🛡️ <strong>Generated by ContractForge.io</strong></p>
                        <p>Secured by OpenZeppelin</p>
                    </div>
                </div>
            </div>
        </div>
        
        <script type="module">
            console.log('🌈 RainbowKit page loading...');
            
            // Configuration
            let quantity = 1;
            const maxPerWallet = ${mintPage.max_per_wallet};
            const mintPrice = ${mintPage.mint_price};
            const contractAddress = "${mintPage.contract_address}";
            const primaryColor = "${mintPage.primary_color}";
            
            // RainbowKit setup will go here
            console.log('🌈 RainbowKit setup complete');
            
                         // Event listeners (pas d'inline handlers)
             document.getElementById('qty-minus').addEventListener('click', () => changeQuantity(-1));
             document.getElementById('qty-plus').addEventListener('click', () => changeQuantity(1));
             document.getElementById('mint-button').addEventListener('click', mintNFT);
             
             // Quantity functions
             function changeQuantity(delta) {
                 const newQuantity = quantity + delta;
                 if (newQuantity >= 1 && newQuantity <= maxPerWallet) {
                     quantity = newQuantity;
                     document.getElementById('quantity').textContent = quantity;
                     updateTotalPrice();
                 }
             }
             
             function updateTotalPrice() {
                 const total = (mintPrice * quantity).toFixed(3);
                 document.querySelector('.price-display').textContent = total + ' ETH';
             }
             
             // Mint function
             function mintNFT() {
                 console.log('🎯 Mint function called');
                 showStatus('🎉 Mint simulation successful! (RainbowKit integration needed)', 'success');
             }
            
                         // Status function
             function showStatus(message, type) {
                 const statusEl = document.getElementById('status-message');
                 statusEl.textContent = message;
                 statusEl.className = 'status-message status-' + type;
                 statusEl.style.display = 'block';
                 
                 if (type === 'success' || type === 'info') {
                     setTimeout(() => {
                         statusEl.style.display = 'none';
                     }, 5000);
                 }
             }
            
            // Simulate some stats
            setTimeout(() => {
                if (document.getElementById('minted-count')) {
                    document.getElementById('minted-count').textContent = '${Math.floor(Math.random() * 500)}';
                }
                if (document.getElementById('remaining-supply')) {
                    const remaining = ${mintPage.max_supply} - ${Math.floor(Math.random() * 500)};
                    document.getElementById('remaining-supply').textContent = remaining;
                }
            }, 1000);
            
                         // Add RainbowKit placeholder avec disconnect
             const rainbowContainer = document.getElementById('rainbow-root');
             let isConnected = false;
             let connectedAddress = null;
             
             function updateWalletUI() {
                 if (isConnected && connectedAddress) {
                     rainbowContainer.innerHTML = \`
                         <div style="
                             background: linear-gradient(135deg, #10b981, #059669); 
                             color: white; 
                             padding: 18px; 
                             border-radius: 15px; 
                             text-align: center; 
                             font-weight: 600; 
                             margin: 20px 0;
                         ">
                             <div style="margin-bottom: 10px;">✅ Wallet Connected</div>
                             <div style="font-size: 0.9rem; opacity: 0.9; margin-bottom: 15px;">
                                 \${connectedAddress.substring(0, 6)}...\${connectedAddress.substring(38)}
                             </div>
                             <button id="disconnect-btn" style="
                                 background: rgba(255,255,255,0.2); 
                                 color: white; 
                                 border: none; 
                                 padding: 8px 16px; 
                                 border-radius: 8px; 
                                 cursor: pointer; 
                                 font-weight: 500;
                                 transition: all 0.3s;
                             ">Disconnect</button>
                         </div>
                     \`;
                     
                     // Ajouter l'event listener pour disconnect
                     document.getElementById('disconnect-btn').addEventListener('click', disconnectWallet);
                 } else {
                     rainbowContainer.innerHTML = \`
                         <button id="connect-btn" style="
                             background: linear-gradient(135deg, \${primaryColor}, \${primaryColor}dd); 
                             color: white; 
                             padding: 18px; 
                             border-radius: 15px; 
                             text-align: center; 
                             font-weight: 600; 
                             margin: 20px 0;
                             cursor: pointer;
                             transition: all 0.3s;
                             border: none;
                             width: 100%;
                         ">🌈 Connect Wallet (RainbowKit)</button>
                     \`;
                     
                     // Ajouter l'event listener pour connect
                     document.getElementById('connect-btn').addEventListener('click', connectWallet);
                 }
             }
             
             function connectWallet() {
                 console.log('🔌 Connecting wallet...');
                 // Simulation de connexion
                 setTimeout(() => {
                     isConnected = true;
                     connectedAddress = '0x742d35Cc6634C0532925a3b8D5C9E4c0';
                     updateWalletUI();
                     showStatus('🎉 Wallet connected successfully!', 'success');
                 }, 1000);
             }
             
             function disconnectWallet() {
                 console.log('🔌 Disconnecting wallet...');
                 isConnected = false;
                 connectedAddress = null;
                 updateWalletUI();
                 showStatus('👋 Wallet disconnected', 'info');
             }
             
             // Initialiser l'UI
             updateWalletUI();
            
        </script>
    </body>
    </html>
    `

    res.setHeader('Content-Type', 'text/html')
    res.send(html)

  } catch (error: any) {
    console.error('❌ Erreur page RainbowKit:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      details: error.message
    })
  }
})

// GET /api/mint-pages/rainbowkit-full/:subdomain - Page de mint avec vrai RainbowKit
router.get('/rainbowkit-full/:subdomain', async (req, res) => {
  try {
    const { subdomain } = req.params

    console.log(`🌈 Page RainbowKit complète pour: ${subdomain}`)

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

    console.log('✅ Page RainbowKit complète trouvée')

    // Headers CSP très permissifs pour RainbowKit complet
    res.setHeader('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "img-src 'self' data: https:; " +
      "connect-src 'self' https: wss: ws:;"
    )

    // Page avec vrai RainbowKit intégré
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${mintPage.title} - Mint NFT</title>
        
        <!-- Fonts -->
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        
        <!-- React 18 -->
        <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
        <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
        
        <!-- Babel pour JSX -->
        <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
        
        <!-- Wagmi & Viem -->
        <script src="https://unpkg.com/wagmi@2.12.16/dist/index.js"></script>
        <script src="https://unpkg.com/viem@2.21.19/dist/index.js"></script>
        
        <!-- RainbowKit -->
        <script src="https://unpkg.com/@rainbow-me/rainbowkit@2.1.6/dist/index.js"></script>
        <link rel="stylesheet" href="https://unpkg.com/@rainbow-me/rainbowkit@2.1.6/dist/index.css">
        
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: 'Inter', sans-serif; 
                background: linear-gradient(135deg, ${mintPage.background_color}, ${mintPage.primary_color}20);
                min-height: 100vh;
                color: #333;
            }
            .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
            
            .header { 
                background: linear-gradient(135deg, ${mintPage.primary_color}, ${mintPage.primary_color}dd);
                color: white; 
                padding: 60px 40px; 
                border-radius: 20px; 
                text-align: center; 
                margin-bottom: 40px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            }
            .header h1 { font-size: 3rem; font-weight: 700; margin-bottom: 20px; }
            .header p { font-size: 1.2rem; opacity: 0.9; max-width: 600px; margin: 0 auto; }
            
            .main-content { display: grid; grid-template-columns: 1fr 400px; gap: 40px; }
            @media (max-width: 768px) { .main-content { grid-template-columns: 1fr; } }
            
            .info-section { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
            .mint-section { 
                background: white; 
                padding: 40px; 
                border-radius: 20px; 
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                position: sticky;
                top: 20px;
                height: fit-content;
            }
            
            .price-display { 
                font-size: 2.5rem; 
                font-weight: 700; 
                color: ${mintPage.primary_color}; 
                text-align: center;
                margin: 20px 0;
            }
            
            .quantity-selector { 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                gap: 15px; 
                margin: 20px 0; 
            }
            .qty-btn { 
                background: ${mintPage.primary_color}; 
                color: white; 
                border: none; 
                width: 40px; 
                height: 40px; 
                border-radius: 10px; 
                font-size: 18px; 
                cursor: pointer; 
                transition: all 0.3s;
            }
            .qty-btn:hover { transform: scale(1.1); }
            .qty-display { 
                font-size: 1.5rem; 
                font-weight: 600; 
                min-width: 60px; 
                text-align: center; 
                padding: 10px; 
                background: #f8f9fa; 
                border-radius: 10px; 
            }
            
            .mint-btn { 
                width: 100%; 
                padding: 18px; 
                font-size: 1.1rem; 
                font-weight: 600; 
                border: none; 
                border-radius: 15px; 
                cursor: pointer; 
                transition: all 0.3s;
                background: linear-gradient(135deg, #10b981, #059669); 
                color: white; 
                margin: 20px 0;
            }
            .mint-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(0,0,0,0.2); }
            .mint-btn:disabled { background: #d1d5db; cursor: not-allowed; transform: none; }
            
            .social-links { display: flex; gap: 15px; justify-content: center; margin: 30px 0; flex-wrap: wrap; }
            .social-link { 
                display: flex; 
                align-items: center; 
                gap: 8px; 
                padding: 12px 20px; 
                background: white; 
                border-radius: 12px; 
                text-decoration: none; 
                color: #666; 
                font-weight: 500; 
                transition: all 0.3s;
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            }
            .social-link:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(0,0,0,0.15); }
            
            .badge { 
                text-align: center; 
                margin-top: 30px; 
                padding: 15px; 
                background: rgba(255,255,255,0.8); 
                border-radius: 12px; 
                font-size: 0.9rem; 
                color: #666; 
            }
            
            .status-message { 
                margin: 20px 0; 
                padding: 15px; 
                border-radius: 12px; 
                text-align: center; 
                font-weight: 500; 
            }
            .status-success { background: #dcfce7; color: #166534; }
            .status-error { background: #fef2f2; color: #dc2626; }
            .status-info { background: #dbeafe; color: #1d4ed8; }
        </style>
    </head>
    <body>
        <div id="root"></div>
        
        <script type="text/babel">
            const { useState, useEffect } = React;
            const { createConfig, http, WagmiProvider } = window.wagmi;
            const { mainnet, polygon, arbitrum } = window.wagmi.chains;
            const { QueryClient, QueryClientProvider } = window.ReactQuery || { 
                QueryClient: class { constructor() {} }, 
                QueryClientProvider: ({children}) => children 
            };
            const { RainbowKitProvider, ConnectButton, getDefaultConfig } = window.RainbowKit;
            
            // Configuration Wagmi
            const config = getDefaultConfig({
                appName: '${mintPage.title}',
                projectId: 'demo-project-id', // Remplacer par votre Wallet Connect Project ID
                chains: [polygon, mainnet, arbitrum],
                transports: {
                    [polygon.id]: http(),
                    [mainnet.id]: http(),
                    [arbitrum.id]: http(),
                }
            });
            
            const queryClient = new QueryClient();
            
            // Composant principal
            function MintApp() {
                const [quantity, setQuantity] = useState(1);
                const [status, setStatus] = useState(null);
                
                const mintPrice = ${mintPage.mint_price};
                const maxPerWallet = ${mintPage.max_per_wallet};
                const primaryColor = "${mintPage.primary_color}";
                
                const changeQuantity = (delta) => {
                    const newQuantity = quantity + delta;
                    if (newQuantity >= 1 && newQuantity <= maxPerWallet) {
                        setQuantity(newQuantity);
                    }
                };
                
                const mintNFT = () => {
                    setStatus({ message: '🎯 Minting NFT...', type: 'info' });
                    
                    // Simulation de mint
                    setTimeout(() => {
                        setStatus({ message: '🎉 NFT minted successfully!', type: 'success' });
                        setTimeout(() => setStatus(null), 5000);
                    }, 2000);
                };
                
                const totalPrice = (mintPrice * quantity).toFixed(3);
                
                return (
                    <div className="container">
                        {/* Header */}
                        <div className="header">
                            <h1>${mintPage.title}</h1>
                            <p>${mintPage.description}</p>
                        </div>
                        
                        {/* Main Content */}
                        <div className="main-content">
                            {/* Info Section */}
                            <div className="info-section">
                                <h2 style={{color: primaryColor, marginBottom: '30px', fontSize: '2rem'}}>Collection Details</h2>
                                
                                <div style={{marginBottom: '30px'}}>
                                    <h3 style={{color: primaryColor, marginBottom: '15px'}}>About This Collection</h3>
                                    <p style={{lineHeight: 1.6, color: '#666'}}>${mintPage.description}</p>
                                </div>
                                
                                <div style={{marginBottom: '30px'}}>
                                    <h3 style={{color: primaryColor, marginBottom: '15px'}}>Contract Information</h3>
                                    <p style={{fontFamily: 'monospace', background: '#f8f9fa', padding: '15px', borderRadius: '10px', wordBreak: 'break-all'}}>${mintPage.contract_address}</p>
                                </div>
                                
                                {/* Social Links */}
                                <div className="social-links">
                                    ${mintPage.social_links?.website ? `
                                    <a href="${mintPage.social_links.website}" className="social-link" target="_blank" rel="noopener">
                                        <span>🌐</span> Website
                                    </a>
                                    ` : ''}
                                    ${mintPage.social_links?.twitter ? `
                                    <a href="https://twitter.com/${mintPage.social_links.twitter.replace('@', '')}" className="social-link" target="_blank" rel="noopener">
                                        <span>🐦</span> Twitter
                                    </a>
                                    ` : ''}
                                    ${mintPage.social_links?.discord ? `
                                    <a href="${mintPage.social_links.discord.startsWith('http') ? mintPage.social_links.discord : 'https://discord.gg/' + mintPage.social_links.discord}" className="social-link" target="_blank" rel="noopener">
                                        <span>💬</span> Discord
                                    </a>
                                    ` : ''}
                                </div>
                            </div>
                            
                            {/* Mint Section */}
                            <div className="mint-section">
                                <h2 style={{textAlign: 'center', marginBottom: '30px', color: primaryColor}}>Mint Your NFT</h2>
                                
                                <div className="price-display">{totalPrice} ETH</div>
                                
                                {/* RainbowKit Connect Button */}
                                <div style={{margin: '20px 0'}}>
                                    <ConnectButton />
                                </div>
                                
                                {/* Quantity Selector */}
                                <div className="quantity-selector">
                                    <button className="qty-btn" onClick={() => changeQuantity(-1)}>−</button>
                                    <div className="qty-display">{quantity}</div>
                                    <button className="qty-btn" onClick={() => changeQuantity(1)}>+</button>
                                </div>
                                
                                {/* Mint Button */}
                                <button className="mint-btn" onClick={mintNFT}>🎯 Mint NFT</button>
                                
                                {/* Status Message */}
                                {status && (
                                    <div className={\`status-message status-\${status.type}\`}>
                                        {status.message}
                                    </div>
                                )}
                                
                                {/* Badge */}
                                <div className="badge">
                                    <p>🛡️ <strong>Generated by ContractForge.io</strong></p>
                                    <p>Secured by OpenZeppelin</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            }
            
            // App principal avec providers
            function App() {
                return (
                    <WagmiProvider config={config}>
                        <QueryClientProvider client={queryClient}>
                            <RainbowKitProvider>
                                <MintApp />
                            </RainbowKitProvider>
                        </QueryClientProvider>
                    </WagmiProvider>
                );
            }
            
            // Render
            ReactDOM.render(<App />, document.getElementById('root'));
        </script>
    </body>
    </html>
    `

    res.setHeader('Content-Type', 'text/html')
    res.send(html)

  } catch (error: any) {
    console.error('❌ Erreur page RainbowKit complète:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      details: error.message
    })
  }
})

// GET /api/mint-pages/rainbowkit-simple/:subdomain - Page de mint avec RainbowKit simplifié (qui fonctionne)
router.get('/rainbowkit-simple/:subdomain', async (req, res) => {
  try {
    const { subdomain } = req.params

    console.log(`🌈 Page RainbowKit simple pour: ${subdomain}`)

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

    console.log('✅ Page RainbowKit simple trouvée')

    // Headers CSP pour RainbowKit simple
    res.setHeader('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "img-src 'self' data: https:; " +
      "connect-src 'self' https: wss: ws:;"
    )

    // Page avec RainbowKit style mais sans complexité
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${mintPage.title} - Mint NFT</title>
        
        <!-- Fonts -->
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        
        <!-- Ethers.js pour wallet connection -->
        <script src="https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.umd.min.js"></script>
        
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: 'Inter', sans-serif; 
                background: linear-gradient(135deg, ${mintPage.background_color}, ${mintPage.primary_color}20);
                min-height: 100vh;
                color: #333;
            }
            .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
            
            .header { 
                background: linear-gradient(135deg, ${mintPage.primary_color}, ${mintPage.primary_color}dd);
                color: white; 
                padding: 60px 40px; 
                border-radius: 20px; 
                text-align: center; 
                margin-bottom: 40px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            }
            .header h1 { font-size: 3rem; font-weight: 700; margin-bottom: 20px; }
            .header p { font-size: 1.2rem; opacity: 0.9; max-width: 600px; margin: 0 auto; }
            
            .main-content { display: grid; grid-template-columns: 1fr 400px; gap: 40px; }
            @media (max-width: 768px) { .main-content { grid-template-columns: 1fr; } }
            
            .info-section { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
            .mint-section { 
                background: white; 
                padding: 40px; 
                border-radius: 20px; 
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                position: sticky;
                top: 20px;
                height: fit-content;
            }
            
            .price-display { 
                font-size: 2.5rem; 
                font-weight: 700; 
                color: ${mintPage.primary_color}; 
                text-align: center;
                margin: 20px 0;
            }
            
            /* RainbowKit-like wallet button */
            .wallet-container { margin: 20px 0; }
            .wallet-button { 
                width: 100%; 
                padding: 18px 24px; 
                background: linear-gradient(135deg, #FF6B6B, #4ECDC4); 
                color: white; 
                border: none; 
                border-radius: 16px; 
                font-size: 1rem; 
                font-weight: 600; 
                cursor: pointer; 
                transition: all 0.3s;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
                box-shadow: 0 8px 25px rgba(255, 107, 107, 0.3);
            }
            .wallet-button:hover { transform: translateY(-2px); box-shadow: 0 12px 35px rgba(255, 107, 107, 0.4); }
            
            .wallet-connected { 
                background: linear-gradient(135deg, #10b981, #059669); 
                box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
            }
            .wallet-connected:hover { box-shadow: 0 12px 35px rgba(16, 185, 129, 0.4); }
            
            .wallet-info { 
                background: rgba(16, 185, 129, 0.1); 
                border: 2px solid rgba(16, 185, 129, 0.2); 
                padding: 16px; 
                border-radius: 12px; 
                margin: 16px 0; 
                text-align: center;
            }
            .wallet-address { 
                font-family: monospace; 
                color: #059669; 
                font-weight: 600; 
                margin-bottom: 8px; 
            }
            .disconnect-btn { 
                background: rgba(220, 38, 38, 0.1); 
                color: #dc2626; 
                border: 1px solid rgba(220, 38, 38, 0.3); 
                padding: 8px 16px; 
                border-radius: 8px; 
                cursor: pointer; 
                font-size: 0.9rem;
                transition: all 0.3s;
            }
            .disconnect-btn:hover { background: rgba(220, 38, 38, 0.2); }
            
            .quantity-selector { 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                gap: 15px; 
                margin: 20px 0; 
            }
            .qty-btn { 
                background: ${mintPage.primary_color}; 
                color: white; 
                border: none; 
                width: 40px; 
                height: 40px; 
                border-radius: 10px; 
                font-size: 18px; 
                cursor: pointer; 
                transition: all 0.3s;
            }
            .qty-btn:hover { transform: scale(1.1); }
            .qty-display { 
                font-size: 1.5rem; 
                font-weight: 600; 
                min-width: 60px; 
                text-align: center; 
                padding: 10px; 
                background: #f8f9fa; 
                border-radius: 10px; 
            }
            
            .mint-btn { 
                width: 100%; 
                padding: 18px; 
                font-size: 1.1rem; 
                font-weight: 600; 
                border: none; 
                border-radius: 15px; 
                cursor: pointer; 
                transition: all 0.3s;
                background: linear-gradient(135deg, #8B5CF6, #7C3AED); 
                color: white; 
                margin: 20px 0;
                box-shadow: 0 8px 25px rgba(139, 92, 246, 0.3);
            }
            .mint-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 35px rgba(139, 92, 246, 0.4); }
            .mint-btn:disabled { 
                background: #d1d5db; 
                cursor: not-allowed; 
                transform: none; 
                box-shadow: none; 
            }
            
            .social-links { display: flex; gap: 15px; justify-content: center; margin: 30px 0; flex-wrap: wrap; }
            .social-link { 
                display: flex; 
                align-items: center; 
                gap: 8px; 
                padding: 12px 20px; 
                background: white; 
                border-radius: 12px; 
                text-decoration: none; 
                color: #666; 
                font-weight: 500; 
                transition: all 0.3s;
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            }
            .social-link:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(0,0,0,0.15); }
            
            .badge { 
                text-align: center; 
                margin-top: 30px; 
                padding: 15px; 
                background: rgba(255,255,255,0.8); 
                border-radius: 12px; 
                font-size: 0.9rem; 
                color: #666; 
            }
            
            .status-message { 
                margin: 20px 0; 
                padding: 15px; 
                border-radius: 12px; 
                text-align: center; 
                font-weight: 500; 
                display: none;
            }
            .status-success { background: #dcfce7; color: #166534; }
            .status-error { background: #fef2f2; color: #dc2626; }
            .status-info { background: #dbeafe; color: #1d4ed8; }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- Header -->
            <div class="header">
                <h1>${mintPage.title}</h1>
                <p>${mintPage.description}</p>
            </div>
            
            <!-- Main Content -->
            <div class="main-content">
                <!-- Info Section -->
                <div class="info-section">
                    <h2 style="color: ${mintPage.primary_color}; margin-bottom: 30px; font-size: 2rem;">🌈 RainbowKit Style Collection</h2>
                    
                    <div style="margin-bottom: 30px;">
                        <h3 style="color: ${mintPage.primary_color}; margin-bottom: 15px;">About This Collection</h3>
                        <p style="line-height: 1.6; color: #666;">${mintPage.description}</p>
                    </div>
                    
                    <div style="margin-bottom: 30px;">
                        <h3 style="color: ${mintPage.primary_color}; margin-bottom: 15px;">Contract Information</h3>
                        <p style="font-family: monospace; background: #f8f9fa; padding: 15px; border-radius: 10px; word-break: break-all;">${mintPage.contract_address}</p>
                    </div>
                    
                    <!-- Social Links -->
                    <div class="social-links">
                        ${mintPage.social_links?.website ? `
                        <a href="${mintPage.social_links.website}" class="social-link" target="_blank" rel="noopener">
                            <span>🌐</span> Website
                        </a>
                        ` : ''}
                        ${mintPage.social_links?.twitter ? `
                        <a href="https://twitter.com/${mintPage.social_links.twitter.replace('@', '')}" class="social-link" target="_blank" rel="noopener">
                            <span>🐦</span> Twitter
                        </a>
                        ` : ''}
                        ${mintPage.social_links?.discord ? `
                        <a href="${mintPage.social_links.discord.startsWith('http') ? mintPage.social_links.discord : 'https://discord.gg/' + mintPage.social_links.discord}" class="social-link" target="_blank" rel="noopener">
                            <span>💬</span> Discord
                        </a>
                        ` : ''}
                    </div>
                </div>
                
                <!-- Mint Section -->
                <div class="mint-section">
                    <h2 style="text-align: center; margin-bottom: 30px; color: ${mintPage.primary_color};">Mint Your NFT</h2>
                    
                    <div class="price-display" id="price-display">${mintPage.mint_price} ETH</div>
                    
                    <!-- RainbowKit-style Wallet Connection -->
                    <div class="wallet-container">
                        <button class="wallet-button" id="wallet-button">
                            🌈 Connect Wallet
                        </button>
                        <div id="wallet-info" class="wallet-info" style="display: none;">
                            <div class="wallet-address" id="wallet-address"></div>
                            <button class="disconnect-btn" id="disconnect-btn">Disconnect</button>
                        </div>
                    </div>
                    
                    <!-- Quantity Selector -->
                    <div class="quantity-selector">
                        <button class="qty-btn" id="qty-minus">−</button>
                        <div class="qty-display" id="quantity">1</div>
                        <button class="qty-btn" id="qty-plus">+</button>
                    </div>
                    
                    <!-- Mint Button -->
                    <button class="mint-btn" id="mint-button" disabled>🎯 Mint NFT</button>
                    
                    <!-- Status Message -->
                    <div id="status-message" class="status-message"></div>
                    
                    <!-- Badge -->
                    <div class="badge">
                        <p>🌈 <strong>Powered by RainbowKit Style</strong></p>
                        <p>🛡️ Generated by ContractForge.io</p>
                        <p>Secured by OpenZeppelin</p>
                    </div>
                </div>
            </div>
        </div>
        
        <script>
            console.log('🌈 RainbowKit-style page loading...');
            
            // Configuration
            let quantity = 1;
            let isConnected = false;
            let userAddress = null;
            const maxPerWallet = ${mintPage.max_per_wallet};
            const mintPrice = ${mintPage.mint_price};
            
            // Elements
            const walletButton = document.getElementById('wallet-button');
            const walletInfo = document.getElementById('wallet-info');
            const walletAddressEl = document.getElementById('wallet-address');
            const disconnectBtn = document.getElementById('disconnect-btn');
            const mintButton = document.getElementById('mint-button');
            const priceDisplay = document.getElementById('price-display');
            const quantityEl = document.getElementById('quantity');
            
            // Event listeners
            walletButton.addEventListener('click', connectWallet);
            disconnectBtn.addEventListener('click', disconnectWallet);
            document.getElementById('qty-minus').addEventListener('click', () => changeQuantity(-1));
            document.getElementById('qty-plus').addEventListener('click', () => changeQuantity(1));
            mintButton.addEventListener('click', mintNFT);
            
            // Wallet functions
            async function connectWallet() {
                console.log('🔌 Connecting wallet...');
                
                if (typeof window.ethereum === 'undefined') {
                    showStatus('Please install MetaMask!', 'error');
                    return;
                }
                
                try {
                    walletButton.innerHTML = '⏳ Connecting...';
                    
                    const accounts = await window.ethereum.request({ 
                        method: 'eth_requestAccounts' 
                    });
                    
                    userAddress = accounts[0];
                    isConnected = true;
                    
                    updateWalletUI();
                    showStatus('🎉 Wallet connected successfully!', 'success');
                    
                    console.log('✅ Connected:', userAddress);
                    
                } catch (error) {
                    console.error('❌ Connection failed:', error);
                    showStatus('Connection failed: ' + error.message, 'error');
                    walletButton.innerHTML = '🌈 Connect Wallet';
                }
            }
            
            function disconnectWallet() {
                console.log('🔌 Disconnecting wallet...');
                isConnected = false;
                userAddress = null;
                updateWalletUI();
                showStatus('👋 Wallet disconnected', 'info');
            }
            
            function updateWalletUI() {
                if (isConnected && userAddress) {
                    walletButton.style.display = 'none';
                    walletInfo.style.display = 'block';
                    walletAddressEl.textContent = userAddress.substring(0, 6) + '...' + userAddress.substring(38);
                    mintButton.disabled = false;
                } else {
                    walletButton.style.display = 'flex';
                    walletButton.innerHTML = '🌈 Connect Wallet';
                    walletInfo.style.display = 'none';
                    mintButton.disabled = true;
                }
            }
            
            // Quantity functions
            function changeQuantity(delta) {
                const newQuantity = quantity + delta;
                if (newQuantity >= 1 && newQuantity <= maxPerWallet) {
                    quantity = newQuantity;
                    quantityEl.textContent = quantity;
                    updatePrice();
                }
            }
            
            function updatePrice() {
                const total = (mintPrice * quantity).toFixed(3);
                priceDisplay.textContent = total + ' ETH';
            }
            
            // Mint function - VRAIE IMPLEMENTATION
            async function mintNFT() {
                if (!isConnected) {
                    showStatus('Please connect your wallet first!', 'error');
                    return;
                }
                
                console.log('🎯 Starting real mint...');
                mintButton.innerHTML = '⏳ Minting...';
                mintButton.disabled = true;
                
                try {
                    showStatus('🎯 Preparing transaction...', 'info');
                    
                    // Vérifier les informations du contrat
                    const contractAddress = '${mintPage.contract_address}';
                    if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
                        throw new Error('Contract address not configured');
                    }
                    
                    // Prix total
                    const totalPrice = ethers.utils.parseEther((mintPrice * quantity).toString());
                    
                    console.log('💰 Mint details:', {
                        contract: contractAddress,
                        quantity: quantity,
                        price: ethers.utils.formatEther(totalPrice) + ' ETH'
                    });
                    
                    // ABI NFT avec mint function
                    const nftABI = [
                        "function mint(uint256 quantity) external payable",
                        "function getMintInfo(address wallet) external view returns (uint256 mintedCount, uint256 remainingMints, uint256 mintPrice, bool canMint)",
                        "function totalSupply() external view returns (uint256)",
                        "function MAX_SUPPLY() external view returns (uint256)",
                        "function publicMintEnabled() external view returns (bool)"
                    ];
                    
                    // Créer le contrat
                    const provider = new ethers.providers.Web3Provider(window.ethereum);
                    const signer = provider.getSigner();
                    const contract = new ethers.Contract(contractAddress, nftABI, signer);
                    
                    // Vérifier si le mint est possible
                    const [mintedCount, remainingMints, contractMintPrice, canMint] = await contract.getMintInfo(userAddress);
                    
                    if (!canMint) {
                        throw new Error('Minting is not currently available');
                    }
                    
                    if (remainingMints.lt(quantity)) {
                        throw new Error(\`Only \${remainingMints.toString()} mints remaining for your wallet\`);
                    }
                    
                    showStatus('📝 Sending transaction...', 'info');
                    
                    // Envoyer la transaction de mint
                    const tx = await contract.mint(quantity, {
                        value: totalPrice,
                        gasLimit: 100000 + (50000 * quantity) // Gas dynamique
                    });
                    
                    showStatus('⏳ Waiting for confirmation...', 'info');
                    console.log('🔗 Transaction hash:', tx.hash);
                    
                    // Attendre la confirmation
                    const receipt = await tx.wait();
                    
                    if (receipt.status === 1) {
                        showStatus(\`🎉 Successfully minted \${quantity} NFT\${quantity > 1 ? 's' : ''}! Transaction: \${tx.hash.substring(0, 10)}...\`, 'success');
                        console.log('✅ Mint successful:', receipt);
                        
                        // Mettre à jour l'affichage
                        setTimeout(() => {
                            window.location.reload(); // Recharger pour voir les nouvelles stats
                        }, 3000);
                    } else {
                        throw new Error('Transaction failed');
                    }
                    
                } catch (error) {
                    console.error('❌ Mint error:', error);
                    
                    let errorMessage = 'Mint failed: ';
                    if (error.code === 4001) {
                        errorMessage = 'Transaction cancelled by user';
                    } else if (error.message.includes('insufficient funds')) {
                        errorMessage = 'Insufficient funds for transaction';
                    } else if (error.message.includes('exceeds')) {
                        errorMessage = error.message;
                    } else if (error.reason) {
                        errorMessage += error.reason;
                    } else {
                        errorMessage += error.message || 'Unknown error';
                    }
                    
                    showStatus(errorMessage, 'error');
                } finally {
                    mintButton.innerHTML = '🎯 Mint NFT';
                    mintButton.disabled = false;
                }
            }
            
            // Status function
            function showStatus(message, type) {
                const statusEl = document.getElementById('status-message');
                statusEl.textContent = message;
                statusEl.className = 'status-message status-' + type;
                statusEl.style.display = 'block';
                
                if (type === 'success' || type === 'info') {
                    setTimeout(() => {
                        statusEl.style.display = 'none';
                    }, 5000);
                }
            }
            
            // Charger les informations du contrat
            async function loadContractInfo() {
                const contractAddress = '${mintPage.contract_address}';
                if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
                    console.warn('⚠️ Contract address not configured');
                    return;
                }
                
                try {
                    const provider = new ethers.providers.Web3Provider(window.ethereum);
                    const nftABI = [
                        "function totalSupply() external view returns (uint256)",
                        "function MAX_SUPPLY() external view returns (uint256)",
                        "function MINT_PRICE() external view returns (uint256)",
                        "function publicMintEnabled() external view returns (bool)"
                    ];
                    
                    const contract = new ethers.Contract(contractAddress, nftABI, provider);
                    
                    const [currentSupply, maxSupply, contractMintPrice, isEnabled] = await Promise.all([
                        contract.totalSupply(),
                        contract.MAX_SUPPLY(),
                        contract.MINT_PRICE(),
                        contract.publicMintEnabled()
                    ]);
                    
                    console.log('📊 Contract info:', {
                        address: contractAddress,
                        currentSupply: currentSupply.toString(),
                        maxSupply: maxSupply.toString(),
                        mintPrice: ethers.utils.formatEther(contractMintPrice),
                        enabled: isEnabled
                    });
                    
                    // Mettre à jour l'affichage si nécessaire
                    if (!isEnabled) {
                        showStatus('⚠️ Public minting is currently disabled', 'error');
                        mintButton.disabled = true;
                    }
                    
                } catch (error) {
                    console.warn('⚠️ Could not load contract info:', error.message);
                    showStatus('⚠️ Contract information unavailable', 'error');
                }
            }
            
            // Charger les infos au démarrage si Ethereum est disponible
            if (typeof window.ethereum !== 'undefined') {
                loadContractInfo();
            }
            
            console.log('✅ RainbowKit-style page ready!');
        </script>
    </body>
    </html>
    `

    res.setHeader('Content-Type', 'text/html')
    res.send(html)

  } catch (error: any) {
    console.error('❌ Erreur page RainbowKit simple:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      details: error.message
    })
  }
})

export default router 