// frontend/src/core/NavManager.js
// Navigation dynamique par rôle — construit top nav + bottom bar selon state.user.role

const NAV_CONFIG = {
    visitor: [],  // pas de bottom bar pour les visiteurs
    student: [
        { key: 'home',      icon: '🏠', label: 'الرئيسية', center: false },
        { key: 'hifz',      icon: '📖', label: 'الحفظ',    center: false },
        { key: 'soumettre', icon: '🎧', label: 'إرسال',    center: true  },
        { key: 'revision',  icon: '🔁', label: 'المراجعة', center: false },
        { key: 'profil',    icon: '👤', label: 'حسابي',   center: false },
    ],
    teacher: [
        { key: 'home',        icon: '🏠', label: 'الرئيسية',  center: false },
        { key: 'devoirs',     icon: '📋', label: 'الواجبات',  center: false },
        { key: 'soumissions', icon: '🎧', label: 'التسليمات', center: true  },
        { key: 'eleves',      icon: '👥', label: 'الطلاب',    center: false },
        { key: 'profil',      icon: '👤', label: 'حسابي',    center: false },
    ],
    admin: [
        { key: 'admin',         icon: '🏠', label: 'لوحة',       center: false },
        { key: 'admin-users',   icon: '👥', label: 'المستخدمون', center: false },
        { key: 'admin-classes', icon: '🏫', label: 'الفصول',     center: true  },
        { key: 'admin-stats',   icon: '📊', label: 'الإحصاء',    center: false },
        { key: 'profil',        icon: '⚙️', label: 'الإعدادات', center: false },
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
        nav.innerHTML = `
            <button class="btn btn-glow btn-sm" onclick="showAuthModal()">تسجيل الدخول</button>
        `;
        return;
    }

    const tabs = NAV_CONFIG[role] || [];
    tabs.forEach(tab => {
        const a = document.createElement('a');
        a.href = '#';
        a.className = 'nav-link-pro';
        a.dataset.page = tab.key;
        a.textContent = tab.label;
        a.addEventListener('click', e => {
            e.preventDefault();
            if (window.QuranReview?.navigateTo) window.QuranReview.navigateTo(tab.key);
        });
        nav.appendChild(a);
    });

    // Bouton logout toujours présent pour les utilisateurs connectés
    nav.insertAdjacentHTML('beforeend', `
        <button class="btn btn-outline-glow btn-sm" onclick="QuranReview.logout()">خروج</button>
    `);
}

function buildBottomBar(role) {
    const bar = document.getElementById('bottom-bar');
    if (!bar) return;

    if (role === 'visitor') {
        bar.style.display = 'none';
        document.body.classList.remove('has-bottom-bar');
        return;
    }

    const tabs = NAV_CONFIG[role] || [];
    bar.innerHTML = tabs.map(tab => `
        <a class="bottom-tab${tab.center ? ' bottom-tab--center' : ''}"
           data-page="${tab.key}"
           href="#"
           onclick="event.preventDefault(); QuranReview.navigateTo('${tab.key}')">
            <span class="tab-icon">${tab.icon}</span>
            <span class="tab-label">${tab.label}</span>
        </a>
    `).join('');

    bar.style.display = 'flex';
    document.body.classList.add('has-bottom-bar');
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
