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
vi.mock('../../../frontend/src/services/supabase-auth.js', () => ({
    getSession:         vi.fn(),
    getCurrentUser:     vi.fn(),
    signIn:             vi.fn(),
    signOut:            vi.fn(),
    onAuthStateChange:  vi.fn(),
    createUser:         vi.fn(),
}));

import { state }       from '../../../frontend/src/core/state.js';
import * as SupabaseAuth from '../../../frontend/src/services/supabase-auth.js';
import { performLogin, logout, updateAuthUI } from '../../../frontend/src/services/auth.js';

// window.QuranReview utilisé par performLogin() et logout()
window.QuranReview = {
    navigateTo:      vi.fn(),
    loadTasksFromApi: vi.fn(),
    navigateToRole:  vi.fn(),
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

// ─── updateAuthUI ──────────────────────────────────────────────────────────
describe('updateAuthUI', () => {
    it('ne lève pas d\'erreur si les éléments DOM sont absents', () => {
        // Aucun élément créé — doit passer sans throw
        expect(() => updateAuthUI(true)).not.toThrow();
        expect(() => updateAuthUI(false)).not.toThrow();
    });

    it('cache auth-login-btn et affiche auth-user-info quand loggedIn=true', () => {
        const loginBtn  = mkEl('auth-login-btn');
        const userInfo  = mkEl('auth-user-info');
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
