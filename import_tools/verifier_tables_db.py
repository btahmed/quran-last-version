"""
Vérifier les tables de la base de données
"""
import os
import sqlite3

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'ancien django', 'MYSITEE', 'MYSITEE', 'db.sqlite3')

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Lister toutes les tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()

print("\n" + "="*60)
print("TABLES DANS LA BASE DE DONNÉES")
print("="*60)

for table in tables:
    print(f"  - {table[0]}")

# Chercher les tables qui contiennent 'user'
print("\n" + "="*60)
print("TABLES CONTENANT 'user'")
print("="*60)

for table in tables:
    if 'user' in table[0].lower():
        print(f"\n📋 Table: {table[0]}")
        
        # Afficher les colonnes
        cursor.execute(f"PRAGMA table_info({table[0]})")
        columns = cursor.fetchall()
        
        print("  Colonnes:")
        for col in columns:
            print(f"    - {col[1]} ({col[2]})")
        
        # Compter les lignes
        cursor.execute(f"SELECT COUNT(*) FROM {table[0]}")
        count = cursor.fetchone()[0]
        print(f"  Total: {count} lignes")

conn.close()
