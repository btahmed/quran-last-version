"""
Middleware Django pour gérer les permissions par classe Coran.
"""
from django.contrib.auth.models import Group


class ClassePermissionMiddleware:
    """
    Ajoute request.user_classes et request.user_class_filter à chaque requête.
    Les superusers ont accès complet (pas de filtre).
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        self._process_request(request)
        return self.get_response(request)

    def _process_request(self, request):
        if not request.user.is_authenticated or request.user.is_superuser:
            return
        request.user_classes = self._get_user_classes(request.user)
        request.user_class_filter = self._get_class_filter(request.user)

    def _get_user_classes(self, user):
        groups = user.groups.filter(
            name__in=['Classe_8h45', 'Classe_10h45']
        ).values_list('name', flat=True)
        mapping = {'Classe_8h45': '8h45', 'Classe_10h45': '10h45'}
        return [mapping[g] for g in groups if g in mapping]

    def _get_class_filter(self, user):
        classes = self._get_user_classes(user)
        if not classes:
            return None
        group_names = [f'Classe_{c}' for c in classes]
        return {'groups__name__in': group_names}


class ClassePermissionMixin:
    """
    Mixin pour les vues DRF qui ont besoin du filtrage par classe.
    Usage : class MaVue(ClassePermissionMixin, APIView): ...
    """

    def get_users_for_class(self, user):
        from authentication.models import User
        if user.is_superuser or user.role == 'admin':
            return User.objects.all()
        # Groupes du type Classe_*_Prof_* (nouveau format après migration)
        user_groups = user.groups.filter(name__startswith='Classe_')
        return User.objects.filter(groups__in=user_groups).distinct()

    def get_tasks_for_class(self, user):
        from .models import Task
        from django.db.models import Q
        if user.is_superuser or user.role == 'admin':
            return Task.objects.all()
        if user.role == 'teacher':
            return Task.objects.filter(
                Q(author=user) | Q(assigned_users=user)
            ).distinct()
        return Task.objects.filter(assigned_users=user).distinct()
