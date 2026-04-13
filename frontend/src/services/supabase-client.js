// Client Supabase singleton — ES module
// Le SDK est chargé via CDN dans index.html avant src/main.js
// Les variables d'env sont injectées par Vercel via window.__SUPABASE_*__
// En dev local, définir ces variables dans index.html ou via un script de config

const SUPABASE_URL = window.__SUPABASE_URL__
const SUPABASE_ANON_KEY = window.__SUPABASE_ANON_KEY__

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('[Supabase] Variables d\'environnement manquantes. Configurer __SUPABASE_URL__ et __SUPABASE_ANON_KEY__')
}

const { createClient } = supabase
// Fallback dev local — en prod, configurer les variables d'env Vercel
// Note: La clé anon est publique par design (RLS protège les données)
const DEFAULT_URL = 'https://devqrxfazgupmesnkdcw.supabase.co'
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRldnFyeGZhemd1cG1lc25rZGN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyMjI5NzUsImV4cCI6MjA1OTc5ODk3NX0.cPPTxN4oa5VN_FPnWvVn7taO8LXrpc-fVCsJzNqKrHc'

export const supabaseClient = createClient(
  SUPABASE_URL || DEFAULT_URL,
  SUPABASE_ANON_KEY || DEFAULT_KEY
)

// Exposer globalement pour app.js et autres scripts
window.supabaseClient = supabaseClient
