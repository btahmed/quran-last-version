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

export async function getStudentProgress(userId) {
  try {
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles').select('*').eq('id', userId).single()
    if (profileError || !profile) return { data: null, error: profileError }

    const isTeacher = profile.role === 'teacher' || profile.role === 'admin'

    if (isTeacher) {
      const { data: assignedTasks, error: tasksError } = await supabaseClient
        .from('tasks')
        .select('*, profiles!user_id(first_name, username)')
        .eq('assigned_by', userId)
        .order('created_at', { ascending: false })
      if (tasksError) return { data: null, error: tasksError }
      return {
        data: {
          ...profile,
          assigned_tasks_count: assignedTasks?.length || 0,
          assigned_tasks: (assignedTasks || []).map(t => ({
            ...t,
            student_name: t.profiles?.first_name || t.profiles?.username || '',
          })),
          tasks: [],
          totalPoints: 0,
          total_points: 0,
        },
        error: null,
      }
    }

    const [tasksRes, submissionsRes, pointsRes] = await Promise.all([
      supabaseClient.from('tasks').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabaseClient.from('submissions').select('*').eq('student_id', userId).order('submitted_at', { ascending: false }),
      supabaseClient.from('points_log').select('delta').eq('student_id', userId),
    ])
    if (tasksRes.error) return { data: null, error: tasksRes.error }
    if (submissionsRes.error) return { data: null, error: submissionsRes.error }

    const totalPoints = (pointsRes.data || []).reduce((sum, row) => sum + (row.delta || 0), 0)
    const submissionsByTaskId = {}
    ;(submissionsRes.data || []).forEach(s => { submissionsByTaskId[s.task_id] = s })
    const tasksWithStatus = (tasksRes.data || []).map(t => ({
      ...t,
      status: submissionsByTaskId[t.id]?.status || t.status || 'pending',
      submission_status: submissionsByTaskId[t.id]?.status || null,
    }))

    return {
      data: {
        ...profile,
        tasks: tasksWithStatus,
        submissions: submissionsRes.data || [],
        totalPoints,
        total_points: totalPoints,
      },
      error: null,
    }
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
    // Récupérer l'utilisateur connecté depuis localStorage (Django JWT — pas Supabase Auth)
    const localUser = JSON.parse(localStorage.getItem('quranreview_user') || 'null')
    if (!localUser?.username) return { data: [], error: null }

    // Résoudre l'UUID Supabase du prof via son username
    const { data: profileData, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('username', localUser.username)
      .maybeSingle()

    if (profileError || !profileData) return { data: [], error: profileError }

    const teacherId = profileData.id

    // Récupérer les étudiants des classes de ce prof
    const { data: classMembers, error: cmError } = await supabaseClient
      .from('class_members')
      .select('student_id, classes!inner(teacher_id)')
      .eq('classes.teacher_id', teacherId)

    if (cmError) {
      // Si la table n'existe pas encore, retourner tous les étudiants (fallback)
      console.warn('class_members query failed, falling back to all students:', cmError)
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('username', { ascending: true })
      return { data, error }
    }

    if (!classMembers || classMembers.length === 0) {
      return { data: [], error: null }
    }

    // Récupérer les profils des étudiants
    const studentIds = classMembers.map(cm => cm.student_id)
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('*')
      .in('id', studentIds)
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

export async function removeStudentFromClass(studentId, classId) {
  try {
    const { error } = await supabaseClient
      .from('class_members')
      .delete()
      .eq('student_id', studentId)
      .eq('class_id', classId)

    return { error }
  } catch (error) {
    return { error }
  }
}

export async function createClass(name) {
  try {
    const localUser = JSON.parse(localStorage.getItem('quranreview_user') || 'null')
    if (!localUser?.username) return { data: null, error: new Error('Non authentifié') }

    const { data: profile } = await supabaseClient
      .from('profiles').select('id').eq('username', localUser.username).maybeSingle()
    if (!profile) return { data: null, error: new Error('Profil non trouvé') }

    const { data, error } = await supabaseClient
      .from('classes')
      .insert({ name, teacher_id: profile.id })
      .select()
      .single()

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function createClassWithTeacher(name, teacherId) {
  try {
    const { data, error } = await supabaseClient
      .from('classes')
      .insert({ name, teacher_id: teacherId })
      .select()
      .single()

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function deleteClass(classId) {
  try {
    const { error } = await supabaseClient
      .from('classes')
      .delete()
      .eq('id', classId)

    return { error }
  } catch (error) {
    return { error }
  }
}

export async function getMyClasses() {
  try {
    const localUser = JSON.parse(localStorage.getItem('quranreview_user') || 'null')
    if (!localUser?.username) return { data: [], error: null }

    const { data: profile } = await supabaseClient
      .from('profiles').select('id').eq('username', localUser.username).maybeSingle()
    if (!profile) return { data: [], error: null }

    const { data, error } = await supabaseClient
      .from('classes')
      .select('*, class_members(student_id, profiles!student_id(id, username))')
      .eq('teacher_id', profile.id)
      .order('name', { ascending: true })

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function getClassStudents(classId) {
  try {
    // Étape 1 : récupérer les student_ids depuis class_members (accessible sans session Supabase)
    const { data: members, error: membersError } = await supabaseClient
      .from('class_members')
      .select('student_id')
      .eq('class_id', classId)

    if (membersError) return { data: null, error: membersError }
    if (!members || members.length === 0) return { data: [], error: null }

    const studentIds = members.map(m => m.student_id)

    // Étape 2 : récupérer les profils complets (nécessite une RLS SELECT policy sur profiles)
    const { data: profiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('*')
      .in('id', studentIds)

    if (!profilesError && profiles && profiles.length > 0) {
      return { data: profiles, error: null }
    }

    // Fallback : profiles bloqués par RLS — retourner les IDs avec username minimal
    // ⚠️ Ajouter dans Supabase Dashboard : CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
    return {
      data: studentIds.map(id => ({ id, username: id.substring(0, 8) + '…', first_name: '', last_name: '' })),
      error: null,
    }
  } catch (error) {
    return { data: null, error }
  }
}

export async function getAllStudentsNotInClass(classId) {
  try {
    // Récupérer les étudiants déjà dans cette classe
    const { data: members } = await supabaseClient
      .from('class_members')
      .select('student_id')
      .eq('class_id', classId)

    const memberIds = (members || []).map(m => m.student_id)

    // Récupérer tous les étudiants qui ne sont pas dans cette classe
    // ⚠️ Nécessite une RLS SELECT policy sur profiles pour fonctionner
    // CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
    let query = supabaseClient
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .order('username', { ascending: true })

    if (memberIds.length > 0) {
      query = query.not('id', 'in', `(${memberIds.join(',')})`)
    }

    const { data, error } = await query
    return { data: data || [], error }
  } catch (error) {
    return { data: [], error }
  }
}
