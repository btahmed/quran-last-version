from django.core.management.base import BaseCommand
from tasks.models import Task
from submissions.models import Submission

class Command(BaseCommand):
    help = 'Delete all tasks and associated submissions'

    def handle(self, *args, **kwargs):
        task_count = Task.objects.count()
        sub_count = Submission.objects.count()

        if task_count == 0:
            self.stdout.write(self.style.WARNING("No tasks to delete."))
            return

        confirm = input(f"Are you sure you want to delete {task_count} tasks and {sub_count} submissions? (yes/no): ")
        if confirm.lower() != 'yes':
            self.stdout.write(self.style.WARNING("Operation cancelled."))
            return

        Task.objects.all().delete()
        self.stdout.write(self.style.SUCCESS(f"Successfully deleted {task_count} tasks."))
