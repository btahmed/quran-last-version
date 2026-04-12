// Service d'administration Supabase — QuranReview
import { supabaseClient } from './supabase-client.js'
import { createUser } from './supabase-auth.js'

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

export async function deleteUser(userId) {
  // Nécessite une Edge Function avec service_role — non implémentable côté client
  return { data: null, error: new Error('deleteUser nécessite une Edge Function (service_role requis)') }
}

export async function createTeacher(email, password, username) {
  return createUser(email, password, username, 'teacher')
}

export async function getStudentProgress(studentId) {
  try {
    const [tasksRes, submissionsRes, pointsRes] = await Promise.all([
      supabaseClient.from('tasks').select('*').eq('user_id', studentId).order('created_at', { ascending: false }),
      supabaseClient.from('submissions').select('*').eq('student_id', studentId).order('submitted_at', { ascending: false }),
      supabaseClient.from('points_log').select('delta').eq('student_id', studentId),
    ])

    if (tasksRes.error) return { data: null, error: tasksRes.error }
    if (submissionsRes.error) return { data: null, error: submissionsRes.error }
    if (pointsRes.error) return { data: null, error: pointsRes.error }

    const totalPoints = (pointsRes.data || []).reduce((sum, row) => sum + (row.delta || 0), 0)

    return { data: { tasks: tasksRes.data, submissions: submissionsRes.data, totalPoints }, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function getAdminOverview() {
  try {
    const [usersRes, tasksRes, submissionsRes] = await Promise.all([
      supabaseClient.from('profiles').select('id, role'),
      supabaseClient.from('tasks').select('id', { count: 'exact', head: true }),
      supabaseClient.from('submissions').select('id, status'),
    ])

    const users = usersRes.data || []
    const submissions = submissionsRes.data || []

    return {
      data: {
        total_users: users.length,
        total_students: users.filter(u => u.role === 'student').length,
        total_teachers: users.filter(u => u.role === 'teacher').length,
        total_tasks: tasksRes.count || 0,
        pending_submissions: submissions.filter(s => s.status === 'submitted').length,
        approved_submissions: submissions.filter(s => s.status === 'approved').length,
      },
      error: null,
    }
  } catch (error) {
    return { data: null, error }
  }
}

export async function getClasses() {
  try {
    const { data, error } = await supabaseClient
      .from('classes')
      .select('*, profiles!teacher_id(id, username), class_members(count)')
      .order('name', { ascending: true })

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function getMyStudents() {
  try {
    // Récupérer tous les étudiants (pour un enseignant)
    // TODO: Filtrer par classe/teacher_id quand la relation sera établie
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .order('username', { ascending: true })

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

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
