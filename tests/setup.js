import { vi } from 'vitest';

window.API_BASE_URL = undefined;

global.console = {
    ...console,
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    table: vi.fn(),
};

beforeEach(() => {
    localStorage.clear();
});

global.supabase = {
    createClient: () => ({
        auth: {
            getSession: vi.fn(),
            getUser: vi.fn(),
            onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
        },
        channel: vi.fn(() => ({
            on: vi.fn(() => ({
                subscribe: vi.fn()
            }))
        }))
    })
};
window.supabase = global.supabase;
