"""
Récupérer le mot de passe d'un professeur depuis les fichiers credentials
"""
import os
import csv

def find_password():
    output_dir = os.path.join(os.path.dirname(__file__), 'output')
    
    # Chercher dans le fichier des professeurs
    prof_file = os.path.join(output_dir, 'nouveaux_credentials_professeurs.csv')
    
    if os.path.exists(prof_file):
        with open(prof_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row['username'] == 'prof_ibrahim':
                    print(f"Username: {row['username']}")
                    print(f"Password: {row['password']}")
                    print(f"Classe: {row.get('classe', 'N/A')}")
                    return row['password']
    
    print("❌ Mot de passe non trouvé dans nouveaux_credentials_professeurs.csv")
    return None

if __name__ == '__main__':
    find_password()
