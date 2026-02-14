from django.contrib.auth import get_user_model
from django.db.models import Q
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
        return User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
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
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)


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
            'total_points': total_points,
        })


class TaskSerializer(serializers.ModelSerializer):
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
        ]

    def get_audio_url(self, obj):
        if not obj.audio_file:
            return None
        request = self.context.get('request')
        if request is None:
            return obj.audio_file.url
        return request.build_absolute_uri(obj.audio_file.url)


class SubmissionCreateSerializer(serializers.Serializer):
    task_id = serializers.IntegerField()
    audio_file = serializers.FileField()

    def validate(self, attrs):
        request = self.context['request']
        task = get_object_or_404(Task, id=attrs['task_id'])

        if not is_user_assigned_to_task(request.user, task):
            raise serializers.ValidationError(
                "Vous n'êtes pas assigné à cette tâche."
            )

        existing = get_submission_for_task(request.user, task)
        if existing and existing.status == 'approved':
            raise serializers.ValidationError(
                "Votre soumission a déjà été approuvée. Vous ne pouvez pas la remplacer."
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


class SubmissionApproveView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, submission_id):
        submission = get_object_or_404(Submission, id=submission_id)
        approve_submission(submission, request.user)
        return Response({'status': 'approved'})


class SubmissionRejectView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, submission_id):
        submission = get_object_or_404(Submission, id=submission_id)
        reject_submission(
            submission,
            request.user,
            feedback=request.data.get('admin_feedback', '')
        )
        return Response({'status': 'rejected'})
