from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth import login as auth_login, authenticate, logout as auth_logout
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.decorators import login_required
from django.contrib.auth import get_user_model
from django.db.models import Q
from .forms import TaskForm, RegisterForm, TeamForm
from .models import Task, Team

User = get_user_model()


# Page d'accueil
def home_view(request):
    return render(request, 'tasks/home.html')


# Connexion
def login_view(request):
    if request.method == 'POST':
        form = AuthenticationForm(data=request.POST)
        if form.is_valid():
            user = form.get_user()
            auth_login(request, user)
            return redirect('dashboard')
    else:
        form = AuthenticationForm()
    return render(request, 'tasks/login.html', {'form': form})


# Inscription
def register_view(request):
    if request.method == 'POST':
        form = RegisterForm(request.POST)
        if form.is_valid():
            user = form.save()
            messages.success(request, 'Compte créé avec succès.')
            auth_login(request, user)
            return redirect('dashboard')
    else:
        form = RegisterForm()
    return render(request, 'tasks/register.html', {'form': form})


# Déconnexion
def logout_view(request):
    auth_logout(request)
    return redirect('home')


# Profil utilisateur
@login_required
def profile_view(request, username):
    profile_user = get_object_or_404(User, username=username)
    public_tasks = Task.objects.filter(author=profile_user, is_private=False)
    teams = profile_user.teams.all()

    return render(request, 'tasks/user_profile.html', {
        'profile_user': profile_user,
        'public_tasks': public_tasks,
        'teams': teams
    })


# Dashboard
@login_required
def dashboard_view(request):
    user = request.user

    private_tasks = Task.objects.filter(is_private=True, assigned_users=user)

    assigned_public_tasks = Task.objects.filter(
        is_private=False,
        parent__isnull=True
    ).filter(
        Q(assigned_users=user) |
        Q(assigned_teams__members=user) |
        Q(author=user)
    ).distinct()

    available_public_tasks = Task.objects.filter(
        is_private=False,
        parent__isnull=True
    ).exclude(
        Q(assigned_users=user) |
        Q(assigned_teams__members=user) |
        Q(author=user)
    ).distinct()

    my_teams = Team.objects.filter(members=user)
    other_teams = Team.objects.exclude(members=user)

    return render(request, 'tasks/dashboard.html', {
        'private_tasks': private_tasks,
        'assigned_public_tasks': assigned_public_tasks,
        'available_public_tasks': available_public_tasks,
        'my_teams': my_teams,
        'other_teams': other_teams,
    })


# Liste des tâches
@login_required
def task_list(request):
    user = request.user

    all_tasks = Task.objects.filter(
        Q(is_private=True, author=user) |
        Q(is_private=False, author=user) |
        Q(is_private=False, assigned_users=user) |
        Q(is_private=False, assigned_teams__in=user.teams.all())
    ).distinct()

    todo_tasks = all_tasks.filter(status='todo', parent__isnull=True)
    done_tasks = all_tasks.filter(status='done', parent__isnull=True)

    return render(request, 'tasks/task_list.html', {
        'todo_tasks': todo_tasks,
        'done_tasks': done_tasks,
    })


# Création tâche
@login_required
def create_task(request):
    if request.method == 'POST':
        form = TaskForm(request.POST, user=request.user)
        if form.is_valid():
            task = form.save(commit=False)
            task.author = request.user
            task.save()
            form.save_m2m()
            return redirect('task_list')
    else:
        form = TaskForm(user=request.user)
    return render(request, 'tasks/task_form.html', {'form': form})


# Modifier tâche
@login_required
def update_task(request, task_id):
    task = get_object_or_404(Task, id=task_id)

    if task.is_private and task.author != request.user:
        return redirect('dashboard')

    if not task.is_private and not (task.author == request.user or request.user.is_staff):
        return redirect('dashboard')

    if request.method == 'POST':
        form = TaskForm(request.POST, instance=task, user=request.user)
        if form.is_valid():
            form.save()
            return redirect('task_list')
    else:
        form = TaskForm(instance=task, user=request.user)

    return render(request, 'tasks/task_form.html', {'form': form})


# Supprimer tâche
@login_required
def delete_task(request, task_id):
    task = get_object_or_404(Task, id=task_id, author=request.user)
    if request.method == 'POST':
        task.delete()
        return redirect('task_list')
    return render(request, 'tasks/task_confirm_delete.html', {'task': task})


# Rejoindre tâche
@login_required
def join_task(request, task_id):
    task = get_object_or_404(Task, id=task_id)
    if not task.is_private and request.user != task.author:
        task.assigned_users.add(request.user)
    return redirect('dashboard')


# Quitter tâche
@login_required
def quit_task(request, task_id):
    task = get_object_or_404(Task, id=task_id)
    if request.method == 'POST':
        if request.user in task.assigned_users.all():
            task.assigned_users.remove(request.user)
    return redirect('dashboard')


# Créer une équipe
@login_required
def create_team(request):
    if request.method == 'POST':
        form = TeamForm(request.POST)
        if form.is_valid():
            team = form.save(commit=False)
            team.creator = request.user
            team.save()
            form.save_m2m()

            for task in team.assigned_tasks.all():
                for member in team.members.all():
                    task.assigned_users.add(member)

            return redirect('dashboard')
    else:
        form = TeamForm()
    return render(request, 'tasks/team_form.html', {'form': form})


# Rejoindre une équipe
@login_required
def join_team(request, team_id):
    team = get_object_or_404(Team, id=team_id)
    if request.user not in team.members.all():
        team.members.add(request.user)
        for task in team.assigned_tasks.all():
            task.assigned_users.add(request.user)
    return redirect('dashboard')


# Quitter une équipe
@login_required
def quit_team(request, team_id):
    team = get_object_or_404(Team, id=team_id)
    if request.user in team.members.all():
        team.members.remove(request.user)
        for task in team.assigned_tasks.all():
            if request.user in task.assigned_users.all():
                task.assigned_users.remove(request.user)
    return redirect('dashboard')


# Supprimer une équipe
@login_required
def delete_team(request, team_id):
    team = get_object_or_404(Team, id=team_id)
    if request.user == team.creator or request.user.is_staff:
        team.delete()
        messages.success(request, "Équipe supprimée.")
    return redirect('dashboard')
