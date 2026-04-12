// Client Supabase singleton — ES module
// Le SDK est chargé via CDN dans index.html avant src/main.js
// SUPABASE_URL et SUPABASE_ANON_KEY sont définis dans index.html

const SUPABASE_URL = 'https://devqrxfazgupmesnkdcw.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_JPTESUSWI-iMehYb6ge0rg_0be70ncM'

const { createClient } = supabase
export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
