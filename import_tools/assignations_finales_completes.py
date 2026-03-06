"""
Assignations finales avec TOUS les étudiants (224)
Utilise les corrections de usernames
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
from parser_classes_coran import parser_fichier_classes, mapper_nom_prof_vers_username

User = get_user_model()

# Mapping des corrections (fichier → base de données)
CORRECTIONS = {
    'aïcha_hamidi': 'aicha_hamidi',
    'haretha_abdellah_ba': 'baharetha_abdellah',
    'inés_adjtoutah': 'ines_adjtoutah',
    'kaïs_redradj': 'kais_redradj',
    'khail_wahidouallah_jabar': 'jabarkhail_wahidouallah',
    'leïla_rahmaoui': 'leila_rahmaoui',
    'mohamed_marjani_omar': 'omarmohamed_marjani',
    'oumaïma_soltani': 'oumaima_soltani',
    'rokia_ferrera_neves': 'nevesrokia_ferrera',
    'tasnime_ben_ali': 'alitasnime_ben',
    'tasnime_ferrera_neves': 'nevestasnime_ferrera',
    'tayssir_ben_ali': 'alitayssir_ben',
    'youssef_ben_ali': 'aliyoussef_ben',
}

def corriger_username(username):
    """Appliquer les corrections de username"""
    return CORRECTIONS.get(username, username)

def creer_sous_groupe(classe_django, prof_username):
    """Créer un sous-groupe pour un professeur"""
    prof_name = prof_username.replace('prof_', '').replace('_', ' ').title().replace(' ', '')
    group_name = f"{classe_django}_Prof_{prof_name}"
    
    group, created = Group.objects.get_or_create(name=group_name)
    
    if created:
        print(f"  ✓ Groupe créé: {group_name}")
    else:
        print(f"  ○ Groupe existe: {group_name}")
    
    return group

def assigner_etudiants_sous_groupe(prof_username, etudiants_usernames, classe_django):
    """Assigner des étudiants au sous-groupe d'un professeur"""
    
    prof = User.objects.filter(username=prof_username).first()
    if not prof:
        print(f"  ❌ Professeur {prof_username} non trouvé")
        return 0, 0, []
    
    sous_groupe = creer_sous_groupe(classe_django, prof_username)
    prof.groups.add(sous_groupe)
    
    trouves = 0
    non_trouves = []
    
    for username_fichier in etudiants_usernames:
        # Appliquer les corrections
        username_db = corriger_username(username_fichier)
        
        student = User.objects.filter(username=username_db, role='student').first()
        
        if student:
            student.groups.add(sous_groupe)
            trouves += 1
        else:
            non_trouves.append(f"{username_fichier} → {username_db}")
    
    return trouves, len(non_trouves), non_trouves

def main():
    print("\n" + "="*70)
    print("ASSIGNATIONS FINALES COMPLÈTES - TOUS LES ÉTUDIANTS")
    print("="*70)
    
    # Parser le fichier
    assignations = parser_fichier_classes()
    
    total_trouves = 0
    total_non_trouves = 0
    tous_non_trouves = []
    
    print("\n" + "="*70)
    print("TRAITEMENT DES ASSIGNATIONS")
    print("="*70)
    
    # Traiter CLASSE 10h45 du fichier → Classe_8h45 Django
    print("\n📚 ASSIGNATIONS DEPUIS 'CLASSE 10h45' DU FICHIER")
    print("   (Classe_8h45 Django)")
    print("-" * 70)
    
    for prof_name, etudiants in assignations['10h45'].items():
        prof_username = mapper_nom_prof_vers_username(prof_name)
        print(f"\n👨‍🏫 {prof_username} ({prof_name}): {len(etudiants)} étudiants")
        
        trouves, non_trouves_count, non_trouves_list = assigner_etudiants_sous_groupe(
            prof_username, etudiants, 'Classe_8h45'
        )
        
        total_trouves += trouves
        total_non_trouves += non_trouves_count
        tous_non_trouves.extend(non_trouves_list)
        
        print(f"  ✓ Trouvés: {trouves}/{len(etudiants)}")
        if non_trouves_list:
            print(f"  ❌ Non trouvés:")
            for nt in non_trouves_list[:3]:
                print(f"     - {nt}")
            if len(non_trouves_list) > 3:
                print(f"     ... (+{len(non_trouves_list)-3})")
    
    # Traiter CLASSE 8h45 du fichier → Classe_10h45 Django
    print("\n📚 ASSIGNATIONS DEPUIS 'CLASSE 8h45' DU FICHIER")
    print("   (Classe_10h45 Django)")
    print("-" * 70)
    
    for prof_name, etudiants in assignations['8h45'].items():
        prof_username = mapper_nom_prof_vers_username(prof_name)
        print(f"\n👨‍🏫 {prof_username} ({prof_name}): {len(etudiants)} étudiants")
        
        trouves, non_trouves_count, non_trouves_list = assigner_etudiants_sous_groupe(
            prof_username, etudiants, 'Classe_10h45'
        )
        
        total_trouves += trouves
        total_non_trouves += non_trouves_count
        tous_non_trouves.extend(non_trouves_list)
        
        print(f"  ✓ Trouvés: {trouves}/{len(etudiants)}")
        if non_trouves_list:
            print(f"  ❌ Non trouvés:")
            for nt in non_trouves_list[:3]:
                print(f"     - {nt}")
            if len(non_trouves_list) > 3:
                print(f"     ... (+{len(non_trouves_list)-3})")
    
    print("\n" + "="*70)
    print("RÉSUMÉ")
    print("="*70)
    print(f"✓ Étudiants assignés: {total_trouves}")
    print(f"❌ Étudiants non trouvés: {total_non_trouves}")
    
    if total_trouves + total_non_trouves > 0:
        taux = total_trouves/(total_trouves+total_non_trouves)*100
        print(f"📊 Taux de réussite: {taux:.1f}%")
    
    # Afficher les groupes créés
    print("\n" + "="*70)
    print("SOUS-GROUPES CRÉÉS")
    print("="*70)
    sous_groupes = Group.objects.filter(name__contains='_Prof_').order_by('name')
    
    total_assignes = 0
    for group in sous_groupes:
        student_count = group.user_set.filter(role='student').count()
        total_assignes += student_count
        print(f"  {group.name}: {student_count} étudiants")
    
    print(f"\n📊 Total étudiants assignés (via sous-groupes): {total_assignes}")
    print(f"📊 Total étudiants dans la base: {User.objects.filter(role='student').count()}")
    
    if tous_non_trouves:
        print("\n" + "="*70)
        print("ÉTUDIANTS NON TROUVÉS")
        print("="*70)
        non_trouves_uniques = list(set(tous_non_trouves))
        for username in sorted(non_trouves_uniques):
            print(f"  - {username}")

if __name__ == '__main__':
    main()
