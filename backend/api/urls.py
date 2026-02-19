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
]
