import { describe, it, expect } from 'vitest';
import { Validators } from '../../../frontend/src/core/validators.js';

describe('Validators', () => {
    // ─── surahId ──────────────────────────────────────────────────────────────
    describe('surahId', () => {
        it('accepte 1 (Al-Fatiha)', () => expect(Validators.surahId(1).valid).toBe(true));
        it('accepte 114 (An-Nas)', () => expect(Validators.surahId(114).valid).toBe(true));
        it('accepte une string numérique', () => expect(Validators.surahId('55').valid).toBe(true));
        it('rejette 0', () => expect(Validators.surahId(0).valid).toBe(false));
        it('rejette 115', () => expect(Validators.surahId(115).valid).toBe(false));
        it('rejette un décimal', () => expect(Validators.surahId(1.5).valid).toBe(false));
        it('rejette NaN', () => expect(Validators.surahId('abc').valid).toBe(false));
        it("le message d'erreur est en arabe", () => {
            expect(Validators.surahId(0).error).toMatch(/[؀-ۿ]/);
        });
    });

    // ─── ayahNumber ───────────────────────────────────────────────────────────
    describe('ayahNumber', () => {
        it('accepte 1', () => expect(Validators.ayahNumber(1).valid).toBe(true));
        it('accepte 286', () => expect(Validators.ayahNumber(286).valid).toBe(true));
        it('rejette 0', () => expect(Validators.ayahNumber(0).valid).toBe(false));
        it('rejette 287', () => expect(Validators.ayahNumber(287).valid).toBe(false));
    });

    // ─── username ─────────────────────────────────────────────────────────────
    describe('username', () => {
        it('accepte "ali"', () => expect(Validators.username('ali').valid).toBe(true));
        it('accepte 80 caractères', () =>
            expect(Validators.username('a'.repeat(80)).valid).toBe(true));
        it("rejette une chaîne d'1 caractère", () =>
            expect(Validators.username('a').valid).toBe(false));
        it('rejette 81 caractères', () =>
            expect(Validators.username('a'.repeat(81)).valid).toBe(false));
        it('rejette un type non-string', () => expect(Validators.username(42).valid).toBe(false));
        it('rejette une chaîne vide', () => expect(Validators.username('').valid).toBe(false));
        it('rejette des espaces seuls', () => expect(Validators.username('  ').valid).toBe(false));
    });

    // ─── email ────────────────────────────────────────────────────────────────
    describe('email', () => {
        it('accepte un email valide', () =>
            expect(Validators.email('user@example.com').valid).toBe(true));
        it('accepte un email avec sous-domaine', () =>
            expect(Validators.email('a@b.co.uk').valid).toBe(true));
        it('rejette sans @', () => expect(Validators.email('userexample.com').valid).toBe(false));
        it('rejette sans domaine', () => expect(Validators.email('user@').valid).toBe(false));
        it('rejette sans TLD', () => expect(Validators.email('user@domain').valid).toBe(false));
        it('rejette un type non-string', () => expect(Validators.email(null).valid).toBe(false));
    });

    // ─── role ─────────────────────────────────────────────────────────────────
    describe('role', () => {
        it('accepte student', () => expect(Validators.role('student').valid).toBe(true));
        it('accepte teacher', () => expect(Validators.role('teacher').valid).toBe(true));
        it('accepte admin', () => expect(Validators.role('admin').valid).toBe(true));
        it('rejette un rôle inconnu', () =>
            expect(Validators.role('superadmin').valid).toBe(false));
        it('rejette une chaîne vide', () => expect(Validators.role('').valid).toBe(false));
    });

    // ─── points ───────────────────────────────────────────────────────────────
    describe('points', () => {
        it('accepte 0', () => expect(Validators.points(0).valid).toBe(true));
        it('accepte 1000', () => expect(Validators.points(1000).valid).toBe(true));
        it('accepte -1000', () => expect(Validators.points(-1000).valid).toBe(true));
        it('rejette 1001', () => expect(Validators.points(1001).valid).toBe(false));
        it('rejette -1001', () => expect(Validators.points(-1001).valid).toBe(false));
        it('rejette un décimal', () => expect(Validators.points(10.5).valid).toBe(false));
    });

    // ─── text ─────────────────────────────────────────────────────────────────
    describe('text', () => {
        it('accepte une chaîne dans les limites', () => {
            expect(Validators.text('Bonjour', { minLen: 2, maxLen: 100 }).valid).toBe(true);
        });
        it('rejette en dessous du minLen', () => {
            expect(Validators.text('A', { minLen: 2, maxLen: 100 }).valid).toBe(false);
        });
        it('rejette au dessus du maxLen', () => {
            expect(Validators.text('A'.repeat(101), { minLen: 0, maxLen: 100 }).valid).toBe(false);
        });
        it('utilise les defaults (minLen=0, maxLen=500)', () => {
            expect(Validators.text('').valid).toBe(true);
            expect(Validators.text('A'.repeat(501)).valid).toBe(false);
        });
        it('rejette un type non-string', () => {
            expect(Validators.text(42).valid).toBe(false);
        });
    });
});
