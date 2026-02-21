from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    ROLE_CHOICES = [
        ('student', 'Élève'),
        ('teacher', 'Professeur'),
    ]

    description = models.TextField(blank=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')

    def __str__(self):
        return self.username

    @property
    def is_teacher(self):
        return self.role == 'teacher'


class Team(models.Model):
    name = models.CharField(max_length=100)
    creator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_teams')
    members = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='teams')

    def __str__(self):
        return self.name


class Task(models.Model):
    STATUS_CHOICES = [
        ('todo', 'À faire'),
        ('done', 'Accomplie'),
    ]

    TASK_TYPE_CHOICES = [
        ('recitation', 'Récitation'),
        ('memorization', 'Mémorisation'),
        ('other', 'Autre'),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='todo')
    is_private = models.BooleanField(default=True)

    # New fields for submission system
    points = models.PositiveIntegerField(default=0, help_text="Points awarded for completing this task")
    task_type = models.CharField(max_length=20, choices=TASK_TYPE_CHOICES, default='other')
    due_date = models.DateField(null=True, blank=True)

    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_tasks')
    assigned_users = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='assigned_tasks', blank=True)
    assigned_teams = models.ManyToManyField('Team', related_name='assigned_tasks', blank=True)
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='subtasks')

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class StudentProfile(models.Model):
    """Profil étendu pour les étudiants"""
    STATUS_CHOICES = [
        ('active', 'Actif'),
        ('inactive', 'Inactif'),
        ('graduated', 'Diplômé'),
    ]
    
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='student_profile')
    level = models.CharField(max_length=100, blank=True, help_text="Niveau de mémorisation (ex: Juz 15)")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    notes = models.TextField(blank=True, help_text="Notes internes Admin/Prof")
    objectives = models.TextField(blank=True, help_text="Objectifs de l'élève")
    restrictions = models.TextField(blank=True, help_text="Restrictions ou règles spéciales")
    special_case = models.JSONField(default=dict, blank=True, help_text="الحالة الخاصة بالطالب")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile de {self.user.username}"

    class Meta:
        verbose_name = "Profil Étudiant"
        verbose_name_plural = "Profils Étudiants"


class GroupExtension(models.Model):
    """Extension du modèle Group de Django pour les classes"""
    TIME_SLOT_CHOICES = [
        ('8h45', '8h45'),
        ('10h45', '10h45'),
    ]
    
    group = models.OneToOneField('auth.Group', on_delete=models.CASCADE, related_name='extension')
    time_slot = models.CharField(max_length=10, choices=TIME_SLOT_CHOICES)
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='taught_groups')
    max_students = models.IntegerField(default=50)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.group.name} - {self.time_slot}"

    class Meta:
        verbose_name = "Extension de Groupe"
        verbose_name_plural = "Extensions de Groupes"


class UserGroupHistory(models.Model):
    """Historique des changements de groupe"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='group_history')
    old_group = models.ForeignKey('auth.Group', on_delete=models.SET_NULL, null=True, blank=True, related_name='old_members')
    new_group = models.ForeignKey('auth.Group', on_delete=models.SET_NULL, null=True, blank=True, related_name='new_members')
    changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='group_changes_made')
    changed_at = models.DateTimeField(auto_now_add=True)
    reason = models.TextField(blank=True)

    def __str__(self):
        return f"{self.user.username}: {self.old_group} → {self.new_group}"

    class Meta:
        verbose_name = "Historique de Groupe"
        verbose_name_plural = "Historiques de Groupes"
        ordering = ['-changed_at']
        indexes = [
            models.Index(fields=['user', '-changed_at']),
            models.Index(fields=['new_group', '-changed_at']),
        ]


class AuditLog(models.Model):
    """Journal d'audit pour toutes les modifications Admin"""
    ACTION_CHOICES = [
        ('create_group', 'Création de groupe'),
        ('rename_group', 'Renommage de groupe'),
        ('delete_group', 'Suppression de groupe'),
        ('assign_student', 'Assignation élève'),
        ('update_profile', 'Modification profil'),
        ('assign_teacher', 'Assignation professeur'),
    ]
    
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    admin_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='admin_actions')
    target_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='received_actions')
    target_group = models.ForeignKey('auth.Group', on_delete=models.SET_NULL, null=True, blank=True)
    before_data = models.JSONField(null=True, blank=True)
    after_data = models.JSONField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    def __str__(self):
        return f"{self.action} par {self.admin_user} - {self.timestamp}"

    class Meta:
        verbose_name = "Journal d'Audit"
        verbose_name_plural = "Journaux d'Audit"
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['-timestamp']),
            models.Index(fields=['admin_user', '-timestamp']),
            models.Index(fields=['target_user', '-timestamp']),
            models.Index(fields=['action', '-timestamp']),
        ]


class ConflictLog(models.Model):
    """Log des conflits de modification"""
    ENTITY_TYPE_CHOICES = [
        ('student', 'Étudiant'),
        ('group', 'Groupe'),
    ]
    
    entity_type = models.CharField(max_length=50, choices=ENTITY_TYPE_CHOICES)
    entity_id = models.IntegerField()
    conflicts = models.JSONField(help_text="Liste des conflits détectés")
    resolved_changes = models.JSONField(help_text="Changements après résolution")
    admin_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='conflicts_as_admin')
    teacher_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='conflicts_as_teacher')
    resolution_strategy = models.CharField(max_length=50, default='admin_priority')
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Conflit {self.entity_type} #{self.entity_id} - {self.timestamp}"

    class Meta:
        verbose_name = "Log de Conflit"
        verbose_name_plural = "Logs de Conflits"
        ordering = ['-timestamp']
