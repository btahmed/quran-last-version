"""
Créer les assignations spécifiques professeur → étudiants
en utilisant des sous-groupes Django

Format: Classe_8h45_Prof_Ibrahim
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

def creer_sous_groupe(classe_django, prof_username):
    """Créer un sous-groupe pour un professeur"""
    # Format: Classe_8h45_Prof_Ibrahim
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
    
    # Récupérer le professeur
    prof = User.objects.filter(username=prof_username).first()
    if not prof:
        print(f"  ❌ Professeur {prof_username} non trouvé")
        return 0, 0, []
    
    # Créer le sous-groupe
    sous_groupe = creer_sous_groupe(classe_django, prof_username)
    
    # Ajouter le professeur au sous-groupe
    prof.groups.add(sous_groupe)
    
    trouves = 0
    non_trouves = []
    
    for username in etudiants_usernames:
        student = User.objects.filter(username=username, role='student').first()
        
        if student:
            # Ajouter l'étudiant au sous-groupe
            student.groups.add(sous_groupe)
            trouves += 1
        else:
            non_trouves.append(username)
    
    return trouves, len(non_trouves), non_trouves

def main():
    print("\n" + "="*70)
    print("CRÉATION DES ASSIGNATIONS SPÉCIFIQUES PROFESSEUR → ÉTUDIANTS")
    print("="*70)
    
    # Parser le fichier
    assignations = parser_fichier_classes()
    
    total_trouves = 0
    total_non_trouves = 0
    tous_non_trouves = []
    
    # IMPORTANT: Mapper les noms de classe du fichier vers les noms Django
    # Le fichier dit "CLASSE 10h45" mais dans Django c'est peut-être "Classe_8h45"
    # On va traiter les deux et voir ce qui correspond
    
    print("\n" + "="*70)
    print("ÉTAPE 1: TRAITEMENT DES ASSIGNATIONS")
    print("="*70)
    
    # Traiter CLASSE 10h45 du fichier → Classe_8h45 Django (hypothèse)
    print("\n📚 ASSIGNATIONS DEPUIS 'CLASSE 10h45' DU FICHIER")
    print("   (Tentative avec Classe_8h45 Django)")
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
            print(f"  ❌ Non trouvés: {', '.join(non_trouves_list[:3])}" + 
                  (f" ... (+{len(non_trouves_list)-3})" if len(non_trouves_list) > 3 else ""))
    
    # Traiter CLASSE 8h45 du fichier → Classe_10h45 Django (hypothèse)
    print("\n📚 ASSIGNATIONS DEPUIS 'CLASSE 8h45' DU FICHIER")
    print("   (Tentative avec Classe_10h45 Django)")
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
            print(f"  ❌ Non trouvés: {', '.join(non_trouves_list[:3])}" + 
                  (f" ... (+{len(non_trouves_list)-3})" if len(non_trouves_list) > 3 else ""))
    
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
    
    for group in sous_groupes:
        prof_count = group.user_set.filter(role='teacher').count()
        student_count = group.user_set.filter(role='student').count()
        print(f"  {group.name}: {student_count} étudiants, {prof_count} prof")
    
    # Sauvegarder les non trouvés
    if tous_non_trouves:
        print("\n" + "="*70)
        print("ÉTUDIANTS NON TROUVÉS (à vérifier)")
        print("="*70)
        # Dédupliquer
        non_trouves_uniques = list(set(tous_non_trouves))
        for username in sorted(non_trouves_uniques):
            print(f"  - {username}")

if __name__ == '__main__':
    main()
