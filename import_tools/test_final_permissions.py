#!/usr/bin/env python3
"""
Test final du système de permissions par classe
Teste avec des mots de passe réels et valide le filtrage
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


class TesteurFinalPermissions:
    """Testeur final du système de permissions"""
    
    def __init__(self):
        self.base_url = "http://127.0.0.1:8000"
        self.api_url = f"{self.base_url}/api"
        
        # Quelques mots de passe d'exemple (à remplacer par les vrais)
        # Ces mots de passe sont dans les fichiers credentials_*.xlsx
        self.comptes_test = {
            # Professeurs classe 8h45
            'prof_ibrahim': 'Kh8mP2nQ',  # Exemple - remplacer par le vrai
            'prof_oum_wael': 'Xt9vL4sR',  # Exemple - remplacer par le vrai
            
            # Professeurs classe 10h45
            'prof_abou_fadi': 'Qw7nM3pL',  # Exemple - remplacer par le vrai
            'prof_abdallah': 'Zx5cV8bN',  # Exemple - remplacer par le vrai
            
            # Professeurs mixtes
            'prof_mohammadine': 'Rt6yH9kJ',  # Exemple - remplacer par le vrai
            'prof_abdelhadi': 'Mn4bG7fD',  # Exemple - remplacer par le vrai
            
            # Quelques étudiants
            'salma_aneflous': 'Lp3sK6wE',  # Exemple - remplacer par le vrai
            'test': 'Qs8nR2mT',  # Exemple - remplacer par le vrai
        }
    
    def tester_connexion_api(self, username, password):
        """Teste la connexion via l'API"""
        try:
            response = requests.post(
                f"{self.api_url}/auth/login/",
                json={'username': username, 'password': password},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                return True, data.get('access'), data
            else:
                return False, None, f"Erreur {response.status_code}"
                
        except Exception as e:
            return False, None, f"Erreur: {e}"
    
    def tester_acces_utilisateurs(self, token):
        """Teste l'accès à la liste des utilisateurs avec filtrage"""
        try:
            headers = {'Authorization': f'Bearer {token}'}
            response = requests.get(
                f"{self.api_url}/users/",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                return True, data
            else:
                return False, f"Erreur {response.status_code}"
                
        except Exception as e:
            return False, f"Erreur: {e}"
    
    def analyser_filtrage(self, username, users_data):
        """Analyse si le filtrage par classe fonctionne"""
        user = User.objects.get(username=username)
        user_classes = list(user.groups.filter(
            name__in=['Classe_8h45', 'Classe_10h45']
        ).values_list('name', flat=True))
        
        print(f"👤 {username} ({user.role})")
        print(f"👥 Classes: {', '.join(user_classes)}")
        print(f"📊 Voit {users_data['count']} utilisateurs")
        
        # Analyser les utilisateurs visibles
        classes_vues = set()
        roles_vus = {'student': 0, 'teacher': 0}
        
        for user_data in users_data['users']:
            # Récupérer les classes de cet utilisateur
            user_obj = User.objects.get(id=user_data['id'])
            user_obj_classes = list(user_obj.groups.filter(
                name__in=['Classe_8h45', 'Classe_10h45']
            ).values_list('name', flat=True))
            
            classes_vues.update(user_obj_classes)
            roles_vus[user_data['role']] += 1
        
        print(f"🔍 Classes visibles: {', '.join(classes_vues)}")
        print(f"📈 Rôles vus: {roles_vus['student']} étudiants, {roles_vus['teacher']} professeurs")
        
        # Vérifier le filtrage
        filtrage_correct = True
        for classe_vue in classes_vues:
            if classe_vue not in user_classes:
                print(f"⚠️  PROBLÈME: Voit la classe {classe_vue} mais n'y appartient pas")
                filtrage_correct = False
        
        if filtrage_correct:
            print("✅ Filtrage par classe correct")
        else:
            print("❌ Problème de filtrage détecté")
        
        return filtrage_correct
    
    def tester_utilisateur_complet(self, username, password):
        """Test complet d'un utilisateur"""
        print(f"\n🧪 TEST COMPLET: {username}")
        print("-" * 50)
        
        # Test connexion
        success, token, data = self.tester_connexion_api(username, password)
        
        if not success:
            print(f"❌ Connexion échouée: {data}")
            return False
        
        print(f"✅ Connexion réussie")
        print(f"👤 Profil: {data.get('first_name', 'N/A')} - {data.get('role', 'N/A')}")
        
        # Test accès utilisateurs
        success, users_data = self.tester_acces_utilisateurs(token)
        
        if not success:
            print(f"❌ Accès utilisateurs échoué: {users_data}")
            return False
        
        print(f"✅ Accès utilisateurs réussi")
        
        # Analyser le filtrage
        filtrage_ok = self.analyser_filtrage(username, users_data)
        
        return filtrage_ok
    
    def executer_tests_complets(self):
        """Exécute tous les tests avec mots de passe"""
        print("🧪 TESTS COMPLETS AVEC MOTS DE PASSE")
        print("="*60)
        
        print("ℹ️  IMPORTANT: Remplacez les mots de passe d'exemple par les vrais")
        print("ℹ️  Mots de passe dans: credentials_*.xlsx")
        print()
        
        resultats = {}
        
        for username, password in self.comptes_test.items():
            try:
                # Vérifier que le compte existe
                if not User.objects.filter(username=username).exists():
                    print(f"⚠️  {username}: Compte non trouvé, ignoré")
                    continue
                
                # Test complet
                success = self.tester_utilisateur_complet(username, password)
                resultats[username] = success
                
            except Exception as e:
                print(f"❌ Erreur test {username}: {e}")
                resultats[username] = False
        
        # Statistiques
        print("\n📊 RÉSULTATS FINAUX")
        print("="*40)
        
        reussis = sum(1 for success in resultats.values() if success)
        total = len(resultats)
        
        print(f"✅ Tests réussis: {reussis}/{total}")
        
        for username, success in resultats.items():
            status = "✅" if success else "❌"
            print(f"   {status} {username}")
        
        if reussis == total and total > 0:
            print("\n🎉 Tous les tests sont réussis!")
            print("✅ Le système de permissions par classe fonctionne correctement")
        else:
            print(f"\n⚠️  {total - reussis} tests ont échoué")
            print("ℹ️  Vérifiez les mots de passe et la configuration")
    
    def tester_sans_mots_de_passe(self):
        """Tests sans connexion (vérification structure seulement)"""
        print("🔍 TESTS DE STRUCTURE (SANS MOTS DE PASSE)")
        print("="*60)
        
        # Vérifier les groupes
        try:
            groupe_8h45 = Group.objects.get(name='Classe_8h45')
            groupe_10h45 = Group.objects.get(name='Classe_10h45')
            
            print(f"👥 Classe_8h45: {groupe_8h45.user_set.count()} membres")
            print(f"👥 Classe_10h45: {groupe_10h45.user_set.count()} membres")
            
            # Professeurs par classe
            profs_8h45 = groupe_8h45.user_set.filter(role='teacher').count()
            profs_10h45 = groupe_10h45.user_set.filter(role='teacher').count()
            
            print(f"👨‍🏫 Professeurs 8h45: {profs_8h45}")
            print(f"👨‍🏫 Professeurs 10h45: {profs_10h45}")
            
            # Étudiants par classe
            etudiants_8h45 = groupe_8h45.user_set.filter(role='student').count()
            etudiants_10h45 = groupe_10h45.user_set.filter(role='student').count()
            
            print(f"👨‍🎓 Étudiants 8h45: {etudiants_8h45}")
            print(f"👨‍🎓 Étudiants 10h45: {etudiants_10h45}")
            
            # Professeurs mixtes
            professeurs_mixtes = User.objects.filter(
                role='teacher',
                groups__name__in=['Classe_8h45', 'Classe_10h45']
            ).annotate(
                nb_groupes=models.Count('groups')
            ).filter(nb_groupes=2)
            
            print(f"👨‍🏫 Professeurs mixtes: {professeurs_mixtes.count()}")
            for prof in professeurs_mixtes:
                print(f"   - {prof.username} ({prof.first_name})")
            
            print("\n✅ Structure des groupes correcte")
            return True
            
        except Exception as e:
            print(f"❌ Erreur vérification structure: {e}")
            return False
    
    def afficher_instructions(self):
        """Affiche les instructions pour les tests complets"""
        print("\n📋 INSTRUCTIONS POUR TESTS COMPLETS")
        print("="*50)
        
        print("1. 📁 Ouvrir les fichiers d'identifiants:")
        print("   - credentials_2026-02-20_10-30-16.excel.xlsx (professeurs)")
        print("   - credentials_2026-02-20_10-32-32.excel.xlsx (nouveaux étudiants)")
        print("   - credentials_2026-02-20_09-59-27.excel.xlsx (étudiants 10h45)")
        
        print("\n2. 📝 Copier quelques mots de passe réels")
        
        print("\n3. 🔧 Modifier ce script:")
        print("   - Remplacer les mots de passe d'exemple dans self.comptes_test")
        print("   - Relancer le script")
        
        print("\n4. 🧪 Ou tester manuellement:")
        print("   - Se connecter sur http://127.0.0.1:8000/admin")
        print("   - Vérifier que chaque utilisateur voit sa classe")


def main():
    """Point d'entrée principal"""
    testeur = TesteurFinalPermissions()
    
    # Tests de structure (sans mots de passe)
    structure_ok = testeur.tester_sans_mots_de_passe()
    
    if structure_ok:
        print("\n" + "="*60)
        # Tests complets (avec mots de passe d'exemple)
        testeur.executer_tests_complets()
        
        # Instructions
        testeur.afficher_instructions()
    else:
        print("\n❌ Structure incorrecte, impossible de continuer")


if __name__ == "__main__":
    main()