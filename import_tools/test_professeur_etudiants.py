#!/usr/bin/env python3
"""
Test pour vérifier que les professeurs voient leurs étudiants
"""

import requests
import sys

# Configuration
API_BASE_URL = "http://127.0.0.1:8000/api"

def test_professeur_etudiants(username, password):
    """Teste qu'un professeur voit ses étudiants"""
    
    print(f"\n{'='*60}")
    print(f"TEST: Professeur {username}")
    print(f"{'='*60}\n")
    
    # 1. Connexion
    print("1. Connexion...")
    try:
        response = requests.post(
            f"{API_BASE_URL}/token/",
            json={"username": username, "password": password},
            timeout=10
        )
        
        if response.status_code != 200:
            print(f"❌ Échec de connexion: {response.status_code}")
            print(f"   Réponse: {response.text}")
            return False
        
        token = response.json()['access']
        print(f"✅ Connexion réussie")
        
    except Exception as e:
        print(f"❌ Erreur de connexion: {e}")
        return False
    
    # 2. Récupérer les informations du professeur
    print("\n2. Informations du professeur...")
    try:
        response = requests.get(
            f"{API_BASE_URL}/me/",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        
        if response.status_code != 200:
            print(f"❌ Échec: {response.status_code}")
            return False
        
        user_info = response.json()
        print(f"✅ Nom: {user_info.get('first_name', 'N/A')}")
        print(f"   Rôle: {user_info.get('role', 'N/A')}")
        print(f"   Username: {user_info.get('username', 'N/A')}")
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False
    
    # 3. Récupérer la liste des étudiants
    print("\n3. Liste des étudiants...")
    try:
        response = requests.get(
            f"{API_BASE_URL}/my-students/",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        
        if response.status_code != 200:
            print(f"❌ Échec: {response.status_code}")
            print(f"   Réponse: {response.text}")
            return False
        
        data = response.json()
        
        # Vérifier si c'est un dict avec 'students' ou une liste directe
        if isinstance(data, dict):
            students = data.get('students', [])
            teacher_classes = data.get('teacher_classes', [])
            print(f"✅ Classes du professeur: {teacher_classes}")
        else:
            students = data
        
        print(f"✅ Nombre d'étudiants: {len(students)}")
        
        if len(students) > 0:
            print(f"\n   Premiers étudiants:")
            for i, student in enumerate(students[:5]):
                name = student.get('first_name') or student.get('username', 'N/A')
                points = student.get('total_points', 0)
                submissions = student.get('submissions_count', 0)
                classes = student.get('classes', [])
                print(f"   {i+1}. {name}")
                print(f"      - Points: {points}")
                print(f"      - Soumissions: {submissions}")
                if classes:
                    print(f"      - Classes: {', '.join(classes)}")
            
            if len(students) > 5:
                print(f"   ... et {len(students) - 5} autres étudiants")
        else:
            print(f"   ⚠️  Aucun étudiant trouvé")
        
        return len(students) > 0
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False


def main():
    """Teste plusieurs professeurs"""
    
    # Liste des professeurs à tester (username, password)
    professeurs = [
        ("prof_ibrahim", "VmbceZhq"),  # Classe 8h45
        ("prof_mohammadine", "wS7hvntd"),  # Classe mixte
        ("prof_abou_fadi", "jBuL5quW"),  # Classe 10h45
    ]
    
    print("\n" + "="*60)
    print("TEST DES ÉTUDIANTS PAR PROFESSEUR")
    print("="*60)
    
    resultats = []
    
    for username, password in professeurs:
        success = test_professeur_etudiants(username, password)
        resultats.append((username, success))
    
    # Résumé
    print("\n" + "="*60)
    print("RÉSUMÉ DES TESTS")
    print("="*60)
    
    for username, success in resultats:
        status = "✅ OK" if success else "❌ ÉCHEC"
        print(f"{status} - {username}")
    
    # Code de sortie
    if all(success for _, success in resultats):
        print("\n✅ Tous les tests ont réussi!")
        sys.exit(0)
    else:
        print("\n❌ Certains tests ont échoué")
        sys.exit(1)


if __name__ == "__main__":
    main()
