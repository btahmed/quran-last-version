# QuranReview - Version Locale Complète 🕌

Cette version contient TOUT le travail de développement, documentation, et outils de migration.

## 📁 Structure du Projet

```
QuranReviewSurGit/
├── 📱 APPLICATION PRINCIPALE
│   ├── index.html              # Point d'entrée de l'application
│   ├── style.css               # Styles principaux
│   ├── script.js               # Logique JavaScript
│   └── manifest.json           # Configuration PWA
│
├── 🔧 BACKEND DJANGO
│   └── ancien django/MYSITEE/MYSITEE/
│       ├── manage.py           # Gestionnaire Django
│       ├── mysite/             # Configuration principale
│       │   ├── settings.py     # Paramètres Django
│       │   ├── api_views_admin.py  # API administration
│       │   └── security_utils.py   # Utilitaires sécurité
│       ├── tasks/              # Application principale
│       └── submissions/        # Gestion des soumissions
│
├── 🛠️ OUTILS DE MIGRATION
│   └── version-locale/migration-tools/
│       ├── src/
│       │   ├── palette-corrector.ts    # Correction des palettes de couleurs
│       │   ├── style-migrator.ts       # Migration des styles
│       │   └── html-updater.ts         # Mise à jour HTML
│       └── dist/                       # Fichiers compilés
│
├── 📊 OUTILS D'IMPORT
│   └── (voir QuranReviewLocal/import_tools/)
│       ├── cli.py              # Interface en ligne de commande
│       ├── excel_reader.py     # Lecture fichiers Excel
│       ├── api_client.py       # Client API Django
│       └── password_generator.py   # Génération mots de passe
│
├── 🤖 PIPELINE IA
│   └── ai_pipeline/
│       ├── src/
│       │   ├── pipeline.py     # Pipeline principal
│       │   ├── review.py       # Système de révision
│       │   └── prompts.py      # Prompts IA
│       └── tests/              # Tests du pipeline
│
└── 📚 DOCUMENTATION
    ├── README.md               # Documentation principale
    ├── DEPLOYMENT-GUIDE.md     # Guide de déploiement
    ├── SECURITY.md             # Sécurité
    └── SPEC-PACK.md            # Spécifications
```

## 🚀 Démarrage Rapide

### 1. Backend Django (Port 8000)
```powershell
cd "ancien django/MYSITEE/MYSITEE"
.venv\Scripts\Activate.ps1
python manage.py runserver
```

### 2. Frontend HTTP Server (Port 3000)
```powershell
python -m http.server 3000
```

### 3. Accéder à l'Application
Ouvrir dans le navigateur: `http://localhost:3000`

## 🔑 Identifiants Admin

- **Username:** `administrateur`
- **Password:** `admin123`

## 🛠️ Outils de Migration TypeScript

Les outils de migration sont dans `version-locale/migration-tools/`:

### Compilation
```bash
cd version-locale/migration-tools
npm install
npm run build
```

### Utilisation
```bash
# Corriger les palettes de couleurs
node dist/palette-corrector.js

# Migrer les styles
node dist/style-migrator.js

# Mettre à jour le HTML
node dist/html-updater.js
```

### Tests
```bash
npm test
```

Tous les tests passent (100% de réussite) ✅

## 📦 Import d'Étudiants depuis Excel

Voir `QuranReviewLocal/import_tools/` pour les outils d'import:

```bash
cd import_tools
python cli.py import template_students.xlsx
```

## 🔄 Différences avec la Version GitHub Propre

### Version GitHub (QuranReview)
- ✅ Code propre et déployable
- ✅ Prêt pour la production
- ✅ Documentation minimale
- ❌ Pas d'outils de développement
- ❌ Pas de documentation détaillée

### Version Locale (quran-last-version)
- ✅ Tout le code de développement
- ✅ Tous les outils de migration
- ✅ Documentation complète
- ✅ Scripts de test
- ✅ Historique complet du développement
- ✅ Outils d'import Excel
- ✅ Pipeline IA

## 📝 Documentation Complète

Voir `QuranReviewLocal/` pour:
- `🚀-START-HERE.md` - Guide de démarrage
- `🚨-LIRE-AVANT.md` - Informations importantes
- `DEBUG-GUIDE.md` - Guide de débogage
- `DEPLOYMENT-GUIDE.md` - Guide de déploiement
- `LANCEMENT-RAPIDE.md` - Lancement rapide

## 🧪 Tests

### Tests Backend Django
```bash
cd "ancien django/MYSITEE/MYSITEE"
python manage.py test
```

### Tests Migration Tools
```bash
cd version-locale/migration-tools
npm test
```

### Tests Import Tools
```bash
cd import_tools
pytest
```

## 🔧 Configuration

### Backend Django
Fichier: `ancien django/MYSITEE/MYSITEE/mysite/settings.py`

### Frontend
Fichier: `audio-config.js` pour la configuration audio

### Import Tools
Fichier: `import_tools/config.json` (copier depuis `config.json.example`)

## 📊 État Actuel

- ✅ Backend Django fonctionnel
- ✅ Frontend fonctionnel
- ✅ Authentification opérationnelle
- ✅ Outils de migration testés et validés
- ✅ Import Excel fonctionnel
- ✅ Pipeline IA opérationnel

## 🐛 Résolution de Problèmes

### Erreur de connexion au backend
```powershell
# Vérifier que le backend tourne
curl http://127.0.0.1:8000/api/token/
```

### Erreur CORS
Le frontend doit être servi via HTTP (pas file://):
```powershell
python -m http.server 3000
```

### Erreur de compilation TypeScript
```bash
cd version-locale/migration-tools
npm install
npm run build
```

## 📞 Support

Pour toute question, voir la documentation dans `QuranReviewLocal/` ou consulter les fichiers de spécifications dans `.kiro/specs/`.

---

**Note:** Cette version contient TOUT le travail de développement. Pour la version propre et déployable, voir le repo principal: https://github.com/btahmed/QuranReview
