#!/usr/bin/env python3
"""
Script de vérification de l'extraction et correction des horaires.
"""

import pandas as pd
from pathlib import Path


def verifier_fichiers():
    """Vérifie les fichiers créés."""
    print("🔍 VÉRIFICATION DES FICHIERS CRÉÉS")
    print("=" * 50)
    
    # Vérifier le fichier étudiants
    fichier_etudiants = "classe_coran_complet_etudiants.xlsx"
    if Path(fichier_etudiants).exists():
        df_etudiants = pd.read_excel(fichier_etudiants)
        print(f"📊 Fichier étudiants: {len(df_etudiants)} lignes")
        
        # Analyser les classes
        classes_uniques = df_etudiants['Classe (optionnel)'].unique()
        print(f"📋 Classes trouvées:")
        for classe in sorted(classes_uniques):
            nb_etudiants = len(df_etudiants[df_etudiants['Classe (optionnel)'] == classe])
            print(f"   - {classe}: {nb_etudiants} étudiants")
        
        # Analyser par horaire
        print(f"\n📊 Répartition par horaire:")
        for horaire in ['8h45', '10h45']:
            etudiants_horaire = df_etudiants[df_etudiants['Classe (optionnel)'].str.contains(horaire, na=False)]
            print(f"   ⏰ {horaire}: {len(etudiants_horaire)} étudiants")
        
        # Afficher quelques exemples
        print(f"\n👀 Exemples d'étudiants:")
        for i, row in df_etudiants.head(10).iterrows():
            print(f"   {i+1}. {row['Prénom']} {row['Nom']} ({row['Username']}) - {row['Classe (optionnel)']}")
    
    # Vérifier le fichier professeurs
    fichier_profs = "classe_coran_professeurs.xlsx"
    if Path(fichier_profs).exists():
        df_profs = pd.read_excel(fichier_profs)
        print(f"\n👨‍🏫 Fichier professeurs: {len(df_profs)} lignes")
        
        # Analyser par horaire
        for horaire in ['8h45', '10h45']:
            profs_horaire = df_profs[df_profs['Classe (optionnel)'].str.contains(horaire, na=False)]
            print(f"   ⏰ {horaire}: {len(profs_horaire)} professeurs")
        
        print(f"\n👨‍🏫 Liste des professeurs:")
        for i, row in df_profs.iterrows():
            print(f"   {i+1}. {row['Prénom']} {row['Nom']} ({row['Username']}) - {row['Classe (optionnel)']}")


def comparer_avec_precedent():
    """Compare avec l'import précédent."""
    print(f"\n🔍 COMPARAISON DÉTAILLÉE")
    print("=" * 50)
    
    fichier_precedent = "classe_coran_import.xlsx"
    fichier_nouveau = "classe_coran_complet_etudiants.xlsx"
    
    if not Path(fichier_precedent).exists():
        print(f"❌ Fichier précédent non trouvé: {fichier_precedent}")
        return
    
    if not Path(fichier_nouveau).exists():
        print(f"❌ Fichier nouveau non trouvé: {fichier_nouveau}")
        return
    
    df_precedent = pd.read_excel(fichier_precedent)
    df_nouveau = pd.read_excel(fichier_nouveau)
    
    print(f"📊 Import précédent: {len(df_precedent)} étudiants")
    print(f"📊 Import complet: {len(df_nouveau)} étudiants")
    
    # Identifier les différences
    usernames_precedents = set(df_precedent['Username'].tolist())
    usernames_nouveaux = set(df_nouveau['Username'].tolist())
    
    nouveaux = usernames_nouveaux - usernames_precedents
    manquants = usernames_precedents - usernames_nouveaux
    
    print(f"\n🆕 Nouveaux étudiants: {len(nouveaux)}")
    print(f"❌ Étudiants manquants: {len(manquants)}")
    
    if manquants:
        print(f"\n❌ Étudiants manquants (détails):")
        for username in sorted(manquants):
            etudiant = df_precedent[df_precedent['Username'] == username].iloc[0]
            print(f"   - {etudiant['Prénom']} {etudiant['Nom']} ({username})")
    
    # Analyser les nouveaux par horaire
    if nouveaux:
        print(f"\n🆕 Nouveaux étudiants par horaire:")
        for horaire in ['8h45', '10h45']:
            nouveaux_horaire = []
            for username in nouveaux:
                etudiant = df_nouveau[df_nouveau['Username'] == username]
                if not etudiant.empty and horaire in str(etudiant.iloc[0]['Classe (optionnel)']):
                    nouveaux_horaire.append(etudiant.iloc[0])
            
            print(f"   ⏰ {horaire}: {len(nouveaux_horaire)} nouveaux")
            for etudiant in nouveaux_horaire[:5]:  # Afficher les 5 premiers
                print(f"      + {etudiant['Prénom']} {etudiant['Nom']} ({etudiant['Username']})")
            if len(nouveaux_horaire) > 5:
                print(f"      ... et {len(nouveaux_horaire) - 5} autres")


def creer_fichier_import_incremental():
    """Crée un fichier d'import seulement pour les nouveaux étudiants."""
    print(f"\n📁 CRÉATION FICHIER IMPORT INCRÉMENTAL")
    print("=" * 50)
    
    fichier_precedent = "classe_coran_import.xlsx"
    fichier_complet = "classe_coran_complet_etudiants.xlsx"
    
    if not Path(fichier_precedent).exists() or not Path(fichier_complet).exists():
        print(f"❌ Fichiers manquants pour la comparaison")
        return
    
    df_precedent = pd.read_excel(fichier_precedent)
    df_complet = pd.read_excel(fichier_complet)
    
    usernames_precedents = set(df_precedent['Username'].tolist())
    
    # Filtrer seulement les nouveaux
    df_nouveaux = df_complet[~df_complet['Username'].isin(usernames_precedents)]
    
    if len(df_nouveaux) > 0:
        fichier_nouveaux = "classe_coran_nouveaux_etudiants.xlsx"
        df_nouveaux.to_excel(fichier_nouveaux, index=False)
        print(f"✅ Fichier créé: {fichier_nouveaux} ({len(df_nouveaux)} nouveaux étudiants)")
        
        # Statistiques
        for horaire in ['8h45', '10h45']:
            nouveaux_horaire = df_nouveaux[df_nouveaux['Classe (optionnel)'].str.contains(horaire, na=False)]
            print(f"   ⏰ {horaire}: {len(nouveaux_horaire)} nouveaux étudiants")
    else:
        print(f"ℹ️  Aucun nouvel étudiant trouvé")


def main():
    """Point d'entrée principal"""
    print("🔍 VÉRIFICATION DE L'EXTRACTION COMPLÈTE")
    print("=" * 60)
    
    verifier_fichiers()
    comparer_avec_precedent()
    creer_fichier_import_incremental()
    
    print(f"\n✅ Vérification terminée!")


if __name__ == '__main__':
    main()