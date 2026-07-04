import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks déclarés avant tout import ────────────────────────────────────────

vi.mock('../../../frontend/src/services/supabase-submissions.js', () => ({
    uploadAudio: vi.fn(),
    createSubmission: vi.fn(),
}));
vi.mock('../../../frontend/src/core/ui.js', () => ({
    showNotification: vi.fn(),
}));
vi.mock('../../../frontend/src/core/logger.js', () => ({
    Logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock('../../../frontend/src/core/apiCache.js', () => ({
    apiCache: { clear: vi.fn(), invalidate: vi.fn() },
}));

// ─── Fake IndexedDB minimal ───────────────────────────────────────────────────

let _records = [];
let _nextId = 1;

function _makeReq(result) {
    const req = { result, onsuccess: null, onerror: null };
    // appel synchrone pour éviter les problèmes de timing dans jsdom
    queueMicrotask(() => req.onsuccess?.({ target: req }));
    return req;
}

function _setupFakeIDB() {
    _records = [];
    _nextId = 1;

    const fakeDB = {
        objectStoreNames: { contains: () => true },
        transaction: () => ({
            objectStore: () => ({
                add: item => {
                    const id = _nextId++;
                    _records.push({ ...item, id });
                    return _makeReq(id);
                },
                delete: id => {
                    _records = _records.filter(r => r.id !== id);
                    return _makeReq(undefined);
                },
                getAll: () => _makeReq([..._records]),
            }),
        }),
    };

    global.indexedDB = {
        open: vi.fn(() => {
            const req = {
                result: fakeDB,
                onsuccess: null,
                onerror: null,
                onupgradeneeded: null,
            };
            queueMicrotask(() => req.onsuccess?.({ target: req }));
            return req;
        }),
    };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function setOnline(value) {
    Object.defineProperty(navigator, 'onLine', { value, configurable: true });
}

// jsdom ne supporte pas Blob.arrayBuffer() — on utilise un fake blob
function fakeBlob(bytes = [1, 2]) {
    return {
        arrayBuffer: () => Promise.resolve(new Uint8Array(bytes).buffer),
        type: 'audio/webm',
    };
}

async function freshModule() {
    // Réinitialise le module pour remettre _processing à false
    vi.resetModules();
    _setupFakeIDB();
    return import('../../../frontend/src/services/offline-queue.js');
}

// ─── Tests ───────────────────────────────────────────────────────────────────

beforeEach(() => {
    vi.clearAllMocks();
    setOnline(true);
    window.QuranReview = undefined;
});

describe('offline-queue — processQueue hors-ligne', () => {
    it('ne fait rien si navigator.onLine est false', async () => {
        setOnline(false);
        const mod = await freshModule();
        const supabase = await import('../../../frontend/src/services/supabase-submissions.js');

        await mod.processQueue();

        expect(supabase.uploadAudio).not.toHaveBeenCalled();
    });
});

describe('offline-queue — getPendingCount', () => {
    it('retourne 0 si la queue est vide', async () => {
        const mod = await freshModule();
        expect(await mod.getPendingCount()).toBe(0);
    });

    it('retourne le bon nombre après enqueue', async () => {
        const mod = await freshModule();
        const blob = fakeBlob();

        await mod.enqueue('task-1', blob);
        await mod.enqueue('task-2', blob);

        expect(await mod.getPendingCount()).toBe(2);
    });
});

describe('offline-queue — processQueue en ligne', () => {
    it('ne plante pas si la queue est vide', async () => {
        const mod = await freshModule();
        await expect(mod.processQueue()).resolves.toBeUndefined();
    });

    it('appelle uploadAudio + createSubmission pour chaque item', async () => {
        const mod = await freshModule();
        const supabase = await import('../../../frontend/src/services/supabase-submissions.js');
        const { showNotification } = await import('../../../frontend/src/core/ui.js');

        supabase.uploadAudio.mockResolvedValue({
            data: { url: 'https://cdn/a.webm' },
            error: null,
        });
        supabase.createSubmission.mockResolvedValue({ error: null });

        const blob = fakeBlob();
        await mod.enqueue('task-a', blob);

        await mod.processQueue();

        expect(supabase.uploadAudio).toHaveBeenCalledOnce();
        expect(supabase.createSubmission).toHaveBeenCalledWith('task-a', 'https://cdn/a.webm');
        expect(showNotification).toHaveBeenCalledWith(expect.stringContaining('1'), 'success');
        // queue vidée
        expect(await mod.getPendingCount()).toBe(0);
    });

    it('continue sur les items restants si un upload échoue', async () => {
        const mod = await freshModule();
        const supabase = await import('../../../frontend/src/services/supabase-submissions.js');

        supabase.uploadAudio
            .mockResolvedValueOnce({ data: null, error: { message: 'réseau' } })
            .mockResolvedValueOnce({ data: { url: 'https://cdn/b.webm' }, error: null });
        supabase.createSubmission.mockResolvedValue({ error: null });

        const blob = fakeBlob([1]);
        await mod.enqueue('bad', blob);
        await mod.enqueue('good', blob);

        await mod.processQueue();

        expect(supabase.uploadAudio).toHaveBeenCalledTimes(2);
        expect(supabase.createSubmission).toHaveBeenCalledTimes(1);
        // le premier item reste en queue (upload a échoué), le second est supprimé
        expect(await mod.getPendingCount()).toBe(1);
    });

    it('est idempotent — un deuxième appel simultané est ignoré', async () => {
        const mod = await freshModule();
        const supabase = await import('../../../frontend/src/services/supabase-submissions.js');

        let resolveUpload;
        supabase.uploadAudio.mockReturnValue(
            new Promise(res => {
                resolveUpload = res;
            })
        );

        const blob = fakeBlob([1]);
        await mod.enqueue('task', blob);

        const p1 = mod.processQueue();
        const p2 = mod.processQueue(); // doit être ignoré

        resolveUpload({ data: { url: 'x' }, error: null });
        supabase.createSubmission.mockResolvedValue({ error: null });

        await Promise.all([p1, p2]);
        expect(supabase.uploadAudio).toHaveBeenCalledTimes(1);
    });
});
