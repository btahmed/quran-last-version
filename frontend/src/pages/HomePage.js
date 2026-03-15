// frontend/src/pages/HomePage.js
// Page d'accueil intelligente : landing visiteur OU dashboard selon le rôle
import { state } from '../core/state.js';
import { config } from '../core/config.js';

// ══════════════════════════════════════════════════════════════
// Point d'entrée principal — détection visiteur / rôle connecté
// ══════════════════════════════════════════════════════════════

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

// ══════════════════════════════════════════════════════════════
// LANDING PAGE — visiteur non connecté
// ══════════════════════════════════════════════════════════════

function renderLanding() {
    return `
    <div class="landing-page" dir="rtl">

        <!-- HERO -->
        <section class="landing-hero">
            <div class="hero-content">
                <div class="hero-logo">🕌</div>
                <h1 class="hero-title">مراجعة القرآن</h1>
                <p class="hero-subtitle">
                    منصة لإدارة حلقات تحفيظ القرآن ومراجعة الحفظ من المنزل
                </p>
                <div class="hero-actions">
                    <button class="btn btn-glow btn-lg"
                            onclick="showAuthModal()">
                        تسجيل الدخول
                    </button>
                    <button class="btn btn-outline-glow btn-lg"
                            onclick="QuranReview.showRegisterForm()">
                        إنشاء حساب
                    </button>
                </div>
            </div>
        </section>

        <!-- FEATURES — verbes d'action -->
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

        <!-- STATS LIVE — format honnête "+N" -->
        <section class="landing-stats">
            <div class="stats-grid">
                <div class="stat-card">
                    <span class="stat-number" data-target="224">+224</span>
                    <span class="stat-label">طالب نشيط</span>
                </div>
                <div class="stat-card">
                    <span class="stat-number" data-target="21">+21</span>
                    <span class="stat-label">معلم متخصص</span>
                </div>
                <div class="stat-card">
                    <span class="stat-number" data-target="8">+8</span>
                    <span class="stat-label">مسجد شريك</span>
                </div>
            </div>
        </section>

        <!-- CTA FINAL -->
        <section class="landing-cta">
            <h2>انضم إلى حلقتك اليوم</h2>
            <button class="btn btn-glow btn-lg"
                    onclick="QuranReview.showRegisterForm()">
                إنشاء حساب مجاني
            </button>
        </section>

    </div>
    `;
}

function initLanding() {
    // Animation compteurs stats au scroll (IntersectionObserver)
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.stat-number[data-target]').forEach(el =>
        observer.observe(el)
    );
}

function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10) || 0;
    let count = 0;
    const step = Math.max(1, Math.ceil(target / 40));
    const timer = setInterval(() => {
        count = Math.min(count + step, target);
        el.textContent = '+' + count;
        if (count >= target) clearInterval(timer);
    }, 30);
}

// ══════════════════════════════════════════════════════════════
// DASHBOARDS — utilisateurs connectés
// ══════════════════════════════════════════════════════════════

function renderDashboard(role) {
    const renderers = {
        student: renderStudentDashboard,
        teacher: renderTeacherDashboard,
        admin:   renderAdminDashboard,
    };
    return (renderers[role] || renderLanding)();
}

// ── Dashboard étudiant ────────────────────────────────────────

function renderStudentDashboard() {
    const name = state.user?.first_name || state.user?.username || 'طالب';
    return `
    <div class="dashboard dashboard-student" dir="rtl">
        <div class="dashboard-header">
            <h2>مرحباً يا ${escapeHtml(name)} 👋</h2>
            <p class="dashboard-date">${getArabicDate()}</p>
        </div>

        <!-- DEVOIRS DU JOUR EN PREMIER (action avant statistiques) -->
        <section class="dashboard-section">
            <h3 class="section-title">📋 واجبات اليوم</h3>
            <div id="student-tasks-list" class="tasks-list">
                <div class="loading-placeholder">جاري التحميل...</div>
            </div>
        </section>

        <!-- STATS -->
        <section class="dashboard-section">
            <div class="stats-grid">
                <div class="stat-card">
                    <span class="stat-icon">📖</span>
                    <span id="hifz-progress" class="stat-value">—</span>
                    <span class="stat-label">الحفظ</span>
                </div>
                <div class="stat-card">
                    <span class="stat-icon">🔁</span>
                    <span id="revision-score" class="stat-value">—</span>
                    <span class="stat-label">المراجعة</span>
                </div>
                <div class="stat-card">
                    <span class="stat-icon">🔥</span>
                    <span id="streak-days" class="stat-value">—</span>
                    <span class="stat-label">أيام متتالية</span>
                </div>
            </div>
        </section>

        <!-- ACCÈS RAPIDE -->
        <section class="dashboard-section">
            <h3 class="section-title">⚡ وصول سريع</h3>
            <div class="quick-actions">
                <button class="quick-btn"
                        onclick="QuranReview.navigateTo('hifz')">
                    📖 الحفظ
                </button>
                <button class="quick-btn"
                        onclick="QuranReview.navigateTo('revision')">
                    🔁 المراجعة
                </button>
                <button class="quick-btn"
                        onclick="QuranReview.navigateTo('competition')">
                    🏆 المسابقة
                </button>
            </div>
        </section>
    </div>
    `;
}

// ── Dashboard enseignant ──────────────────────────────────────

function renderTeacherDashboard() {
    const name = state.user?.first_name || state.user?.username || 'أستاذ';
    return `
    <div class="dashboard dashboard-teacher" dir="rtl">
        <div class="dashboard-header">
            <h2>مرحباً أستاذ ${escapeHtml(name)}</h2>
        </div>

        <!-- STATS (4 cartes dont absents) -->
        <div class="stats-grid">
            <div class="stat-card">
                <span id="t-students" class="stat-value">—</span>
                <span class="stat-label">👥 طلاب</span>
            </div>
            <div class="stat-card">
                <span id="t-tasks" class="stat-value">—</span>
                <span class="stat-label">📝 واجبات</span>
            </div>
            <div class="stat-card">
                <span id="t-pending" class="stat-value">—</span>
                <span class="stat-label">⏳ بانتظار التصحيح</span>
            </div>
            <div class="stat-card">
                <span id="t-absent" class="stat-value">—</span>
                <span class="stat-label">❌ غياب اليوم</span>
            </div>
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
                <button class="quick-btn quick-btn--primary"
                        onclick="QuranReview.navigateTo('teacher')">
                    + واجب جديد
                </button>
                <button class="quick-btn"
                        onclick="QuranReview.navigateTo('teacher')">
                    📋 كل التسليمات
                </button>
            </div>
        </section>
    </div>
    `;
}

// ── Dashboard admin ───────────────────────────────────────────

function renderAdminDashboard() {
    return `
    <div class="dashboard dashboard-admin" dir="rtl">
        <div class="dashboard-header">
            <h2>لوحة الإدارة</h2>
        </div>

        <!-- STATS GLOBALES (dont soumissions aujourd'hui) -->
        <div class="stats-grid">
            <div class="stat-card">
                <span id="a-users" class="stat-value">—</span>
                <span class="stat-label">👥 مستخدمون</span>
            </div>
            <div class="stat-card">
                <span id="a-teachers" class="stat-value">—</span>
                <span class="stat-label">👨‍🏫 معلمون</span>
            </div>
            <div class="stat-card">
                <span id="a-students" class="stat-value">—</span>
                <span class="stat-label">👨‍🎓 طلاب</span>
            </div>
            <div class="stat-card">
                <span id="a-today" class="stat-value">—</span>
                <span class="stat-label">📤 تسليمات اليوم</span>
            </div>
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
                <button class="quick-btn"
                        onclick="QuranReview.navigateTo('admin')">
                    👥 المستخدمون
                </button>
                <button class="quick-btn"
                        onclick="QuranReview.navigateTo('admin')">
                    📊 الإحصاء
                </button>
            </div>
        </section>
    </div>
    `;
}

// ══════════════════════════════════════════════════════════════
// INIT DASHBOARDS — fetch API
// ══════════════════════════════════════════════════════════════

async function initDashboard(role) {
    const token = localStorage.getItem(config.apiTokenKey);
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    if (role === 'student') {
        const res = await fetch(`${config.apiBaseUrl}/api/tasks/`, { headers })
            .catch(() => null);
        if (res?.ok) {
            const tasks = await res.json();
            // L'API renvoie un tableau ou un objet paginé
            const list = Array.isArray(tasks) ? tasks : (tasks.results || []);
            renderStudentTasks(list);
        } else {
            renderStudentTasks([]);
        }
    }

    if (role === 'teacher') {
        const res = await fetch(`${config.apiBaseUrl}/api/submissions/`, { headers })
            .catch(() => null);
        if (res?.ok) {
            const data = await res.json();
            const subs = Array.isArray(data) ? data : (data.results || []);
            const pending = subs.filter(s => s.status === 'pending' || !s.grade);
            renderTeacherSubmissions(pending);
            const el = document.getElementById('t-pending');
            if (el) el.textContent = pending.length;
        }
    }

    if (role === 'admin') {
        const res = await fetch(`${config.apiBaseUrl}/api/admin/overview/`, { headers })
            .catch(() => null);
        if (res?.ok) {
            const data = await res.json();
            setText('a-users',    '+' + (data.total_users    || 0));
            setText('a-teachers',        data.total_teachers || 0);
            setText('a-students',        data.total_students || 0);
            setText('a-today',           data.submissions_today || 0);
        }
    }
}

// ══════════════════════════════════════════════════════════════
// HELPERS DE RENDU
// ══════════════════════════════════════════════════════════════

function renderStudentTasks(tasks) {
    const el = document.getElementById('student-tasks-list');
    if (!el) return;
    if (!tasks.length) {
        el.innerHTML = '<p class="empty-state">لا توجد واجبات اليوم 🎉</p>';
        return;
    }
    el.innerHTML = tasks.slice(0, 3).map(t => `
        <div class="task-row">
            <span class="task-name">${escapeHtml(t.surah_name || t.title || 'واجب')}</span>
            <button class="btn btn-sm btn-glow"
                    onclick="QuranReview.navigateTo('soumettre')">
                إرسال 🎧
            </button>
        </div>
    `).join('');
}

function renderTeacherSubmissions(subs) {
    const el = document.getElementById('teacher-submissions-list');
    if (!el) return;
    if (!subs.length) {
        el.innerHTML = '<p class="empty-state">لا توجد تسليمات في الانتظار ✅</p>';
        return;
    }
    el.innerHTML = subs.slice(0, 5).map(s => `
        <div class="submission-row">
            <span>${escapeHtml(s.student_name || s.student || 'طالب')} —
                  ${escapeHtml(s.task_title   || s.task   || 'تسليم')}</span>
            <span class="badge badge-warning">⏳ بانتظار التصحيح</span>
        </div>
    `).join('');
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function getArabicDate() {
    return new Date().toLocaleDateString('ar-MA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

/** Échappe le HTML pour éviter XSS dans les données API */
function escapeHtml(str) {
    if (typeof str !== 'string') return String(str ?? '');
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
