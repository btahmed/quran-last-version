# 🎵 Audio Local Setup

## 📁 Structure des dossiers
```
c:\dev\QuranReview\
├── audio\
│   └── abdul_basit\
│       ├── 001.mp3  # الفاتحة
│       ├── 002.mp3  # البقرة
│       ├── 003.mp3  # آل عمران
│       └── ...
├── audio-config.js
└── download-audio.js
```

## 🚀 Installation rapide

### 1. Télécharger les 10 premières sourates (test)
```bash
cd c:\dev\QuranReview
node download-audio.js --test
```

### 2. Télécharger toutes les 114 sourates
```bash
node download-audio.js --all
```

## 🎧 Utilisation

1. **Lancer le serveur**: `python -m http.server 8000`
2. **Ouvrir**: http://localhost:8000
3. **Cliquez sur** 🎵 استماع
4. **Audio local** fonctionne directement !

## ✅ Avantages

- ✅ **Pas de CORS** - fichiers locaux
- ✅ **Offline** - fonctionne sans internet
- ✅ **Rapide** - chargement instantané
- ✅ **Contrôle total** - vos propres fichiers

## 🔄 Si vous avez déjà des fichiers MP3

1. **Copiez vos fichiers** dans `audio/abdul_basit/`
2. **Nommez-les** avec 3 chiffres: `001.mp3`, `002.mp3`, etc.
3. **Actualisez** la page web

## 📝 Notes

- Les fichiers doivent être en format `.mp3`
- Nommage: `001.mp3` à `114.mp3`
- Taille moyenne: ~3-5 MB par sourate
- Total ~400 MB pour les 114 sourates
