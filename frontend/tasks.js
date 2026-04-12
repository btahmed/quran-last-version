// Module de gestion des tâches — QuranReview
// supabaseClient est exposé globalement par supabase-client.js
const supabaseClient = window.supabaseClient

/**
 * Récupère les tâches de l'utilisateur connecté,
 * ordonnées par date de création décroissante.
 */
export async function getMyTasks() {
  try {
    const { data: authData, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !authData?.user) return { data: null, error: authError }
    const user = authData.user

    const { data, error } = await supabaseClient
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Récupère les tâches d'un élève spécifique (prof/admin).
 * @param {string} studentId - UUID de l'élève
 */
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

/**
 * Récupère toutes les tâches (admin uniquement).
 */
export async function getAllTasks() {
  try {
    const { data, error } = await supabaseClient
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Crée une nouvelle tâche.
 * @param {Object} payload - { user_id, title, description, type, priority, surah, start_ayah, end_ayah, due_date, points }
 */
export async function createTask(payload) {
  try {
    const { data: authData, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !authData?.user) return { data: null, error: authError }
    const user = authData.user

    const { data, error } = await supabaseClient
      .from('tasks')
      .insert({ ...payload, assigned_by: user.id })
      .select()
      .single()

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Met à jour une tâche existante.
 * @param {string} id - UUID de la tâche
 * @param {Object} payload - champs à mettre à jour
 */
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

/**
 * Supprime une tâche par son ID.
 * @param {string} id - UUID de la tâche
 */
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

/**
 * Supprime toutes les tâches (admin uniquement).
 * Attention : opération irréversible.
 */
export async function deleteAllTasks() {
  try {
    // Supabase requiert une condition pour le delete en masse
    // On utilise une condition toujours vraie via neq sur un champ non-null
    const { data, error } = await supabaseClient
      .from('tasks')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}
