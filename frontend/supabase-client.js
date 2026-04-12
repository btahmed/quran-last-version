// Client Supabase singleton — exposé globalement via window.supabaseClient
// SDK chargé via CDN, config.js expose SUPABASE_URL et SUPABASE_ANON_KEY
const { createClient } = supabase
window.supabaseClient = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY)
