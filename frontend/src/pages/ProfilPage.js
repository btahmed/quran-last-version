// frontend/src/pages/ProfilPage.js
// ProfilPage = fusion de SettingsPage (paramètres) + ProgressPage (statistiques)
// Présente les deux dans un système d'onglets
import * as SettingsPage from './SettingsPage.js';
import * as ProgressPage from './ProgressPage.js';

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
    </div>
    `;
}

export function init() {
    // Initialiser ProgressPage par défaut
    if (ProgressPage.init) ProgressPage.init();
}

export function switchProfilTab(tab) {
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
        if (ProgressPage.init) ProgressPage.init();
    } else if (tab === 'settings') {
        // SettingsPage expose render() et renderSettingsPage() — on préfère renderSettingsPage()
        // pour éviter toute ambiguïté avec le render() de ProfilPage
        const settingsHtml = SettingsPage.renderSettingsPage?.()
            ?? SettingsPage.render?.()
            ?? '<p>Paramètres non disponibles</p>';
        content.innerHTML = settingsHtml;
        if (SettingsPage.init) SettingsPage.init();
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
