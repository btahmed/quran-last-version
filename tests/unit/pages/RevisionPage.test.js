import { describe, expect, it, vi } from 'vitest';
import { HIZB_DATA, MurajaaTracker } from '../../../frontend/src/pages/RevisionPage.js';

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
        tracker.update = vi.fn(); // mock update to avoid DOM errors

        tracker.wizToggleJuz(1);

        expect(tracker.state.wiz.ranges.length).toBeGreaterThan(0);
        // buildRangesFromSelected returns contiguous pieces because we use mergeRanges(sorted, false)
        // Juz 1 -> Hizb 1 (1-11) and Hizb 2 (12-21). mergeAdjacent=false keeps them split,
        // so we check that the full range covers from 1 to 21 across both.
        const ranges = tracker.buildRangesFromSelected();
        expect(ranges[0].from).toBe(1);
        expect(ranges[ranges.length - 1].to).toBe(21);
    });

    it('sélectionne aussi une plage exacte pour un Hizb', () => {
        const tracker = makeTracker();
        tracker.update = vi.fn(); // mock update to avoid DOM errors

        tracker.wizToggleRange(HIZB_DATA[0].from, HIZB_DATA[0].to, HIZB_DATA[0].label, 'hizb');

        const ranges = tracker.buildRangesFromSelected();
        expect(ranges[0].from).toBe(HIZB_DATA[0].from);
        expect(ranges[0].to).toBe(HIZB_DATA[0].to);
    });
});
