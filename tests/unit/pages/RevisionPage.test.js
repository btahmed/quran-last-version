import { describe, expect, it } from 'vitest';
import { HIZB_DATA, MurajaaTracker } from '../../../frontend/src/pages/RevisionPage.js';

function makeTracker() {
    const tracker = new MurajaaTracker(document.createElement('div'));
    tracker.update = () => {}; // mock update to avoid dom errors
    tracker.state.wiz = {
        mode: 'build',
        ranges: [], // Need this for isRangeSelected to work
        tab: 'juz',
        wheelAngle: 0,
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

        // state.wiz.ranges now hold the selected hizbs when you toggle a juz
        expect(tracker.state.wiz.ranges.length).toBeGreaterThan(0);
        expect(tracker.juzSelectionState(1)).toBe('all');
        expect(tracker.juzSelectionState(2)).toBe('none');
    });

    it('sélectionne aussi une plage exacte pour un Hizb', () => {
        const tracker = makeTracker();

        // The actual method in RevisionPage.js for toggling ranges is wizToggleRange
        // Since wizToggleHizb doesn't exist, we use the method that handles generic toggles
        tracker.wizToggleRange(HIZB_DATA[0].from, HIZB_DATA[0].to, HIZB_DATA[0].label, 'hizb');

        expect(tracker.state.wiz.ranges.length).toBe(1);
        expect(tracker.state.wiz.ranges[0]).toEqual({
            from: HIZB_DATA[0].from,
            to: HIZB_DATA[0].to,
            label: HIZB_DATA[0].label,
            type: 'hizb',
        });
        expect(tracker.juzSelectionState(1)).toBe('partial');
    });
});
