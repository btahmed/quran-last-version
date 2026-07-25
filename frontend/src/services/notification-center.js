// Centre de notifications in-app — QuranReview
import { supabaseClient } from './supabase-client.js';
import { state } from '../core/state.js';

let _panel = null;
let _subscription = null;
let _unreadCount = 0;

export function initNotificationCenter(userId) {
    if (!userId) return;
    destroyNotificationCenter(); // éviter les doublons si re-appelé
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

function _onToggle(e) {
    if (!_panel) return;
    const isHidden = _panel.classList.contains('hidden');
    if (isHidden) {
        // Positionner sous la cloche
        const rect = e.detail?.rect;
        if (rect) {
            const rightEdge = window.innerWidth - rect.right;
            _panel.style.top = rect.bottom + 8 + 'px';
            _panel.style.right = Math.max(8, rightEdge) + 'px';
        }
        _panel.classList.remove('hidden');
    } else {
        _panel.classList.add('hidden');
    }
}

function _updateBadge() {
    const badge = document.getElementById('notif-bell-badge');
    if (!badge) return;
    if (_unreadCount > 0) {
        badge.textContent = _unreadCount > 99 ? '99+' : String(_unreadCount);
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
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

    const markAllBtn = document.createElement('button');
    markAllBtn.className = 'notif-mark-all-btn';
    markAllBtn.textContent = 'قراءة الكل';
    markAllBtn.addEventListener('click', _markAllRead);

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

    // Fermer en cliquant en dehors
    document.addEventListener('click', e => {
        if (
            _panel &&
            !_panel.classList.contains('hidden') &&
            !_panel.contains(e.target) &&
            !e.target.closest('#notif-bell-btn')
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
            .limit(30);

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
    titleEl.textContent = notif.title;

    const bodyEl = document.createElement('div');
    bodyEl.className = 'notif-item-body';
    bodyEl.textContent = notif.body;

    const timeEl = document.createElement('div');
    timeEl.className = 'notif-item-time';
    timeEl.textContent = _timeAgo(notif.created_at);

    item.appendChild(titleEl);
    item.appendChild(bodyEl);
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
    if (_panel) _panel.classList.add('hidden');
    if (notif.url && notif.url !== '/') {
        const page = notif.url.replace(/^\//, '');
        window.QuranReview?.navigateTo?.(page);
    }
}

async function _markAllRead() {
    const userId = state.user?.id;
    if (!userId) return;
    await supabaseClient
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

    document.querySelectorAll('#notif-list .notif-unread').forEach(el => {
        el.classList.remove('notif-unread');
    });
    _unreadCount = 0;
    _updateBadge();
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

    // Pulse la cloche
    const badge = document.getElementById('notif-bell-badge');
    badge?.classList.add('notif-pulse');
    setTimeout(() => badge?.classList.remove('notif-pulse'), 1500);

    const list = document.getElementById('notif-list');
    if (!list) return;

    const empty = list.querySelector('.notif-empty');
    if (empty) empty.remove();

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
    return `منذ ${d} يوم${d > 1 ? '' : ''}`;
}
