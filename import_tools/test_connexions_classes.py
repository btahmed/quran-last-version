#!/usr/bin/env python3
"""
Script pour tester les connexions et vérifier les permissions par classe
Teste que les utilisateurs peuvent se connecter et voient le bon contenu
"""

import os
import sys
import django
import requests
import json
from pathlib import Path
from datetime import datetime

# Configuration Django
project_root = Path(__file__).parent.parent / "ancien django" / "MYSITEE" / "MYSITEE"
sys.path.append(str(project_root))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite.settings')

try:
    django.setup()
except Exception as e:
    print(f"❌ Erreur configuration Django: {e}")
    sys.exit(1)

from django.contrib.auth import authenticate
from django.contrib.auth.models import Group
from django.db import models
from tasks.models import User


class TesteurConnexions:
    """Testeur des connexions et permissions par classe"""
    
    def __init__(self):
        self.base_url = "http://127.0.0.1:8000"
        self.api_url = f"{self.base_url}/api"
        self.stats = {
            'tests_reussis': 0,
            'tests_echoues': 0,
            'connexions_testees': 0,
            'erreurs': []
        }
    
    def tester_connexion_django(self, username, password):
        """Teste la connexion via Django authenticate"""
        try:
            user = authenticate(username=username, password=password)
            if user:
                return True, f"Connexion Django réussie pour {username}"
            else:
                return False, f"Échec connexion Django pour {username}"
        except Exception as e:
            return False, f"Erreur connexion Django {username}: {e}"
    
    def tester_connexion_api(self, username, password):
        """Teste la connexion via l'API REST"""
        try:
            # Tenter la connexion via l'API
            login_data = {
                'username': username,
                'password': password
            }
            
            response = requests.post(
                f"{self.api_url}/auth/login/",
                json=login_data,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                token = data.get('access')
                if token:
                    return True, f"Connexion API réussie pour {username}", token
                else:
                    return False, f"Token manquant pour {username}", None
            else:
                return False, f"Échec API {username}: {response.status_code}", None
                
        except requests.exceptions.RequestException as e:
            return False, f"Erreur réseau API {username}: {e}", None
        except Exception as e:
            return False, f"Erreur API {username}: {e}", None
    
    def tester_acces_donnees(self, username, token):
        """Teste l'accès aux données avec le token"""
        try:
            headers = {'Authorization': f'Bearer {token}'}
            
            # Tester l'accès au profil
            response = requests.get(
                f"{self.api_url}/me/",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                profile_data = response.json()
                return True, f"Accès profil OK pour {username}", profile_data
            else:
                return False, f"Échec accès profil {username}: {response.status_code}", None
                
        except Exception as e:
            return False, f"Erreur accès données {username}: {e}", None
    
    def obtenir_info_utilisateur(self, username):
        """Obtient les informations d'un utilisateur"""
        try:
            user = User.objects.get(username=username)
            groupes = list(user.groups.values_list('name', flat=True))
            
            return {
                'id': user.id,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'groupes': groupes,
                'date_joined': user.date_joined.strftime('%Y-%m-%d %H:%M'),
                'is_active': user.is_active
            }
        except User.DoesNotExist:
            return None
        except Exception as e:
            return {'erreur': str(e)}
    
    def tester_utilisateur_complet(self, username, password):
        """Teste complètement un utilisateur (Django + API + données)"""
        print(f"\n🧪 Test complet: {username}")
        print("-" * 50)
        
        # Informations utilisateur
        info_user = self.obtenir_info_utilisateur(username)
        if info_user:
            if 'erreur' in info_user:
                print(f"❌ Erreur info utilisateur: {info_user['erreur']}")
                return False
            
            print(f"👤 {info_user['first_name']} {info_user['last_name']}")
            print(f"🎭 Rôle: {info_user['role']}")
            print(f"👥 Groupes: {', '.join(info_user['groupes']) if info_user['groupes'] else 'Aucun'}")
            print(f"📅 Créé: {info_user['date_joined']}")
        else:
            print(f"❌ Utilisateur {username} non trouvé")
            return False
        
        # Test connexion Django
        success_django, msg_django = self.tester_connexion_django(username, password)
        print(f"🔐 Django: {'✅' if success_django else '❌'} {msg_django}")
        
        if not success_django:
            self.stats['tests_echoues'] += 1
            return False
        
        # Test connexion API
        success_api, msg_api, token = self.tester_connexion_api(username, password)
        print(f"🌐 API: {'✅' if success_api else '❌'} {msg_api}")
        
        if not success_api:
            self.stats['tests_echoues'] += 1
            return False
        
        # Test accès données
        success_data, msg_data, profile_data = self.tester_acces_donnees(username, token)
        print(f"📊 Données: {'✅' if success_data else '❌'} {msg_data}")
        
        if success_data and profile_data:
            print(f"📋 Profil API: {profile_data.get('first_name', 'N/A')} - {profile_data.get('role', 'N/A')}")
        
        if success_django and success_api and success_data:
            self.stats['tests_reussis'] += 1
            print("🎉 Test complet RÉUSSI")
            return True
        else:
            self.stats['tests_echoues'] += 1
            print("💥 Test complet ÉCHOUÉ")
            return False
    
    def tester_echantillon_utilisateurs(self):
        """Teste un échantillon d'utilisateurs de chaque classe"""
        print("🧪 TESTS D'ÉCHANTILLON UTILISATEURS")
        print("="*60)
        
        # Utilisateurs à tester (username, mot de passe probable)
        # Note: Les mots de passe sont générés automatiquement, 
        # il faut les récupérer des fichiers d'identifiants
        
        utilisateurs_test = [
            # Professeurs classe 8h45
            ('prof_ibrahim', None),
            ('prof_oum_wael', None),
            
            # Professeurs classe 10h45  
            ('prof_abou_fadi', None),
            ('prof_abdallah', None),
            
            # Professeurs mixtes
            ('prof_mohammadine', None),
            ('prof_abdelhadi', None),
            
            # Quelques étudiants (on testera sans mot de passe d'abord)
        ]
        
        print("ℹ️  Note: Les mots de passe sont dans les fichiers credentials_*.xlsx")
        print("ℹ️  Ce test vérifie d'abord l'existence des comptes et groupes")
        
        for username, password in utilisateurs_test:
            if password is None:
                # Test sans connexion (juste vérifier l'existence et les groupes)
                print(f"\n👤 Vérification: {username}")
                info_user = self.obtenir_info_utilisateur(username)
                if info_user and 'erreur' not in info_user:
                    print(f"✅ Compte existe: {info_user['first_name']} {info_user['last_name']}")
                    print(f"🎭 Rôle: {info_user['role']}")
                    print(f"👥 Groupes: {', '.join(info_user['groupes']) if info_user['groupes'] else 'Aucun'}")
                    self.stats['connexions_testees'] += 1
                else:
                    print(f"❌ Compte non trouvé ou erreur")
                    self.stats['tests_echoues'] += 1
            else:
                # Test complet avec connexion
                self.tester_utilisateur_complet(username, password)
                self.stats['connexions_testees'] += 1
    
    def verifier_structure_groupes(self):
        """Vérifie la structure des groupes"""
        print("\n🏗️  VÉRIFICATION STRUCTURE GROUPES")
        print("="*60)
        
        try:
            # Groupe 8h45
            groupe_8h45 = Group.objects.get(name='Classe_8h45')
            membres_8h45 = groupe_8h45.user_set.all()
            
            print(f"👥 Groupe Classe_8h45: {membres_8h45.count()} membres")
            
            etudiants_8h45 = membres_8h45.filter(role='student').count()
            professeurs_8h45 = membres_8h45.filter(role='teacher').count()
            
            print(f"   - 👨‍🎓 Étudiants: {etudiants_8h45}")
            print(f"   - 👨‍🏫 Professeurs: {professeurs_8h45}")
            
            # Groupe 10h45
            groupe_10h45 = Group.objects.get(name='Classe_10h45')
            membres_10h45 = groupe_10h45.user_set.all()
            
            print(f"👥 Groupe Classe_10h45: {membres_10h45.count()} membres")
            
            etudiants_10h45 = membres_10h45.filter(role='student').count()
            professeurs_10h45 = membres_10h45.filter(role='teacher').count()
            
            print(f"   - 👨‍🎓 Étudiants: {etudiants_10h45}")
            print(f"   - 👨‍🏫 Professeurs: {professeurs_10h45}")
            
            # Professeurs dans les 2 groupes
            professeurs_mixtes = User.objects.filter(
                role='teacher',
                groups__name__in=['Classe_8h45', 'Classe_10h45']
            ).distinct().annotate(
                nb_groupes=models.Count('groups')
            ).filter(nb_groupes=2)
            
            print(f"👨‍🏫 Professeurs mixtes (2 classes): {professeurs_mixtes.count()}")
            for prof in professeurs_mixtes:
                print(f"   - {prof.username} ({prof.first_name})")
            
            return True
            
        except Group.DoesNotExist as e:
            print(f"❌ Groupe manquant: {e}")
            return False
        except Exception as e:
            print(f"❌ Erreur vérification: {e}")
            return False
    
    def tester_serveur_django(self):
        """Teste si le serveur Django est accessible"""
        print("🌐 Test serveur Django...")
        
        try:
            response = requests.get(f"{self.base_url}/", timeout=5)
            if response.status_code in [200, 404]:  # 404 est OK, ça veut dire que le serveur répond
                print("✅ Serveur Django accessible")
                return True
            else:
                print(f"⚠️  Serveur répond avec code {response.status_code}")
                return False
        except requests.exceptions.ConnectionError:
            print("❌ Serveur Django non accessible")
            print("ℹ️  Assurez-vous que le serveur Django est démarré:")
            print("   cd 'QuranReviewLocal/ancien django/MYSITEE/MYSITEE'")
            print("   python manage.py runserver")
            return False
        except Exception as e:
            print(f"❌ Erreur test serveur: {e}")
            return False
    
    def afficher_statistiques(self):
        """Affiche les statistiques des tests"""
        print("\n📊 STATISTIQUES DES TESTS")
        print("="*60)
        
        print(f"✅ Tests réussis: {self.stats['tests_reussis']}")
        print(f"❌ Tests échoués: {self.stats['tests_echoues']}")
        print(f"🔍 Connexions testées: {self.stats['connexions_testees']}")
        
        total_tests = self.stats['tests_reussis'] + self.stats['tests_echoues']
        if total_tests > 0:
            taux_reussite = (self.stats['tests_reussis'] / total_tests) * 100
            print(f"📈 Taux de réussite: {taux_reussite:.1f}%")
        
        if self.stats['erreurs']:
            print(f"\n❌ Erreurs ({len(self.stats['erreurs'])}):")
            for erreur in self.stats['erreurs']:
                print(f"   - {erreur}")
    
    def executer_tests(self):
        """Exécute tous les tests"""
        print("🧪 TESTS DE CONNEXIONS ET PERMISSIONS")
        print("="*60)
        print(f"🕒 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Test serveur
        if not self.tester_serveur_django():
            print("\n💥 Impossible de continuer sans serveur Django")
            return False
        
        # Vérification structure
        if not self.verifier_structure_groupes():
            print("\n💥 Structure des groupes incorrecte")
            return False
        
        # Tests utilisateurs
        self.tester_echantillon_utilisateurs()
        
        # Statistiques
        self.afficher_statistiques()
        
        return True


def main():
    """Point d'entrée principal"""
    testeur = TesteurConnexions()
    success = testeur.executer_tests()
    
    if success:
        print("\n🎉 Tests terminés!")
        print("\nℹ️  Pour tester les connexions complètes avec mots de passe:")
        print("   1. Ouvrez les fichiers credentials_*.xlsx")
        print("   2. Copiez quelques mots de passe")
        print("   3. Modifiez ce script pour inclure les mots de passe")
    else:
        print("\n❌ Tests échoués")


if __name__ == "__main__":
    main()