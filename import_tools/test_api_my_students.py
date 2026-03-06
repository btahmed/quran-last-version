#!/usr/bin/env python3
"""
Test rapide de l'API /api/my-students/
"""

import requests

API_BASE_URL = "http://127.0.0.1:8000/api"

# Test avec prof_ibrahim
username = "prof_ibrahim"
password = "VmbceZhq"

print(f"\nTest de l'API /api/my-students/ avec {username}")
print("="*60)

# 1. Connexion
print("\n1. Connexion...")
response = requests.post(
    f"{API_BASE_URL}/token/",
    json={"username": username, "password": password}
)

if response.status_code != 200:
    print(f"ERREUR: {response.status_code}")
    print(response.text)
    exit(1)

token = response.json()['access']
print(f"OK - Token obtenu")

# 2. Appel /api/my-students/
print("\n2. Appel /api/my-students/...")
response = requests.get(
    f"{API_BASE_URL}/my-students/",
    headers={"Authorization": f"Bearer {token}"}
)

print(f"Status: {response.status_code}")
print(f"Response: {response.text[:500]}")

if response.status_code == 200:
    data = response.json()
    
    # Vérifier le format
    if isinstance(data, dict):
        students = data.get('students', [])
        teacher_classes = data.get('teacher_classes', [])
        print(f"\nFormat: dict")
        print(f"Classes du professeur: {teacher_classes}")
        print(f"Nombre d'étudiants: {len(students)}")
    elif isinstance(data, list):
        students = data
        print(f"\nFormat: list")
        print(f"Nombre d'étudiants: {len(students)}")
    
    if students:
        print(f"\nPremiers étudiants:")
        for i, s in enumerate(students[:3]):
            print(f"  {i+1}. {s.get('first_name', 'N/A')} - {s.get('username', 'N/A')}")
else:
    print(f"\nERREUR: {response.status_code}")
    print(response.text)
