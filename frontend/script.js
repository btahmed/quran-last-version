/**
 * QURAN REVIEW - JAVASCRIPT APPLICATION
 * Professional Quran Memorization & Review System
 */

// ===================================
// UTILS - LOGGER
// ===================================

const Logger = {
    debugMode: true,
    _history: [],
    _maxHistory: 500,
    _styles: {
        LOG:   'color: #2d5016; font-weight: bold;',
        WARN:  'color: #ffc107; font-weight: bold;',
        ERROR: 'color: #dc3545; font-weight: bold;',
        CLICK: 'color: #6f42c1; font-weight: bold;',
        API:   'color: #0d6efd; font-weight: bold;',
        NAV:   'color: #20c997; font-weight: bold;',
        AUDIO: 'color: #fd7e14; font-weight: bold;',
        AUTH:  'color: #e83e8c; font-weight: bold;',
        STATE: 'color: #6610f2; font-weight: bold;',
        STORE: 'color: #795548; font-weight: bold;',
    },

    _push(level, category, message, data) {
        const entry = {
            time: new Date().toISOString(),
            ts: new Date().toLocaleTimeString(),
            level,
            category,
            message,
            data: data || null
        };
        this._history.push(entry);
        if (this._history.length > this._maxHistory) this._history.shift();
        return entry;
    },

    log(category, message, data = null) {
        if (!this.debugMode) return;
        const e = this._push('LOG', category, message, data);
        const s = this._styles[category] || this._styles.LOG;
        console.log(`%c[${e.ts}] [${category}] ${message}`, s);
        if (data) console.log('  📝', data);
    },

    error(category, message, error = null) {
        const e = this._push('ERROR', category, message, error);
        console.error(`%c[${e.ts}] [${category}] ❌ ${message}`, this._styles.ERROR);
        if (error) {
            console.error('  🔍 Details:', error);
            if (error.stack) console.error('  Stack:', error.stack);
        }
    },

    warn(category, message, data = null) {
        if (!this.debugMode) return;
        const e = this._push('WARN', category, message, data);
        console.warn(`%c[${e.ts}] [${category}] ⚠️ ${message}`, this._styles.WARN);
        if (data) console.warn('  📝', data);
    },

    // --- CLICK TRACKER ---
    click(element, extra = null) {
        if (!this.debugMode) return;
        const tag = element.tagName?.toLowerCase() || '?';
        const id = element.id ? `#${element.id}` : '';
        const cls = element.className ? `.${String(element.className).split(' ')[0]}` : '';
        const text = (element.textContent || '').trim().slice(0, 40);
        const msg = `${tag}${id}${cls} → "${text}"`;
        this._push('CLICK', 'CLICK', msg, extra);
        console.log(`%c[${new Date().toLocaleTimeString()}] [CLICK] 🖱️ ${msg}`, this._styles.CLICK);
    },

    // --- API TRACKER ---
    async api(method, url, options = {}) {
        const start = performance.now();
        this._push('LOG', 'API', `→ ${method} ${url}`);
        console.log(`%c[${new Date().toLocaleTimeString()}] [API] → ${method} ${url}`, this._styles.API);
        try {
            const response = await fetch(url, { method, ...options });
            const duration = Math.round(performance.now() - start);
            const statusEmoji = response.ok ? '✅' : '❌';
            this._push(response.ok ? 'LOG' : 'ERROR', 'API', `← ${response.status} ${method} ${url} (${duration}ms)`);
            console.log(`%c[${new Date().toLocaleTimeString()}] [API] ← ${statusEmoji} ${response.status} ${method} ${url} (${duration}ms)`, this._styles.API);
            return response;
        } catch (err) {
            const duration = Math.round(performance.now() - start);
            this._push('ERROR', 'API', `✗ NETWORK ${method} ${url} (${duration}ms)`, err.message);
            console.error(`%c[${new Date().toLocaleTimeString()}] [API] ✗ NETWORK ERROR ${method} ${url} (${duration}ms): ${err.message}`, this._styles.ERROR);
            throw err;
        }
    },

    // --- NAV TRACKER ---
    nav(from, to) {
        if (!this.debugMode) return;
        this._push('LOG', 'NAV', `${from} → ${to}`);
        console.log(`%c[${new Date().toLocaleTimeString()}] [NAV] 🧭 ${from} → ${to}`, this._styles.NAV);
    },

    // --- AUDIO TRACKER ---
    audio(event, detail = '') {
        if (!this.debugMode) return;
        this._push('LOG', 'AUDIO', `${event} ${detail}`);
        console.log(`%c[${new Date().toLocaleTimeString()}] [AUDIO] 🔊 ${event} ${detail}`, this._styles.AUDIO);
    },

    // --- STATE TRACKER ---
    state(key, value) {
        if (!this.debugMode) return;
        this._push('LOG', 'STATE', `${key} changed`, value);
        console.log(`%c[${new Date().toLocaleTimeString()}] [STATE] 📦 ${key} =`, this._styles.STATE, value);
    },

    // --- STORAGE TRACKER ---
    store(action, key) {
        if (!this.debugMode) return;
        this._push('LOG', 'STORE', `${action} → ${key}`);
        console.log(`%c[${new Date().toLocaleTimeString()}] [STORE] 💾 ${action} → ${key}`, this._styles.STORE);
    },

    // --- CONSOLE HELPERS ---
    // Usage in F12: Logger.history()  Logger.history('API')  Logger.history('ERROR')
    history(filter = null) {
        let items = this._history;
        if (filter) {
            const f = filter.toUpperCase();
            items = items.filter(e => e.category === f || e.level === f);
        }
        console.table(items.map(e => ({ time: e.ts, level: e.level, cat: e.category, message: e.message })));
        return items;
    },

    // Usage in F12: Logger.errors()
    errors() { return this.history('ERROR'); },

    // Usage in F12: Logger.clicks()
    clicks() { return this.history('CLICK'); },

    // Usage in F12: Logger.apis()
    apis() { return this.history('API'); },

    // Usage in F12: Logger.clear()
    clear() { this._history = []; console.clear(); console.log('🧹 Logger history cleared'); },

    // Usage in F12: Logger.dump() — export as JSON
    dump() {
        const json = JSON.stringify(this._history, null, 2);
        console.log(json);
        return json;
    }
};

// Expose Logger globally for F12 console access
window.Logger = Logger;

// ===================================
// AUDIO MANAGER - PROFESSIONAL AUDIO CONTROL
// ===================================

const AudioManager = {
    audio: null,
    mode: null,          // "wird" | "full" | "surah-local" | null
    timers: new Set(),
    onEnded: null,
    currentAudio: null,  // For individual ayah audio elements

    init() {
        this.audio = document.getElementById("audio-element");
        if (!this.audio) {
            Logger.warn('AUDIO', 'Audio element not found, creating fallback');
            this.audio = new Audio();
        }
        Logger.audio('INIT', 'AudioManager initialized');
    },

    stopAll() {
        Logger.audio('STOP', 'Stopping ALL audio and clearing everything...');

        // Stop main audio element
        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;

            // Remove ended handler
            if (this.onEnded) {
                this.audio.removeEventListener("ended", this.onEnded);
                this.onEnded = null;
            }

            // Detach src to prevent weird reloads
            if (this.audio.hasAttribute("src")) {
                this.audio.removeAttribute("src");
                // Only call load() if we actually removed a src to stop downloading
                // Calling load() on empty src causes "Invalid URI" errors
                try { this.audio.load(); } catch (e) { /* ignore */ }
            }
        }

        // Stop individual ayah audio if playing
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }

        // Clear all timers
        for (const t of this.timers) clearTimeout(t);
        this.timers.clear();

        // Reset mode
        this.mode = null;

        Logger.audio('STOP', 'All audio stopped and cleared');
    },

    playFullSurah(surahId) {
        this.stopAll();
        this.mode = "full";
        const src = `audio/${String(surahId).padStart(3, "0")}.mp3`;

        Logger.audio('PLAY_SURAH', `Surah ${surahId} from ${src}`);

        this.audio.src = src;
        this.audio.play().catch(error => {
            Logger.error('AUDIO', `Error playing full surah ${surahId}`, error);
            // Fallback to CDN
            this.playFullSurahFromCDN(surahId);
        });
    },

    playFullSurahFromCDN(surahId) {
        if (!window.QuranAudio) return;

        this.stopAll();
        this.mode = "full";

        const audioUrl = window.QuranAudio.getAudioUrl(surahId);
        Logger.audio('PLAY_CDN', `Surah ${surahId} from CDN: ${audioUrl}`);

        this.audio.src = audioUrl;
        this.audio.play().catch(error => {
            Logger.error('AUDIO', `Error playing CDN surah ${surahId}`, error);
        });
    },

    playWirdAyahSequence(surahId, fromAyah, toAyah) {
        this.stopAll();
        this.mode = "wird";

        if (!window.QuranAudio) {
            Logger.error('AUDIO', 'QuranAudio not available for Wird');
            return;
        }

        Logger.audio('PLAY_WIRD', `Sequence ${surahId}:${fromAyah}-${toAyah}`);

        let currentAyah = fromAyah;
        const urls = [];

        // Build URLs for ayah sequence
        for (let ayah = fromAyah; ayah <= toAyah; ayah++) {
            const globalAyahNumber = window.QuranAudio.surahAyahToGlobal(surahId, ayah);
            const audioUrl = window.QuranAudio.getAyahAudioUrl(globalAyahNumber);
            urls.push(audioUrl);
        }

        let i = 0;

        const playNext = () => {
            // Guard: only continue if still in wird or surah mode
            if (this.mode !== "wird" && this.mode !== "surah") {
                Logger.audio('CANCEL', 'Mode cancelled, stopping sequence');
                return;
            }

            if (i >= urls.length) {
                Logger.audio('COMPLETE', 'Sequence completed');
                this.stopAll();
                return;
            }

            const url = urls[i++];
            const ayahNumber = fromAyah + i - 1;

            Logger.audio('PLAY_AYAH', `Ayah ${ayahNumber} (${i}/${urls.length})`);

            // UPDATE PROGRESS DISPLAY FOR EACH AYAH
            if (window.QuranReview) {
                // Update current ayah in state
                if (window.QuranReview.state.wardPlayer) {
                    window.QuranReview.state.wardPlayer.currentAyah = ayahNumber;
                }
                // Update display
                window.QuranReview.updateWardDisplay();
                window.QuranReview.updateWardAyahDisplay(surahId, ayahNumber);
            }

            // Create new audio element for this ayah
            this.currentAudio = new Audio(url);

            this.currentAudio.onended = () => {
                Logger.audio('ENDED', `Ayah ${ayahNumber} finished`);
                Logger.log('AUDIO', `State: autoPlayNext=${QuranReview.state.settings.autoPlayNext}, mode=${this.mode}, i=${i}/${urls.length}`);

                // Check if this is the last ayah
                const isLastAyah = ayahNumber >= toAyah;
                if (isLastAyah) {
                    Logger.audio('COMPLETE', 'Last ayah completed - stopping sequence');
                    this.stopAll();
                    return;
                }

                // Get REAL-TIME delay from settings (not cached)
                const rawAyahDelay = QuranReview.state.settings.ayahDelay;
                const currentDelay = rawAyahDelay !== undefined ? parseFloat(rawAyahDelay) : 2.0;
                const delay = currentDelay * 1000; // Convert to milliseconds
                Logger.log('AUDIO', `Delay: raw=${rawAyahDelay}, computed=${currentDelay}s (${delay}ms)`);

                if (QuranReview.state.settings.autoPlayNext && (this.mode === "wird" || this.mode === "surah")) {
                    Logger.audio('NEXT', `Auto-playing next ayah after ${delay}ms`);
                    const timer = setTimeout(() => {
                        playNext();
                    }, delay);
                    this.timers.add(timer);
                } else {
                    Logger.audio('PAUSE', 'Auto-play disabled or mode changed');
                    // Stop if auto-play is disabled
                    this.stopAll();
                }
            };

            this.currentAudio.onerror = () => {
                Logger.error('AUDIO', `Error loading ayah ${ayahNumber}`);
                // Continue to next ayah even if error
                if (this.mode === "wird" || this.mode === "surah") {
                    const timer = setTimeout(() => {
                        playNext();
                    }, 1000);
                    this.timers.add(timer);
                }
            };

            // Update display
            QuranReview.updateWardAyahDisplay(surahId, ayahNumber);

            // Play audio
            this.currentAudio.play().catch(error => {
                Logger.error('AUDIO', `Error playing ayah ${ayahNumber}`, error);
                // Continue to next ayah
                if (this.mode === "wird" || this.mode === "surah") {
                    const timer = setTimeout(() => {
                        playNext();
                    }, 1000);
                    this.timers.add(timer);
                }
            });
        };

        // Start playing first ayah
        playNext();
    },

    getCurrentMode() {
        return this.mode;
    },

    isPlaying() {
        return this.mode !== null && (
            (this.audio && !this.audio.paused) || 
            (this.currentAudio && !this.currentAudio.paused)
        );
    }
};

// ===================================
// APP STATE & CONFIGURATION
// ===================================

const API_BASE_URL = window.API_BASE_URL || (
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:8000'
    : 'https://api.quranreview.live'
);

// Détecter le mode fichier local (file://)
const IS_FILE_PROTOCOL = window.location.protocol === 'file:';
const IS_DEMO_MODE = IS_FILE_PROTOCOL;

if (IS_DEMO_MODE) {
    Logger.log('APP', '⚠️ Mode DÉMO activé - Pas de connexion au serveur requise');
}

Logger.log('APP', `API Configuration: ${API_BASE_URL} (Hostname: ${window.location.hostname})`);

const QuranReview = {
    // App Configuration
    config: {
        appName: 'QuranReview',
        version: '1.0.2',
        apiBaseUrl: API_BASE_URL,
        storageKey: 'quranreview_data',
        tasksKey: 'quranreview_tasks',
        apiTokenKey: 'quranreview_api_token',
        settingsKey: 'quranreview_settings',  // Ajouté clé séparée pour settings
        competitionKey: 'quranreview_competition',
        hifzKey: 'quranreview_hifz',
        themeKey: 'quranreview_theme',
        
        // Default Settings
        defaultSettings: {
            userName: '',
            dailyGoal: 5,
            theme: 'light',
            notifications: true,
            // Ward Player Settings
            ayahDelay: 0, // seconds between ayahs (default: instant)
            autoPlayNext: true
        },
        
        // Quran Data - Complete 114 Surahs
        surahs: [
            { id: 1, name: 'الفاتحة', englishName: 'Al-Fatihah', ayahs: 7, type: 'meccan' },
            { id: 2, name: 'البقرة', englishName: 'Al-Baqarah', ayahs: 286, type: 'medinan' },
            { id: 3, name: 'آل عمران', englishName: 'Aal-E-Imran', ayahs: 200, type: 'medinan' },
            { id: 4, name: 'النساء', englishName: 'An-Nisa', ayahs: 176, type: 'medinan' },
            { id: 5, name: 'المائدة', englishName: 'Al-Ma\'idah', ayahs: 120, type: 'medinan' },
            { id: 6, name: 'الأنعام', englishName: 'Al-An\'am', ayahs: 165, type: 'meccan' },
            { id: 7, name: 'الأعراف', englishName: 'Al-A\'raf', ayahs: 206, type: 'meccan' },
            { id: 8, name: 'الأنفال', englishName: 'Al-Anfal', ayahs: 75, type: 'medinan' },
            { id: 9, name: 'التوبة', englishName: 'At-Tawbah', ayahs: 129, type: 'medinan' },
            { id: 10, name: 'يونس', englishName: 'Yunus', ayahs: 109, type: 'meccan' },
            { id: 11, name: 'هود', englishName: 'Hud', ayahs: 123, type: 'meccan' },
            { id: 12, name: 'يوسف', englishName: 'Yusuf', ayahs: 111, type: 'meccan' },
            { id: 13, name: 'الرعد', englishName: 'Ar-Ra\'d', ayahs: 43, type: 'medinan' },
            { id: 14, name: 'إبراهيم', englishName: 'Ibrahim', ayahs: 52, type: 'meccan' },
            { id: 15, name: 'الحجر', englishName: 'Al-Hijr', ayahs: 99, type: 'meccan' },
            { id: 16, name: 'النحل', englishName: 'An-Nahl', ayahs: 128, type: 'meccan' },
            { id: 17, name: 'الإسراء', englishName: 'Al-Isra', ayahs: 111, type: 'meccan' },
            { id: 18, name: 'الكهف', englishName: 'Al-Kahf', ayahs: 110, type: 'meccan' },
            { id: 19, name: 'مريم', englishName: 'Maryam', ayahs: 98, type: 'meccan' },
            { id: 20, name: 'طه', englishName: 'Ta-Ha', ayahs: 135, type: 'meccan' },
            { id: 21, name: 'الأنبياء', englishName: 'Al-Anbiya', ayahs: 112, type: 'meccan' },
            { id: 22, name: 'الحج', englishName: 'Al-Hajj', ayahs: 78, type: 'medinan' },
            { id: 23, name: 'المؤمنون', englishName: 'Al-Mu\'minun', ayahs: 118, type: 'meccan' },
            { id: 24, name: 'النور', englishName: 'An-Nur', ayahs: 64, type: 'medinan' },
            { id: 25, name: 'الفرقان', englishName: 'Al-Furqan', ayahs: 77, type: 'meccan' },
            { id: 26, name: 'الشعراء', englishName: 'Ash-Shu\'ara', ayahs: 227, type: 'meccan' },
            { id: 27, name: 'النمل', englishName: 'An-Naml', ayahs: 93, type: 'meccan' },
            { id: 28, name: 'القصص', englishName: 'Al-Qasas', ayahs: 88, type: 'meccan' },
            { id: 29, name: 'العنكبوت', englishName: 'Al-Ankabut', ayahs: 69, type: 'meccan' },
            { id: 30, name: 'الروم', englishName: 'Ar-Rum', ayahs: 60, type: 'meccan' },
            { id: 31, name: 'لقمان', englishName: 'Luqman', ayahs: 34, type: 'meccan' },
            { id: 32, name: 'السجدة', englishName: 'As-Sajdah', ayahs: 30, type: 'meccan' },
            { id: 33, name: 'الأحزاب', englishName: 'Al-Ahzab', ayahs: 73, type: 'medinan' },
            { id: 34, name: 'سبأ', englishName: 'Saba', ayahs: 54, type: 'meccan' },
            { id: 35, name: 'فاطر', englishName: 'Fatir', ayahs: 45, type: 'meccan' },
            { id: 36, name: 'يس', englishName: 'Ya-Sin', ayahs: 83, type: 'meccan' },
            { id: 37, name: 'الصافات', englishName: 'As-Saffat', ayahs: 182, type: 'meccan' },
            { id: 38, name: 'ص', englishName: 'Sad', ayahs: 88, type: 'meccan' },
            { id: 39, name: 'الزمر', englishName: 'Az-Zumar', ayahs: 75, type: 'meccan' },
            { id: 40, name: 'غافر', englishName: 'Ghafir', ayahs: 85, type: 'meccan' },
            { id: 41, name: 'فصلت', englishName: 'Fussilat', ayahs: 54, type: 'meccan' },
            { id: 42, name: 'الشورى', englishName: 'Ash-Shura', ayahs: 53, type: 'meccan' },
            { id: 43, name: 'الزخرف', englishName: 'Az-Zukhruf', ayahs: 89, type: 'meccan' },
            { id: 44, name: 'الدخان', englishName: 'Ad-Dukhan', ayahs: 59, type: 'meccan' },
            { id: 45, name: 'الجاثية', englishName: 'Al-Jathiyah', ayahs: 37, type: 'meccan' },
            { id: 46, name: 'الأحقاف', englishName: 'Al-Ahqaf', ayahs: 35, type: 'meccan' },
            { id: 47, name: 'محمد', englishName: 'Muhammad', ayahs: 38, type: 'medinan' },
            { id: 48, name: 'الفتح', englishName: 'Al-Fath', ayahs: 29, type: 'medinan' },
            { id: 49, name: 'الحجرات', englishName: 'Al-Hujurat', ayahs: 18, type: 'medinan' },
            { id: 50, name: 'ق', englishName: 'Qaf', ayahs: 45, type: 'meccan' },
            { id: 51, name: 'الذاريات', englishName: 'Adh-Dhariyat', ayahs: 60, type: 'meccan' },
            { id: 52, name: 'الطور', englishName: 'At-Tur', ayahs: 49, type: 'meccan' },
            { id: 53, name: 'النجم', englishName: 'An-Najm', ayahs: 62, type: 'meccan' },
            { id: 54, name: 'القمر', englishName: 'Al-Qamar', ayahs: 55, type: 'meccan' },
            { id: 55, name: 'الرحمن', englishName: 'Ar-Rahman', ayahs: 78, type: 'medinan' },
            { id: 56, name: 'الواقعة', englishName: 'Al-Waqiah', ayahs: 96, type: 'meccan' },
            { id: 57, name: 'الحديد', englishName: 'Al-Hadid', ayahs: 29, type: 'medinan' },
            { id: 58, name: 'المجادلة', englishName: 'Al-Mujadilah', ayahs: 22, type: 'medinan' },
            { id: 59, name: 'الحشر', englishName: 'Al-Hashr', ayahs: 24, type: 'medinan' },
            { id: 60, name: 'الممتحنة', englishName: 'Al-Mumtahanah', ayahs: 13, type: 'medinan' },
            { id: 61, name: 'الصف', englishName: 'As-Saff', ayahs: 14, type: 'medinan' },
            { id: 62, name: 'الجمعة', englishName: 'Al-Jumua', ayahs: 11, type: 'medinan' },
            { id: 63, name: 'المنافقون', englishName: 'Al-Munafiqun', ayahs: 11, type: 'medinan' },
            { id: 64, name: 'التغابن', englishName: 'At-Taghabun', ayahs: 18, type: 'medinan' },
            { id: 65, name: 'الطلاق', englishName: 'At-Talaq', ayahs: 12, type: 'medinan' },
            { id: 66, name: 'التحريم', englishName: 'At-Tahrim', ayahs: 12, type: 'medinan' },
            { id: 67, name: 'الملك', englishName: 'Al-Mulk', ayahs: 30, type: 'meccan' },
            { id: 68, name: 'القلم', englishName: 'Al-Qalam', ayahs: 52, type: 'meccan' },
            { id: 69, name: 'الحاقة', englishName: 'Al-Haqqah', ayahs: 52, type: 'meccan' },
            { id: 70, name: 'المعارج', englishName: 'Al-Maarij', ayahs: 44, type: 'meccan' },
            { id: 71, name: 'نوح', englishName: 'Nuh', ayahs: 28, type: 'meccan' },
            { id: 72, name: 'الجن', englishName: 'Al-Jinn', ayahs: 28, type: 'meccan' },
            { id: 73, name: 'المزمل', englishName: 'Al-Muzzammil', ayahs: 20, type: 'meccan' },
            { id: 74, name: 'المدثر', englishName: 'Al-Muddaththir', ayahs: 56, type: 'meccan' },
            { id: 75, name: 'القيامة', englishName: 'Al-Qiyamah', ayahs: 40, type: 'meccan' },
            { id: 76, name: 'الإنسان', englishName: 'Al-Insan', ayahs: 31, type: 'medinan' },
            { id: 77, name: 'المرسلات', englishName: 'Al-Mursalat', ayahs: 50, type: 'meccan' },
            { id: 78, name: 'النبأ', englishName: 'An-Naba', ayahs: 40, type: 'meccan' },
            { id: 79, name: 'النازعات', englishName: 'An-Nazi-at', ayahs: 46, type: 'meccan' },
            { id: 80, name: 'عبس', englishName: 'Abasa', ayahs: 42, type: 'meccan' },
            { id: 81, name: 'التكوير', englishName: 'At-Takwir', ayahs: 29, type: 'meccan' },
            { id: 82, name: 'الانفطار', englishName: 'Al-Infitar', ayahs: 19, type: 'meccan' },
            { id: 83, name: 'المطففين', englishName: 'Al-Mutaffifin', ayahs: 36, type: 'meccan' },
            { id: 84, name: 'الانشقاق', englishName: 'Al-Inshiqaq', ayahs: 25, type: 'meccan' },
            { id: 85, name: 'البروج', englishName: 'Al-Buruj', ayahs: 22, type: 'meccan' },
            { id: 86, name: 'الطارق', englishName: 'At-Tariq', ayahs: 17, type: 'meccan' },
            { id: 87, name: 'الأعلى', englishName: 'Al-A-la', ayahs: 19, type: 'meccan' },
            { id: 88, name: 'الغاشية', englishName: 'Al-Ghashiyah', ayahs: 26, type: 'meccan' },
            { id: 89, name: 'الفجر', englishName: 'Al-Fajr', ayahs: 30, type: 'meccan' },
            { id: 90, name: 'البلد', englishName: 'Al-Balad', ayahs: 20, type: 'meccan' },
            { id: 91, name: 'الشمس', englishName: 'Ash-Shams', ayahs: 15, type: 'meccan' },
            { id: 92, name: 'الليل', englishName: 'Al-Lail', ayahs: 21, type: 'meccan' },
            { id: 93, name: 'الضحى', englishName: 'Ad-Duha', ayahs: 11, type: 'meccan' },
            { id: 94, name: 'الشرح', englishName: 'Ash-Sharh', ayahs: 8, type: 'meccan' },
            { id: 95, name: 'التين', englishName: 'At-Tin', ayahs: 8, type: 'meccan' },
            { id: 96, name: 'العلق', englishName: 'Al-Alaq', ayahs: 19, type: 'meccan' },
            { id: 97, name: 'القدر', englishName: 'Al-Qadr', ayahs: 5, type: 'meccan' },
            { id: 98, name: 'البينة', englishName: 'Al-Bayyinah', ayahs: 8, type: 'medinan' },
            { id: 99, name: 'الزلزلة', englishName: 'Az-Zalzalah', ayahs: 8, type: 'medinan' },
            { id: 100, name: 'العاديات', englishName: 'Al-Adiyat', ayahs: 11, type: 'meccan' },
            { id: 101, name: 'القارعة', englishName: 'Al-Qari\'ah', ayahs: 11, type: 'meccan' },
            { id: 102, name: 'التكاثر', englishName: 'At-Takathur', ayahs: 8, type: 'meccan' },
            { id: 103, name: 'العصر', englishName: 'Al-Asr', ayahs: 3, type: 'meccan' },
            { id: 104, name: 'الهمزة', englishName: 'Al-Humazah', ayahs: 9, type: 'meccan' },
            { id: 105, name: 'الفيل', englishName: 'Al-Fil', ayahs: 5, type: 'meccan' },
            { id: 106, name: 'قريش', englishName: 'Quraysh', ayahs: 4, type: 'meccan' },
            { id: 107, name: 'الماعون', englishName: 'Al-Ma\'un', ayahs: 7, type: 'meccan' },
            { id: 108, name: 'الكوثر', englishName: 'Al-Kawthar', ayahs: 3, type: 'meccan' },
            { id: 109, name: 'الكافرون', englishName: 'Al-Kafirun', ayahs: 6, type: 'meccan' },
            { id: 110, name: 'النصر', englishName: 'An-Nasr', ayahs: 3, type: 'medinan' },
            { id: 111, name: 'المسد', englishName: 'Al-Masad', ayahs: 5, type: 'meccan' },
            { id: 112, name: 'الإخلاص', englishName: 'Al-Ikhlas', ayahs: 4, type: 'meccan' },
            { id: 113, name: 'الفلق', englishName: 'Al-Falaq', ayahs: 5, type: 'meccan' },
            { id: 114, name: 'الناس', englishName: 'An-Nas', ayahs: 6, type: 'meccan' }
        ]
    },
    
    // App State
    state: {
        currentPage: 'home',
        memorizationData: [],
        tasks: [],
        competition: {},
        hifz: {},
        settings: {},
        todayDate: new Date().toISOString().split('T')[0]
    },
    
    // ===================================
    // INITIALIZATION
    // ===================================
    
    init() {
        Logger.log('APP', 'Initializing QuranReview App...');
        
        // Initialize AudioManager first
        AudioManager.init();
        
        // Initialize state
        this.state = {
            currentPage: 'home',
            memorizationData: [],
            tasks: [],
            competition: {},
            hifz: {},
            settings: { ...this.config.defaultSettings },
            todayDate: new Date().toISOString().split('T')[0],
            imageQuality: 'normal',
            user: null
        };
        
        // Load data
        this.loadData();
        
        // Setup navigation
        this.setupNavigation();
        
        // Initialize audio player
        this.initAudioPlayer();
        
        // Initialize ward player
        this.initWardPlayer();
        
        // Initialize theme
        this.initTheme();

        // Initialize auth
        this.initAuth();

        // Close modal on overlay click
        document.getElementById('auth-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'auth-modal') this.hideAuthModal();
        });

        // Render initial page
        this.renderPage('home');

        // Update today's date
        this.updateTodayDate();

        // Global click tracker
        document.addEventListener('click', (e) => Logger.click(e.target), true);

        Logger.log('APP', 'QuranReview App initialized successfully');
    },
    
    updateTodayDate() {
        const todayDateElement = document.getElementById('today-date');
        if (todayDateElement) {
            const today = new Date();
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            };
            todayDateElement.textContent = today.toLocaleDateString('ar-SA', options);
        }
    },
    
    // ===================================
    // DATA MANAGEMENT
    // ===================================
    
    loadData() {
        try {
            // Load settings with SEPARATE KEY
            const savedSettings = localStorage.getItem(this.config.settingsKey);
            this.state.settings = savedSettings ? 
                JSON.parse(savedSettings) : 
                { ...this.config.defaultSettings };
            
            // Apply debug mode from settings
            if (this.state.settings.debugMode !== undefined) {
                Logger.debugMode = this.state.settings.debugMode;
            }

            // Load competition data
            const savedCompetition = localStorage.getItem(this.config.competitionKey);
            this.state.competition = savedCompetition ?
                JSON.parse(savedCompetition) :
                {
                    userStats: {
                        totalScore: 0,
                        winStreak: 0,
                        challengesWon: 0,
                        challengesPlayed: 0,
                        rank: 'bronze',
                        history: []
                    },
                    activeChallenge: null,
                    leaderboard: []
                };

            // Load hifz data
            const savedHifz = localStorage.getItem(this.config.hifzKey);
            this.state.hifz = savedHifz ?
                JSON.parse(savedHifz) :
                { currentSession: null, level: 1 };

            Logger.store('LOAD', this.config.settingsKey);
            Logger.state('settings', this.state.settings);
            
            // Load memorization data with storage key
            const savedData = localStorage.getItem(this.config.storageKey);
            this.state.memorizationData = savedData ? 
                JSON.parse(savedData) : 
                this.getDefaultMemorizationData();

            const savedTasks = localStorage.getItem(this.config.tasksKey);
            this.state.tasks = savedTasks ? JSON.parse(savedTasks) : [];

            Logger.store('LOAD', this.config.storageKey);
            Logger.log('APP', 'All data loaded successfully');
        } catch (error) {
            Logger.error('APP', 'Error loading data', error);
            this.state.settings = { ...this.config.defaultSettings };
            this.state.memorizationData = this.getDefaultMemorizationData();
            this.state.tasks = [];
        }
    },

    // ===================================
    // AUTHENTICATION
    // ===================================

    initAuth() {
        const token = localStorage.getItem(this.config.apiTokenKey);
        const userData = localStorage.getItem('quranreview_user');

        if (token && userData) {
            try {
                this.state.user = JSON.parse(userData);
                this.updateAuthUI(true);
                this.fetchMe();
            } catch {
                this.logout();
            }
        } else {
            this.updateAuthUI(false);
        }
    },

    updateAuthUI(loggedIn) {
        const loginBtn = document.getElementById('auth-login-btn');
        const userInfo = document.getElementById('auth-user-info');
        const usernameEl = document.getElementById('auth-username');
        const teacherLinks = document.querySelectorAll('.nav-teacher-only');
        const studentLinks = document.querySelectorAll('.nav-student-only');

        if (loggedIn && this.state.user) {
            loginBtn?.classList.add('hidden');
            userInfo?.classList.remove('hidden');
            if (usernameEl) {
                const roleLabel = this.state.user.role === 'teacher' ? '👨‍🏫' : '🎓';
                usernameEl.textContent = `${roleLabel} ${this.state.user.first_name || this.state.user.username}`;
            }
            // Show/hide role-specific nav links
            const isTeacher = this.state.user.role === 'teacher';
            teacherLinks.forEach(el => el.style.display = isTeacher ? 'inline-block' : 'none');
            studentLinks.forEach(el => el.style.display = isTeacher ? 'none' : 'inline-block');
        } else {
            loginBtn?.classList.remove('hidden');
            userInfo?.classList.add('hidden');
            teacherLinks.forEach(el => el.style.display = 'none');
            studentLinks.forEach(el => el.style.display = 'none');
        }
    },

    showAuthModal() {
        const modal = document.getElementById('auth-modal');
        modal?.classList.add('active');
        modal?.classList.remove('hidden');
        document.getElementById('login-error')?.classList.add('hidden');
    },

    hideAuthModal() {
        const modal = document.getElementById('auth-modal');
        modal?.classList.remove('active');
        modal?.classList.add('hidden');
    },

    showRegisterForm(event) {
        if (event) event.preventDefault();
        document.getElementById('auth-login-form')?.classList.add('hidden');
        document.getElementById('auth-register-form')?.classList.remove('hidden');
        document.getElementById('auth-register-form')?.classList.add('active');
        document.getElementById('reg-error')?.classList.add('hidden');
    },

    showLoginForm(event) {
        if (event) event.preventDefault();
        document.getElementById('auth-register-form')?.classList.add('hidden');
        document.getElementById('auth-register-form')?.classList.remove('active');
        document.getElementById('auth-login-form')?.classList.remove('hidden');
        document.getElementById('auth-login-form')?.classList.add('active');
        document.getElementById('login-error')?.classList.add('hidden');
    },

    async performLogin(username, password) {
        Logger.log('AUTH', `Attempting login for user: ${username}`);
        
        // Mode DÉMO - Simulation locale sans serveur
        if (IS_DEMO_MODE) {
            Logger.log('AUTH', '🎮 Mode DÉMO: Simulation de connexion...');
            
            // Simuler un délai réseau
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Accepter n'importe quel identifiant (pour la démo)
            const demoUser = {
                id: 1,
                username: username,
                first_name: 'مستخدم',
                last_name: 'تجريبي',
                email: 'demo@quranreview.live',
                role: 'student',
                is_superuser: false
            };
            
            // Stocker comme si c'était une vraie connexion
            this.state.user = demoUser;
            localStorage.setItem('quranreview_user', JSON.stringify(demoUser));
            localStorage.setItem(this.config.apiTokenKey, 'demo_token_' + Date.now());
            localStorage.setItem('quranreview_refresh_token', 'demo_refresh_' + Date.now());
            
            this.hideAuthModal();
            this.updateAuthUI(true);
            
            // Charger des tâches de démo
            this.loadDemoTasks();
            
            // Redirection
            this.navigateTo('home');
            this.showNotification('✅ Mode démo: Connexion simulée avec succès!', 'success');
            
            Logger.log('AUTH', 'Mode DÉMO: Connexion réussie');
            return;
        }
        
        // Mode normal avec API
        if (!this.config.apiBaseUrl) {
            throw new Error('لم يتم تكوين خادم API');
        }
        
        try {
            const response = await fetch(`${this.config.apiBaseUrl}/api/token/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            Logger.log('AUTH', `Login Response Status: ${response.status}`);

            let data;
            try {
                data = await response.json();
            } catch (e) {
                throw new Error('استجابة غير صالحة من الخادم');
            }

            if (!response.ok) {
                Logger.warn('AUTH', 'Login failed', data);
                const errorMsg = data.detail || data.error || 'اسم المستخدم أو كلمة المرور غير صحيحة';
                throw new Error(errorMsg);
            }

            if (!data.access || !data.refresh) {
                throw new Error('استجابة غير كاملة من الخادم');
            }

            Logger.log('AUTH', 'Login successful, tokens received');
            localStorage.setItem(this.config.apiTokenKey, data.access);
            localStorage.setItem('quranreview_refresh_token', data.refresh);
            this.hideAuthModal();
            
            try {
                await this.fetchMe();
            } catch (e) {
                console.warn('Could not fetch user info, but login succeeded');
            }
            
            this.loadTasksFromApi();

            if (this.state.user) {
                Logger.log('AUTH', `Redirecting user role: ${this.state.user.role}`);
                if (this.state.user.role === 'teacher') {
                    this.navigateTo('teacher');
                } else {
                    this.navigateTo('mytasks');
                }
            } else {
                this.navigateTo('home');
            }
            
            this.showNotification('تم تسجيل الدخول بنجاح', 'success');
        } catch (error) {
            Logger.error('AUTH', 'Login process error', error);
            throw error;
        }
    },

    // Charger des tâches de démo
    loadDemoTasks() {
        const demoTasks = [
            { id: 1, title: 'حفظ سورة الفاتحة', description: 'من الآية 1 إلى 7', status: 'pending', points: 10, due_date: '2024-12-25' },
            { id: 2, title: 'مراجعة سورة البقرة', description: 'من الآية 1 إلى 50', status: 'completed', points: 20, due_date: '2024-12-20' },
            { id: 3, title: 'تعلم التجويد - المدود', description: 'دراسة أحكام المد', status: 'submitted', points: 15, due_date: '2024-12-22' }
        ];
        this.state.tasks = demoTasks;
        localStorage.setItem(this.config.tasksKey, JSON.stringify(demoTasks));
        // Pas besoin de renderTasks ici - les tâches seront affichées quand on navigue
    },

    async handleRegister(event) {
        event.preventDefault();
        const username = document.getElementById('reg-username').value.trim();
        const password = document.getElementById('reg-password').value;
        const firstName = document.getElementById('reg-first-name').value.trim();
        const lastName = document.getElementById('reg-last-name').value.trim();
        const errorEl = document.getElementById('reg-error');
        const submitBtn = document.getElementById('reg-submit-btn');

        // Validation
        if (!username || !password) {
            if (errorEl) {
                errorEl.textContent = 'الرجاء إدخال اسم المستخدم وكلمة المرور';
                errorEl.classList.remove('hidden');
            }
            return;
        }

        errorEl?.classList.add('hidden');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>⏳</span> جاري التسجيل...';
        }

        // Mode DÉMO
        if (IS_DEMO_MODE) {
            Logger.log('AUTH', '🎮 Mode DÉMO: Simulation d\'inscription...');
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Simuler un utilisateur enregistré puis connecté
            await this.performLogin(username, password);
            
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span>✨</span> إنشاء الحساب';
            }
            return;
        }

        // Mode normal avec API
        try {
            const response = await fetch(`${this.config.apiBaseUrl}/api/register/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    password,
                    first_name: firstName,
                    last_name: lastName
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                let msg = data.detail || 'خطأ في التسجيل';
                if (typeof data === 'object') {
                    if (data.username) msg = `اسم المستخدم: ${data.username[0]}`;
                    else if (data.password) msg = `كلمة المرور: ${data.password[0]}`;
                }
                throw new Error(msg);
            }

            await this.performLogin(username, password);

        } catch (error) {
            console.error('Register error:', error);
            if (errorEl) {
                if (error.message === 'Failed to fetch') {
                    errorEl.textContent = 'تعذر الاتصال بالخادم. تأكد من تشغيل الخادم المحلي.';
                } else {
                    errorEl.textContent = error.message;
                }
                errorEl.classList.remove('hidden');
            }
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span>✨</span> إنشاء الحساب';
            }
        }
    },

    async handleLogin(event) {
        event.preventDefault();
        event.stopPropagation();
        
        const username = document.getElementById('login-username')?.value.trim();
        const password = document.getElementById('login-password')?.value;
        const errorEl = document.getElementById('login-error');
        const submitBtn = document.getElementById('login-submit-btn');

        console.log('[LOGIN] Attempting login for:', username);

        if (!username || !password) {
            if (errorEl) {
                errorEl.textContent = 'الرجاء إدخال اسم المستخدم وكلمة المرور';
                errorEl.classList.remove('hidden');
            }
            return;
        }

        errorEl?.classList.add('hidden');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.classList.add('btn-loading');
            submitBtn.innerHTML = '<span>⏳</span> جاري الدخول...';
        }

        try {
            await this.performLogin(username, password);
        } catch (error) {
            console.error('[LOGIN] Error:', error);
            if (errorEl) {
                errorEl.textContent = error.message || 'فشل تسجيل الدخول. تحقق من بياناتك.';
                errorEl.classList.remove('hidden');
            }
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.classList.remove('btn-loading');
                submitBtn.innerHTML = '<span>🔐</span> دخول';
            }
        }
    },

    // Teacher tab switching
    switchTeacherTab(tabName) {
        document.querySelectorAll('.teacher-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.teacher-tab-content').forEach(c => c.classList.remove('active'));
        document.querySelector(`.teacher-tab[data-tab="${tabName}"]`)?.classList.add('active');
        document.getElementById(`teacher-tab-${tabName}`)?.classList.add('active');
    },

    toggleAssignMode(mode) {
        const container = document.getElementById('student-select-container');
        if (mode === 'select') {
            container?.classList.remove('hidden');
            this.loadStudentCheckboxes();
        } else {
            container?.classList.add('hidden');
        }
    },

    async loadStudentCheckboxes() {
        const token = localStorage.getItem(this.config.apiTokenKey);
        if (!token) return;

        try {
            const response = await fetch(`${this.config.apiBaseUrl}/api/my-students/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const students = response.ok ? await response.json() : [];
            const container = document.getElementById('student-checkboxes');
            if (!students.length) {
                container.innerHTML = '<p class="empty-state">لا يوجد طلاب</p>';
                return;
            }
            container.innerHTML = students.map(s => `
                <label class="student-checkbox-item">
                    <input type="checkbox" name="student-ids" value="${s.id}">
                    <span>🎓 ${this.escapeHtml(s.first_name || s.username)}</span>
                    <span class="student-checkbox-points">🏆 ${this.escapeHtml(String(s.total_points))} نقطة</span>
                </label>
            `).join('');
        } catch (error) {
            console.warn('Failed to load students for checkboxes', error);
        }
    },

    async fetchMe() {
        const token = localStorage.getItem(this.config.apiTokenKey);
        if (!token) return;

        try {
            const response = await fetch(`${this.config.apiBaseUrl}/api/me/`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.status === 401) {
                const refreshed = await this.refreshToken();
                if (refreshed) return this.fetchMe();
                this.logout();
                return;
            }

            if (!response.ok) throw new Error('Failed to fetch user');

            this.state.user = await response.json();
            localStorage.setItem('quranreview_user', JSON.stringify(this.state.user));
            this.updateAuthUI(true);
        } catch (error) {
            console.warn('⚠️ Failed to fetch user info', error);
        }
    },

    async refreshToken() {
        const refresh = localStorage.getItem('quranreview_refresh_token');
        if (!refresh) return false;

        try {
            const response = await fetch(`${this.config.apiBaseUrl}/api/token/refresh/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh }),
            });

            if (!response.ok) return false;

            const data = await response.json();
            localStorage.setItem(this.config.apiTokenKey, data.access);
            return true;
        } catch {
            return false;
        }
    },

    logout() {
        localStorage.removeItem(this.config.apiTokenKey);
        localStorage.removeItem('quranreview_refresh_token');
        localStorage.removeItem('quranreview_user');
        this.state.user = null;
        this.updateAuthUI(false);
        this.navigateTo('home');
        this.showNotification('تم تسجيل الخروج بنجاح', 'info');
    },

    async loadTasksFromApi() {
        if (!this.config.apiBaseUrl) return;

        Logger.log('API', 'Loading tasks from API...');

        try {
            const token = localStorage.getItem(this.config.apiTokenKey);
            if (!token) {
                Logger.warn('API', 'No token found, skipping task load');
                return;
            }
            const headers = { Authorization: `Bearer ${token}` };
            const response = await fetch(`${this.config.apiBaseUrl}/api/tasks/`, { headers });

            Logger.log('API', `Fetch Tasks Response: ${response.status}`);

            if (response.status === 401) {
                Logger.warn('API', 'Token expired (401), attempting refresh');
                const refreshed = await this.refreshToken();
                if (refreshed) return this.loadTasksFromApi();
                return;
            }

            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            Logger.log('API', `Loaded ${Array.isArray(data) ? data.length : 0} tasks`, data);

            if (Array.isArray(data)) {
                this.state.tasks = data;
                localStorage.setItem(this.config.tasksKey, JSON.stringify(data));
            }
        } catch (error) {
            Logger.error('API', 'Failed to load tasks', error);
        }
    },
    
    saveData() {
        try {
            // Save settings with SEPARATE KEY
            localStorage.setItem(this.config.settingsKey, JSON.stringify(this.state.settings));
            
            // Save memorization data with storage key
            localStorage.setItem(this.config.storageKey, JSON.stringify(this.state.memorizationData));
            
            // Save competition data
            localStorage.setItem(this.config.competitionKey, JSON.stringify(this.state.competition));

            // Save hifz data
            localStorage.setItem(this.config.hifzKey, JSON.stringify(this.state.hifz));

            Logger.store('SAVE', 'all keys');
            Logger.log('APP', 'Data saved successfully');
        } catch (error) {
            Logger.error('APP', 'Error saving data', error);
            this.showNotification('خطأ في حفظ البيانات', 'error');
        }
    },
    
    getDefaultMemorizationData() {
        return [
            {
                id: 1,
                surahId: 1,
                surahName: 'الفاتحة',
                fromAyah: 1,
                toAyah: 7,
                status: 'mastered',
                dateAdded: '2024-01-01',
                lastReviewed: '2024-02-06',
                reviewCount: 15
            },
            {
                id: 2,
                surahId: 2,
                surahName: 'البقرة',
                fromAyah: 1,
                toAyah: 5,
                status: 'weak',
                dateAdded: '2024-01-15',
                lastReviewed: '2024-02-01',
                reviewCount: 8
            },
            {
                id: 3,
                surahId: 3,
                surahName: 'آل عمران',
                fromAyah: 1,
                toAyah: 3,
                status: 'new',
                dateAdded: '2024-02-07',
                lastReviewed: null,
                reviewCount: 0
            }
        ];
    },
    
    // ===================================
    // THEME MANAGEMENT
    // ===================================
    
    initTheme() {
        const theme = this.state.settings.theme || 'light';
        document.documentElement.setAttribute('data-theme', theme);
        this.updateThemeToggle(theme);
    },
    
    toggleTheme() {
        const currentTheme = this.state.settings.theme;
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        this.state.settings.theme = newTheme;
        document.documentElement.setAttribute('data-theme', newTheme);
        this.updateThemeToggle(newTheme);
        this.saveData();
        
        Logger.log('APP', `Theme changed to: ${newTheme}`);
    },
    
    updateThemeToggle(theme) {
        const toggle = document.getElementById('theme-toggle');
        if (toggle) {
            toggle.textContent = theme === 'light' ? '🌙' : '☀️';
        }
    },
    
    // ===================================
    // NAVIGATION
    // ===================================
    
    setupNavigation() {
        // Navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                this.navigateTo(page);
            });
        });
        
        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    },
    
    navigateTo(pageName) {
        Logger.nav(this.state.currentPage, pageName);
        
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        const activeLink = document.querySelector(`[data-page="${pageName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        } else {
            Logger.warn('NAV', `Navigation link not found: ${pageName}`);
        }
        
        // Update pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        const targetPage = document.getElementById(`${pageName}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
        } else {
            Logger.error('NAV', `Page element not found: ${pageName}-page`);
        }
        
        this.state.currentPage = pageName;
        
        // Render page content
        this.renderPage(pageName);
        
        Logger.log('NAV', `Navigation completed to: ${pageName}`);
    },
    
    // ===================================
    // PAGE RENDERING
    // ===================================
    
    renderPage(pageName) {
        switch (pageName) {
            case 'home':
                this.renderHomePage();
                break;
            case 'memorization':
                this.renderMemorizationPage();
                break;
            case 'ward':
                this.renderWardPage();
                break;
            case 'reading':
                this.renderReadingPage();
                break;
            case 'progress':
                this.renderProgressPage();
                break;
            case 'settings':
                this.renderSettingsPage();
                break;
            case 'competition':
                this.renderCompetitionPage();
                break;
            case 'hifz':
                this.renderHifzPage();
                break;
            case 'mytasks':
                this.loadStudentDashboard();
                break;
            case 'teacher':
                this.loadTeacherDashboard();
                break;
        }
    },

    // ===================================
    // COMPETITION & HIFZ PAGES STUBS
    // ===================================

    renderCompetitionPage() {
        const stats = this.state.competition.userStats;
        const dashboard = document.getElementById('competition-dashboard');
        const active = document.getElementById('competition-active');

        if (this.state.competition.activeChallenge) {
            dashboard.classList.add('hidden');
            active.classList.remove('hidden');
            // Ensure UI is rendered (handled by startChallenge usually)
        } else {
            dashboard.classList.remove('hidden');
            active.classList.add('hidden');

            // Update Stats
            const scoreEl = document.getElementById('comp-score');
            if (scoreEl) scoreEl.textContent = stats.totalScore;
            const winsEl = document.getElementById('comp-wins');
            if (winsEl) winsEl.textContent = stats.challengesWon;
            const streakEl = document.getElementById('comp-streak');
            if (streakEl) streakEl.textContent = `🔥 ${stats.winStreak}`;
            const pointsEl = document.getElementById('user-points');
            if (pointsEl) pointsEl.textContent = stats.totalScore;

            const rank = this.competitionManager.calculateRank(stats.totalScore);
            const rankEl = document.getElementById('user-rank');
            if (rankEl) rankEl.textContent = rank.icon;

            // Render Leaderboard
            this.competitionManager.renderLeaderboard();
        }
    },

    startChallenge(type) { this.competitionManager.startChallenge(type); },

    renderHifzPage() {
        const session = this.state.hifz.currentSession;
        const selectionDiv = document.getElementById('hifz-selection');
        const containerDiv = document.getElementById('hifz-active-container');

        if (session && session.isActive) {
            selectionDiv.classList.add('hidden');
            containerDiv.classList.remove('hidden');
            // Restore display if needed, but usually it's handled by state
            if (!containerDiv.querySelector('.ayah-line')) {
                this.competitionManager.loadAyahForHifz(session.surahId, session.currentAyah);
            }
        } else {
            selectionDiv.classList.remove('hidden');
            containerDiv.classList.add('hidden');
            this.populateHifzSurahSelect();
            this.setupHifzActions();
        }
    },

    populateHifzSurahSelect() {
        const surahSelect = document.getElementById('hifz-surah-select');
        if (!surahSelect || surahSelect.options.length > 1) return; // Already populated

        this.config.surahs.forEach(surah => {
            const option = document.createElement('option');
            option.value = surah.id;
            option.textContent = `${surah.name} (${surah.ayahs} آيات)`;
            surahSelect.appendChild(option);
        });

        // Add change listener to update ayah limits
        surahSelect.addEventListener('change', () => {
            const id = parseInt(surahSelect.value);
            const surah = this.config.surahs.find(s => s.id === id);
            const from = document.getElementById('hifz-from-ayah');
            const to = document.getElementById('hifz-to-ayah');
            if (surah && from && to) {
                from.max = surah.ayahs;
                to.max = surah.ayahs;
                from.placeholder = `1-${surah.ayahs}`;
                to.placeholder = `1-${surah.ayahs}`;
            }
        });
    },

    setupHifzActions() {
        const form = document.getElementById('hifz-start-form');
        // Remove old listener to avoid duplicates if possible, or just check
        if (form && !form.dataset.listening) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const surahId = parseInt(document.getElementById('hifz-surah-select').value);
                const fromAyah = parseInt(document.getElementById('hifz-from-ayah').value);
                const toAyah = parseInt(document.getElementById('hifz-to-ayah').value);

                if (surahId && fromAyah && toAyah && fromAyah <= toAyah) {
                    this.competitionManager.startHifzSession(surahId, fromAyah, toAyah);
                } else {
                    this.showNotification('بيانات غير صحيحة', 'error');
                }
            });
            form.dataset.listening = "true";
        }
    },

    // Bridge methods for HTML onclick
    showHint() { this.competitionManager.showHint(); },
    checkMemorization() { this.competitionManager.checkLevelComplete() ? this.competitionManager.levelUp() : this.showNotification('لم تكتمل جميع الكلمات بعد', 'warning'); },
    stopHifzSession() { this.competitionManager.stopSession(); },
    nextLevel() { this.competitionManager.levelUp(); },

    // ===================================
    // HIFZ MODULE
    // ===================================

    hifzEngine: {
        // Analyser la difficulté des mots
        analyzeWordDifficulty(text) {
            const words = text.split(' ');
            return words.map((word, index) => ({
                word,
                index,
                difficulty: this.calculateDifficulty(word, index, words.length),
                isHidden: false
            }));
        },

        calculateDifficulty(word, position, total) {
            let score = 0;
            score += word.length * 2; // Mots longs = difficiles
            const middle = total / 2;
            score += Math.abs(position - middle); // Milieu = difficile (wait, middle is usually harder? prompt said so)
            // Correction: usually start/end are easier, middle is harder.
            // If prompt says "Milieu = difficile", then score should be higher for middle.
            // Math.abs(position - middle) is 0 at middle. So this logic makes edges higher score.
            // I will invert it:
            score += (total / 2) - Math.abs(position - middle);

            const complex = word.match(/[َُِّْٓۖۗ]/g);
            score += (complex ? complex.length : 0) * 3; // Tashkeel complexe
            return score;
        },

        // Générer le masquage selon le niveau
        generateMaskLevel(text, level) {
            // Level 1: Hide 20% (hardest)
            // Level 5: Hide 100%
            const analysis = this.analyzeWordDifficulty(text);
            const totalWords = analysis.length;

            // Percentage to SHOW
            // Level 1: Show 80% (Hide 20%)
            // Level 2: Show 60%
            // Level 3: Show 40%
            // Level 4: Show 20%
            // Level 5: Show 0% (Hide all)
            const fractionToShow = Math.max(0, 1 - (level * 0.2));
            const wordsToShow = Math.ceil(totalWords * fractionToShow);

            // Sort by difficulty descending (Hardest first)
            // We want to HIDE the hardest ones first.
            // So we take the top (Total - Show) hardest words and hide them.
            const sorted = [...analysis].sort((a, b) => b.difficulty - a.difficulty);

            const wordsToHide = totalWords - wordsToShow;

            for(let i = 0; i < wordsToHide; i++) {
                if (sorted[i]) sorted[i].isHidden = true;
            }

            // Remettre dans l'ordre
            return analysis.sort((a, b) => a.index - b.index);
        }
    },

    competitionManager: {
        // Générer un défi
        generateChallenge(type, difficulty = 'medium') {
            // Simple pool generation
            const totalSurahs = 114;
            const randomSurah = Math.floor(Math.random() * totalSurahs) + 1;

            return {
                type,
                difficulty,
                surahId: randomSurah,
                startTime: Date.now()
            };
        },

        // Démarrer un défi
        startChallenge(type) {
            const challenge = this.generateChallenge(type);
            QuranReview.state.competition.activeChallenge = challenge;
            QuranReview.renderCompetitionPage(); // Switch view

            const container = document.getElementById('competition-active');
            container.innerHTML = '<div style="text-align:center; padding: 2rem;">⏳ جاري إعداد التحدي...</div>';

            // Route to specific game logic
            switch(type) {
                case 'speed_run':
                    this.startSpeedRun(container);
                    break;
                case 'ayah_hunt':
                    this.startAyahHunt(container);
                    break;
                case 'precision':
                    this.startPrecision(container);
                    break;
            }
        },

        // ========================
        // GAME: AYAH HUNT
        // ========================
        async startAyahHunt(container) {
            let score = 0;
            let questionCount = 0;
            const maxQuestions = 10;
            const questions = [];

            // Pre-fetch questions
            for(let i=0; i<maxQuestions; i++) {
                // Weighted random for better UX (focus on common surahs first?)
                // For now completely random
                const surahId = Math.floor(Math.random() * 114) + 1;
                const surah = QuranReview.config.surahs.find(s => s.id === surahId);
                const ayahNum = Math.floor(Math.random() * surah.ayahs) + 1;
                questions.push({ surah, ayahNum });
            }

            const renderQuestion = async (index) => {
                if (index >= maxQuestions) {
                    this.endChallenge(score, 'ayah_hunt');
                    return;
                }

                const q = questions[index];
                const text = await QuranReview.fetchAyahText(q.surah.id, q.ayahNum);

                // Generate options (1 correct + 3 wrong)
                const options = [q.surah];
                while(options.length < 4) {
                    const randomS = QuranReview.config.surahs[Math.floor(Math.random() * 114)];
                    if (!options.find(o => o.id === randomS.id)) options.push(randomS);
                }
                // Shuffle options
                options.sort(() => Math.random() - 0.5);

                container.innerHTML = `
                    <div class="card" style="text-align: center;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:1rem;">
                            <span>السؤال ${index + 1}/${maxQuestions}</span>
                            <span>النقاط: ${score}</span>
                        </div>
                        <div class="arabic-large" style="background:#f8f9fa; padding:2rem; border-radius:12px; margin-bottom:2rem;">
                            ${text || 'جاري التحميل...'}
                        </div>
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                            ${options.map(opt => `
                                <button class="btn btn-outline" style="width:100%; padding:1rem;"
                                    onclick="QuranReview.competitionManager.handleHuntAnswer(${opt.id === q.surah.id}, ${index}, ${score})">
                                    سورة ${opt.name}
                                </button>
                            `).join('')}
                        </div>
                        <button class="btn btn-danger" style="margin-top:2rem;" onclick="QuranReview.competitionManager.abortChallenge()">انسحاب</button>
                    </div>
                `;
            };

            // Global handler hack for the generated HTML
            this.handleHuntAnswer = (isCorrect, currentIndex, currentScore) => {
                if (isCorrect) {
                    score += 100; // + Time bonus logic could be added
                    QuranReview.showNotification('إجابة صحيحة! +100', 'success');
                } else {
                    QuranReview.showNotification('إجابة خاطئة', 'error');
                }
                renderQuestion(currentIndex + 1);
            };

            renderQuestion(0);
        },

        // ========================
        // GAME: SPEED RUN
        // ========================
        async startSpeedRun(container) {
            // Pick 5 ayahs sequence from valid surahs
            let surahId, surah;
            do {
                surahId = Math.floor(Math.random() * 114) + 1;
                surah = QuranReview.config.surahs.find(s => s.id === surahId);
            } while (surah.ayahs < 5);

            const startAyah = Math.floor(Math.random() * (surah.ayahs - 4)) + 1;
            const endAyah = startAyah + 4;

            container.innerHTML = `<div style="text-align:center;">⏳ جاري تحميل الآيات...</div>`;

            // Fetch all texts
            const texts = [];
            for (let i = startAyah; i <= endAyah; i++) {
                texts.push(await QuranReview.fetchAyahText(surahId, i));
            }

            let timeLeft = 300; // 5 minutes
            let timerInterval;

            const startMemorization = () => {
                container.innerHTML = `
                    <div class="card">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                            <h3>سورة ${surah.name} (${startAyah}-${endAyah})</h3>
                            <div style="font-size:1.5rem; font-weight:bold; color:var(--accent-red);" id="sr-timer">05:00</div>
                        </div>
                        <div class="arabic-text" style="line-height:2.5; margin-bottom:2rem;">
                            ${texts.map((t, i) => `<span style="display:block; margin-bottom:1rem;">(${startAyah+i}) ${t}</span>`).join('')}
                        </div>
                        <button class="btn btn-primary" style="width:100%;" onclick="QuranReview.competitionManager.startSpeedTest(${surahId}, ${startAyah}, ${endAyah})">
                            انتهيت من الحفظ - ابدأ الاختبار
                        </button>
                    </div>
                `;

                timerInterval = setInterval(() => {
                    timeLeft--;
                    const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
                    const s = (timeLeft % 60).toString().padStart(2, '0');
                    const timerEl = document.getElementById('sr-timer');
                    if(timerEl) timerEl.textContent = `${m}:${s}`;

                    if (timeLeft <= 0) {
                        clearInterval(timerInterval);
                        this.startSpeedTest(surahId, startAyah, endAyah);
                    }
                }, 1000);

                // Save interval to clear it later
                this.activeTimer = timerInterval;
            };

            this.startSpeedTest = async (sid, start, end) => {
                clearInterval(this.activeTimer);

                // Test: Fill in the blanks (Mask 50% words)
                // Reuse Hifz engine partially? Or simple check.
                // Let's do a simple self-verification for Speed Run as implemented in many apps
                // Or "Select correct word"

                container.innerHTML = `
                    <div class="card">
                        <h3>اختبار الحفظ</h3>
                        <p>أكمل الفراغات (اكتب الكلمة الناقصة)</p>
                        <div id="sr-test-area"></div>
                        <button class="btn btn-success" style="width:100%; margin-top:1rem;" onclick="QuranReview.competitionManager.finishSpeedRun()">تسليم الإجابة</button>
                    </div>
                `;

                const testArea = document.getElementById('sr-test-area');
                let totalBlanks = 0;

                texts.forEach((text, idx) => {
                    const words = text.split(' ');
                    const div = document.createElement('div');
                    div.className = 'arabic-text';
                    div.style.marginBottom = '1rem';

                    words.forEach((word, wIdx) => {
                        // Mask random words (every ~3rd word)
                        if (Math.random() < 0.4) {
                            totalBlanks++;
                            const input = document.createElement('input');
                            input.type = 'text';
                            input.className = 'form-input';
                            input.style.width = '80px';
                            input.style.display = 'inline-block';
                            input.style.margin = '0 5px';
                            input.dataset.correct = QuranReview.competitionManager.normalizeArabic(word);
                            div.appendChild(input);
                        } else {
                            const span = document.createElement('span');
                            span.textContent = word + ' ';
                            div.appendChild(span);
                        }
                    });
                    testArea.appendChild(div);
                });

                this.currentSpeedTotalBlanks = totalBlanks;
            };

            this.finishSpeedRun = () => {
                const inputs = document.querySelectorAll('#sr-test-area input');
                let correct = 0;
                inputs.forEach(input => {
                    if (QuranReview.competitionManager.normalizeArabic(input.value) === input.dataset.correct) {
                        correct++;
                        input.style.borderColor = 'green';
                        input.style.backgroundColor = '#d4edda';
                    } else {
                        input.style.borderColor = 'red';
                        input.style.backgroundColor = '#f8d7da';
                    }
                });

                const accuracy = (correct / this.currentSpeedTotalBlanks) * 100;
                const score = Math.floor(accuracy * 10); // Simple scoring

                setTimeout(() => {
                    this.endChallenge(score, 'speed_run');
                }, 2000);
            };

            startMemorization();
        },

        // ========================
        // GAME: PRECISION MASTER
        // ========================
        async startPrecision(container) {
            // Level 5 Hifz logic (100% hidden)
            const surahId = Math.floor(Math.random() * 114) + 1;
            const surah = QuranReview.config.surahs.find(s => s.id === surahId);
            const ayahNum = Math.floor(Math.random() * surah.ayahs) + 1;
            const text = await QuranReview.fetchAyahText(surahId, ayahNum);

            // Using Hifz Engine to generate 100% mask (Level 5)
            const analysis = QuranReview.hifzEngine.generateMaskLevel(text, 5);

            container.innerHTML = `
                <div class="card text-center">
                    <h3>اختبار الدقة: سورة ${surah.name} الآية ${ayahNum}</h3>
                    <p>اكتب الآية كلمة بكلمة</p>
                    <div id="precision-display" class="hifz-display" style="margin: 1rem 0;"></div>
                    <div style="margin-top: 1rem;">
                        <input type="text" id="precision-input" class="form-input" placeholder="اكتب الكلمة التالية..." style="text-align:center;">
                        <button class="btn btn-primary" style="margin-top:0.5rem;" onclick="QuranReview.competitionManager.checkPrecisionWord()">تحقق</button>
                    </div>
                    <div style="margin-top: 1rem;">
                        الأخطاء: <span id="precision-errors" style="color:red;">0</span>/3
                    </div>
                    <button class="btn btn-danger" style="margin-top:2rem;" onclick="QuranReview.competitionManager.abortChallenge()">انسحاب</button>
                </div>
            `;

            this.precisionData = {
                words: analysis,
                currentIndex: 0,
                errors: 0,
                score: 0
            };

            this.renderPrecisionDisplay();
        },

        renderPrecisionDisplay() {
            const container = document.getElementById('precision-display');
            container.innerHTML = '';
            const line = document.createElement('div');
            line.className = 'ayah-line';

            this.precisionData.words.forEach((item, idx) => {
                const span = document.createElement('span');
                if (idx < this.precisionData.currentIndex) {
                    span.className = 'word revealed';
                    span.textContent = item.word;
                } else {
                    span.className = 'word hidden';
                    span.textContent = '____';
                }
                line.appendChild(span);
            });
            container.appendChild(line);
        },

        checkPrecisionWord() {
            const input = document.getElementById('precision-input');
            const userWord = input.value;
            const currentItem = this.precisionData.words[this.precisionData.currentIndex];

            if (QuranReview.competitionManager.normalizeArabic(userWord) === QuranReview.competitionManager.normalizeArabic(currentItem.word)) {
                // Correct
                this.precisionData.currentIndex++;
                this.precisionData.score += 20;
                input.value = '';
                this.renderPrecisionDisplay();

                if (this.precisionData.currentIndex >= this.precisionData.words.length) {
                    this.endChallenge(this.precisionData.score, 'precision');
                }
            } else {
                // Wrong
                this.precisionData.errors++;
                document.getElementById('precision-errors').textContent = this.precisionData.errors;
                input.classList.add('error-shake'); // Assuming css or just visual feedback
                setTimeout(() => input.classList.remove('error-shake'), 500);

                if (this.precisionData.errors >= 3) {
                    alert('انتهت المحاولات!');
                    this.endChallenge(this.precisionData.score, 'precision');
                }
            }
        },

        // ========================
        // COMMON LOGIC
        // ========================
        endChallenge(score, type) {
            clearInterval(this.activeTimer);

            // Update stats
            const stats = QuranReview.state.competition.userStats;
            stats.totalScore += score;
            stats.challengesPlayed++;
            if (score > 0) stats.challengesWon++; // Assume positive score is a win
            stats.winStreak = score > 0 ? stats.winStreak + 1 : 0;

            stats.history.push({
                type,
                score,
                date: new Date().toISOString()
            });

            // Update Rank
            stats.rank = this.calculateRank(stats.totalScore).level;

            // Update Leaderboard (Simulated local for now)
            this.updateLeaderboard(score);

            QuranReview.saveData();

            // Reset
            QuranReview.state.competition.activeChallenge = null;

            // Show result
            const container = document.getElementById('competition-active');
            container.innerHTML = `
                <div class="card" style="text-align: center; animation: fadeIn 0.5s;">
                    <div style="font-size: 4rem;">🎉</div>
                    <h2>اكتمل التحدي!</h2>
                    <div style="font-size: 2rem; color: var(--accent-green); margin: 1rem 0;">+${score} نقطة</div>
                    <button class="btn btn-primary" onclick="QuranReview.renderCompetitionPage()">عودة للقائمة</button>
                </div>
            `;
        },

        abortChallenge() {
            if(confirm('هل أنت متأكد من الانسحاب؟')) {
                clearInterval(this.activeTimer);
                QuranReview.state.competition.activeChallenge = null;
                QuranReview.renderCompetitionPage();
            }
        },

        // Système de rangs
        calculateRank(totalScore) {
            if(totalScore >= 50000) return { name: 'شيخ', icon: '👑', level: 'diamond' };
            if(totalScore >= 15000) return { name: 'أستاذ', icon: '💎', level: 'platinum' };
            if(totalScore >= 5000) return { name: 'حافظ', icon: '🥇', level: 'gold' };
            if(totalScore >= 1000) return { name: 'طالب', icon: '🥈', level: 'silver' };
            return { name: 'مبتدئ', icon: '🥉', level: 'bronze' };
        },

        async updateLeaderboard(score) {
            const entry = {
                name: QuranReview.state.settings.userName || 'أنت',
                score: score,
                date: new Date().toISOString(),
                rank: this.calculateRank(QuranReview.state.competition.userStats.totalScore).name
            };

            // Add to local leaderboard for demo
            let board = QuranReview.state.competition.leaderboard || [];
            board.push(entry);

            try {
                const token = localStorage.getItem(QuranReview.config.apiTokenKey);
                if (token) {
                    const response = await fetch(`${QuranReview.config.apiBaseUrl}/api/leaderboard/`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    });

                    if (response.ok) {
                        const data = await response.json();
                        this.renderLeaderboardData(data.leaderboard || []);
                        return;
                    }
                }
            } catch (error) {
                Logger.error('LEADERBOARD', 'Failed to update leaderboard', error);
            }

            // Fallback to local leaderboard
            this.renderLocalLeaderboard();
        },

        renderLocalLeaderboard() {
            const list = document.getElementById('leaderboard-list');
            const board = QuranReview.state.competition.leaderboard || [];
            this.renderLeaderboardData(board);
        },

        renderLeaderboardData(board) {
            const list = document.getElementById('leaderboard-list');
            if (!list) return;

            if (board.length === 0) {
                list.innerHTML = '<div style="text-align:center; color:gray; padding:2rem;">لا توجد سجلات بعد</div>';
                return;
            }

            list.innerHTML = board.map((entry, idx) => {
                const rankIcon = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`;
                return `
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:0.75rem; border-bottom:1px solid var(--border-color); background: ${idx < 3 ? 'var(--bg-accent)' : 'transparent'};">
                        <div style="display:flex; align-items:center; gap:0.5rem;">
                            <span style="font-size:1.2rem;">${rankIcon}</span>
                            <span style="font-weight:600;">${entry.name || 'مستخدم'}</span>
                            ${entry.rank ? `<span class="user-badge ${entry.rank.toLowerCase()}">${entry.rank}</span>` : ''}
                        </div>
                        <div style="text-align:right;">
                            <div style="font-weight:bold; color:var(--accent-green);">${entry.score || entry.total_points || 0}</div>
                            <div style="font-size:0.8rem; color:var(--text-secondary);">نقطة</div>
                        </div>
                    </div>
                `;
            }).join('');
        },

        async renderLeaderboard() {
            const list = document.getElementById('leaderboard-list');
            if (!list) return;

            try {
                // Fetch real leaderboard from API
                const token = localStorage.getItem(QuranReview.config.apiTokenKey);
                if (!token) {
                    // Fallback to local leaderboard if not authenticated
                    this.renderLocalLeaderboard();
                    return;
                }

                const response = await fetch(`${QuranReview.config.apiBaseUrl}/api/leaderboard/`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    this.renderLeaderboardData(data.leaderboard || []);
                } else {
                    // Fallback to local leaderboard
                    this.renderLocalLeaderboard();
                }
            } catch (error) {
                Logger.error('LEADERBOARD', 'Failed to fetch leaderboard', error);
                // Fallback to local leaderboard
                this.renderLocalLeaderboard();
            }
        },

        // ===================================
        // HIFZ SESSION MANAGEMENT
        // ===================================

        startHifzSession(surahId, fromAyah, toAyah) {
            console.log(`Starting Hifz: ${surahId}:${fromAyah}-${toAyah}`);

            // Update state
            QuranReview.state.hifz.currentSession = {
                isActive: true,
                surahId,
                fromAyah,
                toAyah,
                currentAyah: fromAyah,
                level: 1,
                score: 0,
                startTime: Date.now()
            };
            QuranReview.saveData();

            // Reset UI
            this.hintsRemaining = 3;
            document.getElementById('hints-count').textContent = this.hintsRemaining;

            // Render
            QuranReview.renderHifzPage();

            // Load content
            this.loadAyahForHifz(surahId, fromAyah);
        },

        async loadAyahForHifz(surahId, ayahNumber) {
            const container = document.getElementById('hifz-display');
            container.innerHTML = '<div style="text-align:center;">⏳ جاري التحميل...</div>';

            const ayahText = await QuranReview.fetchAyahText(surahId, ayahNumber);

            if (!ayahText) {
                container.innerHTML = '<div style="text-align:center; color:red;">❌ خطأ في تحميل الآية</div>';
                return;
            }

            const analysis = QuranReview.hifzEngine.generateMaskLevel(ayahText, QuranReview.state.hifz.currentSession.level);
            this.renderHifzDisplay(analysis);
            this.updateLevelDisplay();
        },

        renderHifzDisplay(wordAnalysis) {
            const container = document.getElementById('hifz-display');
            container.innerHTML = '';

            const line = document.createElement('div');
            line.className = 'ayah-line';

            wordAnalysis.forEach((item, idx) => {
                const span = document.createElement('span');
                span.className = `word ${item.isHidden ? 'hidden' : 'revealed'}`;
                span.textContent = item.isHidden ? '____' : item.word;
                span.dataset.word = item.word;
                span.dataset.index = idx; // Important for finding it later

                if(item.isHidden) {
                    span.onclick = () => this.attemptReveal(span, item.word);
                }

                line.appendChild(span);
            });

            container.appendChild(line);
        },

        attemptReveal(spanElement, correctWord) {
            // Prevent clicking already revealed words (if class not updated yet)
            if (!spanElement.classList.contains('hidden')) return;

            const input = prompt('ما هذه الكلمة؟');
            if (input === null) return; // Cancelled

            if(this.normalizeArabic(input) === this.normalizeArabic(correctWord)) {
                // Correct
                spanElement.classList.remove('hidden');
                spanElement.classList.add('revealed');
                spanElement.textContent = correctWord;
                spanElement.onclick = null; // Remove handler

                QuranReview.state.hifz.currentSession.score += 10;
                QuranReview.saveData();

                // Check if level complete
                if(this.checkLevelComplete()) {
                    setTimeout(() => {
                        const feedback = document.getElementById('hifz-feedback');
                        feedback.classList.remove('hidden');
                        feedback.classList.add('show');
                    }, 500);
                }
            } else {
                // Error animation
                spanElement.style.backgroundColor = '#f8d7da'; // Light red
                setTimeout(() => spanElement.style.backgroundColor = '', 500);
            }
        },

        normalizeArabic(text) {
            if (!text) return '';
            return text
                .replace(/[\u064B-\u065F\u0670\u0640]/g, '') // Remove tashkeel
                .replace(/[إأآا]/g, 'ا')
                .replace(/ى/g, 'ي')
                .replace(/ة/g, 'ه')
                .trim();
        },

        showHint() {
            if(this.hintsRemaining <= 0) {
                QuranReview.showNotification('نفذت التلميحات', 'warning');
                return;
            }

            const hiddenWords = document.querySelectorAll('.word.hidden');
            if(hiddenWords.length === 0) return;

            const randomWord = hiddenWords[Math.floor(Math.random() * hiddenWords.length)];

            // Reveal it visually as a hint
            randomWord.classList.remove('hidden');
            randomWord.classList.add('revealed-hint');
            randomWord.textContent = randomWord.dataset.word;
            randomWord.onclick = null; // No need to guess anymore

            this.hintsRemaining--;
            document.getElementById('hints-count').textContent = this.hintsRemaining;

            // Penalty
            QuranReview.state.hifz.currentSession.score = Math.max(0, QuranReview.state.hifz.currentSession.score - 5);
            QuranReview.saveData();
        },

        checkLevelComplete() {
            return document.querySelectorAll('.word.hidden').length === 0;
        },

        levelUp() {
            // Hide feedback
            const feedback = document.getElementById('hifz-feedback');
            feedback.classList.remove('show');
            setTimeout(() => feedback.classList.add('hidden'), 300);

            const session = QuranReview.state.hifz.currentSession;
            if(session.level < 5) {
                session.level++;
                QuranReview.showNotification(`المستوى ${session.level}`, 'success');
                this.loadAyahForHifz(session.surahId, session.currentAyah);
            } else {
                // Next Ayah or Finish
                if (session.currentAyah < session.toAyah) {
                    session.currentAyah++;
                    session.level = 1;
                    QuranReview.showNotification(`الآية التالية: ${session.currentAyah}`, 'success');
                    this.loadAyahForHifz(session.surahId, session.currentAyah);
                } else {
                    this.completeSession();
                }
            }
            QuranReview.saveData();
        },

        updateLevelDisplay() {
            const dots = document.querySelectorAll('.level-dots .dot');
            const level = QuranReview.state.hifz.currentSession.level;
            dots.forEach((dot, idx) => {
                if (idx < level) dot.classList.add('active');
                else dot.classList.remove('active');
            });
        },

        completeSession() {
            const session = QuranReview.state.hifz.currentSession;
            const timeTaken = (Date.now() - session.startTime) / 1000;

            // Save completion
            // Ensure history exists
            if (!QuranReview.state.hifz.history) QuranReview.state.hifz.history = [];

            QuranReview.state.hifz.history.push({
                surahId: session.surahId,
                fromAyah: session.fromAyah,
                toAyah: session.toAyah,
                score: session.score,
                date: new Date().toISOString(),
                timeTaken
            });

            // Reset session
            QuranReview.state.hifz.currentSession = { isActive: false };
            QuranReview.saveData();

            // Show Feedback
            alert(`🎉 أحسنت! أكملت الجلسة بنجاح.\nالنقاط: ${session.score}`);

            // Return to selection
            QuranReview.renderHifzPage();
        },

        stopSession() {
            if (confirm('هل أنت متأكد من إنهاء الجلسة؟ سيتم فقدان التقدم الحالي.')) {
                QuranReview.state.hifz.currentSession = { isActive: false };
                QuranReview.saveData();
                QuranReview.renderHifzPage();
            }
        }
    },
    
    renderHomePage() {
        // Update motivation
        this.updateDailyMotivation();
        
        // Update stats
        this.updateHomeStats();
    },
    
    renderReadingPage() {
        this.setupReadingControls();
        this.populateReadingSurahSelect();
    },
    
    renderMemorizationPage() {
        console.log('🔄 Rendering memorization page...');
        this.renderMemorizationTable();
        this.setupMemorizationActions();
        console.log('✅ Memorization page rendered');
    },
    
    renderWardPage() {
        console.log('🔄 Rendering ward page...');
        this.setupWardControls();
        this.populateWardSurahSelect();
        console.log('✅ Ward page rendered');
    },
    
    renderProgressPage() {
        this.renderProgressStats();
        this.renderProgressChart();
    },
    
    renderSettingsPage() {
        this.renderSettingsForm();
    },
    
    // ===================================
    // HOME PAGE FUNCTIONS
    // ===================================
    
    updateDailyMotivation() {
        const motivations = [
            { text: 'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ', source: 'رواه البخاري' },
            { text: 'الْقُرْآنُ كَلامُ اللهِ، مَنْ قَرَأَهُ فَقَدْ تَكَلَّمَ مَعَ اللهِ', source: 'حديث قدسي' },
            { text: 'مَثَلُ الْمُؤْمِنِ الَّذِي يَقْرَأُ الْقُرْآنَ كَمَثَلِ الْأُتْرُجَّةِ، رِيحُهَا طَيِّبٌ وَطَعْمُهَا طَيِّبٌ', source: 'رواه البخاري' },
            { text: 'سَيَأْتِي عَلَى النَّاسِ زَمَانٌ يَتَعَلَّمُونَ فِيهِ الْقُرْآنَ، ثُمَّ يَقْرَؤُونَهُ', source: 'رواه البخاري' }
        ];
        
        const today = new Date().getDate();
        const motivation = motivations[today % motivations.length];
        
        const textElement = document.getElementById('motivation-text');
        const sourceElement = document.getElementById('motivation-source');
        
        if (textElement) textElement.textContent = motivation.text;
        if (sourceElement) sourceElement.textContent = motivation.source;
    },
    
    updateHomeStats() {
        const stats = this.calculateStats();
        
        const totalSurahsElement = document.getElementById('home-total-surahs');
        const masteredElement = document.getElementById('home-mastered');
        const weakElement = document.getElementById('home-weak');
        const newElement = document.getElementById('home-new');
        
        if (totalSurahsElement) totalSurahsElement.textContent = stats.total;
        if (masteredElement) masteredElement.textContent = stats.mastered;
        if (weakElement) weakElement.textContent = stats.weak;
        if (newElement) newElement.textContent = stats.new;
    },
    
    // ===================================
    // WARD CONTROLS
    // ===================================
    
    setupWardControls() {
        // Surah selector
        const surahSelect = document.getElementById('ward-surah-select');
        if (surahSelect) {
            surahSelect.addEventListener('change', () => {
                this.updateWardAyahLimits();
            });
        }
        
        // From/To ayah inputs
        const fromAyahInput = document.getElementById('ward-from-ayah');
        const toAyahInput = document.getElementById('ward-to-ayah');
        
        if (fromAyahInput) {
            fromAyahInput.addEventListener('input', () => {
                this.updateWardAyahLimits();
            });
        }
        
        if (toAyahInput) {
            toAyahInput.addEventListener('input', () => {
                this.updateWardAyahLimits();
            });
        }
        
        // Reciter selector
        const reciterSelector = document.getElementById('ward-reciter-selector');
        if (reciterSelector) {
            reciterSelector.addEventListener('change', () => {
                this.updateWardReciter();
            });
        }
        
        // Audio quality selector
        const audioQualitySelector = document.getElementById('ward-audio-quality');
        if (audioQualitySelector) {
            audioQualitySelector.addEventListener('change', () => {
                this.updateWardAudioQuality();
            });
        }
        
        // Audio source selector
        const audioSourceSelector = document.getElementById('ward-audio-source');
        if (audioSourceSelector) {
            audioSourceSelector.addEventListener('change', () => {
                this.updateWardAudioSource();
            });
        }
        
        // Image quality selector
        const imageQualitySelector = document.getElementById('ward-image-quality');
        if (imageQualitySelector) {
            imageQualitySelector.addEventListener('change', () => {
                this.updateWardImageQuality();
            });
        }
        
        // Ayah delay selector
        const ayahDelaySelector = document.getElementById('ward-ayah-delay');
        if (ayahDelaySelector) {
            ayahDelaySelector.addEventListener('change', () => {
                this.updateWardAyahDelay();
            });
        }
        
        // Auto play next checkbox
        const autoPlayNextCheckbox = document.getElementById('ward-autoplay-next');
        if (autoPlayNextCheckbox) {
            autoPlayNextCheckbox.addEventListener('change', () => {
                this.updateWardAutoPlayNext();
            });
        }
        
        console.log('✅ Ward controls setup completed');
    },
    
    populateWardSurahSelect() {
        const surahSelect = document.getElementById('ward-surah-select');
        if (!surahSelect) return;
        
        // Clear existing options except the first one
        while (surahSelect.children.length > 1) {
            surahSelect.removeChild(surahSelect.lastChild);
        }
        
        // Create a DocumentFragment to batch DOM updates
        const fragment = document.createDocumentFragment();

        // Add all 114 surahs with correct ayah counts
        this.config.surahs.forEach(surah => {
            const option = document.createElement('option');
            option.value = surah.id;
            option.textContent = `${surah.name} (${surah.ayahs} آيات)`;
            fragment.appendChild(option);
        });
        
        // Append the fragment to the select element in a single operation
        surahSelect.appendChild(fragment);

        console.log('📋 Ward surah select populated with 114 surahs');
    },
    
    updateWardAyahLimits() {
        const surahSelect = document.getElementById('ward-surah-select');
        const fromAyahInput = document.getElementById('ward-from-ayah');
        const toAyahInput = document.getElementById('ward-to-ayah');
        
        if (!surahSelect || !fromAyahInput || !toAyahInput) return;
        
        const surahId = parseInt(surahSelect.value);
        if (!surahId) return;
        
        const surah = this.config.surahs.find(s => s.id === surahId);
        if (!surah) return;
        
        // Update max values
        fromAyahInput.max = surah.ayahs;
        toAyahInput.max = surah.ayahs;
        
        // Update placeholder
        fromAyahInput.placeholder = `من 1 إلى ${surah.ayahs}`;
        toAyahInput.placeholder = `من 1 إلى ${surah.ayahs}`;
        
        // Clear current values if they exceed the limit
        if (parseInt(fromAyahInput.value) > surah.ayahs) {
            fromAyahInput.value = '';
        }
        if (parseInt(toAyahInput.value) > surah.ayahs) {
            toAyahInput.value = '';
        }
        
        console.log(`📊 Updated ward ayah limits for Surah ${surahId}: 1-${surah.ayahs}`);
    },
    
    updateWardReciter() {
        const reciterSelector = document.getElementById('ward-reciter-selector');
        
        if (reciterSelector && window.QuranAudio) {
            const selectedReciter = reciterSelector.value;
            QuranAudio.setReciter(selectedReciter);
            console.log('🎵 Ward reciter updated to:', selectedReciter);
            this.showNotification(`تم تغيير القارئ إلى: ${QuranAudio.getReciterName(selectedReciter)}`, 'success');
        }
    },
    
    updateWardAudioQuality() {
        const audioQualitySelector = document.getElementById('ward-audio-quality');
        
        if (audioQualitySelector && window.QuranAudio) {
            const bitrate = parseInt(audioQualitySelector.value);
            if (QuranAudio.setBitrate(bitrate)) {
                this.showNotification(`تم تغيير جودة الصوت إلى: ${bitrate} kbps`, 'success');
            }
        }
    },
    
    updateWardAudioSource() {
        const audioSourceSelector = document.getElementById('ward-audio-source');
        
        if (audioSourceSelector) {
            const source = audioSourceSelector.value;
            this.state.settings.audioSource = source;
            this.showNotification(`تم تغيير مصدر الصوت إلى: ${source === 'local' ? 'ملفات محلية' : 'عبر الإنترنت'}`, 'success');
            console.log(`🎵 Audio source updated to: ${source}`);
        }
    },
    
    updateWardImageQuality() {
        const imageQualitySelector = document.getElementById('ward-image-quality');
        
        if (imageQualitySelector) {
            const quality = imageQualitySelector.value;
            this.state.imageQuality = quality;
            this.showNotification(`تم تغيير جودة الصور إلى: ${quality === 'high' ? 'عالية الدقة' : 'عادية'}`, 'success');
        }
    },
    
    updateWardAyahDelay() {
        const ayahDelaySelector = document.getElementById('ward-ayah-delay');
        
        if (ayahDelaySelector) {
            const delay = parseFloat(ayahDelaySelector.value);
            this.state.settings.ayahDelay = delay;
            this.showNotification(`تم تغيير مدة الآية إلى: ${delay} ثانية`, 'success');
            console.log(`⏱️ Ayah delay updated to: ${delay} seconds`);
        }
    },
    
    updateWardAutoPlayNext() {
        const autoPlayNextCheckbox = document.getElementById('ward-autoplay-next');
        
        if (autoPlayNextCheckbox) {
            const autoPlayNext = autoPlayNextCheckbox.checked;
            this.state.settings.autoPlayNext = autoPlayNext;
            this.showNotification(`تم ${autoPlayNext ? 'تفعيل تشغيل الآية التالية' : 'إيقاف تشغيل الآية التالية'}`, 'success');
            console.log(`🔄 Auto-play next: ${autoPlayNext}`);
        }
    },
    
    // ===================================
    // READING PAGE FUNCTIONS
    // ===================================
    
    setupReadingControls() {
        const surahSelect = document.getElementById('reading-surah-select');
        const ayahSelect = document.getElementById('reading-ayah-select');
        const prevBtn = document.getElementById('prev-ayah');
        const nextBtn = document.getElementById('next-ayah');
        const playBtn = document.getElementById('play-ayah');
        const toggleBtn = document.getElementById('toggle-image-text');
        const downloadBtn = document.getElementById('download-image');
        
        // Surah selection
        if (surahSelect) {
            surahSelect.addEventListener('change', () => {
                this.populateAyahSelect();
                this.updateAyahDisplay();
            });
        }
        
        // Ayah selection
        if (ayahSelect) {
            ayahSelect.addEventListener('change', () => {
                this.updateAyahDisplay();
            });
        }
        
        // Navigation buttons
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.navigateAyah(-1);
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.navigateAyah(1);
            });
        }
        
        // Play ayah audio
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                this.playCurrentAyah();
            });
        }
        
        // Toggle image/text
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.toggleImageText();
            });
        }
        
        // Download image
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                this.downloadAyahImage();
            });
        }
    },
    
    populateReadingSurahSelect() {
        const surahSelect = document.getElementById('reading-surah-select');
        if (!surahSelect) return;
        
        // Clear existing options except the first one
        while (surahSelect.children.length > 1) {
            surahSelect.removeChild(surahSelect.lastChild);
        }
        
        // Create a DocumentFragment to batch DOM updates
        const fragment = document.createDocumentFragment();

        // Add all surahs
        this.config.surahs.forEach(surah => {
            const option = document.createElement('option');
            option.value = surah.id;
            option.textContent = `${surah.name} (${surah.ayahs} آيات)`;
            fragment.appendChild(option);
        });

        // Append the fragment to the select element in a single operation
        surahSelect.appendChild(fragment);
    },
    
    populateAyahSelect() {
        const surahSelect = document.getElementById('reading-surah-select');
        const ayahSelect = document.getElementById('reading-ayah-select');
        
        if (!surahSelect || !ayahSelect) return;
        
        const surahId = parseInt(surahSelect.value);
        const surah = this.config.surahs.find(s => s.id === surahId);
        
        if (!surah) return;
        
        // Clear existing options
        ayahSelect.innerHTML = '<option value="">-- اختر الآية --</option>';
        
        // Add ayah options
        for (let i = 1; i <= surah.ayahs; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `الآية ${i}`;
            ayahSelect.appendChild(option);
        }
        
        // Enable navigation buttons
        this.updateNavigationButtons();
    },
    
    updateAyahDisplay() {
        const surahSelect = document.getElementById('reading-surah-select');
        const ayahSelect = document.getElementById('reading-ayah-select');
        const ayahImage = document.getElementById('ayah-image');
        const ayahText = document.getElementById('ayah-text');
        const ayahInfo = document.getElementById('current-ayah-info');
        
        if (!surahSelect || !ayahSelect) return;
        
        const surahId = parseInt(surahSelect.value);
        const ayahNumber = parseInt(ayahSelect.value);
        
        if (!surahId || !ayahNumber) return;
        
        const surah = this.config.surahs.find(s => s.id === surahId);
        if (!surah) return;
        
        // Update info
        if (ayahInfo) {
            ayahInfo.textContent = `${surah.name} - الآية ${ayahNumber}`;
        }
        
        // Update image with quality setting
        if (ayahImage && window.QuranAudio) {
            const highRes = this.state.imageQuality === 'high';
            const imageUrl = QuranAudio.getAyahImageUrl(surahId, ayahNumber, highRes);
            ayahImage.src = imageUrl;
            ayahImage.style.display = 'block';
            ayahImage.onerror = () => {
                ayahImage.style.display = 'none';
                if (ayahText) {
                    ayahText.textContent = `${surah.name} - الآية ${ayahNumber}`;
                    ayahText.style.display = 'block';
                }
            };
        }
        
        // Hide text initially
        if (ayahText) {
            ayahText.style.display = 'none';
        }
        
        // Update navigation buttons
        this.updateNavigationButtons();
    },
    
    updateNavigationButtons() {
        const surahSelect = document.getElementById('reading-surah-select');
        const ayahSelect = document.getElementById('reading-ayah-select');
        const prevBtn = document.getElementById('prev-ayah');
        const nextBtn = document.getElementById('next-ayah');
        
        if (!surahSelect || !ayahSelect || !prevBtn || !nextBtn) return;
        
        const surahId = parseInt(surahSelect.value);
        const ayahNumber = parseInt(ayahSelect.value);
        
        if (!surahId || !ayahNumber) {
            prevBtn.disabled = true;
            nextBtn.disabled = true;
            return;
        }
        
        const surah = this.config.surahs.find(s => s.id === surahId);
        if (!surah) return;
        
        prevBtn.disabled = ayahNumber <= 1;
        nextBtn.disabled = ayahNumber >= surah.ayahs;
    },
    
    navigateAyah(direction) {
        const ayahSelect = document.getElementById('reading-ayah-select');
        if (!ayahSelect) return;
        
        const currentAyah = parseInt(ayahSelect.value);
        const newAyah = currentAyah + direction;
        
        if (newAyah >= 1) {
            ayahSelect.value = newAyah;
            this.updateAyahDisplay();
        }
    },
    
    playCurrentAyah() {
        const surahSelect = document.getElementById('reading-surah-select');
        const ayahSelect = document.getElementById('reading-ayah-select');
        
        if (!surahSelect || !ayahSelect) return;
        
        const surahId = parseInt(surahSelect.value);
        const ayahNumber = parseInt(ayahSelect.value);
        
        if (!surahId || !ayahNumber) return;
        
        // Convert to global ayah number
        const globalAyahNumber = window.QuranAudio ? 
            QuranAudio.surahAyahToGlobal(surahId, ayahNumber) : 
            (surahId * 1000 + ayahNumber); // Fallback
        
        // Play ayah audio
        if (window.QuranAudio) {
            const audioUrl = QuranAudio.getAyahAudioUrl(globalAyahNumber);
            console.log('🎵 Playing ayah audio:', audioUrl);
            window.open(audioUrl, '_blank', 'noopener,noreferrer');
            this.showNotification('تم فتح الآية في نافذة جديدة', 'info');
        }
    },
    
    toggleImageText() {
        const ayahImage = document.getElementById('ayah-image');
        const ayahText = document.getElementById('ayah-text');
        
        if (!ayahImage || !ayahText) return;
        
        if (ayahImage.style.display === 'none') {
            ayahImage.style.display = 'block';
            ayahText.style.display = 'none';
        } else {
            ayahImage.style.display = 'none';
            ayahText.style.display = 'block';
        }
    },
    
    downloadAyahImage() {
        const ayahImage = document.getElementById('ayah-image');
        if (!ayahImage || !ayahImage.src) return;
        
        const link = document.createElement('a');
        link.href = ayahImage.src;
        link.download = `ayah_${Date.now()}.png`;
        link.click();
        
        this.showNotification('تم تحميل صورة الآية', 'success');
    },
    
    // ===================================
    // MEMORIZATION PAGE FUNCTIONS
    // ===================================
    
    renderMemorizationTable() {
        const tableBody = document.getElementById('memorization-table-body');
        if (!tableBody) return;
        
        const todayData = this.getTodayMemorizationData();
        
        // Render sections separately to avoid duplication
        let html = '';
        
        // Previously memorized section
        if (todayData.previouslyMemorized.length > 0) {
            html += `
                <tr class="section-header">
                    <td colspan="7" style="background: var(--accent-green); color: white; text-align: center; font-weight: bold;">
                        📚 محفوظ سابقًا (للتثبيت)
                    </td>
                </tr>
            `;
            html += todayData.previouslyMemorized.map(item => this.createTableRow(item)).join('');
        }
        
        // Today's review section
        if (todayData.todayReview.length > 0) {
            html += `
                <tr class="section-header">
                    <td colspan="7" style="background: var(--accent-gold); color: white; text-align: center; font-weight: bold;">
                        📋 مراجعة اليوم
                    </td>
                </tr>
            `;
            html += todayData.todayReview.map(item => this.createTableRow(item)).join('');
        }
        
        // New memorization section
        if (todayData.newMemorization.length > 0) {
            html += `
                <tr class="section-header">
                    <td colspan="7" style="background: var(--accent-red); color: white; text-align: center; font-weight: bold;">
                        ✨ حفظ جديد
                    </td>
                </tr>
            `;
            html += todayData.newMemorization.map(item => this.createTableRow(item)).join('');
        }
        
        // No data message
        if (todayData.previouslyMemorized.length === 0 && 
            todayData.todayReview.length === 0 && 
            todayData.newMemorization.length === 0) {
            html += `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                        لا توجد عناصر للحفظ اليوم. أضف حفظًا جديدًا للبدء!
                    </td>
                </tr>
            `;
        }
        
        tableBody.innerHTML = html;
    },
    
    createTableRow(item) {
        return `
            <tr>
                <td class="arabic-text">${this.escapeHtml(item.surahName)}</td>
                <td>${this.escapeHtml(item.fromAyah)} - ${this.escapeHtml(item.toAyah)}</td>
                <td>${this.getStatusBadge(item.status)}</td>
                <td>${item.lastReviewed ? new Date(item.lastReviewed).toLocaleDateString('ar-SA') : 'لم يراجع بعد'}</td>
                <td>${this.escapeHtml(item.reviewCount || 0)}</td>
                <td>${this.getNextReviewDate(item)}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="QuranReview.markAsReviewed(${item.id})" title="تسجيل المراجعة">
                        ✓ مراجعة
                    </button>
                    <button class="btn btn-sm btn-success" onclick="QuranReview.playSurahAudio(${item.surahId})" title="استماع للسورة">
                        🎵 استماع
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="QuranReview.openTarteel(${item.surahId}, ${item.fromAyah}, ${item.toAyah})" title="فتح في تطبيق ترتيل">
                        🎧 ترتيل
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="QuranReview.deleteItem(${item.id})" title="حذف العنصر">
                        حذف
                    </button>
                </td>
            </tr>
        `;
    },
    
        
        
    getStatusBadge(status) {
        const badges = {
            mastered: '<span class="status-badge status-mastered">✓ متقن</span>',
            weak: '<span class="status-badge status-weak">⚠ ضعيف</span>',
            new: '<span class="status-badge status-new">+ جديد</span>'
        };
        return badges[status] || this.escapeHtml(status);
    },
    
    getNextReviewDate(item) {
        if (!item.lastReviewed) return 'اليوم';
        
        const lastReview = new Date(item.lastReviewed);
        const today = new Date();
        const daysSinceReview = Math.floor((today - lastReview) / (1000 * 60 * 60 * 24));
        
        const reviewCount = item.reviewCount || 0;
        let requiredDays;
        
        if (reviewCount === 0) {
            requiredDays = 1;
        } else if (reviewCount === 1) {
            requiredDays = 2;
        } else if (reviewCount === 2) {
            requiredDays = 4;
        } else if (reviewCount === 3) {
            requiredDays = 7;
        } else if (reviewCount === 4) {
            requiredDays = 14;
        } else if (reviewCount >= 5 && reviewCount <= 7) {
            requiredDays = 21;
        } else if (reviewCount >= 8 && reviewCount <= 12) {
            requiredDays = 30;
        } else {
            requiredDays = 45;
        }
        
        if (item.status === 'weak') {
            requiredDays = Math.max(1, Math.floor(requiredDays * 0.5));
        }
        
        const daysUntilNext = requiredDays - daysSinceReview;
        
        if (daysUntilNext <= 0) return 'اليوم';
        if (daysUntilNext === 1) return 'غداً';
        if (daysUntilNext <= 7) return `بعد ${daysUntilNext} أيام`;
        if (daysUntilNext <= 30) return `بعد ${Math.floor(daysUntilNext / 7)} أسابيع`;
        return `بعد ${Math.floor(daysUntilNext / 30)} أشهر`;
    },
    
    setupMemorizationActions() {
        // Add new memorization form
        const addForm = document.getElementById('add-memorization-form');
        if (addForm) {
            addForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addNewMemorization();
            });
        }
        
        // Surah selector for memorization form
        const surahSelect = document.getElementById('surah-select');
        if (surahSelect) {
            surahSelect.addEventListener('change', () => {
                this.updateAyahLimits();
                // Show ward player when surah is selected
                if (surahSelect.value) {
                    this.showWardPlayer();
                }
            });
        }
        
        // From/To ayah inputs
        const fromAyahInput = document.getElementById('from-ayah');
        const toAyahInput = document.getElementById('to-ayah');
        
        if (fromAyahInput) {
            fromAyahInput.addEventListener('input', () => {
                if (surahSelect.value && fromAyahInput.value && toAyahInput.value) {
                    this.showWardPlayer();
                }
            });
        }
        
        if (toAyahInput) {
            toAyahInput.addEventListener('input', () => {
                if (surahSelect.value && fromAyahInput.value && toAyahInput.value) {
                    this.showWardPlayer();
                }
            });
        }
        
        // Reciter selector
        const reciterSelector = document.getElementById('reciter-selector');
        if (reciterSelector) {
            reciterSelector.addEventListener('change', () => {
                this.updateReciter();
            });
        }
        
        // Audio quality selector
        const audioQualitySelector = document.getElementById('audio-quality');
        if (audioQualitySelector) {
            audioQualitySelector.addEventListener('change', () => {
                this.updateAudioQuality();
            });
        }
        
        // Image quality selector
        const imageQualitySelector = document.getElementById('image-quality');
        if (imageQualitySelector) {
            imageQualitySelector.addEventListener('change', () => {
                this.updateImageQuality();
            });
        }
    },
    
    addNewMemorization() {
        const surahSelect = document.getElementById('surah-select');
        const fromAyahInput = document.getElementById('from-ayah');
        const toAyahInput = document.getElementById('to-ayah');
        
        const surahId = parseInt(surahSelect.value);
        const surah = this.config.surahs.find(s => s.id === surahId);
        const fromAyah = parseInt(fromAyahInput.value);
        const toAyah = parseInt(toAyahInput.value);
        
        if (!surah || fromAyah < 1 || toAyah < fromAyah || toAyah > surah.ayahs) {
            this.showNotification('بيانات غير صحيحة', 'error');
            return;
        }
        
        const newItem = {
            id: Date.now(),
            surahId: surahId,
            surahName: surah.name,
            fromAyah: fromAyah,
            toAyah: toAyah,
            status: 'new',
            dateAdded: this.state.todayDate,
            lastReviewed: null,
            reviewCount: 0
        };
        
        this.state.memorizationData.push(newItem);
        this.saveData();
        this.renderMemorizationPage();
        
        // Reset form
        document.getElementById('add-memorization-form').reset();
        
        this.showNotification('تمت إضافة الحفظ الجديد', 'success');
    },
    
    markAsReviewed(itemId) {
        const item = this.state.memorizationData.find(i => i.id === itemId);
        if (!item) return;
        
        item.lastReviewed = this.state.todayDate;
        item.reviewCount = (item.reviewCount || 0) + 1;
        
        // Update status based on review count
        if (item.reviewCount >= 10) {
            item.status = 'mastered';
        } else if (item.reviewCount >= 3) {
            item.status = 'weak';
        }
        
        this.saveData();
        this.renderMemorizationPage();
        
        this.showNotification('تم تسجيل المراجعة', 'success');
    },
    
    deleteItem(itemId) {
        if (!confirm('هل أنت متأكد من حذف هذا العنصر؟')) return;
        
        this.state.memorizationData = this.state.memorizationData.filter(i => i.id !== itemId);
        this.saveData();
        this.renderMemorizationPage();
        
        this.showNotification('تم حذف العنصر', 'info');
    },
    
    // ===================================
    // PROGRESS PAGE FUNCTIONS
    // ===================================
    
    renderProgressPage() {
        try {
            const stats = this.calculateStats();
            
            // Update stat cards
            const elements = {
                'progress-total': stats.total,
                'progress-mastered': stats.mastered,
                'progress-weak': stats.weak,
                'progress-new': stats.new,
                'progress-average': stats.averageReviews.toFixed(1)
            };
            
            Object.entries(elements).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) element.textContent = value;
            });

            // Render chart
            this.renderProgressChart();
        } catch (error) {
            Logger.error('PROGRESS', 'Failed to render progress page', error);
        }
    },
    
    renderProgressChart() {
        const chartContainer = document.getElementById('progress-chart');
        if (!chartContainer) return;
        
        const last7Days = this.getLast7DaysProgress();
        
        chartContainer.innerHTML = last7Days.map(day => `
            <div class="chart-bar" style="height: ${day.percentage}%" title="${day.date}: ${day.count} مراجعات">
            </div>
        `).join('');
    },
    
    getLast7DaysProgress() {
        const days = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateString = date.toISOString().split('T')[0];
            
            const count = this.state.memorizationData.filter(item => 
                item.lastReviewed === dateString
            ).length;
            
            days.push({
                date: dateString,
                count: count,
                percentage: Math.min((count / 5) * 100, 100)
            });
        }
        
        return days;
    },
    
    // ===================================
    // SETTINGS PAGE FUNCTIONS
    // ===================================
    
    renderSettingsForm() {
        const form = document.getElementById('settings-form');
        if (!form) return;
        
        // Populate form with current settings
        document.getElementById('user-name').value = this.state.settings.userName || '';
        document.getElementById('daily-goal').value = this.state.settings.dailyGoal || 5;
        document.getElementById('notifications').checked = this.state.settings.notifications || false;

        const debugToggle = document.getElementById('debug-mode');
        if (debugToggle) {
            debugToggle.checked = this.state.settings.debugMode || false;
        }
    },
    
    setupForms() {
        // Settings form
        const settingsForm = document.getElementById('settings-form');
        if (settingsForm) {
            settingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveSettings();
            });
        }
    },
    
    saveSettings() {
        this.state.settings = {
            userName: document.getElementById('user-name').value,
            dailyGoal: parseInt(document.getElementById('daily-goal').value),
            theme: this.state.settings.theme,
            notifications: document.getElementById('notifications').checked,
            debugMode: document.getElementById('debug-mode')?.checked || false
        };
        
        // Apply debug mode
        Logger.debugMode = this.state.settings.debugMode;

        this.saveData();
        this.showNotification('تم حفظ الإعدادات', 'success');
    },
    
    // ===================================
    // UTILITY FUNCTIONS
    // ===================================

    showLoading() {
        const overlay = document.querySelector('.loading-overlay');
        if (overlay) overlay.style.display = 'flex';
    },

    hideLoading() {
        const overlay = document.querySelector('.loading-overlay');
        if (overlay) overlay.style.display = 'none';
    },

    escapeHtml(text) {
        if (!text) return '';
        return String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },

    async fetchAyahText(surahId, ayahNumber) {
        try {
            const response = await fetch(`https://api.quran.com/api/v4/verses/by_key/${surahId}:${ayahNumber}?fields=text_uthmani`);
            const data = await response.json();
            if (data.verse && data.verse.text_uthmani) {
                return data.verse.text_uthmani;
            }
            throw new Error('Verse text not found');
        } catch (error) {
            console.error('Error fetching ayah text:', error);
            return null;
        }
    },
    
    calculateStats() {
        const total = this.state.memorizationData.length;
        const mastered = this.state.memorizationData.filter(item => item.status === 'mastered').length;
        const weak = this.state.memorizationData.filter(item => item.status === 'weak').length;
        const newMemorization = this.state.memorizationData.filter(item => item.status === 'new').length;
        
        const totalReviews = this.state.memorizationData.reduce((sum, item) => sum + (item.reviewCount || 0), 0);
        const averageReviews = total > 0 ? totalReviews / total : 0;
        
        return {
            total,
            mastered,
            weak,
            new: newMemorization,
            averageReviews
        };
    },
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#17a2b8'};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 1000;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            animation: slideDown 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    },
    
    setupAutoSave() {
        // Auto-save every 30 seconds
        setInterval(() => {
            this.saveData();
        }, 30000);
        
        // Save before page unload
        window.addEventListener('beforeunload', () => {
            this.saveData();
        });
    },
    
    // ===================================
    // DATA MANAGEMENT FUNCTIONS
    // ===================================
    
    exportData() {
        try {
            const data = {
                version: this.config.version,
                exportDate: new Date().toISOString(),
                settings: this.state.settings,
                memorizationData: this.state.memorizationData
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `quranreview-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showNotification('تم تصدير البيانات بنجاح', 'success');
        } catch (error) {
            console.error('❌ Error exporting data:', error);
            this.showNotification('خطأ في تصدير البيانات', 'error');
        }
    },
    
    importData() {
        try {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const data = JSON.parse(event.target.result);
                        
                        // Validate data structure
                        if (!data.memorizationData || !Array.isArray(data.memorizationData)) {
                            throw new Error('Invalid data structure');
                        }
                        
                        // Backup current data
                        const backup = { ...this.state };
                        
                        // Import new data
                        this.state.memorizationData = data.memorizationData || [];
                        this.state.settings = { ...this.config.defaultSettings, ...data.settings };
                        
                        // Save imported data
                        this.saveData();
                        
                        // Refresh UI
                        this.renderPage(this.state.currentPage);
                        
                        this.showNotification('تم استيراد البيانات بنجاح', 'success');
                    } catch (error) {
                        console.error('❌ Error parsing imported data:', error);
                        this.showNotification('ملف غير صالح. يرجى التحقق من البيانات', 'error');
                    }
                };
                
                reader.readAsText(file);
            };
            
            input.click();
        } catch (error) {
            console.error('❌ Error importing data:', error);
            this.showNotification('خطأ في استيراد البيانات', 'error');
        }
    },
    
    clearData() {
        if (!confirm('هل أنت متأكد من مسح جميع البيانات؟ هذا الإجراء لا يمكن التراجع عنه.')) return;
        
        try {
            // Clear LocalStorage
            localStorage.removeItem(this.config.storageKey);
            localStorage.removeItem(this.config.themeKey);
            
            // Reset to defaults
            this.state.memorizationData = this.getDefaultMemorizationData();
            this.state.settings = { ...this.config.defaultSettings };
            
            // Refresh UI
            this.renderPage(this.state.currentPage);
            
            this.showNotification('تم مسح جميع البيانات', 'info');
        } catch (error) {
            console.error('❌ Error clearing data:', error);
            this.showNotification('خطأ في مسح البيانات', 'error');
        }
    },
    
    // ===================================
    // WARD PLAYER FUNCTIONS
    // ===================================
    
    initWardPlayer() {
        console.log('🎧 Initializing Ward Player...');
        
        const playWardBtn = document.getElementById('play-ward-btn');
        const playSurahBtn = document.getElementById('play-surah-btn');
        const stopWardBtn = document.getElementById('stop-ward-btn');
        
        console.log('🔍 DEBUG: Elements found:', {
            playWardBtn: !!playWardBtn,
            playSurahBtn: !!playSurahBtn,
            stopWardBtn: !!stopWardBtn
        });
        
        if (playWardBtn) {
            playWardBtn.addEventListener('click', () => {
                console.log('🎵 DEBUG: Play Ward button clicked!');
                this.playWard();
            });
            console.log('✅ DEBUG: Play Ward button event attached');
        } else {
            console.info('ℹ️ DEBUG: Play Ward button not found on current view');
        }
        
        if (playSurahBtn) {
            playSurahBtn.addEventListener('click', () => {
                console.log('🎵 DEBUG: Play Surah button clicked!');
                this.playFullSurah();
            });
            console.log('✅ DEBUG: Play Surah button event attached');
        } else {
            console.info('ℹ️ DEBUG: Play Surah button not found on current view');
        }
        
        // Stop button
        const stopBtn = document.getElementById('stop-ward-btn');
        if (stopBtn) {
            stopBtn.addEventListener('click', () => {
                this.stopWardPlayback();
            });
            console.log('✅ DEBUG: Stop Ward button event attached');
        }
        
        // Navigation buttons
        const prevBtn = document.getElementById('prev-ayah-btn');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.playPreviousAyah();
            });
            console.log('✅ DEBUG: Previous Ayah button event attached');
        }
        
        const nextBtn = document.getElementById('next-ayah-btn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.playNextAyahManually();
            });
            console.log('✅ DEBUG: Next Ayah button event attached');
        }
        
        // Initialize ward player state
        this.state.wardPlayer = {
            isPlaying: false,
            currentAyah: 1,
            totalAyahs: 0,
            mode: 'ward', // 'ward' or 'surah'
            surahId: null,
            fromAyah: null,
            toAyah: null
        };
        
        console.log('✅ Ward player initialized successfully');
    },
    
    showWardPlayer() {
        const wardPlayer = document.getElementById('ward-player');
        if (wardPlayer) {
            wardPlayer.style.display = 'block';
        }
    },
    
    hideWardPlayer() {
        const wardPlayer = document.getElementById('ward-player');
        if (wardPlayer) {
            wardPlayer.style.display = 'none';
        }
    },
    
    playWard() {
        console.log('🎵 Starting Ward playback - using AudioManager...');
        
        const surahSelect = document.getElementById('ward-surah-select');
        const fromAyahInput = document.getElementById('ward-from-ayah');
        const toAyahInput = document.getElementById('ward-to-ayah');
        
        if (!surahSelect || !fromAyahInput || !toAyahInput) return;
        
        const surahId = parseInt(surahSelect.value);
        const fromAyah = parseInt(fromAyahInput.value);
        const toAyah = parseInt(toAyahInput.value);
        
        if (!surahId || !fromAyah || !toAyah) {
            this.showNotification('يرجى اختيار السورة والآيات', 'warning');
            return;
        }
        
        // VALIDATION: fromAyah must be <= toAyah
        if (fromAyah > toAyah) {
            this.showNotification('❌ خطأ: من الآية يجب أن يكون أصغر أو يساوي إلى الآية', 'error');
            console.error(`❌ Invalid ayah range: from ${fromAyah} > to ${toAyah}`);
            return;
        }
        
        const surah = this.config.surahs.find(s => s.id === surahId);
        if (!surah) return;
        
        // Additional validation: check against surah ayah count
        if (fromAyah < 1 || toAyah > surah.ayahs) {
            this.showNotification(`❌ خطأ: الآيات يجب أن تكون بين 1 و ${surah.ayahs}`, 'error');
            console.error(`❌ Invalid ayah range: ${fromAyah}-${toAyah} for surah ${surahId} (max: ${surah.ayahs})`);
            return;
        }
        
        console.log(`✅ Valid ayah range: ${fromAyah}-${toAyah} for surah ${surah.name}`);
        
        // Setup ward player state for display
        this.state.wardPlayer = {
            isPlaying: true,
            currentAyah: fromAyah,
            totalAyahs: toAyah - fromAyah + 1,
            mode: 'ward',
            surahId: surahId,
            fromAyah: fromAyah,
            toAyah: toAyah
        };
        
        // Update display
        this.updateWardDisplay();
        
        // Use AudioManager to play
        AudioManager.playWirdAyahSequence(surahId, fromAyah, toAyah);
        
        this.showNotification(`🎧 جاري تشغيل ورد ${surah.name} (${fromAyah}-${toAyah})`, 'success');
        console.log('✅ Ward playback started successfully via AudioManager');
    },
    
    playFullSurah() {
        console.log('📖 Starting Full Surah playback - using CDN ayah by ayah for image sync...');
        
        const surahSelect = document.getElementById('ward-surah-select');
        
        if (!surahSelect) return;
        
        const surahId = parseInt(surahSelect.value);
        if (!surahId) {
            this.showNotification('يرجى اختيار السورة', 'warning');
            return;
        }
        
        const surah = this.config.surahs.find(s => s.id === surahId);
        if (!surah) return;
        
        // TOUJOURS utiliser CDN ayah par ayah pour la synchronisation des images
        // Même si source audio est "local", on utilise CDN pour les images synchronisées
        
        // Setup ward player state for full surah
        this.state.wardPlayer = {
            isPlaying: true,
            currentAyah: 1,
            totalAyahs: surah.ayahs,
            mode: 'surah', // Toujours 'surah' pour ayah par ayah
            surahId: surahId,
            fromAyah: 1,
            toAyah: surah.ayahs
        };
        
        // Update display
        this.updateWardDisplay();
        this.updateWardAyahDisplay(surahId, 1);
        
        // TOUJOURS utiliser AudioManager avec CDN pour synchronisation images
        AudioManager.playWirdAyahSequence(surahId, 1, surah.ayahs);
        
        this.showNotification(`📖 جاري تشغيل سورة ${surah.name} كاملة (مع مزامنة الصور)`, 'success');
        console.log('✅ Full Surah playback started with CDN for image sync');
    },
    
    playLocalSurah(surahId, surah) {
        // Format surah ID as 3-digit number (001, 002, etc.)
        const surahNumber = surahId.toString().padStart(3, '0');
        const audioUrl = `audio/${surahNumber}.mp3`;
        
        console.log(`🎵 Playing local surah: ${audioUrl}`);
        
        // Setup ward player state for full surah
        this.state.wardPlayer = {
            isPlaying: true,
            currentAyah: 1,
            totalAyahs: surah.ayahs,
            mode: 'surah-local',
            surahId: surahId,
            fromAyah: 1,
            toAyah: surah.ayahs
        };
        
        // Create audio element for full surah
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
            console.log('✅ Full surah finished playing');
            this.stopWardPlayback();
            this.showNotification('تم الانتهاء من تشغيل السورة', 'success');
        };
        
        audio.onerror = () => {
            console.error('❌ Error playing local surah:', audioUrl);
            this.showNotification('خطأ في تشغيل السورة المحلية', 'error');
            // Fallback to CDN
            this.playFullSurahAyahByAyah(surahId, surah);
        };
        
        // Update display
        this.updateWardDisplay();
        this.updateWardAyahDisplay(surahId, 1);
        
        // Play audio
        audio.play().catch(error => {
            console.error('❌ Error playing local audio:', error);
            this.showNotification('خطأ في تشغيل السورة المحلية', 'error');
            // Fallback to CDN
            this.playFullSurahAyahByAyah(surahId, surah);
        });
        
        this.showNotification(`📖 جاري تشغيل سورة ${surah.name} كاملة (ملف محلي)`, 'success');
    },
    
    playFullSurahAyahByAyah(surahId, surah) {
        // Setup ward player state for full surah
        this.state.wardPlayer = {
            isPlaying: true,
            currentAyah: 1,
            totalAyahs: surah.ayahs,
            mode: 'surah',
            surahId: surahId,
            fromAyah: 1,
            toAyah: surah.ayahs
        };
        
        // Show and update ward player
        this.updateWardDisplay();
        this.playCurrentWardAyah();
        
        this.showNotification(`📖 جاري تشغيل سورة ${surah.name} كاملة (CDN)`, 'success');
        console.log('✅ Full Surah playback started successfully');
    },
    
    playCurrentWardAyah() {
        if (!this.state.wardPlayer.isPlaying) return;
        
        const { surahId, currentAyah } = this.state.wardPlayer;
        
        if (!window.QuranAudio) return;
        
        // Get global ayah number
        const globalAyahNumber = QuranAudio.surahAyahToGlobal(surahId, currentAyah);
        const audioUrl = QuranAudio.getAyahAudioUrl(globalAyahNumber);
        const surah = this.config.surahs.find(s => s.id === surahId);
        
        console.log(`🎵 Playing ayah ${currentAyah} of surah ${surahId} (${globalAyahNumber})`);
        
        // Create audio element for this ayah
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
            console.log(`✅ Ayah ${currentAyah} finished playing`);
            
            // Check if auto-play next is enabled
            if (this.state.settings.autoPlayNext && this.state.wardPlayer.isPlaying) {
                console.log('🔄 Auto-playing next ayah...');
                
                // Add delay before playing next ayah
                const delay = (this.state.settings.ayahDelay || 2.0) * 1000; // Convert to milliseconds
                setTimeout(() => {
                    this.playNextWardAyah();
                }, delay);
            } else {
                console.log('⏹️ Auto-play next is disabled or playback stopped');
                this.playNextWardAyah();
            }
        };
        
        audio.onerror = () => {
            console.error('❌ Error playing ayah audio:', currentAyah);
            this.playNextWardAyah();
        };
        
        // Update display
        this.updateWardAyahDisplay(surahId, currentAyah);
        
        // Play audio
        audio.play().catch(error => {
            console.error('❌ Error playing audio:', error);
            this.playNextWardAyah();
        });
        
        console.log(`🎵 Playing ayah ${currentAyah} of surah ${surahId}`);
    },
    
    playNextWardAyah() {
        const { currentAyah, toAyah } = this.state.wardPlayer;
        
        if (currentAyah < toAyah) {
            this.state.wardPlayer.currentAyah++;
            this.updateWardDisplay();
            this.playCurrentWardAyah();
        } else {
            // Finished playing
            this.stopWardPlayback();
            this.showNotification('تم الانتهاء من تشغيل الورد', 'success');
        }
    },
    
    stopWardPlayback() {
        console.log('⏹️ Stopping Ward playback - using AudioManager...');
        
        // Use AudioManager to stop everything
        AudioManager.stopAll();
        
        // Reset ward player state
        this.state.wardPlayer.isPlaying = false;
        
        // Reset display
        this.updateWardDisplay();
        
        this.showNotification('⏹️ تم إيقاف التشغيل', 'info');
        console.log('✅ Ward playback stopped via AudioManager');
    },
    
    playPreviousAyah() {
        if (!this.state.wardPlayer.surahId || !this.state.wardPlayer.currentAyah) {
            this.showNotification('يرجى تشغيل ورد أولاً', 'warning');
            return;
        }
        
        const { surahId, currentAyah, fromAyah } = this.state.wardPlayer;
        
        if (currentAyah <= fromAyah) {
            this.showNotification('هذه هي أول آية في الورد', 'info');
            return;
        }
        
        const previousAyah = currentAyah - 1;
        
        // Stop current playback
        AudioManager.stopAll();
        
        // Update state
        this.state.wardPlayer.currentAyah = previousAyah;
        this.state.wardPlayer.isPlaying = true;
        
        // Play previous ayah
        AudioManager.playWirdAyahSequence(surahId, previousAyah, previousAyah);
        
        this.showNotification(`⏮️ العودة إلى الآية ${previousAyah}`, 'success');
    },
    
    playNextAyahManually() {
        if (!this.state.wardPlayer.surahId || !this.state.wardPlayer.currentAyah) {
            this.showNotification('يرجى تشغيل ورد أولاً', 'warning');
            return;
        }
        
        const { surahId, currentAyah, toAyah } = this.state.wardPlayer;
        
        if (currentAyah >= toAyah) {
            this.showNotification('هذه هي آخر آية في الورد', 'info');
            return;
        }
        
        const nextAyah = currentAyah + 1;
        
        // Stop current playback
        AudioManager.stopAll();
        
        // Update state
        this.state.wardPlayer.currentAyah = nextAyah;
        this.state.wardPlayer.isPlaying = true;
        
        // Play next ayah
        AudioManager.playWirdAyahSequence(surahId, nextAyah, nextAyah);
        
        this.showNotification(`⏭️ التقدم إلى الآية ${nextAyah}`, 'success');
    },
    
    updateWardDisplay() {
        const { currentAyah, totalAyahs, isPlaying } = this.state.wardPlayer;
        
        // Update progress
        const progressText = document.getElementById('ward-progress-text');
        const progressBar = document.getElementById('ward-progress-bar');
        const currentAyahInfo = document.getElementById('current-ayah-info');
        
        if (progressText) {
            progressText.textContent = `${currentAyah} / ${totalAyahs}`;
        }
        
        if (progressBar) {
            const progress = (currentAyah - this.state.wardPlayer.fromAyah + 1) / totalAyahs * 100;
            progressBar.style.width = `${progress}%`;
        }
        
        if (currentAyahInfo) {
            const surah = this.config.surahs.find(s => s.id === this.state.wardPlayer.surahId);
            currentAyahInfo.textContent = `الآية الحالية: ${surah?.name || ''} - ${currentAyah}`;
        }
    },
    
    updateWardAyahDisplay(surahId, ayahNumber) {
        const wardImage = document.getElementById('ward-image');
        const wardText = document.getElementById('ward-ayah-text');
        
        if (!window.QuranAudio) return;
        
        const surah = this.config.surahs.find(s => s.id === surahId);
        if (!surah) return;
        
        // Update image
        if (wardImage) {
            const highRes = this.state.imageQuality === 'high';
            const imageUrl = QuranAudio.getAyahImageUrl(surahId, ayahNumber, highRes);
            
            wardImage.src = imageUrl;
            wardImage.style.display = 'block';
            wardImage.onerror = () => {
                wardImage.style.display = 'none';
                if (wardText) {
                    wardText.style.display = 'block';
                }
            };
        }
        
        // Update text
        if (wardText) {
            wardText.textContent = `${surah.name} - الآية ${ayahNumber}`;
            wardText.style.display = wardImage && wardImage.style.display !== 'none' ? 'none' : 'block';
        }
    },
    
    initAudioPlayer() {
        const audioElement = document.getElementById('audio-element');
        const reciterSelector = document.getElementById('reciter-selector');
        
        if (audioElement && reciterSelector) {
            reciterSelector.addEventListener('change', () => {
                this.updateReciter();
            });
            
            audioElement.addEventListener('error', () => {
                this.showNotification('خطأ في تحميل الملف الصوتي', 'error');
            });
            
            console.log('🎵 Audio player initialized');
        }
    },
    
    playSurahAudio(surahNumber) {
        try {
            const audioElement = document.getElementById('audio-element');
            const audioSource = document.getElementById('audio-source');
            const surahNameElement = document.getElementById('audio-surah-name');
            const reciterElement = document.getElementById('audio-reciter');
            
            if (!window.QuranAudio) {
                console.error('❌ QuranAudio not loaded');
                this.showNotification('Configuration audio non chargée', 'error');
                return;
            }
            
            const audioUrl = QuranAudio.getAudioUrl(surahNumber);
            const surahName = QuranAudio.getSurahName(surahNumber);
            const reciterName = QuranAudio.getReciterName();
            
            // Debug: log the URL
            console.log('🎵 Generated URL:', audioUrl);
            console.log('🎵 Surah Number:', surahNumber);
            console.log('🎵 QuranAudio available:', !!window.QuranAudio);
            console.log('🎵 Current reciter:', QuranAudio?.currentReciter);
            console.log('🎵 Audio config loaded:', !!window.QuranAudio);
            
            // Validate URL
            if (!audioUrl || !audioUrl.startsWith('https://')) {
                console.error('❌ Invalid audio URL:', audioUrl);
                this.showNotification('رابط الصوت غير صالح', 'error');
                return;
            }
            
            // Use internal HTML5 audio player
            if (audioElement && audioSource) {
                // Set the audio source
                audioSource.src = audioUrl;
                
                // Update UI
                if (surahNameElement) {
                    surahNameElement.textContent = `سورة ${surahName}`;
                }
                
                if (reciterElement) {
                    reciterElement.textContent = `القارئ: ${reciterName}`;
                }
                
                // Load and play
                audioElement.load();
                audioElement.play()
                    .then(() => {
                        this.showNotification(`جاري تشغيل ${surahName}`, 'success');
                        console.log('🎵 Audio playing successfully');
                    })
                    .catch(error => {
                        console.error('❌ Error playing audio:', error);
                        // Fallback to opening in new tab if autoplay fails
                        window.open(audioUrl, '_blank', 'noopener,noreferrer');
                        this.showNotification(`تم فتح ${surahName} في نافذة جديدة`, 'info');
                    });
            } else {
                // Fallback if audio element not found
                window.open(audioUrl, '_blank', 'noopener,noreferrer');
                this.showNotification(`تم فتح ${surahName} في نافذة جديدة`, 'info');
            }
            
        } catch (error) {
            console.error('❌ Error playing audio:', error);
            this.showNotification('خطأ في تشغيل الصوت', 'error');
        }
    },
    
    updateReciter() {
        const reciterSelector = document.getElementById('reciter-selector');
        
        if (reciterSelector) {
            const selectedReciter = reciterSelector.value;
            
            // Update QuranAudio current reciter
            if (window.QuranAudio) {
                QuranAudio.setReciter(selectedReciter);
                console.log('🎵 Reciter updated to:', selectedReciter);
                this.showNotification(`تم تغيير القارئ إلى: ${QuranAudio.getReciterName(selectedReciter)}`, 'success');
            }
        }
    },
    
    updateAudioQuality() {
        const audioQualitySelector = document.getElementById('audio-quality');
        
        if (audioQualitySelector && window.QuranAudio) {
            const bitrate = parseInt(audioQualitySelector.value);
            if (QuranAudio.setBitrate(bitrate)) {
                this.showNotification(`تم تغيير جودة الصوت إلى: ${bitrate} kbps`, 'success');
            }
        }
    },
    
    updateImageQuality() {
        const imageQualitySelector = document.getElementById('image-quality');
        
        if (imageQualitySelector) {
            const quality = imageQualitySelector.value;
            this.state.imageQuality = quality;
            this.showNotification(`تم تغيير جودة الصور إلى: ${quality === 'high' ? 'عالية الدقة' : 'عادية'}`, 'success');
        }
    },
    
    updateAyahLimits() {
        const surahSelect = document.getElementById('surah-select');
        const fromAyahInput = document.getElementById('from-ayah');
        const toAyahInput = document.getElementById('to-ayah');
        
        if (!surahSelect || !fromAyahInput || !toAyahInput) return;
        
        const surahId = parseInt(surahSelect.value);
        if (!surahId) return;
        
        const surah = this.config.surahs.find(s => s.id === surahId);
        if (!surah) return;
        
        // Update max values
        fromAyahInput.max = surah.ayahs;
        toAyahInput.max = surah.ayahs;
        
        // Update placeholder
        fromAyahInput.placeholder = `من 1 إلى ${surah.ayahs}`;
        toAyahInput.placeholder = `من 1 إلى ${surah.ayahs}`;
        
        // Clear current values if they exceed the limit
        if (parseInt(fromAyahInput.value) > surah.ayahs) {
            fromAyahInput.value = '';
        }
        if (parseInt(toAyahInput.value) > surah.ayahs) {
            toAyahInput.value = '';
        }
        
        console.log(`📊 Updated ayah limits for Surah ${surahId}: 1-${surah.ayahs}`);
    },
    
    populateSurahSelect() {
        const surahSelect = document.getElementById('surah-select');
        if (!surahSelect) return;
        
        // Clear existing options except the first one
        while (surahSelect.children.length > 1) {
            surahSelect.removeChild(surahSelect.lastChild);
        }
        
        // Create a DocumentFragment to batch DOM updates
        const fragment = document.createDocumentFragment();

        // Add all 114 surahs with correct ayah counts
        this.config.surahs.forEach(surah => {
            const option = document.createElement('option');
            option.value = surah.id;
            option.textContent = `${surah.name} (${surah.ayahs} آيات)`;
            fragment.appendChild(option);
        });
        
        // Append the fragment to the select element in a single operation
        surahSelect.appendChild(fragment);

        console.log('📋 Surah select populated with 114 surahs');
    },
    
    // ===================================
    // TARTEEL INTEGRATION
    // ===================================
    
    openTarteel() {
        console.log('🎧 Opening Tarteel app...');
        
        // Try to open Tarteel app with smart link
        const tarteelSmartLink = 'https://tarteel.go.link/?adj_t=1d1pgcav&adj_engagement_type=fallback_click';
        
        // Open in new tab
        window.open(tarteelSmartLink, '_blank', 'noopener,noreferrer');
        
        this.showNotification('🎧 جاري فتح تطبيق ترتيل', 'success');
    },
    
    // ===================================
    // IMPROVED SPACED REPETITION
    // ===================================
    
    shouldReviewToday(item) {
        if (!item.lastReviewed) return true;
        
        const lastReview = new Date(item.lastReviewed);
        const today = new Date();
        const daysSinceReview = Math.floor((today - lastReview) / (1000 * 60 * 60 * 24));
        
        // Enhanced spaced repetition schedule
        const reviewCount = item.reviewCount || 0;
        let requiredDays;
        
        if (reviewCount === 0) {
            requiredDays = 1;  // First review: next day
        } else if (reviewCount === 1) {
            requiredDays = 2;  // Second review: after 2 days
        } else if (reviewCount === 2) {
            requiredDays = 4;  // Third review: after 4 days
        } else if (reviewCount === 3) {
            requiredDays = 7;  // Fourth review: after 1 week
        } else if (reviewCount === 4) {
            requiredDays = 14; // Fifth review: after 2 weeks
        } else if (reviewCount >= 5 && reviewCount <= 7) {
            requiredDays = 21; // Reviews 6-8: after 3 weeks
        } else if (reviewCount >= 8 && reviewCount <= 12) {
            requiredDays = 30; // Reviews 9-13: after 1 month
        } else {
            requiredDays = 45; // Reviews 14+: after 1.5 months
        }
        
        // Weak items need more frequent review
        if (item.status === 'weak') {
            requiredDays = Math.max(1, Math.floor(requiredDays * 0.5));
        }
        
        return daysSinceReview >= requiredDays;
    },
    
    // ===================================
    // IMPROVED MEMORIZATION DATA ORGANIZATION
    // ===================================
    
    getTodayMemorizationData() {
        const today = this.state.todayDate;
        
        // Previously memorized (mastered items for revision)
        const previouslyMemorized = this.state.memorizationData.filter(item => 
            item.status === 'mastered' && !this.shouldReviewToday(item)
        );
        
        // Today's review (items that need review today)
        const todayReview = this.state.memorizationData.filter(item => 
            this.shouldReviewToday(item)
        );
        
        // New memorization (items added today)
        const newMemorization = this.state.memorizationData.filter(item => 
            item.status === 'new' && item.dateAdded === today
        );
        
        return {
            previouslyMemorized,
            todayReview,
            newMemorization
        };
    },

    // ===================================
    // STUDENT DASHBOARD
    // ===================================

    async loadStudentDashboard() {
        const token = localStorage.getItem(this.config.apiTokenKey);
        if (!token) {
            this.showAuthModal();
            return;
        }

        // Block teachers from accessing student page
        if (this.state.user && this.state.user.role === 'teacher') {
            this.navigateTo('teacher');
            return;
        }

        const headers = { Authorization: `Bearer ${token}` };

        // Update welcome message
        if (this.state.user) {
            const el = document.getElementById('student-welcome');
            if (el) el.textContent = `مرحباً ${this.state.user.first_name || this.state.user.username}`;
        }

        try {
            const [tasksRes, subsRes, pointsRes] = await Promise.all([
                fetch(`${this.config.apiBaseUrl}/api/tasks/`, { headers }),
                fetch(`${this.config.apiBaseUrl}/api/my-submissions/`, { headers }),
                fetch(`${this.config.apiBaseUrl}/api/points/`, { headers }),
            ]);

            const tasks = tasksRes.ok ? await tasksRes.json() : [];
            const submissions = subsRes.ok ? await subsRes.json() : [];
            const pointsData = pointsRes.ok ? await pointsRes.json() : { total_points: 0, logs: [] };

            // Build submission lookup by task id
            const subByTask = {};
            submissions.forEach(s => { subByTask[s.task.id] = s; });

            const done = submissions.filter(s => s.status === 'approved').length;
            const rejected = submissions.filter(s => s.status === 'rejected').length;
            const pending = tasks.length - done;

            // Stats
            document.getElementById('student-points').textContent = pointsData.total_points || 0;
            document.getElementById('student-tasks-done').textContent = done;
            document.getElementById('student-tasks-pending').textContent = pending > 0 ? pending : 0;
            document.getElementById('student-tasks-rejected').textContent = rejected;

            // Points log
            const pointsLogEl = document.getElementById('student-points-log');
            const logs = pointsData.logs || [];
            if (!logs.length) {
                pointsLogEl.innerHTML = '<p class="empty-state">لا توجد نقاط بعد</p>';
            } else {
                pointsLogEl.innerHTML = logs.slice(0, 10).map(log => {
                    const date = new Date(log.created_at).toLocaleDateString('ar-SA');
                    const sign = log.delta > 0 ? '+' : '';
                    const cls = log.delta > 0 ? 'points-positive' : 'points-negative';
                    return `<div class="points-log-item">
                        <span class="points-log-reason">${log.reason}</span>
                        <span class="points-log-delta ${cls}">${sign}${log.delta}</span>
                        <span class="points-log-date">${date}</span>
                    </div>`;
                }).join('');
            }

            // Tasks list
            const tasksList = document.getElementById('student-tasks-list');
            if (!tasks.length) {
                tasksList.innerHTML = '<p class="empty-state">لا توجد مهام حالياً</p>';
            } else {
                tasksList.innerHTML = tasks.map(task => {
                    const sub = subByTask[task.id];
                    let statusBadge = '<span class="status-badge status-new">لم يُسلَّم</span>';
                    let actionBtn = `<button class="btn btn-primary btn-sm" onclick="QuranReview.openRecordModal(${task.id}, '${task.title.replace(/'/g, "\\'")}')">🎤 تسجيل</button>`;

                    if (sub) {
                        if (sub.status === 'approved') {
                            statusBadge = '<span class="status-badge status-approved">مقبول ✓</span>';
                            actionBtn = '';
                        } else if (sub.status === 'rejected') {
                            statusBadge = '<span class="status-badge status-rejected">مرفوض ✗</span>';
                            actionBtn = `<button class="btn btn-primary btn-sm" onclick="QuranReview.openRecordModal(${task.id}, '${task.title.replace(/'/g, "\\'")}')">🎤 إعادة التسجيل</button>`;
                        } else {
                            statusBadge = '<span class="status-badge status-pending">بانتظار التصحيح</span>';
                            actionBtn = '';
                        }
                    }

                    const typeLabel = task.task_type === 'memorization' ? 'حفظ' : task.task_type === 'recitation' ? 'تلاوة' : 'أخرى';
                    const dueDate = task.due_date ? new Date(task.due_date).toLocaleDateString('ar-SA') : '';

                    return `<div class="task-card">
                        <div class="task-card-header">
                            <h3 class="task-card-title">${task.title}</h3>
                            ${statusBadge}
                        </div>
                        ${task.description ? `<p class="task-card-desc">${task.description}</p>` : ''}
                        <div class="task-card-meta">
                            <span class="task-type-badge">${typeLabel}</span>
                            <span class="task-points-badge">🏆 ${task.points} نقطة</span>
                            ${dueDate ? `<span class="task-due-date">📅 ${dueDate}</span>` : ''}
                        </div>
                        ${sub && sub.status === 'rejected' && sub.admin_feedback ? `<div class="task-feedback">💬 ${sub.admin_feedback}</div>` : ''}
                        <div class="task-card-actions">${actionBtn}</div>
                    </div>`;
                }).join('');
            }

            // Submissions list
            const subsList = document.getElementById('student-submissions-list');
            if (!submissions.length) {
                subsList.innerHTML = '<p class="empty-state">لا توجد تسليمات بعد</p>';
            } else {
                subsList.innerHTML = submissions.map(s => {
                    const statusClass = s.status === 'approved' ? 'status-approved' : s.status === 'rejected' ? 'status-rejected' : 'status-pending';
                    const statusText = s.status === 'approved' ? 'مقبول ✓' : s.status === 'rejected' ? 'مرفوض ✗' : 'بانتظار التصحيح';
                    const date = new Date(s.submitted_at).toLocaleDateString('ar-SA');
                    return `<div class="submission-card">
                        <div class="submission-card-header">
                            <span>${s.task.title}</span>
                            <span class="status-badge ${statusClass}">${statusText}</span>
                        </div>
                        <div class="submission-card-meta">📅 ${date}</div>
                        ${s.admin_feedback ? `<div class="task-feedback">💬 ${s.admin_feedback}</div>` : ''}
                        ${s.audio_url ? `
                            <div class="audio-player-container">
                                <audio controls preload="metadata" style="width:100%;margin-top:0.5rem;"
                                    onerror="this.parentElement.innerHTML='<p style=\\'color:#999;font-size:0.85rem;\\'>الملف الصوتي غير متاح حاليا</p>'">
                                    <source src="${s.audio_url.startsWith('http') ? s.audio_url : this.config.apiBaseUrl + (s.audio_url.startsWith('/') ? s.audio_url : '/' + s.audio_url)}" type="audio/webm">
                                    المتصفح لا يدعم تشغيل الصوت
                                </audio>
                                <div style="font-size:0.8rem;color:#666;margin-top:0.25rem;">
                                    📎 <a href="${s.audio_url.startsWith('http') ? s.audio_url : this.config.apiBaseUrl + (s.audio_url.startsWith('/') ? s.audio_url : '/' + s.audio_url)}" target="_blank" style="color:#007bff;">فتح الملف الصوتي</a>
                                </div>
                            </div>
                        ` : ''}
                    </div>`;
                }).join('');
            }
        } catch (error) {
            console.error('Failed to load student dashboard:', error);
            this.showNotification('خطأ في تحميل البيانات', 'error');
        }
    },

    // ===================================
    // TEACHER DASHBOARD
    // ===================================

    async loadTeacherDashboard() {
        const token = localStorage.getItem(this.config.apiTokenKey);
        if (!token) {
            this.showAuthModal();
            return;
        }

        // Block students from accessing teacher page
        if (this.state.user && this.state.user.role !== 'teacher' && !this.state.user.is_staff) {
            this.navigateTo('mytasks');
            return;
        }

        const headers = { Authorization: `Bearer ${token}` };

        // Update welcome message
        if (this.state.user) {
            const el = document.getElementById('teacher-welcome');
            if (el) el.textContent = `مرحباً أستاذ ${this.state.user.first_name || this.state.user.username}`;
        }

        // Show admin tab only for superusers
        const adminTab = document.querySelector('.admin-only-tab');
        if (adminTab) {
            const isAdmin = this.state.user && this.state.user.is_superuser;
            adminTab.style.display = isAdmin ? 'inline-block' : 'none';
        }

        // Load admin users list if admin tab is visible
        if (this.state.user && this.state.user.is_superuser) {
            // Call without await to prevent blocking dashboard
            this.loadAdminUsersList();
        }

        this.showLoading();

        try {
            const [studentsRes, pendingRes, tasksRes] = await Promise.all([
                fetch(`${this.config.apiBaseUrl}/api/my-students/`, { headers }),
                fetch(`${this.config.apiBaseUrl}/api/pending-submissions/`, { headers }),
                fetch(`${this.config.apiBaseUrl}/api/tasks/`, { headers }),
            ]);

            const students = studentsRes.ok ? await studentsRes.json() : [];
            const pending = pendingRes.ok ? await pendingRes.json() : [];
            const tasks = tasksRes.ok ? await tasksRes.json() : [];

            // Store for later use
            this._teacherStudents = students;
            this._teacherTasks = tasks;

            // Load student checkboxes for task creation
            this.loadStudentCheckboxes(students);

            // Stats
            document.getElementById('teacher-total-students').textContent = students.length;
            document.getElementById('teacher-pending').textContent = pending.length;
            document.getElementById('teacher-tasks').textContent = tasks.length;
            const approvedEl = document.getElementById('teacher-approved');
            if (approvedEl) approvedEl.textContent = tasks.reduce((sum, t) => sum, 0);

            // Pending submissions
            const pendingList = document.getElementById('teacher-pending-list');
            if (!pending.length) {
                pendingList.innerHTML = '<p class="empty-state">لا توجد تسليمات بانتظار التصحيح 🎉</p>';
            } else {
                pendingList.innerHTML = pending.map(s => {
                    const date = new Date(s.submitted_at).toLocaleDateString('ar-SA');
                    return `<div class="pending-card">
                        <div class="pending-card-header">
                            <strong>🎓 ${s.student_name}</strong>
                            <span class="task-type-badge">${s.task.title}</span>
                        </div>
                        <div class="pending-card-meta">
                            <span>🏆 ${s.task.points} نقطة</span>
                            <span>📅 ${date}</span>
                        </div>
                        ${s.audio_url ? `
                            <div class="audio-player-container">
                                <audio controls preload="metadata" style="width:100%;margin:0.5rem 0;"
                                    onerror="this.parentElement.innerHTML='<p style=\\'color:#999;font-size:0.85rem;\\'>الملف الصوتي غير متاح حاليا</p>'">
                                    <source src="${s.audio_url.startsWith('http') ? s.audio_url : this.config.apiBaseUrl + (s.audio_url.startsWith('/') ? s.audio_url : '/' + s.audio_url)}" type="audio/webm">
                                    المتصفح لا يدعم تشغيل الصوت
                                </audio>
                                <div style="font-size:0.8rem;color:#666;margin-top:0.25rem;">
                                    📎 <a href="${s.audio_url.startsWith('http') ? s.audio_url : this.config.apiBaseUrl + (s.audio_url.startsWith('/') ? s.audio_url : '/' + s.audio_url)}" target="_blank" style="color:#007bff;">فتح الملف الصوتي</a>
                                </div>
                            </div>
                        ` : '<p class="empty-state">لا يوجد ملف صوتي</p>'}
                        <div class="pending-card-actions">
                            <button class="btn btn-success btn-sm" onclick="QuranReview.approveSubmission(${s.id})">✓ قبول</button>
                            <button class="btn btn-danger btn-sm" onclick="QuranReview.rejectSubmissionPrompt(${s.id})">✗ رفض</button>
                        </div>
                    </div>`;
                }).join('');
            }

            // Students list with click to see detail
            const studentsList = document.getElementById('teacher-students-list');
            if (!students.length) {
                studentsList.innerHTML = '<p class="empty-state">لا يوجد طلاب بعد</p>';
            } else {
            studentsList.innerHTML = students.map(s => {
                    const safeName = this.escapeHtml(s.first_name || s.username);
                    const safeNameAttr = (s.first_name || s.username).replace(/['"\\]/g, '');
                    return `<div class="student-card clickable" onclick="QuranReview.viewStudentProgress(${s.id}, '${safeNameAttr}')">
                        <div class="student-card-name">🎓 ${safeName}</div>
                        <div class="student-card-stats">
                            <span>🏆 ${this.escapeHtml(String(s.total_points))} نقطة</span>
                            <span>📝 ${this.escapeHtml(String(s.submissions_count))} تسليم</span>
                        </div>
                        <span class="student-card-arrow">←</span>
                    </div>`;
                }).join('');
            }

            // Tasks list
            const taskListEl = document.getElementById('teacher-tasks-list');

            // Add Delete All button header
            const headerHtml = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h3>📋 قائمة المهام</h3>
                    <button class="btn btn-danger btn-sm" onclick="QuranReview.handleDeleteAllTasks()" style="background-color: #dc3545;">
                        🗑️ حذف جميع المهام
                    </button>
                </div>
            `;

            if (!tasks.length) {
                taskListEl.innerHTML = headerHtml + '<p class="empty-state">لا توجد مهام بعد</p>';
            } else {
                taskListEl.innerHTML = headerHtml + tasks.map(task => {
                    const typeLabel = task.task_type === 'memorization' ? 'حفظ' : task.task_type === 'recitation' ? 'تلاوة' : 'أخرى';
                    const dueDate = task.due_date ? new Date(task.due_date).toLocaleDateString('ar-SA') : '';
                    const date = new Date(task.created_at).toLocaleDateString('ar-SA');
                    return `<div class="task-card">
                        <div class="task-card-header">
                            <h3 class="task-card-title">${task.title}</h3>
                            <span class="task-type-badge">${typeLabel}</span>
                        </div>
                        ${task.description ? `<p class="task-card-desc">${task.description}</p>` : ''}
                        <div class="task-card-meta">
                            <span>🏆 ${task.points} نقطة</span>
                            <span>📅 أُنشئت: ${date}</span>
                            ${dueDate ? `<span>⏰ تسليم: ${dueDate}</span>` : ''}
                        </div>
                    </div>`;
                }).join('');
            }
        } catch (error) {
            console.error('Failed to load teacher dashboard:', error);
            this.showNotification('خطأ في تحميل البيانات', 'error');
        } finally {
            this.hideLoading();
        }
    },

    async viewStudentProgress(studentId, studentName) {
        const token = localStorage.getItem(this.config.apiTokenKey);
        if (!token) return;

        const panel = document.getElementById('student-detail-panel');
        const nameEl = document.getElementById('student-detail-name');
        const contentEl = document.getElementById('student-detail-content');

        nameEl.textContent = `📊 تقدم الطالب: ${studentName}`;
        contentEl.innerHTML = '<p class="empty-state">جاري التحميل...</p>';
        panel.classList.remove('hidden');

        try {
            const response = await fetch(`${this.config.apiBaseUrl}/api/students/${studentId}/progress/`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) throw new Error('فشل تحميل بيانات الطالب');

            const data = await response.json();

            let html = `<div class="student-detail-stats">
                <div class="stat-mini"><strong>🏆</strong> ${data.student.total_points} نقطة</div>
            </div>`;

            if (!data.tasks.length) {
                html += '<p class="empty-state">لا توجد مهام معينة</p>';
            } else {
                html += '<div class="student-tasks-progress">';
                data.tasks.forEach(task => {
                    const typeLabel = task.task_type === 'memorization' ? 'حفظ' : task.task_type === 'recitation' ? 'تلاوة' : 'أخرى';
                    let statusBadge = '';
                    if (task.submission_status === 'approved') {
                        statusBadge = '<span class="status-badge status-approved">مقبول ✓</span>';
                    } else if (task.submission_status === 'rejected') {
                        statusBadge = '<span class="status-badge status-rejected">مرفوض ✗</span>';
                    } else if (task.submission_status === 'submitted') {
                        statusBadge = '<span class="status-badge status-pending">بانتظار التصحيح</span>';
                    } else {
                        statusBadge = '<span class="status-badge status-new">لم يُسلَّم</span>';
                    }

                    html += `<div class="student-task-row">
                        <div class="student-task-info">
                            <span class="task-type-badge">${typeLabel}</span>
                            <strong>${task.title}</strong>
                            <span>🏆 ${task.points}</span>
                        </div>
                        ${statusBadge}
                    </div>`;
                });
                html += '</div>';
            }

            contentEl.innerHTML = html;
        } catch (error) {
            contentEl.innerHTML = `<p class="empty-state">${error.message}</p>`;
        }
    },

    loadStudentCheckboxes(students) {
        const container = document.getElementById('student-checkboxes');
        if (!container) return;

        if (!students.length) {
            container.innerHTML = '<p class="empty-state">لا يوجد طلاب</p>';
            return;
        }

        const checkboxes = students.map(student => `
            <label class="student-checkbox-label">
                <input type="checkbox" name="student-ids" value="${student.id}">
                <span class="student-name">${student.first_name || student.username}</span>
            </label>
        `).join('');

        container.innerHTML = checkboxes;
    },

    toggleAssignMode(mode) {
        const container = document.getElementById('student-select-container');
        if (mode === 'select') {
            container.classList.remove('hidden');
        } else {
            container.classList.add('hidden');
        }
    },

    async handleDeleteAllTasks() {
        if (!confirm('⚠️ تحذير خطير!\nهل أنت متأكد تماماً أنك تريد حذف جميع المهام؟\nهذا الإجراء سيحذف كل المهام وكل التسليمات المرتبطة بها ولا يمكن التراجع عنه.')) {
            return;
        }

        const token = localStorage.getItem(this.config.apiTokenKey);
        if (!token) return;

        try {
            const response = await fetch(`${this.config.apiBaseUrl}/api/admin/tasks/delete-all/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'خطأ في حذف المهام');
            }

            const result = await response.json();
            this.showNotification(result.detail, 'success');
            this.loadTeacherDashboard();
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    },

    async handleCreateTask(event) {
        event.preventDefault();
        const token = localStorage.getItem(this.config.apiTokenKey);
        if (!token) return;

        const assignMode = document.querySelector('input[name="assign-mode"]:checked')?.value || 'all';
        const studentIds = [];
        if (assignMode === 'select') {
            document.querySelectorAll('input[name="student-ids"]:checked').forEach(cb => {
                studentIds.push(parseInt(cb.value));
            });
            if (!studentIds.length) {
                this.showNotification('يرجى اختيار طالب واحد على الأقل', 'error');
                return;
            }
        }

        const body = {
            title: document.getElementById('task-title').value.trim(),
            description: document.getElementById('task-description').value.trim(),
            task_type: document.getElementById('task-type').value,
            points: parseInt(document.getElementById('task-points').value) || 0,
            due_date: document.getElementById('task-due-date').value || null,
            assign_all: assignMode === 'all',
            student_ids: studentIds,
        };

        try {
            const response = await fetch(`${this.config.apiBaseUrl}/api/tasks/create/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'خطأ في إنشاء المهمة');
            }

            this.showNotification('تم إنشاء المهمة بنجاح!', 'success');
            document.getElementById('teacher-create-task-form').reset();
            document.getElementById('student-select-container')?.classList.add('hidden');
            this.switchTeacherTab('pending');
            this.loadTeacherDashboard();
            // Also refresh tasks list to ensure sync
            this._teacherTasks = null; // Force refresh
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    },

    async approveSubmission(submissionId) {
        const token = localStorage.getItem(this.config.apiTokenKey);
        if (!token) return;

        try {
            const response = await fetch(`${this.config.apiBaseUrl}/api/submissions/${submissionId}/approve/`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) throw new Error('فشل القبول');
            this.showNotification('تم قبول التسليم!', 'success');
            this.loadTeacherDashboard();
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    },

    rejectSubmissionPrompt(submissionId) {
        const feedback = prompt('سبب الرفض (اختياري):');
        if (feedback === null) return; // user cancelled
        this.rejectSubmission(submissionId, feedback);
    },

    async rejectSubmission(submissionId, feedback) {
        const token = localStorage.getItem(this.config.apiTokenKey);
        if (!token) return;

        try {
            const response = await fetch(`${this.config.apiBaseUrl}/api/submissions/${submissionId}/reject/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ admin_feedback: feedback || '' }),
            });

            if (!response.ok) throw new Error('فشل الرفض');
            this.showNotification('تم رفض التسليم', 'success');
            this.loadTeacherDashboard();
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    },

    // ===================================
    // ADMIN - LOAD USERS LIST
    // ===================================

    async loadAdminUsersList() {
        const token = localStorage.getItem(this.config.apiTokenKey);
        if (!token) return;

        try {
            const response = await fetch(`${this.config.apiBaseUrl}/api/admin/users/`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error('فشل تحميل قائمة المستخدمين');

            const data = await response.json();
            this.renderAdminUsersList(data.users);
        } catch (error) {
            Logger.error('ADMIN', 'Failed to load users list', error);
            const usersListEl = document.getElementById('admin-users-list');
            if (usersListEl) {
                usersListEl.innerHTML = '<p class="empty-state">فشل تحميل القائمة</p>';
            }
        }
    },

    renderAdminUsersList(users) {
        const usersListEl = document.getElementById('admin-users-list');
        if (!usersListEl) return;

        if (users.length === 0) {
            usersListEl.innerHTML = '<p class="empty-state">لا يوجد مستخدمون</p>';
            return;
        }

        let html = '';
        users.forEach(user => {
            const roleClass = user.is_superuser ? 'admin' : user.role;
            const roleText = user.is_superuser ? 'مدير' : (user.role === 'teacher' ? 'أستاذ' : 'طالب');
            const roleBadge = `<span class="user-badge ${roleClass}">${roleText}</span>`;
            
            html += `
                <div class="dashboard-item">
                    <div class="item-info">
                        <div class="item-title">${user.username}${roleBadge}</div>
                        <div class="item-subtitle">
                            ${user.first_name} ${user.last_name} • 
                            ${new Date(user.date_joined).toLocaleDateString('ar-SA')}
                        </div>
                    </div>
                    <div class="item-actions">
                        <button class="btn btn-sm btn-secondary" onclick="QuranReview.openUserEditModal(${user.id}, '${user.username}', '${user.first_name}', '${user.last_name}', '${user.role}', ${user.is_superuser})">✏️ تعديل</button>
                        ${user.id !== this.state.user?.id ? `<button class="btn btn-sm btn-danger" onclick="QuranReview.deleteUser(${user.id}, '${user.username}')">🗑️ حذف</button>` : ''}
                    </div>
                </div>
            `;
        });

        usersListEl.innerHTML = html;
    },

    // ===================================
    // ADMIN - USER MANAGEMENT
    // ===================================

    openUserEditModal(userId, username, firstName, lastName, role, isSuperuser) {
        const modal = document.getElementById('user-edit-modal');
        document.getElementById('edit-user-id').value = userId;
        document.getElementById('edit-username').value = username;
        document.getElementById('edit-first-name').value = firstName;
        document.getElementById('edit-last-name').value = lastName;
        document.getElementById('edit-role').value = role;
        document.getElementById('edit-is-superuser').checked = isSuperuser;
        
        modal?.classList.remove('hidden');
        modal?.classList.add('active');
    },

    closeUserEditModal() {
        const modal = document.getElementById('user-edit-modal');
        modal?.classList.add('hidden');
        modal?.classList.remove('active');
        
        // Clear error/success messages
        const errorEl = document.getElementById('user-edit-error');
        const successEl = document.getElementById('user-edit-success');
        if (errorEl) errorEl.classList.add('hidden');
        if (successEl) successEl.classList.add('hidden');
    },

    async handleUpdateUser(event) {
        event.preventDefault();
        
        const userId = document.getElementById('edit-user-id').value;
        const firstName = document.getElementById('edit-first-name').value.trim();
        const lastName = document.getElementById('edit-last-name').value.trim();
        const role = document.getElementById('edit-role').value;
        const isSuperuser = document.getElementById('edit-is-superuser').checked;
        
        const errorEl = document.getElementById('user-edit-error');
        const successEl = document.getElementById('user-edit-success');
        const token = localStorage.getItem(this.config.apiTokenKey);

        errorEl?.classList.add('hidden');
        successEl?.classList.add('hidden');

        try {
            const response = await fetch(`${this.config.apiBaseUrl}/api/admin/users/${userId}/update/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName,
                    role: role,
                    is_superuser: isSuperuser,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'خطأ في تحديث المستخدم');
            }

            Logger.log('ADMIN', `User updated: ${data.username}`);
            if (successEl) {
                successEl.textContent = `✅ تم تحديث بيانات "${data.username}" بنجاح`;
                successEl.classList.remove('hidden');
            }
            
            // Close modal after 2 seconds
            setTimeout(() => {
                this.closeUserEditModal();
                this.loadAdminUsersList(); // Refresh users list
            }, 2000);
            
            this.showNotification('تم تحديث بيانات المستخدم بنجاح', 'success');
        } catch (error) {
            Logger.error('ADMIN', 'Update user failed', error);
            if (errorEl) {
                errorEl.textContent = error.message;
                errorEl.classList.remove('hidden');
            }
        }
    },

    async deleteUser(userId, username) {
        if (!confirm(`هل أنت متأكد من حذف المستخدم "${username}"؟\nهذا الإجراء لا يمكن التراجع عنه.`)) {
            return;
        }

        const token = localStorage.getItem(this.config.apiTokenKey);

        try {
            const response = await fetch(`${this.config.apiBaseUrl}/api/admin/users/${userId}/delete/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'خطأ في حذف المستخدم');
            }

            Logger.log('ADMIN', `User deleted: ${username}`);
            this.showNotification(`تم حذف "${username}" بنجاح`, 'success');
            this.loadAdminUsersList(); // Refresh users list
        } catch (error) {
            Logger.error('ADMIN', 'Delete user failed', error);
            this.showNotification(error.message, 'error');
        }
    },

    // ===================================
    // ADMIN - CREATE/PROMOTE TEACHER
    // ===================================

    async handleCreateTeacher(event) {
        event.preventDefault();
        const username = document.getElementById('teacher-new-username').value.trim();
        const firstName = document.getElementById('teacher-new-firstname').value.trim();
        const lastName = document.getElementById('teacher-new-lastname').value.trim();
        const password = document.getElementById('teacher-new-password').value;
        const errorEl = document.getElementById('admin-create-error');
        const successEl = document.getElementById('admin-create-success');
        const token = localStorage.getItem(this.config.apiTokenKey);

        errorEl?.classList.add('hidden');
        successEl?.classList.add('hidden');

        Logger.log('AUTH', `Admin creating teacher: ${username}`);

        try {
            const response = await fetch(`${this.config.apiBaseUrl}/api/admin/create-teacher/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ username, password, first_name: firstName, last_name: lastName }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'خطأ في إنشاء الحساب');
            }

            Logger.log('AUTH', `Teacher created: ${data.username} (${data.action})`);
            if (successEl) {
                successEl.textContent = `✅ تم إنشاء حساب الأستاذ "${data.username}" بنجاح`;
                successEl.classList.remove('hidden');
            }
            document.getElementById('admin-create-teacher-form').reset();
            this.showNotification('تم إنشاء حساب الأستاذ بنجاح', 'success');
            this.loadAdminUsersList(); // Refresh users list
        } catch (error) {
            Logger.error('AUTH', 'Create teacher failed', error);
            if (errorEl) {
                errorEl.textContent = error.message;
                errorEl.classList.remove('hidden');
            }
        }
    },

    async handlePromoteTeacher(event) {
        event.preventDefault();
        const username = document.getElementById('promote-username').value.trim();
        const errorEl = document.getElementById('admin-promote-error');
        const successEl = document.getElementById('admin-promote-success');
        const token = localStorage.getItem(this.config.apiTokenKey);

        errorEl?.classList.add('hidden');
        successEl?.classList.add('hidden');

        Logger.log('AUTH', `Admin promoting user to teacher: ${username}`);

        try {
            const response = await fetch(`${this.config.apiBaseUrl}/api/admin/create-teacher/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ username, promote: true }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'خطأ في الترقية');
            }

            Logger.log('AUTH', `User promoted: ${data.username} → ${data.role}`);
            if (successEl) {
                successEl.textContent = `✅ تم ترقية "${data.username}" إلى أستاذ بنجاح`;
                successEl.classList.remove('hidden');
            }
            document.getElementById('admin-promote-form').reset();
            this.showNotification(`تم ترقية ${data.username} إلى أستاذ`, 'success');
            this.loadAdminUsersList(); // Refresh users list
        } catch (error) {
            Logger.error('AUTH', 'Promote teacher failed', error);
            if (errorEl) {
                errorEl.textContent = error.message;
                errorEl.classList.remove('hidden');
            }
        }
    },

    // ===================================
    // AUDIO RECORDING
    // ===================================

    _recorder: null,
    _recordChunks: [],
    _recordTaskId: null,
    _recordTimer: null,
    _recordSeconds: 0,
    _recordBlob: null,

    openRecordModal(taskId, taskTitle) {
        this._recordTaskId = taskId;
        this._recordBlob = null;
        this._recordSeconds = 0;
        document.getElementById('recording-task-name').textContent = taskTitle;
        document.getElementById('recording-timer').textContent = '00:00';
        document.getElementById('recording-status').textContent = 'اضغط للتسجيل';
        document.getElementById('recording-btn').classList.remove('recording-active');

        const preview = document.getElementById('recording-preview');
        if (preview) {
            preview.classList.add('hidden');
            preview.removeAttribute('src'); // Clean way to clear audio without triggering 404
            try { preview.load(); } catch (e) {} // Ensure previous audio stops
        }

        document.getElementById('recording-submit-btn').classList.add('hidden');
        document.getElementById('audio-record-modal').classList.remove('hidden');
    },

    async toggleRecording() {
        if (this._recorder && this._recorder.state === 'recording') {
            this.stopRecording(false);
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this._recordChunks = [];
            this._recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

            this._recorder.ondataavailable = (e) => {
                if (e.data.size > 0) this._recordChunks.push(e.data);
            };

            this._recorder.onstop = () => {
                stream.getTracks().forEach(t => t.stop());
                this._recordBlob = new Blob(this._recordChunks, { type: 'audio/webm' });
                const url = URL.createObjectURL(this._recordBlob);
                const preview = document.getElementById('recording-preview');
                preview.src = url;
                preview.classList.remove('hidden');
                document.getElementById('recording-submit-btn').classList.remove('hidden');
                document.getElementById('recording-status').textContent = 'تم التسجيل - يمكنك الاستماع أو الإرسال';
            };

            this._recorder.start();
            this._recordSeconds = 0;
            document.getElementById('recording-btn').classList.add('recording-active');
            document.getElementById('recording-status').textContent = 'جاري التسجيل...';

            this._recordTimer = setInterval(() => {
                this._recordSeconds++;
                if (this._recordSeconds >= 300) { // 5 min max
                    this.stopRecording(false);
                    return;
                }
                const mins = String(Math.floor(this._recordSeconds / 60)).padStart(2, '0');
                const secs = String(this._recordSeconds % 60).padStart(2, '0');
                document.getElementById('recording-timer').textContent = `${mins}:${secs}`;
            }, 1000);
        } catch (error) {
            this.showNotification('لا يمكن الوصول إلى الميكروفون', 'error');
        }
    },

    stopRecording(cancel) {
        if (this._recordTimer) {
            clearInterval(this._recordTimer);
            this._recordTimer = null;
        }
        if (this._recorder && this._recorder.state === 'recording') {
            this._recorder.stop();
        }
        document.getElementById('recording-btn').classList.remove('recording-active');

        if (cancel) {
            document.getElementById('audio-record-modal').classList.add('hidden');
            this._recordBlob = null;
        }
    },

    async submitRecording() {
        if (!this._recordBlob || !this._recordTaskId) {
            Logger.error('RECORDING', 'Missing blob or task ID', { blob: !!this._recordBlob, taskId: this._recordTaskId });
            return;
        }

        const token = localStorage.getItem(this.config.apiTokenKey);
        if (!token) {
            Logger.error('RECORDING', 'No auth token found');
            return;
        }

        // Debug: Log blob details
        Logger.log('RECORDING', `Blob size: ${this._recordBlob.size} bytes, type: ${this._recordBlob.type}`);
        Logger.log('RECORDING', `Task ID: ${this._recordTaskId}`);

        const formData = new FormData();
        formData.append('task_id', this._recordTaskId);
        formData.append('audio_file', this._recordBlob, `recording_${Date.now()}.webm`);

        try {
            document.getElementById('recording-submit-btn').disabled = true;
            
            Logger.log('RECORDING', 'Sending submission to API...');
            const response = await fetch(`${this.config.apiBaseUrl}/api/submissions/`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            Logger.log('RECORDING', `API Response status: ${response.status}`);

            if (!response.ok) {
                const data = await response.json();
                Logger.error('RECORDING', 'Submission failed', data);
                throw new Error(data.detail || data.non_field_errors?.[0] || 'خطأ في الإرسال');
            }

            const result = await response.json();
            Logger.log('RECORDING', 'Submission successful', result);

            this.showNotification('تم إرسال التسجيل بنجاح!', 'success');
            document.getElementById('audio-record-modal').classList.add('hidden');
            this._recordBlob = null;
            this.loadStudentDashboard();
        } catch (error) {
            this.showNotification(error.message, 'error');
        } finally {
            document.getElementById('recording-submit-btn').disabled = false;
        }
    }
};

// ===================================
// INITIALIZATION
// ===================================

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    QuranReview.init();
});

// Add slideDown animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from { transform: translate(-50%, -100%); opacity: 0; }
        to { transform: translate(-50%, 0); opacity: 1; }
    }
`;
document.head.appendChild(style);

// Global error handling
window.addEventListener('error', (e) => {
  const msg = e?.message || 'Unknown error';
  Logger.error('GLOBAL', `Application Error: ${msg}`, e.error);
  QuranReview.showNotification(`خطأ: ${msg}`, 'error');
});

// Global unhandled promise rejection handling
window.addEventListener('unhandledrejection', (e) => {
  const msg = e?.reason?.message || e?.reason || 'Unhandled promise rejection';
  Logger.error('GLOBAL', `Unhandled Promise Rejection: ${msg}`, e.reason);
  QuranReview.showNotification(`خطأ: ${msg}`, 'error');
});

// Make QuranReview available globally
window.QuranReview = QuranReview;


