# Guide de Debugging - QuranReview

## 🔴 PROBLÈME IDENTIFIÉ

Le backend Django fonctionne (l'API répond), mais le **frontend ne peut pas communiquer avec le backend** à cause de **CORS** ou des **protocoles différents**.

### Erreur typique dans la console navigateur :
```
Access to fetch at 'http://127.0.0.1:8000/api/auth/token/' 
from origin 'http://localhost:8080' has been blocked by CORS policy
```

---

## 🔍 ÉTAPES DE DEBUGGING EFFECTUÉES

### 1. Vérification du Backend
**Commande :**
```powershell
cd C:\dev\QuranReview\backend
.\venv\Scripts\python manage.py check
```
**Résultat :** ✅ "System check identified no issues"

**Test API :**
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/" -TimeoutSec 5
```
**Résultat :** ✅ {"name": "QuranReview API", "version": "1.0.0", ...}

**Conclusion :** Le backend démarre et répond correctement.

---

### 2. Test de l'authentification API
**Commande :**
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/auth/token/" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"username":"admin","password":"admin123"}'
```
**Résultat :** ✅ Token JWT reçu

**Conclusion :** L'API d'authentification fonctionne.

---

### 3. Vérification CORS
**Problème trouvé :** 
- Frontend sur `http://localhost:8080`
- Backend sur `http://127.0.0.1:8000`
- CORS doit autoriser explicitement `localhost:8080`

**Configuration actuelle (settings.py) :**
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost",
    "http://localhost:8080",  # ✅ Ajouté
    "http://127.0.0.1",
    "http://127.0.0.1:8000",
]
```

**Conclusion :** CORS configuré mais peut nécessiter `CORS_ALLOW_ALL_ORIGINS = True` pour le développement.

---

### 4. Test du Frontend
**Commande :**
```powershell
cd C:\dev\QuranReview
python -m http.server 8080
```

**Test :** Ouvrir http://localhost:8080
**Résultat :** ✅ La page s'affiche

**Conclusion :** Le frontend seul fonctionne (mode démo).

---

## ❌ PROBLÈME RÉEL

Quand tu ouvres `index.html` directement (file://) ou via `python -m http.server`, le frontend essaie d'appeler le backend mais :

1. **Si mode fichier (file://)** : Le navigateur bloque les requêtes AJAX vers http:// par sécurité
2. **Si CORS mal configuré** : Le backend refuse les requêtes du frontend
3. **Si backend pas démarré** : Échec de connexion

---

## 🔧 SOLUTIONS POSSIBLES

### Solution A : Mode Démo (100% offline)
**Avantage :** Fonctionne immédiatement, pas besoin de backend
**Inconvénient :** Pas de sauvegarde des données

**Comment faire :**
1. Double-clique sur `index.html`
2. Le badge "Mode Démo" s'affiche
3. Toutes les fonctionnalités marchent avec données locales

---

### Solution B : Corriger CORS
**Modifier :** `backend/quranreview/settings.py`

**Ajouter :**
```python
# Remplacer CORS_ALLOWED_ORIGINS par :
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = ['*']
```

**Redémarrer le backend.**

---

### Solution C : Même serveur pour Frontend + Backend
**Créer :** `backend/templates/index.html` qui sert le frontend depuis Django

**Ou :** Utiliser nginx pour servir les deux sur le même port

---

### Solution D : Docker (Tout dans des conteneurs)
```powershell
cd C:\dev\QuranReview
docker-compose up --build
```

**Accès :** http://localhost (nginx fait le proxy)

---

## 📋 CHECKLIST DE DEBUG

### Étape 1 : Vérifier Backend
```powershell
curl http://127.0.0.1:8000/
# Doit afficher : {"name": "QuranReview API", ...}
```
Si ça ne marche pas :
- Le backend n'est pas démarré
- Ou il y a une erreur Python

### Étape 2 : Vérifier Frontend seul
```powershell
cd C:\dev\QuranReview
python -m http.server 8080
```
Ouvrir http://localhost:8080

### Étape 3 : Vérifier Console Navigateur
F12 → Console → Chercher erreurs rouges

**Erreurs courantes :**
- `CORS policy` → Problème de configuration CORS
- `Failed to fetch` → Backend pas démarré
- `Network error` → Firewall ou port bloqué

### Étape 4 : Tester API manuellement
Dans le navigateur, aller sur :
```
http://127.0.0.1:8000/api/auth/token/
```

Doit afficher une erreur Django (normal car c'est POST pas GET), mais pas une erreur de connexion.

---

## 🎯 COMMENT J'AI CRÉÉ LES SCRIPTS

### Script LANCER-TOUT.bat
**Objectif :** Démarrer backend + frontend + ouvrir navigateur

**Problème :** Les fenêtres s'ouvrent et se ferment immédiatement si erreur

**Solution :** Utiliser `cmd /k` pour garder les fenêtres ouvertes

### Script 🚀-LANCER.ps1
**Objectif :** Version PowerShell avec contrôle des processus

**Problème :** Les processus démarrés en arrière-plan sont difficiles à arrêter

**Solution :** Garder les références et faire `Stop-Process` à la fin

---

## 🚨 ERREURS FRÉQUENTES

### "Le site ne s'ouvre pas"
→ Vérifier que Python est installé : `python --version`

### "Backend erreur 404"
→ Normal sur `/`, tester sur `/api/auth/token/`

### "CORS error"
→ Backend et frontend sur des origines différentes, besoin de config CORS

### "Port already in use"
→ Autre processus utilise le port 8000 ou 8080
```powershell
Get-NetTCPConnection -LocalPort 8000
```

---

## ✅ COMMENT ÇA DEVRAIT MARCHER

1. **Backend démarré** → http://127.0.0.1:8000 affiche l'API info
2. **Frontend démarré** → http://localhost:8080 affiche l'application
3. **Login** → Frontend appelle backend, récupère token JWT
4. **Utilisation** → Toutes les requêtes API fonctionnent

---

## 🛠️ TOOLS DE DEBUG

### Voir les logs backend
```powershell
cd C:\dev\QuranReview\backend
.\venv\Scripts\python manage.py runserver
# Laisse la fenêtre ouverte pour voir les erreurs
```

### Tester API avec curl
```powershell
# Login
curl -X POST http://127.0.0.1:8000/api/auth/token/ `
  -H "Content-Type: application/json" `
  -d '{"username":"admin","password":"admin123"}'

# Dashboard (avec token)
curl -X GET http://127.0.0.1:8000/api/dashboard/ `
  -H "Authorization: Bearer TOKEN_ICI"
```

### Voir requêtes réseau
F12 → Network → XHR

---

## 📝 RÉSUMÉ

| Problème | Cause | Solution |
|----------|-------|----------|
| Site blanc | Backend pas démarré | Lancer backend d'abord |
| Erreur CORS | Origines différentes | `CORS_ALLOW_ALL_ORIGINS = True` |
| Mode démo uniquement | File:// protocol | Utiliser `python -m http.server` |
| Page 404 | Mauvaise URL | Utiliser `/api/auth/token/` pas `/api/token/` |

---

## 💡 RECOMMANDATION FINALE

**Pour tester rapidement :**
1. Utilise le **Mode Démo** (double-clique index.html)
2. Toutes les fonctionnalités marchent sans backend
3. Les données sont stockées dans le navigateur

**Pour utiliser avec backend :**
1. Démarrer backend dans un terminal
2. Démarrer frontend dans un autre terminal
3. Corriger CORS si erreur
4. Tester avec login admin/admin123
