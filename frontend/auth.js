// Module d'authentification — QuranReview
// supabaseClient est exposé globalement par supabase-client.js
const supabaseClient = window.supabaseClient

// Cas particulier : AHMAD utilise un email Gmail
const SPECIAL_EMAIL_MAP = {
  AHMAD: 'AHMAD@gmail.com',
}

/**
 * Construit l'email à partir du username.
 * Cas spécial : AHMAD → AHMAD@gmail.com
 * Sinon : username@quranreview.local
 */
function buildEmail(username) {
  return SPECIAL_EMAIL_MAP[username] ?? `${username}@quranreview.local`
}

/**
 * Connexion avec username + mot de passe.
 * L'email est construit automatiquement depuis le username.
 */
export async function signIn(username, password) {
  try {
    const email = buildEmail(username)
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password })
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Déconnexion de l'utilisateur courant.
 */
export async function signOut() {
  try {
    const { data, error } = await supabaseClient.auth.signOut()
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Récupère la session active.
 */
export async function getSession() {
  try {
    const { data, error } = await supabaseClient.auth.getSession()
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Retourne le profil complet de l'utilisateur connecté
 * depuis la table profiles (basé sur auth.uid()).
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) return { data: null, error: authError }

    const { data, error } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Écoute les changements d'état d'authentification.
 * @param {Function} callback - (event, session) => void
 */
export function onAuthStateChange(callback) {
  return supabaseClient.auth.onAuthStateChange(callback)
}

/**
 * Crée un nouvel utilisateur (admin uniquement).
 * L'email est construit depuis le username.
 * @param {string} email - ignoré, construit depuis username
 * @param {string} password
 * @param {string} username
 * @param {string} role - student | teacher | admin
 */
export async function createUser(email, password, username, role) {
  try {
    const builtEmail = buildEmail(username)
    const { data, error } = await supabaseClient.auth.signUp({
      email: builtEmail,
      password,
      options: {
        data: { username, role },
      },
    })
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}
