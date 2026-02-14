"""
Management command to create a superuser from environment variables.
Runs safely on every deploy — skips if user already exists.

Required env vars:
  DJANGO_SUPERUSER_USERNAME
  DJANGO_SUPERUSER_PASSWORD

Optional env vars:
  DJANGO_SUPERUSER_EMAIL (default: '')
  DJANGO_SUPERUSER_FIRSTNAME (default: '')
"""
import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

User = get_user_model()


class Command(BaseCommand):
    help = 'Create superuser with role=teacher from env vars (idempotent)'

    def handle(self, *args, **options):
        username = os.environ.get('DJANGO_SUPERUSER_USERNAME')
        password = os.environ.get('DJANGO_SUPERUSER_PASSWORD')

        if not username or not password:
            self.stdout.write(self.style.WARNING(
                'DJANGO_SUPERUSER_USERNAME / DJANGO_SUPERUSER_PASSWORD not set — skipping.'
            ))
            return

        if User.objects.filter(username=username).exists():
            user = User.objects.get(username=username)
            # Ensure role and superuser status are correct
            changed = False
            if user.role != 'teacher':
                user.role = 'teacher'
                changed = True
            if not user.is_superuser:
                user.is_superuser = True
                changed = True
            if not user.is_staff:
                user.is_staff = True
                changed = True
            if changed:
                user.save()
                self.stdout.write(self.style.SUCCESS(
                    f'Updated existing user "{username}" → role=teacher, is_superuser=True'
                ))
            else:
                self.stdout.write(self.style.SUCCESS(
                    f'Superuser "{username}" already exists and is correctly configured.'
                ))
            return

        email = os.environ.get('DJANGO_SUPERUSER_EMAIL', '')
        first_name = os.environ.get('DJANGO_SUPERUSER_FIRSTNAME', '')

        user = User.objects.create_superuser(
            username=username,
            email=email,
            password=password,
        )
        user.role = 'teacher'
        user.first_name = first_name
        user.save()

        self.stdout.write(self.style.SUCCESS(
            f'Superuser "{username}" created with role=teacher'
        ))
