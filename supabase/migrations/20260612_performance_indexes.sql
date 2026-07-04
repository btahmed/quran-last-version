-- ============================================================
-- Migration T17 : Index de performance — QuranReview
-- À appliquer dans : Supabase Dashboard > SQL Editor
-- Date : 2026-06-12
-- ============================================================

-- ─── submissions ─────────────────────────────────────────────
-- Requêtes fréquentes : "mes soumissions" (student_id) et "soumissions d'une tâche" (task_id)
CREATE INDEX IF NOT EXISTS idx_submissions_student_id
    ON public.submissions (student_id);

CREATE INDEX IF NOT EXISTS idx_submissions_task_id
    ON public.submissions (task_id);

-- Tri par date dans l'historique
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at
    ON public.submissions (submitted_at DESC);

-- Filtre statut (pending / approved / rejected)
CREATE INDEX IF NOT EXISTS idx_submissions_status
    ON public.submissions (status);

-- ─── tasks ───────────────────────────────────────────────────
-- Dashboard enseignant : tâches par classe ou par user
CREATE INDEX IF NOT EXISTS idx_tasks_user_id
    ON public.tasks (user_id);

-- Tri par date limite (due_date)
CREATE INDEX IF NOT EXISTS idx_tasks_due_date
    ON public.tasks (due_date) WHERE due_date IS NOT NULL;

-- ─── points_log ──────────────────────────────────────────────
-- Leaderboard : total des points par étudiant
CREATE INDEX IF NOT EXISTS idx_points_log_student_id
    ON public.points_log (student_id);

-- ─── class_members ───────────────────────────────────────────
-- "Élèves d'une classe" (requête enseignant fréquente)
CREATE INDEX IF NOT EXISTS idx_class_members_class_id
    ON public.class_members (class_id);

CREATE INDEX IF NOT EXISTS idx_class_members_student_id
    ON public.class_members (student_id);

-- ─── profiles ────────────────────────────────────────────────
-- Filtre par rôle (admins, teachers, students)
CREATE INDEX IF NOT EXISTS idx_profiles_role
    ON public.profiles (role);

-- ─── VÉRIFICATION ────────────────────────────────────────────
SELECT
    schemaname,
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
