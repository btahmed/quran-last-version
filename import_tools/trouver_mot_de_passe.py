#!/usr/bin/env python3
"""
Script simple pour trouver le mot de passe d'un utilisateur spécifique
"""

import csv
import sys
from pathlib import Path


def lire_fichier_excel_comme_csv(fichier_excel):
    """Essaie de lire un fichier Excel en le convertissant en CSV"""
    try:
        # Essayer d'utiliser pandas si disponible
        import pandas as pd
        df = pd.read_excel(fichier_excel)
        return df.to_dict('records')
    except ImportError:
        print("❌ pandas non disponible")
        return None
    except Exception as e:
        print(f"❌ Erreur lecture Excel: {e}")
        return None


def chercher_mot_de_passe(username):
    """Cherche le mot de passe d'un utilisateur dans tous les fichiers"""
    
    output_dir = Path(__file__).parent / "output"
    
    fichiers = [
        "credentials_2026-02-20_09-59-27.excel.xlsx",  # Étudiants 10h45
        "credentials_2026-02-20_10-30-16.excel.xlsx",  # Professeurs
        "credentials_2026-02-20_10-32-32.excel.xlsx",  # Nouveaux étudiants 8h45
    ]
    
    print(f"🔍 RECHERCHE DU MOT DE PASSE POUR: {username}")
    print("="*60)
    
    for fichier in fichiers:
        fichier_path = output_dir / fichier
        
        if not fichier_path.exists():
            print(f"⚠️  Fichier manquant: {fichier}")
            continue
        
        print(f"\n📁 Recherche dans: {fichier}")
        
        # Essayer de lire le fichier
        try:
            # Méthode simple : lire comme texte et chercher le nom
            with open(fichier_path, 'rb') as f:
                content = f.read()
                
            # Convertir en texte (ignorer les erreurs)
            text_content = content.decode('utf-8', errors='ignore')
            
            if username.lower() in text_content.lower():
                print(f"✅ Utilisateur trouvé dans {fichier}")
                print(f"📂 Ouvrez manuellement le fichier: {fichier_path}")
                print(f"🔍 Cherchez la ligne avec '{username}' et regardez la colonne Password")
                return fichier_path
            else:
                print(f"❌ Utilisateur non trouvé dans {fichier}")
                
        except Exception as e:
            print(f"❌ Erreur lecture {fichier}: {e}")
    
    return None


def main():
    """Point d'entrée principal"""
    
    if len(sys.argv) > 1:
        username = sys.argv[1]
    else:
        username = input("👤 Nom d'utilisateur à chercher: ").strip()
    
    if not username:
        print("❌ Nom d'utilisateur requis")
        return
    
    fichier_trouve = chercher_mot_de_passe(username)
    
    if fichier_trouve:
        print(f"\n🎯 INSTRUCTIONS:")
        print(f"1. Ouvrez le fichier: {fichier_trouve}")
        print(f"2. Cherchez la ligne avec '{username}'")
        print(f"3. Le mot de passe est dans la colonne 'Password'")
        print(f"4. Copiez le mot de passe et utilisez-le pour les tests")
    else:
        print(f"\n❌ Utilisateur '{username}' non trouvé dans les fichiers d'identifiants")


if __name__ == "__main__":
    main()