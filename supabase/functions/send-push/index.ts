// Edge Function Supabase — send-push
// Les secrets VAPID restent dans les secrets de l'Edge Function.
// L'appelant est authentifié et doit être autorisé à notifier le destinataire.

import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status: number) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

function isUuid(value: unknown): value is string {
    return (
        typeof value === 'string' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    );
}

Deno.serve(async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') return new Response('ok', { status: 200, headers: corsHeaders });
    if (req.method !== 'POST') return json({ error: 'Method Not Allowed' }, 405);

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Authentification requise' }, 401);

        const { user_id: recipientId, title, body, url } = await req.json();
        if (!isUuid(recipientId) || typeof title !== 'string' || title.trim().length === 0) {
            return json({ error: 'Paramètres invalides' }, 400);
        }
        if (title.length > 160 || (body != null && (typeof body !== 'string' || body.length > 1000))) {
            return json({ error: 'Notification trop longue' }, 400);
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const vapidSubject = Deno.env.get('VAPID_SUBJECT');
        const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
        const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
        if (
            !supabaseUrl ||
            !anonKey ||
            !serviceRoleKey ||
            !vapidSubject ||
            !vapidPublicKey ||
            !vapidPrivateKey
        ) {
            console.error('[send-push] Configuration serveur incomplète');
            return json({ error: 'Service indisponible' }, 503);
        }

        // Le client avec l'en-tête du demandeur valide le JWT sans faire
        // confiance à un user_id fourni par le navigateur.
        const callerClient = createClient(supabaseUrl, anonKey, {
            global: { headers: { Authorization: authHeader } },
        });
        const {
            data: { user: caller },
            error: callerError,
        } = await callerClient.auth.getUser();
        if (callerError || !caller) return json({ error: 'Authentification invalide' }, 401);

        const adminClient = createClient(supabaseUrl, serviceRoleKey);
        const { data: callerProfile, error: callerProfileError } = await adminClient
            .from('profiles')
            .select('id, role, is_superuser')
            .eq('id', caller.id)
            .single();
        if (callerProfileError || !callerProfile) return json({ error: 'Profil introuvable' }, 403);

        const callerIsAdmin = callerProfile.role === 'admin' || callerProfile.is_superuser === true;
        let allowed = callerIsAdmin || caller.id === recipientId;
        if (!allowed && callerProfile.role === 'teacher') {
            const { data: teacherStudent } = await adminClient
                .from('class_members')
                .select('student_id, classes!inner(teacher_id)')
                .eq('student_id', recipientId)
                .eq('classes.teacher_id', caller.id)
                .maybeSingle();
            allowed = Boolean(teacherStudent);
        }
        if (!allowed) {
            // Un élève peut notifier uniquement le professeur d'un de ses devoirs.
            const { data: assignedTask } = await adminClient
                .from('tasks')
                .select('id')
                .eq('user_id', caller.id)
                .eq('assigned_by', recipientId)
                .limit(1)
                .maybeSingle();
            allowed = Boolean(assignedTask);
        }
        if (!allowed) return json({ error: 'Destinataire non autorisé' }, 403);

        webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
        const { data: subscription, error: subscriptionError } = await adminClient
            .from('push_subscriptions')
            .select('subscription')
            .eq('user_id', recipientId)
            .maybeSingle();
        if (subscriptionError) {
            console.error('[send-push] Erreur subscription:', subscriptionError.message);
            return json({ error: 'Erreur serveur' }, 500);
        }
        if (!subscription) return json({ error: 'Subscription introuvable' }, 404);

        await webpush.sendNotification(
            subscription.subscription,
            JSON.stringify({ title: title.trim(), body: body ?? '', url: typeof url === 'string' ? url : '/' })
        );
        return json({ ok: true }, 200);
    } catch (error) {
        const err = error as { message?: string; statusCode?: number };
        console.error('[send-push] Erreur:', err?.message, 'status:', err?.statusCode);
        // Une subscription expirée ne doit pas être réutilisée.
        if (err?.statusCode === 404 || err?.statusCode === 410) {
            return json({ error: 'Subscription expirée' }, 410);
        }
        return json({ error: 'Erreur serveur' }, 500);
    }
});