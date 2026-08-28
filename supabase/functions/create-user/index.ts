// Création d'un compte enseignant par un administrateur.
// Le mot de passe n'est jamais journalisé ni renvoyé au client.

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

Deno.serve(async req => {
    if (req.method === 'OPTIONS') return new Response('ok', { status: 200, headers: corsHeaders });
    if (req.method !== 'POST') return json({ error: 'Method Not Allowed' }, 405);

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Authentification requise' }, 401);

        const { email, password, username } = await req.json();
        if (
            typeof email !== 'string' ||
            !email.includes('@') ||
            typeof password !== 'string' ||
            password.length < 8 ||
            typeof username !== 'string' ||
            username.trim().length < 2 ||
            username.length > 80
        ) {
            return json({ error: 'Paramètres invalides' }, 400);
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        if (!supabaseUrl || !anonKey || !serviceRoleKey) {
            console.error('[create-user] Configuration serveur incomplète');
            return json({ error: 'Service indisponible' }, 503);
        }

        const callerClient = createClient(supabaseUrl, anonKey, {
            global: { headers: { Authorization: authHeader } },
        });
        const {
            data: { user: caller },
            error: callerError,
        } = await callerClient.auth.getUser();
        if (callerError || !caller) return json({ error: 'Authentification invalide' }, 401);

        const adminClient = createClient(supabaseUrl, serviceRoleKey);
        const { data: callerProfile } = await adminClient
            .from('profiles')
            .select('role, is_superuser')
            .eq('id', caller.id)
            .single();
        if (!callerProfile || (callerProfile.role !== 'admin' && !callerProfile.is_superuser)) {
            return json({ error: 'Droits insuffisants' }, 403);
        }

        const { data: created, error: createError } = await adminClient.auth.admin.createUser({
            email: email.trim().toLowerCase(),
            password,
            email_confirm: true,
            user_metadata: { username: username.trim() },
        });
        if (createError || !created.user) {
            return json({ error: createError?.message || 'Création impossible' }, 400);
        }

        const { error: profileError } = await adminClient
            .from('profiles')
            .update({ username: username.trim(), role: 'teacher' })
            .eq('id', created.user.id);
        if (profileError) {
            await adminClient.auth.admin.deleteUser(created.user.id);
            console.error('[create-user] Profil enseignant non créé:', profileError.message);
            return json({ error: 'Profil enseignant impossible à créer' }, 500);
        }

        return json(
            {
                data: {
                    id: created.user.id,
                    email: created.user.email,
                    username: username.trim(),
                    role: 'teacher',
                },
            },
            201
        );
    } catch (error) {
        console.error('[create-user] Erreur serveur:', (error as { message?: string })?.message);
        return json({ error: 'Erreur serveur' }, 500);
    }
});