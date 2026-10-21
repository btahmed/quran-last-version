import { describe, expect, it } from 'vitest';
import { HIZB_DATA, MurajaaTracker } from '../../../frontend/src/pages/RevisionPage.js';

function makeTracker() {
    const tracker = new MurajaaTracker(document.createElement('div'));
    tracker.state.wiz = {
        mode: 'build',
        expandedJuz: new Set(),
        expandedHizb: new Set(),
        selected: new Set(),
        ranges: [],
        importText: '',
        importError: null,
        copied: false,
    };
    tracker.update = () => {}; // mock update to avoid dom issues
    return tracker;
}

describe('RevisionPage — sélection exacte des Juz', () => {
    it('sélectionne uniquement la plage du Juz 1', () => {
        const tracker = makeTracker();
        tracker.update = () => {}; // mock update method

        tracker.wizToggleJuz(1);

        expect(tracker.juzSelectionState(1)).toBe('all');
        expect(tracker.juzSelectionState(2)).toBe('none');
        expect(tracker.state.wiz.ranges.length).toBe(2); // Juz 1 has 2 hizbs
    });

    it('sélectionne aussi une plage exacte pour un Hizb', () => {
        const tracker = makeTracker();

        tracker.wizToggleRange(HIZB_DATA[0].from, HIZB_DATA[0].to, HIZB_DATA[0].label, 'hizb');

        expect(tracker.state.wiz.ranges).toEqual([
            {
                from: HIZB_DATA[0].from,
                to: HIZB_DATA[0].to,
                label: HIZB_DATA[0].label,
                type: 'hizb',
            },
        ]);
        expect(tracker.juzSelectionState(1)).toBe('partial');
    });
});
