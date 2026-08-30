// frontend/src/pages/ProgressPage.js
// Page de progression du hafiz — extrait de frontend/script.js (renderProgressPage ~ligne 3021)
import { state } from '../core/state.js';
import { Logger } from '../core/logger.js';
import { getMyPoints } from '../services/supabase-leaderboard.js';
import { mountBlock, renderMushafMap } from '../components/PageBlocks.js';
import { JUZ_DATA } from './RevisionPage.js';

// Injection CSS
if (!document.querySelector('link[href*="ProgressPage.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = new URL('./ProgressPage.css', import.meta.url).href;
    document.head.appendChild(link);
}

// ===================================
// RENDER — structure HTML de la page
// ===================================

export function render() {
    return `
        <div id="progress-page" class="page active">
            <section class="k-section">
                <h2 class="k-section-title" style="text-align:center;margin-bottom:var(--space-6);">📈 تقدمك في الحفظ</h2>

                <!-- خريطة المصحف — visible seulement si un plan المراجعة est configuré -->
                <div id="mushaf-host" style="margin-bottom:var(--space-6);"></div>

                <!-- Stat cards principales -->
                <div class="k-grid2" style="margin-bottom:var(--space-6);">
                    <div class="k-stat-card">
                        <div class="k-stat-icon">📖</div>
                        <div class="k-stat-value" id="progress-total-surahs">0</div>
                        <div class="k-stat-label">سورة محفوظة</div>
                    </div>
                    <div class="k-stat-card">
                        <div class="k-stat-icon">📝</div>
                        <div class="k-stat-value" id="progress-total-ayahs">0</div>
                        <div class="k-stat-label">آية محفوظة</div>
                    </div>
                    <div class="k-stat-card">
                        <div class="k-stat-icon">✨</div>
                        <div class="k-stat-value" id="progress-completion">0%</div>
                        <div class="k-stat-label">نسبة الإنجاز</div>
                    </div>
                    <div class="k-stat-card">
                        <div class="k-stat-icon">🔥</div>
                        <div class="k-stat-value" id="progress-streak">0</div>
                        <div class="k-stat-label">يوم متتالي</div>
                    </div>
                    <div class="k-stat-card" style="background:linear-gradient(135deg,var(--color-primary) 0%,var(--color-secondary) 100%);">
                        <div class="k-stat-icon" style="color:rgba(255,255,255,0.8);">🏆</div>
                        <div class="k-stat-value gradient-value" id="progress-total-points" style="color:#fff;">—</div>
                        <div class="k-stat-label" style="color:rgba(255,255,255,0.9);">نقطة مكتسبة</div>
                    </div>
                </div>

                <!-- Répartition des statuts + activité hebdomadaire -->
                <div class="k-grid2" style="margin-bottom:var(--space-6);">
                    <div class="card-glass-pro">
                        <h3 style="font-size:1rem;font-weight:600;margin-bottom:var(--space-4);">📊 توزيع الحالات</h3>
                        <div style="display:flex;flex-direction:column;gap:var(--space-3);">
                            <div style="display:flex;justify-content:space-between;align-items:center;">
                                <span style="display:flex;gap:var(--space-2);align-items:center;"><span class="k-dot k-dot--done"></span><span>متقن</span></span>
                                <span id="status-strong-count" style="font-weight:600;">0</span>
                            </div>
                            <div style="display:flex;justify-content:space-between;align-items:center;">
                                <span style="display:flex;gap:var(--space-2);align-items:center;"><span class="k-dot k-dot--missed"></span><span>ضعيف</span></span>
                                <span id="status-weak-count" style="font-weight:600;">0</span>
                            </div>
                            <div style="display:flex;justify-content:space-between;align-items:center;">
                                <span style="display:flex;gap:var(--space-2);align-items:center;"><span class="k-dot k-dot--new"></span><span>جديد</span></span>
                                <span id="status-new-count" style="font-weight:600;">0</span>
                            </div>
                        </div>
                    </div>

                    <div class="card-glass-pro">
                        <h3 style="font-size:1rem;font-weight:600;margin-bottom:var(--space-4);">📅 نشاط الأسبوع</h3>
                        <div class="progress-week-grid" style="text-align:center;gap:var(--space-2);">
                            <div class="card-glass-pro" style="padding:var(--space-2);"><div style="font-size:0.7rem;color:var(--color-text-secondary);">سبت</div><div style="font-weight:600;" id="activity-sat">0</div></div>
                            <div class="card-glass-pro" style="padding:var(--space-2);"><div style="font-size:0.7rem;color:var(--color-text-secondary);">أحد</div><div style="font-weight:600;" id="activity-sun">0</div></div>
                            <div class="card-glass-pro" style="padding:var(--space-2);"><div style="font-size:0.7rem;color:var(--color-text-secondary);">اثن</div><div style="font-weight:600;" id="activity-mon">0</div></div>
                            <div class="card-glass-pro" style="padding:var(--space-2);"><div style="font-size:0.7rem;color:var(--color-text-secondary);">ثلا</div><div style="font-weight:600;" id="activity-tue">0</div></div>
                            <div class="card-glass-pro" style="padding:var(--space-2);"><div style="font-size:0.7rem;color:var(--color-text-secondary);">أرب</div><div style="font-weight:600;" id="activity-wed">0</div></div>
                            <div class="card-glass-pro" style="padding:var(--space-2);"><div style="font-size:0.7rem;color:var(--color-text-secondary);">خمي</div><div style="font-weight:600;" id="activity-thu">0</div></div>
                            <div class="card-glass-pro" style="padding:var(--space-2);"><div style="font-size:0.7rem;color:var(--color-text-secondary);">جمعة</div><div style="font-weight:600;" id="activity-fri">0</div></div>
                        </div>
                        </div>
                    </div>

                <!-- Graphique d'évolution -->
                <div class="card-glass-pro">
                    <h3 style="font-size:1rem;font-weight:600;margin-bottom:var(--space-4);">📈 تطور الحفظ</h3>
                    <div style="height:300px;background:rgba(45,80,22,0.05);border-radius:var(--radius-xl);display:flex;align-items:center;justify-content:center;color:var(--color-text-secondary);">
                        <div style="text-align:center;"><div style="font-size:3rem;margin-bottom:var(--space-4);">📊</div><p class="k-empty">الرسم البياني قريباً</p></div>
                    </div>
                </div>
            </section>
        </div>
    `;
}

// ===================================
// INIT — appelé après injection du HTML dans le DOM
// ===================================

export async function init() {
    renderProgressStats();
    renderProgressChart();
    await loadPointsFromSupabase();
    renderMushaf();
}

/** Carte du Mushaf (30 juz') — données réelles du plan المراجعة (même source
 *  que RevisionPage.js), jamais state.memorizationData qui n'est pas peuplée
 *  par le vrai parcours de l'app. */
function renderMushaf() {
    if (!state.user?.id) return;
    try {
        const raw = localStorage.getItem(`murajaa_student_${state.user.id}`);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (!parsed || !parsed.configured) return;

        const ranges = Array.isArray(parsed.bunkerRanges) ? parsed.bunkerRanges : [];
        const cycleSet = new Set(Array.isArray(parsed.cycleReviewed) ? parsed.cycleReviewed : []);
        if (!ranges.length) return;

        // Une case par juz' réel (JUZ_DATA, plages de pages vérifiées) — pas par
        // numéro de sourate (imprécis pour les sourates à cheval sur 2 juz').
        const states = JUZ_DATA.map(j => {
            let coveredPages = 0;
            let reviewedPages = 0;
            for (let p = j.from; p <= j.to; p++) {
                const inPlan = ranges.some(r => p >= Number(r.from) && p <= Number(r.to));
                if (!inPlan) continue;
                coveredPages++;
                if (cycleSet.has(p)) reviewedPages++;
            }
            if (!coveredPages) return 'empty';
            return reviewedPages === coveredPages ? 'mastered' : 'learning';
        });

        // o.surahs/o.ayahs attendent des unités précises (le composant ajoute
        // lui-même "سورة"/"آية") — nos données réelles sont en pages, on ne les
        // fournit donc pas plutôt que d'afficher une mauvaise unité.
        mountBlock(
            'mushaf-host',
            renderMushafMap([], {
                states,
                percent: Math.round((states.filter(s => s === 'mastered').length / 30) * 100),
            })
        );
    } catch (err) {
        Logger.error('PROGRESS', 'Erreur renderMushaf', err);
    }
}

async function loadPointsFromSupabase() {
    try {
        const { data, error } = await getMyPoints();
        if (error) {
            console.warn('[ProgressPage] Erreur chargement points:', error);
            return;
        }
        const pointsEl = document.getElementById('progress-total-points');
        if (pointsEl) {
            pointsEl.textContent = data?.total ?? 0;
        }
    } catch (err) {
        console.warn('[ProgressPage] Erreur loadPointsFromSupabase:', err);
    }
}

// ===================================
// FONCTIONS INTERNES
// ===================================

/**
 * Calcule les statistiques globales depuis state.memorizationData.
 * Correspond à calculateStats() dans script.js (~ligne 3165).
 */
function calculateStats() {
    const data = state.memorizationData;
    const total = data.length;
    const mastered = data.filter(item => item.status === 'mastered').length;
    const weak = data.filter(item => item.status === 'weak').length;
    const newItems = data.filter(item => item.status === 'new').length;
    const totalReviews = data.reduce((sum, item) => sum + (item.reviewCount || 0), 0);
    const averageReviews = total > 0 ? totalReviews / total : 0;

    return { total, mastered, weak, new: newItems, averageReviews };
}

/**
 * Retourne les révisions des 7 derniers jours.
 * Correspond à getLast7DaysProgress() dans script.js (~ligne 3058).
 */
function getLast7DaysProgress() {
    const days = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];

        const count = state.memorizationData.filter(
            item => item.lastReviewed === dateString
        ).length;

        days.push({
            date: dateString,
            count,
            percentage: Math.min((count / 5) * 100, 100),
        });
    }

    return days;
}

/**
 * Met à jour les compteurs de stats et la répartition des statuts.
 * Correspond à renderProgressPage() dans script.js (~ligne 3021).
 */
function renderProgressStats() {
    try {
        const stats = calculateStats();

        // Stat cards principales
        const elements = {
            'progress-total': stats.total,
            'progress-mastered': stats.mastered,
            'progress-weak': stats.weak,
            'progress-new': stats.new,
            'progress-average': stats.averageReviews.toFixed(1),
            // IDs présents dans le HTML de render()
            'progress-total-surahs': stats.total,
            'status-strong-count': stats.mastered,
            'status-weak-count': stats.weak,
            'status-new-count': stats.new,
        };

        Object.entries(elements).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        });
    } catch (error) {
        Logger.error('PROGRESS', 'Erreur renderProgressStats', error);
    }
}

/**
 * Affiche le graphique en barres des 7 derniers jours.
 * Correspond à renderProgressChart() dans script.js (~ligne 3046).
 */
function renderProgressChart() {
    const chartContainer = document.getElementById('progress-chart');
    if (!chartContainer) return;

    const last7Days = getLast7DaysProgress();

    chartContainer.innerHTML = last7Days
        .map(
            day => `
        <div class="chart-bar" style="height: ${day.percentage}%" title="${day.date}: ${day.count} مراجعات">
        </div>
    `
        )
        .join('');
}
