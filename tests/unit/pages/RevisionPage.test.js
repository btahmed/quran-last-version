import { describe, expect, it } from 'vitest';
import { HIZB_DATA, JUZ_DATA, MurajaaTracker } from '../../../frontend/src/pages/RevisionPage.js';

function makeTracker() {
    const tracker = new MurajaaTracker(document.createElement('div'));
    tracker.state.wiz = {
        mode: 'build',
        tab: 'juz',
        lang: 'ar',
        ranges: [],
        importText: '',
        importError: null,
        copied: false,
    };
    // Mock update to avoid DOM errors in test
    tracker.update = () => {};
    return tracker;
}

describe('RevisionPage — sélection exacte des Juz', () => {
    it('sélectionne uniquement la plage du Juz 1', () => {
        const tracker = makeTracker();

        tracker.wizToggleJuz(1);

        const expectedHizbs = HIZB_DATA.filter(h => h.juzNum === 1).map(h => ({
            from: h.from,
            to: h.to,
            label: h.label,
            type: 'hizb',
        }));

        expect(tracker.state.wiz.ranges).toEqual(expectedHizbs);
        expect(tracker.juzSelectionState(1)).toBe('all');
        expect(tracker.juzSelectionState(2)).toBe('none');
    });

    it('sélectionne aussi une plage exacte pour un Hizb', () => {
        const tracker = makeTracker();

        tracker.wizToggleRange(HIZB_DATA[0].from, HIZB_DATA[0].to, HIZB_DATA[0].label, 'hizb');

        expect(tracker.state.wiz.ranges).toEqual([
            {
                label: HIZB_DATA[0].label,
                from: HIZB_DATA[0].from,
                to: HIZB_DATA[0].to,
                type: 'hizb',
            },
        ]);
        expect(tracker.juzSelectionState(1)).toBe('partial');
    });
});
