// WardPage — extrait de frontend/script.js + frontend/index.html (lignes 388-513)
import { state, saveData } from '../core/state.js';
import { config } from '../core/config.js';
import { showNotification } from '../core/ui.js';
import { Logger } from '../core/logger.js';
import { AudioManager } from '../components/AudioPlayer.js';

// Injection CSS dynamique
if (!document.querySelector('link[href*="WardPage.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/src/pages/WardPage.css';
    document.head.appendChild(link);
}

export function render() {
    // HTML exact de div#ward-page (index.html lignes 388-513)
    return `<div id="ward-page" class="page active">
            <section class="section-pro">
                <div class="container-pro" style="max-width: 800px;">
                    <h2 class="section-title" style="text-align: center; margin-bottom: var(--space-8);">🎧 الورد اليومي</h2>

                    <div class="card-glass-pro" style="margin-bottom: var(--space-6);">
                        <div class="form-floating" style="margin-bottom: var(--space-4);">
                            <select id="ward-surah-select" class="select-modern">
                                <option value="">اختر السورة</option>
                                <option value="1">سورة الفاتحة</option>
                                <option value="2">سورة البقرة</option>
                                <option value="3">سورة آل عمران</option>
                            </select>
                            <label for="ward-surah-select">السورة</label>
                        </div>

                        <div class="grid-pro grid-cols-2" style="margin-bottom: var(--space-6);">
                            <div class="form-floating">
                                <input type="number" id="ward-from-ayah" placeholder=" " min="1" value="1">
                                <label for="ward-from-ayah">من الآية</label>
                            </div>
                            <div class="form-floating">
                                <input type="number" id="ward-to-ayah" placeholder=" " min="1" value="7">
                                <label for="ward-to-ayah">إلى الآية</label>
                            </div>
                        </div>

                        <div class="grid-pro grid-cols-2" style="margin-bottom: var(--space-4);">
                            <div class="form-floating">
                                <select id="ward-reciter-selector">
                                    <option value="alafasy">مشاري بن راشد العفاسي</option>
                                </select>
                                <label for="ward-reciter-selector">القارئ</label>
                            </div>
                            <div class="form-floating">
                                <select id="ward-audio-quality">
                                    <option value="192">عالية (192 kbps)</option>
                                    <option value="128" selected>متوسطة (128 kbps)</option>
                                    <option value="64">منخفضة (64 kbps)</option>
                                </select>
                                <label for="ward-audio-quality">جودة الصوت</label>
                            </div>
                        </div>

                        <div class="grid-pro grid-cols-2" style="margin-bottom: var(--space-4);">
                            <div class="form-floating">
                                <select id="ward-audio-source">
                                    <option value="cdn" selected>الخادم المباشر</option>
                                    <option value="api">API</option>
                                </select>
                                <label for="ward-audio-source">مصدر الصوت</label>
                            </div>
                            <div class="form-floating">
                                <select id="ward-image-quality">
                                    <option value="high" selected>عالية</option>
                                    <option value="medium">متوسطة</option>
                                    <option value="low">منخفضة</option>
                                </select>
                                <label for="ward-image-quality">جودة الصورة</label>
                            </div>
                        </div>

                        <div class="form-floating" style="margin-bottom: var(--space-4);">
                            <select id="ward-ayah-delay">
                                <option value="0" selected>بدون تأخير</option>
                                <option value="0.5">0.5 ثانية</option>
                                <option value="1">1 ثانية</option>
                                <option value="2">2 ثوان</option>
                                <option value="3">3 ثوان</option>
                                <option value="5">5 ثوان</option>
                            </select>
                            <label for="ward-ayah-delay">تأخير بين الآيات</label>
                        </div>

                        <div style="margin-bottom: var(--space-4);">
                            <label class="toggle-switch">
                                <input type="checkbox" id="ward-autoplay-next" checked>
                                <span class="toggle-slider"></span>
                                <span style="margin-right: var(--space-3);">التشغيل التلقائي للآية التالية</span>
                            </label>
                        </div>

                        <button class="btn btn-glow btn-full" onclick="playWard()">
                            <span>▶️</span>
                            تشغيل الورد
                        </button>
                    </div>

                    <!-- Audio Player -->
                    <div class="player-glass" id="ward-player">
                        <div style="text-align: center; margin-bottom: var(--space-4);">
                            <span class="badge badge-glass" id="ward-progress-text">الآية 1 من 7</span>
                        </div>

                        <div class="ward-ayah-image" id="ward-image-container" style="min-height: 200px; display: flex; align-items: center; justify-content: center; background: rgba(45, 80, 22, 0.05); border-radius: var(--radius-2xl); margin-bottom: var(--space-4);">
                            <img id="ward-image" src="" alt="Ayah Image" style="display: none; max-width: 100%; border-radius: var(--radius-xl);">
                            <div id="ward-ayah-text" class="arabic-large" style="text-align: center; padding: var(--space-6); font-size: 1.75rem;">
                                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                            </div>
                        </div>

                        <div class="progress-glass" style="margin: var(--space-6) 0;">
                            <div class="fill" id="ward-progress-bar" style="width: 0%;"></div>
                        </div>

                        <div class="player-controls">
                            <button class="player-btn player-btn-secondary" id="prev-ayah-btn" onclick="QuranReview.previousWardAyah()">
                                ⏮️
                            </button>
                            <button class="player-btn player-btn-lg" id="play-ward-btn" onclick="QuranReview.toggleWardPlay()">
                                ▶️
                            </button>
                            <button class="player-btn player-btn-secondary" id="next-ayah-btn" onclick="QuranReview.nextWardAyah()">
                                ⏭️
                            </button>
                        </div>

                        <div class="flex-pro" style="justify-content: center; margin-top: var(--space-4);">
                            <button class="btn btn-outline-glow btn-sm" id="stop-ward-btn" onclick="AudioManager.stopAll()">
                                ⏹️ إيقاف
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </div>`;
}

export function init() {
    setupWardControls();
    populateWardSurahSelect();
    // NE PAS appeler initWardPlayer ici — déjà fait dans main.js
}

// ===================================
// WARD CONTROLS
// ===================================

export function setupWardControls() {
    // Sélecteur de sourate
    const surahSelect = document.getElementById('ward-surah-select');
    if (surahSelect) {
        surahSelect.addEventListener('change', () => {
            updateWardAyahLimits();
        });
    }

    // Inputs de/vers ayah
    const fromAyahInput = document.getElementById('ward-from-ayah');
    const toAyahInput = document.getElementById('ward-to-ayah');

    if (fromAyahInput) {
        fromAyahInput.addEventListener('input', () => {
            updateWardAyahLimits();
        });
    }

    if (toAyahInput) {
        toAyahInput.addEventListener('input', () => {
            updateWardAyahLimits();
        });
    }

    // Sélecteur de récitateur
    const reciterSelector = document.getElementById('ward-reciter-selector');
    if (reciterSelector) {
        reciterSelector.addEventListener('change', () => {
            updateWardReciter();
        });
    }

    // Sélecteur de qualité audio
    const audioQualitySelector = document.getElementById('ward-audio-quality');
    if (audioQualitySelector) {
        audioQualitySelector.addEventListener('change', () => {
            updateWardAudioQuality();
        });
    }

    // Sélecteur de source audio
    const audioSourceSelector = document.getElementById('ward-audio-source');
    if (audioSourceSelector) {
        audioSourceSelector.addEventListener('change', () => {
            updateWardAudioSource();
        });
    }

    // Sélecteur de qualité image
    const imageQualitySelector = document.getElementById('ward-image-quality');
    if (imageQualitySelector) {
        imageQualitySelector.addEventListener('change', () => {
            updateWardImageQuality();
        });
    }

    // Sélecteur de délai entre ayahs
    const ayahDelaySelector = document.getElementById('ward-ayah-delay');
    if (ayahDelaySelector) {
        ayahDelaySelector.addEventListener('change', () => {
            updateWardAyahDelay();
        });
    }

    // Case à cocher lecture automatique suivante
    const autoPlayNextCheckbox = document.getElementById('ward-autoplay-next');
    if (autoPlayNextCheckbox) {
        autoPlayNextCheckbox.addEventListener('change', () => {
            updateWardAutoPlayNext();
        });
    }

    console.log('✅ Ward controls setup completed');
}

export function populateWardSurahSelect() {
    const surahSelect = document.getElementById('ward-surah-select');
    if (!surahSelect) return;

    // Effacer les options existantes sauf la première
    while (surahSelect.children.length > 1) {
        surahSelect.removeChild(surahSelect.lastChild);
    }

    // Utiliser un DocumentFragment pour optimiser les mises à jour DOM
    const fragment = document.createDocumentFragment();

    // Ajouter les 114 sourates avec leur nombre d'ayahs correct
    config.surahs.forEach(surah => {
        const option = document.createElement('option');
        option.value = surah.id;
        option.textContent = `${surah.name} (${surah.ayahs} آيات)`;
        fragment.appendChild(option);
    });

    surahSelect.appendChild(fragment);
    console.log('📋 Ward surah select populated with 114 surahs');
}

function updateWardAyahLimits() {
    const surahSelect = document.getElementById('ward-surah-select');
    const fromAyahInput = document.getElementById('ward-from-ayah');
    const toAyahInput = document.getElementById('ward-to-ayah');

    if (!surahSelect || !fromAyahInput || !toAyahInput) return;

    const surahId = parseInt(surahSelect.value);
    if (!surahId) return;

    const surah = config.surahs.find(s => s.id === surahId);
    if (!surah) return;

    fromAyahInput.max = surah.ayahs;
    toAyahInput.max = surah.ayahs;
    fromAyahInput.placeholder = `من 1 إلى ${surah.ayahs}`;
    toAyahInput.placeholder = `من 1 إلى ${surah.ayahs}`;

    if (parseInt(fromAyahInput.value) > surah.ayahs) fromAyahInput.value = '';
    if (parseInt(toAyahInput.value) > surah.ayahs) toAyahInput.value = '';

    console.log(`📊 Updated ward ayah limits for Surah ${surahId}: 1-${surah.ayahs}`);
}

function updateWardReciter() {
    const reciterSelector = document.getElementById('ward-reciter-selector');
    if (reciterSelector && window.QuranAudio) {
        const selectedReciter = reciterSelector.value;
        QuranAudio.setReciter(selectedReciter);
        console.log('🎵 Ward reciter updated to:', selectedReciter);
        showNotification(`تم تغيير القارئ إلى: ${QuranAudio.getReciterName(selectedReciter)}`, 'success');
    }
}

function updateWardAudioQuality() {
    const audioQualitySelector = document.getElementById('ward-audio-quality');
    if (audioQualitySelector) {
        state.settings.audioBitrate = parseInt(audioQualitySelector.value);
        saveData();
        console.log('🎵 Ward audio quality updated to:', state.settings.audioBitrate);
    }
}

function updateWardAudioSource() {
    const audioSourceSelector = document.getElementById('ward-audio-source');
    if (audioSourceSelector) {
        state.settings.audioSource = audioSourceSelector.value;
        saveData();
        console.log('🎵 Ward audio source updated to:', state.settings.audioSource);
    }
}

function updateWardImageQuality() {
    const imageQualitySelector = document.getElementById('ward-image-quality');
    if (imageQualitySelector) {
        state.imageQuality = imageQualitySelector.value;
        console.log('🖼️ Ward image quality updated to:', state.imageQuality);
    }
}

function updateWardAyahDelay() {
    const ayahDelaySelector = document.getElementById('ward-ayah-delay');
    if (ayahDelaySelector) {
        state.settings.ayahDelay = parseFloat(ayahDelaySelector.value);
        saveData();
        console.log('⏱️ Ward ayah delay updated to:', state.settings.ayahDelay);
    }
}

function updateWardAutoPlayNext() {
    const autoPlayNextCheckbox = document.getElementById('ward-autoplay-next');
    if (autoPlayNextCheckbox) {
        state.settings.autoPlayNext = autoPlayNextCheckbox.checked;
        saveData();
        console.log('🔄 Ward auto-play next updated to:', state.settings.autoPlayNext);
    }
}

// ===================================
// WARD PLAYER FUNCTIONS
// ===================================

export function playWard() {
    console.log('🎵 Starting Ward playback - using AudioManager...');

    const surahSelect = document.getElementById('ward-surah-select');
    const fromAyahInput = document.getElementById('ward-from-ayah');
    const toAyahInput = document.getElementById('ward-to-ayah');

    if (!surahSelect || !fromAyahInput || !toAyahInput) return;

    const surahId = parseInt(surahSelect.value);
    const fromAyah = parseInt(fromAyahInput.value);
    const toAyah = parseInt(toAyahInput.value);

    if (!surahId || !fromAyah || !toAyah) {
        showNotification('يرجى اختيار السورة والآيات', 'warning');
        return;
    }

    // Validation : fromAyah doit être <= toAyah
    if (fromAyah > toAyah) {
        showNotification('❌ خطأ: من الآية يجب أن يكون أصغر أو يساوي إلى الآية', 'error');
        console.error(`❌ Invalid ayah range: from ${fromAyah} > to ${toAyah}`);
        return;
    }

    const surah = config.surahs.find(s => s.id === surahId);
    if (!surah) return;

    // Validation additionnelle contre le nombre d'ayahs de la sourate
    if (fromAyah < 1 || toAyah > surah.ayahs) {
        showNotification(`❌ خطأ: الآيات يجب أن تكون بين 1 و ${surah.ayahs}`, 'error');
        console.error(`❌ Invalid ayah range: ${fromAyah}-${toAyah} for surah ${surahId} (max: ${surah.ayahs})`);
        return;
    }

    console.log(`✅ Valid ayah range: ${fromAyah}-${toAyah} for surah ${surah.name}`);

    // Initialiser l'état du ward player
    state.wardPlayer = {
        isPlaying: true,
        currentAyah: fromAyah,
        totalAyahs: toAyah - fromAyah + 1,
        mode: 'ward',
        surahId: surahId,
        fromAyah: fromAyah,
        toAyah: toAyah
    };

    updateWardDisplay();
    AudioManager.playWirdAyahSequence(surahId, fromAyah, toAyah);

    showNotification(`🎧 جاري تشغيل ورد ${surah.name} (${fromAyah}-${toAyah})`, 'success');
    console.log('✅ Ward playback started successfully via AudioManager');
}

export function toggleWardPlay() {
    if (!state.wardPlayer) {
        showNotification('يرجى تشغيل ورد أولاً', 'warning');
        return;
    }

    if (state.wardPlayer.isPlaying) {
        stopWardPlayback();
    } else {
        // Reprendre la lecture depuis l'ayah courante
        const { surahId, currentAyah, toAyah } = state.wardPlayer;
        state.wardPlayer.isPlaying = true;
        AudioManager.playWirdAyahSequence(surahId, currentAyah, toAyah);
        updateWardDisplay();
        showNotification('▶️ تم استئناف التشغيل', 'info');
    }
}

export function previousWardAyah() {
    if (!state.wardPlayer || !state.wardPlayer.surahId || !state.wardPlayer.currentAyah) {
        showNotification('يرجى تشغيل ورد أولاً', 'warning');
        return;
    }

    const { surahId, currentAyah, fromAyah } = state.wardPlayer;

    if (currentAyah <= fromAyah) {
        showNotification('هذه هي أول آية في الورد', 'info');
        return;
    }

    const previousAyah = currentAyah - 1;

    AudioManager.stopAll();

    state.wardPlayer.currentAyah = previousAyah;
    state.wardPlayer.isPlaying = true;

    AudioManager.playWirdAyahSequence(surahId, previousAyah, previousAyah);

    showNotification(`⏮️ العودة إلى الآية ${previousAyah}`, 'success');
}

export function nextWardAyah() {
    if (!state.wardPlayer || !state.wardPlayer.surahId || !state.wardPlayer.currentAyah) {
        showNotification('يرجى تشغيل ورد أولاً', 'warning');
        return;
    }

    const { surahId, currentAyah, toAyah } = state.wardPlayer;

    if (currentAyah >= toAyah) {
        showNotification('هذه هي آخر آية في الورد', 'info');
        return;
    }

    const nextAyah = currentAyah + 1;

    AudioManager.stopAll();

    state.wardPlayer.currentAyah = nextAyah;
    state.wardPlayer.isPlaying = true;

    AudioManager.playWirdAyahSequence(surahId, nextAyah, nextAyah);

    showNotification(`⏭️ التقدم إلى الآية ${nextAyah}`, 'success');
}

export function stopWardPlayback() {
    console.log('⏹️ Stopping Ward playback - using AudioManager...');

    AudioManager.stopAll();

    if (state.wardPlayer) {
        state.wardPlayer.isPlaying = false;
    }

    updateWardDisplay();

    showNotification('⏹️ تم إيقاف التشغيل', 'info');
    console.log('✅ Ward playback stopped via AudioManager');
}

export function updateWardDisplay() {
    if (!state.wardPlayer) return;

    const { currentAyah, totalAyahs, isPlaying } = state.wardPlayer;

    const progressText = document.getElementById('ward-progress-text');
    const progressBar = document.getElementById('ward-progress-bar');
    const currentAyahInfo = document.getElementById('current-ayah-info');

    if (progressText) {
        progressText.textContent = `${currentAyah} / ${totalAyahs}`;
    }

    if (progressBar) {
        const progress = (currentAyah - state.wardPlayer.fromAyah + 1) / totalAyahs * 100;
        progressBar.style.width = `${progress}%`;
    }

    if (currentAyahInfo) {
        const surah = config.surahs.find(s => s.id === state.wardPlayer.surahId);
        currentAyahInfo.textContent = `الآية الحالية: ${surah?.name || ''} - ${currentAyah}`;
    }
}

export function updateWardAyahDisplay(surahId, ayahNumber) {
    const wardImage = document.getElementById('ward-image');
    const wardText = document.getElementById('ward-ayah-text');

    if (!window.QuranAudio) return;

    const surah = config.surahs.find(s => s.id === surahId);
    if (!surah) return;

    // Mettre à jour l'image
    if (wardImage) {
        const highRes = state.imageQuality === 'high';
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

    // Mettre à jour le texte
    if (wardText) {
        wardText.textContent = `${surah.name} - الآية ${ayahNumber}`;
        wardText.style.display = wardImage && wardImage.style.display !== 'none' ? 'none' : 'block';
    }
}
