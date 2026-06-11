-- ============================================================
-- RESET DONNÉES DE TEST — QuranReview
-- À exécuter dans : Supabase Dashboard > SQL Editor
--
-- CE SCRIPT SUPPRIME : tâches, soumissions, points, classes
-- CE SCRIPT CONSERVE : comptes utilisateurs (profiles + auth.users)
--
-- ⚠️  VÉRIFIER LE RÉSUMÉ EN BAS avant de lancer les DELETE
-- ============================================================

-- ─── 1. RÉSUMÉ DE CE QUI VA ÊTRE SUPPRIMÉ ────────────────────
SELECT
    (SELECT COUNT(*) FROM public.tasks)        AS taches_a_supprimer,
    (SELECT COUNT(*) FROM public.submissions)  AS soumissions_a_supprimer,
    (SELECT COUNT(*) FROM public.points_log)   AS lignes_points_a_supprimer,
    (SELECT COUNT(*) FROM public.profiles)     AS comptes_conserves,
    (SELECT COUNT(*) FROM public.classes)      AS classes_conservees,
    (SELECT COUNT(*) FROM public.class_members) AS inscriptions_conservees;

-- ─── 2. SUPPRESSION (dans l'ordre des dépendances FK) ────────

-- Points en premier (référence submissions et profiles)
DELETE FROM public.points_log;

-- Soumissions (référence tasks et profiles)
DELETE FROM public.submissions;

-- Tâches
DELETE FROM public.tasks;

-- Push subscriptions (réabonnement au prochain login)
DELETE FROM public.push_subscriptions
WHERE EXISTS (SELECT 1 FROM information_schema.tables
              WHERE table_schema = 'public'
              AND table_name = 'push_subscriptions');

-- ─── 3. CONFIRMATION ─────────────────────────────────────────
SELECT
    (SELECT COUNT(*) FROM public.tasks)          AS taches_restantes,
    (SELECT COUNT(*) FROM public.submissions)    AS soumissions_restantes,
    (SELECT COUNT(*) FROM public.points_log)     AS points_restants,
    (SELECT COUNT(*) FROM public.profiles)       AS comptes_intacts,
    (SELECT COUNT(*) FROM public.classes)        AS classes_intactes,
    (SELECT COUNT(*) FROM public.class_members)  AS inscriptions_intactes;

-- ─── NOTE : Fichiers audio dans Storage ──────────────────────
-- Les fichiers audio ne sont PAS supprimés par ce script.
-- Pour les supprimer :
--   Supabase Dashboard > Storage > audio-submissions
--   → Sélectionner tous les fichiers → Delete
-- ─────────────────────────────────────────────────────────────
