"""
Corriger le username: mehadjimohamed_el → mohamed_el_mehadji
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

def main():
    print("\n" + "="*70)
    print("CORRECTION DU USERNAME")
    print("="*70)
    
    ancien_username = 'mehadjimohamed_el'
    nouveau_username = 'mohamed_el_mehadji'
    
    print(f"\nAncien: {ancien_username}")
    print(f"Nouveau: {nouveau_username}")
    
    try:
        user = User.objects.get(username=ancien_username)
        print(f"\n✓ Utilisateur trouvé:")
        print(f"  ID: {user.id}")
        print(f"  Username: {user.username}")
        print(f"  Role: {user.role}")
        
        # Vérifier que le nouveau username n'existe pas déjà
        if User.objects.filter(username=nouveau_username).exists():
            print(f"\n❌ ERREUR: Le username '{nouveau_username}' existe déjà!")
            return
        
        # Demander confirmation
        reponse = input("\nVoulez-vous renommer cet utilisateur? (oui/non): ").strip().lower()
        
        if reponse not in ['oui', 'o', 'yes', 'y']:
            print("\n❌ Opération annulée")
            return
        
        # Renommer
        user.username = nouveau_username
        user.save()
        
        print(f"\n✅ Username modifié avec succès!")
        print(f"   {ancien_username} → {nouveau_username}")
        
    except User.DoesNotExist:
        print(f"\n❌ Utilisateur '{ancien_username}' non trouvé")

if __name__ == '__main__':
    main()
