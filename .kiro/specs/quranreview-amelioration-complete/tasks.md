# Implementation Tasks — QuranReview Amélioration Complète

**Généré le :** 2026-06-11  
**Basé sur :** requirements.md (167 critères) + design.md (6 modules)  
**Statut global :** Phase 1 ✅ Complète — Phase 2 en cours

---

## Résumé d'avancement

| Phase | Titre | Tâches | Statut |
|-------|-------|--------|--------|
| Phase 1 | Quick Wins (Sem. 1-4) | T1–T10 | ✅ Complète |
| Phase 2 | Fondations techniques (Sem. 5-8) | T11–T17 | ⏳ À démarrer |
| Phase 3 | Architecture (Sem. 9-12) | T18–T22 | ⏳ Partielle (T18 ✅) |
| Phase 4 | Features (Sem. 13-16) | T23–T27 | ⏳ Partielle (T23, T25, T26 ✅) |
| Phase 5 | Polish (Sem. 17-20) | T28–T32 | ⏳ À démarrer |

---

## Phase 1 : Quick Wins ✅ COMPLÈTE

### T1 — Design System DS3 cohérent ✅
- **Req :** Req 2 (AC 1-10), Req 10 (AC 1-2)
- **Fichiers :** `frontend/ds/kit.css`, `frontend/style.css`
- **Livré :** Tokens CSS `k-` prefix, spacing scale, semantic colors, composants utilitaires

### T2 — Landing page redesign ✅
- **Req :** Req 5 (AC 1-4), Req 10 (AC 8)
- **Fichiers :** `frontend/src/pages/HomePage.js`, `frontend/src/pages/HomePage.css`
- **Livré :** Hero moderne + stats live + glassmorphism

### T3 — Dashboard étudiant v2 ✅
- **Req :** Req 5 (AC 2), Req 6 (AC 7-9)
- **Fichiers :** `frontend/src/pages/HomePage.js`
- **Livré :** Stats visuelles, progress bar hifz, streaks

### T4 — Badges notification navigation ✅
- **Req :** Req 6 (AC 18)
- **Fichiers :** `frontend/src/core/NavManager.js`
- **Livré :** Badge compteur tâches en attente sur bottom bar

### T5 — Push Notifications Web Push API ✅
- **Req :** Req 6 (AC 1-5)
- **Fichiers :** `frontend/src/services/push-notifications.js`, `frontend/sw.js`, `supabase/functions/send-push/`
- **Livré :** VAPID, Edge Function send-push, toggle settings, subscriptions Supabase

### T6 — Calendrier hebdomadaire dashboard ✅
- **Req :** Req 6 (AC 6)
- **Fichiers :** `frontend/src/components/WeekCalendar.js`
- **Livré :** Composant 7 jours, tâches passées/présentes/futures

### T7 — Graphe évolution points 30j ✅
- **Req :** Req 6 (AC 13-14)
- **Fichiers :** `frontend/src/pages/ProfilPage.js`
- **Livré :** Chart.js, graphe cumulatif 30 jours sur profil étudiant

### T8 — Découpage AdminPage lazy-loading ✅
- **Req :** Req 1 (AC 2, 10), Req 4 (AC 5)
- **Fichiers :** `frontend/src/pages/admin/AdminUsersSection.js`, `AdminClassesSection.js`, `AdminStatsSection.js`
- **Livré :** 3 sous-modules lazy-loadés, AdminPage.js réduit

### T9 — Découpage TeacherPage lazy-loading ✅
- **Req :** Req 1 (AC 2, 10), Req 4 (AC 5)
- **Fichiers :** `frontend/src/pages/teacher/TeacherElevesSection.js`, `TeacherDevoirsSection.js`, `TeacherSoumissionsSection.js`
- **Livré :** 3 sous-modules lazy-loadés, correctifs modal étudiant et Quran audio

### T10 — Élimination styles inline → classes CSS ✅
- **Req :** Req 2 (AC 5-6), Req 10 (AC 2)
- **Fichiers :** `frontend/src/pages/*.js`, `frontend/ds/kit.css`
- **Livré :** Classes `k-row`, `k-card`, `k-section`, `k-chip`, etc.

---

## Phase 2 : Fondations Techniques

### T11 — Infrastructure de tests Vitest
- **Req :** Req 3 (AC 1, 10), Req 8 (AC 1)
- **Priorité :** 🔴 Haute
- **Effort :** 2 jours
- **Dépendances :** aucune

**Implémentation :**
- [ ] Initialiser Vitest : `npm init -y` dans `frontend/`, `npm i -D vitest @fast-check/vitest jsdom`
- [ ] Créer `frontend/vitest.config.js` avec `environment: 'jsdom'`, `coverage: { threshold: 80 }`
- [ ] Créer structure `frontend/tests/unit/`, `frontend/tests/integration/`, `frontend/tests/e2e/`
- [ ] Ajouter scripts npm : `"test"`, `"test:coverage"`, `"test:watch"`
- [ ] Créer `frontend/tests/setup.js` — mock `window.supabase`, `window.QuranReview`

---

### T12 — Tests unitaires services critiques (Vitest)
- **Req :** Req 3 (AC 2, 5-6, 11-12)
- **Priorité :** 🔴 Haute
- **Effort :** 4 jours
- **Dépendances :** T11

**Implémentation :**
- [ ] `tests/unit/core/apiCache.test.js` — TTL expiration, eviction, get/set round-trip (PBT)
- [ ] `tests/unit/core/state.test.js` — observer notification, get/set round-trip, persistance localStorage (PBT)
- [ ] `tests/unit/services/auth.test.js` — login mock Supabase, profil fetch, logout nettoyage state
- [ ] `tests/unit/services/tasks.test.js` — `loadTasksFromApi` parsing, filtrage par statut
- [ ] `tests/unit/pages/teacher/TeacherElevesSection.test.js` — `viewStudentProgress` sans token Django, rendu liste élèves
- [ ] `tests/unit/components/AudioPlayer.test.js` — `surahAyahToGlobal` encode/decode, URLs EveryAyah (PBT round-trip)
- [ ] Propriété PBT : `surahId * 1000 + ayah` → décode → même valeurs (100 itérations)
- [ ] Propriété PBT : `escapeHtml(input)` ne contient jamais `<` ni `>` après sanitisation

---

### T13 — Tests E2E Playwright (flux critiques)
- **Req :** Req 3 (AC 3-4)
- **Priorité :** 🟡 Moyenne
- **Effort :** 3 jours
- **Dépendances :** T11

**Implémentation :**
- [ ] `npm i -D @playwright/test`, `npx playwright install chromium`
- [ ] Créer `playwright.config.js` — baseURL `http://localhost:3456`, headless, 30s timeout
- [ ] `tests/e2e/auth.spec.js` — login étudiant, redirection dashboard, logout
- [ ] `tests/e2e/submission.spec.js` — nav vers Soumettre, ouverture modal enregistrement
- [ ] `tests/e2e/teacher-student.spec.js` — clic sur étudiant → modal overlay s'ouvre (pas en bas)
- [ ] `tests/e2e/quran-audio.spec.js` — bouton play Ward → audio démarre (EveryAyah CDN)
- [ ] Helper `tests/e2e/helpers/auth.js` — `loginAs(page, role)` réutilisable

---

### T14 — CI/CD GitHub Actions
- **Req :** Req 8 (AC 1-4)
- **Priorité :** 🟡 Moyenne
- **Effort :** 1 jour
- **Dépendances :** T11, T13

**Implémentation :**
- [ ] Créer `.github/workflows/ci.yml` — trigger sur push/PR vers `main` et `develop`
- [ ] Job `test` : `npm ci && npm run test:coverage` — fail si coverage < 80%
- [ ] Job `lint` : `npm run lint` (ESLint) + `npm run format:check` (Prettier)
- [ ] Job `e2e` : démarrer `python -m http.server 3456 --directory frontend &`, run Playwright
- [ ] Ajouter badge CI dans `README.md`
- [ ] Protéger branche `main` : require CI vert avant merge

---

### T15 — ESLint + Prettier + pre-commit hooks
- **Req :** Req 8 (AC 2, 5-6)
- **Priorité :** 🟡 Moyenne
- **Effort :** 1 jour
- **Dépendances :** aucune

**Implémentation :**
- [ ] `npm i -D eslint prettier eslint-config-prettier husky lint-staged`
- [ ] Créer `frontend/.eslintrc.json` — rules : `no-eval`, `no-unused-vars`, `no-console` (warn)
- [ ] Créer `frontend/.prettierrc` — `semi: true`, `singleQuote: true`, `tabWidth: 4`
- [ ] Configurer Husky : pre-commit lance `lint-staged` sur fichiers `*.js`
- [ ] Ajouter `.lintstagedrc` : `{ "*.js": ["eslint --fix", "prettier --write"] }`
- [ ] Corriger les erreurs ESLint existantes (focus sur `no-unused-vars`, `no-undef`)

---

### T16 — Sécurité : CSP + validation inputs
- **Req :** Req 7 (AC 1-4, 12-13)
- **Priorité :** 🔴 Haute
- **Effort :** 2 jours
- **Dépendances :** aucune

**Implémentation :**
- [ ] Ajouter meta CSP dans `frontend/index.html` :
  ```
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  media-src 'self' https://everyayah.com https://download.quranicaudio.com blob:;
  connect-src 'self' https://*.supabase.co https://everyayah.com https://download.quranicaudio.com;
  worker-src 'self';
  ```
  ⚠️ **NOTE :** Ne pas utiliser `cdn.islamic.network` (spec Kiro incorrecte) — le projet utilise EveryAyah
- [ ] Créer `frontend/src/core/validators.js` — `Validators.username()`, `Validators.surahId()`, `Validators.points()`
- [ ] Créer `frontend/src/core/sanitize.js` — `sanitizeHTML(input)` via `textContent` trick
- [ ] Intégrer validation dans `AuthModal.js` (username avant login)
- [ ] Intégrer validation dans formulaire création tâche (TeacherDevoirsSection)
- [ ] Vérifier que `escapeHtml()` est appelé sur toutes les données utilisateur rendues en HTML

---

### T17 — Indexes SQL + migrations Supabase
- **Req :** Req 9 (AC 1-3, 7)
- **Priorité :** 🟡 Moyenne
- **Effort :** 1 jour
- **Dépendances :** aucune

**Implémentation :**
- [ ] Créer `supabase/migrations/20260611_performance_indexes.sql` :
  ```sql
  CREATE INDEX IF NOT EXISTS idx_tasks_user_id_status ON tasks(user_id, status);
  CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
  CREATE INDEX IF NOT EXISTS idx_submissions_student_id_status ON submissions(student_id, status);
  CREATE INDEX IF NOT EXISTS idx_points_log_student_id ON points_log(student_id, created_at DESC);
  ```
- [ ] Créer `supabase/migrations/20260611_new_tables.sql` — tables `push_subscriptions`, `audit_log`, `feature_flags` (voir design-data.md §1)
- [ ] Appliquer via Supabase Dashboard ou `supabase db push`
- [ ] Documenter les migrations dans `docs/database-migrations.md`

---

## Phase 3 : Architecture

### T18 — Découpage gros fichiers restants ✅ (partiel)
- **Req :** Req 1 (AC 2, 10)
- **Statut :** Fait pour AdminPage et TeacherPage (T8, T9)
- **Restant :**
  - [ ] Vérifier si `WardPage.js` dépasse 500 lignes → découper si nécessaire
  - [ ] Vérifier si `HifzPage.js` dépasse 500 lignes → découper si nécessaire
  - [ ] Vérifier si `ProfilPage.js` dépasse 500 lignes → découper si nécessaire

---

### T19 — StateManager centralisé avec pattern Observer
- **Req :** Req 1 (AC 5), Req 4 (AC 8)
- **Priorité :** 🟡 Moyenne
- **Effort :** 3 jours
- **Dépendances :** T12

**Implémentation :**
- [ ] Upgrader `frontend/src/core/state.js` vers pattern Observer complet :
  ```javascript
  subscribe(key, callback) // observe une clé spécifique
  unsubscribe(key, callback)
  set(key, value) // notifie tous les observers de cette clé
  get(key)
  persist() // localStorage
  hydrate() // restore depuis localStorage
  ```
- [ ] Migrer `window.QuranReview.state` vers `StateManager.get/set`
- [ ] S'assurer de la rétrocompatibilité : `state.currentUser` reste accessible
- [ ] Tests PBT : `set(k, v)` → `get(k) === v` (round-trip, 100 itérations)
- [ ] Tests PBT : observer notifié exactement 1 fois par `set()`

---

### T20 — Éliminer dépendances circulaires
- **Req :** Req 1 (AC 7)
- **Priorité :** 🟡 Moyenne
- **Effort :** 1 jour
- **Dépendances :** T15

**Implémentation :**
- [ ] `npx madge --circular frontend/src/` — identifier les cycles
- [ ] Corriger chaque cycle : extraire la dépendance partagée dans un module tiers
- [ ] Ajouter règle ESLint `import/no-cycle` pour prévenir les régressions
- [ ] Documenter le graphe de dépendances dans `docs/module-dependencies.md`

---

### T21 — Service Worker : stratégies de cache avancées
- **Req :** Req 4 (AC 7-8), Req 6 (AC 16-17)
- **Priorité :** 🟡 Moyenne
- **Effort :** 2 jours
- **Dépendances :** T14

**Implémentation :**
- [ ] Revoir `frontend/sw.js` — stratégie cache-first pour JS/CSS/fonts
- [ ] Ajouter stale-while-revalidate (5 min TTL) pour réponses API Supabase
- [ ] Ajouter queue offline : stocker les mutations en attente dans IndexedDB
- [ ] Sync offline → online : rejouer la queue quand `navigator.onLine` repasse à `true`
- [ ] Tester : mettre l'app hors-ligne, soumettre une action, remettre en ligne → action rejouée

---

### T22 — Optimisation bundle et preload
- **Req :** Req 4 (AC 5-6, 11-12)
- **Priorité :** 🟡 Moyenne
- **Effort :** 1 jour
- **Dépendances :** aucune

**Implémentation :**
- [ ] Ajouter `<link rel="preload">` dans `index.html` pour CSS critique et police
- [ ] Ajouter `loading="lazy"` sur toutes les images non-critiques
- [ ] Audit taille des modules lazy-loadés (objectif < 50KB chacun)
- [ ] Vérifier que Vercel compresse en gzip/brotli (headers `Content-Encoding`)

---

## Phase 4 : Features

### T23 — Notifications push (correction + complétion) ✅ (partiel)
- **Req :** Req 6 (AC 1-5)
- **Statut :** Service client + Edge Function + sw.js fait (T5)
- **Restant :**
  - [ ] Tester le flow complet : étudiant soumet → enseignant reçoit push
  - [ ] Tester le flow : tâche assignée → étudiant reçoit push
  - [ ] Graceful degradation : afficher message si navigateur ne supporte pas Web Push

---

### T24 — Export / Import données JSON
- **Req :** Req 6 (AC 10-12)
- **Priorité :** 🟡 Moyenne
- **Effort :** 2 jours
- **Dépendances :** T19

**Implémentation :**
- [ ] Créer `frontend/src/services/dataExport.js` :
  - `exportUserData(userId)` — tâches, soumissions, points, hifz → `{ version, exportedAt, data }`
  - `importUserData(jsonBlob)` — valide le format, importe dans Supabase
- [ ] Tests PBT : `parse(serialize(userData)) deepEqual userData` (round-trip)
- [ ] Ajouter bouton "Exporter mes données" dans `ProfilPage.js` (onglet Paramètres)
- [ ] Ajouter bouton "Importer" avec `<input type="file" accept=".json">`
- [ ] Valider format import avant écriture (schéma JSON strict)

---

### T25 — Chart.js analytics ✅
- **Req :** Req 6 (AC 13-15)
- **Statut :** Graphe 30j points fait (T7)
- **Restant :**
  - [ ] Ajouter graphe statistiques par sourate dans ProfilPage
  - [ ] Ajouter indicateur streak journalier animé sur dashboard étudiant

---

### T26 — Calendrier hebdomadaire ✅
- **Req :** Req 6 (AC 6)
- **Statut :** Fait (T6)

---

### T27 — i18n multi-langue (AR / FR / EN)
- **Req :** Req 5 (AC 14-16)
- **Priorité :** 🟢 Basse
- **Effort :** 4 jours
- **Dépendances :** T19

**Implémentation :**
- [ ] Créer `frontend/src/core/i18n.js` — dictionnaire `{ ar, fr, en }`, `t(key)`, `setLocale(lang)`, `detectLocale()`
- [ ] Créer `frontend/src/locales/ar.js`, `fr.js`, `en.js` avec toutes les chaînes UI
- [ ] Détecter langue navigateur au premier chargement (`navigator.language`)
- [ ] Persister le choix en localStorage
- [ ] Ajouter sélecteur langue dans `ProfilPage.js` (onglet Paramètres)
- [ ] Remplacer progressivement les chaînes Arabic hardcodées par `t('key')`
- [ ] RTL auto : basculer `document.dir` selon la locale

---

## Phase 5 : Polish

### T28 — Audit accessibilité WCAG 2.1 AA
- **Req :** Req 5 (AC 7-13)
- **Priorité :** 🟡 Moyenne
- **Effort :** 3 jours
- **Dépendances :** T11

**Implémentation :**
- [ ] `npm i -D axe-core @axe-core/playwright`
- [ ] Ajouter test Playwright axe sur chaque page principale
- [ ] Corriger les violations : labels ARIA manquants sur boutons icône-seulement
- [ ] Ajouter `role`, `aria-label`, `aria-expanded` sur tous les modaux
- [ ] Implémenter `focus-trap` dans les modaux (Tab reste dans le modal)
- [ ] Ajouter lien "aller au contenu" (`skip-to-content`) en haut du `index.html`
- [ ] Vérifier contraste 4.5:1 avec outil Lighthouse (coriger si < seuil)
- [ ] Navigation clavier complète : Tab, Entrée, Échap fonctionnels partout

---

### T29 — Micro-animations et transitions de pages
- **Req :** Req 5 (AC 3-4), Req 10 (AC 5-6, 15-16)
- **Priorité :** 🟢 Basse
- **Effort :** 2 jours
- **Dépendances :** T28

**Implémentation :**
- [ ] Ajouter transition `fade + slide` entre pages dans `router.js` (250ms ease)
- [ ] Ajouter animation stagger sur les listes d'items (cards élèves, tâches)
- [ ] Animer le compteur de streak quand il augmente (`@keyframes pulse`)
- [ ] Micro-interaction boutons : scale 0.97 au clic, rebound 1.0
- [ ] Transition thème clair/sombre : 300ms ease sur toutes les CSS custom properties
- [ ] Respecter `prefers-reduced-motion` : désactiver les animations si paramètre OS actif

---

### T30 — Onboarding interactif nouveaux utilisateurs
- **Req :** Req 5 (AC 6)
- **Priorité :** 🟢 Basse
- **Effort :** 2 jours
- **Dépendances :** T19

**Implémentation :**
- [ ] Créer `frontend/src/components/OnboardingModal.js` — 3 étapes max
  - Étape 1 : Bienvenue + rôle
  - Étape 2 : Tour rapide de la navigation
  - Étape 3 : Première action (créer une tâche / faire une révision)
- [ ] Déclencher uniquement si `localStorage.getItem('onboarded')` est null
- [ ] Marquer `onboarded = true` à la fin ou si l'utilisateur ferme
- [ ] Adapter le contenu selon le rôle (`student` / `teacher`)

---

### T31 — Design avancé : glassmorphism + neumorphism
- **Req :** Req 10 (AC 11-14)
- **Priorité :** 🟢 Basse
- **Effort :** 2 jours
- **Dépendances :** T29

**Implémentation :**
- [ ] Réviser les overlays modaux → glassmorphism (`backdrop-filter: blur(20px)`, `background: rgba(...)`)
- [ ] Cards élevées → neumorphism léger (double shadow inset/outset)
- [ ] Système d'élévation shadows : `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`
- [ ] Tester la lisibilité en dark mode (glassmorphism + texte arabe)

---

### T32 — Monitoring Sentry + documentation finale
- **Req :** Req 7 (AC 10-11), Req 8 (AC 12, 14-15)
- **Priorité :** 🟢 Basse
- **Effort :** 2 jours
- **Dépendances :** T14

**Implémentation :**
- [ ] Intégrer Sentry SDK dans `main.js` (DSN en variable d'env Vercel)
- [ ] Capturer les erreurs non gérées + rejets de Promise
- [ ] Enrichir les breadcrumbs : `user_id`, `role`, `page` dans chaque event
- [ ] Documenter les endpoints Supabase dans `docs/api-reference.md`
- [ ] Documenter le schéma DB final dans `docs/database-schema.md`
- [ ] Mettre à jour `README.md` : setup local, variables d'env, architecture

---

## Bugs connus à corriger (hors phases)

### BX1 — CSP spec Kiro incorrecte ⚠️
- **Fichier à corriger :** `design-security-performance.md` ligne 34-37
- **Problème :** La spec liste `cdn.islamic.network` mais le projet utilise `everyayah.com` et `download.quranicaudio.com`
- **Action :** Corriger dans la spec ET implémenter la bonne CSP dans T16

### BX2 — `tasks.md` références circulaires potentielles
- À valider lors de T20 (audit `madge`)

---

## Critères de validation globale (DoD — Definition of Done)

Avant de marquer le projet comme "Phase X complète" :

- [ ] CI verte (tests + lint + E2E)
- [ ] Coverage ≥ 80% sur services et core
- [ ] Lighthouse Performance ≥ 90
- [ ] LCP < 2.5s, FID < 100ms, CLS < 0.1
- [ ] Zéro erreur ESLint
- [ ] Zéro violation axe-core critique
- [ ] CSP active sans erreurs console
- [ ] Push notifications testées end-to-end
- [ ] Documentation à jour (`docs/`)
