"""
Identifier les étudiants en TROP dans la base de données
Objectif: Avoir EXACTEMENT 203 étudiants (83 en 8h45 + 120 en 10h45)
"""
import os
import sys
import django

# Configuration Django
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'ancien django', 'MYSITEE', 'MYSITEE'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite.settings')
django.setup()

from django.contrib.auth import get_user_model
from parser_classes_coran import parser_fichier_classes

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

def main():
    print("\n" + "="*70)
    print("IDENTIFICATION DES ÉTUDIANTS EN TROP")
    print("="*70)
    
    # 1. Parser le fichier classes_coran.txt pour obtenir la liste ATTENDUE
    assignations = parser_fichier_classes()
    
    etudiants_attendus = set()
    
    # Collecter tous les étudiants du fichier
    for prof_name, etudiants in assignations['10h45'].items():
        for username in etudiants:
            username_corrige = corriger_username(username)
            etudiants_attendus.add(username_corrige)
    
    for prof_name, etudiants in assignations['8h45'].items():
        for username in etudiants:
            username_corrige = corriger_username(username)
            etudiants_attendus.add(username_corrige)
    
    print(f"\n📋 Étudiants ATTENDUS (dans classes_coran.txt): {len(etudiants_attendus)}")
    
    # 2. Récupérer tous les étudiants de la base de données
    etudiants_db = User.objects.filter(role='student')
    etudiants_db_usernames = set(etudiants_db.values_list('username', flat=True))
    
    print(f"📊 Étudiants ACTUELS (dans la base): {len(etudiants_db_usernames)}")
    
    # 3. Identifier les étudiants EN TROP (dans la base mais PAS dans le fichier)
    etudiants_en_trop = etudiants_db_usernames - etudiants_attendus
    
    print(f"\n❌ Étudiants EN TROP: {len(etudiants_en_trop)}")
    print(f"✅ Différence attendue: {len(etudiants_db_usernames)} - {len(etudiants_attendus)} = {len(etudiants_en_trop)}")
    
    if etudiants_en_trop:
        print("\n" + "="*70)
        print("LISTE DES ÉTUDIANTS À SUPPRIMER")
        print("="*70)
        
        for username in sorted(etudiants_en_trop):
            student = User.objects.get(username=username)
            print(f"  - {username} (ID: {student.id})")
        
        print("\n" + "="*70)
        print("VÉRIFICATION")
        print("="*70)
        print(f"Après suppression:")
        print(f"  Base de données: {len(etudiants_db_usernames)} - {len(etudiants_en_trop)} = {len(etudiants_db_usernames) - len(etudiants_en_trop)} étudiants")
        print(f"  Attendu: {len(etudiants_attendus)} étudiants")
        
        if len(etudiants_db_usernames) - len(etudiants_en_trop) == len(etudiants_attendus):
            print(f"\n✅ PARFAIT! Après suppression, nous aurons exactement {len(etudiants_attendus)} étudiants")
        else:
            print(f"\n⚠️ ATTENTION! Il y aura encore une différence")
    
    # 4. Identifier les étudiants MANQUANTS (dans le fichier mais PAS dans la base)
    etudiants_manquants = etudiants_attendus - etudiants_db_usernames
    
    if etudiants_manquants:
        print("\n" + "="*70)
        print("ÉTUDIANTS MANQUANTS (dans le fichier mais pas dans la base)")
        print("="*70)
        print(f"⚠️ {len(etudiants_manquants)} étudiants manquants:")
        for username in sorted(etudiants_manquants):
            print(f"  - {username}")
    
    # 5. Sauvegarder la liste dans un fichier
    output_file = os.path.join(os.path.dirname(__file__), 'output', 'etudiants_a_supprimer.txt')
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("ÉTUDIANTS À SUPPRIMER\n")
        f.write("="*70 + "\n\n")
        f.write(f"Total: {len(etudiants_en_trop)} étudiants\n\n")
        
        for username in sorted(etudiants_en_trop):
            student = User.objects.get(username=username)
            f.write(f"{username} (ID: {student.id})\n")
    
    print(f"\n📄 Liste sauvegardée dans: {output_file}")
    
    print("\n" + "="*70)
    print("PROCHAINE ÉTAPE")
    print("="*70)
    print("Pour supprimer ces étudiants, exécutez:")
    print("  python supprimer_etudiants_en_trop.py")

if __name__ == '__main__':
    main()
