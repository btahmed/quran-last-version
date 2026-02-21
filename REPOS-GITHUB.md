# Configuration des Repositories GitHub 🔄

## 📦 Deux Repositories Distincts

Votre projet QuranReview est maintenant organisé en DEUX repositories GitHub séparés:

### 1️⃣ Repository Principal (Production)
**URL:** https://github.com/btahmed/QuranReview  
**Remote:** `origin`  
**Branche:** `main`

**Contenu:**
- ✅ Code propre et déployable
- ✅ Application web fonctionnelle
- ✅ Documentation minimale (README.md)
- ✅ Prêt pour GitHub Pages
- ✅ Pas d'outils de développement
- ✅ Pas de fichiers de test

**Usage:**
- Site web en production: https://quranreview.live
- Code source propre pour les utilisateurs
- Déploiement automatique via GitHub Pages

**Commit actuel:** `7125233` (version propre avant modifications)

---

### 2️⃣ Repository Version Locale (Développement)
**URL:** https://github.com/btahmed/quran-last-version  
**Remote:** `origin-local`  
**Branche:** `main`

**Contenu:**
- ✅ TOUT le code de développement
- ✅ Outils de migration TypeScript
- ✅ Outils d'import Excel
- ✅ Pipeline IA
- ✅ Documentation complète
- ✅ Scripts de test
- ✅ Historique complet du développement
- ✅ Fichiers de configuration
- ✅ Spécifications Kiro (.kiro/specs/)

**Usage:**
- Développement local
- Tests et validation
- Documentation technique
- Outils de migration et import

**Commit actuel:** `b2e00ec` (version locale avec documentation)

---

## 🔄 Workflow Git

### Vérifier les Remotes Configurés
```powershell
git remote -v
```

**Résultat attendu:**
```
origin          https://github.com/btahmed/QuranReview (fetch)
origin          https://github.com/btahmed/QuranReview (push)
origin-local    https://github.com/btahmed/quran-last-version.git (fetch)
origin-local    https://github.com/btahmed/quran-last-version.git (push)
```

### Pousser vers le Repository Principal (Production)
```powershell
git push origin main
```

⚠️ **ATTENTION:** Ne pousser vers `origin` que du code propre et testé!

### Pousser vers le Repository Local (Développement)
```powershell
git push origin-local main
```

✅ **RECOMMANDÉ:** Pousser régulièrement tout votre travail ici.

### Vérifier l'État Actuel
```powershell
git log --oneline --graph --all --decorate -5
```

---

## 📊 Comparaison des Versions

| Aspect | QuranReview (Production) | quran-last-version (Développement) |
|--------|-------------------------|-----------------------------------|
| **Code** | Propre, minimaliste | Complet avec outils |
| **Documentation** | README basique | Documentation complète |
| **Outils** | Aucun | Migration + Import + IA |
| **Tests** | Basiques | Complets avec fixtures |
| **Scripts** | Aucun | Démarrage, test, validation |
| **Taille** | Léger (~10 MB) | Complet (~50+ MB) |
| **Usage** | Production publique | Développement privé |
| **Déploiement** | GitHub Pages | Local uniquement |

---

## 🎯 Quand Utiliser Quel Repository?

### Utiliser `origin` (QuranReview) pour:
- ✅ Déployer une nouvelle version en production
- ✅ Partager le code avec d'autres développeurs
- ✅ Mettre à jour le site web public
- ✅ Corrections de bugs critiques

### Utiliser `origin-local` (quran-last-version) pour:
- ✅ Sauvegarder tout votre travail de développement
- ✅ Conserver l'historique complet
- ✅ Stocker les outils de migration
- ✅ Garder la documentation technique
- ✅ Sauvegarder les scripts de test

---

## 🔐 Sécurité et Confidentialité

### Repository Principal (QuranReview)
- 🌍 **Public** - Visible par tous
- ⚠️ Ne JAMAIS commiter:
  - Mots de passe
  - Clés API
  - Données sensibles
  - Fichiers de configuration avec credentials

### Repository Local (quran-last-version)
- 🔒 **Privé** (recommandé) ou Public
- ⚠️ Même règle: pas de credentials!
- ✅ Peut contenir:
  - Documentation interne
  - Scripts de test
  - Outils de développement
  - Fichiers de configuration (sans credentials)

---

## 📝 Commandes Utiles

### Voir les Différences entre les Deux Versions
```powershell
# Voir les commits dans origin-local qui ne sont pas dans origin
git log origin/main..origin-local/main --oneline
```

### Synchroniser les Deux Repositories
```powershell
# Pousser vers les deux en même temps
git push origin main
git push origin-local main
```

### Créer un Nouveau Commit
```powershell
# Ajouter les fichiers modifiés
git add .

# Créer le commit
git commit -m "Description des changements"

# Pousser vers le repo de développement
git push origin-local main

# (Optionnel) Pousser vers le repo de production
git push origin main
```

### Revenir à une Version Précédente
```powershell
# Voir l'historique
git log --oneline

# Revenir à un commit spécifique (exemple)
git reset --hard 7125233

# Forcer la mise à jour sur GitHub
git push origin main --force
```

---

## 🚀 Workflow Recommandé

### 1. Développement Local
```powershell
# Faire des modifications
# Tester localement
# Valider avec les tests
```

### 2. Commit et Push vers Développement
```powershell
git add .
git commit -m "Description des changements"
git push origin-local main
```

### 3. Nettoyage pour Production (si nécessaire)
```powershell
# Supprimer les fichiers de développement
# Nettoyer le code
# Tester la version propre
```

### 4. Push vers Production (quand prêt)
```powershell
git push origin main
```

---

## 📂 Structure Actuelle

### Dans QuranReviewSurGit/ (Local)
```
QuranReviewSurGit/
├── .git/
│   └── config (contient les deux remotes)
├── VERSION-LOCALE-README.md    ← Documentation version locale
├── GUIDE-COMPLET.md             ← Guide complet
├── DEMARRER-APPLICATION.ps1     ← Script de démarrage
├── REPOS-GITHUB.md              ← Ce fichier
├── index.html                   ← Application principale
├── style.css
├── script.js
├── ancien django/               ← Backend Django
├── version-locale/              ← Outils de migration
└── ... (autres fichiers)
```

### Sur GitHub

**QuranReview (origin):**
- Commit: `7125233`
- Fichiers: Application web propre
- Taille: ~10 MB

**quran-last-version (origin-local):**
- Commit: `b2e00ec`
- Fichiers: Tout le développement
- Taille: ~50+ MB

---

## ✅ État Actuel (Février 2026)

- ✅ Deux repositories configurés et fonctionnels
- ✅ Version propre sur QuranReview (commit 7125233)
- ✅ Version complète sur quran-last-version (commit b2e00ec)
- ✅ Documentation ajoutée à la version locale
- ✅ Scripts de démarrage créés
- ✅ Remotes configurés correctement

---

## 🆘 Aide Rapide

### Problème: Je ne sais pas vers quel repo pousser
**Solution:** Par défaut, utilisez `origin-local` pour tout votre travail.

### Problème: J'ai poussé par erreur vers origin
**Solution:** Vous pouvez revenir en arrière avec `git reset` et `git push --force`.

### Problème: Les deux repos sont désynchronisés
**Solution:** C'est normal! Ils ont des objectifs différents.

### Problème: Je veux fusionner les deux
**Solution:** Ce n'est pas recommandé. Gardez-les séparés pour la clarté.

---

**Dernière mise à jour:** Février 2026  
**Version:** 1.0 - Configuration initiale des deux repositories
