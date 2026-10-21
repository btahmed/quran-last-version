import { describe, expect, it } from 'vitest';
import { HIZB_DATA, MurajaaTracker } from '../../../frontend/src/pages/RevisionPage.js';

function makeTracker() {
    const tracker = new MurajaaTracker(document.createElement('div'));
    tracker.state.wiz = {
        mode: 'build',
        expandedJuz: new Set(),
        expandedHizb: new Set(),
        selected: new Set(),
        selectedRanges: new Map(),
        ranges: [], // Ensure ranges is initialized
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

        expect(tracker.juzSelectionState(1)).toBe('all');
        expect(tracker.juzSelectionState(2)).toBe('none');

        // Check if ranges are properly added
        const hizbsInJuz1 = HIZB_DATA.filter(h => h.juzNum === 1);
        expect(tracker.state.wiz.ranges.length).toBe(hizbsInJuz1.length);

        expect(tracker.buildRangesFromSelected()).toEqual([
            { label: 'الحزب ١', from: 1, to: 11 },
            { label: 'الحزب ٢', from: 12, to: 21 },
        ]);
    });

    it('sélectionne aussi une plage exacte pour un Hizb', () => {
        const tracker = makeTracker();

        tracker.wizToggleRange(HIZB_DATA[0].from, HIZB_DATA[0].to, HIZB_DATA[0].label, 'hizb');

        // Check if the range was added to `ranges` instead of `selectedRanges`
        expect(tracker.state.wiz.ranges).toEqual([
            {
                from: HIZB_DATA[0].from,
                to: HIZB_DATA[0].to,
                label: HIZB_DATA[0].label,
                type: 'hizb',
            },
        ]);

        expect(tracker.juzSelectionState(1)).toBe('partial');

        expect(tracker.buildRangesFromSelected()).toEqual([
            {
                label: HIZB_DATA[0].label,
                from: HIZB_DATA[0].from,
                to: HIZB_DATA[0].to,
            },
        ]);
    });
});
