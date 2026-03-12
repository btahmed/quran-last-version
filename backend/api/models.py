from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Task(models.Model):
    TYPE_CHOICES = [
        ('hifz', 'حفظ'),
        ('muraja', 'مراجعة'),
        ('tilawa', 'تلاوة'),
    ]
    
    PRIORITY_CHOICES = [
        ('high', 'عالية'),
        ('medium', 'متوسطة'),
        ('low', 'منخفضة'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'قيد الانتظار'),
        ('in_progress', 'جاري العمل'),
        ('completed', 'مكتمل'),
        ('cancelled', 'ملغي'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='hifz')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    surah = models.IntegerField(null=True, blank=True)
    start_ayah = models.IntegerField(null=True, blank=True)
    end_ayah = models.IntegerField(null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'tasks'
        ordering = ['-created_at']


class Progress(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='progress')
    surah = models.IntegerField()
    ayah = models.IntegerField()
    type = models.CharField(max_length=20, choices=[('hifz', 'حفظ'), ('muraja', 'مراجعة')], default='hifz')
    accuracy = models.IntegerField(default=0)
    duration = models.IntegerField(default=0)  # in seconds
    completed_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'progress'
        ordering = ['-completed_at']


class ReviewSchedule(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='review_schedules')
    surah = models.IntegerField()
    start_ayah = models.IntegerField()
    end_ayah = models.IntegerField()
    next_review_date = models.DateField()
    review_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'review_schedules'
        ordering = ['next_review_date']


class Achievement(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='achievements')
    title = models.CharField(max_length=255)
    description = models.TextField()
    icon = models.CharField(max_length=100)
    earned_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'achievements'
        ordering = ['-earned_at']


class Competition(models.Model):
    STATUS_CHOICES = [
        ('active', 'نشط'),
        ('completed', 'مكتمل'),
        ('cancelled', 'ملغي'),
    ]
    
    name = models.CharField(max_length=255)
    description = models.TextField()
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    participants = models.ManyToManyField(User, related_name='competitions', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'competitions'
        ordering = ['-created_at']


class CompetitionScore(models.Model):
    competition = models.ForeignKey(Competition, on_delete=models.CASCADE, related_name='scores')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='competition_scores')
    score = models.IntegerField(default=0)
    ayah_count = models.IntegerField(default=0)
    last_activity = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'competition_scores'
        unique_together = ['competition', 'user']
