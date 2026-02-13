from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    description = models.TextField(blank=True)

    def __str__(self):
        return self.username  # ← éviter self.name (tu n'as pas de champ 'name')


class Team(models.Model):
    name = models.CharField(max_length=100)
    creator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_teams')
    members = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='teams')

    def __str__(self):
        return self.name


class Task(models.Model):
    STATUS_CHOICES = [
        ('todo', 'À faire'),
        ('done', 'Accomplie'),
    ]

    TASK_TYPE_CHOICES = [
        ('recitation', 'Récitation'),
        ('memorization', 'Mémorisation'),
        ('other', 'Autre'),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='todo')
    is_private = models.BooleanField(default=True)

    # New fields for submission system
    points = models.PositiveIntegerField(default=0, help_text="Points awarded for completing this task")
    task_type = models.CharField(max_length=20, choices=TASK_TYPE_CHOICES, default='other')
    due_date = models.DateField(null=True, blank=True)

    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_tasks')
    assigned_users = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='assigned_tasks', blank=True)
    assigned_teams = models.ManyToManyField('Team', related_name='assigned_tasks', blank=True)
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='subtasks')

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
