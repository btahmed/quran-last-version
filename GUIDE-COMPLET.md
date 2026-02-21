# Guide Complet - QuranReview Version Locale 🕌

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Installation et Configuration](#installation-et-configuration)
3. [Démarrage de l'Application](#démarrage-de-lapplication)
4. [Outils de Migration](#outils-de-migration)
5. [Import d'Étudiants](#import-détudiants)
6. [Tests et Validation](#tests-et-validation)
7. [Résolution de Problèmes](#résolution-de-problèmes)

---

## 🎯 Vue d'ensemble

Cette version locale contient:
- ✅ Application web complète (frontend + backend)
- ✅ Outils de migration TypeScript (palette de couleurs, styles, HTML)
- ✅ Outils d'import Excel pour étudiants
- ✅ Pipeline IA pour révision automatique
- ✅ Documentation complète
- ✅ Scripts de test

### Différence avec la Version GitHub Propre

| Aspect | Version GitHub | Version Locale |
|--------|---------------|----------------|
| Code | Propre, déployable | Complet avec outils |
| Documentation | Minimale | Complète |
| Outils | Aucun | Migration + Import |
| Tests | Basiques | Complets |
| Usage | Production | Développement |

---

## 🔧 Installation et Configuration

### Prérequis

1. **Python 3.8+**
   ```powershell
   python --version
   ```

2. **Node.js 14+** (pour les outils de migration)
   ```powershell
   node --version
   ```

3. **Git**
   ```powershell
   git --version
   ```

### Configuration Backend Django

1. Naviguer vers le dossier backend:
   ```powershell
   cd "ancien django\MYSITEE\MYSITEE"
   ```

2. Activer l'environnement virtuel:
   ```powershell
   .venv\Scripts\Activate.ps1
   ```

3. Installer les dépendances (si nécessaire):
   ```powershell
   pip install -r requirements.txt
   ```

4. Appliquer les migrations:
   ```powershell
   python manage.py migrate
   ```

5. Créer un superutilisateur (si nécessaire):
   ```powershell
   python manage.py createsuperuser
   ```

### Configuration Outils de Migration

1. Naviguer vers le dossier migration-tools:
   ```powershell
   cd version-locale\migration-tools
   ```

2. Installer les dépendances:
   ```bash
   npm install
   ```

3. Compiler le TypeScript:
   ```bash
   npm run build
   ```

---

## 🚀 Démarrage de l'Application

### Méthode 1: Script Automatique (Recommandé)

Double-cliquer sur `DEMARRER-APPLICATION.ps1` ou exécuter:
```powershell
.\DEMARRER-APPLICATION.ps1
```

Ce script:
- ✅ Démarre le backend Django (port 8000)
- ✅ Démarre le serveur HTTP frontend (port 3000)
- ✅ Ouvre automatiquement le navigateur

### Méthode 2: Démarrage Manuel

#### Étape 1: Backend Django
```powershell
cd "ancien django\MYSITEE\MYSITEE"
.venv\Scripts\Activate.ps1
python manage.py runserver
```

#### Étape 2: Frontend HTTP Server
Dans une nouvelle fenêtre PowerShell:
```powershell
python -m http.server 3000
```

#### Étape 3: Ouvrir le Navigateur
Naviguer vers: `http://localhost:3000`

### Identifiants de Connexion

- **Username:** `administrateur`
- **Password:** `admin123`

---

## 🛠️ Outils de Migration

Les outils de migration TypeScript permettent de:
- Corriger les palettes de couleurs pour WCAG AA
- Migrer les styles CSS
- Mettre à jour le HTML

### Palette Corrector

Corrige automatiquement les couleurs pour respecter WCAG AA (contraste 4.5:1).

```bash
cd version-locale\migration-tools
node dist\palette-corrector.js
```

**Fonctionnalités:**
- ✅ Validation WCAG AA automatique
- ✅ Ajustement des couleurs par recherche binaire
- ✅ Support des modes clair et sombre
- ✅ Préservation des couleurs rgba

**Tests:**
```bash
npm test
```
Résultat: 32/32 tests passent (100%) ✅

### Style Migrator

Migre les styles CSS entre différentes versions.

```bash
node dist\style-migrator.js
```

### HTML Updater

Met à jour les fichiers HTML avec les nouvelles classes et structures.

```bash
node dist\html-updater.js
```

---

## 📊 Import d'Étudiants

Les outils d'import permettent d'importer des étudiants depuis Excel.

### Localisation

Les outils sont dans `QuranReviewLocal/import_tools/` (pas encore copiés dans QuranReviewSurGit).

### Configuration

1. Copier le fichier de configuration:
   ```bash
   cp config.json.example config.json
   ```

2. Éditer `config.json` avec vos paramètres:
   ```json
   {
     "api_base_url": "http://127.0.0.1:8000",
     "admin_username": "administrateur",
     "admin_password": "admin123"
   }
   ```

### Utilisation

1. Préparer le fichier Excel (voir `template_students.xlsx`)

2. Lancer l'import:
   ```bash
   python cli.py import votre_fichier.xlsx
   ```

3. Vérifier les résultats:
   ```bash
   python cli.py verify
   ```

### Fonctionnalités

- ✅ Lecture Excel avec validation
- ✅ Génération automatique de mots de passe
- ✅ Création de comptes étudiants
- ✅ Assignation aux classes
- ✅ Génération de rapports
- ✅ Export des identifiants

---

## 🧪 Tests et Validation

### Tests Backend Django

```powershell
cd "ancien django\MYSITEE\MYSITEE"
.venv\Scripts\Activate.ps1
python manage.py test
```

### Tests Outils de Migration

```bash
cd version-locale\migration-tools
npm test
```

**Résultats attendus:**
- ✅ 32 tests de palette-corrector
- ✅ Tous les tests passent (100%)

### Tests Import Tools

```bash
cd import_tools
pytest
```

### Test Manuel de Connexion

```bash
curl -X POST http://127.0.0.1:8000/api/token/ ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"administrateur\",\"password\":\"admin123\"}"
```

Résultat attendu: Token JWT

---

## 🐛 Résolution de Problèmes

### Problème: Backend ne démarre pas

**Symptômes:**
- Erreur "Port already in use"
- Erreur de module manquant

**Solutions:**
1. Vérifier qu'aucun autre processus n'utilise le port 8000:
   ```powershell
   netstat -ano | findstr :8000
   ```

2. Tuer le processus si nécessaire:
   ```powershell
   taskkill /PID <PID> /F
   ```

3. Réinstaller les dépendances:
   ```powershell
   pip install -r requirements.txt
   ```

### Problème: Erreur CORS

**Symptômes:**
- "Access-Control-Allow-Origin" error
- Requêtes bloquées par le navigateur

**Solution:**
Ne PAS ouvrir `index.html` directement (file://). Utiliser le serveur HTTP:
```powershell
python -m http.server 3000
```

### Problème: Erreur de compilation TypeScript

**Symptômes:**
- Erreurs lors de `npm run build`
- Fichiers dist/ manquants

**Solutions:**
1. Nettoyer et réinstaller:
   ```bash
   rm -rf node_modules dist
   npm install
   npm run build
   ```

2. Vérifier la version de Node.js:
   ```bash
   node --version  # Doit être 14+
   ```

### Problème: Tests échouent

**Symptômes:**
- Tests palette-corrector échouent
- Erreurs de contraste WCAG

**Solution:**
Les tests valident maintenant les propriétés WCAG, pas les valeurs exactes. Si les tests échouent:

1. Vérifier que le code compile:
   ```bash
   npm run build
   ```

2. Relancer les tests:
   ```bash
   npm test
   ```

3. Vérifier les logs pour identifier le problème spécifique

### Problème: Import Excel échoue

**Symptômes:**
- Erreur de connexion API
- Erreur de validation

**Solutions:**
1. Vérifier que le backend tourne:
   ```bash
   curl http://127.0.0.1:8000/api/token/
   ```

2. Vérifier le fichier de configuration:
   ```bash
   cat config.json
   ```

3. Vérifier le format Excel (voir template_students.xlsx)

---

## 📚 Documentation Additionnelle

### Fichiers de Documentation

- `VERSION-LOCALE-README.md` - Vue d'ensemble de la version locale
- `README.md` - Documentation principale
- `DEPLOYMENT-GUIDE.md` - Guide de déploiement
- `SECURITY.md` - Sécurité
- `SPEC-PACK.md` - Spécifications techniques

### Spécifications Kiro

Voir `.kiro/specs/` pour les spécifications détaillées:
- `admin-advanced-management/` - Gestion avancée admin
- `backend-local-configuration/` - Configuration backend
- `excel-student-import/` - Import Excel
- `style-migration-from-local-to-github/` - Migration styles

---

## 🔄 Workflow de Développement

### 1. Développement Local

1. Faire des modifications dans le code
2. Tester localement avec les scripts de démarrage
3. Valider avec les tests automatisés

### 2. Migration vers GitHub Propre

1. Utiliser les outils de migration pour nettoyer le code
2. Tester la version migrée
3. Pousser vers le repo principal (QuranReview)

### 3. Sauvegarde Version Locale

1. Commiter tous les changements locaux
2. Pousser vers le repo local (quran-last-version)

---

## 📞 Support et Ressources

### Commandes Utiles

```powershell
# Vérifier l'état des serveurs
netstat -ano | findstr :8000  # Backend
netstat -ano | findstr :3000  # Frontend

# Logs Django
cd "ancien django\MYSITEE\MYSITEE"
python manage.py runserver --verbosity 3

# Tests avec détails
npm test -- --verbose
pytest -v
```

### Ressources

- GitHub (version propre): https://github.com/btahmed/QuranReview
- GitHub (version locale): https://github.com/btahmed/quran-last-version
- Site web: https://quranreview.live

---

**Dernière mise à jour:** Février 2026
**Version:** Locale complète avec tous les outils
