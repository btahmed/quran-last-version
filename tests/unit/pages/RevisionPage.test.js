import { describe, expect, it } from 'vitest';
import { HIZB_DATA, JUZ_DATA, MurajaaTracker } from '../../../frontend/src/pages/RevisionPage.js';

function makeTracker() {
    const tracker = new MurajaaTracker(document.createElement('div'));
    tracker.state.wiz = {
        mode: 'build',
        expandedJuz: new Set(),
        expandedHizb: new Set(),
        selected: new Set(),
        selectedRanges: new Map(),
        ranges: [],
        importText: '',
        importError: null,
        copied: false,
    };
    return tracker;
}

describe('RevisionPage — sélection exacte des Juz', () => {
    it('sélectionne uniquement la plage du Juz 1', () => {
        const tracker = makeTracker();

        tracker.wizToggleJuz(1);

        expect(tracker.state.wiz.selected).toEqual(new Set());
        // JUZ 1 actually spans multiple hizbs.
        // Let's test what it effectively selected:
        const juz1Hizbs = HIZB_DATA.filter(h => h.juzNum === 1);
        for (const h of juz1Hizbs) {
            expect(tracker.state.wiz.ranges.some(r => r.from === h.from && r.to === h.to)).toBe(
                true
            );
        }
        expect(tracker.juzSelectionState(1)).toBe('all');
        expect(tracker.juzSelectionState(2)).toBe('none');
    });
});
