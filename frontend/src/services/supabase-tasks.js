// Service de gestion des tâches Supabase — QuranReview
import { supabaseClient } from './supabase-client.js'

export async function getMyTasks() {
  try {
    // Récupérer l'utilisateur depuis localStorage (Django JWT)
    const localUser = JSON.parse(localStorage.getItem('quranreview_user') || 'null')
    if (!localUser?.username) return { data: [], error: null }

    // Résoudre l'UUID Supabase via username
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('username', localUser.username)
      .single()

    if (!profile) return { data: [], error: null }

    const { data, error } = await supabaseClient
      .from('tasks')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function getStudentTasks(studentId) {
  try {
    const { data, error } = await supabaseClient
      .from('tasks')
      .select('*')
      .eq('user_id', studentId)
      .order('created_at', { ascending: false })

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function getAllTasks() {
  try {
    const { data, error } = await supabaseClient
      .from('tasks')
      .select('*, profiles!user_id(username)')
      .order('created_at', { ascending: false })

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function createTask(payload) {
  try {
    // Récupérer l'utilisateur depuis localStorage (Django JWT)
    const localUser = JSON.parse(localStorage.getItem('quranreview_user') || 'null')
    if (!localUser?.username) return { data: null, error: { message: 'Non authentifié' } }

    // Résoudre l'UUID Supabase du prof via username
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('username', localUser.username)
      .single()

    if (!profile) return { data: null, error: { message: 'Profil non trouvé' } }

    const { data, error } = await supabaseClient
      .from('tasks')
      .insert({ ...payload, assigned_by: profile.id })
      .select()
      .single()

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function updateTask(id, payload) {
  try {
    const { data, error } = await supabaseClient
      .from('tasks')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function deleteTask(id) {
  try {
    const { data, error } = await supabaseClient
      .from('tasks')
      .delete()
      .eq('id', id)

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function deleteAllTasks() {
  try {
    const { data, error } = await supabaseClient
      .from('tasks')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}
