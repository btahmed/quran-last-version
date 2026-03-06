# Diagnostic Backend QuranReview

## Resultat: ✅ LE BACKEND FONCTIONNE !

---

## Tests effectues

| Test | Resultat |
|------|----------|
| Django check | ✅ OK (0 issues) |
| Database connection | ✅ OK (SQLite) |
| Models import | ✅ OK |
| Migrations | ✅ OK |
| Superuser | ✅ OK (admin/admin123) |
| API Login | ✅ OK (JWT token genere) |

---

## URLs API Correctes

| Endpoint | Methode | Description |
|----------|---------|-------------|
| `/api/auth/token/` | POST | Login (retourne access + refresh) |
| `/api/auth/token/refresh/` | POST | Rafraichir token |
| `/api/auth/register/` | POST | Inscription |
| `/api/auth/profile/` | GET/PUT | Profil utilisateur |
| `/api/tasks/` | GET/POST | Liste/créer taches |
| `/api/dashboard/` | GET | Stats dashboard |
| `/api/competitions/` | GET | Liste competitions |
| `/admin/` | GET | Interface admin |

---

## Probleme potentiel identifie

L'ancienne URL `/api/token/` n'existe PAS. 
La bonne URL est : **`/api/auth/token/`**

---

## Lancer le backend

### Methode 1: Script fourni
```powershell
cd C:\dev\QuranReview\backend
.\START.ps1
```

### Methode 2: Manuel
```powershell
cd C:\dev\QuranReview\backend
.\venv\Scripts\python manage.py runserver
```

---

## Tester l'API

### Test 1: Login
```powershell
curl -X POST http://127.0.0.1:8000/api/auth/token/ `
  -H "Content-Type: application/json" `
  -d '{"username":"admin","password":"admin123"}'
```

### Test 2: Dashboard (avec token)
```powershell
$token = "VOTRE_ACCESS_TOKEN"
curl -X GET http://127.0.0.1:8000/api/dashboard/ `
  -H "Authorization: Bearer $token"
```

### Test 3: Admin web
Ouvrir: http://127.0.0.1:8000/admin/
Login: admin / admin123

---

## Si ca ne marche toujours pas

1. **Verifiez qu'une autre instance ne tourne pas:**
```powershell
Get-NetTCPConnection -LocalPort 8000
```

2. **Relancez proprement:**
```powershell
cd C:\dev\QuranReview\backend
.\venv\Scripts\python manage.py runserver 127.0.0.1:8000
```

3. **Verifiez dans le navigateur:**
http://127.0.0.1:8000/api/auth/token/

---

## Configuration

- **Database:** SQLite (C:\dev\QuranReview\backend\data\db.sqlite3)
- **Debug:** True
- **CORS:** Active pour localhost
- **JWT:** Access=1jour, Refresh=7jours
