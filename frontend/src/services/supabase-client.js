// Client Supabase singleton — ES module
// Le SDK est chargé via CDN dans index.html avant src/main.js
// Les variables d'env sont injectées par Vercel via window.__SUPABASE_*__
// En dev local, définir ces variables dans index.html ou via un script de config

// window.__SUPABASE_*__ sont définis dans index.html (fallback dev local)
// ou écrasés par Vercel en prod
const SUPABASE_URL = window.__SUPABASE_URL__
const SUPABASE_ANON_KEY = window.__SUPABASE_ANON_KEY__

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('[Supabase] Variables manquantes — vérifier index.html ou Vercel env vars')
}

const { createClient } = supabase
export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Exposer globalement pour app.js et autres scripts
window.supabaseClient = supabaseClient
