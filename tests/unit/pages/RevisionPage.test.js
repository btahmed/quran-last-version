import { describe, expect, it } from 'vitest';
import { HIZB_DATA, MurajaaTracker } from '../../../frontend/src/pages/RevisionPage.js';

function makeTracker() {
    const tracker = new MurajaaTracker(document.createElement('div'));
    tracker.state.wiz = {
        mode: 'build',
        expandedJuz: new Set(),
        expandedHizb: new Set(),
        ranges: [],
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
        expect(
            tracker.state.wiz.ranges.find(r => r.type === 'hizb' && r.from === 1 && r.to === 11)
        ).toBeDefined();
        expect(tracker.juzSelectionState(1)).toBe('all');
        expect(tracker.juzSelectionState(2)).toBe('none');
        expect(tracker.buildRangesFromSelected()).toEqual([
            { label: 'الحزب ١', from: 1, to: 11 },
            { label: 'الحزب ٢', from: 12, to: 21 },
        ]);
    });

    it('sélectionne aussi une plage exacte pour un Hizb', () => {
        const tracker = makeTracker();

        tracker.wizToggleHizb(1);

        expect(
            tracker.state.wiz.ranges.find(
                r => r.type === 'hizb' && r.from === HIZB_DATA[0].from && r.to === HIZB_DATA[0].to
            )
        ).toBeDefined();
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
