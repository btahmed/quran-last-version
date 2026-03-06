# QuranReview - Lancement Rapide

## 🚀 OPTION 1: Lancer Tout Automatiquement (RECOMMANDÉ)

Double-clique sur le fichier :
```
LANCER-TOUT.bat
```

Ou en PowerShell :
```powershell
.\LANCER-SITE.ps1
```

**Ça lance :**
- Backend Django sur http://127.0.0.1:8000
- Frontend sur http://localhost:8080
- Ouvre automatiquement le navigateur

---

## 🖥️ OPTION 2: Lancer Manuellement

### Étape 1: Backend (Terminal 1)
```powershell
cd C:\dev\QuranReview\backend
.\venv\Scripts\python manage.py runserver
```

### Étape tape 2: Frontend (Terminal 2)
```powershell
cd C:\dev\QuranReview
python -m http.server 8080
```

### Étape 3: Ouvrir
http://localhost:8080

---

## 🎮 OPTION 3: Mode Démo (Sans Backend)

Double-clique simplement sur :
```
index.html
```

Ou :
```powershell
Start-Process C:\dev\QuranReview\index.html
```

> Fonctionne sans serveur, données en mémoire.

---

## 🔗 URLs Disponibles

| Service | URL | Description |
|---------|-----|-------------|
| **Site** | http://localhost:8080 | Application complète |
| **API** | http://127.0.0.1:8000 | Backend JSON |
| **Admin** | http://127.0.0.1:8000/admin/ | Gestion Django |
| **Login API** | http://127.0.0.1:8000/api/auth/token/ | Connexion JWT |

---

## 🔑 Identifiants

- **Username:** `admin`
- **Password:** `admin123`

---

## 📊 Fonctionnalités Opérationnelles

✅ Inscription / Connexion (JWT)  
✅ Dashboard avec statistiques  
✅ Gestion des tâches (CRUD)  
✅ Système de compétitions  
✅ Lecteur audio Quran  
✅ Mode démo hors-ligne  

---

## 🛑 Arrêter les Serveurs

Ferme les fenêtres de terminal ou :
```powershell
taskkill /F /IM python.exe
```
