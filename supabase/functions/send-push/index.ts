// Edge Function Supabase — send-push
// Envoie une notification push à un utilisateur via Web Push API
//
// SETUP (étapes manuelles requises) :
//
//   1. Créer la table push_subscriptions dans Supabase SQL Editor :
//      ──────────────────────────────────────────────────────────────
//      CREATE TABLE push_subscriptions (
//          user_id     uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
//          subscription jsonb NOT NULL,
//          created_at  timestamptz DEFAULT now()
//      );
//      ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
//      CREATE POLICY "own" ON push_subscriptions
//          USING (auth.uid() = user_id)
//          WITH CHECK (auth.uid() = user_id);
//      ──────────────────────────────────────────────────────────────
//
//   2. Générer les clés VAPID (en local) :
//      npx web-push generate-vapid-keys
//
//   3. Configurer les secrets dans Supabase Dashboard → Edge Functions → Secrets :
//      VAPID_PUBLIC_KEY   → clé publique générée à l'étape 2
//      VAPID_PRIVATE_KEY  → clé privée générée à l'étape 2
//      VAPID_SUBJECT      → mailto:ton@email.com
//
//   4. Déployer l'Edge Function :
//      supabase functions deploy send-push

import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { status: 200, headers: corsHeaders });
    }

    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
    }

    try {
        const { user_id, title, body, url } = await req.json();

        if (!user_id || !title) {
            return new Response('Paramètres manquants (user_id, title)', { status: 400, headers: corsHeaders });
        }

        webpush.setVapidDetails(
            Deno.env.get('VAPID_SUBJECT')!,
            Deno.env.get('VAPID_PUBLIC_KEY')!,
            Deno.env.get('VAPID_PRIVATE_KEY')!,
        );

        const sb = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        );

        const { data, error } = await sb
            .from('push_subscriptions')
            .select('subscription')
            .eq('user_id', user_id)
            .single();

        if (error || !data) {
            return new Response('Subscription introuvable', { status: 404, headers: corsHeaders });
        }

        await webpush.sendNotification(
            data.subscription,
            JSON.stringify({ title, body: body ?? '', url: url ?? '/' }),
        );

        return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (err: unknown) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const e = err as any;
        const detail = { message: e?.message, statusCode: e?.statusCode, body: e?.body ? String(e.body).slice(0, 300) : undefined };
        console.error('[send-push] Erreur:', JSON.stringify(detail));
        return new Response(JSON.stringify({ error: detail }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
});
