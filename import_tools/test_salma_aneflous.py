#!/usr/bin/env python3
"""
Script de test spécifique pour salma_aneflous
Teste plusieurs mots de passe possibles
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
from tasks.models import User


def tester_mot_de_passe(username, password):
    """Teste un mot de passe pour un utilisateur"""
    
    print(f"🧪 Test: {username} / {password}")
    
    # Test Django
    user = authenticate(username=username, password=password)
    if user:
        print(f"✅ Connexion Django réussie!")
        
        # Test API
        try:
            response = requests.post(
                "http://127.0.0.1:8000/api/token/",
                json={'username': username, 'password': password},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                token = data.get('access')
                print(f"✅ Connexion API réussie!")
                print(f"🎯 TOKEN OBTENU - MOT DE PASSE CORRECT: {password}")
                return True, token
            else:
                print(f"❌ API échoué: {response.status_code}")
                return False, None
                
        except Exception as e:
            print(f"❌ Erreur API: {e}")
            return False, None
    else:
        print(f"❌ Connexion Django échouée")
        return False, None


def main():
    """Teste tous les mots de passe possibles"""
    
    username = "salma_aneflous"
    mots_de_passe = ['CW74qj4U', 'pq4EUQwm', '5Bqadsrd', 'AMb55A5L']
    
    print("🔐 TEST MOTS DE PASSE POUR salma_aneflous")
    print("="*60)
    
    # Vérifier que l'utilisateur existe
    try:
        user = User.objects.get(username=username)
        print(f"✅ Utilisateur trouvé: {user.first_name} {user.last_name}")
        print(f"🎭 Rôle: {user.role}")
        
        # Vérifier ses groupes
        groupes = list(user.groups.values_list('name', flat=True))
        print(f"👥 Groupes: {', '.join(groupes) if groupes else 'Aucun'}")
        
    except User.DoesNotExist:
        print(f"❌ Utilisateur {username} non trouvé!")
        return
    
    print(f"\n🧪 Test de {len(mots_de_passe)} mots de passe possibles:")
    
    for i, password in enumerate(mots_de_passe, 1):
        print(f"\n--- Test {i}/{len(mots_de_passe)} ---")
        success, token = tester_mot_de_passe(username, password)
        
        if success:
            print(f"\n🎉 MOT DE PASSE TROUVÉ!")
            print(f"👤 Username: {username}")
            print(f"🔐 Password: {password}")
            print(f"🎫 Token: {token[:50]}...")
            
            print(f"\n📋 UTILISEZ CES IDENTIFIANTS POUR LES TESTS:")
            print(f"   Username: {username}")
            print(f"   Password: {password}")
            break
    else:
        print(f"\n❌ Aucun mot de passe ne fonctionne")
        print(f"📁 Vérifiez manuellement le fichier credentials_2026-02-20_09-59-27.excel.xlsx")


if __name__ == "__main__":
    main()
