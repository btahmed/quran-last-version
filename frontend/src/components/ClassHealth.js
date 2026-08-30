// ClassHealth — cartes de santé des fasl (admin) : 🟢 نشيط / 🟡 تباطؤ / 🔴 حرج.
// Autonome : injecte son CSS. Ne fait aucune requête — travaille sur les classes
// déjà chargées par AdminClassesSection.

if (!document.querySelector('link[href*="ClassHealth.css"]')) {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = '/src/components/ClassHealth.css';
    document.head.appendChild(l);
}

function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function num(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
}

/**
 * Diagnostic d'une classe. Fonction pure.
 * Champs lus (tous optionnels, avec repli) :
 *   name / class_name, teacher_name / teacher, student_count / students,
 *   attendance_rate (0–100), graded_rate (0–100), pending_count
 * @returns {{level:'critical'|'warn'|'ok', reason:string, hasTeacher:boolean}}
 */
export function diagnoseClass(cls = {}) {
    const hasTeacher = Boolean(cls.teacher_name || cls.teacher || cls.teacher_id);
    const attendance = num(cls.attendance_rate);
    const graded = num(cls.graded_rate);
    const pending = num(cls.pending_count);

    if (!hasTeacher) {
        return {
            level: 'critical',
            reason: pending ? `بلا معلم · ${pending} تسليماً معلقاً` : 'بلا معلم',
            hasTeacher,
        };
    }
    if (attendance && attendance < 70) {
        return {
            level: 'warn',
            reason: `الحضور ${attendance}% — تباطؤ`,
            reasonShort: true,
            hasTeacher,
        };
    }
    if (graded && graded < 60) {
        return { level: 'warn', reason: `${graded}% فقط من التسليمات مصححة`, hasTeacher };
    }
    return { level: 'ok', reason: 'الفصل يسير بانتظام', hasTeacher };
}

const BADGE = {
    ok: '🟢 نشيط',
    warn: '🟡 تباطؤ',
    critical: '🔴 حرج',
};

function bar(label, pct) {
    if (!pct) return '';
    return `
    <div class="ch-metric">
        <div class="ch-metric-label">${escapeHtml(label)}</div>
        <div class="ch-track"><div class="ch-fill is-${pct < 60 ? 'low' : pct < 80 ? 'mid' : 'high'}" style="width:${Math.min(100, pct)}%"></div></div>
    </div>`;
}

/**
 * HTML des cartes de santé, classes les plus critiques en premier.
 * `onAssignTeacher` : nom d'une méthode de window.QuranReview appelée avec l'id
 * de la classe. Absent → le bouton n'est pas affiché.
 */
export function renderClassHealth(classes = [], opts = {}) {
    if (!Array.isArray(classes) || !classes.length) {
        return '<p class="k-empty">لا توجد فصول مسجّلة بعد</p>';
    }
    const order = { critical: 0, warn: 1, ok: 2 };
    const cards = classes
        .map(cls => ({ cls, diag: diagnoseClass(cls) }))
        .sort((a, b) => order[a.diag.level] - order[b.diag.level])
        .map(({ cls, diag }) => {
            const name = cls.name || cls.class_name || 'فصل';
            const teacher = cls.teacher_name || cls.teacher || null;
            const students = num(cls.student_count || cls.students);
            const sub = [teacher ? `أ. ${teacher}` : null, students ? `${students} طالباً` : null]
                .filter(Boolean)
                .join(' · ');

            const action =
                diag.level === 'critical' && !diag.hasTeacher && opts.onAssignTeacher
                    ? `<button type="button" class="ch-action"
                         onclick="QuranReview.${opts.onAssignTeacher}('${escapeHtml(String(cls.id))}')">تعيين معلم الآن</button>`
                    : '';

            return `
        <div class="class-health is-${diag.level}" data-class-id="${escapeHtml(String(cls.id))}" data-class-name="${escapeHtml(name)}">
            <div class="ch-head">
                <div class="ch-id">
                    <strong>${escapeHtml(name)}</strong>
                    <div class="ch-sub">${escapeHtml(sub || diag.reason)}</div>
                </div>
                <span class="ch-badge is-${diag.level}">${BADGE[diag.level]}</span>
            </div>
            ${sub ? `<div class="ch-reason">${escapeHtml(diag.reason)}</div>` : ''}
            <div class="ch-metrics">
                ${bar('حضور الأسبوع', num(cls.attendance_rate))}
                ${bar('تسليمات مصححة', num(cls.graded_rate))}
            </div>
            ${action}
        </div>`;
        })
        .join('');

    return `<div class="class-health-list" dir="rtl">${cards}</div>`;
}

/** Monte les cartes dans un conteneur. Renvoie false si le conteneur est absent. */
export function mountClassHealth(containerId, classes, opts = {}) {
    const host = document.getElementById(containerId);
    if (!host) return false;
    host.innerHTML = renderClassHealth(classes, opts);
    return true;
}
