// State central — extrait de frontend/script.js
import { Logger } from './logger.js';
import { config } from './config.js';

export const state = {
    currentPage: 'home',
    memorizationData: [],
    tasks: [],
    competition: {},
    hifz: {},
    settings: { ...config.defaultSettings },
    todayDate: new Date().toISOString().split('T')[0],
    imageQuality: 'normal',
    user: null,
    wardPlayer: null
};

export function loadData() {
    try {
        // Load settings with SEPARATE KEY
        const savedSettings = localStorage.getItem(config.settingsKey);
        state.settings = savedSettings ?
            JSON.parse(savedSettings) :
            { ...config.defaultSettings };

        // Apply debug mode from settings
        if (state.settings.debugMode !== undefined) {
            Logger.debugMode = state.settings.debugMode;
        }

        // Load competition data
        const savedCompetition = localStorage.getItem(config.competitionKey);
        state.competition = savedCompetition ?
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
        const savedHifz = localStorage.getItem(config.hifzKey);
        state.hifz = savedHifz ?
            JSON.parse(savedHifz) :
            { currentSession: null, level: 1 };

        Logger.store('LOAD', config.settingsKey);
        Logger.state('settings', state.settings);

        // Load memorization data with storage key
        const savedData = localStorage.getItem(config.storageKey);
        state.memorizationData = savedData ?
            JSON.parse(savedData) :
            getDefaultMemorizationData();

        const savedTasks = localStorage.getItem(config.tasksKey);
        state.tasks = savedTasks ? JSON.parse(savedTasks) : [];

        Logger.store('LOAD', config.storageKey);
        Logger.log('APP', 'All data loaded successfully');
    } catch (error) {
        Logger.error('APP', 'Error loading data', error);
        state.settings = { ...config.defaultSettings };
        state.memorizationData = getDefaultMemorizationData();
        state.tasks = [];
    }
}

export function saveData() {
    try {
        // Save settings with SEPARATE KEY
        localStorage.setItem(config.settingsKey, JSON.stringify(state.settings));

        // Save memorization data with storage key
        localStorage.setItem(config.storageKey, JSON.stringify(state.memorizationData));

        // Save competition data
        localStorage.setItem(config.competitionKey, JSON.stringify(state.competition));

        // Save hifz data
        localStorage.setItem(config.hifzKey, JSON.stringify(state.hifz));

        Logger.store('SAVE', 'all keys');
        Logger.log('APP', 'Data saved successfully');
    } catch (error) {
        Logger.error('APP', 'Error saving data', error);
    }
}

export function getDefaultMemorizationData() {
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
}
