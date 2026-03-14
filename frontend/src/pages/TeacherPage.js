// frontend/src/pages/TeacherPage.js
// Page tableau de bord enseignant — extrait de frontend/script.js (~lignes 4247-4912)
import { state } from '../core/state.js';
import { config } from '../core/config.js';
import { showNotification } from '../core/ui.js';
import { Logger } from '../core/logger.js';
import { showAuthModal, refreshToken } from '../services/auth.js';

// Wrapper fetch avec auto-refresh du token JWT (401)
async function authFetch(url, options = {}) {
    let token = localStorage.getItem(config.apiTokenKey);
    const makeReq = (t) => fetch(url, {
        ...options,
        headers: { ...options.headers, Authorization: `Bearer ${t}` },
    });
    let res = await makeReq(token);
    if (res.status === 401) {
        const refreshed = await refreshToken();
        if (refreshed) {
            token = localStorage.getItem(config.apiTokenKey);
            res = await makeReq(token);
        } else {
            showAuthModal();
            throw new Error('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً');
        }
    }
    return res;
}

// Injection CSS
if (!document.querySelector('link[href*="TeacherPage.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/src/pages/TeacherPage.css';
    document.head.appendChild(link);
}

// ===================================
// RENDER — structure HTML de la page
// ===================================

const GRADE_LABELS = {
    1: { emoji: '😟', text: 'ضعيف' },
    2: { emoji: '😐', text: 'مقبول' },
    3: { emoji: '🙂', text: 'جيد' },
    4: { emoji: '😊', text: 'جيد جداً' },
    5: { emoji: '🌟', text: 'ممتاز' },
};

let _pendingGradeSubmissionId = null;
let _selectedGrade = null;
let _pendingRejectSubmissionId = null;

export function render() {
    return `
        <!-- Modal notation emoji -->
        <div id="grade-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:2000;align-items:center;justify-content:center;">
            <div class="card-glass-pro" style="max-width:420px;width:90%;padding:2rem;text-align:center;border-radius:1rem;">
                <h3 style="font-size:1.2rem;font-weight:700;margin-bottom:0.5rem;">⭐ تقييم التسليم</h3>
                <p id="grade-modal-subtitle" style="color:var(--color-text-secondary);margin-bottom:1.5rem;font-size:0.9rem;"></p>
                <div style="display:flex;justify-content:center;gap:0.75rem;margin-bottom:1rem;">
                    ${[1,2,3,4,5].map(g => `
                        <button onclick="QuranReview.selectGrade(${g})" data-grade="${g}"
                            style="font-size:2rem;background:none;border:2px solid transparent;border-radius:12px;padding:8px;cursor:pointer;transition:all 0.2s;line-height:1;"
                            title="${GRADE_LABELS[g].text}">
                            ${GRADE_LABELS[g].emoji}
                        </button>
                    `).join('')}
                </div>
                <div id="grade-label" style="font-size:1rem;font-weight:600;min-height:1.5em;margin-bottom:1.5rem;color:var(--color-primary);"></div>
                <div style="display:flex;gap:1rem;justify-content:center;">
                    <button class="btn btn-outline-glow btn-sm" onclick="QuranReview.closeGradeModal()">إلغاء</button>
                    <button class="btn btn-glow btn-sm" id="grade-confirm-btn" disabled onclick="QuranReview.confirmGrade()">✓ قبول</button>
                </div>
            </div>
        </div>

        <!-- Modal rejet -->
        <div id="reject-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:2000;align-items:center;justify-content:center;">
            <div class="card-glass-pro" style="max-width:420px;width:90%;padding:2rem;border-radius:1rem;">
                <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:0.75rem;">✗ رفض التسليم</h3>
                <p id="reject-modal-subtitle" style="color:var(--color-text-secondary);margin-bottom:1rem;font-size:0.9rem;"></p>
                <textarea id="reject-feedback" placeholder="سبب الرفض (اختياري)..."
                    dir="rtl"
                    style="width:100%;min-height:80px;border-radius:8px;padding:10px;border:1px solid var(--color-border);background:var(--glass-bg);color:var(--color-text);resize:vertical;font-family:inherit;font-size:0.95rem;"></textarea>
                <div style="display:flex;gap:1rem;justify-content:center;margin-top:1rem;">
                    <button class="btn btn-outline-glow btn-sm" onclick="QuranReview.closeRejectModal()">إلغاء</button>
                    <button class="btn btn-danger btn-sm" onclick="QuranReview.confirmReject()">✗ تأكيد الرفض</button>
                </div>
            </div>
        </div>

        <div id="teacher-page" class="page active">
            <section class="section-pro">
                <div class="container-pro">
                    <h2 class="section-title" style="text-align: center; margin-bottom: var(--space-8);">📋 لوحة المعلم</h2>

                    <div class="grid-pro grid-cols-3" style="margin-bottom: var(--space-8);">
                        <div class="card-stat-premium" style="text-align: center;">
                            <div class="stat-value" id="teacher-students-count">0</div>
                            <p style="color: var(--color-text-secondary);">عدد الطلاب</p>
                        </div>
                        <div class="card-stat-premium" style="text-align: center;">
                            <div class="stat-value" id="teacher-pending-count">0</div>
                            <p style="color: var(--color-text-secondary);">تسليمات معلقة</p>
                        </div>
                        <div class="card-stat-premium" style="text-align: center;">
                            <div class="stat-value" id="teacher-tasks-count">0</div>
                            <p style="color: var(--color-text-secondary);">المهام الكلية</p>
                        </div>
                    </div>

                    <div class="card-glass-pro" style="margin-bottom: var(--space-6);">
                        <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: var(--space-4);">➕ إنشاء مهمة جديدة</h3>
                        <form id="teacher-create-task-form" onsubmit="QuranReview.handleCreateTask(event)">
                            <div class="form-floating" style="margin-bottom: var(--space-4);">
                                <input type="text" id="task-title" placeholder=" " required>
                                <label for="task-title">عنوان المهمة</label>
                            </div>
                            <div class="form-floating" style="margin-bottom: var(--space-4);">
                                <textarea id="task-description" placeholder=" " style="min-height: 80px; resize: vertical;"></textarea>
                                <label for="task-description">وصف المهمة</label>
                            </div>
                            <div class="grid-pro grid-cols-2" style="margin-bottom: var(--space-4);">
                                <div class="form-floating">
                                    <select id="task-type">
                                        <option value="memorization">حفظ</option>
                                        <option value="review">مراجعة</option>
                                        <option value="tajweed">تجويد</option>
                                    </select>
                                    <label for="task-type">نوع المهمة</label>
                                </div>
                                <div class="form-floating">
                                    <input type="number" id="task-points" min="0" value="10" placeholder=" ">
                                    <label for="task-points">النقاط</label>
                                </div>
                            </div>
                            <div class="form-floating" style="margin-bottom: var(--space-4);">
                                <input type="date" id="task-due-date" placeholder=" ">
                                <label for="task-due-date">تاريخ التسليم</label>
                            </div>
                            <!-- Assignation des étudiants -->
                            <div style="margin-bottom: var(--space-4);">
                                <p style="font-size: 0.875rem; font-weight: 600; margin-bottom: var(--space-2);">👥 تعيين إلى</p>
                                <div style="display: flex; gap: var(--space-4);">
                                    <label style="display: flex; align-items: center; gap: var(--space-2); cursor: pointer;">
                                        <input type="radio" name="assign-mode" value="all" checked
                                            onchange="QuranReview.toggleAssignMode('all')">
                                        <span>جميع الطلاب</span>
                                    </label>
                                    <label style="display: flex; align-items: center; gap: var(--space-2); cursor: pointer;">
                                        <input type="radio" name="assign-mode" value="select"
                                            onchange="QuranReview.toggleAssignMode('select')">
                                        <span>طلاب محددون</span>
                                    </label>
                                </div>
                            </div>
                            <div id="student-select-container" class="hidden" style="margin-bottom: var(--space-4);">
                                <div id="student-checkboxes" style="display: flex; flex-wrap: wrap; gap: var(--space-2); padding: var(--space-3); background: var(--glass-bg); border-radius: var(--radius-lg);">
                                    <p class="empty-state">جاري تحميل الطلاب...</p>
                                </div>
                            </div>
                            <button type="submit" class="btn btn-glow btn-full">إنشاء المهمة</button>
                        </form>
                    </div>

                    <!-- تسليمات الطلاب المعلقة -->
                    <div class="card-glass-pro" style="margin-bottom: var(--space-6);">
                        <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: var(--space-4);">📥 تسليمات الطلاب</h3>
                        <div id="teacher-tasks-list">
                            <p class="empty-state">لا توجد تسليمات بانتظار التصحيح 🎉</p>
                        </div>
                    </div>

                    <!-- قائمة المهام المعينة -->
                    <div class="card-glass-pro" style="margin-bottom: var(--space-6);">
                        <div id="teacher-assigned-tasks-list">
                            <p class="empty-state">لا توجد مهام بعد</p>
                        </div>
                    </div>

                    <!-- قائمة الطلاب -->
                    <div class="card-glass-pro" style="margin-bottom: var(--space-6);">
                        <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: var(--space-4);">🎓 قائمة الطلاب</h3>
                        <div id="teacher-students-list">
                            <p class="empty-state">لا يوجد طلاب بعد</p>
                        </div>
                    </div>

                    <!-- لوحة تفاصيل الطالب -->
                    <div id="student-detail-panel" class="card-glass-pro hidden" style="margin-bottom: var(--space-6);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4);">
                            <h3 id="student-detail-name" style="font-size: 1.125rem; font-weight: 600;">📊 تقدم الطالب</h3>
                            <button class="btn btn-outline-glow btn-sm" onclick="document.getElementById('student-detail-panel').classList.add('hidden')">✕ إغلاق</button>
                        </div>
                        <div id="student-detail-content">
                            <p class="empty-state">جاري التحميل...</p>
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
    await loadTeacherDashboard();
}

// ===================================
// UTILITAIRES INTERNES
// ===================================

function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function showLoading() {
    const overlay = document.querySelector('.loading-overlay');
    if (overlay) overlay.style.display = 'flex';
}

function hideLoading() {
    const overlay = document.querySelector('.loading-overlay');
    if (overlay) overlay.style.display = 'none';
}

// ===================================
// TEACHER DASHBOARD
// ===================================

async function loadTeacherDashboard() {
    const token = localStorage.getItem(config.apiTokenKey);
    if (!token) {
        showAuthModal();
        return;
    }

    // Bloquer les étudiants sur la page enseignant
    if (state.user && state.user.role !== 'teacher' && !state.user.is_staff) {
        window.QuranReview && window.QuranReview.navigateTo('mytasks');
        return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    // Mettre à jour le message de bienvenue
    if (state.user) {
        const el = document.getElementById('teacher-welcome');
        if (el) el.textContent = `مرحباً أستاذ ${state.user.first_name || state.user.username}`;
    }

    // Afficher l'onglet admin uniquement pour les superutilisateurs
    const adminTab = document.querySelector('.admin-only-tab');
    if (adminTab) {
        const isAdmin = state.user && state.user.is_superuser;
        adminTab.style.display = isAdmin ? 'inline-block' : 'none';
    }

    // Charger la liste des utilisateurs admin si superuser
    if (state.user && state.user.is_superuser) {
        // Sans await pour ne pas bloquer le chargement du dashboard
        loadAdminUsersList();
    }

    showLoading();

    try {
        const [studentsRes, pendingRes, tasksRes] = await Promise.all([
            fetch(`${config.apiBaseUrl}/api/my-students/`, { headers }),
            fetch(`${config.apiBaseUrl}/api/pending-submissions/`, { headers }),
            fetch(`${config.apiBaseUrl}/api/tasks/`, { headers }),
        ]);

        const students = studentsRes.ok ? await studentsRes.json() : [];
        const pending = pendingRes.ok ? await pendingRes.json() : [];
        const tasks = tasksRes.ok ? await tasksRes.json() : [];

        // Stocker pour usage ultérieur
        _teacherStudents = students;
        _teacherTasks = tasks;

        // Charger les cases à cocher des étudiants pour la création de tâche
        _loadStudentCheckboxes(students);

        // Stats
        const studentsCountEl = document.getElementById('teacher-students-count');
        if (studentsCountEl) studentsCountEl.textContent = students.length;
        const pendingCountEl = document.getElementById('teacher-pending-count');
        if (pendingCountEl) pendingCountEl.textContent = pending.length;
        const tasksCountEl = document.getElementById('teacher-tasks-count');
        if (tasksCountEl) tasksCountEl.textContent = tasks.length;

        // Soumissions en attente
        const pendingList = document.getElementById('teacher-tasks-list');
        if (!pending.length) {
            pendingList.innerHTML = '<p class="empty-state">لا توجد تسليمات بانتظار التصحيح 🎉</p>';
        } else {
            pendingList.innerHTML = pending.map(s => {
                const date = new Date(s.submitted_at).toLocaleDateString('ar-SA');
                return `<div class="pending-card">
                    <div class="pending-card-header">
                        <strong>🎓 ${s.student_name}</strong>
                        <span class="task-type-badge">${s.task.title}</span>
                    </div>
                    <div class="pending-card-meta">
                        <span>🏆 ${s.task.points} نقطة</span>
                        <span>📅 ${date}</span>
                    </div>
                    ${s.audio_url ? `
                        <div class="audio-player-container">
                            <audio controls preload="metadata" style="width:100%;margin:0.5rem 0;"
                                onerror="this.parentElement.innerHTML='<p style=\\'color:#999;font-size:0.85rem;\\'>الملف الصوتي غير متاح حاليا</p>'">
                                <source src="${s.audio_url.startsWith('http') ? s.audio_url : config.apiBaseUrl + (s.audio_url.startsWith('/') ? s.audio_url : '/' + s.audio_url)}" type="audio/webm">
                                المتصفح لا يدعم تشغيل الصوت
                            </audio>
                            <div style="font-size:0.8rem;color:#666;margin-top:0.25rem;">
                                📎 <a href="${s.audio_url.startsWith('http') ? s.audio_url : config.apiBaseUrl + (s.audio_url.startsWith('/') ? s.audio_url : '/' + s.audio_url)}" target="_blank" style="color:#007bff;">فتح الملف الصوتي</a>
                            </div>
                        </div>
                    ` : '<p class="empty-state">لا يوجد ملف صوتي</p>'}
                    <div class="pending-card-actions">
                        <button class="btn btn-success btn-sm" onclick="QuranReview.openGradeModal(${s.id}, '${escapeHtml(s.student_name).replace(/'/g, "\\'")}', '${escapeHtml(s.task ? s.task.title : '').replace(/'/g, "\\'")}')">⭐ قبول وتقييم</button>
                        <button class="btn btn-danger btn-sm" onclick="QuranReview.openRejectModal(${s.id}, '${escapeHtml(s.student_name).replace(/'/g, "\\'")}')">✗ رفض</button>
                    </div>
                </div>`;
            }).join('');
        }

        // Liste des étudiants avec clic pour voir le détail
        const studentsList = document.getElementById('teacher-students-list');
        if (!students.length) {
            studentsList.innerHTML = '<p class="empty-state">لا يوجد طلاب بعد</p>';
        } else {
            studentsList.innerHTML = students.map(s => {
                const safeName = escapeHtml(s.first_name || s.username);
                const safeNameAttr = (s.first_name || s.username).replace(/['"\\]/g, '');
                return `<div class="student-card clickable" onclick="QuranReview.viewStudentProgress(${s.id}, '${safeNameAttr}')">
                    <div class="student-card-name">🎓 ${safeName}</div>
                    <div class="student-card-stats">
                        <span>🏆 ${escapeHtml(String(s.total_points))} نقطة</span>
                        <span>📝 ${escapeHtml(String(s.submissions_count))} تسليم</span>
                    </div>
                    <span class="student-card-arrow">←</span>
                </div>`;
            }).join('');
        }

        // Liste des tâches — div séparé pour ne pas écraser les soumissions
        const taskListEl = document.getElementById('teacher-assigned-tasks-list');

        // En-tête avec bouton Supprimer tout
        const headerHtml = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3>📋 قائمة المهام</h3>
                <button class="btn btn-danger btn-sm" onclick="QuranReview.handleDeleteAllTasks()" style="background-color: #dc3545;">
                    🗑️ حذف جميع المهام
                </button>
            </div>
        `;

        if (!tasks.length) {
            taskListEl.innerHTML = headerHtml + '<p class="empty-state">لا توجد مهام بعد</p>';
        } else {
            // Regrouper les tâches par batch (title + type + due_date + jour de création)
            const batches = new Map();
            tasks.forEach(task => {
                const day = task.created_at ? task.created_at.substring(0, 10) : '';
                const key = `${task.title}||${task.type}||${task.due_date || ''}||${day}`;
                if (!batches.has(key)) {
                    batches.set(key, { task, count: 0, ids: [] });
                }
                batches.get(key).count++;
                batches.get(key).ids.push(task.id);
            });

            taskListEl.innerHTML = headerHtml + Array.from(batches.values()).map(({ task, count, ids }) => {
                const typeLabel = task.type_display || task.type || '';
                const dueDate = task.due_date ? new Date(task.due_date).toLocaleDateString('ar-SA') : '';
                const date = new Date(task.created_at).toLocaleDateString('ar-SA');
                const idsJson = JSON.stringify(ids);
                const safeTitle = task.title.replace(/'/g, "\\'");
                return `<div class="task-card" style="position:relative;">
                    <div class="task-card-header">
                        <h3 class="task-card-title">${task.title}</h3>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span class="task-type-badge">${typeLabel}</span>
                            <button onclick="QuranReview.handleDeleteBatch(${idsJson}, '${safeTitle}', ${count})"
                                style="padding:4px 10px; background:#fff; border:1px solid #ef4444; border-radius:6px; color:#ef4444; font-size:0.78rem; cursor:pointer; flex-shrink:0;"
                                title="حذف هذه المهمة">
                                🗑️ حذف
                            </button>
                        </div>
                    </div>
                    ${task.description ? `<p class="task-card-desc">${task.description}</p>` : ''}
                    <div class="task-card-meta">
                        <span>🏆 ${task.points} نقطة</span>
                        <span>👥 ${count} طالب</span>
                        <span>📅 أُنشئت: ${date}</span>
                        ${dueDate ? `<span>⏰ تسليم: ${dueDate}</span>` : ''}
                    </div>
                </div>`;
            }).join('');
        }
    } catch (error) {
        console.error('Failed to load teacher dashboard:', error);
        showNotification('خطأ في تحميل البيانات', 'error');
    } finally {
        hideLoading();
    }
}

// État interne pour les données enseignant
let _teacherStudents = [];
let _teacherTasks = [];

function _loadStudentCheckboxes(students) {
    const container = document.getElementById('student-checkboxes');
    if (!container) return;

    if (!students.length) {
        container.innerHTML = '<p class="empty-state">لا يوجد طلاب</p>';
        return;
    }

    const checkboxes = students.map(student => `
        <label class="student-checkbox-label">
            <input type="checkbox" name="student-ids" value="${student.id}">
            <span class="student-name">${student.first_name || student.username}</span>
        </label>
    `).join('');

    container.innerHTML = checkboxes;
}

// ===================================
// STUDENT PROGRESS DETAIL
// ===================================

export async function viewStudentProgress(studentId, studentName) {
    const token = localStorage.getItem(config.apiTokenKey);
    if (!token) return;

    const panel = document.getElementById('student-detail-panel');
    const nameEl = document.getElementById('student-detail-name');
    const contentEl = document.getElementById('student-detail-content');

    nameEl.textContent = `📊 تقدم الطالب: ${studentName}`;
    contentEl.innerHTML = '<p class="empty-state">جاري التحميل...</p>';
    panel.classList.remove('hidden');

    try {
        const response = await fetch(`${config.apiBaseUrl}/api/students/${studentId}/progress/`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('فشل تحميل بيانات الطالب');

        const data = await response.json();

        let html = `<div class="student-detail-stats">
            <div class="stat-mini"><strong>🏆</strong> ${data.student.total_points} نقطة</div>
        </div>`;

        if (!data.tasks.length) {
            html += '<p class="empty-state">لا توجد مهام معينة</p>';
        } else {
            html += '<div class="student-tasks-progress">';
            data.tasks.forEach(task => {
                const typeLabel = task.type_display || (task.task_type === 'memorization' ? 'حفظ' : task.task_type === 'recitation' ? 'تلاوة' : 'أخرى');
                let statusBadge = '';
                if (task.submission_status === 'approved') {
                    statusBadge = '<span class="status-badge status-approved">مقبول ✓</span>';
                } else if (task.submission_status === 'rejected') {
                    statusBadge = '<span class="status-badge status-rejected">مرفوض ✗</span>';
                } else if (task.submission_status === 'submitted') {
                    statusBadge = '<span class="status-badge status-pending">بانتظار التصحيح</span>';
                } else {
                    statusBadge = '<span class="status-badge status-new">لم يُسلَّم</span>';
                }

                html += `<div class="student-task-row">
                    <div class="student-task-info">
                        <span class="task-type-badge">${typeLabel}</span>
                        <strong>${task.title}</strong>
                        <span>🏆 ${task.points}</span>
                    </div>
                    ${statusBadge}
                </div>`;
            });
            html += '</div>';
        }

        contentEl.innerHTML = html;
    } catch (error) {
        contentEl.innerHTML = `<p class="empty-state">${error.message}</p>`;
    }
}

// ===================================
// TASK MANAGEMENT
// ===================================

export function toggleAssignMode(mode) {
    const container = document.getElementById('student-select-container');
    if (mode === 'select') {
        container.classList.remove('hidden');
    } else {
        container.classList.add('hidden');
    }
}

export async function handleDeleteBatch(ids, title, count) {
    if (!confirm(`حذف "${title}" لـ ${count} طالب؟\nلا يمكن التراجع عن هذا الإجراء.`)) return;
    const token = localStorage.getItem(config.apiTokenKey);
    let deleted = 0;
    for (const id of ids) {
        try {
            const res = await fetch(`${config.apiBaseUrl}/api/tasks/${id}/`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok || res.status === 204) deleted++;
        } catch (_) {}
    }
    showNotification(`تم حذف ${deleted} مهمة`, deleted === ids.length ? 'success' : 'error');
    loadTeacherDashboard();
}

export async function handleDeleteAllTasks() {
    if (!confirm('⚠️ تحذير خطير!\nهل أنت متأكد تماماً أنك تريد حذف جميع المهام؟\nهذا الإجراء سيحذف كل المهام وكل التسليمات المرتبطة بها ولا يمكن التراجع عنه.')) {
        return;
    }

    const token = localStorage.getItem(config.apiTokenKey);
    if (!token) return;

    try {
        const response = await authFetch(`${config.apiBaseUrl}/api/admin/tasks/delete-all/`, {
            method: 'POST',
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.detail || 'خطأ في حذف المهام');
        }

        const result = await response.json();
        showNotification(result.detail, 'success');
        loadTeacherDashboard();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

export async function handleCreateTask(event) {
    event.preventDefault();
    const token = localStorage.getItem(config.apiTokenKey);
    if (!token) return;

    const assignMode = document.querySelector('input[name="assign-mode"]:checked')?.value || 'all';
    const studentIds = [];
    if (assignMode === 'select') {
        document.querySelectorAll('input[name="student-ids"]:checked').forEach(cb => {
            studentIds.push(parseInt(cb.value));
        });
        if (!studentIds.length) {
            showNotification('يرجى اختيار طالب واحد على الأقل', 'error');
            return;
        }
    }

    const body = {
        title: document.getElementById('task-title').value.trim(),
        description: document.getElementById('task-description').value.trim(),
        task_type: document.getElementById('task-type').value,
        points: parseInt(document.getElementById('task-points').value) || 0,
        due_date: document.getElementById('task-due-date').value || null,
        assign_all: assignMode === 'all',
        student_ids: studentIds,
    };

    try {
        const response = await fetch(`${config.apiBaseUrl}/api/tasks/create/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.detail || 'خطأ في إنشاء المهمة');
        }

        showNotification('تم إنشاء المهمة بنجاح!', 'success');
        document.getElementById('teacher-create-task-form').reset();
        document.getElementById('student-select-container')?.classList.add('hidden');
        loadTeacherDashboard();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// ===================================
// GRADE MODAL (approbation avec emoji)
// ===================================

export function openGradeModal(submissionId, studentName, taskTitle) {
    _pendingGradeSubmissionId = submissionId;
    _selectedGrade = null;

    const subtitle = document.getElementById('grade-modal-subtitle');
    if (subtitle) subtitle.textContent = `${studentName} — ${taskTitle}`;

    const label = document.getElementById('grade-label');
    if (label) label.textContent = '';

    const confirmBtn = document.getElementById('grade-confirm-btn');
    if (confirmBtn) confirmBtn.disabled = true;

    // Réinitialiser les boutons emoji
    document.querySelectorAll('[data-grade]').forEach(btn => {
        btn.style.border = '2px solid transparent';
        btn.style.transform = 'scale(1)';
    });

    const modal = document.getElementById('grade-modal');
    if (modal) { modal.style.display = 'flex'; }
}

export function closeGradeModal() {
    const modal = document.getElementById('grade-modal');
    if (modal) modal.style.display = 'none';
    _pendingGradeSubmissionId = null;
    _selectedGrade = null;
}

export function selectGrade(grade) {
    _selectedGrade = grade;

    // Mettre en surbrillance le bouton sélectionné
    document.querySelectorAll('[data-grade]').forEach(btn => {
        const g = parseInt(btn.dataset.grade);
        if (g === grade) {
            btn.style.border = '2px solid var(--color-primary, #6366f1)';
            btn.style.transform = 'scale(1.2)';
        } else {
            btn.style.border = '2px solid transparent';
            btn.style.transform = 'scale(1)';
        }
    });

    const info = GRADE_LABELS[grade];
    const label = document.getElementById('grade-label');
    if (label) label.textContent = `${info.emoji} ${info.text}`;

    const confirmBtn = document.getElementById('grade-confirm-btn');
    if (confirmBtn) confirmBtn.disabled = false;
}

export async function confirmGrade() {
    if (!_pendingGradeSubmissionId || !_selectedGrade) return;
    const submissionId = _pendingGradeSubmissionId;
    const grade = _selectedGrade;
    closeGradeModal();
    await approveSubmission(submissionId, grade);
}

export async function approveSubmission(submissionId, grade) {
    const token = localStorage.getItem(config.apiTokenKey);
    if (!token) return;

    const gradeInfo = grade ? GRADE_LABELS[grade] : null;
    const feedback = gradeInfo ? `${gradeInfo.emoji} ${gradeInfo.text} (${grade}/5)` : '';

    try {
        const response = await authFetch(`${config.apiBaseUrl}/api/submissions/${submissionId}/approve/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ feedback }),
        });

        if (!response.ok) throw new Error('فشل القبول');
        const gradeText = gradeInfo ? ` — ${gradeInfo.emoji} ${gradeInfo.text}` : '';
        showNotification(`تم قبول التسليم!${gradeText}`, 'success');
        loadTeacherDashboard();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// ===================================
// REJECT MODAL
// ===================================

export function openRejectModal(submissionId, studentName) {
    _pendingRejectSubmissionId = submissionId;

    const subtitle = document.getElementById('reject-modal-subtitle');
    if (subtitle) subtitle.textContent = `رفض تسليم الطالب: ${studentName}`;

    const textarea = document.getElementById('reject-feedback');
    if (textarea) textarea.value = '';

    const modal = document.getElementById('reject-modal');
    if (modal) modal.style.display = 'flex';
}

export function closeRejectModal() {
    const modal = document.getElementById('reject-modal');
    if (modal) modal.style.display = 'none';
    _pendingRejectSubmissionId = null;
}

export async function confirmReject() {
    if (!_pendingRejectSubmissionId) return;
    const submissionId = _pendingRejectSubmissionId;
    const feedback = document.getElementById('reject-feedback')?.value?.trim() || '';
    closeRejectModal();
    await rejectSubmission(submissionId, feedback);
}

export async function rejectSubmission(submissionId, feedback) {
    const token = localStorage.getItem(config.apiTokenKey);
    if (!token) return;

    try {
        const response = await authFetch(`${config.apiBaseUrl}/api/submissions/${submissionId}/reject/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ feedback: feedback || '' }),
        });

        if (!response.ok) throw new Error('فشل الرفض');
        showNotification('تم رفض التسليم', 'success');
        loadTeacherDashboard();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// ===================================
// ADMIN — GESTION DES UTILISATEURS
// ===================================

export async function loadAdminUsersList() {
    const token = localStorage.getItem(config.apiTokenKey);
    if (!token) return;

    try {
        const response = await fetch(`${config.apiBaseUrl}/api/admin/users/`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) throw new Error('فشل تحميل قائمة المستخدمين');

        const data = await response.json();
        renderAdminUsersList(data.users);
    } catch (error) {
        Logger.error('ADMIN', 'Failed to load users list', error);
        const usersListEl = document.getElementById('admin-users-list');
        if (usersListEl) {
            usersListEl.innerHTML = '<p class="empty-state">فشل تحميل القائمة</p>';
        }
    }
}

export function renderAdminUsersList(users) {
    const usersListEl = document.getElementById('admin-users-list');
    if (!usersListEl) return;

    if (users.length === 0) {
        usersListEl.innerHTML = '<p class="empty-state">لا يوجد مستخدمون</p>';
        return;
    }

    let html = '';
    users.forEach(user => {
        const roleClass = user.is_superuser ? 'admin' : user.role;
        const roleText = user.is_superuser ? 'مدير' : (user.role === 'teacher' ? 'أستاذ' : 'طالب');
        const roleBadge = `<span class="user-badge ${roleClass}">${roleText}</span>`;

        html += `
            <div class="dashboard-item">
                <div class="item-info">
                    <div class="item-title">${user.username}${roleBadge}</div>
                    <div class="item-subtitle">
                        ${user.first_name} ${user.last_name} •
                        ${new Date(user.date_joined).toLocaleDateString('ar-SA')}
                    </div>
                </div>
                <div class="item-actions">
                    <button class="btn btn-sm btn-secondary" onclick="QuranReview.openUserEditModal(${user.id}, '${user.username}', '${user.first_name}', '${user.last_name}', '${user.role}', ${user.is_superuser})">✏️ تعديل</button>
                    ${user.id !== state.user?.id ? `<button class="btn btn-sm btn-danger" onclick="QuranReview.deleteUser(${user.id}, '${user.username}')">🗑️ حذف</button>` : ''}
                </div>
            </div>
        `;
    });

    usersListEl.innerHTML = html;
}

export async function handleUpdateUser(event) {
    event.preventDefault();

    const userId = document.getElementById('edit-user-id').value;
    const firstName = document.getElementById('edit-first-name').value.trim();
    const lastName = document.getElementById('edit-last-name').value.trim();
    const role = document.getElementById('edit-role').value;
    const isSuperuser = document.getElementById('edit-is-superuser').checked;

    const errorEl = document.getElementById('user-edit-error');
    const successEl = document.getElementById('user-edit-success');
    const token = localStorage.getItem(config.apiTokenKey);

    errorEl?.classList.add('hidden');
    successEl?.classList.add('hidden');

    try {
        const response = await fetch(`${config.apiBaseUrl}/api/admin/users/${userId}/update/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                first_name: firstName,
                last_name: lastName,
                role: role,
                is_superuser: isSuperuser,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'خطأ في تحديث المستخدم');
        }

        Logger.log('ADMIN', `User updated: ${data.username}`);
        if (successEl) {
            successEl.textContent = `✅ تم تحديث بيانات "${data.username}" بنجاح`;
            successEl.classList.remove('hidden');
        }

        // Fermer le modal après 2 secondes
        setTimeout(() => {
            window.QuranReview && window.QuranReview.closeUserEditModal();
            loadAdminUsersList();
        }, 2000);

        showNotification('تم تحديث بيانات المستخدم بنجاح', 'success');
    } catch (error) {
        Logger.error('ADMIN', 'Update user failed', error);
        if (errorEl) {
            errorEl.textContent = error.message;
            errorEl.classList.remove('hidden');
        }
    }
}

export async function deleteUser(userId, username) {
    if (!confirm(`هل أنت متأكد من حذف المستخدم "${username}"؟\nهذا الإجراء لا يمكن التراجع عنه.`)) {
        return;
    }

    const token = localStorage.getItem(config.apiTokenKey);

    try {
        const response = await fetch(`${config.apiBaseUrl}/api/admin/users/${userId}/delete/`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'خطأ في حذف المستخدم');
        }

        Logger.log('ADMIN', `User deleted: ${username}`);
        showNotification(`تم حذف "${username}" بنجاح`, 'success');
        loadAdminUsersList();
    } catch (error) {
        Logger.error('ADMIN', 'Delete user failed', error);
        showNotification(error.message, 'error');
    }
}

// ===================================
// ADMIN — CREATE / PROMOTE TEACHER
// ===================================

export async function handleCreateTeacher(event) {
    event.preventDefault();
    const username = document.getElementById('teacher-new-username').value.trim();
    const firstName = document.getElementById('teacher-new-firstname').value.trim();
    const lastName = document.getElementById('teacher-new-lastname').value.trim();
    const password = document.getElementById('teacher-new-password').value;
    const errorEl = document.getElementById('admin-create-error');
    const successEl = document.getElementById('admin-create-success');
    const token = localStorage.getItem(config.apiTokenKey);

    errorEl?.classList.add('hidden');
    successEl?.classList.add('hidden');

    Logger.log('AUTH', `Admin creating teacher: ${username}`);

    try {
        const response = await fetch(`${config.apiBaseUrl}/api/admin/create-teacher/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ username, password, first_name: firstName, last_name: lastName }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'خطأ في إنشاء الحساب');
        }

        Logger.log('AUTH', `Teacher created: ${data.username} (${data.action})`);
        if (successEl) {
            successEl.textContent = `✅ تم إنشاء حساب الأستاذ "${data.username}" بنجاح`;
            successEl.classList.remove('hidden');
        }
        document.getElementById('admin-create-teacher-form').reset();
        showNotification('تم إنشاء حساب الأستاذ بنجاح', 'success');
        loadAdminUsersList();
    } catch (error) {
        Logger.error('AUTH', 'Create teacher failed', error);
        if (errorEl) {
            errorEl.textContent = error.message;
            errorEl.classList.remove('hidden');
        }
    }
}

export async function handlePromoteTeacher(event) {
    event.preventDefault();
    const username = document.getElementById('promote-username').value.trim();
    const errorEl = document.getElementById('admin-promote-error');
    const successEl = document.getElementById('admin-promote-success');
    const token = localStorage.getItem(config.apiTokenKey);

    errorEl?.classList.add('hidden');
    successEl?.classList.add('hidden');

    Logger.log('AUTH', `Admin promoting user to teacher: ${username}`);

    try {
        const response = await fetch(`${config.apiBaseUrl}/api/admin/create-teacher/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ username, promote: true }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'خطأ في الترقية');
        }

        Logger.log('AUTH', `User promoted: ${data.username} → ${data.role}`);
        if (successEl) {
            successEl.textContent = `✅ تم ترقية "${data.username}" إلى أستاذ بنجاح`;
            successEl.classList.remove('hidden');
        }
        document.getElementById('admin-promote-form').reset();
        showNotification(`تم ترقية ${data.username} إلى أستاذ`, 'success');
        loadAdminUsersList();
    } catch (error) {
        Logger.error('AUTH', 'Promote teacher failed', error);
        if (errorEl) {
            errorEl.textContent = error.message;
            errorEl.classList.remove('hidden');
        }
    }
}
