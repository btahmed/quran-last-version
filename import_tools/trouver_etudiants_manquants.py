"""
Trouver les 18 étudiants manquants et proposer des corrections
"""
import os
import sys
import django
from difflib import get_close_matches

# Configuration Django
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'ancien django', 'MYSITEE', 'MYSITEE'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite.settings')
django.setup()

from django.contrib.auth import get_user_model
from parser_classes_coran import parser_fichier_classes

User = get_user_model()

# Liste des 35 usernames non trouvés (du rapport)
NON_TROUVES = [
    'amine_el_meski_mohamed',
    'aymen_el_kabir',
    'ayoub_asrih_mohamed',
    'aïcha_hamidi',
    'daoud_ben_romdhane',
    'ewan_ali_abdelghafour',
    'haretha_abdellah_ba',
    'heline_ali_abdelghafour',
    'ilyas_el_kabir',
    'inés_adjtoutah',
    'ismaïl_ben_romhdane',
    'joumanah_el_mahadji',
    'karim_ali_ibrahimy',
    'kaïs_redradj',
    'kenza_ben_romdhane',
    'khail_wahidouallah_jabar',
    'leïla_rahmaoui',
    'malika_el_fekair',
    'mariam_el_haimeur',
    'mohamed_el_haimeur',
    'mohamed_el_mehadji',
    'mohamed_marjani_omar',
    'omar_el_qamari',
    'oumaïma_soltani',
    'rokia_ferrera_neves',
    'tasnime_ben_ali',
    'tasnime_ferrera_neves',
    'tayssir_ben_ali',
    'yanis_lallam_mohamed',
    'youssef_ben_ali',
    'zahra_jmila_fatima',
    'zakaria_el_idrissi',
    'ziyad_el_kabir',
]

def normaliser_username(username):
    """Normaliser un username pour la comparaison"""
    # Remplacer les caractères accentués
    replacements = {
        'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
        'à': 'a', 'â': 'a', 'ä': 'a',
        'ï': 'i', 'î': 'i',
        'ô': 'o', 'ö': 'o',
        'ù': 'u', 'û': 'u', 'ü': 'u',
        'ç': 'c',
        'ñ': 'n',
    }
    
    result = username.lower()
    for old, new in replacements.items():
        result = result.replace(old, new)
    
    return result

def main():
    print("\n" + "="*70)
    print("RECHERCHE DES ÉTUDIANTS MANQUANTS")
    print("="*70)
    
    # Récupérer tous les étudiants de la base
    tous_etudiants = User.objects.filter(role='student')
    print(f"\n📊 Total étudiants dans la base: {tous_etudiants.count()}")
    
    # Créer une liste de tous les usernames existants
    usernames_existants = list(tous_etudiants.values_list('username', flat=True))
    
    print(f"\n🔍 Recherche de correspondances pour {len(NON_TROUVES)} usernames...")
    print("-" * 70)
    
    corrections = []
    vraiment_manquants = []
    
    for username_fichier in NON_TROUVES:
        # Normaliser pour la recherche
        username_normalise = normaliser_username(username_fichier)
        
        # Chercher des correspondances proches
        matches = get_close_matches(username_normalise, 
                                    [normaliser_username(u) for u in usernames_existants],
                                    n=3, cutoff=0.7)
        
        if matches:
            # Trouver les usernames originaux correspondants
            matches_originaux = []
            for match in matches:
                for u in usernames_existants:
                    if normaliser_username(u) == match:
                        matches_originaux.append(u)
                        break
            
            print(f"\n❓ {username_fichier}")
            print(f"   Correspondances possibles:")
            for i, match in enumerate(matches_originaux, 1):
                print(f"   {i}. {match}")
            
            corrections.append({
                'fichier': username_fichier,
                'suggestions': matches_originaux
            })
        else:
            print(f"\n❌ {username_fichier}")
            print(f"   Aucune correspondance trouvée")
            vraiment_manquants.append(username_fichier)
    
    print("\n" + "="*70)
    print("RÉSUMÉ")
    print("="*70)
    print(f"✓ Corrections possibles: {len(corrections)}")
    print(f"❌ Vraiment manquants: {len(vraiment_manquants)}")
    
    if vraiment_manquants:
        print("\n📋 Étudiants vraiment manquants (n'existent pas dans la base):")
        for username in vraiment_manquants:
            print(f"  - {username}")
    
    # Sauvegarder les corrections dans un fichier
    print("\n💾 Sauvegarde des corrections...")
    with open('corrections_usernames.txt', 'w', encoding='utf-8') as f:
        f.write("CORRECTIONS DE USERNAMES\n")
        f.write("="*70 + "\n\n")
        
        for corr in corrections:
            f.write(f"Fichier: {corr['fichier']}\n")
            f.write(f"Suggestions:\n")
            for sugg in corr['suggestions']:
                f.write(f"  - {sugg}\n")
            f.write("\n")
        
        if vraiment_manquants:
            f.write("\nVRAIMENT MANQUANTS:\n")
            f.write("-"*70 + "\n")
            for username in vraiment_manquants:
                f.write(f"  - {username}\n")
    
    print(f"✓ Fichier créé: corrections_usernames.txt")

if __name__ == '__main__':
    main()
