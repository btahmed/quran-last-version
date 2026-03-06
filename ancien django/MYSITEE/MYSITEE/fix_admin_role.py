#!/usr/bin/env python
"""
Script pour corriger le rôle de l'utilisateur administrateur
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Trouver l'utilisateur administrateur
try:
    admin_user = User.objects.get(username='administrateur')
    
    print(f"Utilisateur trouvé: {admin_user.username}")
    print(f"Rôle actuel: {admin_user.role}")
    print(f"is_superuser: {admin_user.is_superuser}")
    print(f"is_staff: {admin_user.is_staff}")
    
    # Corriger le rôle
    admin_user.role = 'teacher'  # ou 'student' selon votre modèle
    admin_user.is_superuser = True
    admin_user.is_staff = True
    admin_user.save()
    
    print("\n✅ Rôle corrigé!")
    print(f"Nouveau rôle: {admin_user.role}")
    print(f"is_superuser: {admin_user.is_superuser}")
    print(f"is_staff: {admin_user.is_staff}")
    
except User.DoesNotExist:
    print("❌ Utilisateur 'administrateur' introuvable")
except Exception as e:
    print(f"❌ Erreur: {e}")
