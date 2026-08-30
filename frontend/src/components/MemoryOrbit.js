// MemoryOrbit — « مدار الذاكرة » : vue radiale des sourates selon la force de mémoire.
// Autonome : injecte son CSS, ne dépend d'aucune librairie, ne touche à aucun état global.
//
// Intégration (2 lignes) — voir src/components/INTEGRATION.md
//   import { renderMemoryOrbit, mountMemoryOrbit } from '../components/MemoryOrbit.js';

if (!document.querySelector('link[href*="MemoryOrbit.css"]')) {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = '/src/components/MemoryOrbit.css';
    document.head.appendChild(l);
}

/** Nombre minimum de sourates pour que l'orbite soit lisible. En dessous : repli sur la liste. */
export const ORBIT_MIN_ITEMS = 3;

/**
 * Force de mémoire d'une sourate, 0 → 100.
 * Base selon le statut, puis décroissance de 4 points par jour depuis la dernière révision.
 * Fonction pure : testable sans DOM.
 * @param {{status?: string, lastReviewed?: string}} item
 * @param {Date} [today]
 * @returns {number} 0…100
 */
export function computeMemoryStrength(item, today = new Date()) {
    const base = item?.status === 'mastered' ? 95 : item?.status === 'weak' ? 60 : 40;
    if (!item?.lastReviewed) return Math.max(0, base - 20);
    const then = new Date(item.lastReviewed);
    if (Number.isNaN(then.getTime())) return Math.max(0, base - 20);
    const days = Math.max(0, Math.floor((today - then) / 86400000));
    return Math.max(0, Math.min(100, base - days * 4));
}

/** Anneau d'appartenance d'après la force : urgent (centre) → maîtrisé (extérieur). */
export function strengthTier(strength) {
    if (strength > 85) return 'mastered';
    if (strength >= 60) return 'soon';
    return 'urgent';
}

/** Rayon de l'anneau, en pourcentage de la moitié du conteneur. */
const TIER_RADIUS = { urgent: 17, soon: 30, mastered: 42 };

function surahLabel(item) {
    return String(item?.surahName || item?.surah_name || item?.name || 'سورة');
}

function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Classe chaque sourate par anneau, avec sa force calculée.
 * @returns {{urgent: Array, soon: Array, mastered: Array, all: Array}}
 */
export function classifyItems(items = [], today = new Date()) {
    const all = items
        .map(item => {
            const strength = computeMemoryStrength(item, today);
            return { item, strength, tier: strengthTier(strength), label: surahLabel(item) };
        })
        .sort((a, b) => a.strength - b.strength);
    return {
        all,
        urgent: all.filter(x => x.tier === 'urgent'),
        soon: all.filter(x => x.tier === 'soon'),
        mastered: all.filter(x => x.tier === 'mastered'),
    };
}

/**
 * ورد اليوم : les 3 sourates les plus faibles, avec une durée ESTIMÉE (~3 min chacune).
 * Jamais présentée comme une donnée exacte.
 */
export function buildDailyWird(items = [], today = new Date(), size = 3) {
    const { all } = classifyItems(items, today);
    const picked = all.slice(0, size);
    return { items: picked, estimatedMinutes: picked.length * 3 };
}

/** Puces réparties en cercle sur leur anneau — positions écrites en variables CSS. */
function chipsHtml(group, tier) {
    const radius = TIER_RADIUS[tier];
    const n = group.length;
    return group
        .map((entry, i) => {
            // décalage d'un demi-pas par anneau pour éviter les alignements
            const angle =
                (i / Math.max(1, n)) * Math.PI * 2 +
                (tier === 'soon' ? 0.4 : tier === 'mastered' ? 0.8 : 0);
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            return `<button type="button" class="orbit-chip is-${tier}"
                style="--x:${x.toFixed(1)}%;--y:${y.toFixed(1)}%"
                data-surah="${escapeHtml(entry.label)}"
                aria-label="${escapeHtml(entry.label)} — قوة الحفظ ${entry.strength}%">
                ${escapeHtml(entry.label)}<span class="pct">${entry.strength}%</span>
            </button>`;
        })
        .join('');
}

/**
 * HTML de l'orbite. Renvoie '' si trop peu de données (le caller garde son affichage actuel).
 * @param {Array} items - state.memorizationData
 * @param {{coreLabel?: string, today?: Date}} [opts]
 */
export function renderMemoryOrbit(items = [], opts = {}) {
    if (!Array.isArray(items) || items.length < ORBIT_MIN_ITEMS) return '';
    const today = opts.today || new Date();
    const groups = classifyItems(items, today);
    const wird = buildDailyWird(items, today);
    const coreLabel = opts.coreLabel || 'ابدأ ورد<br>اليوم';

    const wirdRows = wird.items
        .map((entry, i) => {
            const tag =
                entry.tier === 'urgent'
                    ? '<span class="tag is-urgent">عاجل</span>'
                    : entry.tier === 'soon'
                      ? '<span class="tag is-soon">تثبيت</span>'
                      : '<span class="tag is-mastered">مراجعة خفيفة</span>';
            return `<div class="wird-row"><span>${i + 1} · ${escapeHtml(entry.label)}</span>${tag}</div>`;
        })
        .join('');

    return `
    <div class="memory-orbit-wrap" dir="rtl">
        <div class="memory-orbit" id="memory-orbit">
            <div class="orbit-ring orbit-ring--outer" aria-hidden="true"></div>
            <div class="orbit-ring orbit-ring--mid" aria-hidden="true"></div>
            <div class="orbit-ring orbit-ring--inner" aria-hidden="true"></div>
            ${chipsHtml(groups.mastered, 'mastered')}
            ${chipsHtml(groups.soon, 'soon')}
            ${chipsHtml(groups.urgent, 'urgent')}
            <button type="button" class="orbit-core" id="orbit-core">${coreLabel}</button>
        </div>
        <div class="orbit-legend">
            <span><i class="is-urgent"></i>اليوم (${groups.urgent.length})</span>
            <span><i class="is-soon"></i>قريباً (${groups.soon.length})</span>
            <span><i class="is-mastered"></i>متقن (${groups.mastered.length})</span>
        </div>
        <div class="wird-card">
            <div class="wird-head">
                <strong>ورد اليوم — مُعدّ تلقائياً</strong>
                <span class="wird-time">~ ${wird.estimatedMinutes} دقيقة (تقديري)</span>
            </div>
            ${wirdRows}
        </div>
    </div>`;
}

/**
 * Monte l'orbite dans un conteneur et branche les interactions.
 * @param {string} containerId
 * @param {Array} items
 * @param {{onStart?: Function, onSelect?: Function, coreLabel?: string}} [handlers]
 * @returns {boolean} false si l'orbite n'a pas été montée (données insuffisantes)
 */
export function mountMemoryOrbit(containerId, items = [], handlers = {}) {
    const host = document.getElementById(containerId);
    if (!host) return false;
    const html = renderMemoryOrbit(items, { coreLabel: handlers.coreLabel });
    if (!html) return false;
    host.innerHTML = html;

    const core = host.querySelector('#orbit-core');
    if (core && typeof handlers.onStart === 'function') {
        core.addEventListener('click', () => handlers.onStart(buildDailyWird(items)));
    }
    if (typeof handlers.onSelect === 'function') {
        host.querySelectorAll('.orbit-chip').forEach(chip => {
            chip.addEventListener('click', () => handlers.onSelect(chip.dataset.surah));
        });
    }
    return true;
}
