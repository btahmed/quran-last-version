// frontend/src/pages/HomePage.js
// Page d'accueil intelligente : landing visiteur OU dashboard selon le rôle
import { state } from '../core/state.js';
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
    return user.role === 'admin' || user.is_superuser ? 'admin' : user.role;
}

export function render() {
    if (!state.user) return renderLanding();
    switch (getEffectiveRole(state.user)) {
        case 'student':
            return renderDashboard('student');
        case 'teacher':
            return renderDashboard('teacher');
        case 'admin':
            return renderDashboard('admin');
        default:
            return renderLanding(); // fallback rôle inconnu
    }
}

export function init() {
    if (!state.user) return initLanding();
    switch (getEffectiveRole(state.user)) {
        case 'student':
            return initDashboard('student');
        case 'teacher':
            return initDashboard('teacher');
        case 'admin':
            return initDashboard('admin');
        default:
            return initLanding();
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
            <div class="hero-bg-pattern"></div>
            <div class="hero-content">
                <div class="hero-badge">✨ منصة حفظ القرآن الكريم</div>
                <h1 class="hero-title">راجع القرآن<br><span class="hero-title-accent">بثقة واطمئنان</span></h1>
                <p class="hero-subtitle">منصة متكاملة تجمع المعلم والطالب — حفظ، مراجعة، إرسال تلاوة، ومتابعة التقدم يومياً</p>
                <div class="hero-actions">
                    <button class="btn btn-glow btn-lg" onclick="QuranReview.showAuthModal()">ابدأ الآن — مجاناً</button>
                    <button class="btn btn-ghost btn-lg" onclick="QuranReview.showRegisterForm()">إنشاء حساب</button>
                </div>
                <p class="hero-social-proof">انضم إلى <strong>+224</strong> طالب يراجعون يومياً</p>
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
    const observer = new IntersectionObserver(
        entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.5 }
    );

    document.querySelectorAll('.stat-number[data-target]').forEach(el => observer.observe(el));

    // Stats live depuis Supabase
    (async function fetchLiveStats() {
        try {
            const { supabaseClient } = await import('../services/supabase-client.js');
            const { count: students } = await supabaseClient
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'student');
            const el = document.querySelector('.stat-number[data-target="224"]');
            if (el && students != null) el.textContent = '+' + students;
        } catch {
            // silently ignore — stats non critiques
        }
    })();
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
        admin: renderAdminDashboard,
    };
    return (renderers[role] || renderLanding)();
}

// ── Dashboard étudiant ────────────────────────────────────────

function renderStudentDashboard() {
    const name = state.user?.first_name || state.user?.username || 'طالب';
    return `
    <div class="dashboard dashboard-student" dir="rtl">

        <!-- Salutation + streak chip (design Claude Design) -->
        <div class="k-greeting">
            <h2>السلام عليكم، ${escapeHtml(name)} 👋</h2>
            <p class="date">${getArabicDate()} · واصل تقدمك</p>
        </div>

        <!-- STATS GRID 3 (KStat style) -->
        <section class="k-section">
            <div class="k-grid3">
                <div class="k-stat-card">
                    <span class="k-stat-icon">🔥</span>
                    <span id="streak-days" class="k-stat-value gradient-text">0</span>
                    <span class="k-stat-label">يوم متتالي</span>
                </div>
                <div class="k-stat-card">
                    <span class="k-stat-icon">📖</span>
                    <span id="hifz-progress" class="k-stat-value">0%</span>
                    <span class="k-stat-label">تقدم الحفظ</span>
                </div>
                <div class="k-stat-card">
                    <span class="k-stat-icon">⭐</span>
                    <span id="revision-score" class="k-stat-value gradient-text">0</span>
                    <span class="k-stat-label">النقاط</span>
                </div>
            </div>
        </section>

        <!-- HIFZ PROGRESS CARD (hifz-prog style) -->
        <section class="k-section">
            <h3 class="k-section-title">📖 الحفظ الحالي</h3>
            <div class="hifz-prog">
                <div class="top">
                    <div class="surah" id="hifz-surah-name">
                        جاري التحميل…
                        <small id="hifz-surah-detail"> </small>
                    </div>
                    <div class="pct" id="hifz-pct">0%</div>
                </div>
                <div style="width:100%;height:8px;background:rgba(0,0,0,0.08);border-radius:999px;overflow:hidden;">
                    <div id="hifz-bar" style="height:100%;width:0%;background:var(--gradient-progress);border-radius:999px;transition:width 0.8s ease;"></div>
                </div>
            </div>
        </section>

        <!-- CALENDRIER HEBDOMADAIRE -->
        <section class="k-section">
            <h3 class="k-section-title">📅 أسبوعك</h3>
            <div class="hifz-prog" style="padding:var(--space-3)">
                <div id="week-calendar-container">
                    <div class="skeleton" style="height:72px;border-radius:var(--radius-md);"></div>
                </div>
            </div>
        </section>

        <!-- DEVOIRS DU JOUR -->
        <section class="k-section">
            <h3 class="k-section-title">📋 واجبات اليوم</h3>
            <div id="student-tasks-list" class="k-stack">
                <div class="skeleton skeleton-card"></div>
                <div class="skeleton skeleton-card"></div>
            </div>
        </section>

        <!-- ACCÈS RAPIDE (k-quickbtn style) -->
        <section class="k-section">
            <h3 class="k-section-title">⚡ وصول سريع</h3>
            <div class="k-quick">
                <button class="k-quickbtn" onclick="QuranReview.navigateTo('hifz')">📖 متابعة الحفظ</button>
                <button class="k-quickbtn" onclick="QuranReview.navigateTo('revision')">🔁 مراجعة اليوم</button>
                <button class="k-quickbtn" onclick="QuranReview.navigateTo('competition')">🏆 المسابقة</button>
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

        <div class="k-greeting">
            <h2>مرحباً أستاذ ${escapeHtml(name)} 👋</h2>
            <p class="date">${getArabicDate()}</p>
        </div>

        <!-- STATS 2×2 (DS3 k-grid2) -->
        <section class="k-section">
            <div class="k-grid2">
                <div class="k-stat-card">
                    <span class="k-stat-icon">👥</span>
                    <span id="t-students" class="k-stat-value">—</span>
                    <span class="k-stat-label">طلاب</span>
                </div>
                <div class="k-stat-card">
                    <span class="k-stat-icon">📝</span>
                    <span id="t-tasks" class="k-stat-value">—</span>
                    <span class="k-stat-label">واجبات نشطة</span>
                </div>
                <div class="k-stat-card">
                    <span class="k-stat-icon">⏳</span>
                    <span id="t-pending" class="k-stat-value gradient-value">—</span>
                    <span class="k-stat-label">بانتظار التصحيح</span>
                </div>
                <div class="k-stat-card">
                    <span class="k-stat-icon">❌</span>
                    <span id="t-absent" class="k-stat-value">—</span>
                    <span class="k-stat-label">غياب اليوم</span>
                </div>
            </div>
        </section>

        <!-- SOUMISSIONS RÉCENTES -->
        <section class="k-section">
            <h3 class="k-section-title">🎧 آخر التسليمات</h3>
            <div id="teacher-submissions-list" class="k-stack">
                <div class="skeleton skeleton-card"></div>
                <div class="skeleton skeleton-card"></div>
            </div>
        </section>

        <!-- ACCÈS RAPIDE -->
        <section class="k-section">
            <h3 class="k-section-title">⚡ وصول سريع</h3>
            <div class="k-quick">
                <button class="k-quickbtn k-quickbtn--primary"
                        onclick="QuranReview.navigateTo('devoirs')">＋ واجب جديد</button>
                <button class="k-quickbtn"
                        onclick="QuranReview.navigateTo('soumissions')">📋 كل التسليمات</button>
            </div>
        </section>
    </div>
    `;
}

// ── Dashboard admin ───────────────────────────────────────────

function renderAdminDashboard() {
    return `
    <div class="dashboard dashboard-admin" dir="rtl">

        <div class="k-greeting">
            <h2>لوحة الإدارة</h2>
            <p class="date">${getArabicDate()}</p>
        </div>

        <!-- STATS 2×2 (DS3 k-grid2) -->
        <section class="k-section">
            <div class="k-grid2">
                <div class="k-stat-card">
                    <span class="k-stat-icon">👥</span>
                    <span id="a-users" class="k-stat-value gradient-value">—</span>
                    <span class="k-stat-label">مستخدمون</span>
                </div>
                <div class="k-stat-card">
                    <span class="k-stat-icon">👨‍🏫</span>
                    <span id="a-teachers" class="k-stat-value">—</span>
                    <span class="k-stat-label">معلمون</span>
                </div>
                <div class="k-stat-card">
                    <span class="k-stat-icon">👨‍🎓</span>
                    <span id="a-students" class="k-stat-value">—</span>
                    <span class="k-stat-label">طلاب</span>
                </div>
                <div class="k-stat-card">
                    <span class="k-stat-icon">📤</span>
                    <span id="a-today" class="k-stat-value">—</span>
                    <span class="k-stat-label">تسليمات اليوم</span>
                </div>
            </div>
        </section>

        <!-- ACTIVITÉ RÉCENTE -->
        <section class="k-section">
            <h3 class="k-section-title">📊 النشاط الأخير</h3>
            <div id="admin-activity-list" class="k-stack">
                <div class="skeleton skeleton-card"></div>
                <div class="skeleton skeleton-card"></div>
            </div>
        </section>

        <!-- ACCÈS RAPIDE -->
        <section class="k-section">
            <h3 class="k-section-title">⚡ وصول سريع</h3>
            <div class="k-quick">
                <button class="k-quickbtn"
                        onclick="QuranReview.navigateTo('admin-users')">👥 المستخدمون</button>
                <button class="k-quickbtn"
                        onclick="QuranReview.navigateTo('admin-stats')">📊 الإحصاء</button>
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

    // hifzDone = ayats mémorisés, hifzTotal = nombre total dans les données
    const hifzDone = mastered;
    const hifzTotal = data.length;
    const hifzPct = hifzTotal > 0 ? Math.round((hifzDone / hifzTotal) * 100) : 0;

    setText('hifz-progress', hifzPct + '%');
    setText('revision-score', pct + '%');
    setText('streak-days', streak);

    // Nouveaux IDs Claude Design (hifz-prog card)
    setText('hifz-pct', hifzPct + '%');
    const surahEl = document.getElementById('hifz-surah-name');
    if (surahEl && hifzTotal > 0) {
        surahEl.childNodes[0].textContent = `${hifzDone} سور محفوظة`;
        setText('hifz-surah-detail', `من أصل ${hifzTotal} · ${hifzPct}%`);
    } else if (surahEl) {
        surahEl.childNodes[0].textContent = 'لم تبدأ الحفظ بعد';
        setText('hifz-surah-detail', 'ابدأ أول سورة من صفحة الحفظ');
    }

    // Animation progress bar hifz
    const hifzBarEl = document.getElementById('hifz-bar');
    if (hifzBarEl) {
        requestAnimationFrame(() => {
            hifzBarEl.style.width = hifzPct + '%';
        });
    }
}

async function initDashboard(role) {
    if (role === 'student') {
        // Stats locales (hifz, mémorisation)
        _applyStudentLocalStats();

        const cached = apiCache.get('tasks');
        if (cached) {
            renderStudentTasks(cached);
            // Rendu du calendrier hebdomadaire depuis le cache
            const { renderWeekCalendar } = await import('../components/WeekCalendar.js');
            const calContainer = document.getElementById('week-calendar-container');
            if (calContainer) calContainer.innerHTML = renderWeekCalendar(cached);
            supabaseTasks
                .getMyTasks()
                .then(async ({ data }) => {
                    if (data) {
                        apiCache.set('tasks', data);
                        renderStudentTasks(data);
                        // Mise à jour du calendrier avec les données fraîches
                        const { renderWeekCalendar: rwc } =
                            await import('../components/WeekCalendar.js');
                        const cal = document.getElementById('week-calendar-container');
                        if (cal) cal.innerHTML = rwc(data);
                    }
                })
                .catch(() => {});
            return;
        }
        const { data, error } = await supabaseTasks.getMyTasks();
        if (!error && data) {
            apiCache.set('tasks', data);
            renderStudentTasks(data);
        } else {
            renderStudentTasks([]);
        }
        // Rendu du calendrier hebdomadaire après chargement des tâches
        const { renderWeekCalendar } = await import('../components/WeekCalendar.js');
        const calContainer = document.getElementById('week-calendar-container');
        if (calContainer) calContainer.innerHTML = renderWeekCalendar(!error && data ? data : []);
    }

    if (role === 'teacher') {
        // Charger étudiants + soumissions en parallèle
        const [submissionsRes, studentsRes] = await Promise.all([
            supabaseSubmissions.getPendingSubmissions(),
            supabaseAdmin.getMyStudents(),
        ]);

        if (!submissionsRes.error && submissionsRes.data) {
            apiCache.set('submissions', submissionsRes.data);
            const pending = submissionsRes.data.filter(
                s => s.status === 'pending' || s.status === 'submitted' || !s.grade
            );
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
            setText('a-users', '+' + (cached.total_users || 0));
            setText('a-teachers', cached.total_teachers || 0);
            setText('a-students', cached.total_students || 0);
            setText('a-today', cached.submissions_today || 0);
            renderAdminActivity(cached);
            return;
        }
        // Migration Supabase
        const { data, error } = await supabaseAdmin.getAdminOverview();
        if (!error && data) {
            apiCache.set('admin-overview', data);
            setText('a-users', '+' + (data.total_users || 0));
            setText('a-teachers', data.total_teachers || 0);
            setText('a-students', data.total_students || 0);
            setText('a-today', data.submissions_today || 0);
            renderAdminActivity(data);
        } else {
            ['a-users', 'a-teachers', 'a-students', 'a-today'].forEach(id => setText(id, '—'));
            renderAdminActivity(null);
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
        el.innerHTML = '<p class="k-empty">لا توجد واجبات اليوم 🎉</p>';
        return;
    }
    el.innerHTML = tasks
        .slice(0, 3)
        .map(t => {
            const isRevision = t.task_type === 'revision';
            const dotClass = isRevision ? 'k-dot--pending' : 'k-dot--new';
            const metaLabel = isRevision ? 'مراجعة مجدولة' : 'حفظ جديد';
            return `
        <div class="k-row">
            <div class="rl">
                <span class="k-dot ${dotClass}"></span>
                <div>
                    <div class="name">${escapeHtml(t.surah_name || t.title || 'واجب')}</div>
                    <div class="meta">${metaLabel}</div>
                </div>
            </div>
            <button class="k-quickbtn" style="min-width:auto;flex:none;padding:var(--space-2) var(--space-4)"
                    onclick="QuranReview.navigateTo('soumettre')">إرسال 🎧</button>
        </div>
        `;
        })
        .join('');
}

function renderTeacherSubmissions(subs) {
    const el = document.getElementById('teacher-submissions-list');
    if (!el) return;
    if (!subs.length) {
        el.innerHTML = '<p class="k-empty">لا توجد تسليمات في الانتظار ✅</p>';
        return;
    }
    el.innerHTML = subs
        .slice(0, 5)
        .map(s => {
            const name = s.profiles?.first_name || s.profiles?.username || s.student_name || 'طالب';
            const task = s.tasks?.title || s.task_title || 'تسليم';
            const initial = escapeHtml(name.charAt(0) || '؟');
            return `
        <div class="k-row">
            <div class="rl">
                <span class="k-avatar">${initial}</span>
                <div>
                    <div class="name">${escapeHtml(name)}</div>
                    <div class="meta">${escapeHtml(task)}</div>
                </div>
            </div>
            <span class="k-chip k-chip--warning">⏳ بانتظار</span>
        </div>
        `;
        })
        .join('');
}

function renderAdminActivity(data) {
    const el = document.getElementById('admin-activity-list');
    if (!el) return;
    const items = [];
    if (data?.submissions_today > 0)
        items.push({
            label: `${data.submissions_today} تسليم اليوم`,
            meta: 'تقييم مكتمل · آخر تحديث',
            dot: 'done',
        });
    if (data?.total_students > 0)
        items.push({
            label: `${data.total_students} طالب مسجّل`,
            meta: `${data.total_teachers || 0} معلم · حلقات نشطة`,
            dot: 'new',
        });
    items.push({ label: 'النظام يعمل بكامل طاقته', meta: getArabicDate(), dot: 'pending' });
    el.innerHTML = items
        .map(
            item => `
        <div class="k-row">
            <div class="rl">
                <span class="k-dot k-dot--${item.dot}"></span>
                <div>
                    <div class="name">${escapeHtml(item.label)}</div>
                    <div class="meta">${escapeHtml(item.meta)}</div>
                </div>
            </div>
        </div>
    `
        )
        .join('');
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
