// frontend/src/pages/CompetitionPage.js
import { competitionManager } from '../services/competition.js';
import { state } from '../core/state.js';

if (!document.querySelector('link[href*="CompetitionPage.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/src/pages/CompetitionPage.css';
    document.head.appendChild(link);
}

export function render() {
    return `<div id="competition-page" class="page active">
            <section class="section-pro">
                <div class="container-pro">
                    <h2 class="section-title" style="text-align: center; margin-bottom: var(--space-8);">🏆 التحديات</h2>

                    <!-- Competition Dashboard Container -->
                    <div id="competition-dashboard">
                    <div class="card-gradient-border" style="margin-bottom: var(--space-8);">
                        <div class="card-gradient-border-inner" style="text-align: center; padding: var(--space-8);">
                            <div style="font-size: 5rem; margin-bottom: var(--space-4);">🥇</div>
                            <h3 style="font-size: 1.5rem; font-weight: 700; margin-bottom: var(--space-2);">رتبتك: <span id="user-rank">ذهبي</span></h3>
                            <p style="color: var(--color-text-secondary); margin-bottom: var(--space-4);">لديك <span id="user-points" style="font-weight: 600; color: var(--color-primary);">1,250</span> نقطة</p>

                            <!-- Stats Grid for Competition -->
                            <div class="grid-pro grid-cols-3" style="max-width: 400px; margin: 0 auto var(--space-4);">
                                <div class="card-glass-pro" style="padding: var(--space-3);">
                                    <div style="font-size: 1.25rem; font-weight: 700;" id="comp-wins">0</div>
                                    <div style="font-size: 0.75rem; color: var(--color-text-secondary);">انتصارات</div>
                                </div>
                                <div class="card-glass-pro" style="padding: var(--space-3);">
                                    <div style="font-size: 1.25rem; font-weight: 700;" id="comp-streak">🔥 0</div>
                                    <div style="font-size: 0.75rem; color: var(--color-text-secondary);">متتالية</div>
                                </div>
                                <div class="card-glass-pro" style="padding: var(--space-3);">
                                    <div style="font-size: 1.25rem; font-weight: 700;" id="comp-challenges">0</div>
                                    <div style="font-size: 0.75rem; color: var(--color-text-secondary);">تحديات</div>
                                </div>
                            </div>

                            <div class="progress-glass" style="max-width: 400px; margin: 0 auto;"><div class="fill" style="width: 65%;"></div></div>
                            <p style="font-size: 0.875rem; color: var(--color-text-secondary); margin-top: var(--space-2);">750 نقطة للوصول إلى البلاتينيوم</p>
                        </div>
                    </div>

                    <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: var(--space-6);">🎮 اختر تحدياً</h3>
                    <div class="grid-pro grid-cols-3" style="margin-bottom: var(--space-8);">
                        <div class="card-glass-pro hover-lift" style="text-align: center;">
                            <div style="font-size: 3rem; margin-bottom: var(--space-4);">⚡</div>
                            <h4 style="font-size: 1.125rem; font-weight: 600; margin-bottom: var(--space-2);">السباق</h4>
                            <p style="color: var(--color-text-secondary); font-size: 0.875rem; margin-bottom: var(--space-4);">5 آيات في 5 دقائق</p>
                            <button class="btn btn-glow" onclick="QuranReview.startChallenge('speed_run')">ابدأ</button>
                        </div>
                        <div class="card-glass-pro hover-lift" style="text-align: center;">
                            <div style="font-size: 3rem; margin-bottom: var(--space-4);">🔍</div>
                            <h4 style="font-size: 1.125rem; font-weight: 600; margin-bottom: var(--space-2);">صيد الآية</h4>
                            <p style="color: var(--color-text-secondary); font-size: 0.875rem; margin-bottom: var(--space-4);">حدد السورة من الآية</p>
                            <button class="btn btn-glow" onclick="QuranReview.startChallenge('ayah_hunt')">ابدأ</button>
                        </div>
                        <div class="card-glass-pro hover-lift" style="text-align: center;">
                            <div style="font-size: 3rem; margin-bottom: var(--space-4);">🎯</div>
                            <h4 style="font-size: 1.125rem; font-weight: 600; margin-bottom: var(--space-2);">سيد الدقة</h4>
                            <p style="color: var(--color-text-secondary); font-size: 0.875rem; margin-bottom: var(--space-4);">اكتب الآية بشكل صحيح</p>
                            <button class="btn btn-glow" onclick="QuranReview.startChallenge('precision')">ابدأ</button>
                        </div>
                    </div>

                    <div class="card-glass-pro">
                        <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: var(--space-4);">🏅 لوحة المتصدرين</h3>
                        <div id="leaderboard-list">
                            <div class="memorization-item" style="background: rgba(212, 165, 116, 0.1); border-color: var(--color-gold);">
                                <span style="font-size: 1.5rem; margin-left: var(--space-3);">🥇</span>
                                <div style="flex: 1;"><div style="font-weight: 600;">أحمد</div><div style="font-size: 0.875rem; color: var(--color-text-secondary);">2,400 نقطة</div></div>
                                <span class="badge badge-gold">💎 ماسي</span>
                            </div>
                            <div class="memorization-item">
                                <span style="font-size: 1.5rem; margin-left: var(--space-3);">🥈</span>
                                <div style="flex: 1;"><div style="font-weight: 600;">فاطمة</div><div style="font-size: 0.875rem; color: var(--color-text-secondary);">1,800 نقطة</div></div>
                                <span class="badge badge-primary">🏆 بلاتينيوم</span>
                            </div>
                            <div class="memorization-item">
                                <span style="font-size: 1.5rem; margin-left: var(--space-3);">🥉</span>
                                <div style="flex: 1;"><div style="font-weight: 600;">محمد</div><div style="font-size: 0.875rem; color: var(--color-text-secondary);">1,250 نقطة</div></div>
                                <span class="badge badge-gold">🥇 ذهبي</span>
                            </div>
                        </div>
                    </div>
                    </div><!-- /competition-dashboard -->

                    <!-- Competition Active Container (Hidden by default) -->
                    <div id="competition-active" class="hidden">
                        <div class="card-glass-pro">
                            <div class="flex-pro" style="justify-content: space-between; margin-bottom: var(--space-4);">
                                <span class="badge badge-primary" id="comp-score">النقاط: 0</span>
                                <span class="badge badge-glass" id="comp-timer">⏱️ 05:00</span>
                                <span class="badge badge-gold" id="comp-streak">🔥 0</span>
                            </div>
                            <div id="game-area" style="min-height: 300px; display: flex; align-items: center; justify-content: center;">
                                <!-- Game content populated by JS -->
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>`;
}

export function init() {
    const stats = state.competition.userStats;
    const dashboard = document.getElementById('competition-dashboard');
    const active = document.getElementById('competition-active');

    if (!dashboard || !active) return;

    if (state.competition.activeChallenge) {
        dashboard.classList.add('hidden');
        active.classList.remove('hidden');
    } else {
        dashboard.classList.remove('hidden');
        active.classList.add('hidden');

        // Mettre à jour les stats
        if (stats) {
            const scoreEl = document.getElementById('comp-score');
            if (scoreEl) scoreEl.textContent = stats.totalScore;
            const winsEl = document.getElementById('comp-wins');
            if (winsEl) winsEl.textContent = stats.challengesWon;
            const streakEl = document.getElementById('comp-streak');
            if (streakEl) streakEl.textContent = `🔥 ${stats.winStreak}`;
            const pointsEl = document.getElementById('user-points');
            if (pointsEl) pointsEl.textContent = stats.totalScore;

            const rank = competitionManager.calculateRank(stats.totalScore);
            const rankEl = document.getElementById('user-rank');
            if (rankEl) rankEl.textContent = rank.icon;
        }

        // Afficher le classement
        competitionManager.renderLeaderboard?.();
    }
}

export function startChallenge(type) {
    competitionManager.startChallenge(type);
}
