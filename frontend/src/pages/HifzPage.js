// frontend/src/pages/HifzPage.js
import { competitionManager } from '../services/competition.js';
import { state, saveData } from '../core/state.js';
import { config } from '../core/config.js';
import { showNotification } from '../core/ui.js';
import { apiCache } from '../core/apiCache.js';
import { getMyTasks } from '../services/supabase-tasks.js';

// Instance audio unique pour la lecture de l'ayah courante
let _audio = null;

function _stopAudio() {
    if (_audio) {
        _audio.pause();
        _audio.src = '';
        _audio = null;
    }
    const btn = document.getElementById('hifz-audio-btn');
    if (btn) btn.textContent = '🔊 استمع';
}

if (!document.querySelector('link[href*="HifzPage.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/src/pages/HifzPage.css';
    document.head.appendChild(link);
}

export function render() {
    return `<div id="hifz-page" class="page active">
        <section class="k-section">
            <h2 class="k-section-title" style="text-align:center;margin-bottom:var(--space-6);">📖 وضع الحفظ</h2>

            <!-- Raccourcis devoirs hifz -->
            <div id="hifz-homework-shortcuts" class="hifz-homework-section" style="display:none;"></div>

            <!-- Formulaire de démarrage -->
            <div class="card-glass-pro" id="hifz-selection" style="margin-bottom:var(--space-6);">
                <h3 style="font-size:1rem;font-weight:600;margin-bottom:var(--space-4);">اختيار التمرين</h3>
                <form id="hifz-start-form">
                    <div class="form-floating" style="margin-bottom:var(--space-4);">
                        <select id="hifz-surah-select" required>
                            <option value="">-- اختر السورة --</option>
                        </select>
                        <label for="hifz-surah-select">السورة</label>
                    </div>
                    <div class="k-grid2" style="margin-bottom:var(--space-4);">
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
                        <span>🎮</span> ابدأ التمرين
                    </button>
                </form>
            </div>

            <!-- Jeu actif -->
            <div class="card-glass-pro hidden" id="hifz-active-container">

                <!-- En-tête score + info ayah + audio -->
                <div class="hifz-game-header">
                    <div style="display:flex;gap:var(--space-2);">
                        <span class="k-chip k-chip--primary" id="hifz-score">النقاط: 0</span>
                        <span class="k-chip" id="hifz-ayah-info">الآية 1</span>
                    </div>
                    <button class="k-chip hifz-audio-chip" id="hifz-audio-btn">🔊 استمع</button>
                </div>

                <!-- Tracker de progression par ayah (✅ done / 🔄 current / ⬜ pending) -->
                <div id="hifz-ayah-tracker" class="hifz-ayah-tracker"></div>

                <!-- Affichage de l'ayah mot par mot -->
                <div class="hifz-ayah-box" id="hifz-ayah-display"></div>

                <!-- Barre de progression mots -->
                <div class="hifz-progress-bar" id="hifz-progress-bar" style="display:none;">
                    <div class="hifz-progress-fill" id="hifz-progress-fill"></div>
                </div>

                <!-- Phase 1 : mémorisation -->
                <div id="hifz-memorize-phase" style="text-align:center;padding:var(--space-5) 0;">
                    <p class="hifz-instruction">اقرأ الآية بصوت عالٍ، ثم اضغط عندما تحفظها</p>
                    <button class="btn btn-glow" id="hifz-ready-btn">✓ حفظتها، ابدأ الاختبار</button>
                </div>

                <!-- Phase 2 : QCM automatique -->
                <div id="hifz-quiz-phase" style="display:none;text-align:center;padding:var(--space-3) 0;">
                    <p class="hifz-instruction">اختر الكلمة الصحيحة</p>
                    <div class="hifz-choices-grid" id="hifz-choices"></div>
                </div>

                <!-- Phase 3 : Remise en ordre -->
                <div id="hifz-ordering-phase" style="display:none;text-align:center;padding:var(--space-3) 0;">
                    <p class="hifz-instruction">رتّب الكلمات بالترتيب الصحيح ✨</p>
                    <div class="hifz-choices-grid" id="hifz-ordering-choices"></div>
                </div>

                <!-- Retour visuel (bravo / erreur) -->
                <div id="hifz-feedback" class="hifz-feedback" aria-live="polite"></div>

                <!-- Bouton quitter -->
                <div style="text-align:center;margin-top:var(--space-5);">
                    <button class="btn btn-outline-glow" id="hifz-stop-btn">⏹ إيقاف</button>
                </div>
            </div>
        </section>
    </div>`;
}

export async function init() {
    const session = state.hifz.currentSession;
    const selectionDiv = document.getElementById('hifz-selection');
    const containerDiv = document.getElementById('hifz-active-container');
    if (!selectionDiv || !containerDiv) return;

    if (session?.isActive) {
        // Restaurer le lien vers le devoir (perdu si page rechargée)
        if (session.linkedTaskId && !competitionManager._hifzLinkedTaskId) {
            competitionManager._hifzLinkedTaskId = session.linkedTaskId;
        }
        selectionDiv.classList.add('hidden');
        containerDiv.classList.remove('hidden');
        // GSAP scroll-reveal laisse opacity:0 en inline style sur les éléments display:none
        // → les nettoyer pour que le container soit visible dès l'affichage
        containerDiv.style.removeProperty('opacity');
        containerDiv.style.removeProperty('transform');
        containerDiv.style.removeProperty('translate');
        containerDiv.style.removeProperty('rotate');
        containerDiv.style.removeProperty('scale');
        _attachGameListeners();
        competitionManager._loadAyahWords(session.surahId, session.currentAyah);
    } else {
        selectionDiv.classList.remove('hidden');
        containerDiv.classList.add('hidden');
        _populateSurahSelect();
        _setupFormListener();
        // Charger les tâches depuis Supabase si cache vide (accès direct à la page)
        if (!apiCache.get('tasks')) {
            try {
                const { data } = await getMyTasks();
                if (data) apiCache.set('tasks', data);
            } catch (_) {
                /* silencieux — on affiche quand même les devoirs en pause */
            }
        }
        _showHomeworkShortcuts();
    }
}

// Attache les listeners des boutons du jeu (appelé une seule fois au démarrage)
function _attachGameListeners() {
    document.getElementById('hifz-audio-btn')?.addEventListener('click', playHifzAudio);
    document.getElementById('hifz-stop-btn')?.addEventListener('click', stopHifzSession);
    document.getElementById('hifz-ready-btn')?.addEventListener('click', () => {
        if (competitionManager._hifzReadyAction === 'next-ayah') {
            competitionManager._advanceToNextAyah();
        } else {
            competitionManager._startQuiz();
        }
    });
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
        }
    });
}

// Attacher l'écouteur du formulaire de démarrage (une seule fois)
function _setupFormListener() {
    const form = document.getElementById('hifz-start-form');
    if (form && !form.dataset.listening) {
        form.addEventListener('submit', e => {
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

function _showHomeworkShortcuts() {
    const container = document.getElementById('hifz-homework-shortcuts');
    if (!container) return;

    const tasks = (apiCache.get('tasks') || []).filter(
        t => t.type === 'hifz' && typeof t.description === 'string' && t.description.startsWith('{')
    );

    const hifzTasks = [];
    for (const task of tasks) {
        try {
            const parsed = JSON.parse(task.description);
            if (parsed?._hifz) hifzTasks.push({ task, meta: parsed._hifz });
        } catch (_) {
            /* description non-JSON, ignorer */
        }
    }

    // Lire toutes les sessions en pause depuis pausedSessions[]
    const rawPaused = state.hifz.pausedSessions || [];
    // Valider et auto-nettoyer les entrées invalides (fromAyah > toAyah)
    const validPaused = rawPaused.filter(
        s => s.paused && s.fromAyah <= s.toAyah && s.currentAyah <= s.toAyah
    );
    if (validPaused.length !== rawPaused.length) {
        state.hifz.pausedSessions = validPaused;
        saveData();
    }

    if (!hifzTasks.length && !validPaused.length) {
        container.style.display = 'none';
        return;
    }

    container.style.display = '';
    container.replaceChildren();

    const label = document.createElement('p');
    label.className = 'hifz-homework-label';
    label.textContent = 'واجباتك';
    container.appendChild(label);

    // Un bouton "متابعة" par session en pause
    for (const pausedSession of validPaused) {
        const surah = config.surahs.find(s => s.id === pausedSession.surahId);
        const surahName = surah?.name || `سورة ${pausedSession.surahId}`;
        const resumeBtn = document.createElement('button');
        resumeBtn.className = 'btn btn-glow hifz-homework-btn btn-full';
        resumeBtn.textContent = `▶️ متابعة — ${surahName} (من الآية ${pausedSession.currentAyah})`;
        resumeBtn.addEventListener('click', () => {
            competitionManager._hifzLinkedTaskId = pausedSession.linkedTaskId || null;
            state.hifz.currentSession = { ...pausedSession, isActive: true, paused: false };
            // Retirer cette session du tableau des sessions pausées
            state.hifz.pausedSessions = (state.hifz.pausedSessions || []).filter(
                p => p.linkedTaskId !== pausedSession.linkedTaskId
            );
            saveData();
            window.QuranReview.renderHifzPage();
        });
        container.appendChild(resumeBtn);
    }

    // Devoirs disponibles — sauter ceux déjà en pause (éviter le doublon)
    const pausedTaskIds = new Set(validPaused.map(p => p.linkedTaskId).filter(Boolean));
    for (const { task, meta } of hifzTasks) {
        if (pausedTaskIds.has(task.id)) continue;
        const surah = config.surahs.find(s => s.id === meta.surah_id);
        const surahName = surah?.name || `سورة ${meta.surah_id}`;
        const btn = document.createElement('button');
        btn.className = 'btn btn-outline-glow hifz-homework-btn btn-full';
        btn.textContent = `📚 ${task.title} — ${surahName} (${meta.from_ayah}-${meta.to_ayah})`;
        btn.addEventListener('click', () => {
            competitionManager._hifzLinkedTaskId = task.id;
            competitionManager.startHifzSession(meta.surah_id, meta.from_ayah, meta.to_ayah);
        });
        container.appendChild(btn);
    }
}

export function stopHifzSession() {
    _stopAudio();
    competitionManager.stopSession();
}

export function stopHifzAudio() {
    _stopAudio();
}

// Lecture audio de l'ayah courante (everyayah.com — déjà dans le CSP media-src)
export function playHifzAudio() {
    const session = state.hifz.currentSession;
    if (!session?.isActive) return;

    // Toggle : si en cours de lecture → arrêter
    if (_audio) {
        _stopAudio();
        return;
    }

    const surah = String(session.surahId).padStart(3, '0');
    const ayah = String(session.currentAyah).padStart(3, '0');
    const url = `https://everyayah.com/data/Abdul_Basit_Murattal_192kbps/${surah}${ayah}.mp3`;

    const btn = document.getElementById('hifz-audio-btn');
    _audio = new Audio(url);
    if (btn) btn.textContent = '⏸ إيقاف';

    _audio.play().catch(() => {
        showNotification('تعذر تشغيل الصوت 🎧', 'error');
        _stopAudio();
    });
    _audio.addEventListener('ended', _stopAudio);
}
