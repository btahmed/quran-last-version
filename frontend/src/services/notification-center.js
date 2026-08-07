// Centre de notifications — badge count + temps réel uniquement.
// L'affichage complet est géré par NotificationsPage.js.
import { supabaseClient } from './supabase-client.js';

let _subscription = null;
let _unreadCount = 0;

export function initNotificationCenter(userId) {
    if (!userId) return;
    destroyNotificationCenter();
    _loadUnreadCount(userId);
    _subscribeRealtime(userId);
    document.addEventListener('notif-toggle', _onToggle);
}

export function destroyNotificationCenter() {
    _subscription?.unsubscribe();
    _subscription = null;
    _unreadCount = 0;
    document.removeEventListener('notif-toggle', _onToggle);
    _updateBadge();
}

export function resetUnreadCount() {
    _unreadCount = 0;
    _updateBadge();
}

export function decrementUnreadCount() {
    _unreadCount = Math.max(0, _unreadCount - 1);
    _updateBadge();
}

function _onToggle() {
    window.QuranReview?.navigateTo?.('notifications');
}

function _updateBadge() {
    document.querySelectorAll('.notif-bell-badge').forEach(badge => {
        if (_unreadCount > 0) {
            badge.textContent = _unreadCount > 99 ? '99+' : String(_unreadCount);
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    });
}

async function _loadUnreadCount(userId) {
    try {
        const { count } = await supabaseClient
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('read', false);

        _unreadCount = count || 0;
        _updateBadge();
    } catch (err) {
        console.warn('[Notif] Erreur badge:', err?.message ?? err);
    }
}

function _subscribeRealtime(userId) {
    _subscription = supabaseClient
        .channel(`notif-${userId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${userId}`,
            },
            _onNewNotif
        )
        .subscribe();
}

function _onNewNotif() {
    _unreadCount++;
    _updateBadge();

    document.querySelectorAll('.notif-bell-badge').forEach(b => {
        b.classList.add('notif-pulse');
        setTimeout(() => b.classList.remove('notif-pulse'), 1500);
    });
}
