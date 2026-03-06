"""
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
    """Liste des étudiants du professeur, filtrée par assignations spécifiques"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'teacher':
            return Response(
                {'detail': 'Accès réservé aux professeurs.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Récupérer les sous-groupes spécifiques du professeur (format: Classe_8h45_Prof_Ibrahim)
        prof_groups = request.user.groups.filter(name__contains='_Prof_')
        
        if prof_groups.exists():
            # Le professeur a des assignations spécifiques
            # Récupérer UNIQUEMENT les étudiants de ses sous-groupes
            students = User.objects.filter(
                role='student',
                groups__in=prof_groups
            ).distinct()
        else:
            # Fallback: si pas de sous-groupes, utiliser l'ancien système (tous les étudiants de la classe)
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
        
        # Récupérer les classes du professeur directement
        teacher_classes = list(request.user.groups.filter(
            name__in=['Classe_8h45', 'Classe_10h45']
        ).values_list('name', flat=True))
        
        return Response({
            'students': data,
            'teacher_classes': teacher_classes
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
