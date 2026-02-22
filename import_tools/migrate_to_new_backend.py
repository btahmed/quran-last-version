"""
Script de migration des utilisateurs de l'ancien Django (MYSITEE) vers le nouveau backend.

Usage :
    cd QuranReviewLocal/backend
    venv/Scripts/python ../import_tools/migrate_to_new_backend.py

Pré-requis :
    - L'ancien DB SQLite doit exister à :
      ../ancien django/MYSITEE/MYSITEE/db.sqlite3
    - Le nouveau backend doit avoir ses migrations appliquées
"""

import os
import sys
import json
import sqlite3

# Ajouter le backend au path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(BASE_DIR, 'backend')
OLD_DB = os.path.join(BASE_DIR, 'ancien django', 'MYSITEE', 'MYSITEE', 'db.sqlite3')

sys.path.insert(0, BACKEND_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quranreview.settings')

import django
django.setup()

from authentication.models import User


def export_from_old_db():
    """Exporte les users depuis l'ancienne DB SQLite."""
    if not os.path.exists(OLD_DB):
        raise FileNotFoundError(f"Ancienne DB introuvable : {OLD_DB}")

    conn = sqlite3.connect(OLD_DB)
    cursor = conn.cursor()
    cursor.execute(
        'SELECT username, first_name, last_name, email, role, is_superuser, is_staff '
        'FROM tasks_user'
    )
    rows = cursor.fetchall()
    conn.close()

    cols = ['username', 'first_name', 'last_name', 'email', 'role', 'is_superuser', 'is_staff']
    users = [dict(zip(cols, r)) for r in rows]
    print(f"Export ancienne DB : {len(users)} users "
          f"({sum(1 for u in users if u['role']=='student')} étudiants, "
          f"{sum(1 for u in users if u['role']=='teacher')} profs)")
    return users


def import_to_new_backend(users, default_password='QuranReview2026'):
    """Importe les users dans le nouveau backend."""
    created = skipped = 0

    for u in users:
        username = u.get('username')
        if not username:
            continue

        if User.objects.filter(username=username).exists():
            skipped += 1
            continue

        role = u.get('role', 'student')
        if role not in ['student', 'teacher', 'admin']:
            role = 'student'

        User.objects.create_user(
            username=username,
            email=u.get('email', ''),
            first_name=u.get('first_name', ''),
            last_name=u.get('last_name', ''),
            role=role,
            is_staff=bool(u.get('is_staff', False)),
            is_superuser=bool(u.get('is_superuser', False)),
            password=default_password,
        )
        created += 1

    return created, skipped


def print_summary():
    """Affiche le résumé de la base."""
    print("\n=== RÉSULTAT FINAL ===")
    print(f"Total users   : {User.objects.count()}")
    print(f"Étudiants     : {User.objects.filter(role='student').count()}")
    print(f"Professeurs   : {User.objects.filter(role='teacher').count()}")
    print(f"Admins        : {User.objects.filter(role='admin').count()}")


if __name__ == '__main__':
    print("Migration ancien Django → nouveau backend")
    print("=" * 50)

    users = export_from_old_db()
    created, skipped = import_to_new_backend(users)

    print(f"\nImport : {created} créés, {skipped} skippés (existants)")
    print_summary()
