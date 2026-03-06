#!/usr/bin/env python3
"""
Script de vérification des comptes créés via Django ORM.
"""

import os
import sys
import django
from pathlib import Path

# Ajouter le chemin du projet Django
django_path = Path(__file__).parent.parent / "ancien django" / "MYSITEE" / "MYSITEE"
sys.path.append(str(django_path))

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite.settings')
django.setup()

from django.contrib.auth.models import User
from django.contrib.auth import authenticate
import pandas as pd

def verifier_comptes_database():
    """
    Vérifie les comptes dans la base de données Django.
    """
    print("🔍 Vérification des comptes dans la base de données")
    print("=" * 60)
    
    # Statistiques générales
    total_users = User.objects.count()
    print(f"📊 Total utilisateurs en base: {total_users}")
    
    # Utilisateurs créés aujourd'hui
    from datetime import date
    today_users = User.objects.filter(date_joined__date=date.today())
    print(f"📅 Utilisateurs créés aujourd'hui: {today_users.count()}")
    
    # Lister quelques utilisateurs récents
    recent_users = User.objects.order_by('-date_joined')[:10]
    print(f"\n👥 10 derniers utilisateurs créés:")
    for user in recent_users:
        print(f"   - {user.username} ({user.first_name} {user.last_name}) - {user.date_joined}")
    
    return today_users.count()

def tester_authentification():
    """
    Teste l'authentification de quelques comptes.
    """
    print(f"\n🧪 Test d'authentification")
    print("=" * 60)
    
    # Chercher le fichier credentials
    output_dir = Path("output")
    credentials_files = list(output_dir.glob("credentials_*.xlsx"))
    
    if not credentials_files:
        print("❌ Aucun fichier credentials trouvé")
        return False
    
    latest_file = max(credentials_files, key=lambda x: x.stat().st_mtime)
    
    try:
        df = pd.read_excel(latest_file)
        test_accounts = df.head(5)
        
        success_count = 0
        
        for idx, row in test_accounts.iterrows():
            username = row['Username']
            password = row['Password']
            prenom = row['Prénom']
            nom = row['Nom']
            
            print(f"\n🔍 Test {idx + 1}: {prenom} {nom} ({username})")
            
            # Vérifier que l'utilisateur existe
            try:
                user = User.objects.get(username=username)
                print(f"   ✅ Utilisateur trouvé en base (ID: {user.id})")
                
                # Tester l'authentification
                auth_user = authenticate(username=username, password=password)
                if auth_user:
                    print(f"   ✅ Authentification réussie")
                    success_count += 1
                else:
                    print(f"   ❌ Échec authentification")
                    
            except User.DoesNotExist:
                print(f"   ❌ Utilisateur non trouvé en base")
        
        print(f"\n📊 Résultats:")
        print(f"   Testés: {len(test_accounts)}")
        print(f"   Réussis: {success_count}")
        print(f"   Taux de succès: {(success_count/len(test_accounts)*100):.1f}%")
        
        return success_count == len(test_accounts)
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False

def main():
    """Point d'entrée principal"""
    print("🚀 Vérification des comptes créés")
    print("=" * 60)
    
    try:
        # Vérifier la base de données
        comptes_crees = verifier_comptes_database()
        
        if comptes_crees == 0:
            print("⚠️  Aucun compte créé aujourd'hui trouvé")
            return 1
        
        # Tester l'authentification
        auth_success = tester_authentification()
        
        if auth_success:
            print(f"\n🎉 Vérification réussie !")
            print(f"   {comptes_crees} comptes créés et fonctionnels")
            return 0
        else:
            print(f"\n⚠️  Problèmes détectés lors des tests")
            return 1
            
    except Exception as e:
        print(f"❌ Erreur lors de la vérification: {e}")
        return 1

if __name__ == '__main__':
    sys.exit(main())