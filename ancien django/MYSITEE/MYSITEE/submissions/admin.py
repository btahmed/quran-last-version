from django.contrib import admin
from django.utils import timezone
from .models import Submission
from points.models import PointsLog


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = [
        'student', 'task', 'status', 'submitted_at',
        'validated_at', 'validated_by', 'awarded_points'
    ]
    list_filter = ['status', 'submitted_at', 'validated_at']
    search_fields = ['student__username', 'task__title']
    readonly_fields = [
        'submitted_at', 'expires_at', 'validated_at',
        'validated_by', 'points_awarded_at', 'awarded_points'
    ]
    raw_id_fields = ['task', 'student']
    date_hierarchy = 'submitted_at'
    actions = ['approve_submissions', 'reject_submissions']

    def approve_submissions(self, request, queryset):
        """Admin action to approve selected submissions."""
        approved_count = 0
        for submission in queryset.filter(status='submitted'):
            submission.status = 'approved'
            submission.validated_by = request.user
            submission.validated_at = timezone.now()

            # Award points if not already awarded
            if submission.awarded_points is None and submission.task.points > 0:
                PointsLog.objects.create(
                    student=submission.student,
                    delta=submission.task.points,
                    reason=f"Tâche approuvée: {submission.task.title}",
                    submission=submission
                )
                submission.awarded_points = submission.task.points
                submission.points_awarded_at = timezone.now()

            submission.save()
            approved_count += 1

        self.message_user(request, f"{approved_count} soumission(s) approuvée(s).")

    approve_submissions.short_description = "Approuver les soumissions sélectionnées"

    def reject_submissions(self, request, queryset):
        """Admin action to reject selected submissions."""
        updated = queryset.filter(status='submitted').update(
            status='rejected',
            validated_by=request.user,
            validated_at=timezone.now()
        )
        self.message_user(request, f"{updated} soumission(s) rejetée(s).")

    reject_submissions.short_description = "Rejeter les soumissions sélectionnées"
