import { describe, expect, it } from 'vitest';
import { HIZB_DATA, JUZ_DATA, MurajaaTracker } from '../../../frontend/src/pages/RevisionPage.js';

function makeTracker() {
    const tracker = new MurajaaTracker(document.createElement('div'));
    tracker.update = () => {};
    tracker.render = () => '';
    tracker.state.wiz = {
        tab: 'select',
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

        tracker.wizToggleRange(1, 21, JUZ_DATA[0].label, 'juz');

        expect(tracker.isRangeSelected(1, 21)).toBe(true);
        expect(tracker.juzSelectionState(2)).toBe('none');
        expect(tracker.buildRangesFromSelected()).toEqual([
            { label: JUZ_DATA[0].label, from: 1, to: 21 },
        ]);
    });

    it('sélectionne aussi une plage exacte pour un Hizb', () => {
        const tracker = makeTracker();

        tracker.wizToggleRange(HIZB_DATA[0].from, HIZB_DATA[0].to, HIZB_DATA[0].label, 'hizb');

        expect(tracker.isRangeSelected(HIZB_DATA[0].from, HIZB_DATA[0].to)).toBe(true);
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
