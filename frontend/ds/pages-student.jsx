/* ds/pages-student.jsx — écrans visiteur + étudiant. */
const { PhoneFrame, AppHeader, BottomBar, Toggle, KButton, KBadge, KStat, KWeek, KProgress, KDot } = window;

/* ── Visiteur — Landing ───────────────────────────────────── */
function Landing() {
  return (
    <PhoneFrame>
      <div className="k-body" style={{ padding: 0 }}>
        <div className="land-hero">
          <div className="logo">🕌</div>
          <span className="eyebrow">منصة احترافية لتحفيظ القرآن</span>
          <h1>راجع القرآن<br /><span className="acc">بثقة واطمئنان</span></h1>
          <p className="lead">احفظ، راجع، وأرسل تلاوتك لمعلمك — كل ذلك في تطبيق واحد جميل وبسيط.</p>
          <KButton variant="gradient" size="lg" full>ابدأ الآن — مجاناً</KButton>
          <div className="land-proof">
            <div className="pf"><div className="v">+224</div><div className="k">طالب نشيط</div></div>
            <div className="pf"><div className="v">+21</div><div className="k">معلم</div></div>
            <div className="pf"><div className="v">+8</div><div className="k">مسجد شريك</div></div>
          </div>
        </div>
        <div className="land-features">
          <div className="feat"><span className="fi">📖</span><div><h4>تعلّم سورة جديدة</h4><p>وضع الحفظ التفاعلي بالكلمات المخفية يثبّت حفظك آية بآية.</p></div></div>
          <div className="feat"><span className="fi">🔁</span><div><h4>راجع محفوظاتك</h4><p>نظام المراجعة المتباعدة يذكّرك بالوقت المثالي لكل سورة.</p></div></div>
          <div className="feat"><span className="fi">🎧</span><div><h4>أرسل تلاوتك للمعلم</h4><p>سجّل تلاوتك واحصل على تقييم وملاحظات مباشرة.</p></div></div>
          <div className="feat"><span className="fi">🏆</span><div><h4>تحدَّ نفسك</h4><p>مسابقات ولوحة متصدرين تجعل المراجعة ممتعة.</p></div></div>
        </div>
        <div className="land-cta">
          <h2>ابدأ رحلتك اليوم</h2>
          <KButton variant="glow" size="lg" full>إنشاء حساب</KButton>
        </div>
      </div>
    </PhoneFrame>
  );
}

/* ── Étudiant — Dashboard ─────────────────────────────────── */
function Dashboard() {
  const week = [
    { num: 4, state: 'done' }, { num: 5, state: 'done' }, { num: 6, state: 'done' },
    { num: 7, state: 'missed' }, { num: 8, state: 'done' }, { num: 9, state: 'done' }, { num: 10, state: 'pending', today: true },
  ];
  return (
    <PhoneFrame>
      <AppHeader right={<span className="streak-chip">🔥 12 يوم</span>} />
      <div className="k-body">
        <div className="k-greeting"><h2>السلام عليكم، يوسف 👋</h2><p className="date">الثلاثاء، 10 يونيو 2026</p></div>
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
            <div className="top"><div className="surah">سورة الملك<small>الآية 14 من 30 · مكية</small></div><div className="pct">47%</div></div>
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
      <BottomBar role="student" active="home" />
    </PhoneFrame>
  );
}

/* ── Hifz — Sélection ─────────────────────────────────────── */
function HifzSelection() {
  return (
    <PhoneFrame>
      <AppHeader right={<span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>الحفظ</span>} />
      <div className="k-body">
        <h2 className="page-title">🎭 وضع الحفظ</h2>
        <p className="page-sub">اختر السورة والآيات لبدء التمرين</p>
        <div className="hifz-game-card">
          <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, margin: '0 0 var(--space-4)' }}>اختيار التمرين</h3>
          <div className="field"><label>السورة</label><select defaultValue="67"><option value="67">سورة الملك (30 آية)</option><option>سورة يس (83 آية)</option><option>سورة الرحمن (78 آية)</option></select></div>
          <div className="field-row">
            <div className="field"><label>من الآية</label><input type="number" defaultValue="1" /></div>
            <div className="field"><label>إلى الآية</label><input type="number" defaultValue="7" /></div>
          </div>
          <KButton variant="glow" full icon="🎮">ابدأ التمرين</KButton>
        </div>
      </div>
      <BottomBar role="student" active="hifz" />
    </PhoneFrame>
  );
}

/* ── Hifz — Jeu (mots cachés) ─────────────────────────────── */
function HifzGame() {
  const words = ['تَبَارَكَ', 'ٱلَّذِى', 'بِيَدِهِ', '____', 'ٱلْمُلْكُ', 'وَهُوَ', 'عَلَىٰ', 'كُلِّ', '____', 'قَدِيرٌ'];
  return (
    <PhoneFrame>
      <AppHeader right={<KBadge variant="gold">المستوى ⭐⭐⭐</KBadge>} />
      <div className="k-body">
        <h2 className="page-title">🎭 وضع الحفظ</h2>
        <div className="hifz-game-card">
          <div className="hifz-game-head">
            <div style={{ display: 'flex', gap: 8 }}>
              <KBadge variant="primary">النقاط: 40</KBadge>
              <KBadge variant="info">تلميحات: 3</KBadge>
            </div>
            <KProgress value={45} height={6} style={{ width: 90 }} />
          </div>
          <div className="word-blanks" style={{ margin: 'var(--space-6) 0' }}>
            {words.map((w, i) => w === '____'
              ? <span key={i} className="blank">&nbsp;&nbsp;&nbsp;</span>
              : <span key={i} className="w">{w}</span>)}
          </div>
          <div style={{ textAlign: 'center', minHeight: 24, color: 'var(--success)', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-3)' }}>أحسنت! كلمة صحيحة ✓</div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)', flexWrap: 'wrap', justifyContent: 'center' }}>
          <KButton variant="outline" size="sm" icon="💡">تلميح</KButton>
          <KButton variant="glow" size="sm" icon="✓">تحقق</KButton>
          <KButton variant="outline" size="sm" icon="⏭️">التالي</KButton>
          <KButton variant="outline" size="sm" icon="⏹️">إيقاف</KButton>
        </div>
      </div>
      <BottomBar role="student" active="hifz" />
    </PhoneFrame>
  );
}

/* ── Tâches / Soumission ──────────────────────────────────── */
function Tasks() {
  const [tab, setTab] = React.useState('pending');
  return (
    <PhoneFrame>
      <AppHeader right={<span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>مهامي</span>} />
      <div className="k-body">
        <h2 className="page-title">📝 مهامي</h2>
        <div className="k-grid2" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 'var(--space-5)' }}>
          <KStat icon="🏆" value="1,340" label="نقاطي" gradientValue />
          <KStat icon="✓" value="24" label="مكتملة" />
          <KStat icon="⏳" value="3" label="انتظار" />
          <KStat icon="✗" value="1" label="مرفوضة" />
        </div>
        <div className="tabs-pill">
          <button className={tab === 'pending' ? 'active' : ''} onClick={() => setTab('pending')}>قيد الانتظار</button>
          <button className={tab === 'completed' ? 'active' : ''} onClick={() => setTab('completed')}>مكتملة</button>
        </div>
        {tab === 'pending' ? (
          <React.Fragment>
            <div className="task-card">
              <span className="dot" style={{ background: 'var(--info)' }} />
              <div className="body"><div className="ttl">حفظ سورة الملك 1–15</div><div className="meta"><KBadge variant="primary">حفظ</KBadge>🏆 20 نقطة <span>📅 12 يونيو</span></div></div>
              <div className="right"><KBadge variant="info">لم يُسلَّم</KBadge><KButton size="sm" icon="🎤">تسجيل</KButton></div>
            </div>
            <div className="task-card">
              <span className="dot" style={{ background: 'var(--warning)' }} />
              <div className="body"><div className="ttl">مراجعة سورة يس</div><div className="meta"><KBadge variant="gold">مراجعة</KBadge>🏆 15 نقطة</div></div>
              <div className="right"><KBadge variant="warning" icon="⏳" pulse>بانتظار</KBadge></div>
            </div>
          </React.Fragment>
        ) : (
          <div className="task-card">
            <span className="dot" style={{ background: 'var(--success)' }} />
            <div className="body"><div className="ttl">حفظ سورة الرحمن 1–20</div><div className="meta"><KBadge variant="gold">حفظ</KBadge><span style={{ color: 'var(--success)' }}>⭐ ممتاز · +25</span></div></div>
            <div className="right"><KBadge variant="success">مقبول ✓</KBadge></div>
          </div>
        )}
        <h3 className="k-section-title" style={{ marginTop: 'var(--space-5)' }}>📊 سجل النقاط</h3>
        <div className="hifz-prog" style={{ padding: 'var(--space-3) var(--space-4)' }}>
          <div className="log-row"><span className="l">🏆 تمت الموافقة على: الرحمن</span><span><span className="delta" style={{ color: 'var(--success)' }}>+25</span></span></div>
          <div className="log-row"><span className="l">🏆 تمت الموافقة على: يس</span><span><span className="delta" style={{ color: 'var(--success)' }}>+15</span></span></div>
          <div className="log-row" style={{ borderBottom: 'none' }}><span className="l">📉 تم رفض: النبأ</span><span><span className="delta" style={{ color: 'var(--danger)' }}>0</span></span></div>
        </div>
      </div>
      <BottomBar role="student" active="submit" />
    </PhoneFrame>
  );
}

/* ── Ward / Révision (lecteur audio) ──────────────────────── */
function Ward() {
  const [playing, setPlaying] = React.useState(false);
  return (
    <PhoneFrame>
      <AppHeader right={<span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>المراجعة</span>} />
      <div className="k-body">
        <h2 className="page-title">🎧 الورد اليومي</h2>
        <div className="hifz-game-card" style={{ marginBottom: 'var(--space-4)' }}>
          <div className="field"><label>السورة</label><select defaultValue="1"><option value="1">سورة الفاتحة (7 آيات)</option><option>سورة البقرة</option></select></div>
          <div className="field-row">
            <div className="field"><label>من الآية</label><input type="number" defaultValue="1" /></div>
            <div className="field"><label>إلى الآية</label><input type="number" defaultValue="7" /></div>
          </div>
          <div className="field"><label>القارئ</label><select><option>مشاري بن راشد العفاسي</option></select></div>
          <Toggle label="التشغيل التلقائي للآية التالية" />
          <KButton variant="glow" full icon="▶️" onClick={() => setPlaying(true)}>تشغيل الورد</KButton>
        </div>
        <div className="ward-player">
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-3)' }}><KBadge variant="primary">الآية 1 من 7</KBadge></div>
          <div className="ward-display"><div className="at">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div></div>
          <KProgress value={playing ? 20 : 0} height={8} />
          <div className="ward-controls">
            <button className="pbtn">⏮️</button>
            <button className="pbtn lg" onClick={() => setPlaying(p => !p)}>{playing ? '❚❚' : '▶️'}</button>
            <button className="pbtn">⏭️</button>
          </div>
        </div>
      </div>
      <BottomBar role="student" active="revision" />
    </PhoneFrame>
  );
}

/* ── Progression (profil › stats) ────────────────────────── */
function Progress() {
  return (
    <PhoneFrame>
      <AppHeader right={<span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>تقدمي</span>} />
      <div className="k-body">
        <div className="tabs-pill"><button className="active">📊 تقدمي</button><button>⚙️ الإعدادات</button></div>
        <div className="k-grid2" style={{ gridTemplateColumns: 'repeat(2,1fr)', marginBottom: 'var(--space-5)' }}>
          <KStat icon="📖" value="18" label="سورة محفوظة" />
          <KStat icon="📿" value="412" label="آية محفوظة" />
          <KStat icon="✅" value="64%" label="نسبة الإنجاز" gradientValue />
          <KStat icon="🔥" value="12" label="يوم متتالي" />
        </div>
        <h3 className="k-section-title">📊 توزيع الحالات</h3>
        <div className="hifz-prog" style={{ marginBottom: 'var(--space-5)' }}>
          <div className="dist-row"><span className="l"><KDot status="strong" /> متقن</span><span className="c">12</span></div>
          <div className="dist-row"><span className="l"><KDot status="weak" /> ضعيف</span><span className="c">4</span></div>
          <div className="dist-row"><span className="l"><KDot status="new" /> جديد</span><span className="c">2</span></div>
        </div>
        <h3 className="k-section-title">📅 نشاط الأسبوع</h3>
        <div className="activity-grid">
          {[['سبت', 3], ['أحد', 5], ['اثن', 2], ['ثلا', 4], ['أرب', 1], ['خمي', 5], ['جمعة', 0]].map(([d, v], i) => (
            <div className="ad" key={i}><div className="d">{d}</div><div className="v" style={{ color: v ? 'var(--green-600)' : 'var(--gray-300)' }}>{v}</div></div>
          ))}
        </div>
      </div>
      <BottomBar role="student" active="profile" />
    </PhoneFrame>
  );
}

/* ── Compétition ──────────────────────────────────────────── */
function Competition() {
  return (
    <PhoneFrame>
      <AppHeader right={<span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>التحديات</span>} />
      <div className="k-body">
        <h2 className="page-title">🏆 التحديات</h2>
        <div className="rank-card">
          <div className="rank-inner">
            <div className="medal">🥇</div>
            <h3>رتبتك: <span className="r">ذهبي</span></h3>
            <p className="pts">لديك <strong style={{ color: 'var(--green-600)' }}>1,250</strong> نقطة</p>
            <div className="rank-stats">
              <div className="rs"><div className="v">7</div><div className="k">انتصارات</div></div>
              <div className="rs"><div className="v">🔥 4</div><div className="k">متتالية</div></div>
              <div className="rs"><div className="v">12</div><div className="k">تحديات</div></div>
            </div>
            <KProgress value={65} height={8} />
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>750 نقطة للوصول إلى البلاتينيوم</p>
          </div>
        </div>
        <h3 className="k-section-title">🎮 اختر تحدياً</h3>
        <div className="chall-grid">
          <div className="chall"><div className="ce">⚡</div><div className="ct">السباق</div><div className="cd">5 آيات في 5 دقائق</div><KButton size="sm" variant="glow">ابدأ</KButton></div>
          <div className="chall"><div className="ce">🔍</div><div className="ct">صيد الآية</div><div className="cd">حدد السورة من الآية</div><KButton size="sm" variant="glow">ابدأ</KButton></div>
          <div className="chall"><div className="ce">🎯</div><div className="ct">سيد الدقة</div><div className="cd">اكتب الآية بدقة</div><KButton size="sm" variant="glow">ابدأ</KButton></div>
        </div>
        <h3 className="k-section-title">🏅 لوحة المتصدرين</h3>
        <div className="lead-row gold"><span className="rk">🥇</span><div className="who"><div className="n">أحمد</div><div className="p">2,400 نقطة</div></div><KBadge variant="gold">💎 ماسي</KBadge></div>
        <div className="lead-row"><span className="rk">🥈</span><div className="who"><div className="n">فاطمة</div><div className="p">1,800 نقطة</div></div><KBadge variant="primary">🏆 بلاتينيوم</KBadge></div>
        <div className="lead-row"><span className="rk">🥉</span><div className="who"><div className="n">محمد</div><div className="p">1,250 نقطة</div></div><KBadge variant="gold">🥇 ذهبي</KBadge></div>
      </div>
      <BottomBar role="student" active="profile" />
    </PhoneFrame>
  );
}

/* ── Paramètres ───────────────────────────────────────────── */
function Settings() {
  const [theme, setTheme] = React.useState('light');
  return (
    <PhoneFrame>
      <AppHeader right={<span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>الإعدادات</span>} />
      <div className="k-body">
        <div className="tabs-pill"><button>📊 تقدمي</button><button className="active">⚙️ الإعدادات</button></div>
        <h3 className="k-section-title">👤 الملف الشخصي</h3>
        <div className="hifz-prog" style={{ marginBottom: 'var(--space-5)' }}>
          <div className="field"><label>اسمك</label><input type="text" defaultValue="يوسف الإدريسي" /></div>
          <div className="field"><label>الهدف اليومي (آيات)</label><input type="number" defaultValue="5" /></div>
          <Toggle label="الإشعارات" />
          <KButton variant="glow" full>حفظ التغييرات</KButton>
        </div>
        <h3 className="k-section-title">🎨 المظهر</h3>
        <div className="hifz-prog" style={{ marginBottom: 'var(--space-5)' }}>
          <div className="seg" style={{ marginBottom: 'var(--space-3)' }}>
            <button className={theme === 'light' ? 'active' : ''} onClick={() => setTheme('light')}>☀️ فاتح</button>
            <button className={theme === 'dark' ? 'active' : ''} onClick={() => setTheme('dark')}>🌙 داكن</button>
          </div>
          <Toggle label="إشعارات التصحيح" desc="إشعار فوري عند تصحيح المعلم لتلاوتك" />
        </div>
        <h3 className="k-section-title">💾 إدارة البيانات</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <KButton variant="outline" full icon="📤">تصدير البيانات</KButton>
          <KButton variant="outline" full icon="📥">استيراد البيانات</KButton>
          <KButton variant="outline" full icon="🗑️" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>إعادة تعيين</KButton>
        </div>
      </div>
      <BottomBar role="student" active="profile" />
    </PhoneFrame>
  );
}

Object.assign(window, { Landing, Dashboard, HifzSelection, HifzGame, Tasks, Ward, Progress, Competition, Settings });
