#!/usr/bin/env python3
"""
Script d'installation automatique du middleware de permissions par classe
Copie et configure automatiquement le middleware dans le projet Django
"""

import os
import shutil
from pathlib import Path


class InstalleurMiddleware:
    """Installeur automatique du middleware de permissions"""
    
    def __init__(self):
        self.script_dir = Path(__file__).parent
        self.django_dir = self.script_dir.parent / "ancien django" / "MYSITEE" / "MYSITEE"
        self.mysite_dir = self.django_dir / "mysite"
        
        self.middleware_source = self.script_dir / "middleware_permissions_classes.py"
        self.middleware_dest = self.mysite_dir / "middleware.py"
        self.settings_file = self.mysite_dir / "settings.py"
        
        self.stats = {
            'fichiers_copies': 0,
            'modifications': 0,
            'erreurs': []
        }
    
    def verifier_structure(self):
        """Vérifie que la structure Django existe"""
        print("🔍 Vérification de la structure Django...")
        
        if not self.django_dir.exists():
            raise FileNotFoundError(f"Répertoire Django non trouvé: {self.django_dir}")
        
        if not self.mysite_dir.exists():
            raise FileNotFoundError(f"Répertoire mysite non trouvé: {self.mysite_dir}")
        
        if not self.settings_file.exists():
            raise FileNotFoundError(f"Fichier settings.py non trouvé: {self.settings_file}")
        
        if not self.middleware_source.exists():
            raise FileNotFoundError(f"Middleware source non trouvé: {self.middleware_source}")
        
        print("✅ Structure Django vérifiée")
    
    def copier_middleware(self):
        """Copie le fichier middleware dans le projet Django"""
        print("📁 Copie du middleware...")
        
        try:
            # Sauvegarder l'ancien fichier s'il existe
            if self.middleware_dest.exists():
                backup_path = self.middleware_dest.with_suffix('.py.backup')
                shutil.copy2(self.middleware_dest, backup_path)
                print(f"💾 Sauvegarde créée: {backup_path}")
            
            # Copier le nouveau middleware
            shutil.copy2(self.middleware_source, self.middleware_dest)
            self.stats['fichiers_copies'] += 1
            print(f"✅ Middleware copié vers: {self.middleware_dest}")
            
        except Exception as e:
            error_msg = f"Erreur copie middleware: {e}"
            self.stats['erreurs'].append(error_msg)
            raise Exception(error_msg)
    
    def modifier_settings(self):
        """Modifie le fichier settings.py pour ajouter le middleware"""
        print("⚙️  Modification de settings.py...")
        
        try:
            # Lire le fichier settings
            with open(self.settings_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Vérifier si le middleware est déjà ajouté
            if 'mysite.middleware.ClassePermissionMiddleware' in content:
                print("ℹ️  Middleware déjà présent dans settings.py")
                return
            
            # Chercher la section MIDDLEWARE
            middleware_line = "MIDDLEWARE = ["
            if middleware_line not in content:
                raise Exception("Section MIDDLEWARE non trouvée dans settings.py")
            
            # Trouver où insérer le middleware
            lines = content.split('\n')
            new_lines = []
            middleware_added = False
            
            for line in lines:
                new_lines.append(line)
                
                # Ajouter après AuthenticationMiddleware
                if ('django.contrib.auth.middleware.AuthenticationMiddleware' in line and 
                    not middleware_added):
                    # Détecter l'indentation
                    indent = len(line) - len(line.lstrip())
                    middleware_line = ' ' * indent + "'mysite.middleware.ClassePermissionMiddleware',"
                    new_lines.append(middleware_line)
                    middleware_added = True
                    print("✅ Middleware ajouté après AuthenticationMiddleware")
            
            if not middleware_added:
                raise Exception("Impossible d'ajouter le middleware automatiquement")
            
            # Sauvegarder l'ancien settings
            backup_settings = self.settings_file.with_suffix('.py.backup')
            shutil.copy2(self.settings_file, backup_settings)
            print(f"💾 Sauvegarde settings créée: {backup_settings}")
            
            # Écrire le nouveau settings
            with open(self.settings_file, 'w', encoding='utf-8') as f:
                f.write('\n'.join(new_lines))
            
            self.stats['modifications'] += 1
            print("✅ settings.py modifié avec succès")
            
        except Exception as e:
            error_msg = f"Erreur modification settings: {e}"
            self.stats['erreurs'].append(error_msg)
            raise Exception(error_msg)
    
    def creer_vues_modifiees(self):
        """Crée des versions modifiées des vues avec filtrage par classe"""
        print("🔧 Création des vues modifiées...")
        
        vues_modifiees = self.mysite_dir / "api_views_classes.py"
        
        try:
            contenu_vues = '''"""
Vues API modifiées avec support des permissions par classe
À utiliser pour remplacer certaines vues dans api_views.py
"""

from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.db.models import Q, Count, Sum

from .middleware import ClassePermissionMixin, get_filtered_users_by_class
from tasks.models import Task

User = get_user_model()


class ListUsersViewClasses(ClassePermissionMixin, APIView):
    """Liste des utilisateurs filtrée par classe"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Filtrer les utilisateurs par classe
        users = self.get_users_for_class(request.user)
        
        # Optimisation: utiliser values() pour les champs nécessaires
        users_data = users.values(
            'id', 'username', 'first_name', 'last_name',
            'role', 'is_superuser', 'is_staff', 'date_joined'
        ).order_by('username')

        # Ajouter les informations de classe
        for user_data in users_data:
            user_obj = User.objects.get(id=user_data['id'])
            user_data['classes'] = list(user_obj.groups.filter(
                name__in=['Classe_8h45', 'Classe_10h45']
            ).values_list('name', flat=True))

        return Response({
            'count': len(users_data),
            'users': list(users_data),
            'user_classes': getattr(request, 'user_classes', [])
        })


class MyStudentsViewClasses(ClassePermissionMixin, APIView):
    """Liste des étudiants du professeur, filtrée par classe"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'teacher':
            return Response(
                {'detail': 'Accès réservé aux professeurs.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Récupérer les étudiants des mêmes classes que le professeur
        students = self.get_users_for_class(request.user).filter(role='student')
        
        # Ajouter les statistiques
        students = students.annotate(
            total_points=Sum('points_logs__delta'),
            submissions_count=Count('submissions', distinct=True),
        )

        data = []
        for student in students:
            # Récupérer les classes de l'étudiant
            student_classes = list(student.groups.filter(
                name__in=['Classe_8h45', 'Classe_10h45']
            ).values_list('name', flat=True))
            
            data.append({
                'id': student.id,
                'username': student.username,
                'first_name': student.first_name,
                'last_name': student.last_name,
                'total_points': student.total_points or 0,
                'submissions_count': student.submissions_count,
                'classes': student_classes,
            })
        
        return Response({
            'students': data,
            'teacher_classes': getattr(request, 'user_classes', [])
        })


class TaskListViewClasses(ClassePermissionMixin, APIView):
    """Liste des tâches filtrée par classe"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Utiliser le filtrage par classe
        tasks = self.get_tasks_for_class(request.user)
        
        # Sérialiser les tâches (version simplifiée)
        tasks_data = []
        for task in tasks.select_related('author').order_by('-created_at'):
            tasks_data.append({
                'id': task.id,
                'title': task.title,
                'description': task.description,
                'status': task.status,
                'points': task.points,
                'task_type': task.task_type,
                'due_date': task.due_date,
                'created_at': task.created_at,
                'author_name': task.author.username,
            })
        
        return Response({
            'tasks': tasks_data,
            'user_classes': getattr(request, 'user_classes', [])
        })


class TaskCreateViewClasses(ClassePermissionMixin, APIView):
    """Création de tâches avec assignation par classe"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role != 'teacher':
            return Response(
                {'detail': 'Seuls les professeurs peuvent créer des tâches.'},
                status=status.HTTP_403_FORBIDDEN
            )

        title = request.data.get('title', '').strip()
        if not title:
            return Response(
                {'detail': 'Titre de la tâche requis.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Créer la tâche
        task = Task.objects.create(
            title=title,
            description=request.data.get('description', ''),
            task_type=request.data.get('task_type', 'other'),
            points=int(request.data.get('points', 0)),
            due_date=request.data.get('due_date') or None,
            author=request.user,
            is_private=False,
        )

        # Assignation par classe
        assign_to_class = request.data.get('assign_to_class')  # '8h45', '10h45', 'both'
        
        if assign_to_class:
            students = self.get_users_for_class(request.user).filter(role='student')
            
            if assign_to_class == '8h45':
                students = students.filter(groups__name='Classe_8h45')
            elif assign_to_class == '10h45':
                students = students.filter(groups__name='Classe_10h45')
            # Si 'both' ou autre, on garde tous les étudiants des classes du prof
            
            task.assigned_users.set(students)

        return Response({
            'id': task.id,
            'title': task.title,
            'assigned_count': task.assigned_users.count(),
            'message': 'Tâche créée avec succès'
        }, status=status.HTTP_201_CREATED)


# Instructions d'utilisation
USAGE_INSTRUCTIONS = """
UTILISATION DES VUES MODIFIÉES

1. Dans urls.py, remplacer les anciennes vues:
   
   # Anciennes vues
   path('users/', views.ListUsersView.as_view(), name='list_users'),
   path('my-students/', views.MyStudentsView.as_view(), name='my_students'),
   
   # Nouvelles vues avec filtrage par classe
   path('users/', views.ListUsersViewClasses.as_view(), name='list_users'),
   path('my-students/', views.MyStudentsViewClasses.as_view(), name='my_students'),

2. Ou créer de nouvelles routes pour tester:
   path('users-classes/', views.ListUsersViewClasses.as_view(), name='list_users_classes'),
   path('students-classes/', views.MyStudentsViewClasses.as_view(), name='students_classes'),

3. Les nouvelles vues retournent des informations de classe supplémentaires:
   - 'classes': liste des classes de chaque utilisateur
   - 'user_classes': classes de l'utilisateur connecté
   - 'teacher_classes': classes du professeur (pour MyStudentsViewClasses)
"""
'''
            
            with open(vues_modifiees, 'w', encoding='utf-8') as f:
                f.write(contenu_vues)
            
            self.stats['fichiers_copies'] += 1
            print(f"✅ Vues modifiées créées: {vues_modifiees}")
            
        except Exception as e:
            error_msg = f"Erreur création vues: {e}"
            self.stats['erreurs'].append(error_msg)
            print(f"⚠️  {error_msg}")
    
    def creer_guide_utilisation(self):
        """Crée un guide d'utilisation du système de classes"""
        guide_path = self.script_dir / "GUIDE_PERMISSIONS_CLASSES.md"
        
        guide_content = '''# GUIDE D'UTILISATION - PERMISSIONS PAR CLASSE

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
'''
        
        try:
            with open(guide_path, 'w', encoding='utf-8') as f:
                f.write(guide_content)
            
            self.stats['fichiers_copies'] += 1
            print(f"✅ Guide créé: {guide_path}")
            
        except Exception as e:
            error_msg = f"Erreur création guide: {e}"
            self.stats['erreurs'].append(error_msg)
            print(f"⚠️  {error_msg}")
    
    def afficher_statistiques(self):
        """Affiche les statistiques d'installation"""
        print("\n📊 STATISTIQUES D'INSTALLATION")
        print("="*60)
        
        print(f"📁 Fichiers copiés: {self.stats['fichiers_copies']}")
        print(f"⚙️  Modifications: {self.stats['modifications']}")
        
        if self.stats['erreurs']:
            print(f"\n❌ Erreurs ({len(self.stats['erreurs'])}):")
            for erreur in self.stats['erreurs']:
                print(f"   - {erreur}")
        else:
            print("\n✅ Installation réussie sans erreur")
    
    def afficher_instructions_finales(self):
        """Affiche les instructions finales"""
        print("\n🎯 PROCHAINES ÉTAPES")
        print("="*60)
        
        print("1. 🔄 Redémarrer le serveur Django:")
        print("   cd 'QuranReviewLocal/ancien django/MYSITEE/MYSITEE'")
        print("   python manage.py runserver")
        
        print("\n2. 🧪 Tester les permissions:")
        print("   python test_connexions_classes.py")
        
        print("\n3. 📖 Lire le guide d'utilisation:")
        print("   GUIDE_PERMISSIONS_CLASSES.md")
        
        print("\n4. 🔧 Optionnel - Utiliser les nouvelles vues:")
        print("   - Modifier urls.py pour utiliser les vues *Classes")
        print("   - Voir api_views_classes.py pour les exemples")
    
    def executer_installation(self):
        """Exécute l'installation complète"""
        print("🚀 INSTALLATION DU MIDDLEWARE DE PERMISSIONS")
        print("="*60)
        
        try:
            self.verifier_structure()
            self.copier_middleware()
            self.modifier_settings()
            self.creer_vues_modifiees()
            self.creer_guide_utilisation()
            
            self.afficher_statistiques()
            self.afficher_instructions_finales()
            
            print("\n🎉 Installation terminée avec succès!")
            return True
            
        except Exception as e:
            print(f"\n💥 Erreur d'installation: {e}")
            self.afficher_statistiques()
            return False


def main():
    """Point d'entrée principal"""
    installeur = InstalleurMiddleware()
    success = installeur.executer_installation()
    
    if not success:
        print("\n❌ Installation échouée")
        exit(1)


if __name__ == "__main__":
    main()