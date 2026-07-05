// frontend/src/main.js
import { Logger } from './core/logger.js';
import { config } from './core/config.js';
import { state, loadData } from './core/state.js';
import { showNotification, setupAutoSave } from './core/ui.js';
import { AudioManager, initAudioPlayer, initWardPlayer } from './components/AudioPlayer.js';
import {
    initAuth,
    updateAuthUI,
    showAuthModal,
    hideAuthModal,
    showRegisterForm,
    showLoginForm,
    handleLogin,
    handleRegister,
    performLogin,
    logout,
} from './services/auth.js';
import { loadTasksFromApi } from './services/tasks.js';
import './services/offline-queue.js';
import { hifzEngine } from './services/hifz.js';
import { competitionManager } from './services/competition.js';
import { navigateTo, renderPage, setupNavigation } from './core/router.js';
import { render as renderModals, init as initModals } from './components/AuthModal.js';
import {
    toggleRecording,
    stopRecording,
    submitRecording,
    openRecordModal,
} from './components/AudioRecordModal.js';
import { openUserEditModal, closeUserEditModal } from './components/UserEditModal.js';

import * as MemorizationPage from './pages/MemorizationPage.js';
import * as WardPage from './pages/WardPage.js';
import * as SettingsPage from './pages/SettingsPage.js';
import * as CompetitionPage from './pages/CompetitionPage.js';
import * as HifzPage from './pages/HifzPage.js';
import * as MyTasksPage from './pages/MyTasksPage.js';
import * as TeacherPage from './pages/TeacherPage.js';
import * as ProfilPage from './pages/ProfilPage.js';
import * as AdminPage from './pages/AdminPage.js';
import { buildNav, setActiveTab } from './core/NavManager.js';
import { apiCache } from './core/apiCache.js';

async function init() {
    Logger.log('APP', 'Initializing QuranReview App...');

    // Note: warm-up Django supprimé — migration Supabase complète

    // Monter les modaux
    document.getElementById('modals').innerHTML = renderModals();
    initModals();

    // Charger les données
    loadData();

    // Setup navigation
    setupNavigation();

    // Init audio
    initAudioPlayer();
    initWardPlayer();

    // Init thème
    SettingsPage.initTheme?.();

    // Init auth
    await initAuth();
    const initRole = state.user
        ? state.user.role === 'admin' || state.user.is_superuser
            ? 'admin'
            : state.user.role
        : 'visitor';
    buildNav(initRole);

    // Auto-save
    setupAutoSave();

    // Render page initiale
    renderPage('home');

    // Fermer student-detail-panel sur clic overlay
    const studentPanel = document.getElementById('student-detail-panel');
    if (studentPanel) {
        studentPanel.addEventListener('click', e => {
            if (e.target === studentPanel) {
                studentPanel.classList.remove('active');
                studentPanel.classList.add('hidden');
            }
        });
    }

    // Global click tracker
    document.addEventListener('click', e => Logger.click(e.target), true);

    // Global error handlers
    window.addEventListener('error', e => {
        Logger.error('GLOBAL', `Application Error: ${e.message}`, e.error);
    });
    window.addEventListener('unhandledrejection', e => {
        const msg = e?.reason?.message || 'Unhandled promise rejection';
        Logger.error('GLOBAL', msg, e.reason);
    });

    // Animation CSS globale
    const style = document.createElement('style');
    style.textContent = `@keyframes slideDown { from { transform: translate(-50%,-100%); opacity:0; } to { transform: translate(-50%,0); opacity:1; } }`;
    document.head.appendChild(style);

    Logger.log('APP', 'QuranReview App initialized successfully');
}

// ============================================================
// FAÇADE window.QuranReview — compatibilité onclick inline
// ============================================================
window.QuranReview = {
    state,
    config,
    navigateTo,
    renderPage,
    showNotification,
    logout: async () => {
        await logout();
        apiCache.clear();
        buildNav('visitor');
    },
    updateAuthUI,
    loadTasksFromApi,

    // Auth
    showAuthModal,
    hideAuthModal,
    showRegisterForm,
    showLoginForm,
    handleLogin,
    handleRegister,
    performLogin,

    // MemorizationPage
    showAddMemorization: MemorizationPage.showAddMemorization,
    hideAddMemorization: MemorizationPage.hideAddMemorization,
    handleAddMemorization: MemorizationPage.handleAddMemorization,

    // WardPage
    toggleWardPlay: WardPage.toggleWardPlay,
    previousWardAyah: WardPage.previousWardAyah,
    nextWardAyah: WardPage.nextWardAyah,
    updateWardDisplay: WardPage.updateWardDisplay,
    updateWardAyahDisplay: WardPage.updateWardAyahDisplay,
    playWard: WardPage.playWard,
    stopWardPlayback: WardPage.stopWardPlayback,

    // SettingsPage
    saveSettings: SettingsPage.saveSettings,
    setTheme: SettingsPage.setTheme,
    exportData: SettingsPage.exportData,
    importData: SettingsPage.importData,
    resetData: SettingsPage.resetData,

    // CompetitionPage
    startChallenge: CompetitionPage.startChallenge,
    renderCompetitionPage: () => navigateTo('competition'),

    // HifzPage
    showHint: HifzPage.showHint,
    checkMemorization: HifzPage.checkMemorization,
    nextLevel: HifzPage.nextLevel,
    stopHifzSession: HifzPage.stopHifzSession,
    renderHifzPage: () => navigateTo('hifz'),

    // MyTasksPage
    switchTaskTab: MyTasksPage.switchTaskTab,
    loadStudentDashboard: MyTasksPage.loadStudentDashboard,
    openRecordModal: openRecordModal,

    // MemorizationPage — fonctions manquantes de la façade
    playSurahAudio: MemorizationPage.playSurahAudio,
    openTarteel: MemorizationPage.openTarteel,
    markAsReviewed: MemorizationPage.markAsReviewed,
    deleteItem: MemorizationPage.deleteItem,

    // HifzPage / Competition — moteur de mémorisation et compétition
    hifzEngine,
    competitionManager,

    // Récupère le texte arabe d'un verset depuis l'API Quran.com (CDN public)
    fetchAyahText: async (surahId, ayahNumber) => {
        try {
            const res = await fetch(`https://api.alquran.cloud/v1/ayah/${surahId}:${ayahNumber}`);
            if (!res.ok) throw new Error('API error');
            const json = await res.json();
            return json?.data?.text || '';
        } catch {
            return '';
        }
    },

    // AudioPlayer — alias pour les callbacks du player
    playPreviousAyah: WardPage.previousWardAyah,
    playNextAyahManually: WardPage.nextWardAyah,
    updateReciter: WardPage.updateWardDisplay,
    playFullSurah: WardPage.playWard,

    // SettingsPage — clearData (reset complet de l'état)
    clearData: () => {
        state.data = loadData();
        window.QuranReview.navigateTo('home');
    },

    // TeacherPage
    handleCreateTask: TeacherPage.handleCreateTask,
    handleDeleteAllTasks: TeacherPage.handleDeleteAllTasks,
    handleDeleteBatch: TeacherPage.handleDeleteBatch,
    toggleAssignMode: TeacherPage.toggleAssignMode,
    viewStudentProgress: TeacherPage.viewStudentProgress,
    closeStudentDetail: () => {
        const p = document.getElementById('student-detail-panel');
        if (p) {
            p.classList.remove('active');
            p.classList.add('hidden');
        }
    },
    // Grade modal (approbation emoji)
    openGradeModal: TeacherPage.openGradeModal,
    closeGradeModal: TeacherPage.closeGradeModal,
    selectGrade: TeacherPage.selectGrade,
    confirmGrade: TeacherPage.confirmGrade,
    // Reject modal
    openRejectModal: TeacherPage.openRejectModal,
    closeRejectModal: TeacherPage.closeRejectModal,
    confirmReject: TeacherPage.confirmReject,
    handleUpdateUser: TeacherPage.handleUpdateUser,
    openUserEditModal,
    closeUserEditModal,

    // AudioRecordModal
    toggleRecording,
    stopRecording,
    submitRecording,

    // ProfilPage
    switchProfilTab: ProfilPage.switchProfilTab,

    // NavManager — accès façade pour tests et intégrations externes
    buildNav,
    setActiveTab,

    // AdminPage — changement de section lazy (utilisé par les onglets admin)
    adminSwitchSection: (...args) => AdminPage.adminSwitchSection(...args),

    // TeacherPage — changement de section lazy (utilisé par les onglets enseignant)
    teacherSwitchSection: (...args) => TeacherPage.teacherSwitchSection(...args),
};

// Globals directs pour onclick HTML qui n'utilisent pas QuranReview.xxx
window.showAuthModal = showAuthModal;
window.navigateTo = navigateTo;
window.AudioManager = AudioManager;

// Boot
document.addEventListener('DOMContentLoaded', init);
