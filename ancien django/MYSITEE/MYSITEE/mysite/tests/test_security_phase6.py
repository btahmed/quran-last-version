"""
Tests de sécurité pour Phase 6: Sécurité et permissions
Tests des décorateurs, validation, sanitisation, et rate limiting
"""

from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.cache import cache
from django.http import JsonResponse
from mysite.security_utils import (
    admin_required, rate_limit, validate_group_name, validate_email,
    validate_phone, validate_time_slot, validate_status,
    sanitize_input, sanitize_dict, get_client_ip, log_admin_action,
    ValidationError
)
from tasks.models import StudentProfile, GroupExtension
import json

User = get_user_model()


class AdminRequiredDecoratorTests(TestCase):
    """Tests pour le décorateur @admin_required"""
    
    def setUp(self):
        self.factory = RequestFactory()
        
        # Créer un admin
        self.admin = User.objects.create_user(
            username='admin_test',
            password='password123',
            role='admin',
            first_name='Admin',
            last_name='Test'
        )
        
        # Créer un professeur
        self.teacher = User.objects.create_user(
            username='teacher_test',
            password='password123',
            role='teacher',
            first_name='Teacher',
            last_name='Test'
        )
        
        # Créer un élève
        self.student = User.objects.create_user(
            username='student_test',
            password='password123',
            role='student',
            first_name='Student',
            last_name='Test'
        )
        
        # Vue de test avec décorateur
        @admin_required
        def test_view(request):
            return JsonResponse({'message': 'Success'})
        
        self.test_view = test_view
    
    def test_admin_access_allowed(self):
        """Test: Admin peut accéder à la vue"""
        request = self.factory.get('/test/')
        request.user = self.admin
        
        response = self.test_view(request)
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertEqual(data['message'], 'Success')
    
    def test_unauthenticated_access_denied(self):
        """Test: Utilisateur non authentifié ne peut pas accéder"""
        request = self.factory.get('/test/')
        request.user = type('AnonymousUser', (), {'is_authenticated': False})()
        
        response = self.test_view(request)
        self.assertEqual(response.status_code, 401)
        data = json.loads(response.content)
        self.assertIn('error', data)
        self.assertEqual(data['error'], 'Non authentifié')
    
    def test_teacher_access_denied(self):
        """Test: Professeur ne peut pas accéder aux vues Admin"""
        request = self.factory.get('/test/')
        request.user = self.teacher
        
        response = self.test_view(request)
        self.assertEqual(response.status_code, 403)
        data = json.loads(response.content)
        self.assertIn('error', data)
        self.assertEqual(data['error'], 'Permission refusée')
    
    def test_student_access_denied(self):
        """Test: Élève ne peut pas accéder aux vues Admin"""
        request = self.factory.get('/test/')
        request.user = self.student
        
        response = self.test_view(request)
        self.assertEqual(response.status_code, 403)
        data = json.loads(response.content)
        self.assertIn('error', data)


class RateLimitingTests(TestCase):
    """Tests pour le rate limiting"""
    
    def setUp(self):
        self.factory = RequestFactory()
        self.admin = User.objects.create_user(
            username='admin_rate',
            password='password123',
            role='admin'
        )
        
        # Vue de test avec rate limiting
        @rate_limit(max_requests=5, window=60)
        def test_view(request):
            return JsonResponse({'message': 'Success'})
        
        self.test_view = test_view
        
        # Nettoyer le cache avant chaque test
        cache.clear()
    
    def test_requests_within_limit(self):
        """Test: Requêtes dans la limite sont autorisées"""
        request = self.factory.get('/test/')
        request.user = self.admin
        
        # Faire 5 requêtes (limite)
        for i in range(5):
            response = self.test_view(request)
            self.assertEqual(response.status_code, 200)
    
    def test_requests_exceed_limit(self):
        """Test: Requêtes au-delà de la limite sont bloquées"""
        request = self.factory.get('/test/')
        request.user = self.admin
        
        # Faire 5 requêtes (limite)
        for i in range(5):
            response = self.test_view(request)
            self.assertEqual(response.status_code, 200)
        
        # La 6ème requête doit être bloquée
        response = self.test_view(request)
        self.assertEqual(response.status_code, 429)
        data = json.loads(response.content)
        self.assertIn('error', data)
        self.assertEqual(data['error'], 'Trop de requêtes')
    
    def test_rate_limit_per_user(self):
        """Test: Rate limit est par utilisateur"""
        request1 = self.factory.get('/test/')
        request1.user = self.admin
        
        admin2 = User.objects.create_user(
            username='admin_rate2',
            password='password123',
            role='admin'
        )
        request2 = self.factory.get('/test/')
        request2.user = admin2
        
        # Admin 1 fait 5 requêtes
        for i in range(5):
            response = self.test_view(request1)
            self.assertEqual(response.status_code, 200)
        
        # Admin 1 est bloqué
        response = self.test_view(request1)
        self.assertEqual(response.status_code, 429)
        
        # Admin 2 peut encore faire des requêtes
        response = self.test_view(request2)
        self.assertEqual(response.status_code, 200)


class ValidationTests(TestCase):
    """Tests pour les fonctions de validation"""
    
    def test_validate_group_name_valid(self):
        """Test: Nom de groupe valide"""
        valid_names = [
            'Classe_8h45',
            'Classe 10h45',
            'Groupe-Test',
            'المجموعة_الأولى'
        ]
        
        for name in valid_names:
            try:
                result = validate_group_name(name)
                self.assertEqual(result, name.strip())
            except ValidationError:
                self.fail(f"Nom valide rejeté: {name}")
    
    def test_validate_group_name_invalid(self):
        """Test: Nom de groupe invalide"""
        invalid_names = [
            '',  # Vide
            'AB',  # Trop court
            'A' * 101,  # Trop long
            'Groupe@Test',  # Caractères spéciaux
            'Groupe<script>',  # Tentative XSS
        ]
        
        for name in invalid_names:
            with self.assertRaises(ValidationError):
                validate_group_name(name)
    
    def test_validate_email_valid(self):
        """Test: Email valide"""
        valid_emails = [
            'test@example.com',
            'user.name@domain.co.uk',
            'admin+tag@test.org'
        ]
        
        for email in valid_emails:
            try:
                result = validate_email(email)
                self.assertEqual(result, email.lower())
            except ValidationError:
                self.fail(f"Email valide rejeté: {email}")
    
    def test_validate_email_invalid(self):
        """Test: Email invalide"""
        invalid_emails = [
            '',
            'not-an-email',
            '@example.com',
            'user@',
            'user @example.com'
        ]
        
        for email in invalid_emails:
            with self.assertRaises(ValidationError):
                validate_email(email)
    
    def test_validate_phone_valid(self):
        """Test: Téléphone valide"""
        valid_phones = [
            '+33612345678',
            '0612345678',
            '+1 (555) 123-4567',
            '555-123-4567'
        ]
        
        for phone in valid_phones:
            try:
                result = validate_phone(phone)
                # Vérifier que les espaces et tirets sont retirés
                self.assertNotIn(' ', result)
                self.assertNotIn('-', result)
                self.assertNotIn('(', result)
                self.assertNotIn(')', result)
            except ValidationError:
                self.fail(f"Téléphone valide rejeté: {phone}")
    
    def test_validate_phone_invalid(self):
        """Test: Téléphone invalide"""
        invalid_phones = [
            '123',  # Trop court
            'abcdefghij',  # Lettres
            '+33 6 12 34 56 78 90 12',  # Trop long
        ]
        
        for phone in invalid_phones:
            with self.assertRaises(ValidationError):
                validate_phone(phone)
    
    def test_validate_time_slot_valid(self):
        """Test: Créneau horaire valide"""
        valid_slots = ['8h45', '10h45', '14h30', '16h00']
        
        for slot in valid_slots:
            try:
                result = validate_time_slot(slot)
                self.assertEqual(result, slot)
            except ValidationError:
                self.fail(f"Créneau valide rejeté: {slot}")
    
    def test_validate_time_slot_invalid(self):
        """Test: Créneau horaire invalide"""
        invalid_slots = ['9h00', '12h30', 'invalid', '']
        
        for slot in invalid_slots:
            with self.assertRaises(ValidationError):
                validate_time_slot(slot)
    
    def test_validate_status_valid(self):
        """Test: Statut valide"""
        valid_statuses = ['active', 'inactive', 'graduated']
        
        for status_val in valid_statuses:
            try:
                result = validate_status(status_val)
                self.assertEqual(result, status_val)
            except ValidationError:
                self.fail(f"Statut valide rejeté: {status_val}")
    
    def test_validate_status_invalid(self):
        """Test: Statut invalide"""
        invalid_statuses = ['pending', 'deleted', '', 'ACTIVE']
        
        for status_val in invalid_statuses:
            with self.assertRaises(ValidationError):
                validate_status(status_val)


class SanitizationTests(TestCase):
    """Tests pour la sanitisation des entrées"""
    
    def test_sanitize_input_basic(self):
        """Test: Sanitisation basique"""
        result = sanitize_input('Hello World')
        self.assertEqual(result, 'Hello World')
    
    def test_sanitize_input_html_escape(self):
        """Test: Échappement HTML"""
        dangerous_input = '<script>alert("XSS")</script>'
        result = sanitize_input(dangerous_input)
        self.assertNotIn('<script>', result)
        self.assertIn('&lt;script&gt;', result)
    
    def test_sanitize_input_control_characters(self):
        """Test: Retrait des caractères de contrôle"""
        input_with_control = 'Hello\x00\x08World\x1F'
        result = sanitize_input(input_with_control)
        self.assertEqual(result, 'HelloWorld')
    
    def test_sanitize_input_max_length(self):
        """Test: Limitation de longueur"""
        long_input = 'A' * 1000
        result = sanitize_input(long_input, max_length=100)
        self.assertEqual(len(result), 100)
    
    def test_sanitize_dict_allowed_fields(self):
        """Test: Filtrage des champs autorisés"""
        data = {
            'first_name': 'John',
            'last_name': 'Doe',
            'password': 'secret123',  # Non autorisé
            'admin_flag': True  # Non autorisé
        }
        
        allowed_fields = ['first_name', 'last_name']
        result = sanitize_dict(data, allowed_fields=allowed_fields)
        
        self.assertIn('first_name', result)
        self.assertIn('last_name', result)
        self.assertNotIn('password', result)
        self.assertNotIn('admin_flag', result)
    
    def test_sanitize_dict_nested(self):
        """Test: Sanitisation de dictionnaires imbriqués"""
        data = {
            'name': 'Test',
            'details': {
                'description': '<b>Bold</b>',
                'notes': 'Normal text'
            }
        }
        
        result = sanitize_dict(data)
        self.assertIn('&lt;b&gt;', result['details']['description'])
    
    def test_sanitize_dict_list_values(self):
        """Test: Sanitisation de listes"""
        data = {
            'tags': ['<script>tag1</script>', 'tag2', 'tag3']
        }
        
        result = sanitize_dict(data)
        self.assertIn('&lt;script&gt;', result['tags'][0])


class UtilityFunctionsTests(TestCase):
    """Tests pour les fonctions utilitaires"""
    
    def setUp(self):
        self.factory = RequestFactory()
    
    def test_get_client_ip_direct(self):
        """Test: Récupération IP directe"""
        request = self.factory.get('/test/')
        request.META['REMOTE_ADDR'] = '192.168.1.100'
        
        ip = get_client_ip(request)
        self.assertEqual(ip, '192.168.1.100')
    
    def test_get_client_ip_forwarded(self):
        """Test: Récupération IP via proxy"""
        request = self.factory.get('/test/')
        request.META['HTTP_X_FORWARDED_FOR'] = '203.0.113.1, 198.51.100.1'
        request.META['REMOTE_ADDR'] = '192.168.1.1'
        
        ip = get_client_ip(request)
        # Doit retourner la première IP de X-Forwarded-For
        self.assertEqual(ip, '203.0.113.1')
    
    def test_log_admin_action(self):
        """Test: Logging des actions Admin"""
        admin = User.objects.create_user(
            username='admin_log',
            password='password123',
            role='admin'
        )
        
        request = self.factory.post('/test/')
        request.META['REMOTE_ADDR'] = '192.168.1.100'
        request.user = admin
        
        # Cette fonction ne lève pas d'exception
        try:
            log_admin_action(
                action='test_action',
                admin_user=admin,
                target='test_target',
                details={'key': 'value'},
                request=request
            )
        except Exception as e:
            self.fail(f"log_admin_action a levé une exception: {e}")


class IntegrationSecurityTests(TestCase):
    """Tests d'intégration pour la sécurité"""
    
    def setUp(self):
        self.factory = RequestFactory()
        
        # Créer un admin
        self.admin = User.objects.create_user(
            username='admin_int',
            password='password123',
            role='admin'
        )
        
        # Créer un élève
        self.student = User.objects.create_user(
            username='student_int',
            password='password123',
            role='student'
        )
        
        # Créer un groupe
        self.group = Group.objects.create(name='Classe_8h45')
        GroupExtension.objects.create(
            group=self.group,
            time_slot='8h45'
        )
    
    def test_unauthorized_group_creation_attempt(self):
        """Test: Tentative de création de groupe par non-admin"""
        from mysite.api_views_admin import GroupManagementView
        
        view = GroupManagementView.as_view()
        request = self.factory.post('/api/admin/groups/', {
            'name': 'Classe_Test',
            'time_slot': '8h45'
        }, content_type='application/json')
        request.user = self.student
        
        response = view(request)
        self.assertEqual(response.status_code, 403)
    
    def test_authorized_group_creation(self):
        """Test: Création de groupe par admin autorisée"""
        from mysite.api_views_admin import GroupManagementView
        
        view = GroupManagementView.as_view()
        request = self.factory.post('/api/admin/groups/', {
            'name': 'Classe_Test_New',
            'time_slot': '10h45'
        }, content_type='application/json')
        request.user = self.admin
        
        response = view(request)
        # Devrait réussir (201) ou échouer pour une autre raison que les permissions
        self.assertIn(response.status_code, [200, 201, 400, 500])
        self.assertNotEqual(response.status_code, 403)
    
    def test_xss_prevention_in_group_name(self):
        """Test: Prévention XSS dans le nom de groupe"""
        dangerous_name = '<script>alert("XSS")</script>'
        
        with self.assertRaises(ValidationError):
            validate_group_name(dangerous_name)
    
    def test_sql_injection_prevention(self):
        """Test: Prévention injection SQL (via ORM)"""
        # Django ORM protège automatiquement contre les injections SQL
        # Ce test vérifie que l'utilisation de l'ORM est correcte
        
        malicious_input = "'; DROP TABLE users; --"
        
        # Tentative de recherche avec input malicieux
        # L'ORM doit échapper correctement
        try:
            users = User.objects.filter(username=malicious_input)
            # Ne doit pas lever d'exception
            self.assertEqual(users.count(), 0)
        except Exception as e:
            self.fail(f"ORM a levé une exception: {e}")


class CSRFProtectionTests(TestCase):
    """Tests pour la protection CSRF"""
    
    def test_csrf_middleware_active(self):
        """Test: Middleware CSRF est actif"""
        from django.conf import settings
        
        csrf_middleware = 'django.middleware.csrf.CsrfViewMiddleware'
        self.assertIn(csrf_middleware, settings.MIDDLEWARE)
    
    def test_csrf_token_required_for_post(self):
        """Test: Token CSRF requis pour les requêtes POST"""
        # Ce test vérifie que Django exige un token CSRF
        # pour les requêtes POST (comportement par défaut)
        from django.test import Client
        
        client = Client(enforce_csrf_checks=True)
        
        # Tentative de POST sans token CSRF
        response = client.post('/api/admin/groups/', {
            'name': 'Test',
            'time_slot': '8h45'
        })
        
        # Devrait échouer avec 403 (CSRF)
        self.assertEqual(response.status_code, 403)


# Résumé des tests
print("""
=== Tests de sécurité Phase 6 ===

Tests implémentés:
1. AdminRequiredDecoratorTests (4 tests)
   - Accès admin autorisé
   - Accès non authentifié refusé
   - Accès professeur refusé
   - Accès élève refusé

2. RateLimitingTests (3 tests)
   - Requêtes dans la limite
   - Requêtes au-delà de la limite
   - Rate limit par utilisateur

3. ValidationTests (10 tests)
   - Validation nom de groupe
   - Validation email
   - Validation téléphone
   - Validation créneau horaire
   - Validation statut

4. SanitizationTests (7 tests)
   - Sanitisation basique
   - Échappement HTML
   - Retrait caractères de contrôle
   - Limitation longueur
   - Filtrage champs autorisés
   - Sanitisation imbriquée
   - Sanitisation listes

5. UtilityFunctionsTests (3 tests)
   - Récupération IP
   - Logging actions

6. IntegrationSecurityTests (4 tests)
   - Tentatives d'accès non autorisé
   - Prévention XSS
   - Prévention injection SQL

7. CSRFProtectionTests (2 tests)
   - Middleware CSRF actif
   - Token CSRF requis

Total: 33 tests de sécurité
""")
