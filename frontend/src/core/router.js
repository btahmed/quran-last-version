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
import * as RevisionPage   from '../pages/RevisionPage.js';
import * as SoumissionPage from '../pages/SoumissionPage.js';
import * as ProfilPage     from '../pages/ProfilPage.js';
import { setActiveTab }    from './NavManager.js';

const pages = {
    home: HomePage,
    competition: CompetitionPage,
    teacher: TeacherPage,
    admin: AdminPage,

    // ── Nouvelles routes pédagogiques ──
    hifz:      HifzPage,        // mémorisation
    revision:  RevisionPage,    // ex-WardPage (muraja'a)
    soumettre: SoumissionPage,  // ex-MyTasksPage
    profil:    ProfilPage,      // fusion Settings + Progress

    // ── Routes enseignant (sub-views) ──
    devoirs:     TeacherPage,
    soumissions: TeacherPage,
    eleves:      TeacherPage,

    // ── Routes admin (sub-views) ──
    'admin-users':   AdminPage,
    'admin-classes': AdminPage,
    'admin-stats':   AdminPage,

    // ── Aliases rétrocompatibilité ──
    memorization: MemorizationPage,
    ward:         WardPage,
    mytasks:      MyTasksPage,
    settings:     SettingsPage,
    progress:     ProgressPage,
};

export function navigateTo(pageName) {
    Logger.nav(state.currentPage, pageName);
    AudioManager.stopAll();

    document.querySelectorAll('.nav-link, .nav-link-pro').forEach(link => {
        link.classList.remove('active');
    });
    const activeLink = document.querySelector(`[data-page="${pageName}"]`);
    if (activeLink) activeLink.classList.add('active');

    state.currentPage = pageName;
    setActiveTab(pageName);   // synchronise l'onglet nav actif
    renderPage(pageName);
}

export function renderPage(pageName) {
    const page = pages[pageName];
    if (!page) {
        Logger.error('ROUTER', `Page inconnue : ${pageName}`);
        return;
    }
    const app = document.getElementById('app');
    if (!app) return;
    app.innerHTML = page.render();
    // init peut être async — on passe pageName pour les pages multi-sections (TeacherPage, AdminPage)
    Promise.resolve(page.init(pageName)).catch(err => Logger.error('ROUTER', `init error on ${pageName}`, err));
}

export function setupNavigation() {
    document.querySelectorAll('.nav-link, .nav-link-pro').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageName = link.getAttribute('data-page');
            if (pageName) navigateTo(pageName);
        });
    });
}
