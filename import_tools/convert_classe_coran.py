#!/usr/bin/env python3
"""
Script pour convertir le fichier "Classe CORAN.xlsx" au format d'import.

Ce script extrait les noms des étudiants et crée un fichier compatible
avec l'outil d'importation.
"""

import pandas as pd
import re
from pathlib import Path


def split_name(full_name):
    """
    Sépare un nom complet en prénom et nom de famille.
    Format attendu: "NOM Prénom" ou "NOM Prénom1 Prénom2"
    """
    if not full_name or pd.isna(full_name):
        return None, None
    
    # Nettoyer le nom (supprimer espaces multiples)
    name = str(full_name).strip()
    name = re.sub(r'\s+', ' ', name)
    
    # Séparer par espaces
    parts = name.split(' ')
    
    if len(parts) < 2:
        # Si un seul mot, considérer comme prénom
        return parts[0], ""
    
    # Premier mot = nom de famille (en majuscules généralement)
    # Reste = prénom(s)
    nom = parts[0]
    prenom = ' '.join(parts[1:])
    
    return prenom, nom


def generate_username(prenom, nom):
    """
    Génère un nom d'utilisateur à partir du prénom et nom.
    Format: prenom.nom (en minuscules, sans accents)
    """
    if not prenom or not nom:
        return None
    
    # Convertir en minuscules
    prenom_clean = prenom.lower().strip()
    nom_clean = nom.lower().strip()
    
    # Supprimer les accents et caractères spéciaux
    import unicodedata
    
    def remove_accents(text):
        return ''.join(c for c in unicodedata.normalize('NFD', text)
                      if unicodedata.category(c) != 'Mn')
    
    prenom_clean = remove_accents(prenom_clean)
    nom_clean = remove_accents(nom_clean)
    
    # Garder seulement les lettres et chiffres
    prenom_clean = re.sub(r'[^a-z0-9]', '', prenom_clean)
    nom_clean = re.sub(r'[^a-z0-9]', '', nom_clean)
    
    # Créer le username (remplacer le point par underscore)
    username = f"{prenom_clean}_{nom_clean}"
    
    return username


def convert_classe_coran(input_file, output_file):
    """
    Convertit le fichier Classe CORAN au format d'import.
    """
    print(f"📁 Lecture du fichier: {input_file}")
    
    # Lire le fichier Excel
    try:
        df = pd.read_excel(input_file)
    except Exception as e:
        print(f"❌ Erreur lecture fichier: {e}")
        return False
    
    print(f"✓ Trouvé {len(df)} lignes")
    
    # Vérifier que la colonne "Nom et Prénom" existe
    if 'Nom et Prénom' not in df.columns:
        print("❌ Colonne 'Nom et Prénom' non trouvée")
        print(f"Colonnes disponibles: {list(df.columns)}")
        return False
    
    # Extraire et traiter les noms
    students_data = []
    
    for idx, row in df.iterrows():
        full_name = row['Nom et Prénom']
        
        # Ignorer les lignes vides
        if pd.isna(full_name) or not str(full_name).strip():
            continue
        
        # Séparer prénom et nom
        prenom, nom = split_name(full_name)
        
        if not prenom or not nom:
            print(f"⚠️  Ligne {idx + 2}: Impossible de séparer '{full_name}'")
            continue
        
        # Générer username
        username = generate_username(prenom, nom)
        
        if not username:
            print(f"⚠️  Ligne {idx + 2}: Impossible de générer username pour '{full_name}'")
            continue
        
        students_data.append({
            'Prénom': prenom,
            'Nom': nom,
            'Username': username,
            'Email (optionnel)': '',
            'Classe (optionnel)': 'Classe CORAN'
        })
        
        print(f"✓ {full_name} → {prenom} {nom} ({username})")
    
    if not students_data:
        print("❌ Aucun étudiant valide trouvé")
        return False
    
    # Créer le DataFrame de sortie
    output_df = pd.DataFrame(students_data)
    
    # Vérifier les doublons de username
    duplicates = output_df[output_df.duplicated('Username', keep=False)]
    if not duplicates.empty:
        print("⚠️  Usernames en double détectés:")
        for _, dup in duplicates.iterrows():
            print(f"   - {dup['Username']} ({dup['Prénom']} {dup['Nom']})")
        
        # Ajouter des suffixes pour les doublons
        username_counts = {}
        for idx, row in output_df.iterrows():
            username = row['Username']
            if username in username_counts:
                username_counts[username] += 1
                new_username = f"{username}{username_counts[username]}"
                output_df.at[idx, 'Username'] = new_username
                print(f"   → Renommé en: {new_username}")
            else:
                username_counts[username] = 0
    
    # Sauvegarder
    try:
        output_df.to_excel(output_file, index=False)
        print(f"✅ Fichier créé: {output_file}")
        print(f"📊 {len(output_df)} étudiants convertis")
        return True
    except Exception as e:
        print(f"❌ Erreur sauvegarde: {e}")
        return False


def main():
    """Point d'entrée principal"""
    input_file = "classe_coran.xlsx"
    output_file = "classe_coran_import.xlsx"
    
    if not Path(input_file).exists():
        print(f"❌ Fichier non trouvé: {input_file}")
        return
    
    print("🔄 Conversion du fichier Classe CORAN...")
    print("=" * 50)
    
    success = convert_classe_coran(input_file, output_file)
    
    print("=" * 50)
    if success:
        print("✅ Conversion terminée avec succès!")
        print(f"📁 Fichier de sortie: {output_file}")
        print()
        print("Prochaines étapes:")
        print(f"1. Vérifier le fichier: {output_file}")
        print("2. Modifier si nécessaire (usernames, emails)")
        print(f"3. Tester: python cli.py {output_file} --dry-run")
        print(f"4. Importer: python cli.py {output_file}")
    else:
        print("❌ Échec de la conversion")


if __name__ == '__main__':
    main()