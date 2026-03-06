"""
Supprimer les 23 étudiants EN TROP pour avoir exactement 203 étudiants
ATTENTION: Ce script supprime définitivement des comptes utilisateurs!
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

# Liste des étudiants à supprimer (identifiés par identifier_etudiants_en_trop_simple.py)
ETUDIANTS_A_SUPPRIMER = [
    'abdelghafourewan_ali',
    'abdelghafourheline_ali',
    'etudiant',
    'fatimazahra_jmila',
    'fekairmalika_el',
    'haimeurmariam_el',
    'haimeurmohamed_el',
    'ibrahimykarim_ali',
    'idrissizakaria_el',
    'kabiraymen_el',
    'kabirilyas_el',
    'kabirziyad_el',
    'mahadjijoumanah_el',
    'mehadjimohamed_el',  # Sera renommé en mohamed_el_mehadji
    'meskimohamedamine_el',
    'mohamedayoub_asrih',
    'mohamedyanis_lallam',
    'qamariomar_el',
    'romdhanedaoud_ben',
    'romdhanekenza_ben',
    'romhdaneismail_ben',
    'sayane_toiybou1',  # Doublon de sayane_toiybou
    'test',
]

def main():
    print("\n" + "="*70)
    print("SUPPRESSION DES ÉTUDIANTS EN TROP")
    print("="*70)
    
    print(f"\n⚠️  ATTENTION: Ce script va supprimer {len(ETUDIANTS_A_SUPPRIMER)} comptes!")
    print("\nÉtudiants à supprimer:")
    for username in ETUDIANTS_A_SUPPRIMER:
        print(f"  - {username}")
    
    # Vérifier combien d'étudiants existent actuellement
    total_avant = User.objects.filter(role='student').count()
    print(f"\n📊 Étudiants actuels: {total_avant}")
    print(f"📊 Après suppression: {total_avant - len(ETUDIANTS_A_SUPPRIMER)}")
    print(f"📊 Objectif: 203 étudiants")
    
    # Demander confirmation
    print("\n" + "="*70)
    reponse = input("Voulez-vous continuer? (oui/non): ").strip().lower()
    
    if reponse not in ['oui', 'o', 'yes', 'y']:
        print("\n❌ Opération annulée")
        return
    
    print("\n" + "="*70)
    print("SUPPRESSION EN COURS...")
    print("="*70)
    
    supprimes = 0
    non_trouves = []
    
    for username in ETUDIANTS_A_SUPPRIMER:
        try:
            user = User.objects.get(username=username, role='student')
            user.delete()
            supprimes += 1
            print(f"  ✓ Supprimé: {username}")
        except User.DoesNotExist:
            non_trouves.append(username)
            print(f"  ⚠️  Non trouvé: {username}")
    
    print("\n" + "="*70)
    print("RÉSUMÉ")
    print("="*70)
    print(f"✓ Supprimés: {supprimes}")
    print(f"⚠️  Non trouvés: {len(non_trouves)}")
    
    if non_trouves:
        print("\nNon trouvés:")
        for username in non_trouves:
            print(f"  - {username}")
    
    # Vérifier le total final
    total_apres = User.objects.filter(role='student').count()
    print(f"\n📊 Total final: {total_apres} étudiants")
    
    if total_apres == 203:
        print("\n✅ PARFAIT! Nous avons exactement 203 étudiants!")
    elif total_apres == 201:
        print("\n⚠️  Il manque 2 étudiants (201 au lieu de 203)")
        print("   Raison: mohamed_el_mehadji n'existe pas encore")
        print("   Solution: Renommer mehadjimohamed_el → mohamed_el_mehadji")
    else:
        print(f"\n⚠️  Attention: {total_apres} étudiants (attendu: 203)")

if __name__ == '__main__':
    main()
