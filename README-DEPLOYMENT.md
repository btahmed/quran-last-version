# QuranReview - Guide de Deploiement Complet

## Resume du Projet

| Composant | Statut | Emplacement |
|-----------|--------|-------------|
| Frontend | ✅ OK | `C:\dev\QuranReview\index.html` |
| Backend Django | ✅ OK | `C:\dev\QuranReview\backend\` |
| Docker | ✅ OK | `C:\dev\QuranReview\docker-compose.yml` |
| GitHub Pages | ✅ OK | Workflow dans `.github\workflows\` |

---

## 1. TEST EN LOCAL (Sans Docker)

### A. Frontend seul (Mode Demo)

**Emplacement:** `C:\dev\QuranReview\index.html`

**Lancement:**
```powershell
# Double-cliquer sur index.html
# OU
Start-Process "C:\dev\QuranReview\index.html"
```

**Acces:** `file:///C:/dev/QuranReview/index.html`

> Mode Demo active automatiquement (badge orange en haut)

### B. Backend Django

**Emplacement:** `C:\dev\QuranReview\backend\`

**Commandes:**
```powershell
cd C:\dev\QuranReview\backend

# 1. Creer environnement virtuel
python -m venv venv

# 2. Activer
.\venv\Scripts\activate

# 3. Installer dependances
pip install -r requirements.txt

# 4. Migrer base de donnees
python manage.py migrate

# 5. Creer superutilisateur
python manage.py createsuperuser

# 6. Lancer serveur
python manage.py runserver
```

**Acces Backend:** http://127.0.0.1:8000

**API Endpoints:**
- POST http://127.0.0.1:8000/api/token/ (login)
- POST http://127.0.0.1:8000/api/register/ (register)
- GET  http://127.0.0.1:8000/api/dashboard/ (stats)

---

## 2. TEST AVEC DOCKER

### Prerequis
- Docker Desktop installe et demarre

### Emplacement fichier Docker
`C:\dev\QuranReview\docker-compose.yml`

### Commandes Docker

```powershell
cd C:\dev\QuranReview

# Lancer tous les services
docker-compose up --build

# Lancer en arriere-plan
docker-compose up -d --build

# Arreter
docker-compose down

# Voir logs
docker-compose logs -f

# Rebuild complet
docker-compose down -v
docker-compose up --build
```

### Acces avec Docker

| Service | URL |
|---------|-----|
| Frontend (nginx) | http://localhost |
| Backend Django | http://localhost:8000 |
| Admin Django | http://localhost:8000/admin |

---

## 3. GITHUB PAGES (Production)

### Repository GitHub
**URL:** https://github.com/btahmed/QuranReview

### Deploiement automatique
Le workflow deploye automatiquement sur push vers `main`:

```powershell
cd C:\dev\QuranReview

git add .
git commit -m "Deployment ready"
git push origin main
```

### URL GitHub Pages
**Production:** https://btahmed.github.io/QuranReview/

**Domaine perso (si configure):** https://quranreview.live

### Configurer domaine perso
1. Editer fichier `CNAME`:
```
quranreview.live
```
2. Dans GitHub repo > Settings > Pages > Custom domain
3. Ajouter DNS chez registrar:
   - Type A: `@` -> `185.199.108.153`
   - Type A: `@` -> `185.199.109.153`
   - Type A: `@` -> `185.199.110.153`
   - Type A: `@` -> `185.199.111.153`

---

## 4. STRUCTURE DES FICHIERS

```
C:\dev\QuranReview\
│
├── 📁 frontend\              → Docker nginx
│   └── 📁 nginx\             → Config nginx
│
├── 📁 backend\               → Django API
│   ├── 📁 authentication\    → Auth JWT
│   │   ├── models.py
│   │   ├── views.py
│   │   ├── serializers.py
│   │   └── urls.py
│   │
│   ├── 📁 api\               → Core API
│   │   ├── models.py        → Task, Progress, Competition
│   │   ├── views.py
│   │   ├── serializers.py
│   │   └── urls.py
│   │
│   ├── 📁 quranreview\        → Config Django
│   │   ├── settings.py
│   │   └── urls.py
│   │
│   ├── manage.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── 📁 .github\workflows\      → CI/CD
│   └── deploy.yml            → GitHub Pages auto-deploy
│
├── docker-compose.yml         → Orchestration
├── index.html                 → Frontend principal
├── script.js                  → Logique app
├── style.css                  → Styles
├── sw.js                      → Service Worker PWA
├── manifest.json              → PWA manifest
└── CNAME                      → Domaine perso
```

---

## 5. COMMANDES RAPIDES

### Lancer tout (Docker)
```powershell
cd C:\dev\QuranReview; docker-compose up -d --build
```

### Arreter tout
```powershell
cd C:\dev\QuranReview; docker-compose down
```

### Voir etat
```powershell
docker ps
```

### Logs
```powershell
cd C:\dev\QuranReview; docker-compose logs -f backend
cd C:\dev\QuranReview; docker-compose logs -f frontend
```

---

## 6. TESTS POST-DEPLOIEMENT

### Verifier GitHub Pages
```powershell
Invoke-RestMethod -Uri "https://btahmed.github.io/QuranReview/" -Method Head
```

### Verifier Backend Local
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/token/" -Method Post -Body '{"username":"test","password":"test"}' -ContentType "application/json"
```

### Verifier Docker
```powershell
docker-compose ps
```

---

## 7. DEPANNAGE

| Probleme | Solution |
|----------|----------|
| ERR_TUNNEL_CONNECTION_FAILED sur le domaine | Verifier les DNS chez le registrar (4 enregistrements A vers GitHub). En attendant, utiliser https://btahmed.github.io/QuranReview/ |
| Port 80 occupe | `docker-compose down` ou changer ports dans docker-compose.yml |
| Erreur migrations | `docker-compose exec backend python manage.py migrate` |
| Static files manquants | `docker-compose exec backend python manage.py collectstatic` |
| Cache navigateur | Ctrl+F5 ou vider cache |
| Service Worker ancien | DevTools > Application > Service Workers > Unregister |

---

## Resume URLs

| Environnement | URL |
|---------------|-----|
| Local Frontend (Demo) | `file:///C:/dev/QuranReview/index.html` |
| Local Backend | http://localhost:8000 |
| Docker Frontend | http://localhost |
| Docker Backend | http://localhost:8000 |
| GitHub Pages | https://btahmed.github.io/QuranReview/ |
| Domaine Perso | https://quranreview.live |
