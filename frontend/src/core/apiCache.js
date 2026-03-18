// frontend/src/core/apiCache.js
// Cache mémoire TTL pour les réponses API — évite les re-fetch sur navigation

const _store = new Map(); // clé → { data, ts }

const TTL = {
    'tasks':                60_000,
    'my-submissions':       60_000,
    'points':               30_000,
    'my-students':         120_000,
    'pending-submissions':  30_000,
    'submissions':          30_000,
    'admin-overview':       60_000,
};

export const apiCache = {
    get(key) {
        const entry = _store.get(key);
        if (!entry) return null;
        const ttl = TTL[key] ?? 60_000;
        if (Date.now() - entry.ts > ttl) {
            _store.delete(key);
            return null;
        }
        return entry.data;
    },

    set(key, data) {
        _store.set(key, { data, ts: Date.now() });
    },

    invalidate(...keys) {
        keys.forEach(k => _store.delete(k));
    },

    clear() {
        _store.clear();
    },
};
