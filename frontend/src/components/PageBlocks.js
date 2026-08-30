// PageBlocks — les structures des maquettes, réutilisables sur toute l'app.
//   • renderPageHero()      : bandeau sombre d'en-tête (maquette 1a / 2a)
//   • renderMushafMap()     : carte du Mushaf 30 juz' + anneau + badges (1e)
//   • renderWardStudio()    : studio de tilawa — karaoké + onde + contrôles (1d)
//   • renderCompetitionBoard() : rang + défis + classement
// Autonome : injecte son CSS. Aucune requête réseau, aucune donnée inventée —
// chaque bloc renvoie '' si les données nécessaires manquent.

if (!document.querySelector('link[href*="PageBlocks.css"]')) {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = '/src/components/PageBlocks.css';
    document.head.appendChild(l);
}

function esc(str) {
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

/* ══════════════════════════════════════════════════════════════
   1. Bandeau d'en-tête sombre — la signature des maquettes
   ══════════════════════════════════════════════════════════════ */

/**
 * @param {{eyebrow?:string, title:string, meta?:string, progress?:number|null,
 *          action?:{label:string, onclick?:string}|null, stats?:Array<{value:string,label:string}>}} o
 */
export function renderPageHero(o = {}) {
    if (!o.title) return '';
    const bar =
        typeof o.progress === 'number'
            ? `<div class="ph-track"><div class="ph-fill" style="width:${Math.max(0, Math.min(100, o.progress))}%"></div></div>`
            : '';
    const action = o.action?.label
        ? `<button type="button" class="ph-action"${o.action.onclick ? ` onclick="${esc(o.action.onclick)}"` : ''}>${esc(o.action.label)}</button>`
        : '';
    const stats = (o.stats || []).length
        ? `<div class="ph-stats">${o.stats
              .map(
                  s =>
                      `<div class="ph-stat"><div class="v">${esc(s.value)}</div><div class="k">${esc(s.label)}</div></div>`
              )
              .join('')}</div>`
        : '';
    return `
    <div class="page-hero" dir="rtl">
        ${o.eyebrow ? `<span class="ph-eyebrow">${esc(o.eyebrow)}</span>` : ''}
        <div class="ph-title">${esc(o.title)}</div>
        ${o.meta ? `<div class="ph-meta">${esc(o.meta)}</div>` : ''}
        ${bar}
        ${stats}
        ${action}
    </div>`;
}

/* ══════════════════════════════════════════════════════════════
   2. Carte du Mushaf — 30 juz'
   ══════════════════════════════════════════════════════════════ */

/** Bornes de juz' : première sourate de chaque juz (approximation standard). */
const JUZ_FIRST_SURAH = [
    1, 2, 2, 3, 4, 4, 5, 6, 7, 8, 9, 11, 12, 15, 17, 18, 21, 23, 25, 27, 29, 33, 36, 39, 41, 46, 51,
    58, 67, 78,
];

/** Juz' d'une sourate (1–30), d'après son numéro. */
export function juzOfSurah(surahNumber) {
    const n = num(surahNumber);
    if (!n) return null;
    let juz = 1;
    for (let i = 0; i < JUZ_FIRST_SURAH.length; i++) {
        if (n >= JUZ_FIRST_SURAH[i]) juz = i + 1;
    }
    return juz;
}

/**
 * État de chaque juz' d'après les données de mémorisation réelles.
 * @returns {Array<'mastered'|'learning'|'empty'>} longueur 30
 */
export function buildJuzStates(items = []) {
    const states = new Array(30).fill('empty');
    items.forEach(item => {
        const n = num(item.surahNumber || item.surah_number || item.surahId || item.surah_id);
        const juz = juzOfSurah(n);
        if (!juz) return;
        const idx = juz - 1;
        if (item.status === 'mastered') states[idx] = 'mastered';
        else if (states[idx] !== 'mastered') states[idx] = 'learning';
    });
    return states;
}

/**
 * @param {Array} items - state.memorizationData (ignoré si o.states est fourni)
 * @param {{percent?:number, surahs?:number, ayahs?:number, streak?:number, badges?:Array,
 *          states?:Array<'mastered'|'learning'|'empty'>}} o - `states` (30 entrées) permet de
 *          fournir un calcul déjà fait à partir d'une autre source de vérité (ex. pages réelles
 *          plutôt que numéros de sourate) sans passer par buildJuzStates().
 */
export function renderMushafMap(items = [], o = {}) {
    const states =
        Array.isArray(o.states) && o.states.length === 30 ? o.states : buildJuzStates(items);
    const known = states.filter(s => s !== 'empty').length;
    // Sans numéro de sourate exploitable, la carte serait toute vide : on ne l'affiche pas.
    if (!known) return '';

    const pct =
        typeof o.percent === 'number'
            ? Math.round(o.percent)
            : Math.round((states.filter(s => s === 'mastered').length / 30) * 100);
    const cells = states
        .map((st, i) => {
            const cls =
                st === 'mastered' ? ' is-mastered' : st === 'learning' ? ' is-learning' : '';
            return `<span class="juz-cell${cls}" title="الجزء ${i + 1}">${i + 1}</span>`;
        })
        .join('');

    const sub = [o.surahs ? `${num(o.surahs)} سورة` : null, o.ayahs ? `${num(o.ayahs)} آية` : null]
        .filter(Boolean)
        .join(' · ');

    const badges = (o.badges || []).length
        ? `<div class="mm-badges">${o.badges
              .map(
                  b =>
                      `<div class="mm-badge${b.locked ? ' is-locked' : ''}"><div class="e">${esc(b.emoji || '✨')}</div><div class="t">${esc(b.label || '')}</div></div>`
              )
              .join('')}</div>`
        : '';

    return `
    <div class="mushaf-map" dir="rtl">
        <div class="mm-head">
            <div class="ring-stat" style="--pct:${pct}"><span>${pct}%</span></div>
            <div class="mm-id">
                ${sub ? `<strong>${esc(sub)}</strong>` : ''}
                <span class="mm-sub">${known} من 30 جزءاً بدأت فيه 🌙</span>
                ${o.streak ? `<span class="mm-streak">🔥 ${num(o.streak)} يوم متتالي</span>` : ''}
            </div>
        </div>
        <div class="juz-map">${cells}</div>
        <div class="mm-legend">
            <span><i class="is-mastered"></i>متقن</span>
            <span><i class="is-learning"></i>قيد الحفظ</span>
            <span><i></i>لم يبدأ</span>
        </div>
        ${badges}
    </div>`;
}

/* ══════════════════════════════════════════════════════════════
   3. Studio de tilawa — karaoké + onde + contrôles
   ══════════════════════════════════════════════════════════════ */

/**
 * @param {{ayahText?:string, ayahBefore?:string, index?:number, total?:number,
 *          playing?:boolean, timer?:string, onPlay?:string, onPrev?:string, onNext?:string}} o
 */
export function renderWardStudio(o = {}) {
    if (!o.ayahText) return '';
    const chip =
        o.index && o.total
            ? `<span class="ws-chip">الآية ${num(o.index)} من ${num(o.total)}</span>`
            : '';
    const wave = `<div class="wave-meter${o.playing ? '' : ' is-idle'}" aria-hidden="true">${'<span></span>'.repeat(9)}</div>`;
    return `
    <div class="ward-studio" dir="rtl">
        <div class="ws-stage">
            ${chip}
            <div class="ayah-karaoke">
                ${o.ayahBefore ? `<span class="is-past">${esc(o.ayahBefore)}</span> ` : ''}<span class="is-current">${esc(o.ayahText)}</span>
            </div>
        </div>
        ${wave}
        ${o.timer ? `<div class="ws-timer">${esc(o.timer)}</div>` : ''}
        <div class="ws-controls">
            <button type="button" class="ws-btn"${o.onPrev ? ` onclick="${esc(o.onPrev)}"` : ''} aria-label="الآية السابقة">⏮</button>
            <button type="button" class="ws-btn is-main"${o.onPlay ? ` onclick="${esc(o.onPlay)}"` : ''} aria-label="تشغيل أو إيقاف">${o.playing ? '❚❚' : '▶'}</button>
            <button type="button" class="ws-btn"${o.onNext ? ` onclick="${esc(o.onNext)}"` : ''} aria-label="الآية التالية">⏭</button>
        </div>
    </div>`;
}

/* ══════════════════════════════════════════════════════════════
   4. Tableau des défis — rang + défis + classement
   ══════════════════════════════════════════════════════════════ */

/**
 * @param {{rank?:{medal?:string,label?:string,points?:number,nextAt?:number,progress?:number},
 *          challenges?:Array<{emoji:string,title:string,desc:string,onclick?:string}>,
 *          leaders?:Array<{name:string,points:number,badge?:string}>}} o
 */
export function renderCompetitionBoard(o = {}) {
    const r = o.rank;
    const rankCard = r?.label
        ? `
    <div class="cb-rank">
        <div class="cb-medal">${esc(r.medal || '🏅')}</div>
        <div class="cb-rank-title">رتبتك: <span>${esc(r.label)}</span></div>
        ${r.points ? `<div class="cb-points">لديك <strong>${num(r.points)}</strong> نقطة</div>` : ''}
        ${
            typeof r.progress === 'number'
                ? `<div class="ph-track"><div class="ph-fill" style="width:${Math.max(0, Math.min(100, r.progress))}%"></div></div>`
                : ''
        }
        ${r.nextAt ? `<div class="cb-next">${num(r.nextAt)} نقطة للرتبة التالية</div>` : ''}
    </div>`
        : '';

    const challenges = (o.challenges || []).length
        ? `<div class="cb-grid">${o.challenges
              .map(
                  c => `
        <div class="cb-chall">
            <div class="e">${esc(c.emoji || '🎮')}</div>
            <div class="t">${esc(c.title || '')}</div>
            <div class="d">${esc(c.desc || '')}</div>
            <button type="button" class="cb-start"${c.onclick ? ` onclick="${esc(c.onclick)}"` : ''}>ابدأ</button>
        </div>`
              )
              .join('')}</div>`
        : '';

    const medals = ['🥇', '🥈', '🥉'];
    const leaders = (o.leaders || []).length
        ? `<div class="cb-leaders">${o.leaders
              .slice(0, 10)
              .map(
                  (l, i) => `
        <div class="cb-leader${i === 0 ? ' is-gold' : ''}">
            <span class="rk">${medals[i] || i + 1}</span>
            <div class="who"><div class="n">${esc(l.name || 'طالب')}</div><div class="p">${num(l.points)} نقطة</div></div>
            ${l.badge ? `<span class="k-chip k-chip--gold">${esc(l.badge)}</span>` : ''}
        </div>`
              )
              .join('')}</div>`
        : '';

    if (!rankCard && !challenges && !leaders) return '';
    return `<div class="competition-board" dir="rtl">${rankCard}${challenges}${leaders}</div>`;
}

/* ══════════════════════════════════════════════════════════════
   Montage
   ══════════════════════════════════════════════════════════════ */

/** Monte un HTML dans un conteneur. Renvoie false si conteneur absent ou HTML vide. */
export function mountBlock(containerId, html) {
    const host = document.getElementById(containerId);
    if (!host) return false;
    if (!html) {
        host.innerHTML = '';
        return false;
    }
    host.innerHTML = html;
    return true;
}
