// Offline submission queue — IndexedDB + retry automatique à la reconnexion
// Usage :
//   import * as offlineQueue from './offline-queue.js';
//   await offlineQueue.enqueue(taskId, audioBlob);   // sauvegarder hors-ligne
//   await offlineQueue.processQueue();               // retry manuel
//   offlineQueue.getPendingCount()                   // badge UI

import * as supabaseSubmissions from './supabase-submissions.js';
import { showNotification } from '../core/ui.js';
import { Logger } from '../core/logger.js';
import { apiCache } from '../core/apiCache.js';

const DB_NAME = 'quranreview-offline';
const DB_VERSION = 1;
const STORE = 'submission-queue';

// ─── IndexedDB helpers ────────────────────────────────────────────────────────

function _openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = e => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE)) {
                db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

function _tx(db, mode, fn) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const store = tx.objectStore(STORE);
        const req = fn(store);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

// ─── API publique ─────────────────────────────────────────────────────────────

/**
 * Ajoute une soumission dans la file d'attente offline.
 * Le Blob est converti en ArrayBuffer (sérialisable dans IDB).
 */
export async function enqueue(taskId, audioBlob) {
    const db = await _openDB();
    const item = {
        taskId,
        audioArrayBuffer: await audioBlob.arrayBuffer(),
        audioMimeType: audioBlob.type || 'audio/webm',
        timestamp: Date.now(),
        retries: 0,
    };
    const id = await _tx(db, 'readwrite', store => store.add(item));
    Logger.log('OFFLINE-QUEUE', `Soumission mise en file — id=${id}, task=${taskId}`);

    // Enregistrer un Background Sync si l'API est disponible (Chrome/Android)
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
        const reg = await navigator.serviceWorker.ready;
        await reg.sync.register('submission-sync').catch(() => {});
    }

    return id;
}

/** Supprime un item traité. */
async function _dequeue(id) {
    const db = await _openDB();
    await _tx(db, 'readwrite', store => store.delete(id));
}

/** Retourne tous les items en attente. */
export async function getAll() {
    const db = await _openDB();
    return _tx(db, 'readonly', store => store.getAll());
}

/** Nombre de soumissions en attente (pour badge UI). */
export async function getPendingCount() {
    const items = await getAll();
    return items.length;
}

// ─── Retry ───────────────────────────────────────────────────────────────────

let _processing = false;

/**
 * Tente d'envoyer toutes les soumissions en attente.
 * Appel idempotent : ignore si déjà en cours.
 */
export async function processQueue() {
    if (_processing || !navigator.onLine) return;
    _processing = true;

    let items;
    try {
        items = await getAll();
    } catch (err) {
        Logger.error('OFFLINE-QUEUE', 'Erreur lecture IDB', err);
        _processing = false;
        return;
    }

    if (!items.length) {
        _processing = false;
        return;
    }

    Logger.log('OFFLINE-QUEUE', `${items.length} soumission(s) en attente — synchronisation...`);
    let successCount = 0;

    for (const item of items) {
        try {
            const blob = new Blob([item.audioArrayBuffer], { type: item.audioMimeType });

            const { data: uploadData, error: uploadError } = await supabaseSubmissions.uploadAudio(
                item.taskId,
                blob
            );
            if (uploadError) throw new Error(uploadError.message);

            const { error: submitError } = await supabaseSubmissions.createSubmission(
                item.taskId,
                uploadData.url
            );
            if (submitError) throw new Error(submitError.message);

            await _dequeue(item.id);
            successCount++;
            Logger.log('OFFLINE-QUEUE', `Soumission ${item.id} synchronisée ✓`);
        } catch (err) {
            Logger.warn('OFFLINE-QUEUE', `Échec soumission ${item.id}`, err.message);
        }
    }

    _processing = false;

    if (successCount > 0) {
        apiCache.clear();
        showNotification(`✅ ${successCount} soumission(s) synchronisée(s) !`, 'success');
        window.dispatchEvent(
            new CustomEvent('offline-queue-synced', { detail: { count: successCount } })
        );

        if (window.QuranReview?.loadStudentDashboard) {
            window.QuranReview.loadStudentDashboard();
        }
    }
}

// ─── Reconnexion automatique ──────────────────────────────────────────────────

window.addEventListener('online', () => {
    Logger.log('OFFLINE-QUEUE', 'Reconnexion — tentative de synchronisation');
    processQueue();
});

// Écouter les messages du Service Worker (Background Sync)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', event => {
        if (event.data?.type === 'SYNC_OFFLINE_QUEUE') {
            processQueue();
        }
    });
}
