-- Retire les policies historiques qui resteraient actives en parallèle de la
-- matrice canonique créée par secure_foundation.
DO $$
DECLARE
    existing_policy record;
BEGIN
    FOR existing_policy IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN (
              'profiles', 'classes', 'class_members', 'tasks',
              'submissions', 'points_log', 'notifications', 'push_subscriptions'
          )
          AND policyname NOT IN (
              'profiles_select', 'profiles_update',
              'classes_select', 'classes_insert', 'classes_update', 'classes_delete',
              'class_members_select', 'class_members_insert', 'class_members_delete',
              'tasks_select', 'tasks_insert', 'tasks_update', 'tasks_delete',
              'submissions_select', 'submissions_insert', 'submissions_update', 'submissions_delete',
              'points_select', 'points_insert', 'points_update', 'points_delete',
              'notifications_select', 'notifications_insert', 'notifications_update',
              'push_subscriptions_own'
          )
    LOOP
        EXECUTE format(
            'DROP POLICY IF EXISTS %I ON %I.%I',
            existing_policy.policyname,
            existing_policy.schemaname,
            existing_policy.tablename
        );
    END LOOP;
END
$$;

DROP POLICY IF EXISTS audio_update ON storage.objects;