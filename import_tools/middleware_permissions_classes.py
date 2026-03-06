"""
Middleware Django pour gérer les permissions par classe
À copier dans le projet Django: mysite/middleware.py
"""

from django.http import JsonResponse
from django.contrib.auth.models import Group
from tasks.models import User, Task


class ClassePermissionMiddleware:
    """
    Middleware pour filtrer automatiquement le contenu par classe
    
    Fonctionnalités:
    - Filtre les tâches par classe de l'utilisateur
    - Filtre les utilisateurs visibles par classe
    - Empêche l'accès inter-classes non autorisé
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Traitement avant la vue
        self.process_request(request)
        
        # Appel de la vue
        response = self.get_response(request)
        
        # Traitement après la vue (si nécessaire)
        return response
    
    def process_request(self, request):
        """Traite la requête avant qu'elle atteigne la vue"""
        
        # Ignorer si utilisateur non authentifié
        if not request.user.is_authenticated:
            return
        
        # Ignorer pour les superusers (accès complet)
        if request.user.is_superuser:
            return
        
        # Ajouter les informations de classe à la requête
        request.user_classes = self.get_user_classes(request.user)
        request.user_class_filter = self.get_class_filter(request.user)
    
    def get_user_classes(self, user):
        """Récupère les classes de l'utilisateur"""
        try:
            groups = user.groups.filter(
                name__in=['Classe_8h45', 'Classe_10h45']
            ).values_list('name', flat=True)
            
            classes = []
            for group_name in groups:
                if group_name == 'Classe_8h45':
                    classes.append('8h45')
                elif group_name == 'Classe_10h45':
                    classes.append('10h45')
            
            return classes
        except Exception:
            return []
    
    def get_class_filter(self, user):
        """Génère un filtre Django pour les requêtes par classe"""
        classes = self.get_user_classes(user)
        
        if not classes:
            return None
        
        # Pour les professeurs, ils peuvent voir leurs classes
        if user.role == 'teacher':
            group_names = [f'Classe_{classe}' for classe in classes]
            return {'groups__name__in': group_names}
        
        # Pour les étudiants, ils ne voient que leur classe
        elif user.role == 'student':
            group_names = [f'Classe_{classe}' for classe in classes]
            return {'groups__name__in': group_names}
        
        return None


def get_filtered_users_by_class(request_user):
    """
    Fonction utilitaire pour filtrer les utilisateurs par classe
    À utiliser dans les vues Django
    """
    if request_user.is_superuser:
        return User.objects.all()
    
    # Récupérer les classes de l'utilisateur
    user_groups = request_user.groups.filter(
        name__in=['Classe_8h45', 'Classe_10h45']
    ).values_list('name', flat=True)
    
    if not user_groups:
        return User.objects.none()
    
    # Filtrer les utilisateurs par les mêmes classes
    return User.objects.filter(
        groups__name__in=user_groups
    ).distinct()


def get_filtered_tasks_by_class(request_user):
    """
    Fonction utilitaire pour filtrer les tâches par classe
    À utiliser dans les vues Django
    """
    if request_user.is_superuser:
        return Task.objects.all()
    
    # Pour les professeurs: tâches qu'ils ont créées ou qui leur sont assignées
    if request_user.role == 'teacher':
        return Task.objects.filter(
            models.Q(author=request_user) |
            models.Q(assigned_users=request_user) |
            models.Q(assigned_teams__members=request_user)
        ).distinct()
    
    # Pour les étudiants: tâches qui leur sont assignées dans leur classe
    elif request_user.role == 'student':
        return Task.objects.filter(
            models.Q(assigned_users=request_user) |
            models.Q(assigned_teams__members=request_user)
        ).distinct()
    
    return Task.objects.none()


class ClassePermissionMixin:
    """
    Mixin pour les vues Django qui ont besoin de filtrage par classe
    
    Usage:
    class MaVue(ClassePermissionMixin, APIView):
        def get(self, request):
            users = self.get_users_for_class(request.user)
            tasks = self.get_tasks_for_class(request.user)
    """
    
    def get_users_for_class(self, user):
        """Récupère les utilisateurs visibles pour cette classe"""
        return get_filtered_users_by_class(user)
    
    def get_tasks_for_class(self, user):
        """Récupère les tâches visibles pour cette classe"""
        return get_filtered_tasks_by_class(user)
    
    def check_class_permission(self, user, target_user):
        """Vérifie si l'utilisateur peut accéder aux données de target_user"""
        if user.is_superuser:
            return True
        
        # Récupérer les groupes des deux utilisateurs
        user_groups = set(user.groups.filter(
            name__in=['Classe_8h45', 'Classe_10h45']
        ).values_list('name', flat=True))
        
        target_groups = set(target_user.groups.filter(
            name__in=['Classe_8h45', 'Classe_10h45']
        ).values_list('name', flat=True))
        
        # Vérifier s'il y a une intersection (classe commune)
        return bool(user_groups.intersection(target_groups))


# Décorateur pour les vues basées sur les fonctions
def require_class_permission(view_func):
    """
    Décorateur pour vérifier les permissions de classe
    
    Usage:
    @require_class_permission
    def ma_vue(request):
        # La vue a accès à request.user_classes et request.user_class_filter
        pass
    """
    def wrapper(request, *args, **kwargs):
        if request.user.is_authenticated and not request.user.is_superuser:
            # Ajouter les informations de classe
            middleware = ClassePermissionMiddleware(None)
            middleware.process_request(request)
        
        return view_func(request, *args, **kwargs)
    
    return wrapper


# Instructions d'installation
INSTALLATION_INSTRUCTIONS = """
INSTRUCTIONS D'INSTALLATION DU MIDDLEWARE

1. Copier ce fichier dans le projet Django:
   cp middleware_permissions_classes.py "QuranReviewLocal/ancien django/MYSITEE/MYSITEE/mysite/middleware.py"

2. Ajouter le middleware dans settings.py:
   MIDDLEWARE = [
       'django.middleware.security.SecurityMiddleware',
       'django.contrib.sessions.middleware.SessionMiddleware',
       'corsheaders.middleware.CorsMiddleware',
       'django.middleware.common.CommonMiddleware',
       'django.middleware.csrf.CsrfViewMiddleware',
       'django.contrib.auth.middleware.AuthenticationMiddleware',
       'mysite.middleware.ClassePermissionMiddleware',  # <-- AJOUTER ICI
       'django.contrib.messages.middleware.MessageMiddleware',
       'django.middleware.clickjacking.XFrameOptionsMiddleware',
   ]

3. Modifier les vues existantes pour utiliser le filtrage:
   
   # Dans api_views.py, modifier ListUsersView:
   from mysite.middleware import ClassePermissionMixin
   
   class ListUsersView(ClassePermissionMixin, APIView):
       def get(self, request):
           users = self.get_users_for_class(request.user)
           # ... reste du code

4. Redémarrer le serveur Django:
   python manage.py runserver

5. Tester avec test_connexions_classes.py
"""

if __name__ == "__main__":
    print(INSTALLATION_INSTRUCTIONS)