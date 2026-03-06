# 🐳 Docker - Démarrage Rapide

## ⚡ Lancement en 1 clic

### Option 1 : Double-cliquez sur le fichier
```
🚀-LANCER-DOCKER.bat
```

C'est tout ! Le script fait tout automatiquement :
- ✅ Vérifie Docker
- ✅ Démarre Docker Desktop si besoin
- ✅ Copie les fichiers
- ✅ Construit les images
- ✅ Lance l'application
- ✅ Ouvre le navigateur

---

### Option 2 : Ligne de commande PowerShell

```powershell
# 1. Allez dans le dossier
cd C:\dev\QuranReview

# 2. Exécutez le script
.\start-docker.ps1
```

---

## 🛑 Arrêter l'application

Double-cliquez sur :
```
🛑-ARRETER-DOCKER.bat
```

Ou en PowerShell :
```powershell
docker-compose down
```

---

## 🌐 Accès

Une fois lancé, ouvrez :
- **Frontend** : http://localhost
- **Backend** : http://localhost:8000
- **Admin** : http://localhost:8000/admin

---

## 🆘 Problèmes courants

### "Docker non trouvé"
→ Installez Docker Desktop : https://www.docker.com/products/docker-desktop

### "Port déjà utilisé"
→ Arrêtez d'abord l'application : `🛑-ARRETER-DOCKER.bat`

### "Erreur de build"
→ Essayez de reconstruire :
```powershell
docker-compose down
docker-compose up --build
```

---

## 📋 Commandes utiles

```powershell
# Voir les logs
docker-compose logs -f

# Redémarrer
docker-compose restart

# Entrer dans le backend
docker-compose exec backend bash

# Nettoyer complètement
docker-compose down -v
docker system prune -a
```

---

**Prêt ?** Double-cliquez sur `🚀-LANCER-DOCKER.bat` ! 🚀
