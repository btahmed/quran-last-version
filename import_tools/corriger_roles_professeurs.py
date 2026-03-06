#!/usr/bin/env python3
"""
Script pour corriger les rôles des professeurs
Tous les comptes prof_* doivent avoir le rôle 'teacher' au lieu de 'student'
"""

import os
import sys
import django
from pathlib import Path

# Configuration Django
project_root = Path(__file__).parent.parent / "ancien django" / "MYSITEE" / "MYSITEE"
sys.path.append(str(project_root))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite.settings')

try:
    django.setup()
except Exception as e:
    print(f"❌ Erreur configuration Django: {e}")
    sys.exit(1)

from tasks.models import User
from django.db import transaction


def corriger_roles_professeurs():
    """Corrige les rôles des professeurs"""
    print("🔧 CORRECTION DES RÔLES PROFESSEURS")
    print("="*60)
    
    # Trouver tous les utilisateurs avec username commençant par 'prof_'
    professeurs = User.objects.filter(username__startswith='prof_')
    
    print(f"📊 {professeurs.count()} comptes professeurs trouvés")
    
    stats = {
        'corriges': 0,
        'deja_corrects': 0,
        'erreurs': []
    }
    
    with transaction.atomic():
        for prof in professeurs:
            try:
                if prof.role != 'teacher':
                    ancien_role = prof.role
                    prof.role = 'teacher'
                    prof.save()
                    stats['corriges'] += 1
                    print(f"✅ {prof.username}: {ancien_role} → teacher")
                else:
                    stats['deja_corrects'] += 1
                    print(f"ℹ️  {prof.username}: déjà teacher")
                    
            except Exception as e:
                error_msg = f"Erreur {prof.username}: {e}"
                stats['erreurs'].append(error_msg)
                print(f"❌ {error_msg}")
    
    print("\n📊 STATISTIQUES")
    print("="*30)
    print(f"✅ Corrigés: {stats['corriges']}")
    print(f"ℹ️  Déjà corrects: {stats['deja_corrects']}")
    
    if stats['erreurs']:
        print(f"\n❌ Erreurs ({len(stats['erreurs'])}):")
        for erreur in stats['erreurs']:
            print(f"   - {erreur}")
    else:
        print("\n✅ Aucune erreur")
    
    return stats['corriges'] > 0 or stats['deja_corrects'] > 0


def verifier_roles():
    """Vérifie les rôles après correction"""
    print("\n🔍 VÉRIFICATION DES RÔLES")
    print("="*40)
    
    # Compter par rôle
    nb_students = User.objects.filter(role='student').count()
    nb_teachers = User.objects.filter(role='teacher').count()
    nb_autres = User.objects.exclude(role__in=['student', 'teacher']).count()
    
    print(f"👨‍🎓 Étudiants: {nb_students}")
    print(f"👨‍🏫 Professeurs: {nb_teachers}")
    print(f"🔧 Autres: {nb_autres}")
    
    # Lister les professeurs
    professeurs = User.objects.filter(role='teacher').order_by('username')
    print(f"\n👨‍🏫 Liste des professeurs ({professeurs.count()}):")
    for prof in professeurs:
        print(f"   - {prof.username} ({prof.first_name} {prof.last_name})")


def main():
    """Point d'entrée principal"""
    success = corriger_roles_professeurs()
    verifier_roles()
    
    if success:
        print("\n🎉 Correction terminée!")
        print("ℹ️  Relancez configurer_permissions_classes.py pour mettre à jour les groupes")
    else:
        print("\n❌ Correction échouée")


if __name__ == "__main__":
    main()