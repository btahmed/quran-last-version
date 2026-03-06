"""
Tests unitaires pour Phase 4: Gestion professeurs et classes
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from rest_framework.test import APIClient
from rest_framework import status
from tasks.models import GroupExtension, AuditLog

User = get_user_model()


class TeacherClassAssignmentTests(TestCase):
    """Tests pour l'assignation de professeurs aux classes"""
    
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
        
        # Créer des professeurs
        self.teacher1 = User.objects.create_user(
            username='teacher1',
            password='testpass123',
            first_name='Ahmed',
            last_name='Benali',
            role='teacher'
        )
        
        self.teacher2 = User.objects.create_user(
            username='teacher2',
            password='testpass123',
            first_name='Fatima',
            last_name='Zahra',
            role='teacher'
        )
        
        # Créer des groupes
        self.group1 = Group.objects.create(name='Classe_8h45')
        self.extension1 = GroupExtension.objects.create(
            group=self.group1,
            time_slot='8h45'
        )
        
        self.group2 = Group.objects.create(name='Classe_10h45')
        self.extension2 = GroupExtension.objects.create(
            group=self.group2,
            time_slot='10h45'
        )
        
        # Client API
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)
    
    def test_assign_teacher_to_class_success(self):
        """Test: Assigner un professeur à une classe avec succès"""
        response = self.client.post('/api/admin/assign-teacher/', {
            'teacher_id': self.teacher1.id,
            'group_id': self.group1.id
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        self.assertEqual(response.data['teacher_id'], self.teacher1.id)
        self.assertEqual(response.data['group_id'], self.group1.id)
        
        # Vérifier que l'assignation a été faite
        self.extension1.refresh_from_db()
        self.assertEqual(self.extension1.teacher, self.teacher1)
        
        # Vérifier le log d'audit
        audit_log = AuditLog.objects.filter(
            action='assign_teacher',
            admin_user=self.admin,
            target_group=self.group1
        ).first()
        self.assertIsNotNone(audit_log)
        self.assertEqual(audit_log.after_data['teacher_id'], self.teacher1.id)
    
    def test_assign_teacher_invalid_teacher(self):
        """Test: Assigner un professeur inexistant"""
        response = self.client.post('/api/admin/assign-teacher/', {
            'teacher_id': 99999,
            'group_id': self.group1.id
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('Professeur introuvable', response.data['detail'])
    
    def test_assign_teacher_invalid_group(self):
        """Test: Assigner à un groupe inexistant"""
        response = self.client.post('/api/admin/assign-teacher/', {
            'teacher_id': self.teacher1.id,
            'group_id': 99999
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('Groupe introuvable', response.data['detail'])
    
    def test_assign_teacher_missing_parameters(self):
        """Test: Paramètres manquants"""
        response = self.client.post('/api/admin/assign-teacher/', {
            'teacher_id': self.teacher1.id
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_reassign_teacher_to_class(self):
        """Test: Réassigner un professeur (changer de professeur)"""
        # Assigner le premier professeur
        self.extension1.teacher = self.teacher1
        self.extension1.save()
        
        # Réassigner au deuxième professeur
        response = self.client.post('/api/admin/assign-teacher/', {
            'teacher_id': self.teacher2.id,
            'group_id': self.group1.id
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Vérifier le changement
        self.extension1.refresh_from_db()
        self.assertEqual(self.extension1.teacher, self.teacher2)
        
        # Vérifier le log d'audit
        audit_log = AuditLog.objects.filter(
            action='assign_teacher',
            target_group=self.group1
        ).latest('timestamp')
        self.assertEqual(audit_log.before_data['teacher_id'], self.teacher1.id)
        self.assertEqual(audit_log.after_data['teacher_id'], self.teacher2.id)
    
    def test_remove_teacher_from_class_success(self):
        """Test: Retirer un professeur d'une classe"""
        # Assigner d'abord un professeur
        self.extension1.teacher = self.teacher1
        self.extension1.save()
        
        # Retirer le professeur
        response = self.client.delete('/api/admin/assign-teacher/', {
            'group_id': self.group1.id
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        
        # Vérifier que le professeur a été retiré
        self.extension1.refresh_from_db()
        self.assertIsNone(self.extension1.teacher)
        
        # Vérifier le log d'audit
        audit_log = AuditLog.objects.filter(
            action='assign_teacher',
            target_group=self.group1
        ).latest('timestamp')
        self.assertEqual(audit_log.before_data['teacher_id'], self.teacher1.id)
        self.assertIsNone(audit_log.after_data['teacher_id'])
    
    def test_remove_teacher_no_teacher_assigned(self):
        """Test: Retirer un professeur quand aucun n'est assigné"""
        response = self.client.delete('/api/admin/assign-teacher/', {
            'group_id': self.group1.id
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Aucun professeur assigné', response.data['detail'])
    
    def test_assign_teacher_non_admin_user(self):
        """Test: Tentative d'assignation par un non-admin"""
        # Se connecter en tant que professeur
        self.client.force_authenticate(user=self.teacher1)
        
        response = self.client.post('/api/admin/assign-teacher/', {
            'teacher_id': self.teacher2.id,
            'group_id': self.group1.id
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class ClassesAndTeachersViewTests(TestCase):
    """Tests pour l'endpoint de liste des classes et professeurs"""
    
    def setUp(self):
        """Configuration initiale"""
        # Créer un admin
        self.admin = User.objects.create_user(
            username='admin_test',
            password='testpass123',
            role='admin',
            is_staff=True,
            is_superuser=True
        )
        
        # Créer des professeurs
        self.teacher1 = User.objects.create_user(
            username='teacher1',
            password='testpass123',
            first_name='Ahmed',
            last_name='Benali',
            role='teacher'
        )
        
        self.teacher2 = User.objects.create_user(
            username='teacher2',
            password='testpass123',
            first_name='Fatima',
            last_name='Zahra',
            role='teacher'
        )
        
        # Créer des étudiants
        self.student1 = User.objects.create_user(
            username='student1',
            password='testpass123',
            first_name='Mohamed',
            last_name='Ali',
            role='student'
        )
        
        self.student2 = User.objects.create_user(
            username='student2',
            password='testpass123',
            first_name='Aisha',
            last_name='Hassan',
            role='student'
        )
        
        # Créer des groupes
        self.group1 = Group.objects.create(name='Classe_8h45')
        self.extension1 = GroupExtension.objects.create(
            group=self.group1,
            time_slot='8h45',
            teacher=self.teacher1
        )
        self.group1.user_set.add(self.student1)
        
        self.group2 = Group.objects.create(name='Classe_10h45')
        self.extension2 = GroupExtension.objects.create(
            group=self.group2,
            time_slot='10h45',
            teacher=self.teacher2
        )
        self.group2.user_set.add(self.student2)
        
        # Client API
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)
    
    def test_get_classes_and_teachers_success(self):
        """Test: Récupérer la liste des classes et professeurs"""
        response = self.client.get('/api/admin/classes-teachers/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Vérifier la structure de la réponse
        self.assertIn('teachers', response.data)
        self.assertIn('all_classes', response.data)
        self.assertIn('unassigned_classes', response.data)
        self.assertIn('summary', response.data)
        
        # Vérifier le nombre de professeurs
        self.assertEqual(len(response.data['teachers']), 2)
        
        # Vérifier le nombre de classes
        self.assertEqual(len(response.data['all_classes']), 2)
        
        # Vérifier le résumé
        self.assertEqual(response.data['summary']['total_teachers'], 2)
        self.assertEqual(response.data['summary']['total_classes'], 2)
    
    def test_classes_grouped_by_time_slot(self):
        """Test: Les classes sont groupées par créneau horaire"""
        response = self.client.get('/api/admin/classes-teachers/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Vérifier que chaque professeur a des classes groupées par créneau
        for teacher in response.data['teachers']:
            self.assertIn('classes_8h45', teacher)
            self.assertIn('classes_10h45', teacher)
        
        # Vérifier les classes non assignées
        self.assertIn('8h45', response.data['unassigned_classes'])
        self.assertIn('10h45', response.data['unassigned_classes'])
    
    def test_teacher_with_multiple_classes(self):
        """Test: Professeur avec plusieurs classes"""
        # Créer une deuxième classe pour teacher1
        group3 = Group.objects.create(name='Classe_8h45_B')
        GroupExtension.objects.create(
            group=group3,
            time_slot='8h45',
            teacher=self.teacher1
        )
        
        response = self.client.get('/api/admin/classes-teachers/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Trouver teacher1 dans la réponse
        teacher1_data = next(
            (t for t in response.data['teachers'] if t['id'] == self.teacher1.id),
            None
        )
        
        self.assertIsNotNone(teacher1_data)
        self.assertEqual(teacher1_data['classes_count'], 2)
        self.assertEqual(len(teacher1_data['classes_8h45']), 2)
    
    def test_unassigned_classes(self):
        """Test: Classes sans professeur assigné"""
        # Créer une classe sans professeur
        group_unassigned = Group.objects.create(name='Classe_8h45_Unassigned')
        GroupExtension.objects.create(
            group=group_unassigned,
            time_slot='8h45',
            teacher=None
        )
        
        response = self.client.get('/api/admin/classes-teachers/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Vérifier que la classe apparaît dans unassigned_classes
        unassigned_8h45 = response.data['unassigned_classes']['8h45']
        self.assertTrue(
            any(c['name'] == 'Classe_8h45_Unassigned' for c in unassigned_8h45)
        )
    
    def test_students_included_in_classes(self):
        """Test: Les étudiants sont inclus dans les données des classes"""
        response = self.client.get('/api/admin/classes-teachers/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Vérifier qu'une classe contient des étudiants
        class_data = response.data['all_classes'][0]
        self.assertIn('students', class_data)
        self.assertIn('students_count', class_data)
        
        # Vérifier les données des étudiants
        if class_data['students_count'] > 0:
            student = class_data['students'][0]
            self.assertIn('id', student)
            self.assertIn('username', student)
            self.assertIn('first_name', student)
            self.assertIn('last_name', student)
            self.assertIn('full_name', student)
    
    def test_non_admin_cannot_access(self):
        """Test: Un non-admin ne peut pas accéder à l'endpoint"""
        # Se connecter en tant qu'étudiant
        self.client.force_authenticate(user=self.student1)
        
        response = self.client.get('/api/admin/classes-teachers/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_cache_is_used(self):
        """Test: Le cache est utilisé pour les requêtes répétées"""
        from django.core.cache import cache
        
        # Vider le cache
        cache.clear()
        
        # Première requête (devrait mettre en cache)
        response1 = self.client.get('/api/admin/classes-teachers/')
        self.assertEqual(response1.status_code, status.HTTP_200_OK)
        
        # Vérifier que les données sont en cache
        cached_data = cache.get('admin_classes_teachers_view')
        self.assertIsNotNone(cached_data)
        
        # Deuxième requête (devrait utiliser le cache)
        response2 = self.client.get('/api/admin/classes-teachers/')
        self.assertEqual(response2.status_code, status.HTTP_200_OK)
        
        # Les données devraient être identiques
        self.assertEqual(response1.data, response2.data)


class CacheInvalidationTests(TestCase):
    """Tests pour l'invalidation du cache"""
    
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
        
        self.group = Group.objects.create(name='Classe_8h45')
        self.extension = GroupExtension.objects.create(
            group=self.group,
            time_slot='8h45'
        )
        
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)
    
    def test_cache_invalidated_on_teacher_assignment(self):
        """Test: Le cache est invalidé lors de l'assignation d'un professeur"""
        from django.core.cache import cache
        
        # Mettre des données en cache
        cache.set('admin_classes_teachers_view', {'test': 'data'}, 600)
        cache.set(f'teacher_classes_{self.teacher.id}', {'test': 'data'}, 600)
        
        # Assigner un professeur
        self.client.post('/api/admin/assign-teacher/', {
            'teacher_id': self.teacher.id,
            'group_id': self.group.id
        }, format='json')
        
        # Vérifier que le cache a été invalidé
        self.assertIsNone(cache.get('admin_classes_teachers_view'))
        self.assertIsNone(cache.get(f'teacher_classes_{self.teacher.id}'))
    
    def test_cache_invalidated_on_teacher_removal(self):
        """Test: Le cache est invalidé lors du retrait d'un professeur"""
        from django.core.cache import cache
        
        # Assigner d'abord un professeur
        self.extension.teacher = self.teacher
        self.extension.save()
        
        # Mettre des données en cache
        cache.set('admin_classes_teachers_view', {'test': 'data'}, 600)
        cache.set(f'teacher_classes_{self.teacher.id}', {'test': 'data'}, 600)
        
        # Retirer le professeur
        self.client.delete('/api/admin/assign-teacher/', {
            'group_id': self.group.id
        }, format='json')
        
        # Vérifier que le cache a été invalidé
        self.assertIsNone(cache.get('admin_classes_teachers_view'))
        self.assertIsNone(cache.get(f'teacher_classes_{self.teacher.id}'))
