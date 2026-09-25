import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSignInWithPassword = vi.fn();

vi.mock('../../../frontend/src/services/supabase-client.js', () => ({
    supabaseClient: {
        auth: {
            signInWithPassword: (...args) => mockSignInWithPassword(...args),
        },
    },
}));

import { signIn } from '../../../frontend/src/services/supabase-auth.js';

beforeEach(() => {
    vi.clearAllMocks();
});

describe('Supabase username sign-in', () => {
    it('tries the legacy local domain first', async () => {
        mockSignInWithPassword.mockResolvedValueOnce({
            data: { session: { access_token: 'token' } },
            error: null,
        });

        const result = await signIn('prof_youssef', 'password');

        expect(result.error).toBeNull();
        expect(mockSignInWithPassword).toHaveBeenCalledTimes(1);
        expect(mockSignInWithPassword).toHaveBeenCalledWith({
            email: 'prof_youssef@quranreview.local',
            password: 'password',
        });
    });

    it('falls back to the app domain for newer accounts', async () => {
        mockSignInWithPassword
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
        expect(mockSignInWithPassword).toHaveBeenNthCalledWith(2, {
            email: 'new_user@quranreview.app',
            password: 'password',
        });
    });

    it('uses an explicit email without changing it', async () => {
        mockSignInWithPassword.mockResolvedValueOnce({
            data: { session: { access_token: 'token' } },
            error: null,
        });

        await signIn('person@gmail.com', 'password');

        expect(mockSignInWithPassword).toHaveBeenCalledWith({
            email: 'person@gmail.com',
            password: 'password',
        });
    });
});
