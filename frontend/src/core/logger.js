export const Logger = {
    debugMode: true,
    _history: [],
    _maxHistory: 500,
    _styles: {
        LOG:   'color: #2d5016; font-weight: bold;',
        WARN:  'color: #ffc107; font-weight: bold;',
        ERROR: 'color: #dc3545; font-weight: bold;',
        CLICK: 'color: #6f42c1; font-weight: bold;',
        API:   'color: #0d6efd; font-weight: bold;',
        NAV:   'color: #20c997; font-weight: bold;',
        AUDIO: 'color: #fd7e14; font-weight: bold;',
        AUTH:  'color: #e83e8c; font-weight: bold;',
        STATE: 'color: #6610f2; font-weight: bold;',
        STORE: 'color: #795548; font-weight: bold;',
    },

    _push(level, category, message, data) {
        const entry = {
            time: new Date().toISOString(),
            ts: new Date().toLocaleTimeString(),
            level,
            category,
            message,
            data: data || null
        };
        this._history.push(entry);
        if (this._history.length > this._maxHistory) this._history.shift();
        return entry;
    },

    log(category, message, data = null) {
        if (!this.debugMode) return;
        const e = this._push('LOG', category, message, data);
        const s = this._styles[category] || this._styles.LOG;
        console.log(`%c[${e.ts}] [${category}] ${message}`, s);
        if (data) console.log('  📝', data);
    },

    error(category, message, error = null) {
        const e = this._push('ERROR', category, message, error);
        console.error(`%c[${e.ts}] [${category}] ❌ ${message}`, this._styles.ERROR);
        if (error) {
            console.error('  🔍 Details:', error);
            if (error.stack) console.error('  Stack:', error.stack);
        }
    },

    warn(category, message, data = null) {
        if (!this.debugMode) return;
        const e = this._push('WARN', category, message, data);
        console.warn(`%c[${e.ts}] [${category}] ⚠️ ${message}`, this._styles.WARN);
        if (data) console.warn('  📝', data);
    },

    // --- CLICK TRACKER ---
    click(element, extra = null) {
        if (!this.debugMode) return;
        const tag = element.tagName?.toLowerCase() || '?';
        const id = element.id ? `#${element.id}` : '';
        const cls = element.className ? `.${String(element.className).split(' ')[0]}` : '';
        const text = (element.textContent || '').trim().slice(0, 40);
        const msg = `${tag}${id}${cls} → "${text}"`;
        this._push('CLICK', 'CLICK', msg, extra);
        console.log(`%c[${new Date().toLocaleTimeString()}] [CLICK] 🖱️ ${msg}`, this._styles.CLICK);
    },

    // --- API TRACKER ---
    async api(method, url, options = {}) {
        const start = performance.now();
        this._push('LOG', 'API', `→ ${method} ${url}`);
        console.log(`%c[${new Date().toLocaleTimeString()}] [API] → ${method} ${url}`, this._styles.API);
        try {
            const response = await fetch(url, { method, ...options });
            const duration = Math.round(performance.now() - start);
            const statusEmoji = response.ok ? '✅' : '❌';
            this._push(response.ok ? 'LOG' : 'ERROR', 'API', `← ${response.status} ${method} ${url} (${duration}ms)`);
            console.log(`%c[${new Date().toLocaleTimeString()}] [API] ← ${statusEmoji} ${response.status} ${method} ${url} (${duration}ms)`, this._styles.API);
            return response;
        } catch (err) {
            const duration = Math.round(performance.now() - start);
            this._push('ERROR', 'API', `✗ NETWORK ${method} ${url} (${duration}ms)`, err.message);
            console.error(`%c[${new Date().toLocaleTimeString()}] [API] ✗ NETWORK ERROR ${method} ${url} (${duration}ms): ${err.message}`, this._styles.ERROR);
            throw err;
        }
    },

    // --- NAV TRACKER ---
    nav(from, to) {
        if (!this.debugMode) return;
        this._push('LOG', 'NAV', `${from} → ${to}`);
        console.log(`%c[${new Date().toLocaleTimeString()}] [NAV] 🧭 ${from} → ${to}`, this._styles.NAV);
    },

    // --- AUDIO TRACKER ---
    audio(event, detail = '') {
        if (!this.debugMode) return;
        this._push('LOG', 'AUDIO', `${event} ${detail}`);
        console.log(`%c[${new Date().toLocaleTimeString()}] [AUDIO] 🔊 ${event} ${detail}`, this._styles.AUDIO);
    },

    // --- STATE TRACKER ---
    state(key, value) {
        if (!this.debugMode) return;
        this._push('LOG', 'STATE', `${key} changed`, value);
        console.log(`%c[${new Date().toLocaleTimeString()}] [STATE] 📦 ${key} =`, this._styles.STATE, value);
    },

    // --- STORAGE TRACKER ---
    store(action, key) {
        if (!this.debugMode) return;
        this._push('LOG', 'STORE', `${action} → ${key}`);
        console.log(`%c[${new Date().toLocaleTimeString()}] [STORE] 💾 ${action} → ${key}`, this._styles.STORE);
    },

    // --- CONSOLE HELPERS ---
    // Usage in F12: Logger.history()  Logger.history('API')  Logger.history('ERROR')
    history(filter = null) {
        let items = this._history;
        if (filter) {
            const f = filter.toUpperCase();
            items = items.filter(e => e.category === f || e.level === f);
        }
        console.table(items.map(e => ({ time: e.ts, level: e.level, cat: e.category, message: e.message })));
        return items;
    },

    // Usage in F12: Logger.errors()
    errors() { return this.history('ERROR'); },

    // Usage in F12: Logger.clicks()
    clicks() { return this.history('CLICK'); },

    // Usage in F12: Logger.apis()
    apis() { return this.history('API'); },

    // Usage in F12: Logger.clear()
    clear() { this._history = []; console.clear(); console.log('🧹 Logger history cleared'); },

    // Usage in F12: Logger.dump() — export as JSON
    dump() {
        const json = JSON.stringify(this._history, null, 2);
        console.log(json);
        return json;
    }
};

// Expose Logger globally for F12 console access
window.Logger = Logger;
