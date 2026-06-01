// frontend/src/pages/teacher/TeacherElevesSection.js
// Section Élèves — extraite de TeacherPage.js (Task 9 : lazy-loading)
// Responsabilités : liste des élèves, panneau de progression détaillée par élève
import { config }           from '../../core/config.js';
import { showNotification } from '../../core/ui.js';
import { Logger }           from '../../core/logger.js';
import { apiCache }         from '../../core/apiCache.js';
import * as supabaseAdmin   from '../../services/supabase-admin.js';

// ─── UTILS ───────────────────────────────────────────────────────────────────

function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function escapeJs(text) {
    if (!text) return '';
    return String(text)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r');
}

// ─── RENDER ──────────────────────────────────────────────────────────────────

export function render() {
    return `
        <!-- Liste des élèves -->
        <div class="card-glass-pro" style="margin-bottom: var(--space-6);">
            <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: var(--space-4);">🎓 قائمة الطلاب</h3>
            <div id="teacher-students-list">
                <div class="skeleton skeleton-line"></div>
                <div class="skeleton skeleton-line"></div>
                <div class="skeleton skeleton-line short"></div>
                <div class="skeleton skeleton-line"></div>
                <div class="skeleton skeleton-line short"></div>
            </div>
        </div>

        <!-- Panneau de détail de progression d'un élève (caché par défaut) -->
        <div id="student-detail-panel" class="card-glass-pro hidden" style="margin-bottom: var(--space-6);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4);">
                <h3 id="student-detail-name" style="font-size: 1.125rem; font-weight: 600;">📊 تقدم الطالب</h3>
                <button class="btn btn-outline-glow btn-sm" onclick="document.getElementById('student-detail-panel').classList.add('hidden')">✕ إغلاق</button>
            </div>
            <div id="student-detail-content">
                <p class="empty-state">جاري التحميل...</p>
            </div>
        </div>
    `;
}

// ─── INIT ─────────────────────────────────────────────────────────────────────

export async function init() {
    Logger.log('TEACHER-ELEVES', 'init');
    await _loadStudents();
}

// ─── CHARGEMENT DE LA LISTE DES ÉLÈVES ────────────────────────────────────────

async function _loadStudents() {
    const studentsList = document.getElementById('teacher-students-list');
    if (!studentsList) return;

    try {
        const cachedStudents = apiCache.get('my-students');
        const students = cachedStudents || (await supabaseAdmin.getMyStudents()).data || [];

        if (!cachedStudents) apiCache.set('my-students', students);

        _renderStudentsList(students);
    } catch (err) {
        Logger.error('TEACHER-ELEVES', 'Erreur chargement élèves', err);
        if (studentsList) {
            studentsList.innerHTML = '<p class="empty-state" style="color:var(--color-danger);">فشل تحميل قائمة الطلاب</p>';
        }
    }
}

function _renderStudentsList(students) {
    const studentsList = document.getElementById('teacher-students-list');
    if (!studentsList) return;

    if (!students.length) {
        studentsList.innerHTML = '<p class="empty-state">لا يوجد طلاب بعد</p>';
        return;
    }

    studentsList.innerHTML = students.map(s => {
        const safeName     = escapeHtml(s.first_name || s.username);
        const safeNameAttr = escapeHtml(escapeJs(s.first_name || s.username));
        return `<div class="student-card clickable" onclick="QuranReview.viewStudentProgress('${s.id}', '${safeNameAttr}')">
            <div class="student-card-name">🎓 ${safeName}</div>
            <div class="student-card-stats">
                <span>🏆 ${escapeHtml(String(s.total_points ?? '—'))} نقطة</span>
                <span>📝 ${escapeHtml(String(s.submissions_count ?? '—'))} تسليم</span>
            </div>
            <span class="student-card-arrow">←</span>
        </div>`;
    }).join('');
}

// ─── DÉTAIL DE PROGRESSION D'UN ÉLÈVE ────────────────────────────────────────

export async function viewStudentProgress(studentId, studentName) {
    const token = localStorage.getItem(config.apiTokenKey);
    if (!token) return;

    const panel    = document.getElementById('student-detail-panel');
    const nameEl   = document.getElementById('student-detail-name');
    const contentEl = document.getElementById('student-detail-content');

    if (!panel || !nameEl || !contentEl) return;

    nameEl.textContent   = `📊 تقدم الطالب: ${studentName}`;
    contentEl.innerHTML  = '<p class="empty-state">جاري التحميل...</p>';
    panel.classList.remove('hidden');

    try {
        const { data, error } = await supabaseAdmin.getStudentProgress(studentId);
        if (error) throw new Error('فشل تحميل بيانات الطالب');

        let html = `<div class="student-detail-stats">
            <div class="stat-mini"><strong>🏆</strong> ${data.totalPoints ?? 0} نقطة</div>
        </div>`;

        if (!data.tasks.length) {
            html += '<p class="empty-state">لا توجد مهام معينة</p>';
        } else {
            html += '<div class="student-tasks-progress">';
            data.tasks.forEach(task => {
                const typeLabel = task.type || 'مهمة';
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
                        <span class="task-type-badge">${escapeHtml(typeLabel)}</span>
                        <strong>${escapeHtml(task.title)}</strong>
                        <span>🏆 ${escapeHtml(String(task.points))}</span>
                    </div>
                    ${statusBadge}
                </div>`;
            });
            html += '</div>';
        }

        contentEl.innerHTML = html;
    } catch (error) {
        contentEl.innerHTML = `<p class="empty-state">${escapeHtml(error.message)}</p>`;
    }
}
