#!/usr/bin/env python3
"""
Script de test des connexions pour vérifier que les comptes créés fonctionnent.
"""

import requests
import pandas as pd
from pathlib import Path
import sys

def test_login(username, password, api_url="http://127.0.0.1:8000"):
    """
    Teste la connexion d'un utilisateur via l'API Django.
    """
    try:
        # Tenter de se connecter
        login_url = f"{api_url}/api/auth/login/"
        data = {
            'username': username,
            'password': password
        }
        
        response = requests.post(login_url, data=data, timeout=10)
        
        if response.status_code == 200:
            return True, "Connexion réussie"
        elif response.status_code == 401:
            return False, "Identifiants incorrects"
        else:
            return False, f"Erreur HTTP {response.status_code}"
            
    except requests.exceptions.ConnectionError:
        return False, "Impossible de se connecter au serveur"
    except requests.exceptions.Timeout:
        return False, "Timeout de connexion"
    except Exception as e:
        return False, f"Erreur: {str(e)}"

def test_comptes_echantillon():
    """
    Teste un échantillon de comptes créés.
    """
    print("🧪 Test des connexions - Échantillon de comptes")
    print("=" * 60)
    
    # Chercher le fichier credentials le plus récent
    output_dir = Path("output")
    credentials_files = list(output_dir.glob("credentials_*.xlsx"))
    
    if not credentials_files:
        print("❌ Aucun fichier credentials trouvé dans output/")
        return False
    
    # Prendre le plus récent
    latest_file = max(credentials_files, key=lambda x: x.stat().st_mtime)
    print(f"📁 Fichier: {latest_file}")
    
    try:
        # Lire le fichier Excel
        df = pd.read_excel(latest_file)
        print(f"✓ {len(df)} comptes trouvés dans le fichier")
        
        # Tester les 5 premiers comptes
        test_accounts = df.head(5)
        
        success_count = 0
        total_tests = len(test_accounts)
        
        for idx, row in test_accounts.iterrows():
            username = row['Username']
            password = row['Password']
            prenom = row['Prénom']
            nom = row['Nom']
            
            print(f"\n🔍 Test {idx + 1}/{total_tests}: {prenom} {nom} ({username})")
            
            success, message = test_login(username, password)
            
            if success:
                print(f"   ✅ {message}")
                success_count += 1
            else:
                print(f"   ❌ {message}")
        
        print(f"\n{'=' * 60}")
        print(f"📊 Résultats des tests:")
        print(f"   Testés: {total_tests}")
        print(f"   Réussis: {success_count}")
        print(f"   Échecs: {total_tests - success_count}")
        print(f"   Taux de succès: {(success_count/total_tests*100):.1f}%")
        
        if success_count == total_tests:
            print("🎉 Tous les tests sont réussis !")
            return True
        else:
            print("⚠️  Certains tests ont échoué")
            return False
            
    except Exception as e:
        print(f"❌ Erreur lors du test: {e}")
        return False

def main():
    """Point d'entrée principal"""
    print("🚀 Démarrage des tests de connexion...")
    
    # Vérifier que le serveur est accessible
    try:
        response = requests.get("http://127.0.0.1:8000", timeout=5)
        print("✓ Serveur Django accessible")
    except:
        print("❌ Serveur Django non accessible sur http://127.0.0.1:8000")
        print("   Assurez-vous que le backend Django est démarré")
        return 1
    
    # Tester les comptes
    success = test_comptes_echantillon()
    
    if success:
        print("\n✅ Tous les tests sont passés avec succès !")
        print("   Les comptes créés fonctionnent correctement")
        return 0
    else:
        print("\n❌ Certains tests ont échoué")
        print("   Vérifiez les logs et la configuration")
        return 1

if __name__ == '__main__':
    sys.exit(main())