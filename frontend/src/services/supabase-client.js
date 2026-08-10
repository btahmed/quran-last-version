// Client Supabase singleton — ES module
// Le SDK est chargé via CDN dans index.html avant src/main.js
// Les variables d'env sont injectées par Vercel via window.__SUPABASE_*__
// En dev local, définir ces variables dans index.html ou via un script de config

// window.__SUPABASE_*__ sont définis dans index.html (fallback dev local)
// ou écrasés par Vercel en prod
const SUPABASE_URL = window.__SUPABASE_URL__ || "http://localhost";
const SUPABASE_ANON_KEY = window.__SUPABASE_ANON_KEY__ || "mock-key";

if (!window.__SUPABASE_URL__ || !window.__SUPABASE_ANON_KEY__) {
    console.warn('[Supabase] Variables manquantes — vérification skip en tests');
}

// Ensure createClient is available in test environment
const createClient = (typeof supabase !== 'undefined') ? supabase.createClient : () => ({});
export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Exposer globalement pour app.js et autres scripts
window.supabaseClient = supabaseClient;
