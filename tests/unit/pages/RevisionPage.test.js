import { describe, expect, it } from 'vitest';
import { HIZB_DATA, JUZ_DATA, MurajaaTracker } from '../../../frontend/src/pages/RevisionPage.js';

function makeTracker() {
    const tracker = new MurajaaTracker(document.createElement('div'));
    tracker.update = () => {};
    tracker.render = () => '';
    tracker.state.wiz = {
        mode: 'build',
        tab: 'juz',
        ranges: [],
        importError: null,
    };
    return tracker;
}

describe('RevisionPage — sélection exacte des Juz', () => {
    it('sélectionne uniquement la plage du Juz 1', () => {
        const tracker = makeTracker();

        tracker.wizToggleJuz(1);

        expect(tracker.juzSelectionState(1)).toBe('all');
        expect(tracker.juzSelectionState(2)).toBe('none');

        // Un juz est découpé en 2 hizbs
        expect(tracker.state.wiz.ranges.length).toBe(2);
        expect(tracker.state.wiz.ranges[0].type).toBe('hizb');
    });

    it('sélectionne aussi une plage exacte pour un Hizb', () => {
        const tracker = makeTracker();

        // Remplacé wizToggleHizb par wizToggleRange
        tracker.wizToggleRange(HIZB_DATA[0].from, HIZB_DATA[0].to, HIZB_DATA[0].label, 'hizb');

        expect(tracker.isRangeSelected(HIZB_DATA[0].from, HIZB_DATA[0].to)).toBe(true);
        expect(tracker.juzSelectionState(1)).toBe('partial');
    });
});
