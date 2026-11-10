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
        ranges: [],
        tab: 'new',
    };
    tracker.update = () => {};
    tracker.render = () => '';
    return tracker;
}

describe('RevisionPage — sélection exacte des Juz', () => {
    it('sélectionne uniquement la plage du Juz 1', () => {
        const tracker = makeTracker();

        tracker.wizToggleJuz(1);

        expect(tracker.state.wiz.ranges).toEqual([
            {
                from: 1,
                label: 'الحزب ١',
                to: 11,
                type: 'hizb',
            },
            {
                from: 12,
                label: 'الحزب ٢',
                to: 21,
                type: 'hizb',
            },
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
    });
});
