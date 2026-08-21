// Globals nécessaires aux modules frontend (jsdom environment)
import { vi, beforeEach } from 'vitest';

// config.js lit window.API_BASE_URL — on le fixe à undefined pour utiliser la détection auto
window.API_BASE_URL = undefined;

// Logger appelle console — on le silentise pour garder la sortie de test propre
global.console = {
    ...console,
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    table: vi.fn(),
};

// Mock global supabase pour le navigateur (simulé)
global.window.__SUPABASE_URL__ = 'https://mock.supabase.co';
global.window.__SUPABASE_ANON_KEY__ = 'mock-anon-key';

global.window.supabase = {
    createClient: vi.fn(() => ({
        auth: {
            getSession: vi.fn(),
            onAuthStateChange: vi.fn(),
        },
        from: vi.fn(() => ({
            select: vi.fn(),
            insert: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        })),
        channel: vi.fn(() => ({
            on: vi.fn(() => ({
                subscribe: vi.fn()
            }))
        }))
    }))
};

global.supabase = global.window.supabase;

// Nettoyer localStorage entre chaque test
beforeEach(() => {
    localStorage.clear();
});
