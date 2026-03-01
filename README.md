# QuranReview 🕌

🌐 **Site live :** [https://quranreview.live](https://quranreview.live)

Application complète de mémorisation et révision du Coran — pour enseignants, étudiants et administrateurs.

---

## ✨ Fonctionnalités

| Module | Description |
|--------|-------------|
| 📖 **Mémorisation (حفظ)** | Suivi des sourates mémorisées avec états (متقن / ضعيف / جديد) |
| 🎧 **Ward quotidien (الورد اليومي)** | Lecteur audio avec sélection de sourate et plage d'ayahs |
| 📈 **Progression (التقدم)** | Statistiques, graphiques et activité hebdomadaire |
| 🏆 **Compétition (التحديات)** | Classement, badges de rang, 3 modes de jeu |
| 🎭 **Mode Hifz (وضع الحفظ)** | Entraînement interactif avec niveaux de difficulté |
| 👨‍🏫 **Espace enseignant** | Gestion des tâches, suivi des élèves, classes |
| 👨‍🎓 **Espace étudiant** | Tableau de bord personnel, soumissions, points |
| 🛡️ **Admin** | Gestion des utilisateurs, rôles, permissions |
| 🤖 **AI Pipeline** | Pipeline d'analyse automatique |
| 📥 **Import outils** | Import d'étudiants/professeurs depuis Excel |

---

## 🏗️ Architecture

```
quran-last-version/
│
├── index.html          # Frontend GitHub Pages (version statique)
├── style.css           # Design system — Glassmorphism + tokens CSS
├── script.js           # Logique frontend principale
├── audio-config.js     # Configuration lecteur audio
│
├── frontend/           # Frontend version Docker
│   ├── index.html
│   ├── style.css
│   ├── style-pro.css   # CSS Pro — animations GSAP, glassmorphism
│   └── script.js
│
├── backend/            # API Django REST
│   ├── api/            # Endpoints (tâches, progression, compétition)
│   ├── authentication/ # Auth JWT, modèle User custom
│   └── quranreview/    # Settings, URLs
│
├── ai_pipeline/        # Pipeline IA
├── import_tools/       # Scripts import Excel → backend
├── docs/               # Plans, backups CSS
└── tests/              # Tests automatisés
```

---

## 🛠️ Stack technique

- **Frontend :** HTML5, CSS3 (Glassmorphism, GSAP animations), JavaScript ES6+
- **PWA :** Service Worker, manifest.json, offline support
- **Backend :** Django 4 + Django REST Framework + JWT
- **Base de données :** PostgreSQL
- **Déploiement :** Docker + Nginx / GitHub Pages
- **CI/CD :** GitHub Actions

---

## 🚀 Lancement rapide

### Version locale (GitHub Pages)
```bash
# Ouvrir directement dans le navigateur
open index.html
```

### Version complète (Docker)
```bash
docker-compose up --build
# Frontend : http://localhost
# Backend  : http://localhost:8000
```

### Backend seul
```bash
cd backend
python manage.py migrate
python manage.py runserver
```

---

## 👥 Rôles utilisateurs

| Rôle | Accès |
|------|-------|
| `admin` | Gestion complète de l'application |
| `teacher` | Gestion des élèves, tâches, classes |
| `student` | Mémorisation, ward, compétition |

---

## 🔐 Sécurité

- Authentification JWT
- Rate limiting sur les endpoints sensibles
- Protection media (accès authentifié uniquement)
- Politique de mots de passe renforcée
- Voir [SECURITY.md](SECURITY.md)

---

## 📡 API principale

```
POST /api/auth/login/         — Connexion
POST /api/auth/register/      — Inscription
GET  /api/tasks/              — Liste des tâches
GET  /api/progress/           — Progression
GET  /api/competition/        — Classement
GET  /api/points/             — Points utilisateur
```

---

*Made with ❤️ for Quran learners*
