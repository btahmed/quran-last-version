/* ui_kits/app/components.jsx — self-contained presentational components
   for the QuranReview Pro UI kit. Mirror the real design-system primitives
   but render without the runtime bundle so the kit always displays.
   Exposes everything on window for sibling Babel scripts. */

function KButton({ children, variant = 'glow', size = 'md', full, icon, onClick, style = {} }) {
  const variants = {
    glow:     { background: 'var(--gradient-green)', color: '#fff', border: 'none', boxShadow: 'var(--shadow-btn-green)' },
    gradient: { background: 'var(--gradient-gold)', color: '#fff', border: 'none', boxShadow: 'var(--shadow-btn-gold)' },
    outline:  { background: 'transparent', color: 'var(--color-primary)', border: '2px solid var(--color-primary)' },
    ghost:    { background: 'rgba(255,255,255,0.12)', color: '#fff', border: '2px solid rgba(255,255,255,0.6)' },
  };
  const pad = size === 'lg' ? '0.9rem 1.6rem' : size === 'sm' ? '0.5rem 1rem' : '0.7rem 1.4rem';
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)',
      padding: pad, fontFamily: 'var(--font-sans)', fontSize: size === 'lg' ? 'var(--text-md)' : size === 'sm' ? 'var(--text-sm)' : '0.9375rem',
      fontWeight: 600, lineHeight: 1, minHeight: 'var(--touch-min)', borderRadius: 'var(--radius-lg)',
      cursor: 'pointer', width: full ? '100%' : 'auto', whiteSpace: 'nowrap',
      transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
      ...variants[variant], ...style,
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}>
      {icon && <span aria-hidden="true">{icon}</span>}{children}
    </button>
  );
}

function KBadge({ children, variant = 'primary', icon, pulse }) {
  const v = {
    primary: { background: 'var(--green-100)', color: 'var(--color-primary)' },
    gold:    { background: 'var(--gold-100)', color: 'var(--gold-700)' },
    success: { background: 'var(--success-soft)', color: 'var(--success)' },
    warning: { background: 'var(--warning-soft)', color: 'var(--warning)' },
    danger:  { background: 'var(--danger-soft)', color: 'var(--danger)' },
    info:    { background: 'var(--info-soft)', color: 'var(--info)' },
  }[variant];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)',
      padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)',
      fontWeight: 600, lineHeight: 1.4, whiteSpace: 'nowrap',
      animation: pulse ? 'pulse-soft 2s infinite' : 'none', ...v,
    }}>{icon && <span aria-hidden="true">{icon}</span>}{children}</span>
  );
}

function KProgress({ value = 0, height = 6 }) {
  return (
    <div style={{ width: '100%', height, background: 'rgba(0,0,0,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: value + '%', background: 'var(--gradient-progress)', borderRadius: '999px', transition: 'width 0.8s ease' }} />
    </div>
  );
}

function KStat({ icon, value, label, progress, gradientValue }) {
  return (
    <div style={{
      background: 'var(--surface-card)', border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', textAlign: 'center',
      boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    }}>
      {icon && <span style={{ fontSize: '1.5rem' }} aria-hidden="true">{icon}</span>}
      <span style={{
        fontSize: 'var(--text-2xl)', fontWeight: 800, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums',
        ...(gradientValue ? { background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' } : { color: 'var(--text-primary)' }),
      }}>{value}</span>
      {progress != null && <div style={{ width: '100%', marginTop: 6 }}><KProgress value={progress} /></div>}
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 2 }}>{label}</span>
    </div>
  );
}

const DOT = { strong: 'var(--success)', weak: 'var(--warning)', new: 'var(--info)', done: 'var(--success)', missed: 'var(--danger)', pending: 'var(--warning)' };
const DOT_GLOW = { strong: 'rgba(16,185,129,.5)', weak: 'rgba(245,158,11,.5)', new: 'rgba(59,130,246,.5)', done: 'rgba(16,185,129,.5)', missed: 'rgba(220,38,38,.5)', pending: 'rgba(245,158,11,.5)' };
function KDot({ status = 'new', size = 12 }) {
  return <span style={{ width: size, height: size, borderRadius: '50%', background: DOT[status], boxShadow: `0 0 8px ${DOT_GLOW[status]}`, flexShrink: 0, display: 'inline-block' }} />;
}

const AR_DAYS = ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'];
const WK_BG = { done: 'rgba(22,163,74,0.08)', missed: 'rgba(220,38,38,0.08)', pending: 'rgba(217,119,6,0.08)', empty: 'var(--surface-raised)' };
const WK_MARK = { done: '✓', missed: '✕', pending: '•', empty: '' };
function KWeek({ days }) {
  return (
    <div dir="rtl" style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'center' }}>
      {days.map((d, i) => (
        <div key={i} style={{
          flex: 1, maxWidth: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          padding: 'var(--space-2)', borderRadius: 'var(--radius-md)',
          background: d.today ? 'var(--green-050)' : WK_BG[d.state],
          border: d.today ? '2px solid var(--green-600)' : '2px solid transparent',
        }}>
          <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{AR_DAYS[i % 7]}</span>
          <span style={{ fontSize: '0.9rem', fontWeight: d.today ? 700 : 600 }}>{d.num}</span>
          <span style={{ fontSize: '0.7rem', minHeight: '1em', color: DOT[d.state] || 'transparent', lineHeight: 1 }}>{WK_MARK[d.state]}</span>
        </div>
      ))}
    </div>
  );
}

function KCard({ children, variant = 'glass', style = {} }) {
  const v = {
    glass: { background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-2xl)' },
    solid: { background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' },
  }[variant];
  return <div style={{ padding: 'var(--space-5)', ...v, ...style }}>{children}</div>;
}

Object.assign(window, { KButton, KBadge, KProgress, KStat, KDot, KWeek, KCard });
