"""
Vues API pour la gestion Admin avancée
Gestion des groupes, profils étudiants, et synchronisation
"""

from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.db import transaction
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.utils import timezone
from django.core.cache import cache
from django.utils.decorators import method_decorator
from tasks.models import (
    StudentProfile, GroupExtension, UserGroupHistory, 
    AuditLog, ConflictLog
)
from .security_utils import (
    admin_required, rate_limit, get_client_ip, log_admin_action,
    validate_group_name, validate_email as validate_email_custom,
    validate_phone, validate_time_slot, validate_status,
    sanitize_input, sanitize_dict
)

User = get_user_model()


def synchronize_changes(change_type, affected_entities):
    """
    Synchronise les changements à travers toutes les vues
    
    INPUT: change_type (str), affected_entities (dict)
    OUTPUT: dict avec sync_status et affected_views
    
    Synchronise les changements à travers toutes les vues en invalidant les caches appropriés
    """
    affected_views = []
    
    # Étape 1: Identifier les vues à mettre à jour
    if change_type == 'student_group_change':
        student_id = affected_entities.get('student_id')
        old_group_id = affected_entities.get('old_group_id')
        new_group_id = affected_entities.get('new_group_id')
        
        # Vues à synchroniser
        affected_views = [
            f'student_profile_{student_id}',
            f'group_members_{new_group_id}',
            'teacher_students_list',
            'admin_classes_view',
            'admin_classes_teachers_view'
        ]
        
        if old_group_id:
            affected_views.append(f'group_members_{old_group_id}')
    
    elif change_type == 'profile_update':
        student_id = affected_entities.get('student_id')
        affected_views = [
            f'student_profile_{student_id}',
            f'student_dashboard_{student_id}',
            'teacher_students_list',
            'admin_users_list'
        ]
    
    elif change_type == 'group_modification':
        group_id = affected_entities.get('group_id')
        affected_views = [
            f'group_details_{group_id}',
            'admin_classes_view',
            'admin_classes_teachers_view',
            'teacher_classes_list'
        ]
    
    elif change_type == 'teacher_assignment':
        teacher_id = affected_entities.get('teacher_id')
        old_teacher_id = affected_entities.get('old_teacher_id')
        group_id = affected_entities.get('group_id')
        
        affected_views = [
            f'group_details_{group_id}',
            'admin_classes_view',
            'admin_classes_teachers_view'
        ]
        
        if teacher_id:
            affected_views.append(f'teacher_classes_{teacher_id}')
        if old_teacher_id:
            affected_views.append(f'teacher_classes_{old_teacher_id}')
    
    # Étape 2: Invalider les caches
    for view_key in affected_views:
        cache.delete(view_key)
    
    # Étape 3: Retourner le statut
    return {
        'sync_status': 'completed',
        'affected_views': affected_views,
        'timestamp': timezone.now().isoformat()
    }


@method_decorator(admin_required, name='dispatch')
@method_decorator(rate_limit(max_requests=100, window=3600), name='dispatch')
class GroupManagementView(APIView):
    """Gestion des groupes/classes"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Liste tous les groupes/classes"""
        try:
            groups = Group.objects.all().order_by('name')
            serializer = GroupSerializer(groups, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def post(self, request):
        """Crée un nouveau groupe/classe"""
        try:
            serializer = GroupSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# Autres vues admin...


def resolve_modification_conflict(entity_type, entity_id, admin_changes, teacher_changes, admin_user=None, teacher_user=None):
    """
    Résout les conflits lorsque Admin et Professeur modifient simultanément
    
    INPUT: entity_type (str), entity_id (int), admin_changes (dict), teacher_changes (dict)
    OUTPUT: dict avec resolved_changes et conflict_log
    
    Résout les conflits en appliquant les règles de priorité:
    - Admin a toujours la priorité sur les champs critiques
    - Fusion intelligente pour les champs collaboratifs
    """
    
    resolved_changes = {}
    conflicts = []
    
    # Règle: Admin a toujours la priorité
    ADMIN_PRIORITY_FIELDS = ['group', 'status', 'level', 'restrictions']
    TEACHER_ALLOWED_FIELDS = ['notes', 'objectives', 'progress']
    
    # Étape 1: Identifier les champs en conflit
    conflicting_fields = set(admin_changes.keys()) & set(teacher_changes.keys())
    
    # Étape 2: Résoudre les conflits
    for field in conflicting_fields:
        if field in ADMIN_PRIORITY_FIELDS:
            # Admin a la priorité
            resolved_changes[field] = admin_changes[field]
            conflicts.append({
                'field': field,
                'resolution': 'admin_priority',
                'admin_value': admin_changes[field],
                'teacher_value': teacher_changes[field],
                'chosen': 'admin'
            })
        elif field in TEACHER_ALLOWED_FIELDS:
            # Fusionner si possible, sinon Admin prioritaire
            if field == 'notes':
                # Concaténer les notes avec séparateur
                teacher_note = teacher_changes[field] or ''
                admin_note = admin_changes[field] or ''
                if teacher_note and admin_note:
                    resolved_changes[field] = f"{teacher_note}\n---\n{admin_note}"
                else:
                    resolved_changes[field] = admin_note or teacher_note
                conflicts.append({
                    'field': field,
                    'resolution': 'merged',
                    'teacher_value': teacher_note,
                    'admin_value': admin_note,
                    'result': resolved_changes[field]
                })
            else:
                # Pour les autres champs, Admin prioritaire
                resolved_changes[field] = admin_changes[field]
                conflicts.append({
                    'field': field,
                    'resolution': 'admin_priority',
                    'admin_value': admin_changes[field],
                    'teacher_value': teacher_changes[field],
                    'chosen': 'admin'
                })
        else:
            # Champ non reconnu, Admin prioritaire par défaut
            resolved_changes[field] = admin_changes[field]
            conflicts.append({
                'field': field,
                'resolution': 'admin_priority',
                'admin_value': admin_changes[field],
                'teacher_value': teacher_changes[field],
                'chosen': 'admin'
            })
    
    # Étape 3: Ajouter les champs non conflictuels
    for field, value in admin_changes.items():
        if field not in conflicting_fields:
            resolved_changes[field] = value
    
    for field, value in teacher_changes.items():
        if field not in conflicting_fields and field in TEACHER_ALLOWED_FIELDS:
            resolved_changes[field] = value
    
    # Étape 4: Logger le conflit si des conflits existent
    if conflicts:
        conflict_log = ConflictLog.objects.create(
            entity_type=entity_type,
            entity_id=entity_id,
            conflicts=conflicts,
            resolved_changes=resolved_changes,
            admin_user=admin_user,
            teacher_user=teacher_user,
            resolution_strategy='admin_priority'
        )
        
        return {
            'resolved_changes': resolved_changes,
            'conflicts': conflicts,
            'resolution_strategy': 'admin_priority',
            'conflict_log_id': conflict_log.id
        }
    
    return {
        'resolved_changes': resolved_changes,
        'conflicts': [],
        'resolution_strategy': 'no_conflict'
    }




def synchronize_changes(change_type, affected_entities):
    """Gestion des groupes/classes"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Liste tous les groupes avec leurs membres"""
        # Récupérer les groupes principaux (Classe_8h45, Classe_10h45)
        main_groups = Group.objects.filter(
            name__in=['Classe_8h45', 'Classe_10h45']
        ).prefetch_related('user_set__student_profile')
        
        groups_data = []
        for group in main_groups:
            # Récupérer l'extension si elle existe
            try:
                extension = group.extension
                time_slot = extension.time_slot
                teacher_id = extension.teacher.id if extension.teacher else None
                teacher_name = extension.teacher.get_full_name() if extension.teacher else None
            except GroupExtension.DoesNotExist:
                time_slot = '8h45' if '8h45' in group.name else '10h45'
                teacher_id = None
                teacher_name = None
            
            # Récupérer les membres (étudiants)
            students = group.user_set.filter(role='student')
            students_data = []
            for student in students:
                students_data.append({
                    'id': student.id,
                    'username': student.username,
                    'first_name': student.first_name,
                    'last_name': student.last_name,
                    'email': student.email,
                })
            
            groups_data.append({
                'id': group.id,
                'name': group.name,
                'time_slot': time_slot,
                'teacher_id': teacher_id,
                'teacher_name': teacher_name,
                'students_count': students.count(),
                'students': students_data,
            })
        
        return Response({
            'groups': groups_data,
            'total_count': len(groups_data)
        })
    
    def post(self, request):
        """Crée un nouveau groupe"""
        name = request.data.get('name', '').strip()
        time_slot = request.data.get('time_slot', '').strip()
        teacher_id = request.data.get('teacher_id')
        
        # Validation
        if not name:
            return Response(
                {'detail': 'Le nom du groupe est requis.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if time_slot not in ['8h45', '10h45']:
            return Response(
                {'detail': 'Le créneau horaire doit être 8h45 ou 10h45.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier l'unicité du nom
        if Group.objects.filter(name=name).exists():
            return Response(
                {'detail': 'Un groupe avec ce nom existe déjà.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier le professeur si fourni
        teacher = None
        if teacher_id:
            try:
                teacher = User.objects.get(id=teacher_id, role='teacher')
            except User.DoesNotExist:
                return Response(
                    {'detail': 'Professeur introuvable.'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Créer le groupe avec transaction atomique
        try:
            with transaction.atomic():
                # Créer le groupe
                group = Group.objects.create(name=name)
                
                # Créer l'extension
                GroupExtension.objects.create(
                    group=group,
                    time_slot=time_slot,
                    teacher=teacher
                )
                
                # Créer le log d'audit
                AuditLog.objects.create(
                    action='create_group',
                    admin_user=request.user,
                    target_group=group,
                    after_data={
                        'name': name,
                        'time_slot': time_slot,
                        'teacher_id': teacher_id
                    },
                    ip_address=get_client_ip(request)
                )
            
            return Response({
                'id': group.id,
                'name': group.name,
                'time_slot': time_slot,
                'message': 'Groupe créé avec succès'
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'detail': f'Erreur lors de la création: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@method_decorator(admin_required, name='dispatch')
@method_decorator(rate_limit(max_requests=100, window=3600), name='dispatch')
class GroupDetailView(APIView):
    """Détails et modification d'un groupe"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, group_id):
        """Récupère les détails d'un groupe"""
        try:
            group = Group.objects.prefetch_related('user_set__student_profile').get(id=group_id)
        except Group.DoesNotExist:
            return Response(
                {'detail': 'Groupe introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Récupérer l'extension
        try:
            extension = group.extension
            time_slot = extension.time_slot
            teacher_id = extension.teacher.id if extension.teacher else None
            teacher_name = extension.teacher.get_full_name() if extension.teacher else None
        except GroupExtension.DoesNotExist:
            time_slot = '8h45' if '8h45' in group.name else '10h45'
            teacher_id = None
            teacher_name = None
        
        # Récupérer les membres
        students = group.user_set.filter(role='student')
        students_data = []
        for student in students:
            students_data.append({
                'id': student.id,
                'username': student.username,
                'first_name': student.first_name,
                'last_name': student.last_name,
                'email': student.email,
            })
        
        return Response({
            'id': group.id,
            'name': group.name,
            'time_slot': time_slot,
            'teacher_id': teacher_id,
            'teacher_name': teacher_name,
            'students_count': students.count(),
            'students': students_data,
        })
    
    def put(self, request, group_id):
        """Modifie un groupe (nom, créneau, professeur)"""
        try:
            group = Group.objects.get(id=group_id)
        except Group.DoesNotExist:
            return Response(
                {'detail': 'Groupe introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        new_name = request.data.get('name', '').strip()
        new_time_slot = request.data.get('time_slot', '').strip()
        new_teacher_id = request.data.get('teacher_id')
        
        # Sauvegarder l'état avant modification
        before_data = {
            'name': group.name,
        }
        
        try:
            extension = group.extension
            before_data['time_slot'] = extension.time_slot
            before_data['teacher_id'] = extension.teacher.id if extension.teacher else None
        except GroupExtension.DoesNotExist:
            extension = None
        
        # Validation
        if new_name and new_name != group.name:
            if Group.objects.filter(name=new_name).exists():
                return Response(
                    {'detail': 'Un groupe avec ce nom existe déjà.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        if new_time_slot and new_time_slot not in ['8h45', '10h45']:
            return Response(
                {'detail': 'Le créneau horaire doit être 8h45 ou 10h45.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier le professeur si fourni
        new_teacher = None
        if new_teacher_id:
            try:
                new_teacher = User.objects.get(id=new_teacher_id, role='teacher')
            except User.DoesNotExist:
                return Response(
                    {'detail': 'Professeur introuvable.'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Appliquer les modifications avec transaction atomique
        try:
            with transaction.atomic():
                # Modifier le nom si fourni
                if new_name and new_name != group.name:
                    group.name = new_name
                    group.save()
                
                # Modifier l'extension
                if extension:
                    if new_time_slot:
                        extension.time_slot = new_time_slot
                    if new_teacher_id is not None:  # Peut être None pour retirer le professeur
                        extension.teacher = new_teacher
                    extension.save()
                else:
                    # Créer l'extension si elle n'existe pas
                    GroupExtension.objects.create(
                        group=group,
                        time_slot=new_time_slot or '8h45',
                        teacher=new_teacher
                    )
                
                # Créer le log d'audit
                after_data = {
                    'name': group.name,
                    'time_slot': extension.time_slot if extension else new_time_slot,
                    'teacher_id': new_teacher.id if new_teacher else None
                }
                
                AuditLog.objects.create(
                    action='rename_group' if new_name else 'assign_teacher',
                    admin_user=request.user,
                    target_group=group,
                    before_data=before_data,
                    after_data=after_data,
                    ip_address=get_client_ip(request)
                )
                
                # Synchroniser les changements
                sync_result = synchronize_changes('group_modification', {
                    'group_id': group_id
                })
            
            return Response({
                'id': group.id,
                'name': group.name,
                'message': 'Groupe modifié avec succès',
                'sync_status': sync_result.get('sync_status', 'completed')
            })
            
        except Exception as e:
            return Response(
                {'detail': f'Erreur lors de la modification: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def delete(self, request, group_id):
        """Supprime un groupe"""
        try:
            group = Group.objects.get(id=group_id)
        except Group.DoesNotExist:
            return Response(
                {'detail': 'Groupe introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        force = request.data.get('force', False)
        
        # Vérifier si le groupe contient des membres
        members_count = group.user_set.filter(role='student').count()
        
        if members_count > 0 and not force:
            return Response(
                {'detail': f'Le groupe contient encore {members_count} élèves. Utilisez force=true pour forcer la suppression.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Suppression avec transaction atomique
        try:
            with transaction.atomic():
                # Si force=True, réassigner les élèves à un groupe par défaut
                reassigned_count = 0
                if force and members_count > 0:
                    # Trouver ou créer un groupe par défaut
                    default_group, _ = Group.objects.get_or_create(name='Groupe_Par_Defaut')
                    
                    members = group.user_set.filter(role='student')
                    for member in members:
                        # Retirer du groupe actuel
                        member.groups.remove(group)
                        # Ajouter au groupe par défaut
                        member.groups.add(default_group)
                        
                        # Créer l'historique
                        UserGroupHistory.objects.create(
                            user=member,
                            old_group=group,
                            new_group=default_group,
                            changed_by=request.user,
                            reason='Groupe supprimé par Admin'
                        )
                        reassigned_count += 1
                
                # Créer le log d'audit avant suppression
                AuditLog.objects.create(
                    action='delete_group',
                    admin_user=request.user,
                    target_group=group,
                    before_data={
                        'name': group.name,
                        'members_count': members_count,
                        'reassigned_count': reassigned_count
                    },
                    ip_address=get_client_ip(request)
                )
                
                # Supprimer le groupe
                group_name = group.name
                group.delete()
            
            return Response({
                'message': f'Groupe {group_name} supprimé avec succès',
                'reassigned_count': reassigned_count
            })
            
        except Exception as e:
            return Response(
                {'detail': f'Erreur lors de la suppression: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )



@method_decorator(admin_required, name='dispatch')
@method_decorator(rate_limit(max_requests=100, window=3600), name='dispatch')
class StudentGroupAssignmentView(APIView):
    """Assignation d'élèves aux groupes"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """Assigne un élève à un groupe"""
        student_id = request.data.get('student_id')
        new_group_id = request.data.get('group_id')
        
        # Validation
        if not student_id or not new_group_id:
            return Response(
                {'detail': 'student_id et group_id sont requis.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier que l'élève existe
        try:
            student = User.objects.get(id=student_id, role='student')
        except User.DoesNotExist:
            return Response(
                {'detail': 'Élève introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Vérifier que le groupe existe
        try:
            new_group = Group.objects.get(id=new_group_id)
        except Group.DoesNotExist:
            return Response(
                {'detail': 'Groupe introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Vérifier si l'élève est déjà dans ce groupe
        if student.groups.filter(id=new_group_id).exists():
            return Response({
                'status': 'no_change',
                'message': 'Élève déjà dans ce groupe'
            })
        
        # Récupérer l'ancien groupe (si existe)
        old_groups = student.groups.filter(name__in=['Classe_8h45', 'Classe_10h45'])
        old_group = old_groups.first() if old_groups.exists() else None
        
        # Assignation avec transaction atomique
        try:
            with transaction.atomic():
                # Retirer de tous les groupes principaux (contrainte mono-groupe)
                if old_groups.exists():
                    student.groups.remove(*old_groups)
                
                # Ajouter au nouveau groupe
                student.groups.add(new_group)
                
                # Créer l'historique
                UserGroupHistory.objects.create(
                    user=student,
                    old_group=old_group,
                    new_group=new_group,
                    changed_by=request.user
                )
                
                # Créer le log d'audit
                AuditLog.objects.create(
                    action='assign_student',
                    admin_user=request.user,
                    target_user=student,
                    target_group=new_group,
                    before_data={'group_id': old_group.id if old_group else None, 'group_name': old_group.name if old_group else None},
                    after_data={'group_id': new_group.id, 'group_name': new_group.name},
                    ip_address=get_client_ip(request)
                )
                
                # Synchroniser les changements
                sync_result = synchronize_changes('student_group_change', {
                    'student_id': student_id,
                    'old_group_id': old_group.id if old_group else None,
                    'new_group_id': new_group.id
                })
            
            return Response({
                'status': 'success',
                'student_id': student_id,
                'old_group': old_group.name if old_group else None,
                'new_group': new_group.name,
                'timestamp': timezone.now().isoformat(),
                'sync_status': sync_result.get('sync_status', 'completed')
            })
            
        except Exception as e:
            return Response(
                {'detail': f'Erreur lors de l\'assignation: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )



@method_decorator(admin_required, name='dispatch')
@method_decorator(rate_limit(max_requests=100, window=3600), name='dispatch')
class StudentProfileAdminView(APIView):
    """Modification complète du profil élève par Admin"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, student_id):
        """Récupère le profil complet d'un élève"""
        try:
            student = User.objects.select_related('student_profile').prefetch_related(
                'groups', 'group_history__old_group', 'group_history__new_group', 'group_history__changed_by'
            ).get(id=student_id, role='student')
        except User.DoesNotExist:
            return Response(
                {'detail': 'Élève introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Récupérer ou créer le profil étudiant
        try:
            profile = student.student_profile
        except StudentProfile.DoesNotExist:
            profile = StudentProfile.objects.create(user=student)
        
        # Récupérer les groupes de l'élève
        groups = student.groups.filter(name__in=['Classe_8h45', 'Classe_10h45'])
        groups_data = [{'id': g.id, 'name': g.name} for g in groups]
        
        # Récupérer l'historique des changements de groupe
        history = student.group_history.all()[:20]  # Limiter à 20 derniers
        history_data = []
        for h in history:
            history_data.append({
                'id': h.id,
                'old_group': h.old_group.name if h.old_group else None,
                'new_group': h.new_group.name if h.new_group else None,
                'changed_by': h.changed_by.get_full_name() if h.changed_by else None,
                'changed_at': h.changed_at.isoformat(),
                'reason': h.reason
            })
        
        return Response({
            'id': student.id,
            'username': student.username,
            'first_name': student.first_name,
            'last_name': student.last_name,
            'email': student.email,
            'groups': groups_data,
            'profile': {
                'level': profile.level,
                'status': profile.status,
                'notes': profile.notes,
                'objectives': profile.objectives,
                'restrictions': profile.restrictions,
                'special_case': profile.special_case,
                'created_at': profile.created_at.isoformat(),
                'updated_at': profile.updated_at.isoformat(),
            },
            'group_history': history_data
        })
    
    def put(self, request, student_id):
        """Modifie tous les champs du profil élève"""
        try:
            student = User.objects.select_related('student_profile').get(id=student_id, role='student')
        except User.DoesNotExist:
            return Response(
                {'detail': 'Élève introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Récupérer ou créer le profil
        try:
            profile = student.student_profile
        except StudentProfile.DoesNotExist:
            profile = StudentProfile.objects.create(user=student)
        
        # Champs modifiables autorisés
        ALLOWED_USER_FIELDS = ['first_name', 'last_name', 'email']
        ALLOWED_PROFILE_FIELDS = ['level', 'status', 'notes', 'objectives', 'restrictions', 'special_case']
        
        # Sauvegarder l'état avant modification
        before_data = {
            'first_name': student.first_name,
            'last_name': student.last_name,
            'email': student.email,
            'level': profile.level,
            'status': profile.status,
            'notes': profile.notes,
            'objectives': profile.objectives,
            'restrictions': profile.restrictions,
            'special_case': profile.special_case,
        }
        
        updated_fields = []
        errors = []
        
        # Appliquer les modifications avec transaction atomique
        try:
            with transaction.atomic():
                # Modifier les champs User
                for field in ALLOWED_USER_FIELDS:
                    if field in request.data:
                        value = request.data[field]
                        
                        # Validation spécifique
                        try:
                            if field == 'email' and value:
                                validate_email(value)
                            
                            setattr(student, field, value)
                            updated_fields.append(field)
                            
                        except ValidationError as e:
                            errors.append({
                                'field': field,
                                'error': str(e)
                            })
                
                # Sauvegarder l'utilisateur si modifié
                if any(f in updated_fields for f in ALLOWED_USER_FIELDS):
                    student.save(update_fields=[f for f in ALLOWED_USER_FIELDS if f in updated_fields] + ['date_joined'])
                
                # Modifier les champs Profile
                for field in ALLOWED_PROFILE_FIELDS:
                    if field in request.data:
                        value = request.data[field]
                        
                        # Validation spécifique
                        try:
                            if field == 'status' and value not in ['active', 'inactive', 'graduated']:
                                raise ValidationError('Statut invalide')
                            
                            setattr(profile, field, value)
                            updated_fields.append(field)
                            
                        except ValidationError as e:
                            errors.append({
                                'field': field,
                                'error': str(e)
                            })
                
                # Sauvegarder le profil si modifié
                if any(f in updated_fields for f in ALLOWED_PROFILE_FIELDS):
                    profile.save()
                
                # Créer le log d'audit si au moins un champ modifié
                if updated_fields:
                    after_data = {
                        'first_name': student.first_name,
                        'last_name': student.last_name,
                        'email': student.email,
                        'level': profile.level,
                        'status': profile.status,
                        'notes': profile.notes,
                        'objectives': profile.objectives,
                        'restrictions': profile.restrictions,
                        'special_case': profile.special_case,
                    }
                    
                    AuditLog.objects.create(
                        action='update_profile',
                        admin_user=request.user,
                        target_user=student,
                        before_data=before_data,
                        after_data=after_data,
                        ip_address=get_client_ip(request)
                    )
                    
                    # Synchroniser les changements
                    sync_result = synchronize_changes('profile_update', {
                        'student_id': student_id
                    })
            
            return Response({
                'status': 'success' if updated_fields else 'no_change',
                'updated_fields': updated_fields,
                'errors': errors,
                'timestamp': timezone.now().isoformat(),
                'sync_status': sync_result.get('sync_status', 'completed') if updated_fields else 'no_change'
            })
            
        except Exception as e:
            return Response(
                {'detail': f'Erreur lors de la modification: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@method_decorator(admin_required, name='dispatch')
@method_decorator(rate_limit(max_requests=100, window=3600), name='dispatch')
class TeacherClassAssignmentView(APIView):
    """Gestion des affectations professeur ↔ classes"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """Assigne un professeur à une classe"""
        teacher_id = request.data.get('teacher_id')
        group_id = request.data.get('group_id')
        
        # Validation
        if not teacher_id or not group_id:
            return Response(
                {'detail': 'teacher_id et group_id sont requis.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier le professeur
        try:
            teacher = User.objects.get(id=teacher_id, role='teacher')
        except User.DoesNotExist:
            return Response(
                {'detail': 'Professeur introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Vérifier le groupe
        try:
            group = Group.objects.get(id=group_id)
        except Group.DoesNotExist:
            return Response(
                {'detail': 'Groupe introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Récupérer ou créer l'extension
        try:
            extension = group.extension
            old_teacher_id = extension.teacher.id if extension.teacher else None
        except GroupExtension.DoesNotExist:
            extension = GroupExtension.objects.create(
                group=group,
                time_slot='8h45' if '8h45' in group.name else '10h45'
            )
            old_teacher_id = None
        
        # Assigner le professeur
        try:
            with transaction.atomic():
                extension.teacher = teacher
                extension.save()
                
                # Créer le log d'audit
                AuditLog.objects.create(
                    action='assign_teacher',
                    admin_user=request.user,
                    target_group=group,
                    before_data={'teacher_id': old_teacher_id},
                    after_data={'teacher_id': teacher.id},
                    ip_address=get_client_ip(request)
                )
                
                # Synchroniser les changements
                sync_result = synchronize_changes('teacher_assignment', {
                    'teacher_id': teacher.id,
                    'old_teacher_id': old_teacher_id,
                    'group_id': group.id
                })
            
            return Response({
                'status': 'success',
                'teacher_id': teacher.id,
                'teacher_name': teacher.get_full_name(),
                'group_id': group.id,
                'group_name': group.name,
                'message': 'Professeur assigné avec succès',
                'sync_status': sync_result.get('sync_status', 'completed')
            })
            
        except Exception as e:
            return Response(
                {'detail': f'Erreur lors de l\'assignation: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def delete(self, request):
        """Retire un professeur d'une classe"""
        group_id = request.data.get('group_id')
        
        if not group_id:
            return Response(
                {'detail': 'group_id est requis.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier le groupe
        try:
            group = Group.objects.get(id=group_id)
        except Group.DoesNotExist:
            return Response(
                {'detail': 'Groupe introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Récupérer l'extension
        try:
            extension = group.extension
            old_teacher_id = extension.teacher.id if extension.teacher else None
        except GroupExtension.DoesNotExist:
            return Response(
                {'detail': 'Aucun professeur assigné à ce groupe.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Retirer le professeur
        try:
            with transaction.atomic():
                extension.teacher = None
                extension.save()
                
                # Créer le log d'audit
                AuditLog.objects.create(
                    action='assign_teacher',
                    admin_user=request.user,
                    target_group=group,
                    before_data={'teacher_id': old_teacher_id},
                    after_data={'teacher_id': None},
                    ip_address=get_client_ip(request)
                )
                
                # Synchroniser les changements
                sync_result = synchronize_changes('teacher_assignment', {
                    'teacher_id': None,
                    'old_teacher_id': old_teacher_id,
                    'group_id': group.id
                })
            
            return Response({
                'status': 'success',
                'group_id': group.id,
                'group_name': group.name,
                'message': 'Professeur retiré avec succès',
                'sync_status': sync_result.get('sync_status', 'completed')
            })
            
        except Exception as e:
            return Response(
                {'detail': f'Erreur lors du retrait: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@method_decorator(admin_required, name='dispatch')
@method_decorator(rate_limit(max_requests=100, window=3600), name='dispatch')
class AuditLogView(APIView):
    """Consultation du journal d'audit"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Liste les actions d'audit avec filtres"""
        # Récupérer les paramètres de filtrage
        action = request.GET.get('action')
        admin_user_id = request.GET.get('admin_user_id')
        target_user_id = request.GET.get('target_user_id')
        target_group_id = request.GET.get('target_group_id')
        date_from = request.GET.get('date_from')  # Format: YYYY-MM-DD
        date_to = request.GET.get('date_to')  # Format: YYYY-MM-DD
        search = request.GET.get('search')  # Recherche par mot-clé
        export_format = request.GET.get('export')  # 'csv' ou 'json'
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 50))
        
        # Construire la requête
        logs = AuditLog.objects.select_related(
            'admin_user', 'target_user', 'target_group'
        ).all()
        
        # Appliquer les filtres
        if action:
            logs = logs.filter(action=action)
        if admin_user_id:
            logs = logs.filter(admin_user_id=admin_user_id)
        if target_user_id:
            logs = logs.filter(target_user_id=target_user_id)
        if target_group_id:
            logs = logs.filter(target_group_id=target_group_id)
        if date_from:
            try:
                from datetime import datetime
                date_from_obj = datetime.strptime(date_from, '%Y-%m-%d')
                logs = logs.filter(timestamp__gte=date_from_obj)
            except ValueError:
                pass  # Ignorer les dates invalides
        if date_to:
            try:
                from datetime import datetime
                date_to_obj = datetime.strptime(date_to, '%Y-%m-%d')
                # Ajouter 1 jour pour inclure toute la journée
                from datetime import timedelta
                date_to_obj = date_to_obj + timedelta(days=1)
                logs = logs.filter(timestamp__lt=date_to_obj)
            except ValueError:
                pass  # Ignorer les dates invalides
        
        # Recherche par mot-clé dans les données JSON
        if search:
            from django.db.models import Q
            # Note: Pour SQLite, on ne peut pas faire de recherche JSON native
            # On doit filtrer en Python, ce qui peut être lent sur de grandes tables
            # Pour PostgreSQL, on pourrait utiliser des requêtes JSON natives
            pass  # La recherche sera appliquée après avoir récupéré les logs
        
        # Ordonner par timestamp décroissant
        logs = logs.order_by('-timestamp')
        
        # Export si demandé (avant pagination)
        if export_format in ['csv', 'json']:
            # Pour l'export, appliquer la recherche si nécessaire
            if search:
                import json
                search_lower = search.lower()
                filtered_logs = []
                for log in logs[:10000]:  # Limiter à 10000 pour l'export
                    before_str = json.dumps(log.before_data or {}).lower()
                    after_str = json.dumps(log.after_data or {}).lower()
                    if search_lower in before_str or search_lower in after_str:
                        filtered_logs.append(log)
                return self._export_logs(filtered_logs, export_format)
            else:
                return self._export_logs(logs, export_format)
        
        # Appliquer la recherche pour la pagination normale
        if search:
            import json
            search_lower = search.lower()
            filtered_log_ids = []
            # Limiter la recherche aux 1000 premiers logs pour éviter les problèmes de performance
            for log in logs[:1000]:
                before_str = json.dumps(log.before_data or {}).lower()
                after_str = json.dumps(log.after_data or {}).lower()
                if search_lower in before_str or search_lower in after_str:
                    filtered_log_ids.append(log.id)
            logs = logs.filter(id__in=filtered_log_ids)
        
        # Pagination
        total_count = logs.count()
        start = (page - 1) * page_size
        end = start + page_size
        logs = logs[start:end]
        
        # Sérialiser les logs
        logs_data = []
        for log in logs:
            logs_data.append({
                'id': log.id,
                'action': log.action,
                'admin_user': log.admin_user.get_full_name() if log.admin_user else None,
                'target_user': log.target_user.get_full_name() if log.target_user else None,
                'target_group': log.target_group.name if log.target_group else None,
                'before_data': log.before_data,
                'after_data': log.after_data,
                'timestamp': log.timestamp.isoformat(),
                'ip_address': log.ip_address,
            })
        
        return Response({
            'logs': logs_data,
            'total_count': total_count,
            'page': page,
            'page_size': page_size,
            'total_pages': (total_count + page_size - 1) // page_size
        })
    
    def _export_logs(self, logs, export_format):
        """Exporte les logs en CSV ou JSON"""
        import csv
        import json
        from django.http import HttpResponse
        
        # Convertir en liste si c'est un QuerySet et limiter à 10000 entrées
        if hasattr(logs, 'model'):  # C'est un QuerySet
            logs = list(logs[:10000])
        elif isinstance(logs, list):
            logs = logs[:10000]
        
        if export_format == 'csv':
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="audit_log.csv"'
            
            writer = csv.writer(response)
            writer.writerow([
                'ID', 'Action', 'Admin', 'Target User', 'Target Group',
                'Before Data', 'After Data', 'Timestamp', 'IP Address'
            ])
            
            for log in logs:
                writer.writerow([
                    log.id,
                    log.action,
                    log.admin_user.get_full_name() if log.admin_user else '',
                    log.target_user.get_full_name() if log.target_user else '',
                    log.target_group.name if log.target_group else '',
                    json.dumps(log.before_data) if log.before_data else '',
                    json.dumps(log.after_data) if log.after_data else '',
                    log.timestamp.isoformat(),
                    log.ip_address or ''
                ])
            
            return response
        
        elif export_format == 'json':
            logs_data = []
            for log in logs:
                logs_data.append({
                    'id': log.id,
                    'action': log.action,
                    'admin_user': log.admin_user.get_full_name() if log.admin_user else None,
                    'admin_user_id': log.admin_user.id if log.admin_user else None,
                    'target_user': log.target_user.get_full_name() if log.target_user else None,
                    'target_user_id': log.target_user.id if log.target_user else None,
                    'target_group': log.target_group.name if log.target_group else None,
                    'target_group_id': log.target_group.id if log.target_group else None,
                    'before_data': log.before_data,
                    'after_data': log.after_data,
                    'timestamp': log.timestamp.isoformat(),
                    'ip_address': log.ip_address,
                })
            
            response = HttpResponse(
                json.dumps(logs_data, indent=2, ensure_ascii=False),
                content_type='application/json'
            )
            response['Content-Disposition'] = 'attachment; filename="audit_log.json"'
            return response



@method_decorator(admin_required, name='dispatch')
@method_decorator(rate_limit(max_requests=100, window=3600), name='dispatch')
class ClassesAndTeachersView(APIView):
    """Liste des classes et professeurs avec groupement par créneau"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """
        Retourne la structure:
        {
            teachers: [
                {
                    id, name, username,
                    classes_8h45: [{id, name, students_count, students: [...]}],
                    classes_10h45: [{id, name, students_count, students: [...]}]
                }
            ],
            all_classes: [
                {
                    id, name, time_slot, teacher_id, teacher_name,
                    students_count, students: [...]
                }
            ],
            unassigned_classes: {
                '8h45': [...],
                '10h45': [...]
            }
        }
        """
        
        # Vérifier le cache (TTL: 10 minutes = 600 secondes)
        cache_key = 'admin_classes_teachers_view'
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data)
        
        # Récupérer tous les professeurs
        teachers = User.objects.filter(role='teacher').order_by('first_name', 'last_name')
        
        # Récupérer tous les groupes principaux avec leurs extensions et membres
        all_groups = Group.objects.filter(
            name__in=['Classe_8h45', 'Classe_10h45']
        ).prefetch_related(
            'user_set__student_profile'
        ).select_related('extension__teacher')
        
        # Construire la structure des données
        teachers_data = []
        all_classes_data = []
        unassigned_classes = {'8h45': [], '10h45': []}
        
        # Mapper les classes par professeur
        classes_by_teacher = {}
        for group in all_groups:
            # Récupérer les informations de l'extension
            try:
                extension = group.extension
                time_slot = extension.time_slot
                teacher = extension.teacher
                teacher_id = teacher.id if teacher else None
                teacher_name = teacher.get_full_name() if teacher else None
            except GroupExtension.DoesNotExist:
                time_slot = '8h45' if '8h45' in group.name else '10h45'
                teacher_id = None
                teacher_name = None
            
            # Récupérer les étudiants
            students = group.user_set.filter(role='student').order_by('first_name', 'last_name')
            students_data = []
            for student in students:
                students_data.append({
                    'id': student.id,
                    'username': student.username,
                    'first_name': student.first_name,
                    'last_name': student.last_name,
                    'full_name': student.get_full_name(),
                    'email': student.email,
                })
            
            class_data = {
                'id': group.id,
                'name': group.name,
                'time_slot': time_slot,
                'teacher_id': teacher_id,
                'teacher_name': teacher_name,
                'students_count': students.count(),
                'students': students_data,
            }
            
            # Ajouter à all_classes
            all_classes_data.append(class_data)
            
            # Grouper par professeur
            if teacher_id:
                if teacher_id not in classes_by_teacher:
                    classes_by_teacher[teacher_id] = {'8h45': [], '10h45': []}
                classes_by_teacher[teacher_id][time_slot].append(class_data)
            else:
                # Classes sans professeur
                unassigned_classes[time_slot].append(class_data)
        
        # Construire les données des professeurs
        for teacher in teachers:
            teacher_classes = classes_by_teacher.get(teacher.id, {'8h45': [], '10h45': []})
            total_classes = len(teacher_classes['8h45']) + len(teacher_classes['10h45'])
            
            teachers_data.append({
                'id': teacher.id,
                'username': teacher.username,
                'first_name': teacher.first_name,
                'last_name': teacher.last_name,
                'full_name': teacher.get_full_name(),
                'email': teacher.email,
                'classes_count': total_classes,
                'classes_8h45': teacher_classes['8h45'],
                'classes_10h45': teacher_classes['10h45'],
            })
        
        response_data = {
            'teachers': teachers_data,
            'all_classes': all_classes_data,
            'unassigned_classes': unassigned_classes,
            'summary': {
                'total_teachers': len(teachers_data),
                'total_classes': len(all_classes_data),
                'unassigned_classes_count': len(unassigned_classes['8h45']) + len(unassigned_classes['10h45'])
            }
        }
        
        # Mettre en cache pour 10 minutes (600 secondes)
        cache.set(cache_key, response_data, 600)
        
        return Response(response_data)



@method_decorator(admin_required, name='dispatch')
@method_decorator(rate_limit(max_requests=200, window=3600), name='dispatch')
class SyncUpdatesView(APIView):
    """
    Endpoint pour la synchronisation globale
    Retourne les mises à jour depuis un timestamp donné
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """
        Récupère les mises à jour depuis un timestamp
        
        Query params:
        - since: timestamp ISO 8601 (optionnel)
        
        Returns:
        {
            'updates': [
                {
                    'change_type': 'student_assigned',
                    'timestamp': '2026-02-20T10:30:00Z',
                    'data': {...},
                    'affected_caches': [...]
                }
            ],
            'timestamp': '2026-02-20T10:35:00Z'
        }
        """
        try:
            # Récupérer le timestamp depuis lequel chercher les mises à jour
            since_param = request.GET.get('since')
            if since_param:
                try:
                    since = timezone.datetime.fromisoformat(since_param.replace('Z', '+00:00'))
                except ValueError:
                    return Response(
                        {'error': 'Format de timestamp invalide'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            else:
                # Par défaut, dernières 30 secondes
                since = timezone.now() - timezone.timedelta(seconds=30)
            
            # Récupérer les logs d'audit récents
            recent_logs = AuditLog.objects.filter(
                timestamp__gt=since
            ).order_by('timestamp')[:50]
            
            updates = []
            
            for log in recent_logs:
                # Déterminer le type de changement et les caches affectés
                change_type = self._map_action_to_change_type(log.action)
                affected_caches = self._get_affected_caches(log)
                
                update = {
                    'change_type': change_type,
                    'timestamp': log.timestamp.isoformat(),
                    'data': {
                        'action': log.action,
                        'admin_user': log.admin_user.get_full_name() if log.admin_user else None,
                        'target_user_id': log.target_user_id,
                        'target_group_id': log.target_group_id,
                        'before_data': log.before_data,
                        'after_data': log.after_data
                    },
                    'affected_caches': affected_caches
                }
                
                updates.append(update)
            
            return Response({
                'updates': updates,
                'timestamp': timezone.now().isoformat(),
                'count': len(updates)
            })
            
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de la récupération des mises à jour: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _map_action_to_change_type(self, action):
        """Mappe les actions d'audit aux types de changement"""
        mapping = {
            'create_group': 'group_created',
            'rename_group': 'group_updated',
            'delete_group': 'group_deleted',
            'assign_student': 'student_assigned',
            'update_profile': 'student_profile_updated',
            'assign_teacher': 'teacher_assigned',
            'remove_teacher': 'teacher_removed'
        }
        return mapping.get(action, 'unknown')
    
    def _get_affected_caches(self, log):
        """Détermine les clés de cache affectées par un log"""
        affected = []
        
        if log.action == 'assign_student':
            if log.target_user_id:
                affected.append(f'student_profile_{log.target_user_id}')
            if log.target_group_id:
                affected.append(f'group_members_{log.target_group_id}')
            if log.before_data and log.before_data.get('group_id'):
                affected.append(f'group_members_{log.before_data["group_id"]}')
            affected.extend(['teacher_students_list', 'admin_classes_view', 'admin_classes_teachers_view'])
        
        elif log.action == 'update_profile':
            if log.target_user_id:
                affected.append(f'student_profile_{log.target_user_id}')
                affected.append(f'student_dashboard_{log.target_user_id}')
            affected.extend(['teacher_students_list', 'admin_users_list'])
        
        elif log.action in ['create_group', 'rename_group', 'delete_group']:
            if log.target_group_id:
                affected.append(f'group_details_{log.target_group_id}')
            affected.extend(['admin_classes_view', 'admin_classes_teachers_view', 'teacher_classes_list'])
        
        elif log.action in ['assign_teacher', 'remove_teacher']:
            if log.target_group_id:
                affected.append(f'group_details_{log.target_group_id}')
            if log.after_data and log.after_data.get('teacher_id'):
                affected.append(f'teacher_classes_{log.after_data["teacher_id"]}')
            if log.before_data and log.before_data.get('teacher_id'):
                affected.append(f'teacher_classes_{log.before_data["teacher_id"]}')
            affected.extend(['admin_classes_view', 'admin_classes_teachers_view'])
        
        return affected
