#!/usr/bin/env python3
"""
Script d'extraction complète des données du fichier Classe CORAN.xlsx
Extrait tous les étudiants et professeurs avec leur structure de classes.
"""

import pandas as pd
import re
from pathlib import Path
import unicodedata


def remove_accents(text):
    """Supprime les accents d'un texte."""
    return ''.join(c for c in unicodedata.normalize('NFD', text)
                  if unicodedata.category(c) != 'Mn')


def generate_username(prenom, nom):
    """Génère un nom d'utilisateur à partir du prénom et nom."""
    if not prenom or not nom:
        return None
    
    prenom_clean = remove_accents(prenom.lower().strip())
    nom_clean = remove_accents(nom.lower().strip())
    
    prenom_clean = re.sub(r'[^a-z0-9]', '', prenom_clean)
    nom_clean = re.sub(r'[^a-z0-9]', '', nom_clean)
    
    return f"{prenom_clean}_{nom_clean}"


def split_name(full_name):
    """Sépare un nom complet en prénom et nom de famille."""
    if not full_name or pd.isna(full_name):
        return None, None
    
    name = str(full_name).strip()
    name = re.sub(r'\s+', ' ', name)
    
    parts = name.split(' ')
    
    if len(parts) < 2:
        return parts[0], ""
    
    nom = parts[0]
    prenom = ' '.join(parts[1:])
    
    return prenom, nom


def extraire_etudiants_feuille(df, sheet_name, horaire):
    """Extrait les étudiants d'une feuille avec leurs informations."""
    print(f"\n📋 Extraction des étudiants de '{sheet_name}' ({horaire})")
    print("-" * 50)
    
    etudiants = []
    professeurs_uniques = set()
    
    # Identifier la colonne des professeurs
    col_prof = None
    if 'Prof' in df.columns:
        col_prof = 'Prof'
    elif 'Prof/Classe' in df.columns:
        col_prof = 'Prof/Classe'
    
    print(f"📝 Colonne professeur: {col_prof}")
    
    # Parcourir les étudiants
    for idx, row in df.iterrows():
        nom_complet = row['Nom et Prénom']
        
        if pd.isna(nom_complet) or not str(nom_complet).strip():
            continue
        
        # Séparer prénom et nom
        prenom, nom = split_name(nom_complet)
        
        if not prenom or not nom:
            print(f"⚠️  Ligne {idx + 2}: Impossible de séparer '{nom_complet}'")
            continue
        
        # Générer username
        username = generate_username(prenom, nom)
        
        # Récupérer le professeur
        professeur = None
        if col_prof and not pd.isna(row[col_prof]):
            prof_val = str(row[col_prof]).strip()
            if prof_val and prof_val not in ['nan', 'NaN', '']:
                professeur = prof_val
                professeurs_uniques.add(professeur)
        
        # Récupérer l'horaire de la ligne (si différent)
        horaire_ligne = horaire
        if 'Horaire' in df.columns and not pd.isna(row['Horaire']):
            horaire_val = str(row['Horaire']).strip()
            if horaire_val and horaire_val != horaire:
                horaire_ligne = horaire_val
        
        etudiant = {
            'nom_complet': nom_complet,
            'prenom': prenom,
            'nom': nom,
            'username': username,
            'horaire': horaire_ligne,
            'professeur': professeur,
            'feuille': sheet_name,
            'ligne': idx + 2
        }
        
        etudiants.append(etudiant)
        
        if len(etudiants) <= 5:  # Afficher les 5 premiers
            print(f"✓ {nom_complet} → {prenom} {nom} ({username}) - Prof: {professeur}")
    
    if len(etudiants) > 5:
        print(f"... et {len(etudiants) - 5} autres étudiants")
    
    print(f"📊 Total étudiants extraits: {len(etudiants)}")
    print(f"👨‍🏫 Professeurs trouvés: {len(professeurs_uniques)}")
    for prof in sorted(professeurs_uniques):
        print(f"   - {prof}")
    
    return etudiants, list(professeurs_uniques)


def analyser_professeurs(professeurs_8h45, professeurs_10h45):
    """Analyse les professeurs et crée leur structure."""
    print(f"\n👨‍🏫 ANALYSE DES PROFESSEURS")
    print("=" * 50)
    
    tous_professeurs = []
    
    # Professeurs 8h45
    print(f"\n⏰ Professeurs 8h45:")
    for prof in professeurs_8h45:
        if prof and prof.strip():
            prof_info = {
                'nom_complet': prof.strip(),
                'horaire': '8h45',
                'username': generate_username_prof(prof.strip()),
                'role': 'professeur'
            }
            tous_professeurs.append(prof_info)
            print(f"   - {prof} → {prof_info['username']}")
    
    # Professeurs 10h45
    print(f"\n⏰ Professeurs 10h45:")
    for prof in professeurs_10h45:
        if prof and prof.strip():
            prof_info = {
                'nom_complet': prof.strip(),
                'horaire': '10h45',
                'username': generate_username_prof(prof.strip()),
                'role': 'professeur'
            }
            tous_professeurs.append(prof_info)
            print(f"   - {prof} → {prof_info['username']}")
    
    return tous_professeurs


def generate_username_prof(nom_prof):
    """Génère un username pour un professeur."""
    if not nom_prof:
        return None
    
    # Nettoyer le nom
    nom_clean = remove_accents(nom_prof.lower().strip())
    nom_clean = re.sub(r'[^a-z0-9\s]', '', nom_clean)
    nom_clean = re.sub(r'\s+', '_', nom_clean)
    
    # Préfixer avec 'prof_'
    return f"prof_{nom_clean}"


def comparer_avec_import_precedent(nouveaux_etudiants):
    """Compare avec l'import précédent pour identifier les manquants."""
    print(f"\n🔍 COMPARAISON AVEC L'IMPORT PRÉCÉDENT")
    print("=" * 50)
    
    # Lire le fichier d'import précédent
    fichier_precedent = "classe_coran_import.xlsx"
    
    if not Path(fichier_precedent).exists():
        print(f"⚠️  Fichier précédent non trouvé: {fichier_precedent}")
        return nouveaux_etudiants, []
    
    try:
        df_precedent = pd.read_excel(fichier_precedent)
        usernames_precedents = set(df_precedent['Username'].tolist())
        
        print(f"📊 Import précédent: {len(usernames_precedents)} étudiants")
        
        # Identifier les nouveaux et manquants
        usernames_nouveaux = set(e['username'] for e in nouveaux_etudiants)
        
        manquants = usernames_precedents - usernames_nouveaux
        nouveaux = usernames_nouveaux - usernames_precedents
        
        print(f"📊 Analyse complète: {len(usernames_nouveaux)} étudiants")
        print(f"🆕 Nouveaux étudiants: {len(nouveaux)}")
        print(f"❌ Étudiants manquants: {len(manquants)}")
        
        if nouveaux:
            print(f"\n🆕 Nouveaux étudiants trouvés:")
            for etudiant in nouveaux_etudiants:
                if etudiant['username'] in nouveaux:
                    print(f"   + {etudiant['nom_complet']} ({etudiant['username']}) - {etudiant['horaire']}")
        
        if manquants:
            print(f"\n❌ Étudiants manquants (étaient dans l'import précédent):")
            for username in sorted(manquants):
                # Trouver les détails dans l'import précédent
                etudiant_precedent = df_precedent[df_precedent['Username'] == username]
                if not etudiant_precedent.empty:
                    row = etudiant_precedent.iloc[0]
                    print(f"   - {row['Prénom']} {row['Nom']} ({username})")
        
        return nouveaux_etudiants, list(manquants)
        
    except Exception as e:
        print(f"❌ Erreur lors de la comparaison: {e}")
        return nouveaux_etudiants, []


def creer_fichiers_import(tous_etudiants, tous_professeurs):
    """Crée les fichiers d'import pour étudiants et professeurs."""
    print(f"\n📁 CRÉATION DES FICHIERS D'IMPORT")
    print("=" * 50)
    
    # Fichier étudiants complet
    etudiants_data = []
    for etudiant in tous_etudiants:
        etudiants_data.append({
            'Prénom': etudiant['prenom'],
            'Nom': etudiant['nom'],
            'Username': etudiant['username'],
            'Email (optionnel)': '',
            'Classe (optionnel)': f"Classe CORAN {etudiant['horaire']} - {etudiant['professeur'] or 'Non assigné'}"
        })
    
    df_etudiants = pd.DataFrame(etudiants_data)
    fichier_etudiants = "classe_coran_complet_etudiants.xlsx"
    df_etudiants.to_excel(fichier_etudiants, index=False)
    print(f"✅ Fichier étudiants créé: {fichier_etudiants} ({len(df_etudiants)} étudiants)")
    
    # Fichier professeurs
    if tous_professeurs:
        profs_data = []
        for prof in tous_professeurs:
            # Séparer le nom du professeur
            prenom_prof, nom_prof = split_name(prof['nom_complet'])
            if not prenom_prof:
                prenom_prof = prof['nom_complet']
                nom_prof = "Professeur"
            
            profs_data.append({
                'Prénom': prenom_prof,
                'Nom': nom_prof,
                'Username': prof['username'],
                'Email (optionnel)': '',
                'Classe (optionnel)': f"Professeur CORAN {prof['horaire']}"
            })
        
        df_professeurs = pd.DataFrame(profs_data)
        fichier_professeurs = "classe_coran_professeurs.xlsx"
        df_professeurs.to_excel(fichier_professeurs, index=False)
        print(f"✅ Fichier professeurs créé: {fichier_professeurs} ({len(df_professeurs)} professeurs)")
    
    # Statistiques par horaire
    print(f"\n📊 STATISTIQUES PAR HORAIRE:")
    for horaire in ['8h45', '10h45']:
        etudiants_horaire = [e for e in tous_etudiants if e['horaire'] == horaire]
        profs_horaire = [p for p in tous_professeurs if p['horaire'] == horaire]
        
        print(f"   ⏰ {horaire}:")
        print(f"      👥 Étudiants: {len(etudiants_horaire)}")
        print(f"      👨‍🏫 Professeurs: {len(profs_horaire)}")
        
        # Grouper par professeur
        profs_etudiants = {}
        for etudiant in etudiants_horaire:
            prof = etudiant['professeur'] or 'Non assigné'
            if prof not in profs_etudiants:
                profs_etudiants[prof] = []
            profs_etudiants[prof].append(etudiant)
        
        for prof, etudiants in profs_etudiants.items():
            print(f"         - {prof}: {len(etudiants)} étudiants")


def main():
    """Point d'entrée principal"""
    fichier = "classe_coran_original.xlsx"
    
    if not Path(fichier).exists():
        print(f"❌ Fichier non trouvé: {fichier}")
        return
    
    print("🔍 EXTRACTION COMPLÈTE DES DONNÉES CLASSE CORAN")
    print("=" * 60)
    
    try:
        # Lire les deux feuilles
        df_10h45 = pd.read_excel(fichier, sheet_name='CORAN 1045')
        df_8h45 = pd.read_excel(fichier, sheet_name='CORAN 845')
        
        # Extraire les étudiants de chaque feuille
        etudiants_10h45, profs_10h45 = extraire_etudiants_feuille(df_10h45, 'CORAN 1045', '10h45')
        etudiants_8h45, profs_8h45 = extraire_etudiants_feuille(df_8h45, 'CORAN 845', '8h45')
        
        # Combiner tous les étudiants
        tous_etudiants = etudiants_10h45 + etudiants_8h45
        
        # Analyser les professeurs
        tous_professeurs = analyser_professeurs(profs_8h45, profs_10h45)
        
        # Comparer avec l'import précédent
        tous_etudiants, manquants = comparer_avec_import_precedent(tous_etudiants)
        
        # Créer les fichiers d'import
        creer_fichiers_import(tous_etudiants, tous_professeurs)
        
        print(f"\n✅ EXTRACTION TERMINÉE!")
        print(f"📊 Total: {len(tous_etudiants)} étudiants, {len(tous_professeurs)} professeurs")
        
    except Exception as e:
        print(f"❌ Erreur lors de l'extraction: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    main()