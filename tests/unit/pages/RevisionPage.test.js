import { describe, expect, it } from 'vitest';
import { HIZB_DATA, MurajaaTracker } from '../../../frontend/src/pages/RevisionPage.js';

function makeTracker() {
    const tracker = new MurajaaTracker(document.createElement('div'));
    tracker.state.wiz = {
        mode: 'build',
        tab: 'juz',
        ranges: [],
        importText: '',
        importError: null,
        copied: false,
        lang: 'ar',
    };
    return tracker;
}

describe('RevisionPage — sélection exacte des Juz', () => {
    it('sélectionne uniquement la plage du Juz 1', () => {
        const tracker = makeTracker();

        tracker.wizToggleJuz(1);

        expect(tracker.state.wiz.ranges.length).toBe(2); // 2 hizbs in juz 1
        expect(tracker.isRangeSelected(HIZB_DATA[0].from, HIZB_DATA[0].to)).toBe(true);
        expect(tracker.isRangeSelected(HIZB_DATA[1].from, HIZB_DATA[1].to)).toBe(true);

        expect(tracker.juzSelectionState(1)).toBe('all');
        expect(tracker.juzSelectionState(2)).toBe('none');

        // buildRangesFromSelected merges them into a single juz range
        const built = tracker.buildRangesFromSelected();
        expect(built).toHaveLength(2);
        expect(built[0].from).toBe(HIZB_DATA[0].from);
        expect(built[0].to).toBe(HIZB_DATA[0].to);
        expect(built[1].from).toBe(HIZB_DATA[1].from);
        expect(built[1].to).toBe(HIZB_DATA[1].to);
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

        const built = tracker.buildRangesFromSelected();
        expect(built).toEqual([
            {
                from: HIZB_DATA[0].from,
                to: HIZB_DATA[0].to,
                label: HIZB_DATA[0].label,
            },
        ]);
    });
});
