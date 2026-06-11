import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { apiCache } from '../../../frontend/src/core/apiCache.js';

describe('apiCache', () => {
    beforeEach(() => {
        apiCache.clear();
        vi.useRealTimers();
    });

    // ─── get / set ───────────────────────────────────────────────────────────

    describe('get / set', () => {
        it('retourne null pour une clé absente', () => {
            expect(apiCache.get('inexistant')).toBeNull();
        });

        it('retrouve la valeur stockée', () => {
            apiCache.set('tasks', [1, 2, 3]);
            expect(apiCache.get('tasks')).toEqual([1, 2, 3]);
        });

        it('conserve la référence exacte de l\'objet stocké', () => {
            const data = { id: 1, name: 'test' };
            apiCache.set('my-students', data);
            expect(apiCache.get('my-students')).toBe(data);
        });

        it('écrase la valeur précédente pour la même clé', () => {
            apiCache.set('tasks', [1]);
            apiCache.set('tasks', [2, 3]);
            expect(apiCache.get('tasks')).toEqual([2, 3]);
        });
    });

    // ─── PBT : round-trip get(set(k, v)) ─────────────────────────────────────

    describe('PBT — round-trip', () => {
        it('get(set(k, v)) retourne v pour toute valeur et toute clé (100 runs)', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1, maxLength: 30 }),
                    fc.anything(),
                    (key, value) => {
                        apiCache.set(key, value);
                        const result = apiCache.get(key);
                        apiCache.clear();
                        return result === value; // référence exacte
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    // ─── TTL expiration ───────────────────────────────────────────────────────

    describe('TTL expiration', () => {
        it('retourne la valeur avant expiration (TTL points = 30s)', () => {
            vi.useFakeTimers();
            apiCache.set('points', { total: 100 });
            vi.advanceTimersByTime(10_000);
            expect(apiCache.get('points')).toEqual({ total: 100 });
        });

        it('retourne null après expiration (TTL points = 30s)', () => {
            vi.useFakeTimers();
            apiCache.set('points', { total: 100 });
            vi.advanceTimersByTime(31_000);
            expect(apiCache.get('points')).toBeNull();
        });

        it('retourne null après expiration (TTL tasks = 60s)', () => {
            vi.useFakeTimers();
            apiCache.set('tasks', []);
            vi.advanceTimersByTime(61_000);
            expect(apiCache.get('tasks')).toBeNull();
        });

        it('clé inconnue : TTL par défaut 60s', () => {
            vi.useFakeTimers();
            apiCache.set('custom-key', 'valeur');
            vi.advanceTimersByTime(59_000);
            expect(apiCache.get('custom-key')).toBe('valeur');
            vi.advanceTimersByTime(2_000);
            expect(apiCache.get('custom-key')).toBeNull();
        });
    });

    // ─── invalidate ──────────────────────────────────────────────────────────

    describe('invalidate', () => {
        it('supprime une entrée spécifique', () => {
            apiCache.set('tasks', []);
            apiCache.set('my-students', []);
            apiCache.invalidate('tasks');
            expect(apiCache.get('tasks')).toBeNull();
            expect(apiCache.get('my-students')).not.toBeNull();
        });

        it('supprime plusieurs entrées en un appel', () => {
            apiCache.set('tasks', []);
            apiCache.set('points', {});
            apiCache.invalidate('tasks', 'points');
            expect(apiCache.get('tasks')).toBeNull();
            expect(apiCache.get('points')).toBeNull();
        });

        it('n\'affecte pas les clés non mentionnées', () => {
            apiCache.set('tasks', [1]);
            apiCache.set('my-students', [2]);
            apiCache.invalidate('tasks');
            expect(apiCache.get('my-students')).toEqual([2]);
        });
    });

    // ─── clear ───────────────────────────────────────────────────────────────

    describe('clear', () => {
        it('vide toutes les entrées', () => {
            apiCache.set('tasks', [1]);
            apiCache.set('my-students', [2]);
            apiCache.set('points', {});
            apiCache.clear();
            expect(apiCache.get('tasks')).toBeNull();
            expect(apiCache.get('my-students')).toBeNull();
            expect(apiCache.get('points')).toBeNull();
        });

        it('idempotent : clear() deux fois ne génère pas d\'erreur', () => {
            apiCache.set('tasks', []);
            expect(() => { apiCache.clear(); apiCache.clear(); }).not.toThrow();
        });
    });

    // ─── limite MAX_ENTRIES ───────────────────────────────────────────────────

    describe('limite MAX_ENTRIES (50)', () => {
        it('évince les entrées les plus anciennes au-delà de 50', () => {
            for (let i = 0; i < 55; i++) {
                apiCache.set(`key-${i}`, i);
            }
            // Les 5 premières doivent être évincées
            expect(apiCache.get('key-0')).toBeNull();
            expect(apiCache.get('key-4')).toBeNull();
            // Les dernières doivent exister
            expect(apiCache.get('key-54')).toBe(54);
            expect(apiCache.get('key-50')).toBe(50);
        });
    });
});
