from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .api_views import (
    CreateTeacherView,
    ListUsersView,
    MeView,
    MyStudentsView,
    MySubmissionsView,
    PendingSubmissionsView,
    PointsView,
    RegisterView,
    StudentProgressView,
    SubmissionApproveView,
    SubmissionCreateView,
    SubmissionRejectView,
    TaskCreateView,
    TaskListView,
)

urlpatterns = [
    # Auth
    path('register/', RegisterView.as_view(), name='api_register'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # User
    path('me/', MeView.as_view(), name='api_me'),
    path('points/', PointsView.as_view(), name='api_points'),

    # Tasks
    path('tasks/', TaskListView.as_view(), name='api_tasks'),
    path('tasks/create/', TaskCreateView.as_view(), name='api_tasks_create'),

    # Submissions
    path('submissions/', SubmissionCreateView.as_view(), name='api_submissions_create'),
    path('my-submissions/', MySubmissionsView.as_view(), name='api_my_submissions'),
    path('submissions/<int:submission_id>/approve/', SubmissionApproveView.as_view(), name='api_submissions_approve'),
    path('submissions/<int:submission_id>/reject/', SubmissionRejectView.as_view(), name='api_submissions_reject'),

    # Teacher-only
    path('pending-submissions/', PendingSubmissionsView.as_view(), name='api_pending_submissions'),
    path('my-students/', MyStudentsView.as_view(), name='api_my_students'),
    path('students/<int:student_id>/progress/', StudentProgressView.as_view(), name='api_student_progress'),

    # Admin-only
    path('admin/create-teacher/', CreateTeacherView.as_view(), name='api_create_teacher'),
    path('admin/users/', ListUsersView.as_view(), name='api_list_users'),
]
