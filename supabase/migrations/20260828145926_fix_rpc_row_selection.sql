-- Corrige l'affectation des lignes composites dans les RPC transactionnelles.
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
    SELECT s.* INTO current_submission
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
    SELECT s.* INTO current_submission
    FROM public.submissions s
    WHERE s.id = p_submission_id
    FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Soumission introuvable'; END IF;
    IF NOT public.can_review_submission(p_submission_id) THEN
        RAISE EXCEPTION 'Droits insuffisants pour rejeter cette soumission';
    END IF;
    IF current_submission.status = 'rejected' THEN RETURN current_submission; END IF;
    IF current_submission.status <> 'submitted' THEN
        RAISE EXCEPTION 'Cette soumission a déjà été traitée';
    END IF;
    UPDATE public.submissions
    SET status = 'rejected',
        admin_feedback = COALESCE(p_feedback, ''),
        validated_at = now()
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
    SELECT t.* INTO task_row
    FROM public.tasks t
    WHERE t.id = p_task_id AND t.user_id = auth.uid()
    FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Devoir hifz introuvable ou non autorisé'; END IF;
    IF p_from_ayah IS NULL OR p_to_ayah IS NULL OR p_from_ayah < 1
       OR p_to_ayah < p_from_ayah OR p_to_ayah > 10000 THEN
        RAISE EXCEPTION 'Plage de versets invalide';
    END IF;
    IF jsonb_typeof(COALESCE(p_completed_ayahs, '[]'::jsonb)) <> 'array' THEN
        RAISE EXCEPTION 'Liste de versets invalide';
    END IF;

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
        SELECT s.* INTO submission_row
        FROM public.submissions s
        WHERE s.task_id = p_task_id
          AND s.student_id = auth.uid()
          AND s.type = 'hifz'
          AND s.status = 'approved'
        LIMIT 1;
    ELSE
        INSERT INTO public.points_log (student_id, delta, reason, submission_id)
        VALUES (auth.uid(), safe_points, 'Exercice hifz complété', submission_row.id)
        ON CONFLICT (submission_id) WHERE submission_id IS NOT NULL DO NOTHING;
    END IF;
    RETURN submission_row;
END
$$;