from django.core.exceptions import ValidationError
from django.utils import timezone

from points.models import PointsLog
from .models import Submission


def is_user_assigned_to_task(user, task):
    """Check if user is assigned to task directly or via team."""
    if task.assigned_users.filter(id=user.id).exists():
        return True
    user_teams = user.teams.all()
    return task.assigned_teams.filter(id__in=user_teams).exists()


def get_submission_for_task(user, task):
    return Submission.objects.filter(task=task, student=user).first()


def submit_audio_for_task(user, task, audio_file, existing_submission=None):
    existing_submission = existing_submission or get_submission_for_task(user, task)

    if existing_submission and existing_submission.status == 'approved':
        raise ValidationError(
            "Votre soumission a déjà été approuvée. Vous ne pouvez pas la remplacer."
        )

    if existing_submission:
        if existing_submission.audio_file:
            existing_submission.audio_file.delete(save=False)

        existing_submission.audio_file = audio_file
        existing_submission.status = 'submitted'
        existing_submission.validated_at = None
        existing_submission.validated_by = None
        existing_submission.admin_feedback = ''
        existing_submission.save()
        return existing_submission, False

    submission = Submission(
        task=task,
        student=user,
        audio_file=audio_file
    )
    submission.save()
    return submission, True


def approve_submission(submission, staff_user):
    submission.status = 'approved'
    submission.validated_by = staff_user
    submission.validated_at = timezone.now()

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
    return submission


def reject_submission(submission, staff_user, feedback=''):
    submission.status = 'rejected'
    submission.validated_by = staff_user
    submission.validated_at = timezone.now()
    submission.admin_feedback = feedback or ''
    submission.save()
    return submission
