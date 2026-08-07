// Globals nécessaires aux modules frontend (jsdom environment)
import { vi } from 'vitest';

// config.js lit window.API_BASE_URL — on le fixe à undefined pour utiliser la détection auto
window.API_BASE_URL = undefined;

global.supabase = {
    createClient: vi.fn(() => ({
        auth: {
            getSession: vi.fn(),
            onAuthStateChange: vi.fn(),
            signOut: vi.fn(),
        },
        from: vi.fn(() => ({
            select: vi.fn(),
            insert: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            eq: vi.fn(),
        })),
        channel: vi.fn(() => ({
            on: vi.fn(() => ({
                subscribe: vi.fn(),
            })),
            unsubscribe: vi.fn(),
        })),
    })),
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
