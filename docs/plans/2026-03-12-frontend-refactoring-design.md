# Design — Refactoring Frontend en ES Modules

**Date :** 2026-03-12
**Projet :** quran-last-version (QuranReview App)
**Branche :** claude/eloquent-haibt

## Contexte

Le frontend actuel est un monolithe de ~5 000 lignes dans `frontend/script.js`, un seul objet global `QuranReview` avec toute la logique. `frontend/index.html` fait 1 562 lignes avec toutes les pages statiques. Stack : Vanilla JS + CSS, servi par nginx dans Docker, **aucun build step**.

## Décisions de design

| Décision | Choix |
|---|---|
| Framework | Aucun — Vanilla JS pur |
| Système de modules | ES Modules natifs (`import`/`export`) |
| Build step | Aucun (servi directement par nginx) |
| CSS | Co-localisé par page/composant, injection dynamique `<link>` |
| HTML | Template literals dans les fichiers JS (pages et composants) |
| Compatibilité onclick | `window.QuranReview` conservé comme façade légère |

## Structure cible

```
frontend/
  src/
    core/
      logger.js          ← Logger object (script.js lignes 10-158)
      config.js          ← API_BASE_URL, constantes, données des 114 surahs
      state.js           ← état app + loadData/saveData
      router.js          ← navigateTo, renderPage, setupNavigation

    services/
      auth.js            ← performLogin, handleLogin/Register, fetchMe, refreshToken, logout
      tasks.js           ← loadTasksFromApi, renderTasks (lignes 1117-1450)
      competition.js     ← competitionManager object (lignes 1511-2010)
      hifz.js            ← hifzEngine object (lignes 1451-1510 + 2011-2215)

    pages/
      HomePage.js + HomePage.css               ← renderHomePage (ligne 2216)
      MemorizationPage.js + MemorizationPage.css ← renderMemorizationPage + table (lignes 2229-3150)
      WardPage.js + WardPage.css               ← renderWardPage + audio player (lignes 2236-2248 + initWardPlayer)
      ReadingPage.js + ReadingPage.css         ← renderReadingPage (ligne 2224)
      ProgressPage.js + ProgressPage.css       ← renderProgressPage (lignes 2243-2248 + 3021-3150)
      SettingsPage.js + SettingsPage.css       ← renderSettingsPage (ligne 2248)
      CompetitionPage.js + CompetitionPage.css ← renderCompetitionPage (ligne 1341)
      HifzPage.js + HifzPage.css               ← renderHifzPage (ligne 1375)
      MyTasksPage.js + MyTasksPage.css         ← student tasks (lignes 4046-4246)
      TeacherPage.js + TeacherPage.css         ← loadTeacherDashboard (lignes 4247-4506)
      AdminPage.js + AdminPage.css             ← admin users (lignes 4640-4946)

    components/
      AuthModal.js + AuthModal.css             ← modal auth (index.html lignes 1089-1562)
      AudioRecordModal.js + AudioRecordModal.css ← modal enregistrement (index.html lignes 1000-1034)
      UserEditModal.js + UserEditModal.css     ← modal édition user (index.html lignes 1035-1088)
      AudioPlayer.js + AudioPlayer.css        ← AudioManager (script.js lignes 164-378)

    main.js              ← point d'entrée : init(), window.QuranReview façade

  index.html             ← shell : nav + <div id="app"> + modaux mount + <script type="module">
  style.css              ← inchangé
  style-pro.css          ← inchangé
  style-pro-fixes.css    ← inchangé
```

## Architecture des modules

### Pattern par page/composant

```js
// pages/HomePage.js
import { state } from '../core/state.js';
import { navigateTo } from '../core/router.js';

// Injection CSS co-localisé (une seule fois)
const _cssLink = document.createElement('link');
_cssLink.rel = 'stylesheet';
_cssLink.href = '/src/pages/HomePage.css';
document.head.appendChild(_cssLink);

export function render() {
  return `
    <div id="home-page" class="page active">
      <section class="section-pro">...</section>
    </div>
  `;
}

export function init() {
  // addEventListener à la place des onclick inline
  document.getElementById('some-btn')?.addEventListener('click', () => navigateTo('memorization'));
}
```

### Router

```js
// core/router.js
import * as HomePage from '../pages/HomePage.js';
import * as MemorizationPage from '../pages/MemorizationPage.js';
// ...

const pages = { home: HomePage, memorization: MemorizationPage, ... };

export function renderPage(pageName) {
  const page = pages[pageName];
  document.getElementById('app').innerHTML = page.render();
  page.init();
}
```

### State partagé

```js
// core/state.js
export const state = {
  currentPage: 'home',
  memorizationData: [],
  tasks: [],
  settings: {},
  user: null,
  // ...
};

export function loadData() { ... }
export function saveData() { ... }
```

### Façade window.QuranReview

```js
// main.js
import { renderPage, navigateTo } from './core/router.js';
import { showAuthModal, hideAuthModal } from './components/AuthModal.js';
// ...

// Façade globale pour compatibilité avec onclick restants
window.QuranReview = { navigateTo, renderPage, showAuthModal, hideAuthModal, ... };
window.showAuthModal = showAuthModal; // helper HTML

// Init
init();
```

## Flux de rendu

1. `main.js` initialise l'app → appelle `renderPage('home')`
2. `router.js` appelle `HomePage.render()` → injecte HTML dans `<div id="app">`
3. `router.js` appelle `HomePage.init()` → branche les événements
4. Navigation : `navigateTo('memorization')` → répète le cycle

## CSS co-localisé

- Chaque module JS injecte son `<link>` CSS dynamiquement au premier `import`
- Les CSS globaux (`style.css`, `style-pro.css`) restent inchangés
- Les CSS de pages/composants contiennent uniquement les styles spécifiques à ce module

## index.html après refactoring

```html
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <!-- styles globaux uniquement -->
  <link rel="stylesheet" href="style.css">
  <link rel="stylesheet" href="style-pro.css">
  <link rel="stylesheet" href="style-pro-fixes.css">
</head>
<body>
  <nav id="main-nav"><!-- navigation --></nav>
  <main id="app"></main>
  <div id="modals"></div>
  <script type="module" src="src/main.js"></script>
</body>
</html>
```

## Contraintes techniques

- `type="module"` sur le script → ES modules activés nativement dans le navigateur
- nginx sert les fichiers statiques directement, aucun changement Dockerfile nécessaire
- CORS : les modules ES sont soumis à la politique same-origin → nginx déjà configuré correctement
- Les `import` relatifs doivent inclure l'extension `.js`

## Hors périmètre

- Pas de tests unitaires (pas de framework de test actuel)
- Pas de TypeScript
- Pas de changement backend
- Pas de changement Docker/nginx
