// SettingsPage — extrait de frontend/script.js + frontend/index.html (lignes 760-826)
import { state, saveData } from '../core/state.js';
import { config } from '../core/config.js';
import { showNotification } from '../core/ui.js';
import { Logger } from '../core/logger.js';

// Injection CSS dynamique
if (!document.querySelector('link[href*="SettingsPage.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/src/pages/SettingsPage.css';
    document.head.appendChild(link);
}

export function render() {
    // HTML exact de div#settings-page (index.html lignes 760-826)
    return `<div id="settings-page" class="page active">
            <section class="section-pro">
                <div class="container-pro" style="max-width: 600px;">
                    <h2 class="section-title" style="text-align: center; margin-bottom: var(--space-8);">⚙️ الإعدادات</h2>

                    <div class="card-glass-pro" style="margin-bottom: var(--space-6);">
                        <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: var(--space-4);">👤 الملف الشخصي</h3>
                        <form id="settings-form" onsubmit="QuranReview.saveSettings(event)">
                            <div class="form-floating" style="margin-bottom: var(--space-4);">
                                <input type="text" id="user-name" placeholder=" " value="">
                                <label for="user-name">اسمك</label>
                            </div>

                            <div class="form-floating" style="margin-bottom: var(--space-4);">
                                <input type="number" id="daily-goal" min="1" max="50" value="5" placeholder=" ">
                                <label for="daily-goal">الهدف اليومي (آيات)</label>
                            </div>

                            <div style="margin-bottom: var(--space-4);">
                                <label class="toggle-switch">
                                    <input type="checkbox" id="notifications" checked>
                                    <span class="toggle-slider"></span>
                                    <span style="margin-right: var(--space-3);">الإشعارات</span>
                                </label>
                            </div>

                            <button type="submit" class="btn btn-glow btn-full">حفظ التغييرات</button>
                        </form>
                    </div>

                    <div class="card-glass-pro" style="margin-bottom: var(--space-6);">
                        <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: var(--space-4);">🎨 المظهر</h3>

                        <div style="margin-bottom: var(--space-4);">
                            <label style="display: block; margin-bottom: var(--space-3); font-weight: 500;">الوضع</label>
                            <div class="flex-pro" style="gap: var(--space-3);">
                                <button type="button" class="btn btn-outline-glow" id="theme-light-btn" onclick="QuranReview.setTheme('light')">☀️ فاتح</button>
                                <button type="button" class="btn btn-outline-glow" id="theme-dark-btn" onclick="QuranReview.setTheme('dark')">🌙 داكن</button>
                            </div>
                        </div>

                        <div>
                            <label class="toggle-switch">
                                <input type="checkbox" id="settings-notifications" checked>
                                <span class="toggle-slider"></span>
                                <span style="margin-right: var(--space-3);">الإشعارات</span>
                            </label>
                        </div>
                    </div>

                    <div class="card-glass-pro">
                        <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: var(--space-4);">💾 إدارة البيانات</h3>
                        <div style="display: flex; flex-direction: column; gap: var(--space-3);">
                            <button class="btn btn-outline-glow" onclick="QuranReview.exportData()">
                                <span>📤</span> تصدير البيانات
                            </button>
                            <button class="btn btn-outline-glow" onclick="QuranReview.importData()">
                                <span>📥</span> استيراد البيانات
                            </button>
                            <button class="btn btn-outline-glow" onclick="QuranReview.resetData()" style="color: var(--color-danger);">
                                <span>🗑️</span> إعادة تعيين
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </div>`;
}

export function init() {
    renderSettingsForm();
}

// ===================================
// SETTINGS FORM
// ===================================

export function renderSettingsPage() {
    renderSettingsForm();
}

export function renderSettingsForm() {
    const form = document.getElementById('settings-form');
    if (!form) return;

    // Remplir le formulaire avec les paramètres actuels
    document.getElementById('user-name').value = state.settings.userName || '';
    document.getElementById('daily-goal').value = state.settings.dailyGoal || 5;
    document.getElementById('notifications').checked = state.settings.notifications || false;

    const debugToggle = document.getElementById('debug-mode');
    if (debugToggle) {
        debugToggle.checked = state.settings.debugMode || false;
    }
}

export function saveSettings(event) {
    if (event) event.preventDefault();

    state.settings = {
        userName: document.getElementById('user-name').value,
        dailyGoal: parseInt(document.getElementById('daily-goal').value),
        theme: state.settings.theme,
        notifications: document.getElementById('notifications').checked,
        debugMode: document.getElementById('debug-mode')?.checked || false
    };

    // Appliquer le mode debug
    Logger.debugMode = state.settings.debugMode;

    saveData();
    showNotification('تم حفظ الإعدادات', 'success');
}

// ===================================
// THEME FUNCTIONS
// ===================================

export function initTheme() {
    const theme = state.settings.theme || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeToggle(theme);
}

export function toggleTheme() {
    const currentTheme = state.settings.theme;
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    state.settings.theme = newTheme;
    document.documentElement.setAttribute('data-theme', newTheme);
    updateThemeToggle(newTheme);
    saveData();

    Logger.log('APP', `Theme changed to: ${newTheme}`);
}

export function setTheme(theme) {
    state.settings.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeToggle(theme);
    saveData();

    Logger.log('APP', `Theme set to: ${theme}`);
}

function updateThemeToggle(theme) {
    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
        toggle.textContent = theme === 'light' ? '🌙' : '☀️';
    }
}

// ===================================
// DATA MANAGEMENT FUNCTIONS
// ===================================

export function exportData() {
    try {
        const data = {
            version: config.version,
            exportDate: new Date().toISOString(),
            settings: state.settings,
            memorizationData: state.memorizationData
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quranreview-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showNotification('تم تصدير البيانات بنجاح', 'success');
    } catch (error) {
        console.error('❌ Error exporting data:', error);
        showNotification('خطأ في تصدير البيانات', 'error');
    }
}

export function importData() {
    try {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);

                    // Valider la structure des données
                    if (!data.memorizationData || !Array.isArray(data.memorizationData)) {
                        throw new Error('Invalid data structure');
                    }

                    // Importer les nouvelles données
                    state.memorizationData = data.memorizationData || [];
                    state.settings = { ...config.defaultSettings, ...data.settings };

                    // Sauvegarder les données importées
                    saveData();

                    // Rafraîchir l'UI via le router global
                    window.QuranReview.renderPage(state.currentPage);

                    showNotification('تم استيراد البيانات بنجاح', 'success');
                } catch (error) {
                    console.error('❌ Error parsing imported data:', error);
                    showNotification('ملف غير صالح. يرجى التحقق من البيانات', 'error');
                }
            };

            reader.readAsText(file);
        };

        input.click();
    } catch (error) {
        console.error('❌ Error importing data:', error);
        showNotification('خطأ في استيراد البيانات', 'error');
    }
}

export function resetData() {
    if (!confirm('هل أنت متأكد من مسح جميع البيانات؟ هذا الإجراء لا يمكن التراجع عنه.')) return;

    try {
        // Effacer le localStorage
        localStorage.removeItem(config.storageKey);
        localStorage.removeItem(config.themeKey);

        // Réinitialiser aux valeurs par défaut via le router global
        window.QuranReview.clearData();

        showNotification('تم مسح جميع البيانات', 'info');
    } catch (error) {
        console.error('❌ Error resetting data:', error);
        showNotification('خطأ في مسح البيانات', 'error');
    }
}
