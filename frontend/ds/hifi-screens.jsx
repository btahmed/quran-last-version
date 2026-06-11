/* ui_kits/app/hifi-screens.jsx — the three high-fidelity QuranReview Pro screens.
   Reuses kit primitives from components.jsx (KButton, KStat, KWeek, KBadge…). */
const { KStat, KWeek, KProgress } = window;

const STUDENT_TABS = [
  { key: 'home', icon: '🏠', label: 'الرئيسية' },
  { key: 'hifz', icon: '📖', label: 'الحفظ' },
  { key: 'submit', icon: '🎧', label: 'إرسال', center: true },
  { key: 'revision', icon: '🔁', label: 'المراجعة' },
  { key: 'profile', icon: '👤', label: 'حسابي' },
];

function PhoneFrame({ children }) {
  return <div className="phone">{children}</div>;
}

function KHeader({ right }) {
  return (
    <header className="k-header" dir="rtl">
      <div className="k-brand"><span style={{ fontSize: '1.3rem' }}>🕌</span><span className="gtext">مراجعة القرآن</span></div>
      {right}
    </header>
  );
}

function StudentBottomBar({ active = 'home' }) {
  return (
    <nav className="k-bottombar" dir="rtl">
      {STUDENT_TABS.map(t => (
        <button key={t.key} className={'k-tab' + (t.center ? ' k-tab--center' : '') + (active === t.key ? ' active' : '')}>
          <span className="ti">{t.icon}</span>
          {!t.center && <span className="tl">{t.label}</span>}
        </button>
      ))}
    </nav>
  );
}

/* ── SCREEN 1 — Student dashboard ──────────────────────────── */
function ScreenDashboard() {
  const week = [
    { num: 4, state: 'done' }, { num: 5, state: 'done' }, { num: 6, state: 'done' },
    { num: 7, state: 'missed' }, { num: 8, state: 'done' }, { num: 9, state: 'done' },
    { num: 10, state: 'pending', today: true },
  ];
  return (
    <PhoneFrame>
      <KHeader right={<span className="streak-chip">🔥 12 يوم</span>} />
      <div className="k-body">
        <div className="k-greeting">
          <h2>السلام عليكم، يوسف 👋</h2>
          <p className="date">الثلاثاء، 10 يونيو 2026 · واصل تقدمك</p>
        </div>

        <section className="k-section">
          <div className="k-grid3">
            <KStat icon="⭐" value="1,340" label="النقاط" gradientValue />
            <KStat icon="📖" value="18" label="سور محفوظة" />
            <KStat icon="🔁" value="92%" label="نسبة المراجعة" />
          </div>
        </section>

        <section className="k-section">
          <h3 className="k-section-title">📖 الحفظ الحالي</h3>
          <div className="hifz-prog">
            <div className="top">
              <div className="surah">سورة الملك<small>الآية 14 من 30 · مكية</small></div>
              <div className="pct">47%</div>
            </div>
            <KProgress value={47} height={8} />
          </div>
        </section>

        <section className="k-section">
          <h3 className="k-section-title">📅 أسبوعك</h3>
          <div className="hifz-prog" style={{ padding: 'var(--space-3)' }}><KWeek days={week} /></div>
        </section>

        <section className="k-section">
          <h3 className="k-section-title">⚡ وصول سريع</h3>
          <div className="k-quick">
            <button className="k-quickbtn">📖 متابعة الحفظ</button>
            <button className="k-quickbtn">🔁 مراجعة اليوم</button>
            <button className="k-quickbtn">🏆 المسابقة</button>
          </div>
        </section>
      </div>
      <StudentBottomBar active="home" />
    </PhoneFrame>
  );
}

/* ── SCREEN 2 — Hifz memorization ──────────────────────────── */
function ScreenHifz() {
  const total = 30;
  const [idx, setIdx] = React.useState(13); // ayah 14
  const [revealed, setRevealed] = React.useState(false);
  const progress = Math.round((idx / total) * 100);
  const answer = (known) => {
    setRevealed(false);
    setIdx(i => Math.min(total - 1, i + 1));
  };
  return (
    <PhoneFrame>
      <KHeader right={<span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>الملك</span>} />
      <div className="k-body hifz-screen">
        <div className="hifz-session">
          <span className="count">آية {idx + 1}/{total}</span>
          <KProgress value={progress} height={8} />
        </div>

        <div className="ayah-card">
          <span className="ref">سورة الملك · {idx + 1}</span>
          <div className="ayah-text">
            ٱلَّذِى خَلَقَ ٱلْمَوْتَ وَٱلْحَيَوٰةَ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًا
            <span className="end">{idx + 1}</span>
            {revealed && (
              <div style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--font-sans)', color: 'var(--gold-300)', marginTop: 'var(--space-5)', lineHeight: 1.7 }}>
                « Celui qui a créé la mort et la vie pour vous éprouver : qui de vous est le meilleur en œuvre. »
              </div>
            )}
          </div>
        </div>

        <div className="hifz-actions">
          <button className="know-btn no" onClick={() => answer(false)}>لا أعرف<small>راجعها قريباً</small></button>
          <button className="know-btn yes" onClick={() => answer(true)}>أعرف<small>الآية التالية</small></button>
        </div>

        <div className="hifz-tools">
          <button className="hifz-tool">🔊 استماع</button>
          <button className="hifz-tool" onClick={() => setRevealed(r => !r)}>👁 {revealed ? 'إخفاء' : 'الترجمة'}</button>
          <button className="hifz-tool">🔖 إشارة</button>
        </div>
      </div>
    </PhoneFrame>
  );
}

/* ── SCREEN 3 — Teacher submissions ────────────────────────── */
const SUBMISSIONS = [
  { ini: 'أ', name: 'أمينة بنعلي', surah: 'سورة الملك · 1–15', dur: '2:14', status: 'pending' },
  { ini: 'ي', name: 'يوسف الإدريسي', surah: 'سورة يس · مراجعة', dur: '3:48', status: 'pending' },
  { ini: 'م', name: 'مريم العلوي', surah: 'سورة الرحمن · 1–20', dur: '1:52', status: 'graded', grade: 9 },
];

function StarRating({ value, onChange }) {
  return (
    <div className="stars">
      {Array.from({ length: 10 }).map((_, i) => (
        <button key={i} className={'star' + (i < value ? ' on' : '')} onClick={() => onChange(i + 1)} aria-label={`${i + 1}`}>★</button>
      ))}
    </div>
  );
}

function SubmissionCard({ sub, open, onToggle }) {
  const [playing, setPlaying] = React.useState(false);
  const [pos, setPos] = React.useState(sub.status === 'graded' ? 100 : 32);
  const [grade, setGrade] = React.useState(sub.grade || 0);
  const [saved, setSaved] = React.useState(sub.status === 'graded');

  React.useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setPos(p => (p >= 100 ? (clearInterval(t), 100) : p + 2)), 120);
    return () => clearInterval(t);
  }, [playing]);

  return (
    <div className={'sub-card' + (open ? ' open' : '')}>
      <div className="sub-head" onClick={onToggle}>
        <span className="av">{sub.ini}</span>
        <div className="who"><div className="name">{sub.name}</div><div className="surah">{sub.surah}</div></div>
        {saved
          ? <window.KBadge variant="success" icon="✓">{grade}/10</window.KBadge>
          : <window.KBadge variant="warning" icon="⏳" pulse>بانتظار</window.KBadge>}
      </div>

      {open && (
        <React.Fragment>
          <div className="audio">
            <button className="play" onClick={() => setPlaying(p => !p)}>{playing ? '❚❚' : '▶'}</button>
            <div className="track">
              <div className="bar"><span style={{ width: pos + '%' }} /></div>
              <div className="time"><span>{playing || pos > 0 ? '0:42' : '0:00'}</span><span>{sub.dur}</span></div>
            </div>
          </div>

          <div className="rating">
            <div className="lbl"><span>التقييم</span><span className="score">{grade ? `${grade}/10` : '—'}</span></div>
            <StarRating value={grade} onChange={(g) => { setGrade(g); setSaved(false); }} />
            <div className="rating save">
              <window.KButton full icon="✓" onClick={() => setSaved(true)}>{saved ? 'تم الحفظ' : 'حفظ التقييم'}</window.KButton>
            </div>
          </div>
        </React.Fragment>
      )}
    </div>
  );
}

function ScreenTeacher() {
  const [openIdx, setOpenIdx] = React.useState(0);
  return (
    <PhoneFrame>
      <KHeader right={<span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>أ. خالد</span>} />
      <div className="k-body">
        <div className="k-greeting">
          <h2>🎧 التسليمات</h2>
          <p className="date">3 تلاوات · 2 بانتظار التصحيح</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
          <window.KBadge variant="warning">بانتظار · 2</window.KBadge>
          <window.KBadge variant="success">مُقيَّمة · 1</window.KBadge>
        </div>
        {SUBMISSIONS.map((s, i) => (
          <SubmissionCard key={i} sub={s} open={openIdx === i} onToggle={() => setOpenIdx(openIdx === i ? -1 : i)} />
        ))}
      </div>
      <nav className="k-bottombar" dir="rtl">
        {[['🏠', 'الرئيسية'], ['📋', 'الواجبات'], ['🎧', '', true], ['👥', 'الطلاب'], ['👤', 'حسابي']].map(([ic, lb, c], i) => (
          <button key={i} className={'k-tab' + (c ? ' k-tab--center active' : '') + (i === 2 ? '' : '')}>
            <span className="ti">{ic}</span>{!c && <span className="tl">{lb}</span>}
          </button>
        ))}
      </nav>
    </PhoneFrame>
  );
}

Object.assign(window, { ScreenDashboard, ScreenHifz, ScreenTeacher });

/* mount gallery */
function Gallery() {
  return (
    <div className="gallery">
      <div className="gallery-item"><div className="cap"><span className="n">1</span> Dashboard Étudiant</div><ScreenDashboard /></div>
      <div className="gallery-item"><div className="cap"><span className="n">2</span> Hifz — Mémorisation</div><ScreenHifz /></div>
      <div className="gallery-item"><div className="cap"><span className="n">3</span> Soumissions — Teacher</div><ScreenTeacher /></div>
    </div>
  );
}
ReactDOM.createRoot(document.getElementById('root')).render(<Gallery />);
