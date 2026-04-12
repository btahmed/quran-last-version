// Service de gestion des tâches Supabase — QuranReview
import { supabaseClient } from './supabase-client.js'

export async function getMyTasks() {
  try {
    const { data: authData, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !authData?.user) return { data: null, error: authError }

    const { data, error } = await supabaseClient
      .from('tasks')
      .select('*')
      .eq('user_id', authData.user.id)
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
    const { data: authData, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !authData?.user) return { data: null, error: authError }

    const { data, error } = await supabaseClient
      .from('tasks')
      .insert({ ...payload, assigned_by: authData.user.id })
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
