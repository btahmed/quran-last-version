"""
Tester les assignations spécifiques professeur → étudiants
"""
import os
import sys
import django

# Configuration Django
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'ancien django', 'MYSITEE', 'MYSITEE'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

def test_prof_assignations(prof_username):
    """Tester les assignations d'un professeur"""
    
    prof = User.objects.filter(username=prof_username).first()
    if not prof:
        print(f"❌ Professeur {prof_username} non trouvé")
        return
    
    print(f"\n{'='*70}")
    print(f"PROFESSEUR: {prof_username}")
    print(f"{'='*70}")
    
    # Récupérer les groupes du professeur
    all_groups = list(prof.groups.values_list('name', flat=True))
    print(f"\n📋 Tous les groupes: {', '.join(all_groups)}")
    
    # Groupes de classe généraux
    classe_groups = prof.groups.filter(name__in=['Classe_8h45', 'Classe_10h45'])
    print(f"📚 Classes générales: {', '.join(classe_groups.values_list('name', flat=True))}")
    
    # Sous-groupes spécifiques
    prof_groups = prof.groups.filter(name__contains='_Prof_')
    print(f"👨‍🏫 Sous-groupes spécifiques: {', '.join(prof_groups.values_list('name', flat=True))}")
    
    if prof_groups.exists():
        # Récupérer les étudiants via les sous-groupes
        students = User.objects.filter(
            role='student',
            groups__in=prof_groups
        ).distinct()
        
        print(f"\n✅ ASSIGNATIONS SPÉCIFIQUES ACTIVES")
        print(f"   Nombre d'étudiants assignés: {students.count()}")
        
        # Grouper par classe
        students_8h45 = students.filter(groups__name='Classe_8h45')
        students_10h45 = students.filter(groups__name='Classe_10h45')
        
        print(f"\n   📚 Classe 8h45: {students_8h45.count()} étudiants")
        if students_8h45.exists():
            print(f"      Premiers: {', '.join([s.username for s in students_8h45[:3]])}")
        
        print(f"   📚 Classe 10h45: {students_10h45.count()} étudiants")
        if students_10h45.exists():
            print(f"      Premiers: {', '.join([s.username for s in students_10h45[:3]])}")
    else:
        print(f"\n⚠️  PAS D'ASSIGNATIONS SPÉCIFIQUES")
        print(f"   Le professeur verra TOUS les étudiants de ses classes")
        
        # Compter via les classes générales
        students = User.objects.filter(
            role='student',
            groups__in=classe_groups
        ).distinct()
        print(f"   Nombre total d'étudiants: {students.count()}")

def main():
    print("\n" + "="*70)
    print("TEST DES ASSIGNATIONS SPÉCIFIQUES")
    print("="*70)
    
    # Tester quelques professeurs
    profs_a_tester = [
        'prof_ibrahim',
        'prof_wassim',
        'prof_mohammadine',
        'prof_nahila',
        'prof_oum_wael',
    ]
    
    for prof_username in profs_a_tester:
        test_prof_assignations(prof_username)
    
    print("\n" + "="*70)
    print("RÉSUMÉ DES SOUS-GROUPES")
    print("="*70)
    
    from django.contrib.auth.models import Group
    sous_groupes = Group.objects.filter(name__contains='_Prof_').order_by('name')
    
    print(f"\nTotal: {sous_groupes.count()} sous-groupes créés\n")
    
    for group in sous_groupes:
        prof_count = group.user_set.filter(role='teacher').count()
        student_count = group.user_set.filter(role='student').count()
        print(f"  {group.name}: {student_count} étudiants")

if __name__ == '__main__':
    main()
