// frontend/src/core/NavManager.js
// Navigation dynamique par rôle — construit top nav + bottom bar selon state.user.role

const NAV_CONFIG = {
    visitor: [], // pas de bottom bar pour les visiteurs
    student: [
        { key: 'home', icon: '🏠', label: 'الرئيسية', center: false },
        { key: 'hifz', icon: '📖', label: 'الحفظ', center: false },
        { key: 'soumettre', icon: '🎧', label: 'إرسال', center: true },
        { key: 'revision', icon: '🔁', label: 'المراجعة', center: false },
        { key: 'profil', icon: '👤', label: 'حسابي', center: false },
    ],
    teacher: [
        { key: 'home', icon: '🏠', label: 'الرئيسية', center: false },
        { key: 'devoirs', icon: '📋', label: 'الواجبات', center: false },
        { key: 'soumissions', icon: '🎧', label: 'التسليمات', center: true },
        { key: 'eleves', icon: '👥', label: 'الطلاب', center: false },
        { key: 'profil', icon: '👤', label: 'حسابي', center: false },
    ],
    admin: [
        { key: 'admin', icon: '🏠', label: 'لوحة', center: false },
        { key: 'admin-users', icon: '👥', label: 'المستخدمون', center: false },
        { key: 'admin-classes', icon: '🏫', label: 'الفصول', center: true },
        { key: 'admin-stats', icon: '📊', label: 'الإحصاء', center: false },
        { key: 'profil', icon: '⚙️', label: 'الإعدادات', center: false },
    ],
};

/**
 * Construit la top nav et la bottom bar selon le rôle.
 * À appeler après chaque changement d'état auth (login/logout).
 * @param {string} role - 'visitor' | 'student' | 'teacher' | 'admin'
 */
export function buildNav(role = 'visitor') {
    buildTopNav(role);
    buildBottomBar(role);
}

function buildTopNav(role) {
    const nav = document.querySelector('.top-nav-links');
    if (!nav) return;
    nav.innerHTML = '';

    if (role === 'visitor') {
        const loginBtn = document.createElement('button');
        loginBtn.type = 'button';
        loginBtn.className = 'btn btn-glow btn-sm';
        loginBtn.textContent = 'تسجيل الدخول';
        loginBtn.addEventListener('click', () => window.QuranReview?.showAuthModal?.());
        nav.appendChild(loginBtn);
        return;
    }

    const tabs = NAV_CONFIG[role] || [];
    tabs.forEach(tab => {
        const a = document.createElement('a');
        a.href = '#';
        a.className = 'nav-link-pro';
        a.dataset.page = tab.key;
        const iconSpan = document.createElement('span');
        iconSpan.className = 'nav-icon-top';
        iconSpan.textContent = tab.icon;
        const labelSpan = document.createElement('span');
        labelSpan.className = 'nav-label-top';
        labelSpan.textContent = tab.label;
        a.appendChild(iconSpan);
        a.appendChild(labelSpan);
        a.addEventListener('click', e => {
            e.preventDefault();
            if (window.QuranReview?.navigateTo) window.QuranReview.navigateTo(tab.key);
        });
        nav.appendChild(a);
    });

    // Séparateur visuel
    const sep = document.createElement('div');
    sep.className = 'nav-sep';
    nav.appendChild(sep);

    // Bouton logout icône
    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'nav-logout-btn';
    const logoutIcon = document.createElement('span');
    logoutIcon.className = 'nav-icon-top';
    logoutIcon.textContent = '🚪';
    const logoutLabel = document.createElement('span');
    logoutLabel.className = 'nav-label-top';
    logoutLabel.textContent = 'خروج';
    logoutBtn.appendChild(logoutIcon);
    logoutBtn.appendChild(logoutLabel);
    logoutBtn.title = 'تسجيل الخروج';
    logoutBtn.addEventListener('click', () => window.QuranReview?.logout());
    nav.appendChild(logoutBtn);
}

function buildBottomBar(role) {
    const bar = document.getElementById('bottom-bar');
    if (!bar) return;

    if (role === 'visitor') {
        bar.classList.remove('bottom-bar--active');
        document.body.classList.remove('has-bottom-bar');
        delete bar.dataset.currentRole; // réinitialiser pour la prochaine connexion
        return;
    }

    if (bar.dataset.currentRole === role) {
        // Rôle identique — s'assurer que la barre est bien visible (cas logout/re-login)
        bar.classList.add('bottom-bar--active');
        document.body.classList.add('has-bottom-bar');
        return;
    }
    bar.dataset.currentRole = role;

    const tabs = NAV_CONFIG[role] || [];
    bar.innerHTML = '';
    tabs.forEach(tab => {
        const a = document.createElement('a');
        a.className = `bottom-tab${tab.center ? ' bottom-tab--center' : ''}`;
        a.dataset.page = tab.key;
        a.href = '#';
        a.addEventListener('click', e => {
            e.preventDefault();
            window.QuranReview?.navigateTo(tab.key);
        });

        const icon = document.createElement('span');
        icon.className = 'tab-icon';
        icon.textContent = tab.icon;

        const label = document.createElement('span');
        label.className = 'tab-label';
        label.textContent = tab.label;

        // Badge de notification (invisible par défaut)
        const badgeEl = document.createElement('span');
        badgeEl.className = 'nav-badge';
        badgeEl.id = `nav-badge-${tab.key}`;
        badgeEl.setAttribute('aria-hidden', 'true');
        badgeEl.style.display = 'none';

        a.appendChild(icon);
        a.appendChild(label);
        a.appendChild(badgeEl);
        bar.appendChild(a);
    });

    bar.classList.add('bottom-bar--active');
    document.body.classList.add('has-bottom-bar');
}

/**
 * Met à jour le badge d'un item de la bottom bar.
 * @param {string} key - La clé de la route (ex: 'soumettre', 'soumissions')
 * @param {number} count - Le nombre à afficher (0 = masqué)
 */
export function updateNavBadge(key, count) {
    const el = document.getElementById(`nav-badge-${key}`);
    if (!el) return;
    if (count > 0) {
        el.textContent = count > 99 ? '99+' : String(count);
        el.style.display = 'flex';
    } else {
        el.style.display = 'none';
    }
}

/**
 * Met à jour l'onglet actif dans la top nav et la bottom bar.
 * @param {string} pageName - clé de la page active
 */
export function setActiveTab(pageName) {
    document.querySelectorAll('.nav-link-pro, .bottom-tab').forEach(el => {
        el.classList.toggle('active', el.dataset.page === pageName);
    });
}
