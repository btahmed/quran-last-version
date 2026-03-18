# Cache + Skeleton Loading Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Éliminer la perception de lenteur sur HomePage, MyTasksPage et TeacherPage via un cache mémoire TTL + skeleton loading animé.

**Architecture:** Un module `apiCache.js` centralisé stocke les réponses API en `Map` avec timestamp. Chaque page affiche un skeleton HTML immédiatement au render, puis consomme le cache (si valide) ou fetch → set cache. Après toute mutation (créer tâche, approuver soumission), le cache est invalidé.

**Tech Stack:** ES Modules natifs, CSS `@keyframes shimmer`, aucune lib externe.

---

## Task 1 — Créer `apiCache.js`

**Files:**
- Create: `frontend/src/core/apiCache.js`

**Step 1 : Écrire le module**

```js
// frontend/src/core/apiCache.js
// Cache mémoire TTL pour les réponses API — évite les re-fetch sur navigation

const _store = new Map(); // clé → { data, ts }

const TTL = {
    'tasks':                60_000,
    'my-submissions':       60_000,
    'points':               30_000,
    'my-students':         120_000,
    'pending-submissions':  30_000,
    'submissions':          30_000,
    'admin-overview':       60_000,
};

export const apiCache = {
    get(key) {
        const entry = _store.get(key);
        if (!entry) return null;
        const ttl = TTL[key] ?? 60_000;
        if (Date.now() - entry.ts > ttl) {
            _store.delete(key);
            return null;
        }
        return entry.data;
    },

    set(key, data) {
        _store.set(key, { data, ts: Date.now() });
    },

    invalidate(...keys) {
        keys.forEach(k => _store.delete(k));
    },

    clear() {
        _store.clear();
    },
};
```

**Step 2 : Vérifier manuellement** — importer dans la console navigateur et tester `apiCache.set('test', [1,2,3])` / `apiCache.get('test')`.

**Step 3 : Commit**
```bash
git add frontend/src/core/apiCache.js
git commit -m "feat: ajoute module apiCache TTL pour réponses API"
```

---

## Task 2 — CSS Skeleton global

**Files:**
- Modify: `frontend/index.html` (ajouter style inline dans `<head>`)

**Step 1 : Ajouter l'animation shimmer dans le `<head>` de `frontend/index.html`**

Trouver la balise `</style>` ou `</head>` et insérer avant :
```html
<style>
/* ── Skeleton loading ── */
.skeleton {
    background: linear-gradient(90deg,
        var(--glass-bg, rgba(255,255,255,0.05)) 25%,
        rgba(255,255,255,0.12) 50%,
        var(--glass-bg, rgba(255,255,255,0.05)) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
    border-radius: var(--radius-lg, 12px);
    min-height: 1em;
}
@keyframes shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}
.skeleton-card {
    height: 72px;
    margin-bottom: 10px;
}
.skeleton-line {
    height: 16px;
    margin-bottom: 8px;
    width: 100%;
}
.skeleton-line.short { width: 60%; }
</style>
```

**Step 2 : Vérifier** — ouvrir http://localhost:3456, inspecter `<head>`, confirmer le style est présent.

**Step 3 : Commit**
```bash
git add frontend/index.html
git commit -m "feat: ajoute CSS skeleton shimmer global"
```

---

## Task 3 — MyTasksPage : skeleton + cache

**Files:**
- Modify: `frontend/src/pages/MyTasksPage.js`

**Step 1 : Ajouter l'import apiCache en haut du fichier**

Après les imports existants, ajouter :
```js
import { apiCache } from '../core/apiCache.js';
```

**Step 2 : Remplacer le contenu du `<div id="student-tasks-list">` dans `render()`**

Trouver `<div id="student-tasks-list">` dans le HTML du `render()`. Remplacer tout son contenu par les skeletons :
```html
<div id="student-tasks-list">
    <div class="skeleton skeleton-card"></div>
    <div class="skeleton skeleton-card"></div>
    <div class="skeleton skeleton-card"></div>
</div>
```

Faire la même chose pour `<div id="student-submissions-list">` :
```html
<div id="student-submissions-list">
    <div class="skeleton skeleton-card"></div>
    <div class="skeleton skeleton-card"></div>
</div>
```

**Step 3 : Modifier `loadStudentDashboard()` pour utiliser le cache**

Remplacer le bloc `try { const [tasksRes, subsRes, pointsRes] = await Promise.all(...)` par :

```js
export async function loadStudentDashboard() {
    const token = localStorage.getItem(config.apiTokenKey);
    if (!token) { showAuthModal(); return; }
    if (state.user && state.user.role === 'teacher') {
        window.QuranReview && window.QuranReview.navigateTo('teacher');
        return;
    }
    const headers = { Authorization: `Bearer ${token}` };

    if (state.user) {
        const el = document.getElementById('student-welcome');
        if (el) el.textContent = `مرحباً ${state.user.first_name || state.user.username}`;
    }

    // Tenter le cache avant le fetch
    const cached = {
        tasks:       apiCache.get('tasks'),
        submissions: apiCache.get('my-submissions'),
        points:      apiCache.get('points'),
    };

    if (cached.tasks && cached.submissions && cached.points) {
        // Rendu immédiat depuis le cache
        _applyStudentData(cached.tasks, cached.submissions, cached.points);
        // Rafraîchir en arrière-plan silencieusement
        _fetchAndCacheStudent(headers);
        return;
    }

    // Pas de cache → fetch normal
    await _fetchAndCacheStudent(headers);
}

async function _fetchAndCacheStudent(headers) {
    try {
        const [tasksRes, subsRes, pointsRes] = await Promise.all([
            fetch(`${config.apiBaseUrl}/api/tasks/`, { headers }),
            fetch(`${config.apiBaseUrl}/api/my-submissions/`, { headers }),
            fetch(`${config.apiBaseUrl}/api/points/`, { headers }),
        ]);

        const tasksRaw   = tasksRes.ok   ? await tasksRes.json()   : [];
        const subsRaw    = subsRes.ok    ? await subsRes.json()    : [];
        const pointsData = pointsRes.ok  ? await pointsRes.json()  : { total_points: 0, logs: [] };

        const tasks       = Array.isArray(tasksRaw) ? tasksRaw : (tasksRaw.results ?? []);
        const submissions = Array.isArray(subsRaw)  ? subsRaw  : (subsRaw.results  ?? []);

        // Mettre en cache
        apiCache.set('tasks', tasks);
        apiCache.set('my-submissions', submissions);
        apiCache.set('points', pointsData);

        _applyStudentData(tasks, submissions, pointsData);
    } catch (error) {
        console.error('Failed to load student dashboard:', error);
        showNotification('خطأ في تحميل البيانات', 'error');
        const tasksList = document.getElementById('student-tasks-list');
        if (tasksList) tasksList.innerHTML = '<p class="empty-state" style="color:#ef4444;">❌ تعذّر تحميل المهام — تحقق من اتصالك</p>';
    }
}
```

**Step 4 : Extraire `_applyStudentData(tasks, submissions, pointsData)`**

Prendre tout le bloc de rendu (qui va de `const subByTask = {}` jusqu'à la fin du try actuel, avant le catch) et le déplacer dans une nouvelle fonction `_applyStudentData(tasks, submissions, pointsData)` en bas du fichier.

**Step 5 : Invalider le cache après soumission audio**

Dans `AudioRecordModal.js` (ou là où `submitRecording` est défini), après une soumission réussie, ajouter :
```js
import { apiCache } from '../core/apiCache.js';
// ... après le fetch de soumission réussie :
apiCache.invalidate('my-submissions', 'tasks', 'points');
```

**Step 6 : Vérifier** — naviguer vers "إرسال", observer skeleton 3-4s première visite, puis revenir et re-naviguer → rendu immédiat.

**Step 7 : Commit**
```bash
git add frontend/src/pages/MyTasksPage.js frontend/src/components/AudioRecordModal.js
git commit -m "feat: cache TTL + skeleton sur MyTasksPage"
```

---

## Task 4 — TeacherPage : skeleton + cache

**Files:**
- Modify: `frontend/src/pages/TeacherPage.js`

**Step 1 : Ajouter l'import**
```js
import { apiCache } from '../core/apiCache.js';
```

**Step 2 : Remplacer les placeholders dans `render()` par des skeletons**

Trouver `<div id="teacher-tasks-list">` → remplacer son contenu :
```html
<div id="teacher-tasks-list">
    <div class="skeleton skeleton-card"></div>
    <div class="skeleton skeleton-card"></div>
</div>
```

Trouver `<div id="teacher-assigned-tasks-list">` → remplacer son contenu :
```html
<div id="teacher-assigned-tasks-list">
    <div class="skeleton skeleton-card"></div>
    <div class="skeleton skeleton-card"></div>
</div>
```

Trouver `<div id="teacher-students-list">` → remplacer son contenu :
```html
<div id="teacher-students-list">
    <div class="skeleton skeleton-line"></div>
    <div class="skeleton skeleton-line"></div>
    <div class="skeleton skeleton-line short"></div>
    <div class="skeleton skeleton-line"></div>
    <div class="skeleton skeleton-line short"></div>
</div>
```

**Step 3 : Modifier `loadTeacherDashboard()` pour utiliser le cache**

Même pattern que MyTasksPage :

```js
async function loadTeacherDashboard() {
    const token = localStorage.getItem(config.apiTokenKey);
    if (!token) { showAuthModal(); return; }
    if (state.user && state.user.role !== 'teacher' && !state.user.is_staff) {
        window.QuranReview && window.QuranReview.navigateTo('soumettre');
        return;
    }
    const headers = { Authorization: `Bearer ${token}` };

    if (state.user) {
        const el = document.getElementById('teacher-welcome');
        if (el) el.textContent = `مرحباً ${state.user.first_name || state.user.username}`;
    }

    if (state.user && state.user.is_superuser) {
        loadAdminUsersList();
    }

    const cached = {
        students: apiCache.get('my-students'),
        pending:  apiCache.get('pending-submissions'),
        tasks:    apiCache.get('tasks'),
    };

    if (cached.students && cached.pending && cached.tasks) {
        _applyTeacherData(cached.students, cached.pending, cached.tasks);
        _fetchAndCacheTeacher(headers); // refresh silencieux
        return;
    }

    showLoading();
    await _fetchAndCacheTeacher(headers);
    hideLoading();
}

async function _fetchAndCacheTeacher(headers) {
    try {
        const [studentsRes, pendingRes, tasksRes] = await Promise.all([
            fetch(`${config.apiBaseUrl}/api/my-students/`, { headers }),
            fetch(`${config.apiBaseUrl}/api/pending-submissions/`, { headers }),
            fetch(`${config.apiBaseUrl}/api/tasks/`, { headers }),
        ]);

        const studentsRaw = studentsRes.ok ? await studentsRes.json() : [];
        const pendingRaw  = pendingRes.ok  ? await pendingRes.json()  : [];
        const tasksRaw    = tasksRes.ok    ? await tasksRes.json()    : [];

        const students = Array.isArray(studentsRaw) ? studentsRaw : (studentsRaw.results ?? []);
        const pending  = Array.isArray(pendingRaw)  ? pendingRaw  : (pendingRaw.results  ?? []);
        const tasks    = Array.isArray(tasksRaw)    ? tasksRaw    : (tasksRaw.results    ?? []);

        apiCache.set('my-students', students);
        apiCache.set('pending-submissions', pending);
        apiCache.set('tasks', tasks);

        _applyTeacherData(students, pending, tasks);
    } catch (err) {
        Logger.error('TEACHER', 'loadTeacherDashboard error', err);
        hideLoading();
    }
}
```

**Step 4 : Extraire `_applyTeacherData(students, pending, tasks)`**

Prendre tout le bloc de rendu existant (stats, pendingList, assignedList, studentsList) et le déplacer dans `_applyTeacherData`.

**Step 5 : Invalider le cache après mutations**

Dans `handleCreateTask` (TeacherPage) après succès :
```js
apiCache.invalidate('tasks', 'my-students');
```

Dans `handleApprove` / `handleReject` après succès :
```js
apiCache.invalidate('pending-submissions', 'my-submissions');
```

**Step 6 : Vérifier** — naviguer vers "التسليمات", observer skeleton → données. Re-naviguer → instantané.

**Step 7 : Commit**
```bash
git add frontend/src/pages/TeacherPage.js
git commit -m "feat: cache TTL + skeleton sur TeacherPage"
```

---

## Task 5 — HomePage : skeleton + cache

**Files:**
- Modify: `frontend/src/pages/HomePage.js`

**Step 1 : Ajouter l'import**
```js
import { apiCache } from '../core/apiCache.js';
```

**Step 2 : Remplacer les placeholders dans `render()` par des skeletons**

Trouver `<div id="student-tasks-list">` dans HomePage → remplacer :
```html
<div id="student-tasks-list">
    <div class="skeleton skeleton-card"></div>
    <div class="skeleton skeleton-card"></div>
</div>
```

Trouver `<div id="teacher-pending-list">` (ou équivalent teacher) → remplacer :
```html
<div id="teacher-pending-list">
    <div class="skeleton skeleton-card"></div>
    <div class="skeleton skeleton-card"></div>
</div>
```

Pour les stats admin (`a-users`, `a-teachers`, etc.) → dans render(), mettre `—` comme valeur initiale (déjà le cas).

**Step 3 : Modifier `initDashboard()` pour utiliser le cache**

```js
async function initDashboard(role) {
    const token = localStorage.getItem(config.apiTokenKey);
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    if (role === 'student') {
        const cached = apiCache.get('tasks');
        if (cached) {
            renderStudentTasks(cached);
            // Refresh silencieux
            fetch(`${config.apiBaseUrl}/api/tasks/`, { headers })
                .then(r => r.ok ? r.json() : null)
                .then(raw => {
                    if (!raw) return;
                    const list = Array.isArray(raw) ? raw : (raw.results || []);
                    apiCache.set('tasks', list);
                    renderStudentTasks(list);
                }).catch(() => {});
            return;
        }
        const res = await fetch(`${config.apiBaseUrl}/api/tasks/`, { headers }).catch(() => null);
        if (res?.ok) {
            const raw = await res.json();
            const list = Array.isArray(raw) ? raw : (raw.results || []);
            apiCache.set('tasks', list);
            renderStudentTasks(list);
        } else {
            renderStudentTasks([]);
        }
    }

    if (role === 'teacher') {
        const cached = apiCache.get('submissions');
        if (cached) {
            const pending = cached.filter(s => s.status === 'pending' || !s.grade);
            renderTeacherSubmissions(pending);
            const el = document.getElementById('t-pending');
            if (el) el.textContent = pending.length;
            return;
        }
        const res = await fetch(`${config.apiBaseUrl}/api/submissions/`, { headers }).catch(() => null);
        if (res?.ok) {
            const data = await res.json();
            const subs = Array.isArray(data) ? data : (data.results || []);
            apiCache.set('submissions', subs);
            const pending = subs.filter(s => s.status === 'pending' || !s.grade);
            renderTeacherSubmissions(pending);
            const el = document.getElementById('t-pending');
            if (el) el.textContent = pending.length;
        } else {
            renderTeacherSubmissions([]);
        }
    }

    if (role === 'admin') {
        const cached = apiCache.get('admin-overview');
        if (cached) {
            setText('a-users',    '+' + (cached.total_users    || 0));
            setText('a-teachers',        cached.total_teachers || 0);
            setText('a-students',        cached.total_students || 0);
            setText('a-today',           cached.submissions_today || 0);
            return;
        }
        const res = await fetch(`${config.apiBaseUrl}/api/admin/overview/`, { headers }).catch(() => null);
        if (res?.ok) {
            const data = await res.json();
            apiCache.set('admin-overview', data);
            setText('a-users',    '+' + (data.total_users    || 0));
            setText('a-teachers',        data.total_teachers || 0);
            setText('a-students',        data.total_students || 0);
            setText('a-today',           data.submissions_today || 0);
        } else {
            ['a-users', 'a-teachers', 'a-students', 'a-today'].forEach(id => setText(id, '—'));
        }
    }
}
```

**Step 4 : Vider le cache au logout**

Dans `main.js`, dans `window.QuranReview.logout` :
```js
logout: async () => {
    await logout();
    apiCache.clear();       // ← ajouter cette ligne
    buildNav('visitor');
},
```

**Step 5 : Vérifier** — naviguer home → skeleton → données. Aller sur une autre page → revenir home → instantané.

**Step 6 : Commit**
```bash
git add frontend/src/pages/HomePage.js frontend/src/main.js
git commit -m "feat: cache TTL + skeleton sur HomePage + clear cache au logout"
```

---

## Task 6 — Push final

```bash
git push origin main-local:main
```

Vérifier sur https://quranreview-frontend.vercel.app que :
- [ ] Première visite → skeleton visible puis données
- [ ] Navigation retour → rendu instantané
- [ ] Logout → cache vidé (re-login recharge depuis API)
- [ ] Créer tâche (teacher) → re-fetch tasks au prochain accès
