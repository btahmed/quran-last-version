import { describe, expect, it } from 'vitest';
import { HIZB_DATA, JUZ_DATA, MurajaaTracker } from '../../../frontend/src/pages/RevisionPage.js';

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
    };
    return tracker;
}

describe('RevisionPage — sélection exacte des Juz', () => {
    it('sélectionne uniquement la plage du Juz 1', () => {
        const tracker = makeTracker();

        tracker.wizToggleJuz(1);

        expect(tracker.state.wiz.selected).toEqual(new Set());
        expect(tracker.state.wiz.selectedRanges.get('juz:1')).toEqual({
            label: JUZ_DATA[0].label,
            from: 1,
            to: 21,
        });
        expect(tracker.juzCheckState(1)).toBe('all');
        expect(tracker.juzCheckState(2)).toBe('none');
        expect(tracker.hizbCheckState(1)).toBe('all');
        expect(tracker.hizbCheckState(2)).toBe('all');
        expect(tracker.buildRangesFromSelected()).toEqual([
            { label: JUZ_DATA[0].label, from: 1, to: 21 },
        ]);
    });

    it('sélectionne aussi une plage exacte pour un Hizb', () => {
        const tracker = makeTracker();

        tracker.wizToggleHizb(1);

        expect(tracker.state.wiz.selectedRanges.get('hizb:1')).toEqual({
            label: HIZB_DATA[0].label,
            from: HIZB_DATA[0].from,
            to: HIZB_DATA[0].to,
        });
        expect(tracker.juzCheckState(1)).toBe('partial');
        expect(tracker.buildRangesFromSelected()).toEqual([
            {
                label: HIZB_DATA[0].label,
                from: HIZB_DATA[0].from,
                to: HIZB_DATA[0].to,
            },
        ]);
    });
});
