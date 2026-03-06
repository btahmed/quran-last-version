"""
Créer la relation professeur → étudiants spécifiques
Basé sur le fichier Classes_CORAN.md
"""
import os
import sys
import django

# Configuration Django
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'ancien django', 'MYSITEE', 'MYSITEE'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.db import connection

User = get_user_model()

# Données depuis Classes_CORAN.md
ASSIGNATIONS = {
    'prof_ibrahim': [
        'ANEFLOUS Salma', 'AZZEDDINE Ferriel', 'BAIDA Ritaj', 'BENATHMANE Yasmine',
        'BENMOUSSA Ines', 'BENSALEM Ines', 'BENSALEM Lina', 'BENSALEM Malak',
        'BENSALEM Maryam', 'BENSALEM Nour', 'BENSALEM Rayan', 'BENSALEM Yousra',
        'BENSALMA Ines', 'BENSALMA Lina', 'BENSALMA Malak', 'BENSALMA Maryam',
        'BENSALMA Nour', 'BENSALMA Rayan', 'BENSALMA Yousra', 'BOUABDALLAH Ines',
        # ... (liste complète à ajouter)
    ],
    'prof_wassim': [
        'BAIDA Ritaj', 'BENATHMANE Yasmine', 'MILED Lina', 'ABADA Imene',
        'ABADA Janna', 'REDRADJ Anais', 'ALI ABDELGHAFOUR Heline',
        'FERRERA NEVES Rokia', 'EL FEKAIR Malika', 'SOLTANI Oumaima'
    ],
    # ... autres professeurs
}

def verifier_champ_teachers():
    """Vérifier si le champ 'teachers' existe déjà"""
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='tasks_user'
        """)
        columns = [row[0] for row in cursor.fetchall()]
    
    return 'teachers' in columns or any('teacher' in col for col in columns)

def creer_table_relation():
    """Créer une table de relation professeur-étudiant"""
    print("\n📋 Création de la table de relation...")
    
    with connection.cursor() as cursor:
        # Vérifier si la table existe déjà
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='teacher_student_relation'
        """)
        
        if cursor.fetchone():
            print("✓ Table 'teacher_student_relation' existe déjà")
            return True
        
        # Créer la table
        cursor.execute("""
            CREATE TABLE teacher_student_relation (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                teacher_id INTEGER NOT NULL,
                student_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (teacher_id) REFERENCES tasks_user(id),
                FOREIGN KEY (student_id) REFERENCES tasks_user(id),
                UNIQUE(teacher_id, student_id)
            )
        """)
        
        # Créer des index pour performance
        cursor.execute("""
            CREATE INDEX idx_teacher_student_teacher 
            ON teacher_student_relation(teacher_id)
        """)
        cursor.execute("""
            CREATE INDEX idx_teacher_student_student 
            ON teacher_student_relation(student_id)
        """)
        
        print("✓ Table 'teacher_student_relation' créée avec succès")
        return True

def assigner_etudiants_prof(prof_username, etudiants_noms):
    """Assigner des étudiants à un professeur"""
    prof = User.objects.filter(username=prof_username).first()
    
    if not prof:
        print(f"❌ Professeur {prof_username} non trouvé")
        return 0, 0
    
    print(f"\n👨‍🏫 Professeur: {prof_username}")
    
    trouves = 0
    non_trouves = 0
    
    with connection.cursor() as cursor:
        for nom_complet in etudiants_noms:
            # Chercher l'étudiant par nom
            parts = nom_complet.split()
            if len(parts) >= 2:
                nom = parts[0]
                prenom = ' '.join(parts[1:])
                
                # Essayer plusieurs variantes
                student = User.objects.filter(
                    role='student',
                    last_name__iexact=nom,
                    first_name__iexact=prenom
                ).first()
                
                if not student:
                    # Essayer inversé
                    student = User.objects.filter(
                        role='student',
                        last_name__iexact=prenom,
                        first_name__iexact=nom
                    ).first()
                
                if student:
                    # Insérer la relation (ignorer si existe déjà)
                    try:
                        cursor.execute("""
                            INSERT OR IGNORE INTO teacher_student_relation 
                            (teacher_id, student_id) VALUES (?, ?)
                        """, [prof.id, student.id])
                        trouves += 1
                        print(f"  ✓ {nom_complet} → {student.username}")
                    except Exception as e:
                        print(f"  ❌ Erreur pour {nom_complet}: {e}")
                else:
                    non_trouves += 1
                    print(f"  ❌ Non trouvé: {nom_complet}")
    
    return trouves, non_trouves

def main():
    print("\n" + "="*60)
    print("CRÉATION DE LA RELATION PROFESSEUR → ÉTUDIANTS")
    print("="*60)
    
    # Créer la table
    if not creer_table_relation():
        print("❌ Échec de création de la table")
        return
    
    # Assigner les étudiants
    print("\n📝 Assignation des étudiants...")
    
    total_trouves = 0
    total_non_trouves = 0
    
    for prof_username, etudiants in ASSIGNATIONS.items():
        trouves, non_trouves = assigner_etudiants_prof(prof_username, etudiants)
        total_trouves += trouves
        total_non_trouves += non_trouves
    
    print("\n" + "="*60)
    print("RÉSUMÉ")
    print("="*60)
    print(f"✓ Étudiants assignés: {total_trouves}")
    print(f"❌ Étudiants non trouvés: {total_non_trouves}")
    print(f"📊 Taux de réussite: {total_trouves/(total_trouves+total_non_trouves)*100:.1f}%")

if __name__ == '__main__':
    main()
