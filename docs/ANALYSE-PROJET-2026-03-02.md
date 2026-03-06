# 📊 Analyse Projet QuranReview
**Date :** 02 mars 2026
**Dossier analysé :** `C:/Users/ahmad/quran.reviewer/QuranReviewLocal`
**Branche :** `feat/css-refonte`

---

## 1. Vue d'ensemble du projet

| Composant | Fichiers | Taille |
|-----------|----------|--------|
| Frontend root (GitHub Pages) | `index.html`, `style.css`, `script.js`, `audio-config.js` | script.js = 211 Ko / 5041 lignes |
| Frontend Docker | `frontend/index.html`, `style.css`, `style-pro.css` | style-pro.css = 26 Ko |
| Backend Django | `backend/api/`, `backend/authentication/` | views.py = 379+ lignes |
| Service Worker | `sw.js` | — |
| CI/CD | `.github/workflows/deploy.yml`, `django-ci.yml` | — |

---

## 2. 🔴 Bugs Critiques

### BUG-001 — `style-pro-fixes.css` manquant
- **Fichier concerné :** `frontend/index.html` ligne 27
- **Description :** Le fichier charge `style-pro-fixes.css` mais ce fichier n'existe pas dans `frontend/`
- **Impact :** Erreur 404 silencieuse au chargement — les corrections de contraste dark/light mode sont absentes
- **Fix :** Créer `frontend/style-pro-fixes.css` avec les variables de correction de contraste

---

### BUG-002 — Endpoint `/api/register/` incorrect
- **Fichier concerné :** `script.js` ligne 811
- **Description :** Le frontend appelle `POST /api/register/` mais Django route l'inscription à `/api/auth/register/`
- **Impact :** L'inscription utilisateur ne fonctionne pas — retourne 404
- **Fix :**
```javascript
// Avant (incorrect)
fetch(`${this.config.apiBaseUrl}/api/register/`, ...)
// Après (correct)
fetch(`${this.config.apiBaseUrl}/api/auth/register/`, ...)
```

---

### BUG-003 — Endpoint `admin/tasks/delete-all` absent du backend
- **Fichier concerné :** `script.js` ligne 4423
- **Description :** Le frontend appelle `POST /api/admin/tasks/delete-all/` mais cet endpoint n'existe pas dans `backend/api/urls.py`
- **Impact :** Le bouton "Supprimer toutes les tâches" retourne 404
- **Fix :** Créer la vue et l'URL dans `backend/api/`

---

### BUG-004 — Endpoint `admin/create-teacher` absent du backend
- **Fichier concerné :** `script.js` lignes 4782 et 4827
- **Description :** Le frontend appelle `POST /api/admin/create-teacher/` (appelé deux fois) mais absent de `urls.py`
- **Impact :** La création de professeur depuis l'interface admin retourne 404
- **Fix :** Créer la vue et l'URL dans `backend/api/` ou `backend/authentication/`

---

## 3. 🟠 Bugs Majeurs

### BUG-005 — `DEBUG = True` par défaut en production
- **Fichier concerné :** `backend/quranreview/settings.py` ligne 15
- **Description :** `DEBUG = os.environ.get('DEBUG', 'True') == 'True'` → si la variable d'env n'est pas définie, le mode debug est actif
- **Impact :** Fuite d'informations sensibles (stack traces, config Django) en production
- **Fix :**
```python
DEBUG = os.environ.get('DEBUG', 'False') == 'True'
```

---

### BUG-006 — `SECRET_KEY` insécurisée par défaut
- **Fichier concerné :** `backend/quranreview/settings.py` ligne 12
- **Description :** La clé par défaut `django-insecure-dev-key-change-in-production` est utilisée si la variable d'env n'est pas définie
- **Impact :** Tokens JWT et sessions compromis si déployé sans variable d'env
- **Fix :** Lever une exception si `SECRET_KEY` n'est pas défini en production

---

### BUG-007 — 60 `console.log` en production
- **Fichier concerné :** `script.js`
- **Description :** 60 instructions `console.log` laissées dans le code
- **Impact :** Fuite d'informations (tokens, données utilisateurs) dans la console navigateur
- **Fix :** Supprimer ou conditionner à `DEBUG_MODE`

---

### BUG-008 — `CORS_ALLOW_CREDENTIALS` défini deux fois
- **Fichier concerné :** `backend/quranreview/settings.py` lignes 131 et 134
- **Description :** Doublon de configuration CORS — signe de copier-coller
- **Impact :** Mineur mais confusion dans la config
- **Fix :** Supprimer le doublon

---

## 4. 🟡 Bugs Mineurs

### BUG-009 — `CORS_ALLOW_ALL_ORIGINS = True`
- **Fichier concerné :** `backend/quranreview/settings.py` ligne 130
- **Description :** Toutes les origines sont autorisées
- **Impact :** Dangereux en production — n'importe quel site peut appeler l'API
- **Fix :**
```python
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    "https://quranreview.live",
    "http://localhost:3000",
]
```

---

## 5. 🟢 Améliorations recommandées

### AME-001 — Découper `script.js` en modules
- **Priorité :** Basse | **Effort :** Grand
- **Description :** `script.js` fait 5041 lignes avec 173 fonctions — difficile à maintenir
- **Suggestion :** Séparer en modules : `auth.js`, `tasks.js`, `competition.js`, `audio.js`, `admin.js`

---

### AME-002 — Pagination sur les listes
- **Priorité :** Moyenne | **Effort :** Moyen
- **Description :** `/api/tasks/` et `/api/my-students/` retournent toutes les données sans pagination
- **Impact :** Lenteur avec beaucoup de données
- **Fix :** Ajouter `PageNumberPagination` dans les vues DRF concernées

---

### AME-003 — Améliorer la stratégie Service Worker
- **Priorité :** Basse | **Effort :** Moyen
- **Description :** Le cache PWA n'a pas de stratégie claire (stale-while-revalidate, cache-first, etc.)
- **Impact :** Expérience offline dégradée

---

### AME-004 — Unifier root et `frontend/`
- **Priorité :** Moyenne | **Effort :** Grand
- **Description :** Il existe deux versions du frontend (`root/` pour GitHub Pages, `frontend/` pour Docker) avec des divergences (style-pro.css absent du root)
- **Suggestion :** Un seul `index.html` + build step pour les deux cibles

---

### AME-005 — Variables d'environnement obligatoires
- **Priorité :** Haute | **Effort :** Petit
- **Description :** Ajouter un `.env.example` et une validation au démarrage Django
- **Fix :**
```python
# settings.py
if not DEBUG:
    assert SECRET_KEY != 'django-insecure-dev-key-change-in-production', \
        "SECRET_KEY must be set in production!"
```

---

## 6. Récapitulatif priorités

| ID | Type | Sévérité | Effort | Statut |
|----|------|----------|--------|--------|
| BUG-001 | Bug | 🔴 Critique | Petit | ❌ À corriger |
| BUG-002 | Bug | 🔴 Critique | Petit | ❌ À corriger |
| BUG-003 | Bug | 🔴 Critique | Moyen | ❌ À corriger |
| BUG-004 | Bug | 🔴 Critique | Moyen | ❌ À corriger |
| BUG-005 | Bug | 🟠 Majeur | Petit | ❌ À corriger |
| BUG-006 | Bug | 🟠 Majeur | Petit | ❌ À corriger |
| BUG-007 | Bug | 🟠 Majeur | Petit | ❌ À corriger |
| BUG-008 | Bug | 🟡 Mineur | Petit | ❌ À corriger |
| BUG-009 | Bug | 🟡 Mineur | Petit | ❌ À corriger |
| AME-001 | Amélioration | — | Grand | 🔵 Planifier |
| AME-002 | Amélioration | — | Moyen | 🔵 Planifier |
| AME-003 | Amélioration | — | Moyen | 🔵 Planifier |
| AME-004 | Amélioration | — | Grand | 🔵 Planifier |
| AME-005 | Amélioration | — | Petit | 🔵 Planifier |

---

*Analyse générée le 02 mars 2026 — session Claude Code*
