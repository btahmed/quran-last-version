"""
Test final de l'affichage des classes et de la liste des étudiants
"""
import requests

def test_professor(username, password, expected_students, expected_classes):
    """Tester un professeur"""
    print(f"\n{'='*60}")
    print(f"TEST: {username}")
    print(f"{'='*60}")
    
    # Connexion
    login_url = "http://127.0.0.1:8000/api/token/"
    login_data = {"username": username, "password": password}
    
    try:
        login_response = requests.post(login_url, json=login_data, timeout=5)
        if login_response.status_code != 200:
            print(f"❌ Échec de connexion: {login_response.text}")
            return False
        
        token_data = login_response.json()
        access_token = token_data.get('access')
        print(f"✓ Connexion réussie")
    except Exception as e:
        print(f"❌ Erreur de connexion: {e}")
        return False
    
    # Tester l'API my-students
    url = "http://127.0.0.1:8000/api/my-students/"
    headers = {"Authorization": f"Bearer {access_token}"}
    
    try:
        response = requests.get(url, headers=headers, timeout=5)
        if response.status_code != 200:
            print(f"❌ Erreur API: {response.text}")
            return False
        
        data = response.json()
        
        # Vérifier le format
        if not isinstance(data, dict):
            print(f"❌ Format incorrect: attendu dict, reçu {type(data)}")
            return False
        
        if 'students' not in data or 'teacher_classes' not in data:
            print(f"❌ Clés manquantes: {list(data.keys())}")
            return False
        
        students = data['students']
        teacher_classes = data['teacher_classes']
        
        # Vérifier le nombre d'étudiants
        if len(students) != expected_students:
            print(f"❌ Nombre d'étudiants incorrect:")
            print(f"   Attendu: {expected_students}")
            print(f"   Reçu: {len(students)}")
            return False
        else:
            print(f"✓ Nombre d'étudiants: {len(students)}")
        
        # Vérifier les classes
        classes_display = [c.replace('Classe_', '') for c in teacher_classes]
        if set(classes_display) != set(expected_classes):
            print(f"❌ Classes incorrectes:")
            print(f"   Attendu: {expected_classes}")
            print(f"   Reçu: {classes_display}")
            return False
        else:
            print(f"✓ Classes: {' + '.join(classes_display)}")
        
        # Afficher quelques étudiants
        print(f"\n✓ Premiers étudiants:")
        for student in students[:3]:
            print(f"   - {student['first_name']} {student['last_name']} ({student['username']})")
            print(f"     Points: {student['total_points']}, Soumissions: {student['submissions_count']}")
        
        print(f"\n✅ TEST RÉUSSI pour {username}")
        return True
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False

def main():
    """Tester tous les professeurs"""
    print("\n" + "="*60)
    print("TEST FINAL - AFFICHAGE DES CLASSES ET LISTE DES ÉTUDIANTS")
    print("="*60)
    
    tests = [
        # (username, password, expected_students, expected_classes)
        ("prof_ibrahim", "VmbceZhq", 204, ["8h45"]),
        ("prof_wassim", "TtzLFaC6", 204, ["8h45"]),
        ("prof_mohammadine", "wS7hvntd", 205, ["8h45", "10h45"]),  # Professeur mixte
    ]
    
    results = []
    for username, password, expected_students, expected_classes in tests:
        success = test_professor(username, password, expected_students, expected_classes)
        results.append((username, success))
    
    # Résumé
    print("\n" + "="*60)
    print("RÉSUMÉ DES TESTS")
    print("="*60)
    for username, success in results:
        status = "✅ RÉUSSI" if success else "❌ ÉCHOUÉ"
        print(f"{status}: {username}")
    
    all_success = all(success for _, success in results)
    if all_success:
        print("\n🎉 TOUS LES TESTS SONT RÉUSSIS!")
        print("\nVous pouvez maintenant:")
        print("1. Ouvrir http://localhost:3000")
        print("2. Se connecter avec un des professeurs testés")
        print("3. Vérifier que la liste des étudiants et les classes s'affichent correctement")
    else:
        print("\n⚠️ CERTAINS TESTS ONT ÉCHOUÉ")
        print("Vérifiez les erreurs ci-dessus")

if __name__ == '__main__':
    main()
