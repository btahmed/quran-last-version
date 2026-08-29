// RevisionPage.js — Murajaa Tracker (جدول المراجعة)
// Implémentation native ES module — aucun iframe, aucun framework externe.
// Données Quran : source api.alquran.cloud / tanzil.net (données Hafs 'an 'Asim, 604 pages).

export function render() {
    return `<div id="mj-root" class="mj-page page active" dir="rtl" lang="ar"></div>`;
}

export function init() {
    const root = document.getElementById('mj-root');
    if (!root) return;
    const app = new MurajaaTracker(root);
    app.mount();
    root._mjUnmount = () => app.unmount();
}

// ─────────────────────────────────────────────────────────────
// Constantes Quran — embarquées pour fiabilité offline
// Source : api.alquran.cloud meta + tanzil.net (Hafs, Madinah 604p)
// ─────────────────────────────────────────────────────────────
const _AR = '٠١٢٣٤٥٦٧٨٩';
const arN = n => String(n).replace(/[0-9]/g, c => _AR[+c]);
const escapeHtml = value =>
    String(value ?? '').replace(
        /[&<>"']/g,
        char =>
            ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;',
            })[char]
    );

// 30 Juz avec leur plage de pages (vérifiée contre les débuts de sourates)
const JUZ_DATA = [
    { num: 1, label: 'الجزء الأول', from: 1, to: 21 },
    { num: 2, label: 'الجزء الثاني', from: 22, to: 41 },
    { num: 3, label: 'الجزء الثالث', from: 42, to: 61 },
    { num: 4, label: 'الجزء الرابع', from: 62, to: 81 },
    { num: 5, label: 'الجزء الخامس', from: 82, to: 101 },
    { num: 6, label: 'الجزء السادس', from: 102, to: 121 },
    { num: 7, label: 'الجزء السابع', from: 122, to: 141 },
    { num: 8, label: 'الجزء الثامن', from: 142, to: 161 },
    { num: 9, label: 'الجزء التاسع', from: 162, to: 181 },
    { num: 10, label: 'الجزء العاشر', from: 182, to: 201 },
    { num: 11, label: 'الجزء الحادي عشر', from: 202, to: 221 },
    { num: 12, label: 'الجزء الثاني عشر', from: 222, to: 241 },
    { num: 13, label: 'الجزء الثالث عشر', from: 242, to: 261 },
    { num: 14, label: 'الجزء الرابع عشر', from: 262, to: 281 },
    { num: 15, label: 'الجزء الخامس عشر', from: 282, to: 301 },
    { num: 16, label: 'الجزء السادس عشر', from: 302, to: 321 },
    { num: 17, label: 'الجزء السابع عشر', from: 322, to: 341 },
    { num: 18, label: 'الجزء الثامن عشر', from: 342, to: 361 },
    { num: 19, label: 'الجزء التاسع عشر', from: 362, to: 381 },
    { num: 20, label: 'الجزء العشرون', from: 382, to: 401 },
    { num: 21, label: 'الجزء الحادي والعشرون', from: 402, to: 421 },
    { num: 22, label: 'الجزء الثاني والعشرون', from: 422, to: 441 },
    { num: 23, label: 'الجزء الثالث والعشرون', from: 442, to: 461 },
    { num: 24, label: 'الجزء الرابع والعشرون', from: 462, to: 481 },
    { num: 25, label: 'الجزء الخامس والعشرون', from: 482, to: 501 },
    { num: 26, label: 'الجزء السادس والعشرون', from: 502, to: 521 },
    { num: 27, label: 'الجزء السابع والعشرون', from: 522, to: 541 },
    { num: 28, label: 'الجزء الثامن والعشرون', from: 542, to: 561 },
    { num: 29, label: 'الجزء التاسع والعشرون', from: 562, to: 581 },
    { num: 30, label: 'الجزء الثلاثون', from: 582, to: 604 },
];

// 60 Hizbs — découpage approximatif par pages (chaque juz = 2 hizbs)
const HIZB_DATA = JUZ_DATA.flatMap(j => {
    const mid = Math.floor((j.from + j.to) / 2);
    const n = (j.num - 1) * 2;
    return [
        { num: n + 1, juzNum: j.num, label: `الحزب ${arN(n + 1)}`, from: j.from, to: mid },
        { num: n + 2, juzNum: j.num, label: `الحزب ${arN(n + 2)}`, from: mid + 1, to: j.to },
    ];
});

// 114 Sourates (num, name, page de début, nb de versets — Hafs 'an 'Asim)
const SURAH_FULL = [
    { num: 1, name: 'الفاتحة', page: 1, verses: 7 },
    { num: 2, name: 'البقرة', page: 2, verses: 286 },
    { num: 3, name: 'آل عمران', page: 50, verses: 200 },
    { num: 4, name: 'النساء', page: 77, verses: 176 },
    { num: 5, name: 'المائدة', page: 106, verses: 120 },
    { num: 6, name: 'الأنعام', page: 128, verses: 165 },
    { num: 7, name: 'الأعراف', page: 151, verses: 206 },
    { num: 8, name: 'الأنفال', page: 177, verses: 75 },
    { num: 9, name: 'التوبة', page: 187, verses: 129 },
    { num: 10, name: 'يونس', page: 208, verses: 109 },
    { num: 11, name: 'هود', page: 221, verses: 123 },
    { num: 12, name: 'يوسف', page: 235, verses: 111 },
    { num: 13, name: 'الرعد', page: 249, verses: 43 },
    { num: 14, name: 'إبراهيم', page: 255, verses: 52 },
    { num: 15, name: 'الحجر', page: 262, verses: 99 },
    { num: 16, name: 'النحل', page: 267, verses: 128 },
    { num: 17, name: 'الإسراء', page: 282, verses: 111 },
    { num: 18, name: 'الكهف', page: 293, verses: 110 },
    { num: 19, name: 'مريم', page: 305, verses: 98 },
    { num: 20, name: 'طه', page: 312, verses: 135 },
    { num: 21, name: 'الأنبياء', page: 322, verses: 112 },
    { num: 22, name: 'الحج', page: 332, verses: 78 },
    { num: 23, name: 'المؤمنون', page: 342, verses: 118 },
    { num: 24, name: 'النور', page: 350, verses: 64 },
    { num: 25, name: 'الفرقان', page: 359, verses: 77 },
    { num: 26, name: 'الشعراء', page: 367, verses: 227 },
    { num: 27, name: 'النمل', page: 377, verses: 93 },
    { num: 28, name: 'القصص', page: 385, verses: 88 },
    { num: 29, name: 'العنكبوت', page: 396, verses: 69 },
    { num: 30, name: 'الروم', page: 404, verses: 60 },
    { num: 31, name: 'لقمان', page: 411, verses: 34 },
    { num: 32, name: 'السجدة', page: 415, verses: 30 },
    { num: 33, name: 'الأحزاب', page: 418, verses: 73 },
    { num: 34, name: 'سبأ', page: 428, verses: 54 },
    { num: 35, name: 'فاطر', page: 434, verses: 45 },
    { num: 36, name: 'يس', page: 440, verses: 83 },
    { num: 37, name: 'الصافات', page: 446, verses: 182 },
    { num: 38, name: 'ص', page: 453, verses: 88 },
    { num: 39, name: 'الزمر', page: 458, verses: 75 },
    { num: 40, name: 'غافر', page: 467, verses: 85 },
    { num: 41, name: 'فصلت', page: 477, verses: 54 },
    { num: 42, name: 'الشورى', page: 483, verses: 53 },
    { num: 43, name: 'الزخرف', page: 489, verses: 89 },
    { num: 44, name: 'الدخان', page: 496, verses: 59 },
    { num: 45, name: 'الجاثية', page: 499, verses: 37 },
    { num: 46, name: 'الأحقاف', page: 502, verses: 35 },
    { num: 47, name: 'محمد', page: 507, verses: 38 },
    { num: 48, name: 'الفتح', page: 511, verses: 29 },
    { num: 49, name: 'الحجرات', page: 515, verses: 18 },
    { num: 50, name: 'ق', page: 518, verses: 45 },
    { num: 51, name: 'الذاريات', page: 520, verses: 60 },
    { num: 52, name: 'الطور', page: 523, verses: 49 },
    { num: 53, name: 'النجم', page: 526, verses: 62 },
    { num: 54, name: 'القمر', page: 528, verses: 55 },
    { num: 55, name: 'الرحمن', page: 531, verses: 78 },
    { num: 56, name: 'الواقعة', page: 534, verses: 96 },
    { num: 57, name: 'الحديد', page: 537, verses: 29 },
    { num: 58, name: 'المجادلة', page: 542, verses: 22 },
    { num: 59, name: 'الحشر', page: 545, verses: 24 },
    { num: 60, name: 'الممتحنة', page: 549, verses: 13 },
    { num: 61, name: 'الصف', page: 551, verses: 14 },
    { num: 62, name: 'الجمعة', page: 553, verses: 11 },
    { num: 63, name: 'المنافقون', page: 554, verses: 11 },
    { num: 64, name: 'التغابن', page: 556, verses: 18 },
    { num: 65, name: 'الطلاق', page: 558, verses: 12 },
    { num: 66, name: 'التحريم', page: 560, verses: 12 },
    { num: 67, name: 'الملك', page: 562, verses: 30 },
    { num: 68, name: 'القلم', page: 564, verses: 52 },
    { num: 69, name: 'الحاقة', page: 566, verses: 52 },
    { num: 70, name: 'المعارج', page: 568, verses: 44 },
    { num: 71, name: 'نوح', page: 570, verses: 28 },
    { num: 72, name: 'الجن', page: 572, verses: 28 },
    { num: 73, name: 'المزمل', page: 574, verses: 20 },
    { num: 74, name: 'المدثر', page: 575, verses: 56 },
    { num: 75, name: 'القيامة', page: 577, verses: 40 },
    { num: 76, name: 'الإنسان', page: 578, verses: 31 },
    { num: 77, name: 'المرسلات', page: 580, verses: 50 },
    { num: 78, name: 'النبأ', page: 582, verses: 40 },
    { num: 79, name: 'النازعات', page: 583, verses: 46 },
    { num: 80, name: 'عبس', page: 585, verses: 42 },
    { num: 81, name: 'التكوير', page: 586, verses: 29 },
    { num: 82, name: 'الانفطار', page: 587, verses: 19 },
    { num: 83, name: 'المطففين', page: 587, verses: 36 },
    { num: 84, name: 'الانشقاق', page: 589, verses: 25 },
    { num: 85, name: 'البروج', page: 590, verses: 22 },
    { num: 86, name: 'الطارق', page: 591, verses: 17 },
    { num: 87, name: 'الأعلى', page: 591, verses: 19 },
    { num: 88, name: 'الغاشية', page: 592, verses: 26 },
    { num: 89, name: 'الفجر', page: 593, verses: 30 },
    { num: 90, name: 'البلد', page: 594, verses: 20 },
    { num: 91, name: 'الشمس', page: 595, verses: 15 },
    { num: 92, name: 'الليل', page: 595, verses: 21 },
    { num: 93, name: 'الضحى', page: 596, verses: 11 },
    { num: 94, name: 'الشرح', page: 596, verses: 8 },
    { num: 95, name: 'التين', page: 597, verses: 8 },
    { num: 96, name: 'العلق', page: 597, verses: 19 },
    { num: 97, name: 'القدر', page: 598, verses: 5 },
    { num: 98, name: 'البينة', page: 598, verses: 8 },
    { num: 99, name: 'الزلزلة', page: 599, verses: 8 },
    { num: 100, name: 'العاديات', page: 599, verses: 11 },
    { num: 101, name: 'القارعة', page: 600, verses: 11 },
    { num: 102, name: 'التكاثر', page: 600, verses: 8 },
    { num: 103, name: 'العصر', page: 601, verses: 3 },
    { num: 104, name: 'الهمزة', page: 601, verses: 9 },
    { num: 105, name: 'الفيل', page: 601, verses: 5 },
    { num: 106, name: 'قريش', page: 602, verses: 4 },
    { num: 107, name: 'الماعون', page: 602, verses: 7 },
    { num: 108, name: 'الكوثر', page: 602, verses: 3 },
    { num: 109, name: 'الكافرون', page: 603, verses: 6 },
    { num: 110, name: 'النصر', page: 603, verses: 3 },
    { num: 111, name: 'المسد', page: 603, verses: 5 },
    { num: 112, name: 'الإخلاص', page: 604, verses: 4 },
    { num: 113, name: 'الفلق', page: 604, verses: 5 },
    { num: 114, name: 'الناس', page: 604, verses: 6 },
];

// ─────────────────────────────────────────────────────────────
// Classe principale
// ─────────────────────────────────────────────────────────────
class MurajaaTracker {
    TEACHER_KEY = 'murajaa_v4';
    OLD_KEY = 'murajaa_v3';
    START_DAY = '2026-08-21';
    BATCH = 10;
    DAY_LABELS = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

    // Alias pour la compatibilité avec surahAtPage() qui utilise this.SURAH_STARTS
    SURAH_STARTS = SURAH_FULL;

    MEMO_ITEMS = [
        { name: 'آل عمران (تكملة)', start: 53, end: 76 },
        { name: 'النساء', start: 77, end: 105 },
        { name: 'المائدة', start: 106, end: 127 },
        { name: 'الأنعام', start: 128, end: 150 },
        { name: 'الأعراف', start: 151, end: 176 },
        { name: 'الأنفال', start: 177, end: 186 },
        { name: 'التوبة', start: 187, end: 207 },
        { name: 'يونس', start: 208, end: 220 },
        { name: 'هود', start: 221, end: 234 },
        { name: 'يوسف (تكملة)', start: 241, end: 248 },
        { name: 'الرعد', start: 249, end: 254 },
        { name: 'إبراهيم', start: 255, end: 261 },
        { name: 'الحجر', start: 262, end: 266 },
        { name: 'النحل', start: 267, end: 281 },
        { name: 'الإسراء', start: 282, end: 292 },
        { name: 'طه (تكملة)', start: 318, end: 321 },
        { name: 'الأنبياء', start: 322, end: 331 },
        { name: 'الحج', start: 332, end: 341 },
        { name: 'المؤمنون', start: 342, end: 349 },
        { name: 'النور', start: 350, end: 358 },
        { name: 'الفرقان', start: 359, end: 366 },
        { name: 'الشعراء', start: 367, end: 376 },
        { name: 'النمل', start: 377, end: 384 },
    ];

    BACKLOG_ITEMS = [
        { name: 'القمر', start: 529, end: 530 },
        { name: 'الرحمن', start: 531, end: 533 },
        { name: 'الحديد', start: 537, end: 541 },
        { name: 'الحجرات', start: 515, end: 517 },
        { name: 'الفتح', start: 511, end: 514 },
        { name: 'محمد', start: 507, end: 510 },
        { name: 'الأحقاف', start: 502, end: 506 },
        { name: 'الجاثية', start: 499, end: 501 },
        { name: 'الدخان', start: 496, end: 498 },
        { name: 'الزخرف', start: 489, end: 495 },
        { name: 'الشورى', start: 483, end: 488 },
        { name: 'فصلت', start: 477, end: 482 },
        { name: 'غافر', start: 467, end: 476 },
        { name: 'الزمر', start: 458, end: 466 },
        { name: 'ص', start: 453, end: 457 },
        { name: 'الصافات', start: 446, end: 452 },
        { name: 'يس', start: 440, end: 445 },
        { name: 'فاطر', start: 434, end: 439 },
        { name: 'سبأ', start: 428, end: 433 },
        { name: 'الأحزاب', start: 418, end: 427 },
        { name: 'السجدة', start: 415, end: 417 },
        { name: 'لقمان', start: 411, end: 414 },
        { name: 'الروم', start: 404, end: 410 },
        { name: 'العنكبوت', start: 396, end: 403 },
        { name: 'القصص', start: 385, end: 395 },
    ];

    DEFAULTS = {
        bunkerRanges: [
            { label: 'الفاتحة', from: 1, to: 1 },
            { label: 'البقرة', from: 2, to: 49 },
            { label: 'آل عمران ١-٢٢', from: 50, to: 52 },
            { label: 'يوسف ١-٤٣', from: 235, to: 240 },
            { label: 'مريم', from: 305, to: 311 },
            { label: 'الكهف', from: 293, to: 304 },
            { label: 'طه (النصف الأول)', from: 312, to: 317 },
            { label: 'الطور', from: 523, to: 525 },
            { label: 'النجم', from: 526, to: 528 },
            { label: 'الواقعة', from: 534, to: 536 },
            { label: 'جزء ٢٨ (المجادلة ← التحريم)', from: 542, to: 561 },
            { label: 'جزء ٢٩ (الملك ← المرسلات)', from: 562, to: 581 },
            { label: 'جزء ٣٠ (النبأ ← الناس)', from: 582, to: 604 },
            { label: 'الذاريات', from: 520, to: 522 },
            { label: 'ق', from: 518, to: 519 },
        ],
        bunkerCursor: 112,
        bunkerLastDate: null,
        bunkerReviewedToday: [],
        cycleReviewed: [],
        bunkerHistory: 'آخر مراجعة: عم تراجع من الملك',
        newQueueCursor: 0,
        oldQueueCursor: 0,
        activeNew: null,
        activeOld: null,
        pendingConfirm: [],
        lastPromoteDate: null,
        bucket: [],
        log: [],
        history: {},
        cyclesDone: 0,
        activeDates: [],
        theme: null,
        configured: false,
    };

    constructor(container) {
        this.container = container;
        this.state = {
            d: null,
            tab: 'new',
            calView: 'week',
            calOffset: 0,
            selectedDay: null,
            wiz: null, // wizard state — non-null quand setup requis
        };
        this._bound = null;
    }

    // ── Cycle de vie ──────────────────────────────────────────
    mount() {
        this.state.d = this.loadData();

        if (this.needsSetup()) {
            this.state.wiz = {
                mode: null,
                tab: 'juz', // 'juz' | 'hizb' | 'surah' | 'page'
                ranges: [], // [{from, to, label, type}]
                importText: '',
                importError: null,
                copied: false,
            };
            this.update();
            return;
        }

        this.repairFusedRanges();
        this.normalizeRanges();
        this.autoAdvanceBunker();
        this.promoteByDate();
        this.ensureActiveTargets();
        this.seedYesterday();
        this.syncTodayHistory();
        this.persist();
        this.update();

        this.rollTimer = setInterval(() => {
            const prev = this.state.d.bunkerLastDate;
            this.autoAdvanceBunker();
            this.promoteByDate();
            this.ensureActiveTargets();
            if (this.state.d.bunkerLastDate !== prev) this.commit();
        }, 60000);

        this._onVis = () => {
            if (!document.hidden) {
                this.autoAdvanceBunker();
                this.promoteByDate();
                this.ensureActiveTargets();
                this.commit();
            }
        };
        this._onLeave = () => this.persist();
        document.addEventListener('visibilitychange', this._onVis);
        window.addEventListener('beforeunload', this._onLeave);
        window.addEventListener('pagehide', this._onLeave);
    }

    unmount() {
        clearInterval(this.rollTimer);
        if (this._onVis) document.removeEventListener('visibilitychange', this._onVis);
        if (this._onLeave) {
            window.removeEventListener('beforeunload', this._onLeave);
            window.removeEventListener('pagehide', this._onLeave);
        }
        if (this._bound) this.container.removeEventListener('click', this._bound);
    }

    // ── Identification utilisateur ───────────────────────────
    getUserId() {
        const user = window.QuranReview?.state?.user;
        return user?.id ?? null;
    }

    getUserRole() {
        return window.QuranReview?.state?.user?.role || null;
    }

    getUserKey() {
        const uid = this.getUserId();
        const role = this.getUserRole();
        if (!uid || role === 'teacher' || role === 'admin') return this.TEACHER_KEY;
        return `murajaa_student_${uid}`;
    }

    needsSetup() {
        const key = this.getUserKey();
        if (key === this.TEACHER_KEY) return false; // le prof a toujours ses données
        const raw = localStorage.getItem(key);
        if (!raw) return true;
        try {
            return !JSON.parse(raw).configured;
        } catch {
            return true;
        }
    }

    // ── Persistance ───────────────────────────────────────────
    loadData() {
        const base = JSON.parse(JSON.stringify(this.DEFAULTS));
        const key = this.getUserKey();
        try {
            const raw =
                localStorage.getItem(key) ||
                (key === this.TEACHER_KEY ? localStorage.getItem(this.OLD_KEY) : null);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                    const data = Object.assign(base, parsed);
                    data.bunkerRanges = Array.isArray(parsed.bunkerRanges)
                        ? this.normalizeRangeList(parsed.bunkerRanges, false)
                        : base.bunkerRanges;
                    data.configured = Boolean(parsed.configured);
                    if (data.configured && !data.bunkerRanges.length) data.configured = false;
                    return data;
                }
            }
        } catch (e) {
            /* ignore, use defaults */
        }
        return base;
    }

    persist() {
        try {
            localStorage.setItem(this.getUserKey(), JSON.stringify(this.state.d));
        } catch (e) {
            /* quota exceeded */
        }
    }

    commit() {
        this.persist();
        this.update();
    }

    setState(patch) {
        Object.assign(this.state, patch);
        this.update();
    }

    // ── Helpers généraux ─────────────────────────────────────
    ar(n) {
        return String(n).replace(/[0-9]/g, c => _AR[+c]);
    }

    today() {
        return this.dateKey(new Date());
    }

    dateKey(dt) {
        return (
            dt.getFullYear() +
            '-' +
            String(dt.getMonth() + 1).padStart(2, '0') +
            '-' +
            String(dt.getDate()).padStart(2, '0')
        );
    }

    hist(key) {
        const d = this.state.d;
        if (!d.history) d.history = {};
        const k = key || this.today();
        if (!d.history[k])
            d.history[k] = { wirds: [], memorized: [], confirmed: [], hizb: 0, cycles: 0 };
        const h = d.history[k];
        h.wirds = h.wirds || [];
        h.memorized = h.memorized || [];
        h.confirmed = h.confirmed || [];
        h.hizb = h.hizb || 0;
        h.cycles = h.cycles || 0;
        return h;
    }

    addLog(text) {
        const d = this.state.d;
        if (!d.log) d.log = [];
        const ts = new Date().toLocaleString('ar', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
        d.log.unshift({ ts, text });
        if (d.log.length > 200) d.log.length = 200;
    }

    markActiveToday() {
        const d = this.state.d;
        if (!d.activeDates) d.activeDates = [];
        const key = this.today();
        if (!d.activeDates.includes(key)) {
            d.activeDates.push(key);
            if (d.activeDates.length > 400) d.activeDates.shift();
        }
    }

    currentStreak() {
        const set = new Set(this.state.d.activeDates || []);
        let streak = 0;
        const dt = new Date();
        while (set.has(this.dateKey(dt))) {
            streak++;
            dt.setDate(dt.getDate() - 1);
        }
        return streak;
    }

    surahAtPage(page) {
        let best = null;
        for (const s of SURAH_FULL) {
            if (s.page <= page) best = s;
            else break;
        }
        return best ? best.name : null;
    }

    flattenPages(ranges) {
        const pages = new Map();
        (ranges || []).forEach(r => {
            const from = Number(r.from),
                to = Number(r.to);
            if (
                Number.isInteger(from) &&
                Number.isInteger(to) &&
                from >= 1 &&
                to <= 604 &&
                to >= from
            )
                for (let p = from; p <= to; p++) {
                    if (!pages.has(p)) pages.set(p, { page: p, label: r.label || '' });
                }
        });
        return [...pages.values()];
    }

    flattenQueue(items) {
        const pages = [];
        items.forEach(it => {
            for (let p = it.start; p <= it.end; p++) pages.push({ page: p, label: it.name });
        });
        return pages;
    }

    mergeRanges(ranges, mergeAdjacent = true) {
        const sorted = (ranges || [])
            .map(r => ({ from: Number(r.from), to: Number(r.to), label: String(r.label || '') }))
            .filter(
                r =>
                    Number.isInteger(r.from) &&
                    Number.isInteger(r.to) &&
                    r.from >= 1 &&
                    r.to <= 604 &&
                    r.to >= r.from
            )
            .sort((a, b) => a.from - b.from || a.to - b.to);
        const merged = [];
        sorted.forEach(range => {
            const last = merged[merged.length - 1];
            const touches = mergeAdjacent ? range.from <= last?.to + 1 : range.from <= last?.to;
            if (last && touches) {
                last.to = Math.max(last.to, range.to);
                if (range.label && !last.label.split('، ').includes(range.label))
                    last.label = [last.label, range.label].filter(Boolean).join('، ');
            } else {
                merged.push({ ...range });
            }
        });
        return merged;
    }

    normalizeRangeList(ranges, strict = false) {
        if (!Array.isArray(ranges)) {
            if (strict) throw new Error('invalid');
            return [];
        }
        const valid = ranges.filter(r => {
            if (!r || typeof r !== 'object') return false;
            const from = Number(r.from);
            const to = Number(r.to);
            return (
                Number.isInteger(from) &&
                Number.isInteger(to) &&
                from >= 1 &&
                to <= 604 &&
                to >= from
            );
        });
        if (strict && valid.length !== ranges.length) throw new Error('invalid');
        return this.mergeRanges(valid);
    }

    getWindow(pages, cursor, size) {
        if (!pages.length) return [];
        const c = ((cursor % pages.length) + pages.length) % pages.length;
        const out = [];
        for (let i = 0; i < Math.min(size, pages.length); i++)
            out.push(pages[(c + i) % pages.length]);
        return out;
    }

    groupConsecutive(pages) {
        const sorted = [...pages].sort((a, b) => a.page - b.page);
        const ranges = [];
        let run = null;
        sorted.forEach(p => {
            if (run && p.page === run.to + 1) {
                run.to = p.page;
                run.labels.add(p.label);
            } else {
                if (run) ranges.push(run);
                run = { from: p.page, to: p.page, labels: new Set([p.label]) };
            }
        });
        if (run) ranges.push(run);
        return ranges.map(r => ({ from: r.from, to: r.to, label: [...r.labels].join('، ') }));
    }

    currentBunkerWindow() {
        return this.getWindow(
            this.flattenPages(this.state.d.bunkerRanges),
            this.state.d.bunkerCursor,
            this.BATCH
        );
    }

    securedPages() {
        const d = this.state.d;
        const set = new Set(this.flattenPages(d.bunkerRanges).map(p => p.page));
        (d.bucket || []).forEach(b => set.add(b.page));
        (d.pendingConfirm || []).forEach(p => set.add(p.page));
        return set;
    }

    // ── Helpers Quran (arbre Juz → Hizb → Sourate) ───────────
    surahPageEnd(snum) {
        const idx = snum - 1;
        const next = SURAH_FULL[idx + 1];
        return Math.max(SURAH_FULL[idx].page, next ? next.page - 1 : 604);
    }

    // Sourates dont la 1re page est dans [fromPage, toPage]
    surahsStartingInRange(fromPage, toPage) {
        return SURAH_FULL.filter(s => s.page >= fromPage && s.page <= toPage);
    }

    surahsInJuz(juzNum) {
        const j = JUZ_DATA[juzNum - 1];
        return j ? this.surahsOverlappingRange(j.from, j.to) : [];
    }

    surahsInHizb(hizbNum) {
        const h = HIZB_DATA[hizbNum - 1];
        return h ? this.surahsOverlappingRange(h.from, h.to) : [];
    }

    surahsOverlappingRange(fromPage, toPage) {
        return SURAH_FULL.filter(s => {
            const end = this.surahPageEnd(s.num);
            return s.page <= toPage && end >= fromPage;
        });
    }

    // ── Logique wizard ────────────────────────────────────────
    isRangeSelected(from, to) {
        return this.state.wiz.ranges.some(r => r.from === from && r.to === to);
    }

    // 'all' | 'partial' | 'none' selon les hizbs sélectionnés
    juzSelectionState(juzNum) {
        const hizbs = HIZB_DATA.filter(h => h.juzNum === juzNum);
        if (!hizbs.length) return 'none';
        const sel = hizbs.filter(h => this.isRangeSelected(h.from, h.to)).length;
        if (sel === 0) return 'none';
        return sel === hizbs.length ? 'all' : 'partial';
    }

    // Sélectionner un juz = ajouter/retirer tous ses hizbs
    wizToggleJuz(juzNum) {
        const w = this.state.wiz;
        const hizbs = HIZB_DATA.filter(h => h.juzNum === juzNum);
        const state = this.juzSelectionState(juzNum);
        if (state === 'all') {
            hizbs.forEach(h => {
                const idx = w.ranges.findIndex(r => r.from === h.from && r.to === h.to);
                if (idx >= 0) w.ranges.splice(idx, 1);
            });
        } else {
            hizbs.forEach(h => {
                if (!this.isRangeSelected(h.from, h.to)) {
                    w.ranges.push({ from: h.from, to: h.to, label: h.label, type: 'hizb' });
                }
            });
        }
        this.update();
    }

    wizSetTab(tab) {
        this.state.wiz.tab = tab;
        this.state.wiz.wheelAngle = 0;
        this.update();
    }

    wizToggleRange(from, to, label, type) {
        const w = this.state.wiz;
        const idx = w.ranges.findIndex(r => r.from === from && r.to === to);
        if (idx >= 0) w.ranges.splice(idx, 1);
        else w.ranges.push({ from, to, label, type });
        this.update();
    }

    buildRangesFromSelected() {
        const { ranges } = this.state.wiz;
        if (!ranges.length) return [];
        const sorted = [...ranges].sort((a, b) => a.from - b.from);
        return this.mergeRanges(sorted, false);
    }

    finishSetup() {
        const ranges = this.buildRangesFromSelected();
        if (!ranges.length) return;
        if (this.state.d?.configured) {
            // Édition d'un plan existant : conserver l'historique, juste mettre à jour les plages
            this.state.d.bunkerRanges = ranges;
            this.state.d.bunkerCursor = 0;
            this.state.d.rangesRebuilt = true;
            this.state.d.bunkerLastDate = null;
        } else {
            const d = JSON.parse(JSON.stringify(this.DEFAULTS));
            d.bunkerRanges = ranges;
            d.configured = true;
            d.rangesRebuilt = true;
            d.bunkerCursor = 0;
            d.bunkerLastDate = null;
            this.state.d = d;
        }
        this.persist();
        this.state.wiz = null;
        this.autoAdvanceBunker();
        this.promoteByDate();
        this.ensureActiveTargets();
        this.commit();
    }

    getExportCode() {
        const payload = JSON.stringify({
            v: 1,
            bunkerRanges: this.state.d.bunkerRanges,
            label: 'جدول المراجعة',
        });
        return btoa(encodeURIComponent(payload));
    }

    importFromCode(text) {
        try {
            const payload = JSON.parse(decodeURIComponent(atob(text.trim())));
            const ranges = this.normalizeRangeList(payload?.bunkerRanges, true);
            if (!ranges.length) throw new Error('invalid');
            const d = JSON.parse(JSON.stringify(this.DEFAULTS));
            d.bunkerRanges = ranges;
            d.configured = true;
            d.rangesRebuilt = true;
            d.bunkerCursor = 0;
            this.state.d = d;
            this.persist();
            this.state.wiz = null;
            this.autoAdvanceBunker();
            this.promoteByDate();
            this.ensureActiveTargets();
            this.commit();
        } catch (_e) {
            if (!this.state.wiz) {
                this.state.wiz = {
                    mode: 'import',
                    tab: 'juz',
                    ranges: [],
                    importText: text || '',
                    importError: null,
                    copied: false,
                };
            }
            this.state.wiz.importError = 'الكود غير صالح — تأكد من نسخه كاملاً من الأستاذ.';
            this.update();
        }
    }

    // ── Logique quotidienne ───────────────────────────────────
    autoAdvanceBunker() {
        const d = this.state.d;
        const todayStr = new Date().toDateString();
        if (!d.bunkerLastDate) {
            d.bunkerLastDate = todayStr;
            return;
        }
        if (d.bunkerLastDate === todayStr) return;
        const diffDays = Math.round((new Date(todayStr) - new Date(d.bunkerLastDate)) / 86400000);
        if (diffDays > 0) {
            const pages = this.flattenPages(d.bunkerRanges);
            if (pages.length) {
                const nc = (d.bunkerCursor + this.BATCH * diffDays) % pages.length;
                if (nc <= d.bunkerCursor) {
                    d.cycleReviewed = [];
                    this.addLog('🔄 بلشت دورة مراجعة جديدة');
                }
                d.bunkerCursor = nc;
                d.bunkerReviewedToday = [];
                this.addLog('⏩ تقدّمت المراجعة تلقائيًا (' + this.ar(diffDays) + ' يوم)');
            }
            d.bunkerLastDate = todayStr;
        }
    }

    promoteByDate() {
        const d = this.state.d;
        const todayStr = new Date().toDateString();
        if (!d.lastPromoteDate) {
            d.lastPromoteDate = todayStr;
            this.ensureActiveTargets();
            return;
        }
        if (d.lastPromoteDate === todayStr) return;
        if (!d.pendingConfirm) d.pendingConfirm = [];
        [d.activeNew, d.activeOld].forEach(item => {
            if (item && !d.pendingConfirm.some(p => p.page === item.page))
                d.pendingConfirm.push({ page: item.page, label: item.label, source: item.source });
        });
        d.activeNew = null;
        d.activeOld = null;
        this.ensureActiveTargets();
        d.lastPromoteDate = todayStr;
    }

    ensureActiveTargets() {
        const d = this.state.d;
        if (!d.backlogReordered) {
            d.oldQueueCursor = 0;
            d.activeOld = null;
            d.backlogReordered = true;
        }
        const secured = this.securedPages();
        const oldAll = this.flattenQueue(this.BACKLOG_ITEMS);
        while (d.oldQueueCursor < oldAll.length && secured.has(oldAll[d.oldQueueCursor].page))
            d.oldQueueCursor++;
        const newAll = this.flattenQueue(this.MEMO_ITEMS);
        while (d.newQueueCursor < newAll.length && secured.has(newAll[d.newQueueCursor].page))
            d.newQueueCursor++;
        if (!d.activeNew) {
            const tn = newAll[d.newQueueCursor];
            if (tn) {
                d.activeNew = { page: tn.page, label: tn.label, source: 'new', memorized: false };
                d.newQueueCursor++;
            }
        }
        if (!d.activeOld) {
            const to = oldAll[d.oldQueueCursor];
            if (to) {
                d.activeOld = { page: to.page, label: to.label, source: 'old', memorized: false };
                d.oldQueueCursor++;
            }
        }
    }

    normalizeRanges() {
        const d = this.state.d;
        const out = this.normalizeRangeList(d.bunkerRanges, false);
        if (JSON.stringify(out) !== JSON.stringify(d.bunkerRanges || [])) d.bunkerRanges = out;
    }

    repairFusedRanges() {
        const d = this.state.d;
        if (d.rangesRebuilt) return;
        const pages = [...new Set(this.flattenPages(d.bunkerRanges).map(p => p.page))].sort(
            (a, b) => a - b
        );
        const out = [];
        let cur = null;
        pages.forEach(p => {
            const name = this.surahAtPage(p) || 'صفحات';
            if (cur && p === cur.to + 1 && name === cur.label) cur.to = p;
            else {
                if (cur) out.push(cur);
                cur = { from: p, to: p, label: name };
            }
        });
        if (cur) out.push(cur);
        if (out.length) d.bunkerRanges = out;
        d.rangesRebuilt = true;
    }

    seedYesterday() {
        const d = this.state.d;
        if (d.seedYesterdayDone) return;
        const key = this.START_DAY;
        const h = this.hist(key);
        for (let p = 518; p <= 528; p++) {
            const label = this.surahAtPage(p) || '';
            if (!h.memorized.some(x => x.page === p)) h.memorized.push({ page: p, label });
            if (!h.confirmed.some(x => x.page === p)) h.confirmed.push({ page: p, label });
        }
        [
            { from: 562, to: 581, label: 'تبارك (جزء ٢٩)' },
            { from: 582, to: 604, label: 'عمّ (جزء ٣٠)' },
        ].forEach(w => {
            if (!h.wirds.some(x => x.from === w.from && x.to === w.to)) h.wirds.push(w);
            if (!d.cycleReviewed) d.cycleReviewed = [];
            for (let p = w.from; p <= w.to; p++)
                if (!d.cycleReviewed.includes(p)) d.cycleReviewed.push(p);
        });
        if (!d.activeDates) d.activeDates = [];
        if (!d.activeDates.includes(key)) d.activeDates.push(key);
        d.activeDates.sort();
        const all = this.flattenPages(d.bunkerRanges);
        const doneSet = new Set(d.cycleReviewed || []);
        const nextIdx = all.findIndex(p => !doneSet.has(p.page));
        if (nextIdx >= 0) d.bunkerCursor = nextIdx;
        this.addLog('📌 يوم البداية: حفظ ق والذاريات والطور والنجم · مراجعة تبارك وعمّ');
        d.seedYesterdayDone = true;
    }

    syncTodayHistory() {
        const d = this.state.d;
        const k = this.today();
        const h = this.hist(k);
        if (d.wirdDoneDate === k && !h.wirds.length) {
            const win = this.currentBunkerWindow();
            if (win.length) {
                const nums = win.map(w => w.page);
                h.wirds.push({
                    from: Math.min(...nums),
                    to: Math.max(...nums),
                    label: this.surahAtPage(Math.min(...nums)) || '',
                });
            }
        }
        [d.activeNew, d.activeOld]
            .filter(Boolean)
            .filter(i => i.memorized)
            .forEach(i => {
                if (!h.memorized.some(m => m.page === i.page))
                    h.memorized.push({ page: i.page, label: i.label });
            });
    }

    checkCycleComplete() {
        const d = this.state.d;
        const pages = this.flattenPages(d.bunkerRanges);
        if (!pages.length || !(d.cycleReviewed || []).length) return;
        const set = new Set(d.cycleReviewed);
        if (pages.every(p => set.has(p.page))) {
            d.cycleReviewed = [];
            d.cyclesDone = (d.cyclesDone || 0) + 1;
            this.hist().cycles += 1;
            this.addLog(
                '🎉 خلصت دورة مراجعة كاملة (' + this.ar(pages.length) + ' صفحة) — بلشت دورة جديدة'
            );
        }
    }

    // ── Actions tracker ───────────────────────────────────────
    toggleMemorized(item) {
        item.memorized = !item.memorized;
        const h = this.hist();
        const i = h.memorized.findIndex(m => m.page === item.page);
        if (item.memorized) {
            if (i < 0) h.memorized.push({ page: item.page, label: item.label });
        } else if (i >= 0) h.memorized.splice(i, 1);
        this.markActiveToday();
        this.commit();
    }

    promoteItem(item) {
        const d = this.state.d;
        if (!d.pendingConfirm) d.pendingConfirm = [];
        if (!d.pendingConfirm.some(p => p.page === item.page)) {
            d.pendingConfirm.push({ page: item.page, label: item.label, source: item.source });
        }
        const h = this.hist();
        if (!h.memorized.some(m => m.page === item.page))
            h.memorized.push({ page: item.page, label: item.label });
        if (item.source === 'new') d.activeNew = null;
        else d.activeOld = null;
        this.ensureActiveTargets();
        this.markActiveToday();
        this.commit();
    }

    confirmPending(index) {
        const d = this.state.d;
        const item = (d.pendingConfirm || [])[index];
        if (!item) return;
        if (!d.bucket.some(b => b.page === item.page))
            d.bucket.push({ page: item.page, label: item.label, source: item.source });
        if (!this.hist().confirmed.some(c => c.page === item.page))
            this.hist().confirmed.push({ page: item.page, label: item.label });
        this.addLog(
            '✓ ثبّت صفحة ' +
                this.ar(item.page) +
                ' (' +
                item.label +
                ') — دخلت الحزب (' +
                this.ar(Math.min(d.bucket.length, 10)) +
                '/١٠)'
        );
        d.pendingConfirm.splice(index, 1);
        this.markActiveToday();
        this.commit();
    }

    toggleBunkerPage(page) {
        const d = this.state.d;
        if (!d.bunkerReviewedToday) d.bunkerReviewedToday = [];
        if (!d.cycleReviewed) d.cycleReviewed = [];
        const idx = d.bunkerReviewedToday.indexOf(page);
        if (idx >= 0) {
            d.bunkerReviewedToday.splice(idx, 1);
            const ci = d.cycleReviewed.indexOf(page);
            if (ci >= 0) d.cycleReviewed.splice(ci, 1);
        } else {
            d.bunkerReviewedToday.push(page);
            if (!d.cycleReviewed.includes(page)) d.cycleReviewed.push(page);
        }
        this.markActiveToday();
        const win = this.currentBunkerWindow();
        if (win.length && win.every(w => d.bunkerReviewedToday.includes(w.page))) {
            this.logWindowDone(win, '🟢 راجعت كل صفحات');
            d.wirdDoneDate = this.today();
            this.checkCycleComplete();
        }
        this.commit();
    }

    confirmAllBunker() {
        const d = this.state.d;
        const win = this.currentBunkerWindow();
        if (!win.length) return;
        if (!d.bunkerReviewedToday) d.bunkerReviewedToday = [];
        if (!d.cycleReviewed) d.cycleReviewed = [];
        win.forEach(w => {
            if (!d.bunkerReviewedToday.includes(w.page)) d.bunkerReviewedToday.push(w.page);
            if (!d.cycleReviewed.includes(w.page)) d.cycleReviewed.push(w.page);
        });
        this.logWindowDone(win, '✅ سمّعت ورد');
        d.wirdDoneDate = this.today();
        this.markActiveToday();
        this.checkCycleComplete();
        this.commit();
    }

    advanceBunker() {
        const d = this.state.d;
        const pages = this.flattenPages(d.bunkerRanges);
        if (!pages.length) return;
        const nextCursor = (d.bunkerCursor + this.BATCH) % pages.length;
        if (nextCursor <= d.bunkerCursor) {
            d.cycleReviewed = [];
            this.addLog('🔄 بلشت دورة مراجعة جديدة');
        }
        d.bunkerCursor = nextCursor;
        d.bunkerLastDate = new Date().toDateString();
        this.checkCycleComplete();
        this.addLog('⏭ انتقلت للورد الجاي');
        this.commit();
    }

    consolidateBucket() {
        const d = this.state.d;
        if ((d.bucket || []).length < 10) return;
        const take = d.bucket.slice(0, 10);
        this.groupConsecutive(take).forEach(r => d.bunkerRanges.push(r));
        this.normalizeRanges();
        this.hist().hizb += 1;
        this.addLog('🏛 حزب كامل (١٠ صفحات) دخل دورة المراجعة');
        d.bucket = d.bucket.slice(10);
        this.markActiveToday();
        this.commit();
    }

    logWindowDone(win, prefix) {
        const d = this.state.d;
        const nums = win.map(w => w.page);
        const lo = Math.min(...nums),
            hi = Math.max(...nums);
        const l1 = this.surahAtPage(lo) || win[0].label || '';
        const l2 = this.surahAtPage(hi) || win[win.length - 1].label || '';
        const label = l1 === l2 ? l1 : l1 + ' → ' + l2;
        d.bunkerHistory = 'آخر مراجعة: صفحات ' + this.ar(lo) + '–' + this.ar(hi);
        const h = this.hist();
        if (!h.wirds.some(w => w.from === lo && w.to === hi))
            h.wirds.push({ from: lo, to: hi, label });
        this.addLog(
            prefix + ' ' + this.ar(lo) + '–' + this.ar(hi) + (label ? ' (' + label + ')' : '')
        );
    }

    // ── Rendu ─────────────────────────────────────────────────
    update() {
        if (this._bound) {
            this.container.removeEventListener('click', this._bound);
            this._bound = null;
        }
        this.container.innerHTML = this.state.wiz ? this.renderSetupWizard() : this.renderPage();
        const theme = this.state.d?.theme || 'light';
        if (theme === 'dark') this.container.setAttribute('data-dark', '');
        else this.container.removeAttribute('data-dark');
        this._wheelCleanup?.();
        this.bindEvents();
        if (this._wheelRaf) {
            cancelAnimationFrame(this._wheelRaf);
            this._wheelRaf = null;
        }
        if (this.state.wiz?.mode === 'build' && this.state.wiz?.tab !== 'page') {
            requestAnimationFrame(() => this._mountWheel());
        }
    }

    bindEvents() {
        this._bound = e => {
            const el = e.target.closest('[data-action]');
            if (!el) return;
            this._dispatch(el.dataset.action, el.dataset.arg, e);
        };
        this.container.addEventListener('click', this._bound);

        // Lecture du textarea import
        const ta = this.container.querySelector('#mj-import-code');
        if (ta) {
            ta.addEventListener('input', () => {
                if (this.state.wiz) {
                    this.state.wiz.importText = ta.value;
                    if (this.state.wiz.importError) {
                        this.state.wiz.importError = null;
                        this.update();
                    }
                }
            });
        }
    }

    _dispatch(act, arg, e) {
        const d = this.state.d;
        // ── Actions wizard ──
        if (act === 'wiz-mode') {
            this.state.wiz.mode = arg;
            this.update();
            return;
        }
        if (act === 'wiz-back') {
            this.state.wiz.mode = null;
            this.state.wiz.importError = null;
            this.update();
            return;
        }
        if (act === 'wiz-edit') {
            const existingRanges = (this.state.d?.bunkerRanges || []).map(r => ({
                from: r.from,
                to: r.to,
                label: r.label || `ص.${r.from}–${r.to}`,
                type: 'page',
            }));
            this.state.wiz = {
                mode: 'build',
                tab: 'juz',
                ranges: existingRanges,
                importText: '',
                importError: null,
                copied: false,
            };
            this.update();
            return;
        }
        if (act === 'wiz-tab') {
            this.wizSetTab(arg);
            return;
        }
        if (act === 'wiz-toggle-juz') {
            this.wizToggleJuz(parseInt(arg));
            return;
        }
        if (act === 'wiz-toggle-range') {
            const el = e.target.closest('[data-action]');
            if (el) {
                this.wizToggleRange(
                    parseInt(el.dataset.from),
                    parseInt(el.dataset.to),
                    el.dataset.label || '',
                    el.dataset.rtype || 'custom'
                );
            }
            return;
        }
        if (act === 'wiz-add-page') {
            const fromEl = this.container.querySelector('#mj-page-from');
            const toEl = this.container.querySelector('#mj-page-to');
            const pFrom = parseInt(fromEl?.value);
            const pTo = parseInt(toEl?.value);
            if (pFrom >= 1 && pTo <= 604 && pFrom <= pTo) {
                const lbl = `ص.${pFrom}–${pTo}`;
                if (!this.isRangeSelected(pFrom, pTo)) {
                    this.state.wiz.ranges.push({ from: pFrom, to: pTo, label: lbl, type: 'page' });
                }
                this.update();
            }
            return;
        }
        if (act === 'wiz-remove-range') {
            const idx = parseInt(arg);
            if (!isNaN(idx) && idx >= 0 && idx < this.state.wiz.ranges.length) {
                this.state.wiz.ranges.splice(idx, 1);
                this.update();
            }
            return;
        }
        if (act === 'wiz-finish') {
            this.finishSetup();
            return;
        }
        if (act === 'wiz-import') {
            const ta = this.container.querySelector('#mj-import-code');
            this.importFromCode(ta ? ta.value : this.state.wiz.importText);
            return;
        }
        if (act === 'export-copy') {
            const ta = this.container.querySelector('#mj-export-code');
            if (ta) ta.select();
            const copy = navigator.clipboard?.writeText(this.getExportCode());
            if (copy?.then) {
                copy.then(() => {
                    this.state.exportCopied = true;
                    this.update();
                }).catch(() => {});
            }
            return;
        }

        // ── Actions tracker ──
        switch (act) {
            case 'tab':
                this.setState({ tab: arg });
                break;
            case 'cal-week':
                this.setState({ calView: 'week', calOffset: 0 });
                break;
            case 'cal-month':
                this.setState({ calView: 'month' });
                break;
            case 'prev-month':
                this.setState({ calOffset: this.state.calOffset - 1 });
                break;
            case 'next-month':
                this.setState({ calOffset: Math.min(0, this.state.calOffset + 1) });
                break;
            case 'day-open':
                this.syncTodayHistory();
                this.persist();
                this.setState({ selectedDay: arg });
                break;
            case 'day-close':
                this.setState({ selectedDay: null });
                break;
            case 'toggle-theme':
                d.theme = (d.theme || 'light') === 'dark' ? 'light' : 'dark';
                this.commit();
                break;
            case 'toggle-memo': {
                const item = arg === 'new' ? d.activeNew : d.activeOld;
                if (item) {
                    if (item.memorized) this.promoteItem(item);
                    else this.toggleMemorized(item);
                }
                break;
            }
            case 'confirm-pending':
                this.confirmPending(parseInt(arg, 10));
                break;
            case 'confirm-all-pending': {
                const pc = [...(d.pendingConfirm || [])];
                for (let i = pc.length - 1; i >= 0; i--) this.confirmPending(i);
                break;
            }
            case 'bead':
                this.toggleBunkerPage(parseInt(arg, 10));
                break;
            case 'confirm-all-bunker':
                this.confirmAllBunker();
                break;
            case 'advance-next':
                this.advanceBunker();
                break;
            case 'consolidate':
                this.consolidateBucket();
                break;
            case 'show-export':
                this.setState({ showExport: !this.state.showExport });
                break;
        }
    }

    // ─────────────────────────────────────────────────────────
    // WIZARD — rendu
    // ─────────────────────────────────────────────────────────
    renderSetupWizard() {
        const w = this.state.wiz;
        return `
<div class="mj-setup">
  <div class="mj-setup-header">
    <p class="mj-setup-title">🕌 جدول المراجعة</p>
    <p class="mj-setup-sub">ابني جدولك الخاص أو استورد جدول الأستاذ</p>
  </div>
  ${!w.mode ? this.renderWizHome() : w.mode === 'build' ? this.renderWizTree() : this.renderWizImport()}
</div>`;
    }

    renderWizHome() {
        return `
<div class="mj-choice-row">
  <button class="mj-choice-btn" data-action="wiz-mode" data-arg="build">
    <span class="mj-choice-icon">✏️</span>
    <span class="mj-choice-label">أبني جدولي</span>
    <span class="mj-choice-desc">اختار السور والأجزاء التي حفظتها من الشجرة</span>
  </button>
  <button class="mj-choice-btn" data-action="wiz-mode" data-arg="import">
    <span class="mj-choice-icon">📥</span>
    <span class="mj-choice-label">استورد جدول الأستاذ</span>
    <span class="mj-choice-desc">ألصق الكود الذي أرسله الأستاذ</span>
  </button>
</div>`;
    }

    renderWizTree() {
        const w = this.state.wiz;
        const merged = this.buildRangesFromSelected();
        const totalPages = merged.reduce((s, r) => s + r.to - r.from + 1, 0);

        const tabsHtml = ['juz', 'hizb', 'surah', 'page']
            .map(
                t =>
                    `<button class="mj-wtab${w.tab === t ? ' active' : ''}" data-action="wiz-tab" data-arg="${t}">${{ juz: 'JUZ', hizb: 'HIZB', surah: 'SURAH', page: 'PAGE' }[t]}</button>`
            )
            .join('');

        const chipsHtml = w.ranges
            .map(
                (r, i) => `<div class="mj-plage-chip">
  <span class="mj-chip-label">${escapeHtml(r.label || `ص.${r.from}–${r.to}`)}</span>
  <button class="mj-chip-remove" data-action="wiz-remove-range" data-arg="${i}">⊖</button>
</div>`
            )
            .join('');

        const pageRanges = w.ranges.filter(r => r.type === 'page');
        const wheelOrPage =
            w.tab === 'page'
                ? `<div class="mj-page-input" style="padding:16px 12px">
  <div class="mj-page-labels">
    <span>من صفحة</span><span></span><span>إلى صفحة</span><span></span>
  </div>
  <div class="mj-page-row">
    <input type="number" id="mj-page-from" min="1" max="604" placeholder="1" dir="ltr">
    <span class="mj-page-sep">←</span>
    <input type="number" id="mj-page-to" min="1" max="604" placeholder="604" dir="ltr">
    <button class="mj-btn mj-btn-primary" data-action="wiz-add-page">+ إضافة</button>
  </div>
  <p class="mj-note" style="margin:6px 0 4px">المصحف من الصفحة ١ إلى ٦٠٤</p>
  ${
      pageRanges.length
          ? `<div class="mj-page-list">${pageRanges
                .map(
                    r => `<div class="mj-page-tag"><span>ص.${arN(r.from)}–${arN(r.to)}</span>
    <button class="mj-page-remove" data-action="wiz-toggle-range"
            data-from="${r.from}" data-to="${r.to}"
            data-label="${escapeHtml(r.label)}" data-rtype="page">✕</button></div>`
                )
                .join('')}</div>`
          : ''
  }
</div>`
                : `<div class="mj-wheel-track" id="mj-wt"></div>
      <div class="mj-wheel-center"></div>
      <div class="mj-wheel-caret"></div>
      <div class="mj-wheel-hub" id="mj-hub"></div>
      <div class="mj-wheel-bism">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>`;

        return `
<div class="mj-wiz-nav">
  <button class="mj-wiz-back" data-action="wiz-back">‹</button>
  <span class="mj-wiz-title">اختار ما حفظته</span>
  ${totalPages ? `<span class="mj-sel-count">${arN(totalPages)} صفحة</span>` : ''}
</div>
<div class="mj-wheel-wrap">
  ${wheelOrPage}
  <div class="mj-wheel-tabs">${tabsHtml}</div>
  ${w.tab !== 'page' ? '<p class="mj-wheel-hint">اضغط على العنصر لإضافته</p>' : ''}
</div>
${
    w.ranges.length
        ? `<div class="mj-plage-actuelle">
  <span class="mj-plage-label">الاختيار الحالي</span>
  <div class="mj-plage-chips">${chipsHtml}</div>
</div>`
        : ''
}
<button class="mj-btn mj-btn-primary mj-btn-full" data-action="wiz-finish"
        ${!w.ranges.length ? 'disabled' : ''} style="margin-top:10px">
  ✓ حفظ جدولي${totalPages ? ` (${arN(totalPages)} صفحة)` : ''}
</button>`;
    }

    // ─── Wheel picker ────────────────────────────────────────
    _getWheelItems() {
        const tab = this.state.wiz.tab;
        if (tab === 'juz')
            return JUZ_DATA.map(j => ({
                label: j.label,
                from: j.from,
                to: j.to,
                type: 'juz',
                juzNum: j.num,
            }));
        if (tab === 'hizb')
            return HIZB_DATA.map(h => ({ label: h.label, from: h.from, to: h.to, type: 'hizb' }));
        if (tab === 'surah')
            return SURAH_FULL.map(s => {
                const pEnd = this.surahPageEnd(s.num);
                return { label: s.name, from: s.page, to: pEnd, type: 'surah' };
            });
        return [];
    }

    _mountWheel() {
        const w = this.state.wiz;
        if (!w || w.mode !== 'build') return;
        const track = this.container.querySelector('#mj-wt');
        if (!track) return;

        const rect = track.getBoundingClientRect();
        const W = rect.width || 360;
        const H = rect.height || 420;

        const R = W * 0.86;
        const R0 = W * 0.33;
        this._wc = {
            W,
            H,
            R,
            R0,
            CX: W * 0.81,
            CY: H * 0.5,
            DEG: 6.4,
            WIN: 62,
            items: this._getWheelItems(),
        };
        if (!this._wc.items.length) return;

        const hub = this.container.querySelector('#mj-hub');
        if (hub) {
            hub.style.left = this._wc.CX - R0 + 'px';
            hub.style.top = this._wc.CY - R0 + 'px';
            hub.style.width = hub.style.height = R0 * 2 + 'px';
        }
        const center = this.container.querySelector('.mj-wheel-center');
        if (center) center.style.width = this._wc.CX - R0 + 'px';

        this._drawWheel(track);
        this._bindWheelTouch(track);
    }

    _drawWheel(track) {
        if (!this._wc) return;
        const { R, R0, CX, CY, DEG, WIN, items } = this._wc;
        const angle = this.state.wiz.wheelAngle || 0;
        const n = items.length;

        const h = 2 * R * Math.sin((DEG * Math.PI) / 360) - 2;
        const inset = (((1 - R0 / R) / 2) * 100).toFixed(1);
        const len = R - R0 + 4;
        const lo = Math.ceil((angle - WIN) / DEG);
        const hi = Math.floor((angle + WIN) / DEG);

        let html = '';
        for (let i = lo; i <= hi; i++) {
            const item = items[((i % n) + n) % n];
            const eff = i * DEG - angle;
            const k = Math.abs(eff) / WIN;
            const focus = Math.abs(eff) < DEG / 2;
            const added =
                item.type === 'juz'
                    ? this.juzSelectionState(item.juzNum) !== 'none'
                    : this.isRangeSelected(item.from, item.to);

            const cls = 'mj-wheel-item' + (added ? ' added' : '') + (focus ? ' focus' : '');
            html += `<div class="${cls}" data-idx="${((i % n) + n) % n}"
  style="left:${(CX - R).toFixed(1)}px;top:${(CY - h / 2).toFixed(1)}px;
         width:${len.toFixed(1)}px;height:${h.toFixed(1)}px;
         --mj-origin:${(R - 4).toFixed(1)}px;
         transform:rotate(${eff.toFixed(2)}deg);
         z-index:${60 - Math.round(Math.abs(eff))};
         opacity:${Math.max(0.1, 1 - k * 1.02).toFixed(2)};
         clip-path:polygon(0 0,100% ${inset}%,100% ${100 - inset}%,0 100%);
         font-size:${(14.5 + (1 - k) * 5).toFixed(1)}px;
         font-weight:${focus ? 800 : added ? 700 : 500}"
>${escapeHtml(item.label)}</div>`;
        }
        track.innerHTML = html;
    }

    _bindWheelTouch(track) {
        const wc = this._wc;
        let sy = 0,
            sa = 0,
            lastY = 0,
            lastT = 0,
            vel = 0,
            moved = false,
            dragging = false;

        const setA = v => {
            this.state.wiz.wheelAngle = v;
        };
        const snap = v => Math.round(v / wc.DEG) * wc.DEG;

        const onStart = e => {
            if (this._wheelRaf) {
                cancelAnimationFrame(this._wheelRaf);
                this._wheelRaf = null;
            }
            sy = lastY = e.touches ? e.touches[0].clientY : e.clientY;
            sa = this.state.wiz.wheelAngle || 0;
            lastT = performance.now();
            vel = 0;
            moved = false;
            dragging = true;
        };

        const onMove = e => {
            if (!dragging) return;
            const y = e.touches ? e.touches[0].clientY : e.clientY;
            const dy = y - sy;
            if (Math.abs(dy) > 5) moved = true;
            const now = performance.now();
            vel = (-((y - lastY) / wc.R) * (180 / Math.PI)) / Math.max(8, now - lastT);
            lastY = y;
            lastT = now;
            setA(sa - (dy / wc.R) * (180 / Math.PI));
            this._drawWheel(track);
            if (e.cancelable) e.preventDefault();
        };

        const onEnd = e => {
            if (!dragging) return;
            dragging = false;
            if (moved) {
                setA(snap((this.state.wiz.wheelAngle || 0) + vel * 90));
                this._drawWheel(track);
                return;
            }
            const el = (e.target || e.changedTouches?.[0]?.target)?.closest?.('.mj-wheel-item');
            if (!el) return;
            const item = wc.items[+el.dataset.idx];
            if (!item) return;
            const cur = this.state.wiz.wheelAngle || 0;
            const turns = Math.round((cur - +el.dataset.idx * wc.DEG) / (wc.items.length * wc.DEG));
            setA((+el.dataset.idx + turns * wc.items.length) * wc.DEG);
            if (item.type === 'juz') this.wizToggleJuz(item.juzNum);
            else this.wizToggleRange(item.from, item.to, item.label, item.type);
        };

        track.addEventListener('pointerdown', onStart);
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onEnd);
        track.addEventListener(
            'wheel',
            e => {
                setA(snap((this.state.wiz.wheelAngle || 0) + Math.sign(e.deltaY) * wc.DEG));
                this._drawWheel(track);
                e.preventDefault();
            },
            { passive: false }
        );

        this._wheelCleanup?.();
        this._wheelCleanup = () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onEnd);
        };
    }

    renderWizImport() {
        const w = this.state.wiz;
        return `
<div class="mj-wiz-nav">
  <button class="mj-wiz-back" data-action="wiz-back">‹</button>
  <span class="mj-wiz-title">استيراد جدول الأستاذ</span>
</div>
<div class="mj-card" style="display:flex;flex-direction:column;gap:10px">
  <p style="margin:0;font-size:13.5px;color:var(--text-secondary)">
    اطلب من الأستاذ يشاركك كود الجدول، ثم الصقه هنا:
  </p>
  <textarea id="mj-import-code" class="mj-code-area"
            placeholder="الصق الكود هنا..."
            dir="ltr"></textarea>
  ${w.importError ? `<p style="color:var(--mj-danger);font-size:12.5px;margin:0">${w.importError}</p>` : ''}
  <button class="mj-btn mj-btn-primary mj-btn-full" data-action="wiz-import">📥 استورد الجدول</button>
</div>`;
    }

    // ─────────────────────────────────────────────────────────
    // TRACKER — rendu
    // ─────────────────────────────────────────────────────────
    renderPage() {
        const d = this.state.d;
        const streak = this.currentStreak();
        const win = this.currentBunkerWindow();
        const reviewedToday = new Set(d.bunkerReviewedToday || []);
        const wirdDoneToday = d.wirdDoneDate === this.today();
        const wirdDone =
            (win.length > 0 && win.every(w => reviewedToday.has(w.page))) || wirdDoneToday;
        const activeItems = [d.activeNew, d.activeOld].filter(Boolean);
        const todayH = this.hist(this.today());
        const memDone =
            (todayH.memorized || []).length >= 2 ||
            (activeItems.length === 0 && (todayH.memorized || []).length > 0);
        const confDone = (todayH.confirmed || []).length > 0;
        const dayScore = (memDone ? 1 : 0) + (confDone ? 1 : 0) + (wirdDone ? 1 : 0);
        const overallPct = Math.round((this.flattenPages(d.bunkerRanges).length / 604) * 100);

        return `
<div class="mj-inner">
  ${this.renderHeader()}
  ${this.renderSummary(streak, overallPct, dayScore, win, reviewedToday, wirdDone, memDone, confDone)}
  ${this.state.selectedDay ? this.renderDayModal(this.state.selectedDay) : ''}
  ${this.renderTabNav()}
  ${this.state.tab === 'new' ? this.renderNewTab(activeItems, todayH, wirdDone) : ''}
  ${this.state.tab === 'muta' ? this.renderMutaTab(win, reviewedToday, wirdDone) : ''}
  ${this.state.tab === 'tables' ? this.renderTablesTab() : ''}
</div>`;
    }

    renderHeader() {
        const dt = new Date();
        const theme = this.state.d.theme || 'light';
        const dayLabel =
            dt.toLocaleDateString('ar', { weekday: 'long' }) +
            ' ' +
            this.ar(dt.getDate()) +
            ' ' +
            dt.toLocaleDateString('ar', { month: 'long' });
        return `
<header class="mj-header">
  <div class="mj-header-left">
    <span style="font-size:30px;line-height:1" aria-hidden="true">🕌</span>
    <div style="display:flex;flex-direction:column;gap:3px">
      <h1 class="mj-title">مراجعة القرآن</h1>
      <p class="mj-subtitle">جدول المراجعة · ${dayLabel}</p>
    </div>
  </div>
  <div style="display:flex;gap:8px;align-items:center">
    <button class="mj-edit-btn" data-action="wiz-edit" aria-label="تعديل الجدول" title="تعديل الجدول">✏️</button>
    <button class="mj-theme-btn" data-action="toggle-theme" aria-label="تبديل الوضع الليلي">
      ${theme === 'dark' ? '☀️' : '🌙'}
    </button>
  </div>
</header>`;
    }

    renderSummary(streak, overallPct, dayScore, win, reviewedToday, wirdDone, memDone, confDone) {
        const d = this.state.d;
        const activeSet = new Set(d.activeDates || []);
        const firstKey = (d.activeDates || []).slice().sort()[0];
        const winLabel = this._winLabel(win);
        const activeItems = [d.activeNew, d.activeOld].filter(Boolean);
        const reviewedInWin = win.filter(w => reviewedToday.has(w.page)).length;
        const todayH = this.hist(this.today());
        const memCount = (todayH.memorized || []).length;
        const pending = d.pendingConfirm || [];

        return `
<section class="mj-card" aria-label="ملخص اليوم">
  <div class="mj-stats-grid">
    <div class="mj-stat"><span class="mj-stat-icon">🔥</span><span class="mj-stat-value">${this.ar(streak)}</span><span class="mj-stat-label">${streak === 0 ? 'لسه ما بلّشت اليوم' : 'يوم متتالي'}</span></div>
    <div class="mj-stat"><span class="mj-stat-icon">📖</span><span class="mj-stat-value">${this.ar(overallPct)}%</span><span class="mj-stat-label">${this.ar(this.flattenPages(d.bunkerRanges).length)} من ٦٠٤ صفحة</span></div>
    <div class="mj-stat"><span class="mj-stat-icon">✅</span><span class="mj-stat-value">${this.ar(dayScore)}/٣</span><span class="mj-stat-label">من ورد اليوم</span></div>
  </div>

  <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
    <div class="mj-cal-tabs">
      <button class="mj-cal-tab${this.state.calView === 'week' ? ' active' : ''}" data-action="cal-week">الأسبوع</button>
      <button class="mj-cal-tab${this.state.calView === 'month' ? ' active' : ''}" data-action="cal-month">الشهر</button>
    </div>
    ${this.state.calView === 'month' ? this._renderMonthNav() : ''}
  </div>

  ${this.state.calView === 'week' ? this._renderWeek(activeSet, firstKey) : this._renderMonth(activeSet, firstKey)}

  <div style="display:flex;flex-direction:column;gap:8px">
    <button class="mj-plan-item${memDone ? ' done' : ''}" data-action="tab" data-arg="new"
            style="background:${memDone ? 'var(--mj-success-soft)' : 'var(--surface-raised)'}">
      <span style="font-size:20px;line-height:1">📖</span>
      <span class="mj-plan-item-info">
        <span class="mj-plan-item-title">حفظ اليوم</span>
        <span class="mj-plan-item-sub">${activeItems.length ? activeItems.map(i => 'صفحة ' + this.ar(i.page) + ' · ' + escapeHtml(i.label)).join(' — ') : 'خلصت كل القوائم 🎉'}</span>
      </span>
      <span class="mj-plan-item-status" style="color:${memDone ? 'var(--mj-success)' : 'var(--gold-700,#b8956a)'}">
        ${memDone ? '✓ تم · ' + this.ar(memCount) + ' صفحة' : activeItems.length ? this.ar(Math.max(0, 2 - memCount)) + ' باقي' : '—'}
      </span>
    </button>
    <button class="mj-plan-item" data-action="tab" data-arg="new"
            style="background:${confDone && !pending.length ? 'var(--mj-success-soft)' : 'var(--surface-raised)'}">
      <span style="font-size:20px;line-height:1">✅</span>
      <span class="mj-plan-item-info">
        <span class="mj-plan-item-title">تثبيت المحفوظ</span>
        <span class="mj-plan-item-sub">${pending.length ? 'صفحات بانتظار التثبيت بالحزب' : confDone ? 'ثبّتّ ' + this.ar((todayH.confirmed || []).length) + ' صفحة اليوم' : 'ما في شي بانتظار التثبيت'}</span>
      </span>
      <span class="mj-plan-item-status" style="color:${pending.length ? 'var(--gold-700,#b8956a)' : confDone ? 'var(--mj-success)' : 'var(--text-secondary)'}">
        ${pending.length ? this.ar(pending.length) + ' بانتظار' : confDone ? '✓ تم' : '— لا شي بعد'}
      </span>
    </button>
    <button class="mj-plan-item${wirdDone ? ' done' : ''}" data-action="tab" data-arg="muta"
            style="background:${wirdDone ? 'var(--mj-success-soft)' : 'var(--surface-raised)'}">
      <span style="font-size:20px;line-height:1">🔁</span>
      <span class="mj-plan-item-info">
        <span class="mj-plan-item-title">ورد المراجعة</span>
        <span class="mj-plan-item-sub">${escapeHtml(winLabel || 'ما في ورد اليوم')}</span>
      </span>
      <span class="mj-plan-item-status" style="color:${wirdDone ? 'var(--mj-success)' : 'var(--gold-700,#b8956a)'}">
        ${wirdDone ? '✓ تم' : this.ar(reviewedInWin) + '/' + this.ar(win.length)}
      </span>
    </button>
  </div>
</section>`;
    }

    _winLabel(win) {
        if (!win.length) return '';
        const a = this.surahAtPage(win[0].page) || win[0].label || '';
        const b = this.surahAtPage(win[win.length - 1].page) || win[win.length - 1].label || '';
        return a === b ? a : 'من ' + a + ' إلى ' + b;
    }

    _renderWeek(activeSet, firstKey) {
        const now = new Date();
        const cells = [];
        for (let i = 0; i < 7; i++) {
            const dt = new Date();
            dt.setDate(now.getDate() - now.getDay() + i);
            const key = this.dateKey(dt);
            const isToday = key === this.today();
            const done = activeSet.has(key);
            const tracked = firstKey && key >= firstKey && dt < now && !isToday;
            const bg = done
                ? 'var(--mj-success-soft)'
                : tracked
                  ? 'var(--mj-danger-soft)'
                  : 'var(--surface-raised)';
            const mark = done ? '✓' : tracked ? '✕' : isToday ? '•' : '';
            const markColor = done
                ? 'var(--mj-success)'
                : tracked
                  ? 'var(--mj-danger)'
                  : 'var(--mj-warning)';
            cells.push(`
<button class="mj-week-day" data-action="day-open" data-arg="${key}"
        style="background:${bg};border-color:${isToday ? 'var(--color-primary)' : 'transparent'}">
  <span class="mj-week-day-dow">${this.DAY_LABELS[i].slice(0, 4)}</span>
  <span class="mj-week-day-num">${this.ar(dt.getDate())}</span>
  <span class="mj-week-day-mark" style="color:${markColor}">${mark}</span>
</button>`);
        }
        return `<div class="mj-week">${cells.join('')}</div>
<p class="mj-note">دوس على أي يوم لتشوف إنجازه</p>`;
    }

    _renderMonthNav() {
        const base = new Date();
        base.setDate(1);
        base.setMonth(base.getMonth() + this.state.calOffset);
        const label =
            base.toLocaleDateString('ar', { month: 'long' }) + ' ' + this.ar(base.getFullYear());
        return `<div style="display:flex;align-items:center;gap:8px">
  <button class="mj-modal-close" data-action="prev-month" style="width:30px;height:30px;border-radius:8px">›</button>
   <span style="font-size:12.5px;font-weight:700">${escapeHtml(label)}</span>
  <button class="mj-modal-close" data-action="next-month" style="width:30px;height:30px;border-radius:8px">‹</button>
</div>`;
    }

    _renderMonth(activeSet, firstKey) {
        const now = new Date();
        const base = new Date();
        base.setDate(1);
        base.setMonth(base.getMonth() + this.state.calOffset);
        const year = base.getFullYear(),
            month = base.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const lead = new Date(year, month, 1).getDay();
        let monthDone = 0;
        const headers = ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'];
        const hRow = headers
            .map(
                h =>
                    `<span style="text-align:center;font-size:10.5px;font-weight:600;color:var(--text-secondary)">${h}</span>`
            )
            .join('');
        const blanks = Array(lead).fill('<span></span>').join('');
        const cells = [];
        for (let day = 1; day <= daysInMonth; day++) {
            const dt = new Date(year, month, day);
            const key = this.dateKey(dt);
            const done = activeSet.has(key);
            const isToday = key === this.today();
            const past = dt < now && !isToday;
            const tracked = firstKey && key >= firstKey && past;
            if (done) monthDone++;
            const bg = done
                ? 'var(--mj-success-soft)'
                : tracked
                  ? 'var(--mj-danger-soft)'
                  : 'var(--surface-raised)';
            const fg = done ? 'var(--mj-success)' : 'var(--text-secondary)';
            const border = isToday
                ? '2px solid var(--color-primary)'
                : '1px solid var(--border-subtle)';
            const mark = done ? '✓' : tracked ? '✕' : '';
            cells.push(
                `<button style="min-height:36px;padding:3px 0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;border-radius:9px;font:inherit;font-size:12px;font-weight:600;background:${bg};color:${fg};border:${border};cursor:${done || isToday ? 'pointer' : 'default'}" data-action="${done || isToday ? 'day-open' : ''}" data-arg="${key}"><span>${this.ar(day)}</span><span style="font-size:9px">${mark}</span></button>`
            );
        }
        return `<div style="display:flex;flex-direction:column;gap:6px">
  <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:5px;max-width:340px;margin:0 auto;width:100%">${hRow}</div>
  <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:5px;max-width:340px;margin:0 auto;width:100%">${blanks}${cells.join('')}</div>
  <p class="mj-note">${this.ar(monthDone)} يوم نشيط من ${this.ar(daysInMonth)} · دوس على أي يوم لتشوف إنجازه</p>
</div>`;
    }

    renderDayModal(key) {
        const d = this.state.d;
        const h = (d.history || {})[key] || {};
        const dt = new Date(key + 'T12:00:00');
        const title =
            dt.toLocaleDateString('ar', { weekday: 'long' }) +
            ' ' +
            this.ar(dt.getDate()) +
            ' ' +
            dt.toLocaleDateString('ar', { month: 'long' });
        const mem = h.memorized || [],
            con = h.confirmed || [],
            wirds = h.wirds || [];
        const isEmpty = !mem.length && !con.length && !wirds.length && !h.hizb && !h.cycles;
        const tasks = [
            {
                icon: '📖',
                title: 'حفظ اليوم',
                ok: mem.length > 0,
                text: this.ar(mem.length) + ' صفحة',
            },
            {
                icon: '✅',
                title: 'تثبيت المحفوظ',
                ok: con.length > 0,
                text: this.ar(con.length) + ' صفحة',
            },
            {
                icon: '🔁',
                title: 'ورد المراجعة',
                ok: wirds.length > 0,
                text: this.ar(wirds.length) + ' ورد',
            },
        ];
        const lines = [];
        if (wirds.length)
            lines.push({
                icon: '🔁',
                title: this.ar(wirds.length) + ' ورد مراجعة',
                sub: wirds.map(w => this.ar(w.from) + '–' + this.ar(w.to)).join(' · '),
            });
        if (mem.length)
            lines.push({
                icon: '📖',
                title: 'حفظ ' + this.ar(mem.length) + ' صفحة',
                sub:
                    mem.map(m => this.ar(m.page)).join('، ') +
                    ' — ' +
                    [...new Set(mem.map(m => m.label))].map(escapeHtml).join('، '),
            });
        if (con.length)
            lines.push({
                icon: '✅',
                title: 'تثبيت ' + this.ar(con.length) + ' صفحة',
                sub: con.map(c => this.ar(c.page)).join('، '),
            });
        if (h.hizb)
            lines.push({ icon: '🏛', title: this.ar(h.hizb) + ' حزب دخل دورة المراجعة', sub: '' });
        if (h.cycles)
            lines.push({ icon: '🎉', title: this.ar(h.cycles) + ' دورة مراجعة كاملة', sub: '' });
        return `
<div class="mj-modal-overlay" data-action="day-close">
  <div class="mj-modal" onclick="event.stopPropagation()">
    <div class="mj-flex-between">
      <h3 class="mj-modal-title">إنجاز ${title}</h3>
      <button class="mj-modal-close" data-action="day-close">✕</button>
    </div>
    <div style="display:flex;flex-direction:column;gap:6px">
      ${tasks
          .map(
              t => `<div class="mj-day-row" style="background:${t.ok ? 'var(--mj-success-soft)' : 'var(--surface-raised)'}">
        <span style="font-size:17px;line-height:1">${t.icon}</span>
        <span style="flex:1;font-size:13px;font-weight:700">${t.title}</span>
        <span style="font-size:12px;font-weight:700;color:${t.ok ? 'var(--mj-success)' : 'var(--text-secondary)'}">
          ${t.ok ? '✓ ' + t.text : '— ما تم'}
        </span>
      </div>`
          )
          .join('')}
    </div>
    ${isEmpty ? `<p class="mj-note">${(d.activeDates || []).includes(key) ? 'هاليوم مسجّل نشيط ✓ — التفاصيل ما كانت تنحفظ بالنسخة القديمة.' : 'هاليوم لسه ما فيه إنجاز مسجّل 🌱'}</p>` : ''}
    <div style="display:flex;flex-direction:column;gap:6px;max-height:280px;overflow-y:auto">
      ${lines
          .map(
              l => `<div class="mj-day-line">
        <span style="font-size:16px;line-height:1">${l.icon}</span>
        <div class="mj-day-line-info">
           <span class="mj-day-line-title">${escapeHtml(l.title)}</span>
           ${l.sub ? `<span class="mj-day-line-sub">${escapeHtml(l.sub)}</span>` : ''}
        </div>
      </div>`
          )
          .join('')}
    </div>
  </div>
</div>`;
    }

    renderTabNav() {
        const t = this.state.tab;
        return `
<nav class="mj-tab-nav" aria-label="الأقسام">
  <button class="mj-tab-btn${t === 'new' ? ' active' : ''}"    data-action="tab" data-arg="new">🆕 حفظ جديد</button>
  <button class="mj-tab-btn${t === 'muta' ? ' active' : ''}"   data-action="tab" data-arg="muta">🔁 مراجعة</button>
  <button class="mj-tab-btn${t === 'tables' ? ' active' : ''}" data-action="tab" data-arg="tables">📊 التقدم</button>
</nav>`;
    }

    renderNewTab(activeItems, todayH, _wirdDone) {
        const d = this.state.d;
        const pending = d.pendingConfirm || [];
        const bucket = d.bucket || [];
        const memoCards = activeItems
            .map(item => {
                const done = item.memorized;
                return `
<div class="mj-memo-card${done ? ' done' : ''}">
  <div class="mj-memo-page-num">${this.ar(item.page)}</div>
  <div class="mj-memo-info">
   <span class="mj-memo-name">${escapeHtml(item.label)}</span>
    <span class="mj-memo-tag">${item.source === 'new' ? '🆕 حفظ جديد' : '📗 مراجعة قديم'}</span>
  </div>
  <button class="mj-btn${done ? ' mj-btn-primary' : ' mj-btn-outline'}"
          data-action="toggle-memo" data-arg="${item.source}">
    ${done ? '✓ إرسال للتثبيت' : '✓ حفظت'}
  </button>
</div>`;
            })
            .join('');
        const pendingRows = pending
            .map(
                (p, i) => `
<div class="mj-pending-item">
  <span class="mj-pending-num">${this.ar(p.page)}</span>
  <span class="mj-pending-label">${p.source === 'new' ? '🆕' : '📗'} ${escapeHtml(p.label)}</span>
  <button class="mj-btn mj-btn-outline" data-action="confirm-pending" data-arg="${i}">✓ ثبّت</button>
</div>`
            )
            .join('');
        const bucketBeads = bucket
            .slice(0, 15)
            .map(
                b => `
<div class="mj-bead-wrap">
  <div class="mj-bead mj-bead-static" style="border-style:${b.source === 'old' ? 'dashed' : 'solid'}">${this.ar(b.page)}</div>
   <span class="mj-bead-label">${escapeHtml(b.label)}</span>
</div>`
            )
            .join('');
        return `
<section class="mj-card" aria-label="حفظ جديد">
  ${
      activeItems.length
          ? `<div class="mj-flex-between">
           <h2 class="mj-section-title">📖 حفظ اليوم</h2>
           <span class="mj-count">${this.ar((todayH.memorized || []).length)} / ٢ صفحة</span>
         </div>${memoCards}`
          : `<p class="mj-empty">خلصت كل قوائم الحفظ 🎉</p>`
  }
  ${
      pending.length
          ? `<div class="mj-divider"></div>
         <div class="mj-flex-between">
           <h2 class="mj-section-title gold">⏳ بانتظار التثبيت</h2>
           <span class="mj-count">${this.ar(pending.length)} صفحة</span>
         </div>
         ${pending.length > 1 ? `<button class="mj-btn mj-btn-primary mj-btn-full" data-action="confirm-all-pending">✓ ثبّت الكل دفعة وحدة</button>` : ''}
         ${pendingRows}`
          : ''
  }
  ${
      bucket.length
          ? `<div class="mj-divider"></div>
         <div class="mj-flex-between">
           <h2 class="mj-section-title gold">🟠 الحزب قيد التكوين</h2>
           <span class="mj-count">${this.ar(Math.min(bucket.length, 10))} / ١٠</span>
         </div>
         <div class="mj-progress" style="height:6px"><div class="mj-progress-fill" style="width:${Math.min(100, Math.round((bucket.length / 10) * 100))}%"></div></div>
         <div class="mj-beads">${bucketBeads}</div>
         <p class="mj-note">🆕 جديد (خط متصل) · 📗 قديم (خط متقطع)</p>
         <button class="mj-btn mj-btn-primary mj-btn-full" data-action="consolidate" ${bucket.length < 10 ? 'disabled' : ''}>✓ راجعت الحزب كامل — ثبّته بالدورة</button>`
          : ''
  }
</section>`;
    }

    renderMutaTab(win, reviewedToday, wirdDone) {
        const d = this.state.d;
        const reviewedInWin = win.filter(w => reviewedToday.has(w.page)).length;
        const winLabel = this._winLabel(win);
        const pct = win.length ? Math.round((reviewedInWin / win.length) * 100) : 0;
        const totalPages = this.flattenPages(d.bunkerRanges).length;
        const cycleSet = new Set(d.cycleReviewed || []);
        const cycleCount = cycleSet.size;
        const beads = win
            .map(w => {
                const done = reviewedToday.has(w.page);
                const label = this.surahAtPage(w.page) || w.label || '';
                return `
 <div class="mj-bead-wrap">
   <button class="mj-bead${done ? ' done' : ' todo'}" data-action="bead" data-arg="${w.page}" title="${escapeHtml(label)}">${this.ar(w.page)}</button>
   <span class="mj-bead-label">${escapeHtml(label)}</span>
</div>`;
            })
            .join('');
        return `
<section class="mj-card" aria-label="مراجعة">
  <div class="mj-flex-between">
    <h2 class="mj-section-title">🟢 ورد اليوم من الثابت</h2>
    <span class="mj-count">${this.ar(reviewedInWin)} / ${this.ar(win.length)}</span>
  </div>
   ${winLabel ? `<p style="margin:0;font-size:13px;font-weight:600;color:var(--gold-700,#b8956a)">${escapeHtml(winLabel)}</p>` : ''}
  <div class="mj-progress" style="height:6px"><div class="mj-progress-fill" style="width:${pct}%"></div></div>
  <div class="mj-beads">${beads}</div>
  <div class="mj-btn-row">
    <button class="mj-btn mj-btn-outline" data-action="confirm-all-bunker">✓ سمّعت الورد كامل</button>
    <button class="mj-btn mj-btn-ghost" data-action="advance-next" title="ينتقل تلقائيًا بكرا">⏭ الورد الجاي</button>
  </div>
  ${wirdDone ? `<p class="mj-success-note">✅ خلصت ورد اليوم</p>` : ''}
  <p class="mj-note">${d.bunkerHistory || ''}</p>
  ${totalPages ? `<p class="mj-note">الدورة الحالية: ${this.ar(cycleCount)} / ${this.ar(totalPages)} صفحة · ${this.ar(d.cyclesDone || 0)} دورة مكتملة</p>` : ''}
</section>`;
    }

    renderTablesTab() {
        const d = this.state.d;
        const bunkerRows = d.bunkerRanges || [];
        const cycleSet = new Set(d.cycleReviewed || []);
        const showExport = this.state.showExport;
        const exportCode = showExport ? this.getExportCode() : '';

        const rows = bunkerRows
            .map(r => {
                const pagesInRange = this.flattenPages([r]);
                const reviewed = pagesInRange.filter(p => cycleSet.has(p.page)).length;
                const status =
                    reviewed === pagesInRange.length
                        ? `<span style="color:var(--mj-success);font-weight:700">✓ مراجعة هالدورة</span>`
                        : `<span style="color:var(--text-secondary)">${this.ar(reviewed)}/${this.ar(pagesInRange.length)}</span>`;
                return `<tr>
  <td>${escapeHtml(r.label)}</td>
  <td style="font-variant-numeric:tabular-nums">${this.ar(r.from)}</td>
  <td style="font-variant-numeric:tabular-nums">${this.ar(r.to)}</td>
  <td>${status}</td>
</tr>`;
            })
            .join('');

        return `
<section class="mj-card" aria-label="التقدم">
  <h2 class="mj-section-title">🟢 جدول المراجعة — كل الثابت</h2>
  <div class="mj-table-wrap">
    <table class="mj-table">
      <thead><tr>
        <th>المقطع</th><th>من</th><th>إلى</th><th>الحالة</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
  <p class="mj-note">إجمالي الصفحات الثابتة: ${this.ar(this.flattenPages(d.bunkerRanges).length)} صفحة · ${this.ar(d.cyclesDone || 0)} دورة مكتملة</p>

  <div class="mj-divider"></div>
  <button class="mj-btn mj-btn-outline mj-btn-full" data-action="show-export">
     ${showExport ? '▲ إخفاء كود المشاركة' : '📤 شارك الجدول مع الطلاب'}
  </button>
  ${
      showExport
          ? `
  <div class="mj-export-wrap" style="background:var(--surface-raised);border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:8px">
    <p style="margin:0;font-size:12.5px;color:var(--text-secondary)">انسخ هذا الكود وأرسله للطلاب — سيستوردون جدولك مباشرة:</p>
    <textarea id="mj-export-code" class="mj-code-area" readonly dir="ltr"
              style="width:100%;min-height:60px;border-radius:10px;border:1.5px solid var(--border-subtle);background:var(--surface-card);color:var(--text-primary);font:12px/1.5 monospace;padding:10px;box-sizing:border-box;resize:none"
              onclick="this.select()">${exportCode}</textarea>
    <button class="mj-btn mj-btn-primary" data-action="export-copy">${this.state.exportCopied ? '✓ تم النسخ' : '📋 انسخ الكود'}</button>
  </div>`
          : ''
  }
</section>`;
    }
}

// Exports nommés conservés pour permettre des tests unitaires sans dépendance
// à l’interface ou au backend.
export { MurajaaTracker, JUZ_DATA, HIZB_DATA, SURAH_FULL };
