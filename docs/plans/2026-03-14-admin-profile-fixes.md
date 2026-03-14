# Admin Profile Fixes — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Corriger le bug Task.status vs Submission.status dans le profil étudiant admin, ajouter classe/prof, et ajouter boutons éditer/supprimer.

**Architecture:** 2 fichiers modifiés — backend `api/views.py` (AdminUserProfileView) et frontend `src/pages/AdminPage.js`. Pas de nouveau endpoint nécessaire (PUT/DELETE déjà existants dans `auth/urls.py`).

**Tech Stack:** Django DRF (backend), Vanilla JS ES modules (frontend), Docker (rebuild requis)

---

## Contexte et cause racine

`Task.STATUS_CHOICES` = pending, in_progress, completed, cancelled
`Submission.STATUS_CHOICES` = submitted, approved, rejected
→ Ces deux statuts sont **indépendants**. Quand un élève soumet, `Submission.status` change mais `Task.status` reste `pending`. Le frontend regroupe par `t.status` → toutes les tâches apparaissent en "لم تُنجز".

**Fix:** `AdminUserProfileView` calcule un `effective_status` pour chaque tâche en cherchant la soumission associée.

---

### Task 1 : Fix backend — `effective_status` + classe/prof

**Fichier :** `backend/api/views.py` — `AdminUserProfileView.get()` (ligne 716+)

**Changements :**

1. Ajouter `.prefetch_related('submissions')` au queryset des tâches
2. Pour chaque tâche, calculer `effective_status` :
   - Si soumission existe et status='approved' → 'approved'
   - Si soumission existe et status='rejected' → 'rejected'
   - Si soumission existe et status='submitted' → 'submitted'
   - Pas de soumission → 'pending'
3. Retourner `effective_status` à la place de `t.status` dans `tasks`
4. Ajouter bloc `classe_info` : chercher groupes `Classe_*_Prof_*` de l'utilisateur → parser nom de classe + trouver le prof du groupe

**Code backend Task 1 :**
```python
# tasks avec effective_status
tasks_qs = Task.objects.filter(user=user).select_related('assigned_by').prefetch_related('submissions')
task_list = []
for t in tasks_qs[:30]:
    sub = t.submissions.filter(student=user).first()
    if sub:
        eff = sub.status  # 'submitted', 'approved', 'rejected'
    else:
        eff = 'pending'
    task_list.append({
        'id': t.id,
        'title': t.title,
        'status': eff,
        'points': getattr(t, 'points', 0) or 0,
        'teacher': t.assigned_by.username if t.assigned_by else None,
    })

# classe + prof
classe_info = None
student_groups = user.groups.filter(name__startswith='Classe_')
if student_groups.exists():
    group = student_groups.first()
    parts = group.name.split('_Prof_')
    classe_name = parts[0].replace('Classe_', '', 1) if len(parts) >= 2 else group.name
    teacher = User.objects.filter(groups=group, role='teacher').first()
    teacher_name = None
    if teacher:
        fn = teacher.first_name if teacher.first_name and teacher.first_name.lower() != 'nan' else ''
        ln = teacher.last_name if teacher.last_name and teacher.last_name.lower() != 'nan' else ''
        teacher_name = f"{fn} {ln}".strip() or teacher.username
    classe_info = {
        'name': classe_name,
        'teacher': teacher_name,
        'teacher_username': teacher.username if teacher else None,
    }
```

---

### Task 2 : Fix frontend — modal étudiant complet

**Fichier :** `frontend/src/pages/AdminPage.js`

**Changements dans `openUserProfile()` :**

1. **Ajouter classe/prof** dans la grille de stats (après email/date) :
   ```html
   <div>Classe: ${u.classe_info?.name || '—'}</div>
   <div>Prof: ${u.classe_info?.teacher || '—'}</div>
   ```

2. **Bouton Éditer** dans le header modal → affiche formulaire inline :
   - Champs : first_name, last_name, role (select)
   - Appelle `PUT /api/auth/admin/users/<id>/update/`
   - Après succès : recharge la liste + referme l'éditeur

3. **Bouton Supprimer** en bas du modal :
   - `confirm()` avant d'appeler `DELETE /api/auth/admin/users/<id>/delete/`
   - Après succès : ferme le modal + recharge la liste

4. **Exposer** `window._adminSaveEdit` et `window._adminDelete` dans `init()`

---

### Task 3 : Rebuild Docker

```bash
cd eloquent-haibt && docker compose up --build -d
```

Vérifier : ouvrir profil étudiant → voir classe/prof, tâches correctement groupées, boutons éditer/supprimer.
