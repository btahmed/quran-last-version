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
    return tracker;
}

describe('RevisionPage — sélection exacte des Juz', () => {
    it('sélectionne uniquement la plage du Juz 1', () => {
        const tracker = makeTracker();

        tracker.wizToggleJuz(1);

        expect(tracker.state.wiz.selected).toEqual(new Set());
        expect(tracker.state.wiz.ranges).toContainEqual({
            label: HIZB_DATA[0].label,
            from: HIZB_DATA[0].from,
            to: HIZB_DATA[0].to,
            type: 'hizb',
        });
        expect(tracker.state.wiz.ranges).toContainEqual({
            label: HIZB_DATA[1].label,
            from: HIZB_DATA[1].from,
            to: HIZB_DATA[1].to,
            type: 'hizb',
        });
        expect(tracker.juzSelectionState(1)).toBe('all');
        expect(tracker.juzSelectionState(2)).toBe('none');
        expect(tracker.isRangeSelected(HIZB_DATA[0].from, HIZB_DATA[0].to)).toBe(true);
        expect(tracker.isRangeSelected(HIZB_DATA[1].from, HIZB_DATA[1].to)).toBe(true);
        // buildRangesFromSelected merges adjacent ranges
        expect(tracker.buildRangesFromSelected()).toEqual([
            { label: HIZB_DATA[0].label, from: HIZB_DATA[0].from, to: HIZB_DATA[0].to },
            { label: HIZB_DATA[1].label, from: HIZB_DATA[1].from, to: HIZB_DATA[1].to },
        ]);
    });

    it('sélectionne aussi une plage exacte pour un Hizb', () => {
        const tracker = makeTracker();

        tracker.wizToggleRange(HIZB_DATA[0].from, HIZB_DATA[0].to, HIZB_DATA[0].label, 'hizb');

        expect(tracker.state.wiz.ranges).toContainEqual({
            label: HIZB_DATA[0].label,
            from: HIZB_DATA[0].from,
            to: HIZB_DATA[0].to,
            type: 'hizb',
        });
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
