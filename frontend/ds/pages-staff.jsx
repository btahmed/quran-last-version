/* ds/pages-staff.jsx — écrans enseignant + admin. */
const { PhoneFrame, AppHeader, BottomBar, Toggle, KButton, KBadge, KStat, KProgress, KDot } = window;

const GRADES = [
  { g: 1, e: '😟', t: 'ضعيف' }, { g: 2, e: '😐', t: 'مقبول' }, { g: 3, e: '🙂', t: 'جيد' },
  { g: 4, e: '😊', t: 'جيد جداً' }, { g: 5, e: '🌟', t: 'ممتاز' },
];

/* ── Enseignant › Devoirs (créer + liste) ─────────────────── */
function TeacherDevoirs() {
  const [mode, setMode] = React.useState('all');
  return (
    <PhoneFrame>
      <AppHeader title="لوحة المعلم" right={<span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>أ. خالد</span>} />
      <div className="k-body">
        <div className="subtabs">
          <button className="active">📋 الواجبات</button>
          <button>🎧 التسليمات</button>
          <button>👥 الطلاب</button>
        </div>
        <h3 className="k-section-title">➕ إنشاء مهمة جديدة</h3>
        <div className="hifz-game-card" style={{ marginBottom: 'var(--space-5)' }}>
          <div className="field"><label>عنوان المهمة</label><input type="text" placeholder="حفظ سورة الملك" /></div>
          <div className="field"><label>وصف المهمة</label><textarea style={{ minHeight: 60 }} placeholder="من الآية 1 إلى 15..." /></div>
          <div className="field-row">
            <div className="field"><label>النوع</label><select><option>حفظ</option><option>مراجعة</option><option>تلاوة</option></select></div>
            <div className="field"><label>النقاط</label><input type="number" defaultValue="10" /></div>
          </div>
          <div className="field"><label>تاريخ التسليم</label><input type="date" /></div>
          <p style={{ fontSize: 'var(--text-xs)', fontWeight: 600, margin: '0 0 var(--space-2)' }}>👥 تعيين إلى</p>
          <div className="seg" style={{ marginBottom: 'var(--space-4)' }}>
            <button className={mode === 'all' ? 'active' : ''} onClick={() => setMode('all')}>جميع الطلاب</button>
            <button className={mode === 'select' ? 'active' : ''} onClick={() => setMode('select')}>طلاب محددون</button>
          </div>
          <KButton variant="glow" full>إنشاء المهمة</KButton>
        </div>
        <h3 className="k-section-title">📋 قائمة المهام</h3>
        <div className="task-card">
          <div className="body"><div className="ttl">حفظ سورة الملك</div><div className="meta"><span className="type-badge">حفظ</span>🏆 20 · 👥 24 طالب <span>📅 أُنشئت 09/06</span></div></div>
          <button className="pending-actions" style={{ border: 'none', background: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>🗑️</button>
        </div>
        <div className="task-card">
          <div className="body"><div className="ttl">مراجعة سورة يس</div><div className="meta"><span className="type-badge">مراجعة</span>🏆 15 · 👥 18 طالب <span>⏰ تسليم 14/06</span></div></div>
          <button style={{ border: 'none', background: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>🗑️</button>
        </div>
      </div>
      <BottomBar role="teacher" active="devoirs" />
    </PhoneFrame>
  );
}

/* ── Enseignant › Soumissions (audio + modal notation) ───── */
function TeacherSoumissions() {
  const [modal, setModal] = React.useState(false);
  const [grade, setGrade] = React.useState(null);
  return (
    <PhoneFrame>
      <AppHeader title="لوحة المعلم" right={<span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>أ. خالد</span>} />
      <div className="k-body">
        <div className="subtabs">
          <button>📋 الواجبات</button>
          <button className="active">🎧 التسليمات</button>
          <button>👥 الطلاب</button>
        </div>
        <h3 className="k-section-title">📥 تسليمات الطلاب</h3>
        {[['أمينة بنعلي', 'سورة الملك 1–15', 20], ['يوسف الإدريسي', 'سورة يس مراجعة', 15]].map(([n, t, p], i) => (
          <div className="pending-card" key={i}>
            <div className="pending-head"><strong>🎓 {n}</strong><span className="type-badge">{t}</span></div>
            <div className="pending-meta"><span>🏆 {p} نقطة</span><span>📅 10 يونيو</span></div>
            <div className="audio">
              <button className="play">▶</button>
              <div className="track"><div className="bar"><span style={{ width: '32%' }} /></div><div className="time"><span>0:42</span><span>2:14</span></div></div>
            </div>
            <div className="pending-actions">
              <button className="btn-grade" onClick={() => { setModal(true); setGrade(null); }}>⭐ قبول وتقييم</button>
              <button className="btn-reject">✗ رفض</button>
            </div>
          </div>
        ))}
      </div>
      <BottomBar role="teacher" active="soumissions" />
      {modal && (
        <div className="grade-overlay" onClick={() => setModal(false)}>
          <div className="grade-modal" onClick={e => e.stopPropagation()}>
            <h3>⭐ تقييم التسليم</h3>
            <p className="gsub">أمينة بنعلي — سورة الملك 1–15</p>
            <div className="grade-emojis">
              {GRADES.map(g => (
                <button key={g.g} className={grade === g.g ? 'sel' : ''} onClick={() => setGrade(g.g)} title={g.t}>{g.e}</button>
              ))}
            </div>
            <div className="grade-label">{grade ? `${GRADES[grade - 1].e} ${GRADES[grade - 1].t}` : ''}</div>
            <div className="grade-actions">
              <KButton variant="outline" size="sm" onClick={() => setModal(false)}>إلغاء</KButton>
              <KButton variant="glow" size="sm" onClick={() => setModal(false)}>✓ قبول</KButton>
            </div>
          </div>
        </div>
      )}
    </PhoneFrame>
  );
}

/* ── Enseignant › Élèves ──────────────────────────────────── */
function TeacherEleves() {
  return (
    <PhoneFrame>
      <AppHeader title="لوحة المعلم" right={<span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>أ. خالد</span>} />
      <div className="k-body">
        <div className="subtabs">
          <button>📋 الواجبات</button>
          <button>🎧 التسليمات</button>
          <button className="active">👥 الطلاب</button>
        </div>
        <h3 className="k-section-title">🎓 قائمة الطلاب</h3>
        {[['أمينة بنعلي', 'أ', 340, 12], ['يوسف الإدريسي', 'ي', 1340, 28], ['مريم العلوي', 'م', 890, 19], ['عمر الفاسي', 'ع', 210, 6]].map(([n, ini, pts, sub], i) => (
          <div className="list-row" key={i}>
            <span className="av">{ini}</span>
            <div className="info"><div className="n">🎓 {n}</div><div className="s"><span>🏆 {pts} نقطة</span><span>📝 {sub} تسليم</span></div></div>
            <span className="arrow">←</span>
          </div>
        ))}
        <h3 className="k-section-title" style={{ marginTop: 'var(--space-5)' }}>📊 تقدم الطالب: مريم</h3>
        <div className="hifz-prog">
          <div className="task-card" style={{ marginBottom: 'var(--space-2)' }}>
            <div className="body"><div className="ttl">سورة الرحمن 1–20</div><div className="meta"><span className="type-badge">حفظ</span>🏆 25</div></div>
            <KBadge variant="success">مقبول ✓</KBadge>
          </div>
          <div className="task-card" style={{ marginBottom: 0 }}>
            <div className="body"><div className="ttl">سورة يس مراجعة</div><div className="meta"><span className="type-badge">مراجعة</span>🏆 15</div></div>
            <KBadge variant="warning" icon="⏳">بانتظار</KBadge>
          </div>
        </div>
      </div>
      <BottomBar role="teacher" active="eleves" />
    </PhoneFrame>
  );
}

/* ── Admin — compteurs partagés ───────────────────────────── */
function AdminCounters() {
  return (
    <div className="k-grid2" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 'var(--space-5)' }}>
      <KStat icon="👥" value="253" label="مستخدمون" gradientValue />
      <KStat icon="📋" value="142" label="المهام" />
      <KStat icon="⏳" value="8" label="انتظار" />
      <KStat icon="✅" value="612" label="مقبول" />
    </div>
  );
}

/* ── Admin › Utilisateurs ─────────────────────────────────── */
function AdminUsers() {
  return (
    <PhoneFrame>
      <AppHeader title="لوحة الإدارة" right={<KBadge variant="info">Admin</KBadge>} />
      <div className="k-body">
        <h2 className="page-title">⚙️ لوحة الإدارة</h2>
        <AdminCounters />
        <div className="subtabs">
          <button className="active">👥 المستخدمون</button>
          <button>🏫 الفصول</button>
          <button>📊 الإحصاء</button>
        </div>
        {[['خالد المنصوري', 'خ', 'teacher', 'معلم'], ['أمينة بنعلي', 'أ', 'student', 'طالب'], ['يوسف الإدريسي', 'ي', 'student', 'طالب'], ['سارة الإدارية', 'س', 'admin', 'مدير']].map(([n, ini, role, lbl], i) => (
          <div className="list-row" key={i}>
            <span className={'av' + (role === 'teacher' ? ' gold' : '')}>{ini}</span>
            <div className="info"><div className="n">{n}</div><div className="s"><span className={'role-pill ' + role}>{lbl}</span></div></div>
            <span className="arrow">✏️</span>
          </div>
        ))}
      </div>
      <BottomBar role="admin" active="users" />
    </PhoneFrame>
  );
}

/* ── Admin › Classes ──────────────────────────────────────── */
function AdminClasses() {
  return (
    <PhoneFrame>
      <AppHeader title="لوحة الإدارة" right={<KBadge variant="info">Admin</KBadge>} />
      <div className="k-body">
        <h2 className="page-title">⚙️ لوحة الإدارة</h2>
        <AdminCounters />
        <div className="subtabs">
          <button>👥 المستخدمون</button>
          <button className="active">🏫 الفصول</button>
          <button>📊 الإحصاء</button>
        </div>
        <KButton variant="glow" full icon="＋" style={{ marginBottom: 'var(--space-4)' }}>إنشاء فصل جديد</KButton>
        {[['حلقة الفجر', 'مسجد النور', 'أ. خالد', 24], ['حلقة العصر', 'مسجد التقوى', 'أ. سعيد', 18], ['حلقة المغرب', 'مسجد النور', 'أ. خالد', 31]].map(([n, masjid, teacher, count], i) => (
          <div className="list-row" key={i} style={{ cursor: 'default' }}>
            <span className="av gold">🏫</span>
            <div className="info"><div className="n">{n}</div><div className="s"><span>🕌 {masjid}</span><span>👨‍🏫 {teacher}</span></div></div>
            <KBadge variant="primary">{count} طالب</KBadge>
          </div>
        ))}
      </div>
      <BottomBar role="admin" active="classes" />
    </PhoneFrame>
  );
}

/* ── Admin › Statistiques ─────────────────────────────────── */
function AdminStats() {
  return (
    <PhoneFrame>
      <AppHeader title="لوحة الإدارة" right={<KBadge variant="info">Admin</KBadge>} />
      <div className="k-body">
        <h2 className="page-title">⚙️ لوحة الإدارة</h2>
        <AdminCounters />
        <div className="subtabs">
          <button>👥 المستخدمون</button>
          <button>🏫 الفصول</button>
          <button className="active">📊 الإحصاء</button>
        </div>
        <h3 className="k-section-title">👨‍🏫 إحصائيات المعلمين</h3>
        <div className="k-grid2" style={{ marginBottom: 'var(--space-5)' }}>
          {[['أ. خالد المنصوري', 55, 312], ['أ. سعيد العامري', 31, 198]].map(([n, students, tasks], i) => (
            <div className="hifz-prog" key={i} style={{ padding: 'var(--space-3)' }}>
              <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: 6 }}>👨‍🏫 {n}</div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}><span>👥 {students} طالب</span><span>📋 {tasks} مهمة</span></div>
            </div>
          ))}
        </div>
        <h3 className="k-section-title">📋 آخر المهام</h3>
        <div className="hifz-prog">
          <div className="log-row"><span className="l">📋 حفظ سورة الملك · أ. خالد</span><span className="delta">24</span></div>
          <div className="log-row"><span className="l">📋 مراجعة يس · أ. سعيد</span><span className="delta">18</span></div>
          <div className="log-row" style={{ borderBottom: 'none' }}><span className="l">📋 تلاوة الرحمن · أ. خالد</span><span className="delta">31</span></div>
        </div>
      </div>
      <BottomBar role="admin" active="stats" />
    </PhoneFrame>
  );
}

Object.assign(window, { TeacherDevoirs, TeacherSoumissions, TeacherEleves, AdminUsers, AdminClasses, AdminStats });
