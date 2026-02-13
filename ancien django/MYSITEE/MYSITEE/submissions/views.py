import os
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseForbidden
from django.utils import timezone
from django.db.models import Q

from .models import Submission
from .forms import SubmissionForm
from tasks.models import Task
from points.models import PointsLog


def is_user_assigned_to_task(user, task):
    """Check if user is assigned to task directly or via team."""
    if user in task.assigned_users.all():
        return True
    user_teams = user.teams.all()
    if task.assigned_teams.filter(id__in=user_teams).exists():
        return True
    return False


# -----------------------------------------------------------------------------
# A) My Submissions - List current user's submissions
# -----------------------------------------------------------------------------
@login_required
def my_submissions(request):
    """List all submissions by the current user."""
    submissions = Submission.objects.filter(student=request.user).select_related('task')
    return render(request, 'submissions/my_submissions.html', {
        'submissions': submissions
    })


# -----------------------------------------------------------------------------
# B) Submit Audio - Create or replace submission for a task
# -----------------------------------------------------------------------------
@login_required
def submit_audio(request, task_id):
    """Submit or replace audio for a task."""
    task = get_object_or_404(Task, id=task_id)

    # Permission check: user must be assigned to task
    if not is_user_assigned_to_task(request.user, task):
        messages.error(request, "Vous n'êtes pas assigné à cette tâche.")
        return redirect('dashboard')

    # Check for existing submission
    existing_submission = Submission.objects.filter(
        task=task,
        student=request.user
    ).first()

    # Block resubmission if already approved
    if existing_submission and existing_submission.status == 'approved':
        messages.error(request, "Votre soumission a déjà été approuvée. Vous ne pouvez pas la remplacer.")
        return redirect('my_submissions')

    if request.method == 'POST':
        form = SubmissionForm(request.POST, request.FILES)
        if form.is_valid():
            audio_file = form.cleaned_data['audio_file']

            if existing_submission:
                # Replace existing submission (status must be 'submitted' or 'rejected')
                # Delete old file to save storage
                if existing_submission.audio_file:
                    old_path = existing_submission.audio_file.path
                    if os.path.exists(old_path):
                        os.remove(old_path)

                existing_submission.audio_file = audio_file
                existing_submission.status = 'submitted'
                existing_submission.validated_at = None
                existing_submission.validated_by = None
                existing_submission.admin_feedback = ''
                existing_submission.save()
                messages.success(request, "Votre soumission a été mise à jour.")
            else:
                # Create new submission
                submission = Submission(
                    task=task,
                    student=request.user,
                    audio_file=audio_file
                )
                submission.save()
                messages.success(request, "Votre audio a été soumis avec succès.")

            return redirect('my_submissions')
    else:
        form = SubmissionForm()

    return render(request, 'submissions/submit_audio.html', {
        'form': form,
        'task': task,
        'existing_submission': existing_submission
    })


# -----------------------------------------------------------------------------
# C) Pending Submissions - Staff only
# -----------------------------------------------------------------------------
@login_required
def pending_submissions(request):
    """List all pending submissions for staff review."""
    if not request.user.is_staff:
        return HttpResponseForbidden("Accès réservé au personnel.")

    submissions = Submission.objects.filter(
        status='submitted'
    ).select_related('task', 'student').order_by('-submitted_at')

    return render(request, 'submissions/pending_submissions.html', {
        'submissions': submissions
    })


# -----------------------------------------------------------------------------
# D) Approve Submission - Staff only, POST only
# -----------------------------------------------------------------------------
@login_required
def approve_submission(request, submission_id):
    """Approve a submission and award points."""
    if not request.user.is_staff:
        return HttpResponseForbidden("Accès réservé au personnel.")

    if request.method != 'POST':
        return HttpResponseForbidden("Méthode non autorisée.")

    submission = get_object_or_404(Submission, id=submission_id)

    # Update submission status
    submission.status = 'approved'
    submission.validated_by = request.user
    submission.validated_at = timezone.now()

    # Anti-double-award: only create PointsLog if not already awarded
    if submission.awarded_points is None and submission.task.points > 0:
        # Create points log entry (source of truth)
        PointsLog.objects.create(
            student=submission.student,
            delta=submission.task.points,
            reason=f"Tâche approuvée: {submission.task.title}",
            submission=submission
        )
        # Mark as awarded on submission to prevent double-awarding
        submission.awarded_points = submission.task.points
        submission.points_awarded_at = timezone.now()

    submission.save()
    messages.success(request, f"Soumission de {submission.student.username} approuvée.")
    return redirect('pending_submissions')


# -----------------------------------------------------------------------------
# E) Reject Submission - Staff only, POST only
# -----------------------------------------------------------------------------
@login_required
def reject_submission(request, submission_id):
    """Reject a submission with optional feedback."""
    if not request.user.is_staff:
        return HttpResponseForbidden("Accès réservé au personnel.")

    if request.method != 'POST':
        return HttpResponseForbidden("Méthode non autorisée.")

    submission = get_object_or_404(Submission, id=submission_id)

    submission.status = 'rejected'
    submission.validated_by = request.user
    submission.validated_at = timezone.now()
    submission.admin_feedback = request.POST.get('admin_feedback', '')
    submission.save()

    messages.success(request, f"Soumission de {submission.student.username} rejetée.")
    return redirect('pending_submissions')
