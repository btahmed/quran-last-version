// frontend/src/pages/admin/AdminStatsSection.js
// Section Statistiques (Vue globale) — extraite d'AdminPage.js (Task 8 : lazy-loading)
import { Logger } from '../../core/logger.js';
import * as supabaseAdmin from '../../services/supabase-admin.js';

// ─── UTILS ───────────────────────────────────────────────────────────────────
function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ─── RENDER ──────────────────────────────────────────────────────────────────
export function render() {
    return `
        <section class="k-section" id="admin-month-story-section" style="display:none">
            <div class="month-story-card" id="admin-month-story"></div>
        </section>
        <section class="k-section" id="admin-funnel-section" style="display:none">
            <h3 class="k-section-title">📊 مسار المهام</h3>
            <div class="funnel" id="admin-funnel"></div>
        </section>
        <section class="k-section">
            <h3 class="k-section-title">👨‍🏫 إحصائيات المعلمين</h3>
            <div id="admin-teacher-stats" class="k-grid2">
                <div class="skeleton skeleton-card"></div>
                <div class="skeleton skeleton-card"></div>
            </div>
        </section>
        <section class="k-section">
            <h3 class="k-section-title">📋 آخر المهام</h3>
            <div id="admin-all-tasks" class="k-stack">
                <div class="skeleton skeleton-card"></div>
                <div class="skeleton skeleton-card"></div>
            </div>
        </section>
    `;
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
export async function init() {
    await loadOverview();
    await loadMonthStory();
}

// ─── CHARGEMENT VUE GLOBALE ───────────────────────────────────────────────────
export async function loadOverview() {
    try {
        const [overviewRes, statsRes] = await Promise.all([
            supabaseAdmin.getAdminOverview(),
            supabaseAdmin.getTeacherStatsAndTasks(),
        ]);

        if (!overviewRes.error) {
            const set = (id, v) => {
                const el = document.getElementById(id);
                if (el) el.textContent = v;
            };
            set('admin-total-tasks', overviewRes.data?.total_tasks ?? '—');
            set('admin-pending-subs', overviewRes.data?.pending_submissions ?? '—');
            set('admin-approved-subs', overviewRes.data?.approved_submissions ?? '—');
            renderFunnel(overviewRes.data);
        }

        renderTeacherStats(statsRes.teacherStats || []);
        renderAllTasks(statsRes.recentTasks || []);
    } catch (err) {
        Logger.error('ADMIN-STATS', 'loadOverview error', err);
    }
}

// ─── قصة الشهر (rapport mensuel — comptages réels sur submissions) ───────────
async function loadMonthStory() {
    const section = document.getElementById('admin-month-story-section');
    const host = document.getElementById('admin-month-story');
    if (!section || !host) return;

    try {
        const { data, error } = await supabaseAdmin.getMonthlyReport();
        if (error || !data || !data.recorded) {
            section.style.display = 'none';
            return;
        }
        section.style.display = '';
        host.innerHTML = `
            <div class="msc-title">📊 قصة هذا الشهر</div>
            <div class="msc-sub">${escapeHtml(data.month_label)} · تقرير مبني على بيانات حقيقية</div>
            <div class="msc-row"><span>🎧 سُجّلت</span><strong>${data.recorded}</strong></div>
            <div class="msc-row"><span>✅ صُحّحت</span><strong>${data.approved}</strong></div>
            <div class="msc-row"><span>🔁 مرفوضة</span><strong>${data.rejected}</strong></div>
            <div class="msc-row"><span>⏳ بانتظار التصحيح</span><strong>${data.pending}</strong></div>
            <div class="msc-row"><span>🌟 ممتاز</span><strong>${data.excellent}</strong></div>
        `;
    } catch (err) {
        Logger.error('ADMIN-STATS', 'loadMonthStory error', err);
        section.style.display = 'none';
    }
}

// ─── ENTONNOIR DES MHAM (mesures réelles, pas de placeholder) ────────────────
function renderFunnel(data) {
    const section = document.getElementById('admin-funnel-section');
    const el = document.getElementById('admin-funnel');
    if (!el || !section) return;

    const total = parseInt(data?.total_tasks, 10) || 0;
    const pending = parseInt(data?.pending_submissions, 10) || 0;
    const approved = parseInt(data?.approved_submissions, 10) || 0;

    if (!total) {
        section.style.display = 'none';
        return;
    }
    section.style.display = '';
    el.innerHTML = `
        <div class="bar">📋 إجمالي المهام — ${total}</div>
        <div class="bar">⏳ بانتظار التصحيح — ${pending}</div>
        <div class="bar">✅ مقبولة — ${approved}</div>
    `;
}

// ─── RENDU STATISTIQUES ENSEIGNANTS ──────────────────────────────────────────
function renderTeacherStats(teachers) {
    const el = document.getElementById('admin-teacher-stats');
    if (!el) return;

    if (!teachers.length) {
        el.innerHTML =
            '<p style="text-align:center; color:var(--color-text-secondary);">لا يوجد معلمون</p>';
        return;
    }

    el.innerHTML = teachers
        .map(
            t => `
        <div class="k-task-card">
            <div class="k-task-card-header">
                <div>
                    <h3 class="k-task-card-title">👨‍🏫 ${escapeHtml(t.first_name || '')} ${escapeHtml(t.last_name || '')}</h3>
                    <p class="k-task-card-desc">@${escapeHtml(t.username)}</p>
                </div>
            </div>
            <div class="k-task-card-meta">
                <span class="k-chip k-chip--info">${parseInt(t.assigned_tasks, 10) || 0} مهمة</span>
                ${
                    t.pending_submissions > 0
                        ? `<span class="k-chip k-chip--warning">${parseInt(t.pending_submissions, 10)} انتظار</span>`
                        : ''
                }
            </div>
        </div>
    `
        )
        .join('');
}

// ─── RENDU DERNIÈRES TÂCHES ───────────────────────────────────────────────────
function renderAllTasks(tasks) {
    const el = document.getElementById('admin-all-tasks');
    if (!el) return;

    if (!tasks.length) {
        el.innerHTML = '<p class="k-empty">لا توجد مهام</p>';
        return;
    }

    const dotClass = {
        pending: 'k-dot--pending',
        submitted: 'k-dot--new',
        completed: 'k-dot--done',
        approved: 'k-dot--done',
        rejected: 'k-dot--missed',
    };

    el.innerHTML = tasks
        .slice(0, 50)
        .map(t => {
            const dot = dotClass[t.status] || 'k-dot--pending';
            const teacher = t.teacher ? '@' + escapeHtml(t.teacher.username) : '';
            const student = t.student ? escapeHtml(t.student.first_name || t.student.username) : '';
            const route = teacher && student ? `${teacher} ← ${student}` : teacher || student;
            const pointsEl = t.points
                ? `<span class="k-chip k-chip--primary">${parseInt(t.points, 10)}+</span>`
                : '';
            return `
        <div class="k-row">
            <div class="rl">
                <span class="k-dot ${dot}"></span>
                <div>
                    <div class="name">${escapeHtml(t.title)}</div>
                    ${route ? `<div class="meta">${route}</div>` : ''}
                </div>
            </div>
            ${pointsEl}
        </div>`;
        })
        .join('');

    if (tasks.length > 50) {
        el.innerHTML += `<p class="k-empty">عرض 50 من ${tasks.length}</p>`;
    }
}
