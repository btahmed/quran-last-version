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
        ranges: [],
        importText: '',
        importError: null,
        copied: false,
        tab: 'tables'
    };
    tracker.update = () => {};
    tracker.render = () => '';
    return tracker;
}

describe('RevisionPage — sélection exacte des Juz', () => {
    it('sélectionne uniquement la plage du Juz 1', () => {
        const tracker = makeTracker();

        tracker.wizToggleJuz(1);

        expect(tracker.state.wiz.ranges.length).toBeGreaterThan(0);
        expect(tracker.juzSelectionState(1)).toBe('all');
        expect(tracker.juzSelectionState(2)).toBe('none');
    });

    it('sélectionne aussi une plage exacte pour un Hizb', () => {
        const tracker = makeTracker();
        const hizb1 = HIZB_DATA[0];

        tracker.wizToggleRange(hizb1.from, hizb1.to, hizb1.label, 'hizb');

        expect(tracker.state.wiz.ranges).toContainEqual({
            from: hizb1.from,
            to: hizb1.to,
            label: hizb1.label,
            type: 'hizb'
        });
        expect(tracker.juzSelectionState(1)).toBe('partial');
    });
});
