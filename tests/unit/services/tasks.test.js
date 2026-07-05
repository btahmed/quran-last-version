// tests/unit/services/tasks.test.js
// Tests unitaires pour tasks.js — loadTasksFromApi

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

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
vi.mock('../../../frontend/src/services/supabase-tasks.js', () => ({
    getMyTasks: vi.fn(),
    createTask: vi.fn(),
}));

import { state } from '../../../frontend/src/core/state.js';
import { config } from '../../../frontend/src/core/config.js';
import * as SupabaseTasks from '../../../frontend/src/services/supabase-tasks.js';
import { loadTasksFromApi } from '../../../frontend/src/services/tasks.js';

beforeEach(() => {
    localStorage.clear();
    state.tasks = [];
    vi.clearAllMocks();
});

// ─── loadTasksFromApi ──────────────────────────────────────────────────────
describe('loadTasksFromApi', () => {
    it('peuple state.tasks et localStorage en cas de succès', async () => {
        const mockTasks = [
            { id: 1, title: 'سورة الفاتحة', status: 'pending', points: 10 },
            { id: 2, title: 'سورة البقرة', status: 'approved', points: 20 },
        ];
        SupabaseTasks.getMyTasks.mockResolvedValue({ data: mockTasks, error: null });

        await loadTasksFromApi();

        expect(state.tasks).toEqual(mockTasks);
        expect(JSON.parse(localStorage.getItem(config.tasksKey))).toEqual(mockTasks);
    });

    it('ne modifie pas state.tasks si Supabase retourne une erreur', async () => {
        state.tasks = [{ id: 99 }];
        SupabaseTasks.getMyTasks.mockResolvedValue({ data: null, error: { message: 'DB error' } });

        await loadTasksFromApi();

        expect(state.tasks).toEqual([{ id: 99 }]);
    });

    it('ne plante pas si getMyTasks lève une exception', async () => {
        SupabaseTasks.getMyTasks.mockRejectedValue(new Error('Network error'));

        await expect(loadTasksFromApi()).resolves.toBeUndefined();
    });

    it('ignore les données non-tableau retournées par Supabase', async () => {
        SupabaseTasks.getMyTasks.mockResolvedValue({ data: null, error: null });

        await loadTasksFromApi();

        // state.tasks ne doit pas être écrasé par null
        expect(Array.isArray(state.tasks)).toBe(true);
    });

    it('PBT: round-trip — n tâches quelconques sont bien stockées dans state.tasks', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(
                    fc.record({
                        id: fc.integer({ min: 1, max: 9999 }),
                        title: fc.string({ minLength: 1, maxLength: 50 }),
                        status: fc.constantFrom('pending', 'approved', 'rejected'),
                        points: fc.integer({ min: 0, max: 100 }),
                    }),
                    { maxLength: 20 }
                ),
                async tasks => {
                    SupabaseTasks.getMyTasks.mockResolvedValue({ data: tasks, error: null });
                    state.tasks = [];

                    await loadTasksFromApi();

                    return (
                        state.tasks.length === tasks.length &&
                        state.tasks.every((t, i) => t.id === tasks[i].id)
                    );
                }
            ),
            { numRuns: 50 }
        );
    });
});
