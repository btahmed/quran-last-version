#!/usr/bin/env python3
"""
Script final pour créer les imports corrects avec la bonne structure.
"""

import pandas as pd
from pathlib import Path


def analyser_et_corriger():
    """Analyse et corrige les fichiers d'import."""
    print("🔧 CORRECTION ET CRÉATION DES IMPORTS FINAUX")
    print("=" * 60)
    
    # Lire le fichier complet
    fichier_complet = "classe_coran_complet_etudiants.xlsx"
    if not Path(fichier_complet).exists():
        print(f"❌ Fichier non trouvé: {fichier_complet}")
        return
    
    df_complet = pd.read_excel(fichier_complet)
    print(f"📊 Total étudiants dans le fichier: {len(df_complet)}")
    
    # Analyser les classes pour identifier les horaires
    print(f"\n🔍 Analyse des classes:")
    classes_8h45 = []
    classes_10h45 = []
    
    for classe in df_complet['Classe (optionnel)'].unique():
        nb_etudiants = len(df_complet[df_complet['Classe (optionnel)'] == classe])
        print(f"   - {classe}: {nb_etudiants} étudiants")
        
        if "8.45" in str(classe):
            classes_8h45.append(classe)
        elif "10.45" in str(classe):
            classes_10h45.append(classe)
    
    print(f"\n📊 Répartition corrigée:")
    etudiants_8h45 = df_complet[df_complet['Classe (optionnel)'].str.contains("8.45", na=False)]
    etudiants_10h45 = df_complet[df_complet['Classe (optionnel)'].str.contains("10.45", na=False)]
    
    print(f"   ⏰ 8h45: {len(etudiants_8h45)} étudiants")
    print(f"   ⏰ 10h45: {len(etudiants_10h45)} étudiants")
    
    return etudiants_8h45, etudiants_10h45, df_complet


def comparer_avec_import_precedent(df_complet):
    """Compare avec l'import précédent pour identifier les nouveaux."""
    print(f"\n🔍 COMPARAISON AVEC IMPORT PRÉCÉDENT")
    print("=" * 50)
    
    fichier_precedent = "classe_coran_import.xlsx"
    if not Path(fichier_precedent).exists():
        print(f"⚠️  Fichier précédent non trouvé")
        return df_complet, pd.DataFrame()
    
    df_precedent = pd.read_excel(fichier_precedent)
    usernames_precedents = set(df_precedent['Username'].tolist())
    
    # Identifier les nouveaux
    df_nouveaux = df_complet[~df_complet['Username'].isin(usernames_precedents)]
    df_existants = df_complet[df_complet['Username'].isin(usernames_precedents)]
    
    print(f"📊 Import précédent: {len(df_precedent)} étudiants")
    print(f"📊 Import complet: {len(df_complet)} étudiants")
    print(f"🆕 Nouveaux étudiants: {len(df_nouveaux)}")
    print(f"✅ Étudiants existants: {len(df_existants)}")
    
    # Analyser les nouveaux par horaire
    nouveaux_8h45 = df_nouveaux[df_nouveaux['Classe (optionnel)'].str.contains("8.45", na=False)]
    nouveaux_10h45 = df_nouveaux[df_nouveaux['Classe (optionnel)'].str.contains("10.45", na=False)]
    
    print(f"\n🆕 Nouveaux étudiants par horaire:")
    print(f"   ⏰ 8h45: {len(nouveaux_8h45)} nouveaux")
    print(f"   ⏰ 10h45: {len(nouveaux_10h45)} nouveaux")
    
    return df_existants, df_nouveaux


def creer_fichiers_imports_finaux():
    """Crée les fichiers d'import finaux organisés."""
    print(f"\n📁 CRÉATION DES FICHIERS D'IMPORT FINAUX")
    print("=" * 50)
    
    # Analyser les données
    etudiants_8h45, etudiants_10h45, df_complet = analyser_et_corriger()
    df_existants, df_nouveaux = comparer_avec_import_precedent(df_complet)
    
    # 1. Fichier des nouveaux étudiants seulement (pour import)
    if len(df_nouveaux) > 0:
        fichier_nouveaux = "IMPORT_nouveaux_etudiants.xlsx"
        df_nouveaux.to_excel(fichier_nouveaux, index=False)
        print(f"✅ {fichier_nouveaux}: {len(df_nouveaux)} nouveaux étudiants")
        
        # Statistiques des nouveaux
        nouveaux_8h45 = df_nouveaux[df_nouveaux['Classe (optionnel)'].str.contains("8.45", na=False)]
        nouveaux_10h45 = df_nouveaux[df_nouveaux['Classe (optionnel)'].str.contains("10.45", na=False)]
        print(f"   ⏰ 8h45: {len(nouveaux_8h45)} nouveaux")
        print(f"   ⏰ 10h45: {len(nouveaux_10h45)} nouveaux")
    
    # 2. Fichier complet de tous les étudiants
    fichier_tous = "IMPORT_tous_etudiants_coran.xlsx"
    df_complet.to_excel(fichier_tous, index=False)
    print(f"✅ {fichier_tous}: {len(df_complet)} étudiants total")
    
    # 3. Fichier des professeurs
    fichier_profs = "classe_coran_professeurs.xlsx"
    if Path(fichier_profs).exists():
        df_profs = pd.read_excel(fichier_profs)
        fichier_profs_final = "IMPORT_professeurs_coran.xlsx"
        df_profs.to_excel(fichier_profs_final, index=False)
        print(f"✅ {fichier_profs_final}: {len(df_profs)} professeurs")
        
        # Statistiques professeurs
        profs_8h45 = df_profs[df_profs['Classe (optionnel)'].str.contains("8h45", na=False)]
        profs_10h45 = df_profs[df_profs['Classe (optionnel)'].str.contains("10h45", na=False)]
        print(f"   ⏰ 8h45: {len(profs_8h45)} professeurs")
        print(f"   ⏰ 10h45: {len(profs_10h45)} professeurs")
    
    # 4. Créer des fichiers séparés par horaire
    if len(etudiants_8h45) > 0:
        fichier_8h45 = "IMPORT_etudiants_8h45.xlsx"
        etudiants_8h45.to_excel(fichier_8h45, index=False)
        print(f"✅ {fichier_8h45}: {len(etudiants_8h45)} étudiants 8h45")
    
    if len(etudiants_10h45) > 0:
        fichier_10h45 = "IMPORT_etudiants_10h45.xlsx"
        etudiants_10h45.to_excel(fichier_10h45, index=False)
        print(f"✅ {fichier_10h45}: {len(etudiants_10h45)} étudiants 10h45")


def afficher_resume_final():
    """Affiche un résumé final de tous les fichiers créés."""
    print(f"\n📋 RÉSUMÉ FINAL DES FICHIERS CRÉÉS")
    print("=" * 60)
    
    fichiers_import = [
        ("IMPORT_nouveaux_etudiants.xlsx", "Nouveaux étudiants à importer"),
        ("IMPORT_tous_etudiants_coran.xlsx", "Tous les étudiants (complet)"),
        ("IMPORT_professeurs_coran.xlsx", "Tous les professeurs"),
        ("IMPORT_etudiants_8h45.xlsx", "Étudiants classe 8h45"),
        ("IMPORT_etudiants_10h45.xlsx", "Étudiants classe 10h45")
    ]
    
    print(f"📁 Fichiers d'import créés:")
    for fichier, description in fichiers_import:
        if Path(fichier).exists():
            df = pd.read_excel(fichier)
            print(f"   ✅ {fichier}")
            print(f"      📝 {description}")
            print(f"      📊 {len(df)} lignes")
        else:
            print(f"   ❌ {fichier} (non créé)")
    
    print(f"\n🚀 PROCHAINES ÉTAPES:")
    print(f"   1. Importer les professeurs: python cli.py IMPORT_professeurs_coran.xlsx")
    print(f"   2. Importer les nouveaux étudiants: python cli.py IMPORT_nouveaux_etudiants.xlsx")
    print(f"   3. Ou importer tous les étudiants: python cli.py IMPORT_tous_etudiants_coran.xlsx")


def main():
    """Point d'entrée principal"""
    print("🎯 CRÉATION DES IMPORTS FINAUX - CLASSE CORAN")
    print("=" * 60)
    
    creer_fichiers_imports_finaux()
    afficher_resume_final()
    
    print(f"\n✅ Création terminée!")


if __name__ == '__main__':
    main()