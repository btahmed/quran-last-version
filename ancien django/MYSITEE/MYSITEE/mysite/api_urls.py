from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .api_views import (
    MySubmissionsView,
    PointsView,
    SubmissionApproveView,
    SubmissionCreateView,
    SubmissionRejectView,
    TaskListView,
)

urlpatterns = [
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('tasks/', TaskListView.as_view(), name='api_tasks'),
    path('submissions/', SubmissionCreateView.as_view(), name='api_submissions_create'),
    path('my-submissions/', MySubmissionsView.as_view(), name='api_my_submissions'),
    path('points/', PointsView.as_view(), name='api_points'),
    path('submissions/<int:submission_id>/approve/', SubmissionApproveView.as_view(), name='api_submissions_approve'),
    path('submissions/<int:submission_id>/reject/', SubmissionRejectView.as_view(), name='api_submissions_reject'),
]
