// StudentRadar — « رادار الطلاب » : élèves triés par qui a besoin du professeur en premier.
// Autonome : injecte son CSS. Aucune requête réseau — travaille sur les données
// déjà chargées par la page (élèves + soumissions).

if (!document.querySelector('link[href*="StudentRadar.css"]')) {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = '/src/components/StudentRadar.css';
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

function displayName(s) {
    return s?.first_name || s?.username || s?.name || 'طالب';
}

/**
 * Diagnostic d'un élève à partir de ses soumissions.
 * Fonction pure : testable sans DOM.
 * @returns {{level:'critical'|'warn'|'ok', daysSince:number|null, week:boolean[], count:number}}
 */
export function diagnoseStudent(student, submissions = [], today = new Date()) {
    const mine = submissions.filter(
        s => s.student_id === student.id || s.profiles?.id === student.id
    );
    const dates = mine
        .map(s => s.submitted_at)
        .filter(Boolean)
        .map(d => new Date(d));

    const last = dates.length ? new Date(Math.max(...dates)) : null;
    const daysSince = last ? Math.floor((today - last) / 86400000) : null;

    // 7 derniers jours : y a-t-il eu au moins une soumission ce jour-là ?
    const week = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const iso = d.toISOString().split('T')[0];
        week.push(dates.some(x => x.toISOString().split('T')[0] === iso));
    }

    let level = 'ok';
    if (daysSince === null || daysSince >= 5) level = 'critical';
    else if (daysSince >= 3 || week.filter(Boolean).length <= 2) level = 'warn';

    return { level, daysSince, week, count: mine.length };
}

const LEVEL_ORDER = { critical: 0, warn: 1, ok: 2 };

/**
 * Trie les élèves : les plus à risque en premier.
 * @returns {Array<{student:Object, diag:Object}>}
 */
export function rankStudents(students = [], submissions = [], today = new Date()) {
    return students
        .map(student => ({ student, diag: diagnoseStudent(student, submissions, today) }))
        .sort((a, b) => {
            const d = LEVEL_ORDER[a.diag.level] - LEVEL_ORDER[b.diag.level];
            if (d !== 0) return d;
            return (b.diag.daysSince ?? 999) - (a.diag.daysSince ?? 999);
        });
}

function statusLine(diag) {
    if (diag.daysSince === null) return 'لم يُرسل أي تلاوة بعد';
    if (diag.daysSince === 0) return 'أرسل تلاوة اليوم ✅';
    if (diag.daysSince === 1) return 'آخر تلاوة: أمس';
    return `غائب منذ ${diag.daysSince} أيام`;
}

/**
 * HTML du radar. `onRemind` : nom d'une méthode de la façade window.QuranReview
 * à appeler avec l'id de l'élève. Si absent, le bouton n'est PAS affiché
 * (on ne montre jamais une action inactive).
 */
export function renderStudentRadar(students = [], submissions = [], opts = {}) {
    if (!Array.isArray(students) || !students.length) {
        return '<p class="k-empty">لا يوجد طلاب في فصلك بعد</p>';
    }
    const ranked = rankStudents(students, submissions, opts.today || new Date());
    const counts = {
        critical: ranked.filter(r => r.diag.level === 'critical').length,
        warn: ranked.filter(r => r.diag.level === 'warn').length,
        ok: ranked.filter(r => r.diag.level === 'ok').length,
    };

    const cards = ranked
        .map(({ student, diag }) => {
            const name = displayName(student);
            const bars = diag.week.map(done => `<i class="${done ? 'is-done' : ''}"></i>`).join('');
            const remind =
                diag.level !== 'ok' && opts.onRemind
                    ? `<button type="button" class="radar-action is-${diag.level}"
                         onclick="QuranReview.${opts.onRemind}('${escapeHtml(String(student.id))}')">📩 ذكّره</button>`
                    : diag.level === 'ok'
                      ? `<span class="radar-score">${diag.count} تلاوة</span>`
                      : '';
            return `
        <div class="radar-card is-${diag.level}" data-student-id="${escapeHtml(String(student.id))}">
            <div class="radar-top">
                <span class="radar-avatar is-${diag.level}">${escapeHtml(name.charAt(0))}</span>
                <div class="radar-id">
                    <div class="name">${escapeHtml(name)}</div>
                    <div class="meta">${statusLine(diag)}</div>
                </div>
                ${remind}
            </div>
            <div class="streak-bars" aria-label="آخر 7 أيام">${bars}</div>
        </div>`;
        })
        .join('');

    return `
    <div class="student-radar" dir="rtl">
        <div class="radar-filters">
            <span class="radar-pill is-all">الكل ${ranked.length}</span>
            <span class="radar-pill is-critical">⚠️ متعثر ${counts.critical}</span>
            <span class="radar-pill is-warn">⏳ متأخر ${counts.warn}</span>
            <span class="radar-pill is-ok">✅ منتظم ${counts.ok}</span>
        </div>
        <div class="radar-list">${cards}</div>
    </div>`;
}

/** Monte le radar dans un conteneur. Renvoie false si le conteneur est absent. */
export function mountStudentRadar(containerId, students, submissions, opts = {}) {
    const host = document.getElementById(containerId);
    if (!host) return false;
    host.innerHTML = renderStudentRadar(students, submissions, opts);
    return true;
}
