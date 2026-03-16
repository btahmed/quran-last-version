// frontend/src/main.js
import { Logger } from './core/logger.js';
import { config, IS_DEMO_MODE } from './core/config.js';
import { state, loadData, saveData } from './core/state.js';
import { showNotification, setupAutoSave } from './core/ui.js';
import { AudioManager, initAudioPlayer, initWardPlayer } from './components/AudioPlayer.js';
import {
    initAuth, updateAuthUI, showAuthModal, hideAuthModal,
    showRegisterForm, showLoginForm, handleLogin, handleRegister,
    performLogin, fetchMe, refreshToken, logout
} from './services/auth.js';
import { loadTasksFromApi } from './services/tasks.js';
import { hifzEngine } from './services/hifz.js';
import { navigateTo, renderPage, setupNavigation } from './core/router.js';
import { render as renderModals, init as initModals } from './components/AuthModal.js';
import { toggleRecording, stopRecording, submitRecording, openRecordModal } from './components/AudioRecordModal.js';
import { openUserEditModal, closeUserEditModal } from './components/UserEditModal.js';

import * as MemorizationPage from './pages/MemorizationPage.js';
import * as WardPage from './pages/WardPage.js';
import * as SettingsPage from './pages/SettingsPage.js';
import * as CompetitionPage from './pages/CompetitionPage.js';
import * as HifzPage from './pages/HifzPage.js';
import * as MyTasksPage from './pages/MyTasksPage.js';
import * as TeacherPage from './pages/TeacherPage.js';
import * as RevisionPage   from './pages/RevisionPage.js';
import * as SoumissionPage from './pages/SoumissionPage.js';
import * as ProfilPage     from './pages/ProfilPage.js';
import { buildNav, setActiveTab } from './core/NavManager.js';

function init() {
    Logger.log('APP', 'Initializing QuranReview App...');

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
    initAuth();
    const initRole = state.user
        ? (state.user.role === 'admin' || state.user.is_superuser ? 'admin' : state.user.role)
        : 'visitor';
    buildNav(initRole);

    // Auto-save
    setupAutoSave();

    // Render page initiale
    renderPage('home');

    // Global click tracker
    document.addEventListener('click', (e) => Logger.click(e.target), true);

    // Global error handlers
    window.addEventListener('error', (e) => {
        Logger.error('GLOBAL', `Application Error: ${e.message}`, e.error);
    });
    window.addEventListener('unhandledrejection', (e) => {
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
    toggleTheme: SettingsPage.toggleTheme,
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
    openAudioModal: openRecordModal,
    openRecordModal: openRecordModal,

    // MemorizationPage — fonctions manquantes de la façade
    playSurahAudio: MemorizationPage.playSurahAudio,
    openTarteel: MemorizationPage.openTarteel,

    // HifzPage / Competition — moteur de mémorisation
    hifzEngine,

    // AudioPlayer — alias pour les callbacks du player
    playPreviousAyah: WardPage.previousWardAyah,
    playNextAyahManually: WardPage.nextWardAyah,
    updateReciter: WardPage.updateWardDisplay,
    playFullSurah: WardPage.playWard,

    // SettingsPage — clearData (reset complet de l'état)
    clearData: () => { state.data = loadData(); window.QuranReview.navigateTo('home'); },

    // TeacherPage
    handleCreateTask: TeacherPage.handleCreateTask,
    handleDeleteAllTasks: TeacherPage.handleDeleteAllTasks,
    handleDeleteBatch: TeacherPage.handleDeleteBatch,
    toggleAssignMode: TeacherPage.toggleAssignMode,
    viewStudentProgress: TeacherPage.viewStudentProgress,
    approveSubmission: TeacherPage.approveSubmission,
    rejectSubmission: TeacherPage.rejectSubmission,
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
    deleteUser: TeacherPage.deleteUser,
    handleCreateTeacher: TeacherPage.handleCreateTeacher,
    handlePromoteTeacher: TeacherPage.handlePromoteTeacher,
    openUserEditModal,
    closeUserEditModal,

    // AudioRecordModal
    toggleRecording,
    stopRecording,
    submitRecording,

    // ProfilPage
    renderProfilPage: ProfilPage.render,
    initProfilPage:   ProfilPage.init,
    switchProfilTab:  ProfilPage.switchProfilTab,

    // RevisionPage (alias pedagogique de WardPage — toutes les fonctions exposees explicitement)
    renderRevisionPage:         RevisionPage.render,
    initRevisionPage:           RevisionPage.init,
    setupWardControls:          RevisionPage.setupWardControls,
    populateWardSurahSelect:    RevisionPage.populateWardSurahSelect,
    toggleWardPlay:             RevisionPage.toggleWardPlay,
    previousWardAyah:           RevisionPage.previousWardAyah,
    nextWardAyah:               RevisionPage.nextWardAyah,
    stopWardPlayback:           RevisionPage.stopWardPlayback,
    updateWardAyahDisplay:      RevisionPage.updateWardAyahDisplay,

    // SoumissionPage (alias de MyTasksPage — points d'entrée explicites)
    renderSoumissionPage:  SoumissionPage.render,
    initSoumissionPage:    SoumissionPage.init,

    // NavManager — accès façade pour tests et intégrations externes
    buildNav,
    setActiveTab,
};

// Globals directs pour onclick HTML qui n'utilisent pas QuranReview.xxx
window.showAuthModal = showAuthModal;
window.navigateTo = navigateTo;
window.AudioManager = AudioManager;

// Boot
document.addEventListener('DOMContentLoaded', init);
