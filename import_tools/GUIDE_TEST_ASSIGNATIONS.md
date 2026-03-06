# 🧪 GUIDE DE TEST - ASSIGNATIONS SPÉCIFIQUES

## ✅ CE QUI A ÉTÉ FAIT

1. ✅ Parsing du fichier `classes_coran.txt`
2. ✅ Création de 22 sous-groupes (format: `Classe_8h45_Prof_Ibrahim`)
3. ✅ Assignation de 185 étudiants aux sous-groupes
4. ✅ Modification de l'API `MyStudentsViewClasses`

---

## 🚀 TESTS À EFFECTUER

### Test 1: Vérifier les sous-groupes (Backend)

```bash
cd QuranReviewLocal/import_tools
python test_assignations_specifiques.py
```

**Résultat attendu**:
```
PROFESSEUR: prof_ibrahim
✅ ASSIGNATIONS SPÉCIFIQUES ACTIVES
   Nombre d'étudiants assignés: 11
   📚 Classe 8h45: 11 étudiants

PROFESSEUR: prof_wassim
✅ ASSIGNATIONS SPÉCIFIQUES ACTIVES
   Nombre d'étudiants assignés: 6
   📚 Classe 8h45: 6 étudiants
```

---

### Test 2: Tester l'API

#### Étape 1: Démarrer le serveur Django

```bash
cd "QuranReviewLocal/ancien django/MYSITEE/MYSITEE"
python manage.py runserver
```

#### Étape 2: Tester avec curl ou Postman

**Test prof_ibrahim** (devrait voir 11 étudiants):
```bash
# Login
curl -X POST http://127.0.0.1:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"prof_ibrahim","password":"VmbceZhq"}'

# Récupérer le token et l'utiliser
curl -X GET http://127.0.0.1:8000/api/my-students/ \
  -H "Authorization: Token <TOKEN>"
```

**Test prof_wassim** (devrait voir 6 étudiants):
```bash
# Login
curl -X POST http://127.0.0.1:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"prof_wassim","password":"TtzLFaC6"}'

# Récupérer le token et l'utiliser
curl -X GET http://127.0.0.1:8000/api/my-students/ \
  -H "Authorization: Token <TOKEN>"
```

---

### Test 3: Tester le Frontend

#### Étape 1: Démarrer le serveur Django (si pas déjà fait)
```bash
cd "QuranReviewLocal/ancien django/MYSITEE/MYSITEE"
python manage.py runserver
```

#### Étape 2: Ouvrir le frontend
```
http://localhost:3000
```

#### Étape 3: Tester avec prof_ibrahim
1. Se connecter:
   - Username: `prof_ibrahim`
   - Password: `VmbceZhq`
2. Aller dans "قائمة الطلاب" (Liste des étudiants)
3. **Vérifier**: Devrait afficher ~11 étudiants (au lieu de 204)
4. **Vérifier**: Section "📚 الصف 8h45 (11 طالب)"

#### Étape 4: Tester avec prof_wassim
1. Se déconnecter
2. Se connecter:
   - Username: `prof_wassim`
   - Password: `TtzLFaC6`
3. Aller dans "قائمة الطلاب"
4. **Vérifier**: Devrait afficher ~6 étudiants
5. **Vérifier**: Section "📚 الصف 8h45 (6 طالب)"

#### Étape 5: Tester avec prof_mohammadine (mixte)
1. Se déconnecter
2. Se connecter:
   - Username: `prof_mohammadine`
   - Password: `wS7hvntd`
3. Aller dans "قائمة الطلاب"
4. **Vérifier**: Devrait afficher ~16 étudiants
5. **Vérifier**: Deux sections:
   - "📚 الصف 8h45 (8 طالب)"
   - "📚 الصف 10h45 (8 طالب)"

---

## 📊 RÉSULTATS ATTENDUS

| Professeur | Avant (tous les étudiants) | Après (assignations spécifiques) |
|------------|---------------------------|----------------------------------|
| prof_ibrahim | 204 étudiants | 11 étudiants |
| prof_wassim | 204 étudiants | 6 étudiants |
| prof_mohammadine | 205 étudiants (mixte) | 16 étudiants |
| prof_nahila | 204 étudiants | 7 étudiants |
| prof_oum_wael | 204 étudiants | 13 étudiants |

---

## ✅ CHECKLIST DE VALIDATION

### Backend
- [ ] Les sous-groupes sont créés (22 groupes)
- [ ] Chaque professeur est dans ses sous-groupes
- [ ] Les étudiants sont dans les bons sous-groupes
- [ ] L'API retourne uniquement les étudiants assignés

### Frontend
- [ ] prof_ibrahim voit 11 étudiants (au lieu de 204)
- [ ] prof_wassim voit 6 étudiants (au lieu de 204)
- [ ] prof_mohammadine voit 16 étudiants (au lieu de 205)
- [ ] Le groupement visuel par classe fonctionne toujours
- [ ] Les sections "📚 الصف 8h45" et "📚 الصف 10h45" s'affichent correctement

---

## 🐛 DÉPANNAGE

### Problème: Un professeur voit toujours tous les étudiants

**Cause possible**: Le professeur n'a pas de sous-groupe spécifique

**Solution**:
```bash
cd QuranReviewLocal/import_tools
python test_assignations_specifiques.py
```

Vérifier que le professeur a bien des sous-groupes (ex: `Classe_8h45_Prof_Ibrahim`)

### Problème: L'API retourne une erreur 500

**Cause possible**: Le serveur Django n'a pas été redémarré après la modification de `api_views_classes.py`

**Solution**:
1. Arrêter le serveur Django (Ctrl+C)
2. Redémarrer: `python manage.py runserver`

### Problème: Le frontend affiche toujours tous les étudiants

**Cause possible**: Le cache du navigateur

**Solution**:
1. Vider le cache du navigateur (Ctrl+Shift+Delete)
2. Rafraîchir la page (Ctrl+F5)
3. Se reconnecter

---

## 📝 NOTES

### Fallback automatique

Si un professeur n'a pas de sous-groupe spécifique, le système utilise automatiquement l'ancien comportement (tous les étudiants de la classe).

Cela permet une transition en douceur et évite les erreurs.

### Professeurs mixtes

Certains professeurs enseignent dans les deux classes (8h45 et 10h45):
- prof_ibrahim: 2 sous-groupes
- prof_mohammadine: 2 sous-groupes
- prof_abdelhadi: 2 sous-groupes
- prof_youssef: 2 sous-groupes

Ces professeurs verront leurs étudiants des deux classes, mais uniquement ceux qui leur sont assignés.

---

## 🎯 OBJECTIF FINAL

**Avant**: Tous les professeurs d'une classe voyaient TOUS les étudiants de cette classe

**Après**: Chaque professeur voit UNIQUEMENT ses étudiants assignés spécifiques

**Système**: Sous-groupes Django (format: `Classe_8h45_Prof_Ibrahim`)

---

**Date**: 2026-02-20  
**Status**: ✅ PRÊT POUR LES TESTS
