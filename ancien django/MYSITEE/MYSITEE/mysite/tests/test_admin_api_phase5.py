"""
Tests unitaires pour Phase 5: Audit et synchronisation
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from rest_framework.test import APIClient
from rest_framework import status
from tasks.models import (
    GroupExtension, AuditLog, StudentProfile, 
    UserGroupHistory, ConflictLog
)
from datetime import datetime, timedelta
import json

User = get_user_model()


class AuditLogViewTests(TestCase):
    """Tests pour la consultation du journal d'audit"""
    
    def setUp(self):
        """Configuration initiale pour chaque test"""
        # Créer un admin
        self.admin = User.objects.create_user(
            username='admin_test',
            password='testpass123',
            role='admin',
            is_staff=True,
            is_superuser=True
        )
        
        # Créer un étudiant
        self.student = User.objects.create_user(
            username='student1',
            password='testpass123',
            first_name='Mohamed',
            last_name='Ali',
            role='student'
        )
        
        # Créer un groupe
        self.group = Group.objects.create(name='Classe_8h45')
        
        # Créer des logs d'audit
        self.log1 = AuditLog.objects.create(
            action='create_group',
            admin_user=self.admin,
            target_group=self.group,
            after_data={'name': 'Classe_8h45', 'time_slot': '8h45'},
            ip_address='127.0.0.1'
        )
        
        self.log2 = AuditLog.objects.create(
            action='assign_student',
            admin_user=self.admin,
            target_user=self.student,
            target_group=self.group,
            before_data={'group_id': None},
            after_data={'group_id': self.group.id, 'group_name': 'Classe_8h45'},
            ip_address='127.0.0.1'
        )
        
        self.log3 = AuditLog.objects.create(
            action='update_profile',
            admin_user=self.admin,
            target_user=self.student,
            before_data={'level': '', 'status': 'active'},
            after_data={'level': 'Juz 15', 'status': 'active'},
            ip_address='127.0.0.1'
        )
        
        # Client API
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)
    
    def test_get_audit_logs_success(self):
        """Test: Récupérer les logs d'audit avec succès"""
        response = self.client.get('/api/admin/audit-log/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('logs', response.data)
        self.assertIn('total_count', response.data)
        self.assertEqual(response.data['total_count'], 3)
        self.assertEqual(len(response.data['logs']), 3)
    
    def test_filter_by_action(self):
        """Test: Filtrer par type d'action"""
        response = self.client.get('/api/admin/audit-log/?action=assign_student')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_count'], 1)
        self.assertEqual(response.data['logs'][0]['action'], 'assign_student')
    
    def test_filter_by_admin_user(self):
        """Test: Filtrer par admin"""
        response = self.client.get(f'/api/admin/audit-log/?admin_user_id={self.admin.id}')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_count'], 3)
    
    def test_filter_by_target_user(self):
        """Test: Filtrer par utilisateur cible"""
        response = self.client.get(f'/api/admin/audit-log/?target_user_id={self.student.id}')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_count'], 2)
    
    def test_filter_by_target_group(self):
        """Test: Filtrer par groupe cible"""
        response = self.client.get(f'/api/admin/audit-log/?target_group_id={self.group.id}')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_count'], 2)
    
    def test_filter_by_date_range(self):
        """Test: Filtrer par plage de dates"""
        today = datetime.now().strftime('%Y-%m-%d')
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        
        response = self.client.get(
            f'/api/admin/audit-log/?date_from={today}&date_to={tomorrow}'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_count'], 3)
    
    def test_search_in_json_data(self):
        """Test: Recherche par mot-clé dans les données JSON"""
        response = self.client.get('/api/admin/audit-log/?search=Juz 15')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(response.data['total_count'], 1)
    
    def test_pagination(self):
        """Test: Pagination des résultats"""
        # Créer plus de logs pour tester la pagination
        for i in range(60):
            AuditLog.objects.create(
                action='update_profile',
                admin_user=self.admin,
                target_user=self.student,
                before_data={'test': i},
                after_data={'test': i+1},
                ip_address='127.0.0.1'
            )
        
        # Page 1
        response = self.client.get('/api/admin/audit-log/?page=1&page_size=50')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['logs']), 50)
        self.assertEqual(response.data['page'], 1)
        
        # Page 2
        response = self.client.get('/api/admin/audit-log/?page=2&page_size=50')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertLessEqual(len(response.data['logs']), 50)
        self.assertEqual(response.data['page'], 2)
    
    def test_export_csv(self):
        """Test: Export en CSV"""
        response = self.client.get('/api/admin/audit-log/?export=csv')
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'text/csv')
        self.assertIn('attachment', response['Content-Disposition'])
        self.assertIn('audit_log.csv', response['Content-Disposition'])
    
    def test_export_json(self):
        """Test: Export en JSON"""
        response = self.client.get('/api/admin/audit-log/?export=json')
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'application/json')
        self.assertIn('attachment', response['Content-Disposition'])
        self.assertIn('audit_log.json', response['Content-Disposition'])
        
        # Vérifier que le JSON est valide
        data = json.loads(response.content)
        self.assertIsInstance(data, list)
        self.assertGreaterEqual(len(data), 3)
    
    def test_unauthorized_access(self):
        """Test: Accès non autorisé"""
        # Créer un utilisateur non-admin
        student = User.objects.create_user(
            username='student_test',
            password='testpass123',
            role='student'
        )
        
        client = APIClient()
        client.force_authenticate(user=student)
        
        response = client.get('/api/admin/audit-log/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class SynchronizationTests(TestCase):
    """Tests pour la synchronisation globale"""
    
    def setUp(self):
        """Configuration initiale"""
        self.admin = User.objects.create_user(
            username='admin_test',
            password='testpass123',
            role='admin',
            is_staff=True,
            is_superuser=True
        )
        
        self.student = User.objects.create_user(
            username='student1',
            password='testpass123',
            role='student'
        )
        
        self.group = Group.objects.create(name='Classe_8h45')
        
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)
    
    def test_synchronize_student_group_change(self):
        """Test: Synchronisation lors du changement de groupe d'un élève"""
        from mysite.api_views_admin import synchronize_changes
        from django.core.cache import cache
        
        # Pré-remplir le cache
        cache.set(f'student_profile_{self.student.id}', 'test_data', 300)
        cache.set(f'group_members_{self.group.id}', 'test_data', 300)
        cache.set('admin_classes_view', 'test_data', 300)
        
        # Appeler la fonction de synchronisation
        result = synchronize_changes('student_group_change', {
            'student_id': self.student.id,
            'new_group_id': self.group.id,
            'old_group_id': None
        })
        
        self.assertEqual(result['sync_status'], 'completed')
        self.assertIn('affected_views', result)
        self.assertIn(f'student_profile_{self.student.id}', result['affected_views'])
        self.assertIn(f'group_members_{self.group.id}', result['affected_views'])
        
        # Vérifier que le cache a été invalidé
        self.assertIsNone(cache.get(f'student_profile_{self.student.id}'))
        self.assertIsNone(cache.get(f'group_members_{self.group.id}'))
    
    def test_synchronize_profile_update(self):
        """Test: Synchronisation lors de la mise à jour de profil"""
        from mysite.api_views_admin import synchronize_changes
        from django.core.cache import cache
        
        # Pré-remplir le cache
        cache.set(f'student_profile_{self.student.id}', 'test_data', 300)
        cache.set('teacher_students_list', 'test_data', 300)
        
        # Appeler la fonction de synchronisation
        result = synchronize_changes('profile_update', {
            'student_id': self.student.id
        })
        
        self.assertEqual(result['sync_status'], 'completed')
        self.assertIn(f'student_profile_{self.student.id}', result['affected_views'])
        self.assertIn('teacher_students_list', result['affected_views'])
        
        # Vérifier que le cache a été invalidé
        self.assertIsNone(cache.get(f'student_profile_{self.student.id}'))
        self.assertIsNone(cache.get('teacher_students_list'))
    
    def test_synchronize_group_modification(self):
        """Test: Synchronisation lors de la modification de groupe"""
        from mysite.api_views_admin import synchronize_changes
        from django.core.cache import cache
        
        # Pré-remplir le cache
        cache.set(f'group_details_{self.group.id}', 'test_data', 300)
        cache.set('admin_classes_view', 'test_data', 300)
        
        # Appeler la fonction de synchronisation
        result = synchronize_changes('group_modification', {
            'group_id': self.group.id
        })
        
        self.assertEqual(result['sync_status'], 'completed')
        self.assertIn(f'group_details_{self.group.id}', result['affected_views'])
        self.assertIn('admin_classes_view', result['affected_views'])
    
    def test_synchronize_teacher_assignment(self):
        """Test: Synchronisation lors de l'assignation de professeur"""
        from mysite.api_views_admin import synchronize_changes
        from django.core.cache import cache
        
        teacher = User.objects.create_user(
            username='teacher1',
            password='testpass123',
            role='teacher'
        )
        
        # Pré-remplir le cache
        cache.set(f'teacher_classes_{teacher.id}', 'test_data', 300)
        cache.set(f'group_details_{self.group.id}', 'test_data', 300)
        cache.set('admin_classes_teachers_view', 'test_data', 300)
        
        # Appeler la fonction de synchronisation
        result = synchronize_changes('teacher_assignment', {
            'teacher_id': teacher.id,
            'old_teacher_id': None,
            'group_id': self.group.id
        })
        
        self.assertEqual(result['sync_status'], 'completed')
        self.assertIn(f'teacher_classes_{teacher.id}', result['affected_views'])
        self.assertIn(f'group_details_{self.group.id}', result['affected_views'])
    
    def test_cache_invalidation_on_student_assignment(self):
        """Test: Invalidation du cache lors de l'assignation d'élève via API"""
        from django.core.cache import cache
        
        # Pré-remplir le cache
        cache.set(f'student_profile_{self.student.id}', 'test_data', 300)
        cache.set(f'group_members_{self.group.id}', 'test_data', 300)
        
        # Assigner l'élève via l'API
        response = self.client.post('/api/admin/assign-student/', {
            'student_id': self.student.id,
            'group_id': self.group.id
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['sync_status'], 'completed')
        
        # Vérifier que le cache a été invalidé
        self.assertIsNone(cache.get(f'student_profile_{self.student.id}'))
        self.assertIsNone(cache.get(f'group_members_{self.group.id}'))


class ConflictResolutionTests(TestCase):
    """Tests pour la résolution des conflits"""
    
    def setUp(self):
        """Configuration initiale"""
        self.admin = User.objects.create_user(
            username='admin_test',
            password='testpass123',
            role='admin',
            is_staff=True,
            is_superuser=True
        )
        
        self.teacher = User.objects.create_user(
            username='teacher1',
            password='testpass123',
            role='teacher'
        )
        
        self.student = User.objects.create_user(
            username='student1',
            password='testpass123',
            role='student'
        )
        
        StudentProfile.objects.create(user=self.student)
    
    def test_admin_priority_on_critical_fields(self):
        """Test: Admin a la priorité sur les champs critiques"""
        from mysite.api_views_admin import resolve_modification_conflict
        
        admin_changes = {'level': 'Juz 20', 'status': 'active'}
        teacher_changes = {'level': 'Juz 15', 'status': 'inactive'}
        
        result = resolve_modification_conflict(
            'student',
            self.student.id,
            admin_changes,
            teacher_changes,
            self.admin,
            self.teacher
        )
        
        # Admin doit avoir la priorité sur 'level' et 'status'
        self.assertEqual(result['resolved_changes']['level'], 'Juz 20')
        self.assertEqual(result['resolved_changes']['status'], 'active')
        self.assertEqual(result['resolution_strategy'], 'admin_priority')
        self.assertEqual(len(result['conflicts']), 2)
    
    def test_notes_merge(self):
        """Test: Fusion intelligente des notes"""
        from mysite.api_views_admin import resolve_modification_conflict
        
        admin_changes = {'notes': 'Admin note: Excellent progress'}
        teacher_changes = {'notes': 'Teacher note: Needs more practice'}
        
        result = resolve_modification_conflict(
            'student',
            self.student.id,
            admin_changes,
            teacher_changes,
            self.admin,
            self.teacher
        )
        
        # Les notes doivent être fusionnées
        self.assertIn('Teacher note', result['resolved_changes']['notes'])
        self.assertIn('Admin note', result['resolved_changes']['notes'])
        self.assertIn('---', result['resolved_changes']['notes'])
        self.assertEqual(len(result['conflicts']), 1)
        self.assertEqual(result['conflicts'][0]['resolution'], 'merged')
    
    def test_no_conflict_scenario(self):
        """Test: Pas de conflit si les champs sont différents"""
        from mysite.api_views_admin import resolve_modification_conflict
        
        admin_changes = {'level': 'Juz 20'}
        teacher_changes = {'notes': 'Teacher note'}
        
        result = resolve_modification_conflict(
            'student',
            self.student.id,
            admin_changes,
            teacher_changes,
            self.admin,
            self.teacher
        )
        
        # Pas de conflit
        self.assertEqual(result['resolved_changes']['level'], 'Juz 20')
        self.assertEqual(result['resolved_changes']['notes'], 'Teacher note')
        self.assertEqual(result['resolution_strategy'], 'no_conflict')
        self.assertEqual(len(result['conflicts']), 0)
    
    def test_conflict_log_creation(self):
        """Test: Création d'un log de conflit"""
        from mysite.api_views_admin import resolve_modification_conflict
        
        admin_changes = {'level': 'Juz 20', 'notes': 'Admin note'}
        teacher_changes = {'level': 'Juz 15', 'notes': 'Teacher note'}
        
        result = resolve_modification_conflict(
            'student',
            self.student.id,
            admin_changes,
            teacher_changes,
            self.admin,
            self.teacher
        )
        
        # Vérifier que le log de conflit a été créé
        self.assertIn('conflict_log_id', result)
        conflict_log = ConflictLog.objects.get(id=result['conflict_log_id'])
        
        self.assertEqual(conflict_log.entity_type, 'student')
        self.assertEqual(conflict_log.entity_id, self.student.id)
        self.assertEqual(conflict_log.admin_user, self.admin)
        self.assertEqual(conflict_log.teacher_user, self.teacher)
        self.assertEqual(conflict_log.resolution_strategy, 'admin_priority')
        self.assertGreater(len(conflict_log.conflicts), 0)
    
    def test_teacher_allowed_fields_without_conflict(self):
        """Test: Champs autorisés pour le professeur sans conflit"""
        from mysite.api_views_admin import resolve_modification_conflict
        
        admin_changes = {'level': 'Juz 20'}
        teacher_changes = {'objectives': 'Complete Juz 21 by next month'}
        
        result = resolve_modification_conflict(
            'student',
            self.student.id,
            admin_changes,
            teacher_changes,
            self.admin,
            self.teacher
        )
        
        # Les deux changements doivent être appliqués
        self.assertEqual(result['resolved_changes']['level'], 'Juz 20')
        self.assertEqual(result['resolved_changes']['objectives'], 'Complete Juz 21 by next month')
        self.assertEqual(len(result['conflicts']), 0)
    
    def test_empty_notes_merge(self):
        """Test: Fusion de notes avec une note vide"""
        from mysite.api_views_admin import resolve_modification_conflict
        
        admin_changes = {'notes': 'Admin note only'}
        teacher_changes = {'notes': ''}
        
        result = resolve_modification_conflict(
            'student',
            self.student.id,
            admin_changes,
            teacher_changes,
            self.admin,
            self.teacher
        )
        
        # Seule la note admin doit être présente
        self.assertEqual(result['resolved_changes']['notes'], 'Admin note only')
    
    def test_multiple_conflicts(self):
        """Test: Résolution de multiples conflits"""
        from mysite.api_views_admin import resolve_modification_conflict
        
        admin_changes = {
            'level': 'Juz 20',
            'status': 'active',
            'notes': 'Admin note',
            'restrictions': 'No restrictions'
        }
        teacher_changes = {
            'level': 'Juz 15',
            'status': 'inactive',
            'notes': 'Teacher note',
            'objectives': 'Teacher objective'
        }
        
        result = resolve_modification_conflict(
            'student',
            self.student.id,
            admin_changes,
            teacher_changes,
            self.admin,
            self.teacher
        )
        
        # Vérifier les résolutions
        self.assertEqual(result['resolved_changes']['level'], 'Juz 20')  # Admin priority
        self.assertEqual(result['resolved_changes']['status'], 'active')  # Admin priority
        self.assertIn('Teacher note', result['resolved_changes']['notes'])  # Merged
        self.assertIn('Admin note', result['resolved_changes']['notes'])  # Merged
        self.assertEqual(result['resolved_changes']['restrictions'], 'No restrictions')  # Admin only
        self.assertEqual(result['resolved_changes']['objectives'], 'Teacher objective')  # Teacher only
        
        # Vérifier le nombre de conflits
        self.assertGreaterEqual(len(result['conflicts']), 3)  # level, status, notes

