// frontend/src/pages/HomePage.js
// Page d'accueil intelligente : landing visiteur OU dashboard selon le rôle
import { state } from '../core/state.js';
import { config } from '../core/config.js';
import { apiCache } from '../core/apiCache.js';
import * as supabaseSubmissions from '../services/supabase-submissions.js';
import * as supabaseAdmin from '../services/supabase-admin.js';
import * as supabaseTasks from '../services/supabase-tasks.js';

// ══════════════════════════════════════════════════════════════
// Point d'entrée principal — détection visiteur / rôle connecté
// ══════════════════════════════════════════════════════════════

// Rôle effectif : un superuser Django est toujours traité comme 'admin'
function getEffectiveRole(user) {
    if (!user) return null;
    return (user.role === 'admin' || user.is_superuser) ? 'admin' : user.role;
}

export function render() {
    if (!state.user) return renderLanding();
    switch (getEffectiveRole(state.user)) {
        case 'student': return renderDashboard('student');
        case 'teacher': return renderDashboard('teacher');
        case 'admin':   return renderDashboard('admin');
        default:        return renderLanding(); // fallback rôle inconnu
    }
}

export function init() {
    if (!state.user) return initLanding();
    switch (getEffectiveRole(state.user)) {
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
                            onclick="QuranReview.showAuthModal()">
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
                <div class="skeleton skeleton-card"></div>
                <div class="skeleton skeleton-card"></div>
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
                <div class="skeleton skeleton-card"></div>
                <div class="skeleton skeleton-card"></div>
            </div>
        </section>

        <!-- ACCÈS RAPIDE -->
        <section class="dashboard-section">
            <div class="quick-actions">
                <button class="quick-btn quick-btn--primary"
                        onclick="QuranReview.navigateTo('devoirs')">
                    + واجب جديد
                </button>
                <button class="quick-btn"
                        onclick="QuranReview.navigateTo('soumissions')">
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
                        onclick="QuranReview.navigateTo('admin-users')">
                    👥 المستخدمون
                </button>
                <button class="quick-btn"
                        onclick="QuranReview.navigateTo('admin-stats')">
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

function _applyStudentLocalStats() {
    const data = state.memorizationData || [];
    const mastered = data.filter(x => x.status === 'mastered').length;
    const pct = data.length > 0 ? Math.round((mastered / data.length) * 100) : 0;

    // Calcul streak : jours consécutifs avec au moins une révision
    const today = new Date();
    let streak = 0;
    for (let i = 0; i < 30; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const ds = d.toISOString().split('T')[0];
        if (data.some(x => x.lastReviewed === ds)) streak++;
        else if (i > 0) break;
    }

    setText('hifz-progress', mastered);
    setText('revision-score', pct + '%');
    setText('streak-days', streak);
}

async function initDashboard(role) {
    if (role === 'student') {
        // Stats locales (hifz, mémorisation)
        _applyStudentLocalStats();

        const cached = apiCache.get('tasks');
        if (cached) {
            renderStudentTasks(cached);
            supabaseTasks.getMyTasks().then(({ data }) => {
                if (data) { apiCache.set('tasks', data); renderStudentTasks(data); }
            }).catch(() => {});
            return;
        }
        const { data, error } = await supabaseTasks.getMyTasks();
        if (!error && data) {
            apiCache.set('tasks', data);
            renderStudentTasks(data);
        } else {
            renderStudentTasks([]);
        }
    }

    if (role === 'teacher') {
        // Charger étudiants + soumissions en parallèle
        const [submissionsRes, studentsRes] = await Promise.all([
            supabaseSubmissions.getPendingSubmissions(),
            supabaseAdmin.getMyStudents(),
        ]);

        if (!submissionsRes.error && submissionsRes.data) {
            apiCache.set('submissions', submissionsRes.data);
            const pending = submissionsRes.data.filter(s => s.status === 'pending' || s.status === 'submitted' || !s.grade);
            renderTeacherSubmissions(pending);
            setText('t-pending', pending.length);
        } else {
            renderTeacherSubmissions([]);
        }

        const students = studentsRes.data || [];
        setText('t-students', students.length);
        // t-tasks : depuis le cache si dispo, sinon on laisse "—"
        const cachedTasks = apiCache.get('tasks');
        if (cachedTasks) setText('t-tasks', cachedTasks.length);

        // Calcul des absents : étudiants sans soumission depuis 7 jours
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const allSubmissions = submissionsRes.data || [];
        const activeStudentIds = new Set(
            allSubmissions
                .filter(s => s.submitted_at && new Date(s.submitted_at) > sevenDaysAgo)
                .map(s => s.student_id)
        );
        const absentCount = students.filter(s => !activeStudentIds.has(s.id)).length;
        setText('t-absent', absentCount);
    }

    if (role === 'admin') {
        const cached = apiCache.get('admin-overview');
        if (cached) {
            setText('a-users',    '+' + (cached.total_users    || 0));
            setText('a-teachers',        cached.total_teachers || 0);
            setText('a-students',        cached.total_students || 0);
            setText('a-today',           cached.submissions_today || 0);
            return;
        }
        // Migration Supabase
        const { data, error } = await supabaseAdmin.getAdminOverview();
        if (!error && data) {
            apiCache.set('admin-overview', data);
            setText('a-users',    '+' + (data.total_users    || 0));
            setText('a-teachers',        data.total_teachers || 0);
            setText('a-students',        data.total_students || 0);
            setText('a-today',           data.submissions_today || 0);
        } else {
            ['a-users', 'a-teachers', 'a-students', 'a-today'].forEach(id => setText(id, '—'));
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
            <span>${escapeHtml(s.profiles?.first_name || s.profiles?.username || s.student_name || 'طالب')} —
                  ${escapeHtml(s.tasks?.title || s.task_title || 'تسليم')}</span>
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
