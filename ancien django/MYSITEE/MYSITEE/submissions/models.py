import os
import uuid
from datetime import timedelta

from django.core.exceptions import ValidationError
from django.db import models
from django.conf import settings
from django.utils import timezone


# Constants
ALLOWED_AUDIO_EXTENSIONS = ['.webm', '.mp3', '.wav', '.m4a']
MAX_AUDIO_SIZE_MB = 10
MAX_AUDIO_SIZE_BYTES = MAX_AUDIO_SIZE_MB * 1024 * 1024


def default_expires_at():
    """Default expiration: 14 days from now."""
    return timezone.now() + timedelta(days=14)


def submission_audio_path(instance, filename):
    """
    Upload path: submissions/<task_id>/<student_id>/<uuid>_<filename>
    UUID prefix prevents filename collisions.
    """
    unique_filename = f"{uuid.uuid4().hex}_{filename}"
    return f"submissions/{instance.task_id}/{instance.student_id}/{unique_filename}"


def validate_audio_file(file):
    """Validate audio file extension and size."""
    # Check extension
    ext = os.path.splitext(file.name)[1].lower()
    if ext not in ALLOWED_AUDIO_EXTENSIONS:
        raise ValidationError(
            f"Extension '{ext}' non autorisée. "
            f"Extensions acceptées: {', '.join(ALLOWED_AUDIO_EXTENSIONS)}"
        )

    # Check file size
    if file.size > MAX_AUDIO_SIZE_BYTES:
        raise ValidationError(
            f"Fichier trop volumineux ({file.size / (1024*1024):.1f} MB). "
            f"Taille maximale: {MAX_AUDIO_SIZE_MB} MB."
        )


class Submission(models.Model):
    STATUS_CHOICES = [
        ('submitted', 'Soumis'),
        ('approved', 'Approuvé'),
        ('rejected', 'Rejeté'),
    ]

    task = models.ForeignKey(
        'tasks.Task',
        on_delete=models.CASCADE,
        related_name='submissions'
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
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='submitted'
    )
    admin_feedback = models.TextField(blank=True)

    # Timestamps
    submitted_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(default=default_expires_at, db_index=True)

    # Validation tracking
    validated_at = models.DateTimeField(null=True, blank=True)
    validated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='validated_submissions'
    )

    # Points tracking (prevents double-awarding)
    awarded_points = models.PositiveIntegerField(null=True, blank=True)
    points_awarded_at = models.DateTimeField(null=True, blank=True)

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

    def can_replace_audio(self):
        """Check if student can replace their audio file."""
        return self.status == 'submitted'
