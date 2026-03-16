# QuranReview — Guide Claude (projet)

## Architecture du projet

| Déploiement | URL | Usage |
|-------------|-----|-------|
| **Frontend Vercel** | https://quranreview-frontend.vercel.app | Site live (ES Modules statiques) |
| **Backend Vercel** | https://quranreview-api.vercel.app | API Django serverless (production) |
| **Dev local** | localhost:80 / localhost:8000 | Docker Compose (nginx + Django + PostgreSQL) |

---

## Stack technique

- **Frontend** : ES Modules natifs, organisé en `core/`, `services/`, `pages/`, `components/` — déployé sur Vercel
- **Backend** : Django 4.x + DRF — déployé en serverless Vercel via `api/index.py` (WSGI)
- **Auth** : JWT (SimpleJWT) — `/api/auth/token/` (pas `/api/auth/login/`)
- **Base de données** : PostgreSQL Supabase — Transaction Pooler `aws-1-eu-west-1.pooler.supabase.com:6543`
- **Stockage audio** : Cloudinary via `django-cloudinary-storage` — upload auto sur POST `/api/submissions/`
- **Dev local** : Docker Compose (nginx + Django + PostgreSQL)

---

## Lancer l'application

### Production Vercel
```bash
# Déploiement automatique sur push vers main
# Frontend : https://quranreview-frontend.vercel.app
# Backend  : https://quranreview-api.vercel.app
```

### App Docker (développement)
```bash
docker-compose up --build
# Frontend → http://localhost:80
# Backend API → http://localhost:8000
```

### Frontend seul (test rapide)
```bash
cd frontend
python -m http.server 3000
# Ouvrir http://localhost:3000
```

---

## Structure `frontend/src/` (ES Modules)

```
frontend/
├── index.html          # Shell mince (213 lignes)
├── src/
│   ├── main.js         # Point d'entrée + façade window.QuranReview
│   ├── core/           # logger, config, state, router, ui
│   ├── components/     # AudioPlayer, AuthModal, AudioRecordModal, UserEditModal
│   ├── services/       # auth, tasks, competition, hifz
│   └── pages/          # HomePage, WardPage, MemorizationPage, ProgressPage,
│                       # SettingsPage, CompetitionPage, HifzPage, MyTasksPage,
│                       # TeacherPage, AdminPage
└── Dockerfile
```

> `window.QuranReview` est une façade globale exposant toutes les fonctions de page
> pour les handlers `onclick` inline dans le HTML.

---

## Audio

Les fichiers MP3 (~1.6 GB, 114 sourates) ne sont pas dans le repo (limite GitHub 100MB).

| Option | Usage |
|--------|-------|
| **CDN Quran.com** (défaut) | `https://audio.qurancdn.com/audio/ar.abdul_basit_mujawwad/001.mp3` |
| **Local** | Dossier `audio/abdul_basit/001.mp3` … `114.mp3` — non commité |

---

## Rôles utilisateurs

| Rôle | Accès |
|------|-------|
| `student` | Mémorisation, Ward, Hifz, Competition, MyTasks |
| `teacher` | Page Teacher + gestion tâches/soumissions |
| `admin` | Gestion complète |

---

## API Backend clés

```
POST /api/auth/token/          → JWT login (NE PAS utiliser /api/auth/login/ → 404)
POST /api/auth/token/refresh/  → refresh token
GET  /api/tasks/               → liste des tâches
POST /api/tasks/               → créer tâche (teacher)
POST /api/submissions/         → soumettre audio (student) — stocké sur Cloudinary
GET  /api/competition/         → données compétition
GET  /api/hifz/                → progression hifz
GET  /api/admin/users/         → liste utilisateurs (admin)
```

---

## Déploiement (Vercel)

```bash
# Frontend : projet Vercel séparé → frontend/vercel.json (rewrites SPA)
# Backend  : projet Vercel séparé → backend/vercel.json (rewrites → api/index.py)
# Build command backend : pip install -r requirements.txt && python manage.py collectstatic --noinput
# ⚠️ Ne PAS mettre de clé "builds" dans vercel.json → supprime le build command → collectstatic ne tourne pas
```

Variables d'env Vercel (backend) : `DATABASE_URL`, `CLOUDINARY_URL`, `SECRET_KEY`, `DEBUG=False`

---

## Gotchas

- `window.QuranReview` doit être défini avant tout `onclick` inline → `main.js` doit charger en premier
- GSAP loading screen : animation inline dans `<head>` de `frontend/index.html`, timeout fallback 5s
- PostgreSQL : variables d'env dans `.env` à la racine (non commité)
- Supabase : utiliser le **Transaction Pooler** (`port 6543`) — la connexion directe est IPv6-only (incompatible Vercel)
- `dj-database-url.parse()` : NE PAS passer `ssl_require=True` → crash en CI avec `DATABASE_URL=sqlite://`
- Façade `window.QuranReview` : toute nouvelle fonction de page doit être exportée ET ajoutée à la façade dans `main.js`
- Login endpoint : `/api/auth/token/` (POST) — ne pas tester avec `/api/auth/login/` (retourne 404)
- Vercel serverless : pas de filesystem persistant → les fichiers uploadés doivent aller sur Cloudinary
- `tasks.js` : seul `loadTasksFromApi` est importé — les autres fonctions (`handleCreateTask`, `handleDeleteAllTasks`, `switchTaskTab`) sont du code mort ; TeacherPage/MyTasksPage ont leurs propres versions, ne pas déboguer dans tasks.js
- Service Worker (`sw.js`) : toujours `return` après chaque `event.respondWith()` — un double appel dans le même handler cause une erreur runtime silencieuse
- Audit façade : pour trouver les fonctions manquantes de `window.QuranReview` : `grep -rn "QuranReview\." src/ --include="*.js" | grep -oE "QuranReview\.[a-zA-Z_]+" | sort -u` puis comparer avec les clés dans `main.js`

---

## Docs utiles

| Doc | Emplacement |
|-----|-------------|
| Plan refactoring ES modules | `docs/plans/2026-03-12-frontend-refactoring.md` |
| Design refactoring | `docs/plans/2026-03-12-frontend-refactoring-design.md` |
| Guide déploiement | `docs/deployment.md` |
| Audio CDN/local | `docs/audio-setup.md` |
