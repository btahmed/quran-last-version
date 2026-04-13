# QuranReview 🕌

Application professionnelle pour la mémorisation et révision du Coran — PWA full Supabase.

## Déploiement

| URL | Stack |
|-----|-------|
| https://quranreview-frontend.vercel.app | Vercel (static ES Modules) |

## Stack technique

| Couche | Technologie |
|--------|-------------|
| **Frontend** | Vanilla JS, ES Modules natifs, CSS, PWA |
| **Auth** | Supabase Auth (email/password) |
| **Base de données** | Supabase PostgreSQL (profiles, tasks, submissions, classes, points_log) |
| **Stockage audio** | Supabase Storage (bucket `audio-submissions`) |
| **Déploiement** | Vercel (frontend statique) |

## Fonctionnalités

- 📖 **Mémorisation** — suivi avec répétition espacée
- 🎵 **Ward** — lecteur audio de récitation quotidienne (CDN Quran.com)
- 🧠 **Hifz** — exercices 5 niveaux de difficulté (masquage de mots)
- 🏆 **Compétition** — défis et classements entre étudiants
- 👨‍🏫 **Espace enseignant** — gestion tâches, soumissions audio, classes
- 🎙️ **Soumission audio** — enregistrement navigateur → Supabase Storage
- 📊 **Progression** — analytics et historique par étudiant
- 🌙 **Thème** — clair / sombre
- 📱 **PWA** — installable, mode hors-ligne

## Rôles utilisateurs

| Rôle | Accès |
|------|-------|
| `student` | Mémorisation, Ward, Hifz, Compétition, Mes tâches, Soumission audio |
| `teacher` | Création tâches, correction soumissions, gestion classes |
| `admin` | Gestion utilisateurs, classes, vue d'ensemble |

## Démarrage en développement

```bash
cd frontend && python -m http.server 3000
# → http://localhost:3000
```

## Variables d'environnement

Les variables Supabase sont définies dans `frontend/index.html` (fallback dev local) et dans Vercel Dashboard (prod) :

```
window.__SUPABASE_URL__      = "https://xxx.supabase.co"
window.__SUPABASE_ANON_KEY__ = "eyJ..."
```

## Structure du projet

```
quran-last-version/
├── frontend/                     # App Vercel (ES Modules natifs)
│   ├── index.html                # Shell SPA + env vars Supabase
│   ├── vercel.json               # Config Vercel + rewrites SPA
│   ├── style.css                 # Design system principal
│   ├── style-pro.css             # Glassmorphism / Neumorphism
│   ├── sw.js                     # Service Worker PWA
│   └── src/
│       ├── main.js               # Point d'entrée + façade window.QuranReview
│       ├── core/                 # logger, config, state, router, ui, apiCache, NavManager
│       ├── components/           # AudioPlayer, AuthModal, AudioRecordModal, UserEditModal
│       ├── services/
│       │   ├── supabase-client.js    # Client Supabase singleton
│       │   ├── supabase-auth.js      # signIn, signOut, createUser
│       │   ├── supabase-tasks.js     # CRUD tâches
│       │   ├── supabase-submissions.js # Upload audio, soumissions, corrections
│       │   ├── supabase-admin.js     # Gestion users, classes, étudiants
│       │   ├── supabase-leaderboard.js # Classement, points
│       │   ├── auth.js               # Login flow, localStorage, redirection
│       │   ├── tasks.js              # Facade tâches (legacy wrapper)
│       │   ├── competition.js        # Logique compétition
│       │   └── hifz.js              # Logique exercices Hifz
│       └── pages/                # HomePage, WardPage, MemorizationPage,
│                                 # TeacherPage, AdminPage, MyTasksPage,
│                                 # CompetitionPage, HifzPage, ProgressPage,
│                                 # SettingsPage, ProfilPage
└── CLAUDE.md                     # Guide architecture pour Claude Code
```

## Tables Supabase

| Table | Description |
|-------|-------------|
| `profiles` | Utilisateurs (username, role, first_name, last_name) |
| `tasks` | Tâches (type: hifz/muraja/tilawa, assigned_by, user_id) |
| `submissions` | Soumissions audio (task_id, student_id, audio_url, status) |
| `classes` | Classes (name, teacher_id) |
| `class_members` | Relation classe ↔ étudiant |
| `points_log` | Historique de points |
| `leaderboard` | Classement |

---
*Made with ❤️ for Quran learners*
