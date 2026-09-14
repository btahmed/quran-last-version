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
        importText: '',
        importError: null,
        copied: false,
        ranges: [], // Ensure ranges is initialized
    };
    return tracker;
}

describe('RevisionPage — sélection exacte des Juz', () => {
    it('sélectionne uniquement la plage du Juz 1', () => {
        const tracker = makeTracker();

        tracker.wizToggleJuz(1);

        // Tracker state should contain the two hizbs that make up juz 1
        const hizb1 = HIZB_DATA.find(h => h.num === 1);
        const hizb2 = HIZB_DATA.find(h => h.num === 2);

        expect(tracker.state.wiz.ranges).toContainEqual({
            from: hizb1.from,
            to: hizb1.to,
            label: hizb1.label,
            type: 'hizb',
        });
        expect(tracker.state.wiz.ranges).toContainEqual({
            from: hizb2.from,
            to: hizb2.to,
            label: hizb2.label,
            type: 'hizb',
        });

        expect(tracker.juzSelectionState(1)).toBe('all');
        expect(tracker.juzSelectionState(2)).toBe('none');
    });

    it('sélectionne aussi une plage exacte pour un Hizb', () => {
        const tracker = makeTracker();

        // `wizToggleHizb` doesn't exist on tracker, but `wizToggleRange` does
        // It selects a hizb which gets added to the ranges.
        tracker.wizToggleRange(HIZB_DATA[0].from, HIZB_DATA[0].to, HIZB_DATA[0].label, 'hizb');

        // Need to adapt test expectations to the ranges list instead of selectedRanges Map
        // since RevisionPage refactored to use `ranges` array
        expect(tracker.state.wiz.ranges).toContainEqual({
            from: HIZB_DATA[0].from,
            to: HIZB_DATA[0].to,
            label: HIZB_DATA[0].label,
            type: 'hizb',
        });
        expect(tracker.juzSelectionState(1)).toBe('partial');
    });
});
