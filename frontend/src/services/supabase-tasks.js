// Service de gestion des tâches Supabase — QuranReview
import { supabaseClient } from './supabase-client.js'
import { apiCache } from '../core/apiCache.js'

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

    // Extraire les champs valides de la table tasks (exclure assign_all, student_ids, task_type)
    const { assign_all, student_ids, task_type, ...rest } = payload
    // Mapper task_type → type si l'appelant utilise l'ancien nom
    const taskFields = { ...rest, ...(task_type && !rest.type ? { type: task_type } : {}) }

    // Si user_id est déjà fourni, insérer directement une seule tâche
    if (taskFields.user_id) {
      const row = {
        title: taskFields.title || '',
        description: taskFields.description || '',
        type: taskFields.type || 'hifz',
        points: taskFields.points || 0,
        user_id: taskFields.user_id,
        assigned_by: profile.id,
      }
      // Ajouter due_date seulement si défini
      if (taskFields.due_date) row.due_date = taskFields.due_date
      
      const { data, error } = await supabaseClient
        .from('tasks')
        .insert(row)
        .select()
        .single()
      return { data, error }
    }

    // Sinon, déterminer la liste des user_ids cibles
    let targetIds = []
    if (assign_all) {
      // Tous les étudiants : récupérer depuis profiles
      const { data: students } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('role', 'student')
      targetIds = (students || []).map(s => s.id)
    } else {
      targetIds = student_ids || []
    }

    if (!targetIds.length) return { data: null, error: { message: 'Aucun étudiant sélectionné' } }

    // Insérer une tâche par étudiant
    const rows = targetIds.map(userId => ({
      title: taskFields.title || '',
      description: taskFields.description || '',
      type: taskFields.type || 'hifz',
      points: taskFields.points || 0,
      due_date: taskFields.due_date || null,
      user_id: userId,
      assigned_by: profile.id,
    }))

    const { data, error } = await supabaseClient
      .from('tasks')
      .insert(rows)
      .select()

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

    if (!error) apiCache.invalidate('tasks')
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

    if (!error) apiCache.invalidate('tasks')
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

