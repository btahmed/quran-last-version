"""
Identifier les étudiants en TROP dans la base de données (version simple sans Django)
Objectif: Avoir EXACTEMENT 203 étudiants
"""
import os
import sys
import sqlite3

# Chemin vers la base de données
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'ancien django', 'MYSITEE', 'MYSITEE', 'db.sqlite3')

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

def parser_fichier_classes():
    """Parser le fichier classes_coran.txt"""
    import re
    
    filepath = os.path.join(os.path.dirname(__file__), '..', '..', 'classes_coran.txt')
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    assignations = {
        '8h45': {},
        '10h45': {}
    }
    
    # Extraire les deux classes
    classe_10h45_start = content.find('CLASSE 10h45 {')
    classe_8h45_start = content.find('CLASSE 8h45 {')
    
    if classe_10h45_start != -1:
        start = classe_10h45_start + len('CLASSE 10h45 {')
        end = classe_8h45_start if classe_8h45_start != -1 else len(content)
        classe_10h45_content = content[start:end].rsplit('}', 1)[0]
    else:
        classe_10h45_content = ''
    
    if classe_8h45_start != -1:
        start = classe_8h45_start + len('CLASSE 8h45 {')
        classe_8h45_content = content[start:].rsplit('}', 1)[0]
    else:
        classe_8h45_content = ''
    
    def extraire_profs_etudiants(classe_content):
        profs = {}
        prof_pattern = r'Prof ([^{]+)\{([^}]+)\}'
        
        for match in re.finditer(prof_pattern, classe_content):
            prof_name = match.group(1).strip()
            etudiants_text = match.group(2).strip()
            etudiants = [line.strip() for line in etudiants_text.split('\n') if line.strip()]
            profs[prof_name] = etudiants
        
        return profs
    
    if classe_10h45_content:
        assignations['10h45'] = extraire_profs_etudiants(classe_10h45_content)
    
    if classe_8h45_content:
        assignations['8h45'] = extraire_profs_etudiants(classe_8h45_content)
    
    return assignations

def main():
    print("\n" + "="*70)
    print("IDENTIFICATION DES ÉTUDIANTS EN TROP")
    print("="*70)
    
    # 1. Parser le fichier classes_coran.txt
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
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("SELECT username FROM tasks_user WHERE role = 'student'")
    etudiants_db_usernames = set(row[0] for row in cursor.fetchall())
    
    conn.close()
    
    print(f"📊 Étudiants ACTUELS (dans la base): {len(etudiants_db_usernames)}")
    
    # 3. Identifier les étudiants EN TROP
    etudiants_en_trop = etudiants_db_usernames - etudiants_attendus
    
    print(f"\n❌ Étudiants EN TROP: {len(etudiants_en_trop)}")
    print(f"✅ Différence: {len(etudiants_db_usernames)} - {len(etudiants_attendus)} = {len(etudiants_en_trop)}")
    
    if etudiants_en_trop:
        print("\n" + "="*70)
        print("LISTE DES ÉTUDIANTS À SUPPRIMER")
        print("="*70)
        
        for username in sorted(etudiants_en_trop):
            print(f"  - {username}")
        
        print("\n" + "="*70)
        print("VÉRIFICATION")
        print("="*70)
        print(f"Après suppression:")
        print(f"  Base: {len(etudiants_db_usernames)} - {len(etudiants_en_trop)} = {len(etudiants_db_usernames) - len(etudiants_en_trop)} étudiants")
        print(f"  Attendu: {len(etudiants_attendus)} étudiants")
        
        if len(etudiants_db_usernames) - len(etudiants_en_trop) == len(etudiants_attendus):
            print(f"\n✅ PARFAIT! Après suppression: {len(etudiants_attendus)} étudiants")
        else:
            print(f"\n⚠️ ATTENTION! Il y aura encore une différence")
    
    # 4. Identifier les étudiants MANQUANTS
    etudiants_manquants = etudiants_attendus - etudiants_db_usernames
    
    if etudiants_manquants:
        print("\n" + "="*70)
        print("ÉTUDIANTS MANQUANTS")
        print("="*70)
        print(f"⚠️ {len(etudiants_manquants)} étudiants manquants:")
        for username in sorted(etudiants_manquants):
            print(f"  - {username}")
    
    # 5. Sauvegarder la liste
    output_file = os.path.join(os.path.dirname(__file__), 'output', 'etudiants_a_supprimer.txt')
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("ÉTUDIANTS À SUPPRIMER\n")
        f.write("="*70 + "\n\n")
        f.write(f"Total: {len(etudiants_en_trop)} étudiants\n\n")
        
        for username in sorted(etudiants_en_trop):
            f.write(f"{username}\n")
    
    print(f"\n📄 Liste sauvegardée: {output_file}")

if __name__ == '__main__':
    main()
