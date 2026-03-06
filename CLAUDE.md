# QuranReview — Mémoire projet

## Description

Application de révision du Coran avec pipeline IA, gestion audio, et backend Django.

## Stack technique

- **Backend :** Django 4.2, Django REST Framework, JWT (simplejwt), CORS
- **Base de données :** PostgreSQL (psycopg2)
- **Auth :** JWT via djangorestframework-simplejwt
- **AI Pipeline :** `ai_pipeline/` — scripts Python pour traitement IA
- **Audio :** gestion audio intégrée (`audio/`, `audio-config.js`)
- **Infra :** Docker (`Dockerfile`), scripts PowerShell (`START.ps1`, `TEST.ps1`, `FIX-BACKEND.ps1`)

## Structure

```
QuranReview/
├── backend/
│   ├── manage.py
│   ├── quranreview/       ← app Django principale
│   ├── api/               ← endpoints REST
│   ├── authentication/    ← JWT auth
│   ├── data/
│   ├── requirements.txt
│   ├── Dockerfile
│   └── venv/
├── ai_pipeline/           ← pipeline de traitement IA
├── audio/                 ← fichiers audio
└── audio-config.js
```

## Commandes

```bash
# Démarrer
powershell -File START.ps1

# Tests
powershell -File TEST.ps1

# Backend Django
cd backend
python manage.py runserver
python manage.py migrate
python manage.py makemigrations

# Docker
docker build -t quranreview .
docker-compose up -d
```

## Variables d'environnement

Fichier `.env` dans `backend/` :
- `SECRET_KEY` — clé Django
- `DATABASE_URL` — connexion PostgreSQL
- `DEBUG` — True/False

## Conventions

- API REST dans `backend/api/`
- Auth JWT — toujours utiliser les headers `Authorization: Bearer <token>`
- `python` pas `python3`
- Migrations avant de toucher les modèles

## Points d'attention

- Le venv est dans `backend/venv/` — activer avant de lancer des commandes Python
- PostgreSQL doit être lancé avant Django
- Les fichiers audio sont servis séparément
