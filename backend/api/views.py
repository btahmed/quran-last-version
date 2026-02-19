from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from datetime import datetime, timedelta

from .models import Task, Progress, ReviewSchedule, Achievement, Competition, CompetitionScore
from .serializers import (
    TaskSerializer, ProgressSerializer, ReviewScheduleSerializer,
    AchievementSerializer, CompetitionSerializer, CompetitionScoreSerializer
)


# ============ Tasks ============

class TaskListCreateView(generics.ListCreateAPIView):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['due_date', 'priority', 'created_at']
    
    def get_queryset(self):
        queryset = Task.objects.filter(user=self.request.user)
        status_filter = self.request.query_params.get('status')
        type_filter = self.request.query_params.get('type')
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if type_filter:
            queryset = queryset.filter(type=type_filter)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Task.objects.filter(user=self.request.user)


# ============ Progress ============

class ProgressListCreateView(generics.ListCreateAPIView):
    serializer_class = ProgressSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Progress.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ProgressStatsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        total_hifz = Progress.objects.filter(user=user, type='hifz').count()
        total_muraja = Progress.objects.filter(user=user, type='muraja').count()
        
        # Get today's activity
        today = timezone.now().date()
        today_activity = Progress.objects.filter(
            user=user,
            completed_at__date=today
        ).count()
        
        # Calculate streak
        streak = calculate_streak(user)
        
        return Response({
            'total_hifz': total_hifz,
            'total_muraja': total_muraja,
            'today_activity': today_activity,
            'streak': streak
        })


# ============ Dashboard ============

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    user = request.user
    
    # Today's tasks
    today = timezone.now().date()
    today_tasks = Task.objects.filter(
        user=user,
        due_date=today
    ).count()
    
    # Pending tasks
    pending_tasks = Task.objects.filter(
        user=user,
        status__in=['pending', 'in_progress']
    ).count()
    
    # Total progress (ayahs memorized)
    total_memorized = Progress.objects.filter(
        user=user,
        type='hifz'
    ).count()
    
    # Recent achievements
    recent_achievements = Achievement.objects.filter(
        user=user
    ).order_by('-earned_at')[:5]
    
    # Streak
    streak = calculate_streak(user)
    
    return Response({
        'today_tasks': today_tasks,
        'pending_tasks': pending_tasks,
        'total_memorized': total_memorized,
        'streak': streak,
        'recent_achievements': AchievementSerializer(recent_achievements, many=True).data
    })


# ============ Competitions ============

class CompetitionListView(generics.ListAPIView):
    serializer_class = CompetitionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Competition.objects.filter(status='active')


class CompetitionDetailView(generics.RetrieveAPIView):
    serializer_class = CompetitionSerializer
    permission_classes = [IsAuthenticated]
    queryset = Competition.objects.all()


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_competition(request, pk):
    try:
        competition = Competition.objects.get(pk=pk, status='active')
        competition.participants.add(request.user)
        
        # Create or get competition score
        score, created = CompetitionScore.objects.get_or_create(
            competition=competition,
            user=request.user,
            defaults={'score': 0, 'ayah_count': 0}
        )
        
        return Response({
            'success': True,
            'message': 'تم الانضمام إلى المسابقة بنجاح'
        })
    except Competition.DoesNotExist:
        return Response(
            {'success': False, 'error': 'المسابقة غير موجودة'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_competition_score(request, pk):
    try:
        competition = Competition.objects.get(pk=pk, status='active')
        
        if request.user not in competition.participants.all():
            return Response(
                {'success': False, 'error': 'لم تنضم إلى هذه المسابقة'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        score_value = request.data.get('score', 0)
        ayah_count = request.data.get('ayah_count', 0)
        
        score, created = CompetitionScore.objects.get_or_create(
            competition=competition,
            user=request.user,
            defaults={'score': score_value, 'ayah_count': ayah_count}
        )
        
        if not created:
            score.score += score_value
            score.ayah_count += ayah_count
            score.save()
        
        return Response({
            'success': True,
            'total_score': score.score,
            'total_ayah': score.ayah_count
        })
    except Competition.DoesNotExist:
        return Response(
            {'success': False, 'error': 'المسابقة غير موجودة'},
            status=status.HTTP_404_NOT_FOUND
        )


# ============ Helper Functions ============

def calculate_streak(user):
    """Calculate user's daily activity streak"""
    progress_dates = Progress.objects.filter(
        user=user
    ).dates('completed_at', 'day', order='DESC')
    
    if not progress_dates:
        return 0
    
    streak = 0
    today = timezone.now().date()
    
    for i, date in enumerate(progress_dates):
        expected_date = today - timedelta(days=i)
        if date == expected_date:
            streak += 1
        else:
            break
    
    return streak
