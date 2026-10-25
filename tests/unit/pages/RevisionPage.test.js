import { describe, expect, it } from 'vitest';
import { HIZB_DATA, MurajaaTracker } from '../../../frontend/src/pages/RevisionPage.js';

function makeTracker() {
    const tracker = new MurajaaTracker(document.createElement('div'));
    tracker.state.wiz = {
        mode: 'build',
        expandedJuz: new Set(),
        expandedHizb: new Set(),
        selected: new Set(),
        selectedRanges: new Map(),
        ranges: [], // added fix
        tab: 'build', // added fix
        importText: '',
        importError: null,
        copied: false,
    };
    // Dummy update method to prevent runtime errors
    tracker.update = () => {};
    // Ensure render is handled
    tracker.render = () => '';
    return tracker;
}

describe('RevisionPage — sélection exacte des Juz', () => {
    it('sélectionne uniquement la plage du Juz 1', () => {
        const tracker = makeTracker();

        tracker.wizToggleJuz(1);

        expect(tracker.state.wiz.selected).toEqual(new Set());
        // In the current codebase, wizToggleJuz pushes directly to tracker.state.wiz.ranges
        expect(tracker.state.wiz.ranges).toEqual([
            { label: 'الحزب ١', from: 1, to: 11, type: 'hizb' },
            { label: 'الحزب ٢', from: 12, to: 21, type: 'hizb' }
        ]);
    });

    it('sélectionne aussi une plage exacte pour un Hizb', () => {
        const tracker = makeTracker();

        tracker.wizToggleRange(HIZB_DATA[0].from, HIZB_DATA[0].to, HIZB_DATA[0].label, 'hizb');

        expect(tracker.state.wiz.ranges).toEqual([
            { label: HIZB_DATA[0].label, from: HIZB_DATA[0].from, to: HIZB_DATA[0].to, type: 'hizb' },
        ]);
    });
});
