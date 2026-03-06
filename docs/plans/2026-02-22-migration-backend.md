# Migration Backend — Ancien Django → Nouveau Backend

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Porter toutes les fonctionnalités de l'ancien Django (MYSITEE) vers le nouveau backend (`backend/`) pour connecter les 202 étudiants, les classes, les soumissions audio et le système de points à l'interface SPA.

**Architecture:** Le nouveau backend (`backend/`) garde sa structure en 2 apps (`authentication`, `api`) mais reçoit les modèles manquants (StudentProfile, GroupExtension, Submission, PointsLog) et toutes les vues avancées portées depuis `ancien django/`. Le frontend (index.html + script.js) pointe déjà sur `http://127.0.0.1:8000` — aucun changement frontend pour les phases 1-4.

**Tech Stack:** Django 6, DRF, SimpleJWT, SQLite (dev), Python 3.13

---

## Phase 1 — Fondation critique (app fonctionne immédiatement)

### Tâche 1 : Endpoint `/api/me/`

**Fichiers :**
- Modifier : `backend/authentication/views.py`
- Modifier : `backend/authentication/urls.py`

**Étape 1 — Ajouter MeView dans views.py**

Ajouter après `LogoutView` :

```python
class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)
```

**Étape 2 — Enregistrer l'URL dans urls.py**

```python
path('me/', MeView.as_view(), name='me'),
```

**Étape 3 — Vérifier**

```bash
cd backend && venv/Scripts/python manage.py check
# Expected: System check identified no issues
```

**Étape 4 — Tester dans le navigateur**

Recharger http://127.0.0.1:8090, se connecter avec AHMAD.
Console doit afficher : `[AUTH] Redirecting user role: admin` sans erreur 404.

**Étape 5 — Commit**

```bash
git add backend/authentication/views.py backend/authentication/urls.py
git commit -m "feat(auth): ajouter endpoint GET /api/me/"
```

---

### Tâche 2 : Endpoint admin `GET /api/auth/admin/users/`

**Fichiers :**
- Modifier : `backend/authentication/views.py`
- Modifier : `backend/authentication/urls.py`

**Étape 1 — Ajouter AdminUsersListView**

```python
class AdminUsersListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not (request.user.is_staff or request.user.role == 'admin'):
            return Response({'detail': 'Forbidden'}, status=403)
        users = User.objects.all().order_by('role', 'username')
        return Response(UserSerializer(users, many=True).data)
```

**Étape 2 — Ajouter AdminUserUpdateView**

```python
class AdminUserUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        if not (request.user.is_staff or request.user.role == 'admin'):
            return Response({'detail': 'Forbidden'}, status=403)
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'Not found'}, status=404)
        allowed = ['first_name', 'last_name', 'role', 'is_superuser']
        for field in allowed:
            if field in request.data:
                setattr(user, field, request.data[field])
        user.save()
        return Response(UserSerializer(user).data)
```

**Étape 3 — Ajouter AdminUserDeleteView**

```python
class AdminUserDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        if not (request.user.is_staff or request.user.role == 'admin'):
            return Response({'detail': 'Forbidden'}, status=403)
        if str(pk) == str(request.user.pk):
            return Response({'detail': 'Cannot delete yourself'}, status=400)
        try:
            user = User.objects.get(pk=pk)
            user.delete()
            return Response(status=204)
        except User.DoesNotExist:
            return Response({'detail': 'Not found'}, status=404)
```

**Étape 4 — Enregistrer les URLs**

```python
path('admin/users/', AdminUsersListView.as_view(), name='admin-users'),
path('admin/users/<int:pk>/update/', AdminUserUpdateView.as_view(), name='admin-user-update'),
path('admin/users/<int:pk>/delete/', AdminUserDeleteView.as_view(), name='admin-user-delete'),
```

**Étape 5 — Commit**

```bash
git add backend/authentication/views.py backend/authentication/urls.py
git commit -m "feat(auth): ajouter vues admin CRUD utilisateurs"
```

---

### Tâche 3 : Page Admin dans le frontend

**Fichiers :**
- Modifier : `index.html` (nav link + #admin-page)
- Modifier : `script.js` (updateAuthUI + renderPage + loadAdminDashboard)

**Étape 1 — Ajouter nav link admin dans index.html**

Après la ligne avec `nav-teacher-only` (ligne ~160) :

```html
<a href="#" class="nav-link nav-admin-only" data-page="admin" style="display: none;">⚙️ الإدارة</a>
```

**Étape 2 — Ajouter #admin-page dans index.html**

Après le bloc `#teacher-page` (après ligne ~938) :

```html
<!-- ADMIN PAGE -->
<div id="admin-page" class="page">
    <section class="section">
        <div class="container">
            <h2 class="section-title" style="text-align: center; margin-bottom: var(--space-8);">⚙️ لوحة الإدارة</h2>

            <!-- Stats globales -->
            <div class="grid grid-cols-4" style="margin-bottom: var(--space-8);">
                <div class="stat-card" style="text-align: center;">
                    <div class="stat-value" id="admin-total-users">0</div>
                    <p style="color: var(--color-text-secondary);">إجمالي المستخدمين</p>
                </div>
                <div class="stat-card" style="text-align: center;">
                    <div class="stat-value" id="admin-total-students">0</div>
                    <p style="color: var(--color-text-secondary);">الطلاب</p>
                </div>
                <div class="stat-card" style="text-align: center;">
                    <div class="stat-value" id="admin-total-teachers">0</div>
                    <p style="color: var(--color-text-secondary);">الأساتذة</p>
                </div>
                <div class="stat-card" style="text-align: center;">
                    <div class="stat-value" id="admin-total-admins">0</div>
                    <p style="color: var(--color-text-secondary);">المديرون</p>
                </div>
            </div>

            <!-- Liste utilisateurs -->
            <div class="glass-card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4);">
                    <h3 style="font-size: 1.125rem; font-weight: 600;">👥 إدارة المستخدمين</h3>
                    <button class="btn btn-primary btn-sm" onclick="QuranReview.refreshAdminUsers()">🔄 تحديث</button>
                </div>
                <div id="admin-users-list" style="overflow-x: auto;">
                    <p style="color: var(--color-text-secondary); text-align: center; padding: var(--space-6);">جارٍ التحميل...</p>
                </div>
            </div>
        </div>
    </section>
</div>
```

**Étape 3 — Fixer updateAuthUI() dans script.js**

Trouver la fonction `updateAuthUI` et remplacer la section de gestion des rôles par :

```javascript
const adminLinks = document.querySelectorAll('.nav-admin-only');
const isTeacher = this.state.user.role === 'teacher';
const isAdmin = this.state.user.role === 'admin' || this.state.user.is_superuser;

adminLinks.forEach(el => el.style.display = isAdmin ? 'inline-block' : 'none');
teacherLinks.forEach(el => el.style.display = isTeacher ? 'inline-block' : 'none');
studentLinks.forEach(el => el.style.display = (!isTeacher && !isAdmin) ? 'inline-block' : 'none');

const roleLabel = isAdmin ? '🛡️' : isTeacher ? '👨‍🏫' : '🎓';
if (usernameEl) {
    usernameEl.textContent = `${roleLabel} ${this.state.user.first_name || this.state.user.username}`;
}
```

**Étape 4 — Fixer redirect post-login dans performLogin()**

```javascript
if (this.state.user.role === 'admin' || this.state.user.is_superuser) {
    this.navigateTo('admin');
} else if (this.state.user.role === 'teacher') {
    this.navigateTo('teacher');
} else {
    this.navigateTo('mytasks');
}
```

**Étape 5 — Ajouter case 'admin' dans renderPage()**

```javascript
case 'admin': this.loadAdminDashboard(); break;
```

**Étape 6 — Ajouter loadAdminDashboard() et refreshAdminUsers()**

```javascript
async loadAdminDashboard() {
    const token = localStorage.getItem(this.config.apiTokenKey);
    try {
        const res = await fetch(`${this.config.apiBaseUrl}/api/auth/admin/users/`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Erreur chargement users');
        const users = await res.json();

        // Stats
        document.getElementById('admin-total-users').textContent = users.length;
        document.getElementById('admin-total-students').textContent = users.filter(u => u.role === 'student').length;
        document.getElementById('admin-total-teachers').textContent = users.filter(u => u.role === 'teacher').length;
        document.getElementById('admin-total-admins').textContent = users.filter(u => u.role === 'admin' || u.is_superuser).length;

        // Table
        const roleColors = { student: 'badge-primary', teacher: 'badge-success', admin: 'badge-warning' };
        const roleLabels = { student: 'طالب', teacher: 'معلم', admin: 'مدير' };
        const rows = users.map(u => `
            <div class="task-card" style="display:flex; align-items:center; gap:var(--space-3); padding:var(--space-3);">
                <div style="flex:1;">
                    <div style="font-weight:600;">${u.first_name || ''} ${u.last_name || ''} <span style="color:var(--color-text-secondary); font-size:0.85rem;">(${u.username})</span></div>
                    <div style="font-size:0.8rem; color:var(--color-text-secondary);">${u.email || ''}</div>
                </div>
                <span class="badge ${roleColors[u.role] || 'badge-primary'}">${roleLabels[u.role] || u.role}</span>
                ${u.is_superuser ? '<span class="badge badge-warning">Super</span>' : ''}
                <button class="btn btn-sm" onclick="QuranReview.openUserEditModal(${JSON.stringify(u).replace(/"/g, '&quot;')})">✏️</button>
                <button class="btn btn-sm" style="color:var(--color-error);" onclick="QuranReview.deleteUser(${u.id}, '${u.username}')">🗑️</button>
            </div>
        `).join('');
        document.getElementById('admin-users-list').innerHTML = rows || '<p style="text-align:center;padding:var(--space-4);">لا يوجد مستخدمون</p>';
    } catch (e) {
        this.showNotification('خطأ في تحميل المستخدمين: ' + e.message, 'error');
    }
},

refreshAdminUsers() { this.loadAdminDashboard(); },

async deleteUser(userId, username) {
    if (!confirm(`حذف المستخدم "${username}" ؟`)) return;
    const token = localStorage.getItem(this.config.apiTokenKey);
    try {
        const res = await fetch(`${this.config.apiBaseUrl}/api/auth/admin/users/${userId}/delete/`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok && res.status !== 204) throw new Error('Erreur suppression');
        this.showNotification('تم حذف المستخدم', 'success');
        this.loadAdminDashboard();
    } catch (e) {
        this.showNotification('خطأ: ' + e.message, 'error');
    }
},
```

**Étape 7 — Vérification preview**

Recharger http://127.0.0.1:8090, se connecter avec AHMAD.
Vérifier : page admin s'affiche avec stats et table des users.

**Étape 8 — Commit**

```bash
git add index.html script.js
git commit -m "feat(frontend): ajouter page admin avec gestion utilisateurs"
```

---

## Phase 2 — Modèles avancés (classes, profils, soumissions, points)

### Tâche 4 : Modèles StudentProfile, GroupExtension, UserGroupHistory, AuditLog

**Fichiers :**
- Modifier : `backend/api/models.py`

**Étape 1 — Ajouter les modèles**

Ajouter en bas de `backend/api/models.py` :

```python
class StudentProfile(models.Model):
    STATUS_CHOICES = [('active', 'Actif'), ('inactive', 'Inactif'), ('graduated', 'Diplômé')]
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='student_profile')
    level = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    notes = models.TextField(blank=True)
    objectives = models.TextField(blank=True)
    restrictions = models.TextField(blank=True)
    special_case = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        verbose_name = "Profil Étudiant"

class GroupExtension(models.Model):
    TIME_SLOT_CHOICES = [('8h45', '8h45'), ('10h45', '10h45')]
    group = models.OneToOneField('auth.Group', on_delete=models.CASCADE, related_name='extension')
    time_slot = models.CharField(max_length=10, choices=TIME_SLOT_CHOICES)
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='taught_groups')
    max_students = models.IntegerField(default=50)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class UserGroupHistory(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='group_history')
    old_group = models.ForeignKey('auth.Group', on_delete=models.SET_NULL, null=True, blank=True, related_name='old_members')
    new_group = models.ForeignKey('auth.Group', on_delete=models.SET_NULL, null=True, blank=True, related_name='new_members')
    changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='group_changes_made')
    changed_at = models.DateTimeField(auto_now_add=True)
    reason = models.TextField(blank=True)
    class Meta:
        ordering = ['-changed_at']

class AuditLog(models.Model):
    ACTION_CHOICES = [
        ('create_group', 'Création groupe'), ('rename_group', 'Renommage groupe'),
        ('delete_group', 'Suppression groupe'), ('assign_student', 'Assignation élève'),
        ('update_profile', 'Modification profil'), ('assign_teacher', 'Assignation professeur'),
    ]
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    admin_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='admin_actions')
    target_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='received_actions')
    target_group = models.ForeignKey('auth.Group', on_delete=models.SET_NULL, null=True, blank=True)
    before_data = models.JSONField(null=True, blank=True)
    after_data = models.JSONField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    class Meta:
        ordering = ['-timestamp']
```

**Étape 2 — Ajouter settings.AUTH_USER_MODEL import**

S'assurer que le fichier a bien :
```python
from django.conf import settings
```

**Étape 3 — Créer et appliquer les migrations**

```bash
cd backend
venv/Scripts/python manage.py makemigrations api
venv/Scripts/python manage.py migrate
# Expected: migrations créées et appliquées sans erreur
```

**Étape 4 — Commit**

```bash
git add backend/api/models.py backend/api/migrations/
git commit -m "feat(api): ajouter modèles StudentProfile, GroupExtension, AuditLog"
```

---

### Tâche 5 : Modèle Submission + vues soumissions

**Fichiers :**
- Modifier : `backend/api/models.py`
- Modifier : `backend/api/views.py`
- Modifier : `backend/api/urls.py`

**Étape 1 — Ajouter modèle Submission**

```python
import uuid, os
from django.core.exceptions import ValidationError

def submission_audio_path(instance, filename):
    unique_filename = f"{uuid.uuid4().hex}_{filename}"
    return f"submissions/{instance.task_id}/{instance.student_id}/{unique_filename}"

def validate_audio_file(file):
    ext = os.path.splitext(file.name)[1].lower()
    if ext not in ['.webm', '.mp3', '.wav', '.m4a']:
        raise ValidationError(f"Extension '{ext}' non autorisée.")
    if file.size > 10 * 1024 * 1024:
        raise ValidationError("Fichier trop volumineux (max 10 MB).")

class Submission(models.Model):
    STATUS_CHOICES = [('submitted', 'Soumis'), ('approved', 'Approuvé'), ('rejected', 'Rejeté')]
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='submissions')
    audio_file = models.FileField(upload_to=submission_audio_path, validators=[validate_audio_file])
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='submitted')
    admin_feedback = models.TextField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    validated_at = models.DateTimeField(null=True, blank=True)
    validated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='validated_submissions')
    awarded_points = models.PositiveIntegerField(null=True, blank=True)
    class Meta:
        constraints = [models.UniqueConstraint(fields=['task', 'student'], name='unique_submission_per_task_student')]
        ordering = ['-submitted_at']
```

**Étape 2 — Ajouter modèle PointsLog**

```python
from django.db.models import Sum

class PointsLog(models.Model):
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='points_logs')
    delta = models.IntegerField()
    reason = models.CharField(max_length=255)
    submission = models.ForeignKey(Submission, on_delete=models.SET_NULL, null=True, blank=True, related_name='points_logs')
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    class Meta:
        ordering = ['-created_at']

    @classmethod
    def get_total_points(cls, student):
        result = cls.objects.filter(student=student).aggregate(total=Sum('delta'))
        return result['total'] or 0
```

**Étape 3 — Créer migrations**

```bash
venv/Scripts/python manage.py makemigrations api
venv/Scripts/python manage.py migrate
```

**Étape 4 — Ajouter vues soumissions dans api/views.py**

```python
from django.utils import timezone
from rest_framework.parsers import MultiPartParser, FormParser

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
            return Response({'detail': 'Tâche introuvable'}, status=404)
        sub, created = Submission.objects.get_or_create(task=task, student=request.user)
        if not created and sub.status != 'submitted':
            return Response({'detail': 'Soumission déjà traitée'}, status=400)
        sub.audio_file = audio
        sub.status = 'submitted'
        sub.save()
        return Response({'id': sub.id, 'status': sub.status}, status=201 if created else 200)

class MySubmissionsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        subs = Submission.objects.filter(student=request.user).select_related('task')
        data = [{'id': s.id, 'task_title': s.task.title, 'status': s.status, 'submitted_at': s.submitted_at} for s in subs]
        return Response(data)

class PendingSubmissionsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        if request.user.role not in ['teacher', 'admin'] and not request.user.is_superuser:
            return Response({'detail': 'Forbidden'}, status=403)
        subs = Submission.objects.filter(status='submitted').select_related('task', 'student')
        data = [{'id': s.id, 'student': s.student.username, 'task': s.task.title, 'submitted_at': s.submitted_at} for s in subs]
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
        points = sub.task.points if hasattr(sub.task, 'points') else 0
        sub.awarded_points = points
        sub.save()
        if points:
            PointsLog.objects.create(student=sub.student, delta=points, reason=f"Tâche approuvée: {sub.task.title}", submission=sub)
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

class PointsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        total = PointsLog.get_total_points(request.user)
        logs = PointsLog.objects.filter(student=request.user)[:20]
        data = {'total': total, 'logs': [{'delta': l.delta, 'reason': l.reason, 'created_at': l.created_at} for l in logs]}
        return Response(data)
```

**Étape 5 — Enregistrer les URLs dans api/urls.py**

```python
path('submissions/', SubmissionCreateView.as_view(), name='submission-create'),
path('my-submissions/', MySubmissionsView.as_view(), name='my-submissions'),
path('pending-submissions/', PendingSubmissionsView.as_view(), name='pending-submissions'),
path('submissions/<int:submission_id>/approve/', SubmissionApproveView.as_view(), name='submission-approve'),
path('submissions/<int:submission_id>/reject/', SubmissionRejectView.as_view(), name='submission-reject'),
path('points/', PointsView.as_view(), name='points'),
```

**Étape 6 — Ajouter MEDIA_URL dans settings.py**

```python
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
```

**Étape 7 — Commit**

```bash
git add backend/api/models.py backend/api/views.py backend/api/urls.py backend/api/migrations/ backend/quranreview/settings.py
git commit -m "feat(api): ajouter Submission, PointsLog, vues soumissions audio"
```

---

## Phase 3 — Gestion des classes et étudiants (Teacher Dashboard)

### Tâche 6 : MyStudentsView + Middleware classes

**Fichiers :**
- Créer : `backend/api/middleware.py`
- Modifier : `backend/api/views.py`
- Modifier : `backend/api/urls.py`
- Modifier : `backend/quranreview/settings.py`

**Étape 1 — Créer backend/api/middleware.py**

Porter le `ClassePermissionMiddleware` de `ancien django/MYSITEE/MYSITEE/mysite/middleware.py` en adaptant les imports pour le nouveau backend :

```python
from authentication.models import User
from api.models import Task
```

**Étape 2 — Ajouter dans MIDDLEWARE dans settings.py**

```python
'api.middleware.ClassePermissionMiddleware',
```

**Étape 3 — Ajouter MyStudentsView dans api/views.py**

```python
class MyStudentsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        if request.user.role not in ['teacher', 'admin'] and not request.user.is_superuser:
            return Response({'detail': 'Forbidden'}, status=403)
        if request.user.is_superuser or request.user.role == 'admin':
            students = User.objects.filter(role='student')
        else:
            # Prof: étudiants dans ses groupes
            teacher_groups = request.user.groups.all()
            students = User.objects.filter(role='student', groups__in=teacher_groups).distinct()
        from authentication.serializers import UserSerializer
        return Response(UserSerializer(students, many=True).data)
```

**Étape 4 — Enregistrer URL**

```python
path('my-students/', MyStudentsView.as_view(), name='my-students'),
```

**Étape 5 — Commit**

```bash
git add backend/api/middleware.py backend/api/views.py backend/api/urls.py backend/quranreview/settings.py
git commit -m "feat(api): MyStudentsView + ClassePermissionMiddleware"
```

---

## Phase 4 — Migration des données (202 étudiants)

### Tâche 7 : Exporter les étudiants de l'ancien Django et importer dans le nouveau

**Fichiers :**
- Lire : `import_tools/RAPPORT_FINAL_202_ETUDIANTS.md`
- Utiliser : `import_tools/api_client.py`

**Étape 1 — Vérifier la base ancienne**

```bash
cd "ancien django/MYSITEE/MYSITEE"
# Activer le venv de l'ancien projet s'il existe, sinon utiliser pip install django
python manage.py shell -c "
from tasks.models import User
students = User.objects.filter(role='student')
teachers = User.objects.filter(role='teacher')
print(f'Étudiants: {students.count()} | Profs: {teachers.count()}')
"
```

**Étape 2 — Exporter les données vers JSON**

```bash
python manage.py dumpdata tasks.User --natural-foreign --indent 2 > /tmp/users_export.json
```

**Étape 3 — Adapter et importer via script**

Créer un script `import_tools/migrate_to_new_backend.py` qui :
1. Lit le JSON exporté
2. Pour chaque user, fait POST vers `/api/auth/register/` ou crée directement via shell
3. Assigne le bon role

```bash
cd backend
venv/Scripts/python manage.py shell -c "
import json
from authentication.models import User

with open('users_export.json') as f:
    data = json.load(f)

for entry in data:
    fields = entry['fields']
    if User.objects.filter(username=fields['username']).exists():
        print(f'Skip: {fields[\"username\"]}')
        continue
    u = User.objects.create_user(
        username=fields['username'],
        email=fields.get('email', ''),
        first_name=fields.get('first_name', ''),
        last_name=fields.get('last_name', ''),
        role=fields.get('role', 'student'),
        password='changeme123'  # mot de passe temporaire
    )
    print(f'Créé: {u.username} ({u.role})')
print('Import terminé')
"
```

**Étape 4 — Vérifier**

```bash
venv/Scripts/python manage.py shell -c "
from authentication.models import User
print(f'Total: {User.objects.count()}')
print(f'Students: {User.objects.filter(role=\"student\").count()}')
print(f'Teachers: {User.objects.filter(role=\"teacher\").count()}')
"
```

**Étape 5 — Commit**

```bash
git add import_tools/migrate_to_new_backend.py
git commit -m "feat(data): script migration 202 étudiants vers nouveau backend"
```

---

## Vérification finale

Après toutes les phases :

1. **Connexion admin** → page `⚙️ الإدارة` avec la liste des 202+ users
2. **Connexion teacher** → page `📋 لوحة المعلم` avec ses étudiants chargés
3. **Connexion student** → page `📝 مهامي` avec ses tâches et points
4. **Console** : zéro erreur 404 sur les endpoints API

```bash
git log --oneline -10
```
