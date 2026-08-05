// Globals nécessaires aux modules frontend (jsdom environment)
import { vi } from 'vitest';

// config.js lit window.API_BASE_URL — on le fixe à undefined pour utiliser la détection auto
window.API_BASE_URL = undefined;

// Globals pour Supabase
global.supabase = {
    createClient: vi.fn(() => ({
        auth: {
            getSession: vi.fn(),
            getUser: vi.fn(),
            onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
        },
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    maybeSingle: vi.fn(),
                    order: vi.fn(),
                })),
                order: vi.fn(),
            })),
            insert: vi.fn(() => ({
                select: vi.fn(() => ({
                    single: vi.fn(),
                })),
            })),
            update: vi.fn(() => ({
                eq: vi.fn(() => ({
                    select: vi.fn(() => ({
                        single: vi.fn(),
                    })),
                })),
            })),
            delete: vi.fn(() => ({
                eq: vi.fn(),
            })),
        })),
        storage: {
            from: vi.fn(() => ({
                upload: vi.fn(),
                getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://mock.url' } })),
            })),
        },
        channel: vi.fn(() => ({
            on: vi.fn(() => ({
                subscribe: vi.fn(),
            })),
        })),
        removeChannel: vi.fn(),
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
