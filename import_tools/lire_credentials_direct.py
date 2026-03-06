#!/usr/bin/env python3
"""
Script pour lire directement les fichiers credentials sans dépendances
Utilise une approche de lecture binaire pour extraire les données
"""

import struct
import sys
from pathlib import Path


def extraire_strings_excel(fichier_path):
    """Extrait les chaînes de caractères d'un fichier Excel"""
    try:
        with open(fichier_path, 'rb') as f:
            content = f.read()
        
        # Convertir en texte en ignorant les erreurs
        text_content = content.decode('utf-8', errors='ignore')
        
        # Chercher les patterns de mots de passe (8 caractères alphanumériques)
        import re
        
        # Pattern pour username suivi de password
        lines = text_content.split('\n')
        
        credentials = []
        for i, line in enumerate(lines):
            if 'salma_aneflous' in line.lower():
                # Chercher dans cette ligne et les suivantes
                for j in range(max(0, i-2), min(len(lines), i+3)):
                    check_line = lines[j]
                    # Chercher un mot de passe (8 caractères avec lettres et chiffres)
                    passwords = re.findall(r'\b[A-Za-z0-9]{8}\b', check_line)
                    if passwords:
                        for pwd in passwords:
                            if pwd != 'salma_aneflous' and not pwd.isdigit():
                                credentials.append(('salma_aneflous', pwd))
        
        return credentials
        
    except Exception as e:
        print(f"❌ Erreur lecture fichier: {e}")
        return []


def chercher_dans_tous_fichiers():
    """Cherche salma_aneflous dans tous les fichiers credentials"""
    
    output_dir = Path(__file__).parent / "output"
    
    fichiers = [
        "credentials_2026-02-20_09-59-27.excel.xlsx",  # Étudiants 10h45
        "credentials_2026-02-20_10-30-16.excel.xlsx",  # Professeurs  
        "credentials_2026-02-20_10-32-32.excel.xlsx",  # Nouveaux étudiants 8h45
    ]
    
    print("🔍 RECHERCHE MOT DE PASSE salma_aneflous")
    print("="*60)
    
    for fichier in fichiers:
        fichier_path = output_dir / fichier
        
        if not fichier_path.exists():
            print(f"⚠️  Fichier manquant: {fichier}")
            continue
            
        print(f"\n📁 Analyse: {fichier}")
        
        credentials = extraire_strings_excel(fichier_path)
        
        if credentials:
            for username, password in credentials:
                print(f"✅ TROUVÉ!")
                print(f"👤 Username: {username}")
                print(f"🔐 Password: {password}")
                return username, password
        else:
            print("❌ Non trouvé dans ce fichier")
    
    return None, None


def methode_alternative_csv():
    """Méthode alternative : convertir Excel en CSV et lire"""
    print("\n🔄 MÉTHODE ALTERNATIVE")
    print("="*40)
    
    print("📋 INSTRUCTIONS MANUELLES:")
    print("1. Ouvrez le fichier: credentials_2026-02-20_09-59-27.excel.xlsx")
    print("2. Cherchez la ligne avec 'salma_aneflous'")
    print("3. Regardez la colonne 'Password' sur la même ligne")
    print("4. Copiez le mot de passe (8 caractères)")
    
    # Essayer de lire le fichier comme texte brut
    output_dir = Path(__file__).parent / "output"
    fichier_path = output_dir / "credentials_2026-02-20_09-59-27.excel.xlsx"
    
    if fichier_path.exists():
        try:
            with open(fichier_path, 'rb') as f:
                content = f.read()
            
            # Chercher salma_aneflous dans le contenu binaire
            if b'salma_aneflous' in content:
                print(f"\n✅ salma_aneflous trouvé dans {fichier_path}")
                
                # Extraire la zone autour du nom
                pos = content.find(b'salma_aneflous')
                if pos != -1:
                    # Prendre 200 caractères avant et après
                    start = max(0, pos - 200)
                    end = min(len(content), pos + 200)
                    zone = content[start:end]
                    
                    # Convertir en texte
                    zone_text = zone.decode('utf-8', errors='ignore')
                    print(f"\n📄 Contenu autour de salma_aneflous:")
                    print("-" * 50)
                    
                    # Nettoyer et afficher
                    lines = zone_text.split('\n')
                    for line in lines:
                        clean_line = ''.join(c for c in line if c.isprintable())
                        if clean_line.strip():
                            print(clean_line.strip())
                    
                    print("-" * 50)
                    print("🔍 Cherchez un mot de passe de 8 caractères dans ce texte")
            
        except Exception as e:
            print(f"❌ Erreur lecture binaire: {e}")


def main():
    """Point d'entrée principal"""
    
    # Méthode 1: Extraction automatique
    username, password = chercher_dans_tous_fichiers()
    
    if username and password:
        print(f"\n🎯 RÉSULTAT:")
        print(f"👤 Username: {username}")
        print(f"🔐 Password: {password}")
        
        print(f"\n🧪 MAINTENANT TESTEZ AVEC:")
        print(f"   .venv/Scripts/activate")
        print(f"   python ../../../import_tools/test_permissions_manuel.py")
        print(f"   Puis saisissez: {username} et {password}")
        
    else:
        # Méthode 2: Instructions manuelles
        methode_alternative_csv()


if __name__ == "__main__":
    main()