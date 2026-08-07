// frontend/src/pages/NotificationsPage.js
import { supabaseClient } from '../services/supabase-client.js';
import { state } from '../core/state.js';
import { resetUnreadCount, decrementUnreadCount } from '../services/notification-center.js';

if (!document.querySelector('link[href*="NotificationsPage.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/src/pages/NotificationsPage.css';
    document.head.appendChild(link);
}

export function render() {
    return `<div id="notifications-page" class="page active">
        <section class="k-section notif-page-section">
            <div class="notif-page-header">
                <button class="btn btn-outline-glow btn-sm notif-page-back-btn" id="notif-page-back" title="رجوع">&#8592;</button>
                <h2 class="k-section-title" style="margin:0;">🔔 الإشعارات</h2>
                <button class="btn btn-outline-glow btn-sm" id="notif-page-mark-all">قراءة الكل</button>
            </div>
            <div id="notif-page-list" class="notif-page-list">
                <div class="notif-page-loading">⏳ جاري التحميل...</div>
            </div>
        </section>
    </div>`;
}

export async function init() {
    const userId = state.user?.id;
    if (!userId) return;

    document.getElementById('notif-page-back')?.addEventListener('click', () => history.back());
    document.getElementById('notif-page-mark-all')?.addEventListener('click', _markAllRead);
    await _loadAndRender(userId);
}

async function _loadAndRender(userId) {
    const list = document.getElementById('notif-page-list');
    if (!list) return;

    try {
        const { data, error } = await supabaseClient
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;
        _render(data || []);
    } catch {
        list.innerHTML = '';
        const errEl = document.createElement('div');
        errEl.className = 'notif-page-empty';
        errEl.textContent = 'تعذر تحميل الإشعارات';
        list.appendChild(errEl);
    }
}

function _render(notifs) {
    const list = document.getElementById('notif-page-list');
    if (!list) return;
    list.innerHTML = '';

    if (!notifs.length) {
        const empty = document.createElement('div');
        empty.className = 'notif-page-empty';
        empty.textContent = 'لا توجد إشعارات بعد 🎉';
        list.appendChild(empty);
        return;
    }

    notifs.forEach(n => list.appendChild(_buildItem(n)));
}

function _buildItem(notif) {
    const item = document.createElement('div');
    item.className = `notif-page-item${notif.read ? '' : ' notif-page-unread'}`;
    item.dataset.id = notif.id;

    const dot = document.createElement('div');
    dot.className = 'notif-page-dot';

    const content = document.createElement('div');
    content.className = 'notif-page-content';

    const titleEl = document.createElement('div');
    titleEl.className = 'notif-page-item-title';
    titleEl.textContent = notif.title || '';

    const timeEl = document.createElement('div');
    timeEl.className = 'notif-page-item-time';
    timeEl.textContent = _timeAgo(notif.created_at);

    content.appendChild(titleEl);

    if (notif.body) {
        const bodyEl = document.createElement('div');
        bodyEl.className = 'notif-page-item-body';
        bodyEl.textContent = notif.body;
        content.appendChild(bodyEl);
    }

    content.appendChild(timeEl);
    item.appendChild(dot);
    item.appendChild(content);
    item.addEventListener('click', () => _onItemClick(notif, item));
    return item;
}

async function _onItemClick(notif, itemEl) {
    if (!notif.read) {
        await supabaseClient.from('notifications').update({ read: true }).eq('id', notif.id);
        itemEl.classList.remove('notif-page-unread');
        decrementUnreadCount();
    }
    if (notif.url && notif.url !== '/') {
        const page = notif.url.replace(/^\//, '');
        window.QuranReview?.navigateTo?.(page);
    }
}

async function _markAllRead() {
    const userId = state.user?.id;
    if (!userId) return;

    const btn = document.getElementById('notif-page-mark-all');
    if (btn) btn.disabled = true;

    try {
        await supabaseClient
            .from('notifications')
            .update({ read: true })
            .eq('user_id', userId)
            .eq('read', false);

        document.querySelectorAll('#notif-page-list .notif-page-unread').forEach(el => {
            el.classList.remove('notif-page-unread');
        });
        resetUnreadCount();
    } finally {
        if (btn) btn.disabled = false;
    }
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
