import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

// Importer AudioPlayer.js qui expose window.QuranAudio comme effet de bord
import '../../../frontend/src/components/AudioPlayer.js';

describe('window.QuranAudio', () => {
    it('est défini après import du module', () => {
        expect(window.QuranAudio).toBeDefined();
        expect(typeof window.QuranAudio.surahAyahToGlobal).toBe('function');
        expect(typeof window.QuranAudio.getAyahAudioUrl).toBe('function');
        expect(typeof window.QuranAudio.getAudioUrl).toBe('function');
    });

    // ─── surahAyahToGlobal ────────────────────────────────────────────────────

    describe('surahAyahToGlobal', () => {
        it('encode sourate 1 verset 1 → 1001', () => {
            expect(window.QuranAudio.surahAyahToGlobal(1, 1)).toBe(1001);
        });

        it('encode sourate 2 verset 255 → 2255', () => {
            expect(window.QuranAudio.surahAyahToGlobal(2, 255)).toBe(2255);
        });

        it('encode sourate 114 verset 6 → 114006', () => {
            expect(window.QuranAudio.surahAyahToGlobal(114, 6)).toBe(114006);
        });
    });

    // ─── PBT : encode → decode round-trip ────────────────────────────────────

    describe('PBT — encode/decode round-trip', () => {
        it('surahAyahToGlobal puis décodage retrouve surahId et ayah (100 runs)', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 1, max: 114 }), // surahId
                    fc.integer({ min: 1, max: 286 }), // ayah (max Al-Baqarah)
                    (surahId, ayah) => {
                        const encoded = window.QuranAudio.surahAyahToGlobal(surahId, ayah);
                        const decodedSurah = Math.floor(encoded / 1000);
                        const decodedAyah = encoded % 1000;
                        return decodedSurah === surahId && decodedAyah === ayah;
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    // ─── getAyahAudioUrl ─────────────────────────────────────────────────────

    describe('getAyahAudioUrl', () => {
        it('retourne une URL EveryAyah avec padding sur 3 chiffres', () => {
            const encoded = window.QuranAudio.surahAyahToGlobal(1, 1);
            const url = window.QuranAudio.getAyahAudioUrl(encoded);
            expect(url).toContain('everyayah.com');
            expect(url).toContain('001001.mp3');
        });

        it('URL sourate 114 verset 6', () => {
            const encoded = window.QuranAudio.surahAyahToGlobal(114, 6);
            const url = window.QuranAudio.getAyahAudioUrl(encoded);
            expect(url).toContain('114006.mp3');
        });

        it('URL contient la qualité par défaut 128kbps', () => {
            const encoded = window.QuranAudio.surahAyahToGlobal(2, 255);
            const url = window.QuranAudio.getAyahAudioUrl(encoded);
            expect(url).toContain('Alafasy_128kbps');
        });
    });

    // ─── getAudioUrl (sourate complète) ──────────────────────────────────────

    describe('getAudioUrl', () => {
        it('retourne une URL QuranicAudio avec padding 3 chiffres', () => {
            const url = window.QuranAudio.getAudioUrl(1);
            expect(url).toContain('download.quranicaudio.com');
            expect(url).toContain('001.mp3');
        });

        it('PBT — URL sourate contient le numéro paddé pour toute sourate [1-114]', () => {
            fc.assert(
                fc.property(fc.integer({ min: 1, max: 114 }), surahId => {
                    const url = window.QuranAudio.getAudioUrl(surahId);
                    const expected = String(surahId).padStart(3, '0');
                    return url.includes(`${expected}.mp3`);
                }),
                { numRuns: 114 }
            );
        });
    });
});
