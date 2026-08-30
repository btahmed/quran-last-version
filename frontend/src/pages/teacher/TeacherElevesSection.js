// frontend/src/pages/teacher/TeacherElevesSection.js
// Section Élèves — extraite de TeacherPage.js (Task 9 : lazy-loading)
// Responsabilités : liste des élèves, panneau de progression détaillée par élève
import { Logger } from '../../core/logger.js';
import { apiCache } from '../../core/apiCache.js';
import * as supabaseAdmin from '../../services/supabase-admin.js';
import { mountStudentRadar } from '../../components/StudentRadar.js';

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

// ─── RENDER ──────────────────────────────────────────────────────────────────

export function render() {
    return `
        <!-- Liste des élèves -->
        <section class="k-section">
            <h3 class="k-section-title">🎓 قائمة الطلاب</h3>
            <div id="teacher-students-list" class="k-stack">
                <div class="skeleton skeleton-card"></div>
                <div class="skeleton skeleton-card"></div>
                <div class="skeleton skeleton-card"></div>
            </div>
        </section>
    `;
    // student-detail-panel est statique dans index.html (hors #app) pour que position:fixed fonctionne
}

// ─── INIT ─────────────────────────────────────────────────────────────────────

export async function init() {
    Logger.log('TEACHER-ELEVES', 'init');

    // Délégation de clic sur la liste — ouvre le détail élève (StudentRadar
    // n'affiche que la relance/le score, pas de clic-carte intégré à son API).
    const studentsList = document.getElementById('teacher-students-list');
    studentsList?.addEventListener('click', e => {
        if (e.target.closest('.radar-action')) return; // le bouton "ذكّره" gère son propre clic
        const card = e.target.closest('.radar-card');
        if (!card) return;
        const id = card.dataset.studentId;
        const name = card.querySelector('.name')?.textContent?.trim();
        if (id) viewStudentProgress(id, name);
    });

    await _loadStudents();
}

// ─── CHARGEMENT DE LA LISTE DES ÉLÈVES ────────────────────────────────────────

async function _loadStudents() {
    const studentsList = document.getElementById('teacher-students-list');
    if (!studentsList) return;

    try {
        // Toujours récupérer des données fraîches — les points/soumissions changent souvent
        const { data: freshStudents, submissions } = await supabaseAdmin.getMyStudents();
        const students = freshStudents || [];
        apiCache.set('my-students', students);

        if (!students.length) {
            studentsList.innerHTML = '<p class="empty-state">لا يوجد طلاب بعد</p>';
            return;
        }
        // Pas de onRemind : aucune méthode de rappel n'existe encore dans la façade
        // (voir INTEGRATION.md) — le bouton "ذكّره" reste donc masqué, jamais inactif.
        mountStudentRadar('teacher-students-list', students, submissions || []);
    } catch (err) {
        Logger.error('TEACHER-ELEVES', 'Erreur chargement élèves', err);
        if (studentsList) {
            studentsList.innerHTML =
                '<p class="empty-state" style="color:var(--color-danger);">فشل تحميل قائمة الطلاب</p>';
        }
    }
}

// ─── DÉTAIL DE PROGRESSION D'UN ÉLÈVE ────────────────────────────────────────

export async function viewStudentProgress(studentId, studentName) {
    const panel = document.getElementById('student-detail-panel');
    const nameEl = document.getElementById('student-detail-name');
    const contentEl = document.getElementById('student-detail-content');

    if (!panel || !nameEl || !contentEl) return;

    nameEl.textContent = `📊 تقدم الطالب: ${studentName}`;
    contentEl.innerHTML = '<p class="empty-state">جاري التحميل...</p>';
    panel.classList.remove('hidden');
    panel.classList.add('active');

    try {
        // Cache 60 s — évite les re-fetch quand le prof consulte plusieurs fois le même élève
        const cacheKey = `student-progress-${studentId}`;
        let data = apiCache.get(cacheKey);
        if (!data) {
            const result = await supabaseAdmin.getStudentProgress(studentId);
            if (result.error) throw new Error('فشل تحميل بيانات الطالب');
            data = result.data;
            apiCache.set(cacheKey, data);
        }

        let html = `<div class="student-detail-stats">
            <div class="stat-mini"><strong>🏆</strong> ${data.totalPoints ?? 0} نقطة</div>
        </div>`;

        if (!data.tasks.length) {
            html += '<p class="empty-state">لا توجد مهام معينة</p>';
        } else {
            html += '<div class="student-tasks-progress">';
            data.tasks.forEach(task => {
                const TYPE_LABELS = {
                    hifz: 'حفظ',
                    tasmi: 'تسميع',
                    muraja: 'مراجعة',
                    tilawa: 'تلاوة',
                };
                const typeLabel = TYPE_LABELS[task.type] || task.type || 'مهمة';
                let statusBadge;
                if (task.submission_status === 'approved') {
                    statusBadge = '<span class="status-badge status-approved">مقبول ✓</span>';
                } else if (task.submission_status === 'rejected') {
                    statusBadge = '<span class="status-badge status-rejected">مرفوض ✗</span>';
                } else if (task.submission_status === 'submitted') {
                    statusBadge =
                        '<span class="status-badge status-pending">بانتظار التصحيح</span>';
                } else {
                    statusBadge = '<span class="status-badge status-new">لم يُسلَّم</span>';
                }

                // Points réels attribués (awarded_points) ou max de la tâche si pas encore noté
                let pointsHtml;
                if (task.submission_status === 'approved' && task.awarded_points != null) {
                    // Extraire l'emoji de notation depuis admin_feedback (ex: "🌟 ممتاز (5/5)")
                    const gradeEmoji = task.admin_feedback
                        ? escapeHtml(task.admin_feedback.split(' ')[0])
                        : '';
                    pointsHtml = `<span style="font-weight:600;color:var(--color-success)">🏆 ${escapeHtml(String(task.awarded_points))} نقطة${gradeEmoji ? ' ' + gradeEmoji : ''}</span>`;
                } else {
                    pointsHtml = `<span style="color:var(--color-text-secondary)">🏆 ${escapeHtml(String(task.points))} نقطة</span>`;
                }

                html += `<div class="student-task-row">
                    <div class="student-task-info">
                        <span class="task-type-badge">${escapeHtml(typeLabel)}</span>
                        <strong>${escapeHtml(task.title)}</strong>
                        ${pointsHtml}
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
