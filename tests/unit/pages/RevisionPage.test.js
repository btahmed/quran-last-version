import { describe, expect, it } from 'vitest';
import { HIZB_DATA, JUZ_DATA, MurajaaTracker } from '../../../frontend/src/pages/RevisionPage.js';

function makeTracker() {
    const tracker = new MurajaaTracker(document.createElement('div'));
    tracker.state.wiz = {
        ranges: [],
        mode: 'build',
        expandedJuz: new Set(),
        expandedHizb: new Set(),
        selected: new Set(),
        selectedRanges: new Map(),
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
        // Fix: ranges replaces selectedRanges
        expect(tracker.state.wiz.ranges.find(r => r.from === 1 && r.to === 21)).toBeUndefined();
        expect(tracker.state.wiz.ranges).toEqual([
            { from: 1, to: 11, label: 'الحزب ١', type: 'hizb' },
            { from: 12, to: 21, label: 'الحزب ٢', type: 'hizb' },
        ]);
    });
});
