import { describe, expect, it } from 'vitest';
import { HIZB_DATA, JUZ_DATA, MurajaaTracker } from '../../../frontend/src/pages/RevisionPage.js';

function makeTracker() {
    const tracker = new MurajaaTracker(document.createElement('div'));
    tracker.update = () => {};
    tracker.state.wiz = {
        mode: 'build',
        ranges: [],
        tab: 'new',
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

        expect(tracker.juzSelectionState(1)).toBe('all');
        expect(tracker.juzSelectionState(2)).toBe('none');
    });

    it('sélectionne aussi une plage exacte pour un Hizb', () => {
        const tracker = makeTracker();

        tracker.wizToggleRange(1, 11, HIZB_DATA[0].label, 'hizb');

        expect(tracker.juzSelectionState(1)).toBe('partial');
    });
});
