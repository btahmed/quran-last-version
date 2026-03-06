"""
Test du groupement des étudiants par classe
"""
import requests

API_BASE_URL = "http://127.0.0.1:8000/api"

def test_prof_mixte():
    """Tester avec un professeur mixte (8h45 + 10h45)"""
    
    print("\n" + "="*60)
    print("TEST: Professeur Mixte (prof_mohammadine)")
    print("="*60)
    
    # Connexion
    response = requests.post(
        f"{API_BASE_URL}/token/",
        json={"username": "prof_mohammadine", "password": "wS7hvntd"}
    )
    
    if response.status_code != 200:
        print(f"❌ Échec de connexion: {response.status_code}")
        return
    
    token = response.json()['access']
    print("✓ Connexion réussie")
    
    # Appel API my-students
    response = requests.get(
        f"{API_BASE_URL}/my-students/",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    if response.status_code != 200:
        print(f"❌ Erreur API: {response.status_code}")
        return
    
    data = response.json()
    students = data.get('students', [])
    teacher_classes = data.get('teacher_classes', [])
    
    print(f"\n✓ Classes du professeur: {teacher_classes}")
    print(f"✓ Nombre total d'étudiants: {len(students)}")
    
    # Grouper par classe
    students_8h45 = [s for s in students if 'Classe_8h45' in s.get('classes', [])]
    students_10h45 = [s for s in students if 'Classe_10h45' in s.get('classes', [])]
    
    print(f"\n📚 Classe 8h45: {len(students_8h45)} étudiants")
    if students_8h45:
        print(f"   Premiers étudiants:")
        for s in students_8h45[:3]:
            print(f"   - {s['first_name']} {s['last_name']} ({s['username']})")
    
    print(f"\n📚 Classe 10h45: {len(students_10h45)} étudiants")
    if students_10h45:
        print(f"   Étudiants:")
        for s in students_10h45:
            print(f"   - {s['first_name']} {s['last_name']} ({s['username']})")
    
    # Vérification
    print(f"\n✅ RÉSULTAT:")
    print(f"   - Total: {len(students)} étudiants")
    print(f"   - 8h45: {len(students_8h45)} étudiants")
    print(f"   - 10h45: {len(students_10h45)} étudiants")
    print(f"   - Somme: {len(students_8h45) + len(students_10h45)}")
    
    if len(students_8h45) + len(students_10h45) == len(students):
        print(f"\n✅ SUCCÈS: Tous les étudiants sont bien classés!")
    else:
        print(f"\n⚠️ ATTENTION: Certains étudiants ne sont dans aucune classe")

def test_prof_8h45():
    """Tester avec un professeur de 8h45 uniquement"""
    
    print("\n" + "="*60)
    print("TEST: Professeur 8h45 (prof_ibrahim)")
    print("="*60)
    
    # Connexion
    response = requests.post(
        f"{API_BASE_URL}/token/",
        json={"username": "prof_ibrahim", "password": "VmbceZhq"}
    )
    
    if response.status_code != 200:
        print(f"❌ Échec de connexion: {response.status_code}")
        return
    
    token = response.json()['access']
    print("✓ Connexion réussie")
    
    # Appel API my-students
    response = requests.get(
        f"{API_BASE_URL}/my-students/",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    if response.status_code != 200:
        print(f"❌ Erreur API: {response.status_code}")
        return
    
    data = response.json()
    students = data.get('students', [])
    teacher_classes = data.get('teacher_classes', [])
    
    print(f"\n✓ Classes du professeur: {teacher_classes}")
    print(f"✓ Nombre total d'étudiants: {len(students)}")
    
    # Vérifier que tous sont de 8h45
    students_8h45 = [s for s in students if 'Classe_8h45' in s.get('classes', [])]
    students_10h45 = [s for s in students if 'Classe_10h45' in s.get('classes', [])]
    
    print(f"\n📚 Classe 8h45: {len(students_8h45)} étudiants")
    print(f"📚 Classe 10h45: {len(students_10h45)} étudiants")
    
    if len(students_10h45) == 0 and len(students_8h45) == len(students):
        print(f"\n✅ SUCCÈS: Tous les étudiants sont bien de la classe 8h45!")
    else:
        print(f"\n⚠️ ATTENTION: Des étudiants de 10h45 sont visibles!")

if __name__ == '__main__':
    test_prof_mixte()
    test_prof_8h45()
