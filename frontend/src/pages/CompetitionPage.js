// frontend/src/pages/CompetitionPage.js
import { competitionManager } from '../services/competition.js';
import { state } from '../core/state.js';
import { mountBlock, renderCompetitionBoard } from '../components/PageBlocks.js';
import * as supabaseLeaderboard from '../services/supabase-leaderboard.js';

const CHALLENGES = [
    {
        emoji: '⚡',
        title: 'السباق',
        desc: '5 آيات في 5 دقائق',
        onclick: "QuranReview.startChallenge('speed_run')",
    },
    {
        emoji: '🔍',
        title: 'صيد الآية',
        desc: 'حدد السورة من الآية',
        onclick: "QuranReview.startChallenge('ayah_hunt')",
    },
    {
        emoji: '🎯',
        title: 'سيد الدقة',
        desc: 'اكتب الآية بشكل صحيح',
        onclick: "QuranReview.startChallenge('precision')",
    },
];

const RANK_THRESHOLDS = [
    { min: 0, max: 1000 },
    { min: 1000, max: 5000 },
    { min: 5000, max: 15000 },
    { min: 15000, max: 50000 },
    { min: 50000, max: null },
];

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
                        <div id="competition-host"></div>
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

function buildRankData(totalScore) {
    const rank = competitionManager.calculateRank(totalScore);
    const current =
        [...RANK_THRESHOLDS].reverse().find(level => totalScore >= level.min) || RANK_THRESHOLDS[0];
    const next = RANK_THRESHOLDS.find(level => level.min > totalScore);

    return {
        medal: rank.icon,
        label: rank.name,
        points: totalScore,
        nextAt: next ? next.min - totalScore : null,
        progress: next ? ((totalScore - current.min) / (next.min - current.min)) * 100 : 100,
    };
}

function normalizeLeaders(rows) {
    if (!Array.isArray(rows)) return [];

    return rows
        .map(row => {
            const points = Number(row?.total_points);
            if (!row?.username || !Number.isFinite(points)) return null;

            const rank = competitionManager.calculateRank(points);
            return {
                name: row.username,
                points,
                badge: `${rank.icon} ${rank.name}`,
            };
        })
        .filter(Boolean);
}

async function renderCompetitionDashboard() {
    const stats = state.competition?.userStats;
    const totalScore = Number(stats?.totalScore);
    const rank = Number.isFinite(totalScore) ? buildRankData(totalScore) : null;
    let leaders = [];

    if (state.user?.id) {
        const { data, error } = await supabaseLeaderboard.getLeaderboard();
        if (!error) leaders = normalizeLeaders(data);
    }

    mountBlock(
        'competition-host',
        renderCompetitionBoard({
            rank,
            challenges: CHALLENGES,
            leaders,
        })
    );
}

export async function init() {
    const dashboard = document.getElementById('competition-dashboard');
    const active = document.getElementById('competition-active');

    if (!dashboard || !active) return;

    if (state.competition.activeChallenge) {
        dashboard.classList.add('hidden');
        active.classList.remove('hidden');
    } else {
        dashboard.classList.remove('hidden');
        active.classList.add('hidden');
        await renderCompetitionDashboard();
    }
}

export function startChallenge(type) {
    competitionManager.startChallenge(type);
}
