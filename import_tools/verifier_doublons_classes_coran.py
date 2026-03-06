"""
Vérifier s'il y a des doublons dans classes_coran.txt
"""
import os
from parser_classes_coran import parser_fichier_classes

# Mapping des corrections
CORRECTIONS = {
    'aïcha_hamidi': 'aicha_hamidi',
    'haretha_abdellah_ba': 'baharetha_abdellah',
    'inés_adjtoutah': 'ines_adjtoutah',
    'kaïs_redradj': 'kais_redradj',
    'khail_wahidouallah_jabar': 'jabarkhail_wahidouallah',
    'leïla_rahmaoui': 'leila_rahmaoui',
    'mohamed_marjani_omar': 'omarmohamed_marjani',
    'oumaïma_soltani': 'oumaima_soltani',
    'rokia_ferrera_neves': 'nevesrokia_ferrera',
    'tasnime_ben_ali': 'alitasnime_ben',
    'tasnime_ferrera_neves': 'nevestasnime_ferrera',
    'tayssir_ben_ali': 'alitayssir_ben',
    'youssef_ben_ali': 'aliyoussef_ben',
}

def corriger_username(username):
    return CORRECTIONS.get(username, username)

assignations = parser_fichier_classes()

print("\n" + "="*70)
print("VÉRIFICATION DES DOUBLONS")
print("="*70)

# Compter les étudiants par classe
etudiants_10h45 = []
etudiants_8h45 = []

for prof_name, etudiants in assignations['10h45'].items():
    for username in etudiants:
        username_corrige = corriger_username(username)
        etudiants_10h45.append((username_corrige, prof_name))

for prof_name, etudiants in assignations['8h45'].items():
    for username in etudiants:
        username_corrige = corriger_username(username)
        etudiants_8h45.append((username_corrige, prof_name))

print(f"\nCLASSE 10h45 (fichier):")
print(f"  Total assignations: {len(etudiants_10h45)}")
print(f"  Étudiants uniques: {len(set(e[0] for e in etudiants_10h45))}")

print(f"\nCLASSE 8h45 (fichier):")
print(f"  Total assignations: {len(etudiants_8h45)}")
print(f"  Étudiants uniques: {len(set(e[0] for e in etudiants_8h45))}")

# Chercher les doublons dans chaque classe
print("\n" + "="*70)
print("DOUBLONS DANS CLASSE 10h45")
print("="*70)

from collections import Counter
counter_10h45 = Counter(e[0] for e in etudiants_10h45)
doublons_10h45 = {k: v for k, v in counter_10h45.items() if v > 1}

if doublons_10h45:
    for username, count in doublons_10h45.items():
        print(f"\n{username}: {count} fois")
        profs = [prof for u, prof in etudiants_10h45 if u == username]
        for prof in profs:
            print(f"  - Prof {prof}")
else:
    print("Aucun doublon")

print("\n" + "="*70)
print("DOUBLONS DANS CLASSE 8h45")
print("="*70)

counter_8h45 = Counter(e[0] for e in etudiants_8h45)
doublons_8h45 = {k: v for k, v in counter_8h45.items() if v > 1}

if doublons_8h45:
    for username, count in doublons_8h45.items():
        print(f"\n{username}: {count} fois")
        profs = [prof for u, prof in etudiants_8h45 if u == username]
        for prof in profs:
            print(f"  - Prof {prof}")
else:
    print("Aucun doublon")

# Total unique
tous_etudiants = set(e[0] for e in etudiants_10h45 + etudiants_8h45)
print("\n" + "="*70)
print("TOTAL")
print("="*70)
print(f"Total assignations: {len(etudiants_10h45) + len(etudiants_8h45)}")
print(f"Étudiants uniques: {len(tous_etudiants)}")
