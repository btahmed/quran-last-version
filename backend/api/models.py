import os
import uuid
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Sum
from django.utils import timezone
from django.conf import settings
from django.contrib.auth import get_user_model

User = get_user_model()


class Task(models.Model):
    TYPE_CHOICES = [
        ('hifz', 'حفظ'),
        ('muraja', 'مراجعة'),
        ('tilawa', 'تلاوة'),
    ]
    
    PRIORITY_CHOICES = [
        ('high', 'عالية'),
        ('medium', 'متوسطة'),
        ('low', 'منخفضة'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'قيد الانتظار'),
        ('in_progress', 'جاري العمل'),
        ('completed', 'مكتمل'),
        ('cancelled', 'ملغي'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='hifz')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    surah = models.IntegerField(null=True, blank=True)
    start_ayah = models.IntegerField(null=True, blank=True)
    end_ayah = models.IntegerField(null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    # Champs pour les tâches créées par un enseignant
    points = models.PositiveIntegerField(default=0)
    assigned_by = models.ForeignKey(
        User, on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='assigned_tasks'
    )
    
    class Meta:
        db_table = 'tasks'
        ordering = ['-created_at']


class Progress(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='progress')
    surah = models.IntegerField()
    ayah = models.IntegerField()
    type = models.CharField(max_length=20, choices=[('hifz', 'حفظ'), ('muraja', 'مراجعة')], default='hifz')
    accuracy = models.IntegerField(default=0)
    duration = models.IntegerField(default=0)  # in seconds
    completed_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'progress'
        ordering = ['-completed_at']


class ReviewSchedule(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='review_schedules')
    surah = models.IntegerField()
    start_ayah = models.IntegerField()
    end_ayah = models.IntegerField()
    next_review_date = models.DateField()
    review_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'review_schedules'
        ordering = ['next_review_date']


class Achievement(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='achievements')
    title = models.CharField(max_length=255)
    description = models.TextField()
    icon = models.CharField(max_length=100)
    earned_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'achievements'
        ordering = ['-earned_at']


class Competition(models.Model):
    STATUS_CHOICES = [
        ('active', 'نشط'),
        ('completed', 'مكتمل'),
        ('cancelled', 'ملغي'),
    ]
    
    name = models.CharField(max_length=255)
    description = models.TextField()
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    participants = models.ManyToManyField(User, related_name='competitions', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'competitions'
        ordering = ['-created_at']


class CompetitionScore(models.Model):
    competition = models.ForeignKey(Competition, on_delete=models.CASCADE, related_name='scores')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='competition_scores')
    score = models.IntegerField(default=0)
    ayah_count = models.IntegerField(default=0)
    last_activity = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'competition_scores'
        unique_together = ['competition', 'user']


class StudentProfile(models.Model):
    STATUS_CHOICES = [
        ('active', 'Actif'),
        ('inactive', 'Inactif'),
        ('graduated', 'Diplômé'),
    ]
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='student_profile'
    )
    level = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    notes = models.TextField(blank=True)
    objectives = models.TextField(blank=True)
    restrictions = models.TextField(blank=True)
    special_case = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Profil Etudiant"
        verbose_name_plural = "Profils Etudiants"

    def __str__(self):
        return f"Profil de {self.user.username}"


class GroupExtension(models.Model):
    TIME_SLOT_CHOICES = [
        ('8h45', '8h45'),
        ('10h45', '10h45'),
    ]
    group = models.OneToOneField(
        'auth.Group',
        on_delete=models.CASCADE,
        related_name='extension'
    )
    time_slot = models.CharField(max_length=10, choices=TIME_SLOT_CHOICES)
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='taught_groups'
    )
    max_students = models.IntegerField(default=50)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.group.name} - {self.time_slot}"


class UserGroupHistory(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='group_history'
    )
    old_group = models.ForeignKey(
        'auth.Group', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='old_members'
    )
    new_group = models.ForeignKey(
        'auth.Group', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='new_members'
    )
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='group_changes_made'
    )
    changed_at = models.DateTimeField(auto_now_add=True)
    reason = models.TextField(blank=True)

    class Meta:
        ordering = ['-changed_at']

    def __str__(self):
        old = self.old_group
        new = self.new_group
        return f"{self.user.username}: {old} -> {new}"


class AuditLog(models.Model):
    ACTION_CHOICES = [
        ('create_group', 'Creation groupe'),
        ('rename_group', 'Renommage groupe'),
        ('delete_group', 'Suppression groupe'),
        ('assign_student', 'Assignation eleve'),
        ('update_profile', 'Modification profil'),
        ('assign_teacher', 'Assignation professeur'),
    ]
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    admin_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='admin_actions'
    )
    target_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='received_actions'
    )
    target_group = models.ForeignKey(
        'auth.Group',
        on_delete=models.SET_NULL,
        null=True, blank=True
    )
    before_data = models.JSONField(null=True, blank=True)
    after_data = models.JSONField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.action} par {self.admin_user} - {self.timestamp}"


# ── Soumissions Audio ──────────────────────────────────────────

def submission_audio_path(instance, filename):
    """Chemin d'upload : submissions/<task_id>/<student_id>/<uuid>_<filename>"""
    unique_filename = f"{uuid.uuid4().hex}_{filename}"
    return f"submissions/{instance.task_id}/{instance.student_id}/{unique_filename}"


def validate_audio_file(file):
    """Valide l'extension et la taille du fichier audio."""
    ext = os.path.splitext(file.name)[1].lower()
    allowed = ['.webm', '.mp3', '.wav', '.m4a']
    if ext not in allowed:
        raise ValidationError(f"Extension '{ext}' non autorisée. Acceptées: {', '.join(allowed)}")
    if file.size > 10 * 1024 * 1024:
        raise ValidationError("Fichier trop volumineux (max 10 MB).")


class Submission(models.Model):
    STATUS_CHOICES = [
        ('submitted', 'Soumis'),
        ('approved', 'Approuvé'),
        ('rejected', 'Rejeté'),
    ]
    task = models.ForeignKey(
        Task, on_delete=models.CASCADE, related_name='submissions'
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='submissions'
    )
    audio_file = models.FileField(
        upload_to=submission_audio_path,
        validators=[validate_audio_file]
    )
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='submitted')
    admin_feedback = models.TextField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    validated_at = models.DateTimeField(null=True, blank=True)
    validated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='validated_submissions'
    )
    awarded_points = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['task', 'student'],
                name='unique_submission_per_task_student'
            )
        ]
        ordering = ['-submitted_at']

    def __str__(self):
        return f"{self.student.username} - {self.task.title}"


class PointsLog(models.Model):
    """Ledger de tous les changements de points."""
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='points_logs'
    )
    delta = models.IntegerField(help_text="Changement de points (positif ou négatif)")
    reason = models.CharField(max_length=255)
    submission = models.ForeignKey(
        Submission,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='points_logs'
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        sign = '+' if self.delta >= 0 else ''
        return f"{self.student.username}: {sign}{self.delta} ({self.reason})"

    @classmethod
    def get_total_points(cls, student):
        result = cls.objects.filter(student=student).aggregate(total=Sum('delta'))
        return result['total'] or 0
