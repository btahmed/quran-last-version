-- Compteur public d'élèves actifs pour la landing page (visiteur anonyme).
-- La lecture directe de public.profiles est bloquée pour `anon` (RLS) — normal,
-- ce sont des données utilisateur. On expose donc uniquement un COUNT via une
-- fonction SECURITY DEFINER, sans jamais renvoyer de ligne ni de colonne.
CREATE OR REPLACE FUNCTION public.get_public_student_count()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COUNT(*)::bigint FROM public.profiles WHERE role = 'student'
$$;

REVOKE ALL ON FUNCTION public.get_public_student_count() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_student_count() TO anon, authenticated;
