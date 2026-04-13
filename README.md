# QuranReview 🕌

Application professionnelle pour la mémorisation et révision du Coran — PWA full Supabase.

> **✨ Projet nettoyé** — Migration Django → Supabase terminée (commit `60fd039`)  
> **-9,168 lignes** supprimées, **54 fichiers** obsolètes retirés.  
> Architecture 100% Supabase, zéro backend Django.

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

**Credentials de test :**
```
Admin:   admin2 / [mot de passe]
Teacher: prof_youssef / [mot de passe]
Student: abdelbasset_kolli / [mot de passe]
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
| `profiles` | Utilisateurs (id uuid, username, role, first_name, last_name, phone) |
| `tasks` | Tâches (type: hifz/muraja/tilawa, assigned_by, user_id, surah, ayah, points) |
| `submissions` | Soumissions audio (task_id, student_id, audio_url, status, awarded_points) |
| `classes` | Classes (name, teacher_id, time_slot, max_students) |
| `class_members` | Relation classe ↔ étudiant (class_id, student_id) |
| `points_log` | Historique de points (student_id, delta, reason, submission_id) |
| `progress` | Progression mémorisation (user_id, surah, ayah, accuracy, duration) |
| `leaderboard` | Vue SQL : classement par total_points |

**Storage Bucket :**
- `audio-submissions` — fichiers audio des soumissions (path: `{user_id}/{task_id}/{uuid}.webm`)

## Migration Django → Supabase

**Ce qui a été supprimé :**
- ❌ Backend Django complet (`backend/`, -2,300 lignes)
- ❌ Ancien monolithe `script.js` (205KB, -4,871 lignes)
- ❌ Ancien `index.html` racine (-1,043 lignes)
- ❌ Docker (`Dockerfile`, `docker-compose.yml`, `nginx.conf`)
- ❌ Config obsolètes (`render.yaml`, `package.json`, `.coderabbit.yaml`)
- ❌ Docs et tests obsolètes (`docs/`, `tests/`, `scripts/`)

**Total : -9,168 lignes, 54 fichiers supprimés**

**Architecture finale :**
- ✅ Frontend modulaire ES6 (`frontend/src/`)
- ✅ Supabase Auth + Database + Storage
- ✅ Déploiement Vercel (fichiers statiques)
- ✅ Zero backend custom, zero Docker

---
*Made with ❤️ for Quran learners*
