from rest_framework import generics, status, filters
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db.models import Sum
from django.db.models.functions import Coalesce
from datetime import datetime, timedelta

from .models import Task, Progress, ReviewSchedule, Achievement, Competition, CompetitionScore, Submission, PointsLog
from .serializers import (
    TaskSerializer, ProgressSerializer, ReviewScheduleSerializer,
    AchievementSerializer, CompetitionSerializer, CompetitionScoreSerializer
)
from .middleware import ClassePermissionMixin

User = get_user_model()


# ============ Tasks ============

class TaskListCreateView(generics.ListCreateAPIView):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['due_date', 'priority', 'created_at']

    def get_queryset(self):
        user = self.request.user
        # Les enseignants voient les tâches qu'ils ont créées pour leurs élèves
        if getattr(user, 'role', None) == 'teacher' or user.is_staff:
            queryset = Task.objects.filter(assigned_by=user)
        else:
            queryset = Task.objects.filter(user=user)
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


# ============ Compatibility Endpoints ============

class MySubmissionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        subs = Submission.objects.filter(student=request.user).select_related('task')
        data = [{
            'id': s.id,
            'task_title': s.task.title,
            'status': s.status,
            'submitted_at': s.submitted_at,
            'admin_feedback': s.admin_feedback,
        } for s in subs]
        return Response(data)


class PointsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        total = PointsLog.get_total_points(request.user)
        logs = PointsLog.objects.filter(student=request.user)[:20]
        data = {
            'total': total,
            'logs': [{'delta': l.delta, 'reason': l.reason, 'created_at': l.created_at} for l in logs]
        }
        return Response(data)


class LeaderboardView(APIView):
    """
    Compatibility endpoint used by competition UI.
    GET returns aggregated leaderboard.
    POST is accepted for compatibility and returns the refreshed board.
    """
    permission_classes = [IsAuthenticated]

    def _build_leaderboard(self):
        rows = (
            User.objects
            .annotate(
                total_points=Coalesce(Sum('competition_scores__score'), 0),
                submissions_count=Coalesce(Sum('competition_scores__ayah_count'), 0),
            )
            .order_by('-total_points', 'username')[:20]
        )
        return [
            {
                'username': u.username,
                'total_points': u.total_points,
                'score': u.total_points,
                'submissions_count': u.submissions_count,
            }
            for u in rows
        ]

    def get(self, request):
        return Response({'leaderboard': self._build_leaderboard()})

    def post(self, request):
        return Response({'leaderboard': self._build_leaderboard()})


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


class SubmissionCreateView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        task_id = request.data.get('task_id')
        audio = request.FILES.get('audio_file')
        if not task_id or not audio:
            return Response({'detail': 'task_id et audio_file requis'}, status=400)
        try:
            task = Task.objects.get(pk=task_id)
        except Task.DoesNotExist:
            return Response({'detail': 'Tache introuvable'}, status=404)
        sub, created = Submission.objects.get_or_create(
            task=task, student=request.user,
            defaults={'audio_file': audio}
        )
        if not created:
            if sub.status != 'submitted':
                return Response({'detail': 'Soumission deja traitee'}, status=400)
            sub.audio_file = audio
            sub.status = 'submitted'
            sub.save()
        return Response({'id': sub.id, 'status': sub.status}, status=201 if created else 200)


class PendingSubmissionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['teacher', 'admin'] and not request.user.is_superuser:
            return Response({'detail': 'Forbidden'}, status=403)
        subs = Submission.objects.filter(status='submitted').select_related('task', 'student')
        data = [{
            'id': s.id,
            'student': s.student.username,
            'student_name': f"{s.student.first_name} {s.student.last_name}".strip(),
            'task': s.task.title,
            'submitted_at': s.submitted_at,
        } for s in subs]
        return Response(data)


class SubmissionApproveView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, submission_id):
        if request.user.role not in ['teacher', 'admin'] and not request.user.is_superuser:
            return Response({'detail': 'Forbidden'}, status=403)
        try:
            sub = Submission.objects.get(pk=submission_id)
        except Submission.DoesNotExist:
            return Response({'detail': 'Not found'}, status=404)
        sub.status = 'approved'
        sub.validated_at = timezone.now()
        sub.validated_by = request.user
        points = getattr(sub.task, 'points', 0) or 0
        sub.awarded_points = points
        sub.save()
        if points:
            PointsLog.objects.create(
                student=sub.student,
                delta=points,
                reason=f"Tache approuvee: {sub.task.title}",
                submission=sub
            )
        return Response({'status': 'approved', 'points_awarded': points})


class SubmissionRejectView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, submission_id):
        if request.user.role not in ['teacher', 'admin'] and not request.user.is_superuser:
            return Response({'detail': 'Forbidden'}, status=403)
        try:
            sub = Submission.objects.get(pk=submission_id)
        except Submission.DoesNotExist:
            return Response({'detail': 'Not found'}, status=404)
        sub.status = 'rejected'
        sub.admin_feedback = request.data.get('feedback', '')
        sub.validated_at = timezone.now()
        sub.validated_by = request.user
        sub.save()
        return Response({'status': 'rejected'})


class MyStudentsView(ClassePermissionMixin, APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['teacher', 'admin'] and not request.user.is_superuser:
            return Response({'detail': 'Forbidden'}, status=403)
        students = self.get_users_for_class(request.user).filter(role='student')
        data = []
        for u in students:
            total_pts = PointsLog.get_total_points(u)
            subs_count = u.submissions.count()
            data.append({
                'id': u.id,
                'username': u.username,
                'first_name': u.first_name,
                'last_name': u.last_name,
                'email': u.email,
                'role': u.role,
                'total_points': total_pts,
                'submissions_count': subs_count,
            })
        return Response(data)


class MyTeacherView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        # Chercher les groupes de l'étudiant au format Classe_*_Prof_*
        student_groups = user.groups.filter(name__startswith='Classe_', name__contains='_Prof_')

        if not student_groups.exists():
            return Response({'teacher_name': None})

        # Prendre le premier groupe trouvé
        group = student_groups.first()
        group_name = group.name  # ex: Classe_8h45_Prof_Oum_Wael

        # Extraire le nom de classe depuis le nom du groupe
        # Format : Classe_{classe_name}_Prof_{prof_name}
        parts = group_name.split('_Prof_')
        classe_name = parts[0].replace('Classe_', '', 1) if len(parts) >= 2 else None
        prof_part = parts[1] if len(parts) >= 2 else None

        # Trouver le teacher membre de ce groupe avec role='teacher'
        teacher = User.objects.filter(groups=group, role='teacher').first()

        if not teacher:
            return Response({'teacher_name': None})

        # Ignorer les valeurs "nan" issues de l'import pandas
        fn = teacher.first_name if teacher.first_name and teacher.first_name.lower() != 'nan' else ''
        ln = teacher.last_name if teacher.last_name and teacher.last_name.lower() != 'nan' else ''
        display_name = f"{fn} {ln}".strip() or teacher.username

        return Response({
            'teacher_name': display_name,
            'teacher_username': teacher.username,
            'classe_name': classe_name,
        })


class TeacherTaskCreateView(APIView):
    """
    POST /api/tasks/create/
    Crée une tâche pour tous les élèves du groupe de l'enseignant connecté.
    """
    permission_classes = [IsAuthenticated]

    TASK_TYPE_MAP = {
        'memorization': 'hifz',
        'review': 'muraja',
        'tajweed': 'tilawa',
        'hifz': 'hifz',
        'muraja': 'muraja',
        'tilawa': 'tilawa',
    }

    def post(self, request):
        user = request.user
        if getattr(user, 'role', None) != 'teacher' and not user.is_staff:
            return Response({'detail': 'Accès réservé aux enseignants.'}, status=403)

        title = request.data.get('title', '').strip()
        if not title:
            return Response({'detail': 'Le titre est obligatoire.'}, status=400)

        description = request.data.get('description', '')
        task_type_raw = request.data.get('task_type', 'hifz')
        task_type = self.TASK_TYPE_MAP.get(task_type_raw, 'hifz')
        points = int(request.data.get('points', 0) or 0)
        due_date = request.data.get('due_date') or None
        assign_all = request.data.get('assign_all', True)
        student_ids = request.data.get('student_ids', [])

        # Récupérer les élèves du groupe de l'enseignant
        teacher_groups = user.groups.filter(name__startswith='Classe_')
        students = User.objects.filter(groups__in=teacher_groups, role='student').distinct()

        if not assign_all and student_ids:
            students = students.filter(id__in=student_ids)

        if not students.exists():
            return Response({'detail': 'Aucun élève trouvé dans votre groupe.'}, status=400)

        # Créer une tâche pour chaque élève
        created = 0
        for student in students:
            Task.objects.create(
                user=student,
                assigned_by=user,
                title=title,
                description=description,
                type=task_type,
                points=points,
                due_date=due_date,
            )
            created += 1

        return Response({'detail': f'{created} مهمة تم إنشاؤها بنجاح.', 'count': created})
