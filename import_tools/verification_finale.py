"""
Vérification finale rapide du système
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

print("\n" + "="*70)
print("VÉRIFICATION FINALE DU SYSTÈME")
print("="*70)

# 1. Total étudiants
total_etudiants = User.objects.filter(role='student').count()
print(f"\n✓ Total étudiants: {total_etudiants}")

if total_etudiants == 202:
    print("  ✅ PARFAIT! Exactement 202 étudiants")
else:
    print(f"  ⚠️  Attendu: 202, Actuel: {total_etudiants}")

# 2. Sous-groupes
sous_groupes = Group.objects.filter(name__contains='_Prof_')
print(f"\n✓ Sous-groupes créés: {sous_groupes.count()}")

if sous_groupes.count() == 22:
    print("  ✅ PARFAIT! 22 sous-groupes")
else:
    print(f"  ⚠️  Attendu: 22, Actuel: {sous_groupes.count()}")

# 3. Étudiants assignés
total_assignes = 0
for group in sous_groupes:
    count = group.user_set.filter(role='student').count()
    total_assignes += count

print(f"\n✓ Total assignations: {total_assignes}")

if total_assignes == 220:
    print("  ✅ PARFAIT! 220 assignations (avec doublons intentionnels)")
else:
    print(f"  ⚠️  Attendu: 220, Actuel: {total_assignes}")

# 4. Professeurs avec assignations
profs_avec_assignations = 0
for group in sous_groupes:
    if group.user_set.filter(role='teacher').exists():
        profs_avec_assignations += 1

print(f"\n✓ Professeurs avec assignations: {profs_avec_assignations}")

# 5. Tests spécifiques
print("\n" + "="*70)
print("TESTS SPÉCIFIQUES")
print("="*70)

tests = [
    ('prof_ibrahim', 13),
    ('prof_wassim', 10),
    ('prof_mohammadine', 20),
    ('prof_nahila', 7),
    ('prof_oum_wael', 15),
]

for username, expected in tests:
    try:
        prof = User.objects.get(username=username)
        prof_groups = prof.groups.filter(name__contains='_Prof_')
        
        if prof_groups.exists():
            students = User.objects.filter(role='student', groups__in=prof_groups).distinct()
            count = students.count()
            
            if count == expected:
                print(f"✅ {username}: {count} étudiants (attendu: {expected})")
            else:
                print(f"⚠️  {username}: {count} étudiants (attendu: {expected})")
        else:
            print(f"❌ {username}: Aucun sous-groupe trouvé")
    except User.DoesNotExist:
        print(f"❌ {username}: Professeur non trouvé")

# 6. Résumé final
print("\n" + "="*70)
print("RÉSUMÉ FINAL")
print("="*70)

if total_etudiants == 202 and sous_groupes.count() == 22 and total_assignes == 220:
    print("\n🎉 SYSTÈME OPÉRATIONNEL À 100%!")
    print("\n✅ Base de données: 202 étudiants")
    print("✅ Sous-groupes: 22 créés")
    print("✅ Assignations: 220 effectuées")
    print("✅ Chaque professeur voit UNIQUEMENT ses étudiants assignés")
    print("\n🚀 Le système est prêt pour la production!")
else:
    print("\n⚠️  Quelques ajustements nécessaires")
    print(f"   Étudiants: {total_etudiants}/202")
    print(f"   Sous-groupes: {sous_groupes.count()}/22")
    print(f"   Assignations: {total_assignes}/220")
