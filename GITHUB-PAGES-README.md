# 📄 GitHub Pages Deployment

## Déploiement automatique en 3 étapes

### Étape 1 : Créer un repo GitHub

1. Allez sur https://github.com/new
2. Nom du repo : `quranreview` (ou autre)
3. Visibilité : **Public** (nécessaire pour GitHub Pages gratuit)
4. Cochez "Add a README file"
5. Cliquez sur **Create repository**

### Étape 2 : Uploader vos fichiers

**Option A - Interface web :**
1. Dans votre repo GitHub, cliquez sur "Add file" → "Upload files"
2. Uploadez ces fichiers :
   - `index.html`
   - `style-pro.css`
   - `style.css` (si existe)
   - `script.js`
   - `manifest.json` (si existe)
   - Dossier `assets/` (si existe)

**Option B - Ligne de commande :**
```bash
# Initialiser git
git init

# Ajouter le remote (remplacez USER par votre nom d'utilisateur)
git remote add origin https://github.com/USER/quranreview.git

# Ajouter les fichiers
git add .

# Commit
git commit -m "Initial commit"

# Push
git push -u origin main
```

**Option C - GitHub Desktop :**
1. Téléchargez GitHub Desktop : https://desktop.github.com/
2. Clonez votre repo
3. Copiez vos fichiers dans le dossier
4. Commit et Push

### Étape 3 : Activer GitHub Pages

1. Dans votre repo, allez dans **Settings** (onglet en haut)
2. Dans le menu de gauche, cliquez sur **Pages**
3. Section "Build and deployment" :
   - Source : **GitHub Actions**
4. Le workflow va se lancer automatiquement

### Vérifier le déploiement

1. Allez dans l'onglet **Actions** de votre repo
2. Attendez que le workflow "Deploy to GitHub Pages" soit vert ✅
3. Retournez dans **Settings** → **Pages**
4. Votre URL est affichée (ex: `https://votrenom.github.io/quranreview/`)

## Configuration du Backend

⚠️ **Important** : GitHub Pages ne supporte que les sites statiques (HTML/CSS/JS). 

Pour le backend Django, vous avez 2 options :

### Option 1 : Backend séparé (Recommandé)
1. Déployez le backend sur Railway/Render/Heroku
2. Modifiez `script.js` pour pointer vers votre backend :
   ```javascript
   const API_BASE_URL = 'https://votre-backend.railway.app';
   ```

### Option 2 : Mode Demo uniquement
Laissez l'app en mode démo (fonctionne sans serveur)

## Personnaliser le domaine (Optionnel)

### Utiliser un sous-domaine personnalisé
1. Allez dans **Settings** → **Pages**
2. Section "Custom domain"
3. Entrez votre domaine (ex: `quranreview.votredomaine.com`)
4. Ajoutez un CNAME dans vos DNS pointant vers `votrenom.github.io`

### Domaine racine (apex)
Pour utiliser `www.votresite.com` :
1. Configurez les DNS A records :
   ```
   185.199.108.153
   185.199.109.153
   185.199.110.153
   185.199.111.153
   ```
2. Et un CNAME pour `www` vers `votrenom.github.io`

## Mise à jour du site

### Mise à jour automatique
Chaque push sur la branche `main` déclenche un nouveau déploiement automatiquement !

### Modifier un fichier rapidement
1. Sur GitHub, cliquez sur le fichier
2. Cliquez sur l'icône ✏️ (Edit)
3. Modifiez et "Commit changes"
4. Le site se met à jour en ~2 minutes

## Dépannage

### Le site ne s'affiche pas
1. Vérifiez dans **Actions** si le workflow a échoué
2. Assurez-vous que le repo est **Public**
3. Vérifiez que `index.html` est à la racine

### Erreurs 404
- Vérifiez que tous les fichiers sont bien uploadés
- Les noms de fichiers sont sensibles à la casse (minuscules/majuscules)

### Les changements ne s'appliquent pas
- Videz le cache du navigateur (Ctrl+F5)
- Attendez 2-3 minutes (propagation CDN)
- Vérifiez dans **Actions** que le déploiement est terminé

### CORS errors avec le backend
Ajoutez votre domaine GitHub Pages dans `CORS_ALLOWED_ORIGINS` du backend :
```python
CORS_ALLOWED_ORIGINS = [
    "https://votrenom.github.io",
    "http://localhost:8000",
]
```

## Ressources

- Documentation GitHub Pages : https://pages.github.com/
- Custom domains : https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site
- GitHub Actions : https://github.com/features/actions

## Support

Si vous avez des problèmes :
1. Vérifiez l'onglet **Actions** pour voir les erreurs
2. Consultez les logs de déploiement
3. Ouvrez une issue sur GitHub
