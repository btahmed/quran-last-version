# 🚀 QuranReview - Guide de Démarrage Rapide

## ✅ Vous êtes en Mode DÉMO !

L'application fonctionne actuellement en mode démo (sans serveur). 
Le badge "🎮 MODE DÉMO" est visible dans le header.

---

## 🎯 Déploiement - Choisissez votre option :

### Option 1 : 🐳 Docker (Tout-en-un)
**Parfait pour** : Développement local, tests complets avec backend

```powershell
# 1. Préparer les fichiers (double-cliquez)
setup-docker.bat

# 2. Placez votre backend Django dans le dossier backend/

# 3. Lancez Docker Desktop

# 4. Démarrez
docker-compose up --build

# 5. Accédez à http://localhost
```

📖 **Guide complet** : `DOCKER-README.md`

---

### Option 2 : 📄 GitHub Pages (Gratuit)
**Parfait pour** : Hébergement web gratuit, partage public

```
1. Créez un repo sur https://github.com/new
   → Nom : quranreview
   → Visibilité : Public

2. Uploadez vos fichiers (index.html, style-pro.css, script.js)

3. Settings → Pages → Source : GitHub Actions

4. Votre site : https://votrenom.github.io/quranreview/
```

📖 **Guide complet** : `GITHUB-PAGES-README.md`

---

### Option 3 : 🔄 Les Deux (Recommandé pour production)

**Frontend** → GitHub Pages (gratuit)
**Backend** → Railway/Render (gratuit) ou VPS

---

## 📁 Fichiers créés pour vous :

```
QuranReview/
├── 🐳 Docker/
│   ├── docker-compose.yml          ← Configuration Docker
│   ├── backend/
│   │   └── Dockerfile              ← Image backend Django
│   ├── frontend/
│   │   ├── Dockerfile              ← Image frontend Nginx
│   │   └── nginx.conf              ← Config serveur web
│   └── setup-docker.bat            ← Script setup Windows
│
├── 📄 GitHub Pages/
│   ├── .github/workflows/deploy.yml  ← Auto-déploiement
│   └── .gitignore                    ← Fichiers à ignorer
│
└── 📖 Documentation/
    ├── 🚀-START-HERE.md            ← Vous êtes ici !
    ├── DEPLOYMENT-GUIDE.md         ← Guide comparatif
    ├── DOCKER-README.md            ← Doc Docker complète
    └── GITHUB-PAGES-README.md      ← Doc GitHub Pages complète
```

---

## ⚡ Démarrage Immédiat (Mode Démo)

L'application fonctionne **maintenant** sans aucun serveur !

1. Ouvrez `index.html` dans votre navigateur
2. Cliquez sur "دخول" (Login)
3. Entrez n'importe quel identifiant (ex: "test" / "123")
4. ✅ Connecté !

**Fonctionnalités disponibles en mode démo :**
- ✅ Navigation complète
- ✅ Hifz (jeu de mémorisation)
- ✅ Statistiques locales
- ✅ Thème clair/sombre
- ✅ Tâches de démo

**Nécessite un backend :**
- ❌ Sauvegarde sur serveur
- ❌ Authentification réelle
- ❌ Multi-utilisateurs
- ❌ Classement en ligne

---

## 🔧 Configuration Backend (Optionnel)

Pour connecter à un vrai backend, modifiez dans `script.js` :

```javascript
// Ligne ~383
const API_BASE_URL = 'https://votre-backend.com';
// ou pour local
const API_BASE_URL = 'http://localhost:8000';
```

---

## 🆘 Besoin d'aide ?

| Problème | Solution |
|----------|----------|
| Docker ne démarre pas | Vérifiez que Docker Desktop est lancé |
| Port 80 occupé | Modifiez le port dans `docker-compose.yml` |
| GitHub Pages 404 | Vérifiez que le repo est **Public** |
| CORS errors | Ajoutez votre domaine dans `CORS_ALLOWED_ORIGINS` du backend |

---

## 📞 Ressources

- **Guide complet Docker** : `DOCKER-README.md`
- **Guide complet GitHub Pages** : `GITHUB-PAGES-README.md`
- **Guide de déploiement** : `DEPLOYMENT-GUIDE.md`

---

**🎉 Prêt à déployer ?**

→ Docker : `docker-compose up`
→ GitHub Pages : Suivez les étapes dans `GITHUB-PAGES-README.md`

**L'application QuranReview Pro est prête !** 🕌✨
