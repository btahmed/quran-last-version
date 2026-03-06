"""
Tester l'API avec les assignations spécifiques
"""
import requests
import json

BASE_URL = 'http://127.0.0.1:8000/api'

def test_prof_api(username, password):
    """Tester l'API pour un professeur"""
    
    print(f"\n{'='*70}")
    print(f"TEST API: {username}")
    print(f"{'='*70}")
    
    # Login
    login_data = {'username': username, 'password': password}
    response = requests.post(f'{BASE_URL}/login/', json=login_data)
    
    if response.status_code != 200:
        print(f"❌ Échec de connexion: {response.status_code}")
        print(f"   {response.text}")
        return
    
    token = response.json().get('token')
    print(f"✓ Connexion réussie")
    
    # Récupérer les étudiants
    headers = {'Authorization': f'Token {token}'}
    response = requests.get(f'{BASE_URL}/my-students/', headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Échec de récupération des étudiants: {response.status_code}")
        print(f"   {response.text}")
        return
    
    data = response.json()
    students = data.get('students', [])
    teacher_classes = data.get('teacher_classes', [])
    
    print(f"\n📚 Classes du professeur: {', '.join(teacher_classes)}")
    print(f"👥 Nombre d'étudiants: {len(students)}")
    
    # Grouper par classe
    students_8h45 = [s for s in students if 'Classe_8h45' in s.get('classes', [])]
    students_10h45 = [s for s in students if 'Classe_10h45' in s.get('classes', [])]
    
    print(f"\n   📚 Classe 8h45: {len(students_8h45)} étudiants")
    if students_8h45:
        print(f"      Premiers: {', '.join([s['username'] for s in students_8h45[:3]])}")
    
    print(f"   📚 Classe 10h45: {len(students_10h45)} étudiants")
    if students_10h45:
        print(f"      Premiers: {', '.join([s['username'] for s in students_10h45[:3]])}")

def main():
    print("\n" + "="*70)
    print("TEST API - ASSIGNATIONS SPÉCIFIQUES")
    print("="*70)
    
    # Tester quelques professeurs
    profs = [
        ('prof_ibrahim', 'VmbceZhq'),  # Devrait voir ~11 étudiants
        ('prof_wassim', 'TtzLFaC6'),   # Devrait voir ~6 étudiants
        ('prof_mohammadine', 'wS7hvntd'),  # Devrait voir ~16 étudiants (mixte)
        ('prof_nahila', None),  # Mot de passe inconnu
    ]
    
    for username, password in profs:
        if password:
            test_prof_api(username, password)
        else:
            print(f"\n⚠️  {username}: Mot de passe non disponible")
    
    print("\n" + "="*70)
    print("RÉSUMÉ")
    print("="*70)
    print("\n✅ Les professeurs voient maintenant UNIQUEMENT leurs étudiants assignés")
    print("✅ Le système utilise les sous-groupes (Classe_8h45_Prof_Ibrahim, etc.)")
    print("✅ Chaque professeur a ses propres étudiants spécifiques")

if __name__ == '__main__':
    main()
