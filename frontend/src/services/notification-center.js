// Centre de notifications in-app — QuranReview
// Panneau dropdown sur clic cloche ; "قراءة الكل" ouvre la page complète.
import { supabaseClient } from './supabase-client.js';

let _panel = null;
let _subscription = null;
let _unreadCount = 0;

export function initNotificationCenter(userId) {
    if (!userId) return;
    destroyNotificationCenter();
    _createPanel();
    _loadNotifications(userId);
    _subscribeRealtime(userId);
    document.addEventListener('notif-toggle', _onToggle);
}

export function destroyNotificationCenter() {
    _subscription?.unsubscribe();
    _subscription = null;
    _panel?.remove();
    _panel = null;
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

function _onToggle(e) {
    if (!_panel) return;
    const isHidden = _panel.classList.contains('hidden');
    if (isHidden) {
        if (window.innerWidth > 768) {
            const rect = e.detail?.rect;
            if (rect) {
                const panelWidth = 320;
                const margin = 8;
                let left = rect.left;
                if (left + panelWidth > window.innerWidth - margin) {
                    left = window.innerWidth - panelWidth - margin;
                }
                left = Math.max(margin, left);
                _panel.style.top = rect.bottom + 8 + 'px';
                _panel.style.left = left + 'px';
                _panel.style.right = 'auto';
            }
        } else {
            // Sur mobile, laisser le CSS gérer la position (left:8px, right:8px)
            _panel.style.top = '';
            _panel.style.left = '';
            _panel.style.right = '';
        }
        _panel.classList.remove('hidden');
    } else {
        _panel.classList.add('hidden');
    }
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

function _createPanel() {
    _panel = document.createElement('div');
    _panel.id = 'notif-panel';
    _panel.className = 'notif-panel hidden';

    const header = document.createElement('div');
    header.className = 'notif-panel-header';

    const title = document.createElement('span');
    title.className = 'notif-panel-title';
    title.textContent = 'الإشعارات';

    // "قراءة الكل" → ouvre la page complète des notifications
    const markAllBtn = document.createElement('button');
    markAllBtn.className = 'notif-mark-all-btn';
    markAllBtn.textContent = 'قراءة الكل';
    markAllBtn.addEventListener('click', () => {
        _panel.classList.add('hidden');
        window.QuranReview?.navigateTo?.('notifications');
    });

    header.appendChild(title);
    header.appendChild(markAllBtn);

    const list = document.createElement('div');
    list.id = 'notif-list';
    list.className = 'notif-list';

    const empty = document.createElement('div');
    empty.className = 'notif-empty';
    empty.textContent = 'لا توجد إشعارات';
    list.appendChild(empty);

    _panel.appendChild(header);
    _panel.appendChild(list);
    document.body.appendChild(_panel);

    // Fermer en cliquant en dehors (desktop + mobile bell)
    document.addEventListener('click', e => {
        if (
            _panel &&
            !_panel.classList.contains('hidden') &&
            !_panel.contains(e.target) &&
            !e.target.closest('#notif-bell-btn') &&
            !e.target.closest('#notif-bell-mobile-btn')
        ) {
            _panel.classList.add('hidden');
        }
    });
}

async function _loadNotifications(userId) {
    try {
        const { data } = await supabaseClient
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10);

        _renderAll(data || []);
    } catch (err) {
        console.warn('[Notif] Erreur chargement:', err?.message ?? err);
    }
}

function _renderAll(notifs) {
    _unreadCount = notifs.filter(n => !n.read).length;
    _updateBadge();

    const list = document.getElementById('notif-list');
    if (!list) return;
    list.innerHTML = '';

    if (!notifs.length) {
        const empty = document.createElement('div');
        empty.className = 'notif-empty';
        empty.textContent = 'لا توجد إشعارات';
        list.appendChild(empty);
        return;
    }

    notifs.forEach(n => list.appendChild(_buildItem(n)));
}

function _buildItem(notif) {
    const item = document.createElement('div');
    item.className = `notif-item${notif.read ? '' : ' notif-unread'}`;
    item.dataset.id = notif.id;

    const titleEl = document.createElement('div');
    titleEl.className = 'notif-item-title';
    titleEl.textContent = notif.title || '';

    const bodyEl = document.createElement('div');
    bodyEl.className = 'notif-item-body';
    bodyEl.textContent = notif.body || '';

    const timeEl = document.createElement('div');
    timeEl.className = 'notif-item-time';
    timeEl.textContent = _timeAgo(notif.created_at);

    item.appendChild(titleEl);
    if (notif.body) item.appendChild(bodyEl);
    item.appendChild(timeEl);
    item.addEventListener('click', () => _onItemClick(notif, item));
    return item;
}

async function _onItemClick(notif, itemEl) {
    if (!notif.read) {
        await supabaseClient.from('notifications').update({ read: true }).eq('id', notif.id);
        itemEl.classList.remove('notif-unread');
        _unreadCount = Math.max(0, _unreadCount - 1);
        _updateBadge();
    }
    _panel?.classList.add('hidden');
    if (notif.url && notif.url !== '/') {
        const page = notif.url.replace(/^\//, '');
        window.QuranReview?.navigateTo?.(page);
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
            payload => _onNewNotif(payload.new)
        )
        .subscribe();
}

function _onNewNotif(notif) {
    _unreadCount++;
    _updateBadge();

    document.querySelectorAll('.notif-bell-badge').forEach(b => {
        b.classList.add('notif-pulse');
        setTimeout(() => b.classList.remove('notif-pulse'), 1500);
    });

    const list = document.getElementById('notif-list');
    if (!list) return;
    list.querySelector('.notif-empty')?.remove();

    const item = _buildItem({ ...notif, read: false });
    item.classList.add('notif-new');
    list.prepend(item);
}

function _timeAgo(isoString) {
    if (!isoString) return '';
    const diff = Date.now() - new Date(isoString).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'الآن';
    if (min < 60) return `منذ ${min} دقيقة`;
    const h = Math.floor(min / 60);
    if (h < 24) return `منذ ${h} ساعة`;
    const d = Math.floor(h / 24);
    return `منذ ${d} يوم`;
}
