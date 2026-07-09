import { Logger } from './logger.js';
import { config } from './config.js';

// ─── Observer pattern ─────────────────────────────────────────────────────────
// Usage : const unsub = subscribe('user', (newValue) => { ... });  unsub();
// notify('settings') — à appeler manuellement si on mute un objet imbriqué
//   ex : state.settings.theme = 'dark'; notify('settings');

const _observers = new Map();

export function subscribe(key, callback) {
    if (!_observers.has(key)) _observers.set(key, new Set());
    _observers.get(key).add(callback);
    return () => _observers.get(key).delete(callback);
}

export function notify(key) {
    const subs = _observers.get(String(key));
    if (subs) subs.forEach(cb => cb(_stateRaw[String(key)], String(key)));
}

// ─── State brut ───────────────────────────────────────────────────────────────

const _stateRaw = {
    currentPage: 'home',
    memorizationData: [],
    tasks: [],
    competition: {},
    hifz: {},
    settings: { ...config.defaultSettings },
    todayDate: new Date().toISOString().split('T')[0],
    imageQuality: 'normal',
    user: null,
    wardPlayer: null,
};

// ─── Proxy : déclenche les observers sur toute affectation directe ────────────
// state.user = x  →  tous les subscribers de 'user' sont notifiés

export const state = new Proxy(_stateRaw, {
    set(target, key, value) {
        target[key] = value;
        const subs = _observers.get(String(key));
        if (subs) subs.forEach(cb => cb(value, String(key)));
        return true;
    },
});

// ─── Persistence localStorage ─────────────────────────────────────────────────

export function loadData() {
    try {
        const savedSettings = localStorage.getItem(config.settingsKey);
        state.settings = savedSettings ? JSON.parse(savedSettings) : { ...config.defaultSettings };

        if (state.settings.debugMode !== undefined) {
            Logger.debugMode = state.settings.debugMode;
        }

        const savedCompetition = localStorage.getItem(config.competitionKey);
        state.competition = savedCompetition
            ? JSON.parse(savedCompetition)
            : {
                  userStats: {
                      totalScore: 0,
                      winStreak: 0,
                      challengesWon: 0,
                      challengesPlayed: 0,
                      rank: 'bronze',
                      history: [],
                  },
                  activeChallenge: null,
                  leaderboard: [],
              };

        const savedHifz = localStorage.getItem(config.hifzKey);
        if (savedHifz) {
            const parsed = JSON.parse(savedHifz);
            // Migration : ancien format stockait la session pausée dans currentSession
            if (!parsed.pausedSessions) {
                parsed.pausedSessions = [];
                if (parsed.currentSession?.paused) {
                    parsed.pausedSessions.push(parsed.currentSession);
                    parsed.currentSession = { isActive: false };
                }
            }
            state.hifz = parsed;
        } else {
            state.hifz = { currentSession: { isActive: false }, level: 1, pausedSessions: [] };
        }

        Logger.store('LOAD', config.settingsKey);
        Logger.state('settings', state.settings);

        const savedData = localStorage.getItem(config.storageKey);
        state.memorizationData = savedData ? JSON.parse(savedData) : getDefaultMemorizationData();

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
        localStorage.setItem(config.settingsKey, JSON.stringify(state.settings));
        localStorage.setItem(config.storageKey, JSON.stringify(state.memorizationData));
        localStorage.setItem(config.competitionKey, JSON.stringify(state.competition));
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
            reviewCount: 15,
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
            reviewCount: 8,
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
            reviewCount: 0,
        },
    ];
}
