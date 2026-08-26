// RevisionPage.js — Murajaa Tracker (جدول المراجعة)
// Implémentation native ES module — aucun iframe, aucun framework externe.

export function render() {
    return `<div id="mj-root" class="mj-page page active" dir="rtl" lang="ar"></div>`;
}

export function init() {
    const root = document.getElementById('mj-root');
    if (!root) return;
    const app = new MurajaaTracker(root);
    app.mount();
    // Nettoyage quand on quitte la page
    root._mjUnmount = () => app.unmount();
}

// ─────────────────────────────────────────────────────────────
// Classe principale
// ─────────────────────────────────────────────────────────────
class MurajaaTracker {
    KEY = 'murajaa_v4';
    OLD_KEY = 'murajaa_v3';
    START_DAY = '2026-08-21';
    BATCH = 10;
    DAY_LABELS = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

    SURAH_STARTS = [
        { name: 'الفاتحة', page: 1 },
        { name: 'البقرة', page: 2 },
        { name: 'آل عمران', page: 50 },
        { name: 'النساء', page: 77 },
        { name: 'المائدة', page: 106 },
        { name: 'الأنعام', page: 128 },
        { name: 'الأعراف', page: 151 },
        { name: 'الأنفال', page: 177 },
        { name: 'التوبة', page: 187 },
        { name: 'يونس', page: 208 },
        { name: 'هود', page: 221 },
        { name: 'يوسف', page: 235 },
        { name: 'الرعد', page: 249 },
        { name: 'إبراهيم', page: 255 },
        { name: 'الحجر', page: 262 },
        { name: 'النحل', page: 267 },
        { name: 'الإسراء', page: 282 },
        { name: 'الكهف', page: 293 },
        { name: 'مريم', page: 305 },
        { name: 'طه', page: 312 },
        { name: 'الأنبياء', page: 322 },
        { name: 'الحج', page: 332 },
        { name: 'المؤمنون', page: 342 },
        { name: 'النور', page: 350 },
        { name: 'الفرقان', page: 359 },
        { name: 'الشعراء', page: 367 },
        { name: 'النمل', page: 377 },
        { name: 'القصص', page: 385 },
        { name: 'العنكبوت', page: 396 },
        { name: 'الروم', page: 404 },
        { name: 'لقمان', page: 411 },
        { name: 'السجدة', page: 415 },
        { name: 'الأحزاب', page: 418 },
        { name: 'سبأ', page: 428 },
        { name: 'فاطر', page: 434 },
        { name: 'يس', page: 440 },
        { name: 'الصافات', page: 446 },
        { name: 'ص', page: 453 },
        { name: 'الزمر', page: 458 },
        { name: 'غافر', page: 467 },
        { name: 'فصلت', page: 477 },
        { name: 'الشورى', page: 483 },
        { name: 'الزخرف', page: 489 },
        { name: 'الدخان', page: 496 },
        { name: 'الجاثية', page: 499 },
        { name: 'الأحقاف', page: 502 },
        { name: 'محمد', page: 507 },
        { name: 'الفتح', page: 511 },
        { name: 'الحجرات', page: 515 },
        { name: 'ق', page: 518 },
        { name: 'الذاريات', page: 520 },
        { name: 'الطور', page: 523 },
        { name: 'النجم', page: 526 },
        { name: 'القمر', page: 528 },
        { name: 'الرحمن', page: 531 },
        { name: 'الواقعة', page: 534 },
        { name: 'الحديد', page: 537 },
        { name: 'المجادلة', page: 542 },
        { name: 'الحشر', page: 545 },
        { name: 'الممتحنة', page: 549 },
        { name: 'الصف', page: 551 },
        { name: 'الجمعة', page: 553 },
        { name: 'المنافقون', page: 554 },
        { name: 'التغابن', page: 556 },
        { name: 'الطلاق', page: 558 },
        { name: 'التحريم', page: 560 },
        { name: 'الملك', page: 562 },
        { name: 'القلم', page: 564 },
        { name: 'الحاقة', page: 566 },
        { name: 'المعارج', page: 568 },
        { name: 'نوح', page: 570 },
        { name: 'الجن', page: 572 },
        { name: 'المزمل', page: 574 },
        { name: 'المدثر', page: 575 },
        { name: 'القيامة', page: 577 },
        { name: 'الإنسان', page: 578 },
        { name: 'المرسلات', page: 580 },
        { name: 'النبأ', page: 582 },
        { name: 'النازعات', page: 583 },
        { name: 'عبس', page: 585 },
        { name: 'التكوير', page: 586 },
        { name: 'الانفطار', page: 587 },
        { name: 'المطففين', page: 587 },
        { name: 'الانشقاق', page: 589 },
        { name: 'البروج', page: 590 },
        { name: 'الطارق', page: 591 },
        { name: 'الأعلى', page: 591 },
        { name: 'الغاشية', page: 592 },
        { name: 'الفجر', page: 593 },
        { name: 'البلد', page: 594 },
        { name: 'الشمس', page: 595 },
        { name: 'الليل', page: 595 },
        { name: 'الضحى', page: 596 },
        { name: 'الشرح', page: 596 },
        { name: 'التين', page: 597 },
        { name: 'العلق', page: 597 },
        { name: 'القدر', page: 598 },
        { name: 'البينة', page: 598 },
        { name: 'الزلزلة', page: 599 },
        { name: 'العاديات', page: 599 },
        { name: 'القارعة', page: 600 },
        { name: 'التكاثر', page: 600 },
        { name: 'العصر', page: 601 },
        { name: 'الهمزة', page: 601 },
        { name: 'الفيل', page: 601 },
        { name: 'قريش', page: 602 },
        { name: 'الماعون', page: 602 },
        { name: 'الكوثر', page: 602 },
        { name: 'الكافرون', page: 603 },
        { name: 'النصر', page: 603 },
        { name: 'المسد', page: 603 },
        { name: 'الإخلاص', page: 604 },
        { name: 'الفلق', page: 604 },
        { name: 'الناس', page: 604 },
    ];

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
    };

    constructor(container) {
        this.container = container;
        this.state = {
            d: this.loadData(),
            tab: 'new',
            calView: 'week',
            calOffset: 0,
            selectedDay: null,
        };
        this._bound = null; // listener délégué
    }

    // ── Cycle de vie ──────────────────────────────────────────
    mount() {
        this.autoAdvanceBunker();
        this.promoteByDate();
        this.ensureActiveTargets();
        this.repairFusedRanges();
        this.normalizeRanges();
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
        document.removeEventListener('visibilitychange', this._onVis);
        window.removeEventListener('beforeunload', this._onLeave);
        window.removeEventListener('pagehide', this._onLeave);
        if (this._bound) this.container.removeEventListener('click', this._bound);
    }

    // ── Persistance ───────────────────────────────────────────
    loadData() {
        const base = JSON.parse(JSON.stringify(this.DEFAULTS));
        try {
            const raw = localStorage.getItem(this.KEY) || localStorage.getItem(this.OLD_KEY);
            if (raw) return Object.assign(base, JSON.parse(raw));
        } catch (e) {
            /* ignore parse errors, use defaults */
        }
        return base;
    }

    persist() {
        try {
            localStorage.setItem(this.KEY, JSON.stringify(this.state.d));
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

    // ── Helpers ───────────────────────────────────────────────
    ar(n) {
        return String(n).replace(/[0-9]/g, ch => '٠١٢٣٤٥٦٧٨٩'[+ch]);
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
        for (const s of this.SURAH_STARTS) {
            if (s.page <= page) best = s;
            else break;
        }
        return best ? best.name : null;
    }

    flattenPages(ranges) {
        const pages = [];
        (ranges || []).forEach(r => {
            const from = parseInt(r.from, 10),
                to = parseInt(r.to, 10);
            if (Number.isFinite(from) && Number.isFinite(to) && to >= from)
                for (let p = from; p <= to; p++) pages.push({ page: p, label: r.label });
        });
        return pages;
    }

    flattenQueue(items) {
        const pages = [];
        items.forEach(it => {
            for (let p = it.start; p <= it.end; p++) pages.push({ page: p, label: it.name });
        });
        return pages;
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
            if (item)
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
        const src = [...(d.bunkerRanges || [])]
            .map(r => ({ from: +r.from, to: +r.to, label: r.label }))
            .filter(r => Number.isFinite(r.from) && Number.isFinite(r.to))
            .sort((a, b) => a.from - b.from);
        const out = [];
        src.forEach(r => {
            const last = out[out.length - 1];
            if (last && last.label === r.label && r.from <= last.to + 1)
                last.to = Math.max(last.to, r.to);
            else out.push({ ...r });
        });
        if (out.length !== (d.bunkerRanges || []).length) d.bunkerRanges = out;
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

    // ── Actions ───────────────────────────────────────────────
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
        d.pendingConfirm.push({ page: item.page, label: item.label, source: item.source });
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
        d.bucket.push({ page: item.page, label: item.label, source: item.source });
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
        // Supprimer le listener précédent avant de réinjecter le HTML
        if (this._bound) {
            this.container.removeEventListener('click', this._bound);
            this._bound = null;
        }
        this.container.innerHTML = this.renderPage();
        // Appliquer le thème
        if ((this.state.d.theme || 'light') === 'dark')
            this.container.setAttribute('data-dark', '');
        else this.container.removeAttribute('data-dark');
        this.bindEvents();
    }

    bindEvents() {
        this._bound = e => {
            const el = e.target.closest('[data-action]');
            if (!el) return;
            const act = el.dataset.action;
            const arg = el.dataset.arg;
            this._dispatch(act, arg, e);
        };
        this.container.addEventListener('click', this._bound);
    }

    _dispatch(act, arg) {
        const d = this.state.d;
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
            case 'day-open': {
                this.syncTodayHistory();
                this.persist();
                this.setState({ selectedDay: arg });
                break;
            }
            case 'day-close':
                this.setState({ selectedDay: null });
                break;
            case 'toggle-theme': {
                d.theme = (d.theme || 'light') === 'dark' ? 'light' : 'dark';
                this.commit();
                break;
            }
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
        }
    }

    // ── Templates HTML ────────────────────────────────────────
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
  ${this.state.tab === 'muta' ? this.renderMutaTab(win, reviewedToday, wirdDone, wirdDoneToday) : ''}
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
      <p class="mj-subtitle">الشيخ أحمد · ${dayLabel}</p>
    </div>
  </div>
  <button class="mj-theme-btn" data-action="toggle-theme" aria-label="تبديل الوضع الليلي">
    ${theme === 'dark' ? '☀️' : '🌙'}
  </button>
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
        <span class="mj-plan-item-sub">${activeItems.length ? activeItems.map(i => 'صفحة ' + this.ar(i.page) + ' · ' + i.label).join(' — ') : 'خلصت كل القوائم 🎉'}</span>
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
        <span class="mj-plan-item-sub">${winLabel || 'ما في ورد اليوم'}</span>
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
  <button class="mj-modal-close" data-action="prev-month" aria-label="الشهر السابق" style="width:30px;height:30px;border-radius:8px">›</button>
  <span style="font-size:12.5px;font-weight:700">${label}</span>
  <button class="mj-modal-close" data-action="next-month" aria-label="الشهر الجاي" style="width:30px;height:30px;border-radius:8px">‹</button>
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
                    [...new Set(mem.map(m => m.label))].join('، '),
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
          <span class="mj-day-line-title">${l.title}</span>
          ${l.sub ? `<span class="mj-day-line-sub">${l.sub}</span>` : ''}
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
    <span class="mj-memo-name">${item.label}</span>
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
  <span class="mj-pending-label">${p.source === 'new' ? '🆕' : '📗'} ${p.label}</span>
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
  <span class="mj-bead-label">${b.label}</span>
</div>`
            )
            .join('');

        return `
<section class="mj-card" aria-label="حفظ جديد">
  ${
      activeItems.length
          ? `
    <div class="mj-flex-between">
      <h2 class="mj-section-title">📖 حفظ اليوم</h2>
      <span class="mj-count">${this.ar((todayH.memorized || []).length)} / ٢ صفحة</span>
    </div>
    ${memoCards}
  `
          : `<p class="mj-empty">خلصت كل قوائم الحفظ 🎉</p>`
  }

  ${
      pending.length
          ? `
    <div class="mj-divider"></div>
    <div class="mj-flex-between">
      <h2 class="mj-section-title gold">⏳ بانتظار التثبيت</h2>
      <span class="mj-count">${this.ar(pending.length)} صفحة</span>
    </div>
    ${pending.length > 1 ? `<button class="mj-btn mj-btn-primary mj-btn-full" data-action="confirm-all-pending">✓ ثبّت الكل دفعة وحدة</button>` : ''}
    ${pendingRows}
  `
          : ''
  }

  ${
      bucket.length
          ? `
    <div class="mj-divider"></div>
    <div class="mj-flex-between">
      <h2 class="mj-section-title gold">🟠 الحزب قيد التكوين</h2>
      <span class="mj-count">${this.ar(Math.min(bucket.length, 10))} / ١٠</span>
    </div>
    <div class="mj-progress" style="height:6px"><div class="mj-progress-fill" style="width:${Math.min(100, Math.round((bucket.length / 10) * 100))}%"></div></div>
    <div class="mj-beads">${bucketBeads}</div>
    <p class="mj-note">🆕 جديد (خط متصل) · 📗 قديم (خط متقطع)</p>
    <button class="mj-btn mj-btn-primary mj-btn-full" data-action="consolidate" ${bucket.length < 10 ? 'disabled' : ''}>✓ راجعت الحزب كامل — ثبّته بالدورة</button>
  `
          : ''
  }
</section>`;
    }

    renderMutaTab(win, reviewedToday, wirdDone, _wirdDoneToday) {
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
  <button class="mj-bead${done ? ' done' : ' todo'}" data-action="bead" data-arg="${w.page}" title="${label}">${this.ar(w.page)}</button>
  <span class="mj-bead-label">${label}</span>
</div>`;
            })
            .join('');

        return `
<section class="mj-card" aria-label="مراجعة">
  <div class="mj-flex-between">
    <h2 class="mj-section-title">🟢 ورد اليوم من الثابت</h2>
    <span class="mj-count">${this.ar(reviewedInWin)} / ${this.ar(win.length)}</span>
  </div>
  ${winLabel ? `<p style="margin:0;font-size:13px;font-weight:600;color:var(--gold-700,#b8956a)">${winLabel}</p>` : ''}
  <div class="mj-progress" style="height:6px"><div class="mj-progress-fill" style="width:${pct}%"></div></div>
  <div class="mj-beads">${beads}</div>
  <div class="mj-btn-row">
    <button class="mj-btn mj-btn-outline" data-action="confirm-all-bunker">✓ سمّعت الورد كامل</button>
    <button class="mj-btn mj-btn-ghost" data-action="advance-next" title="ينتقل تلقائيًا بكرا — هالزر بس إذا بدك تسبقه">⏭ الورد الجاي</button>
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

        const rows = bunkerRows
            .map(r => {
                const pagesInRange = this.flattenPages([r]);
                const reviewed = pagesInRange.filter(p => cycleSet.has(p.page)).length;
                const status =
                    reviewed === pagesInRange.length
                        ? `<span style="color:var(--mj-success);font-weight:700">✓ مراجعة هالدورة</span>`
                        : `<span style="color:var(--text-secondary)">${this.ar(reviewed)}/${this.ar(pagesInRange.length)}</span>`;
                return `<tr>
  <td>${r.label}</td>
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
</section>`;
    }
}
