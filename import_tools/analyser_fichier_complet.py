#!/usr/bin/env python3
"""
Script d'analyse complète du fichier Classe CORAN.xlsx
Analyse toutes les pages et identifie les classes, professeurs et étudiants.
"""

import pandas as pd
import re
from pathlib import Path


def analyser_fichier_excel(fichier_path):
    """
    Analyse complète du fichier Excel avec toutes ses pages.
    """
    print(f"📁 Analyse du fichier: {fichier_path}")
    print("=" * 60)
    
    try:
        # Lire toutes les feuilles du fichier Excel
        excel_file = pd.ExcelFile(fichier_path)
        print(f"📊 Feuilles trouvées: {len(excel_file.sheet_names)}")
        
        for sheet_name in excel_file.sheet_names:
            print(f"   - {sheet_name}")
        
        print("\n" + "=" * 60)
        
        # Analyser chaque feuille
        toutes_donnees = {}
        
        for sheet_name in excel_file.sheet_names:
            print(f"\n🔍 Analyse de la feuille: '{sheet_name}'")
            print("-" * 40)
            
            df = pd.read_excel(fichier_path, sheet_name=sheet_name)
            print(f"📏 Dimensions: {df.shape[0]} lignes x {df.shape[1]} colonnes")
            
            # Afficher les colonnes
            print(f"📋 Colonnes:")
            for i, col in enumerate(df.columns):
                print(f"   {i+1}. {col}")
            
            # Afficher un aperçu des données
            print(f"\n👀 Aperçu des données (5 premières lignes):")
            print(df.head().to_string())
            
            # Chercher des patterns de professeurs et classes
            print(f"\n🔍 Recherche de patterns...")
            
            # Analyser le contenu pour identifier les structures
            analyser_contenu_feuille(df, sheet_name)
            
            toutes_donnees[sheet_name] = df
        
        return toutes_donnees
        
    except Exception as e:
        print(f"❌ Erreur lors de l'analyse: {e}")
        return None


def analyser_contenu_feuille(df, sheet_name):
    """
    Analyse le contenu d'une feuille pour identifier les patterns.
    """
    print(f"🔎 Analyse du contenu de '{sheet_name}':")
    
    # Chercher des mentions d'horaires
    horaires_trouves = []
    profs_trouves = []
    
    for col in df.columns:
        col_str = str(col).lower()
        if any(h in col_str for h in ['8h45', '8:45', '10h45', '10:45', 'heure', 'horaire']):
            horaires_trouves.append(col)
        if any(p in col_str for p in ['prof', 'enseignant', 'teacher', 'instructor']):
            profs_trouves.append(col)
    
    if horaires_trouves:
        print(f"   ⏰ Colonnes d'horaires trouvées: {horaires_trouves}")
    
    if profs_trouves:
        print(f"   👨‍🏫 Colonnes de professeurs trouvées: {profs_trouves}")
    
    # Analyser les données pour trouver des patterns
    for col in df.columns:
        if df[col].dtype == 'object':  # Colonnes de texte
            # Chercher des noms qui pourraient être des professeurs
            valeurs_uniques = df[col].dropna().unique()
            
            # Filtrer les valeurs qui ressemblent à des noms de professeurs
            noms_possibles = []
            for val in valeurs_uniques:
                val_str = str(val).strip()
                if len(val_str) > 2 and not val_str.isdigit():
                    # Vérifier si ça ressemble à un nom (contient des lettres)
                    if re.match(r'^[A-Za-zÀ-ÿ\s\-\.]+$', val_str):
                        noms_possibles.append(val_str)
            
            if noms_possibles and len(noms_possibles) < 20:  # Pas trop de valeurs
                print(f"   📝 Colonne '{col}' - Valeurs possibles:")
                for nom in sorted(noms_possibles)[:10]:  # Afficher max 10
                    print(f"      - {nom}")
                if len(noms_possibles) > 10:
                    print(f"      ... et {len(noms_possibles) - 10} autres")
    
    # Compter les lignes non vides
    lignes_non_vides = 0
    for _, row in df.iterrows():
        if not row.isna().all():
            lignes_non_vides += 1
    
    print(f"   📊 Lignes avec données: {lignes_non_vides}")


def identifier_structure_classes(toutes_donnees):
    """
    Identifie la structure des classes à partir des données analysées.
    """
    print(f"\n🏗️  IDENTIFICATION DE LA STRUCTURE DES CLASSES")
    print("=" * 60)
    
    structure_classes = {
        "8h45": [],
        "10h45": []
    }
    
    for sheet_name, df in toutes_donnees.items():
        print(f"\n📋 Feuille: {sheet_name}")
        
        # Déterminer l'horaire basé sur le nom de la feuille ou le contenu
        horaire = None
        if "8" in sheet_name or "8h45" in str(df.values).lower():
            horaire = "8h45"
        elif "10" in sheet_name or "10h45" in str(df.values).lower():
            horaire = "10h45"
        
        if horaire:
            print(f"   ⏰ Horaire identifié: {horaire}")
        else:
            print(f"   ❓ Horaire non identifié, analyse du contenu...")
        
        # Analyser les données pour extraire classes et professeurs
        classes_trouvees = extraire_classes_et_profs(df, sheet_name)
        
        if horaire and classes_trouvees:
            structure_classes[horaire].extend(classes_trouvees)
        elif classes_trouvees:
            # Si pas d'horaire identifié, demander à l'utilisateur ou deviner
            print(f"   ⚠️  Classes trouvées mais horaire incertain:")
            for classe in classes_trouvees:
                print(f"      - {classe}")
    
    return structure_classes


def extraire_classes_et_profs(df, sheet_name):
    """
    Extrait les classes et professeurs d'une feuille de données.
    """
    classes = []
    
    # Chercher la colonne des noms d'étudiants
    col_noms = None
    for col in df.columns:
        if 'nom' in str(col).lower() and 'prénom' in str(col).lower():
            col_noms = col
            break
    
    if col_noms:
        print(f"   👥 Colonne étudiants trouvée: {col_noms}")
        
        # Compter les étudiants
        etudiants = df[col_noms].dropna()
        print(f"   📊 Nombre d'étudiants: {len(etudiants)}")
        
        # Chercher des colonnes qui pourraient contenir des noms de professeurs
        for col in df.columns:
            if col != col_noms and df[col].dtype == 'object':
                valeurs = df[col].dropna().unique()
                
                # Filtrer les valeurs qui ressemblent à des noms de professeurs
                for val in valeurs:
                    val_str = str(val).strip()
                    if (len(val_str) > 5 and 
                        not val_str.isdigit() and 
                        ' ' in val_str and
                        not any(x in val_str.lower() for x in ['classe', 'coran', 'total', 'moyenne'])):
                        
                        classe_info = {
                            'feuille': sheet_name,
                            'professeur': val_str,
                            'nb_etudiants': len(etudiants),
                            'colonne_prof': col
                        }
                        classes.append(classe_info)
                        print(f"   👨‍🏫 Professeur trouvé: {val_str} (colonne: {col})")
    
    return classes


def main():
    """Point d'entrée principal"""
    fichier = "classe_coran_original.xlsx"
    
    if not Path(fichier).exists():
        print(f"❌ Fichier non trouvé: {fichier}")
        return
    
    print("🔍 ANALYSE COMPLÈTE DU FICHIER CLASSE CORAN")
    print("=" * 60)
    
    # Analyser le fichier
    toutes_donnees = analyser_fichier_excel(fichier)
    
    if toutes_donnees:
        # Identifier la structure des classes
        structure = identifier_structure_classes(toutes_donnees)
        
        print(f"\n📋 RÉSUMÉ DE LA STRUCTURE IDENTIFIÉE")
        print("=" * 60)
        
        for horaire, classes in structure.items():
            print(f"\n⏰ Classes de {horaire}:")
            if classes:
                for i, classe in enumerate(classes, 1):
                    print(f"   {i}. Professeur: {classe['professeur']}")
                    print(f"      Étudiants: {classe['nb_etudiants']}")
                    print(f"      Feuille: {classe['feuille']}")
            else:
                print(f"   Aucune classe trouvée")
        
        print(f"\n✅ Analyse terminée!")
        print(f"📁 Données sauvegardées pour traitement ultérieur")
        
        return toutes_donnees
    else:
        print(f"❌ Échec de l'analyse")
        return None


if __name__ == '__main__':
    main()