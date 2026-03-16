# QuranReview — Guide Claude (projet)

## Architecture du projet

| Déploiement | Fichiers | URL | Usage |
|-------------|----------|-----|-------|
| **Frontend Vercel** (prod) | `frontend/` | https://quranreview-frontend.vercel.app | Site live actif |
| **Backend Vercel** (prod) | `backend/` | https://quranreview-api.vercel.app | API Django serverless |
| **Dev local** (port 3456) | `frontend/` | http://localhost:3456 | python http.server → API Vercel |
| **Dev local** (port 80) | Docker Compose | http://localhost:80 | nginx + Django + PostgreSQL |

> ✅ Branche active : **`main`** — worktree local : `.claude/worktrees/main-local/`

---

## Stack technique

- **Frontend** : ES Modules natifs, `core/`, `services/`, `pages/`, `components/` — Vercel
- **Backend** : Django 4.x + DRF, serverless Vercel via `api/index.py` (WSGI)
- **Auth** : JWT (SimpleJWT) — endpoint : `/api/auth/token/` (**PAS** `/api/auth/login/` → 404)
- **Base de données** : PostgreSQL Supabase — Transaction Pooler `aws-1-eu-west-1.pooler.supabase.com:6543`
- **Stockage audio** : Cloudinary (`django-cloudinary-storage`) — upload auto sur POST `/api/submissions/`
- **Nav** : `NavManager.js` — navigation dynamique par rôle (top nav + bottom bar mobile)

---

## Lancer l'application

### Dev frontend rapide (port 3456 → API Vercel prod)
```bash
cd .claude/worktrees/main-local
python -m http.server 3456 --directory frontend
# http://localhost:3456
# ⚠️ Port 3000 bloqué par Docker Desktop sur cette machine → utiliser 3456
```

### Dev full-stack Docker (port 80, API locale)
```bash
cd .claude/worktrees/main-local
docker-compose up --build
# Frontend → http://localhost:80
# Backend API → http://localhost:8000
```

### Production
```bash
# Déploiement automatique sur push vers main (GitHub → Vercel)
```

---

## Structure `frontend/src/` (ES Modules)

```
frontend/
├── index.html              # Shell HTML — nav injectée par NavManager
├── style.css               # Styles de base
├── style-pro.css           # Styles Pro (glassmorphism, gradients)
├── style-pro-fixes.css     # Corrections et overrides
├── src/
│   ├── main.js             # Point d'entrée + façade window.QuranReview
│   ├── core/
│   │   ├── config.js       # API URL auto (Vercel prod / Docker / localhost)
│   │   ├── router.js       # Routes + setActiveTab(NavManager)
│   │   ├── NavManager.js   # ⭐ Nav dynamique par rôle (top + bottom bar)
│   │   ├── NavManager.css  # Bottom bar mobile + touch targets
│   │   ├── state.js        # État global
│   │   ├── ui.js           # Notifications, date
│   │   └── logger.js       # Logger centralisé
│   ├── components/
│   │   ├── AudioPlayer.js
│   │   ├── AuthModal.js
│   │   ├── AudioRecordModal.js
│   │   └── UserEditModal.js
│   ├── services/
│   │   ├── auth.js         # Login/logout + buildNav() après login
│   │   ├── tasks.js
│   │   ├── competition.js
│   │   └── hifz.js
│   └── pages/
│       ├── HomePage.js     # Landing (visiteur) + Dashboards (étudiant/prof/admin)
│       ├── HomePage.css
│       ├── HifzPage.js     # Mémorisation (🎭 wضع الحفظ)
│       ├── RevisionPage.js # = WardPage re-exporté (muraja'a)
│       ├── SoumissionPage.js # = MyTasksPage re-exporté (envoi audio)
│       ├── ProfilPage.js   # Fusion ProgressPage + SettingsPage (onglets)
│       ├── TeacherPage.js  # Tableau de bord enseignant
│       ├── AdminPage.js    # Gestion utilisateurs admin
│       └── [autres pages legacy avec alias rétrocompat]
```

---

## Navigation par rôle (`NavManager.js`)

### 🎓 Étudiant (`student`)
| Icône | Label | Route | Note |
|-------|-------|-------|------|
| 🏠 | الرئيسية | `home` | Dashboard étudiant |
| 📖 | الحفظ | `hifz` | Mémorisation |
| 🎧 | **إرسال** | `soumettre` | **Bouton central** — envoi audio |
| 🔁 | المراجعة | `revision` | Muraja'a (WardPage) |
| 👤 | حسابي | `profil` | Progression + Paramètres |

### 👨‍🏫 Professeur (`teacher`)
| Icône | Label | Route | Note |
|-------|-------|-------|------|
| 🏠 | الرئيسية | `home` | Dashboard enseignant |
| 📋 | الواجبات | `devoirs` | Créer/gérer tâches |
| 🎧 | **التسليمات** | `soumissions` | **Bouton central** — écoute + notation |
| 👥 | الطلاب | `eleves` | Liste + progression élèves |
| 👤 | حسابي | `profil` | Paramètres |

### ⚙️ Admin
| Icône | Label | Route |
|-------|-------|-------|
| 🏠 | لوحة | `admin` |
| 👥 | المستخدمون | `admin-users` |
| 🏫 | **الفصول** | `admin-classes` |
| 📊 | الإحصاء | `admin-stats` |
| ⚙️ | الإعدادات | `profil` |

---

## Rôles utilisateurs

| Rôle | Dashboard | Accès |
|------|-----------|-------|
| `student` | `home` (dashboard étudiant) | hifz, soumettre, revision, profil |
| `teacher` | `home` (dashboard enseignant) | devoirs, soumissions, eleves, profil |
| `admin` / `is_superuser` | `admin` | admin-users, admin-classes, admin-stats |

---

## API Backend clés

```
POST /api/auth/token/          → JWT login ✅ (NE PAS utiliser /api/auth/login/ → 404)
POST /api/auth/token/refresh/  → refresh token
GET  /api/auth/me/             → profil utilisateur courant
GET  /api/tasks/               → liste des tâches
POST /api/tasks/               → créer tâche (teacher)
POST /api/submissions/         → soumettre audio (student) — stocké sur Cloudinary
GET  /api/competition/         → données compétition
GET  /api/hifz/                → progression hifz
GET  /api/admin/users/         → liste utilisateurs (admin)
```

---

## Déploiement Vercel

```bash
# Frontend : projet Vercel séparé → frontend/vercel.json (rewrites SPA)
# Backend  : projet Vercel séparé → backend/vercel.json (rewrites → api/index.py)
# Build command backend : pip install -r requirements.txt && python manage.py collectstatic --noinput
# ⚠️ Ne PAS mettre de clé "builds" dans vercel.json → supprime le build command
```

Variables d'env Vercel (backend) : `DATABASE_URL`, `CLOUDINARY_URL`, `SECRET_KEY`, `DEBUG=False`

CORS autorisé : `*.vercel.app`, `localhost:*` (tous ports — regex dans settings.py)

---

## Gotchas

- **Nav** : `NavManager.buildNav(role)` appelé après login/logout — sinon la nav garde l'ancien rôle
- **Façade** : toute nouvelle fonction de page doit être exportée ET ajoutée à `window.QuranReview` dans `main.js`
- **GSAP** : loading screen avec timeout fallback 5s — peut bloquer le screenshot tool (page jamais "idle")
- **ES Module cache** : par origine → ouvrir un **nouvel onglet** (pas reload) pour forcer rechargement des modules modifiés
- **Port local** : port 3000 bloqué par Docker Desktop → utiliser **3456**
- **Supabase** : utiliser Transaction Pooler (`port 6543`) — connexion directe IPv6-only incompatible Vercel
- **`dj-database-url.parse()`** : NE PAS passer `ssl_require=True` → crash CI avec `DATABASE_URL=sqlite://`
- **Vercel serverless** : pas de filesystem persistant → fichiers uploadés sur Cloudinary obligatoire
- **tasks.js** : seul `loadTasksFromApi` utilisé — `handleCreateTask`, `handleDeleteAllTasks`, `switchTaskTab` sont du code mort
- **Service Worker** : toujours `return` après `event.respondWith()` — double appel = erreur silencieuse
- **Audit façade** : `grep -rn "QuranReview\." src/ --include="*.js" | grep -oE "QuranReview\.[a-zA-Z_]+" | sort -u`

---

## Docs utiles

| Doc | Emplacement |
|-----|-------------|
| Plan refonte navigation | `docs/plans/2026-03-15-navigation-refonte.md` |
| Design refonte navigation | `docs/plans/2026-03-15-navigation-refonte-design.md` |
| Plan refactoring ES modules | `docs/plans/2026-03-12-frontend-refactoring.md` |
| Guide déploiement | `docs/deployment.md` |
| Audio CDN/local | `docs/audio-setup.md` |
