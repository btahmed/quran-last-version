"""
Test du format de réponse de l'API my-students
"""
import os
import sys
import django
import requests

# Configuration Django
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'ancien django', 'MYSITEE', 'MYSITEE'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

def test_api_format():
    """Tester le format de réponse de l'API"""
    
    # Trouver un professeur
    prof = User.objects.filter(role='teacher', username='prof_ibrahim').first()
    
    if not prof:
        print("❌ Professeur prof_ibrahim non trouvé")
        return
    
    print(f"✓ Test avec: {prof.username}")
    
    # Obtenir un token JWT
    login_url = "http://127.0.0.1:8000/api/token/"
    login_data = {
        "username": "prof_ibrahim",
        "password": "VmbceZhq"  # Mot de passe depuis nouveaux_credentials_professeurs.csv
    }
    
    try:
        login_response = requests.post(login_url, json=login_data, timeout=5)
        if login_response.status_code != 200:
            print(f"❌ Échec de connexion: {login_response.text}")
            return
        
        token_data = login_response.json()
        access_token = token_data.get('access')
        print(f"✓ Token obtenu: {access_token[:30]}...")
    except Exception as e:
        print(f"❌ Erreur de connexion: {e}")
        return
    
    # Tester l'API
    url = "http://127.0.0.1:8000/api/my-students/"
    headers = {"Authorization": f"Bearer {access_token}"}
    
    try:
        response = requests.get(url, headers=headers, timeout=5)
        print(f"\n✓ Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\n✓ Format de réponse:")
            print(f"  - Type: {type(data)}")
            
            if isinstance(data, dict):
                print(f"  - Clés: {list(data.keys())}")
                if 'students' in data:
                    print(f"  - Nombre d'étudiants: {len(data['students'])}")
                    if data['students']:
                        print(f"  - Premier étudiant: {data['students'][0]}")
                if 'teacher_classes' in data:
                    print(f"  - Classes du prof: {data['teacher_classes']}")
            elif isinstance(data, list):
                print(f"  - Nombre d'éléments: {len(data)}")
                if data:
                    print(f"  - Premier élément: {data[0]}")
        else:
            print(f"❌ Erreur: {response.text}")
            
    except Exception as e:
        print(f"❌ Erreur de connexion: {e}")

if __name__ == '__main__':
    test_api_format()
