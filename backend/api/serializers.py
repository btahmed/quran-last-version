from rest_framework import serializers
from .models import Task, Progress, ReviewSchedule, Achievement, Competition, CompetitionScore


class TaskSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Task
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'updated_at']


class ProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Progress
        fields = '__all__'
        read_only_fields = ['user', 'completed_at']


class ReviewScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewSchedule
        fields = '__all__'
        read_only_fields = ['user']


class AchievementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Achievement
        fields = '__all__'


class CompetitionScoreSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = CompetitionScore
        fields = ['id', 'user', 'username', 'score', 'ayah_count', 'last_activity']


class CompetitionSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    scores = CompetitionScoreSerializer(many=True, read_only=True)
    participants_count = serializers.IntegerField(source='participants.count', read_only=True)
    
    class Meta:
        model = Competition
        fields = '__all__'
