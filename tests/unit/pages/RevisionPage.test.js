import { describe, expect, it } from 'vitest';
import { HIZB_DATA, JUZ_DATA, MurajaaTracker } from '../../../frontend/src/pages/RevisionPage.js';

function makeTracker() {
    const tracker = new MurajaaTracker(document.createElement('div'));
    tracker.state.wiz = {
        mode: 'build',
        tab: 'juz',
        ranges: [],
        expandedJuz: new Set(),
        expandedHizb: new Set(),
        selected: new Set(),
        selectedRanges: new Map(),
        importText: '',
        importError: null,
        copied: false,
    };
    tracker.update = function () {};
    tracker.render = function () {
        return '';
    };
    return tracker;
}

describe('RevisionPage — sélection exacte des Juz', () => {
    it('sélectionne uniquement la plage du Juz 1', () => {
        const tracker = makeTracker();

        tracker.wizToggleRange(1, 21, JUZ_DATA[0].label, 'juz'); // from, to, label, type (or rtype)

        const found = tracker.state.wiz.ranges.find(r => r.from === 1 && r.to === 21);
        expect(found).toBeDefined();
    });

    it('sélectionne aussi une plage exacte pour un Hizb', () => {
        const tracker = makeTracker();

        tracker.wizToggleRange(1, 11, HIZB_DATA[0].label, 'hizb');

        const found = tracker.state.wiz.ranges.find(r => r.from === 1 && r.to === 11);
        expect(found).toBeDefined();
    });
});
