"""
Compléter tous les étudiants manquants:
1. Corriger les 14 usernames avec accents
2. Créer les 19 étudiants manquants
"""
import os
import sys
import django
import secrets

# Configuration Django
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'ancien django', 'MYSITEE', 'MYSITEE'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from parser_classes_coran import parser_fichier_classes, mapper_nom_prof_vers_username

User = get_user_model()

# Charset pour les mots de passe
CHARSET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"

# Mapping des corrections (fichier → base de données)
CORRECTIONS = {
    'aïcha_hamidi': 'aicha_hamidi',
    'haretha_abdellah_ba': 'baharetha_abdellah',
    'inés_adjtoutah': 'ines_adjtoutah',
    'kaïs_redradj': 'kais_redradj',
    'khail_wahidouallah_jabar': 'jabarkhail_wahidouallah',
    'leïla_rahmaoui': 'leila_rahmaoui',
    'mohamed_el_mehadji': 'mohamed_el_mehadji',  # À vérifier
    'mohamed_marjani_omar': 'omarmohamed_marjani',
    'oumaïma_soltani': 'oumaima_soltani',
    'rokia_ferrera_neves': 'nevesrokia_ferrera',
    'tasnime_ben_ali': 'alitasnime_ben',
    'tasnime_ferrera_neves': 'nevestasnime_ferrera',
    'tayssir_ben_ali': 'alitayssir_ben',
    'youssef_ben_ali': 'aliyoussef_ben',
}

# Étudiants à créer (n'existent pas dans la base)
A_CREER = [
    'amine_el_meski_mohamed',
    'aymen_el_kabir',
    'ayoub_asrih_mohamed',
    'daoud_ben_romdhane',
    'ewan_ali_abdelghafour',
    'heline_ali_abdelghafour',
    'ilyas_el_kabir',
    'ismaïl_ben_romhdane',
    'joumanah_el_mahadji',
    'karim_ali_ibrahimy',
    'kenza_ben_romdhane',
    'malika_el_fekair',
    'mariam_el_haimeur',
    'mohamed_el_haimeur',
    'omar_el_qamari',
    'yanis_lallam_mohamed',
    'zahra_jmila_fatima',
    'zakaria_el_idrissi',
    'ziyad_el_kabir',
]

def generer_mot_de_passe():
    """Générer un mot de passe aléatoire de 8 caractères"""
    return ''.join(secrets.choice(CHARSET) for _ in range(8))

def extraire_nom_prenom(username):
    """Extraire prénom et nom depuis le username"""
    parts = username.split('_')
    if len(parts) >= 2:
        prenom = parts[0].capitalize()
        nom = ' '.join(p.capitalize() for p in parts[1:])
        return prenom, nom
    return username.capitalize(), ''

def creer_etudiant(username, classe_django):
    """Créer un nouvel étudiant"""
    prenom, nom = extraire_nom_prenom(username)
    password = generer_mot_de_passe()
    
    # Créer l'utilisateur
    user = User.objects.create_user(
        username=username,
        password=password,
        first_name=prenom,
        last_name=nom,
        role='student'
    )
    
    # Ajouter au groupe de classe
    groupe_classe = Group.objects.get(name=classe_django)
    user.groups.add(groupe_classe)
    
    return user, password

def main():
    print("\n" + "="*70)
    print("COMPLÉTION DE TOUS LES ÉTUDIANTS")
    print("="*70)
    
    # Parser le fichier pour savoir quelle classe pour chaque étudiant
    assignations = parser_fichier_classes()
    
    # Créer un mapping username → classe
    username_to_classe = {}
    
    for classe_fichier, profs in assignations.items():
        # Mapper classe fichier → classe Django
        classe_django = 'Classe_8h45' if classe_fichier == '10h45' else 'Classe_10h45'
        
        for prof_name, etudiants in profs.items():
            for username in etudiants:
                username_to_classe[username] = classe_django
    
    # ÉTAPE 1: Appliquer les corrections
    print("\n" + "="*70)
    print("ÉTAPE 1: CORRECTIONS DES USERNAMES")
    print("="*70)
    
    corrections_appliquees = 0
    
    for username_fichier, username_db in CORRECTIONS.items():
        user = User.objects.filter(username=username_db).first()
        if user:
            print(f"✓ {username_fichier} → {username_db} (existe déjà)")
            corrections_appliquees += 1
        else:
            print(f"⚠️  {username_fichier} → {username_db} (non trouvé)")
    
    print(f"\n✓ {corrections_appliquees}/{len(CORRECTIONS)} corrections validées")
    
    # ÉTAPE 2: Créer les étudiants manquants
    print("\n" + "="*70)
    print("ÉTAPE 2: CRÉATION DES ÉTUDIANTS MANQUANTS")
    print("="*70)
    
    crees = []
    erreurs = []
    
    for username in A_CREER:
        # Trouver la classe
        classe_django = username_to_classe.get(username)
        
        if not classe_django:
            print(f"❌ {username}: Classe non trouvée dans le fichier")
            erreurs.append(username)
            continue
        
        try:
            user, password = creer_etudiant(username, classe_django)
            print(f"✓ {username} créé (classe: {classe_django}, password: {password})")
            crees.append({
                'username': username,
                'password': password,
                'classe': classe_django,
                'prenom': user.first_name,
                'nom': user.last_name
            })
        except Exception as e:
            print(f"❌ {username}: Erreur - {e}")
            erreurs.append(username)
    
    # ÉTAPE 3: Ré-exécuter les assignations
    print("\n" + "="*70)
    print("ÉTAPE 3: RÉ-ASSIGNATION DE TOUS LES ÉTUDIANTS")
    print("="*70)
    print("Exécution de creer_assignations_specifiques.py...")
    
    # Importer et exécuter
    from creer_assignations_specifiques import main as creer_assignations
    creer_assignations()
    
    # RÉSUMÉ
    print("\n" + "="*70)
    print("RÉSUMÉ FINAL")
    print("="*70)
    print(f"✓ Corrections validées: {corrections_appliquees}")
    print(f"✓ Étudiants créés: {len(crees)}")
    print(f"❌ Erreurs: {len(erreurs)}")
    
    # Sauvegarder les nouveaux credentials
    if crees:
        print("\n💾 Sauvegarde des nouveaux credentials...")
        with open('output/nouveaux_etudiants_credentials.csv', 'w', encoding='utf-8') as f:
            f.write("Username,Password,Prenom,Nom,Classe\n")
            for etudiant in crees:
                f.write(f"{etudiant['username']},{etudiant['password']},{etudiant['prenom']},{etudiant['nom']},{etudiant['classe']}\n")
        
        print(f"✓ Fichier créé: output/nouveaux_etudiants_credentials.csv")
    
    # Vérification finale
    print("\n" + "="*70)
    print("VÉRIFICATION FINALE")
    print("="*70)
    
    total_etudiants = User.objects.filter(role='student').count()
    print(f"📊 Total étudiants dans la base: {total_etudiants}")
    print(f"📊 Attendu: 203 étudiants")
    
    if total_etudiants >= 203:
        print(f"✅ SUCCÈS: Tous les étudiants sont présents!")
    else:
        print(f"⚠️  Il manque encore {203 - total_etudiants} étudiants")

if __name__ == '__main__':
    main()
