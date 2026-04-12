// Client Supabase singleton — ES module
// Le SDK est chargé via CDN dans index.html avant src/main.js
// Les variables d'env sont injectées par Vercel via window.__SUPABASE_*__

const SUPABASE_URL = window.__SUPABASE_URL__ || 'https://devqrxfazgupmesnkdcw.supabase.co'
const SUPABASE_ANON_KEY = window.__SUPABASE_ANON_KEY__ || 'sb_publishable_JPTESUSWI-iMehYb6ge0rg_0be70ncM'

const { createClient } = supabase
export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Exposer globalement pour app.js et autres scripts
window.supabaseClient = supabaseClient
