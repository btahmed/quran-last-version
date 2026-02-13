"""
Tests for the submissions app.

Covers:
- Permission checks (submit audio: assigned vs non-assigned)
- Permission checks (approve/reject: staff only + POST only)
- Unique constraint (task, student) on Submission
- Anti-double-award (approve twice => 1 PointsLog only)
- Cleanup command (--dry-run, normal mode)
- Audio file validation (extension, size)
"""

import os
import tempfile
from datetime import timedelta
from io import BytesIO
from unittest.mock import patch

from django.test import TestCase, Client, override_settings
from django.urls import reverse
from django.utils import timezone
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.db import IntegrityError

from submissions.models import Submission, validate_audio_file, ALLOWED_AUDIO_EXTENSIONS, MAX_AUDIO_SIZE_BYTES
from tasks.models import Task, Team, User
from points.models import PointsLog


class SubmissionTestCase(TestCase):
    """Base test case with common fixtures."""

    def setUp(self):
        # Create users
        self.student = User.objects.create_user(
            username='student1',
            password='testpass123',
            email='student@test.com'
        )
        self.other_student = User.objects.create_user(
            username='student2',
            password='testpass123',
            email='student2@test.com'
        )
        self.staff_user = User.objects.create_user(
            username='staff1',
            password='testpass123',
            email='staff@test.com',
            is_staff=True
        )

        # Create a task with points
        self.task = Task.objects.create(
            title='Test Task',
            description='A test task',
            author=self.staff_user,
            points=10,
            task_type='recitation',
            is_private=False
        )
        # Assign student to task
        self.task.assigned_users.add(self.student)

        # Create a valid audio file for tests
        self.valid_audio = SimpleUploadedFile(
            name='test_audio.mp3',
            content=b'fake audio content' * 100,
            content_type='audio/mpeg'
        )

    def create_audio_file(self, name='test.mp3', size=1024):
        """Helper to create a test audio file."""
        return SimpleUploadedFile(
            name=name,
            content=b'x' * size,
            content_type='audio/mpeg'
        )


class SubmitAudioPermissionTests(SubmissionTestCase):
    """Test permissions for submit_audio view."""

    def test_assigned_user_can_access_submit_page(self):
        """Assigned user can access the submit audio page."""
        self.client.login(username='student1', password='testpass123')
        response = self.client.get(reverse('submit_audio', args=[self.task.id]))
        self.assertEqual(response.status_code, 200)

    def test_non_assigned_user_redirected(self):
        """Non-assigned user is redirected with error message."""
        self.client.login(username='student2', password='testpass123')
        response = self.client.get(reverse('submit_audio', args=[self.task.id]))
        self.assertEqual(response.status_code, 302)  # Redirect to dashboard

    def test_anonymous_user_redirected_to_login(self):
        """Anonymous user is redirected to login."""
        response = self.client.get(reverse('submit_audio', args=[self.task.id]))
        self.assertEqual(response.status_code, 302)
        self.assertIn('/login/', response.url)

    def test_team_member_can_submit(self):
        """User assigned via team can submit."""
        # Create team and assign to task
        team = Team.objects.create(name='Test Team', creator=self.staff_user)
        team.members.add(self.other_student)
        self.task.assigned_teams.add(team)

        self.client.login(username='student2', password='testpass123')
        response = self.client.get(reverse('submit_audio', args=[self.task.id]))
        self.assertEqual(response.status_code, 200)


class ApproveRejectPermissionTests(SubmissionTestCase):
    """Test permissions for approve/reject views."""

    def setUp(self):
        super().setUp()
        # Create a submission to approve/reject
        self.submission = Submission.objects.create(
            task=self.task,
            student=self.student,
            audio_file=self.create_audio_file(),
            status='submitted'
        )

    def test_staff_can_access_pending_submissions(self):
        """Staff user can access pending submissions page."""
        self.client.login(username='staff1', password='testpass123')
        response = self.client.get(reverse('pending_submissions'))
        self.assertEqual(response.status_code, 200)

    def test_non_staff_forbidden_pending_submissions(self):
        """Non-staff user gets 403 on pending submissions."""
        self.client.login(username='student1', password='testpass123')
        response = self.client.get(reverse('pending_submissions'))
        self.assertEqual(response.status_code, 403)

    def test_staff_can_approve_with_post(self):
        """Staff can approve submission with POST request."""
        self.client.login(username='staff1', password='testpass123')
        response = self.client.post(reverse('approve_submission', args=[self.submission.id]))
        self.assertEqual(response.status_code, 302)  # Redirect after success
        self.submission.refresh_from_db()
        self.assertEqual(self.submission.status, 'approved')

    def test_staff_cannot_approve_with_get(self):
        """Staff cannot approve with GET request."""
        self.client.login(username='staff1', password='testpass123')
        response = self.client.get(reverse('approve_submission', args=[self.submission.id]))
        self.assertEqual(response.status_code, 403)

    def test_non_staff_cannot_approve(self):
        """Non-staff user cannot approve submissions."""
        self.client.login(username='student1', password='testpass123')
        response = self.client.post(reverse('approve_submission', args=[self.submission.id]))
        self.assertEqual(response.status_code, 403)

    def test_staff_can_reject_with_post(self):
        """Staff can reject submission with POST request."""
        self.client.login(username='staff1', password='testpass123')
        response = self.client.post(
            reverse('reject_submission', args=[self.submission.id]),
            {'admin_feedback': 'Please try again'}
        )
        self.assertEqual(response.status_code, 302)
        self.submission.refresh_from_db()
        self.assertEqual(self.submission.status, 'rejected')
        self.assertEqual(self.submission.admin_feedback, 'Please try again')

    def test_non_staff_cannot_reject(self):
        """Non-staff user cannot reject submissions."""
        self.client.login(username='student1', password='testpass123')
        response = self.client.post(reverse('reject_submission', args=[self.submission.id]))
        self.assertEqual(response.status_code, 403)


class UniqueConstraintTests(SubmissionTestCase):
    """Test unique constraint on (task, student)."""

    def test_unique_constraint_prevents_duplicate(self):
        """Cannot create two submissions for same task+student."""
        Submission.objects.create(
            task=self.task,
            student=self.student,
            audio_file=self.create_audio_file('test1.mp3')
        )
        with self.assertRaises(IntegrityError):
            Submission.objects.create(
                task=self.task,
                student=self.student,
                audio_file=self.create_audio_file('test2.mp3')
            )

    def test_different_students_can_submit_same_task(self):
        """Different students can submit to the same task."""
        Submission.objects.create(
            task=self.task,
            student=self.student,
            audio_file=self.create_audio_file('test1.mp3')
        )
        # This should not raise
        sub2 = Submission.objects.create(
            task=self.task,
            student=self.other_student,
            audio_file=self.create_audio_file('test2.mp3')
        )
        self.assertIsNotNone(sub2.id)


class AntiDoubleAwardTests(SubmissionTestCase):
    """Test that approving twice doesn't double-award points."""

    def setUp(self):
        super().setUp()
        self.submission = Submission.objects.create(
            task=self.task,
            student=self.student,
            audio_file=self.create_audio_file(),
            status='submitted'
        )

    def test_first_approval_awards_points(self):
        """First approval creates PointsLog entry."""
        self.client.login(username='staff1', password='testpass123')
        self.client.post(reverse('approve_submission', args=[self.submission.id]))

        self.submission.refresh_from_db()
        self.assertEqual(self.submission.awarded_points, 10)
        self.assertEqual(PointsLog.objects.filter(submission=self.submission).count(), 1)
        self.assertEqual(PointsLog.get_total_points(self.student), 10)

    def test_second_approval_does_not_double_award(self):
        """Re-approving an already approved submission doesn't create another PointsLog."""
        self.client.login(username='staff1', password='testpass123')

        # First approval
        self.client.post(reverse('approve_submission', args=[self.submission.id]))

        # Second approval (simulating re-approval)
        self.client.post(reverse('approve_submission', args=[self.submission.id]))

        # Should still have only 1 PointsLog entry
        self.assertEqual(PointsLog.objects.filter(submission=self.submission).count(), 1)
        self.assertEqual(PointsLog.get_total_points(self.student), 10)

    def test_zero_points_task_no_pointslog(self):
        """Task with 0 points doesn't create PointsLog."""
        self.task.points = 0
        self.task.save()

        self.client.login(username='staff1', password='testpass123')
        self.client.post(reverse('approve_submission', args=[self.submission.id]))

        self.assertEqual(PointsLog.objects.filter(submission=self.submission).count(), 0)


class AudioValidationTests(TestCase):
    """Test audio file validation."""

    def test_valid_mp3_extension(self):
        """Valid .mp3 file passes validation."""
        file = SimpleUploadedFile('test.mp3', b'content', content_type='audio/mpeg')
        file.size = 1024
        # Should not raise
        validate_audio_file(file)

    def test_valid_wav_extension(self):
        """Valid .wav file passes validation."""
        file = SimpleUploadedFile('test.wav', b'content', content_type='audio/wav')
        file.size = 1024
        validate_audio_file(file)

    def test_invalid_extension_rejected(self):
        """Invalid extension raises ValidationError."""
        from django.core.exceptions import ValidationError
        file = SimpleUploadedFile('test.exe', b'content', content_type='application/octet-stream')
        file.size = 1024
        with self.assertRaises(ValidationError) as ctx:
            validate_audio_file(file)
        self.assertIn('.exe', str(ctx.exception))

    def test_oversized_file_rejected(self):
        """File exceeding max size raises ValidationError."""
        from django.core.exceptions import ValidationError
        file = SimpleUploadedFile('test.mp3', b'x', content_type='audio/mpeg')
        file.size = MAX_AUDIO_SIZE_BYTES + 1
        with self.assertRaises(ValidationError) as ctx:
            validate_audio_file(file)
        self.assertIn('volumineux', str(ctx.exception))


class PrivacyConsentTests(SubmissionTestCase):
    """Test privacy consent checkbox validation."""

    def test_form_requires_privacy_consent(self):
        """Form is invalid without privacy consent checkbox."""
        from submissions.forms import SubmissionForm
        file = SimpleUploadedFile('test.mp3', b'content' * 100, content_type='audio/mpeg')
        form = SubmissionForm(data={}, files={'audio_file': file})
        self.assertFalse(form.is_valid())
        self.assertIn('privacy_consent', form.errors)

    def test_form_valid_with_consent(self):
        """Form is valid with privacy consent checked."""
        from submissions.forms import SubmissionForm
        file = SimpleUploadedFile('test.mp3', b'content' * 100, content_type='audio/mpeg')
        form = SubmissionForm(data={'privacy_consent': True}, files={'audio_file': file})
        self.assertTrue(form.is_valid())

    def test_submit_without_consent_rejected(self):
        """Submission without consent is rejected."""
        self.client.login(username='student1', password='testpass123')
        audio = SimpleUploadedFile('test.mp3', b'content' * 100, content_type='audio/mpeg')
        response = self.client.post(
            reverse('submit_audio', args=[self.task.id]),
            {'audio_file': audio}  # No privacy_consent
        )
        # Should stay on form with error
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'accepter')

    def test_submit_with_consent_accepted(self):
        """Submission with consent is accepted."""
        self.client.login(username='student1', password='testpass123')
        audio = SimpleUploadedFile('test.mp3', b'content' * 100, content_type='audio/mpeg')
        response = self.client.post(
            reverse('submit_audio', args=[self.task.id]),
            {'audio_file': audio, 'privacy_consent': 'on'}
        )
        # Should redirect to my_submissions
        self.assertEqual(response.status_code, 302)
        self.assertTrue(Submission.objects.filter(task=self.task, student=self.student).exists())


@override_settings(MEDIA_ROOT=tempfile.mkdtemp())
class CleanupCommandTests(SubmissionTestCase):
    """Test cleanup_submissions management command."""

    def setUp(self):
        super().setUp()
        # Create an expired submission
        self.expired_submission = Submission.objects.create(
            task=self.task,
            student=self.student,
            audio_file=self.create_audio_file('expired.mp3'),
            status='approved'
        )
        # Set expires_at to past
        Submission.objects.filter(id=self.expired_submission.id).update(
            expires_at=timezone.now() - timedelta(days=1)
        )
        self.expired_submission.refresh_from_db()

    def test_dry_run_does_not_delete(self):
        """--dry-run reports but doesn't delete files or clear DB field."""
        original_file = self.expired_submission.audio_file.name

        from io import StringIO
        out = StringIO()
        call_command('cleanup_submissions', '--dry-run', stdout=out)

        self.expired_submission.refresh_from_db()
        # File field should still have value
        self.assertTrue(self.expired_submission.audio_file.name)
        self.assertIn('DRY RUN', out.getvalue())

    def test_normal_mode_clears_db_field(self):
        """Normal mode clears the audio_file DB field."""
        from io import StringIO
        out = StringIO()
        call_command('cleanup_submissions', stdout=out)

        self.expired_submission.refresh_from_db()
        # File field should be empty
        self.assertEqual(self.expired_submission.audio_file.name, '')
        # Submission row should still exist
        self.assertTrue(Submission.objects.filter(id=self.expired_submission.id).exists())

    def test_days_override(self):
        """--days option overrides expires_at logic."""
        # Create a non-expired submission submitted 2 days ago
        other_task = Task.objects.create(
            title='Other Task',
            author=self.staff_user,
            is_private=False
        )
        recent_submission = Submission.objects.create(
            task=other_task,
            student=self.other_student,
            audio_file=self.create_audio_file('recent.mp3')
        )
        # Set submitted_at to 2 days ago
        Submission.objects.filter(id=recent_submission.id).update(
            submitted_at=timezone.now() - timedelta(days=2)
        )

        from io import StringIO
        out = StringIO()
        call_command('cleanup_submissions', '--days=1', stdout=out)

        recent_submission.refresh_from_db()
        # Should be cleaned (older than 1 day)
        self.assertEqual(recent_submission.audio_file.name, '')

    def test_error_handling_continues(self):
        """Command continues processing after individual errors."""
        # Create multiple expired submissions
        for i in range(3):
            task = Task.objects.create(
                title=f'Task {i}',
                author=self.staff_user,
                is_private=False
            )
            sub = Submission.objects.create(
                task=task,
                student=self.student if i == 0 else self.other_student,
                audio_file=self.create_audio_file(f'file{i}.mp3')
            )
            Submission.objects.filter(id=sub.id).update(
                expires_at=timezone.now() - timedelta(days=1)
            )

        from io import StringIO
        out = StringIO()
        # Should complete without raising
        call_command('cleanup_submissions', stdout=out)
        self.assertIn('SUMMARY', out.getvalue())
