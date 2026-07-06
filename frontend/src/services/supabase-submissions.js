// Service de gestion des soumissions audio Supabase — QuranReview
import { supabaseClient } from './supabase-client.js';

const MAX_AUDIO_SIZE = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['.webm', '.mp3', '.wav', '.m4a'];

function validateAudio(audioBlob) {
    if (audioBlob.size > MAX_AUDIO_SIZE) {
        return { valid: false, error: 'Fichier trop volumineux (max 10 Mo)' };
    }
    if (audioBlob.name) {
        const ext = audioBlob.name.toLowerCase().slice(audioBlob.name.lastIndexOf('.'));
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
            return {
                valid: false,
                error: `Extension non autorisée. Formats: ${ALLOWED_EXTENSIONS.join(', ')}`,
            };
        }
    }
    return { valid: true, error: null };
}

// Génère une signed URL fraîche (1h) pour un path ou une ancienne signed URL Supabase
async function _freshSignedUrl(audioUrl) {
    if (!audioUrl) return null;

    // Path storage direct (ne commence pas par http) → générer directement
    if (!audioUrl.startsWith('http')) {
        const { data } = await supabaseClient.storage
            .from('audio-submissions')
            .createSignedUrl(audioUrl, 3600);
        return data?.signedUrl || null;
    }

    // Ancienne signed URL Supabase (stockée avant le fix) → extraire le path et régénérer
    const match = audioUrl.match(/\/object\/sign\/audio-submissions\/(.+?)\?/);
    if (match) {
        const path = decodeURIComponent(match[1]);
        const { data } = await supabaseClient.storage
            .from('audio-submissions')
            .createSignedUrl(path, 3600);
        return data?.signedUrl || null;
    }

    // URL externe inconnue (Cloudinary legacy, etc.) — retourner telle quelle
    return audioUrl;
}

export async function getMySubmissions() {
    try {
        // Résoudre l'UUID Supabase depuis localStorage (Django JWT)
        const localUser = JSON.parse(localStorage.getItem('quranreview_user') || 'null');
        if (!localUser?.username) return { data: [], error: null };

        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('id')
            .eq('username', localUser.username)
            .maybeSingle();
        if (!profile) return { data: [], error: null };

        const { data, error } = await supabaseClient
            .from('submissions')
            .select('*, tasks(*)')
            .eq('student_id', profile.id)
            .order('submitted_at', { ascending: false });

        if (error || !data) return { data, error };

        // Générer des signed URLs fraîches pour les paths stockés en DB
        const withUrls = await Promise.all(
            data.map(async sub => ({
                ...sub,
                audio_url: await _freshSignedUrl(sub.audio_url),
            }))
        );
        return { data: withUrls, error: null };
    } catch (error) {
        return { data: null, error };
    }
}

export async function getPendingSubmissions() {
    try {
        const { data, error } = await supabaseClient
            .from('submissions')
            .select('*, tasks(*), profiles!student_id(*)')
            .in('status', ['submitted', 'approved', 'rejected'])
            .order('submitted_at', { ascending: false });

        if (error || !data) return { data, error };

        // Générer des signed URLs fraîches pour les paths stockés en DB
        const withUrls = await Promise.all(
            data.map(async sub => ({
                ...sub,
                audio_url: await _freshSignedUrl(sub.audio_url),
            }))
        );
        return { data: withUrls, error: null };
    } catch (error) {
        return { data: null, error };
    }
}

export async function uploadAudio(taskId, audioBlob) {
    const validation = validateAudio(audioBlob);
    if (!validation.valid) return { data: null, error: new Error(validation.error) };

    try {
        // Résoudre l'UUID Supabase depuis localStorage (Django JWT)
        const localUser = JSON.parse(localStorage.getItem('quranreview_user') || 'null');
        if (!localUser?.username) return { data: null, error: new Error('Non authentifié') };

        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('id')
            .eq('username', localUser.username)
            .maybeSingle();

        if (profileError) {
            console.error('[uploadAudio] Profile fetch error:', profileError);
            return { data: null, error: new Error('Erreur lors de la récupération du profil') };
        }

        if (!profile) return { data: null, error: new Error('Profil non trouvé') };

        const uid = profile.id;
        const uuid = crypto.randomUUID();
        const path = `${uid}/${taskId}/${uuid}.webm`;

        console.log('[uploadAudio] Uploading to:', {
            bucket: 'audio-submissions',
            path,
            size: audioBlob.size,
        });

        const { data, error } = await supabaseClient.storage
            .from('audio-submissions')
            .upload(path, audioBlob, {
                contentType: audioBlob.type || 'audio/webm',
                upsert: false,
            });

        if (error) {
            console.error('[uploadAudio] Upload error:', error);
            return { data: null, error };
        }

        console.log('[uploadAudio] Upload success:', data);

        const { data: urlData, error: urlError } = await supabaseClient.storage
            .from('audio-submissions')
            .createSignedUrl(path, 3600 * 24 * 7); // 7 jours

        if (urlError) {
            console.error('[uploadAudio] Signed URL error:', urlError);
            return { data: null, error: urlError };
        }

        console.log('[uploadAudio] Signed URL created:', urlData?.signedUrl);

        return { data: { path, url: urlData?.signedUrl }, error: null };
    } catch (error) {
        console.error('[uploadAudio] Unexpected error:', error);
        return { data: null, error };
    }
}

export async function createSubmission(taskId, audioUrl) {
    try {
        // Résoudre l'UUID Supabase depuis localStorage (Django JWT)
        const localUser = JSON.parse(localStorage.getItem('quranreview_user') || 'null');
        if (!localUser?.username) return { data: null, error: new Error('Non authentifié') };

        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('id')
            .eq('username', localUser.username)
            .maybeSingle();
        if (!profile) return { data: null, error: new Error('Profil non trouvé') };

        const { data, error } = await supabaseClient
            .from('submissions')
            .insert({
                task_id: taskId,
                student_id: profile.id,
                audio_url: audioUrl,
                status: 'submitted',
            })
            .select()
            .single();

        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
}

export async function approveSubmission(submissionId, points, feedback = '') {
    try {
        // Récupérer student_id depuis la soumission
        const { data: sub, error: subError } = await supabaseClient
            .from('submissions')
            .select('student_id')
            .eq('id', submissionId)
            .maybeSingle();

        if (subError) return { data: null, error: subError };

        const { data, error } = await supabaseClient
            .from('submissions')
            .update({
                status: 'approved',
                awarded_points: points,
                admin_feedback: feedback,
                validated_at: new Date().toISOString(),
            })
            .eq('id', submissionId)
            .select()
            .single();

        if (error) return { data: null, error };

        // Ajouter dans points_log
        await supabaseClient.from('points_log').insert({
            student_id: sub.student_id,
            delta: points,
            reason: 'Soumission approuvée',
            submission_id: submissionId,
        });

        // Notifier l'étudiant via push (non bloquant — échec silencieux)
        supabaseClient.functions
            .invoke('send-push', {
                body: {
                    user_id: sub.student_id,
                    title: 'تم تصحيح تلاوتك ✅',
                    body: `حصلت على ${points} نقطة`,
                    url: '/soumettre',
                },
            })
            .catch(err => console.warn('[Push] Notification non envoyée:', err));

        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
}

export async function rejectSubmission(submissionId, feedback = '') {
    try {
        const { data, error } = await supabaseClient
            .from('submissions')
            .update({
                status: 'rejected',
                admin_feedback: feedback,
                validated_at: new Date().toISOString(),
            })
            .eq('id', submissionId)
            .select()
            .single();

        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
}
