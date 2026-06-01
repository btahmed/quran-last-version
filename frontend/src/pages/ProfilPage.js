// frontend/src/pages/ProfilPage.js
// ProfilPage = fusion de SettingsPage (paramètres) + ProgressPage (statistiques)
// Présente les deux dans un système d'onglets
import * as SettingsPage from './SettingsPage.js';
import * as ProgressPage from './ProgressPage.js';
import { getCurrentUser } from '../services/supabase-auth.js';

export function render() {
    // Render ProgressPage par défaut (stats en premier — plus utile au quotidien)
    const progressContent = ProgressPage.render ? ProgressPage.render() : '';
    return `
    <div class="profil-page" dir="rtl">
        <div class="profil-tabs">
            <button class="profil-tab profil-tab--active"
                    onclick="QuranReview.switchProfilTab('progress')">
                📊 تقدمي
            </button>
            <button class="profil-tab"
                    onclick="QuranReview.switchProfilTab('settings')">
                ⚙️ الإعدادات
            </button>
        </div>
        <div id="profil-tab-content" class="profil-tab-content">
            ${progressContent}
        </div>

        <!-- Graphe évolution des points -->
        <section class="dashboard-section profil-chart-section">
            <h3 class="section-title">📊 تطور النقاط — 30 يوماً</h3>
            <div class="chart-container">
                <canvas id="points-chart" height="200" aria-label="graphe d'évolution des points" role="img"></canvas>
            </div>
        </section>
    </div>
    `;
}

export async function init() {
    // Recharger les données utilisateur fraîches depuis Supabase
    await refreshUserData();
    // Initialiser ProgressPage par défaut
    if (ProgressPage.init) await ProgressPage.init();
    // Graphe d'évolution des points (Chart.js)
    await loadPointsChart();
}

async function loadPointsChart() {
    const canvas = document.getElementById('points-chart');
    if (!canvas) return;

    // Guard : Chart.js disponible ?
    if (typeof Chart === 'undefined') {
        canvas.parentElement.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:var(--space-4)">الرسم البياني غير متاح</p>';
        return;
    }

    try {
        const { supabaseClient } = await import('../services/supabase-client.js');
        const { state } = await import('../core/state.js');

        const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const { data: logs, error } = await supabaseClient
            .from('points_log')
            .select('delta, created_at')
            .eq('student_id', state.user.id)
            .gte('created_at', since)
            .order('created_at', { ascending: true });

        if (error || !logs?.length) {
            canvas.parentElement.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:var(--space-4)">لا توجد نقاط بعد في آخر 30 يوماً</p>';
            return;
        }

        // Agréger par jour (YYYY-MM-DD)
        const byDay = {};
        logs.forEach(log => {
            const day = log.created_at.split('T')[0];
            byDay[day] = (byDay[day] || 0) + log.delta;
        });

        const labels = Object.keys(byDay).map(d => {
            const [, m, dd] = d.split('-');
            return `${dd}/${m}`;
        });
        const dailyPoints = Object.values(byDay);
        // Cumul progressif
        const cumulPoints = dailyPoints.reduce((acc, v) => {
            acc.push((acc.at(-1) ?? 0) + v);
            return acc;
        }, []);

        // Couleurs selon thème
        const isDark = document.documentElement.dataset.theme === 'dark';
        const lineColor = '#2d5016';
        const fillColor = 'rgba(45,80,22,0.12)';
        const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
        const tickColor = isDark ? '#adb5bd' : '#6c757d';

        new Chart(canvas, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'النقاط التراكمية',
                    data: cumulPoints,
                    borderColor: lineColor,
                    backgroundColor: fillColor,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointHoverRadius: 6,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        rtl: true,
                        titleFont: { family: 'Inter' },
                        callbacks: {
                            label: ctx => `${ctx.parsed.y} نقطة`,
                        },
                    },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: gridColor },
                        ticks: { color: tickColor, precision: 0 },
                    },
                    x: {
                        grid: { color: gridColor },
                        ticks: { color: tickColor, maxTicksLimit: 8 },
                    },
                },
            },
        });
    } catch (err) {
        console.error('[ProfilPage] Erreur chargement graphe:', err);
    }
}

async function refreshUserData() {
    try {
        const { data: freshUser, error } = await getCurrentUser();
        if (error) {
            console.warn('[ProfilPage] Erreur rechargement utilisateur:', error);
            return;
        }
        if (freshUser && window.QuranReview?.state) {
            window.QuranReview.state.user = freshUser;
        }
    } catch (err) {
        console.warn('[ProfilPage] Erreur refreshUserData:', err);
    }
}

export async function switchProfilTab(tab) {
    // Mettre à jour les onglets actifs
    document.querySelectorAll('.profil-tab').forEach(t =>
        t.classList.remove('profil-tab--active')
    );
    const activeTab = document.querySelector(
        `.profil-tab[onclick*="'${tab}'"]`
    );
    if (activeTab) activeTab.classList.add('profil-tab--active');

    // Charger le contenu du bon onglet
    const content = document.getElementById('profil-tab-content');
    if (!content) return;

    if (tab === 'progress') {
        content.innerHTML = ProgressPage.render ? ProgressPage.render() : '';
        if (ProgressPage.init) await ProgressPage.init();
    } else if (tab === 'settings') {
        // SettingsPage expose render() et renderSettingsPage() — on préfère renderSettingsPage()
        // pour éviter toute ambiguïté avec le render() de ProfilPage
        const settingsHtml = SettingsPage.renderSettingsPage?.()
            ?? SettingsPage.render?.()
            ?? '<p>Paramètres non disponibles</p>';
        content.innerHTML = settingsHtml;
        if (SettingsPage.init) await SettingsPage.init();
    }
}

// Re-exporter les fonctions utilitaires de SettingsPage pour la façade window.QuranReview.
// On N'exporte PAS render() ni init() de SettingsPage pour éviter le conflit de noms
// avec les fonctions render() et init() de ProfilPage définies ci-dessus.
export {
    renderSettingsPage,
    renderSettingsForm,
    saveSettings,
    initTheme,
    toggleTheme,
    setTheme,
    exportData,
    importData,
    resetData,
} from './SettingsPage.js';
