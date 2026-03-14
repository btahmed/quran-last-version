// frontend/src/pages/MyTasksPage.js
// Page des tâches étudiant — extrait de frontend/script.js (~lignes 4046-4241)
import { state } from '../core/state.js';
import { config } from '../core/config.js';
import { showNotification } from '../core/ui.js';
import { Logger } from '../core/logger.js';
import { showAuthModal } from '../services/auth.js';

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
            <section class="section-pro">
                <div class="container-pro">
                    <h2 class="section-title" style="text-align: center; margin-bottom: var(--space-8);">📝 مهامي</h2>

                    <!-- رسالة الترحيب -->
                    <p id="student-welcome" style="text-align:center;color:var(--color-text-secondary);margin-bottom:var(--space-4);"></p>

                    <!-- Student Task Stats — 4 cartes dont les points -->
                    <div class="grid-pro grid-cols-4" style="margin-bottom: var(--space-6);">
                        <div class="card-stat-premium" style="text-align: center;">
                            <div class="stat-value" id="student-points">0</div>
                            <p style="color: var(--color-text-secondary);">🏆 نقاطي</p>
                        </div>
                        <div class="card-stat-premium" style="text-align: center;">
                            <div class="stat-value" id="student-tasks-done">0</div>
                            <p style="color: var(--color-text-secondary);">مكتملة</p>
                        </div>
                        <div class="card-stat-premium" style="text-align: center;">
                            <div class="stat-value" id="student-tasks-pending">0</div>
                            <p style="color: var(--color-text-secondary);">قيد الانتظار</p>
                        </div>
                        <div class="card-stat-premium" style="text-align: center;">
                            <div class="stat-value" id="student-tasks-rejected">0</div>
                            <p style="color: var(--color-text-secondary);">مرفوضة</p>
                        </div>
                    </div>

                    <!-- قائمة المهام -->
                    <div class="tabs" style="margin-bottom: var(--space-4);">
                        <button class="tab active" onclick="QuranReview.switchTaskTab('pending')">قيد الانتظار</button>
                        <button class="tab" onclick="QuranReview.switchTaskTab('completed')">مكتملة</button>
                    </div>

                    <div id="student-tasks-list" class="card-glass-pro" style="margin-bottom: var(--space-6);">
                        <p class="empty-state">جاري التحميل...</p>
                    </div>

                    <!-- التسليمات -->
                    <div class="card-glass-pro" style="margin-bottom: var(--space-6);">
                        <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: var(--space-3);">📤 تسليماتي</h3>
                        <div id="student-submissions-list">
                            <p class="empty-state">لا توجد تسليمات بعد</p>
                        </div>
                    </div>

                    <!-- سجل النقاط -->
                    <div class="card-glass-pro">
                        <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: var(--space-3);">📊 سجل النقاط</h3>
                        <div id="student-points-log">
                            <p class="empty-state">لا توجد نقاط بعد</p>
                        </div>
                    </div>
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

async function loadStudentDashboard() {
    const token = localStorage.getItem(config.apiTokenKey);
    if (!token) {
        showAuthModal();
        return;
    }

    // Bloquer les enseignants sur la page étudiant
    if (state.user && state.user.role === 'teacher') {
        // navigateTo géré par le router global
        window.QuranReview && window.QuranReview.navigateTo('teacher');
        return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    // Mettre à jour le message de bienvenue
    if (state.user) {
        const el = document.getElementById('student-welcome');
        if (el) el.textContent = `مرحباً ${state.user.first_name || state.user.username}`;
    }

    try {
        const [tasksRes, subsRes, pointsRes] = await Promise.all([
            fetch(`${config.apiBaseUrl}/api/tasks/`, { headers }),
            fetch(`${config.apiBaseUrl}/api/my-submissions/`, { headers }),
            fetch(`${config.apiBaseUrl}/api/points/`, { headers }),
        ]);

        const tasks = tasksRes.ok ? await tasksRes.json() : [];
        const submissions = subsRes.ok ? await subsRes.json() : [];
        const pointsData = pointsRes.ok ? await pointsRes.json() : { total_points: 0, logs: [] };

        // Construire le lookup soumissions par tâche
        const subByTask = {};
        submissions.forEach(s => { subByTask[s.task.id] = s; });

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
            pointsLogEl.innerHTML = '<p class="empty-state">لا توجد نقاط بعد</p>';
        } else {
            pointsLogEl.innerHTML = logs.slice(0, 10).map(log => {
                const date = new Date(log.created_at).toLocaleDateString('ar-SA');
                const sign = log.delta > 0 ? '+' : '';
                const isPositive = log.delta > 0;
                // Normaliser les anciens textes français en arabe
                const reason = log.reason
                    .replace(/^Tache approuvee:\s*/i, 'تمت الموافقة على: ')
                    .replace(/^Tache rejetee:\s*/i, 'تم رفض: ');
                return `<div class="points-log-item" style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--color-border, rgba(255,255,255,0.08));gap:8px;">
                    <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:0;">
                        <span style="font-size:1.1rem;">${isPositive ? '🏆' : '📉'}</span>
                        <span style="font-size:0.85rem;color:var(--color-text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${reason}</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
                        <span style="font-weight:700;font-size:0.95rem;color:${isPositive ? '#10b981' : '#ef4444'};">${sign}${log.delta}</span>
                        <span style="font-size:0.75rem;color:var(--color-text-secondary);">${date}</span>
                    </div>
                </div>`;
            }).join('');
        }

        // Stocker les données dans l'état interne pour le re-rendu par onglet
        _studentTasks = tasks;
        _studentSubByTask = subByTask;

        // Détecter le bon onglet initial selon les statuts réels
        const hasPending = tasks.some(t => { const s = subByTask[t.id]; return !s || s.status !== 'approved'; });
        switchTaskTab(hasPending ? 'pending' : 'completed');

        // Liste des soumissions
        const subsList = document.getElementById('student-submissions-list');
        if (!submissions.length) {
            subsList.innerHTML = '<p class="empty-state">لا توجد تسليمات بعد</p>';
        } else {
            subsList.innerHTML = submissions.map(s => {
                const isApproved = s.status === 'approved';
                const isRejected = s.status === 'rejected';
                const date = new Date(s.submitted_at).toLocaleDateString('ar-SA');
                const audioSrc = s.audio_url
                    ? (s.audio_url.startsWith('http') ? s.audio_url : config.apiBaseUrl + (s.audio_url.startsWith('/') ? s.audio_url : '/' + s.audio_url))
                    : '';

                // Affichage du feedback selon statut
                let feedbackHtml = '';
                if (s.admin_feedback) {
                    if (isApproved) {
                        // Note emoji → affiché en vert, gros et visible
                        feedbackHtml = `<div style="display:inline-flex;align-items:center;gap:6px;background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.3);border-radius:8px;padding:4px 10px;margin-top:6px;font-size:1rem;font-weight:600;color:#10b981;">
                            ⭐ ${s.admin_feedback}
                        </div>`;
                    } else if (isRejected) {
                        // Motif de refus → affiché en rouge
                        feedbackHtml = `<div style="font-size:0.82rem;color:#ef4444;margin-top:4px;">💬 ${s.admin_feedback}</div>`;
                    }
                }

                const statusStyle = isApproved
                    ? 'background:rgba(16,185,129,0.15);color:#10b981;border:1px solid rgba(16,185,129,0.3);'
                    : isRejected
                    ? 'background:rgba(239,68,68,0.15);color:#ef4444;border:1px solid rgba(239,68,68,0.3);'
                    : 'background:rgba(245,158,11,0.15);color:#f59e0b;border:1px solid rgba(245,158,11,0.3);';
                const statusText = isApproved ? 'مقبول ✓' : isRejected ? 'مرفوض ✗' : '⏳ بانتظار التصحيح';

                return `<div class="task-card" style="flex-wrap:wrap;gap:8px;">
                    <span class="task-status ${isApproved ? 'task-status-completed' : 'task-status-pending'}"></span>
                    <div style="flex:1;min-width:0;">
                        <div style="font-weight:600;margin-bottom:2px;">${s.task.title}</div>
                        <div style="font-size:0.8rem;color:var(--color-text-secondary);">📅 ${date}${s.awarded_points ? ` &nbsp;🏆 +${s.awarded_points} نقطة` : ''}</div>
                        ${feedbackHtml}
                        ${audioSrc ? `
                            <audio controls preload="metadata" style="width:100%;margin-top:6px;"
                                onerror="this.outerHTML='<p style=\\'color:#999;font-size:0.85rem;\\'>الملف الصوتي غير متاح</p>'">
                                <source src="${audioSrc}" type="audio/webm">
                            </audio>` : ''}
                    </div>
                    <span class="badge" style="${statusStyle};font-size:0.78rem;padding:4px 10px;border-radius:6px;">${statusText}</span>
                </div>`;
            }).join('');
        }
    } catch (error) {
        console.error('Failed to load student dashboard:', error);
        showNotification('خطأ في تحميل البيانات', 'error');
    }
}

// ===================================
// STUDENT TASK TAB SWITCHER
// ===================================

export function switchTaskTab(tabName) {
    // Mettre à jour les boutons onglet
    document.querySelectorAll('#mytasks-page .tab').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`#mytasks-page .tab[onclick*="${tabName}"]`);
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
    tasksList.innerHTML = filtered.map(task => {
        const sub = subByTask[task.id];
        let dotClass = 'task-status-pending';
        let statusBadge = '<span class="badge" style="background:rgba(59,130,246,0.15);color:#3b82f6;">لم يُسلَّم</span>';
        let actionBtn = `<button class="btn btn-primary btn-sm" onclick="QuranReview.openRecordModal(${task.id}, '${task.title.replace(/'/g, "\\'")}')">🎤 تسجيل</button>`;

        if (sub) {
            if (sub.status === 'approved') {
                dotClass = 'task-status-completed';
                statusBadge = '<span class="badge" style="background:rgba(16,185,129,0.15);color:#10b981;border:1px solid rgba(16,185,129,0.3);">مقبول ✓</span>';
                actionBtn = '';
            } else if (sub.status === 'rejected') {
                dotClass = 'task-status-pending';
                statusBadge = '<span class="badge" style="background:rgba(239,68,68,0.15);color:#ef4444;border:1px solid rgba(239,68,68,0.3);">مرفوض ✗</span>';
                actionBtn = `<button class="btn btn-primary btn-sm" onclick="QuranReview.openRecordModal(${task.id}, '${task.title.replace(/'/g, "\\'")}')">🎤 إعادة التسجيل</button>`;
            } else {
                dotClass = 'task-status-submitted';
                statusBadge = '<span class="badge" style="background:rgba(245,158,11,0.15);color:#f59e0b;border:1px solid rgba(245,158,11,0.3);font-size:0.7rem;padding:2px 8px;">⏳ بانتظار التصحيح</span>';
                actionBtn = '';
            }
        }

        const typeLabel = task.type_display || task.type || 'مهمة';
        const dueDate = task.due_date ? new Date(task.due_date).toLocaleDateString('ar-SA') : '';

        // Feedback: note emoji pour approved, motif pour rejected
        let feedbackInTaskHtml = '';
        if (sub && sub.admin_feedback) {
            if (sub.status === 'approved') {
                feedbackInTaskHtml = `<div style="display:inline-flex;align-items:center;gap:5px;background:rgba(16,185,129,0.1);border-radius:6px;padding:3px 8px;margin-top:4px;font-size:0.9rem;font-weight:600;color:#10b981;">⭐ ${sub.admin_feedback}</div>`;
            } else if (sub.status === 'rejected') {
                feedbackInTaskHtml = `<div style="font-size:0.8rem;color:#ef4444;margin-top:4px;">💬 ${sub.admin_feedback}</div>`;
            }
        }

        return `<div class="task-card">
            <span class="task-status ${dotClass}"></span>
            <div style="flex:1;min-width:0;">
                <div style="font-weight:600;margin-bottom:var(--space-1);">${task.title}</div>
                <div style="font-size:0.875rem;color:var(--color-text-secondary);display:flex;flex-wrap:wrap;gap:var(--space-2);align-items:center;">
                    <span class="badge badge-primary" style="font-size:0.7rem;">${typeLabel}</span>
                    🏆 ${task.points} نقطة
                    ${dueDate ? `<span>📅 ${dueDate}</span>` : ''}
                </div>
                ${task.description ? `<div style="font-size:0.8rem;color:var(--color-text-secondary);margin-top:var(--space-1);">${task.description}</div>` : ''}
                ${feedbackInTaskHtml}
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:var(--space-2);flex-shrink:0;">
                ${statusBadge}
                ${actionBtn}
            </div>
        </div>`;
    }).join('');
}
