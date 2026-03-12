// frontend/src/pages/HifzPage.js
import { competitionManager } from '../services/competition.js';
import { hifzEngine } from '../services/hifz.js';
import { state, saveData } from '../core/state.js';
import { config } from '../core/config.js';
import { showNotification } from '../core/ui.js';

if (!document.querySelector('link[href*="HifzPage.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/src/pages/HifzPage.css';
    document.head.appendChild(link);
}

export function render() {
    return `<div id="hifz-page" class="page active">
            <section class="section-pro">
                <div class="container-pro" style="max-width: 900px;">
                    <h2 class="section-title" style="text-align: center; margin-bottom: var(--space-8);">🎭 وضع الحفظ</h2>

                    <!-- Hifz Selection Container -->
                    <div class="card-glass-pro" id="hifz-selection" style="margin-bottom: var(--space-6);">
                        <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: var(--space-4);">اختيار التمرين</h3>

                        <form id="hifz-start-form">
                            <div class="form-floating" style="margin-bottom: var(--space-4);">
                                <select id="hifz-surah-select" required>
                                    <option value="">-- اختر السورة --</option>
                                </select>
                                <label for="hifz-surah-select">السورة</label>
                            </div>

                            <div class="grid-pro grid-cols-2" style="margin-bottom: var(--space-4);">
                                <div class="form-floating">
                                    <input type="number" id="hifz-from-ayah" min="1" value="1" placeholder=" " required>
                                    <label for="hifz-from-ayah">من الآية</label>
                                </div>
                                <div class="form-floating">
                                    <input type="number" id="hifz-to-ayah" min="1" value="7" placeholder=" " required>
                                    <label for="hifz-to-ayah">إلى الآية</label>
                                </div>
                            </div>

                            <button type="submit" class="btn btn-glow btn-full">
                                <span>🎮</span>
                                ابدأ التمرين
                            </button>
                        </form>
                    </div>

                    <!-- Hifz Active Game Container -->
                    <div class="card-glass-pro" id="hifz-active-container" style="display: none;">
                        <div class="flex-pro" style="justify-content: space-between; margin-bottom: var(--space-4);">
                            <div>
                                <span class="badge badge-primary" id="hifz-score">النقاط: 0</span>
                                <span class="badge badge-glass" id="hints-count" style="margin-right: var(--space-2);">تلميحات: 3</span>
                            </div>
                            <span class="badge badge-gold" id="hifz-level">المستوى: ⭐⭐⭐</span>
                        </div>

                        <!-- Hifz Display Container -->
                        <div id="hifz-display" style="margin: var(--space-6) 0; min-height: 150px;"></div>

                        <!-- Hifz Text (fallback display) -->
                        <div class="arabic-large" id="hifz-text" style="text-align: center; line-height: 2.5; margin: var(--space-6) 0; font-size: 1.75rem; display: none;">
                            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                        </div>

                        <!-- Feedback Area -->
                        <div id="hifz-feedback" style="text-align: center; margin: var(--space-4) 0; min-height: 30px;"></div>

                        <div class="flex-pro" style="justify-content: center; gap: var(--space-3);">
                            <button class="btn btn-outline-glow" onclick="QuranReview.showHint()">
                                <span>💡</span>
                                تلميح
                            </button>
                            <button class="btn btn-glow" onclick="QuranReview.checkMemorization()">
                                <span>✓</span>
                                تحقق
                            </button>
                            <button class="btn btn-outline-glow" onclick="QuranReview.nextLevel()">
                                <span>⏭️</span>
                                التالي
                            </button>
                            <button class="btn btn-outline-glow" onclick="QuranReview.stopHifzSession()">
                                <span>⏹️</span>
                                إيقاف
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </div>`;
}

export function init() {
    const session = state.hifz.currentSession;
    const selectionDiv = document.getElementById('hifz-selection');
    const containerDiv = document.getElementById('hifz-active-container');

    if (!selectionDiv || !containerDiv) return;

    if (session && session.isActive) {
        selectionDiv.classList.add('hidden');
        containerDiv.classList.remove('hidden');
        // Recharger l'affichage si nécessaire
        if (!containerDiv.querySelector('.ayah-line')) {
            competitionManager.loadAyahForHifz(session.surahId, session.currentAyah);
        }
    } else {
        selectionDiv.classList.remove('hidden');
        containerDiv.classList.add('hidden');
        _populateSurahSelect();
        _setupFormListener();
    }
}

// Peupler le select des sourates
function _populateSurahSelect() {
    const surahSelect = document.getElementById('hifz-surah-select');
    if (!surahSelect || surahSelect.options.length > 1) return;

    config.surahs.forEach(surah => {
        const option = document.createElement('option');
        option.value = surah.id;
        option.textContent = `${surah.name} (${surah.ayahs} آيات)`;
        surahSelect.appendChild(option);
    });

    surahSelect.addEventListener('change', () => {
        const id = parseInt(surahSelect.value);
        const surah = config.surahs.find(s => s.id === id);
        const from = document.getElementById('hifz-from-ayah');
        const to = document.getElementById('hifz-to-ayah');
        if (surah && from && to) {
            from.max = surah.ayahs;
            to.max = surah.ayahs;
            from.placeholder = `1-${surah.ayahs}`;
            to.placeholder = `1-${surah.ayahs}`;
        }
    });
}

// Attacher l'écouteur du formulaire de démarrage (une seule fois)
function _setupFormListener() {
    const form = document.getElementById('hifz-start-form');
    if (form && !form.dataset.listening) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const surahId = parseInt(document.getElementById('hifz-surah-select').value);
            const fromAyah = parseInt(document.getElementById('hifz-from-ayah').value);
            const toAyah = parseInt(document.getElementById('hifz-to-ayah').value);

            if (surahId && fromAyah && toAyah && fromAyah <= toAyah) {
                competitionManager.startHifzSession(surahId, fromAyah, toAyah);
            } else {
                showNotification('بيانات غير صحيحة', 'error');
            }
        });
        form.dataset.listening = 'true';
    }
}

// Bridges HTML onclick → competitionManager
export function showHint() {
    competitionManager.showHint();
}

export function checkMemorization() {
    if (competitionManager.checkLevelComplete()) {
        competitionManager.levelUp();
    } else {
        showNotification('لم تكتمل جميع الكلمات بعد', 'warning');
    }
}

export function nextLevel() {
    competitionManager.levelUp();
}

export function stopHifzSession() {
    competitionManager.stopSession();
}
