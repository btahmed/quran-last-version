// Globals nécessaires aux modules frontend (jsdom environment)
import { vi } from 'vitest';

// config.js lit window.API_BASE_URL — on le fixe à undefined pour utiliser la détection auto
window.API_BASE_URL = undefined;

// Mock supabase object that is usually injected via CDN
global.supabase = {
    createClient: vi.fn(() => ({
        auth: {
            getSession: vi.fn(),
            getUser: vi.fn(),
            signInWithPassword: vi.fn(),
            signOut: vi.fn(),
            onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
            signUp: vi.fn()
        },
        from: vi.fn(() => ({
            select: vi.fn(),
            insert: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            eq: vi.fn(),
            in: vi.fn()
        })),
        channel: vi.fn(() => ({
            on: vi.fn(() => ({
                subscribe: vi.fn()
            })),
            unsubscribe: vi.fn()
        }))
    }))
};

// Logger appelle console — on le silentise pour garder la sortie de test propre
global.console = {
    ...console,
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    table: vi.fn(),
};

// Nettoyer localStorage entre chaque test
beforeEach(() => {
    localStorage.clear();
});
