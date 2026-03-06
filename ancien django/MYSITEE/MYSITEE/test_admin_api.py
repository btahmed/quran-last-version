#!/usr/bin/env python
"""
Test de l'API pour vérifier le compte administrateur
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000"

# 1. Login
print("🔐 Connexion...")
response = requests.post(f"{BASE_URL}/api/token/", json={
    "username": "administrateur",
    "password": "admin123"
})

if response.status_code == 200:
    tokens = response.json()
    access_token = tokens['access']
    print("✅ Connexion réussie!")
    
    # 2. Get user info
    print("\n👤 Récupération des informations utilisateur...")
    response = requests.get(f"{BASE_URL}/api/me/", headers={
        "Authorization": f"Bearer {access_token}"
    })
    
    if response.status_code == 200:
        user_data = response.json()
        print("✅ Informations utilisateur:")
        print(json.dumps(user_data, indent=2, ensure_ascii=False))
        
        print(f"\n📊 Résumé:")
        print(f"  - Username: {user_data.get('username')}")
        print(f"  - Role: {user_data.get('role')}")
        print(f"  - is_superuser: {user_data.get('is_superuser')}")
        print(f"  - is_staff: {user_data.get('is_staff')}")
    else:
        print(f"❌ Erreur: {response.status_code}")
        print(response.text)
else:
    print(f"❌ Échec de connexion: {response.status_code}")
    print(response.text)
