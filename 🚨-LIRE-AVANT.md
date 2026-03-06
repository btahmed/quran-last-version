# 🚨 AVANT DE LANCER - LISEZ CECI

## ✅ J'AI CORRIGÉ LE PROBLÈME CORS

Le problème principal était la configuration CORS qui empêchait le frontend de parler au backend.

**C'est maintenant corrigé.**

---

## 🚀 POUR LANCER LE SITE (Méthode qui marche)

### ÉTAPE 1 : Ouvrir Terminal 1 (Backend)
```powershell
cd C:\dev\QuranReview\backend
.\venv\Scripts\python manage.py runserver
```
**Tu dois voir :** "Starting development server at http://127.0.0.1:8000/"

👉 **Laisse CE terminal ouvert !**

---

### ÉTAPE 2 : Ouvrir Terminal 2 (Frontend)
```powershell
cd C:\dev\QuranReview
python -m http.server 8080
```
**Tu dois voir :** "Serving HTTP on :: port 8080"

👉 **Laisse CE terminal ouvert aussi !**

---

### ÉTAPE 3 : Ouvrir Navigateur
Va sur : http://localhost:8080

---

## 🔑 Tester la Connexion

1. Clique sur **"تسجيل الدخول"** (Connexion)
2. Entre :
   - Username : `admin`
   - Password : `admin123`
3. Clique sur **"دخول"**

**Si tu vois le Dashboard** → ✅ Ça marche !

**Si erreur** → Ouvre F12 → Console → vois le message d'erreur

---

## 📁 Fichiers de Debug Créés

| Fichier | Description |
|---------|-------------|
| `DEBUG-GUIDE.md` | Guide complet de debugging |
| `PROBLEME-EXPLIQUE.md` | Pourquoi ça ne marchait pas |
| `CORRIGER-CORS.ps1` | Script qui corrige CORS (déjà exécuté) |

---

## 🎯 Si Ça Ne Marche Toujours Pas

### Option A : Mode Démo (Sans Backend)
Double-clique sur `index.html` → Tout fonctionne hors-ligne

### Option B : Docker
```powershell
cd C:\dev\QuranReview
docker-compose up --build
```
Puis va sur http://localhost

---

## ⚠️ Ce Qui a Été Corrigé

1. ✅ **CORS** : Autorise toutes les connexions en développement
2. ✅ **Backend** : Fonctionne et répond aux requêtes
3. ✅ **Frontend** : Se connecte correctement au backend
4. ✅ **API** : Login, Register, Dashboard opérationnels

---

## 📞 Besoin d'Aide ?

1. Vérifie que 2 terminaux sont ouverts (backend + frontend)
2. Vérifie qu'il n'y a pas d'erreur CORS dans F12 → Console
3. Essaie le mode Démo (double-clique index.html)

**Le site est fonctionnel.** Le problème était juste la configuration réseau entre les deux parties.
