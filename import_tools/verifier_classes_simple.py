#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de vérification simplifié des classes CORAN
"""

import os
import sys
import django

# Configuration Django
sys.path.insert(0, os.path.abspath('../ancien django/MYSITEE/MYSITEE'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite.settings')
django.setup()

from django.contrib.auth.models import Group
from tasks.models import User

def main():
    """Vérification rapide des statistiques"""
    
    print("\n" + "="*60)
    print("VERIFICATION RAPIDE DES CLASSES CORAN")
    print("="*60)
    
    # Statistiques générales
    print("\n1. STATISTIQUES GENERALES")
    print("-" * 60)
    
    total_users = User.objects.count()
    total_students = User.objects.filter(role='student').count()
    total_teachers = User.objects.filter(role='teacher').count()
    
    print(f"Total utilisateurs: {total_users}")
    print(f"Total etudiants: {total_students}")
    print(f"Total professeurs: {total_teachers}")
    
    # Statistiques par classe
    print("\n2. REPARTITION PAR CLASSE")
    print("-" * 60)
    
    try:
        classe_8h45 = Group.objects.get(name='Classe_8h45')
        classe_10h45 = Group.objects.get(name='Classe_10h45')
        
        etudiants_8h45 = classe_8h45.user_set.filter(role='student').count()
        profs_8h45 = classe_8h45.user_set.filter(role='teacher').count()
        
        etudiants_10h45 = classe_10h45.user_set.filter(role='student').count()
        profs_10h45 = classe_10h45.user_set.filter(role='teacher').count()
        
        print(f"\nClasse 8h45:")
        print(f"  - Etudiants: {etudiants_8h45}")
        print(f"  - Professeurs: {profs_8h45}")
        
        print(f"\nClasse 10h45:")
        print(f"  - Etudiants: {etudiants_10h45}")
        print(f"  - Professeurs: {profs_10h45}")
        
    except Group.DoesNotExist as e:
        print(f"ERREUR: Groupe non trouve - {e}")
        return False
    
    # Liste des professeurs par classe
    print("\n3. PROFESSEURS PAR CLASSE")
    print("-" * 60)
    
    print("\nClasse 8h45:")
    for prof in classe_8h45.user_set.filter(role='teacher').order_by('username'):
        print(f"  - {prof.username} ({prof.first_name})")
    
    print("\nClasse 10h45:")
    for prof in classe_10h45.user_set.filter(role='teacher').order_by('username'):
        print(f"  - {prof.username} ({prof.first_name})")
    
    # Professeurs mixtes
    print("\n4. PROFESSEURS MIXTES (enseignent dans les 2 classes)")
    print("-" * 60)
    
    profs_mixtes = User.objects.filter(
        role='teacher',
        groups__name__in=['Classe_8h45', 'Classe_10h45']
    ).annotate(
        nb_classes=django.db.models.Count('groups')
    ).filter(nb_classes=2)
    
    if profs_mixtes.exists():
        for prof in profs_mixtes:
            print(f"  - {prof.username} ({prof.first_name})")
    else:
        print("  Aucun professeur mixte trouve")
    
    # Vérification des étudiants sans classe
    print("\n5. ETUDIANTS SANS CLASSE")
    print("-" * 60)
    
    etudiants_sans_classe = User.objects.filter(
        role='student'
    ).exclude(
        groups__name__in=['Classe_8h45', 'Classe_10h45']
    )
    
    if etudiants_sans_classe.exists():
        print(f"ATTENTION: {etudiants_sans_classe.count()} etudiants sans classe!")
        for etudiant in etudiants_sans_classe[:10]:
            print(f"  - {etudiant.username} ({etudiant.first_name} {etudiant.last_name})")
        if etudiants_sans_classe.count() > 10:
            print(f"  ... et {etudiants_sans_classe.count() - 10} autres")
    else:
        print("OK: Tous les etudiants ont une classe")
    
    # Vérification des professeurs sans classe
    print("\n6. PROFESSEURS SANS CLASSE")
    print("-" * 60)
    
    profs_sans_classe = User.objects.filter(
        role='teacher'
    ).exclude(
        groups__name__in=['Classe_8h45', 'Classe_10h45']
    )
    
    if profs_sans_classe.exists():
        print(f"ATTENTION: {profs_sans_classe.count()} professeurs sans classe!")
        for prof in profs_sans_classe:
            print(f"  - {prof.username} ({prof.first_name})")
    else:
        print("OK: Tous les professeurs ont une classe")
    
    # Résumé final
    print("\n" + "="*60)
    print("RESUME")
    print("="*60)
    
    total_attendu_8h45 = 204  # Selon le fichier Classes_CORAN.md
    total_attendu_10h45 = 1   # Selon le fichier Classes_CORAN.md (seulement Test User)
    
    print(f"\nClasse 8h45:")
    print(f"  Attendu: {total_attendu_8h45} etudiants")
    print(f"  Actuel: {etudiants_8h45} etudiants")
    if etudiants_8h45 == total_attendu_8h45:
        print("  Status: OK")
    else:
        print(f"  Status: DIFFERENCE de {abs(etudiants_8h45 - total_attendu_8h45)}")
    
    print(f"\nClasse 10h45:")
    print(f"  Attendu: ~{total_attendu_10h45} etudiant(s)")
    print(f"  Actuel: {etudiants_10h45} etudiants")
    
    print("\n" + "="*60)
    
    return True


if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\nERREUR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
