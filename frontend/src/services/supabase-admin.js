// Service d'administration Supabase — QuranReview
import { supabaseClient } from './supabase-client.js';
import { createTeacher as createTeacherAccount, getAuthenticatedProfile } from './supabase-auth.js';

async function requireRole(allowedRoles) {
    const { data, error } = await getAuthenticatedProfile();
    if (error || !data) return { data: null, error: error || new Error('Non authentifié') };
    const effectiveRole = data.is_superuser ? 'admin' : data.role;
    if (!allowedRoles.includes(effectiveRole)) {
        return { data: null, error: new Error('Droits insuffisants') };
    }
    return { data, error: null };
}

export async function getAllUsers() {
    try {
        const { error: authError } = await requireRole(['admin']);
        if (authError) return { data: null, error: authError };
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .order('role', { ascending: true })
            .order('username', { ascending: true });

        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
}

export async function updateUser(userId, payload) {
    try {
        const { error: authError } = await requireRole(['admin']);
        if (authError) return { data: null, error: authError };
        const { data, error } = await supabaseClient
            .from('profiles')
            .update(payload)
            .eq('id', userId)
            .select()
            .single();

        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
}

export async function deleteUser(userId) {
    try {
        const { error: authError } = await requireRole(['admin']);
        if (authError) return { error: authError };
        // Supprime le profil (cascade vers tasks, submissions, points_log via FK ON DELETE CASCADE)
        // auth.users reste intact mais l'utilisateur n'a plus de profil actif
        const { error } = await supabaseClient.from('profiles').delete().eq('id', userId);
        return { error };
    } catch (error) {
        return { error };
    }
}

export async function createTeacher(email, password, username) {
    return createTeacherAccount(email, password, username);
}

export async function getStudentProgress(userId) {
    try {
        const { data: currentUser, error: authError } = await requireRole([
            'student',
            'teacher',
            'admin',
        ]);
        if (authError) return { data: null, error: authError };
        if (
            currentUser.role === 'student' &&
            !currentUser.is_superuser &&
            currentUser.id !== userId
        ) {
            return { data: null, error: new Error('Accès interdit') };
        }
        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        if (profileError || !profile) return { data: null, error: profileError };

        const isTeacher = profile.role === 'teacher' || profile.role === 'admin';

        if (isTeacher) {
            const { data: assignedTasks, error: tasksError } = await supabaseClient
                .from('tasks')
                .select('*, profiles!user_id(first_name, username)')
                .eq('assigned_by', userId)
                .order('created_at', { ascending: false });
            if (tasksError) return { data: null, error: tasksError };
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
            };
        }

        // 3 requêtes parallèles — submissions : seulement les champs nécessaires (pas audio_url)
        const [tasksRes, submissionsRes, pointsRes] = await Promise.all([
            supabaseClient
                .from('tasks')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false }),
            supabaseClient
                .from('submissions')
                .select('task_id, status, awarded_points, admin_feedback')
                .eq('student_id', userId)
                .order('submitted_at', { ascending: false }),
            supabaseClient.from('points_log').select('delta').eq('student_id', userId),
        ]);
        if (tasksRes.error) return { data: null, error: tasksRes.error };
        if (submissionsRes.error) return { data: null, error: submissionsRes.error };

        const totalPoints = (pointsRes.data || []).reduce((sum, row) => sum + (row.delta || 0), 0);
        const submissionsByTaskId = {};
        (submissionsRes.data || []).forEach(s => {
            submissionsByTaskId[s.task_id] = s;
        });
        const tasksWithStatus = (tasksRes.data || []).map(t => ({
            ...t,
            status: submissionsByTaskId[t.id]?.status || t.status || 'pending',
            submission_status: submissionsByTaskId[t.id]?.status || null,
            awarded_points: submissionsByTaskId[t.id]?.awarded_points ?? null,
            admin_feedback: submissionsByTaskId[t.id]?.admin_feedback ?? null,
        }));

        return {
            data: {
                ...profile,
                tasks: tasksWithStatus,
                submissions: submissionsRes.data || [],
                totalPoints,
                total_points: totalPoints,
            },
            error: null,
        };
    } catch (error) {
        return { data: null, error };
    }
}

export async function getAdminOverview() {
    try {
        const { error: authError } = await requireRole(['admin']);
        if (authError) return { data: null, error: authError };
        const [usersRes, tasksRes, submissionsRes] = await Promise.all([
            supabaseClient.from('profiles').select('id, role'),
            supabaseClient.from('tasks').select('id', { count: 'exact', head: true }),
            supabaseClient.from('submissions').select('id, status'),
        ]);

        const users = usersRes.data || [];
        const submissions = submissionsRes.data || [];

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
        };
    } catch (error) {
        return { data: null, error };
    }
}

export async function getTeacherStatsAndTasks() {
    try {
        const { error: authError } = await requireRole(['admin']);
        if (authError) return { teacherStats: [], recentTasks: [], error: authError };
        const [teachersRes, tasksRes] = await Promise.all([
            supabaseClient
                .from('profiles')
                .select('id, username, first_name, last_name')
                .eq('role', 'teacher'),
            supabaseClient
                .from('tasks')
                .select(
                    'id, title, status, points, assigned_by, user_id, created_at, profiles!user_id(username, first_name)'
                )
                .order('created_at', { ascending: false })
                .limit(50),
        ]);

        const teachers = teachersRes.data || [];
        const tasks = tasksRes.data || [];

        const teacherMap = {};
        teachers.forEach(t => {
            teacherMap[t.id] = { ...t, assigned_tasks: 0, pending_submissions: 0 };
        });
        tasks.forEach(task => {
            if (task.assigned_by && teacherMap[task.assigned_by]) {
                teacherMap[task.assigned_by].assigned_tasks++;
                if (task.status === 'submitted') teacherMap[task.assigned_by].pending_submissions++;
            }
        });

        const teacherStats = Object.values(teacherMap);
        const recentTasks = tasks.map(t => ({
            ...t,
            teacher:
                t.assigned_by && teacherMap[t.assigned_by]
                    ? { username: teacherMap[t.assigned_by].username }
                    : null,
            student: t.profiles
                ? { first_name: t.profiles.first_name, username: t.profiles.username }
                : null,
        }));

        return { teacherStats, recentTasks };
    } catch {
        return { teacherStats: [], recentTasks: [] };
    }
}

export async function getClasses() {
    try {
        const { error: authError } = await requireRole(['teacher', 'admin']);
        if (authError) return { data: null, error: authError };
        const { data, error } = await supabaseClient
            .from('classes')
            .select('*, profiles!teacher_id(id, username), class_members(count)')
            .order('name', { ascending: true });

        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
}

export async function getMyStudents() {
    try {
        const { data: profileData, error: profileError } = await requireRole(['teacher', 'admin']);
        if (profileError || !profileData) return { data: [], error: profileError };
        const teacherId = profileData.id;

        // Récupérer les étudiants des classes de ce prof
        const { data: classMembers, error: cmError } = await supabaseClient
            .from('class_members')
            .select('student_id, classes!inner(teacher_id)')
            .eq('classes.teacher_id', teacherId);

        if (cmError) return { data: null, error: cmError };

        if (!classMembers || classMembers.length === 0) {
            return { data: [], error: null };
        }

        // Récupérer les profils des étudiants
        const studentIds = classMembers.map(cm => cm.student_id);
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .in('id', studentIds)
            .order('username', { ascending: true });

        if (error || !data) return { data, error };

        // Enrichir avec total_points et submissions_count en 2 requêtes batch
        const [pointsRes, subsRes] = await Promise.all([
            supabaseClient
                .from('points_log')
                .select('student_id, delta')
                .in('student_id', studentIds),
            supabaseClient
                .from('submissions')
                .select('student_id')
                .in('student_id', studentIds)
                .eq('status', 'approved'),
        ]);
        const pointsByStudent = {};
        (pointsRes.data || []).forEach(p => {
            pointsByStudent[p.student_id] = (pointsByStudent[p.student_id] || 0) + (p.delta || 0);
        });
        const subsByStudent = {};
        (subsRes.data || []).forEach(s => {
            subsByStudent[s.student_id] = (subsByStudent[s.student_id] || 0) + 1;
        });
        data.forEach(s => {
            s.total_points = pointsByStudent[s.id] || 0;
            s.submissions_count = subsByStudent[s.id] || 0;
        });

        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
}

export async function assignStudentToClass(studentId, classId) {
    try {
        const { error: authError } = await requireRole(['teacher', 'admin']);
        if (authError) return { data: null, error: authError };
        const { data, error } = await supabaseClient
            .from('class_members')
            .insert({ student_id: studentId, class_id: classId })
            .select()
            .single();

        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
}

export async function removeStudentFromClass(studentId, classId) {
    try {
        const { error: authError } = await requireRole(['teacher', 'admin']);
        if (authError) return { error: authError };
        const { error } = await supabaseClient
            .from('class_members')
            .delete()
            .eq('student_id', studentId)
            .eq('class_id', classId);

        return { error };
    } catch (error) {
        return { error };
    }
}

export async function createClass(name) {
    try {
        const { data: profile, error: profileError } = await requireRole(['teacher']);
        if (profileError || !profile) return { data: null, error: profileError };

        const { data, error } = await supabaseClient
            .from('classes')
            .insert({ name, teacher_id: profile.id })
            .select()
            .single();

        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
}

export async function createClassWithTeacher(name, teacherId) {
    try {
        const { error: authError } = await requireRole(['admin']);
        if (authError) return { data: null, error: authError };
        const { data, error } = await supabaseClient
            .from('classes')
            .insert({ name, teacher_id: teacherId })
            .select()
            .single();

        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
}

export async function deleteClass(classId) {
    try {
        const { error: authError } = await requireRole(['teacher', 'admin']);
        if (authError) return { error: authError };
        const { error } = await supabaseClient.from('classes').delete().eq('id', classId);

        return { error };
    } catch (error) {
        return { error };
    }
}

export async function getMyClasses() {
    try {
        const { data: profile, error: profileError } = await requireRole(['teacher']);
        if (profileError || !profile) return { data: [], error: profileError };

        const { data, error } = await supabaseClient
            .from('classes')
            .select('*, class_members(student_id, profiles!student_id(id, username))')
            .eq('teacher_id', profile.id)
            .order('name', { ascending: true });

        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
}

export async function getClassStudents(classId) {
    try {
        // RLS limite cette lecture au membre, au professeur de la classe ou à l'admin.
        const { data: members, error: membersError } = await supabaseClient
            .from('class_members')
            .select('student_id')
            .eq('class_id', classId);

        if (membersError) return { data: null, error: membersError };
        if (!members || members.length === 0) return { data: [], error: null };

        const studentIds = members.map(m => m.student_id);

        // Étape 2 : récupérer les profils complets (nécessite une RLS SELECT policy sur profiles)
        const { data: profiles, error: profilesError } = await supabaseClient
            .from('profiles')
            .select('*')
            .in('id', studentIds);

        return { data: profiles || [], error: profilesError };
    } catch (error) {
        return { data: null, error };
    }
}

export async function getAllStudentsNotInClass(classId) {
    try {
        const { error: authError } = await requireRole(['teacher', 'admin']);
        if (authError) return { data: [], error: authError };
        // Récupérer les étudiants déjà dans cette classe
        const { data: members } = await supabaseClient
            .from('class_members')
            .select('student_id')
            .eq('class_id', classId);

        const memberIds = (members || []).map(m => m.student_id);

        // Récupérer tous les étudiants qui ne sont pas dans cette classe
        // La RLS limite cette liste aux étudiants autorisés par le rôle courant.
        let query = supabaseClient
            .from('profiles')
            .select('*')
            .eq('role', 'student')
            .order('username', { ascending: true });

        if (memberIds.length > 0) {
            query = query.not('id', 'in', `(${memberIds.join(',')})`);
        }

        const { data, error } = await query;
        return { data: data || [], error };
    } catch (error) {
        return { data: [], error };
    }
}
