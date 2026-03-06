#!/usr/bin/env python3
"""
Test manuel des permissions avec quelques mots de passe
À exécuter dans l'environnement Django
"""

import os
import sys
import django
import requests
from pathlib import Path

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


class TesteurPermissionsManuel:
    """Testeur manuel avec mots de passe à saisir"""
    
    def __init__(self):
        self.base_url = "http://127.0.0.1:8000"
        self.api_url = f"{self.base_url}/api"
    
    def tester_connexion_django(self, username, password):
        """Teste la connexion Django directe"""
        try:
            user = authenticate(username=username, password=password)
            if user:
                return True, f"Connexion Django réussie"
            else:
                return False, f"Échec authentification Django"
        except Exception as e:
            return False, f"Erreur Django: {e}"
    
    def tester_connexion_api(self, username, password):
        """Teste la connexion via l'API"""
        try:
            response = requests.post(
                f"{self.api_url}/token/",
                json={'username': username, 'password': password},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                return True, data.get('access'), data
            else:
                return False, None, f"Erreur {response.status_code}: {response.text[:200]}"
                
        except Exception as e:
            return False, None, f"Erreur: {e}"
    
    def tester_acces_utilisateurs(self, token):
        """Teste l'accès à la liste des utilisateurs avec filtrage"""
        try:
            headers = {'Authorization': f'Bearer {token}'}
            response = requests.get(
                f"{self.api_url}/admin/users/",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                return True, data
            else:
                return False, f"Erreur {response.status_code}: {response.text[:200]}"
                
        except Exception as e:
            return False, f"Erreur: {e}"
    
    def analyser_filtrage(self, username, users_data):
        """Analyse si le filtrage par classe fonctionne"""
        try:
            user = User.objects.get(username=username)
            user_classes = list(user.groups.filter(
                name__in=['Classe_8h45', 'Classe_10h45']
            ).values_list('name', flat=True))
            
            print(f"👤 {username} ({user.role})")
            print(f"👥 Classes utilisateur: {', '.join(user_classes) if user_classes else 'Aucune'}")
            print(f"📊 Voit {users_data['count']} utilisateurs")
            
            # Analyser les utilisateurs visibles
            classes_vues = set()
            roles_vus = {'student': 0, 'teacher': 0}
            usernames_vus = []
            
            for user_data in users_data['users']:
                try:
                    user_obj = User.objects.get(id=user_data['id'])
                    user_obj_classes = list(user_obj.groups.filter(
                        name__in=['Classe_8h45', 'Classe_10h45']
                    ).values_list('name', flat=True))
                    
                    classes_vues.update(user_obj_classes)
                    roles_vus[user_data['role']] += 1
                    usernames_vus.append(user_data['username'])
                except:
                    pass
            
            print(f"🔍 Classes visibles: {', '.join(classes_vues) if classes_vues else 'Aucune'}")
            print(f"📈 Rôles vus: {roles_vus['student']} étudiants, {roles_vus['teacher']} professeurs")
            
            # Afficher quelques exemples d'utilisateurs vus
            if usernames_vus:
                exemples = usernames_vus[:5]
                print(f"👥 Exemples d'utilisateurs vus: {', '.join(exemples)}")
                if len(usernames_vus) > 5:
                    print(f"    ... et {len(usernames_vus) - 5} autres")
            
            # Vérifier le filtrage
            filtrage_correct = True
            
            # Si l'utilisateur n'a pas de classe, il ne devrait rien voir (sauf superuser)
            if not user_classes and not user.is_superuser:
                if users_data['count'] > 0:
                    print("⚠️  PROBLÈME: Utilisateur sans classe voit des données")
                    filtrage_correct = False
            
            # Si l'utilisateur a des classes, il ne devrait voir que ces classes
            elif user_classes:
                for classe_vue in classes_vues:
                    if classe_vue not in user_classes:
                        print(f"⚠️  PROBLÈME: Voit la classe {classe_vue} mais n'y appartient pas")
                        filtrage_correct = False
            
            if filtrage_correct:
                print("✅ Filtrage par classe CORRECT")
            else:
                print("❌ Problème de filtrage détecté")
            
            return filtrage_correct
            
        except Exception as e:
            print(f"❌ Erreur analyse: {e}")
            return False
    
    def tester_utilisateur_complet(self, username, password):
        """Test complet d'un utilisateur"""
        print(f"\n🧪 TEST COMPLET: {username}")
        print("-" * 50)
        
        # Test connexion Django
        success_django, msg_django = self.tester_connexion_django(username, password)
        print(f"🔐 Django: {'✅' if success_django else '❌'} {msg_django}")
        
        if not success_django:
            return False
        
        # Test connexion API
        success_api, token, data = self.tester_connexion_api(username, password)
        print(f"🌐 API: {'✅' if success_api else '❌'} {data if not success_api else 'Connexion réussie'}")
        
        if not success_api:
            return False
        
        print(f"👤 Profil API: {data.get('first_name', 'N/A')} - {data.get('role', 'N/A')}")
        
        # Test accès utilisateurs
        success_users, users_data = self.tester_acces_utilisateurs(token)
        print(f"📊 Accès utilisateurs: {'✅' if success_users else '❌'} {users_data if not success_users else 'Accès réussi'}")
        
        if not success_users:
            return False
        
        # Analyser le filtrage
        filtrage_ok = self.analyser_filtrage(username, users_data)
        
        return filtrage_ok
    
    def lister_comptes_disponibles(self):
        """Liste quelques comptes disponibles pour les tests"""
        print("👥 COMPTES DISPONIBLES POUR TESTS")
        print("="*50)
        
        # Professeurs par classe
        print("\n👨‍🏫 PROFESSEURS CLASSE 8H45:")
        profs_8h45 = User.objects.filter(
            role='teacher',
            groups__name='Classe_8h45'
        ).exclude(groups__name='Classe_10h45')[:3]
        
        for prof in profs_8h45:
            print(f"   - {prof.username} ({prof.first_name})")
        
        print("\n👨‍🏫 PROFESSEURS CLASSE 10H45:")
        profs_10h45 = User.objects.filter(
            role='teacher',
            groups__name='Classe_10h45'
        ).exclude(groups__name='Classe_8h45')[:3]
        
        for prof in profs_10h45:
            print(f"   - {prof.username} ({prof.first_name})")
        
        print("\n👨‍🏫 PROFESSEURS MIXTES (2 classes):")
        profs_mixtes = User.objects.filter(
            role='teacher',
            groups__name__in=['Classe_8h45', 'Classe_10h45']
        ).annotate(
            nb_groupes=models.Count('groups')
        ).filter(nb_groupes=2)
        
        for prof in profs_mixtes:
            print(f"   - {prof.username} ({prof.first_name})")
        
        print("\n👨‍🎓 QUELQUES ÉTUDIANTS:")
        etudiants = User.objects.filter(role='student')[:5]
        for etudiant in etudiants:
            classes = list(etudiant.groups.filter(
                name__in=['Classe_8h45', 'Classe_10h45']
            ).values_list('name', flat=True))
            classes_str = ', '.join(classes) if classes else 'Aucune classe'
            print(f"   - {etudiant.username} ({classes_str})")
    
    def test_interactif(self):
        """Test interactif avec saisie manuelle"""
        print("🧪 TEST INTERACTIF DES PERMISSIONS")
        print("="*60)
        
        self.lister_comptes_disponibles()
        
        print("\n📋 INSTRUCTIONS:")
        print("1. Choisissez un nom d'utilisateur dans la liste ci-dessus")
        print("2. Trouvez son mot de passe dans les fichiers credentials_*.xlsx")
        print("3. Testez la connexion et le filtrage")
        print("4. Répétez avec différents types d'utilisateurs")
        
        while True:
            print("\n" + "="*60)
            username = input("👤 Nom d'utilisateur (ou 'quit' pour quitter): ").strip()
            
            if username.lower() in ['quit', 'q', 'exit']:
                break
            
            if not username:
                continue
            
            # Vérifier que le compte existe
            if not User.objects.filter(username=username).exists():
                print(f"❌ Compte '{username}' non trouvé")
                continue
            
            password = input("🔐 Mot de passe: ").strip()
            
            if not password:
                print("❌ Mot de passe requis")
                continue
            
            # Test complet
            success = self.tester_utilisateur_complet(username, password)
            
            if success:
                print("\n🎉 Test réussi pour cet utilisateur!")
            else:
                print("\n⚠️  Test échoué - vérifiez le mot de passe ou la configuration")
    
    def test_automatique_admin(self):
        """Test automatique avec le compte admin"""
        print("🧪 TEST AUTOMATIQUE AVEC ADMIN")
        print("="*50)
        
        # Test avec admin (devrait voir tout)
        admin_success = self.tester_utilisateur_complet('admin', 'admin123')
        
        if admin_success:
            print("\n✅ Test admin réussi - le superuser voit tout (normal)")
        else:
            print("\n❌ Test admin échoué - problème de configuration")
        
        return admin_success


def main():
    """Point d'entrée principal"""
    testeur = TesteurPermissionsManuel()
    
    print("🚀 TESTEUR DE PERMISSIONS PAR CLASSE")
    print("="*60)
    
    # Test automatique admin d'abord
    admin_ok = testeur.test_automatique_admin()
    
    if admin_ok:
        print("\n✅ Configuration de base OK")
        
        # Proposer le test interactif
        print("\n🎯 Voulez-vous tester avec d'autres comptes?")
        choix = input("Tapez 'oui' pour le test interactif: ").strip().lower()
        
        if choix in ['oui', 'o', 'yes', 'y']:
            testeur.test_interactif()
        else:
            print("\n📋 Pour tester manuellement:")
            print("1. Ouvrez les fichiers credentials_*.xlsx")
            print("2. Copiez un nom d'utilisateur et son mot de passe")
            print("3. Relancez ce script et choisissez le test interactif")
    else:
        print("\n❌ Configuration de base incorrecte")
        print("Vérifiez que le serveur Django est démarré et que le middleware est installé")


if __name__ == "__main__":
    main()