// Module d'administration — QuranReview
// supabaseClient est exposé globalement par supabase-client.js
const supabaseClient = window.supabaseClient
import { createUser } from './auth.js'

/**
 * Récupère tous les profils utilisateurs,
 * ordonnés par rôle puis par username.
 */
export async function getAllUsers() {
  try {
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('*')
      .order('role', { ascending: true })
      .order('username', { ascending: true })

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Met à jour le profil d'un utilisateur.
 * @param {string} userId - UUID de l'utilisateur
 * @param {Object} payload - { role?, username?, phone? }
 */
export async function updateUser(userId, payload) {
  try {
    const { data, error } = await supabaseClient
      .from('profiles')
      .update(payload)
      .eq('id', userId)
      .select()
      .single()

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Supprime un utilisateur.
 * TODO: Cette fonction nécessite la clé service_role Supabase et ne peut
 * pas être appelée depuis le navigateur (sécurité). Elle doit être
 * implémentée côté serveur (Edge Function ou backend sécurisé).
 * @param {string} userId - UUID de l'utilisateur à supprimer
 */
export async function deleteUser(userId) {
  // TODO: Implémenter via une Supabase Edge Function avec service_role key
  // supabase.auth.admin.deleteUser(userId) requiert le service_role secret
  // qui ne doit JAMAIS être exposé côté client.
  if (window.DEBUG) console.warn('deleteUser: nécessite une Edge Function côté serveur')
  return {
    data: null,
    error: new Error('deleteUser doit être appelé depuis une Edge Function sécurisée (service_role requis)'),
  }
}

/**
 * Crée un compte professeur.
 * @param {string} email - ignoré, construit depuis username
 * @param {string} password
 * @param {string} username
 */
export async function createTeacher(email, password, username) {
  return createUser(email, password, username, 'teacher')
}

/**
 * Récupère la progression complète d'un élève :
 * tâches, soumissions et total de points.
 * @param {string} studentId - UUID de l'élève
 */
export async function getStudentProgress(studentId) {
  try {
    // Tâches de l'élève
    const { data: tasks, error: tasksError } = await supabaseClient
      .from('tasks')
      .select('*')
      .eq('user_id', studentId)
      .order('created_at', { ascending: false })

    if (tasksError) return { data: null, error: tasksError }

    // Soumissions de l'élève
    const { data: submissions, error: submissionsError } = await supabaseClient
      .from('submissions')
      .select('*')
      .eq('student_id', studentId)
      .order('submitted_at', { ascending: false })

    if (submissionsError) return { data: null, error: submissionsError }

    // Total des points
    const { data: pointsData, error: pointsError } = await supabaseClient
      .from('points_log')
      .select('delta')
      .eq('student_id', studentId)

    if (pointsError) return { data: null, error: pointsError }

    const totalPoints = pointsData.reduce((sum, row) => sum + (row.delta || 0), 0)

    return {
      data: { tasks, submissions, totalPoints },
      error: null,
    }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Récupère toutes les classes avec les infos du professeur
 * et le nombre d'élèves inscrits.
 */
export async function getClasses() {
  try {
    const { data, error } = await supabaseClient
      .from('classes')
      .select(`
        *,
        profiles!teacher_id(id, username),
        class_members(count)
      `)
      .order('name', { ascending: true })

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Inscrit un élève dans une classe.
 * @param {string} studentId - UUID de l'élève
 * @param {string} classId - UUID de la classe
 */
export async function assignStudentToClass(studentId, classId) {
  try {
    const { data, error } = await supabaseClient
      .from('class_members')
      .insert({ student_id: studentId, class_id: classId })
      .select()
      .single()

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}
