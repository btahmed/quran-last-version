# QuranReview - Guide de Deploiement

> Apres la migration Django -> Supabase (commit `60fd039`) : plus de backend Django. Architecture Supabase (Auth + DB + Storage) + frontend statique deploye sur Vercel.

## Resume du Projet

| Composant             | Statut      | Emplacement                                 |
| --------------------- | ----------- | ------------------------------------------- |
| Frontend (ES Modules) | ✅ OK       | `frontend/`                                 |
| Backend               | ❌ Supprime | Remplace par Supabase (Auth + DB + Storage) |
| Deploiement prod      | ✅ OK       | Vercel — auto-deploy sur push vers `main`   |

---

## 1. DEV LOCAL

**Emplacement du projet :** `C:\Users\ahmad\Dev\Active\quran-last-version`

**Option A — Python (port 3000) :**

```bash
cd frontend
python -m http.server 3000
# http://localhost:3000
```

**Option B — npm (port 3456) :**

```bash
npm run serve:frontend
# http://localhost:3456
```

Dans les deux cas le frontend parle au projet Supabase cloud. L'URL et la cle anon sont definies en fallback dans `frontend/index.html` (`window.__SUPABASE_URL__`, `window.__SUPABASE_ANON_KEY__`).

**Comptes de test :** voir `README.md`.

---

## 2. PRODUCTION (Vercel)

- **Repository :** https://github.com/btahmed/quran-last-version
- **Frontend :** https://quranreview-frontend.vercel.app
- **Deploiement :** automatique a chaque push sur `main` (GitHub -> Vercel)

```bash
git push origin main
```

> ⚠️ Un push sur `main` met le site live a jour : verifier la checklist de `CLAUDE.md` avant.

### Variables d'environnement

Valeurs Supabase definies dans le Dashboard Vercel (Project Settings > Environment Variables), avec le fallback de `frontend/index.html` pour le dev local.

### Config Vercel

`frontend/vercel.json` — rewrites SPA + headers de securite (CSP, X-Frame-Options, etc.). Si une nouvelle source audio/video est ajoutee, la declarer dans `media-src` (voir gotchas CSP de `CLAUDE.md`).

---

## 3. STRUCTURE DES FICHIERS

```
quran-last-version/
├── frontend/                 → Deploye sur Vercel (statique)
│   ├── index.html            → Shell SPA + variables Supabase (fallback dev)
│   ├── vercel.json           → Rewrites SPA + headers securite
│   ├── sw.js                 → Service Worker PWA
│   └── src/
│       ├── main.js           → Point d'entree + facade window.QuranReview
│       ├── core/             → config, router, NavManager, state, ui, logger
│       ├── components/       → AudioPlayer, AuthModal, AudioRecordModal, UserEditModal
│       ├── services/         → supabase-*.js, auth, tasks, competition, hifz,
│       │                       offline-queue, push-notifications, notification-center
│       └── pages/            → HomePage, HifzPage, WardPage/RevisionPage, SoumissionPage,
│                               ProfilPage, TeacherPage, AdminPage, NotificationsPage, ...
├── supabase/                 → Migrations / config Supabase
├── tests/                    → Tests unitaires (vitest) + e2e (Playwright)
├── docs/                     → Documentation (ce fichier, plans/)
├── CLAUDE.md                 → Guide architecture pour Claude Code
└── README.md                 → Presentation, stack, tables Supabase
```

---

## 4. TABLES SUPABASE

Voir `README.md` (section "Tables Supabase") : `profiles`, `tasks`, `submissions`, `classes`, `class_members`, `points_log`, `progress`, vue `leaderboard`, et bucket Storage `audio-submissions`.

---

## 5. DEPANNAGE

| Probleme                    | Solution                                                                                                 |
| --------------------------- | -------------------------------------------------------------------------------------------------------- |
| Port 3000 occupe            | Utiliser `npm run serve:frontend` (port 3456)                                                            |
| Module JS pas a jour        | Ouvrir un **nouvel onglet** (le cache ES Module est par origine) ou Ctrl+F5                              |
| Service Worker ancien       | DevTools > Application > Service Workers > Unregister                                                    |
| Audio muet sans erreur JS   | Verifier `media-src` dans `frontend/vercel.json`                                                         |
| Signed URL Supabase expiree | Ne jamais stocker une signed URL en DB : stocker le `path` et regenerer via `createSignedUrl()` (max 1h) |

---

## Resume URLs

| Environnement       | URL                                           |
| ------------------- | --------------------------------------------- |
| Dev local (Python)  | http://localhost:3000                         |
| Dev local (npm)     | http://localhost:3456                         |
| Production (Vercel) | https://quranreview-frontend.vercel.app       |
| Repository          | https://github.com/btahmed/quran-last-version |
