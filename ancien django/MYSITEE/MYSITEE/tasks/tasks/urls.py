from django.contrib import admin
from django.urls import path
from  . import views


urlpatterns = [
    # page d'acceuil
    path('', views.home_view , name='home'),

    # Pages principales
    path('', views.dashboard_view, name='home'),  #  dashboard comme  page principale
    path('dashboard/', views.dashboard_view, name='dashboard'),

    # Authentification
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('register/', views.register_view, name='register'),
    path('profile/<str:username>/', views.profile_view, name='user_profile'),

    # Gestion des tâches
    path('tasks/', views.task_list, name='task_list'),
    path('tasks/new/', views.create_task, name='task_create'),
    path('tasks/<int:task_id>/edit/', views.update_task, name='task_edit'),
    path('tasks/<int:task_id>/join/', views.join_task, name='join_task'),
    path('tasks/<int:task_id>/delete/', views.delete_task, name='task_delete'),
    path('tasks/<int:task_id>/quit/', views.quit_task, name='quit_task'),


    # Gestion des team
    path('teams/create/', views.create_team, name='create_team'),
    path('teams/<int:team_id>/join/', views.join_team, name='join_team'),    
    path('teams/<int:team_id>/quit/', views.quit_team, name='quit_team'),
    path('teams/<int:team_id>/delete/', views.delete_team, name='delete_team'),
    

]


    
