"""
Chercher l'étudiant mohamed_el_mehadji dans la base
"""
import os
import sqlite3

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'ancien django', 'MYSITEE', 'MYSITEE', 'db.sqlite3')

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

print("\n" + "="*60)
print("RECHERCHE: mohamed_el_mehadji")
print("="*60)

# Chercher des usernames similaires
patterns = ['%mehadji%', '%el_mehadji%', '%mohamed%mehadji%', '%mahadji%']

for pattern in patterns:
    cursor.execute("SELECT username FROM tasks_user WHERE username LIKE ? AND role = 'student'", (pattern,))
    results = cursor.fetchall()
    
    if results:
        print(f"\n✓ Pattern '{pattern}':")
        for row in results:
            print(f"  - {row[0]}")

conn.close()
