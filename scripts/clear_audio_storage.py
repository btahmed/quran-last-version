"""
clear_audio_storage.py
Supprime tous les fichiers audio de test dans le bucket audio-submissions.

Usage :
  SUPABASE_URL=https://xxx.supabase.co \
  SUPABASE_SERVICE_KEY=eyJ... \
  python scripts/clear_audio_storage.py
"""

import os, sys

try:
    from supabase import create_client
except ImportError:
    print("❌ pip install supabase")
    sys.exit(1)

SUPABASE_URL     = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
BUCKET           = "audio-submissions"

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ Variables manquantes : SUPABASE_URL et SUPABASE_SERVICE_KEY")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

print(f"[*] Listage des fichiers dans '{BUCKET}'...")
res = supabase.storage.from_(BUCKET).list("", {"limit": 1000})

if not res:
    print("[OK] Bucket deja vide.")
    sys.exit(0)

# res contient les dossiers (UUID des users) — on liste les fichiers dans chaque dossier
all_paths = []
for folder in res:
    folder_name = folder["name"]
    files = supabase.storage.from_(BUCKET).list(folder_name, {"limit": 1000})
    for f in files:
        all_paths.append(f"{folder_name}/{f['name']}")

if not all_paths:
    print("[OK] Aucun fichier trouve.")
    sys.exit(0)

print(f"[*] {len(all_paths)} fichiers a supprimer...")

# Supprimer par lots de 100
BATCH = 100
deleted = 0
for i in range(0, len(all_paths), BATCH):
    batch = all_paths[i:i+BATCH]
    supabase.storage.from_(BUCKET).remove(batch)
    deleted += len(batch)
    print(f"    {deleted}/{len(all_paths)} supprimes")

print(f"\n[DONE] Bucket '{BUCKET}' vide — {deleted} fichiers supprimes.")
