// HifzFocus — mode focus immersif pour la page الحفظ :
// fond sombre plein écran, barre de combo (🔥 سلسلة ×N), propositions de mots.
// Autonome : injecte son CSS. Ne modifie pas hifzEngine — il lui suffit d'être
// appelé quand une session commence / une réponse est validée.

if (!document.querySelector('link[href*="HifzFocus.css"]')) {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = '/src/components/HifzFocus.css';
    document.head.appendChild(l);
}

const FOCUS_CLASS = 'hifz-focus-on';

/** Active le mode focus (fond sombre). À appeler au démarrage d'une session. */
export function enableHifzFocus() {
    document.body.classList.add(FOCUS_CLASS);
}

/** Désactive le mode focus. À appeler à la fin / sortie de session. */
export function disableHifzFocus() {
    document.body.classList.remove(FOCUS_CLASS);
}

/**
 * Barre de combo. `streak` = nombre de bonnes réponses consécutives,
 * `progress` = avancement de la session en % (0–100).
 */
export function renderComboBar({ surah = '', ayah = null, streak = 0, progress = 0 } = {}) {
    const left = [surah, ayah ? `الآية ${ayah}` : null].filter(Boolean).join(' · ');
    const combo = streak > 1 ? `🔥 سلسلة ×${streak}` : '';
    return `
    <div class="hifz-combo" dir="rtl">
        <div class="hc-line">
            <span class="hc-where">${escapeHtml(left)}</span>
            <span class="hc-streak${streak > 1 ? ' is-hot' : ''}">${combo}</span>
        </div>
        <div class="hc-track"><div class="hc-fill" style="width:${Math.max(0, Math.min(100, progress))}%"></div></div>
    </div>`;
}

/**
 * Propositions de mots (une bonne + des leurres mélangés).
 * `onPick` : nom d'une méthode de window.QuranReview appelée avec le mot choisi.
 */
export function renderWordChoices(words = [], onPick = null) {
    if (!words.length) return '';
    const btns = words
        .map(w => {
            const safe = escapeHtml(w);
            const handler = onPick
                ? ` onclick="QuranReview.${onPick}('${safe.replace(/'/g, '')}')"`
                : '';
            return `<button type="button" class="hifz-choice"${handler}>${safe}</button>`;
        })
        .join('');
    return `<div class="hifz-choices" dir="rtl">${btns}</div>`;
}

/** Mélange un tableau (Fisher-Yates) — pour disposer la bonne réponse au hasard. */
export function shuffle(arr = []) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/** Retour visuel : succès (+points) ou erreur. */
export function renderFeedback({ ok = null, points = 0 } = {}) {
    if (ok === null) return '<div class="hifz-feedback"></div>';
    return ok
        ? `<div class="hifz-feedback is-ok">أحسنت! ✓${points ? ` +${points} نقاط` : ''}</div>`
        : '<div class="hifz-feedback is-err">حاول مرة أخرى</div>';
}

function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
