// tests/unit/services/auth.test.js
// Tests unitaires pour auth.js — fonctions pures et logique sans DOM

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks ES modules ──────────────────────────────────────────────────────
vi.mock('../../../frontend/src/core/logger.js', () => ({
    Logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock('../../../frontend/src/core/config.js', () => ({
    config: { apiTokenKey: 'quranreview_token', tasksKey: 'quranreview_tasks' },
    IS_DEMO_MODE: false,
}));
vi.mock('../../../frontend/src/core/ui.js', () => ({
    showNotification: vi.fn(),
}));
vi.mock('../../../frontend/src/core/NavManager.js', () => ({
    buildNav: vi.fn(),
}));
vi.mock('../../../frontend/src/services/notification-center.js', () => ({
    initNotificationCenter: vi.fn(),
    destroyNotificationCenter: vi.fn(),
}));
vi.mock('../../../frontend/src/services/supabase-auth.js', () => ({
    getSession: vi.fn(),
    getCurrentUser: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn(),
    createUser: vi.fn(),
}));

import { state } from '../../../frontend/src/core/state.js';
import * as SupabaseAuth from '../../../frontend/src/services/supabase-auth.js';
import {
    performLogin,
    logout,
    updateAuthUI,
    showAuthModal,
    hideAuthModal,
    showRegisterForm,
    showLoginForm,
    fetchMe,
    refreshToken,
    loadDemoTasks,
    initAuth,
} from '../../../frontend/src/services/auth.js';

// window.QuranReview utilisé par performLogin() et logout()
window.QuranReview = {
    navigateTo: vi.fn(),
    loadTasksFromApi: vi.fn(),
    navigateToRole: vi.fn(),
};

// ─── Helpers DOM minimaux ──────────────────────────────────────────────────
function mkEl(id, tag = 'div') {
    const el = document.createElement(tag);
    el.id = id;
    document.body.appendChild(el);
    return el;
}

beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
    state.user = null;
    vi.clearAllMocks();
});

// ─── performLogin ──────────────────────────────────────────────────────────
describe('performLogin', () => {
    it('stocke le token et met à jour state.user en cas de succès', async () => {
        const fakeUser = { id: 'uuid-1', username: 'ali', role: 'student' };
        SupabaseAuth.signIn.mockResolvedValue({
            data: {
                user: { id: 'uuid-1', user_metadata: { username: 'ali', role: 'student' } },
                session: { access_token: 'tok123' },
            },
            error: null,
        });
        SupabaseAuth.getCurrentUser.mockResolvedValue({ data: fakeUser, error: null });

        await performLogin('ali', 'pass');

        expect(localStorage.getItem('quranreview_token')).toBe('tok123');
        expect(state.user).toMatchObject({ username: 'ali', role: 'student' });
    });

    it('lance une erreur si Supabase retourne une erreur', async () => {
        SupabaseAuth.signIn.mockResolvedValue({
            data: null,
            error: { message: 'Invalid credentials' },
        });

        await expect(performLogin('bad', 'wrong')).rejects.toThrow();
    });

    it('lance une erreur si la réponse ne contient pas de session', async () => {
        SupabaseAuth.signIn.mockResolvedValue({ data: { user: null, session: null }, error: null });

        await expect(performLogin('ali', 'pass')).rejects.toThrow();
    });
});

// ─── logout ────────────────────────────────────────────────────────────────
describe('logout', () => {
    it('efface state.user et le token localStorage', async () => {
        state.user = { id: 'u1', username: 'ali', role: 'student' };
        localStorage.setItem('quranreview_token', 'tok123');
        localStorage.setItem('quranreview_user', JSON.stringify(state.user));
        SupabaseAuth.signOut.mockResolvedValue({ error: null });

        await logout();

        expect(state.user).toBeNull();
        expect(localStorage.getItem('quranreview_token')).toBeNull();
        expect(localStorage.getItem('quranreview_user')).toBeNull();
    });
});

// ─── showAuthModal / hideAuthModal ────────────────────────────────────────
describe('showAuthModal / hideAuthModal', () => {
    it('showAuthModal ajoute "active" et retire "hidden"', () => {
        const modal = mkEl('auth-modal');
        modal.classList.add('hidden');

        showAuthModal();

        expect(modal.classList.contains('active')).toBe(true);
        expect(modal.classList.contains('hidden')).toBe(false);
    });

    it('hideAuthModal retire "active" et ajoute "hidden"', () => {
        const modal = mkEl('auth-modal');
        modal.classList.add('active');

        hideAuthModal();

        expect(modal.classList.contains('active')).toBe(false);
        expect(modal.classList.contains('hidden')).toBe(true);
    });

    it('ne plante pas si le modal est absent', () => {
        expect(() => showAuthModal()).not.toThrow();
        expect(() => hideAuthModal()).not.toThrow();
    });
});

// ─── showRegisterForm / showLoginForm ────────────────────────────────────
describe('showRegisterForm / showLoginForm', () => {
    function setupForms() {
        const loginForm = mkEl('auth-login-form');
        const registerForm = mkEl('auth-register-form');
        return { loginForm, registerForm };
    }

    it('showRegisterForm cache le login-form et affiche le register-form', () => {
        const { loginForm, registerForm } = setupForms();

        showRegisterForm();

        expect(loginForm.classList.contains('hidden')).toBe(true);
        expect(registerForm.classList.contains('hidden')).toBe(false);
        expect(registerForm.classList.contains('active')).toBe(true);
    });

    it('showLoginForm cache le register-form et affiche le login-form', () => {
        const { loginForm, registerForm } = setupForms();
        registerForm.classList.add('active');

        showLoginForm();

        expect(registerForm.classList.contains('active')).toBe(false);
        expect(registerForm.classList.contains('hidden')).toBe(true);
        expect(loginForm.classList.contains('hidden')).toBe(false);
        expect(loginForm.classList.contains('active')).toBe(true);
    });

    it('showRegisterForm accepte un event.preventDefault optionnel', () => {
        setupForms();
        const event = { preventDefault: vi.fn() };
        expect(() => showRegisterForm(event)).not.toThrow();
        expect(event.preventDefault).toHaveBeenCalled();
    });
});

// ─── fetchMe ─────────────────────────────────────────────────────────────
describe('fetchMe', () => {
    it('met à jour state.user si getCurrentUser réussit', async () => {
        const fakeUser = { id: 'u2', username: 'fatima', role: 'student' };
        SupabaseAuth.getCurrentUser.mockResolvedValue({ data: fakeUser, error: null });

        await fetchMe();

        expect(state.user).toEqual(fakeUser);
        expect(localStorage.getItem('quranreview_user')).toBe(JSON.stringify(fakeUser));
    });

    it('ne plante pas si getCurrentUser retourne une erreur', async () => {
        SupabaseAuth.getCurrentUser.mockResolvedValue({ data: null, error: { message: 'err' } });
        await expect(fetchMe()).resolves.toBeUndefined();
        expect(state.user).toBeNull();
    });
});

// ─── refreshToken ────────────────────────────────────────────────────────
describe('refreshToken', () => {
    it('retourne true (Supabase gère le refresh automatiquement)', async () => {
        await expect(refreshToken()).resolves.toBe(true);
    });
});

// ─── loadDemoTasks ───────────────────────────────────────────────────────
describe('loadDemoTasks', () => {
    it('peuple state.tasks avec 3 tâches de démo', () => {
        loadDemoTasks();
        expect(state.tasks).toHaveLength(3);
        expect(state.tasks[0]).toMatchObject({ title: expect.any(String), status: 'pending' });
    });

    it('stocke les tâches dans localStorage', () => {
        loadDemoTasks();
        const stored = JSON.parse(localStorage.getItem('quranreview_tasks') || '[]');
        expect(stored).toHaveLength(3);
    });
});

// ─── initAuth ────────────────────────────────────────────────────────────
describe('initAuth', () => {
    it('charge le profil et met à jour state.user si une session existe', async () => {
        const fakeUser = { id: 'u3', username: 'yusuf', role: 'teacher' };
        SupabaseAuth.getSession.mockResolvedValue({
            data: { session: { access_token: 'tok999', user: { id: 'u3' } } },
            error: null,
        });
        SupabaseAuth.getCurrentUser.mockResolvedValue({ data: fakeUser, error: null });
        SupabaseAuth.onAuthStateChange.mockImplementation(() => {});

        await initAuth();

        expect(state.user).toEqual(fakeUser);
        expect(localStorage.getItem('quranreview_token')).toBe('tok999');
    });

    it('appelle updateAuthUI(false) si aucune session', async () => {
        SupabaseAuth.getSession.mockResolvedValue({ data: { session: null }, error: null });
        SupabaseAuth.onAuthStateChange.mockImplementation(() => {});
        mkEl('auth-login-btn');

        await initAuth();

        expect(state.user).toBeNull();
    });

    it("gère l'erreur getSession sans planter", async () => {
        SupabaseAuth.getSession.mockResolvedValue({ data: null, error: { message: 'network' } });
        SupabaseAuth.onAuthStateChange.mockImplementation(() => {});

        await expect(initAuth()).resolves.toBeUndefined();
    });
});

// ─── updateAuthUI ──────────────────────────────────────────────────────────
describe('updateAuthUI', () => {
    it("ne lève pas d'erreur si les éléments DOM sont absents", () => {
        // Aucun élément créé — doit passer sans throw
        expect(() => updateAuthUI(true)).not.toThrow();
        expect(() => updateAuthUI(false)).not.toThrow();
    });

    it('cache auth-login-btn et affiche auth-user-info quand loggedIn=true', () => {
        const loginBtn = mkEl('auth-login-btn');
        const userInfo = mkEl('auth-user-info');
        state.user = { id: 'u1', username: 'ali', role: 'student' };

        updateAuthUI(true);

        expect(loginBtn.classList.contains('hidden')).toBe(true);
        expect(userInfo.classList.contains('hidden')).toBe(false);
    });

    it('affiche auth-login-btn et cache auth-user-info quand loggedIn=false', () => {
        const loginBtn = mkEl('auth-login-btn');
        const userInfo = mkEl('auth-user-info');
        loginBtn.classList.add('hidden');

        updateAuthUI(false);

        expect(loginBtn.classList.contains('hidden')).toBe(false);
        expect(userInfo.classList.contains('hidden')).toBe(true);
    });
});
