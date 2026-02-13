from django.urls import path
from . import views

urlpatterns = [
    # Student views
    path('my-submissions/', views.my_submissions, name='my_submissions'),
    path('submit/<int:task_id>/', views.submit_audio, name='submit_audio'),

    # Staff views
    path('pending/', views.pending_submissions, name='pending_submissions'),
    path('<int:submission_id>/approve/', views.approve_submission, name='approve_submission'),
    path('<int:submission_id>/reject/', views.reject_submission, name='reject_submission'),
]
