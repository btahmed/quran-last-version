// frontend/src/services/competition.js
import { Logger } from '../core/logger.js';
import { config } from '../core/config.js';
import { state, saveData } from '../core/state.js';
import { showNotification } from '../core/ui.js';
import * as supabaseLeaderboard from './supabase-leaderboard.js';
import * as supabaseTasks from './supabase-tasks.js';

export const competitionManager = {
    // Générer un défi
    generateChallenge(type, difficulty = 'medium') {
        // Simple pool generation
        const totalSurahs = 114;
        const randomSurah = Math.floor(Math.random() * totalSurahs) + 1;

        return {
            type,
            difficulty,
            surahId: randomSurah,
            startTime: Date.now(),
        };
    },

    // Démarrer un défi
    startChallenge(type) {
        const challenge = this.generateChallenge(type);
        state.competition.activeChallenge = challenge;
        window.QuranReview.renderCompetitionPage(); // Switch view

        const container = document.getElementById('competition-active');
        container.innerHTML =
            '<div style="text-align:center; padding: 2rem;">⏳ جاري إعداد التحدي...</div>';

        // Route to specific game logic
        switch (type) {
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
        const maxQuestions = 10;
        const questions = [];

        // Pre-fetch questions
        for (let i = 0; i < maxQuestions; i++) {
            // Weighted random for better UX (focus on common surahs first?)
            // For now completely random
            const surahId = Math.floor(Math.random() * 114) + 1;
            const surah = config.surahs.find(s => s.id === surahId);
            const ayahNum = Math.floor(Math.random() * surah.ayahs) + 1;
            questions.push({ surah, ayahNum });
        }

        const renderQuestion = async index => {
            if (index >= maxQuestions) {
                this.endChallenge(score, 'ayah_hunt');
                return;
            }

            const q = questions[index];
            const text = await window.QuranReview.fetchAyahText(q.surah.id, q.ayahNum);

            // Generate options (1 correct + 3 wrong)
            const options = [q.surah];
            while (options.length < 4) {
                const randomS = config.surahs[Math.floor(Math.random() * 114)];
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
                    <div class="arabic-large" style="background:#f8f9fa; padding:2rem; border-radius:12px; margin-bottom:2rem;" id="hunt-ayah-text"></div>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;" id="hunt-options"></div>
                    <button class="btn btn-danger" style="margin-top:2rem;" id="hunt-abort">انسحاب</button>
                </div>
            `;

            // Use textContent to safely display API-sourced ayah text
            document.getElementById('hunt-ayah-text').textContent = text || 'جاري التحميل...';

            // Build option buttons via DOM to avoid onclick interpolation
            const optionsEl = document.getElementById('hunt-options');
            options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'btn btn-outline';
                btn.style.cssText = 'width:100%; padding:1rem;';
                btn.textContent = `سورة ${opt.name}`;
                btn.addEventListener('click', () => {
                    this.handleHuntAnswer(opt.id === q.surah.id, index, score);
                });
                optionsEl.appendChild(btn);
            });

            document.getElementById('hunt-abort').addEventListener('click', () => {
                this.abortChallenge();
            });
        };

        // Global handler hack for the generated HTML
        this.handleHuntAnswer = (isCorrect, currentIndex, _currentScore) => {
            if (isCorrect) {
                score += 100; // + Time bonus logic could be added
                showNotification('إجابة صحيحة! +100', 'success');
            } else {
                showNotification('إجابة خاطئة', 'error');
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
            surah = config.surahs.find(s => s.id === surahId);
        } while (surah.ayahs < 5);

        const startAyah = Math.floor(Math.random() * (surah.ayahs - 4)) + 1;
        const endAyah = startAyah + 4;

        container.innerHTML = `<div style="text-align:center;">⏳ جاري تحميل الآيات...</div>`;

        // Fetch all texts
        const texts = [];
        for (let i = startAyah; i <= endAyah; i++) {
            texts.push(await window.QuranReview.fetchAyahText(surahId, i));
        }

        let timeLeft = 300; // 5 minutes
        let timerInterval;

        const startMemorization = () => {
            container.innerHTML = `
                <div class="card">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                        <h3 id="sr-surah-title"></h3>
                        <div style="font-size:1.5rem; font-weight:bold; color:var(--accent-red);" id="sr-timer">05:00</div>
                    </div>
                    <div class="arabic-text" style="line-height:2.5; margin-bottom:2rem;" id="sr-texts"></div>
                    <button class="btn btn-primary" style="width:100%;" id="sr-start-test">
                        انتهيت من الحفظ - ابدأ الاختبار
                    </button>
                </div>
            `;

            document.getElementById('sr-surah-title').textContent =
                `سورة ${surah.name} (${startAyah}-${endAyah})`;

            const textsEl = document.getElementById('sr-texts');
            texts.forEach((t, i) => {
                const span = document.createElement('span');
                span.style.cssText = 'display:block; margin-bottom:1rem;';
                span.textContent = `(${startAyah + i}) ${t}`;
                textsEl.appendChild(span);
            });

            document.getElementById('sr-start-test').addEventListener('click', () => {
                this.startSpeedTest(surahId, startAyah, endAyah);
            });

            timerInterval = setInterval(() => {
                timeLeft--;
                const m = Math.floor(timeLeft / 60)
                    .toString()
                    .padStart(2, '0');
                const s = (timeLeft % 60).toString().padStart(2, '0');
                const timerEl = document.getElementById('sr-timer');
                if (timerEl) timerEl.textContent = `${m}:${s}`;

                if (timeLeft <= 0) {
                    clearInterval(timerInterval);
                    this.startSpeedTest(surahId, startAyah, endAyah);
                }
            }, 1000);

            // Save interval to clear it later
            this.activeTimer = timerInterval;
        };

        this.startSpeedTest = async (_sid, _start, _end) => {
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

            texts.forEach((text, _idx) => {
                const words = text.split(' ');
                const div = document.createElement('div');
                div.className = 'arabic-text';
                div.style.marginBottom = '1rem';

                words.forEach((word, _wIdx) => {
                    // Mask random words (every ~3rd word)
                    if (Math.random() < 0.4) {
                        totalBlanks++;
                        const input = document.createElement('input');
                        input.type = 'text';
                        input.className = 'form-input';
                        input.style.width = '80px';
                        input.style.display = 'inline-block';
                        input.style.margin = '0 5px';
                        input.dataset.correct = competitionManager.normalizeArabic(word);
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
                if (competitionManager.normalizeArabic(input.value) === input.dataset.correct) {
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
        const surah = config.surahs.find(s => s.id === surahId);
        const ayahNum = Math.floor(Math.random() * surah.ayahs) + 1;
        const text = await window.QuranReview.fetchAyahText(surahId, ayahNum);

        // Using Hifz Engine to generate 100% mask (Level 5)
        const analysis = window.QuranReview.hifzEngine.generateMaskLevel(text, 5);

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
            score: 0,
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

        if (
            competitionManager.normalizeArabic(userWord) ===
            competitionManager.normalizeArabic(currentItem.word)
        ) {
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
        const stats = state.competition.userStats;
        stats.totalScore += score;
        stats.challengesPlayed++;
        if (score > 0) stats.challengesWon++; // Assume positive score is a win
        stats.winStreak = score > 0 ? stats.winStreak + 1 : 0;

        stats.history.push({
            type,
            score,
            date: new Date().toISOString(),
        });

        // Update Rank
        stats.rank = this.calculateRank(stats.totalScore).level;

        // Update Leaderboard (Simulated local for now)
        this.updateLeaderboard(score);

        saveData();

        // Reset
        state.competition.activeChallenge = null;

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
        if (confirm('هل أنت متأكد من الانسحاب؟')) {
            clearInterval(this.activeTimer);
            state.competition.activeChallenge = null;
            window.QuranReview.renderCompetitionPage();
        }
    },

    // Système de rangs
    calculateRank(totalScore) {
        if (totalScore >= 50000) return { name: 'شيخ', icon: '👑', level: 'diamond' };
        if (totalScore >= 15000) return { name: 'أستاذ', icon: '💎', level: 'platinum' };
        if (totalScore >= 5000) return { name: 'حافظ', icon: '🥇', level: 'gold' };
        if (totalScore >= 1000) return { name: 'طالب', icon: '🥈', level: 'silver' };
        return { name: 'مبتدئ', icon: '🥉', level: 'bronze' };
    },

    async updateLeaderboard(score) {
        const entry = {
            name: state.settings.userName || 'أنت',
            score: score,
            date: new Date().toISOString(),
            rank: this.calculateRank(state.competition.userStats.totalScore).name,
        };

        // Add to local leaderboard for demo
        const board = state.competition.leaderboard || [];
        board.push(entry);

        try {
            // Migration Supabase
            const { data, error } = await supabaseLeaderboard.getLeaderboard();
            if (!error && data) {
                this.renderLeaderboardData(data);
                return;
            }
        } catch (error) {
            Logger.error('LEADERBOARD', 'Failed to update leaderboard', error);
        }

        // Fallback to local leaderboard
        this.renderLocalLeaderboard();
    },

    renderLocalLeaderboard() {
        const board = state.competition.leaderboard || [];
        this.renderLeaderboardData(board);
    },

    renderLeaderboardData(board) {
        const list = document.getElementById('leaderboard-list');
        if (!list) return;

        if (board.length === 0) {
            list.innerHTML =
                '<div style="text-align:center; color:gray; padding:2rem;">لا توجد سجلات بعد</div>';
            return;
        }

        list.innerHTML = '';
        board.forEach((entry, idx) => {
            const rankIcon = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`;

            const row = document.createElement('div');
            row.style.cssText = `display:flex; justify-content:space-between; align-items:center; padding:0.75rem; border-bottom:1px solid var(--border-color); background: ${idx < 3 ? 'var(--bg-accent)' : 'transparent'};`;

            const left = document.createElement('div');
            left.style.cssText = 'display:flex; align-items:center; gap:0.5rem;';

            const iconSpan = document.createElement('span');
            iconSpan.style.fontSize = '1.2rem';
            iconSpan.textContent = rankIcon;

            const nameSpan = document.createElement('span');
            nameSpan.style.fontWeight = '600';
            nameSpan.textContent = entry.name || 'مستخدم';

            left.appendChild(iconSpan);
            left.appendChild(nameSpan);

            if (entry.rank) {
                const badge = document.createElement('span');
                badge.className = `user-badge ${entry.rank.toLowerCase()}`;
                badge.textContent = entry.rank;
                left.appendChild(badge);
            }

            const right = document.createElement('div');
            right.style.textAlign = 'right';

            const scoreDiv = document.createElement('div');
            scoreDiv.style.cssText = 'font-weight:bold; color:var(--accent-green);';
            scoreDiv.textContent = entry.score || entry.total_points || 0;

            const label = document.createElement('div');
            label.style.cssText = 'font-size:0.8rem; color:var(--text-secondary);';
            label.textContent = 'نقطة';

            right.appendChild(scoreDiv);
            right.appendChild(label);

            row.appendChild(left);
            row.appendChild(right);
            list.appendChild(row);
        });
    },

    async renderLeaderboard() {
        const list = document.getElementById('leaderboard-list');
        if (!list) return;

        try {
            // Fetch real leaderboard from API
            const token = localStorage.getItem(config.apiTokenKey);
            if (!token) {
                // Fallback to local leaderboard if not authenticated
                this.renderLocalLeaderboard();
                return;
            }

            // Migration Supabase
            const { data, error } = await supabaseLeaderboard.getLeaderboard();
            if (!error && data) {
                this.renderLeaderboardData(data);
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
    // HIFZ SESSION MANAGEMENT v2 — enfants
    // ===================================

    // État interne du jeu hifz
    _hifzWords: null,
    _hifzCurrentIdx: 0,
    _hifzReadyAction: 'quiz', // 'quiz' | 'next-ayah'
    _hifzDistractorPool: [], // mots des ayahs voisines pour les distracteurs
    _hifzOrdering: null, // état de la phase 3 (remise en ordre)
    _hifzBismillah: null, // texte bismillah extrait de l'ayah (affiché en déco, pas testé)
    _hifzLinkedTaskId: null, // ID du devoir lié (pour notifier le prof)

    startHifzSession(surahId, fromAyah, toAyah) {
        state.hifz.currentSession = {
            isActive: true,
            surahId,
            fromAyah,
            toAyah,
            currentAyah: fromAyah,
            score: 0,
            startTime: Date.now(),
        };
        saveData();
        // renderHifzPage() appelle init() qui appellera _loadAyahWords
        window.QuranReview.renderHifzPage();
    },

    async _loadAyahWords(surahId, ayahNum) {
        const display = document.getElementById('hifz-ayah-display');
        const info = document.getElementById('hifz-ayah-info');
        const bar = document.getElementById('hifz-progress-bar');

        if (display)
            display.innerHTML =
                '<div style="text-align:center;padding:2rem;font-size:1.4rem;">⏳</div>';
        if (info) info.textContent = `الآية ${ayahNum}`;
        if (bar) bar.style.display = 'none';
        this._hifzOrdering = null;

        // Charger l'ayah + les voisines en parallèle (mots des voisines = meilleurs distracteurs)
        const [text, prevText, nextText] = await Promise.all([
            window.QuranReview.fetchAyahText(surahId, ayahNum),
            ayahNum > 1
                ? window.QuranReview.fetchAyahText(surahId, ayahNum - 1)
                : Promise.resolve(''),
            window.QuranReview.fetchAyahText(surahId, ayahNum + 1),
        ]);

        if (!text) {
            if (display)
                display.innerHTML =
                    '<div style="text-align:center;color:red;padding:1rem;">❌ خطأ في تحميل الآية</div>';
            return;
        }

        // Nettoyer les caractères zero-width qui peuvent couper des mots arabes (U+200B etc.)
        const _clean = s =>
            s
                .replace(/\u200B/g, '') // zero-width space
                .replace(/\u200C/g, '') // zero-width non-joiner
                .replace(/\u200D/g, '') // zero-width joiner
                .replace(/\uFEFF/g, '') // BOM
                .trim();

        const words = _clean(text).split(/\s+/).filter(Boolean);

        // Détecter la Bismillah au début de l'ayah (API l'inclut pour ayah 1 de chaque sourate)
        const BISMILLAH_NORMS = ['بسم', 'الله', 'الرحمن', 'الرحيم'];
        const hasBismillah =
            words.length >= 4 &&
            BISMILLAH_NORMS.every((bw, i) => this.normalizeArabic(words[i]) === bw);

        if (hasBismillah) {
            this._hifzBismillah = words.slice(0, 4).join(' ');
            this._hifzWords = words.slice(4);
        } else {
            this._hifzBismillah = null;
            this._hifzWords = words;
        }

        this._hifzDistractorPool = [
            ...(prevText ? _clean(prevText).split(/\s+/).filter(Boolean) : []),
            ...(nextText ? _clean(nextText).split(/\s+/).filter(Boolean) : []),
        ];
        this._showMemorizePhase();

        // Stopper l'audio précédent puis jouer la nouvelle ayah
        window.QuranReview.stopHifzAudio?.();
        window.QuranReview.playHifzAudio();
    },

    _showMemorizePhase() {
        this._hifzReadyAction = 'quiz';
        this._renderAyahDisplay(null);

        const memPhase = document.getElementById('hifz-memorize-phase');
        const quizPhase = document.getElementById('hifz-quiz-phase');
        const orderingPhase = document.getElementById('hifz-ordering-phase');
        const feedback = document.getElementById('hifz-feedback');
        const bar = document.getElementById('hifz-progress-bar');
        const readyBtn = document.getElementById('hifz-ready-btn');

        if (memPhase) memPhase.style.display = 'block';
        if (quizPhase) quizPhase.style.display = 'none';
        if (orderingPhase) orderingPhase.style.display = 'none';
        if (feedback) {
            feedback.textContent = '';
            feedback.className = 'hifz-feedback';
        }
        if (bar) bar.style.display = 'none';
        if (readyBtn) readyBtn.textContent = '✓ حفظتها، ابدأ الاختبار';

        const scoreEl = document.getElementById('hifz-score');
        if (scoreEl) scoreEl.textContent = `النقاط: ${state.hifz.currentSession.score}`;
    },

    _renderAyahDisplay(hiddenIdx) {
        const display = document.getElementById('hifz-ayah-display');
        if (!display || !this._hifzWords) return;
        display.innerHTML = '';

        // Bismillah affichée en déco au-dessus de l'ayah (non testée)
        if (this._hifzBismillah) {
            const bsEl = document.createElement('div');
            bsEl.className = 'hifz-bismillah';
            bsEl.textContent = this._hifzBismillah;
            display.appendChild(bsEl);
        }

        this._hifzWords.forEach((w, i) => {
            const span = document.createElement('span');
            if (i === hiddenIdx) {
                span.className = 'hifz-word hifz-word--hidden';
                span.textContent = '░░░░';
            } else if (hiddenIdx !== null && i < hiddenIdx) {
                // Mots déjà trouvés → verts
                span.className = 'hifz-word hifz-word--found';
                span.textContent = w;
            } else {
                span.className = 'hifz-word hifz-word--shown';
                span.textContent = w;
            }
            display.appendChild(span);
        });

        // Barre de progression
        if (hiddenIdx !== null && this._hifzWords.length > 0) {
            const fill = document.getElementById('hifz-progress-fill');
            const bar = document.getElementById('hifz-progress-bar');
            const pct = Math.round((hiddenIdx / this._hifzWords.length) * 100);
            if (bar) bar.style.display = 'block';
            if (fill) fill.style.width = `${pct}%`;
        }
    },

    _startQuiz() {
        this._showQuizWord(0);
    },

    _showQuizWord(idx) {
        const words = this._hifzWords;
        if (!words || idx >= words.length) {
            this._startOrdering();
            return;
        }

        this._hifzCurrentIdx = idx;
        const correctWord = words[idx];

        this._renderAyahDisplay(idx);

        const memPhase = document.getElementById('hifz-memorize-phase');
        const quizPhase = document.getElementById('hifz-quiz-phase');
        const feedback = document.getElementById('hifz-feedback');

        if (memPhase) memPhase.style.display = 'none';
        if (quizPhase) quizPhase.style.display = 'block';
        if (feedback) {
            feedback.textContent = '';
            feedback.className = 'hifz-feedback';
        }

        const choices = this._buildChoices(correctWord, words);
        this._renderChoices(choices, correctWord);
    },

    _buildChoices(correctWord, allWords) {
        const normCorrect = this.normalizeArabic(correctWord);
        const seen = new Set([normCorrect]);

        // Pool : ayahs voisines en priorité → distracteurs plus variés et plus difficiles
        const pool = [];
        for (const w of [...(this._hifzDistractorPool || []), ...allWords]) {
            const norm = this.normalizeArabic(w);
            if (!seen.has(norm)) {
                seen.add(norm);
                pool.push(w);
            }
        }

        // Fisher-Yates sur le pool (élimine le biais de sort(() => Math.random() - 0.5))
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        const distractors = pool.slice(0, 3);

        // Compléter avec des mots de fallback si pas assez de distracteurs uniques
        const fallback = ['الله', 'في', 'من', 'على', 'هو', 'ما', 'لا', 'إن', 'كان'];
        let fi = 0;
        while (distractors.length < 3) {
            const w = fallback[fi++ % fallback.length];
            const norm = this.normalizeArabic(w);
            if (!seen.has(norm)) {
                seen.add(norm);
                distractors.push(w);
            }
        }

        // Fisher-Yates sur les 4 choix finaux pour une vraie distribution uniforme
        const arr = [correctWord, ...distractors];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    },

    _renderChoices(choices, correctWord) {
        const container = document.getElementById('hifz-choices');
        if (!container) return;
        container.innerHTML = '';

        choices.forEach(w => {
            const btn = document.createElement('button');
            btn.className = 'hifz-choice-btn';
            btn.textContent = w; // textContent — sûr contre XSS
            btn.addEventListener('click', () => this._onChoiceClick(btn, w, correctWord));
            container.appendChild(btn);
        });
    },

    _onChoiceClick(btnEl, chosen, correct) {
        document.querySelectorAll('.hifz-choice-btn').forEach(b => {
            b.disabled = true;
        });

        const feedback = document.getElementById('hifz-feedback');
        const session = state.hifz.currentSession;

        if (this.normalizeArabic(chosen) === this.normalizeArabic(correct)) {
            // ✅ Bonne réponse
            btnEl.classList.add('hifz-choice--correct');
            if (feedback) {
                feedback.textContent = '✅ أحسنت!';
                feedback.className = 'hifz-feedback hifz-feedback--success';
            }
            session.score += 10;
            saveData();
            const scoreEl = document.getElementById('hifz-score');
            if (scoreEl) scoreEl.textContent = `النقاط: ${session.score}`;

            setTimeout(() => this._showQuizWord(this._hifzCurrentIdx + 1), 700);
        } else {
            // ❌ Mauvaise réponse
            btnEl.classList.add('hifz-choice--wrong');
            if (feedback) {
                feedback.textContent = '❌ حاول مرة أخرى';
                feedback.className = 'hifz-feedback hifz-feedback--error';
            }
            session.score = Math.max(0, session.score - 3);
            saveData();
            const scoreEl = document.getElementById('hifz-score');
            if (scoreEl) scoreEl.textContent = `النقاط: ${session.score}`;

            setTimeout(() => {
                btnEl.classList.remove('hifz-choice--wrong');
                if (feedback) {
                    feedback.textContent = '';
                    feedback.className = 'hifz-feedback';
                }
                document.querySelectorAll('.hifz-choice-btn').forEach(b => {
                    b.disabled = false;
                });
            }, 700);
        }
    },

    _startOrdering() {
        const words = this._hifzWords;
        if (!words || words.length === 0) {
            this._onAyahComplete();
            return;
        }

        // Fisher-Yates sur les mots de l'ayah
        const scrambled = words.map(word => ({ word, used: false }));
        for (let i = scrambled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [scrambled[i], scrambled[j]] = [scrambled[j], scrambled[i]];
        }
        // S'assurer que l'ordre mélangé ≠ l'ordre original
        if (scrambled.length > 1 && scrambled.every((item, i) => item.word === words[i])) {
            [scrambled[0], scrambled[1]] = [scrambled[1], scrambled[0]];
        }

        this._hifzOrdering = { words, scrambled, nextIdx: 0 };
        this._renderOrderingPhase();
    },

    _renderOrderingPhase() {
        const { words, scrambled, nextIdx } = this._hifzOrdering;

        // Afficher les mots déjà placés (verts) + les blancs restants dans la boîte de l'ayah
        const display = document.getElementById('hifz-ayah-display');
        if (display) {
            display.innerHTML = '';
            words.forEach((w, i) => {
                const span = document.createElement('span');
                if (i < nextIdx) {
                    span.className = 'hifz-word hifz-word--found';
                    span.textContent = w;
                } else {
                    span.className = 'hifz-word hifz-word--hidden';
                    span.textContent = '░░░░';
                }
                display.appendChild(span);
            });
        }

        // Barre de progression
        const fill = document.getElementById('hifz-progress-fill');
        const bar = document.getElementById('hifz-progress-bar');
        if (bar) bar.style.display = 'block';
        if (fill) fill.style.width = `${Math.round((nextIdx / words.length) * 100)}%`;

        // Cacher les autres phases
        const memPhase = document.getElementById('hifz-memorize-phase');
        const quizPhase = document.getElementById('hifz-quiz-phase');
        if (memPhase) memPhase.style.display = 'none';
        if (quizPhase) quizPhase.style.display = 'none';

        // Afficher la phase de remise en ordre
        const orderingPhase = document.getElementById('hifz-ordering-phase');
        if (orderingPhase) orderingPhase.style.display = 'block';

        // Vider le feedback
        const feedback = document.getElementById('hifz-feedback');
        if (feedback) {
            feedback.textContent = '';
            feedback.className = 'hifz-feedback';
        }

        // Construire les boutons des mots mélangés
        const container = document.getElementById('hifz-ordering-choices');
        if (!container) return;
        container.innerHTML = '';
        scrambled.forEach((item, idx) => {
            const btn = document.createElement('button');
            btn.className = 'hifz-choice-btn';
            btn.textContent = item.word; // textContent — sûr XSS
            btn.disabled = item.used;
            if (!item.used) {
                btn.addEventListener('click', () => this._onOrderingChoice(btn, item.word, idx));
            }
            container.appendChild(btn);
        });
    },

    _onOrderingChoice(btnEl, word, scrambledIdx) {
        const { words, nextIdx } = this._hifzOrdering;
        const expected = words[nextIdx];
        const feedback = document.getElementById('hifz-feedback');
        const session = state.hifz.currentSession;

        if (this.normalizeArabic(word) === this.normalizeArabic(expected)) {
            // Désactiver tous les boutons pendant la transition
            document.querySelectorAll('#hifz-ordering-choices .hifz-choice-btn').forEach(b => {
                b.disabled = true;
            });
            btnEl.classList.add('hifz-choice--correct');
            if (feedback) {
                feedback.textContent = '✅ أحسنت!';
                feedback.className = 'hifz-feedback hifz-feedback--success';
            }

            this._hifzOrdering.scrambled[scrambledIdx].used = true;
            this._hifzOrdering.nextIdx++;
            session.score += 5;
            saveData();
            const scoreEl = document.getElementById('hifz-score');
            if (scoreEl) scoreEl.textContent = `النقاط: ${session.score}`;

            if (this._hifzOrdering.nextIdx >= words.length) {
                setTimeout(() => this._onAyahComplete(), 600);
            } else {
                setTimeout(() => this._renderOrderingPhase(), 400);
            }
        } else {
            btnEl.classList.add('hifz-choice--wrong');
            if (feedback) {
                feedback.textContent = '❌ حاول مرة أخرى';
                feedback.className = 'hifz-feedback hifz-feedback--error';
            }
            session.score = Math.max(0, session.score - 3);
            saveData();
            const scoreEl = document.getElementById('hifz-score');
            if (scoreEl) scoreEl.textContent = `النقاط: ${session.score}`;

            setTimeout(() => {
                btnEl.classList.remove('hifz-choice--wrong');
                if (feedback) {
                    feedback.textContent = '';
                    feedback.className = 'hifz-feedback';
                }
            }, 500);
        }
    },

    _onAyahComplete() {
        const session = state.hifz.currentSession;
        const display = document.getElementById('hifz-ayah-display');
        const quizPhase = document.getElementById('hifz-quiz-phase');
        const memPhase = document.getElementById('hifz-memorize-phase');
        const feedback = document.getElementById('hifz-feedback');
        const readyBtn = document.getElementById('hifz-ready-btn');
        const fill = document.getElementById('hifz-progress-fill');
        const bar = document.getElementById('hifz-progress-bar');

        // Afficher tous les mots en vert (avec bismillah si présente)
        if (display && this._hifzWords) {
            display.innerHTML = '';
            if (this._hifzBismillah) {
                const bsEl = document.createElement('div');
                bsEl.className = 'hifz-bismillah';
                bsEl.textContent = this._hifzBismillah;
                display.appendChild(bsEl);
            }
            this._hifzWords.forEach(w => {
                const span = document.createElement('span');
                span.className = 'hifz-word hifz-word--found';
                span.textContent = w;
                display.appendChild(span);
            });
        }

        // Barre 100%
        if (bar) bar.style.display = 'block';
        if (fill) fill.style.width = '100%';

        if (quizPhase) quizPhase.style.display = 'none';
        const orderingPhaseEl = document.getElementById('hifz-ordering-phase');
        if (orderingPhaseEl) orderingPhaseEl.style.display = 'none';

        if (session.currentAyah < session.toAyah) {
            if (feedback) {
                feedback.textContent = '🎉 أحسنت! اضغط للانتقال للآية التالية';
                feedback.className = 'hifz-feedback hifz-feedback--success';
            }
            // Le listener sur hifz-ready-btn vérifie _hifzReadyAction pour savoir quoi faire
            this._hifzReadyAction = 'next-ayah';
            if (memPhase) memPhase.style.display = 'block';
            if (readyBtn) readyBtn.textContent = '← الآية التالية';
        } else {
            if (feedback) {
                feedback.textContent = '🌟 ما شاء الله! أتممت الحفظ بنجاح!';
                feedback.className = 'hifz-feedback hifz-feedback--success';
            }
            if (memPhase) memPhase.style.display = 'none';
            setTimeout(() => this.completeSession(), 2500);
        }
    },

    async _advanceToNextAyah() {
        const session = state.hifz.currentSession;
        session.currentAyah++;
        saveData();
        await this._loadAyahWords(session.surahId, session.currentAyah);
    },

    normalizeArabic(text) {
        if (!text) return '';
        return text
            .replace(/[ً-ٰٟـ]/g, '') // tashkeel
            .replace(/[إأآاٱ]/g, 'ا') // toutes variantes alef dont ٱ (wasla uthmani)
            .replace(/ى/g, 'ي')
            .replace(/ة/g, 'ه')
            .trim();
    },

    completeSession() {
        const session = state.hifz.currentSession;
        const timeTaken = (Date.now() - session.startTime) / 1000;

        if (!state.hifz.history) state.hifz.history = [];
        state.hifz.history.push({
            surahId: session.surahId,
            fromAyah: session.fromAyah,
            toAyah: session.toAyah,
            score: session.score,
            date: new Date().toISOString(),
            timeTaken,
        });

        // Notifier le prof si la session était liée à un devoir
        if (this._hifzLinkedTaskId) {
            const surah = config.surahs.find(s => s.id === session.surahId);
            const localUser = JSON.parse(localStorage.getItem('quranreview_user') || '{}');
            const studentName = localUser.first_name || localUser.username || '';
            supabaseTasks.notifyTeacherHifzComplete(
                this._hifzLinkedTaskId,
                studentName,
                surah?.name || '',
                session.score
            );
            this._hifzLinkedTaskId = null;
        }

        state.hifz.currentSession = { isActive: false };
        saveData();

        window.QuranReview.stopHifzAudio?.();
        window.QuranReview.renderHifzPage();
    },

    stopSession() {
        state.hifz.currentSession = { isActive: false };
        saveData();
        window.QuranReview.stopHifzAudio?.();
        window.QuranReview.renderHifzPage();
    },
};
