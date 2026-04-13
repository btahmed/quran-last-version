// frontend/src/pages/AdminPage.js
import { config } from '../core/config.js';
import { Logger } from '../core/logger.js';
import * as supabaseAdmin from '../services/supabase-admin.js';

// ─── UTILS ───────────────────────────────────────────────────────────────────
function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ─── LOCAL STATE ─────────────────────────────────────────────────────────────
let allUsers = [];
let searchQuery = '';
let sortKey = 'role';

// ─── RENDER ──────────────────────────────────────────────────────────────────
export function render() {
    return `
        <div id="admin-page" class="page active">
            <section class="section-pro">
                <div class="container-pro">
                    <h2 class="section-title" style="text-align:center; margin-bottom:var(--space-6);">⚙️ لوحة الإدارة</h2>

                    <!-- Stats -->
                    <div class="grid-pro grid-cols-4" style="margin-bottom:var(--space-6);">
                        <div class="card-stat-premium" style="text-align:center;">
                            <div class="stat-value" id="admin-total-users">—</div>
                            <p style="color:var(--color-text-secondary);">المستخدمون</p>
                        </div>
                        <div class="card-stat-premium" style="text-align:center;">
                            <div class="stat-value" id="admin-total-tasks">—</div>
                            <p style="color:var(--color-text-secondary);">المهام</p>
                        </div>
                        <div class="card-stat-premium" style="text-align:center;">
                            <div class="stat-value" id="admin-pending-subs">—</div>
                            <p style="color:var(--color-text-secondary);">انتظار مراجعة</p>
                        </div>
                        <div class="card-stat-premium" style="text-align:center;">
                            <div class="stat-value" id="admin-approved-subs">—</div>
                            <p style="color:var(--color-text-secondary);">مقبول</p>
                        </div>
                    </div>

                    <!-- Onglets -->
                    <div style="display:flex; gap:var(--space-2); margin-bottom:var(--space-4); border-bottom:2px solid var(--color-border); padding-bottom:var(--space-2);">
                        <button id="tab-btn-users" class="btn btn-glow btn-sm" onclick="window._adminSwitchTab('users')">👥 المستخدمون</button>
                        <button id="tab-btn-classes" class="btn btn-outline-glow btn-sm" onclick="window._adminSwitchTab('classes')">🏫 الفصول</button>
                        <button id="tab-btn-overview" class="btn btn-outline-glow btn-sm" onclick="window._adminSwitchTab('overview')">📊 نظرة عامة</button>
                    </div>

                    <!-- Tab: Utilisateurs -->
                    <div id="admin-tab-users">
                        <div class="card-glass-pro">
                            <div style="display:flex; gap:var(--space-3); align-items:center; margin-bottom:var(--space-4); flex-wrap:wrap;">
                                <input id="admin-search" type="text"
                                    placeholder="🔍 بحث باسم أو اسم مستخدم..."
                                    style="flex:1; min-width:200px; padding:var(--space-2) var(--space-3); border-radius:var(--radius-lg); border:1px solid var(--color-border); background:var(--color-surface); color:var(--color-text);"
                                    oninput="window._adminFilter(this.value)" />
                                <select id="admin-sort"
                                    style="padding:var(--space-2) var(--space-3); border-radius:var(--radius-lg); border:1px solid var(--color-border); background:var(--color-surface); color:var(--color-text);"
                                    onchange="window._adminSort(this.value)">
                                    <option value="role">ترتيب: الدور</option>
                                    <option value="username">ترتيب: اسم المستخدم</option>
                                    <option value="name">ترتيب: الاسم</option>
                                </select>
                                <button class="btn btn-glow btn-sm" onclick="window._adminRefresh()">🔄 تحديث</button>
                            </div>
                            <div id="admin-users-count" style="color:var(--color-text-secondary); font-size:0.875rem; margin-bottom:var(--space-3);"></div>
                            <div id="admin-users-list">
                                <p style="text-align:center; color:var(--color-text-secondary); padding:var(--space-6);">جارٍ التحميل...</p>
                            </div>
                        </div>
                    </div>

                    <!-- Tab: Classes -->
                    <div id="admin-tab-classes" style="display:none;">
                        <div class="card-glass-pro" style="margin-bottom:var(--space-4);">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-4);">
                                <h3 style="font-size:1rem; font-weight:600; margin:0;">🏫 إدارة الفصول</h3>
                                <button class="btn btn-glow btn-sm" onclick="window._adminShowCreateClass()">➕ فصل جديد</button>
                            </div>
                            
                            <!-- Formulaire création classe (caché) -->
                            <div id="admin-create-class-form" style="display:none; background:var(--color-surface); border:1px solid var(--color-border); border-radius:var(--radius-lg); padding:var(--space-4); margin-bottom:var(--space-4);">
                                <div style="display:flex; gap:var(--space-3); align-items:flex-end; flex-wrap:wrap;">
                                    <div style="flex:1; min-width:200px;">
                                        <label style="font-size:0.75rem; color:var(--color-text-secondary); display:block; margin-bottom:var(--space-1);">اسم الفصل</label>
                                        <input id="new-class-name" type="text" placeholder="مثال: فصل الحفظ 1" style="width:100%; padding:var(--space-2) var(--space-3); border:1px solid var(--color-border); border-radius:var(--radius-lg); background:var(--color-bg); color:var(--color-text);" />
                                    </div>
                                    <div style="flex:1; min-width:200px;">
                                        <label style="font-size:0.75rem; color:var(--color-text-secondary); display:block; margin-bottom:var(--space-1);">المعلم</label>
                                        <select id="new-class-teacher" style="width:100%; padding:var(--space-2) var(--space-3); border:1px solid var(--color-border); border-radius:var(--radius-lg); background:var(--color-bg); color:var(--color-text);">
                                            <option value="">-- اختر المعلم --</option>
                                        </select>
                                    </div>
                                    <button class="btn btn-glow btn-sm" onclick="window._adminCreateClass()">✅ إنشاء</button>
                                    <button class="btn btn-outline-glow btn-sm" onclick="document.getElementById('admin-create-class-form').style.display='none'">إلغاء</button>
                                </div>
                            </div>
                            
                            <div id="admin-classes-list">
                                <p style="text-align:center; color:var(--color-text-secondary); padding:var(--space-6);">جارٍ التحميل...</p>
                            </div>
                        </div>
                    </div>

                    <!-- Tab: Vue globale -->
                    <div id="admin-tab-overview" style="display:none;">
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
                    </div>
                </div>
            </section>

            <!-- Modal profil -->
            <div id="admin-profile-modal"
                style="display:none; position:fixed; top:0; left:0; right:0; bottom:0; width:100%; height:100%; background:rgba(0,0,0,0.65); z-index:9999; overflow-y:auto;"
                onclick="if(event.target===this)window._adminCloseProfile()">
                <div style="position:relative; margin:40px auto; width:calc(100% - 32px); max-width:540px; background:#fff; border-radius:16px; box-shadow:0 24px 64px rgba(0,0,0,0.35); overflow:hidden;"
                    onclick="event.stopPropagation()">
                    <!-- Header modal -->
                    <div style="padding:20px 24px 16px; border-bottom:1px solid #e5e7eb; display:flex; justify-content:space-between; align-items:center;">
                        <h3 id="profile-modal-title" style="margin:0; font-size:1.1rem; font-weight:700; color:#111827;">الملف الشخصي</h3>
                        <button onclick="window._adminCloseProfile()"
                            style="display:inline-flex; align-items:center; justify-content:center; width:32px; height:32px; background:#f3f4f6; border:none; border-radius:8px; font-size:1.1rem; cursor:pointer; color:#6b7280; line-height:1;">✕</button>
                    </div>
                    <!-- Contenu -->
                    <div id="admin-profile-content" style="padding:20px 24px 24px;">
                        <p style="text-align:center; color:#6b7280; padding:24px 0;">جارٍ التحميل...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
export async function init() {
    window._adminSwitchTab = switchTab;
    window._adminFilter = (q) => { searchQuery = q.toLowerCase(); renderUsersList(); };
    window._adminSort = (k) => { sortKey = k; renderUsersList(); };
    window._adminRefresh = () => loadAll();
    window._adminOpenProfile = openUserProfile;
    window._adminCloseProfile = closeProfile;
    window._adminSaveEdit = saveUserEdit;
    window._adminDelete = deleteUser;
    window._adminToggleEdit = _adminToggleEditFn;
    window._adminShowCreateClass = showCreateClassForm;
    window._adminCreateClass = createClass;
    window._adminDeleteClass = deleteClass;
    window._adminOpenClassModal = openClassModal;
    window._adminCloseClassModal = closeClassModal;
    window._adminAddStudentToClass = addStudentToClass;
    window._adminRemoveStudentFromClass = removeStudentFromClass;

    // Listener délégué pour les lignes utilisateur (évite les onclick inline avec u.id)
    document.getElementById('admin-users-list')?.addEventListener('click', (e) => {
        const row = e.target.closest('.admin-user-row');
        if (!row) return;
        const id = Number(row.dataset.userId);
        if (!Number.isInteger(id) || id <= 0) return;
        openUserProfile(id);
    });

    await loadAll();
}

async function loadAll() {
    await loadUsers();
    loadOverview();
}

// ─── UTILISATEURS ─────────────────────────────────────────────────────────────
async function loadUsers() {
    const token = localStorage.getItem(config.apiTokenKey);
    if (!token) return;
    try {
        // Migration Supabase
        const { data, error } = await supabaseAdmin.getAllUsers();
        if (error) throw new Error('Erreur chargement users');
        allUsers = data || [];
        const el = document.getElementById('admin-total-users');
        if (el) el.textContent = allUsers.length;
        renderUsersList();
    } catch (err) {
        Logger.error('ADMIN', 'loadUsers error', err);
        const el = document.getElementById('admin-users-list');
        if (el) el.innerHTML = '<p style="color:var(--color-danger); text-align:center; padding:var(--space-6);">فشل تحميل المستخدمين</p>';
    }
}

function roleOrder(u) {
    if (u.is_superuser) return 0;
    if (u.role === 'admin') return 1;
    if (u.role === 'teacher') return 2;
    return 3;
}

function getSortedFiltered() {
    let users = allUsers;
    if (searchQuery) {
        users = users.filter(u =>
            (u.username || '').toLowerCase().includes(searchQuery) ||
            (u.first_name || '').toLowerCase().includes(searchQuery) ||
            (u.last_name || '').toLowerCase().includes(searchQuery)
        );
    }
    return [...users].sort((a, b) => {
        if (sortKey === 'username') return (a.username || '').localeCompare(b.username || '');
        if (sortKey === 'name') return (a.first_name || '').localeCompare(b.first_name || '');
        const ro = roleOrder(a) - roleOrder(b);
        return ro !== 0 ? ro : (a.username || '').localeCompare(b.username || '');
    });
}

function renderUsersList() {
    const el = document.getElementById('admin-users-list');
    const countEl = document.getElementById('admin-users-count');
    if (!el) return;
    const users = getSortedFiltered();
    if (countEl) countEl.textContent = `${users.length} من ${allUsers.length} مستخدم`;
    if (!users.length) {
        el.innerHTML = '<p style="text-align:center; color:var(--color-text-secondary); padding:var(--space-6);">لا توجد نتائج</p>';
        return;
    }

    const roleBadge = {
        admin: '<span style="background:rgba(239,68,68,0.15); color:#ef4444; font-size:0.75rem; padding:2px 8px; border-radius:99px; font-weight:600;">⚙️ مدير</span>',
        teacher: '<span style="background:rgba(59,130,246,0.15); color:#3b82f6; font-size:0.75rem; padding:2px 8px; border-radius:99px; font-weight:600;">👨‍🏫 معلم</span>',
        student: '<span style="background:rgba(16,185,129,0.15); color:#10b981; font-size:0.75rem; padding:2px 8px; border-radius:99px; font-weight:600;">🎓 طالب</span>',
    };
    const superBadge = '<span style="background:rgba(245,158,11,0.15); color:#f59e0b; font-size:0.7rem; padding:2px 6px; border-radius:99px; margin-right:4px;">★ super</span>';

    el.innerHTML = users.map(u => `
        <div style="display:flex; align-items:center; gap:var(--space-3); padding:var(--space-3) var(--space-2); border-bottom:1px solid var(--color-border); cursor:pointer; transition:background 0.15s; border-radius:var(--radius-lg);"
            data-user-id="${Number.isInteger(Number(u.id)) ? Number(u.id) : ''}"
            class="admin-user-row"
            onmouseenter="this.style.background='var(--color-surface)'"
            onmouseleave="this.style.background='transparent'">
            <div style="width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg,var(--color-primary),var(--color-gold)); display:flex; align-items:center; justify-content:center; font-size:1rem; flex-shrink:0; color:white; font-weight:700;">
                ${escapeHtml((u.first_name || u.username || '?')[0].toUpperCase())}
            </div>
            <div style="flex:1; min-width:0;">
                <div style="font-weight:600; font-size:0.9rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                    ${escapeHtml(u.first_name || '')} ${escapeHtml(u.last_name || '')}
                    <span style="color:var(--color-text-secondary); font-weight:400; font-size:0.8rem;">@${escapeHtml(u.username)}</span>
                </div>
                <div style="margin-top:2px; display:flex; align-items:center; gap:4px;">
                    ${roleBadge[u.role] || `<span>${escapeHtml(u.role || '')}</span>`}
                    ${u.is_superuser ? superBadge : ''}
                </div>
            </div>
            <span style="color:var(--color-text-secondary); font-size:1.2rem; flex-shrink:0;">›</span>
        </div>
    `).join('');
}

// ─── VUE GLOBALE ──────────────────────────────────────────────────────────────
async function loadOverview() {
    const token = localStorage.getItem(config.apiTokenKey);
    if (!token) return;
    try {
        // Migration Supabase
        const { data, error } = await supabaseAdmin.getAdminOverview();
        if (error) throw new Error('Erreur overview');

        const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
        set('admin-total-tasks', data?.total_tasks ?? '—');
        set('admin-pending-subs', data?.pending_submissions ?? '—');
        set('admin-approved-subs', data?.approved_submissions ?? '—');

        // TODO: teacher_stats et tasks ne sont pas encore dans getAdminOverview
        renderTeacherStats([]);
        renderAllTasks([]);
    } catch (err) {
        Logger.error('ADMIN', 'loadOverview error', err);
    }
}

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

// ─── TABS ─────────────────────────────────────────────────────────────────────
function switchTab(tab) {
    ['users', 'classes', 'overview'].forEach(t => {
        const panel = document.getElementById(`admin-tab-${t}`);
        const btn = document.getElementById(`tab-btn-${t}`);
        if (panel) panel.style.display = t === tab ? 'block' : 'none';
        if (btn) {
            btn.classList.toggle('btn-glow', t === tab);
            btn.classList.toggle('btn-outline-glow', t !== tab);
        }
    });
    if (tab === 'classes') {
        loadClasses();
    }
}

// ─── PROFIL MODAL ─────────────────────────────────────────────────────────────
async function openUserProfile(userId) {
    const modal = document.getElementById('admin-profile-modal');
    const content = document.getElementById('admin-profile-content');
    if (!modal || !content) return;

    modal.style.display = 'block';
    content.innerHTML = '<p style="text-align:center; color:#6b7280; padding:24px 0;">جارٍ التحميل...</p>';

    const token = localStorage.getItem(config.apiTokenKey);
    try {
        // Migration Supabase
        const { data: u, error } = await supabaseAdmin.getStudentProgress(userId);
        if (error || !u) throw new Error('Not found');

        const titleEl = document.getElementById('profile-modal-title');
        if (titleEl) titleEl.textContent = `${u.first_name || ''} ${u.last_name || ''} (@${u.username})`.trim();

        const roleLabel = { admin: '⚙️ مدير', teacher: '👨‍🏫 معلم', student: '🎓 طالب' };
        const statusLabel = { pending: '⏳', submitted: '📤', approved: '✅', rejected: '❌' };

        const isTeacher = u.role === 'teacher';

        content.innerHTML = `
            <!-- Bouton Éditer -->
            <div style="margin-bottom:16px; display:flex; gap:8px; justify-content:flex-end;">
                <button data-edit-id="${u.id}"
                    data-edit-first="${escapeHtml(u.first_name || '')}"
                    data-edit-last="${escapeHtml(u.last_name || '')}"
                    data-edit-role="${escapeHtml(u.role)}"
                    onclick="window._adminToggleEdit(parseInt(this.dataset.editId), this.dataset.editFirst, this.dataset.editLast, this.dataset.editRole)"
                    style="font-size:0.8rem; padding:6px 14px; background:#f3f4f6; border:1px solid #d1d5db; border-radius:8px; cursor:pointer; color:#374151;">
                    ✏️ تعديل
                </button>
            </div>

            <!-- Formulaire édition (caché par défaut) -->
            <div id="admin-edit-form" style="display:none; background:#f9fafb; border:1px solid #e5e7eb; border-radius:12px; padding:16px; margin-bottom:16px;">
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px;">
                    <div>
                        <label style="font-size:0.72rem; color:#6b7280; display:block; margin-bottom:4px;">الاسم الأول</label>
                        <input id="edit-first-name" type="text" style="width:100%; padding:7px 10px; border:1px solid #d1d5db; border-radius:8px; font-size:0.85rem; box-sizing:border-box;" />
                    </div>
                    <div>
                        <label style="font-size:0.72rem; color:#6b7280; display:block; margin-bottom:4px;">الاسم الأخير</label>
                        <input id="edit-last-name" type="text" style="width:100%; padding:7px 10px; border:1px solid #d1d5db; border-radius:8px; font-size:0.85rem; box-sizing:border-box;" />
                    </div>
                </div>
                <div style="margin-bottom:12px;">
                    <label style="font-size:0.72rem; color:#6b7280; display:block; margin-bottom:4px;">الدور</label>
                    <select id="edit-role" style="width:100%; padding:7px 10px; border:1px solid #d1d5db; border-radius:8px; font-size:0.85rem;">
                        <option value="student">🎓 طالب</option>
                        <option value="teacher">👨‍🏫 معلم</option>
                        <option value="admin">⚙️ مدير</option>
                    </select>
                </div>
                <div style="display:flex; gap:8px; justify-content:flex-end;">
                    <button onclick="document.getElementById('admin-edit-form').style.display='none'"
                        style="font-size:0.8rem; padding:6px 14px; background:#fff; border:1px solid #d1d5db; border-radius:8px; cursor:pointer; color:#6b7280;">
                        إلغاء
                    </button>
                    <button onclick="window._adminSaveEdit(${u.id})"
                        style="font-size:0.8rem; padding:6px 14px; background:#10b981; border:none; border-radius:8px; cursor:pointer; color:#fff; font-weight:600;">
                        💾 حفظ
                    </button>
                </div>
            </div>

            <!-- Grille infos -->
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:20px;">
                <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; padding:12px;">
                    <div style="font-size:0.72rem; color:#6b7280; margin-bottom:4px;">الدور</div>
                    <div style="font-weight:600; color:#111827;">${roleLabel[u.role] || escapeHtml(u.role || '')}${u.is_superuser ? ' ★' : ''}</div>
                </div>
                <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; padding:12px;">
                    <div style="font-size:0.72rem; color:#6b7280; margin-bottom:4px;">${isTeacher ? 'الواجبات المعطاة' : 'النقاط'}</div>
                    <div style="font-weight:600; color:#d97706;">${isTeacher ? '📚 ' + (u.assigned_tasks_count ?? 0) : '✨ ' + (u.total_points ?? 0)}</div>
                </div>
                <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; padding:12px;">
                    <div style="font-size:0.72rem; color:#6b7280; margin-bottom:4px;">البريد</div>
                    <div style="font-size:0.82rem; color:#374151; word-break:break-all;">${escapeHtml(u.email || '—')}</div>
                </div>
                <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; padding:12px;">
                    <div style="font-size:0.72rem; color:#6b7280; margin-bottom:4px;">تاريخ الانضمام</div>
                    <div style="font-size:0.82rem; color:#374151;">${u.date_joined ? u.date_joined.slice(0, 10) : '—'}</div>
                </div>
                ${!isTeacher ? `
                <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; padding:12px;">
                    <div style="font-size:0.72rem; color:#6b7280; margin-bottom:4px;">الفصل</div>
                    <div style="font-weight:600; color:#111827;">${escapeHtml(u.classe_info?.name || '—')}</div>
                </div>
                <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; padding:12px;">
                    <div style="font-size:0.72rem; color:#6b7280; margin-bottom:4px;">المعلم</div>
                    <div style="font-weight:600; color:#111827;">${escapeHtml(u.classe_info?.teacher || '—')}</div>
                </div>
                ` : ''}
            </div>

            ${isTeacher ? `
                <h4 style="font-size:0.88rem; font-weight:600; color:#111827; margin:0 0 10px;">📚 الواجبات المعطاة (${u.assigned_tasks_count ?? 0})</h4>
                ${u.assigned_tasks && u.assigned_tasks.length ? `
                    <div style="margin-bottom:16px;">
                        ${u.assigned_tasks.map(t => `
                            <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #f3f4f6; font-size:0.83rem; color:#374151;">
                                <div>
                                    <span>${statusLabel[t.status] || ''} ${escapeHtml(t.title || '')}</span>
                                    ${t.student_name || t.student ? `<span style="color:#9ca3af; font-size:0.75rem; margin-right:6px;">← ${escapeHtml(t.student_name || t.student || '')}</span>` : ''}
                                </div>
                                <span style="color:#d97706; flex-shrink:0; font-weight:600;">${t.points > 0 ? '+' + t.points : ''}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : '<p style="color:#9ca3af; font-size:0.83rem; margin-bottom:16px;">لا توجد واجبات معطاة</p>'}
            ` : `
                <!-- Tâches élève : 3 groupes basés sur effective_status -->
                ${(() => {
                    const tasks = u.tasks || [];
                    const accepted  = tasks.filter(t => t.status === 'approved');
                    const submitted = tasks.filter(t => t.status === 'submitted');
                    const notDone   = tasks.filter(t => t.status === 'pending' || t.status === 'rejected');
                    return `
                        <h4 style="font-size:0.88rem; font-weight:600; color:#10b981; margin:0 0 8px;">✅ مقبولة (${accepted.length})</h4>
                        ${accepted.length ? `
                            <div style="margin-bottom:14px;">
                                ${accepted.map(t => `
                                    <div style="display:flex; justify-content:space-between; align-items:center; padding:7px 0; border-bottom:1px solid #f0fdf4; font-size:0.83rem; color:#374151;">
                                        <span>${escapeHtml(t.title || '')}</span>
                                        <span style="color:#10b981; flex-shrink:0; font-weight:700; background:#f0fdf4; padding:2px 8px; border-radius:99px;">${t.points > 0 ? '+' + t.points : '✓'}</span>
                                    </div>
                                `).join('')}
                            </div>
                        ` : '<p style="color:#9ca3af; font-size:0.82rem; margin-bottom:12px;">—</p>'}

                        <h4 style="font-size:0.88rem; font-weight:600; color:#3b82f6; margin:0 0 8px;">📤 مقدمة للتصحيح (${submitted.length})</h4>
                        ${submitted.length ? `
                            <div style="margin-bottom:14px;">
                                ${submitted.map(t => `
                                    <div style="display:flex; justify-content:space-between; align-items:center; padding:7px 0; border-bottom:1px solid #eff6ff; font-size:0.83rem; color:#374151;">
                                        <span>${escapeHtml(t.title || '')}</span>
                                        <span style="color:#3b82f6; font-size:0.75rem;">انتظار</span>
                                    </div>
                                `).join('')}
                            </div>
                        ` : '<p style="color:#9ca3af; font-size:0.82rem; margin-bottom:12px;">—</p>'}

                        <h4 style="font-size:0.88rem; font-weight:600; color:#f59e0b; margin:0 0 8px;">⏳ لم تُنجز (${notDone.length})</h4>
                        ${notDone.length ? `
                            <div style="margin-bottom:14px;">
                                ${notDone.map(t => `
                                    <div style="display:flex; justify-content:space-between; align-items:center; padding:7px 0; border-bottom:1px solid #fef9c3; font-size:0.83rem; color:#6b7280;">
                                        <span>${escapeHtml(t.title || '')}</span>
                                        ${t.status === 'rejected' ? '<span style="color:#ef4444; font-size:0.75rem;">مرفوض</span>' : ''}
                                    </div>
                                `).join('')}
                            </div>
                        ` : '<p style="color:#9ca3af; font-size:0.82rem; margin-bottom:12px;">كل المهام مكتملة 🎉</p>'}
                    `;
                })()}
            `}

            <!-- Bouton Supprimer -->
            <div style="margin-top:20px; padding-top:16px; border-top:1px solid #fee2e2;">
                <button data-delete-id="${u.id}" data-delete-name="${escapeHtml(u.first_name || u.username)}"
                    onclick="window._adminDelete(parseInt(this.dataset.deleteId), this.dataset.deleteName)"
                    style="width:100%; padding:10px; background:#fff; border:1px solid #ef4444; border-radius:10px; color:#ef4444; font-size:0.85rem; font-weight:600; cursor:pointer; transition:background 0.15s;"
                    onmouseenter="this.style.background='#fef2f2'"
                    onmouseleave="this.style.background='#fff'">
                    🗑️ حذف هذا المستخدم
                </button>
            </div>
        `;
    } catch (err) {
        content.innerHTML = '<p style="color:#ef4444; text-align:center; padding:24px 0;">فشل تحميل الملف الشخصي</p>';
    }
}

function closeProfile() {
    const modal = document.getElementById('admin-profile-modal');
    if (modal) modal.style.display = 'none';
}

// ─── ÉDITION UTILISATEUR ──────────────────────────────────────────────────────
function _adminToggleEditFn(userId, firstName, lastName, role) {
    const form = document.getElementById('admin-edit-form');
    if (!form) return;
    document.getElementById('edit-first-name').value = firstName;
    document.getElementById('edit-last-name').value = lastName;
    document.getElementById('edit-role').value = role;
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

async function saveUserEdit(userId) {
    const first_name = document.getElementById('edit-first-name').value.trim();
    const last_name = document.getElementById('edit-last-name').value.trim();
    const role = document.getElementById('edit-role').value;

    try {
        // Migration Supabase
        const { error } = await supabaseAdmin.updateUser(userId, { first_name, last_name, role });
        if (error) throw new Error(error.message || 'خطأ في التحديث');

        document.getElementById('admin-edit-form').style.display = 'none';
        await loadUsers();
        await openUserProfile(userId);
    } catch (err) {
        Logger.error('ADMIN', 'saveUserEdit error', err);
        alert(`فشل حفظ التعديلات: ${err.message || 'خطأ غير معروف'}`);
    }
}

// ─── SUPPRESSION UTILISATEUR ─────────────────────────────────────────────────
async function deleteUser(userId, userName) {
    if (!confirm(`هل أنت متأكد من حذف "${userName}"؟ هذا الإجراء لا يمكن التراجع عنه.`)) return;
    try {
        // Migration Supabase - Note: deleteUser nécessite une Edge Function
        const { error } = await supabaseAdmin.deleteUser(userId);
        if (error) throw new Error(error.message);
        closeProfile();
        await loadUsers();
    } catch (err) {
        Logger.error('ADMIN', 'deleteUser error', err);
        alert('فشل حذف المستخدم');
    }
}

// ─── GESTION DES CLASSES ─────────────────────────────────────────────────────
let allClasses = [];
let currentClassId = null;

async function loadClasses() {
    const el = document.getElementById('admin-classes-list');
    if (!el) return;
    
    try {
        const { data, error } = await supabaseAdmin.getClasses();
        if (error) throw error;
        
        allClasses = data || [];
        renderClassesList();
    } catch (err) {
        Logger.error('ADMIN', 'loadClasses error', err);
        el.innerHTML = '<p style="color:var(--color-danger); text-align:center; padding:var(--space-6);">فشل تحميل الفصول</p>';
    }
}

function renderClassesList() {
    const el = document.getElementById('admin-classes-list');
    if (!el) return;
    
    if (!allClasses.length) {
        el.innerHTML = '<p style="text-align:center; color:var(--color-text-secondary); padding:var(--space-6);">لا توجد فصول بعد. أنشئ فصلاً جديداً!</p>';
        return;
    }
    
    el.innerHTML = allClasses.map(c => {
        const teacherName = c.profiles?.username || 'غير محدد';
        const studentCount = c.class_members?.length || 0;
        
        return `
            <div style="display:flex; align-items:center; gap:var(--space-3); padding:var(--space-3); border:1px solid var(--color-border); border-radius:var(--radius-lg); margin-bottom:var(--space-2); background:var(--color-surface);">
                <div style="width:40px; height:40px; border-radius:var(--radius-lg); background:linear-gradient(135deg, var(--color-primary), var(--color-gold)); display:flex; align-items:center; justify-content:center; font-size:1.2rem; flex-shrink:0;">🏫</div>
                <div style="flex:1; min-width:0;">
                    <div style="font-weight:600; font-size:0.95rem;">${escapeHtml(c.name)}</div>
                    <div style="font-size:0.8rem; color:var(--color-text-secondary); display:flex; gap:var(--space-3); flex-wrap:wrap; margin-top:2px;">
                        <span>👨‍🏫 ${escapeHtml(teacherName)}</span>
                        <span>🎓 ${studentCount} طالب</span>
                    </div>
                </div>
                <button class="btn btn-outline-glow btn-sm" onclick="window._adminOpenClassModal('${c.id}')">⚙️ إدارة</button>
                <button style="background:none; border:none; color:var(--color-danger); cursor:pointer; font-size:1.1rem; padding:var(--space-1);" onclick="window._adminDeleteClass('${c.id}', '${escapeHtml(c.name)}')">🗑️</button>
            </div>
        `;
    }).join('');
}

async function showCreateClassForm() {
    const form = document.getElementById('admin-create-class-form');
    const teacherSelect = document.getElementById('new-class-teacher');
    if (!form || !teacherSelect) return;
    
    // Charger les enseignants
    const teachers = allUsers.filter(u => u.role === 'teacher');
    teacherSelect.innerHTML = '<option value="">-- اختر المعلم --</option>' + 
        teachers.map(t => `<option value="${t.id}">${escapeHtml(t.username)} (${escapeHtml(t.first_name || '')} ${escapeHtml(t.last_name || '')})</option>`).join('');
    
    form.style.display = 'block';
    document.getElementById('new-class-name').value = '';
    document.getElementById('new-class-name').focus();
}

async function createClass() {
    const name = document.getElementById('new-class-name').value.trim();
    const teacherId = document.getElementById('new-class-teacher').value;
    
    if (!name) {
        alert('يرجى إدخال اسم الفصل');
        return;
    }
    if (!teacherId) {
        alert('يرجى اختيار المعلم');
        return;
    }
    
    try {
        const { data, error } = await supabaseAdmin.createClassWithTeacher(name, teacherId);
        if (error) throw error;
        
        document.getElementById('admin-create-class-form').style.display = 'none';
        await loadClasses();
    } catch (err) {
        Logger.error('ADMIN', 'createClass error', err);
        alert('فشل إنشاء الفصل');
    }
}

async function deleteClass(classId, className) {
    if (!confirm(`هل أنت متأكد من حذف فصل "${className}"؟ سيتم إزالة جميع الطلاب من هذا الفصل.`)) return;
    
    try {
        const { error } = await supabaseAdmin.deleteClass(classId);
        if (error) throw error;
        await loadClasses();
    } catch (err) {
        Logger.error('ADMIN', 'deleteClass error', err);
        alert('فشل حذف الفصل');
    }
}

async function openClassModal(classId) {
    currentClassId = classId;
    const classData = allClasses.find(c => c.id === classId);
    if (!classData) return;
    
    // Créer le modal s'il n'existe pas
    let modal = document.getElementById('admin-class-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'admin-class-modal';
        modal.style.cssText = 'display:none; position:fixed; top:0; left:0; right:0; bottom:0; width:100%; height:100%; background:rgba(0,0,0,0.65); z-index:9999; overflow-y:auto;';
        modal.onclick = (e) => { if (e.target === modal) closeClassModal(); };
        modal.innerHTML = `
            <div style="position:relative; margin:40px auto; width:calc(100% - 32px); max-width:600px; background:#fff; border-radius:16px; box-shadow:0 24px 64px rgba(0,0,0,0.35); overflow:hidden;" onclick="event.stopPropagation()">
                <div style="padding:20px 24px 16px; border-bottom:1px solid #e5e7eb; display:flex; justify-content:space-between; align-items:center;">
                    <h3 id="class-modal-title" style="margin:0; font-size:1.1rem; font-weight:700; color:#111827;">إدارة الفصل</h3>
                    <button onclick="window._adminCloseClassModal()" style="display:inline-flex; align-items:center; justify-content:center; width:32px; height:32px; background:#f3f4f6; border:none; border-radius:8px; font-size:1.1rem; cursor:pointer; color:#6b7280;">✕</button>
                </div>
                <div id="class-modal-content" style="padding:20px 24px 24px;"></div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    modal.style.display = 'block';
    document.getElementById('class-modal-title').textContent = `🏫 ${classData.name}`;
    
    await renderClassModalContent(classId);
}

async function renderClassModalContent(classId) {
    const content = document.getElementById('class-modal-content');
    if (!content) return;
    
    content.innerHTML = '<p style="text-align:center; color:#6b7280; padding:24px 0;">جارٍ التحميل...</p>';
    
    try {
        // Récupérer les élèves de la classe
        const { data: students, error: studentsError } = await supabaseAdmin.getClassStudents(classId);
        if (studentsError) throw studentsError;
        
        // Récupérer les élèves non assignés
        const { data: availableStudents, error: availableError } = await supabaseAdmin.getAllStudentsNotInClass(classId);
        if (availableError) throw availableError;
        
        content.innerHTML = `
            <!-- Élèves actuels -->
            <div style="margin-bottom:20px;">
                <h4 style="font-size:0.9rem; font-weight:600; color:#111827; margin:0 0 12px;">🎓 الطلاب الحاليون (${students?.length || 0})</h4>
                <div id="class-current-students" style="max-height:200px; overflow-y:auto; border:1px solid #e5e7eb; border-radius:10px; padding:8px;">
                    ${students?.length ? students.map(s => `
                        <div style="display:flex; align-items:center; justify-content:space-between; padding:8px; border-bottom:1px solid #f3f4f6;">
                            <span style="font-size:0.85rem;">${escapeHtml(s.first_name || '')} ${escapeHtml(s.last_name || '')} <span style="color:#9ca3af;">@${escapeHtml(s.username)}</span></span>
                            <button onclick="window._adminRemoveStudentFromClass('${s.id}', '${classId}')" style="background:#fef2f2; border:1px solid #fecaca; color:#ef4444; font-size:0.75rem; padding:4px 10px; border-radius:6px; cursor:pointer;">إزالة</button>
                        </div>
                    `).join('') : '<p style="text-align:center; color:#9ca3af; padding:16px; font-size:0.85rem;">لا يوجد طلاب في هذا الفصل</p>'}
                </div>
            </div>
            
            <!-- Ajouter des élèves -->
            <div>
                <h4 style="font-size:0.9rem; font-weight:600; color:#111827; margin:0 0 12px;">➕ إضافة طلاب</h4>
                <div style="display:flex; gap:8px; margin-bottom:12px;">
                    <select id="add-student-select" style="flex:1; padding:8px 12px; border:1px solid #d1d5db; border-radius:8px; font-size:0.85rem;">
                        <option value="">-- اختر طالباً --</option>
                        ${availableStudents?.map(s => `<option value="${s.id}">${escapeHtml(s.username)} (${escapeHtml(s.first_name || '')} ${escapeHtml(s.last_name || '')})</option>`).join('') || ''}
                    </select>
                    <button onclick="window._adminAddStudentToClass('${classId}')" class="btn btn-glow btn-sm">إضافة</button>
                </div>
                ${!availableStudents?.length ? '<p style="color:#9ca3af; font-size:0.8rem; text-align:center;">جميع الطلاب مسجلون في فصول</p>' : ''}
            </div>
        `;
    } catch (err) {
        Logger.error('ADMIN', 'renderClassModalContent error', err);
        content.innerHTML = '<p style="color:#ef4444; text-align:center; padding:24px 0;">فشل تحميل بيانات الفصل</p>';
    }
}

function closeClassModal() {
    const modal = document.getElementById('admin-class-modal');
    if (modal) modal.style.display = 'none';
    currentClassId = null;
}

async function addStudentToClass(classId) {
    const select = document.getElementById('add-student-select');
    const studentId = select?.value;
    
    if (!studentId) {
        alert('يرجى اختيار طالب');
        return;
    }
    
    try {
        const { error } = await supabaseAdmin.assignStudentToClass(studentId, classId);
        if (error) throw error;
        
        await renderClassModalContent(classId);
        await loadClasses();
    } catch (err) {
        Logger.error('ADMIN', 'addStudentToClass error', err);
        alert('فشل إضافة الطالب');
    }
}

async function removeStudentFromClass(studentId, classId) {
    if (!confirm('هل أنت متأكد من إزالة هذا الطالب من الفصل؟')) return;
    
    try {
        const { error } = await supabaseAdmin.removeStudentFromClass(studentId, classId);
        if (error) throw error;
        
        await renderClassModalContent(classId);
        await loadClasses();
    } catch (err) {
        Logger.error('ADMIN', 'removeStudentFromClass error', err);
        alert('فشل إزالة الطالب');
    }
}
