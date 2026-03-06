#!/usr/bin/env python3
"""
Script pour configurer les permissions par classe (8h45 vs 10h45)
Crée les groupes Django et assigne les utilisateurs selon leur classe
"""

import os
import sys
import django
from pathlib import Path

# Configuration Django
project_root = Path(__file__).parent.parent / "ancien django" / "MYSITEE" / "MYSITEE"
sys.path.append(str(project_root))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite.settings')

try:
    django.setup()
except Exception as e:
    print(f"❌ Erreur configuration Django: {e}")
    sys.exit(1)

from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from django.db import transaction, models
from tasks.models import User, Task


class ConfigurateurPermissions:
    """Configurateur des permissions par classe"""
    
    def __init__(self):
        self.groupe_8h45 = None
        self.groupe_10h45 = None
        self.stats = {
            'groupes_crees': 0,
            'etudiants_8h45': 0,
            'etudiants_10h45': 0,
            'professeurs_8h45': 0,
            'professeurs_10h45': 0,
            'professeurs_mixtes': 0,
            'erreurs': []
        }
    
    def creer_groupes(self):
        """Crée les groupes pour les classes"""
        print("🏗️  Création des groupes de classes...")
        
        # Groupe classe 8h45
        self.groupe_8h45, created = Group.objects.get_or_create(
            name='Classe_8h45',
            defaults={'name': 'Classe_8h45'}
        )
        if created:
            self.stats['groupes_crees'] += 1
            print(f"✅ Groupe 'Classe_8h45' créé")
        else:
            print(f"ℹ️  Groupe 'Classe_8h45' existe déjà")
        
        # Groupe classe 10h45
        self.groupe_10h45, created = Group.objects.get_or_create(
            name='Classe_10h45',
            defaults={'name': 'Classe_10h45'}
        )
        if created:
            self.stats['groupes_crees'] += 1
            print(f"✅ Groupe 'Classe_10h45' créé")
        else:
            print(f"ℹ️  Groupe 'Classe_10h45' existe déjà")
    
    def identifier_classe_utilisateur(self, user):
        """
        Identifie la classe d'un utilisateur basé sur son username
        
        Règles d'identification:
        - Professeurs: prof_mohammadine et prof_abdelhadi → les 2 classes
        - Autres professeurs: selon la liste des classes
        - Étudiants: selon la liste des imports
        """
        username = user.username.lower()
        
        # Professeurs qui enseignent dans les 2 classes
        if username in ['prof_mohammadine', 'prof_abdelhadi']:
            return ['8h45', '10h45']
        
        # Professeurs classe 8h45 uniquement
        profs_8h45 = [
            'prof_ibrahim', 'prof_oum_wael', 'prof_abou_mostafa',
            'prof_oum_amine', 'prof_abou_abdellatif', 'prof_salahdine',
            'prof_youssef'
        ]
        if username in profs_8h45:
            return ['8h45']
        
        # Professeurs classe 10h45 uniquement
        profs_10h45 = [
            'prof_abou_fadi', 'prof_abdallah', 'prof_camilia',
            'prof_surat_al_kafiroun', 'prof_ahmed_mahjoubi',
            'prof_ahmed', 'prof_nahila', 'prof_najlaa', 'prof_salsabile'
        ]
        if username in profs_10h45:
            return ['10h45']
        
        # Pour les étudiants, on utilise une heuristique basée sur les noms
        # Les étudiants de 10h45 ont été importés en premier
        # Les étudiants de 8h45 ont été importés récemment
        
        # Si c'est un étudiant récent (créé aujourd'hui), probablement 8h45
        from datetime import date
        if user.date_joined.date() == date.today() and user.role == 'student':
            return ['8h45']
        
        # Sinon, probablement 10h45 (import initial)
        if user.role == 'student':
            return ['10h45']
        
        # Par défaut, aucune classe
        return []
    
    def assigner_utilisateurs_groupes(self):
        """Assigne tous les utilisateurs aux bons groupes"""
        print("👥 Attribution des utilisateurs aux groupes...")
        
        # Récupérer tous les utilisateurs (étudiants et professeurs)
        utilisateurs = User.objects.filter(
            role__in=['student', 'teacher']
        ).exclude(is_superuser=True)
        
        print(f"📊 {utilisateurs.count()} utilisateurs à traiter")
        
        with transaction.atomic():
            for user in utilisateurs:
                try:
                    classes = self.identifier_classe_utilisateur(user)
                    
                    if not classes:
                        print(f"⚠️  {user.username}: Classe non identifiée")
                        continue
                    
                    # Retirer l'utilisateur de tous les groupes de classe
                    for group in user.groups.filter(name__in=['Classe_8h45', 'Classe_10h45']):
                        user.groups.remove(group)
                    
                    # Ajouter aux nouveaux groupes
                    for classe in classes:
                        if classe == '8h45':
                            user.groups.add(self.groupe_8h45)
                            if user.role == 'student':
                                self.stats['etudiants_8h45'] += 1
                            else:
                                self.stats['professeurs_8h45'] += 1
                        elif classe == '10h45':
                            user.groups.add(self.groupe_10h45)
                            if user.role == 'student':
                                self.stats['etudiants_10h45'] += 1
                            else:
                                self.stats['professeurs_10h45'] += 1
                    
                    # Compter les professeurs mixtes
                    if len(classes) > 1 and user.role == 'teacher':
                        self.stats['professeurs_mixtes'] += 1
                    
                    classes_str = ', '.join(classes)
                    print(f"✅ {user.username} ({user.role}): {classes_str}")
                    
                except Exception as e:
                    error_msg = f"Erreur {user.username}: {e}"
                    self.stats['erreurs'].append(error_msg)
                    print(f"❌ {error_msg}")
    
    def configurer_permissions_groupes(self):
        """Configure les permissions pour chaque groupe"""
        print("🔐 Configuration des permissions...")
        
        # Permissions de base pour tous les groupes de classe
        content_type_task = ContentType.objects.get_for_model(Task)
        content_type_user = ContentType.objects.get_for_model(User)
        
        # Permissions communes (voir les tâches, soumettre, etc.)
        permissions_communes = [
            'view_task',
            'add_task',  # Pour les professeurs
        ]
        
        try:
            for groupe in [self.groupe_8h45, self.groupe_10h45]:
                for perm_name in permissions_communes:
                    try:
                        permission = Permission.objects.get(
                            codename=perm_name,
                            content_type=content_type_task
                        )
                        groupe.permissions.add(permission)
                    except Permission.DoesNotExist:
                        print(f"⚠️  Permission '{perm_name}' non trouvée")
            
            print("✅ Permissions configurées")
            
        except Exception as e:
            error_msg = f"Erreur configuration permissions: {e}"
            self.stats['erreurs'].append(error_msg)
            print(f"❌ {error_msg}")
    
    def afficher_statistiques(self):
        """Affiche les statistiques finales"""
        print("\n" + "="*60)
        print("📊 STATISTIQUES FINALES")
        print("="*60)
        
        print(f"🏗️  Groupes créés: {self.stats['groupes_crees']}")
        print(f"👨‍🎓 Étudiants classe 8h45: {self.stats['etudiants_8h45']}")
        print(f"👨‍🎓 Étudiants classe 10h45: {self.stats['etudiants_10h45']}")
        print(f"👨‍🏫 Professeurs classe 8h45: {self.stats['professeurs_8h45']}")
        print(f"👨‍🏫 Professeurs classe 10h45: {self.stats['professeurs_10h45']}")
        print(f"👨‍🏫 Professeurs mixtes (2 classes): {self.stats['professeurs_mixtes']}")
        
        total_etudiants = self.stats['etudiants_8h45'] + self.stats['etudiants_10h45']
        total_professeurs = (self.stats['professeurs_8h45'] + 
                           self.stats['professeurs_10h45'] - 
                           self.stats['professeurs_mixtes'])  # Éviter double comptage
        
        print(f"📊 Total étudiants: {total_etudiants}")
        print(f"📊 Total professeurs: {total_professeurs}")
        
        if self.stats['erreurs']:
            print(f"\n❌ Erreurs ({len(self.stats['erreurs'])}):")
            for erreur in self.stats['erreurs']:
                print(f"   - {erreur}")
        else:
            print("\n✅ Aucune erreur")
    
    def verifier_configuration(self):
        """Vérifie que la configuration est correcte"""
        print("\n🔍 Vérification de la configuration...")
        
        # Vérifier les groupes
        groupe_8h45_count = self.groupe_8h45.user_set.count()
        groupe_10h45_count = self.groupe_10h45.user_set.count()
        
        print(f"👥 Groupe Classe_8h45: {groupe_8h45_count} membres")
        print(f"👥 Groupe Classe_10h45: {groupe_10h45_count} membres")
        
        # Vérifier les professeurs mixtes
        professeurs_mixtes = User.objects.filter(
            role='teacher',
            groups__name__in=['Classe_8h45', 'Classe_10h45']
        ).annotate(
            nb_groupes=models.Count('groups')
        ).filter(nb_groupes=2)
        
        print(f"👨‍🏫 Professeurs enseignant dans 2 classes: {professeurs_mixtes.count()}")
        for prof in professeurs_mixtes:
            print(f"   - {prof.username}")
    
    def executer(self):
        """Exécute la configuration complète"""
        print("🚀 CONFIGURATION DES PERMISSIONS PAR CLASSE")
        print("="*60)
        
        try:
            self.creer_groupes()
            self.assigner_utilisateurs_groupes()
            self.configurer_permissions_groupes()
            self.verifier_configuration()
            self.afficher_statistiques()
            
            print("\n🎉 Configuration terminée avec succès!")
            return True
            
        except Exception as e:
            print(f"\n💥 Erreur fatale: {e}")
            return False


def main():
    """Point d'entrée principal"""
    configurateur = ConfigurateurPermissions()
    success = configurateur.executer()
    
    if success:
        print("\n✅ Vous pouvez maintenant tester les connexions avec test_connexions_classes.py")
    else:
        print("\n❌ Configuration échouée")
        sys.exit(1)


if __name__ == "__main__":
    main()