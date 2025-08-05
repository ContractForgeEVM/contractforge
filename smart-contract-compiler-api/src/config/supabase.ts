import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Charger les variables d'environnement
dotenv.config()

console.log('🔍 Supabase Config - URL:', process.env.SUPABASE_URL ? 'OK' : 'MISSING')
console.log('🔍 Supabase Config - Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'OK' : 'MISSING')

let supabase: any = null
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  try {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    console.log('✅ Client Supabase initialisé avec succès')
  } catch (error) {
    console.error('❌ Erreur initialisation Supabase:', error)
  }
} else {
  console.error('❌ Variables Supabase manquantes!')
}

export { supabase }