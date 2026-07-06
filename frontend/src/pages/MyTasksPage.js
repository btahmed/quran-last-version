// frontend/src/pages/MyTasksPage.js
// Page des tâches étudiant — extrait de frontend/script.js (~lignes 4046-4241)
import { state } from '../core/state.js';
import { config } from '../core/config.js';
import { showNotification } from '../core/ui.js';
import { showAuthModal } from '../services/auth.js';
import { apiCache } from '../core/apiCache.js';
import * as supabaseTasks from '../services/supabase-tasks.js';
import * as supabaseSubmissions from '../services/supabase-submissions.js';
import * as supabaseLeaderboard from '../services/supabase-leaderboard.js';
import { updateNavBadge } from '../core/NavManager.js';

function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function escapeJs(str) {
    return String(str ?? '')
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r');
}

// Injection CSS
if (!document.querySelector('link[href*="MyTasksPage.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/src/pages/MyTasksPage.css';
    document.head.appendChild(link);
}

// ===================================
// RENDER — structure HTML de la page
// ===================================

export function render() {
    return `
        <div id="mytasks-page" class="page active">
            <section class="k-section">
                <h2 class="k-section-title" style="text-align:center;margin-bottom:var(--space-6);">📝 مهامي</h2>
                <p id="student-welcome" style="text-align:center;color:var(--color-text-secondary);margin-bottom:var(--space-4);"></p>
                <div class="k-grid2" style="margin-bottom:var(--space-6);">
                    <div class="k-stat-card">
                        <div class="k-stat-icon">🏆</div>
                        <div class="k-stat-value gradient-value" id="student-points">0</div>
                        <div class="k-stat-label">نقاطي</div>
                    </div>
                    <div class="k-stat-card">
                        <div class="k-stat-icon">✅</div>
                        <div class="k-stat-value" id="student-tasks-done">0</div>
                        <div class="k-stat-label">مكتملة</div>
                    </div>
                    <div class="k-stat-card">
                        <div class="k-stat-icon">⏳</div>
                        <div class="k-stat-value" id="student-tasks-pending">0</div>
                        <div class="k-stat-label">قيد الانتظار</div>
                    </div>
                    <div class="k-stat-card">
                        <div class="k-stat-icon">❌</div>
                        <div class="k-stat-value" id="student-tasks-rejected">0</div>
                        <div class="k-stat-label">مرفوضة</div>
                    </div>
                </div>
            </section>

            <section class="k-section">
                <div class="k-seg-tabs">
                    <button class="k-seg-tab k-seg-tab--pending active" onclick="QuranReview.switchTaskTab('pending')">
                        <span class="k-seg-tab-icon">⏳</span>
                        <span class="k-seg-tab-label">قيد الانتظار</span>
                        <span class="k-seg-tab-hint">واجبات لم تُسلَّم بعد</span>
                    </button>
                    <button class="k-seg-tab k-seg-tab--done" onclick="QuranReview.switchTaskTab('completed')">
                        <span class="k-seg-tab-icon">✅</span>
                        <span class="k-seg-tab-label">مكتملة</span>
                        <span class="k-seg-tab-hint">تسليمات مقبولة</span>
                    </button>
                </div>
                <div id="student-tasks-list" class="k-stack">
                    <div class="skeleton skeleton-card"></div>
                    <div class="skeleton skeleton-card"></div>
                    <div class="skeleton skeleton-card"></div>
                </div>
            </section>

            <section class="k-section">
                <h3 class="k-section-title">📊 سجل النقاط</h3>
                <div id="student-points-log" class="k-stack">
                    <p class="k-empty">لا توجد نقاط بعد</p>
                </div>
            </section>
        </div>
    `;
}

// ===================================
// INIT
// ===================================

export async function init() {
    await loadStudentDashboard();
}

// ===================================
// STUDENT DASHBOARD
// ===================================

// État interne pour les onglets
let _studentTasks = [];
let _studentSubByTask = {};

export async function loadStudentDashboard() {
    const token = localStorage.getItem(config.apiTokenKey);
    if (!token) {
        showAuthModal();
        return;
    }
    if (state.user && state.user.role === 'teacher') {
        window.QuranReview && window.QuranReview.navigateTo('teacher');
        return;
    }
    if (state.user) {
        const el = document.getElementById('student-welcome');
        if (el) el.textContent = `مرحباً ${state.user.first_name || state.user.username}`;
    }

    // Tenter le cache avant le fetch
    const cachedTasks = apiCache.get('tasks');
    const cachedSubs = apiCache.get('my-submissions');
    const cachedPts = apiCache.get('points');

    if (cachedTasks && cachedSubs && cachedPts) {
        _applyStudentData(cachedTasks, cachedSubs, cachedPts);
        _fetchAndCacheStudent(); // refresh silencieux
        return;
    }

    await _fetchAndCacheStudent();
}

async function _fetchAndCacheStudent() {
    try {
        // Migration Supabase
        const [tasksResult, subsResult, pointsResult] = await Promise.all([
            supabaseTasks.getMyTasks(),
            supabaseSubmissions.getMySubmissions(),
            supabaseLeaderboard.getMyPoints(),
        ]);

        const tasks = tasksResult.data || [];
        const submissions = subsResult.data || [];
        const pointsData = {
            total_points: pointsResult.data?.total || 0,
            logs: pointsResult.data?.logs || [],
        };

        apiCache.set('tasks', tasks);
        apiCache.set('my-submissions', submissions);
        apiCache.set('points', pointsData);

        _applyStudentData(tasks, submissions, pointsData);
    } catch (error) {
        console.error('Failed to load student dashboard:', error);
        showNotification('خطأ في تحميل البيانات', 'error');
        const tasksList = document.getElementById('student-tasks-list');
        if (tasksList)
            tasksList.innerHTML =
                '<p class="empty-state" style="color:#ef4444;">❌ تعذّر تحميل المهام — تحقق من اتصالك</p>';
    }
}

function _applyStudentData(tasks, submissions, pointsData) {
    // Guard : si l'utilisateur a navigué ailleurs, la page n'est plus dans le DOM
    if (!document.getElementById('mytasks-page')) return;

    // Construire le lookup soumissions par tâche
    const subByTask = {};
    submissions.forEach(s => {
        const taskId = s.task_id || s.tasks?.id;
        if (taskId) subByTask[taskId] = s;
    });

    const done = submissions.filter(s => s.status === 'approved').length;
    const rejected = submissions.filter(s => s.status === 'rejected').length;
    const pending = tasks.length - done;

    // Stats
    document.getElementById('student-points').textContent = pointsData.total_points || 0;
    document.getElementById('student-tasks-done').textContent = done;
    document.getElementById('student-tasks-pending').textContent = pending > 0 ? pending : 0;
    document.getElementById('student-tasks-rejected').textContent = rejected;

    // سجل النقاط
    const pointsLogEl = document.getElementById('student-points-log');
    const logs = pointsData.logs || [];
    if (!logs.length) {
        pointsLogEl.innerHTML = '<p class="k-empty">لا توجد نقاط بعد</p>';
    } else {
        pointsLogEl.innerHTML = logs
            .slice(0, 10)
            .map(log => {
                const date = new Date(log.created_at).toLocaleDateString('ar-SA');
                const sign = log.delta > 0 ? '+' : '';
                const isPositive = log.delta > 0;
                const reason = log.reason
                    .replace(/^Tache approuvee:\s*/i, 'تمت الموافقة على: ')
                    .replace(/^Tache rejetee:\s*/i, 'تم رفض: ');
                return `
            <div class="k-row">
                <div class="rl">
                    <span class="k-dot ${isPositive ? 'k-dot--done' : 'k-dot--missed'}"></span>
                    <div>
                        <div class="name">${escapeHtml(reason)}</div>
                        <div class="meta">${date}</div>
                    </div>
                </div>
                <span class="k-chip ${isPositive ? 'k-chip--success' : 'k-chip--danger'}">${sign}${log.delta}</span>
            </div>`;
            })
            .join('');
    }

    // Stocker les données dans l'état interne pour le re-rendu par onglet
    _studentTasks = tasks;
    _studentSubByTask = subByTask;

    // Mettre à jour le badge de l'onglet "soumettre" avec les tâches en attente
    const pendingCount = tasks.filter(t => {
        const sub = subByTask[t.id];
        // En attente = pas de soumission, ou soumission rejetée/en cours de révision
        return (
            !sub ||
            sub.status === 'pending' ||
            sub.status === 'assigned' ||
            sub.status === 'rejected'
        );
    }).length;
    updateNavBadge('soumettre', pendingCount);

    // Détecter le bon onglet initial selon les statuts réels
    const hasPending = tasks.some(t => {
        const s = subByTask[t.id];
        return !s || s.status !== 'approved';
    });
    switchTaskTab(hasPending ? 'pending' : 'completed');
}

// ===================================
// STUDENT TASK TAB SWITCHER
// ===================================

export function switchTaskTab(tabName) {
    // Mettre à jour les boutons onglet
    document.querySelectorAll('#mytasks-page .k-seg-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`#mytasks-page .k-seg-tab[onclick*="${tabName}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    const tasksList = document.getElementById('student-tasks-list');
    if (!tasksList) return;

    // Tuer les tweens GSAP bloqués et forcer la visibilité
    if (window.gsap) {
        gsap.killTweensOf(tasksList);
        gsap.set(tasksList, { clearProps: 'opacity,transform,translate,rotate,scale' });
    }

    const tasks = _studentTasks || [];
    const subByTask = _studentSubByTask || {};

    if (!tasks.length) {
        tasksList.innerHTML = '<p class="empty-state">لا توجد مهام حالياً</p>';
        return;
    }

    // Filtrer les tâches selon l'onglet sélectionné
    const filtered = tasks.filter(task => {
        const sub = subByTask[task.id];
        const status = sub ? sub.status : 'new';
        return tabName === 'completed' ? status === 'approved' : status !== 'approved';
    });

    if (!filtered.length) {
        tasksList.innerHTML = `<p class="empty-state">${tabName === 'completed' ? 'لا توجد مهام مكتملة بعد' : 'لا توجد مهام قيد الانتظار'}</p>`;
        return;
    }

    // Re-rendre uniquement les tâches filtrées
    tasksList.innerHTML = filtered
        .map(task => {
            const sub = subByTask[task.id];
            let dotClass = 'k-dot--pending';
            let chipHtml = '<span class="k-chip k-chip--info">لم يُسلَّم</span>';
            const safeId = escapeHtml(String(task.id));
            const safeTitle = escapeHtml(escapeJs(task.title));
            let actionBtn = `<button class="k-quickbtn k-quickbtn--primary" style="min-width:auto;padding:var(--space-1) var(--space-3);font-size:var(--text-xs)" onclick="QuranReview.openRecordModal('${safeId}', '${safeTitle}')">🎤 تسجيل</button>`;

            if (sub) {
                if (sub.status === 'approved') {
                    dotClass = 'k-dot--done';
                    chipHtml = '<span class="k-chip k-chip--success">مقبول ✓</span>';
                    actionBtn = '';
                } else if (sub.status === 'rejected') {
                    dotClass = 'k-dot--missed';
                    chipHtml = '<span class="k-chip k-chip--danger">مرفوض ✗</span>';
                    actionBtn = `<button class="k-quickbtn k-quickbtn--primary" style="min-width:auto;padding:var(--space-1) var(--space-3);font-size:var(--text-xs)" onclick="QuranReview.openRecordModal('${safeId}', '${safeTitle}')">🎤 إعادة التسجيل</button>`;
                } else {
                    dotClass = 'k-dot--new';
                    chipHtml = '<span class="k-chip k-chip--warning">⏳ بانتظار</span>';
                    actionBtn = '';
                }
            }

            const typeLabel = task.type || 'مهمة';
            const dueDate = task.due_date
                ? new Date(task.due_date).toLocaleDateString('ar-SA')
                : '';

            let feedbackHtml = '';
            if (sub?.admin_feedback) {
                if (sub.status === 'approved') {
                    feedbackHtml = `<span class="k-chip k-chip--success">⭐ ${escapeHtml(sub.admin_feedback)}</span>`;
                } else if (sub.status === 'rejected') {
                    feedbackHtml = `<span class="k-chip k-chip--danger">💬 ${escapeHtml(sub.admin_feedback)}</span>`;
                }
            }

            // Audio player pour les soumissions acceptées
            const rawAudioUrl = sub?.audio_url;
            const safeAudioSrc =
                rawAudioUrl && rawAudioUrl.startsWith('https://') ? escapeHtml(rawAudioUrl) : null;
            const audioHtml = safeAudioSrc
                ? `<audio controls preload="metadata" src="${safeAudioSrc}" style="width:100%;margin-top:var(--space-2);" onerror="this.outerHTML='<p style=\\'color:var(--color-text-secondary);font-size:0.85rem;\\'>الملف الصوتي غير متاح</p>'"></audio>`
                : '';

            return `
        <div class="k-task-card">
            <div class="k-task-card-header">
                <div style="display:flex;align-items:center;gap:var(--space-2);">
                    <span class="k-dot ${dotClass}"></span>
                    <h3 class="k-task-card-title">${escapeHtml(task.title)}</h3>
                </div>
                <div style="display:flex;align-items:center;gap:var(--space-2);flex-shrink:0;">
                    ${chipHtml}
                    ${actionBtn}
                </div>
            </div>
            ${task.description ? `<p class="k-task-card-desc">${escapeHtml(task.description)}</p>` : ''}
            <div class="k-task-card-meta">
                <span class="k-type-badge">${escapeHtml(typeLabel)}</span>
                <span>🏆 ${escapeHtml(String(task.points))} نقطة</span>
                ${sub?.awarded_points ? `<span class="k-chip k-chip--primary">+${sub.awarded_points}</span>` : ''}
                ${dueDate ? `<span>📅 ${dueDate}</span>` : ''}
                ${feedbackHtml}
            </div>
            ${audioHtml}
        </div>`;
        })
        .join('');
}
