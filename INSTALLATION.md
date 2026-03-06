# Guide d'installation — QuranReview

## Prérequis

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installé et lancé
- Git installé
- Connexion internet (pour télécharger les images Docker)

---

## Installation en 3 étapes

### 1. Cloner le repo

```bash
git clone https://github.com/btahmed/quran-last-version.git
cd quran-last-version
```

### 2. Lancer l'application

```bash
docker-compose up --build
```

La première fois, ça prend 2-3 minutes (téléchargement des images).

### 3. Ouvrir le site

- **Site principal :** http://localhost
- **API backend :** http://localhost:8000/api/

---

## Créer un compte administrateur

Après le premier lancement, ouvre un nouveau terminal et tape :

```bash
docker-compose exec backend python manage.py createsuperuser
```

Suis les instructions (username, email, mot de passe).

---

## Arrêter l'application

```bash
docker-compose down
```

Pour tout effacer (base de données incluse) :

```bash
docker-compose down -v
```

---

## Problèmes fréquents

**Docker ne démarre pas**
→ Ouvre Docker Desktop et attends qu'il soit complètement lancé avant de relancer `docker-compose up`.

**Port 80 déjà utilisé**
→ Arrête IIS ou tout autre serveur web local, ou change le port dans `docker-compose.yml` :
```yaml
ports:
  - "8080:80"   # site disponible sur http://localhost:8080
```

**Le site s'affiche mais l'API ne répond pas**
→ Attends 30 secondes que le backend finisse de démarrer, puis recharge la page.

---

## Stack technique

| Composant | Technologie |
|-----------|-------------|
| Frontend | HTML/CSS/JS (Nginx) |
| Backend | Django + Django REST Framework |
| Base de données | SQLite (incluse, aucune config nécessaire) |
| Déploiement local | Docker Compose |
