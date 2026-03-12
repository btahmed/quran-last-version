// frontend/src/components/AudioPlayer.js
import { Logger } from '../core/logger.js';
import { state, saveData } from '../core/state.js';
import { config } from '../core/config.js';

export const AudioManager = {
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
                Logger.log('AUDIO', `State: autoPlayNext=${state.settings.autoPlayNext}, mode=${this.mode}, i=${i}/${urls.length}`);

                // Check if this is the last ayah
                const isLastAyah = ayahNumber >= toAyah;
                if (isLastAyah) {
                    Logger.audio('COMPLETE', 'Last ayah completed - stopping sequence');
                    this.stopAll();
                    return;
                }

                // Get REAL-TIME delay from settings (not cached)
                const rawAyahDelay = state.settings.ayahDelay;
                const currentDelay = rawAyahDelay !== undefined ? parseFloat(rawAyahDelay) : 2.0;
                const delay = currentDelay * 1000; // Convert to milliseconds
                Logger.log('AUDIO', `Delay: raw=${rawAyahDelay}, computed=${currentDelay}s (${delay}ms)`);

                if (state.settings.autoPlayNext && (this.mode === "wird" || this.mode === "surah")) {
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
            // Garde la ref window.QuranReview — dépendance circulaire résolue par la façade dans main.js
            if (window.QuranReview) {
                window.QuranReview.updateWardAyahDisplay(surahId, ayahNumber);
            }

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

export function initAudioPlayer() {
    const audioElement = document.getElementById('audio-element');
    const reciterSelector = document.getElementById('reciter-selector');

    if (audioElement && reciterSelector) {
        reciterSelector.addEventListener('change', () => {
            if (window.QuranReview) window.QuranReview.updateReciter();
        });

        audioElement.addEventListener('error', () => {
            if (window.QuranReview) window.QuranReview.showNotification('خطأ في تحميل الملف الصوتي', 'error');
        });

        console.log('Audio player initialized');
    }
}

export function initWardPlayer() {
    console.log('Initializing Ward Player...');

    const playWardBtn = document.getElementById('play-ward-btn');
    const playSurahBtn = document.getElementById('play-surah-btn');
    const stopWardBtn = document.getElementById('stop-ward-btn');

    console.log('DEBUG: Elements found:', {
        playWardBtn: !!playWardBtn,
        playSurahBtn: !!playSurahBtn,
        stopWardBtn: !!stopWardBtn
    });

    if (playWardBtn) {
        playWardBtn.addEventListener('click', () => {
            console.log('DEBUG: Play Ward button clicked!');
            if (window.QuranReview) window.QuranReview.playWard();
        });
        console.log('DEBUG: Play Ward button event attached');
    } else {
        console.info('DEBUG: Play Ward button not found on current view');
    }

    if (playSurahBtn) {
        playSurahBtn.addEventListener('click', () => {
            console.log('DEBUG: Play Surah button clicked!');
            if (window.QuranReview) window.QuranReview.playFullSurah();
        });
        console.log('DEBUG: Play Surah button event attached');
    } else {
        console.info('DEBUG: Play Surah button not found on current view');
    }

    // Stop button
    const stopBtn = document.getElementById('stop-ward-btn');
    if (stopBtn) {
        stopBtn.addEventListener('click', () => {
            if (window.QuranReview) window.QuranReview.stopWardPlayback();
        });
        console.log('DEBUG: Stop Ward button event attached');
    }

    // Navigation buttons
    const prevBtn = document.getElementById('prev-ayah-btn');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (window.QuranReview) window.QuranReview.playPreviousAyah();
        });
        console.log('DEBUG: Previous Ayah button event attached');
    }

    const nextBtn = document.getElementById('next-ayah-btn');
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (window.QuranReview) window.QuranReview.playNextAyahManually();
        });
        console.log('DEBUG: Next Ayah button event attached');
    }

    // Initialize ward player state
    state.wardPlayer = {
        isPlaying: false,
        currentAyah: 1,
        totalAyahs: 0,
        mode: 'ward', // 'ward' or 'surah'
        surahId: null,
        fromAyah: null,
        toAyah: null
    };
    saveData();

    console.log('Ward player initialized successfully');
}
