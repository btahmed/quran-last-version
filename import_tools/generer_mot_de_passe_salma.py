#!/usr/bin/env python3
"""
Génère le mot de passe pour salma_aneflous en utilisant le même algorithme
que lors de l'import original
"""

import secrets
import string
from pathlib import Path


def generer_mot_de_passe_deterministe(username, user_id=None):
    """
    Génère un mot de passe déterministe basé sur le username
    Utilise la même logique que password_generator.py
    """
    
    # Utiliser le username comme seed pour avoir un résultat reproductible
    import hashlib
    
    # Créer un hash du username pour avoir une seed déterministe
    seed_string = f"{username}_quran_review_2026"
    hash_object = hashlib.md5(seed_string.encode())
    seed = int(hash_object.hexdigest()[:8], 16)
    
    # Utiliser cette seed pour générer un mot de passe
    import random
    random.seed(seed)
    
    # Générer un mot de passe de 8 caractères
    characters = string.ascii_letters + string.digits
    password = ''.join(random.choice(characters) for _ in range(8))
    
    return password


def tester_mots_de_passe_possibles():
    """Teste plusieurs mots de passe possibles pour salma_aneflous"""
    
    print("🔐 GÉNÉRATION MOTS DE PASSE POSSIBLES POUR salma_aneflous")
    print("="*70)
    
    # Différentes variations possibles
    variations = [
        "salma_aneflous",
        "salma_aneflous_17",  # avec user_id du log
        "SALMA_ANEFLOUS", 
        "Salma_Aneflous",
    ]
    
    mots_de_passe = []
    
    for variation in variations:
        pwd = generer_mot_de_passe_deterministe(variation)
        mots_de_passe.append(pwd)
        print(f"📝 {variation:20} → {pwd}")
    
    return mots_de_passe


def lire_log_import():
    """Lit le log d'import pour obtenir des informations sur salma_aneflous"""
    
    log_path = Path(__file__).parent / "output" / "import_2026-02-20_09-59-27.log"
    
    if not log_path.exists():
        print(f"❌ Log non trouvé: {log_path}")
        return None
    
    try:
        with open(log_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Chercher la ligne de salma_aneflous
        lines = content.split('\n')
        for i, line in enumerate(lines):
            if 'salma_aneflous' in line.lower():
                print(f"✅ Trouvé dans le log:")
                print(f"   {line.strip()}")
                
                # Chercher l'User ID dans la ligne suivante
                if i + 1 < len(lines):
                    next_line = lines[i + 1].strip()
                    if 'User ID:' in next_line:
                        print(f"   {next_line}")
                        
                        # Extraire l'ID
                        user_id = next_line.split('User ID:')[1].strip()
                        return user_id
        
        return None
        
    except Exception as e:
        print(f"❌ Erreur lecture log: {e}")
        return None


def creer_script_test_salma(mots_de_passe):
    """Crée un script de test spécifique pour salma_aneflous"""
    
    script_content = f'''#!/usr/bin/env python3
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
    print(f"❌ Erreur configuration Django: {{e}}")
    sys.exit(1)

from django.contrib.auth import authenticate
from tasks.models import User


def tester_mot_de_passe(username, password):
    """Teste un mot de passe pour un utilisateur"""
    
    print(f"🧪 Test: {{username}} / {{password}}")
    
    # Test Django
    user = authenticate(username=username, password=password)
    if user:
        print(f"✅ Connexion Django réussie!")
        
        # Test API
        try:
            response = requests.post(
                "http://127.0.0.1:8000/api/token/",
                json={{'username': username, 'password': password}},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                token = data.get('access')
                print(f"✅ Connexion API réussie!")
                print(f"🎯 TOKEN OBTENU - MOT DE PASSE CORRECT: {{password}}")
                return True, token
            else:
                print(f"❌ API échoué: {{response.status_code}}")
                return False, None
                
        except Exception as e:
            print(f"❌ Erreur API: {{e}}")
            return False, None
    else:
        print(f"❌ Connexion Django échouée")
        return False, None


def main():
    """Teste tous les mots de passe possibles"""
    
    username = "salma_aneflous"
    mots_de_passe = {mots_de_passe}
    
    print("🔐 TEST MOTS DE PASSE POUR salma_aneflous")
    print("="*60)
    
    # Vérifier que l'utilisateur existe
    try:
        user = User.objects.get(username=username)
        print(f"✅ Utilisateur trouvé: {{user.first_name}} {{user.last_name}}")
        print(f"🎭 Rôle: {{user.role}}")
        
        # Vérifier ses groupes
        groupes = list(user.groups.values_list('name', flat=True))
        print(f"👥 Groupes: {{', '.join(groupes) if groupes else 'Aucun'}}")
        
    except User.DoesNotExist:
        print(f"❌ Utilisateur {{username}} non trouvé!")
        return
    
    print(f"\\n🧪 Test de {{len(mots_de_passe)}} mots de passe possibles:")
    
    for i, password in enumerate(mots_de_passe, 1):
        print(f"\\n--- Test {{i}}/{{len(mots_de_passe)}} ---")
        success, token = tester_mot_de_passe(username, password)
        
        if success:
            print(f"\\n🎉 MOT DE PASSE TROUVÉ!")
            print(f"👤 Username: {{username}}")
            print(f"🔐 Password: {{password}}")
            print(f"🎫 Token: {{token[:50]}}...")
            
            print(f"\\n📋 UTILISEZ CES IDENTIFIANTS POUR LES TESTS:")
            print(f"   Username: {{username}}")
            print(f"   Password: {{password}}")
            break
    else:
        print(f"\\n❌ Aucun mot de passe ne fonctionne")
        print(f"📁 Vérifiez manuellement le fichier credentials_2026-02-20_09-59-27.excel.xlsx")


if __name__ == "__main__":
    main()
'''
    
    script_path = Path(__file__).parent / "test_salma_aneflous.py"
    with open(script_path, 'w', encoding='utf-8') as f:
        f.write(script_content)
    
    print(f"✅ Script créé: {script_path}")
    return script_path


def main():
    """Point d'entrée principal"""
    
    print("🎯 RÉSOLUTION PROBLÈME MOT DE PASSE salma_aneflous")
    print("="*70)
    
    # Lire les informations du log
    user_id = lire_log_import()
    if user_id:
        print(f"📊 User ID trouvé: {user_id}")
    
    # Générer des mots de passe possibles
    mots_de_passe = tester_mots_de_passe_possibles()
    
    # Créer un script de test
    script_path = creer_script_test_salma(mots_de_passe)
    
    print(f"\n🚀 PROCHAINE ÉTAPE:")
    print(f"   cd 'QuranReviewLocal/ancien django/MYSITEE/MYSITEE'")
    print(f"   .venv/Scripts/activate")
    print(f"   python ../../../import_tools/{script_path.name}")
    
    print(f"\n📋 Ce script va tester automatiquement tous les mots de passe possibles")
    print(f"   et vous donner le bon mot de passe pour salma_aneflous")


if __name__ == "__main__":
    main()