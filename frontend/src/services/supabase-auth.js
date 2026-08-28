// Service d'authentification Supabase — QuranReview
import { supabaseClient } from './supabase-client.js';

const INTERNAL_EMAIL_DOMAINS = ['quranreview.local', 'quranreview.app'];

function normalizeIdentifier(identifier) {
    return (identifier || '').trim().toLowerCase();
}

function buildEmail(username, domain = INTERNAL_EMAIL_DOMAINS[0]) {
    const normalized = normalizeIdentifier(username);
    return normalized.includes('@') ? normalized : `${normalized}@${domain}`;
}

function isInvalidCredentialsError(error) {
    const code = String(error?.code || '').toLowerCase();
    const message = String(error?.message || '').toLowerCase();

    return (
        code === 'invalid_credentials' ||
        message.includes('invalid login credentials') ||
        message.includes('invalid credentials')
    );
}

export async function signIn(username, password) {
    try {
        const identifier = normalizeIdentifier(username);
        const emails = identifier.includes('@')
            ? [identifier]
            : INTERNAL_EMAIL_DOMAINS.map(domain => buildEmail(identifier, domain));

        let result;
        for (const [index, email] of emails.entries()) {
            result = await supabaseClient.auth.signInWithPassword({ email, password });

            if (!result.error) return result;
            if (!isInvalidCredentialsError(result.error) || index === emails.length - 1) {
                return result;
            }
        }

        return result;
    } catch (error) {
        return { data: null, error };
    }
}

export async function signOut() {
    try {
        const { error } = await supabaseClient.auth.signOut();
        return { error };
    } catch (error) {
        return { error };
    }
}

export async function getSession() {
    try {
        const { data, error } = await supabaseClient.auth.getSession();
        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
}

export async function getCurrentUser() {
    try {
        const { data: authData, error: authError } = await supabaseClient.auth.getUser();
        if (authError || !authData?.user) return { data: null, error: authError };

        const { data, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .maybeSingle();

        if (error || !data) {
            return {
                data: null,
                error: error || new Error('Profil Supabase introuvable'),
            };
        }
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
}

// Source d'identité unique pour les services métier. Le profil est toujours
// résolu depuis auth.getUser(), jamais depuis localStorage ou user_metadata.
export async function getAuthenticatedProfile() {
    return getCurrentUser();
}

export async function createUser(
    email,
    password,
    username,
    _role = 'student',
    firstName = '',
    lastName = ''
) {
    try {
        // Conservé pour compatibilité avec les anciens appelants ; le rôle
        // demandé n'est jamais utilisé pour créer les droits.
        void _role;
        const userEmail = email || buildEmail(username);
        const { data, error } = await supabaseClient.auth.signUp({
            email: userEmail,
            password,
            // Le trigger SQL attribue toujours le rôle student. Le rôle demandé
            // ne transite jamais dans user_metadata comme source d'autorisation.
            options: { data: { username, first_name: firstName, last_name: lastName } },
        });
        if (error || !data?.user) return { data, error };

        // Mettre à jour le profil avec first_name et last_name si fournis.
        // Les policies SQL empêchent une élévation de rôle côté navigateur.
        if (firstName || lastName) {
            await supabaseClient
                .from('profiles')
                .update({ first_name: firstName, last_name: lastName })
                .eq('id', data.user.id);
        }

        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
}

export async function createTeacher(email, password, username) {
    try {
        const { data, error } = await supabaseClient.functions.invoke('create-user', {
            body: {
                email: email || buildEmail(username),
                password,
                username,
            },
        });
        if (error) return { data: null, error };
        return { data: data?.data || data, error: null };
    } catch (error) {
        return { data: null, error };
    }
}

export function onAuthStateChange(callback) {
    return supabaseClient.auth.onAuthStateChange(callback);
}
