const QuranAudio = require('../audio-config.js');
const assert = require('assert');

const testCases = [
    { surah: 1, ayah: 1, expected: 1 },
    { surah: 1, ayah: 7, expected: 7 },
    { surah: 2, ayah: 1, expected: 8 },
    { surah: 2, ayah: 286, expected: 293 },
    { surah: 3, ayah: 1, expected: 294 },
    { surah: 58, ayah: 22, expected: 5126 },
    { surah: 59, ayah: 1, expected: 5127 },
    { surah: 114, ayah: 1, expected: 6231 },
    { surah: 114, ayah: 6, expected: 6236 }
];

console.log('Running tests for QuranAudio.surahAyahToGlobal...');
let passed = 0;
let failed = 0;

testCases.forEach(tc => {
    try {
        const actual = QuranAudio.surahAyahToGlobal(tc.surah, tc.ayah);
        assert.strictEqual(actual, tc.expected, `Surah ${tc.surah}, Ayah ${tc.ayah}`);
        console.log(`✅ Pass: Surah ${tc.surah}, Ayah ${tc.ayah} -> ${actual}`);
        passed++;
    } catch (e) {
        console.error(`❌ Fail: ${e.message}. Expected ${tc.expected}, got ${QuranAudio.surahAyahToGlobal(tc.surah, tc.ayah)}`);
        failed++;
    }
});

console.log('\nRunning tests for QuranAudio.getSurahAyahRange...');
const rangeTestCases = [
    { surah: 1, expected: { start: 1, end: 7, total: 7 } },
    { surah: 2, expected: { start: 8, end: 293, total: 286 } },
    { surah: 114, expected: { start: 6231, end: 6236, total: 6 } }
];

rangeTestCases.forEach(tc => {
    try {
        const actual = QuranAudio.getSurahAyahRange(tc.surah);
        assert.deepStrictEqual(actual, tc.expected, `Surah ${tc.surah} range`);
        console.log(`✅ Pass: Surah ${tc.surah} range -> ${JSON.stringify(actual)}`);
        passed++;
    } catch (e) {
        console.error(`❌ Fail: ${e.message}. Expected ${JSON.stringify(tc.expected)}, got ${JSON.stringify(QuranAudio.getSurahAyahRange(tc.surah))}`);
        failed++;
    }
});

console.log(`\nTests finished: ${passed} passed, ${failed} failed.`);
if (failed > 0) {
    process.exit(1);
}
