#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de vérification des classes CORAN
Compare les données du fichier Classes_CORAN.md avec la base de données Django
"""

import os
import sys
import django

# Forcer l'encodage UTF-8 pour Windows
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# Configuration Django
sys.path.insert(0, os.path.abspath('../ancien django/MYSITEE/MYSITEE'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite.settings')
django.setup()

from django.contrib.auth.models import Group
from tasks.models import User
from collections import defaultdict

# Données de référence du fichier Classes_CORAN.md
CLASSES_CORAN = {
    "Classe_10h45": {
        "prof_nahila": [
            "ANEFLOUS Salma", "AZZEDDINE Ferriel", "BENNAMA Sarah",
            "BOULAABI Inaya", "HEMISSI Jihene", "MOUGHAMIR Assil", "SAADOULI Lyne"
        ],
        "prof_camilia": [
            "AMMAR Kenza", "AMZEL Aya", "OUADAH Hajer", "MANDJAM Assil",
            "CHAHID Kawtar", "KHIAR Halima", "YAKHNI Hayat", "ASRIH Nour"
        ],
        "prof_abdallah": [
            "BEN ALI Tasnime", "BENMOUSSA Inaya", "BOULDJIHAD Hafsa",
            "CHELGHMIA Alaa", "DAHBI Smahen", "CHELAGHMIA Arwa",
            "MAOUDOUD Lina", "JALIL Youssra", "ILMI Fatima",
            "BOUKHALFA Saja", "BOUAMAMA Khadija", "JALIL Amira",
            "KEBTANI Roufaida", "MARGOUM Oumaima", "OUADAH Douaa",
            "RAHMAOUI Leïla", "MAAZOUZ Mayssa"
        ],
        "prof_youssef": [
            "LOUMBARKIA Wael", "El Kabir Ilyas", "El Kabir Ziyad",
            "EZUNKE Yanis", "MAOUDOUD Imrane", "MARTINS Salim",
            "MOUGHAMIR Owayss", "SAADOULI Zakaria", "TAZOULT Akram"
        ],
        "prof_ahmed_mahjoubi": [
            "AMMAR Rayan", "TOIYBOU Sayane", "BENMOHAMED Souleymane",
            "BENNAMA Adem", "BINCHOULA Omar", "BUTUN Miradj",
            "DAHBI Sohane", "KEBTANI Omar", "KERIOUI Anis"
        ],
        "prof_abdelhadi": [
            "ADNANE Rayane", "BENKIRANE Iyad", "BOURAZI Kahil",
            "BOURAZI Yanis", "DAHBI Chahine", "WAHIDOUALLAH Fahim",
            "GONZIL Isaac", "JEMMA Rayane", "OUACHIKH Iyad", "TOIYBOU Sayane"
        ],
        "prof_ahmed": [
            "BUTUN Bilal", "CAMARA Mohamed", "EL HAIMEUR Mohamed",
            "FADHLOUI Omar", "LAMALEM Kamil", "MARJANI Omar Mohamed",
            "OUADAH Mohamed", "RAHMAOUI Adem", "YASSINE JALIL"
        ],
        "prof_mohammadine": [
            "ASRIH Mohamed Ayoub", "ATHOUMANE Hanane", "ATHOUMANE Younes",
            "ANEFLOUS Ilyas", "CHELLAH Ilyas", "EL QAMARI Omar",
            "BENKIRANE Yaqine", "WAHIDOUALLAH Jabar khail", "GONZIL Mairick",
            "MARJANI Badereddine", "SAADOULI Yahya"
        ],
        "prof_abou_fadi": [
            "ABDELLAH BA HARETHA", "ASSANI Ismael", "BEN ALI Youssef",
            "BENNAMOU Karim", "EL MESKI Mohamed Amine", "LALLAM Mohamed Yanis",
            "EL KABIR Aymen", "BINCHOULA Mouad", "ALIBACO Dayane",
            "OUACHIKH Bilal", "OUACHIKH Yazid"
        ],
        "prof_ibrahim": [
            "BOULAABI Mohamed", "BUTUN Ali", "EL MEHADJI Mohamed",
            "DELHOSTAL Yanis", "FATINE Ahmed", "FERDJOUNI Jassim",
            "KERIOUI Younes", "MANDJAM Driss"
        ],
        "prof_najlaa": [
            "ASRIH Tesnime", "ATTOUMANE Ayma", "BEN ALI Tayssir",
            "CAMARA Odia", "DHIB Aya", "DHIB Issra", "EL HAIMEUR Mariam",
            "HAJILI Tasnime", "HAMIDI Aïcha", "MAGHRAOUI Nada", "TAZOULT Marwa"
        ],
        "prof_salsabile": [
            "ATTOUMANE Fatima", "ATTOUMANE Soumaya", "AZZEDDINE Farah",
            "BENNAMA Amina", "BENNAMA Nihel", "BOULAABI Neila",
            "BOULDJIHAD Maissa", "EL MAHADJI Joumanah", "HEMISSI Wijdene",
            "JALIL Malak", "MARGOUM Najat"
        ]
    },
    "Classe_8h45": {
        "prof_oum_wael": [  # Partagé avec prof_oum_amine
            "ADJTOUTAH Inés", "BOUSSAF Ranya", "HAMADA Basma",
            "JMILA Maroua", "SALMANE Heline", "BENNAMOU Nahila",
            "BOUKHALFA Marwa", "BOUKHALFA Tasnime", "BOUKHALFA Salsabile",
            "HAMADA Nada", "ZAIDANE Farah", "BEN ROMDHANE Kenza",
            "BENATHMANE Nahila", "SAHRAOUI Lilia", "SALMANE Soline"
        ],
        "prof_salahdine": [
            "BERADJEM Layla", "ABI Assya", "FERRERA NEVES Tasnime",
            "AGNIDE Intissar", "CHETTAH Jihene", "SAOUDI Oussama",
            "LAHYENE Feradous", "BENKHEDRA Aicha", "BEN ROMDHANE Daoud",
            "HADHY Enel"
        ],
        "prof_youssef": [
            "LOUBANE Adem", "SALMANE Anas", "MAJBERI Mohamed",
            "BOUATTOUR Adem", "HAMADA Iyed", "KOLLI Abdelbasset",
            "KOLLI Abderrahim", "HADHY Enes", "MILED Mohamed"
        ],
        "prof_abou_abdellatif": [
            "ABI Mouslime", "AISSAOUI Leyth", "BADI Abdullah",
            "BADI Ayoub", "SAIDI Ridha", "SAIDINA Ismael"
        ],
        "prof_abou_mostafa": [
            "ABI Mouhamed", "ALI ABDELGHAFOUR Ewan", "ALI IBRAHIMY Karim",
            "BOUSSAF Akram", "ENNAJI Jihad", "NAJMI Ismail",
            "SAIDINA Ibrahim", "SALMANE Mostafa"
        ],
        "prof_abdelhadi": [
            "EL IDRISSI Zakaria", "HADHY Edine", "BOUATTOUR Ilyes",
            "LOUMBARKIA Wael", "MAJBERI Rayane", "MAJBERI Adem",
            "BOUATTOUR Adem", "AGNIDE Najih", "WIFAYA Tasnime",
            "JMILA Fatima Zahra", "NAJMI Idriss", "NAJMI Mehdi"
        ],
        "prof_ibrahim": [
            "REDRADJ Kaïs", "LOUBANE Zakaria", "BENNACER Anas",
            "DRAIBINE Islam", "ADJTOUTAH Anas"
        ],
        "prof_mohammadine": [
            "ABI Hafidou", "AISSAOUI Ilyes", "SAHRAOUI Dounia",
            "SAHRAOUI Inaya", "TAJANI Amira", "TAJANI Majd",
            "TAJANI Malak", "ZAIDANE Maria", "BEN ROMHDANE Ismaïl"
        ],
        # Note: prof_wassim n'existe pas dans la base de données actuelle
    }
}


def normaliser_nom(nom):
    """Normalise un nom pour la comparaison"""
    # Enlever les accents et mettre en minuscules
    import unicodedata
    nom = unicodedata.normalize('NFD', nom)
    nom = ''.join(c for c in nom if unicodedata.category(c) != 'Mn')
    return nom.lower().strip()


def trouver_etudiant(nom_complet):
    """Trouve un étudiant dans la base de données par son nom"""
    parties = nom_complet.split()
    if len(parties) < 2:
        return None
    
    # Essayer différentes combinaisons
    prenom = parties[-1]  # Dernier mot = prénom
    nom = ' '.join(parties[:-1])  # Reste = nom de famille
    
    # Recherche par nom et prénom
    etudiants = User.objects.filter(
        role='student',
        first_name__icontains=prenom,
        last_name__icontains=nom
    )
    
    if etudiants.count() == 1:
        return etudiants.first()
    
    # Recherche par username
    username_possible = f"{prenom.lower()}_{nom.lower().replace(' ', '_')}"
    try:
        return User.objects.get(username=username_possible, role='student')
    except User.DoesNotExist:
        pass
    
    # Recherche approximative
    for etudiant in User.objects.filter(role='student'):
        nom_db = f"{etudiant.last_name} {etudiant.first_name}"
        if normaliser_nom(nom_db) == normaliser_nom(nom_complet):
            return etudiant
    
    return None


def verifier_classes():
    """Vérifie que les classes correspondent au fichier Classes_CORAN.md"""
    
    print("\n" + "="*80)
    print("VÉRIFICATION DES CLASSES CORAN")
    print("="*80)
    
    resultats = {
        "total_attendu": 0,
        "total_trouve": 0,
        "total_manquant": 0,
        "etudiants_manquants": [],
        "professeurs_manquants": [],
        "erreurs_classe": []
    }
    
    for classe_nom, professeurs in CLASSES_CORAN.items():
        print(f"\n{'='*80}")
        print(f"CLASSE: {classe_nom}")
        print(f"{'='*80}")
        
        for prof_username, etudiants_attendus in professeurs.items():
            print(f"\n--- Professeur: {prof_username} ---")
            print(f"Étudiants attendus: {len(etudiants_attendus)}")
            
            # Vérifier que le professeur existe
            try:
                prof = User.objects.get(username=prof_username, role='teacher')
                print(f"✅ Professeur trouvé: {prof.first_name}")
            except User.DoesNotExist:
                print(f"❌ Professeur NON TROUVÉ: {prof_username}")
                resultats["professeurs_manquants"].append(prof_username)
                continue
            
            # Vérifier les étudiants
            etudiants_trouves = 0
            etudiants_manquants_prof = []
            
            for nom_etudiant in etudiants_attendus:
                resultats["total_attendu"] += 1
                etudiant = trouver_etudiant(nom_etudiant)
                
                if etudiant:
                    resultats["total_trouve"] += 1
                    etudiants_trouves += 1
                    
                    # Vérifier la classe
                    groupes = list(etudiant.groups.filter(
                        name__in=['Classe_8h45', 'Classe_10h45']
                    ).values_list('name', flat=True))
                    
                    if classe_nom not in groupes:
                        print(f"  ⚠️  {nom_etudiant} -> Classe incorrecte: {groupes}")
                        resultats["erreurs_classe"].append({
                            "etudiant": nom_etudiant,
                            "attendu": classe_nom,
                            "actuel": groupes
                        })
                else:
                    resultats["total_manquant"] += 1
                    print(f"  ❌ {nom_etudiant} -> NON TROUVÉ")
                    etudiants_manquants_prof.append(nom_etudiant)
                    resultats["etudiants_manquants"].append({
                        "nom": nom_etudiant,
                        "professeur": prof_username,
                        "classe": classe_nom
                    })
            
            print(f"✅ Trouvés: {etudiants_trouves}/{len(etudiants_attendus)}")
            if etudiants_manquants_prof:
                print(f"❌ Manquants: {len(etudiants_manquants_prof)}")
    
    return resultats


def afficher_resume(resultats):
    """Affiche le résumé des vérifications"""
    
    print("\n" + "="*80)
    print("RÉSUMÉ DE LA VÉRIFICATION")
    print("="*80)
    
    print(f"\n📊 Statistiques:")
    print(f"  - Total étudiants attendus: {resultats['total_attendu']}")
    print(f"  - Total étudiants trouvés: {resultats['total_trouve']}")
    print(f"  - Total étudiants manquants: {resultats['total_manquant']}")
    
    taux_reussite = (resultats['total_trouve'] / resultats['total_attendu'] * 100) if resultats['total_attendu'] > 0 else 0
    print(f"  - Taux de réussite: {taux_reussite:.1f}%")
    
    if resultats['professeurs_manquants']:
        print(f"\n❌ Professeurs manquants ({len(resultats['professeurs_manquants'])}):")
        for prof in resultats['professeurs_manquants']:
            print(f"  - {prof}")
    
    if resultats['erreurs_classe']:
        print(f"\n⚠️  Erreurs de classe ({len(resultats['erreurs_classe'])}):")
        for erreur in resultats['erreurs_classe'][:10]:  # Limiter à 10
            print(f"  - {erreur['etudiant']}")
            print(f"    Attendu: {erreur['attendu']}")
            print(f"    Actuel: {erreur['actuel']}")
        if len(resultats['erreurs_classe']) > 10:
            print(f"  ... et {len(resultats['erreurs_classe']) - 10} autres")
    
    if resultats['etudiants_manquants']:
        print(f"\n❌ Étudiants manquants ({len(resultats['etudiants_manquants'])}):")
        for etudiant in resultats['etudiants_manquants'][:20]:  # Limiter à 20
            print(f"  - {etudiant['nom']} ({etudiant['professeur']}, {etudiant['classe']})")
        if len(resultats['etudiants_manquants']) > 20:
            print(f"  ... et {len(resultats['etudiants_manquants']) - 20} autres")
    
    # Verdict final
    print(f"\n{'='*80}")
    if resultats['total_manquant'] == 0 and not resultats['erreurs_classe']:
        print("✅ VÉRIFICATION RÉUSSIE - Toutes les données correspondent!")
    elif taux_reussite >= 95:
        print("⚠️  VÉRIFICATION PARTIELLE - Quelques différences mineures")
    else:
        print("❌ VÉRIFICATION ÉCHOUÉE - Différences importantes détectées")
    print("="*80)


def main():
    """Fonction principale"""
    try:
        resultats = verifier_classes()
        afficher_resume(resultats)
        
        # Code de sortie
        if resultats['total_manquant'] == 0 and not resultats['erreurs_classe']:
            sys.exit(0)
        else:
            sys.exit(1)
            
    except Exception as e:
        print(f"\n❌ Erreur lors de la vérification: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
