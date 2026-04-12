"""
import_users_supabase.py
Importe tous les utilisateurs (étudiants, profs, admins) vers le nouveau Supabase.

Prérequis :
  pip install supabase

Usage :
  SUPABASE_URL=https://xxx.supabase.co \
  SUPABASE_SERVICE_KEY=eyJ... \
  python scripts/import_students_supabase.py
"""

import os
import sys
import time

try:
    from supabase import create_client
except ImportError:
    print("❌ Installe supabase-py : pip install supabase")
    sys.exit(1)

# ─── Configuration ────────────────────────────────────────
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")  # SERVICE_ROLE key (pas anon)

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ Variables d'environnement manquantes :")
    print("   SUPABASE_URL et SUPABASE_SERVICE_KEY sont requis")
    print()
    print("   Trouve SERVICE_ROLE key dans : Supabase > Settings > API > service_role")
    sys.exit(1)

# Mot de passe par défaut pour tous les étudiants
DEFAULT_PASSWORD = "QuranReview2026"

# ─── Tous les utilisateurs : (username, first_name, last_name, role, email) ──
# email=None → génère username@quranreview.local automatiquement
ALL_USERS = [
    # ── ADMINS ────────────────────────────────────────────
    ("AHMAD",          "",      "",            "admin",   "AHMAD@gmail.com"),
    ("admin",          "",      "",            "admin",   "admin@quranreview.ma"),
    ("administrateur", "Admin", "QuranReview", "admin",   "admin@quranreview.local"),

    # ── PROFESSEURS ───────────────────────────────────────
    ("prof_abdallah",          "Abdallah",    "",          "teacher", None),
    ("prof_abdelhadi",         "Abdelhadi",   "",          "teacher", None),
    ("prof_abou_abdellatif",   "Abdellatif",  "Abou",      "teacher", None),
    ("prof_abou_fadi",         "Fadi",        "Abou",      "teacher", None),
    ("prof_abou_mostafa",      "Mostafa",     "Abou",      "teacher", None),
    ("prof_ahmed",             "Ahmed",       "",          "teacher", None),
    ("prof_ahmed_mahjoubi",    "Mahjoubi",    "Ahmed",     "teacher", None),
    ("prof_camilia",           "Camilia",     "",          "teacher", None),
    ("prof_ibrahim",           "Ibrahim",     "",          "teacher", None),
    ("prof_mohammadine",       "Mohammadine", "",          "teacher", None),
    ("prof_nahila",            "Nahila",      "",          "teacher", None),
    ("prof_najlaa",            "Najlaa",      "",          "teacher", None),
    ("prof_oum_amine",         "Amine",       "Oum",       "teacher", None),
    ("prof_oum_wael",          "Wael",        "Oum",       "teacher", None),
    ("prof_salahdine",         "Salahdine",   "",          "teacher", None),
    ("prof_salsabile",         "Salsabile",   "",          "teacher", None),
    ("prof_surat_al_kafiroun", "al kafiroun", "surat",     "teacher", None),
    ("prof_wassim",            "Wassim",      "",          "teacher", None),
    ("prof_youssef",           "Youssef",     "",          "teacher", None),
    ("professeur",             "Mohamed",     "Professeur","teacher", "prof@quranreview.local"),

    # ── ÉTUDIANTS ─────────────────────────────────────────
]

STUDENTS = [
    ("abdelbasset_kolli", "Abdelbasset", "KOLLI"),
    ("abdullah_badi", "Abdullah", "BADI"),
    ("adem_bennama", "Adem", "BENNAMA"),
    ("adem_bouattour", "Adem", "BOUATTOUR"),
    ("adem_loubane", "Adem", "LOUBANE"),
    ("adem_majberi", "Adem", "MAJBERI"),
    ("adem_rahmaoui", "Adem", "RAHMAOUI"),
    ("ahmed_fatine", "Ahmed", "FATINE"),
    ("aicha_benkhedra", "Aicha", "BENKHEDRA"),
    ("aicha_hamidi", "Aïcha", "HAMIDI"),
    ("akram_boussaf", "Akram", "BOUSSAF"),
    ("akram_tazoult", "Akram", "TAZOULT"),
    ("alaa_chelghmia", "Alaa", "CHELGHMIA"),
    ("ali_butun", "Ali", "BUTUN"),
    ("alitasnime_ben", "ALI Tasnime", "BEN"),
    ("alitayssir_ben", "ALI Tayssir", "BEN"),
    ("aliyoussef_ben", "ALI Youssef", "BEN"),
    ("amina_bennama", "Amina", "BENNAMA"),
    ("amine_el_meski_mohamed", "Amine", "El Meski Mohamed"),
    ("amira_jalil", "Amira", "JALIL"),
    ("amira_tajani", "Amira", "TAJANI"),
    ("anais_redradj", "Anais", "REDRADJ"),
    ("anas_adjtoutah", "Anas", "ADJTOUTAH"),
    ("anas_bennacer", "Anas", "BENNACER"),
    ("anas_salmane", "Anas", "SALMANE"),
    ("anis_kerioui", "Anis", "KERIOUI"),
    ("arwa_chelaghmia", "Arwa", "CHELAGHMIA"),
    ("assil_mandjam", "Assil", "MANDJAM"),
    ("assil_moughamir", "Assil", "MOUGHAMIR"),
    ("assya_abi", "Assya", "ABI"),
    ("aya_amzel", "Aya", "AMZEL"),
    ("aya_dhib", "Aya", "DHIB"),
    ("ayma_attoumane", "Ayma", "ATTOUMANE"),
    ("aymen_el_kabir", "Aymen", "El Kabir"),
    ("ayoub_asrih_mohamed", "Ayoub", "Asrih Mohamed"),
    ("ayoub_badi", "Ayoub", "BADI"),
    ("badereddine_marjani", "Badereddine", "MARJANI"),
    ("baharetha_abdellah", "BA HARETHA", "ABDELLAH"),
    ("basma_hamada", "Basma", "HAMADA"),
    ("bilal_butun", "Bilal", "BUTUN"),
    ("bilal_ouachikh", "Bilal", "OUACHIKH"),
    ("chahine_dahbi", "Chahine", "DAHBI"),
    ("daoud_ben_romdhane", "Daoud", "Ben Romdhane"),
    ("dayane_alibaco", "Dayane", "ALIBACO"),
    ("douaa_ouadah", "Douaa", "OUADAH"),
    ("dounia_sahraoui", "Dounia", "SAHRAOUI"),
    ("driss_mandjam", "Driss", "MANDJAM"),
    ("edine_hadhy", "Edine", "HADHY"),
    ("enel_hadhy", "Enel", "HADHY"),
    ("enes_hadhy", "Enes", "HADHY"),
    ("ewan_ali_abdelghafour", "Ewan", "Ali Abdelghafour"),
    ("fahim_wahidouallah", "Fahim", "WAHIDOUALLAH"),
    ("farah_azzeddine", "Farah", "AZZEDDINE"),
    ("farah_zaidane", "Farah", "ZAIDANE"),
    ("fatima_attoumane", "Fatima", "ATTOUMANE"),
    ("fatima_ilmi", "Fatima", "ILMI"),
    ("feradous_lahyene", "Feradous", "LAHYENE"),
    ("ferriel_azzeddine", "Ferriel", "AZZEDDINE"),
    ("hafidou_abi", "Hafidou", "ABI"),
    ("hafsa_bouldjihad", "Hafsa", "BOULDJIHAD"),
    ("hajer_ouadah", "Hajer", "OUADAH"),
    ("halima_khiar", "Halima", "KHIAR"),
    ("hanane_athoumane", "Hanane", "ATHOUMANE"),
    ("hayat_yakhni", "Hayat", "YAKHNI"),
    ("heline_ali_abdelghafour", "Heline", "Ali Abdelghafour"),
    ("heline_salmane", "Heline", "SALMANE"),
    ("ibrahim_saidina", "Ibrahim", "SAIDINA"),
    ("idriss_najmi", "Idriss", "NAJMI"),
    ("ilyas_aneflous", "Ilyas", "ANEFLOUS"),
    ("ilyas_chellah", "Ilyas", "CHELLAH"),
    ("ilyas_el_kabir", "Ilyas", "El Kabir"),
    ("ilyes_aissaoui", "Ilyes", "AISSAOUI"),
    ("ilyes_bouattour", "Ilyes", "BOUATTOUR"),
    ("imene_abada", "Imene", "ABADA"),
    ("imrane_maoudoud", "Imrane", "MAOUDOUD"),
    ("inaya_benmoussa", "Inaya", "BENMOUSSA"),
    ("inaya_boulaabi", "Inaya", "BOULAABI"),
    ("inaya_sahraoui", "Inaya", "SAHRAOUI"),
    ("ines_adjtoutah", "Inés", "ADJTOUTAH"),
    ("intissar_agnide", "Intissar", "AGNIDE"),
    ("isaac_gonzil", "Isaac", "GONZIL"),
    ("islam_draibine", "Islam", "DRAIBINE"),
    ("ismael_assani", "Ismael", "ASSANI"),
    ("ismael_saidina", "Ismael", "SAIDINA"),
    ("ismail_najmi", "Ismail", "NAJMI"),
    ("issra_dhib", "Issra", "DHIB"),
    ("iyad_benkirane", "Iyad", "BENKIRANE"),
    ("iyad_ouachikh", "Iyad", "OUACHIKH"),
    ("iyed_hamada", "Iyed", "HAMADA"),
    ("jabarkhail_wahidouallah", "Jabar khail", "WAHIDOUALLAH"),
    ("jalil_yassine", "JALIL", "YASSINE"),
    ("janna_abada", "Janna", "ABADA"),
    ("jassim_ferdjouni", "Jassim", "FERDJOUNI"),
    ("jihad_ennaji", "Jihad", "ENNAJI"),
    ("jihene_chettah", "Jihene", "CHETTAH"),
    ("jihene_hemissi", "Jihene", "HEMISSI"),
    ("joumanah_el_mahadji", "Joumanah", "El Mahadji"),
    ("kahil_bourazi", "Kahil", "BOURAZI"),
    ("kais_redradj", "Kaïs", "REDRADJ"),
    ("kamil_lamalem", "Kamil", "LAMALEM"),
    ("karim_ali_ibrahimy", "Karim", "Ali Ibrahimy"),
    ("karim_bennamou", "karim", "BENNAMOU"),
    ("kawtar_chahid", "Kawtar", "CHAHID"),
    ("kenza_ammar", "Kenza", "AMMAR"),
    ("kenza_ben_romdhane", "Kenza", "Ben Romdhane"),
    ("khadija_bouamama", "Khadija", "BOUAMAMA"),
    ("layla_beradjem", "Layla", "BERADJEM"),
    ("leila_rahmaoui", "Leïla", "RAHMAOUI"),
    ("leyth_aissaoui", "Leyth", "AISSAOUI"),
    ("lilia_sahraoui", "Lilia", "SAHRAOUI"),
    ("lina_maoudoud", "Lina", "MAOUDOUD"),
    ("lina_miled", "Lina", "MILED"),
    ("lyne_saadouli", "Lyne", "SAADOULI"),
    ("mairick_gonzil", "Mairick", "GONZIL"),
    ("maissa_bouldjihad", "Maissa", "BOULDJIHAD"),
    ("majd_tajani", "Majd", "TAJANI"),
    ("malak_jalil", "Malak", "JALIL"),
    ("malak_tajani", "Malak", "TAJANI"),
    ("malika_el_fekair", "Malika", "El Fekair"),
    ("maria_zaidane", "Maria", "ZAIDANE"),
    ("mariam_el_haimeur", "Mariam", "El Haimeur"),
    ("maroua_jmila", "Maroua", "JMILA"),
    ("marwa_boukhalfa", "Marwa", "BOUKHALFA"),
    ("marwa_tazoult", "Marwa", "TAZOULT"),
    ("mayssa_maazouz", "Mayssa", "MAAZOUZ"),
    ("mehdi_najmi", "Mehdi", "NAJMI"),
    ("miradj_butun", "Miradj", "BUTUN"),
    ("mohamed_boulaabi", "Mohamed", "BOULAABI"),
    ("mohamed_camara", "Mohamed", "CAMARA"),
    ("mohamed_el_haimeur", "Mohamed", "El Haimeur"),
    ("mohamed_el_mehadji", "MEHADJI Mohamed", "EL"),
    ("mohamed_majberi", "Mohamed", "MAJBERI"),
    ("mohamed_miled", "Mohamed", "MILED"),
    ("mohamed_ouadah", "Mohamed", "OUADAH"),
    ("mostafa_salmane", "Mostafa", "SALMANE"),
    ("mouad_binchoula", "Mouad", "BINCHOULA"),
    ("mouhamed_abi", "Mouhamed", "ABI"),
    ("mouslime_abi", "Mouslime", "ABI"),
    ("nada_hamada", "Nada", "HAMADA"),
    ("nada_maghraoui", "Nada", "MAGHRAOUI"),
    ("nahila_benathmane", "Nahila", "BENATHMANE"),
    ("nahila_bennamou", "Nahila", "BENNAMOU"),
    ("najat_margoum", "Najat", "MARGOUM"),
    ("najih_agnide", "Najih", "AGNIDE"),
    ("neila_boulaabi", "Neila", "BOULAABI"),
    ("nevesrokia_ferrera", "NEVES Rokia", "FERRERA"),
    ("nevestasnime_ferrera", "NEVES Tasnime", "FERRERA"),
    ("nihel_bennama", "Nihel", "BENNAMA"),
    ("nour_asrih", "Nour", "ASRIH"),
    ("odia_camara", "Odia", "CAMARA"),
    ("omar_binchoula", "Omar", "BINCHOULA"),
    ("omar_el_qamari", "Omar", "El Qamari"),
    ("omar_fadhloui", "Omar", "FADHLOUI"),
    ("omar_kebtani", "Omar", "KEBTANI"),
    ("omarmohamed_marjani", "Omar Mohamed", "MARJANI"),
    ("oumaima_margoum", "Oumaima", "MARGOUM"),
    ("oumaima_soltani", "Oumaïma", "SOLTANI"),
    ("oussama_saoudi", "Oussama", "SAOUDI"),
    ("owayss_moughamir", "Owayss", "MOUGHAMIR"),
    ("ranya_boussaf", "Ranya", "BOUSSAF"),
    ("rayan_ammar", "Rayan", "AMMAR"),
    ("rayane_adnane", "Rayane", "ADNANE"),
    ("rayane_jemma", "Rayane", "JEMMA"),
    ("rayane_majberi", "Rayane", "MAJBERI"),
    ("ridha_saidi", "Ridha", "SAIDI"),
    ("ritaj_baida", "Ritaj", "BAIDA"),
    ("roufaida_kebtani", "Roufaida", "KEBTANI"),
    ("saja_boukhalfa", "Saja", "BOUKHALFA"),
    ("salim_martins", "Salim", "MARTINS"),
    ("salma_aneflous", "Salma", "ANEFLOUS"),
    ("salsabile_boukhalfa", "Salsabile", "BOUKHALFA"),
    ("sarah_bennama", "Sarah", "BENNAMA"),
    ("sayane_toiybou", "Sayane", "TOIYBOU"),
    ("smahen_dahbi", "Smahen", "DAHBI"),
    ("sohane_dahbi", "Sohane", "DAHBI"),
    ("soline_salmane", "Soline", "SALMANE"),
    ("souleymane_benmohamed", "Souleymane", "BENMOHAMED"),
    ("soumaya_attoumane", "Soumaya", "ATTOUMANE"),
    ("tasnime_boukhalfa", "Tasnime", "BOUKHALFA"),
    ("tasnime_hajili", "Tasnime", "HAJILI"),
    ("tasnime_wifaya", "Tasnime", "WIFAYA"),
    ("tesnime_asrih", "Tesnime", "ASRIH"),
    ("wael_loumbarkia", "Wael", "LOUMBARKIA"),
    ("wijdene_hemissi", "Wijdene", "HEMISSI"),
    ("yahya_saadouli", "Yahya", "SAADOULI"),
    ("yanis_bourazi", "Yanis", "BOURAZI"),
    ("yanis_delhostal", "Yanis", "DELHOSTAL"),
    ("yanis_ezunke", "Yanis", "EZUNKE"),
    ("yanis_lallam_mohamed", "Yanis", "Lallam Mohamed"),
    ("yaqine_benkirane", "Yaqine", "BENKIRANE"),
    ("yasmine_benathmane", "Yasmine", "BENATHMANE"),
    ("yazid_ouachikh", "Yazid", "OUACHIKH"),
    ("younes_athoumane", "Younes", "ATHOUMANE"),
    ("younes_kerioui", "Younes", "KERIOUI"),
    ("youssra_jalil", "Youssra", "JALIL"),
    ("zahra_jmila_fatima", "Zahra", "Jmila Fatima"),
    ("zakaria_el_idrissi", "Zakaria", "El Idrissi"),
    ("zakaria_loubane", "Zakaria", "LOUBANE"),
    ("zakaria_saadouli", "Zakaria", "SAADOULI"),
    ("ziyad_el_kabir", "Ziyad", "El Kabir"),
]

# Fusionner étudiants dans ALL_USERS
ALL_USERS += [(u, f, l, "student", None) for u, f, l in STUDENTS]


def main():
    print(f"🔗 Connexion à {SUPABASE_URL[:40]}...")
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    total = len(ALL_USERS)
    ok = 0
    skipped = 0
    errors = []

    # Grouper par rôle pour affichage
    by_role = {"admin": [], "teacher": [], "student": []}
    for u in ALL_USERS:
        by_role[u[3]].append(u)

    print(f"📋 {total} utilisateurs à importer :")
    print(f"   👑 {len(by_role['admin'])} admins")
    print(f"   🎓 {len(by_role['teacher'])} professeurs")
    print(f"   📚 {len(by_role['student'])} étudiants")
    print()

    for i, (username, first_name, last_name, role, email_override) in enumerate(ALL_USERS, 1):
        email = email_override or f"{username}@quranreview.local"
        role_icon = {"admin": "👑", "teacher": "🎓", "student": "📚"}.get(role, "👤")
        try:
            supabase.auth.admin.create_user({
                "email": email,
                "password": DEFAULT_PASSWORD,
                "email_confirm": True,
                "user_metadata": {
                    "username": username,
                    "role": role,
                    "first_name": first_name,
                    "last_name": last_name,
                }
            })
            print(f"  [{i:03d}/{total}] ✅ {role_icon} {username} ({role})")
            ok += 1
        except Exception as e:
            msg = str(e)
            if "already" in msg.lower() or "duplicate" in msg.lower():
                print(f"  [{i:03d}/{total}] ⚠️  {username} — déjà existant")
                skipped += 1
            else:
                print(f"  [{i:03d}/{total}] ❌ {username} — {msg}")
                errors.append((username, msg))

        # Pause tous les 10 pour éviter rate limiting
        if i % 10 == 0:
            time.sleep(1)

    print()
    print(f"✅ {ok}/{total} importés  |  ⚠️  {skipped} déjà existants  |  ❌ {len(errors)} erreurs")
    if errors:
        print("Erreurs :")
        for username, msg in errors:
            print(f"   - {username}: {msg}")
    else:
        print("🎉 Import complet !")
    print()
    print(f"Mot de passe par défaut : {DEFAULT_PASSWORD}")


if __name__ == "__main__":
    main()
