// Service de notifications push Web Push API — QuranReview
//
// SETUP REQUIS (une seule fois) :
//   1. Générer les clés VAPID : npx web-push generate-vapid-keys
//   2. Remplacer VAPID_PUBLIC_KEY ci-dessous par la clé publique générée
//   3. Enregistrer les clés dans Supabase Dashboard → Edge Functions → Secrets :
//      VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT=mailto:ton@email.com
//   4. Créer la table push_subscriptions (voir supabase/functions/send-push/index.ts)
//   5. Déployer l'Edge Function : supabase functions deploy send-push

const VAPID_PUBLIC_KEY = 'REMPLACER_PAR_VOTRE_CLE_VAPID_PUBLIQUE';

/**
 * Abonne l'utilisateur aux notifications push.
 * Retourne la subscription ou null si non supporté / refus utilisateur.
 */
export async function subscribeToPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('[Push] Web Push non supporté par ce navigateur');
        return null;
    }
    try {
        const registration = await navigator.serviceWorker.ready;
        const existing = await registration.pushManager.getSubscription();
        if (existing) return existing;

        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
        return subscription;
    } catch (err) {
        console.error('[Push] Échec subscription:', err);
        return null;
    }
}

/**
 * Sauvegarde la subscription en base Supabase.
 */
export async function savePushSubscription(supabaseClient, userId, subscription) {
    const { error } = await supabaseClient
        .from('push_subscriptions')
        .upsert({ user_id: userId, subscription: subscription.toJSON() },
                 { onConflict: 'user_id' });
    if (error) throw new Error('[Push] Sauvegarde échouée : ' + error.message);
}

/**
 * Désabonne l'utilisateur et supprime sa subscription de Supabase.
 */
export async function unsubscribeFromPush(supabaseClient, userId) {
    try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) await sub.unsubscribe();
        await supabaseClient.from('push_subscriptions').delete().eq('user_id', userId);
    } catch (err) {
        console.error('[Push] Désabonnement échoué:', err);
    }
}

/** Convertit une clé VAPID base64url en Uint8Array */
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    return new Uint8Array([...rawData].map(c => c.charCodeAt(0)));
}
