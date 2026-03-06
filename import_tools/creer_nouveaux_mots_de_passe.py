#!/usr/bin/env python3
"""
Crée de nouveaux mots de passe pour tous les utilisateurs
et met à jour la base de données Django
"""

import os
import sys
import django
from pathlib import Path
import secrets
import string

# Configuration Django
project_root = Path(__file__).parent.parent / "ancien django" / "MYSITEE" / "MYSITEE"
sys.path.append(str(project_root))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite.settings')

try:
    django.setup()
except Exception as e:
    print(f"❌ Erreur configuration Django: {e}")
    sys.exit(1)

from tasks.models import User
from django.db import transaction


class CreateurNouveauxMotsDePasse:
    """Crée de nouveaux mots de passe pour tous les utilisateurs"""
    
    def __init__(self):
        # Même charset que le générateur original
        self.CHARSET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"
        self.output_dir = Path(__file__).parent / "output"
    
    def generer_mot_de_passe_securise(self, length=8):
        """Génère un mot de passe sécurisé"""
        return ''.join(secrets.choice(self.CHARSET) for _ in range(length))
    
    def mettre_a_jour_utilisateur(self, user, nouveau_mot_de_passe):
        """Met à jour le mot de passe d'un utilisateur"""
        try:
            user.set_password(nouveau_mot_de_passe)
            user.save()
            return True
        except Exception as e:
            print(f"❌ Erreur mise à jour {user.username}: {e}")
            return False
    
    def traiter_utilisateurs_par_groupe(self, role_filter=None, groupe_filter=None):
        """Traite un groupe d'utilisateurs"""
        
        # Construire la requête
        query = User.objects.all()
        
        if role_filter:
            query = query.filter(role=role_filter)
        
        if groupe_filter:
            query = query.filter(groups__name=groupe_filter)
        
        # Exclure les superusers et admin
        query = query.exclude(is_superuser=True).exclude(username='admin')
        
        return query.distinct()
    
    def creer_fichier_credentials(self, utilisateurs, nom_fichier):
        """Crée un fichier CSV avec les nouveaux identifiants"""
        
        fichier_path = self.output_dir / f"{nom_fichier}.csv"
        
        try:
            with open(fichier_path, 'w', encoding='utf-8', newline='') as f:
                # En-têtes
                f.write("Username,Password,Prénom,Nom,Rôle,Classe\n")
                
                # Données
                for user_data in utilisateurs:
                    username = user_data['username']
                    password = user_data['password']
                    prenom = user_data['prenom']
                    nom = user_data['nom']
                    role = user_data['role']
                    classe = user_data['classe']
                    
                    f.write(f'"{username}","{password}","{prenom}","{nom}","{role}","{classe}"\n')
            
            print(f"✅ Fichier créé: {fichier_path}")
            return fichier_path
            
        except Exception as e:
            print(f"❌ Erreur création fichier: {e}")
            return None
    
    def traiter_tous_les_utilisateurs(self):
        """Traite tous les utilisateurs et crée de nouveaux mots de passe"""
        
        print("🔄 CRÉATION DE NOUVEAUX MOTS DE PASSE")
        print("="*60)
        
        # Groupes à traiter
        groupes = [
            {
                'nom': 'Étudiants Classe 8h45',
                'role': 'student',
                'groupe': 'Classe_8h45',
                'fichier': 'nouveaux_credentials_etudiants_8h45'
            },
            {
                'nom': 'Étudiants Classe 10h45', 
                'role': 'student',
                'groupe': 'Classe_10h45',
                'fichier': 'nouveaux_credentials_etudiants_10h45'
            },
            {
                'nom': 'Professeurs',
                'role': 'teacher',
                'groupe': None,
                'fichier': 'nouveaux_credentials_professeurs'
            }
        ]
        
        tous_les_credentials = []
        
        for groupe_info in groupes:
            print(f"\n👥 Traitement: {groupe_info['nom']}")
            
            # Récupérer les utilisateurs
            if groupe_info['groupe']:
                utilisateurs = self.traiter_utilisateurs_par_groupe(
                    role_filter=groupe_info['role'],
                    groupe_filter=groupe_info['groupe']
                )
            else:
                utilisateurs = self.traiter_utilisateurs_par_groupe(
                    role_filter=groupe_info['role']
                )
            
            print(f"📊 {utilisateurs.count()} utilisateurs trouvés")
            
            if utilisateurs.count() == 0:
                continue
            
            credentials_groupe = []
            
            with transaction.atomic():
                for user in utilisateurs:
                    # Générer nouveau mot de passe
                    nouveau_password = self.generer_mot_de_passe_securise()
                    
                    # Mettre à jour dans Django
                    if self.mettre_a_jour_utilisateur(user, nouveau_password):
                        # Récupérer les classes de l'utilisateur
                        classes = list(user.groups.filter(
                            name__in=['Classe_8h45', 'Classe_10h45']
                        ).values_list('name', flat=True))
                        classe_str = ', '.join(classes) if classes else 'Aucune'
                        
                        user_data = {
                            'username': user.username,
                            'password': nouveau_password,
                            'prenom': user.first_name,
                            'nom': user.last_name,
                            'role': user.role,
                            'classe': classe_str
                        }
                        
                        credentials_groupe.append(user_data)
                        tous_les_credentials.append(user_data)
                        
                        print(f"✅ {user.username}: {nouveau_password}")
                    else:
                        print(f"❌ Échec {user.username}")
            
            # Créer fichier pour ce groupe
            if credentials_groupe:
                self.creer_fichier_credentials(credentials_groupe, groupe_info['fichier'])
        
        # Créer fichier global
        if tous_les_credentials:
            self.creer_fichier_credentials(tous_les_credentials, 'nouveaux_credentials_tous')
        
        return tous_les_credentials
    
    def tester_salma_aneflous(self, tous_les_credentials):
        """Teste spécifiquement salma_aneflous"""
        
        print(f"\n🎯 TEST SPÉCIFIQUE: salma_aneflous")
        print("="*50)
        
        # Chercher salma dans les credentials
        salma_data = None
        for cred in tous_les_credentials:
            if cred['username'] == 'salma_aneflous':
                salma_data = cred
                break
        
        if not salma_data:
            print(f"❌ salma_aneflous non trouvé dans les credentials")
            return False
        
        print(f"✅ Credentials trouvés:")
        print(f"👤 Username: {salma_data['username']}")
        print(f"🔐 Password: {salma_data['password']}")
        print(f"👥 Classe: {salma_data['classe']}")
        
        # Tester la connexion Django
        try:
            from django.contrib.auth import authenticate
            user = authenticate(username=salma_data['username'], password=salma_data['password'])
            
            if user:
                print(f"✅ Connexion Django réussie!")
                
                # Tester l'API
                try:
                    import requests
                    response = requests.post(
                        "http://127.0.0.1:8000/api/token/",
                        json={
                            'username': salma_data['username'], 
                            'password': salma_data['password']
                        },
                        timeout=10
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        print(f"✅ Connexion API réussie!")
                        print(f"🎫 Token obtenu: {data.get('access', '')[:50]}...")
                        return True
                    else:
                        print(f"❌ API échoué: {response.status_code}")
                        return False
                        
                except Exception as e:
                    print(f"❌ Erreur test API: {e}")
                    return False
            else:
                print(f"❌ Connexion Django échouée")
                return False
                
        except Exception as e:
            print(f"❌ Erreur test Django: {e}")
            return False


def main():
    """Point d'entrée principal"""
    
    createur = CreateurNouveauxMotsDePasse()
    
    print("🚀 CRÉATION DE NOUVEAUX MOTS DE PASSE POUR TOUS")
    print("="*70)
    
    # Traiter tous les utilisateurs
    tous_les_credentials = createur.traiter_tous_les_utilisateurs()
    
    print(f"\n📊 RÉSUMÉ")
    print("="*40)
    print(f"👥 Total utilisateurs traités: {len(tous_les_credentials)}")
    
    # Tester salma_aneflous
    if createur.tester_salma_aneflous(tous_les_credentials):
        print(f"\n🎉 SUCCÈS! salma_aneflous fonctionne maintenant")
        
        # Trouver ses credentials
        for cred in tous_les_credentials:
            if cred['username'] == 'salma_aneflous':
                print(f"\n🎯 IDENTIFIANTS POUR LES TESTS:")
                print(f"   Username: {cred['username']}")
                print(f"   Password: {cred['password']}")
                break
    else:
        print(f"\n❌ Problème avec salma_aneflous")
    
    print(f"\n📁 Fichiers créés dans: {createur.output_dir}")
    print(f"🧪 Maintenant vous pouvez tester les permissions avec ces nouveaux mots de passe!")


if __name__ == "__main__":
    main()