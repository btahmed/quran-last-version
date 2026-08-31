// frontend/src/core/router.js
import { Logger } from './logger.js';
import { state } from './state.js';
import { AudioManager } from '../components/AudioPlayer.js';

import * as HomePage from '../pages/HomePage.js';
import * as MemorizationPage from '../pages/MemorizationPage.js';
import * as WardPage from '../pages/WardPage.js';
import * as ProgressPage from '../pages/ProgressPage.js';
import * as SettingsPage from '../pages/SettingsPage.js';
import * as CompetitionPage from '../pages/CompetitionPage.js';
import * as HifzPage from '../pages/HifzPage.js';
import * as MyTasksPage from '../pages/MyTasksPage.js';
import * as TeacherPage from '../pages/TeacherPage.js';
import * as AdminPage from '../pages/AdminPage.js';
import * as RevisionPage from '../pages/RevisionPage.js';
import * as SoumissionPage from '../pages/SoumissionPage.js';
import * as ProfilPage from '../pages/ProfilPage.js';
import * as NotificationsPage from '../pages/NotificationsPage.js';
import { setActiveTab } from './NavManager.js';
import { disableHifzFocus } from '../components/HifzFocus.js';

const pages = {
    home: HomePage,
    competition: CompetitionPage,
    teacher: TeacherPage,
    admin: AdminPage,

    // ── Nouvelles routes pédagogiques ──
    hifz: HifzPage, // mémorisation
    revision: RevisionPage, // ex-WardPage (muraja'a)
    soumettre: SoumissionPage, // ex-MyTasksPage
    profil: ProfilPage, // fusion Settings + Progress

    // ── Routes enseignant (sub-views) ──
    devoirs: TeacherPage,
    soumissions: TeacherPage,
    eleves: TeacherPage,

    // ── Routes admin (sub-views) ──
    'admin-users': AdminPage,
    'admin-classes': AdminPage,
    'admin-stats': AdminPage,

    // ── Notifications ──
    notifications: NotificationsPage,

    // ── Aliases rétrocompatibilité ──
    memorization: MemorizationPage,
    ward: WardPage,
    mytasks: MyTasksPage,
    settings: SettingsPage,
    progress: ProgressPage,
};

export function navigateTo(pageName, { replace = false } = {}) {
    Logger.nav(state.currentPage, pageName);
    AudioManager.stopAll();
    if (pageName !== 'hifz') disableHifzFocus();
    if (state.currentPage && state.currentPage !== pageName) {
        state.previousPage = state.currentPage;
    }

    document.querySelectorAll('.nav-link, .nav-link-pro').forEach(link => {
        link.classList.remove('active');
    });
    const activeLink = document.querySelector(`[data-page="${pageName}"]`);
    if (activeLink) activeLink.classList.add('active');

    state.currentPage = pageName;
    setActiveTab(pageName);

    // Bouton retour Android : maintenir l'historique de navigation
    if (replace) {
        history.replaceState({ page: pageName }, '', '#' + pageName);
    } else {
        history.pushState({ page: pageName }, '', '#' + pageName);
    }

    renderPage(pageName);
}

// Listener bouton retour Android (popstate)
window.addEventListener('popstate', e => {
    const page = e.state?.page || 'home';
    // Rendre la page sans repousser dans l'historique
    Logger.nav(state.currentPage, page + ' (back)');
    AudioManager.stopAll();
    if (page !== 'hifz') disableHifzFocus();
    state.previousPage = state.currentPage;
    state.currentPage = page;
    setActiveTab(page);
    document
        .querySelectorAll('.nav-link, .nav-link-pro')
        .forEach(link => link.classList.remove('active'));
    const activeLink = document.querySelector(`[data-page="${page}"]`);
    if (activeLink) activeLink.classList.add('active');
    renderPage(page);
});

let _renderGen = 0;

/** Utilitaire pour les pages async : retourne vrai si une navigation
 *  a eu lieu PENDANT l'init, ce qui signifie que cette init est périmée. */
export function isStaleRender(gen) {
    return _renderGen !== gen;
}
export function getRenderGen() {
    return _renderGen;
}

export function renderPage(pageName) {
    const page = pages[pageName];
    if (!page) {
        Logger.error('ROUTER', `Page inconnue : ${pageName}`);
        return;
    }
    const app = document.getElementById('app');
    if (!app) return;

    const myGen = ++_renderGen;
    app.innerHTML = page.render();
    Promise.resolve(page.init())
        .then(() => {
            if (_renderGen !== myGen) {
                Logger.warn(
                    'ROUTER',
                    `[stale] init() terminé pour ${pageName} après navigation — DOM et état possiblement périmés`
                );
            }
        })
        .catch(err => Logger.error('ROUTER', `init error on ${pageName}`, err));
}

export function setupNavigation() {
    document.querySelectorAll('.nav-link, .nav-link-pro').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const pageName = link.getAttribute('data-page');
            if (pageName) navigateTo(pageName);
        });
    });
}
