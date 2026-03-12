// frontend/src/services/competition.js
import { Logger } from '../core/logger.js';
import { config } from '../core/config.js';
import { state, saveData } from '../core/state.js';
import { showNotification } from '../core/ui.js';

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
            startTime: Date.now()
        };
    },

    // Démarrer un défi
    startChallenge(type) {
        const challenge = this.generateChallenge(type);
        state.competition.activeChallenge = challenge;
        window.QuranReview.renderCompetitionPage(); // Switch view

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
            const surah = config.surahs.find(s => s.id === surahId);
            const ayahNum = Math.floor(Math.random() * surah.ayahs) + 1;
            questions.push({ surah, ayahNum });
        }

        const renderQuestion = async (index) => {
            if (index >= maxQuestions) {
                this.endChallenge(score, 'ayah_hunt');
                return;
            }

            const q = questions[index];
            const text = await window.QuranReview.fetchAyahText(q.surah.id, q.ayahNum);

            // Generate options (1 correct + 3 wrong)
            const options = [q.surah];
            while(options.length < 4) {
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

        if (competitionManager.normalizeArabic(userWord) === competitionManager.normalizeArabic(currentItem.word)) {
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
            date: new Date().toISOString()
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
        if(confirm('هل أنت متأكد من الانسحاب؟')) {
            clearInterval(this.activeTimer);
            state.competition.activeChallenge = null;
            window.QuranReview.renderCompetitionPage();
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
            name: state.settings.userName || 'أنت',
            score: score,
            date: new Date().toISOString(),
            rank: this.calculateRank(state.competition.userStats.totalScore).name
        };

        // Add to local leaderboard for demo
        let board = state.competition.leaderboard || [];
        board.push(entry);

        try {
            const token = localStorage.getItem(config.apiTokenKey);
            if (token) {
                const response = await fetch(`${config.apiBaseUrl}/api/leaderboard/`, {
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
        const board = state.competition.leaderboard || [];
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
            const token = localStorage.getItem(config.apiTokenKey);
            if (!token) {
                // Fallback to local leaderboard if not authenticated
                this.renderLocalLeaderboard();
                return;
            }

            const response = await fetch(`${config.apiBaseUrl}/api/leaderboard/`, {
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

        // Reset UI
        this.hintsRemaining = 3;
        document.getElementById('hints-count').textContent = this.hintsRemaining;

        // Render
        window.QuranReview.renderHifzPage();

        // Load content
        this.loadAyahForHifz(surahId, fromAyah);
    },

    async loadAyahForHifz(surahId, ayahNumber) {
        const container = document.getElementById('hifz-display');
        container.innerHTML = '<div style="text-align:center;">⏳ جاري التحميل...</div>';

        const ayahText = await window.QuranReview.fetchAyahText(surahId, ayahNumber);

        if (!ayahText) {
            container.innerHTML = '<div style="text-align:center; color:red;">❌ خطأ في تحميل الآية</div>';
            return;
        }

        const analysis = window.QuranReview.hifzEngine.generateMaskLevel(ayahText, state.hifz.currentSession.level);
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

            state.hifz.currentSession.score += 10;
            saveData();

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
            showNotification('نفذت التلميحات', 'warning');
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
        state.hifz.currentSession.score = Math.max(0, state.hifz.currentSession.score - 5);
        saveData();
    },

    checkLevelComplete() {
        return document.querySelectorAll('.word.hidden').length === 0;
    },

    levelUp() {
        // Hide feedback
        const feedback = document.getElementById('hifz-feedback');
        feedback.classList.remove('show');
        setTimeout(() => feedback.classList.add('hidden'), 300);

        const session = state.hifz.currentSession;
        if(session.level < 5) {
            session.level++;
            showNotification(`المستوى ${session.level}`, 'success');
            this.loadAyahForHifz(session.surahId, session.currentAyah);
        } else {
            // Next Ayah or Finish
            if (session.currentAyah < session.toAyah) {
                session.currentAyah++;
                session.level = 1;
                showNotification(`الآية التالية: ${session.currentAyah}`, 'success');
                this.loadAyahForHifz(session.surahId, session.currentAyah);
            } else {
                this.completeSession();
            }
        }
        saveData();
    },

    updateLevelDisplay() {
        const dots = document.querySelectorAll('.level-dots .dot');
        const level = state.hifz.currentSession.level;
        dots.forEach((dot, idx) => {
            if (idx < level) dot.classList.add('active');
            else dot.classList.remove('active');
        });
    },

    completeSession() {
        const session = state.hifz.currentSession;
        const timeTaken = (Date.now() - session.startTime) / 1000;

        // Save completion
        // Ensure history exists
        if (!state.hifz.history) state.hifz.history = [];

        state.hifz.history.push({
            surahId: session.surahId,
            fromAyah: session.fromAyah,
            toAyah: session.toAyah,
            score: session.score,
            date: new Date().toISOString(),
            timeTaken
        });

        // Reset session
        state.hifz.currentSession = { isActive: false };
        saveData();

        // Show Feedback
        alert(`🎉 أحسنت! أكملت الجلسة بنجاح.\nالنقاط: ${session.score}`);

        // Return to selection
        window.QuranReview.renderHifzPage();
    },

    stopSession() {
        if (confirm('هل أنت متأكد من إنهاء الجلسة؟ سيتم فقدان التقدم الحالي.')) {
            state.hifz.currentSession = { isActive: false };
            saveData();
            window.QuranReview.renderHifzPage();
        }
    }
};
