-- QuranReview — socle Supabase sécurisé
-- Cette migration est idempotente et peut être rejouée après une sauvegarde.
-- Les rôles sont lus depuis profiles, jamais depuis user_metadata ou le navigateur.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username text NOT NULL,
    first_name text NOT NULL DEFAULT '',
    last_name text NOT NULL DEFAULT '',
    role text NOT NULL DEFAULT 'student',
    is_superuser boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name text NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name text NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'student';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_superuser boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
UPDATE public.profiles SET role = 'student' WHERE role IS NULL OR role NOT IN ('student', 'teacher', 'admin');
UPDATE public.profiles SET username = COALESCE(NULLIF(username, ''), id::text) WHERE username IS NULL OR username = '';
ALTER TABLE public.profiles ALTER COLUMN username SET NOT NULL;

CREATE TABLE IF NOT EXISTS public.classes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.class_members (
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (class_id, student_id)
);

CREATE TABLE IF NOT EXISTS public.tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text NOT NULL DEFAULT '',
    type text NOT NULL DEFAULT 'hifz',
    points integer NOT NULL DEFAULT 0,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    due_date date,
    status text NOT NULL DEFAULT 'pending',
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assigned_by uuid;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS due_date date;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS points integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.submissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    audio_url text,
    type text NOT NULL DEFAULT 'tasmi',
    status text NOT NULL DEFAULT 'submitted',
    awarded_points integer,
    admin_feedback text,
    submitted_at timestamptz NOT NULL DEFAULT now(),
    validated_at timestamptz
);

ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS audio_url text;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'tasmi';
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'submitted';
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS awarded_points integer;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS admin_feedback text;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS submitted_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS validated_at timestamptz;

CREATE TABLE IF NOT EXISTS public.points_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    delta integer NOT NULL,
    reason text NOT NULL,
    submission_id uuid REFERENCES public.submissions(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.points_log ADD COLUMN IF NOT EXISTS submission_id uuid;
ALTER TABLE public.points_log ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type text NOT NULL,
    title text NOT NULL,
    body text NOT NULL DEFAULT '',
    url text NOT NULL DEFAULT '/',
    read boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.push_subscriptions ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'tasks_user_id_fkey'
    ) THEN
        ALTER TABLE public.tasks
            ADD CONSTRAINT tasks_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE NOT VALID;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'tasks_assigned_by_fkey'
    ) THEN
        ALTER TABLE public.tasks
            ADD CONSTRAINT tasks_assigned_by_fkey
            FOREIGN KEY (assigned_by) REFERENCES public.profiles(id) ON DELETE SET NULL NOT VALID;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'submissions_task_id_fkey'
    ) THEN
        ALTER TABLE public.submissions
            ADD CONSTRAINT submissions_task_id_fkey
            FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE NOT VALID;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'submissions_student_id_fkey'
    ) THEN
        ALTER TABLE public.submissions
            ADD CONSTRAINT submissions_student_id_fkey
            FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE NOT VALID;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'points_log_student_id_fkey'
    ) THEN
        ALTER TABLE public.points_log
            ADD CONSTRAINT points_log_student_id_fkey
            FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE NOT VALID;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'points_log_submission_id_fkey'
    ) THEN
        ALTER TABLE public.points_log
            ADD CONSTRAINT points_log_submission_id_fkey
            FOREIGN KEY (submission_id) REFERENCES public.submissions(id) ON DELETE SET NULL NOT VALID;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_valid'
    ) THEN
        ALTER TABLE public.profiles
            ADD CONSTRAINT profiles_role_valid
            CHECK (role IN ('student', 'teacher', 'admin')) NOT VALID;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'tasks_points_valid'
    ) THEN
        ALTER TABLE public.tasks
            ADD CONSTRAINT tasks_points_valid CHECK (points >= 0 AND points <= 1000) NOT VALID;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'submissions_status_valid'
    ) THEN
        ALTER TABLE public.submissions
            ADD CONSTRAINT submissions_status_valid
            CHECK (status IN ('pending', 'submitted', 'approved', 'rejected')) NOT VALID;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'submissions_points_valid'
    ) THEN
        ALTER TABLE public.submissions
            ADD CONSTRAINT submissions_points_valid
            CHECK (awarded_points IS NULL OR (awarded_points >= 0 AND awarded_points <= 1000)) NOT VALID;
    END IF;
END
$$;

-- Une seule attribution liée à une validation, même en cas de double clic/concurrence.
CREATE UNIQUE INDEX IF NOT EXISTS uq_points_log_submission
    ON public.points_log (submission_id)
    WHERE submission_id IS NOT NULL;

-- Un devoir hifz est consommé une seule fois par élève.
CREATE UNIQUE INDEX IF NOT EXISTS uq_hifz_submission_per_task
    ON public.submissions (task_id, student_id)
    WHERE type = 'hifz' AND status = 'approved';

CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON public.submissions (student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_task_id ON public.submissions (task_id);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON public.submissions (submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks (user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_by ON public.tasks (assigned_by);
CREATE INDEX IF NOT EXISTS idx_points_log_student_id ON public.points_log (student_id);
CREATE INDEX IF NOT EXISTS idx_class_members_class_id ON public.class_members (class_id);
CREATE INDEX IF NOT EXISTS idx_class_members_student_id ON public.class_members (student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications (user_id, read, created_at DESC);

-- Ces fonctions SECURITY DEFINER sont les seuls helpers de décision de rôle.
CREATE OR REPLACE FUNCTION public.app_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT CASE WHEN COALESCE(is_superuser, false) THEN 'admin' ELSE role END
    FROM public.profiles
    WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$ SELECT COALESCE(public.app_role() = 'admin', false) $$;

CREATE OR REPLACE FUNCTION public.is_teacher_or_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$ SELECT COALESCE(public.app_role() IN ('teacher', 'admin'), false) $$;

CREATE OR REPLACE FUNCTION public.can_access_student(p_student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        auth.uid() = p_student_id
        OR public.is_admin()
        OR EXISTS (
            SELECT 1
            FROM public.classes c
            JOIN public.class_members cm ON cm.class_id = c.id
            WHERE c.teacher_id = auth.uid()
              AND cm.student_id = p_student_id
        )
$$;

CREATE OR REPLACE FUNCTION public.can_review_submission(p_submission_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.is_admin()
        OR (
            public.app_role() = 'teacher'
            AND EXISTS (
                SELECT 1
                FROM public.submissions s
                JOIN public.tasks t ON t.id = s.task_id
                WHERE s.id = p_submission_id
                  AND t.assigned_by = auth.uid()
                  AND public.can_access_student(s.student_id)
            )
        )
$$;

-- Les inscriptions déterminent les élèves autorisés d'un enseignant.
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF OLD.role IS DISTINCT FROM NEW.role
       AND NOT (public.is_admin() OR auth.role() = 'service_role') THEN
        RAISE EXCEPTION 'Seul un administrateur peut modifier un rôle';
    END IF;
    IF OLD.is_superuser IS DISTINCT FROM NEW.is_superuser
       AND NOT (public.is_admin() OR auth.role() = 'service_role') THEN
        RAISE EXCEPTION 'Seul un administrateur peut modifier ce privilège';
    END IF;
    RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS protect_profile_role_trigger ON public.profiles;
CREATE TRIGGER protect_profile_role_trigger
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role();

-- Les inscriptions ne peuvent être administrées que par le professeur de la classe
-- ou un administrateur, et ne peuvent viser qu'un profil étudiant.
CREATE OR REPLACE FUNCTION public.validate_class_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    member_role text;
BEGIN
    SELECT role INTO member_role FROM public.profiles WHERE id = NEW.student_id;
    IF member_role IS DISTINCT FROM 'student' THEN
        RAISE EXCEPTION 'Seuls les profils étudiant peuvent rejoindre une classe';
    END IF;
    RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS validate_class_member_trigger ON public.class_members;
CREATE TRIGGER validate_class_member_trigger
    BEFORE INSERT OR UPDATE ON public.class_members
    FOR EACH ROW EXECUTE FUNCTION public.validate_class_member();

-- Tout nouveau compte commence étudiant. Un rôle reçu dans user_metadata n'est
-- jamais une élévation de privilège.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    requested_username text;
BEGIN
    requested_username := COALESCE(
        NULLIF(NEW.raw_user_meta_data ->> 'username', ''),
        split_part(NEW.email, '@', 1),
        NEW.id::text
    );
    INSERT INTO public.profiles (id, username, first_name, last_name, role)
    VALUES (
        NEW.id,
        requested_username,
        COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
        COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
        'student'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS : aucune policy permissive publique. Les requêtes anon ne voient rien.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Les privilèges SQL ne remplacent pas la RLS : ils garantissent néanmoins
-- qu'un client anonyme ne peut pas atteindre les tables, même si une policy
-- future est ajoutée par erreur.
REVOKE ALL ON TABLE
    public.profiles,
    public.classes,
    public.class_members,
    public.tasks,
    public.submissions,
    public.points_log,
    public.notifications,
    public.push_subscriptions
FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
    public.profiles,
    public.classes,
    public.class_members,
    public.tasks,
    public.submissions,
    public.points_log,
    public.notifications,
    public.push_subscriptions
TO authenticated;

DROP POLICY IF EXISTS profiles_select ON public.profiles;
DROP POLICY IF EXISTS profiles_update ON public.profiles;
CREATE POLICY profiles_select ON public.profiles FOR SELECT TO authenticated
    USING (id = auth.uid() OR public.is_admin() OR public.can_access_student(id));
CREATE POLICY profiles_update ON public.profiles FOR UPDATE TO authenticated
    USING (id = auth.uid() OR public.is_admin())
    WITH CHECK (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS classes_select ON public.classes;
DROP POLICY IF EXISTS classes_insert ON public.classes;
DROP POLICY IF EXISTS classes_update ON public.classes;
DROP POLICY IF EXISTS classes_delete ON public.classes;
CREATE POLICY classes_select ON public.classes FOR SELECT TO authenticated
    USING (public.is_admin() OR teacher_id = auth.uid());
CREATE POLICY classes_insert ON public.classes FOR INSERT TO authenticated
    WITH CHECK (public.is_admin() OR (public.app_role() = 'teacher' AND teacher_id = auth.uid()));
CREATE POLICY classes_update ON public.classes FOR UPDATE TO authenticated
    USING (public.is_admin() OR teacher_id = auth.uid())
    WITH CHECK (public.is_admin() OR teacher_id = auth.uid());
CREATE POLICY classes_delete ON public.classes FOR DELETE TO authenticated
    USING (public.is_admin() OR teacher_id = auth.uid());

DROP POLICY IF EXISTS class_members_select ON public.class_members;
DROP POLICY IF EXISTS class_members_insert ON public.class_members;
DROP POLICY IF EXISTS class_members_delete ON public.class_members;
CREATE POLICY class_members_select ON public.class_members FOR SELECT TO authenticated
    USING (
        public.is_admin()
        OR student_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_id AND c.teacher_id = auth.uid())
    );
CREATE POLICY class_members_insert ON public.class_members FOR INSERT TO authenticated
    WITH CHECK (
        public.is_admin()
        OR EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_id AND c.teacher_id = auth.uid())
    );
CREATE POLICY class_members_delete ON public.class_members FOR DELETE TO authenticated
    USING (
        public.is_admin()
        OR EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_id AND c.teacher_id = auth.uid())
    );

DROP POLICY IF EXISTS tasks_select ON public.tasks;
DROP POLICY IF EXISTS tasks_select_own ON public.tasks;
DROP POLICY IF EXISTS tasks_insert ON public.tasks;
DROP POLICY IF EXISTS tasks_update ON public.tasks;
DROP POLICY IF EXISTS tasks_delete ON public.tasks;
CREATE POLICY tasks_select ON public.tasks FOR SELECT TO authenticated
    USING (public.is_admin() OR user_id = auth.uid() OR assigned_by = auth.uid() OR public.can_access_student(user_id));
CREATE POLICY tasks_insert ON public.tasks FOR INSERT TO authenticated
    WITH CHECK (
        public.is_admin()
        OR (
            public.app_role() = 'teacher'
            AND assigned_by = auth.uid()
            AND public.can_access_student(user_id)
        )
    );
CREATE POLICY tasks_update ON public.tasks FOR UPDATE TO authenticated
    USING (public.is_admin() OR (assigned_by = auth.uid() AND public.can_access_student(user_id)))
    WITH CHECK (public.is_admin() OR (assigned_by = auth.uid() AND public.can_access_student(user_id)));
CREATE POLICY tasks_delete ON public.tasks FOR DELETE TO authenticated
    USING (public.is_admin() OR assigned_by = auth.uid());

DROP POLICY IF EXISTS submissions_select ON public.submissions;
DROP POLICY IF EXISTS submissions_insert ON public.submissions;
DROP POLICY IF EXISTS submissions_update ON public.submissions;
DROP POLICY IF EXISTS submissions_delete ON public.submissions;
CREATE POLICY submissions_select ON public.submissions FOR SELECT TO authenticated
    USING (student_id = auth.uid() OR public.can_review_submission(id));
CREATE POLICY submissions_insert ON public.submissions FOR INSERT TO authenticated
    WITH CHECK (
        student_id = auth.uid()
        AND status = 'submitted'
        AND awarded_points IS NULL
        AND validated_at IS NULL
        AND EXISTS (
            SELECT 1 FROM public.tasks t
            WHERE t.id = task_id AND t.user_id = auth.uid()
        )
    );
-- Les validations passent exclusivement par approve_submission/reject_submission.
CREATE POLICY submissions_update ON public.submissions FOR UPDATE TO authenticated
    USING (false) WITH CHECK (false);
CREATE POLICY submissions_delete ON public.submissions FOR DELETE TO authenticated
    USING (false);

DROP POLICY IF EXISTS points_select ON public.points_log;
DROP POLICY IF EXISTS points_insert ON public.points_log;
DROP POLICY IF EXISTS points_update ON public.points_log;
DROP POLICY IF EXISTS points_delete ON public.points_log;
CREATE POLICY points_select ON public.points_log FOR SELECT TO authenticated
    USING (student_id = auth.uid() OR public.can_access_student(student_id) OR public.is_admin());
CREATE POLICY points_insert ON public.points_log FOR INSERT TO authenticated USING (false) WITH CHECK (false);
CREATE POLICY points_update ON public.points_log FOR UPDATE TO authenticated USING (false) WITH CHECK (false);
CREATE POLICY points_delete ON public.points_log FOR DELETE TO authenticated USING (false);

DROP POLICY IF EXISTS notifications_select ON public.notifications;
DROP POLICY IF EXISTS notifications_insert ON public.notifications;
DROP POLICY IF EXISTS notifications_update ON public.notifications;
CREATE POLICY notifications_select ON public.notifications FOR SELECT TO authenticated
    USING (user_id = auth.uid());
CREATE POLICY notifications_insert ON public.notifications FOR INSERT TO authenticated
    WITH CHECK (
        public.is_admin()
        OR user_id = auth.uid()
        OR (
            public.app_role() = 'teacher'
            AND public.can_access_student(user_id)
        )
        OR EXISTS (
            SELECT 1
            FROM public.tasks t
            WHERE t.user_id = auth.uid()
              AND t.assigned_by = user_id
        )
    );
CREATE POLICY notifications_update ON public.notifications FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS push_subscriptions_own ON public.push_subscriptions;
DROP POLICY IF EXISTS own_subscription ON public.push_subscriptions;
DROP POLICY IF EXISTS own ON public.push_subscriptions;
CREATE POLICY push_subscriptions_own ON public.push_subscriptions
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Vue de projection : elle n'expose que le classement, jamais les profils complets.
DROP VIEW IF EXISTS public.leaderboard;
CREATE VIEW public.leaderboard AS
SELECT p.id, p.username, COALESCE(SUM(pl.delta), 0)::bigint AS total_points
FROM public.profiles p
LEFT JOIN public.points_log pl ON pl.student_id = p.id
WHERE p.role = 'student'
GROUP BY p.id, p.username
ORDER BY total_points DESC;
REVOKE ALL ON public.leaderboard FROM anon;
GRANT SELECT ON public.leaderboard TO authenticated;

-- Les écritures de points et de statut sont atomiques, vérifient le rôle et
-- utilisent submission_id comme clé d'idempotence.
CREATE OR REPLACE FUNCTION public.approve_submission(
    p_submission_id uuid,
    p_points integer,
    p_feedback text DEFAULT ''
)
RETURNS public.submissions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_submission public.submissions;
    updated_submission public.submissions;
BEGIN
    SELECT s INTO current_submission
    FROM public.submissions s
    WHERE s.id = p_submission_id
    FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Soumission introuvable'; END IF;
    IF NOT public.can_review_submission(p_submission_id) THEN
        RAISE EXCEPTION 'Droits insuffisants pour valider cette soumission';
    END IF;
    IF p_points IS NULL OR p_points < 0 OR p_points > 10 THEN
        RAISE EXCEPTION 'Nombre de points invalide';
    END IF;
    IF current_submission.status = 'approved' THEN
        RETURN current_submission;
    END IF;
    IF current_submission.status <> 'submitted' THEN
        RAISE EXCEPTION 'Cette soumission a déjà été traitée';
    END IF;

    UPDATE public.submissions
    SET status = 'approved',
        awarded_points = p_points,
        admin_feedback = COALESCE(p_feedback, ''),
        validated_at = now()
    WHERE id = p_submission_id
    RETURNING * INTO updated_submission;

    INSERT INTO public.points_log (student_id, delta, reason, submission_id)
    VALUES (current_submission.student_id, p_points, 'Soumission approuvée', p_submission_id)
    ON CONFLICT (submission_id) WHERE submission_id IS NOT NULL DO NOTHING;
    RETURN updated_submission;
END
$$;

CREATE OR REPLACE FUNCTION public.reject_submission(
    p_submission_id uuid,
    p_feedback text DEFAULT ''
)
RETURNS public.submissions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_submission public.submissions;
BEGIN
    SELECT s INTO current_submission FROM public.submissions s
    WHERE s.id = p_submission_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Soumission introuvable'; END IF;
    IF NOT public.can_review_submission(p_submission_id) THEN
        RAISE EXCEPTION 'Droits insuffisants pour rejeter cette soumission';
    END IF;
    IF current_submission.status = 'rejected' THEN RETURN current_submission; END IF;
    IF current_submission.status <> 'submitted' THEN
        RAISE EXCEPTION 'Cette soumission a déjà été traitée';
    END IF;
    UPDATE public.submissions
    SET status = 'rejected', admin_feedback = COALESCE(p_feedback, ''), validated_at = now()
    WHERE id = p_submission_id
    RETURNING * INTO current_submission;
    RETURN current_submission;
END
$$;

CREATE OR REPLACE FUNCTION public.record_hifz_submission(
    p_task_id uuid,
    p_score integer,
    p_surah_name text,
    p_from_ayah integer,
    p_to_ayah integer,
    p_completed_ayahs jsonb DEFAULT '[]'::jsonb
)
RETURNS public.submissions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    task_row public.tasks;
    submission_row public.submissions;
    safe_points integer;
    detail_text text;
BEGIN
    SELECT t INTO task_row FROM public.tasks t
    WHERE t.id = p_task_id AND t.user_id = auth.uid() FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Devoir hifz introuvable ou non autorisé'; END IF;
    IF p_from_ayah IS NULL OR p_to_ayah IS NULL OR p_from_ayah < 1
       OR p_to_ayah < p_from_ayah OR p_to_ayah > 10000 THEN
        RAISE EXCEPTION 'Plage de versets invalide';
    END IF;
    IF jsonb_typeof(COALESCE(p_completed_ayahs, '[]'::jsonb)) <> 'array' THEN
        RAISE EXCEPTION 'Liste de versets invalide';
    END IF;

    -- Le navigateur peut fournir un score, mais ne peut jamais dépasser le
    -- plafond attribué par l'enseignant. La validation et le crédit sont serveur.
    safe_points := LEAST(GREATEST(COALESCE(p_score, 0), 0), GREATEST(task_row.points, 0));
    detail_text := format(
        '%s — الآيات %s-%s — مكتمل: %s',
        COALESCE(p_surah_name, ''), p_from_ayah, p_to_ayah,
        COALESCE(p_completed_ayahs, '[]'::jsonb)::text
    );

    INSERT INTO public.submissions (
        task_id, student_id, audio_url, type, status, awarded_points,
        admin_feedback, submitted_at, validated_at
    )
    VALUES (
        p_task_id, auth.uid(), NULL, 'hifz', 'approved', safe_points,
        detail_text, now(), now()
    )
    ON CONFLICT (task_id, student_id) WHERE type = 'hifz' AND status = 'approved'
    DO NOTHING
    RETURNING * INTO submission_row;

    IF submission_row.id IS NULL THEN
        SELECT s INTO submission_row FROM public.submissions s
        WHERE s.task_id = p_task_id AND s.student_id = auth.uid()
          AND s.type = 'hifz' AND s.status = 'approved'
        LIMIT 1;
    ELSE
        INSERT INTO public.points_log (student_id, delta, reason, submission_id)
        VALUES (auth.uid(), safe_points, 'Exercice hifz complété', submission_row.id)
        ON CONFLICT (submission_id) WHERE submission_id IS NOT NULL DO NOTHING;
    END IF;
    RETURN submission_row;
END
$$;

REVOKE ALL ON FUNCTION public.approve_submission(uuid, integer, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reject_submission(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.record_hifz_submission(uuid, integer, text, integer, integer, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_submission(uuid, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_submission(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_hifz_submission(uuid, integer, text, integer, integer, jsonb) TO authenticated;

-- Bucket privé et policies Storage alignées sur les mêmes autorisations.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'audio-submissions', 'audio-submissions', false, 10485760,
    ARRAY['audio/webm', 'audio/mp3', 'audio/wav', 'audio/m4a']::text[]
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 10485760,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE OR REPLACE FUNCTION public.storage_path_user_id(path text)
RETURNS uuid
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    RETURN split_part(path, '/', 1)::uuid;
EXCEPTION WHEN invalid_text_representation THEN
    RETURN NULL;
END
$$;

DROP POLICY IF EXISTS audio_upload ON storage.objects;
DROP POLICY IF EXISTS audio_read ON storage.objects;
DROP POLICY IF EXISTS audio_delete ON storage.objects;
DROP POLICY IF EXISTS audio_upload_auth ON storage.objects;
DROP POLICY IF EXISTS audio_read_auth ON storage.objects;
DROP POLICY IF EXISTS audio_upload_authenticated ON storage.objects;
DROP POLICY IF EXISTS audio_read_authorized ON storage.objects;
DROP POLICY IF EXISTS audio_delete_authorized ON storage.objects;
CREATE POLICY audio_upload_authenticated ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'audio-submissions'
        AND public.storage_path_user_id(name) = auth.uid()
    );
CREATE POLICY audio_read_authorized ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'audio-submissions'
        AND public.can_access_student(public.storage_path_user_id(name))
    );
CREATE POLICY audio_delete_authorized ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'audio-submissions'
        AND (public.storage_path_user_id(name) = auth.uid() OR public.is_admin())
    );