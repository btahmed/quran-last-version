// frontend/src/pages/AdminPage.js — façade lazy-loading
// Le contenu lourd est découpé en sous-modules chargés à la demande.
// Architecture Task 8 : AdminPage ← lazy → admin/AdminUsersSection.js
//                                         → admin/AdminClassesSection.js
//                                         → admin/AdminStatsSection.js
import { Logger } from '../core/logger.js';
import { state } from '../core/state.js';
import * as supabaseAdmin from '../services/supabase-admin.js';

// Injecter le CSS des onglets admin (une seule fois)
if (!document.querySelector('link[href*="AdminPage.css"]')) {
    const link = document.createElement('link');
    link.rel  = 'stylesheet';
    link.href = '/src/pages/AdminPage.css';
    document.head.appendChild(link);
}

// ─── MAPPAGE DES SECTIONS → MODULES ──────────────────────────────────────────
const SECTION_MODULES = {
    users:   () => import('./admin/AdminUsersSection.js'),
    classes: () => import('./admin/AdminClassesSection.js'),
    stats:   () => import('./admin/AdminStatsSection.js'),
};

// ─── ÉTAT INTERNE ─────────────────────────────────────────────────────────────
let _activeSection  = 'users'; // section affichée
let _sectionModule  = null;    // module ES actuellement chargé
let _loading        = false;   // flag anti-concurrence (double-clic)

// ─── RENDER ──────────────────────────────────────────────────────────────────
export function render() {
    return `
        <div id="admin-page" class="page active">
            <section class="k-section">
                    <h2 class="k-section-title" style="text-align:center;margin-bottom:var(--space-6);">⚙️ لوحة الإدارة</h2>

                    <!-- Compteurs globaux (mis à jour par les sections) -->
                    <div class="k-grid2" style="margin-bottom:var(--space-6);">
                        <div class="k-stat-card">
                            <div class="k-stat-icon">👥</div>
                            <div class="k-stat-value gradient-value" id="admin-total-users">—</div>
                            <div class="k-stat-label">المستخدمون</div>
                        </div>
                        <div class="k-stat-card">
                            <div class="k-stat-icon">📋</div>
                            <div class="k-stat-value" id="admin-total-tasks">—</div>
                            <div class="k-stat-label">المهام</div>
                        </div>
                        <div class="k-stat-card">
                            <div class="k-stat-icon">⏳</div>
                            <div class="k-stat-value" id="admin-pending-subs">—</div>
                            <div class="k-stat-label">انتظار مراجعة</div>
                        </div>
                        <div class="k-stat-card">
                            <div class="k-stat-icon">✅</div>
                            <div class="k-stat-value" id="admin-approved-subs">—</div>
                            <div class="k-stat-label">مقبول</div>
                        </div>
                    </div>

                    <!-- Onglets de navigation entre sections -->
                    <div class="admin-tabs">
                        <button class="admin-tab active" data-section="users"   onclick="QuranReview.adminSwitchSection('users')">👥 المستخدمون</button>
                        <button class="admin-tab"        data-section="classes" onclick="QuranReview.adminSwitchSection('classes')">🏫 الفصول</button>
                        <button class="admin-tab"        data-section="stats"   onclick="QuranReview.adminSwitchSection('stats')">📊 الإحصاء</button>
                    </div>

                    <!-- Contenu dynamique de la section active -->
                    <div id="admin-section-content">
                        <!-- chargé via lazy-import lors de adminSwitchSection() -->
                    </div>
            </section>
        </div>
    `;
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
export async function init() {
    Logger.log('ADMIN', 'init — chargement section par défaut');

    // Charger la section initiale selon la sous-route (admin-classes, admin-stats, etc.)
    const page = state.currentPage;
    if (page === 'admin-classes')      await adminSwitchSection('classes');
    else if (page === 'admin-stats')   await adminSwitchSection('stats');
    else                               await adminSwitchSection('users');

    // Charger les compteurs globaux en arrière-plan (ne bloque pas l'affichage)
    _loadGlobalCounters();
}

// ─── CHANGEMENT DE SECTION (lazy-loading) ─────────────────────────────────────
export async function adminSwitchSection(section) {
    // Anti-concurrence : bloquer les appels simultanés (double-clic rapide)
    if (_loading) return;
    // Éviter le rechargement si on est déjà sur cette section avec le module en mémoire
    if (section === _activeSection && _sectionModule) return;

    _loading = true;
    _activeSection = section;

    // Mettre à jour le style actif des onglets
    document.querySelectorAll('.admin-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.section === section);
    });

    // Afficher un squelette de chargement
    const container = document.getElementById('admin-section-content');
    if (!container) { _loading = false; return; }
    container.innerHTML = '<div class="skeleton skeleton-card"></div>'.repeat(3);

    // Charger le module correspondant à la section
    const loader = SECTION_MODULES[section];
    if (!loader) {
        Logger.warn('ADMIN', `Section inconnue : ${section}`);
        container.innerHTML = '<p style="text-align:center; color:var(--color-danger);">Section introuvable</p>';
        _loading = false;
        return;
    }

    try {
        _sectionModule     = await loader();
        container.innerHTML = _sectionModule.render();
        await _sectionModule.init();
    } catch (err) {
        Logger.error('ADMIN', `Erreur chargement section ${section}`, err);
        container.innerHTML = `<p style="text-align:center; color:var(--color-danger);">فشل تحميل القسم</p>`;
    } finally {
        _loading = false; // toujours déverrouiller, même en cas d'erreur
    }
}

// ─── COMPTEURS GLOBAUX (appelés en arrière-plan) ─────────────────────────────
async function _loadGlobalCounters() {
    try {
        const { data, error } = await supabaseAdmin.getAdminOverview();
        if (error) return;
        const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
        set('admin-total-tasks',   data?.total_tasks          ?? '—');
        set('admin-pending-subs',  data?.pending_submissions  ?? '—');
        set('admin-approved-subs', data?.approved_submissions ?? '—');
    } catch (err) {
        Logger.warn('ADMIN', 'Impossible de charger les compteurs globaux', err);
    }
}
