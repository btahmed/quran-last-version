import { describe, it, expect } from 'vitest';
import { sanitizeText, sanitizeHtml, escapeHtml } from '../../../frontend/src/core/sanitize.js';

describe('sanitize', () => {
    // ─── sanitizeText ─────────────────────────────────────────────────────────
    describe('sanitizeText', () => {
        it('retourne du texte brut sans balises', () => {
            expect(sanitizeText('<script>alert(1)</script>')).not.toContain('<script>');
        });
        it('échappe les caractères spéciaux HTML', () => {
            const result = sanitizeText('<b>bold</b>');
            expect(result).toContain('&lt;b&gt;');
        });
        it('gère null/undefined sans planter', () => {
            expect(() => sanitizeText(null)).not.toThrow();
            expect(() => sanitizeText(undefined)).not.toThrow();
        });
        it('convertit les nombres en chaîne', () => {
            expect(sanitizeText(42)).toBe('42');
        });
        it('préserve le texte arabe', () => {
            expect(sanitizeText('مراجعة القرآن')).toContain('مراجعة القرآن');
        });
    });

    // ─── sanitizeHtml ─────────────────────────────────────────────────────────
    describe('sanitizeHtml', () => {
        it('conserve <b>', () => {
            const result = sanitizeHtml('<b>gras</b>');
            expect(result).toContain('<b>');
        });
        it('conserve <strong>', () => {
            expect(sanitizeHtml('<strong>important</strong>')).toContain('<strong>');
        });
        it('conserve <em>', () => {
            expect(sanitizeHtml('<em>em</em>')).toContain('<em>');
        });
        it('supprime <script>', () => {
            const result = sanitizeHtml('<script>alert(1)</script>');
            expect(result).not.toContain('<script>');
        });
        it('supprime <img> et préserve son texte', () => {
            const result = sanitizeHtml('<img src="x" onerror="alert(1)">');
            expect(result).not.toContain('<img');
            expect(result).not.toContain('onerror');
        });
        it('supprime les attributs onclick sur les balises autorisées', () => {
            const result = sanitizeHtml('<b onclick="alert(1)">text</b>');
            expect(result).not.toContain('onclick');
            expect(result).toContain('<b>');
        });
        it('gère null/undefined sans planter', () => {
            expect(() => sanitizeHtml(null)).not.toThrow();
        });
    });

    // ─── escapeHtml ───────────────────────────────────────────────────────────
    describe('escapeHtml', () => {
        it('échappe &', () => expect(escapeHtml('a & b')).toBe('a &amp; b'));
        it('échappe <', () => expect(escapeHtml('<div>')).toBe('&lt;div&gt;'));
        it('échappe "', () => expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;'));
        it("échappe '", () => expect(escapeHtml("it's")).toBe('it&#039;s'));
        it('retourne une chaîne vide pour null', () => expect(escapeHtml(null)).toBe(''));
        it('convertit les nombres', () => expect(escapeHtml(42)).toBe('42'));
        it('ne modifie pas le texte sans caractères spéciaux', () => {
            expect(escapeHtml('bonjour')).toBe('bonjour');
        });
    });
});
