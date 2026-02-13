"""
Management command to clean up expired audio files from submissions.

Usage:
    python manage.py cleanup_submissions           # Delete expired files
    python manage.py cleanup_submissions --dry-run # Report only, no deletion
    python manage.py cleanup_submissions --days 7  # Override: delete files older than 7 days
"""

import os
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from submissions.models import Submission


class Command(BaseCommand):
    help = 'Delete expired audio files from submissions while keeping submission records for audit.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Report what would be deleted without actually deleting.',
        )
        parser.add_argument(
            '--days',
            type=int,
            default=None,
            help='Override expiration: delete files older than N days (ignores expires_at).',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        days_override = options['days']
        now = timezone.now()

        # Build queryset based on options
        if days_override is not None:
            # Manual override: files older than N days
            cutoff = now - timedelta(days=days_override)
            queryset = Submission.objects.filter(
                submitted_at__lte=cutoff
            ).exclude(audio_file='')
            self.stdout.write(f"Mode: Override - files older than {days_override} days")
        else:
            # Default: use expires_at field
            queryset = Submission.objects.filter(
                expires_at__lte=now
            ).exclude(audio_file='')
            self.stdout.write("Mode: Default - using expires_at field")

        # Counters
        total_scanned = 0
        files_deleted = 0
        files_missing = 0
        errors = 0

        if dry_run:
            self.stdout.write(self.style.WARNING("\n=== DRY RUN - No files will be deleted ===\n"))

        submissions = list(queryset)
        total_scanned = len(submissions)

        self.stdout.write(f"Found {total_scanned} expired submission(s) with audio files.\n")

        for submission in submissions:
            file_path = None
            file_name = submission.audio_file.name if submission.audio_file else None

            try:
                # Get the physical file path
                if submission.audio_file:
                    try:
                        file_path = submission.audio_file.path
                    except ValueError:
                        # File field has name but storage can't resolve path
                        file_path = None

                # Check if file exists on disk
                file_exists = file_path and os.path.exists(file_path)

                if dry_run:
                    # Report only
                    status = "EXISTS" if file_exists else "MISSING"
                    self.stdout.write(
                        f"  [DRY-RUN] Would clean: {file_name} ({status})"
                    )
                    if file_exists:
                        files_deleted += 1
                    else:
                        files_missing += 1
                else:
                    # Actually delete
                    if file_exists:
                        os.remove(file_path)
                        files_deleted += 1
                        self.stdout.write(
                            self.style.SUCCESS(f"  Deleted: {file_name}")
                        )
                    else:
                        files_missing += 1
                        self.stdout.write(
                            self.style.WARNING(f"  Missing on disk: {file_name}")
                        )

                    # Clear the DB field (even if file was missing)
                    submission.audio_file = ''
                    submission.save(update_fields=['audio_file'])

            except Exception as e:
                errors += 1
                self.stdout.write(
                    self.style.ERROR(f"  Error processing submission {submission.id}: {e}")
                )
                # Continue with next item, don't abort

        # Summary
        self.stdout.write("\n" + "=" * 50)
        self.stdout.write(self.style.NOTICE("SUMMARY"))
        self.stdout.write("=" * 50)
        self.stdout.write(f"Total scanned:    {total_scanned}")
        self.stdout.write(f"Files deleted:    {files_deleted}")
        self.stdout.write(f"Files missing:    {files_missing}")
        self.stdout.write(f"Errors:           {errors}")

        if dry_run:
            self.stdout.write(self.style.WARNING("\nDry run complete. No files were actually deleted."))
        else:
            self.stdout.write(self.style.SUCCESS(f"\nCleanup complete. {files_deleted} file(s) removed."))
