// frontend/src/pages/TeacherPage.js — façade lazy-loading
// Task 9 : découpage du monolithe (~47 KB) en 3 sous-modules chargés à la demande.
// Architecture identique à AdminPage.js (Task 8) :
//   TeacherPage ← lazy → teacher/TeacherDevoirsSection.js
//                      → teacher/TeacherSoumissionsSection.js
//                      → teacher/TeacherElevesSection.js
import { Logger }           from '../core/logger.js';
import { state }            from '../core/state.js';
import { config }           from '../core/config.js';
import { showNotification } from '../core/ui.js';
import * as supabaseAdmin   from '../services/supabase-admin.js';

// Injecter le CSS des onglets enseignant (une seule fois)
if (!document.querySelector('link[href*="TeacherPage.css"]')) {
    const link = document.createElement('link');
    link.rel  = 'stylesheet';
    link.href = '/src/pages/TeacherPage.css';
    document.head.appendChild(link);
}

// ─── MAPPAGE DES SECTIONS → MODULES ──────────────────────────────────────────
const SECTION_MODULES = {
    devoirs:     () => import('./teacher/TeacherDevoirsSection.js'),
    soumissions: () => import('./teacher/TeacherSoumissionsSection.js'),
    eleves:      () => import('./teacher/TeacherElevesSection.js'),
};

// ─── ÉTAT INTERNE ─────────────────────────────────────────────────────────────
let _activeSection = 'devoirs'; // section affichée
let _sectionModule = null;      // module ES actuellement chargé
let _loading       = false;     // flag anti-concurrence (double-clic)

// ─── RENDER ──────────────────────────────────────────────────────────────────
export function render() {
    const name = state.user?.first_name || state.user?.username || 'أستاذ';
    return `
        <div id="teacher-page" class="page active">
            <section class="section-pro">
                <div class="container-pro">
                    <h2 class="section-title" style="text-align:center; margin-bottom:var(--space-4);">📋 لوحة المعلم</h2>
                    <p style="text-align:center; color:var(--color-text-secondary); margin-bottom:var(--space-6);">مرحباً أستاذ ${name}</p>

                    <!-- Onglets de navigation entre sections -->
                    <div class="teacher-tabs">
                        <button class="teacher-tab active" data-section="devoirs"
                            onclick="QuranReview.teacherSwitchSection('devoirs')">📋 الواجبات</button>
                        <button class="teacher-tab" data-section="soumissions"
                            onclick="QuranReview.teacherSwitchSection('soumissions')">🎧 التسليمات</button>
                        <button class="teacher-tab" data-section="eleves"
                            onclick="QuranReview.teacherSwitchSection('eleves')">👥 الطلاب</button>
                    </div>

                    <!-- Contenu dynamique de la section active -->
                    <div id="teacher-section-content">
                        <!-- chargé via lazy-import lors de teacherSwitchSection() -->
                    </div>
                </div>
            </section>
        </div>
    `;
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
export async function init() {
    Logger.log('TEACHER', 'init — chargement section par défaut');

    // Charger la section initiale selon la sous-route (devoirs, soumissions, eleves)
    const page = state.currentPage;
    if (page === 'soumissions')      await teacherSwitchSection('soumissions');
    else if (page === 'eleves')      await teacherSwitchSection('eleves');
    else                             await teacherSwitchSection('devoirs');
}

// ─── CHANGEMENT DE SECTION (lazy-loading) ─────────────────────────────────────
export async function teacherSwitchSection(section) {
    // Anti-concurrence : bloquer les appels simultanés (double-clic rapide)
    if (_loading) return;
    // Éviter le rechargement si on est déjà sur cette section avec le module en mémoire
    if (section === _activeSection && _sectionModule) return;

    _loading = true;
    _activeSection = section;

    // Mettre à jour le style actif des onglets
    document.querySelectorAll('.teacher-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.section === section);
    });

    // Afficher un squelette de chargement
    const container = document.getElementById('teacher-section-content');
    if (!container) { _loading = false; return; }
    container.innerHTML = '<div class="skeleton skeleton-card"></div>'.repeat(3);

    // Charger le module correspondant à la section
    const loader = SECTION_MODULES[section];
    if (!loader) {
        Logger.warn('TEACHER', `Section inconnue : ${section}`);
        container.innerHTML = '<p style="text-align:center; color:var(--color-danger);">Section introuvable</p>';
        _loading = false;
        return;
    }

    try {
        _sectionModule      = await loader();
        container.innerHTML = _sectionModule.render();
        await _sectionModule.init();
    } catch (err) {
        Logger.error('TEACHER', `Erreur chargement section ${section}`, err);
        container.innerHTML = '<p style="text-align:center; padding:2rem; color:var(--color-danger);">خطأ في تحميل القسم</p>';
    } finally {
        _loading = false; // toujours déverrouiller, même en cas d'erreur
    }
}

// ─── DÉLÉGATION VERS LE MODULE ACTIF ──────────────────────────────────────────
// Toutes ces fonctions sont appelées via window.QuranReview depuis les onclick HTML.
// Elles délèguent au module de section actuellement chargé, ce qui permet au
// module lazy de gérer son propre état interne.

function _delegate(fn, ...args) {
    if (_sectionModule && typeof _sectionModule[fn] === 'function') {
        return _sectionModule[fn](...args);
    }
    Logger.warn('TEACHER', `Fonction ${fn} non disponible dans le module actif (${_activeSection})`);
}

// ── Devoirs ──
export const handleCreateTask     = (...args) => _delegate('handleCreateTask', ...args);
export const handleDeleteAllTasks = (...args) => _delegate('handleDeleteAllTasks', ...args);
export const handleDeleteBatch    = (...args) => _delegate('handleDeleteBatch', ...args);
export const toggleAssignMode     = (...args) => _delegate('toggleAssignMode', ...args);

// ── Soumissions ──
export const openGradeModal   = (...args) => _delegate('openGradeModal', ...args);
export const closeGradeModal  = (...args) => _delegate('closeGradeModal', ...args);
export const selectGrade      = (...args) => _delegate('selectGrade', ...args);
export const confirmGrade     = (...args) => _delegate('confirmGrade', ...args);
export const approveSubmission = (...args) => _delegate('approveSubmission', ...args);
export const openRejectModal  = (...args) => _delegate('openRejectModal', ...args);
export const closeRejectModal = (...args) => _delegate('closeRejectModal', ...args);
export const confirmReject    = (...args) => _delegate('confirmReject', ...args);
export const rejectSubmission = (...args) => _delegate('rejectSubmission', ...args);

// ── Élèves ──
export const viewStudentProgress = (...args) => _delegate('viewStudentProgress', ...args);

// ─── FONCTIONS ADMIN RÉSIDUELLES ──────────────────────────────────────────────
// Ces fonctions étaient dans l'ancien TeacherPage.js monolithique.
// Elles sont conservées ici pour compatibilité avec UserEditModal.js et main.js
// qui les référencent via TeacherPage ou window.QuranReview.

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

export async function handleUpdateUser(event) {
    event.preventDefault();

    const userId     = document.getElementById('edit-user-id').value;
    const firstName  = document.getElementById('edit-first-name').value.trim();
    const lastName   = document.getElementById('edit-last-name').value.trim();
    const role       = document.getElementById('edit-role').value;

    const errorEl   = document.getElementById('user-edit-error');
    const successEl = document.getElementById('user-edit-success');

    errorEl?.classList.add('hidden');
    successEl?.classList.add('hidden');

    try {
        const { data, error } = await supabaseAdmin.updateUser(userId, {
            first_name: firstName,
            last_name:  lastName,
            role,
        });

        if (error) throw new Error(error.message || 'خطأ في تحديث المستخدم');

        Logger.log('ADMIN', `User updated: ${data?.username || userId}`);
        if (successEl) {
            successEl.textContent = '✅ تم تحديث بيانات المستخدم بنجاح';
            successEl.classList.remove('hidden');
        }

        setTimeout(() => {
            window.QuranReview && window.QuranReview.closeUserEditModal();
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
    if (!confirm(`هل أنت متأكد من حذف المستخدم "${username}"؟\nهذا الإجراء لا يمكن التراجع عنه.`)) return;

    try {
        const { error } = await supabaseAdmin.deleteUser(userId);
        if (error) throw new Error(error.message || 'خطأ في حذف المستخدم');

        Logger.log('ADMIN', `User deleted: ${username}`);
        showNotification(`تم حذف "${username}" بنجاح`, 'success');
    } catch (error) {
        Logger.error('ADMIN', 'Delete user failed', error);
        showNotification(error.message, 'error');
    }
}

export async function handleCreateTeacher(event) {
    event.preventDefault();
    const username  = document.getElementById('teacher-new-username').value.trim();
    const password  = document.getElementById('teacher-new-password').value;
    const errorEl   = document.getElementById('admin-create-error');
    const successEl = document.getElementById('admin-create-success');

    errorEl?.classList.add('hidden');
    successEl?.classList.add('hidden');

    Logger.log('AUTH', `Admin creating teacher: ${username}`);

    try {
        const { data, error } = await supabaseAdmin.createTeacher(null, password, username);
        if (error) throw new Error(error.message || 'خطأ في إنشاء الحساب');

        Logger.log('AUTH', `Teacher created: ${username}`);
        if (successEl) {
            successEl.textContent = `✅ تم إنشاء حساب الأستاذ "${username}" بنجاح`;
            successEl.classList.remove('hidden');
        }
        document.getElementById('admin-create-teacher-form')?.reset();
        showNotification('تم إنشاء حساب الأستاذ بنجاح', 'success');
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
    const username  = document.getElementById('promote-username').value.trim();
    const errorEl   = document.getElementById('admin-promote-error');
    const successEl = document.getElementById('admin-promote-success');

    errorEl?.classList.add('hidden');
    successEl?.classList.add('hidden');

    Logger.log('AUTH', `Admin promoting user to teacher: ${username}`);

    try {
        const { data: users } = await supabaseAdmin.getAllUsers();
        const user = users?.find(u => u.username === username);
        if (!user) throw new Error('المستخدم غير موجود');

        const { error } = await supabaseAdmin.updateUser(user.id, { role: 'teacher' });
        if (error) throw new Error(error.message || 'خطأ في الترقية');

        Logger.log('AUTH', `User promoted: ${username} → teacher`);
        if (successEl) {
            successEl.textContent = `✅ تم ترقية "${username}" إلى أستاذ بنجاح`;
            successEl.classList.remove('hidden');
        }
        document.getElementById('admin-promote-form')?.reset();
        showNotification(`تم ترقية ${username} إلى أستاذ`, 'success');
    } catch (error) {
        Logger.error('AUTH', 'Promote teacher failed', error);
        if (errorEl) {
            errorEl.textContent = error.message;
            errorEl.classList.remove('hidden');
        }
    }
}
