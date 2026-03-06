#!/usr/bin/env python3
"""
Régénère proprement les fichiers d'identifiants
Utilise les logs d'import pour recréer les mots de passe
"""

import os
import sys
import django
from pathlib import Path
import secrets
import string
import hashlib

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


class RegenerateurCredentials:
    """Régénérateur de fichiers d'identifiants"""
    
    def __init__(self):
        self.output_dir = Path(__file__).parent / "output"
        self.logs_dir = self.output_dir
        
    def generer_mot_de_passe_original(self, username):
        """
        Génère le mot de passe original en utilisant la même logique
        que password_generator.py
        """
        # Utiliser le même algorithme que dans password_generator.py
        # Créer un seed basé sur le username pour la reproductibilité
        seed_string = f"quran_review_{username}_2026"
        hash_object = hashlib.sha256(seed_string.encode())
        seed_hex = hash_object.hexdigest()
        
        # Utiliser les premiers 8 caractères du hash comme base
        base = seed_hex[:8]
        
        # Convertir en mot de passe valide (lettres + chiffres)
        chars = string.ascii_letters + string.digits
        password = ""
        
        for i, char in enumerate(base):
            # Convertir chaque caractère hex en index pour chars
            hex_val = int(char, 16)
            password += chars[hex_val % len(chars)]
        
        return password
    
    def lire_log_import(self, log_file):
        """Lit un log d'import et extrait les utilisateurs créés"""
        
        log_path = self.logs_dir / log_file
        
        if not log_path.exists():
            print(f"❌ Log non trouvé: {log_path}")
            return []
        
        utilisateurs = []
        
        try:
            with open(log_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            i = 0
            while i < len(lines):
                line = lines[i].strip()
                
                if line.startswith('✅ SUCCESS:'):
                    # Extraire username et nom complet
                    parts = line.split('✅ SUCCESS: ')[1]
                    if '(' in parts and ')' in parts:
                        username = parts.split(' (')[0].strip()
                        nom_complet = parts.split('(')[1].split(')')[0].strip()
                        
                        # Chercher l'User ID dans la ligne suivante
                        user_id = None
                        if i + 1 < len(lines):
                            next_line = lines[i + 1].strip()
                            if 'User ID:' in next_line:
                                user_id = next_line.split('User ID:')[1].strip()
                        
                        utilisateurs.append({
                            'username': username,
                            'nom_complet': nom_complet,
                            'user_id': user_id
                        })
                
                i += 1
        
        except Exception as e:
            print(f"❌ Erreur lecture log {log_file}: {e}")
        
        return utilisateurs
    
    def creer_fichier_credentials_csv(self, utilisateurs, nom_fichier):
        """Crée un fichier CSV avec les identifiants"""
        
        fichier_path = self.output_dir / f"{nom_fichier}.csv"
        
        try:
            with open(fichier_path, 'w', encoding='utf-8', newline='') as f:
                # En-têtes
                f.write("Username,Password,Prénom,Nom,Nom_Complet,User_ID\n")
                
                # Données
                for user_data in utilisateurs:
                    username = user_data['username']
                    password = self.generer_mot_de_passe_original(username)
                    nom_complet = user_data['nom_complet']
                    user_id = user_data.get('user_id', '')
                    
                    # Séparer prénom et nom si possible
                    if ' ' in nom_complet:
                        parts = nom_complet.split(' ', 1)
                        prenom = parts[0]
                        nom = parts[1]
                    else:
                        prenom = nom_complet
                        nom = ""
                    
                    f.write(f'"{username}","{password}","{prenom}","{nom}","{nom_complet}","{user_id}"\n')
            
            print(f"✅ Fichier créé: {fichier_path}")
            return fichier_path
            
        except Exception as e:
            print(f"❌ Erreur création fichier: {e}")
            return None
    
    def tester_mot_de_passe(self, username, password):
        """Teste si un mot de passe fonctionne"""
        try:
            from django.contrib.auth import authenticate
            user = authenticate(username=username, password=password)
            return user is not None
        except Exception:
            return False
    
    def regenerer_tous_les_fichiers(self):
        """Régénère tous les fichiers d'identifiants"""
        
        print("🔄 RÉGÉNÉRATION DES FICHIERS D'IDENTIFIANTS")
        print("="*60)
        
        # Fichiers de logs à traiter
        logs_a_traiter = [
            {
                'log': 'import_2026-02-20_09-59-27.log',
                'nom': 'credentials_etudiants_10h45_regen',
                'description': 'Étudiants classe 10h45'
            },
            {
                'log': 'import_2026-02-20_10-30-16.log', 
                'nom': 'credentials_professeurs_regen',
                'description': 'Professeurs'
            },
            {
                'log': 'import_2026-02-20_10-32-32.log',
                'nom': 'credentials_etudiants_8h45_regen', 
                'description': 'Nouveaux étudiants classe 8h45'
            }
        ]
        
        fichiers_crees = []
        
        for log_info in logs_a_traiter:
            print(f"\n📁 Traitement: {log_info['description']}")
            print(f"📄 Log source: {log_info['log']}")
            
            # Lire le log
            utilisateurs = self.lire_log_import(log_info['log'])
            
            if not utilisateurs:
                print(f"⚠️  Aucun utilisateur trouvé dans {log_info['log']}")
                continue
            
            print(f"👥 {len(utilisateurs)} utilisateurs trouvés")
            
            # Créer le fichier CSV
            fichier_path = self.creer_fichier_credentials_csv(utilisateurs, log_info['nom'])
            
            if fichier_path:
                fichiers_crees.append(fichier_path)
                
                # Tester quelques mots de passe
                print(f"🧪 Test de quelques mots de passe...")
                for i, user_data in enumerate(utilisateurs[:3]):  # Tester les 3 premiers
                    username = user_data['username']
                    password = self.generer_mot_de_passe_original(username)
                    
                    if self.tester_mot_de_passe(username, password):
                        print(f"✅ {username}: {password} - FONCTIONNE")
                    else:
                        print(f"❌ {username}: {password} - NE FONCTIONNE PAS")
        
        return fichiers_crees
    
    def chercher_salma_specifiquement(self):
        """Cherche spécifiquement salma_aneflous et teste ses mots de passe"""
        
        print(f"\n🎯 RECHERCHE SPÉCIFIQUE: salma_aneflous")
        print("="*50)
        
        # Vérifier que l'utilisateur existe dans Django
        try:
            user = User.objects.get(username='salma_aneflous')
            print(f"✅ Utilisateur trouvé dans Django:")
            print(f"   ID: {user.id}")
            print(f"   Nom: {user.first_name} {user.last_name}")
            print(f"   Rôle: {user.role}")
            
            # Tester différents mots de passe
            variations = [
                'salma_aneflous',
                f'salma_aneflous_{user.id}',
                'Salma_Aneflous',
                'SALMA_ANEFLOUS'
            ]
            
            print(f"\n🧪 Test de {len(variations)} variations de mots de passe:")
            
            for variation in variations:
                password = self.generer_mot_de_passe_original(variation)
                print(f"📝 Variation '{variation}' → {password}")
                
                if self.tester_mot_de_passe('salma_aneflous', password):
                    print(f"🎉 MOT DE PASSE TROUVÉ!")
                    print(f"👤 Username: salma_aneflous")
                    print(f"🔐 Password: {password}")
                    return password
                else:
                    print(f"❌ Ne fonctionne pas")
            
            print(f"\n⚠️  Aucune variation ne fonctionne")
            return None
            
        except User.DoesNotExist:
            print(f"❌ salma_aneflous non trouvé dans Django")
            return None


def main():
    """Point d'entrée principal"""
    
    regenerateur = RegenerateurCredentials()
    
    # Régénérer tous les fichiers
    fichiers_crees = regenerateur.regenerer_tous_les_fichiers()
    
    # Chercher spécifiquement salma
    password_salma = regenerateur.chercher_salma_specifiquement()
    
    print(f"\n📊 RÉSUMÉ")
    print("="*40)
    print(f"📁 Fichiers créés: {len(fichiers_crees)}")
    for fichier in fichiers_crees:
        print(f"   - {fichier}")
    
    if password_salma:
        print(f"\n🎯 MOT DE PASSE salma_aneflous: {password_salma}")
        print(f"\n🧪 MAINTENANT TESTEZ:")
        print(f"   cd 'QuranReviewLocal/ancien django/MYSITEE/MYSITEE'")
        print(f"   .venv/Scripts/activate")
        print(f"   python ../../../import_tools/test_permissions_manuel.py")
        print(f"   Username: salma_aneflous")
        print(f"   Password: {password_salma}")
    else:
        print(f"\n❌ Mot de passe salma_aneflous non trouvé")
        print(f"📁 Consultez les fichiers CSV créés pour les autres utilisateurs")


if __name__ == "__main__":
    main()