-- Corrige les alertes de sécurité liées à la vue de classement et aux fonctions
-- internes exposées par défaut.
CREATE OR REPLACE FUNCTION public.get_leaderboard_rows()
RETURNS TABLE (id uuid, username text, total_points bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT p.id, p.username, COALESCE(SUM(pl.delta), 0)::bigint AS total_points
    FROM public.profiles p
    LEFT JOIN public.points_log pl ON pl.student_id = p.id
    WHERE auth.uid() IS NOT NULL
      AND p.role = 'student'
    GROUP BY p.id, p.username
$$;
REVOKE ALL ON FUNCTION public.get_leaderboard_rows() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_leaderboard_rows() TO authenticated;

DROP VIEW IF EXISTS public.leaderboard;
CREATE VIEW public.leaderboard
WITH (security_invoker = true)
AS SELECT * FROM public.get_leaderboard_rows();
REVOKE ALL ON public.leaderboard FROM anon;
GRANT SELECT ON public.leaderboard TO authenticated;

ALTER FUNCTION public.storage_path_user_id(text)
    SET search_path = public, pg_catalog;

REVOKE ALL ON FUNCTION public.app_role() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_teacher_or_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_access_student(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_review_submission(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.storage_path_user_id(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.app_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_teacher_or_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_student(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_review_submission(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.storage_path_user_id(text) TO authenticated;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_profile_role() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prevent_role_escalation() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_class_member() FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
    IF to_regprocedure('public.my_role()') IS NOT NULL THEN
        ALTER FUNCTION public.my_role() SET search_path = public;
        REVOKE ALL ON FUNCTION public.my_role() FROM PUBLIC, anon;
        GRANT EXECUTE ON FUNCTION public.my_role() TO authenticated;
    END IF;
END
$$;