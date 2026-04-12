# Prompts Agents — Migration Supabase Full-Stack
> QuranReview — Remplacement Django par Supabase + frontend modulaire

---

## ÉTAPE 0 — TOI (avant de donner quoi que ce soit)

Crée un projet Supabase sur supabase.com, puis récupère :
- `SUPABASE_URL` → Settings > API > Project URL
- `SUPABASE_ANON_KEY` → Settings > API > anon/public key

Ces deux valeurs seront utilisées dans tous les prompts ci-dessous.

---

---

# PROMPT 1 — SUPABASE (SQL Editor)

> Colle ce SQL directement dans Supabase > SQL Editor > New query

```sql
-- ═══════════════════════════════════════════════════════════
-- QuranReview — Schéma Supabase complet
-- ═══════════════════════════════════════════════════════════

-- Extension UUID
create extension if not exists "uuid-ossp";

-- ─── PROFILES (extension de auth.users) ───────────────────
create table public.profiles (
  id           uuid references auth.users(id) on delete cascade primary key,
  username     text unique not null,
  role         text not null default 'student' check (role in ('student','teacher','admin')),
  phone        text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ─── CLASSES (groupes de révision) ────────────────────────
create table public.classes (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  time_slot   text check (time_slot in ('8h45','10h45')),
  teacher_id  uuid references public.profiles(id) on delete set null,
  max_students int default 50,
  description text default '',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ─── CLASS_MEMBERS (élèves dans une classe) ───────────────
create table public.class_members (
  id         uuid primary key default uuid_generate_v4(),
  class_id   uuid references public.classes(id) on delete cascade,
  student_id uuid references public.profiles(id) on delete cascade,
  joined_at  timestamptz default now(),
  unique(class_id, student_id)
);

-- ─── STUDENT_PROFILES (infos pédagogiques) ────────────────
create table public.student_profiles (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references public.profiles(id) on delete cascade unique,
  level        text default '',
  status       text default 'active' check (status in ('active','inactive','graduated')),
  notes        text default '',
  objectives   text default '',
  restrictions text default '',
  special_case jsonb default '{}',
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ─── TASKS ────────────────────────────────────────────────
create table public.tasks (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references public.profiles(id) on delete cascade not null,
  assigned_by  uuid references public.profiles(id) on delete set null,
  title        text not null,
  description  text default '',
  type         text default 'hifz' check (type in ('hifz','muraja','tilawa')),
  priority     text default 'medium' check (priority in ('high','medium','low')),
  status       text default 'pending' check (status in ('pending','in_progress','completed','cancelled')),
  surah        int,
  start_ayah   int,
  end_ayah     int,
  due_date     date,
  points       int default 0,
  completed_at timestamptz,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ─── SUBMISSIONS ──────────────────────────────────────────
create table public.submissions (
  id             uuid primary key default uuid_generate_v4(),
  task_id        uuid references public.tasks(id) on delete cascade not null,
  student_id     uuid references public.profiles(id) on delete cascade not null,
  audio_url      text not null,
  status         text default 'submitted' check (status in ('submitted','approved','rejected')),
  admin_feedback text default '',
  submitted_at   timestamptz default now(),
  validated_at   timestamptz,
  validated_by   uuid references public.profiles(id) on delete set null,
  awarded_points int,
  unique(task_id, student_id)
);

-- ─── POINTS_LOG ───────────────────────────────────────────
create table public.points_log (
  id            uuid primary key default uuid_generate_v4(),
  student_id    uuid references public.profiles(id) on delete cascade not null,
  delta         int not null,
  reason        text not null,
  submission_id uuid references public.submissions(id) on delete set null,
  created_at    timestamptz default now()
);

-- ─── PROGRESS ─────────────────────────────────────────────
create table public.progress (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references public.profiles(id) on delete cascade not null,
  surah        int not null,
  ayah         int not null,
  type         text default 'hifz' check (type in ('hifz','muraja')),
  accuracy     int default 0,
  duration     int default 0,
  completed_at timestamptz default now()
);

-- ─── VUE : total points par étudiant ──────────────────────
create or replace view public.leaderboard as
  select
    p.id,
    p.username,
    coalesce(sum(pl.delta), 0) as total_points
  from public.profiles p
  left join public.points_log pl on pl.student_id = p.id
  where p.role = 'student'
  group by p.id, p.username
  order by total_points desc;

-- ─── TRIGGER : auto-créer profile après signup ────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'student')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ═══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════

alter table public.profiles        enable row level security;
alter table public.classes         enable row level security;
alter table public.class_members   enable row level security;
alter table public.student_profiles enable row level security;
alter table public.tasks           enable row level security;
alter table public.submissions     enable row level security;
alter table public.points_log      enable row level security;
alter table public.progress        enable row level security;

-- Helper : role de l'utilisateur connecté
create or replace function public.my_role()
returns text language sql security definer stable as $$
  select role from public.profiles where id = auth.uid()
$$;

-- ── PROFILES policies ─────────────────────────────────────
create policy "Voir son propre profil" on public.profiles
  for select using (id = auth.uid());

create policy "Admin voit tous les profils" on public.profiles
  for select using (public.my_role() = 'admin');

create policy "Prof voit ses élèves" on public.profiles
  for select using (
    public.my_role() = 'teacher' and
    exists (
      select 1 from public.class_members cm
      join public.classes c on c.id = cm.class_id
      where cm.student_id = profiles.id and c.teacher_id = auth.uid()
    )
  );

create policy "Mettre à jour son profil" on public.profiles
  for update using (id = auth.uid());

create policy "Admin modifie tous profils" on public.profiles
  for update using (public.my_role() = 'admin');

create policy "Admin crée profils" on public.profiles
  for insert with check (public.my_role() = 'admin');

create policy "Admin supprime profils" on public.profiles
  for delete using (public.my_role() = 'admin');

-- ── TASKS policies ────────────────────────────────────────
create policy "Étudiant voit ses tâches" on public.tasks
  for select using (user_id = auth.uid());

create policy "Prof voit tâches de ses élèves" on public.tasks
  for select using (
    public.my_role() = 'teacher' and
    exists (
      select 1 from public.class_members cm
      join public.classes c on c.id = cm.class_id
      where cm.student_id = tasks.user_id and c.teacher_id = auth.uid()
    )
  );

create policy "Admin voit toutes les tâches" on public.tasks
  for select using (public.my_role() = 'admin');

create policy "Prof crée des tâches" on public.tasks
  for insert with check (public.my_role() in ('teacher','admin'));

create policy "Admin supprime des tâches" on public.tasks
  for delete using (public.my_role() = 'admin');

create policy "Admin modifie des tâches" on public.tasks
  for update using (public.my_role() in ('teacher','admin'));

-- ── SUBMISSIONS policies ──────────────────────────────────
create policy "Étudiant voit ses soumissions" on public.submissions
  for select using (student_id = auth.uid());

create policy "Prof voit soumissions de ses élèves" on public.submissions
  for select using (
    public.my_role() = 'teacher' and
    exists (
      select 1 from public.class_members cm
      join public.classes c on c.id = cm.class_id
      where cm.student_id = submissions.student_id and c.teacher_id = auth.uid()
    )
  );

create policy "Admin voit toutes les soumissions" on public.submissions
  for select using (public.my_role() = 'admin');

create policy "Étudiant soumet" on public.submissions
  for insert with check (student_id = auth.uid() and public.my_role() = 'student');

create policy "Prof approuve/rejette" on public.submissions
  for update using (public.my_role() in ('teacher','admin'));

-- ── POINTS_LOG policies ───────────────────────────────────
create policy "Étudiant voit ses points" on public.points_log
  for select using (student_id = auth.uid());

create policy "Prof voit points de ses élèves" on public.points_log
  for select using (
    public.my_role() = 'teacher' and
    exists (
      select 1 from public.class_members cm
      join public.classes c on c.id = cm.class_id
      where cm.student_id = points_log.student_id and c.teacher_id = auth.uid()
    )
  );

create policy "Admin voit tous les points" on public.points_log
  for select using (public.my_role() = 'admin');

create policy "Seul admin/prof insère points" on public.points_log
  for insert with check (public.my_role() in ('teacher','admin'));

-- ── CLASSES policies ──────────────────────────────────────
create policy "Tous voient les classes" on public.classes
  for select using (true);

create policy "Admin gère les classes" on public.classes
  for all using (public.my_role() = 'admin');

-- ── CLASS_MEMBERS policies ────────────────────────────────
create policy "Voir membres de sa classe" on public.class_members
  for select using (
    student_id = auth.uid() or
    public.my_role() in ('teacher','admin')
  );

create policy "Admin gère les membres" on public.class_members
  for all using (public.my_role() = 'admin');

-- ── STORAGE : bucket audio ────────────────────────────────
-- À créer manuellement dans Supabase > Storage > New bucket
-- Nom : "audio-submissions"
-- Public : NON (privé)
-- Ensuite coller ce SQL pour les policies storage :

insert into storage.buckets (id, name, public) values ('audio-submissions', 'audio-submissions', false);

create policy "Étudiant upload son audio" on storage.objects
  for insert with check (
    bucket_id = 'audio-submissions' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Propriétaire et prof/admin téléchargent" on storage.objects
  for select using (
    bucket_id = 'audio-submissions' and (
      auth.uid()::text = (storage.foldername(name))[1] or
      public.my_role() in ('teacher','admin')
    )
  );
```

---

---

# PROMPT 2 — KIRO

> Ouvre Kiro, crée un nouveau projet vide, et colle ce prompt dans l'interface Agent/Spec

```
Tu vas créer le frontend modulaire de l'application QuranReview.
C'est une app de révision du Coran avec 3 rôles : étudiant, professeur, admin.

## Contexte
- Frontend : Vanilla JS (ES modules, pas de bundler, pas de framework)
- Backend : Supabase (auth + database + storage)
- Déploiement : Vercel (fichiers statiques)
- Le fichier `frontend/script.js` existant (5000 lignes monolithique) va être
  découpé en modules. Ne pas le modifier — s'en inspirer pour la logique métier.

## SDK à utiliser
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

## Configuration
```js
// frontend/config.js
const SUPABASE_URL = 'REMPLACE_PAR_TON_URL'
const SUPABASE_ANON_KEY = 'REMPLACE_PAR_TA_ANON_KEY'
```

## Structure à créer

```
frontend/
├── config.js           ← déjà décrit ci-dessus
├── supabase-client.js  ← client singleton
├── auth.js             ← module 1
├── tasks.js            ← module 2
├── submissions.js      ← module 3
├── admin.js            ← module 4
└── leaderboard.js      ← module 5
```

## Spec module par module

### supabase-client.js
```js
// Exporte un client Supabase singleton
// import { createClient } from '@supabase/supabase-js' (CDN global window.supabase)
// export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
```

### auth.js — Fonctions à implémenter
- `signIn(email, password)` → supabase.auth.signInWithPassword
- `signOut()` → supabase.auth.signOut
- `getSession()` → supabase.auth.getSession
- `getCurrentUser()` → retourne le profil complet depuis table `profiles`
- `onAuthStateChange(callback)` → supabase.auth.onAuthStateChange
- `createUser(email, password, username, role)` → admin only, signUp + insert profile

Contrat de retour pour toutes les fonctions :
```js
{ data, error }  // même convention que Supabase SDK
```

### tasks.js — Fonctions à implémenter
- `getMyTasks()` → tasks où user_id = auth.uid()
- `getStudentTasks(studentId)` → tasks d'un élève (prof/admin)
- `getAllTasks()` → toutes les tâches (admin)
- `createTask(payload)` → insert dans tasks
- `updateTask(id, payload)` → update tâche
- `deleteTask(id)` → delete tâche
- `deleteAllTasks()` → admin only, delete toutes les tâches

payload createTask : `{ user_id, title, description, type, priority, surah, start_ayah, end_ayah, due_date, points }`

### submissions.js — Fonctions à implémenter
- `getMySubmissions()` → submissions où student_id = auth.uid()
- `getPendingSubmissions()` → submissions status='submitted' (prof/admin)
- `uploadAudio(taskId, audioBlob)` → upload dans storage bucket 'audio-submissions', chemin : `{uid}/{taskId}/{uuid}.webm`, retourne l'URL signée
- `createSubmission(taskId, audioUrl)` → insert dans submissions
- `approveSubmission(submissionId, points, feedback)` → update status='approved', awarded_points, ajouter entrée dans points_log
- `rejectSubmission(submissionId, feedback)` → update status='rejected', admin_feedback

### admin.js — Fonctions à implémenter
- `getAllUsers()` → tous les profiles
- `updateUser(userId, payload)` → update profile (role, username, phone)
- `deleteUser(userId)` → delete profile (cascade supprime auth.users via trigger)
- `createTeacher(email, password, username)` → createUser avec role='teacher'
- `getStudentProgress(studentId)` → tasks + submissions + points_log de l'étudiant
- `getClasses()` → toutes les classes avec teacher et membres
- `assignStudentToClass(studentId, classId)` → insert class_members

### leaderboard.js — Fonctions à implémenter
- `getLeaderboard()` → select * from leaderboard (vue SQL)
- `getMyPoints()` → sum des delta dans points_log où student_id = auth.uid()

## Règles de code
- Chaque module exporte ses fonctions nommées (pas de default export)
- Gestion d'erreur : toujours retourner { data, error } — jamais throw
- Commentaires en français
- Pas de console.log en production (utiliser un flag DEBUG)
- Valider la taille audio < 10MB avant upload (formats : .webm, .mp3, .wav, .m4a)

## Livrable attendu
Les 6 fichiers JS créés, testables indépendamment en ouvrant la console navigateur.
Pas de modifications à index.html pour l'instant — c'est Windsurf qui s'en charge.
```

---

---

# PROMPT 3 — WINDSURF PRO

> Ouvre Windsurf, ouvre le projet `quran-last-version/frontend/`, et colle ce prompt dans Cascade

```
Je migre l'application QuranReview de Django vers Supabase full-stack.
Kiro a déjà créé les modules JS suivants dans frontend/ :
- supabase-client.js
- auth.js
- tasks.js
- submissions.js
- admin.js
- leaderboard.js

## Ta mission
Intégrer ces modules dans le frontend existant en remplaçant les anciens appels Django.

## Étape 1 — Analyser script.js
Lis `frontend/script.js` (5000 lignes). Identifie tous les appels `fetch()` vers l'API Django :
- Cherche le pattern : `fetch(\`${this.config.apiBaseUrl}/api/...`)`
- Il y en a 26 au total

## Étape 2 — Mettre à jour index.html
Dans `frontend/index.html`, remplacer le chargement de script.js :

AVANT (à supprimer) :
```html
<script src="script.js"></script>
```

APRÈS (à ajouter dans <head> ou avant </body>) :
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script type="module" src="config.js"></script>
<script type="module" src="supabase-client.js"></script>
<script type="module" src="auth.js"></script>
<script type="module" src="tasks.js"></script>
<script type="module" src="submissions.js"></script>
<script type="module" src="admin.js"></script>
<script type="module" src="leaderboard.js"></script>
<script type="module" src="app.js"></script>
```

## Étape 3 — Créer app.js
Extraire depuis `script.js` uniquement la logique UI/DOM (rendu, navigation, événements).
Créer `frontend/app.js` qui :
- Importe les fonctions des modules Supabase
- Remplace chaque `fetch('/api/auth/token/', ...)` par `auth.signIn(...)`
- Remplace chaque `fetch('/api/tasks/', ...)` par `tasks.getMyTasks()`
- etc. (table de correspondance ci-dessous)

## Table de correspondance fetch → Supabase

| Ancien fetch Django | Nouveau module Supabase |
|---------------------|------------------------|
| POST /api/auth/token/ | auth.signIn(email, password) |
| POST /api/auth/register/ | auth.createUser(email, pass, username, role) |
| GET /api/auth/me/ | auth.getCurrentUser() |
| POST /api/auth/token/refresh/ | géré automatiquement par supabase-js |
| GET /api/tasks/ | tasks.getMyTasks() |
| POST /api/tasks/create/ | tasks.createTask(payload) |
| DELETE /api/admin/tasks/delete-all/ | tasks.deleteAllTasks() |
| GET /api/my-submissions/ | submissions.getMySubmissions() |
| GET /api/pending-submissions/ | submissions.getPendingSubmissions() |
| POST /api/submissions/ | submissions.uploadAudio() puis submissions.createSubmission() |
| POST /api/submissions/:id/approve/ | submissions.approveSubmission(id, points, feedback) |
| POST /api/submissions/:id/reject/ | submissions.rejectSubmission(id, feedback) |
| GET /api/admin/users/ | admin.getAllUsers() |
| PUT /api/admin/users/:id/update/ | admin.updateUser(id, payload) |
| DELETE /api/admin/users/:id/delete/ | admin.deleteUser(id) |
| POST /api/admin/create-teacher/ | admin.createTeacher(email, pass, username) |
| GET /api/my-students/ | admin.getClasses() filtré par teacher |
| GET /api/students/:id/progress/ | admin.getStudentProgress(id) |
| GET /api/points/ | leaderboard.getMyPoints() |
| GET /api/leaderboard/ | leaderboard.getLeaderboard() |

## Étape 4 — Supprimer script.js
Une fois app.js fonctionnel et testé :
```bash
git rm frontend/script.js
```

## Règles
- Ne touche PAS à style.css ni index.html sauf la balise script
- Ne touche PAS aux modules créés par Kiro
- Garder la même logique UI (classes CSS, IDs, structure DOM identiques)
- Si un comportement n'est pas clair, laisse un commentaire TODO
- Commits séparés par étape (index.html, app.js, rm script.js)

## Test final
Ouvrir http://localhost:3456 (python -m http.server 3456 --directory frontend)
- Login avec un compte de test
- Vérifier que la navigation fonctionne selon le rôle
- Vérifier qu'une soumission audio peut être uploadée
```

---

## Ordre d'exécution

```
1. Toi → créer projet Supabase + récupérer URL et ANON_KEY
2. Toi → coller le SQL (Prompt 1) dans Supabase SQL Editor
3. Kiro → créer les 6 modules JS (Prompt 2)
4. Windsurf → intégrer les modules dans index.html + créer app.js (Prompt 3)
5. Claude Code (moi) → review final + CI/CD + merge dans main
```
