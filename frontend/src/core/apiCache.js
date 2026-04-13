// frontend/src/core/apiCache.js
// Cache mémoire TTL pour les réponses API — évite les re-fetch sur navigation

const _store = new Map(); // clé → { data, ts }
const MAX_ENTRIES = 50; // Limite mémoire

const TTL = {
    'tasks':                60_000,
    'my-submissions':       60_000,
    'points':               30_000,
    'my-students':         120_000,
    'pending-submissions':  30_000,
    'submissions':          30_000,
    'admin-overview':       60_000,
};

// Nettoie les entrées expirées
function _cleanup() {
    const now = Date.now();
    for (const [key, entry] of _store) {
        const ttl = TTL[key] ?? 60_000;
        if (now - entry.ts > ttl) _store.delete(key);
    }
}

// Supprime les entrées les plus anciennes si limite atteinte
function _evictOldest() {
    if (_store.size <= MAX_ENTRIES) return;
    const sorted = [..._store.entries()].sort((a, b) => a[1].ts - b[1].ts);
    const toRemove = sorted.slice(0, _store.size - MAX_ENTRIES);
    toRemove.forEach(([key]) => _store.delete(key));
}

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
        _cleanup();
        _store.set(key, { data, ts: Date.now() });
        _evictOldest();
    },

    invalidate(...keys) {
        keys.forEach(k => _store.delete(k));
    },

    clear() {
        _store.clear();
    },
};
