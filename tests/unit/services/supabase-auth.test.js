import { describe, it, expect, vi, beforeEach } from 'vitest';

const { signInWithPassword } = vi.hoisted(() => {
    return {
        signInWithPassword: vi.fn(),
    };
});

vi.mock('../../../frontend/src/services/supabase-client.js', () => ({
    supabaseClient: {
        auth: {
            signInWithPassword,
        },
    },
}));

import { signIn } from '../../../frontend/src/services/supabase-auth.js';

beforeEach(() => {
    vi.clearAllMocks();
});

describe('Supabase username sign-in', () => {
    it('tries the legacy local domain first', async () => {
        signInWithPassword.mockResolvedValueOnce({
            data: { session: { access_token: 'token' } },
            error: null,
        });

        const result = await signIn('prof_youssef', 'password');

        expect(result.error).toBeNull();
        expect(signInWithPassword).toHaveBeenCalledTimes(1);
        expect(signInWithPassword).toHaveBeenCalledWith({
            email: 'prof_youssef@quranreview.local',
            password: 'password',
        });
    });

    it('falls back to the app domain for newer accounts', async () => {
        signInWithPassword
            .mockResolvedValueOnce({
                data: null,
                error: { code: 'invalid_credentials', message: 'Invalid login credentials' },
            })
            .mockResolvedValueOnce({
                data: { session: { access_token: 'token' } },
                error: null,
            });

        const result = await signIn('new_user', 'password');

        expect(result.error).toBeNull();
        expect(signInWithPassword).toHaveBeenNthCalledWith(2, {
            email: 'new_user@quranreview.app',
            password: 'password',
        });
    });

    it('uses an explicit email without changing it', async () => {
        signInWithPassword.mockResolvedValueOnce({
            data: { session: { access_token: 'token' } },
            error: null,
        });

        await signIn('person@gmail.com', 'password');

        expect(signInWithPassword).toHaveBeenCalledWith({
            email: 'person@gmail.com',
            password: 'password',
        });
    });
});
