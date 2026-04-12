/**
 * APP.JS - Migration Progressive vers Supabase
 *
 * Chargé comme <script type="module"> → s'exécute avant DOMContentLoaded.
 * Le top-level await retarde DOMContentLoaded jusqu'à ce que tous les
 * intercepteurs soient en place. Quand script.js appelle this.initAuth()
 * dans son DOMContentLoaded, il utilise déjà notre version Supabase.
 *
 * Fonctions interceptées :
 * - QuranReview.performLogin        → auth.signIn()
 * - QuranReview.logout              → auth.signOut()
 * - QuranReview.initAuth            → auth.getSession()
 * - QuranReview.fetchMe             → auth.getCurrentUser()
 * - QuranReview.loadTasksFromApi    → tasks.getMyTasks()
 * - QuranReview.loadStudentDashboard → tasks + submissions + points
 * - QuranReview.loadTeacherDashboard → classes + submissions + tasks
 * - QuranReview.loadAdminDashboard  → users + tasks
 */

// ─── Import des modules Supabase ─────────────────────────────────────────────
// Top-level await : retarde DOMContentLoaded jusqu'à résolution complète.
// window.supabaseClient est déjà défini par supabase-client.js (script sync).
const [authModule, tasksModule, submissionsModule, leaderboardModule, adminModule] =
    await Promise.all([
        import('./auth.js'),
        import('./tasks.js'),
        import('./submissions.js'),
        import('./leaderboard.js'),
        import('./admin.js'),
    ]);

// ─── Vérification de QuranReview ─────────────────────────────────────────────
if (typeof QuranReview === 'undefined') {
    console.error('[APP.JS] ❌ QuranReview non défini — script.js doit être chargé avant app.js');
    throw new Error('QuranReview manquant');
}

console.log('[APP.JS] 🔄 Migration progressive Supabase activée');

// ═══════════════════════════════════════════════════════════════════════════════
// INTERCEPTER : performLogin
// ═══════════════════════════════════════════════════════════════════════════════
QuranReview.performLogin = async function(username, password) {
    console.log('[APP.JS] 🔐 Interception performLogin → Supabase signIn');

    try {
        const { data, error } = await authModule.signIn(username, password);

        if (error) {
            console.error('[APP.JS] ❌ Erreur signIn:', error.message);
            throw new Error(error.message || 'فشل تسجيل الدخول');
        }

        if (!data?.session) {
            throw new Error('لم يتم استلام جلسة صالحة');
        }

        console.log('[APP.JS] ✅ Connexion Supabase réussie');

        // Récupérer le profil utilisateur
        const { data: profile, error: profileError } = await authModule.getCurrentUser();
        if (profileError) {
            console.warn('[APP.JS] ⚠️ Profil non récupéré:', profileError.message);
        }

        const user = profile || {
            id: data.user.id,
            username: data.user.user_metadata?.username || username,
            email: data.user.email,
            role: data.user.user_metadata?.role || 'student',
        };

        QuranReview.state.user = user;
        localStorage.setItem('quranreview_user', JSON.stringify(user));
        localStorage.setItem(QuranReview.config.apiTokenKey, data.session.access_token);
        localStorage.setItem('quranreview_refresh_token', data.session.refresh_token);

        QuranReview.hideAuthModal();
        QuranReview.updateAuthUI(true);
        await QuranReview.loadTasksFromApi();
        QuranReview.showNotification('تم تسجيل الدخول بنجاح', 'success');

    } catch (error) {
        console.error('[APP.JS] ❌ Erreur performLogin:', error);
        throw error;
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// INTERCEPTER : logout
// ═══════════════════════════════════════════════════════════════════════════════
QuranReview.logout = async function() {
    console.log('[APP.JS] 🚪 Interception logout → Supabase signOut');

    try {
        const { error } = await authModule.signOut();
        if (error) console.warn('[APP.JS] ⚠️ Erreur signOut:', error.message);
    } catch (e) {
        console.warn('[APP.JS] ⚠️ Exception signOut:', e);
    }

    localStorage.removeItem(QuranReview.config.apiTokenKey);
    localStorage.removeItem('quranreview_refresh_token');
    localStorage.removeItem('quranreview_user');

    QuranReview.state.user = null;
    QuranReview.updateAuthUI(false);
    QuranReview.navigateTo('home');
    QuranReview.showNotification('تم تسجيل الخروج بنجاح', 'info');
};

// ═══════════════════════════════════════════════════════════════════════════════
// INTERCEPTER : initAuth — appelé par script.js dans son DOMContentLoaded
// ═══════════════════════════════════════════════════════════════════════════════
QuranReview.initAuth = async function() {
    console.log('[APP.JS] 🔑 Interception initAuth → Supabase getSession');

    try {
        const { data, error } = await authModule.getSession();

        if (error) {
            console.warn('[APP.JS] ⚠️ Erreur getSession:', error.message);
            QuranReview.updateAuthUI(false);
            return;
        }

        if (data?.session) {
            console.log('[APP.JS] ✅ Session Supabase active');

            const { data: profile } = await authModule.getCurrentUser();

            const user = profile || {
                id: data.session.user.id,
                username: data.session.user.user_metadata?.username || data.session.user.email,
                email: data.session.user.email,
                role: data.session.user.user_metadata?.role || 'student',
            };

            QuranReview.state.user = user;
            localStorage.setItem('quranreview_user', JSON.stringify(user));
            localStorage.setItem(QuranReview.config.apiTokenKey, data.session.access_token);

            QuranReview.updateAuthUI(true);
            await QuranReview.loadTasksFromApi();
        } else {
            console.log('[APP.JS] ℹ️ Pas de session active');
            QuranReview.updateAuthUI(false);
        }
    } catch (e) {
        console.error('[APP.JS] ❌ Erreur initAuth:', e);
        QuranReview.updateAuthUI(false);
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// INTERCEPTER : fetchMe
// ═══════════════════════════════════════════════════════════════════════════════
QuranReview.fetchMe = async function() {
    console.log('[APP.JS] 👤 Interception fetchMe → Supabase getCurrentUser');

    try {
        const { data, error } = await authModule.getCurrentUser();

        if (error) {
            console.warn('[APP.JS] ⚠️ Erreur getCurrentUser:', error.message);
            return;
        }

        if (data) {
            QuranReview.state.user = data;
            localStorage.setItem('quranreview_user', JSON.stringify(data));
            QuranReview.updateAuthUI(true);
        }
    } catch (e) {
        console.error('[APP.JS] ❌ Exception fetchMe:', e);
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// INTERCEPTER : loadTasksFromApi
// ═══════════════════════════════════════════════════════════════════════════════
QuranReview.loadTasksFromApi = async function() {
    console.log('[APP.JS] 📋 Interception loadTasksFromApi → Supabase getMyTasks');

    try {
        const { data, error } = await tasksModule.getMyTasks();

        if (error) {
            console.error('[APP.JS] ❌ Erreur getMyTasks:', error.message);
            return;
        }

        if (Array.isArray(data)) {
            console.log(`[APP.JS] ✅ ${data.length} tâches chargées`);
            QuranReview.state.tasks = data;
            localStorage.setItem(QuranReview.config.tasksKey, JSON.stringify(data));
        }
    } catch (e) {
        console.error('[APP.JS] ❌ Exception loadTasksFromApi:', e);
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// INTERCEPTER : loadStudentDashboard
// ═══════════════════════════════════════════════════════════════════════════════
QuranReview.loadStudentDashboard = async function() {
    console.log('[APP.JS] 📊 Interception loadStudentDashboard → Supabase');

    const [tasksResult, submissionsResult, pointsResult] = await Promise.all([
        tasksModule.getMyTasks(),
        submissionsModule.getMySubmissions(),
        leaderboardModule.getMyPoints(),
    ]);

    if (tasksResult.data)          QuranReview.state.tasks       = tasksResult.data;
    if (submissionsResult.data)    QuranReview.state.submissions  = submissionsResult.data;
    if (pointsResult.data !== null) QuranReview.state.points = pointsResult.data?.total ?? 0;

    return {
        tasks:       tasksResult.data       || [],
        submissions: submissionsResult.data  || [],
        points:      pointsResult.data?.total ?? 0,
    };
};

// ═══════════════════════════════════════════════════════════════════════════════
// INTERCEPTER : loadTeacherDashboard
// ═══════════════════════════════════════════════════════════════════════════════
QuranReview.loadTeacherDashboard = async function() {
    console.log('[APP.JS] 🎓 Interception loadTeacherDashboard → Supabase');

    const [classesResult, submissionsResult, tasksResult] = await Promise.all([
        adminModule.getClasses(),
        submissionsModule.getPendingSubmissions(),
        tasksModule.getAllTasks(),
    ]);

    if (classesResult.data)      QuranReview.state.classes            = classesResult.data;
    if (submissionsResult.data)  QuranReview.state.pendingSubmissions  = submissionsResult.data;
    if (tasksResult.data)        QuranReview.state.allTasks            = tasksResult.data;

    return {
        classes:            classesResult.data      || [],
        pendingSubmissions:  submissionsResult.data  || [],
        tasks:              tasksResult.data         || [],
    };
};

// ═══════════════════════════════════════════════════════════════════════════════
// INTERCEPTER : loadAdminDashboard
// ═══════════════════════════════════════════════════════════════════════════════
QuranReview.loadAdminDashboard = async function() {
    console.log('[APP.JS] 👑 Interception loadAdminDashboard → Supabase');

    const [usersResult, tasksResult] = await Promise.all([
        adminModule.getAllUsers(),
        tasksModule.getAllTasks(),
    ]);

    if (usersResult.data)  QuranReview.state.users    = usersResult.data;
    if (tasksResult.data)  QuranReview.state.allTasks = tasksResult.data;

    return {
        users: usersResult.data || [],
        tasks: tasksResult.data || [],
    };
};

// ═══════════════════════════════════════════════════════════════════════════════
// INTERCEPTER : handleRegister — POST /api/auth/register/
// ═══════════════════════════════════════════════════════════════════════════════
QuranReview.handleRegister = async function(event) {
    event.preventDefault();
    console.log('[APP.JS] 📝 Interception handleRegister → Supabase createUser');

    const username = document.getElementById('reg-username')?.value.trim();
    const password = document.getElementById('reg-password')?.value;
    const firstName = document.getElementById('reg-firstname')?.value.trim() || '';
    const lastName = document.getElementById('reg-lastname')?.value.trim() || '';
    const errorEl = document.getElementById('reg-error');
    const submitBtn = document.getElementById('reg-submit-btn');

    if (!username || !password) {
        if (errorEl) {
            errorEl.textContent = 'الرجاء إدخال اسم المستخدم وكلمة المرور';
            errorEl.classList.remove('hidden');
        }
        return;
    }

    errorEl?.classList.add('hidden');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>⏳</span> جاري التسجيل...';
    }

    try {
        const { data, error } = await authModule.createUser(null, password, username, 'student');

        if (error) {
            throw new Error(error.message || 'خطأ في التسجيل');
        }

        // Auto-login après inscription
        await QuranReview.performLogin(username, password);

    } catch (error) {
        console.error('[APP.JS] ❌ Erreur handleRegister:', error);
        if (errorEl) {
            errorEl.textContent = error.message;
            errorEl.classList.remove('hidden');
        }
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>✨</span> إنشاء الحساب';
        }
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// INTERCEPTER : loadMyStudents — GET /api/my-students/
// ═══════════════════════════════════════════════════════════════════════════════
QuranReview.loadMyStudents = async function() {
    console.log('[APP.JS] 👨‍🎓 Interception loadMyStudents → Supabase getClasses');

    try {
        const { data, error } = await adminModule.getClasses();

        if (error) {
            console.error('[APP.JS] ❌ Erreur getClasses:', error.message);
            return [];
        }

        // TODO: Filtrer par teacher_id si nécessaire
        return data || [];
    } catch (e) {
        console.error('[APP.JS] ❌ Exception loadMyStudents:', e);
        return [];
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// INTERCEPTER : loadStudentProgress — GET /api/students/:id/progress/
// ═══════════════════════════════════════════════════════════════════════════════
QuranReview.loadStudentProgress = async function(studentId) {
    console.log('[APP.JS] 📈 Interception loadStudentProgress → Supabase getStudentProgress');

    try {
        const { data, error } = await adminModule.getStudentProgress(studentId);

        if (error) {
            console.error('[APP.JS] ❌ Erreur getStudentProgress:', error.message);
            return null;
        }

        return data;
    } catch (e) {
        console.error('[APP.JS] ❌ Exception loadStudentProgress:', e);
        return null;
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// INTERCEPTER : handleDeleteAllTasks — DELETE /api/admin/tasks/delete-all/
// ═══════════════════════════════════════════════════════════════════════════════
QuranReview.handleDeleteAllTasks = async function() {
    if (!confirm('⚠️ تحذير خطير!\nهل أنت متأكد تماماً أنك تريد حذف جميع المهام؟\nهذا الإجراء سيحذف كل المهام وكل التسليمات المرتبطة بها ولا يمكن التراجع عنه.')) {
        return;
    }

    console.log('[APP.JS] 🗑️ Interception handleDeleteAllTasks → Supabase deleteAllTasks');

    try {
        const { error } = await tasksModule.deleteAllTasks();

        if (error) {
            throw new Error(error.message || 'خطأ في حذف المهام');
        }

        QuranReview.showNotification('تم حذف جميع المهام بنجاح', 'success');
        QuranReview.loadTeacherDashboard();
    } catch (error) {
        console.error('[APP.JS] ❌ Erreur handleDeleteAllTasks:', error);
        QuranReview.showNotification(error.message, 'error');
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// INTERCEPTER : handleCreateTask — POST /api/tasks/create/
// ═══════════════════════════════════════════════════════════════════════════════
QuranReview.handleCreateTask = async function(event) {
    event.preventDefault();
    console.log('[APP.JS] ➕ Interception handleCreateTask → Supabase createTask');

    const assignMode = document.querySelector('input[name="assign-mode"]:checked')?.value || 'all';
    const studentIds = [];
    if (assignMode === 'select') {
        document.querySelectorAll('input[name="student-ids"]:checked').forEach(cb => {
            studentIds.push(cb.value);
        });
        if (!studentIds.length) {
            QuranReview.showNotification('يرجى اختيار طالب واحد على الأقل', 'error');
            return;
        }
    }

    const payload = {
        title: document.getElementById('task-title')?.value.trim(),
        description: document.getElementById('task-description')?.value.trim(),
        type: document.getElementById('task-type')?.value,
        points: parseInt(document.getElementById('task-points')?.value) || 0,
        due_date: document.getElementById('task-due-date')?.value || null,
        // TODO: Gérer assign_all et student_ids selon la structure Supabase
    };

    try {
        // Si assign_all, créer une tâche pour chaque étudiant ou utiliser une logique spécifique
        if (assignMode === 'all') {
            // TODO: Récupérer tous les étudiants et créer des tâches
            const { data, error } = await tasksModule.createTask(payload);
            if (error) throw new Error(error.message || 'خطأ في إنشاء المهمة');
        } else {
            // Créer une tâche pour chaque étudiant sélectionné
            for (const studentId of studentIds) {
                const { error } = await tasksModule.createTask({ ...payload, user_id: studentId });
                if (error) throw new Error(error.message || 'خطأ في إنشاء المهمة');
            }
        }

        QuranReview.showNotification('تم إنشاء المهمة بنجاح!', 'success');
        document.getElementById('teacher-create-task-form')?.reset();
        document.getElementById('student-select-container')?.classList.add('hidden');
        QuranReview.switchTeacherTab?.('pending');
        QuranReview.loadTeacherDashboard();
    } catch (error) {
        console.error('[APP.JS] ❌ Erreur handleCreateTask:', error);
        QuranReview.showNotification(error.message, 'error');
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// INTERCEPTER : approveSubmission — POST /api/submissions/:id/approve/
// ═══════════════════════════════════════════════════════════════════════════════
QuranReview.approveSubmission = async function(submissionId) {
    console.log('[APP.JS] ✅ Interception approveSubmission → Supabase approveSubmission');

    try {
        // Récupérer les points de la tâche associée via la soumission
        let points = 10;
        const { data: sub } = await window.supabaseClient
            .from('submissions').select('task_id').eq('id', submissionId).single();
        if (sub?.task_id) {
            const { data: task } = await window.supabaseClient
                .from('tasks').select('points').eq('id', sub.task_id).single();
            if (task?.points) points = task.points;
        }

        const { error } = await submissionsModule.approveSubmission(submissionId, points, '');

        if (error) {
            throw new Error(error.message || 'فشل القبول');
        }

        QuranReview.showNotification('تم قبول التسليم!', 'success');
        QuranReview.loadTeacherDashboard();
    } catch (error) {
        console.error('[APP.JS] ❌ Erreur approveSubmission:', error);
        QuranReview.showNotification(error.message, 'error');
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// INTERCEPTER : rejectSubmission — POST /api/submissions/:id/reject/
// ═══════════════════════════════════════════════════════════════════════════════
QuranReview.rejectSubmission = async function(submissionId, feedback) {
    console.log('[APP.JS] ❌ Interception rejectSubmission → Supabase rejectSubmission');

    try {
        const { error } = await submissionsModule.rejectSubmission(submissionId, feedback || '');

        if (error) {
            throw new Error(error.message || 'فشل الرفض');
        }

        QuranReview.showNotification('تم رفض التسليم', 'success');
        QuranReview.loadTeacherDashboard();
    } catch (error) {
        console.error('[APP.JS] ❌ Erreur rejectSubmission:', error);
        QuranReview.showNotification(error.message, 'error');
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// INTERCEPTER : loadAdminUsersList — GET /api/admin/users/
// ═══════════════════════════════════════════════════════════════════════════════
QuranReview.loadAdminUsersList = async function() {
    console.log('[APP.JS] 👥 Interception loadAdminUsersList → Supabase getAllUsers');

    try {
        const { data, error } = await adminModule.getAllUsers();

        if (error) {
            throw new Error(error.message || 'فشل تحميل قائمة المستخدمين');
        }

        QuranReview.renderAdminUsersList(data || []);
    } catch (error) {
        console.error('[APP.JS] ❌ Erreur loadAdminUsersList:', error);
        const usersListEl = document.getElementById('admin-users-list');
        if (usersListEl) {
            usersListEl.innerHTML = '<p class="empty-state">فشل تحميل القائمة</p>';
        }
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// INTERCEPTER : handleUpdateUser — PUT /api/admin/users/:id/update/
// ═══════════════════════════════════════════════════════════════════════════════
QuranReview.handleUpdateUser = async function(event) {
    event.preventDefault();
    console.log('[APP.JS] ✏️ Interception handleUpdateUser → Supabase updateUser');

    const userId = document.getElementById('edit-user-id')?.value;
    const firstName = document.getElementById('edit-first-name')?.value.trim();
    const lastName = document.getElementById('edit-last-name')?.value.trim();
    const role = document.getElementById('edit-role')?.value;
    const isSuperuser = document.getElementById('edit-is-superuser')?.checked;

    const errorEl = document.getElementById('user-edit-error');
    const successEl = document.getElementById('user-edit-success');

    errorEl?.classList.add('hidden');
    successEl?.classList.add('hidden');

    try {
        const { data, error } = await adminModule.updateUser(userId, {
            first_name: firstName,
            last_name: lastName,
            role: role,
            // Note: is_superuser peut nécessiter une Edge Function
        });

        if (error) {
            throw new Error(error.message || 'خطأ في تحديث المستخدم');
        }

        if (successEl) {
            successEl.textContent = `✅ تم تحديث بيانات المستخدم بنجاح`;
            successEl.classList.remove('hidden');
        }

        setTimeout(() => {
            QuranReview.closeUserEditModal();
            QuranReview.loadAdminUsersList();
        }, 2000);

        QuranReview.showNotification('تم تحديث بيانات المستخدم بنجاح', 'success');
    } catch (error) {
        console.error('[APP.JS] ❌ Erreur handleUpdateUser:', error);
        if (errorEl) {
            errorEl.textContent = error.message;
            errorEl.classList.remove('hidden');
        }
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// INTERCEPTER : deleteUser — DELETE /api/admin/users/:id/delete/
// ═══════════════════════════════════════════════════════════════════════════════
QuranReview.deleteUser = async function(userId, username) {
    if (!confirm(`هل أنت متأكد من حذف المستخدم "${username}"؟\nهذا الإجراء لا يمكن التراجع عنه.`)) {
        return;
    }

    console.log('[APP.JS] 🗑️ Interception deleteUser → Supabase deleteUser');

    try {
        const { error } = await adminModule.deleteUser(userId);

        if (error) {
            throw new Error(error.message || 'خطأ في حذف المستخدم');
        }

        QuranReview.showNotification(`تم حذف "${username}" بنجاح`, 'success');
        QuranReview.loadAdminUsersList();
    } catch (error) {
        console.error('[APP.JS] ❌ Erreur deleteUser:', error);
        QuranReview.showNotification(error.message, 'error');
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// INTERCEPTER : handleCreateTeacher — POST /api/admin/create-teacher/
// ═══════════════════════════════════════════════════════════════════════════════
QuranReview.handleCreateTeacher = async function(event) {
    event.preventDefault();
    console.log('[APP.JS] 👨‍🏫 Interception handleCreateTeacher → Supabase createTeacher');

    const username = document.getElementById('teacher-new-username')?.value.trim();
    const firstName = document.getElementById('teacher-new-firstname')?.value.trim();
    const lastName = document.getElementById('teacher-new-lastname')?.value.trim();
    const password = document.getElementById('teacher-new-password')?.value;
    const errorEl = document.getElementById('admin-create-error');
    const successEl = document.getElementById('admin-create-success');

    errorEl?.classList.add('hidden');
    successEl?.classList.add('hidden');

    try {
        const { data, error } = await adminModule.createTeacher(null, password, username);

        if (error) {
            throw new Error(error.message || 'خطأ في إنشاء الحساب');
        }

        if (successEl) {
            successEl.textContent = `✅ تم إنشاء حساب الأستاذ "${username}" بنجاح`;
            successEl.classList.remove('hidden');
        }
        document.getElementById('admin-create-teacher-form')?.reset();
        QuranReview.showNotification('تم إنشاء حساب الأستاذ بنجاح', 'success');
        QuranReview.loadAdminUsersList();
    } catch (error) {
        console.error('[APP.JS] ❌ Erreur handleCreateTeacher:', error);
        if (errorEl) {
            errorEl.textContent = error.message;
            errorEl.classList.remove('hidden');
        }
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// INTERCEPTER : handlePromoteTeacher — POST /api/admin/create-teacher/ (promote)
// ═══════════════════════════════════════════════════════════════════════════════
QuranReview.handlePromoteTeacher = async function(event) {
    event.preventDefault();
    console.log('[APP.JS] ⬆️ Interception handlePromoteTeacher → Supabase updateUser');

    const username = document.getElementById('promote-username')?.value.trim();
    const errorEl = document.getElementById('admin-promote-error');
    const successEl = document.getElementById('admin-promote-success');

    errorEl?.classList.add('hidden');
    successEl?.classList.add('hidden');

    try {
        // TODO: Trouver l'utilisateur par username puis mettre à jour son rôle
        // Pour l'instant, on utilise updateUser avec le username comme ID (à adapter)
        const { data: users } = await adminModule.getAllUsers();
        const user = users?.find(u => u.username === username);
        
        if (!user) {
            throw new Error('المستخدم غير موجود');
        }

        const { error } = await adminModule.updateUser(user.id, { role: 'teacher' });

        if (error) {
            throw new Error(error.message || 'خطأ في الترقية');
        }

        if (successEl) {
            successEl.textContent = `✅ تم ترقية "${username}" إلى أستاذ بنجاح`;
            successEl.classList.remove('hidden');
        }
        document.getElementById('admin-promote-form')?.reset();
        QuranReview.showNotification('تم ترقية المستخدم بنجاح', 'success');
        QuranReview.loadAdminUsersList();
    } catch (error) {
        console.error('[APP.JS] ❌ Erreur handlePromoteTeacher:', error);
        if (errorEl) {
            errorEl.textContent = error.message;
            errorEl.classList.remove('hidden');
        }
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// INTERCEPTER : submitRecording — POST /api/submissions/
// ═══════════════════════════════════════════════════════════════════════════════
QuranReview.submitRecording = async function() {
    console.log('[APP.JS] 🎤 Interception submitRecording → Supabase uploadAudio + createSubmission');

    if (!QuranReview._recordBlob || !QuranReview._recordTaskId) {
        console.error('[APP.JS] ❌ Missing blob or task ID');
        return;
    }

    try {
        document.getElementById('recording-submit-btn').disabled = true;

        // 1. Upload audio to Supabase Storage
        const { data: uploadData, error: uploadError } = await submissionsModule.uploadAudio(
            QuranReview._recordTaskId,
            QuranReview._recordBlob
        );

        if (uploadError) {
            throw new Error(uploadError.message || 'خطأ في رفع الملف');
        }

        // 2. Create submission record
        const { error: submitError } = await submissionsModule.createSubmission(
            QuranReview._recordTaskId,
            uploadData.url
        );

        if (submitError) {
            throw new Error(submitError.message || 'خطأ في الإرسال');
        }

        QuranReview.showNotification('تم إرسال التسجيل بنجاح!', 'success');
        const modal = document.getElementById('audio-record-modal');
        modal?.classList.remove('active');
        modal?.classList.add('hidden');
        QuranReview._recordBlob = null;
        QuranReview.loadStudentDashboard();
    } catch (error) {
        console.error('[APP.JS] ❌ Erreur submitRecording:', error);
        QuranReview.showNotification(error.message, 'error');
    } finally {
        document.getElementById('recording-submit-btn').disabled = false;
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// INTERCEPTER : loadLeaderboard — GET /api/leaderboard/
// ═══════════════════════════════════════════════════════════════════════════════
QuranReview.loadLeaderboard = async function() {
    console.log('[APP.JS] 🏆 Interception loadLeaderboard → Supabase getLeaderboard');

    try {
        const { data, error } = await leaderboardModule.getLeaderboard();

        if (error) {
            console.error('[APP.JS] ❌ Erreur getLeaderboard:', error.message);
            return [];
        }

        return data || [];
    } catch (e) {
        console.error('[APP.JS] ❌ Exception loadLeaderboard:', e);
        return [];
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// ÉCOUTER : Changements d'état auth (token refresh, signout externe)
// ═══════════════════════════════════════════════════════════════════════════════
authModule.onAuthStateChange((event, session) => {
    console.log('[APP.JS] 🔔 Auth state change:', event);

    if (event === 'SIGNED_OUT') {
        QuranReview.state.user = null;
        localStorage.removeItem('quranreview_user');
        localStorage.removeItem(QuranReview.config.apiTokenKey);
        QuranReview.updateAuthUI(false);
    } else if (event === 'TOKEN_REFRESHED' && session) {
        localStorage.setItem(QuranReview.config.apiTokenKey, session.access_token);
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// NEUTRALISER : refreshToken — Supabase SDK gère le refresh via TOKEN_REFRESHED
// ═══════════════════════════════════════════════════════════════════════════════
QuranReview.refreshToken = async function() {
    // Supabase SDK rafraîchit le token automatiquement via onAuthStateChange
    return true;
};

// ═══════════════════════════════════════════════════════════════════════════════
// INTERCEPTER : competitionManager.renderLeaderboard — fetch non couvert
// ═══════════════════════════════════════════════════════════════════════════════
if (QuranReview.competitionManager) {
    QuranReview.competitionManager.renderLeaderboard = async function() {
        console.log('[APP.JS] 🏆 Interception competitionManager.renderLeaderboard → Supabase');
        const list = document.getElementById('leaderboard-list');
        if (!list) return;

        try {
            const { data, error } = await leaderboardModule.getLeaderboard();
            if (error || !data) {
                this.renderLocalLeaderboard();
                return;
            }
            this.renderLeaderboardData(data);
        } catch (e) {
            this.renderLocalLeaderboard();
        }
    };
}

console.log('[APP.JS] ✅ Intercepteurs Supabase en place — DOMContentLoaded va lancer init()');
