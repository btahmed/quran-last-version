// Service de gestion des tâches Supabase — QuranReview
import { supabaseClient } from './supabase-client.js';
import { apiCache } from '../core/apiCache.js';

export async function getMyTasks() {
    try {
        // Récupérer l'utilisateur depuis localStorage (Django JWT)
        const localUser = JSON.parse(localStorage.getItem('quranreview_user') || 'null');
        if (!localUser?.username) return { data: [], error: null };

        // Résoudre l'UUID Supabase via username
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('id')
            .eq('username', localUser.username)
            .maybeSingle();

        if (!profile) return { data: [], error: null };

        const { data, error } = await supabaseClient
            .from('tasks')
            .select('*')
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false });

        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
}

export async function deleteTasksByIds(ids) {
    try {
        const { data, error } = await supabaseClient.from('tasks').delete().in('id', ids);

        if (!error) apiCache.invalidate('tasks');
        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
}

export async function deleteTasksByStudentIds(studentIds) {
    try {
        const { data, error } = await supabaseClient
            .from('tasks')
            .delete()
            .in('user_id', studentIds);

        if (!error) apiCache.invalidate('tasks');
        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
}

export async function getStudentTasks(studentId) {
    try {
        const { data, error } = await supabaseClient
            .from('tasks')
            .select('*')
            .eq('user_id', studentId)
            .order('created_at', { ascending: false });

        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
}

export async function getAllTasks() {
    try {
        const { data, error } = await supabaseClient
            .from('tasks')
            .select('*, profiles!user_id(username)')
            .order('created_at', { ascending: false });

        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
}

export async function createTask(payload) {
    try {
        // Récupérer l'utilisateur depuis localStorage (Django JWT)
        const localUser = JSON.parse(localStorage.getItem('quranreview_user') || 'null');
        if (!localUser?.username) return { data: null, error: { message: 'Non authentifié' } };

        // Résoudre l'UUID Supabase du prof via username
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('id')
            .eq('username', localUser.username)
            .maybeSingle();

        if (!profile) return { data: null, error: { message: 'Profil non trouvé' } };

        // Extraire les champs valides de la table tasks (exclure assign_all, student_ids, task_type)
        const { assign_all, student_ids, task_type, ...rest } = payload;
        // Mapper task_type → type si l'appelant utilise l'ancien nom
        const taskFields = { ...rest, ...(task_type && !rest.type ? { type: task_type } : {}) };

        // Si user_id est déjà fourni, insérer directement une seule tâche
        if (taskFields.user_id) {
            const row = {
                title: taskFields.title || '',
                description: taskFields.description || '',
                type: taskFields.type || 'hifz',
                points: taskFields.points || 0,
                user_id: taskFields.user_id,
                assigned_by: profile.id,
            };
            // Ajouter due_date seulement si défini
            if (taskFields.due_date) row.due_date = taskFields.due_date;

            const { data, error } = await supabaseClient
                .from('tasks')
                .insert(row)
                .select()
                .single();
            return { data, error };
        }

        // Sinon, déterminer la liste des user_ids cibles
        let targetIds = [];
        if (assign_all) {
            // Tous les étudiants : récupérer depuis profiles
            const { data: students } = await supabaseClient
                .from('profiles')
                .select('id')
                .eq('role', 'student');
            targetIds = (students || []).map(s => s.id);
        } else {
            targetIds = student_ids || [];
        }

        if (!targetIds.length)
            return { data: null, error: { message: 'Aucun étudiant sélectionné' } };

        // Insérer une tâche par étudiant
        const rows = targetIds.map(userId => ({
            title: taskFields.title || '',
            description: taskFields.description || '',
            type: taskFields.type || 'hifz',
            points: taskFields.points || 0,
            due_date: taskFields.due_date || null,
            user_id: userId,
            assigned_by: profile.id,
        }));

        const { data, error } = await supabaseClient.from('tasks').insert(rows).select();

        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
}

export async function updateTask(id, payload) {
    try {
        const { data, error } = await supabaseClient
            .from('tasks')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (!error) apiCache.invalidate('tasks');
        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
}

export async function deleteTask(id) {
    try {
        const { data, error } = await supabaseClient.from('tasks').delete().eq('id', id);

        if (!error) apiCache.invalidate('tasks');
        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
}

// Notifie l'élève via push + in-app quand le prof lui assigne un devoir
export async function notifyStudentNewTask(studentId, taskTitle, taskType) {
    const TYPE_LABELS = { hifz: 'حفظ', tasmi: 'تسميع', muraja: 'مراجعة', tilawa: 'تلاوة' };
    const typeLabel = TYPE_LABELS[taskType] || taskType || 'مهمة';
    const notifTitle = '📚 واجب جديد';
    const notifBody = `${taskTitle} (${typeLabel})`;
    const notifUrl = '/hifz';

    // Notification in-app (centre de notifications)
    supabaseClient
        .from('notifications')
        .insert({
            user_id: studentId,
            type: 'new_task',
            title: notifTitle,
            body: notifBody,
            url: notifUrl,
        })
        .then(({ error }) => {
            if (error) console.warn('[NewTask] Notif in-app non sauvegardée:', error.message);
        });

    // Push notification (non bloquant — 404 = pas de subscription)
    try {
        const { error } = await supabaseClient.functions.invoke('send-push', {
            body: { user_id: studentId, title: notifTitle, body: notifBody, url: notifUrl },
        });
        if (error && error.context?.status !== 404) {
            console.warn('[NewTask] Push non envoyé:', error);
        }
    } catch (err) {
        console.warn('[NewTask] Push non envoyé:', err);
    }
}

// Notifie le prof via push quand l'élève complète un devoir hifz
export async function notifyTeacherHifzComplete(
    taskId,
    studentName,
    surahName,
    score,
    completedAyahs = [],
    fromAyah,
    toAyah
) {
    try {
        const { data: task } = await supabaseClient
            .from('tasks')
            .select('assigned_by, title')
            .eq('id', taskId)
            .maybeSingle();

        if (!task?.assigned_by) return;

        const ayahDetail = completedAyahs.length
            ? `الآيات ${completedAyahs.join('،')}`
            : fromAyah && toAyah
              ? `${fromAyah}-${toAyah}`
              : '';

        const notifTitle = '✅ أتم الطالب الحفظ';
        const notifBody = `${studentName} — ${surahName}${ayahDetail ? ' ' + ayahDetail : ''} — النقاط: ${score}`;

        // Sauvegarder la notification en base (in-app notification center)
        supabaseClient
            .from('notifications')
            .insert({
                user_id: task.assigned_by,
                type: 'hifz_complete',
                title: notifTitle,
                body: notifBody,
                url: '/eleves',
            })
            .then(({ error: dbErr }) => {
                if (dbErr) console.warn('[Notif] Erreur sauvegarde DB:', dbErr.message);
            });

        const { error } = await supabaseClient.functions.invoke('send-push', {
            body: {
                user_id: task.assigned_by,
                title: notifTitle,
                body: notifBody,
                url: '/eleves',
            },
        });
        if (error) {
            const status = error.context?.status;
            // 404 = prof sans subscription push (s'auto-résorbe au prochain login)
            console.warn(
                '[HifzComplete] Notification non envoyée (status',
                status ?? '?',
                '):',
                error.message
            );
        } else {
            console.log('[Push] ✅ Notification envoyée au prof (hifz complet)');
        }
    } catch (err) {
        console.warn('[HifzComplete] Notification non envoyée:', err);
    }
}
