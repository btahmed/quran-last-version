# Vercel + Supabase — Correction des incohérences de déploiement

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rendre l'application QuranReview entièrement fonctionnelle sur Vercel (frontend) + Railway/Render (backend Django) avec Supabase PostgreSQL et Cloudinary pour l'audio.

**Architecture:**
- Frontend statique → Vercel (déjà partiellement configuré dans `main-local`)
- Backend Django → Railway ou Render (serveur persistant, pas serverless — Django n'est pas compatible Vercel serverless sans adaptateur complexe)
- Base de données → Supabase PostgreSQL via `DATABASE_URL`
- Fichiers audio → Cloudinary via `django-cloudinary-storage`

**Tech Stack:** Django 4.2, DRF, simplejwt, dj-database-url, django-cloudinary-storage, gunicorn, psycopg2-binary

---

## Contexte — Ce qui existe déjà

- `backend/requirements.txt` : psycopg2-binary et gunicorn sont là mais inutilisés
- `backend/quranreview/settings.py` : SQLite hardcodé, CORS sans Vercel, token_blacklist absent
- `backend/Dockerfile` : utilise `runserver` au lieu de `gunicorn`
- `frontend/` : le bon frontend — la racine (`index.html`, `script.js`, `style.css`) est une copie divergente
- `.github/workflows/django-ci.yml` : pointe vers `ancien django/` — à corriger
- `render.yaml` : pointe vers `ancien django/` — à supprimer ou corriger

---

## Ordre d'exécution

Les tâches 1-5 sont les **critiques** (app non fonctionnelle sans elles).
Les tâches 6-8 sont les **secondaires** (qualité/maintenance).

---

### Tâche 1 : PostgreSQL via DATABASE_URL (Supabase)

**Fichiers :**
- Modifier : `backend/requirements.txt`
- Modifier : `backend/quranreview/settings.py:73-78`

**Étape 1 : Ajouter dj-database-url aux requirements**

```
# backend/requirements.txt — ajouter après psycopg2-binary :
dj-database-url>=2.1.0
```

**Étape 2 : Remplacer le bloc DATABASES dans settings.py**

Remplacer les lignes 72-78 :
```python
# AVANT
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'data' / 'db.sqlite3',
    }
}
```

Par :
```python
# APRÈS
import dj_database_url

DATABASE_URL = os.environ.get('DATABASE_URL')

if DATABASE_URL:
    DATABASES = {
        'default': dj_database_url.parse(
            DATABASE_URL,
            conn_max_age=600,
            ssl_require=not DEBUG,
        )
    }
else:
    # Dev local sans DATABASE_URL → SQLite
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'data' / 'db.sqlite3',
        }
    }
```

> Aussi supprimer la ligne 146 : `os.makedirs(BASE_DIR / 'data', exist_ok=True)` → la conditionner :
```python
# Créer le dossier data seulement si SQLite est utilisé
if not os.environ.get('DATABASE_URL'):
    os.makedirs(BASE_DIR / 'data', exist_ok=True)
```

**Étape 3 : Vérifier en local (sans DATABASE_URL)**

```bash
cd backend
python manage.py check --database default
# Expected: System check identified no issues
```

**Étape 4 : Commit**

```bash
git add backend/requirements.txt backend/quranreview/settings.py
git commit -m "feat: support PostgreSQL via DATABASE_URL (Supabase)"
```

---

### Tâche 2 : token_blacklist pour le logout JWT

**Fichiers :**
- Modifier : `backend/quranreview/settings.py:24-38`

**Étape 1 : Ajouter token_blacklist dans INSTALLED_APPS**

Dans `settings.py`, ajouter `'rest_framework_simplejwt.token_blacklist'` dans INSTALLED_APPS après `'rest_framework_simplejwt'` :

```python
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third party
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',  # ← AJOUTER
    'corsheaders',
    # Local
    'authentication',
    'api',
]
```

**Étape 2 : Créer la migration pour token_blacklist**

```bash
cd backend
python manage.py migrate
# Expected: Applying token_blacklist.0001_initial... OK
```

**Étape 3 : Vérifier que le logout ne crash plus**

```bash
cd backend
python manage.py shell -c "
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
User = get_user_model()
u = User.objects.first()
if u:
    t = RefreshToken.for_user(u)
    t.blacklist()
    print('Blacklist OK')
else:
    print('No user to test with')
"
```

**Étape 4 : Commit**

```bash
git add backend/quranreview/settings.py
git commit -m "fix: ajouter token_blacklist dans INSTALLED_APPS — logout JWT réparé"
```

---

### Tâche 3 : CORS — Autoriser les domaines Vercel

**Fichiers :**
- Modifier : `backend/quranreview/settings.py:132-143`

**Étape 1 : Remplacer le bloc CORS**

```python
# CORS Settings
if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
else:
    CORS_ALLOW_ALL_ORIGINS = False
    CORS_ALLOWED_ORIGINS = os.environ.get(
        'CORS_ALLOWED_ORIGINS',
        'https://quranreview.live,https://www.quranreview.live'
    ).split(',')
    # Autoriser tous les sous-domaines Vercel (previews incluses)
    CORS_ALLOWED_ORIGIN_REGEXES = [
        r'^https://.*\.vercel\.app$',
    ]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = ['content-type', 'authorization', 'accept']
```

> La variable `CORS_ALLOWED_ORIGINS` reste configurable via env. Pour Vercel prod, mettre `CORS_ALLOWED_ORIGINS=https://quranreview-frontend.vercel.app` dans les env vars du backend.

**Étape 2 : Vérifier la config**

```bash
cd backend
python manage.py check
# Expected: System check identified no issues
```

**Étape 3 : Commit**

```bash
git add backend/quranreview/settings.py
git commit -m "fix: CORS — autoriser domaines *.vercel.app en production"
```

---

### Tâche 4 : Cloudinary pour les fichiers audio

**Fichiers :**
- Modifier : `backend/requirements.txt`
- Modifier : `backend/quranreview/settings.py`
- Modifier : `backend/api/models.py:288-291`

**Étape 1 : Ajouter cloudinary aux requirements**

```
# backend/requirements.txt — ajouter :
cloudinary>=1.36.0
django-cloudinary-storage>=0.3.0
```

**Étape 2 : Configurer Cloudinary dans settings.py**

Ajouter après le bloc CORS :

```python
# Cloudinary — stockage audio en production
CLOUDINARY_URL = os.environ.get('CLOUDINARY_URL')

if CLOUDINARY_URL:
    import cloudinary
    import cloudinary.uploader
    import cloudinary.api

    # Parsing automatique depuis l'URL cloudinary://api_key:api_secret@cloud_name
    cloudinary.config(cloudinary_url=CLOUDINARY_URL)

    DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'
    CLOUDINARY_STORAGE = {
        'CLOUDINARY_URL': CLOUDINARY_URL,
    }
    INSTALLED_APPS += ['cloudinary_storage', 'cloudinary']
```

> Quand `CLOUDINARY_URL` est absent (dev local), Django utilise le stockage fichier local par défaut. Aucun changement pour le développement local.

**Étape 3 : Vérifier l'import cloudinary**

```bash
cd backend
pip install cloudinary django-cloudinary-storage
python -c "import cloudinary; print('Cloudinary OK')"
```

**Étape 4 : Commit**

```bash
git add backend/requirements.txt backend/quranreview/settings.py
git commit -m "feat: Cloudinary pour stockage audio en production"
```

---

### Tâche 5 : vercel.json — Configuration déploiement frontend

**Fichiers :**
- Créer ou vérifier : `frontend/vercel.json`
- Vérifier : état de `main-local` worktree

**Contexte :** Le worktree `main-local` a déjà un `frontend/vercel.json`. Vérifier qu'il est correct et présent dans la branche courante.

**Étape 1 : Lire le vercel.json existant dans main-local**

```bash
cat .claude/worktrees/main-local/frontend/vercel.json
```

**Étape 2 : Créer/confirmer frontend/vercel.json dans la branche courante**

Le fichier doit être :
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*\\.js|.*\\.css)",
      "headers": [
        { "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" }
      ]
    }
  ]
}
```

> Ce fichier indique à Vercel de servir `index.html` pour toutes les routes (SPA) et désactive le cache JS/CSS.

**Étape 3 : Vérifier que Vercel déploie bien depuis `frontend/`**

Sur le dashboard Vercel, vérifier que le "Root Directory" est configuré sur `frontend`. Si non, le configurer manuellement (hors scope de ce plan).

**Étape 4 : Commit**

```bash
git add frontend/vercel.json
git commit -m "feat: ajouter vercel.json pour le déploiement frontend SPA"
```

---

### Tâche 6 : Dockerfile — gunicorn au lieu de runserver

**Fichiers :**
- Modifier : `backend/Dockerfile:29`

**Étape 1 : Remplacer la CMD**

```dockerfile
# AVANT
CMD sh -c "python manage.py migrate && python manage.py runserver 0.0.0.0:8000"

# APRÈS
CMD sh -c "python manage.py migrate && gunicorn quranreview.wsgi:application --bind 0.0.0.0:8000 --workers 2 --timeout 120"
```

> 2 workers pour Railway/Render tier gratuit (RAM limitée). Timeout 120s pour les requêtes audio.

**Étape 2 : Tester le build Docker local**

```bash
cd backend
docker build -t quranreview-backend . 
docker run --rm -e DEBUG=True -e SECRET_KEY=test-key-12345678901234567890 -p 8000:8000 quranreview-backend
# Ouvrir http://localhost:8000/api/health/ — Expected: 200 OK
```

**Étape 3 : Commit**

```bash
git add backend/Dockerfile
git commit -m "fix: utiliser gunicorn en production (remplace runserver)"
```

---

### Tâche 7 : CI GitHub Actions — Corriger le workflow Django

**Fichiers :**
- Modifier : `.github/workflows/django-ci.yml`

**Étape 1 : Réécrire le workflow pour pointer vers backend/**

```yaml
name: Django CI

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'
      - '.github/workflows/django-ci.yml'
  pull_request:
    branches: [main]
    paths:
      - 'backend/**'
      - '.github/workflows/django-ci.yml'

jobs:
  test:
    runs-on: ubuntu-latest

    defaults:
      run:
        working-directory: backend

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt

      - name: Run Django system checks
        run: python manage.py check
        env:
          SECRET_KEY: test-secret-key-for-ci-only-not-production
          DEBUG: 'True'
          ALLOWED_HOSTS: localhost,127.0.0.1,testserver

      - name: Run migrations
        run: python manage.py migrate
        env:
          SECRET_KEY: test-secret-key-for-ci-only-not-production
          DEBUG: 'True'
          ALLOWED_HOSTS: localhost,127.0.0.1,testserver

      - name: Run tests
        run: python manage.py test api authentication
        env:
          SECRET_KEY: test-secret-key-for-ci-only-not-production
          DEBUG: 'True'
          ALLOWED_HOSTS: localhost,127.0.0.1,testserver
```

> En mode DEBUG=True + pas de DATABASE_URL → SQLite en mémoire. Pas besoin de Supabase en CI.

**Étape 2 : Commit**

```bash
git add .github/workflows/django-ci.yml
git commit -m "fix: CI Django pointe vers backend/ (plus ancien django/)"
```

---

### Tâche 8 : Supprimer le double frontend racine

**Fichiers :**
- Supprimer : `index.html` (racine)
- Supprimer : `script.js` (racine)
- Supprimer : `style.css` (racine)

**Contexte :** Le frontend officiel est dans `frontend/`. Les fichiers à la racine sont une ancienne copie divergente (1641 lignes vs 1598 dans frontend/).

**Étape 1 : Vérifier que Vercel utilise bien `frontend/`**

```bash
cat frontend/vercel.json  # doit exister (cf. Tâche 5)
```

**Étape 2 : Supprimer les fichiers dupliqués**

```bash
git rm index.html script.js style.css
git commit -m "chore: supprimer double frontend à la racine — frontend/ est la source unique"
```

> `sw.js` à la racine : garder si c'est un service worker référencé depuis `frontend/index.html`. Vérifier d'abord :
```bash
grep -n "sw.js" frontend/index.html
# Si aucun résultat → supprimer aussi
```

---

### Tâche 9 : Supprimer/corriger render.yaml obsolète

**Fichiers :**
- Modifier ou supprimer : `render.yaml`

**Option A — Supprimer** (si on n'utilise pas Render) :
```bash
git rm render.yaml
git commit -m "chore: supprimer render.yaml obsolète (référençait ancien django/)"
```

**Option B — Corriger** (si on veut garder Render comme option backend) :
```yaml
services:
  - type: web
    name: quranreview-backend
    runtime: python
    rootDir: backend
    buildCommand: pip install -r requirements.txt && python manage.py collectstatic --noinput
    startCommand: gunicorn quranreview.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120
    envVars:
      - key: SECRET_KEY
        sync: false
      - key: DATABASE_URL
        sync: false
      - key: CLOUDINARY_URL
        sync: false
      - key: CORS_ALLOWED_ORIGINS
        sync: false
      - key: ALLOWED_HOSTS
        sync: false
      - key: DEBUG
        value: 'False'
```

**Recommandation :** Option A pour simplifier. Railway est plus adapté à Django.

---

## Variables d'environnement requises en production

À configurer sur Railway/Render pour le backend :

```env
SECRET_KEY=<générer avec: python -c "import secrets; print(secrets.token_hex(50))">
DATABASE_URL=postgresql://user:password@host:6543/dbname?sslmode=require
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
CORS_ALLOWED_ORIGINS=https://quranreview-frontend.vercel.app
ALLOWED_HOSTS=quranreview-api.railway.app,quranreview-api.vercel.app
DEBUG=False
```

---

## Ordre recommandé d'exécution

1. Tâche 2 (token_blacklist) — 5 min, pas de risque
2. Tâche 1 (PostgreSQL) — 10 min, bloquer ensuite sur DB_URL Supabase
3. Tâche 3 (CORS) — 5 min
4. Tâche 4 (Cloudinary) — 15 min
5. Tâche 5 (vercel.json) — 5 min
6. Tâche 6 (gunicorn) — 5 min
7. Tâche 7 (CI) — 10 min
8. Tâche 8 (double frontend) — 5 min
9. Tâche 9 (render.yaml) — 5 min
