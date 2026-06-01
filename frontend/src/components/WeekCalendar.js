// WeekCalendar — composant calendrier hebdomadaire RTL
// Affiche 7 jours centrés sur aujourd'hui : -3 jours → +3 jours
// Statuts : done ✅ / missed ❌ / pending ⏳ / empty ·

// Injection CSS dynamique (pattern du projet)
if (!document.querySelector('link[href*="WeekCalendar.css"]')) {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = '/src/components/WeekCalendar.css';
    document.head.appendChild(l);
}

const DAY_LABELS_AR = ['أحد', 'اثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'];

/**
 * Génère le HTML du calendrier 7 jours.
 * @param {Array} tasks - Liste des tâches Supabase (chaque tâche a due_date et status)
 * @returns {string} HTML du composant
 */
export function renderWeekCalendar(tasks = []) {
    const today = new Date();
    const days = [];

    for (let offset = -3; offset <= 3; offset++) {
        const d = new Date(today);
        d.setDate(today.getDate() + offset);
        const iso = d.toISOString().split('T')[0]; // YYYY-MM-DD

        const dayTasks = tasks.filter(t => t.due_date && t.due_date.startsWith(iso));
        const hasTasks = dayTasks.length > 0;
        const allDone = hasTasks && dayTasks.every(
            t => t.status === 'graded' || t.status === 'approved'
        );

        let status;
        if (!hasTasks)       status = 'empty';
        else if (allDone)    status = 'done';
        else if (offset < 0) status = 'missed';
        else                 status = 'pending';

        days.push({
            label:   DAY_LABELS_AR[d.getDay()],
            date:    d.getDate(),
            isToday: offset === 0,
            status,
        });
    }

    const dayHtml = days.map(({ label, date, isToday, status }) => {
        const dot = status === 'done'    ? '✅'
                  : status === 'missed'  ? '❌'
                  : status === 'pending' ? '⏳'
                  : '·';
        const todayClass = isToday ? ' week-day--today' : '';
        return `
        <div class="week-day week-day--${status}${todayClass}" role="listitem">
            <span class="week-day-label">${label}</span>
            <span class="week-day-num">${date}</span>
            <span class="week-day-dot" aria-hidden="true">${dot}</span>
        </div>`;
    }).join('');

    return `<div class="week-calendar" dir="rtl" role="list" aria-label="أسبوعك">${dayHtml}</div>`;
}
