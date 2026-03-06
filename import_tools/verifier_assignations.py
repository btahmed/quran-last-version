"""
Vérifier comment les étudiants sont assignés aux professeurs
"""
import os
import sys
import django

# Configuration Django
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'ancien django', 'MYSITEE', 'MYSITEE'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite.settings')
django.setup()

from django.contrib.auth import get_user_model
from tasks.models import Task

User = get_user_model()

def verifier_assignations():
    """Vérifier les relations entre professeurs et étudiants"""
    
    print("\n" + "="*60)
    print("VÉRIFICATION DES ASSIGNATIONS PROFESSEURS-ÉTUDIANTS")
    print("="*60)
    
    # Vérifier s'il existe un modèle de relation directe
    print("\n1. Modèles disponibles:")
    print(f"   - User: {User}")
    print(f"   - Task: {Task}")
    
    # Vérifier les champs du modèle User
    print("\n2. Champs du modèle User:")
    user_fields = [f.name for f in User._meta.get_fields()]
    print(f"   Champs: {', '.join(user_fields)}")
    
    # Chercher des relations professeur-étudiant
    print("\n3. Relations possibles:")
    
    # Via les tâches assignées
    prof = User.objects.filter(username='prof_ibrahim').first()
    if prof:
        print(f"\n   Professeur: {prof.username}")
        
        # Tâches créées par ce professeur
        tasks_created = Task.objects.filter(author=prof).count()
        print(f"   - Tâches créées: {tasks_created}")
        
        if tasks_created > 0:
            task = Task.objects.filter(author=prof).first()
            print(f"   - Exemple de tâche: {task.title}")
            print(f"   - Étudiants assignés à cette tâche: {task.assigned_users.count()}")
            
            if task.assigned_users.count() > 0:
                print(f"   - Premiers étudiants:")
                for student in task.assigned_users.all()[:3]:
                    print(f"     * {student.first_name} {student.last_name} ({student.username})")
    
    # Vérifier si les étudiants ont un champ "teacher" ou similaire
    print("\n4. Chercher un champ de relation directe:")
    student = User.objects.filter(role='student').first()
    if student:
        print(f"   Étudiant: {student.username}")
        for field in User._meta.get_fields():
            if 'teacher' in field.name.lower() or 'prof' in field.name.lower():
                print(f"   - Champ trouvé: {field.name}")
    
    # Vérifier les groupes
    print("\n5. Système actuel (groupes):")
    print(f"   - prof_ibrahim est dans: {list(prof.groups.values_list('name', flat=True))}")
    print(f"   - Tous les étudiants de Classe_8h45: {User.objects.filter(groups__name='Classe_8h45', role='student').count()}")
    
    print("\n" + "="*60)
    print("CONCLUSION:")
    print("="*60)
    print("\nLe système actuel utilise les GROUPES pour filtrer.")
    print("Il n'y a PAS de relation directe professeur → étudiants spécifiques.")
    print("\nOptions:")
    print("1. Créer un nouveau modèle de relation (TeacherStudent)")
    print("2. Utiliser un champ ManyToMany sur User")
    print("3. Utiliser les tâches assignées comme proxy")
    print("4. Créer des sous-groupes (ex: Classe_8h45_Prof_Ibrahim)")

if __name__ == '__main__':
    verifier_assignations()
