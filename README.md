# QuranReview 🕌

Application professionnelle pour la mémorisation et révision du Coran — PWA avec backend Django.

## Déploiements

| | URL | Stack |
|-|-----|-------|
| **Frontend** | https://quranreview-frontend.vercel.app | Vercel (ES Modules statiques) |
| **API** | https://quranreview-api.vercel.app | Vercel (Django serverless) |

## Stack technique

| Couche | Technologie |
|--------|-------------|
| **Frontend** | Vanilla JS, ES Modules natifs, CSS, PWA |
| **Backend** | Django 4.x + Django REST Framework |
| **Auth** | JWT (SimpleJWT) |
| **Base de données** | PostgreSQL — [Supabase](https://supabase.com) |
| **Stockage audio** | [Cloudinary](https://cloudinary.com) |
| **Déploiement** | [Vercel](https://vercel.com) (frontend + backend serverless) |
| **Dev local** | Docker Compose (nginx + Django + PostgreSQL) |

## Fonctionnalités

- 📖 **Mémorisation** — suivi avec répétition espacée
- 🎵 **Ward** — lecteur audio de récitation quotidienne (CDN Quran.com)
- 🧠 **Hifz** — exercices 5 niveaux de difficulté (masquage de mots)
- 🏆 **Compétition** — défis et classements entre étudiants
- 👨‍🏫 **Espace enseignant** — gestion tâches et soumissions audio
- 🎙️ **Soumission audio** — enregistrement navigateur → stockage Cloudinary
- 📊 **Progression** — analytics et historique par étudiant
- 🌙 **Thème** — clair / sombre
- 📱 **PWA** — installable, mode hors-ligne

## Rôles utilisateurs

| Rôle | Accès |
|------|-------|
| `student` | Mémorisation, Ward, Hifz, Compétition, Mes tâches |
| `teacher` | Espace enseignant + gestion tâches/soumissions |
| `admin` | Gestion complète des utilisateurs et données |

## Démarrage en développement

```bash
# Application complète (frontend + backend + DB)
docker-compose up --build
# Frontend → http://localhost:80
# API      → http://localhost:8000

# Frontend seul (test rapide, sans Docker)
cd frontend && python -m http.server 3000
```

## Variables d'environnement

```env
# Backend (.env à la racine)
DATABASE_URL=postgresql://...        # Supabase Transaction Pooler
CLOUDINARY_URL=cloudinary://...      # Stockage audio
SECRET_KEY=...                       # Django secret key
DEBUG=False
ALLOWED_HOSTS=quranreview-api.vercel.app
```

## Structure du projet

```
quran-last-version/
├── frontend/                  # App Vercel (ES Modules natifs)
│   ├── index.html             # Shell principal (SPA)
│   ├── vercel.json            # Config Vercel + rewrites SPA
│   └── src/
│       ├── main.js            # Point d'entrée + façade window.QuranReview
│       ├── core/              # logger, config, state, router, ui
│       ├── components/        # AudioPlayer, AuthModal, AudioRecordModal, ...
│       ├── services/          # auth, tasks, competition, hifz
│       └── pages/             # HomePage, WardPage, MemorizationPage,
│                              # ProgressPage, SettingsPage, CompetitionPage,
│                              # HifzPage, MyTasksPage, TeacherPage, AdminPage
├── backend/                   # Django API (déployé sur Vercel)
│   ├── api/
│   │   └── index.py           # WSGI entry point Vercel
│   ├── vercel.json            # Config Vercel backend
│   ├── quranreview/           # Settings, URLs, WSGI
│   ├── authentication/        # Modèle User personnalisé + JWT
│   └── api/                   # Views DRF (tasks, submissions, competition...)
├── .coderabbit.yaml           # Config CodeRabbit AI review
├── docker-compose.yml         # Dev local
└── docs/                      # Documentation technique
```

## API Backend clés

```
POST /api/auth/token/           → Login JWT
POST /api/auth/token/refresh/   → Refresh token
GET  /api/tasks/                → Liste des tâches
POST /api/tasks/                → Créer une tâche (teacher)
POST /api/submissions/          → Soumettre un audio (student)
GET  /api/competition/          → Données compétition
GET  /api/hifz/                 → Progression hifz
GET  /api/admin/users/          → Liste utilisateurs (admin)
```

## Documentation

- [`CLAUDE.md`](CLAUDE.md) — guide architecture pour Claude Code
- [`docs/deployment.md`](docs/deployment.md) — guide déploiement Vercel
- [`docs/audio-setup.md`](docs/audio-setup.md) — configuration audio (CDN / Cloudinary)
- [`docs/plans/`](docs/plans/) — plans de développement

---
*Made with ❤️ for Quran learners*
