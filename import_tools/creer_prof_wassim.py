#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script pour créer le compte du professeur Wassim
"""

import os
import sys
import django
import secrets

# Configuration Django
sys.path.insert(0, os.path.abspath('../ancien django/MYSITEE/MYSITEE'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite.settings')
django.setup()

from django.contrib.auth.models import Group
from tasks.models import User

# Charset pour génération de mot de passe (même que password_generator.py)
CHARSET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"

def generer_mot_de_passe(longueur=8):
    """Génère un mot de passe aléatoire"""
    return ''.join(secrets.choice(CHARSET) for _ in range(longueur))


def creer_prof_wassim():
    """Crée le compte du professeur Wassim"""
    
    print("\n" + "="*60)
    print("CREATION DU COMPTE PROFESSEUR WASSIM")
    print("="*60)
    
    # Vérifier si le compte existe déjà
    if User.objects.filter(username='prof_wassim').exists():
        print("\nATTENTION: Le compte prof_wassim existe deja!")
        prof = User.objects.get(username='prof_wassim')
        print(f"  Username: {prof.username}")
        print(f"  Nom: {prof.first_name}")
        print(f"  Role: {prof.role}")
        
        response = input("\nVoulez-vous regenerer le mot de passe? (oui/non): ")
        if response.lower() not in ['oui', 'o', 'yes', 'y']:
            print("\nAnnulation.")
            return None
        
        # Régénérer le mot de passe
        nouveau_mdp = generer_mot_de_passe()
        prof.set_password(nouveau_mdp)
        prof.save()
        
        print(f"\nMot de passe regenere: {nouveau_mdp}")
        
    else:
        # Créer le nouveau compte
        print("\nCreation du nouveau compte...")
        
        nouveau_mdp = generer_mot_de_passe()
        
        prof = User.objects.create_user(
            username='prof_wassim',
            password=nouveau_mdp,
            first_name='Wassim',
            last_name='',
            role='teacher',
            is_staff=False,
            is_superuser=False
        )
        
        print(f"Compte cree avec succes!")
        print(f"  Username: prof_wassim")
        print(f"  Password: {nouveau_mdp}")
        print(f"  Nom: Wassim")
        print(f"  Role: teacher")
    
    # Assigner à la classe 8h45
    print("\nAssignation a la classe 8h45...")
    try:
        classe_8h45 = Group.objects.get(name='Classe_8h45')
        prof.groups.add(classe_8h45)
        print("OK: Professeur assigne a Classe_8h45")
    except Group.DoesNotExist:
        print("ERREUR: Groupe Classe_8h45 non trouve!")
        return None
    
    # Sauvegarder les identifiants
    print("\nSauvegarde des identifiants...")
    
    credentials_file = "output/credentials_prof_wassim.txt"
    os.makedirs("output", exist_ok=True)
    
    with open(credentials_file, 'w', encoding='utf-8') as f:
        f.write("="*60 + "\n")
        f.write("IDENTIFIANTS PROFESSEUR WASSIM\n")
        f.write("="*60 + "\n\n")
        f.write(f"Username: prof_wassim\n")
        f.write(f"Password: {nouveau_mdp}\n")
        f.write(f"Nom: Wassim\n")
        f.write(f"Role: teacher\n")
        f.write(f"Classe: Classe_8h45\n\n")
        f.write("="*60 + "\n")
        f.write("IMPORTANT: Conservez ce fichier en lieu sur!\n")
        f.write("="*60 + "\n")
    
    print(f"Identifiants sauvegardes dans: {credentials_file}")
    
    # Ajouter au fichier CSV global
    csv_file = "output/nouveaux_credentials_tous.csv"
    if os.path.exists(csv_file):
        with open(csv_file, 'a', encoding='utf-8') as f:
            f.write(f'"prof_wassim","{nouveau_mdp}","Wassim","","teacher","Classe_8h45"\n')
        print(f"Ajoute au fichier CSV: {csv_file}")
    
    return {
        'username': 'prof_wassim',
        'password': nouveau_mdp,
        'first_name': 'Wassim',
        'role': 'teacher',
        'classe': 'Classe_8h45'
    }


def verifier_etudiants_wassim():
    """Vérifie que les 10 étudiants de Wassim sont dans la classe 8h45"""
    
    print("\n" + "="*60)
    print("VERIFICATION DES ETUDIANTS DE WASSIM")
    print("="*60)
    
    # Liste des étudiants selon Classes_CORAN.md
    etudiants_wassim = [
        "ALI ABDELGHAFOUR Heline",
        "BAIDA Ritaj",
        "BENATHMANE Yasmine",
        "FERRERA NEVES Rokia",
        "EL FEKAIR Malika",
        "MILED Lina",
        "ABADA Imene",
        "ABADA Janna",
        "REDRADJ Anais",
        "SOLTANI Oumaima"
    ]
    
    print(f"\nEtudiants attendus: {len(etudiants_wassim)}")
    
    classe_8h45 = Group.objects.get(name='Classe_8h45')
    etudiants_classe = classe_8h45.user_set.filter(role='student')
    
    trouves = 0
    manquants = []
    
    for nom_etudiant in etudiants_wassim:
        # Recherche approximative
        parties = nom_etudiant.split()
        prenom = parties[-1]
        nom = ' '.join(parties[:-1])
        
        etudiant = etudiants_classe.filter(
            first_name__icontains=prenom,
            last_name__icontains=nom
        ).first()
        
        if etudiant:
            trouves += 1
            print(f"  OK: {nom_etudiant} -> {etudiant.username}")
        else:
            manquants.append(nom_etudiant)
            print(f"  MANQUANT: {nom_etudiant}")
    
    print(f"\nResultat: {trouves}/{len(etudiants_wassim)} etudiants trouves")
    
    if manquants:
        print(f"\nEtudiants manquants ({len(manquants)}):")
        for nom in manquants:
            print(f"  - {nom}")
    
    return trouves == len(etudiants_wassim)


def main():
    """Fonction principale"""
    
    try:
        # Créer le compte
        credentials = creer_prof_wassim()
        
        if not credentials:
            print("\nEchec de la creation du compte.")
            sys.exit(1)
        
        # Vérifier les étudiants
        etudiants_ok = verifier_etudiants_wassim()
        
        # Résumé final
        print("\n" + "="*60)
        print("RESUME")
        print("="*60)
        
        print(f"\nCompte professeur:")
        print(f"  Username: {credentials['username']}")
        print(f"  Password: {credentials['password']}")
        print(f"  Nom: {credentials['first_name']}")
        print(f"  Classe: {credentials['classe']}")
        
        if etudiants_ok:
            print(f"\nEtudiants: OK (10/10 trouves dans la classe)")
        else:
            print(f"\nEtudiants: ATTENTION - Certains etudiants manquants")
        
        print("\n" + "="*60)
        print("COMPTE CREE AVEC SUCCES!")
        print("="*60)
        
        print(f"\nFichier d'identifiants: output/credentials_prof_wassim.txt")
        print(f"\nPour tester la connexion:")
        print(f"  python test_professeur_etudiants.py")
        
        sys.exit(0)
        
    except Exception as e:
        print(f"\nERREUR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
