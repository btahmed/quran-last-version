# Structure du Projet QuranReview 📁

## 📂 Vue d'Ensemble

```
QuranReviewSurGit/
├── 📱 APPLICATION WEB
├── 🔧 BACKEND DJANGO
├── 🛠️ OUTILS DE MIGRATION
├── 📊 OUTILS D'IMPORT
├── 🤖 PIPELINE IA
└── 📚 DOCUMENTATION
```

---

## 📱 APPLICATION WEB (Frontend)

### Fichiers Principaux
```
QuranReviewSurGit/
├── index.html              # Point d'entrée de l'application
├── style.css               # Styles principaux
├── script.js               # Logique JavaScript
├── manifest.json           # Configuration PWA
├── sw.js                   # Service Worker
└── audio-config.js         # Configuration audio
```

**Description:**
- Application web progressive (PWA)
- Interface utilisateur pour révision du Coran
- Système de mémorisation et suivi de progression
- Support audio pour récitation
- Mode hors ligne

**Démarrage:**
```powershell
python -m http.server 3000
# Ouvrir http://localhost:3000
```

---

## 🔧 BACKEND DJANGO

### Structure
```
ancien django/MYSITEE/MYSITEE/
├── manage.py                   # Gestionnaire Django
├── mysite/                     # Configuration principale
│   ├── settings.py             # Paramètres Django
│   ├── urls.py                 # Routes principales
│   ├── api_views_admin.py      # API administration
│   └── security_utils.py       # Utilitaires sécurité
├── tasks/                      # Application principale
│   ├── models.py               # Modèles de données
│   ├── views.py                # Vues
│   ├── admin.py                # Interface admin
│   ├── static/                 # Fichiers statiques
│   │   ├── admin-styles.css
│   │   └── js/
│   │       ├── admin-classes.js
│   │       ├── admin-student-profile.js
│   │       └── sync-manager.js
│   └── templates/              # Templates HTML
│       └── tasks/
│           └── admin-classes.html
├── submissions/                # Gestion des soumissions
│   ├── models.py
│   ├── views.py
│   └── services.py
└── points/                     # Système de points
    └── models.py
```

**Fonctionnalités:**
- ✅ API REST pour authentification
- ✅ Gestion des utilisateurs (étudiants, professeurs, admin)
- ✅ Système de tâches et soumissions
- ✅ Gestion des classes et groupes
- ✅ Système de points et progression
- ✅ Interface d'administration avancée

**Démarrage:**
```powershell
cd "ancien django\MYSITEE\MYSITEE"
.venv\Scripts\Activate.ps1
python manage.py runserver
# API disponible sur http://127.0.0.1:8000
```

**Endpoints Principaux:**
- `/api/token/` - Authentification JWT
- `/api/admin/users/` - Gestion utilisateurs
- `/api/admin/classes/` - Gestion classes
- `/api/tasks/` - Gestion tâches
- `/api/submissions/` - Soumissions

---

## 🛠️ OUTILS DE MIGRATION

### Structure
```
version-locale/migration-tools/
├── src/
│   ├── palette-corrector.ts    # Correction palettes couleurs
│   ├── style-migrator.ts       # Migration styles CSS
│   ├── html-updater.ts         # Mise à jour HTML
│   └── __tests__/              # Tests unitaires
│       └── palette-corrector.test.ts
├── dist/                       # Fichiers compilés
├── package.json
├── tsconfig.json
└── README.md
```

**Fonctionnalités:**

### 1. Palette Corrector
Corrige automatiquement les couleurs pour respecter WCAG AA (contraste 4.5:1).

**Utilisation:**
```bash
cd version-locale/migration-tools
npm install
npm run build
node dist/palette-corrector.js
```

**Caractéristiques:**
- ✅ Validation WCAG AA automatique
- ✅ Ajustement des couleurs par recherche binaire
- ✅ Support modes clair et sombre
- ✅ Préservation des couleurs rgba
- ✅ 32 tests unitaires (100% de réussite)

### 2. Style Migrator
Migre les styles CSS entre différentes versions.

### 3. HTML Updater
Met à jour les fichiers HTML avec nouvelles classes et structures.

**Tests:**
```bash
npm test
# Résultat: 32/32 tests passent ✅
```

---

## 📊 OUTILS D'IMPORT

### Structure
```
import_tools/                   # (Dans QuranReviewLocal/)
├── cli.py                      # Interface ligne de commande
├── excel_reader.py             # Lecture fichiers Excel
├── api_client.py               # Client API Django
├── password_generator.py       # Génération mots de passe
├── data_validator.py           # Validation données
├── report_generator.py         # Génération rapports
├── template_generator.py       # Génération templates
├── config.py                   # Configuration
├── config.json.example         # Exemple configuration
├── template_students.xlsx      # Template Excel
├── tests/                      # Tests
│   ├── test_basic_integration.py
│   └── test_performance.py
└── README.md
```

**Fonctionnalités:**
- ✅ Import étudiants depuis Excel
- ✅ Validation automatique des données
- ✅ Génération mots de passe sécurisés
- ✅ Création comptes utilisateurs
- ✅ Assignation aux classes
- ✅ Génération rapports détaillés
- ✅ Export identifiants

**Utilisation:**
```bash
cd import_tools
python cli.py import template_students.xlsx
python cli.py verify
```

**Configuration:**
```json
{
  "api_base_url": "http://127.0.0.1:8000",
  "admin_username": "administrateur",
  "admin_password": "admin123"
}
```

---

## 🤖 PIPELINE IA

### Structure
```
ai_pipeline/
├── src/
│   ├── pipeline.py             # Pipeline principal
│   ├── review.py               # Système de révision
│   ├── prompts.py              # Prompts IA
│   ├── templates.py            # Templates
│   ├── model_caller.py         # Appel modèles IA
│   └── output_contract.py      # Contrat de sortie
├── tests/
│   ├── test_review.py
│   ├── test_prompts_and_caller.py
│   └── test_templates.py
├── n8n/
│   └── workflow_v1.json        # Workflow n8n
├── requirements.txt
└── README.md
```

**Fonctionnalités:**
- ✅ Révision automatique des soumissions
- ✅ Génération de feedback IA
- ✅ Évaluation de la mémorisation
- ✅ Suggestions d'amélioration
- ✅ Intégration n8n

**Utilisation:**
```bash
cd ai_pipeline
pip install -r requirements.txt
python src/pipeline.py
```

---

## 📚 DOCUMENTATION

### Fichiers de Documentation
```
QuranReviewSurGit/
├── README.md                   # Documentation principale
├── VERSION-LOCALE-README.md    # Vue d'ensemble version locale
├── GUIDE-COMPLET.md            # Guide complet d'utilisation
├── REPOS-GITHUB.md             # Configuration GitHub
├── STRUCTURE-PROJET.md         # Ce fichier
├── DEPLOYMENT-GUIDE.md         # Guide de déploiement
├── SECURITY.md                 # Sécurité
├── SPEC-PACK.md                # Spécifications
├── README-AUDIO.md             # Configuration audio
└── README-AUDIO-LOCAL.md       # Audio local
```

### Scripts de Démarrage
```
QuranReviewSurGit/
├── DEMARRER-APPLICATION.ps1    # Démarrage automatique
└── LANCER.ps1                  # Script de lancement
```

### Spécifications Kiro
```
.kiro/specs/
├── admin-advanced-management/
│   ├── requirements.md
│   ├── design.md
│   └── tasks.md
├── backend-local-configuration/
│   ├── requirements.md
│   ├── design.md
│   └── tasks.md
├── excel-student-import/
│   ├── requirements.md
│   ├── design.md
│   └── tasks.md
└── style-migration-from-local-to-github/
    ├── requirements.md
    ├── design.md
    └── tasks.md
```

---

## 🔄 Autres Dossiers

### Frontend (Alternative)
```
frontend/
├── index.html
├── style.css
├── script.js
└── Dockerfile
```
Version alternative du frontend (pour Docker).

### Backend (Alternative)
```
backend/
├── manage.py
├── requirements.txt
├── Dockerfile
└── quranreview/
```
Version alternative du backend (pour Docker).

### Tests
```
tests/
└── audio-config.test.js
```
Tests supplémentaires.

### Verification
```
verification/
├── verify_logout.py
├── verify_registration.py
└── *.png (screenshots)
```
Scripts de vérification et captures d'écran.

### Audio
```
audio/
└── .gitkeep
```
Dossier pour fichiers audio (vide par défaut).

---

## 📊 Taille des Dossiers

| Dossier | Taille Approximative | Description |
|---------|---------------------|-------------|
| `ancien django/` | ~5 MB | Backend Django complet |
| `version-locale/migration-tools/` | ~50 MB | Outils TypeScript + node_modules |
| `import_tools/` | ~2 MB | Outils Python d'import |
| `ai_pipeline/` | ~1 MB | Pipeline IA |
| `.git/` | ~10 MB | Historique Git |
| Autres fichiers | ~2 MB | Documentation, scripts |
| **TOTAL** | **~70 MB** | Projet complet |

---

## 🚀 Démarrage Rapide

### 1. Tout Démarrer Automatiquement
```powershell
.\DEMARRER-APPLICATION.ps1
```

### 2. Démarrage Manuel

**Backend:**
```powershell
cd "ancien django\MYSITEE\MYSITEE"
.venv\Scripts\Activate.ps1
python manage.py runserver
```

**Frontend:**
```powershell
python -m http.server 3000
```

**Ouvrir:**
```
http://localhost:3000
```

---

## 🔑 Identifiants

**Admin:**
- Username: `administrateur`
- Password: `admin123`

---

## 📝 Notes Importantes

1. **Ne PAS ouvrir index.html directement** (file://)
   - Utiliser un serveur HTTP pour éviter les erreurs CORS

2. **Backend doit tourner** pour que le frontend fonctionne
   - Port 8000 pour le backend
   - Port 3000 pour le frontend

3. **Outils de migration** nécessitent Node.js
   - Installer avec `npm install`
   - Compiler avec `npm run build`

4. **Import tools** nécessitent Python 3.8+
   - Installer avec `pip install -r requirements.txt`

---

**Dernière mise à jour:** Février 2026  
**Version:** 1.0 - Structure complète du projet
