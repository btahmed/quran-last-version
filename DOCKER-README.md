# 🐳 Docker Setup - QuranReview

## Prérequis
- Docker Desktop installé : https://www.docker.com/products/docker-desktop
- Docker Compose (inclus avec Docker Desktop)

## Structure

```
QuranReview/
├── docker-compose.yml      # Configuration principale
├── backend/                # Backend Django
│   ├── Dockerfile
│   └── requirements.txt    # Votre fichier requirements Django
└── frontend/               # Frontend HTML/JS/CSS
    ├── Dockerfile
    ├── nginx.conf          # Configuration Nginx
    └── (vos fichiers frontend)
```

## Configuration

### 1. Copier les fichiers frontend
Copiez vos fichiers dans le dossier `frontend/` :
```bash
cp index.html style-pro.css script.js frontend/
```

### 2. Backend Django
Placez votre code Django dans `backend/` avec un `requirements.txt`.

Exemple de `backend/requirements.txt` :
```
Django>=4.2
psycopg2-binary
djangorestframework
djangorestframework-simplejwt
django-cors-headers
Pillow
gunicorn
```

## Lancer l'application

### Mode développement (avec auto-reload)
```bash
# Lancer tous les services
docker-compose up

# En arrière-plan
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter
docker-compose down
```

### URLs d'accès
- **Frontend** : http://localhost
- **Backend API** : http://localhost:8000/api/
- **Admin Django** : http://localhost:8000/admin/

## Commandes utiles

```bash
# Reconstruire les images
docker-compose up --build

# Entrer dans le conteneur backend
docker-compose exec backend bash

# Entrer dans le conteneur frontend
docker-compose exec frontend sh

# Voir les logs d'un service spécifique
docker-compose logs -f backend

# Redémarrer un service
docker-compose restart backend

# Nettoyer tout (données comprises)
docker-compose down -v
```

## Variables d'environnement Backend

Créez un fichier `backend/.env` :
```
DEBUG=True
SECRET_KEY=votre-cle-secrete
ALLOWED_HOSTS=localhost,127.0.0.1,backend
DATABASE_URL=sqlite:///db.sqlite3
CORS_ALLOWED_ORIGINS=http://localhost,http://127.0.0.1
```

## Production

Pour la production, modifiez `docker-compose.yml` :
1. Changez `DEBUG=False`
2. Utilisez PostgreSQL au lieu de SQLite
3. Ajoutez un reverse proxy (Traefik ou Nginx)
4. Activez HTTPS avec Let's Encrypt

## Dépannage

### Problème de permissions
```bash
docker-compose exec backend chmod -R 777 /app/data
```

### Base de données verrouillée
```bash
docker-compose down
docker volume rm quranreview_backend_data
docker-compose up
```

### CORS errors
Vérifiez que `CORS_ALLOWED_ORIGINS` inclut l'URL du frontend.

## Support

Pour plus d'aide, consultez :
- Documentation Docker : https://docs.docker.com/
- Documentation Docker Compose : https://docs.docker.com/compose/
