# QuranReview — Guide Claude (projet)

## Architecture du projet

Ce repo a **deux déploiements distincts** :

| Déploiement | Fichiers | URL | Usage |
|-------------|----------|-----|-------|
| **GitHub Pages** (statique) | `index.html`, `script.js`, `style.css`, `sw.js`, `manifest.json` à la racine | https://quranreview.ma | Site live pour les utilisateurs |
| **App Docker** (ES modules) | `frontend/src/` + `backend/` + `docker-compose.yml` | localhost:80 (dev) | Version moderne en développement |

> ⚠️ Les deux coexistent. Le site live utilise les fichiers **racine**. Le développement actif se fait sur `frontend/`.

---

## Stack technique

- **Frontend GitHub Pages** : Vanilla JS monolithique (`script.js` 4871 lignes), CSS, PWA
- **Frontend Docker** : ES Modules natifs, organisé en `core/`, `services/`, `pages/`, `components/`
- **Backend** : Django 4.x + DRF, PostgreSQL (via Docker)
- **Auth** : JWT (SimpleJWT)
- **Infra** : Docker Compose (nginx + Django + PostgreSQL)

---

## Lancer l'application

### GitHub Pages (site live)
```bash
# Déployé automatiquement sur push vers main
# Via .github/workflows/deploy.yml → quranreview.ma
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
│                       # SettingsPage, CompetitionPage, HifzPage, MyTasksPage, TeacherPage
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
POST /api/auth/login/          → JWT token
POST /api/auth/register/
GET  /api/tasks/               → liste des tâches
POST /api/tasks/               → créer tâche
GET  /api/competition/         → données compétition
GET  /api/hifz/                → progression hifz
POST /api/audio/submissions/   → soumettre audio
```

---

## Déploiement Backend (Render.com)

```yaml
# render.yaml à la racine
rootDir: backend
buildCommand: pip install -r requirements.txt && python manage.py migrate
startCommand: gunicorn quranreview.wsgi:application
```

URL API prod : https://api.quranreview.live (si configuré)

---

## Gotchas

- Le `deploy.yml` ne tourne que sur push vers `main` (plus de trigger PR)
- `window.QuranReview` doit être défini avant tout `onclick` inline → `main.js` doit charger en premier
- GSAP loading screen : animation inline dans `<head>` de `frontend/index.html`, timeout fallback 5s
- PostgreSQL : variables d'env dans `.env` à la racine (non commité)

---

## Docs utiles

| Doc | Emplacement |
|-----|-------------|
| Plan refactoring ES modules | `docs/plans/2026-03-12-frontend-refactoring.md` |
| Design refactoring | `docs/plans/2026-03-12-frontend-refactoring-design.md` |
| Guide déploiement | `docs/deployment.md` |
| Audio CDN/local | `docs/audio-setup.md` |
