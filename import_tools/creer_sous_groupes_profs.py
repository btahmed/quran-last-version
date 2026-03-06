"""
Créer des sous-groupes pour chaque professeur
Format: Classe_8h45_Prof_Ibrahim

Cela permet de filtrer les étudiants par professeur spécifique
tout en gardant le système de groupes Django existant.
"""
import os
import sys
import django

# Configuration Django
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'ancien django', 'MYSITEE', 'MYSITEE'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group

User = get_user_model()

# Données depuis Classes_CORAN.md - Liste complète des assignations
ASSIGNATIONS_8H45 = {
    'prof_ibrahim': [
        'salma_aneflous', 'ferriel_azzeddine', 'ritaj_baida', 'yasmine_benathmane',
        # ... (à compléter avec tous les usernames)
    ],
    'prof_wassim': [
        'ritaj_baida', 'yasmine_benathmane', 'lina_miled', 'imene_abada',
        'janna_abada', 'anais_redradj'
    ],
    # ... autres professeurs
}

ASSIGNATIONS_10H45 = {
    'prof_abou_fadi': [
        'test'  # Le seul étudiant de 10h45
    ],
    # ... autres professeurs de 10h45
}

def creer_sous_groupe(classe, prof_username):
    """Créer un sous-groupe pour un professeur"""
    # Format: Classe_8h45_Prof_Ibrahim
    prof_name = prof_username.replace('prof_', '').capitalize()
    group_name = f"{classe}_Prof_{prof_name}"
    
    group, created = Group.objects.get_or_create(name=group_name)
    
    if created:
        print(f"✓ Groupe créé: {group_name}")
    else:
        print(f"  Groupe existe: {group_name}")
    
    return group

def assigner_etudiants_sous_groupe(prof_username, etudiants_usernames, classe):
    """Assigner des étudiants au sous-groupe d'un professeur"""
    
    # Récupérer le professeur
    prof = User.objects.filter(username=prof_username).first()
    if not prof:
        print(f"❌ Professeur {prof_username} non trouvé")
        return 0, 0
    
    # Créer le sous-groupe
    sous_groupe = creer_sous_groupe(classe, prof_username)
    
    # Ajouter le professeur au sous-groupe
    prof.groups.add(sous_groupe)
    
    print(f"\n👨‍🏫 {prof_username} → {sous_groupe.name}")
    
    trouves = 0
    non_trouves = 0
    
    for username in etudiants_usernames:
        student = User.objects.filter(username=username, role='student').first()
        
        if student:
            # Ajouter l'étudiant au sous-groupe
            student.groups.add(sous_groupe)
            trouves += 1
            print(f"  ✓ {username}")
        else:
            non_trouves += 1
            print(f"  ❌ Non trouvé: {username}")
    
    return trouves, non_trouves

def main():
    print("\n" + "="*60)
    print("CRÉATION DES SOUS-GROUPES PAR PROFESSEUR")
    print("="*60)
    
    total_trouves = 0
    total_non_trouves = 0
    
    # Classe 8h45
    print("\n📚 CLASSE 8H45")
    print("-" * 60)
    for prof_username, etudiants in ASSIGNATIONS_8H45.items():
        trouves, non_trouves = assigner_etudiants_sous_groupe(
            prof_username, etudiants, 'Classe_8h45'
        )
        total_trouves += trouves
        total_non_trouves += non_trouves
    
    # Classe 10h45
    print("\n📚 CLASSE 10H45")
    print("-" * 60)
    for prof_username, etudiants in ASSIGNATIONS_10H45.items():
        trouves, non_trouves = assigner_etudiants_sous_groupe(
            prof_username, etudiants, 'Classe_10h45'
        )
        total_trouves += trouves
        total_non_trouves += non_trouves
    
    print("\n" + "="*60)
    print("RÉSUMÉ")
    print("="*60)
    print(f"✓ Étudiants assignés: {total_trouves}")
    print(f"❌ Étudiants non trouvés: {total_non_trouves}")
    
    if total_trouves + total_non_trouves > 0:
        print(f"📊 Taux de réussite: {total_trouves/(total_trouves+total_non_trouves)*100:.1f}%")
    
    # Afficher les groupes créés
    print("\n📋 Groupes créés:")
    sous_groupes = Group.objects.filter(name__contains='_Prof_')
    for group in sous_groupes:
        count = group.user_set.filter(role='student').count()
        print(f"  - {group.name}: {count} étudiants")

if __name__ == '__main__':
    main()
