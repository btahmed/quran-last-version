"""
Script principal pour nettoyer la base et avoir EXACTEMENT 203 étudiants
Étapes:
1. Renommer mehadjimohamed_el → mohamed_el_mehadji
2. Supprimer les 22 autres étudiants en trop
3. Vérifier le total final
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

# Liste des étudiants à supprimer (SANS mehadjimohamed_el qui sera renommé)
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
    # 'mehadjimohamed_el',  # SERA RENOMMÉ, PAS SUPPRIMÉ
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
    print("NETTOYAGE DE LA BASE - OBJECTIF: 203 ÉTUDIANTS")
    print("="*70)
    
    total_avant = User.objects.filter(role='student').count()
    print(f"\n📊 État actuel: {total_avant} étudiants")
    print(f"📊 Objectif: 203 étudiants")
    print(f"📊 À supprimer: {len(ETUDIANTS_A_SUPPRIMER)} étudiants")
    print(f"📊 À renommer: 1 étudiant (mehadjimohamed_el → mohamed_el_mehadji)")
    
    print("\n" + "="*70)
    print("ÉTAPE 1: RENOMMER mehadjimohamed_el")
    print("="*70)
    
    ancien_username = 'mehadjimohamed_el'
    nouveau_username = 'mohamed_el_mehadji'
    
    try:
        user = User.objects.get(username=ancien_username)
        print(f"✓ Trouvé: {ancien_username}")
        
        if User.objects.filter(username=nouveau_username).exists():
            print(f"⚠️  Le username '{nouveau_username}' existe déjà, skip renommage")
        else:
            user.username = nouveau_username
            user.save()
            print(f"✓ Renommé: {ancien_username} → {nouveau_username}")
    except User.DoesNotExist:
        print(f"⚠️  '{ancien_username}' non trouvé")
    
    print("\n" + "="*70)
    print("ÉTAPE 2: SUPPRIMER LES ÉTUDIANTS EN TROP")
    print("="*70)
    
    print(f"\nÉtudiants à supprimer ({len(ETUDIANTS_A_SUPPRIMER)}):")
    for username in ETUDIANTS_A_SUPPRIMER[:5]:
        print(f"  - {username}")
    if len(ETUDIANTS_A_SUPPRIMER) > 5:
        print(f"  ... (+{len(ETUDIANTS_A_SUPPRIMER)-5} autres)")
    
    # Demander confirmation
    print("\n⚠️  ATTENTION: Cette opération est IRRÉVERSIBLE!")
    reponse = input("Voulez-vous continuer? (oui/non): ").strip().lower()
    
    if reponse not in ['oui', 'o', 'yes', 'y']:
        print("\n❌ Opération annulée")
        return
    
    print("\nSuppression en cours...")
    
    supprimes = 0
    non_trouves = []
    
    for username in ETUDIANTS_A_SUPPRIMER:
        try:
            user = User.objects.get(username=username, role='student')
            user.delete()
            supprimes += 1
            print(f"  ✓ {username}")
        except User.DoesNotExist:
            non_trouves.append(username)
            print(f"  ⚠️  Non trouvé: {username}")
    
    print("\n" + "="*70)
    print("RÉSUMÉ")
    print("="*70)
    print(f"✓ Renommés: 1")
    print(f"✓ Supprimés: {supprimes}")
    print(f"⚠️  Non trouvés: {len(non_trouves)}")
    
    # Vérifier le total final
    total_apres = User.objects.filter(role='student').count()
    print(f"\n📊 Total final: {total_apres} étudiants")
    
    if total_apres == 203:
        print("\n✅ PARFAIT! Nous avons exactement 203 étudiants!")
        print("\n🎯 Prochaine étape:")
        print("   python assignations_finales_completes.py")
        print("   (pour réassigner les 203 étudiants aux sous-groupes)")
    else:
        difference = total_apres - 203
        if difference > 0:
            print(f"\n⚠️  Il reste {difference} étudiants en trop")
        else:
            print(f"\n⚠️  Il manque {-difference} étudiants")

if __name__ == '__main__':
    main()
