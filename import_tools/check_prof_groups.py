"""
Vérifier les groupes de prof_ibrahim
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

def check_groups():
    prof = User.objects.filter(username='prof_ibrahim').first()
    
    if not prof:
        print("❌ prof_ibrahim non trouvé")
        return
    
    print(f"✓ Utilisateur: {prof.username}")
    print(f"  - Rôle: {prof.role}")
    print(f"  - Superuser: {prof.is_superuser}")
    print(f"  - Staff: {prof.is_staff}")
    
    groups = prof.groups.all()
    print(f"\n✓ Groupes ({groups.count()}):")
    for group in groups:
        print(f"  - {group.name}")
    
    # Vérifier les classes spécifiquement
    classe_groups = prof.groups.filter(name__in=['Classe_8h45', 'Classe_10h45'])
    print(f"\n✓ Classes ({classe_groups.count()}):")
    for group in classe_groups:
        print(f"  - {group.name}")

if __name__ == '__main__':
    check_groups()
