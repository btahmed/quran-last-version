// frontend/src/pages/admin/AdminUsersSection.js
// Section Utilisateurs — extraite d'AdminPage.js (Task 8 : lazy-loading)
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

// ─── ÉTAT LOCAL ───────────────────────────────────────────────────────────────
let allUsers = [];
let searchQuery = '';
let sortKey = 'role';

// ─── RENDER ──────────────────────────────────────────────────────────────────
export function render() {
    return `
        <section class="k-section">
            <!-- Barre de recherche + tri -->
            <div style="display:flex;gap:var(--space-3);align-items:center;margin-bottom:var(--space-4);flex-wrap:wrap">
                <input id="admin-search" type="text"
                    placeholder="🔍 بحث باسم أو اسم مستخدم..."
                    style="flex:1;min-width:200px;padding:var(--space-2) var(--space-3);border-radius:var(--radius-lg);border:1px solid var(--border-subtle);background:var(--surface-card);color:var(--text-primary);font-family:inherit;font-size:var(--text-sm)"
                    oninput="window._adminFilter(this.value)" />
                <select id="admin-sort"
                    style="padding:var(--space-2) var(--space-3);border-radius:var(--radius-lg);border:1px solid var(--border-subtle);background:var(--surface-card);color:var(--text-primary);font-family:inherit;font-size:var(--text-sm)"
                    onchange="window._adminSort(this.value)">
                    <option value="role">ترتيب: الدور</option>
                    <option value="username">ترتيب: اسم المستخدم</option>
                    <option value="name">ترتيب: الاسم</option>
                </select>
                <button class="k-quickbtn" style="min-width:auto;padding:var(--space-2) var(--space-4)" onclick="window._adminRefresh()">🔄 تحديث</button>
            </div>
            <div id="admin-users-count" style="color:var(--text-secondary);font-size:var(--text-xs);margin-bottom:var(--space-3)"></div>
            <div id="admin-users-list" class="k-stack">
                <div class="skeleton skeleton-card"></div>
                <div class="skeleton skeleton-card"></div>
            </div>
        </section>

        <!-- Modal profil utilisateur -->
        <div id="admin-profile-modal"
            style="display:none; position:fixed; top:0; left:0; right:0; bottom:0; width:100%; height:100%; background:rgba(0,0,0,0.65); z-index:9999; overflow-y:auto;"
            onclick="if(event.target===this)window._adminCloseProfile()">
            <div style="position:relative; margin:40px auto; width:calc(100% - 32px); max-width:540px; background:#fff; border-radius:16px; box-shadow:0 24px 64px rgba(0,0,0,0.35); overflow:hidden;"
                onclick="event.stopPropagation()">
                <div style="padding:20px 24px 16px; border-bottom:1px solid #e5e7eb; display:flex; justify-content:space-between; align-items:center;">
                    <h3 id="profile-modal-title" style="margin:0; font-size:1.1rem; font-weight:700; color:#111827;">الملف الشخصي</h3>
                    <button onclick="window._adminCloseProfile()" aria-label="إغلاق" title="إغلاق"
                        style="display:inline-flex; align-items:center; justify-content:center; width:32px; height:32px; background:#f3f4f6; border:none; border-radius:8px; font-size:1.1rem; cursor:pointer; color:#6b7280; line-height:1;">✕</button>
                </div>
                <div id="admin-profile-content" style="padding:20px 24px 24px;">
                    <p style="text-align:center; color:#6b7280; padding:24px 0;">جارٍ التحميل...</p>
                </div>
            </div>
        </div>
    `;
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
export async function init() {
    // Exposer les fonctions globales nécessaires aux onclick inline
    window._adminFilter  = (q) => { searchQuery = q.toLowerCase(); renderUsersList(); };
    window._adminSort    = (k) => { sortKey = k; renderUsersList(); };
    window._adminRefresh = async () => {
        const btn = document.querySelector('[onclick="window._adminRefresh()"]');
        if (btn) { btn.disabled = true; btn.textContent = '⏳ ...'; }
        try {
            await loadUsers();
        } finally {
            if (btn) { btn.disabled = false; btn.textContent = '🔄 تحديث'; }
        }
    };
    window._adminOpenProfile    = openUserProfile;
    window._adminCloseProfile   = closeProfile;
    window._adminSaveEdit       = saveUserEdit;
    window._adminDelete         = deleteUser;
    window._adminToggleEdit     = _adminToggleEditFn;

    // Délégation de clic sur les lignes utilisateur
    document.getElementById('admin-users-list')?.addEventListener('click', (e) => {
        const row = e.target.closest('.admin-user-row');
        if (!row) return;
        const id = row.dataset.userId;
        if (!id) return;
        openUserProfile(id);
    });

    await loadUsers();
}

// ─── CHARGEMENT UTILISATEURS ─────────────────────────────────────────────────
export async function loadUsers() {
    try {
        const { data, error } = await supabaseAdmin.getAllUsers();
        if (error) throw new Error('Erreur chargement users');
        allUsers = data || [];

        // Mettre à jour le compteur global (si présent dans la façade)
        const elTotal = document.getElementById('admin-total-users');
        if (elTotal) elTotal.textContent = allUsers.length;

        renderUsersList();
    } catch (err) {
        Logger.error('ADMIN-USERS', 'loadUsers error', err);
        const el = document.getElementById('admin-users-list');
        if (el) el.innerHTML = '<p style="color:var(--color-danger); text-align:center; padding:var(--space-6);">فشل تحميل المستخدمين</p>';
    }
}

// Getter utilisé par la section Classes (populate du select enseignants)
export function getUsers() {
    return allUsers;
}

// ─── FILTRAGE / TRI ───────────────────────────────────────────────────────────
function roleOrder(u) {
    if (u.role === 'admin' || u.is_superuser) return 0;
    if (u.role === 'teacher') return 1;
    return 2;
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
        if (sortKey === 'name')     return (a.first_name || '').localeCompare(b.first_name || '');
        const ro = roleOrder(a) - roleOrder(b);
        return ro !== 0 ? ro : (a.username || '').localeCompare(b.username || '');
    });
}

// ─── RENDU LISTE ──────────────────────────────────────────────────────────────
function renderUsersList() {
    const el      = document.getElementById('admin-users-list');
    const countEl = document.getElementById('admin-users-count');
    if (!el) return;

    const users = getSortedFiltered();
    if (countEl) countEl.textContent = `${users.length} من ${allUsers.length} مستخدم`;

    if (!users.length) {
        el.innerHTML = '<p style="text-align:center; color:var(--color-text-secondary); padding:var(--space-6);">لا توجد نتائج</p>';
        return;
    }

    const ROLE_CHIP = {
        admin:   `<span class="k-chip k-chip--danger">⚙️ مدير</span>`,
        teacher: `<span class="k-chip k-chip--info">👨‍🏫 معلم</span>`,
        student: `<span class="k-chip k-chip--success">🎓 طالب</span>`,
    };
    const SUPER_CHIP = `<span class="k-chip k-chip--warning">★ super</span>`;

    el.innerHTML = users.map(u => {
        const initial = escapeHtml((u.first_name || u.username || '?')[0].toUpperCase());
        return `
        <div class="k-row admin-user-row" style="cursor:pointer" data-user-id="${escapeHtml(u.id)}">
            <div class="rl">
                <span class="k-avatar">${initial}</span>
                <div>
                    <div class="name">
                        ${escapeHtml(u.first_name || '')} ${escapeHtml(u.last_name || '')}
                        <span style="color:var(--text-secondary);font-weight:400;font-size:var(--text-xs)">@${escapeHtml(u.username)}</span>
                    </div>
                    <div class="meta" style="display:flex;align-items:center;gap:var(--space-1);margin-top:2px">
                        ${ROLE_CHIP[u.role] || `<span class="k-chip k-chip--primary">${escapeHtml(u.role || '')}</span>`}
                        ${u.is_superuser ? SUPER_CHIP : ''}
                    </div>
                </div>
            </div>
            <span style="color:var(--text-secondary);font-size:1.2rem">›</span>
        </div>
        `;
    }).join('');
}

// ─── MODAL PROFIL ─────────────────────────────────────────────────────────────
async function openUserProfile(userId) {
    const modal   = document.getElementById('admin-profile-modal');
    const content = document.getElementById('admin-profile-content');
    if (!modal || !content) return;

    modal.style.display = 'block';
    content.innerHTML = '<p style="text-align:center; color:#6b7280; padding:24px 0;">جارٍ التحميل...</p>';

    try {
        const { data: u, error } = await supabaseAdmin.getStudentProgress(userId);
        if (error || !u) throw new Error('Not found');

        const titleEl = document.getElementById('profile-modal-title');
        if (titleEl) titleEl.textContent = `${u.first_name || ''} ${u.last_name || ''} (@${u.username})`.trim();

        const roleLabel   = { admin: '⚙️ مدير', teacher: '👨‍🏫 معلم', student: '🎓 طالب' };
        const statusLabel = { pending: '⏳', submitted: '📤', approved: '✅', rejected: '❌' };
        const isTeacher   = u.role === 'teacher';

        content.innerHTML = `
            <!-- Bouton Éditer -->
            <div style="margin-bottom:16px; display:flex; gap:8px; justify-content:flex-end;">
                <button data-edit-id="${u.id}"
                    data-edit-first="${escapeHtml(u.first_name || '')}"
                    data-edit-last="${escapeHtml(u.last_name || '')}"
                    data-edit-role="${escapeHtml(u.role)}"
                    onclick="window._adminToggleEdit(this.dataset.editId, this.dataset.editFirst, this.dataset.editLast, this.dataset.editRole)"
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
                    <button onclick="window._adminSaveEdit('${u.id}')"
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
                    <div style="font-size:0.82rem; color:#374151;">${u.created_at ? u.created_at.slice(0, 10) : '—'}</div>
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
                <!-- Tâches élève : 3 groupes par statut -->
                ${(() => {
                    const tasks    = u.tasks || [];
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
                    onclick="window._adminDelete(this.dataset.deleteId, this.dataset.deleteName)"
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
    document.getElementById('edit-last-name').value  = lastName;
    document.getElementById('edit-role').value       = role;
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

async function saveUserEdit(userId) {
    const first_name = document.getElementById('edit-first-name').value.trim();
    const last_name  = document.getElementById('edit-last-name').value.trim();
    const role       = document.getElementById('edit-role').value;

    try {
        const { error } = await supabaseAdmin.updateUser(userId, { first_name, last_name, role });
        if (error) throw new Error(error.message || 'خطأ في التحديث');

        document.getElementById('admin-edit-form').style.display = 'none';
        await loadUsers();
        await openUserProfile(userId);
    } catch (err) {
        Logger.error('ADMIN-USERS', 'saveUserEdit error', err);
        alert(`فشل حفظ التعديلات: ${err.message || 'خطأ غير معروف'}`);
    }
}

// ─── SUPPRESSION UTILISATEUR ─────────────────────────────────────────────────
async function deleteUser(userId, userName) {
    if (!confirm(`هل أنت متأكد من حذف "${userName}"؟ هذا الإجراء لا يمكن التراجع عنه.`)) return;
    try {
        const { error } = await supabaseAdmin.deleteUser(userId);
        if (error) throw new Error(error.message);
        closeProfile();
        await loadUsers();
    } catch (err) {
        Logger.error('ADMIN-USERS', 'deleteUser error', err);
        alert('فشل حذف المستخدم');
    }
}
