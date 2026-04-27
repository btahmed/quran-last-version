// Service d'authentification Supabase — QuranReview
import { supabaseClient } from './supabase-client.js'

function buildEmail(username) {
  const normalized = (username || '').trim().toLowerCase()
  return `${normalized}@quranreview.local`
}

export async function signIn(username, password) {
  try {
    const email = buildEmail(username)
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password })
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function signOut() {
  try {
    const { error } = await supabaseClient.auth.signOut()
    return { error }
  } catch (error) {
    return { error }
  }
}

export async function getSession() {
  try {
    const { data, error } = await supabaseClient.auth.getSession()
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function getCurrentUser() {
  try {
    const { data: authData, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !authData?.user) return { data: null, error: authError }

    const { data, error } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle()

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function createUser(email, password, username, role = 'student') {
  try {
    const userEmail = email || buildEmail(username)
    const { data, error } = await supabaseClient.auth.signUp({
      email: userEmail,
      password,
      options: { data: { username, role } },
    })
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export function onAuthStateChange(callback) {
  return supabaseClient.auth.onAuthStateChange(callback)
}
