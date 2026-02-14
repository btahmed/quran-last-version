from django.contrib.auth import get_user_model
from django.db.models import Q, Count, Sum
from django.shortcuts import get_object_or_404

from rest_framework import permissions, serializers, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from points.models import PointsLog
from submissions.models import Submission
from submissions.services import (
    approve_submission,
    get_submission_for_task,
    is_user_assigned_to_task,
    reject_submission,
    submit_audio_for_task,
)
from tasks.models import Task

User = get_user_model()


# ===================================
# PERMISSIONS
# ===================================

class IsSuperUser(permissions.BasePermission):
    """Only allow superusers."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_superuser


class IsTeacher(permissions.BasePermission):
    """Only allow users with role='teacher' or staff."""
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and (request.user.role == 'teacher' or request.user.is_staff)
        )


# ===================================
# AUTHENTICATION
# ===================================

class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=6)
    first_name = serializers.CharField(max_length=150, required=False, default='')
    last_name = serializers.CharField(max_length=150, required=False, default='')

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("اسم المستخدم مستخدم بالفعل.")
        return value

    def create(self, validated_data):
        # Role is always 'student' - only admin can create teacher accounts
        return User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role='student',
        )


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'id': user.id,
            'username': user.username,
            'first_name': user.first_name,
            'role': user.role,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)


# ===================================
# ADMIN - CREATE TEACHER
# ===================================

class CreateTeacherView(APIView):
    """Teacher or superuser: create a teacher account or promote an existing student."""
    permission_classes = [IsTeacher]

    def post(self, request):
        username = request.data.get('username', '').strip()
        password = request.data.get('password', '')
        first_name = request.data.get('first_name', '').strip()
        last_name = request.data.get('last_name', '').strip()
        promote = request.data.get('promote', False)

        if not username:
            return Response(
                {'detail': 'اسم المستخدم مطلوب.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Promote existing user to teacher
        if promote:
            try:
                user = User.objects.get(username=username)
                user.role = 'teacher'
                user.save()
                return Response({
                    'id': user.id,
                    'username': user.username,
                    'first_name': user.first_name,
                    'role': user.role,
                    'action': 'promoted',
                })
            except User.DoesNotExist:
                return Response(
                    {'detail': 'المستخدم غير موجود.'},
                    status=status.HTTP_404_NOT_FOUND,
                )

        # Create new teacher account
        if not password or len(password) < 6:
            return Response(
                {'detail': 'كلمة المرور مطلوبة (6 أحرف على الأقل).'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if User.objects.filter(username=username).exists():
            return Response(
                {'detail': 'اسم المستخدم مستخدم بالفعل.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.create_user(
            username=username,
            password=password,
            first_name=first_name,
            last_name=last_name,
            role='teacher',
        )
        return Response({
            'id': user.id,
            'username': user.username,
            'first_name': user.first_name,
            'role': user.role,
            'action': 'created',
        }, status=status.HTTP_201_CREATED)


# ===================================
# USER PROFILE
# ===================================

class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        total_points = PointsLog.get_total_points(user)
        return Response({
            'id': user.id,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'is_superuser': user.is_superuser,
            'total_points': total_points,
        })


# ===================================
# TASKS
# ===================================

class TaskSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)

    class Meta:
        model = Task
        fields = [
            'id',
            'title',
            'description',
            'status',
            'points',
            'task_type',
            'due_date',
            'created_at',
            'author_name',
        ]


class TaskListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        tasks = Task.objects.filter(
            Q(assigned_users=request.user) |
            Q(assigned_teams__members=request.user) |
            Q(author=request.user)
        ).distinct().order_by('-created_at')
        return Response(TaskSerializer(tasks, many=True).data)


class TaskCreateView(APIView):
    """Teachers create tasks and assign to students."""
    permission_classes = [IsTeacher]

    def post(self, request):
        title = request.data.get('title', '').strip()
        if not title:
            return Response(
                {'detail': 'عنوان المهمة مطلوب.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        task = Task.objects.create(
            title=title,
            description=request.data.get('description', ''),
            task_type=request.data.get('task_type', 'other'),
            points=int(request.data.get('points', 0)),
            due_date=request.data.get('due_date') or None,
            author=request.user,
            is_private=False,
        )

        # Assign students by id list
        student_ids = request.data.get('student_ids', [])
        if student_ids:
            students = User.objects.filter(id__in=student_ids, role='student')
            task.assigned_users.set(students)

        # Assign all students if assign_all flag
        if request.data.get('assign_all'):
            all_students = User.objects.filter(role='student')
            task.assigned_users.set(all_students)

        return Response(TaskSerializer(task).data, status=status.HTTP_201_CREATED)


# ===================================
# SUBMISSIONS
# ===================================

class SubmissionTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = [
            'id',
            'title',
            'task_type',
            'points',
            'due_date',
        ]


class SubmissionSerializer(serializers.ModelSerializer):
    task = SubmissionTaskSerializer(read_only=True)
    audio_url = serializers.SerializerMethodField()
    student_name = serializers.SerializerMethodField()

    class Meta:
        model = Submission
        fields = [
            'id',
            'task',
            'status',
            'admin_feedback',
            'submitted_at',
            'validated_at',
            'audio_url',
            'student_name',
        ]

    def get_audio_url(self, obj):
        if not obj.audio_file:
            return None
        request = self.context.get('request')
        if request is None:
            return obj.audio_file.url
        return request.build_absolute_uri(obj.audio_file.url)

    def get_student_name(self, obj):
        return obj.student.first_name or obj.student.username


class SubmissionCreateSerializer(serializers.Serializer):
    task_id = serializers.IntegerField()
    audio_file = serializers.FileField()

    def validate(self, attrs):
        request = self.context['request']
        task = get_object_or_404(Task, id=attrs['task_id'])

        if not is_user_assigned_to_task(request.user, task):
            raise serializers.ValidationError(
                "لست مسجلاً في هذه المهمة."
            )

        existing = get_submission_for_task(request.user, task)
        if existing and existing.status == 'approved':
            raise serializers.ValidationError(
                "تم قبول تسليمك بالفعل. لا يمكنك استبداله."
            )

        attrs['task'] = task
        attrs['existing_submission'] = existing
        return attrs

    def create(self, validated_data):
        request = self.context['request']
        submission, _ = submit_audio_for_task(
            request.user,
            validated_data['task'],
            validated_data['audio_file'],
            existing_submission=validated_data['existing_submission']
        )
        return submission


class SubmissionCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = SubmissionCreateSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        submission = serializer.save()
        existing = serializer.validated_data.get('existing_submission')
        status_code = status.HTTP_200_OK if existing else status.HTTP_201_CREATED
        return Response(
            SubmissionSerializer(submission, context={'request': request}).data,
            status=status_code
        )


class MySubmissionsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        submissions = Submission.objects.filter(
            student=request.user
        ).select_related('task')
        return Response(
            SubmissionSerializer(
                submissions,
                many=True,
                context={'request': request}
            ).data
        )


# ===================================
# POINTS
# ===================================

class PointsLogSerializer(serializers.ModelSerializer):
    submission_id = serializers.IntegerField(source='submission_id', read_only=True)

    class Meta:
        model = PointsLog
        fields = [
            'id',
            'delta',
            'reason',
            'submission_id',
            'created_at',
        ]


class PointsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        logs = PointsLog.objects.filter(student=request.user)
        return Response({
            'total_points': PointsLog.get_total_points(request.user),
            'logs': PointsLogSerializer(logs, many=True).data,
        })


# ===================================
# TEACHER ENDPOINTS
# ===================================

class SubmissionApproveView(APIView):
    permission_classes = [IsTeacher]

    def post(self, request, submission_id):
        submission = get_object_or_404(Submission, id=submission_id)
        approve_submission(submission, request.user)
        return Response({'status': 'approved'})


class SubmissionRejectView(APIView):
    permission_classes = [IsTeacher]

    def post(self, request, submission_id):
        submission = get_object_or_404(Submission, id=submission_id)
        reject_submission(
            submission,
            request.user,
            feedback=request.data.get('admin_feedback', '')
        )
        return Response({'status': 'rejected'})


class PendingSubmissionsView(APIView):
    """List all pending submissions for tasks created by this teacher."""
    permission_classes = [IsTeacher]

    def get(self, request):
        submissions = Submission.objects.filter(
            task__author=request.user,
            status='submitted',
        ).select_related('task', 'student').order_by('-submitted_at')
        return Response(
            SubmissionSerializer(
                submissions,
                many=True,
                context={'request': request}
            ).data
        )


class MyStudentsView(APIView):
    """List students assigned to any task created by this teacher."""
    permission_classes = [IsTeacher]

    def get(self, request):
        student_ids = Task.objects.filter(
            author=request.user
        ).values_list('assigned_users', flat=True).distinct()

        students = User.objects.filter(
            id__in=student_ids, role='student'
        ).annotate(
            total_points=Sum('pointslog__delta'),
            submissions_count=Count('submission', distinct=True),
        )

        data = []
        for s in students:
            data.append({
                'id': s.id,
                'username': s.username,
                'first_name': s.first_name,
                'total_points': s.total_points or 0,
                'submissions_count': s.submissions_count,
            })
        return Response(data)


class StudentProgressView(APIView):
    """Get detailed progress for a specific student (teacher only)."""
    permission_classes = [IsTeacher]

    def get(self, request, student_id):
        student = get_object_or_404(User, id=student_id, role='student')

        # Tasks assigned to this student by this teacher
        tasks = Task.objects.filter(
            author=request.user,
            assigned_users=student,
        )

        task_data = []
        for task in tasks:
            sub = Submission.objects.filter(task=task, student=student).first()
            task_data.append({
                'id': task.id,
                'title': task.title,
                'task_type': task.task_type,
                'points': task.points,
                'due_date': task.due_date,
                'submission_status': sub.status if sub else 'not_submitted',
            })

        return Response({
            'student': {
                'id': student.id,
                'username': student.username,
                'first_name': student.first_name,
                'total_points': PointsLog.get_total_points(student),
            },
            'tasks': task_data,
        })
