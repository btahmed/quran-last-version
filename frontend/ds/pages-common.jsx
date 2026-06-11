/* ds/pages-common.jsx — cadres partagés pour toutes les pages du gallery.
   Remplace + étend les composants de hifi-screens.jsx avec support multi-rôle. */

/* PhoneFrame — conteneur téléphone */
function PhoneFrame({ children }) {
  return <div className="phone">{children}</div>;
}

/* AppHeader — en-tête glassmorphism */
function AppHeader({ right, title }) {
  return (
    <header className="k-header" dir="rtl">
      <div className="k-brand">
        <span style={{ fontSize: '1.3rem' }}>🕌</span>
        <span className="gtext">{title || 'مراجعة القرآن'}</span>
      </div>
      {right != null ? right : <span style={{ width: 20 }} />}
    </header>
  );
}

/* Tabsets par rôle */
const TABSETS = {
  student: [
    { icon: '🏠', label: 'الرئيسية', key: 'home' },
    { icon: '📖', label: 'الحفظ', key: 'hifz' },
    { icon: '🎧', label: 'إرسال', key: 'submit', center: true },
    { icon: '🔁', label: 'المراجعة', key: 'revision' },
    { icon: '👤', label: 'حسابي', key: 'profile' },
  ],
  teacher: [
    { icon: '🏠', label: 'الرئيسية', key: 'home' },
    { icon: '📋', label: 'الواجبات', key: 'devoirs' },
    { icon: '🎧', label: 'التسليمات', key: 'soumissions', center: true, badge: 2 },
    { icon: '👥', label: 'الطلاب', key: 'eleves' },
    { icon: '👤', label: 'حسابي', key: 'profile' },
  ],
  admin: [
    { icon: '🏠', label: 'لوحة', key: 'home' },
    { icon: '👥', label: 'المستخدمون', key: 'users' },
    { icon: '🏫', label: 'الفصول', key: 'classes', center: true },
    { icon: '📊', label: 'الإحصاء', key: 'stats' },
    { icon: '⚙️', label: 'الإعدادات', key: 'settings' },
  ],
};

/* BottomBar — barre de navigation par rôle */
function BottomBar({ role = 'student', active }) {
  return (
    <nav className="k-bottombar" dir="rtl">
      {TABSETS[role].map(t => (
        <button
          key={t.key}
          className={'k-tab' + (t.center ? ' k-tab--center' : '') + (active === t.key ? ' active' : '')}
        >
          <span className="ti">{t.icon}</span>
          {!t.center && <span className="tl">{t.label}</span>}
          {t.badge && !t.center && <span className="k-badge">{t.badge}</span>}
        </button>
      ))}
    </nav>
  );
}

/* Toggle — interrupteur on/off */
function Toggle({ on: initial = true, label, desc }) {
  const [on, setOn] = React.useState(initial);
  return (
    <div className="toggle">
      <span className="t-label">
        {label}
        {desc && <small>{desc}</small>}
      </span>
      <button
        className={'switch' + (on ? ' on' : '')}
        onClick={() => setOn(o => !o)}
        aria-label={label}
      />
    </div>
  );
}

Object.assign(window, { PhoneFrame, AppHeader, BottomBar, Toggle, TABSETS });
