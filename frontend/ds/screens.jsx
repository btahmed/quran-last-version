/* ds/screens.jsx — Dashboards interactifs par rôle (Student / Teacher / Admin).
   Source : Claude Design DS3 — ui_kit/app/screens.jsx */
const { KButton, KBadge, KStat, KDot, KWeek, KCard, KProgress } = window;

/* ── Onglets par rôle (utilisés par l'app interactive) ──── */
const TABS = {
  student: [
    { key: 'home',     icon: '🏠', label: 'الرئيسية' },
    { key: 'hifz',     icon: '📖', label: 'الحفظ' },
    { key: 'submit',   icon: '🎧', label: 'إرسال', center: true },
    { key: 'revision', icon: '🔁', label: 'المراجعة' },
    { key: 'profile',  icon: '👤', label: 'حسابي' },
  ],
  teacher: [
    { key: 'home',        icon: '🏠', label: 'الرئيسية' },
    { key: 'devoirs',     icon: '📋', label: 'الواجبات' },
    { key: 'submissions', icon: '🎧', label: 'التسليمات', center: true, badge: 3 },
    { key: 'students',    icon: '👥', label: 'الطلاب' },
    { key: 'profile',     icon: '👤', label: 'حسابي' },
  ],
  admin: [
    { key: 'home',    icon: '🏠', label: 'لوحة' },
    { key: 'users',   icon: '👥', label: 'المستخدمون' },
    { key: 'classes', icon: '🏫', label: 'الفصول', center: true },
    { key: 'stats',   icon: '📊', label: 'الإحصاء' },
    { key: 'profile', icon: '⚙️', label: 'الإعدادات' },
  ],
};

/* ── Header interactif avec bouton logout ────────────────── */
function Header({ onLogout }) {
  return (
    <header className="k-header" dir="rtl">
      <div className="k-brand">
        <span style={{ fontSize: '1.3rem' }}>🕌</span>
        <span className="gtext">مراجعة القرآن</span>
      </div>
      <button
        onClick={onLogout}
        title="خروج"
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'var(--text-secondary)' }}
      >↪</button>
    </header>
  );
}

/* ── BottomBar interactive avec onNav ────────────────────── */
function BottomBarNav({ role, active, onNav }) {
  return (
    <nav className="k-bottombar" dir="rtl">
      {TABS[role].map(t => (
        <button
          key={t.key}
          className={'k-tab' + (t.center ? ' k-tab--center' : '') + (active === t.key ? ' active' : '')}
          onClick={() => onNav(t.key)}
        >
          <span className="ti">{t.icon}</span>
          {!t.center && <span className="tl">{t.label}</span>}
          {t.badge && !t.center && <span className="k-badge">{t.badge}</span>}
        </button>
      ))}
    </nav>
  );
}

/* ── Dashboard Étudiant ──────────────────────────────────── */
function StudentHome() {
  const week = [
    { num: 11, state: 'done' }, { num: 12, state: 'done' }, { num: 13, state: 'missed' },
    { num: 14, state: 'done' }, { num: 15, state: 'done' }, { num: 16, state: 'pending', today: true }, { num: 17, state: 'empty' },
  ];
  return (
    <React.Fragment>
      <div className="k-greeting">
        <h2>مرحباً يا يوسف 👋</h2>
        <p className="date">الإثنين، 9 يونيو 2026</p>
      </div>

      <section className="k-section">
        <h3 className="k-section-title">📋 واجبات اليوم</h3>
        <div className="k-stack">
          <div className="k-row">
            <div className="rl"><KDot status="new" /><div><div className="name">سورة الملك — الآيات 1–15</div><div className="meta">حفظ جديد</div></div></div>
            <KButton size="sm" icon="🎧">إرسال</KButton>
          </div>
          <div className="k-row">
            <div className="rl"><KDot status="weak" /><div><div className="name">سورة يس — مراجعة</div><div className="meta">مراجعة مجدولة</div></div></div>
            <KButton size="sm" variant="outline">ابدأ</KButton>
          </div>
        </div>
      </section>

      <section className="k-section">
        <div className="k-grid3">
          <KStat icon="🔥" value="12" label="يوم متتالي" gradientValue />
          <KStat icon="📖" value="68%" label="تقدم الحفظ" progress={68} />
          <KStat icon="⭐" value="340" label="نقاط المراجعة" />
        </div>
      </section>

      <section className="k-section">
        <h3 className="k-section-title">📅 أسبوعك</h3>
        <KCard variant="solid" style={{ padding: 'var(--space-3)' }}><KWeek days={week} /></KCard>
      </section>

      <section className="k-section">
        <h3 className="k-section-title">⚡ وصول سريع</h3>
        <div className="k-quick">
          <button className="k-quickbtn">📖 الحفظ</button>
          <button className="k-quickbtn">🔁 المراجعة</button>
          <button className="k-quickbtn">🏆 المسابقة</button>
        </div>
      </section>
    </React.Fragment>
  );
}

/* ── Dashboard Enseignant ────────────────────────────────── */
function TeacherHome() {
  return (
    <React.Fragment>
      <div className="k-greeting">
        <h2>مرحباً أستاذ خالد</h2>
        <p className="date">الإثنين، 9 يونيو 2026</p>
      </div>
      <section className="k-section">
        <div className="k-grid2">
          <KStat icon="👥" value="24" label="طلاب" />
          <KStat icon="📝" value="6" label="واجبات نشطة" />
          <KStat icon="⏳" value="3" label="بانتظار التصحيح" gradientValue />
          <KStat icon="❌" value="2" label="غياب اليوم" />
        </div>
      </section>
      <section className="k-section">
        <h3 className="k-section-title">🎧 آخر التسليمات</h3>
        <div className="k-stack">
          {[['أمينة بنعلي', 'الملك · 1–15', 'A'], ['يوسف الإدريسي', 'يس · مراجعة', 'Y'], ['مريم العلوي', 'الرحمن · 1–20', 'M']].map(([n, t, ini], i) => (
            <div className="k-row" key={i}>
              <div className="rl">
                <span className="k-avatar">{ini}</span>
                <div><div className="name">{n}</div><div className="meta">{t}</div></div>
              </div>
              <KBadge variant="warning" icon="⏳" pulse>بانتظار</KBadge>
            </div>
          ))}
        </div>
      </section>
      <section className="k-section">
        <h3 className="k-section-title">⚡ وصول سريع</h3>
        <div className="k-quick">
          <KButton full icon="＋" style={{ flex: 1 }}>واجب جديد</KButton>
          <button className="k-quickbtn">📋 كل التسليمات</button>
        </div>
      </section>
    </React.Fragment>
  );
}

/* ── Dashboard Admin ─────────────────────────────────────── */
function AdminHome() {
  return (
    <React.Fragment>
      <div className="k-greeting">
        <h2>لوحة الإدارة</h2>
        <p className="date">الإثنين، 9 يونيو 2026</p>
      </div>
      <section className="k-section">
        <div className="k-grid2">
          <KStat icon="👥" value="+253" label="مستخدمون" gradientValue />
          <KStat icon="👨‍🏫" value="21" label="معلمون" />
          <KStat icon="👨‍🎓" value="224" label="طلاب" />
          <KStat icon="📤" value="47" label="تسليمات اليوم" />
        </div>
      </section>
      <section className="k-section">
        <h3 className="k-section-title">📊 النشاط الأخير</h3>
        <div className="k-stack">
          {[
            ['تسجيل طالب جديد', 'حلقة الفجر · منذ 4 د', 'new'],
            ['تصحيح 12 تلاوة', 'أ. خالد · منذ 20 د', 'done'],
            ['إنشاء فصل جديد', 'مسجد النور · منذ ساعة', 'pending'],
          ].map(([t, m, s], i) => (
            <div className="k-row" key={i}>
              <div className="rl">
                <KDot status={s} />
                <div><div className="name">{t}</div><div className="meta">{m}</div></div>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="k-section">
        <h3 className="k-section-title">⚡ وصول سريع</h3>
        <div className="k-quick">
          <button className="k-quickbtn">👥 المستخدمون</button>
          <button className="k-quickbtn">📊 الإحصاء</button>
        </div>
      </section>
    </React.Fragment>
  );
}

/* ── Placeholder pour les onglets à venir ────────────────── */
function Placeholder({ icon, label }) {
  return (
    <div className="k-empty" style={{ marginTop: 'var(--space-12)' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-3)' }}>{icon}</div>
      {label}
    </div>
  );
}

Object.assign(window, { Header, BottomBarNav, StudentHome, TeacherHome, AdminHome, Placeholder, TABS });
