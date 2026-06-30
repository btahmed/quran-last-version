// frontend/src/pages/admin/AdminClassesSection.js
// Section Fassoul (Classes) — extraite d'AdminPage.js (Task 8 : lazy-loading)
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
let allClasses    = [];
let currentClassId = null;

// Cache des utilisateurs chargé depuis la section Users (si disponible)
// ou rechargé depuis Supabase en standalone
let _cachedUsers = null;

// ─── RENDER ──────────────────────────────────────────────────────────────────
export function render() {
    return `
        <section class="k-section">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-4)">
                <h3 class="k-section-title" style="margin:0">🏫 إدارة الفصول</h3>
                <button class="k-quickbtn k-quickbtn--primary" style="min-width:auto;padding:var(--space-2) var(--space-3);font-size:var(--text-sm)" onclick="window._adminShowCreateClass()">➕ فصل جديد</button>
            </div>

            <!-- Formulaire création classe (caché par défaut) -->
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

            <div id="admin-classes-list" class="k-stack">
                <div class="skeleton skeleton-card"></div>
                <div class="skeleton skeleton-card"></div>
            </div>
        </section>
    `;
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
export async function init() {
    // Exposer les fonctions globales nécessaires aux onclick inline
    window._adminShowCreateClass         = showCreateClassForm;
    window._adminCreateClass             = createClass;
    window._adminDeleteClass             = deleteClass;
    window._adminOpenClassModal          = openClassModal;
    window._adminCloseClassModal         = closeClassModal;
    window._adminAddStudentToClass       = addStudentToClass;
    window._adminRemoveStudentFromClass  = removeStudentFromClass;

    await loadClasses();
}

// ─── CHARGEMENT CLASSES ───────────────────────────────────────────────────────
async function loadClasses() {
    const el = document.getElementById('admin-classes-list');
    if (!el) return;

    try {
        const { data, error } = await supabaseAdmin.getClasses();
        if (error) throw error;

        allClasses = data || [];
        renderClassesList();
    } catch (err) {
        Logger.error('ADMIN-CLASSES', 'loadClasses error', err);
        el.innerHTML = '<p style="color:var(--color-danger); text-align:center; padding:var(--space-6);">فشل تحميل الفصول</p>';
    }
}

// ─── RENDU LISTE CLASSES ──────────────────────────────────────────────────────
function renderClassesList() {
    const el = document.getElementById('admin-classes-list');
    if (!el) return;

    if (!allClasses.length) {
        el.innerHTML = '<p style="text-align:center; color:var(--color-text-secondary); padding:var(--space-6);">لا توجد فصول بعد. أنشئ فصلاً جديداً!</p>';
        return;
    }

    el.innerHTML = allClasses.map(c => {
        const teacherName  = c.profiles?.username || 'غير محدد';
        const studentCount = parseInt(c.class_members?.[0]?.count || 0);
        const cid          = escapeHtml(String(c.id));

        return `
        <div class="k-row">
            <div class="rl">
                <span class="k-avatar" style="border-radius:var(--radius-lg)">🏫</span>
                <div>
                    <div class="name">${escapeHtml(c.name)}</div>
                    <div class="meta">👨‍🏫 ${escapeHtml(teacherName)} · 🎓 ${studentCount} طالب</div>
                </div>
            </div>
            <div style="display:flex;gap:var(--space-2);flex-shrink:0">
                <button class="k-quickbtn" style="min-width:auto;padding:var(--space-1) var(--space-3);font-size:var(--text-xs)"
                    onclick="window._adminOpenClassModal('${cid}')">⚙️ إدارة</button>
                <button class="k-quickbtn k-quickbtn--danger" style="min-width:auto;padding:var(--space-1) var(--space-2)"
                    aria-label="حذف" title="حذف"
                    onclick="window._adminDeleteClass('${cid}','${escapeHtml(c.name)}')">🗑</button>
            </div>
        </div>
        `;
    }).join('');
}

// ─── FORMULAIRE CRÉATION CLASSE ───────────────────────────────────────────────
async function showCreateClassForm() {
    const form          = document.getElementById('admin-create-class-form');
    const teacherSelect = document.getElementById('new-class-teacher');
    if (!form || !teacherSelect) return;

    // Charger la liste d'enseignants (depuis cache ou API)
    const users    = await _getUsers();
    const teachers = users.filter(u => u.role === 'teacher');

    teacherSelect.innerHTML = '<option value="">-- اختر المعلم --</option>' +
        teachers.map(t => `<option value="${t.id}">${escapeHtml(t.username)} (${escapeHtml(t.first_name || '')} ${escapeHtml(t.last_name || '')})</option>`).join('');

    form.style.display = 'block';
    document.getElementById('new-class-name').value = '';
    document.getElementById('new-class-name').focus();
}

async function createClass() {
    const name      = document.getElementById('new-class-name').value.trim();
    const teacherId = document.getElementById('new-class-teacher').value;

    if (!name)      { alert('يرجى إدخال اسم الفصل'); return; }
    if (!teacherId) { alert('يرجى اختيار المعلم');   return; }

    try {
        const { data, error } = await supabaseAdmin.createClassWithTeacher(name, teacherId);
        if (error) throw error;

        document.getElementById('admin-create-class-form').style.display = 'none';
        await loadClasses();
    } catch (err) {
        Logger.error('ADMIN-CLASSES', 'createClass error', err);
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
        Logger.error('ADMIN-CLASSES', 'deleteClass error', err);
        alert('فشل حذف الفصل');
    }
}

// ─── MODAL GESTION D'UNE CLASSE ───────────────────────────────────────────────
async function openClassModal(classId) {
    currentClassId = classId;
    const classData = allClasses.find(c => c.id === classId);
    if (!classData) return;

    // Créer le modal dynamiquement s'il n'existe pas encore
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
                    <button onclick="window._adminCloseClassModal()" aria-label="إغلاق" title="إغلاق" style="display:inline-flex; align-items:center; justify-content:center; width:32px; height:32px; background:#f3f4f6; border:none; border-radius:8px; font-size:1.1rem; cursor:pointer; color:#6b7280;">✕</button>
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
        const { data: students,         error: studentsError   } = await supabaseAdmin.getClassStudents(classId);
        if (studentsError) throw studentsError;

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
        Logger.error('ADMIN-CLASSES', 'renderClassModalContent error', err);
        content.innerHTML = '<p style="color:#ef4444; text-align:center; padding:24px 0;">فشل تحميل بيانات الفصل</p>';
    }
}

function closeClassModal() {
    const modal = document.getElementById('admin-class-modal');
    if (modal) modal.style.display = 'none';
    currentClassId = null;
}

async function addStudentToClass(classId) {
    const select    = document.getElementById('add-student-select');
    const studentId = select?.value;

    if (!studentId) { alert('يرجى اختيار طالب'); return; }

    try {
        const { error } = await supabaseAdmin.assignStudentToClass(studentId, classId);
        if (error) throw error;

        await renderClassModalContent(classId);
        await loadClasses();
    } catch (err) {
        Logger.error('ADMIN-CLASSES', 'addStudentToClass error', err);
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
        Logger.error('ADMIN-CLASSES', 'removeStudentFromClass error', err);
        alert('فشل إزالة الطالب');
    }
}

// ─── HELPER PRIVÉ — liste des utilisateurs ───────────────────────────────────
// Essaie de récupérer depuis la section Users chargée en mémoire,
// sinon fait un appel Supabase direct.
async function _getUsers() {
    if (_cachedUsers) return _cachedUsers;
    try {
        const { data } = await supabaseAdmin.getAllUsers();
        _cachedUsers = data || [];
    } catch {
        _cachedUsers = [];
    }
    return _cachedUsers;
}
