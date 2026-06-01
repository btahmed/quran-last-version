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
        <div class="card-glass-pro" style="margin-bottom:var(--space-4);">
            <h3 style="font-size:1rem; font-weight:600; margin-bottom:var(--space-4);">👨‍🏫 إحصائيات المعلمين</h3>
            <div id="admin-teacher-stats">
                <p style="text-align:center; color:var(--color-text-secondary);">جارٍ التحميل...</p>
            </div>
        </div>
        <div class="card-glass-pro">
            <h3 style="font-size:1rem; font-weight:600; margin-bottom:var(--space-4);">📋 آخر المهام (50)</h3>
            <div id="admin-all-tasks">
                <p style="text-align:center; color:var(--color-text-secondary);">جارٍ التحميل...</p>
            </div>
        </div>
    `;
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
export async function init() {
    await loadOverview();
}

// ─── CHARGEMENT VUE GLOBALE ───────────────────────────────────────────────────
export async function loadOverview() {
    try {
        const [overviewRes, statsRes] = await Promise.all([
            supabaseAdmin.getAdminOverview(),
            supabaseAdmin.getTeacherStatsAndTasks(),
        ]);

        if (!overviewRes.error) {
            const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
            set('admin-total-tasks',   overviewRes.data?.total_tasks          ?? '—');
            set('admin-pending-subs',  overviewRes.data?.pending_submissions  ?? '—');
            set('admin-approved-subs', overviewRes.data?.approved_submissions ?? '—');
        }

        renderTeacherStats(statsRes.teacherStats || []);
        renderAllTasks(statsRes.recentTasks     || []);
    } catch (err) {
        Logger.error('ADMIN-STATS', 'loadOverview error', err);
    }
}

// ─── RENDU STATISTIQUES ENSEIGNANTS ──────────────────────────────────────────
function renderTeacherStats(teachers) {
    const el = document.getElementById('admin-teacher-stats');
    if (!el) return;

    if (!teachers.length) {
        el.innerHTML = '<p style="text-align:center; color:var(--color-text-secondary);">لا يوجد معلمون</p>';
        return;
    }

    el.innerHTML = `
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(220px,1fr)); gap:var(--space-3);">
            ${teachers.map(t => `
                <div style="padding:var(--space-3); background:var(--color-surface); border-radius:var(--radius-xl); border:1px solid var(--color-border);">
                    <div style="font-weight:600; margin-bottom:2px;">👨‍🏫 ${escapeHtml(t.first_name || '')} ${escapeHtml(t.last_name || '')}</div>
                    <div style="font-size:0.8rem; color:var(--color-text-secondary); margin-bottom:var(--space-2);">@${escapeHtml(t.username)}</div>
                    <div style="display:flex; gap:var(--space-2); flex-wrap:wrap;">
                        <span style="font-size:0.8rem; background:rgba(59,130,246,0.1); color:#3b82f6; padding:2px 8px; border-radius:99px;">${parseInt(t.assigned_tasks, 10) || 0} مهمة</span>
                        ${t.pending_submissions > 0 ? `<span style="font-size:0.8rem; background:rgba(245,158,11,0.1); color:#f59e0b; padding:2px 8px; border-radius:99px;">${parseInt(t.pending_submissions, 10)} انتظار</span>` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// ─── RENDU DERNIÈRES TÂCHES ───────────────────────────────────────────────────
function renderAllTasks(tasks) {
    const el = document.getElementById('admin-all-tasks');
    if (!el) return;

    if (!tasks.length) {
        el.innerHTML = '<p style="text-align:center; color:var(--color-text-secondary);">لا توجد مهام</p>';
        return;
    }

    const statusLabel = { pending: '⏳', submitted: '📤', completed: '✅', approved: '✅', rejected: '❌' };
    const statusColor = { pending: '#f59e0b', submitted: '#3b82f6', completed: '#10b981', approved: '#10b981', rejected: '#ef4444' };

    el.innerHTML = tasks.slice(0, 50).map(t => `
        <div style="display:flex; align-items:center; gap:var(--space-2); padding:var(--space-2) 0; border-bottom:1px solid var(--color-border);">
            <span style="flex-shrink:0; color:${statusColor[t.status] || '#999'};">${statusLabel[t.status] || ''}</span>
            <div style="flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:0.875rem;">${escapeHtml(t.title)}</div>
            <div style="font-size:0.75rem; color:var(--color-text-secondary); white-space:nowrap; flex-shrink:0;">
                ${t.teacher ? '@' + escapeHtml(t.teacher.username) : ''} → ${t.student ? escapeHtml(t.student.first_name || t.student.username) : ''}
            </div>
            ${t.points ? `<span style="font-size:0.75rem; color:var(--color-gold); flex-shrink:0;">+${parseInt(t.points, 10)}</span>` : ''}
        </div>
    `).join('');

    if (tasks.length > 50) {
        el.innerHTML += `<p style="text-align:center; color:var(--color-text-secondary); padding:var(--space-3); font-size:0.8rem;">عرض 50 من ${tasks.length}</p>`;
    }
}
