# Navigation Refonte & UX Mobile — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transformer la navigation de QuranReview en une expérience distincte par rôle (visiteur / étudiant / enseignant / admin) avec une bottom bar mobile native et un design responsive complet.

**Architecture:** `NavManager.js` (nouveau module core) construit dynamiquement la nav top + bottom bar selon `state.user.role`. `HomePage.js` détecte l'état auth et rend soit la landing visiteur, soit le dashboard du rôle connecté. Les pages sont renommées/fusionnées pour refléter le vocabulaire pédagogique réel.

**Tech Stack:** Vanilla JS ES Modules, CSS custom properties, `clamp()` pour typographie fluide, `env(safe-area-inset-bottom)` pour iPhone notch, Django REST API existante.

---

## Améliorations UX validées (à respecter partout)

1. Hero: phrase d'explication immédiate du produit
2. Features: verbes d'action (Apprendre / Réviser / Envoyer)
3. Stats: format "+200 élèves" (honnête, pas de faux ronds)
4. `renderDashboard()`: switch avec fallback sur rôle inconnu
5. Dashboard étudiant: devoirs DU JOUR en premier, stats ensuite
6. Dashboard enseignant: carte "Élèves absents aujourd'hui"
7. Dashboard admin: carte "Soumissions aujourd'hui: N"
8. Bottom bar: bouton Soumettre au centre, légèrement plus grand
9. CSS: `max-width: 1200px; margin: auto` + `min-height: 100vh`
10. `body { padding-bottom: 80px }` quand bottom bar présente

---

## Task 1 : NavManager.js — module de navigation dynamique

**Files:**
- Create: `frontend/src/core/NavManager.js`

**Step 1 : Créer NavManager.js**

```javascript
// frontend/src/core/NavManager.js
import { state } from './state.js';
import { navigateTo } from './router.js';

const NAV_CONFIG = {
    visitor: [],  // pas de bottom bar
    student: [
        { key: 'home',     icon: '🏠', label: 'الرئيسية', center: false },
        { key: 'hifz',     icon: '📖', label: 'الحفظ',    center: false },
        { key: 'soumettre',icon: '🎧', label: 'إرسال',    center: true  },
        { key: 'revision', icon: '🔁', label: 'المراجعة', center: false },
        { key: 'profil',   icon: '👤', label: 'حسابي',   center: false },
    ],
    teacher: [
        { key: 'home',       icon: '🏠', label: 'الرئيسية',  center: false },
        { key: 'devoirs',    icon: '📋', label: 'الواجبات',  center: false },
        { key: 'soumissions',icon: '🎧', label: 'التسليمات', center: true  },
        { key: 'eleves',     icon: '👥', label: 'الطلاب',    center: false },
        { key: 'profil',     icon: '👤', label: 'حسابي',    center: false },
    ],
    admin: [
        { key: 'admin',         icon: '🏠', label: 'لوحة',      center: false },
        { key: 'admin-users',   icon: '👥', label: 'المستخدمون', center: false },
        { key: 'admin-classes', icon: '🏫', label: 'الفصول',    center: true  },
        { key: 'admin-stats',   icon: '📊', label: 'الإحصاء',   center: false },
        { key: 'profil',        icon: '⚙️', label: 'الإعدادات', center: false },
    ],
};

export function buildNav(role = 'visitor') {
    buildTopNav(role);
    buildBottomBar(role);
}

function buildTopNav(role) {
    const nav = document.querySelector('.top-nav-links');
    if (!nav) return;
    nav.innerHTML = '';

    if (role === 'visitor') {
        nav.innerHTML = `
            <button class="btn btn-glow btn-sm" onclick="showAuthModal()">تسجيل الدخول</button>
        `;
        return;
    }

    const tabs = NAV_CONFIG[role] || [];
    tabs.forEach(tab => {
        const a = document.createElement('a');
        a.href = '#';
        a.className = 'nav-link-pro';
        a.dataset.page = tab.key;
        a.textContent = tab.label;
        a.addEventListener('click', e => { e.preventDefault(); navigateTo(tab.key); });
        nav.appendChild(a);
    });

    // Bouton logout
    nav.insertAdjacentHTML('beforeend', `
        <button class="btn btn-outline-glow btn-sm" onclick="QuranReview.logout()">خروج</button>
    `);
}

function buildBottomBar(role) {
    const bar = document.getElementById('bottom-bar');
    if (!bar) return;

    if (role === 'visitor') {
        bar.style.display = 'none';
        document.body.classList.remove('has-bottom-bar');
        return;
    }

    const tabs = NAV_CONFIG[role] || [];
    bar.innerHTML = tabs.map(tab => `
        <a class="bottom-tab${tab.center ? ' bottom-tab--center' : ''}"
           data-page="${tab.key}"
           href="#"
           onclick="event.preventDefault(); QuranReview.navigateTo('${tab.key}')">
            <span class="tab-icon">${tab.icon}</span>
            <span class="tab-label">${tab.label}</span>
        </a>
    `).join('');

    bar.style.display = 'flex';
    document.body.classList.add('has-bottom-bar');
}

export function setActiveTab(pageName) {
    document.querySelectorAll('.nav-link-pro, .bottom-tab').forEach(el => {
        el.classList.toggle('active', el.dataset.page === pageName);
    });
}
```

**Step 2 : Vérifier manuellement la syntaxe** (pas de bundler — vérifier les imports circulaires)

`router.js` importe des pages → les pages n'importent pas `router.js` → OK.
`NavManager.js` importe `router.js` → `router.js` N'importe PAS `NavManager.js` → OK.

**Step 3 : Commit**

```bash
git add frontend/src/core/NavManager.js
git commit -m "feat(nav): NavManager.js — navigation dynamique par rôle"
```

---

## Task 2 : index.html — markup bottom bar + nettoyage nav

**Files:**
- Modify: `frontend/index.html`

**Step 1 : Remplacer la nav inline par la structure dynamique**

Trouver le bloc `<header class="header-pro header-glass">` et remplacer tous les `<a>` de nav par un conteneur vide :

```html
<header class="header-pro header-glass">
    <div class="nav-container">
        <div class="nav-brand">
            <h1 class="gradient-text">🕌 مراجعة القرآن</h1>
        </div>
        <nav class="top-nav-links">
            <!-- Injecté dynamiquement par NavManager.buildNav(role) -->
        </nav>
    </div>
</header>
```

**Step 2 : Ajouter la bottom bar juste avant `</body>`**

```html
<!-- Bottom Bar Mobile — injectée par NavManager -->
<nav id="bottom-bar" class="bottom-bar" style="display:none;">
    <!-- Onglets injectés par NavManager.buildBottomBar(role) -->
</nav>
```

**Step 3 : Supprimer les anciens `data-page` et `display:none` inline**

Supprimer les lignes :
```html
<!-- À supprimer -->
<a href="#" class="nav-link-pro nav-student-only" data-page="mytasks" style="display:none;">📝 مهامي</a>
<a href="#" class="nav-link-pro nav-teacher-only" data-page="teacher" style="display:none;">👨‍🏫 المعلم</a>
<a href="#" class="nav-link-pro nav-admin-only" data-page="admin" style="display:none;">⚙️ الإدارة</a>
```

**Step 4 : Commit**

```bash
git add frontend/index.html
git commit -m "feat(nav): index.html — markup bottom bar + nav container dynamique"
```

---

## Task 3 : NavManager.css — bottom bar + responsive global

**Files:**
- Create: `frontend/src/core/NavManager.css`
- Modify: `frontend/style-pro.css` (importer NavManager.css ou ajouter les règles)

**Step 1 : Créer NavManager.css**

```css
/* ── Bottom Bar ──────────────────────────────────────────────────── */
.bottom-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 64px;
    padding-bottom: env(safe-area-inset-bottom);
    background: var(--color-surface, #1a1a2e);
    border-top: 1px solid rgba(255,255,255,0.08);
    display: none; /* activé par NavManager */
    align-items: center;
    justify-content: space-around;
    z-index: 1000;
}

@media (max-width: 768px) {
    .bottom-bar { display: flex; }
    .header-pro nav { display: none; } /* top nav masquée sur mobile */
}

.bottom-tab {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    min-width: 44px;
    min-height: 44px;
    text-decoration: none;
    color: var(--color-text-muted, #888);
    transition: color 0.2s;
    flex: 1;
}

.bottom-tab--center {
    background: var(--color-primary, #4CAF50);
    border-radius: 50%;
    width: 56px;
    height: 56px;
    min-width: 56px;
    margin-top: -16px;
    color: white;
    flex: none;
    box-shadow: 0 4px 16px rgba(76, 175, 80, 0.4);
}

.bottom-tab.active { color: var(--color-primary, #4CAF50); }
.bottom-tab--center.active { background: var(--color-primary-dark, #388E3C); }

.tab-icon { font-size: 1.25rem; line-height: 1; }
.tab-label { font-size: 0.6rem; font-weight: 500; }

/* ── Body padding quand bottom bar présente ─────────────────────── */
body.has-bottom-bar {
    padding-bottom: 80px;
}

/* ── Corrections responsive globales ───────────────────────────── */
.container-pro,
.nav-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 var(--space-4, 1rem);
}

/* Min height pour éviter pages trop courtes */
#app-content, main {
    min-height: 100vh;
}

/* Typographie fluide */
h1, .hero-title    { font-size: clamp(1.5rem, 4vw, 3rem); }
h2, .section-title { font-size: clamp(1.2rem, 3vw, 2rem); }
p, .body-text      { font-size: clamp(0.875rem, 2vw, 1rem); }

/* Grilles auto-fit */
.stats-grid    { grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); }
.features-grid { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }

/* Touch targets */
.btn, button, a.nav-link-pro, .card-action {
    min-height: 44px;
}

/* Padding cards fluide */
.card, .card-pro {
    padding: clamp(0.75rem, 2vw, 1.5rem);
}

/* Modals mobile */
@media (max-width: 768px) {
    .modal-content, .modal-pro {
        max-height: 90vh;
        border-radius: 1rem 1rem 0 0;
        overflow-y: auto;
    }
}
```

**Step 2 : Importer dans index.html**

Ajouter dans `<head>` :
```html
<link rel="stylesheet" href="/src/core/NavManager.css">
```

**Step 3 : Commit**

```bash
git add frontend/src/core/NavManager.css frontend/index.html
git commit -m "feat(nav): NavManager.css — bottom bar + corrections responsive globales"
```

---

## Task 4 : router.js — nouvelles routes + aliases + NavManager

**Files:**
- Modify: `frontend/src/core/router.js`

**Step 1 : Ajouter les imports des nouvelles pages**

```javascript
// Nouvelles pages (à ajouter après les imports existants)
import * as RevisionPage from '../pages/RevisionPage.js';
import * as SoumissionPage from '../pages/SoumissionPage.js';
import * as ProfilPage from '../pages/ProfilPage.js';
import { buildNav, setActiveTab } from './NavManager.js';
```

**Step 2 : Mettre à jour le registre des pages**

```javascript
const pages = {
    // ── Existantes conservées ──
    home: HomePage,
    competition: CompetitionPage,
    teacher: TeacherPage,
    admin: AdminPage,

    // ── Renommées/fusionnées ──
    hifz: HifzPage,           // ex-MemorizationPage + HifzPage fusionnées
    revision: RevisionPage,   // ex-WardPage
    soumettre: SoumissionPage,// ex-MyTasksPage
    profil: ProfilPage,       // ex-SettingsPage + ProgressPage

    // ── Routes admin ──
    'admin-users':   AdminPage,  // sub-view (même page, tab différent)
    'admin-classes': AdminPage,
    'admin-stats':   AdminPage,

    // ── Aliases rétrocompatibilité ──
    memorization: HifzPage,
    ward: RevisionPage,
    mytasks: SoumissionPage,
    settings: ProfilPage,
    progress: ProfilPage,
};
```

**Step 3 : Mettre à jour `navigateTo` pour appeler `setActiveTab`**

```javascript
export function navigateTo(pageName) {
    Logger.nav(state.currentPage, pageName);
    AudioManager.stopAll();
    state.currentPage = pageName;
    setActiveTab(pageName);   // ← ajouter cette ligne
    renderPage(pageName);
}
```

**Step 4 : Commit**

```bash
git add frontend/src/core/router.js
git commit -m "feat(router): nouvelles routes hifz/revision/soumettre/profil + aliases rétrocompat"
```

---

## Task 5 : HomePage.js — landing visiteur

**Files:**
- Modify: `frontend/src/pages/HomePage.js`

**Step 1 : Remplacer `render()` et `init()` par la logique de détection**

```javascript
// frontend/src/pages/HomePage.js
import { state } from '../core/state.js';
import { config } from '../core/config.js';

export function render() {
    if (!state.user) return renderLanding();
    switch (state.user.role) {
        case 'student': return renderDashboard('student');
        case 'teacher': return renderDashboard('teacher');
        case 'admin':   return renderDashboard('admin');
        default:        return renderLanding(); // fallback rôle inconnu
    }
}

export function init() {
    if (!state.user) return initLanding();
    switch (state.user.role) {
        case 'student': return initDashboard('student');
        case 'teacher': return initDashboard('teacher');
        case 'admin':   return initDashboard('admin');
        default:        return initLanding();
    }
}
```

**Step 2 : Implémenter `renderLanding()`**

```javascript
function renderLanding() {
    return `
    <div class="landing-page">

        <!-- HERO -->
        <section class="landing-hero">
            <div class="hero-content">
                <div class="hero-logo">🕌</div>
                <h1 class="hero-title">مراجعة القرآن</h1>
                <p class="hero-subtitle">منصة لإدارة حلقات تحفيظ القرآن ومراجعة الحفظ من المنزل</p>
                <div class="hero-actions">
                    <button class="btn btn-glow btn-lg" onclick="showAuthModal()">تسجيل الدخول</button>
                    <button class="btn btn-outline-glow btn-lg" onclick="QuranReview.showRegisterForm()">إنشاء حساب</button>
                </div>
            </div>
        </section>

        <!-- FEATURES -->
        <section class="landing-features">
            <div class="features-grid">
                <div class="feature-card">
                    <span class="feature-icon">📖</span>
                    <h3>تعلّم سورة جديدة</h3>
                    <p>احفظ سوراً جديدة مع نظام متتابع يساعدك على التقدم خطوة بخطوة</p>
                </div>
                <div class="feature-card">
                    <span class="feature-icon">🔁</span>
                    <h3>راجع محفوظاتك</h3>
                    <p>نظام مراجعة ذكي يضمن تثبيت الحفظ وعدم النسيان بمرور الوقت</p>
                </div>
                <div class="feature-card">
                    <span class="feature-icon">🎧</span>
                    <h3>أرسل تلاوتك للمعلم</h3>
                    <p>سجّل تلاوتك وأرسلها مباشرة للمعلم لتلقي التصحيح والتقييم</p>
                </div>
            </div>
        </section>

        <!-- STATS -->
        <section class="landing-stats">
            <div class="stats-grid">
                <div class="stat-card">
                    <span class="stat-number" data-target="${state.stats?.students || 200}">+200</span>
                    <span class="stat-label">طالب نشيط</span>
                </div>
                <div class="stat-card">
                    <span class="stat-number" data-target="${state.stats?.teachers || 20}">+20</span>
                    <span class="stat-label">معلم متخصص</span>
                </div>
                <div class="stat-card">
                    <span class="stat-number" data-target="${state.stats?.mosques || 8}">+8</span>
                    <span class="stat-label">مسجد شريك</span>
                </div>
            </div>
        </section>

        <!-- CTA FINAL -->
        <section class="landing-cta">
            <h2>انضم إلى حلقتك اليوم</h2>
            <button class="btn btn-glow btn-lg" onclick="QuranReview.showRegisterForm()">إنشاء حساب مجاني</button>
        </section>

    </div>
    `;
}

function initLanding() {
    // Animation compteurs stats au scroll
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.stat-number[data-target]').forEach(el => observer.observe(el));
}

function animateCounter(el) {
    const target = parseInt(el.dataset.target) || 0;
    const prefix = '+';
    let count = 0;
    const step = Math.ceil(target / 40);
    const timer = setInterval(() => {
        count = Math.min(count + step, target);
        el.textContent = prefix + count;
        if (count >= target) clearInterval(timer);
    }, 30);
}
```

**Step 3 : Commit**

```bash
git add frontend/src/pages/HomePage.js
git commit -m "feat(home): landing visiteur — hero + features (verbes) + stats animées + CTA"
```

---

## Task 6 : HomePage.js — dashboards par rôle

**Files:**
- Modify: `frontend/src/pages/HomePage.js`

**Step 1 : Implémenter `renderDashboard(role)`**

```javascript
function renderDashboard(role) {
    const dashboards = { student: renderStudentDashboard, teacher: renderTeacherDashboard, admin: renderAdminDashboard };
    return (dashboards[role] || renderLanding)();
}

function renderStudentDashboard() {
    const name = state.user?.first_name || state.user?.username || 'طالب';
    return `
    <div class="dashboard dashboard-student">
        <div class="dashboard-header">
            <h2>مرحباً يا ${name} 👋</h2>
            <p class="dashboard-date">${getArabicDate()}</p>
        </div>

        <!-- DEVOIRS DU JOUR EN PREMIER -->
        <section class="dashboard-section">
            <h3 class="section-title">📋 واجبات اليوم</h3>
            <div id="student-tasks-list" class="tasks-list">
                <div class="loading-placeholder">جاري التحميل...</div>
            </div>
        </section>

        <!-- STATS -->
        <section class="dashboard-section">
            <div class="stats-grid">
                <div class="stat-card"><span class="stat-icon">📖</span><span id="hifz-progress">—</span><span class="stat-label">الحفظ</span></div>
                <div class="stat-card"><span class="stat-icon">🔁</span><span id="revision-score">—</span><span class="stat-label">المراجعة</span></div>
                <div class="stat-card"><span class="stat-icon">🔥</span><span id="streak-days">—</span><span class="stat-label">أيام متتالية</span></div>
            </div>
        </section>

        <!-- ACCÈS RAPIDE -->
        <section class="dashboard-section">
            <h3 class="section-title">⚡ وصول سريع</h3>
            <div class="quick-actions">
                <button class="quick-btn" onclick="QuranReview.navigateTo('hifz')">📖 الحفظ</button>
                <button class="quick-btn" onclick="QuranReview.navigateTo('revision')">🔁 المراجعة</button>
                <button class="quick-btn" onclick="QuranReview.navigateTo('competition')">🏆 المسابقة</button>
            </div>
        </section>
    </div>
    `;
}

function renderTeacherDashboard() {
    const name = state.user?.first_name || state.user?.username || 'أستاذ';
    return `
    <div class="dashboard dashboard-teacher">
        <div class="dashboard-header">
            <h2>مرحباً أستاذ ${name}</h2>
        </div>

        <!-- STATS -->
        <div class="stats-grid">
            <div class="stat-card"><span id="t-students">—</span><span class="stat-label">👥 طلاب</span></div>
            <div class="stat-card"><span id="t-tasks">—</span><span class="stat-label">📝 واجبات</span></div>
            <div class="stat-card"><span id="t-pending">—</span><span class="stat-label">⏳ بانتظار التصحيح</span></div>
            <div class="stat-card"><span id="t-absent">—</span><span class="stat-label">❌ غياب اليوم</span></div>
        </div>

        <!-- SOUMISSIONS RÉCENTES -->
        <section class="dashboard-section">
            <h3 class="section-title">🎧 آخر التسليمات</h3>
            <div id="teacher-submissions-list" class="submissions-list">
                <div class="loading-placeholder">جاري التحميل...</div>
            </div>
        </section>

        <!-- ACCÈS RAPIDE -->
        <section class="dashboard-section">
            <div class="quick-actions">
                <button class="quick-btn quick-btn--primary" onclick="QuranReview.navigateTo('devoirs')">+ واجب جديد</button>
                <button class="quick-btn" onclick="QuranReview.navigateTo('soumissions')">📋 كل التسليمات</button>
            </div>
        </section>
    </div>
    `;
}

function renderAdminDashboard() {
    return `
    <div class="dashboard dashboard-admin">
        <div class="dashboard-header">
            <h2>لوحة الإدارة</h2>
        </div>

        <!-- STATS GLOBALES -->
        <div class="stats-grid">
            <div class="stat-card"><span id="a-users">—</span><span class="stat-label">👥 مستخدمون</span></div>
            <div class="stat-card"><span id="a-teachers">—</span><span class="stat-label">👨‍🏫 معلمون</span></div>
            <div class="stat-card"><span id="a-students">—</span><span class="stat-label">👨‍🎓 طلاب</span></div>
            <div class="stat-card"><span id="a-today">—</span><span class="stat-label">📤 تسليمات اليوم</span></div>
        </div>

        <!-- ACTIVITÉ RÉCENTE -->
        <section class="dashboard-section">
            <h3 class="section-title">📊 النشاط الأخير</h3>
            <div id="admin-activity-list" class="activity-list">
                <div class="loading-placeholder">جاري التحميل...</div>
            </div>
        </section>

        <!-- ACCÈS RAPIDE -->
        <section class="dashboard-section">
            <div class="quick-actions">
                <button class="quick-btn" onclick="QuranReview.navigateTo('admin-users')">👥 المستخدمون</button>
                <button class="quick-btn" onclick="QuranReview.navigateTo('admin-stats')">📊 الإحصاء</button>
            </div>
        </section>
    </div>
    `;
}
```

**Step 2 : Implémenter les `initDashboard` (fetch API)**

```javascript
async function initDashboard(role) {
    const token = localStorage.getItem(config.apiTokenKey);
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    if (role === 'student') {
        // Charger tâches en attente
        const res = await fetch(`${config.apiBaseUrl}/api/tasks/`, { headers }).catch(() => null);
        if (res?.ok) {
            const tasks = await res.json();
            const pending = tasks.filter(t => t.status === 'pending');
            renderStudentTasks(pending);
        }
    }

    if (role === 'teacher') {
        const res = await fetch(`${config.apiBaseUrl}/api/submissions/?status=pending`, { headers }).catch(() => null);
        if (res?.ok) {
            const subs = await res.json();
            renderTeacherSubmissions(subs);
            document.getElementById('t-pending').textContent = subs.length;
        }
    }

    if (role === 'admin') {
        const res = await fetch(`${config.apiBaseUrl}/api/admin/overview/`, { headers }).catch(() => null);
        if (res?.ok) {
            const data = await res.json();
            document.getElementById('a-users').textContent    = '+' + (data.total_users || 0);
            document.getElementById('a-teachers').textContent = data.total_teachers || 0;
            document.getElementById('a-students').textContent = data.total_students || 0;
            document.getElementById('a-today').textContent    = data.submissions_today || 0;
        }
    }
}

function renderStudentTasks(tasks) {
    const el = document.getElementById('student-tasks-list');
    if (!el) return;
    if (!tasks.length) { el.innerHTML = '<p class="empty-state">لا توجد واجبات اليوم 🎉</p>'; return; }
    el.innerHTML = tasks.slice(0, 3).map(t => `
        <div class="task-row">
            <span class="task-name">${t.surah_name || t.title || 'واجب'}</span>
            <button class="btn btn-sm btn-glow" onclick="QuranReview.navigateTo('soumettre')">إرسال 🎧</button>
        </div>
    `).join('');
}

function renderTeacherSubmissions(subs) {
    const el = document.getElementById('teacher-submissions-list');
    if (!el) return;
    if (!subs.length) { el.innerHTML = '<p class="empty-state">لا توجد تسليمات في الانتظار ✅</p>'; return; }
    el.innerHTML = subs.slice(0, 5).map(s => `
        <div class="submission-row">
            <span>${s.student_name || 'طالب'} — ${s.task_title || 'تسليم'}</span>
            <span class="badge badge-warning">⏳ بانتظار التصحيح</span>
        </div>
    `).join('');
}

function getArabicDate() {
    return new Date().toLocaleDateString('ar-MA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}
```

**Step 3 : Commit**

```bash
git add frontend/src/pages/HomePage.js
git commit -m "feat(home): dashboards étudiant/enseignant/admin avec fetch API"
```

---

## Task 7 : HomePage.css — styles landing + dashboard

**Files:**
- Create: `frontend/src/pages/HomePage.css`

**Step 1 : Créer le fichier CSS**

```css
/* ── Landing Hero ────────────────────────────────────────────────── */
.landing-hero {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    background: linear-gradient(135deg, #0d2d0d 0%, #1a3d1a 40%, #0a0a1a 100%);
    padding: 2rem;
}
.hero-logo   { font-size: clamp(3rem, 8vw, 6rem); margin-bottom: 1rem; }
.hero-title  { font-size: clamp(2rem, 5vw, 4rem); color: #fff; font-weight: 700; }
.hero-subtitle {
    font-size: clamp(1rem, 2.5vw, 1.3rem);
    color: rgba(255,255,255,0.75);
    max-width: 600px;
    margin: 1rem auto 2rem;
    line-height: 1.6;
}
.hero-actions { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }

/* ── Features ────────────────────────────────────────────────────── */
.landing-features { padding: 4rem 2rem; }
.feature-card {
    background: var(--color-surface);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 1rem;
    padding: clamp(1.5rem, 3vw, 2.5rem);
    text-align: center;
    transition: transform 0.2s, box-shadow 0.2s;
}
.feature-card:hover { transform: translateY(-4px); box-shadow: 0 8px 32px rgba(76,175,80,0.2); }
.feature-icon { font-size: 2.5rem; display: block; margin-bottom: 1rem; }

/* ── Stats ───────────────────────────────────────────────────────── */
.landing-stats { padding: 3rem 2rem; background: rgba(255,255,255,0.02); }
.stat-card    { text-align: center; padding: 1.5rem; }
.stat-number  { display: block; font-size: clamp(2rem, 5vw, 3rem); font-weight: 700; color: var(--color-primary); }
.stat-label   { font-size: 0.875rem; color: var(--color-text-muted); margin-top: 0.25rem; display: block; }

/* ── CTA Final ───────────────────────────────────────────────────── */
.landing-cta { padding: 4rem 2rem; text-align: center; }
.landing-cta h2 { font-size: clamp(1.5rem, 4vw, 2.5rem); margin-bottom: 1.5rem; }

/* ── Dashboard ───────────────────────────────────────────────────── */
.dashboard { padding: clamp(1rem, 3vw, 2rem); max-width: 900px; margin: 0 auto; }
.dashboard-header { margin-bottom: 2rem; }
.dashboard-header h2 { font-size: clamp(1.3rem, 3vw, 2rem); }
.dashboard-date  { color: var(--color-text-muted); font-size: 0.875rem; margin-top: 0.25rem; }
.dashboard-section { margin-bottom: 2rem; }
.section-title   { font-size: 1rem; font-weight: 600; margin-bottom: 1rem; }

/* Tâches étudiant */
.task-row, .submission-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background: var(--color-surface);
    border-radius: 0.5rem;
    margin-bottom: 0.5rem;
    gap: 1rem;
}
.task-name { flex: 1; font-size: 0.9rem; }

/* Accès rapide */
.quick-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
.quick-btn {
    flex: 1;
    min-width: 120px;
    min-height: 44px;
    border-radius: 0.75rem;
    font-size: 0.875rem;
    font-weight: 500;
    padding: 0.75rem 1rem;
    cursor: pointer;
    background: var(--color-surface);
    border: 1px solid rgba(255,255,255,0.1);
    color: var(--color-text);
    transition: background 0.2s;
}
.quick-btn--primary {
    background: var(--color-primary);
    color: white;
    border-color: transparent;
}
.empty-state { text-align: center; color: var(--color-text-muted); padding: 2rem; }
.loading-placeholder { color: var(--color-text-muted); padding: 1rem; text-align: center; }
```

**Step 2 : Importer dans index.html**

```html
<link rel="stylesheet" href="/src/pages/HomePage.css">
```

**Step 3 : Commit**

```bash
git add frontend/src/pages/HomePage.css frontend/index.html
git commit -m "feat(home): HomePage.css — landing + dashboard styles mobile-first"
```

---

## Task 8 : RevisionPage.js — ex-WardPage renommée

**Files:**
- Create: `frontend/src/pages/RevisionPage.js`
- Keep: `frontend/src/pages/WardPage.js` (ne pas supprimer — alias dans router)

**Step 1 : Créer RevisionPage.js (re-export de WardPage)**

```javascript
// frontend/src/pages/RevisionPage.js
// RevisionPage = WardPage renommée (ex-Ward/Muraja'a)
export * from './WardPage.js';
```

Cette approche préserve tout le code existant de WardPage sans duplication.

**Step 2 : Commit**

```bash
git add frontend/src/pages/RevisionPage.js
git commit -m "feat(pages): RevisionPage — alias WardPage (muraja'a)"
```

---

## Task 9 : SoumissionPage.js — ex-MyTasksPage renommée

**Files:**
- Create: `frontend/src/pages/SoumissionPage.js`

**Step 1 : Créer SoumissionPage.js (re-export de MyTasksPage)**

```javascript
// frontend/src/pages/SoumissionPage.js
// SoumissionPage = MyTasksPage renommée (tâches + soumission audio)
export * from './MyTasksPage.js';
```

**Step 2 : Commit**

```bash
git add frontend/src/pages/SoumissionPage.js
git commit -m "feat(pages): SoumissionPage — alias MyTasksPage"
```

---

## Task 10 : ProfilPage.js — fusion SettingsPage + ProgressPage

**Files:**
- Create: `frontend/src/pages/ProfilPage.js`

**Step 1 : Créer ProfilPage.js**

```javascript
// frontend/src/pages/ProfilPage.js
// ProfilPage = SettingsPage + ProgressPage fusionnées
import * as SettingsPage from './SettingsPage.js';
import * as ProgressPage from './ProgressPage.js';

export function render() {
    return `
    <div class="profil-page">
        <div class="profil-tabs">
            <button class="profil-tab active" onclick="switchProfilTab('progress')">📊 تقدمي</button>
            <button class="profil-tab" onclick="switchProfilTab('settings')">⚙️ الإعدادات</button>
        </div>
        <div id="profil-tab-content">
            ${ProgressPage.render()}
        </div>
    </div>
    `;
}

export function init() {
    ProgressPage.init?.();
}

export function switchProfilTab(tab) {
    document.querySelectorAll('.profil-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`[onclick="switchProfilTab('${tab}')"]`)?.classList.add('active');
    const content = document.getElementById('profil-tab-content');
    if (!content) return;
    if (tab === 'progress') { content.innerHTML = ProgressPage.render(); ProgressPage.init?.(); }
    if (tab === 'settings') { content.innerHTML = SettingsPage.render?.() || SettingsPage.renderSettingsPage?.() || ''; SettingsPage.init?.(); }
}

// Re-exporter les fonctions SettingsPage pour la façade
export * from './SettingsPage.js';
```

**Step 2 : Ajouter `switchProfilTab` à la façade dans main.js**

```javascript
// Dans window.QuranReview = { ... }
switchProfilTab: ProfilPage.switchProfilTab,
```

**Step 3 : Commit**

```bash
git add frontend/src/pages/ProfilPage.js frontend/src/main.js
git commit -m "feat(pages): ProfilPage — fusion SettingsPage + ProgressPage avec onglets"
```

---

## Task 11 : main.js — imports + façade mise à jour

**Files:**
- Modify: `frontend/src/main.js`

**Step 1 : Ajouter les imports des nouvelles pages**

```javascript
// Ajouter après les imports existants
import * as RevisionPage   from './pages/RevisionPage.js';
import * as SoumissionPage from './pages/SoumissionPage.js';
import * as ProfilPage     from './pages/ProfilPage.js';
import { buildNav }        from './core/NavManager.js';
```

**Step 2 : Appeler `buildNav` dans `initAuth()` après login**

Dans `auth.js` ou `main.js`, après avoir détecté le rôle :
```javascript
import { buildNav } from './core/NavManager.js';

// Dans initAuth(), après state.user = userData :
buildNav(state.user?.role || 'visitor');
```

**Step 3 : Ajouter `switchProfilTab` à la façade**

```javascript
window.QuranReview = {
    // ... existant ...
    switchProfilTab: ProfilPage.switchProfilTab,
};
```

**Step 4 : Commit**

```bash
git add frontend/src/main.js
git commit -m "feat(main): imports nouvelles pages + buildNav au login + façade mise à jour"
```

---

## Task 12 : Vérification finale

**Step 1 : Tester les 4 modes**

Ouvrir `http://localhost:80` (Docker) ou `http://localhost:3000` et vérifier :

| Scénario | Attendu |
|---|---|
| Visiteur non connecté | Landing hero + features + stats + CTA |
| Login étudiant | Dashboard devoirs → stats → accès rapide |
| Login enseignant | Dashboard stats (4 cartes) → soumissions → accès rapide |
| Login admin | Dashboard 4 cartes globales → activité → accès rapide |
| Mobile (< 768px) | Bottom bar visible, top nav masquée, bouton central Soumettre/Soumissions |
| Desktop (> 768px) | Top nav visible, bottom bar masquée |
| Route `/ward` | Redirige vers RevisionPage (alias) |
| Route `/settings` | Redirige vers ProfilPage (alias) |

**Step 2 : Vérifier les touch targets sur mobile**

Utiliser DevTools → mode mobile → tester que tous les boutons et onglets sont facilement cliquables.

**Step 3 : Vérifier le padding-bottom**

Sur mobile, scroller jusqu'en bas d'une page → dernière card visible (pas cachée par la bottom bar).

**Step 4 : Commit final**

```bash
git add -A
git commit -m "feat(nav): refonte navigation complète — landing/dashboard/bottom-bar/responsive"
git push origin main
```

---

## Ordre d'exécution recommandé

```text
Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6 → Task 7
→ Task 8 → Task 9 → Task 10 → Task 11 → Task 12
```

Chaque task est indépendante sauf Task 4 (router) qui doit venir après Tasks 8-10 (pages créées).
