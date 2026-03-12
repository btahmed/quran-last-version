# Frontend Refactoring — ES Modules Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Décomposer `frontend/script.js` (5102 lignes) en modules ES organisés par couche (core, services, pages, components).

**Architecture:** Vanilla JS + ES Modules natifs, CSS co-localisé par injection dynamique de `<link>`. Le router efface `<div id="app">` et y injecte le HTML de la page courante via des template literals. `window.QuranReview` reste une façade globale pour les `onclick` inline existants.

**Tech Stack:** Vanilla JS, ES Modules natifs (pas de bundler), CSS, nginx (inchangé), Docker (inchangé)

---

## Référence rapide : fichiers sources

| Source | Lignes clés |
|--------|-------------|
| `frontend/script.js` | Logger:10-158, AudioManager:164-378, config:408-552, state:553-572, init:574-611, nav:1270-1340, pages:1341-5065, boot:5066-5102 |
| `frontend/index.html` | nav:140-195, home-page:196-297, memorization-page:298-387, ward-page:388-515, progress-page:516-583, competition-page:584-679, hifz-page:680-759, settings-page:760-828, mytasks-page:829-886, teacher-page:887-999, modals:1000-1562 |

---

## Task 1 : Structure des répertoires

**Files:**
- Create: `frontend/src/core/` (répertoire)
- Create: `frontend/src/services/` (répertoire)
- Create: `frontend/src/pages/` (répertoire)
- Create: `frontend/src/components/` (répertoire)

**Step 1: Créer l'arborescence**

```bash
mkdir -p frontend/src/core frontend/src/services frontend/src/pages frontend/src/components
```

**Step 2: Vérifier**

```bash
ls frontend/src/
# core  services  pages  components
```

**Step 3: Commit**

```bash
git add frontend/src/
git commit -m "chore: créer l'arborescence src/ pour les modules ES"
```

---

## Task 2 : Extraire Logger → `src/core/logger.js`

**Files:**
- Create: `frontend/src/core/logger.js`
- Source: `frontend/script.js` lignes 10-158

**Step 1: Créer `frontend/src/core/logger.js`**

Copier les lignes 10-158 de `script.js` (l'objet `Logger`) dans ce fichier, puis :
- Remplacer `const Logger = {` par `export const Logger = {`
- Supprimer la dernière ligne si elle n'appartient pas à Logger (s'arrêter à la `};` fermante de Logger)

```js
// frontend/src/core/logger.js
export const Logger = {
    debugMode: true,
    _history: [],
    // ... (code identique, lignes 11-157 de script.js)
};
```

**Step 2: Vérifier que le fichier est syntaxiquement correct**

```bash
node --input-type=module < frontend/src/core/logger.js
# Doit retourner sans erreur (ou "SyntaxError" uniquement si node ne supporte pas — pas d'erreur JS)
```

**Step 3: Commit**

```bash
git add frontend/src/core/logger.js
git commit -m "feat(refactor): extraire Logger vers src/core/logger.js"
```

---

## Task 3 : Extraire config → `src/core/config.js`

**Files:**
- Create: `frontend/src/core/config.js`
- Source: `frontend/script.js` lignes 383-407 (API_BASE_URL, constantes) + lignes 408-552 (config object)

**Step 1: Créer `frontend/src/core/config.js`**

```js
// frontend/src/core/config.js
export const API_BASE_URL = window.API_BASE_URL || (() => {
    // ... (code identique lignes 383-397)
})();

export const IS_FILE_PROTOCOL = window.location.protocol === 'file:';
export const IS_DEMO_MODE = IS_FILE_PROTOCOL;

// Config de l'app (extrait de QuranReview.config, lignes 410-552)
export const config = {
    appName: 'QuranReview',
    version: '1.0.2',
    apiBaseUrl: API_BASE_URL,
    storageKey: 'quranreview_data',
    tasksKey: 'quranreview_tasks',
    apiTokenKey: 'quranreview_api_token',
    settingsKey: 'quranreview_settings',
    competitionKey: 'quranreview_competition',
    hifzKey: 'quranreview_hifz',
    themeKey: 'quranreview_theme',
    defaultSettings: {
        userName: '',
        dailyGoal: 5,
        theme: 'light',
        notifications: true,
        ayahDelay: 0,
        autoPlayNext: true
    },
    surahs: [
        // ... les 114 surahs (lignes 425-548 de script.js)
    ]
};
```

**Step 2: Commit**

```bash
git add frontend/src/core/config.js
git commit -m "feat(refactor): extraire config et constantes vers src/core/config.js"
```

---

## Task 4 : Extraire state → `src/core/state.js`

**Files:**
- Create: `frontend/src/core/state.js`
- Source: `frontend/script.js` méthodes `loadData` (lignes ~636-720), `saveData` (lignes ~1160-1210)

**Step 1: Créer `frontend/src/core/state.js`**

```js
// frontend/src/core/state.js
import { Logger } from './logger.js';
import { config } from './config.js';

export const state = {
    currentPage: 'home',
    memorizationData: [],
    tasks: [],
    competition: {},
    hifz: {},
    settings: { ...config.defaultSettings },
    todayDate: new Date().toISOString().split('T')[0],
    imageQuality: 'normal',
    user: null,
    wardPlayer: null
};

export function loadData() {
    try {
        // Copier le corps de QuranReview.loadData() ici
        // Remplacer this.config par config
        // Remplacer this.state par state
        // Remplacer this.getDefaultMemorizationData() par getDefaultMemorizationData()
        // ...
    } catch (error) {
        Logger.error('APP', 'Error loading data', error);
        state.settings = { ...config.defaultSettings };
        state.memorizationData = getDefaultMemorizationData();
        state.tasks = [];
    }
}

export function saveData() {
    try {
        // Copier le corps de QuranReview.saveData() ici
        // Remplacer this.config par config
        // Remplacer this.state par state
        // ...
    } catch (error) {
        Logger.error('APP', 'Error saving data', error);
    }
}

export function getDefaultMemorizationData() {
    // Copier QuranReview.getDefaultMemorizationData() ici
    // Remplacer this.config.surahs par config.surahs
    // ...
}
```

**Règle de transformation :** Dans tout le code copié de `QuranReview`, remplacer :
- `this.config` → `config`
- `this.state` → `state`
- `this.saveData()` → `saveData()`
- `Logger.xxx` → `Logger.xxx` (identique, juste importer)

**Step 2: Commit**

```bash
git add frontend/src/core/state.js
git commit -m "feat(refactor): extraire state + loadData/saveData vers src/core/state.js"
```

---

## Task 5 : Extraire utilitaires UI → `src/core/ui.js`

**Files:**
- Create: `frontend/src/core/ui.js`
- Source: `frontend/script.js` : `showNotification` (lignes 3183-3210), `updateTodayDate` (lignes ~622-636)

**Step 1: Créer `frontend/src/core/ui.js`**

```js
// frontend/src/core/ui.js
export function showNotification(message, type = 'info') {
    // Copier le corps de QuranReview.showNotification() (lignes 3183-3210)
    // Pas de dépendance à this — copie directe
}

export function updateTodayDate() {
    // Copier le corps de QuranReview.updateTodayDate() (lignes ~622-635)
}
```

**Step 2: Commit**

```bash
git add frontend/src/core/ui.js
git commit -m "feat(refactor): extraire utilitaires UI vers src/core/ui.js"
```

---

## Task 6 : Extraire AudioPlayer → `src/components/AudioPlayer.js`

**Files:**
- Create: `frontend/src/components/AudioPlayer.js`
- Source: `frontend/script.js` lignes 164-378 (objet `AudioManager`) + méthodes `initAudioPlayer` (~lignes 2500-2570) et `initWardPlayer` (~lignes 2570-2650) de `QuranReview`

**Step 1: Créer `frontend/src/components/AudioPlayer.js`**

```js
// frontend/src/components/AudioPlayer.js
import { Logger } from '../core/logger.js';
// Note: AudioManager référence window.QuranReview pour les callbacks Ward
// On conserve window.QuranReview comme façade — OK

export const AudioManager = {
    // Copier l'objet AudioManager complet (lignes 164-378 de script.js)
    // Les références à window.QuranReview et QuranReview.state dans
    // playWirdAyahSequence restent telles quelles — elles seront
    // résolues via la façade window.QuranReview dans main.js
};

export function initAudioPlayer() {
    // Copier le corps de QuranReview.initAudioPlayer()
    // Remplacer this.state → state (importer depuis ../core/state.js)
    // Remplacer this.saveData → saveData
}

export function initWardPlayer() {
    // Copier le corps de QuranReview.initWardPlayer()
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/AudioPlayer.js
git commit -m "feat(refactor): extraire AudioManager vers src/components/AudioPlayer.js"
```

---

## Task 7 : Extraire service auth → `src/services/auth.js`

**Files:**
- Create: `frontend/src/services/auth.js`
- Source: `frontend/script.js` méthodes auth de `QuranReview` : `initAuth`, `updateAuthUI`, `showAuthModal`, `hideAuthModal`, `showRegisterForm`, `showLoginForm`, `performLogin`, `handleRegister`, `handleLogin`, `fetchMe`, `refreshToken`, `logout` (lignes ~707-1115)

**Step 1: Créer `frontend/src/services/auth.js`**

```js
// frontend/src/services/auth.js
import { Logger } from '../core/logger.js';
import { config } from '../core/config.js';
import { state } from '../core/state.js';
import { showNotification } from '../core/ui.js';

export function initAuth() {
    // Copier QuranReview.initAuth() — remplacer this.config/state/logout/updateAuthUI/fetchMe
}

export function updateAuthUI(loggedIn) {
    // Copier QuranReview.updateAuthUI()
}

export function showAuthModal() {
    // Copier QuranReview.showAuthModal()
}

export function hideAuthModal() {
    // Copier QuranReview.hideAuthModal()
}

export function showRegisterForm(event) {
    // Copier QuranReview.showRegisterForm()
}

export function showLoginForm(event) {
    // Copier QuranReview.showLoginForm()
}

export async function performLogin(username, password) {
    // Copier QuranReview.performLogin()
    // Remplacer this.showNotification → showNotification
    // Remplacer this.state → state
    // Remplacer this.updateAuthUI → updateAuthUI
}

export async function handleRegister(event) { /* ... */ }
export async function handleLogin(event) { /* ... */ }
export async function fetchMe() { /* ... */ }
export async function refreshToken() { /* ... */ }
export function logout() { /* ... */ }
```

**Step 2: Commit**

```bash
git add frontend/src/services/auth.js
git commit -m "feat(refactor): extraire service auth vers src/services/auth.js"
```

---

## Task 8 : Extraire service tasks → `src/services/tasks.js`

**Files:**
- Create: `frontend/src/services/tasks.js`
- Source: `frontend/script.js` : `loadTasksFromApi` (lignes 1117-1158) + méthodes de rendu des tâches étudiant et enseignant (chercher toutes les méthodes qui manipulent `this.state.tasks`)

**Step 1: Créer `frontend/src/services/tasks.js`**

```js
// frontend/src/services/tasks.js
import { Logger } from '../core/logger.js';
import { config } from '../core/config.js';
import { state } from '../core/state.js';
import { showNotification } from '../core/ui.js';

export async function loadTasksFromApi() {
    // Copier QuranReview.loadTasksFromApi() (lignes 1117-1158)
    // Remplacer this.config → config, this.state → state, this.refreshToken → refreshToken (importer de auth.js)
}
```

**Step 2: Commit**

```bash
git add frontend/src/services/tasks.js
git commit -m "feat(refactor): extraire service tasks vers src/services/tasks.js"
```

---

## Task 9 : Extraire service competition → `src/services/competition.js`

**Files:**
- Create: `frontend/src/services/competition.js`
- Source: `frontend/script.js` objet `competitionManager` (lignes 1511-2010)

**Step 1: Créer `frontend/src/services/competition.js`**

```js
// frontend/src/services/competition.js
import { Logger } from '../core/logger.js';
import { config } from '../core/config.js';
import { state } from '../core/state.js';
import { saveData } from '../core/state.js';
import { showNotification } from '../core/ui.js';

export const competitionManager = {
    // Copier QuranReview.competitionManager (lignes 1511-2010)
    // Remplacer QuranReview.state → state
    // Remplacer QuranReview.saveData() → saveData()
    // Remplacer QuranReview.showNotification → showNotification
    // Remplacer QuranReview.renderCompetitionPage() → window.QuranReview.renderCompetitionPage()
    //   (gardé via façade car appel cross-page)
};
```

**Note :** Les appels `QuranReview.renderCompetitionPage()` dans `competitionManager` restent `window.QuranReview.renderCompetitionPage()` car ils appellent la navigation — la façade résout cette dépendance circulaire.

**Step 2: Commit**

```bash
git add frontend/src/services/competition.js
git commit -m "feat(refactor): extraire competitionManager vers src/services/competition.js"
```

---

## Task 10 : Extraire service hifz → `src/services/hifz.js`

**Files:**
- Create: `frontend/src/services/hifz.js`
- Source: `frontend/script.js` objet `hifzEngine` (lignes 1451-1510) + méthodes de session hifz (~lignes 2011-2215)

**Step 1: Créer `frontend/src/services/hifz.js`**

```js
// frontend/src/services/hifz.js
import { Logger } from '../core/logger.js';
import { config } from '../core/config.js';
import { state, saveData } from '../core/state.js';
import { showNotification } from '../core/ui.js';

export const hifzEngine = {
    // Copier QuranReview.hifzEngine (lignes 1451-1510)
    // Aucune référence à QuranReview — copie directe
};

export function startHifzSession(surahId, ayahNumber, level) {
    // Copier méthodes de session hifz (lignes ~2011-2215)
}
```

**Step 2: Commit**

```bash
git add frontend/src/services/hifz.js
git commit -m "feat(refactor): extraire hifzEngine vers src/services/hifz.js"
```

---

## Task 11 : Créer la page Home → `src/pages/HomePage.js`

**Files:**
- Create: `frontend/src/pages/HomePage.js`
- Create: `frontend/src/pages/HomePage.css`
- Source HTML: `frontend/index.html` lignes 196-297 (div#home-page)
- Source JS: `frontend/script.js` : `renderHomePage` (ligne 2216), `updateDailyMotivation` (~2258-2340), `updateHomeStats` (~2340-2390)

**Step 1: Créer `frontend/src/pages/HomePage.js`**

```js
// frontend/src/pages/HomePage.js
import { state } from '../core/state.js';

// Injection CSS co-localisé (une seule fois)
if (!document.querySelector('link[href*="HomePage.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/src/pages/HomePage.css';
    document.head.appendChild(link);
}

export function render() {
    return `
        <div id="home-page" class="page active">
            <!-- Coller ici tout le HTML de index.html lignes 196-297 -->
            <!-- (le div#home-page et son contenu complet) -->
        </div>
    `;
}

export function init() {
    // Copier le corps de QuranReview.renderHomePage() :
    updateDailyMotivation();
    updateHomeStats();
    updateTodayDate();
}

function updateDailyMotivation() {
    // Copier QuranReview.updateDailyMotivation()
}

function updateHomeStats() {
    // Copier QuranReview.updateHomeStats()
    // Remplacer this.state → state
}

function updateTodayDate() {
    // Copier QuranReview.updateTodayDate()
}
```

**Step 2: Créer `frontend/src/pages/HomePage.css`**

Fichier vide pour l'instant — les styles de la HomePage sont déjà dans `style-pro.css`.

**Step 3: Commit**

```bash
git add frontend/src/pages/HomePage.js frontend/src/pages/HomePage.css
git commit -m "feat(refactor): extraire page Home vers src/pages/"
```

---

## Task 12 : Créer la page Memorization → `src/pages/MemorizationPage.js`

**Files:**
- Create: `frontend/src/pages/MemorizationPage.js`
- Create: `frontend/src/pages/MemorizationPage.css`
- Source HTML: `frontend/index.html` lignes 298-387 (div#memorization-page)
- Source JS: `frontend/script.js` : `renderMemorizationPage` (ligne 2229), `renderMemorizationTable`, `setupMemorizationActions`, `showAddMemorization`, `hideAddMemorization`, `handleAddMemorization`, `updateMemorizationItem`, méthodes de tri/filtre de la table

**Step 1: Créer `frontend/src/pages/MemorizationPage.js`**

```js
// frontend/src/pages/MemorizationPage.js
import { state, saveData } from '../core/state.js';
import { config } from '../core/config.js';
import { showNotification } from '../core/ui.js';
import { Logger } from '../core/logger.js';

if (!document.querySelector('link[href*="MemorizationPage.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/src/pages/MemorizationPage.css';
    document.head.appendChild(link);
}

export function render() {
    return `
        <div id="memorization-page" class="page active">
            <!-- HTML de index.html lignes 298-387 -->
        </div>
    `;
}

export function init() {
    renderMemorizationTable();
    setupMemorizationActions();
}

function renderMemorizationTable() { /* ... */ }
function setupMemorizationActions() { /* ... */ }
export function showAddMemorization() { /* ... */ }
export function hideAddMemorization() { /* ... */ }
export async function handleAddMemorization(event) { /* ... */ }
// etc.
```

**Note :** Les fonctions appelées depuis des `onclick` inline dans le HTML doivent être **exportées** (pour être exposées via `window.QuranReview`).

**Step 2: Commit**

```bash
git add frontend/src/pages/MemorizationPage.js frontend/src/pages/MemorizationPage.css
git commit -m "feat(refactor): extraire page Memorization vers src/pages/"
```

---

## Task 13 : Créer la page Ward → `src/pages/WardPage.js`

**Files:**
- Create: `frontend/src/pages/WardPage.js`
- Create: `frontend/src/pages/WardPage.css`
- Source HTML: `frontend/index.html` lignes 388-515 (div#ward-page)
- Source JS: `frontend/script.js` : `renderWardPage`, `initWardPlayer`, `setupWardControls`, `populateWardSurahSelect`, `toggleWardPlay`, `previousWardAyah`, `nextWardAyah`, `updateWardDisplay`, `updateWardAyahDisplay`, `playWard`, `stopWard`

**Pattern identique aux autres pages :**
```js
export function render() { return `<div id="ward-page" class="page active">...</div>`; }
export function init() { setupWardControls(); populateWardSurahSelect(); initWardPlayer(); }
export function toggleWardPlay() { /* ... */ }
export function previousWardAyah() { /* ... */ }
export function nextWardAyah() { /* ... */ }
export function updateWardDisplay() { /* ... */ }
export function updateWardAyahDisplay(surahId, ayah) { /* ... */ }
export function playWard() { /* ... */ }
```

**Step 1: Créer les fichiers + commit**

```bash
git add frontend/src/pages/WardPage.js frontend/src/pages/WardPage.css
git commit -m "feat(refactor): extraire page Ward vers src/pages/"
```

---

## Task 14 : Créer la page Progress → `src/pages/ProgressPage.js`

**Files:**
- Create: `frontend/src/pages/ProgressPage.js`
- Create: `frontend/src/pages/ProgressPage.css`
- Source HTML: `frontend/index.html` lignes 516-583 (div#progress-page)
- Source JS: `frontend/script.js` : `renderProgressPage` (ligne 2243), `renderProgressStats`, `renderProgressChart` (~lignes 3021-3150)

**Step 1: Créer les fichiers + commit**

```bash
git add frontend/src/pages/ProgressPage.js frontend/src/pages/ProgressPage.css
git commit -m "feat(refactor): extraire page Progress vers src/pages/"
```

---

## Task 15 : Créer la page Settings → `src/pages/SettingsPage.js`

**Files:**
- Create: `frontend/src/pages/SettingsPage.js`
- Create: `frontend/src/pages/SettingsPage.css`
- Source HTML: `frontend/index.html` lignes 760-828 (div#settings-page)
- Source JS: `frontend/script.js` : `renderSettingsPage` (ligne 2248), `renderSettingsForm`, `saveSettings`, `exportData`, `importData`, `resetData`, `initTheme`, `toggleTheme`, `setTheme`, `applyTheme`, fonctions reciteur/bitrate/audio-source (~lignes 2400-2500)

**Step 1: Créer les fichiers + commit**

```bash
git add frontend/src/pages/SettingsPage.js frontend/src/pages/SettingsPage.css
git commit -m "feat(refactor): extraire page Settings vers src/pages/"
```

---

## Task 16 : Créer la page Competition → `src/pages/CompetitionPage.js`

**Files:**
- Create: `frontend/src/pages/CompetitionPage.js`
- Create: `frontend/src/pages/CompetitionPage.css`
- Source HTML: `frontend/index.html` lignes 584-679 (div#competition-page)
- Source JS: `frontend/script.js` : `renderCompetitionPage` (ligne 1341), `startChallenge` — délègue à `competitionManager`

```js
import { competitionManager } from '../services/competition.js';

export function render() { return `<div id="competition-page" class="page active">...</div>`; }
export function init() { competitionManager.renderLeaderboard(); }
export function startChallenge(type) { competitionManager.startChallenge(type); }
```

**Step 1: Créer les fichiers + commit**

```bash
git add frontend/src/pages/CompetitionPage.js frontend/src/pages/CompetitionPage.css
git commit -m "feat(refactor): extraire page Competition vers src/pages/"
```

---

## Task 17 : Créer la page Hifz → `src/pages/HifzPage.js`

**Files:**
- Create: `frontend/src/pages/HifzPage.js`
- Create: `frontend/src/pages/HifzPage.css`
- Source HTML: `frontend/index.html` lignes 680-759 (div#hifz-page)
- Source JS: `frontend/script.js` : `renderHifzPage` (ligne 1375) + méthodes `showHint`, `checkMemorization`, `nextLevel`, `stopHifzSession`

```js
import { hifzEngine } from '../services/hifz.js';

export function render() { return `<div id="hifz-page" class="page active">...</div>`; }
export function init() { /* setup hifz UI */ }
export function showHint() { /* ... */ }
export function checkMemorization() { /* ... */ }
export function nextLevel() { /* ... */ }
export function stopHifzSession() { /* ... */ }
```

**Step 1: Créer les fichiers + commit**

```bash
git add frontend/src/pages/HifzPage.js frontend/src/pages/HifzPage.css
git commit -m "feat(refactor): extraire page Hifz vers src/pages/"
```

---

## Task 18 : Créer la page MyTasks (étudiant) → `src/pages/MyTasksPage.js`

**Files:**
- Create: `frontend/src/pages/MyTasksPage.js`
- Create: `frontend/src/pages/MyTasksPage.css`
- Source HTML: `frontend/index.html` lignes 829-886 (div#mytasks-page)
- Source JS: `frontend/script.js` : `loadStudentDashboard` (ligne 4046), `switchTaskTab`, `openAudioModal`, `submitAudioForTask`, rendu de la liste des tâches étudiant (~lignes 4046-4246)

```js
import { state } from '../core/state.js';
import { config } from '../core/config.js';
import { showNotification } from '../core/ui.js';

export function render() { return `<div id="mytasks-page" class="page active">...</div>`; }
export async function init() { await loadStudentDashboard(); }
async function loadStudentDashboard() { /* ... */ }
export function switchTaskTab(tab) { /* ... */ }
export function openAudioModal(taskId) { /* ... */ }
```

**Step 1: Créer les fichiers + commit**

```bash
git add frontend/src/pages/MyTasksPage.js frontend/src/pages/MyTasksPage.css
git commit -m "feat(refactor): extraire page MyTasks vers src/pages/"
```

---

## Task 19 : Créer la page Teacher → `src/pages/TeacherPage.js`

**Files:**
- Create: `frontend/src/pages/TeacherPage.js`
- Create: `frontend/src/pages/TeacherPage.css`
- Source HTML: `frontend/index.html` lignes 887-999 (div#teacher-page)
- Source JS: `frontend/script.js` : `loadTeacherDashboard` (ligne 4247), `viewStudentProgress` (4419), `handleDeleteAllTasks` (4507), `handleCreateTask` (4536), `approveSubmission` (4590), `rejectSubmission` (4614), `loadAdminUsersList` (4640), `renderAdminUsersList` (4664), `handleUpdateUser` (4728), `deleteUser` (4787), `handleCreateTeacher` (4821), `handlePromoteTeacher` (4869), `toggleAssignMode` (~4950)

```js
import { state } from '../core/state.js';
import { config } from '../core/config.js';
import { showNotification } from '../core/ui.js';

export function render() { return `<div id="teacher-page" class="page active">...</div>`; }
export async function init() { await loadTeacherDashboard(); }
async function loadTeacherDashboard() { /* ... */ }
export async function viewStudentProgress(studentId, name) { /* ... */ }
export async function handleCreateTask(event) { /* ... */ }
export async function approveSubmission(id) { /* ... */ }
export async function rejectSubmission(id, feedback) { /* ... */ }
export async function loadAdminUsersList() { /* ... */ }
export async function handleUpdateUser(event) { /* ... */ }
export async function deleteUser(userId, username) { /* ... */ }
export async function handleCreateTeacher(event) { /* ... */ }
export async function handlePromoteTeacher(event) { /* ... */ }
export function toggleAssignMode(mode) { /* ... */ }
```

**Step 1: Créer les fichiers + commit**

```bash
git add frontend/src/pages/TeacherPage.js frontend/src/pages/TeacherPage.css
git commit -m "feat(refactor): extraire page Teacher vers src/pages/"
```

---

## Task 20 : Créer les composants modaux → `src/components/`

**Files:**
- Create: `frontend/src/components/AuthModal.js`
- Create: `frontend/src/components/AuthModal.css`
- Create: `frontend/src/components/AudioRecordModal.js`
- Create: `frontend/src/components/UserEditModal.js`
- Source HTML: `frontend/index.html` lignes 1000-1562 (3 modaux)
- Source JS: `frontend/script.js` méthodes auth modal (déjà extraites en Task 7) + `toggleRecording`, `stopRecording`, `submitRecording` (lignes 4947-5065)

**Step 1: Créer `frontend/src/components/AuthModal.js`**

```js
// frontend/src/components/AuthModal.js
// Ce composant est monté dans <div id="modals"> par main.js

export function render() {
    return `
        <!-- HTML des 3 modaux depuis index.html lignes 1000-1562 -->
        <div class="modal-overlay-pro hidden" id="audio-record-modal">...</div>
        <div class="modal-overlay-pro hidden" id="user-edit-modal">...</div>
        <div class="modal-overlay-pro hidden" id="auth-modal">...</div>
    `;
}

export function init() {
    // Fermeture modal au clic overlay
    document.getElementById('auth-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'auth-modal') hideAuthModal();
    });
}
```

**Step 2: Créer `frontend/src/components/AudioRecordModal.js`**

```js
// frontend/src/components/AudioRecordModal.js
import { state } from '../core/state.js';
import { config } from '../core/config.js';
import { showNotification } from '../core/ui.js';

export function toggleRecording() { /* ... */ }
export function stopRecording(cancel) { /* ... */ }
export async function submitRecording() { /* ... */ }
export function openAudioModal(taskId) {
    // Copier QuranReview.openAudioModal
    state._recordTaskId = taskId;
    const modal = document.getElementById('audio-record-modal');
    modal.classList.remove('hidden');
    modal.classList.add('active');
}
```

**Step 3: Commit**

```bash
git add frontend/src/components/
git commit -m "feat(refactor): extraire composants modaux vers src/components/"
```

---

## Task 21 : Créer le router → `src/core/router.js`

**Files:**
- Create: `frontend/src/core/router.js`
- Source: `frontend/script.js` : `setupNavigation` (lignes 1270-1292), `navigateTo` (1292-1340)

**Step 1: Créer `frontend/src/core/router.js`**

```js
// frontend/src/core/router.js
import { Logger } from './logger.js';
import { state } from './state.js';
import { AudioManager } from '../components/AudioPlayer.js';

// Import dynamique de toutes les pages
import * as HomePage from '../pages/HomePage.js';
import * as MemorizationPage from '../pages/MemorizationPage.js';
import * as WardPage from '../pages/WardPage.js';
import * as ProgressPage from '../pages/ProgressPage.js';
import * as SettingsPage from '../pages/SettingsPage.js';
import * as CompetitionPage from '../pages/CompetitionPage.js';
import * as HifzPage from '../pages/HifzPage.js';
import * as MyTasksPage from '../pages/MyTasksPage.js';
import * as TeacherPage from '../pages/TeacherPage.js';

const pages = {
    home: HomePage,
    memorization: MemorizationPage,
    ward: WardPage,
    progress: ProgressPage,
    settings: SettingsPage,
    competition: CompetitionPage,
    hifz: HifzPage,
    mytasks: MyTasksPage,
    teacher: TeacherPage,
};

export function navigateTo(pageName) {
    Logger.nav(state.currentPage, pageName);
    AudioManager.stopAll();

    // Mettre à jour les liens de nav
    document.querySelectorAll('.nav-link, .nav-link-pro').forEach(link => {
        link.classList.remove('active');
    });
    const activeLink = document.querySelector(`[data-page="${pageName}"]`);
    if (activeLink) activeLink.classList.add('active');

    state.currentPage = pageName;
    renderPage(pageName);
}

export function renderPage(pageName) {
    const page = pages[pageName];
    if (!page) {
        Logger.error('ROUTER', `Page inconnue : ${pageName}`);
        return;
    }
    const app = document.getElementById('app');
    app.innerHTML = page.render();
    page.init();
}

export function setupNavigation() {
    document.querySelectorAll('.nav-link, .nav-link-pro').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageName = link.getAttribute('data-page');
            if (pageName) navigateTo(pageName);
        });
    });

    const themeToggle = document.getElementById('theme-toggle');
    themeToggle?.addEventListener('click', () => {
        // Import dynamique pour éviter la circularité
        import('../pages/SettingsPage.js').then(m => m.toggleTheme());
    });
}
```

**Step 2: Commit**

```bash
git add frontend/src/core/router.js
git commit -m "feat(refactor): créer router ES modules"
```

---

## Task 22 : Créer `src/main.js` (point d'entrée)

**Files:**
- Create: `frontend/src/main.js`
- Source: `frontend/script.js` méthode `init` (lignes 574-611) + boot (lignes 5066-5102)

**Step 1: Créer `frontend/src/main.js`**

```js
// frontend/src/main.js
import { Logger } from './core/logger.js';
import { config } from './core/config.js';
import { state, loadData } from './core/state.js';
import { showNotification, updateTodayDate } from './core/ui.js';
import { AudioManager, initAudioPlayer, initWardPlayer } from './components/AudioPlayer.js';
import { initAuth, updateAuthUI, showAuthModal, hideAuthModal,
         showRegisterForm, showLoginForm, handleLogin, handleRegister,
         performLogin, fetchMe, refreshToken, logout } from './services/auth.js';
import { loadTasksFromApi } from './services/tasks.js';
import { navigateTo, renderPage, setupNavigation } from './core/router.js';
import { render as renderModals, init as initModals } from './components/AuthModal.js';
import { toggleRecording, stopRecording, submitRecording } from './components/AudioRecordModal.js';

// Import pages pour réexport dans la façade
import * as MemorizationPage from './pages/MemorizationPage.js';
import * as WardPage from './pages/WardPage.js';
import * as SettingsPage from './pages/SettingsPage.js';
import * as CompetitionPage from './pages/CompetitionPage.js';
import * as HifzPage from './pages/HifzPage.js';
import * as MyTasksPage from './pages/MyTasksPage.js';
import * as TeacherPage from './pages/TeacherPage.js';

function init() {
    Logger.log('APP', 'Initializing QuranReview...');

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
    SettingsPage.initTheme();

    // Init auth
    initAuth();

    // Render page initiale
    renderPage('home');

    // Global click tracker
    document.addEventListener('click', (e) => Logger.click(e.target), true);

    // Error handlers
    window.addEventListener('error', (e) => {
        Logger.error('GLOBAL', `Application Error: ${e.message}`, e.error);
        showNotification(`خطأ: ${e.message}`, 'error');
    });
    window.addEventListener('unhandledrejection', (e) => {
        const msg = e?.reason?.message || 'Unhandled rejection';
        Logger.error('GLOBAL', msg, e.reason);
        showNotification(`خطأ: ${msg}`, 'error');
    });

    // Slidedown animation
    const style = document.createElement('style');
    style.textContent = `@keyframes slideDown { from { transform: translate(-50%,-100%); opacity:0; } to { transform: translate(-50%,0); opacity:1; } }`;
    document.head.appendChild(style);

    Logger.log('APP', 'QuranReview initialized');
}

// ============================================================
// FAÇADE window.QuranReview — compatibilité onclick existants
// ============================================================
window.QuranReview = {
    state,
    config,
    navigateTo,
    renderPage,
    showNotification,
    logout,
    updateAuthUI,
    // Pages
    showAddMemorization: MemorizationPage.showAddMemorization,
    hideAddMemorization: MemorizationPage.hideAddMemorization,
    handleAddMemorization: MemorizationPage.handleAddMemorization,
    toggleWardPlay: WardPage.toggleWardPlay,
    previousWardAyah: WardPage.previousWardAyah,
    nextWardAyah: WardPage.nextWardAyah,
    updateWardDisplay: WardPage.updateWardDisplay,
    updateWardAyahDisplay: WardPage.updateWardAyahDisplay,
    saveSettings: SettingsPage.saveSettings,
    setTheme: SettingsPage.setTheme,
    exportData: SettingsPage.exportData,
    importData: SettingsPage.importData,
    resetData: SettingsPage.resetData,
    startChallenge: CompetitionPage.startChallenge,
    renderCompetitionPage: () => navigateTo('competition'),
    showHint: HifzPage.showHint,
    checkMemorization: HifzPage.checkMemorization,
    nextLevel: HifzPage.nextLevel,
    stopHifzSession: HifzPage.stopHifzSession,
    renderHifzPage: () => navigateTo('hifz'),
    switchTaskTab: MyTasksPage.switchTaskTab,
    openAudioModal: MyTasksPage.openAudioModal,
    handleCreateTask: TeacherPage.handleCreateTask,
    toggleAssignMode: TeacherPage.toggleAssignMode,
    viewStudentProgress: TeacherPage.viewStudentProgress,
    handleDeleteAllTasks: TeacherPage.handleDeleteAllTasks,
    approveSubmission: TeacherPage.approveSubmission,
    rejectSubmission: TeacherPage.rejectSubmission,
    handleUpdateUser: TeacherPage.handleUpdateUser,
    deleteUser: TeacherPage.deleteUser,
    handleCreateTeacher: TeacherPage.handleCreateTeacher,
    handlePromoteTeacher: TeacherPage.handlePromoteTeacher,
    // Auth
    showAuthModal,
    hideAuthModal,
    showRegisterForm,
    showLoginForm,
    handleLogin,
    handleRegister,
    // Recording
    toggleRecording,
    stopRecording,
    submitRecording,
};

// Globals pour onclick inline dans le HTML
window.showAuthModal = showAuthModal;
window.navigateTo = navigateTo;
window.playWard = WardPage.playWard;
window.AudioManager = AudioManager;

// Boot
document.addEventListener('DOMContentLoaded', init);
```

**Step 2: Commit**

```bash
git add frontend/src/main.js
git commit -m "feat(refactor): créer main.js — point d'entrée ES modules + façade QuranReview"
```

---

## Task 23 : Mettre à jour `frontend/index.html` (shell mince)

**Files:**
- Modify: `frontend/index.html`

**Step 1: Comprendre les changements nécessaires**

L'`index.html` actuel (1562 lignes) contient :
- Head avec styles/scripts
- Nav (lignes 140-195) → à **garder**
- 9 divs de pages (lignes 196-999) → à **supprimer** (remplacées par JS templates)
- 3 modaux (lignes 1000-1562) → à **supprimer** (montés par AuthModal.js)

**Step 2: Nouveau `frontend/index.html`**

```html
<!DOCTYPE html>
<html lang="ar" dir="rtl" data-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>مراجعة القرآن - Pro Edition</title>
    <meta name="description" content="تطبيق احترافي لحفظ ومراجعة القرآن الكريم">

    <!-- PWA -->
    <meta name="theme-color" content="#2d5016">
    <link rel="manifest" href="manifest.json">

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

    <!-- GSAP -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>

    <!-- Audio CDN (requis par AudioManager) -->
    <script src="https://cdn.jsdelivr.net/gh/quran/audio-config/audio-config.js" defer></script>

    <!-- Styles globaux (inchangés) -->
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="style-pro.css">
    <link rel="stylesheet" href="style-pro-fixes.css">

    <!-- Styles inline de index.html (garder le bloc <style> du head actuel) -->
    <style>
        /* Copier ici le bloc <style> existant du head (lignes ~28-138 de index.html) */
    </style>
</head>
<body>
    <!-- AUDIO ELEMENT (requis par AudioManager) -->
    <audio id="audio-element" preload="none"></audio>

    <!-- NAVIGATION (identique à index.html lignes 140-195) -->
    <header class="header-pro">
        <!-- ... (copier la nav exactement) -->
    </header>

    <!-- CONTENU PRINCIPAL -->
    <main id="app" class="main-content-pro"></main>

    <!-- MODAUX (montés dynamiquement par AuthModal.js) -->
    <div id="modals"></div>

    <!-- SERVICE WORKER -->
    <script>
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').catch(() => {});
            });
        }
    </script>

    <!-- POINT D'ENTRÉE ES MODULES -->
    <script type="module" src="src/main.js"></script>
</body>
</html>
```

**Step 3: Vérifier que l'`<audio id="audio-element">` est présent** (AudioManager.init() l'attend)

**Step 4: Commit**

```bash
git add frontend/index.html
git commit -m "feat(refactor): slim down index.html — shell + <div id=app> + ES module"
```

---

## Task 24 : Test en navigateur

**Step 1: Lancer Docker**

```bash
docker-compose up --build frontend
```

**Step 2: Ouvrir le navigateur**

Aller sur `http://localhost:80`

**Step 3: Checklist de vérification**

- [ ] La page Home s'affiche avec stats et motivation
- [ ] Navigation vers Mémorisation : table des sourates visible
- [ ] Navigation vers Ward : player audio présent
- [ ] Navigation vers Compétition : défis visibles
- [ ] Bouton Login : modal d'auth s'ouvre
- [ ] Console navigateur : aucune erreur `SyntaxError` ou `Cannot find module`
- [ ] `window.QuranReview` existe dans la console
- [ ] `window.QuranReview.state` contient les données

**Step 4: Si erreurs de module (`SyntaxError: import` ou `404`)**

- Vérifier que nginx sert bien les fichiers depuis `/usr/share/nginx/html/src/`
- Vérifier que `frontend/Dockerfile` copie bien tout le dossier `frontend/`
- Vérifier les imports relatifs (extension `.js` obligatoire)

---

## Task 25 : Supprimer `frontend/script.js` legacy

**Step 1: Vérifier qu'aucune référence ne reste**

```bash
grep -r "script.js" frontend/index.html frontend/src/
# Doit retourner vide
```

**Step 2: Archiver puis supprimer**

```bash
# Archiver dans docs/ au cas où
cp frontend/script.js docs/script.js.bak
git add docs/script.js.bak
git rm frontend/script.js
```

**Step 3: Commit final**

```bash
git commit -m "feat(refactor): supprimer script.js monolithique — refactoring ES modules complet

- Logger, config, state extraits dans src/core/
- Services auth, tasks, competition, hifz dans src/services/
- 9 pages extraites dans src/pages/
- Composants AudioPlayer et modaux dans src/components/
- Point d'entrée src/main.js avec façade window.QuranReview"
```

---

## Checklist finale

- [ ] `frontend/src/core/` : logger.js, config.js, state.js, ui.js, router.js
- [ ] `frontend/src/services/` : auth.js, tasks.js, competition.js, hifz.js
- [ ] `frontend/src/pages/` : 9 pages JS + CSS
- [ ] `frontend/src/components/` : AudioPlayer.js, AuthModal.js, AudioRecordModal.js, UserEditModal.js
- [ ] `frontend/src/main.js`
- [ ] `frontend/index.html` slimmed down
- [ ] `frontend/script.js` supprimé
- [ ] App fonctionne identiquement en navigateur
- [ ] `window.QuranReview` expose tous les handlers `onclick`
