# QuranReview — Guide Claude (projet)

> ✅ Migration Django → Supabase terminée (commit `60fd039`) : plus de backend Django. Architecture Supabase (Auth + DB + Storage) + frontend statique Vercel.

## Architecture du projet

| Déploiement                | Fichiers    | URL                                     | Usage                                    |
| -------------------------- | ----------- | --------------------------------------- | ---------------------------------------- |
| **Frontend Vercel** (prod) | `frontend/` | https://quranreview-frontend.vercel.app | Site live actif                          |
| **Backend**                | —           | —                                       | Supprimé — remplacé par Supabase         |
| **Dev local**              | `frontend/` | http://localhost:3000                   | `python -m http.server` → Supabase cloud |
| **Dev local** (alternatif) | `frontend/` | http://localhost:3456                   | `npm run serve:frontend`                 |

> ✅ Branche active : **`main`** — projet : `C:\Users\ahmad\Dev\Active\quran-last-version`

---

## Stack technique

- **Frontend** : ES Modules natifs, `core/`, `services/`, `pages/`, `components/` — Vercel (statique)
- **Auth** : Supabase Auth (email/password)
- **Base de données** : Supabase PostgreSQL — via `supabase-js` (pas de connexion serveur directe)
- **Stockage audio** : Supabase Storage (bucket `audio-submissions`)
- **Nav** : `NavManager.js` — navigation dynamique par rôle (top nav + bottom bar mobile)

---

## Lancer l'application

```bash
cd frontend
python -m http.server 3000
# http://localhost:3000
```

```bash
npm run serve:frontend
# http://localhost:3456 (si le port 3000 est occupé)
```

L'URL et la clé anon Supabase sont dans `frontend/index.html` (`window.__SUPABASE_URL__`, `window.__SUPABASE_ANON_KEY__`).

### Production

```bash
# Déploiement automatique sur push vers main (GitHub → Vercel)
```

---

## Structure `frontend/src/` (ES Modules)

```
frontend/
├── index.html              # Shell HTML — nav injectée par NavManager + variables Supabase
├── style.css               # Styles de base
├── style-pro.css           # Styles Pro (glassmorphism, gradients)
├── style-pro-fixes.css     # Corrections et overrides
├── vercel.json             # Rewrites SPA + headers sécurité (CSP)
├── src/
│   ├── main.js             # Point d'entrée + façade window.QuranReview
│   ├── core/
│   │   ├── config.js       # Config centrale (reliquat `API_BASE_URL` Django, plus utilisé ailleurs)
│   │   ├── router.js       # Routes + setActiveTab(NavManager)
│   │   ├── NavManager.js   # ⭐ Nav dynamique par rôle (top + bottom bar)
│   │   ├── state.js        # État global
│   │   ├── apiCache.js     # Cache des requêtes
│   │   ├── sanitize.js     # escapeHtml & co
│   │   ├── validators.js
│   │   ├── ui.js           # Notifications, date
│   │   └── logger.js       # Logger centralisé
│   ├── components/         # AudioPlayer, AuthModal, AudioRecordModal, UserEditModal,
│   │                       # MemoryOrbit, HifzFocus, WeekCalendar, ClassHealth, StudentRadar, PageBlocks
│   ├── services/
│   │   ├── supabase-client.js       # Client Supabase singleton
│   │   ├── supabase-auth.js         # signIn, signOut, createUser
│   │   ├── supabase-tasks.js        # CRUD tâches
│   │   ├── supabase-submissions.js  # Upload audio, soumissions, corrections
│   │   ├── supabase-admin.js        # Gestion users, classes, étudiants
│   │   ├── supabase-leaderboard.js  # Classement, points
│   │   ├── auth.js                  # Login flow, localStorage, redirection, buildNav() après login
│   │   ├── tasks.js                 # Façade tâches (legacy wrapper)
│   │   ├── competition.js, hifz.js
│   │   ├── offline-queue.js         # File d'attente hors-ligne (soumissions audio)
│   │   └── push-notifications.js, notification-center.js
│   └── pages/
│       ├── HomePage.js     # Landing (visiteur) + Dashboards (étudiant/prof/admin)
│       ├── HifzPage.js     # Mémorisation (🎭 wضع الحفظ)
│       ├── RevisionPage.js # Révision / muraja'a (WardPage)
│       ├── SoumissionPage.js # = MyTasksPage re-exporté (envoi audio)
│       ├── ProfilPage.js   # Fusion ProgressPage + SettingsPage (onglets)
│       ├── TeacherPage.js  # Tableau de bord enseignant (+ teacher/*Section.js)
│       ├── AdminPage.js    # Gestion admin (+ admin/*Section.js)
│       └── [autres pages : Competition, Notifications, Radio… + alias rétrocompat]
```

---

## Navigation par rôle (`NavManager.js`)

### 🎓 Étudiant (`student`)

| Icône | Label     | Route       | Note                             |
| ----- | --------- | ----------- | -------------------------------- |
| 🏠    | الرئيسية  | `home`      | Dashboard étudiant               |
| 📖    | الحفظ     | `hifz`      | Mémorisation                     |
| 🎧    | **إرسال** | `soumettre` | **Bouton central** — envoi audio |
| 🔁    | المراجعة  | `revision`  | Muraja'a (WardPage)              |
| 👤    | حسابي     | `profil`    | Progression + Paramètres         |

### 👨‍🏫 Professeur (`teacher`)

| Icône | Label         | Route         | Note                                   |
| ----- | ------------- | ------------- | -------------------------------------- |
| 🏠    | الرئيسية      | `home`        | Dashboard enseignant                   |
| 📋    | الواجبات      | `devoirs`     | Créer/gérer tâches                     |
| 🎧    | **التسليمات** | `soumissions` | **Bouton central** — écoute + notation |
| 👥    | الطلاب        | `eleves`      | Liste + progression élèves             |
| 👤    | حسابي         | `profil`      | Paramètres                             |

### ⚙️ Admin

| Icône | Label      | Route           |
| ----- | ---------- | --------------- |
| 🏠    | لوحة       | `admin`         |
| 👥    | المستخدمون | `admin-users`   |
| 🏫    | **الفصول** | `admin-classes` |
| 📊    | الإحصاء    | `admin-stats`   |
| ⚙️    | الإعدادات  | `profil`        |

---

## Rôles utilisateurs

| Rôle                     | Dashboard                     | Accès                                   |
| ------------------------ | ----------------------------- | --------------------------------------- |
| `student`                | `home` (dashboard étudiant)   | hifz, soumettre, revision, profil       |
| `teacher`                | `home` (dashboard enseignant) | devoirs, soumissions, eleves, profil    |
| `admin` / `is_superuser` | `admin`                       | admin-users, admin-classes, admin-stats |

---

## Accès aux données (Supabase)

Plus d'API REST maison : tout passe par les services `supabase-*.js` (client `supabase-js`).

| Table / vue     | Description                                                                  |
| --------------- | ---------------------------------------------------------------------------- |
| `profiles`      | Utilisateurs (id uuid, username, role, first_name, last_name, phone)         |
| `tasks`         | Tâches (type: hifz/muraja/tilawa, assigned_by, user_id, surah, ayah, points) |
| `submissions`   | Soumissions audio (task_id, student_id, audio_url, status, awarded_points)   |
| `classes`       | Classes (name, teacher_id, time_slot, max_students)                          |
| `class_members` | Relation classe ↔ étudiant (class_id, student_id)                            |
| `points_log`    | Historique de points (student_id, delta, reason, submission_id)              |
| `progress`      | Progression mémorisation (user_id, surah, ayah, accuracy, duration)          |
| `leaderboard`   | Vue SQL : classement par total_points                                        |

**Storage Bucket :** `audio-submissions` — path : `{user_id}/{task_id}/{uuid}.webm`

---

## Déploiement Vercel

```bash
# Frontend statique uniquement → frontend/vercel.json (rewrites SPA + headers sécurité)
```

CSP : voir `frontend/vercel.json` — `connect-src` / `media-src` autorisent `*.supabase.co`, `wss://*.supabase.co`, `everyayah.com`, `download.quranicaudio.com`.

---

## Gotchas

- **Nav** : `NavManager.buildNav(role)` appelé après login/logout — sinon la nav garde l'ancien rôle
- **Façade** : toute nouvelle fonction de page doit être exportée ET ajoutée à `window.QuranReview` dans `main.js`
- **GSAP** : loading screen avec timeout fallback 5s — peut bloquer le screenshot tool (page jamais "idle")
- **ES Module cache** : par origine → ouvrir un **nouvel onglet** (pas reload) pour forcer rechargement des modules modifiés
- **Port local** : `python -m http.server 3000` ; si le port est occupé → `npm run serve:frontend` (3456)
- **tasks.js** : seul `loadTasksFromApi` utilisé — `handleCreateTask`, `handleDeleteAllTasks`, `switchTaskTab` sont du code mort
- **Service Worker** : toujours `return` après `event.respondWith()` — double appel = erreur silencieuse
- **Audit façade** : `grep -rn "QuranReview\." src/ --include="*.js" | grep -oE "QuranReview\.[a-zA-Z_]+" | sort -u`
- **GSAP CDN** : toujours garder `typeof gsap !== 'undefined'` avant tout appel GSAP — si le CDN est bloqué (ad-blocker), la page doit quand même s'afficher
- **Signed URLs Supabase** : NE JAMAIS stocker une signed URL dans la DB — elle expire. Stocker le **path** Storage et générer une signed URL fraîche à l'affichage via `createSignedUrl(path, 3600)`. ⚠️ Ce projet Supabase plafonne les signed URLs à **1 heure** max (même si on demande 7 jours). Pour migrer les anciennes URLs expirées déjà en DB, extraire le path via `/\/object\/sign\/audio-submissions\/(.+?)\?/` et régénérer
- **MediaRecorder format** : NE PAS coder en dur `mimeType: 'audio/webm'` — Safari/iOS ne supporte que `audio/mp4`. Toujours détecter avec `MediaRecorder.isTypeSupported()` et laisser le navigateur choisir
- **Audio src HTML** : NE PAS mettre `type="audio/webm"` dans `<source>` — ça bloque le navigateur si le format réel est différent. Utiliser `<audio src="...">` sans `type` ou avec plusieurs `<source>`
- **URLs dans HTML** : toujours valider que l'URL commence par `https://` avant injection dans un attribut `src` — protège contre les URIs `javascript:`. Passer ensuite par `escapeHtml()` pour l'attribut
- **CSP media-src** : quand tu ajoutes une nouvelle source audio/vidéo, la déclarer dans `media-src` de `frontend/vercel.json`. Supabase Storage → `*.supabase.co` ; blob URLs (preview MediaRecorder) → `blob:` ; Quran CDN → `everyayah.com download.quranicaudio.com`. L'oubli = audio muet sans message d'erreur visible côté JS

---

## Checklist avant de livrer une nouvelle feature

> ⚠️ À vérifier systématiquement avant tout push vers `main`

### Données temporaires / TTL

- [ ] Si tu stockes quelque chose avec une expiration (signed URL, token, cache), as-tu prévu le renouvellement ?
- [ ] Les URLs signées sont stockées en DB ? → **Non** — stocker le path, générer l'URL à l'affichage

### Compatibilité navigateurs

- [ ] La feature utilise une API Web (MediaRecorder, Notification, IndexedDB, etc.) ? → Vérifier la compatibilité Safari/iOS
- [ ] Les formats de fichiers sont détectés dynamiquement (pas codés en dur) ?
- [ ] Les CDN externes (GSAP, Chart.js) ont un fallback si bloqués ?

### Sécurité (en plus des règles globales)

- [ ] Toute URL externe injectée dans un attribut HTML est validée (`https://`) et échappée ?
- [ ] Les données utilisateur affichées passent par `escapeHtml()` ou `textContent` ?

### Test du flow complet

- [ ] Le flow de bout en bout a été testé manuellement (pas juste des tests unitaires) ?
- [ ] Testé sur Chrome ET Safari (ou simulé iOS) pour les features audio/media ?

---

## Docs utiles

| Doc                         | Emplacement                                          |
| --------------------------- | ---------------------------------------------------- |
| Plan refonte navigation     | `docs/plans/2026-03-15-navigation-refonte.md`        |
| Design refonte navigation   | `docs/plans/2026-03-15-navigation-refonte-design.md` |
| Plan refactoring ES modules | `docs/plans/2026-03-12-frontend-refactoring.md`      |
| Fix Vercel/Supabase         | `docs/plans/2026-04-10-vercel-supabase-fix.md`       |
| Guide déploiement           | `docs/deployment.md`                                 |
