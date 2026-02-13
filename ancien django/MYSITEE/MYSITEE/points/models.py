from django.db import models
from django.db.models import Sum
from django.conf import settings


class PointsLog(models.Model):
    """
    Ledger model for tracking all point changes.
    This is the source of truth for student points.
    """
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='points_logs'
    )
    delta = models.IntegerField(help_text="Points change (positive or negative)")
    reason = models.CharField(max_length=255)
    submission = models.ForeignKey(
        'submissions.Submission',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='points_logs'
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Points Log'
        verbose_name_plural = 'Points Logs'

    def __str__(self):
        sign = '+' if self.delta >= 0 else ''
        return f"{self.student.username}: {sign}{self.delta} ({self.reason})"

    @classmethod
    def get_total_points(cls, student):
        """Calculate total points for a student from the ledger."""
        result = cls.objects.filter(student=student).aggregate(total=Sum('delta'))
        return result['total'] or 0
