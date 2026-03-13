# QuranReview 🕌

Application professionnelle pour la mémorisation et révision du Coran — PWA avec backend Django.

## Déploiements

| | URL | Stack |
|-|-----|-------|
| **Site live** | https://quranreview.ma | GitHub Pages (PWA statique) |
| **API** | https://api.quranreview.live | Django + DRF (Render.com) |

## Stack technique

- **Frontend** : Vanilla JS, ES Modules natifs, CSS, PWA
- **Backend** : Django 4.x + Django REST Framework
- **Base de données** : PostgreSQL
- **Infra** : Docker Compose (développement), Render.com + GitHub Pages (production)

## Fonctionnalités

- 📖 **Mémorisation** — suivi avec répétition espacée
- 🎵 **Ward** — lecteur audio de récitation quotidienne
- 🏋️ **Hifz** — exercices 5 niveaux de difficulté (masquage de mots)
- 🏆 **Compétition** — défis et classements
- 👨‍🏫 **Espace enseignant** — gestion tâches et soumissions audio des étudiants
- 📊 **Progression** — analytics et historique
- 🌙 **Thème** — clair/sombre
- 📱 **PWA** — mode hors-ligne, installable

## Démarrage en développement

```bash
# Application complète (frontend + backend + DB)
docker-compose up --build

# Frontend seul (test rapide)
cd frontend && python -m http.server 3000
```

## Structure du projet

```
quran-last-version/
├── frontend/              # App Docker (ES Modules)
│   ├── index.html         # Shell principal
│   └── src/
│       ├── main.js        # Point d'entrée
│       ├── core/          # logger, config, state, router, ui
│       ├── components/    # AudioPlayer, AuthModal, ...
│       ├── services/      # auth, tasks, competition, hifz
│       └── pages/         # 9 pages de l'application
├── backend/               # Django API
├── index.html             # Version GitHub Pages (site live quranreview.ma)
├── script.js              # JS version GitHub Pages
├── docker-compose.yml
└── docs/                  # Documentation technique
```

## Documentation

- `CLAUDE.md` — guide pour Claude Code (architecture, commandes, gotchas)
- `docs/deployment.md` — guide de déploiement complet
- `docs/audio-setup.md` — configuration audio (CDN / local)
- `docs/plans/` — plans de développement

---
*Made with ❤️ for Quran learners*
