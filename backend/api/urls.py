from django.urls import path
from . import views

urlpatterns = [
    # Tasks
    path('tasks/', views.TaskListCreateView.as_view(), name='task-list'),
    path('tasks/<int:pk>/', views.TaskDetailView.as_view(), name='task-detail'),
    
    # Progress
    path('progress/', views.ProgressListCreateView.as_view(), name='progress-list'),
    path('progress/stats/', views.ProgressStatsView.as_view(), name='progress-stats'),
    
    # Dashboard
    path('dashboard/', views.dashboard_stats, name='dashboard'),
    
    # Competitions
    path('competitions/', views.CompetitionListView.as_view(), name='competition-list'),
    path('competitions/<int:pk>/', views.CompetitionDetailView.as_view(), name='competition-detail'),
    path('competitions/<int:pk>/join/', views.join_competition, name='competition-join'),
    path('competitions/<int:pk>/score/', views.submit_competition_score, name='competition-score'),

    # Compatibility endpoints used by frontend dashboard/competition
    path('my-submissions/', views.MySubmissionsView.as_view(), name='my-submissions'),
    path('points/', views.PointsView.as_view(), name='points'),
    path('leaderboard/', views.LeaderboardView.as_view(), name='leaderboard'),

    # Soumissions audio
    path('submissions/', views.SubmissionCreateView.as_view(), name='submission-create'),
    path('pending-submissions/', views.PendingSubmissionsView.as_view(), name='pending-submissions'),
    path('submissions/<int:submission_id>/approve/', views.SubmissionApproveView.as_view(), name='submission-approve'),
    path('submissions/<int:submission_id>/reject/', views.SubmissionRejectView.as_view(), name='submission-reject'),
    path('my-students/', views.MyStudentsView.as_view(), name='my-students'),
    path('my-teacher/', views.MyTeacherView.as_view(), name='my-teacher'),
]
