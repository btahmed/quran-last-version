"""
Parser le fichier classes_coran.txt pour extraire les assignations
professeur → étudiants
"""
import re

def parser_fichier_classes(filepath=None):
    """Parser le fichier et retourner les assignations"""
    
    if filepath is None:
        # Chercher le fichier à la racine du workspace
        import os
        filepath = os.path.join(os.path.dirname(__file__), '..', '..', 'classes_coran.txt')
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    assignations = {
        '8h45': {},
        '10h45': {}
    }
    
    # Extraire les deux classes (avec accolades imbriquées)
    # Trouver le début de chaque classe
    classe_10h45_start = content.find('CLASSE 10h45 {')
    classe_8h45_start = content.find('CLASSE 8h45 {')
    
    # Extraire le contenu entre les accolades principales
    if classe_10h45_start != -1:
        # Trouver l'accolade fermante correspondante
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
        """Extraire les professeurs et leurs étudiants d'une classe"""
        profs = {}
        
        # Trouver tous les blocs Prof X { ... }
        prof_pattern = r'Prof ([^{]+)\{([^}]+)\}'
        
        for match in re.finditer(prof_pattern, classe_content):
            prof_name = match.group(1).strip()
            etudiants_text = match.group(2).strip()
            
            # Extraire les usernames des étudiants (lignes non vides)
            etudiants = [
                line.strip() 
                for line in etudiants_text.split('\n') 
                if line.strip()
            ]
            
            profs[prof_name] = etudiants
        
        return profs
    
    if classe_10h45_content:
        assignations['10h45'] = extraire_profs_etudiants(classe_10h45_content)
    
    if classe_8h45_content:
        assignations['8h45'] = extraire_profs_etudiants(classe_8h45_content)
    
    return assignations

def mapper_nom_prof_vers_username(nom_prof):
    """Mapper le nom du prof vers son username"""
    mapping = {
        'Nahila': 'prof_nahila',
        'Camilia': 'prof_camilia',
        'Abdallah': 'prof_abdallah',
        'Youssef': 'prof_youssef',
        'Ahmed Mahjoubi': 'prof_ahmed_mahjoubi',
        'Abdelhadi': 'prof_abdelhadi',
        'Ahmed': 'prof_ahmed',
        'Mohammadine': 'prof_mohammadine',
        'Abou Fadi': 'prof_abou_fadi',
        'Ibrahim': 'prof_ibrahim',
        'Najlaa': 'prof_najlaa',
        'Salsabile': 'prof_salsabile',
        'Oum Wael': 'prof_oum_wael',
        'Oum Amine': 'prof_oum_amine',
        'Salahdine': 'prof_salahdine',
        'Abou Abdellatif': 'prof_abou_abdellatif',
        'Abou Mostafa': 'prof_abou_mostafa',
        'Wassim': 'prof_wassim',
    }
    
    return mapping.get(nom_prof, f"prof_{nom_prof.lower().replace(' ', '_')}")

if __name__ == '__main__':
    print("\n" + "="*60)
    print("PARSING DU FICHIER classes_coran.txt")
    print("="*60)
    
    assignations = parser_fichier_classes()
    
    print("\n📚 CLASSE 10h45:")
    print("-" * 60)
    for prof_name, etudiants in assignations['10h45'].items():
        prof_username = mapper_nom_prof_vers_username(prof_name)
        print(f"\n{prof_username} ({prof_name}): {len(etudiants)} étudiants")
        print(f"  Premiers: {', '.join(etudiants[:3])}")
    
    print("\n📚 CLASSE 8h45:")
    print("-" * 60)
    for prof_name, etudiants in assignations['8h45'].items():
        prof_username = mapper_nom_prof_vers_username(prof_name)
        print(f"\n{prof_username} ({prof_name}): {len(etudiants)} étudiants")
        print(f"  Premiers: {', '.join(etudiants[:3])}")
    
    # Statistiques
    total_10h45 = sum(len(e) for e in assignations['10h45'].values())
    total_8h45 = sum(len(e) for e in assignations['8h45'].values())
    
    print("\n" + "="*60)
    print("STATISTIQUES")
    print("="*60)
    print(f"Classe 10h45: {len(assignations['10h45'])} professeurs, {total_10h45} assignations")
    print(f"Classe 8h45: {len(assignations['8h45'])} professeurs, {total_8h45} assignations")
