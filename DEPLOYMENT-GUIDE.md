# 🚀 Guide de Déploiement - QuranReview

Vous avez deux options pour déployer l'application :

---

## Option 1 : 🐳 Docker (Recommandé pour développement local)

Tout-en-un : Frontend + Backend sur votre machine.

### Prérequis
- [Docker Desktop](https://www.docker.com/products/docker-desktop) installé

### Installation rapide

```powershell
# 1. Double-cliquez sur setup-docker.bat
# ou exécutez dans PowerShell :
.\setup-docker.bat

# 2. Placez votre backend Django dans le dossier backend/

# 3. Lancez Docker Desktop

# 4. Démarrez l'application
docker-compose up --build
```

### URLs
- **Frontend** : http://localhost
- **Backend API** : http://localhost:8000/api/
- **Admin Django** : http://localhost:8000/admin/

### Commandes utiles
```bash
# Démarrer
docker-compose up -d

# Arrêter
docker-compose down

# Voir les logs
docker-compose logs -f

# Reconstruire
docker-compose up --build
```

📖 **Doc complète** : Voir `DOCKER-README.md`

---

## Option 2 : 📄 GitHub Pages (Gratuit, Frontend uniquement)

Hébergement gratuit du frontend (HTML/CSS/JS) sur GitHub.

### Prérequis
- Compte GitHub (gratuit)

### Étapes rapides

1. **Créer un repo** sur https://github.com/new
   - Nom : `quranreview`
   - Visibilité : **Public**
   - ✅ Cochez "Add a README"

2. **Uploader les fichiers** :
   - Allez sur votre repo GitHub
   - "Add file" → "Upload files"
   - Uploadez : `index.html`, `style-pro.css`, `script.js`

3. **Activer GitHub Pages** :
   - Settings → Pages
   - Source : **GitHub Actions**

4. **Attendre le déploiement** :
   - Allez dans l'onglet "Actions"
   - Attendez le ✅ vert
   - Votre URL : `https://votrenom.github.io/quranreview/`

### Pour le Backend

GitHub Pages = frontend statique uniquement. Pour le backend :

**Option A** : Déployer Django sur Railway (gratuit)
```
1. Allez sur https://railway.app
2. Connectez votre repo GitHub du backend
3. Déployez automatiquement
```

**Option B** : Utiliser le mode démo (fonctionne sans serveur)

📖 **Doc complète** : Voir `GITHUB-PAGES-README.md`

---

## Comparaison

| Fonctionnalité | 🐳 Docker | 📄 GitHub Pages |
|---------------|-----------|-----------------|
| **Coût** | Gratuit | Gratuit |
| **Backend inclus** | ✅ Oui | ❌ Non (séparé) |
| **Base de données** | ✅ SQLite/PostgreSQL | ❌ N/A |
| **Installation** | Docker requis | Aucune |
| **URL personnalisée** | Votre domaine | github.io ou custom |
| **Parfait pour** | Développement, Tests | Démo, Partage |

---

## 🔧 Configuration API

### Mode Démo (par défaut)
Quand vous ouvrez le fichier directement (`file://`), l'app fonctionne en mode démo sans serveur.

### Avec Backend
Modifiez la ligne dans `script.js` :
```javascript
// Ligne ~383
const API_BASE_URL = 'https://votre-backend.com';  // Votre URL backend
```

---

## 🆘 Dépannage

### Docker
```bash
# Problème de ports déjà utilisés
docker-compose down
docker-compose up

# Reset complet
docker-compose down -v
docker system prune -a
```

### GitHub Pages
```
# Site ne s'affiche pas
→ Vérifiez que le repo est Public
→ Vérifiez l'onglet Actions pour les erreurs

# 404 sur les pages
→ Vérifiez que index.html est à la racine
→ Attendez 2-3 minutes après le push
```

---

## 📞 Support

- **Docker** : https://docs.docker.com/
- **GitHub Pages** : https://pages.github.com/
- **Railway** (Backend gratuit) : https://railway.app

---

**Prêt à déployer ?** 🚀

- Pour Docker : Lancez `setup-docker.bat` puis `docker-compose up`
- Pour GitHub Pages : Suivez les étapes dans `GITHUB-PAGES-README.md`
