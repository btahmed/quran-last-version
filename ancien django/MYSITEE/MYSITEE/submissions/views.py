from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseForbidden
from django.core.exceptions import ValidationError

from .models import Submission
from .forms import SubmissionForm
from tasks.models import Task
from .services import (
    is_user_assigned_to_task,
    get_submission_for_task,
    submit_audio_for_task,
    approve_submission as approve_submission_service,
    reject_submission as reject_submission_service,
)


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
    existing_submission = get_submission_for_task(request.user, task)

    if request.method == 'POST':
        form = SubmissionForm(request.POST, request.FILES)
        if form.is_valid():
            audio_file = form.cleaned_data['audio_file']

            try:
                _, created = submit_audio_for_task(
                    request.user,
                    task,
                    audio_file,
                    existing_submission=existing_submission
                )
            except ValidationError as exc:
                messages.error(request, exc.messages[0])
                return redirect('my_submissions')

            if created:
                messages.success(request, "Votre audio a été soumis avec succès.")
            else:
                messages.success(request, "Votre soumission a été mise à jour.")

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
    approve_submission_service(submission, request.user)
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
    reject_submission_service(
        submission,
        request.user,
        feedback=request.POST.get('admin_feedback', '')
    )

    messages.success(request, f"Soumission de {submission.student.username} rejetée.")
    return redirect('pending_submissions')
