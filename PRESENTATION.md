# QuranReview - Document de Presentation du Projet

## Vue d'ensemble

**QuranReview** est une application web progressive (PWA) de memorisation et revision du Coran, conçue pour un usage educatif au sein d'une structure enseignant/eleve. L'application est deployee en production sur le domaine **quranreview.live**.

- **Repository** : [github.com/btahmed/QuranReview](https://github.com/btahmed/QuranReview)
- **Frontend** : Heberge sur GitHub Pages (quranreview.live)
- **Backend API** : Deploye sur Render (api.quranreview.live)
- **Base de donnees** : PostgreSQL (Render)
- **Stockage media** : Cloudinary (fichiers audio persistants)

---

## Architecture technique

```
┌─────────────────────────────────┐
│   Frontend (GitHub Pages)       │
│   quranreview.live              │
│   HTML5 / CSS3 / JavaScript    │
│   PWA + Service Worker          │
└──────────────┬──────────────────┘
               │ REST API (JWT)
               ▼
┌─────────────────────────────────┐
│   Backend (Render)              │
│   api.quranreview.live          │
│   Django 5.2 + DRF             │
│   Gunicorn + WhiteNoise        │
└──────────┬──────────┬───────────┘
           │          │
           ▼          ▼
┌──────────────┐ ┌──────────────┐
│  PostgreSQL  │ │  Cloudinary  │
│  (Render DB) │ │  (Media)     │
└──────────────┘ └──────────────┘
```

### Stack Frontend
- **HTML5 / CSS3 / JavaScript** pur (pas de framework)
- **PWA** avec Service Worker (cache offline, notifications push)
- **Audio CDN** : Islamic Network CDN pour le streaming audio du Coran (recitateur Al-Afasy, bitrates 32-192kbps)
- **Design responsive** avec support RTL (arabe)
- Polices : Amiri, Noto Naskh Arabic

### Stack Backend
- **Django 5.2** avec Django REST Framework
- **Authentification JWT** (SimpleJWT)
- **CORS** configure pour GitHub Pages + domaine custom
- **PostgreSQL** en production via `dj-database-url`
- **Cloudinary** pour le stockage persistant des fichiers audio (le filesystem Render est ephemere)
- **WhiteNoise** pour les fichiers statiques
- **CI/CD** : GitHub Actions (tests Django automatises)

---

## Fonctionnalites principales

### 1. Systeme d'authentification
- Inscription / Connexion / Deconnexion
- Tokens JWT (access + refresh)
- Deux roles : **Eleve** (student) et **Professeur** (teacher)
- Creation automatique du superuser au deploiement

### 2. Pages de l'application
| Page | Description |
|------|-------------|
| **Accueil** | Tableau de bord principal |
| **Hifz (Memorisation)** | Mode de memorisation du Coran |
| **Memorisation quotidienne** | Suivi du hifz quotidien |
| **Werd (Revision)** | Programme de revision reguliere |
| **Progres** | Analytiques et suivi de progression |
| **Competition** | Classement et defis entre eleves |
| **Mes taches** | Vue eleve - taches assignees |
| **Panneau professeur** | Vue professeur - gestion des eleves |
| **Parametres** | Configuration de l'application |

### 3. Systeme de taches et soumissions
- Les professeurs creent des taches (recitation, memorisation, autre)
- Les eleves soumettent des enregistrements audio
- Les professeurs approuvent ou rejettent les soumissions
- Systeme de points avec historique (ledger PointsLog)
- Validation des fichiers audio (extensions .webm/.mp3/.wav/.m4a, taille max 10MB)

### 4. Panneau d'administration
- Gestion complete des utilisateurs (creer, modifier, supprimer)
- Promotion/retrograde des roles
- Suppression massive de taches
- Liste des eleves avec badges de role

### 5. Audio Coranique
- Streaming depuis Islamic Network CDN
- Support de 114 sourates completes
- Lecture par ayah ou par sourate
- Configuration de la qualite audio (32/64/128/192 kbps)
- Cache audio via Service Worker

---

## Structure du projet

```
QuranReview/
├── index.html              # Application frontend (SPA, 1043 lignes)
├── script.js               # Logique JavaScript (4871 lignes)
├── style.css               # Styles CSS (1882 lignes)
├── audio-config.js         # Configuration audio CDN (114 sourates)
├── sw.js                   # Service Worker PWA
├── manifest.json           # Manifeste PWA
├── CNAME                   # Domaine custom (quranreview.live)
├── render.yaml             # Configuration deploiement Render
├── package.json            # Config Node.js (tests)
├── .github/
│   └── workflows/
│       └── django-ci.yml   # CI GitHub Actions
├── tests/
│   └── audio-config.test.js
├── verification/           # Scripts de verification
│   ├── verify_logout.py
│   └── verify_registration.py
├── audio/                  # Fichiers audio locaux
└── ancien django/MYSITEE/MYSITEE/   # Backend Django
    ├── manage.py
    ├── requirements.txt    # 14 dependances Python
    ├── render.yaml
    ├── build.sh
    ├── mysite/             # Configuration Django
    │   ├── settings.py     # Settings (dev/prod)
    │   ├── urls.py
    │   ├── api_urls.py     # 19 endpoints API
    │   └── api_views.py    # Vues API
    ├── tasks/              # App Taches + Users
    │   ├── models.py       # User, Team, Task
    │   └── management/commands/
    │       ├── ensure_superuser.py
    │       └── clear_tasks.py
    ├── submissions/        # App Soumissions
    │   ├── models.py       # Submission (audio + validation)
    │   ├── services.py
    │   └── tests.py
    └── points/             # App Points
        └── models.py       # PointsLog (ledger)
```

---

## Endpoints API

| Methode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/register/` | Inscription |
| POST | `/api/token/` | Obtenir JWT |
| POST | `/api/token/refresh/` | Rafraichir JWT |
| GET | `/api/me/` | Profil utilisateur |
| GET | `/api/points/` | Points de l'eleve |
| GET | `/api/tasks/` | Liste des taches |
| POST | `/api/tasks/create/` | Creer une tache (prof) |
| POST | `/api/submissions/` | Soumettre un audio |
| GET | `/api/my-submissions/` | Mes soumissions |
| POST | `/api/submissions/<id>/approve/` | Approuver (prof) |
| POST | `/api/submissions/<id>/reject/` | Rejeter (prof) |
| GET | `/api/pending-submissions/` | Soumissions en attente (prof) |
| GET | `/api/my-students/` | Mes eleves (prof) |
| GET | `/api/students/<id>/progress/` | Progres d'un eleve (prof) |
| GET | `/api/media/<path>` | Servir fichiers media |
| POST | `/api/admin/create-teacher/` | Creer un professeur (admin) |
| GET | `/api/admin/users/` | Liste utilisateurs (admin) |
| PUT | `/api/admin/users/<id>/update/` | Modifier utilisateur (admin) |
| DELETE | `/api/admin/users/<id>/delete/` | Supprimer utilisateur (admin) |
| DELETE | `/api/admin/tasks/delete-all/` | Supprimer toutes les taches (admin) |

---

## Deploiement et infrastructure

### Frontend (GitHub Pages)
- Push sur `main` → deploiement automatique
- Domaine custom via CNAME : `quranreview.live`
- HTTPS automatique via GitHub

### Backend (Render)
- Configuration via `render.yaml`
- Build : `pip install → collectstatic → migrate → ensure_superuser`
- Runtime : Gunicorn
- Variables d'environnement : SECRET_KEY, DATABASE_URL, CLOUDINARY_URL, etc.
- Base de donnees PostgreSQL (plan free)

### CI/CD (GitHub Actions)
- Tests automatises a chaque push/PR sur `main`
- Workflow : `django-ci.yml`
- Etapes : setup Python 3.12 → install deps → collectstatic → check → test

---

## Historique du developpement avec Claude Code

Le projet a ete developpe et configure en collaboration avec **Claude Code** a travers de nombreuses sessions. Voici un resume chronologique des travaux realises :

### Phase 1 : Backend Django et deploiement
- Mise en place du backend Django avec DRF et JWT
- Systeme de soumissions audio avec validation
- Configuration des tests et CI (GitHub Actions)
- Securisation : privacy consent, hardening, XSS fix
- Deploiement sur Render : configuration `render.yaml`, PostgreSQL, build scripts
- Resolution de multiples problemes de deploiement (psycopg, requirements, migrations, SSL, staticfiles)

### Phase 2 : Domaine et connexion frontend-backend
- Configuration du domaine custom `quranreview.live`
- Connexion du frontend (GitHub Pages) au backend (Render API)
- Configuration CORS pour permettre les appels cross-origin
- Correction des URLs API et configuration CSRF

### Phase 3 : Authentification et roles
- Systeme complet d'authentification (register, login, logout)
- Systeme de roles eleve/professeur
- Pages dediees par role avec controle d'acces
- Dashboard professeur avec gestion des eleves
- Enregistrement audio depuis le frontend

### Phase 4 : Administration
- Panneau d'administration pour superusers
- Creation automatique du superuser au deploiement (`ensure_superuser`)
- Gestion des utilisateurs (creer, promouvoir, retrograder, supprimer)
- Gestion des permissions et acces admin

### Phase 5 : Audio et media
- Integration du CDN Islamic Network pour l'audio coranique
- Resolution des problemes d'URLs audio (double domaine, domaine incorrect)
- Configuration de WhiteNoise pour servir les fichiers media
- Migration vers Cloudinary pour le stockage persistant (filesystem ephemere de Render)
- Correction des erreurs 404 sur fichiers manquants
- Support WebM pour tous les players audio

### Phase 6 : Corrections et optimisations
- Fix de la faille XSS stockee (Stored XSS dans createTableRow)
- Optimisation de la strategie de cache et du logout
- Amelioration du systeme de logging/debug (F12)
- Fix de l'erreur 500 sur l'endpoint points (serializer)
- Optimisation du chargement du dashboard admin (N+1 queries)
- Ajout du bouton "Supprimer toutes les taches"
- Nettoyage des erreurs console ("Invalid URI")

---

## Securite

- **Authentification JWT** avec tokens access/refresh
- **CORS** restreint aux origines autorisees en production
- **HTTPS** force en production (SSL redirect)
- **HSTS** active avec preload
- **CSRF** protection avec trusted origins
- **Cookies securises** en production
- **Validation** des fichiers audio (extension + taille)
- **Fix XSS** : sanitization des donnees dans les tableaux HTML
- **Proxy SSL** header configure pour Render

---

## Modeles de donnees

### User (extends AbstractUser)
- `role` : student | teacher
- `description` : texte libre

### Task
- `title`, `description`, `status` (todo/done)
- `task_type` : recitation | memorization | other
- `points`, `due_date`
- Relations : `author`, `assigned_users`, `assigned_teams`, `parent` (sous-taches)

### Submission
- `task`, `student`, `audio_file`
- `status` : submitted | approved | rejected
- `admin_feedback`, `awarded_points`
- Contrainte : une soumission unique par eleve par tache

### PointsLog
- `student`, `delta` (positif/negatif), `reason`
- `submission` (lien optionnel)
- Methode `get_total_points()` pour calculer le total

### Team
- `name`, `creator`, `members`

---

## Dependances principales

### Frontend
- Aucun framework (Vanilla JS)
- Google Fonts (Amiri, Noto Naskh Arabic)
- Islamic Network CDN (audio)

### Backend (requirements.txt)
| Package | Version | Role |
|---------|---------|------|
| Django | 5.2.11 | Framework web |
| djangorestframework | 3.16.1 | API REST |
| djangorestframework-simplejwt | 5.5.1 | Auth JWT |
| django-cors-headers | 4.9.0 | CORS |
| gunicorn | 22.0.0 | Serveur WSGI |
| whitenoise | 6.6.0 | Fichiers statiques |
| dj-database-url | 2.2.0 | Config DB |
| psycopg | 3.3.2 | Driver PostgreSQL |
| cloudinary | 1.41.0 | Stockage media |
| django-cloudinary-storage | 0.3.0 | Integration Django |

---

## Comment lancer le projet

### Frontend (local)
```bash
# Ouvrir index.html dans un navigateur
# Ou utiliser un serveur local :
python -m http.server 8080
```

### Backend (local)
```bash
cd "ancien django/MYSITEE/MYSITEE"
cp .env.example .env    # Configurer les variables
pip install -r requirements.txt
python manage.py migrate
python manage.py ensure_superuser
python manage.py runserver
```

### Tests
```bash
# Tests frontend (audio config)
npm test

# Tests backend (Django)
cd "ancien django/MYSITEE/MYSITEE"
python manage.py test submissions
```

---

*Document genere le 15 fevrier 2026 - Projet QuranReview par btahmed*
