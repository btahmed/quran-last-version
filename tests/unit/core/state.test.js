import { describe, it, expect, beforeEach } from 'vitest';
import { state, loadData, saveData, getDefaultMemorizationData } from '../../../frontend/src/core/state.js';

describe('state', () => {
    beforeEach(() => {
        localStorage.clear();
        // Remettre state à ses valeurs par défaut
        state.tasks = [];
        state.memorizationData = [];
        state.settings = { dailyGoal: 5, theme: 'light', notifications: true, ayahDelay: 0, autoPlayNext: true, userName: '' };
        state.hifz = { currentSession: null, level: 1 };
        state.competition = {};
        state.user = null;
    });

    // ─── getDefaultMemorizationData ──────────────────────────────────────────

    describe('getDefaultMemorizationData', () => {
        it('retourne un tableau non vide', () => {
            const data = getDefaultMemorizationData();
            expect(Array.isArray(data)).toBe(true);
            expect(data.length).toBeGreaterThan(0);
        });

        it('chaque entrée a les champs obligatoires', () => {
            const data = getDefaultMemorizationData();
            for (const item of data) {
                expect(item).toHaveProperty('id');
                expect(item).toHaveProperty('surahId');
                expect(item).toHaveProperty('surahName');
                expect(item).toHaveProperty('fromAyah');
                expect(item).toHaveProperty('toAyah');
                expect(item).toHaveProperty('status');
                expect(item).toHaveProperty('reviewCount');
            }
        });

        it('les surahId sont dans la plage [1, 114]', () => {
            const data = getDefaultMemorizationData();
            for (const item of data) {
                expect(item.surahId).toBeGreaterThanOrEqual(1);
                expect(item.surahId).toBeLessThanOrEqual(114);
            }
        });

        it('les statuts sont valides', () => {
            const validStatuses = ['mastered', 'weak', 'new', 'learning', 'review'];
            const data = getDefaultMemorizationData();
            for (const item of data) {
                expect(validStatuses).toContain(item.status);
            }
        });

        it('idempotent : deux appels retournent des données équivalentes', () => {
            const a = getDefaultMemorizationData();
            const b = getDefaultMemorizationData();
            expect(JSON.stringify(a)).toBe(JSON.stringify(b));
        });
    });

    // ─── saveData / loadData round-trip ──────────────────────────────────────

    describe('saveData / loadData', () => {
        it('saveData écrit les settings dans localStorage', () => {
            state.settings.dailyGoal = 10;
            saveData();
            const raw = localStorage.getItem('quranreview_settings');
            expect(raw).not.toBeNull();
            const parsed = JSON.parse(raw);
            expect(parsed.dailyGoal).toBe(10);
        });

        it('loadData restaure les settings depuis localStorage', () => {
            state.settings.dailyGoal = 15;
            state.settings.theme = 'dark';
            saveData();

            state.settings.dailyGoal = 0;
            state.settings.theme = 'light';
            loadData();

            expect(state.settings.dailyGoal).toBe(15);
            expect(state.settings.theme).toBe('dark');
        });

        it('loadData restaure les tâches depuis localStorage (quranreview_tasks)', () => {
            // Design intentionnel : saveData() ne sauvegarde PAS les tâches.
            // Les tâches viennent de Supabase — c'est loadTasksFromApi() dans tasks.js
            // qui écrit directement localStorage après chaque fetch réussi.
            // saveData() ne gère que les données locales (settings, memorizationData…).
            const tasks = [{ id: 'task-1', title: 'Mémoriser Al-Fatiha' }];
            localStorage.setItem('quranreview_tasks', JSON.stringify(tasks));

            state.tasks = [];
            loadData();

            expect(state.tasks).toHaveLength(1);
            expect(state.tasks[0].id).toBe('task-1');
        });

        it('loadData utilise les defaults si localStorage vide', () => {
            localStorage.clear();
            loadData();
            expect(state.settings.dailyGoal).toBe(5);
            expect(Array.isArray(state.memorizationData)).toBe(true);
            expect(state.memorizationData.length).toBeGreaterThan(0);
        });

        it('loadData résiste à un JSON invalide en localStorage', () => {
            localStorage.setItem('quranreview_settings', 'INVALID_JSON{{{');
            expect(() => loadData()).not.toThrow();
            // Doit utiliser les defaults
            expect(state.settings.dailyGoal).toBe(5);
        });
    });
});
