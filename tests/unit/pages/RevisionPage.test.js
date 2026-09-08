import { describe, expect, it } from 'vitest';
import { HIZB_DATA, MurajaaTracker } from '../../../frontend/src/pages/RevisionPage.js';

function makeTracker() {
    const tracker = new MurajaaTracker(document.createElement('div'));
    tracker.state.wiz = {
        mode: 'build',
        ranges: [],
        lang: 'ar',
    };
    // Mock the update function since we are testing state changes outside of DOM environment.
    tracker.update = () => {};
    return tracker;
}

describe('RevisionPage — sélection exacte des Juz', () => {
    it('sélectionne uniquement la plage du Juz 1', () => {
        const tracker = makeTracker();

        tracker.wizToggleJuz(1);

        expect(tracker.state.wiz.ranges.length).toBe(2); // Juz 1 has 2 hizbs
        expect(tracker.juzSelectionState(1)).toBe('all');
        expect(tracker.juzSelectionState(2)).toBe('none');

        const ranges = tracker.buildRangesFromSelected();
        expect(ranges).toEqual([
            { label: 'الحزب ١', from: 1, to: 11 },
            { label: 'الحزب ٢', from: 12, to: 21 },
        ]);
    });

    it('sélectionne aussi une plage exacte pour un Hizb', () => {
        const tracker = makeTracker();

        tracker.wizToggleRange(HIZB_DATA[0].from, HIZB_DATA[0].to, HIZB_DATA[0].label, 'hizb');

        expect(tracker.state.wiz.ranges).toEqual([
            {
                label: HIZB_DATA[0].label,
                from: HIZB_DATA[0].from,
                to: HIZB_DATA[0].to,
                type: 'hizb',
            },
        ]);
        expect(tracker.juzSelectionState(1)).toBe('partial');

        const ranges = tracker.buildRangesFromSelected();
        expect(ranges).toEqual([
            {
                label: HIZB_DATA[0].label,
                from: HIZB_DATA[0].from,
                to: HIZB_DATA[0].to,
            },
        ]);
    });
});
