# GUIDE D'UTILISATION - PERMISSIONS PAR CLASSE

## 🎯 Vue d'ensemble

Le système de permissions par classe permet de séparer automatiquement les utilisateurs et le contenu selon leur classe (8h45 vs 10h45).

## 🏗️ Architecture

### Groupes Django
- **Classe_8h45**: Étudiants et professeurs de la classe de 8h45
- **Classe_10h45**: Étudiants et professeurs de la classe de 10h45

### Middleware
- **ClassePermissionMiddleware**: Filtre automatiquement les requêtes par classe
- Ajoute `request.user_classes` et `request.user_class_filter` à chaque requête

### Vues Modifiées
- **ListUsersViewClasses**: Liste des utilisateurs filtrée par classe
- **MyStudentsViewClasses**: Étudiants du professeur dans ses classes
- **TaskListViewClasses**: Tâches filtrées par classe
- **TaskCreateViewClasses**: Création de tâches avec assignation par classe

## 👥 Règles de Filtrage

### Étudiants
- Voient uniquement les utilisateurs de leur classe
- Voient uniquement les tâches qui leur sont assignées
- Ne peuvent pas accéder aux données d'autres classes

### Professeurs
- Voient les utilisateurs de toutes leurs classes
- Peuvent créer des tâches pour leurs classes
- Professeurs mixtes (Mohammadine, Abdelhadi) voient les 2 classes

### Superusers
- Accès complet à toutes les données
- Pas de filtrage appliqué

## 🔧 Installation

1. **Configurer les groupes**:
   ```bash
   python configurer_permissions_classes.py
   ```

2. **Installer le middleware**:
   ```bash
   python installer_middleware_classes.py
   ```

3. **Redémarrer Django**:
   ```bash
   cd "ancien django/MYSITEE/MYSITEE"
   python manage.py runserver
   ```

4. **Tester les connexions**:
   ```bash
   python test_connexions_classes.py
   ```

## 🧪 Tests

### Test Automatique
```bash
python test_connexions_classes.py
```

### Test Manuel
1. Se connecter avec un étudiant de 8h45
2. Vérifier qu'il ne voit que sa classe
3. Se connecter avec un professeur
4. Vérifier qu'il voit ses classes

### Endpoints de Test
- `GET /api/users-classes/` - Utilisateurs filtrés par classe
- `GET /api/students-classes/` - Étudiants du professeur
- `GET /api/tasks-classes/` - Tâches filtrées par classe

## 📊 Monitoring

### Vérifier les Groupes
```python
from django.contrib.auth.models import Group
from tasks.models import User

# Compter les membres par groupe
groupe_8h45 = Group.objects.get(name='Classe_8h45')
groupe_10h45 = Group.objects.get(name='Classe_10h45')

print(f"Classe 8h45: {groupe_8h45.user_set.count()} membres")
print(f"Classe 10h45: {groupe_10h45.user_set.count()} membres")
```

### Vérifier les Professeurs Mixtes
```python
professeurs_mixtes = User.objects.filter(
    role='teacher',
    groups__name__in=['Classe_8h45', 'Classe_10h45']
).annotate(nb_groupes=Count('groups')).filter(nb_groupes=2)

for prof in professeurs_mixtes:
    print(f"{prof.username}: {prof.first_name}")
```

## 🔒 Sécurité

### Principes
- Isolation complète entre les classes
- Pas d'accès inter-classes sauf pour les professeurs mixtes
- Superusers gardent l'accès complet

### Vérifications
- Middleware vérifie chaque requête
- Filtrage automatique des QuerySets
- Permissions vérifiées au niveau des vues

## 🚨 Dépannage

### Problème: Utilisateur ne voit aucune donnée
**Solution**: Vérifier qu'il est dans un groupe de classe
```python
user = User.objects.get(username='nom_utilisateur')
print(user.groups.all())
```

### Problème: Professeur ne voit pas tous ses étudiants
**Solution**: Vérifier qu'il est dans les bons groupes
```python
prof = User.objects.get(username='prof_nom')
classes = prof.groups.filter(name__startswith='Classe_')
print(f"Classes du professeur: {list(classes)}")
```

### Problème: Middleware ne fonctionne pas
**Solution**: Vérifier settings.py
```python
# Dans settings.py, vérifier que le middleware est présent:
MIDDLEWARE = [
    # ...
    'mysite.middleware.ClassePermissionMiddleware',
    # ...
]
```

## 📈 Évolutions Futures

### Fonctionnalités Possibles
- Permissions granulaires par matière
- Groupes temporaires pour projets
- Système de délégation de permissions
- Audit des accès inter-classes

### Optimisations
- Cache des groupes utilisateur
- Indexation des requêtes de filtrage
- Pagination des listes filtrées

---

**Créé par**: Kiro AI Assistant  
**Date**: 2026-02-20  
**Version**: 1.0
