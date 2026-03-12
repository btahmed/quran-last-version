// frontend/src/services/hifz.js
import { Logger } from '../core/logger.js';
import { state, saveData } from '../core/state.js';
import { showNotification } from '../core/ui.js';

// ===================================
// HIFZ ENGINE — analyse et masquage des mots
// ===================================

export const hifzEngine = {
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

        const complex = word.match(/[َُِّْٓۖۗ]/g);
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

        for (let i = 0; i < wordsToHide; i++) {
            if (sorted[i]) sorted[i].isHidden = true;
        }

        // Remettre dans l'ordre
        return analysis.sort((a, b) => a.index - b.index);
    }
};

// ===================================
// HIFZ SESSION MANAGEMENT
// ===================================

// Nombre de hints disponibles par session (état local au module)
let hintsRemaining = 3;

export function startHifzSession(surahId, fromAyah, toAyah) {
    Logger.log('APP', `Starting Hifz: ${surahId}:${fromAyah}-${toAyah}`);

    // Mettre à jour l'état
    state.hifz.currentSession = {
        isActive: true,
        surahId,
        fromAyah,
        toAyah,
        currentAyah: fromAyah,
        level: 1,
        score: 0,
        startTime: Date.now()
    };
    saveData();

    // Réinitialiser l'UI
    hintsRemaining = 3;
    const hintsEl = document.getElementById('hints-count');
    if (hintsEl) hintsEl.textContent = hintsRemaining;

    // Rendre la page hifz via la façade globale
    window.QuranReview.renderHifzPage();

    // Charger le contenu
    loadAyahForHifz(surahId, fromAyah);
}

export async function loadAyahForHifz(surahId, ayahNumber) {
    const container = document.getElementById('hifz-display');
    container.innerHTML = '<div style="text-align:center;">⏳ جاري التحميل...</div>';

    // fetchAyahText reste sur la façade globale
    const ayahText = await window.QuranReview.fetchAyahText(surahId, ayahNumber);

    if (!ayahText) {
        container.innerHTML = '<div style="text-align:center; color:red;">❌ خطأ في تحميل الآية</div>';
        return;
    }

    const analysis = hifzEngine.generateMaskLevel(ayahText, state.hifz.currentSession.level);
    renderHifzDisplay(analysis);
    updateLevelDisplay();
}

export function renderHifzDisplay(wordAnalysis) {
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

        if (item.isHidden) {
            span.onclick = () => attemptReveal(span, item.word);
        }

        line.appendChild(span);
    });

    container.appendChild(line);
}

export function attemptReveal(spanElement, correctWord) {
    // Empêcher de cliquer sur un mot déjà révélé
    if (!spanElement.classList.contains('hidden')) return;

    const input = prompt('ما هذه الكلمة؟');
    if (input === null) return; // Annulé

    if (normalizeArabic(input) === normalizeArabic(correctWord)) {
        // Correct
        spanElement.classList.remove('hidden');
        spanElement.classList.add('revealed');
        spanElement.textContent = correctWord;
        spanElement.onclick = null; // Supprimer le handler

        state.hifz.currentSession.score += 10;
        saveData();

        // Vérifier si le niveau est complet
        if (checkLevelComplete()) {
            setTimeout(() => {
                const feedback = document.getElementById('hifz-feedback');
                if (feedback) {
                    feedback.classList.remove('hidden');
                    feedback.classList.add('show');
                }
            }, 500);
        }
    } else {
        // Animation d'erreur
        spanElement.style.backgroundColor = '#f8d7da'; // Rouge clair
        setTimeout(() => spanElement.style.backgroundColor = '', 500);
    }
}

export function normalizeArabic(text) {
    if (!text) return '';
    return text
        .replace(/[\u064B-\u065F\u0670\u0640]/g, '') // Supprimer le tashkeel
        .replace(/[إأآا]/g, 'ا')
        .replace(/ى/g, 'ي')
        .replace(/ة/g, 'ه')
        .trim();
}

export function showHint() {
    if (hintsRemaining <= 0) {
        showNotification('نفذت التلميحات', 'warning');
        return;
    }

    const hiddenWords = document.querySelectorAll('.word.hidden');
    if (hiddenWords.length === 0) return;

    const randomWord = hiddenWords[Math.floor(Math.random() * hiddenWords.length)];

    // Révéler visuellement comme indice
    randomWord.classList.remove('hidden');
    randomWord.classList.add('revealed-hint');
    randomWord.textContent = randomWord.dataset.word;
    randomWord.onclick = null; // Plus besoin de deviner

    hintsRemaining--;
    const hintsEl = document.getElementById('hints-count');
    if (hintsEl) hintsEl.textContent = hintsRemaining;

    // Pénalité de score
    state.hifz.currentSession.score = Math.max(0, state.hifz.currentSession.score - 5);
    saveData();
}

export function checkLevelComplete() {
    return document.querySelectorAll('.word.hidden').length === 0;
}

export function nextLevel() {
    levelUp();
}

export function levelUp() {
    // Masquer le feedback
    const feedback = document.getElementById('hifz-feedback');
    if (feedback) {
        feedback.classList.remove('show');
        setTimeout(() => feedback.classList.add('hidden'), 300);
    }

    const session = state.hifz.currentSession;
    if (session.level < 5) {
        session.level++;
        showNotification(`المستوى ${session.level}`, 'success');
        loadAyahForHifz(session.surahId, session.currentAyah);
    } else {
        // Ayah suivante ou fin
        if (session.currentAyah < session.toAyah) {
            session.currentAyah++;
            session.level = 1;
            showNotification(`الآية التالية: ${session.currentAyah}`, 'success');
            loadAyahForHifz(session.surahId, session.currentAyah);
        } else {
            completeSession();
        }
    }
    saveData();
}

export function updateLevelDisplay() {
    const dots = document.querySelectorAll('.level-dots .dot');
    const level = state.hifz.currentSession.level;
    dots.forEach((dot, idx) => {
        if (idx < level) dot.classList.add('active');
        else dot.classList.remove('active');
    });
}

export function completeSession() {
    const session = state.hifz.currentSession;
    const timeTaken = (Date.now() - session.startTime) / 1000;

    // Sauvegarder la complétion
    if (!state.hifz.history) state.hifz.history = [];

    state.hifz.history.push({
        surahId: session.surahId,
        fromAyah: session.fromAyah,
        toAyah: session.toAyah,
        score: session.score,
        date: new Date().toISOString(),
        timeTaken
    });

    // Réinitialiser la session
    state.hifz.currentSession = { isActive: false };
    saveData();

    // Afficher le résultat
    alert(`أحسنت! أكملت الجلسة بنجاح.\nالنقاط: ${session.score}`);

    // Retourner à la sélection via la façade globale
    window.QuranReview.renderHifzPage();
}

export function stopHifzSession() {
    if (confirm('هل أنت متأكد من إنهاء الجلسة؟ سيتم فقدان التقدم الحالي.')) {
        state.hifz.currentSession = { isActive: false };
        saveData();
        window.QuranReview.renderHifzPage();
    }
}
