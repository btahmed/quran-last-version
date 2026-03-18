// frontend/src/components/AudioRecordModal.js
// Gestion de l'enregistrement audio des tâches étudiant
import { state } from '../core/state.js';
import { config } from '../core/config.js';
import { showNotification } from '../core/ui.js';
import { Logger } from '../core/logger.js';
import { apiCache } from '../core/apiCache.js';

// Variables module-level (remplacent this._recorder, this._recordBlob, etc.)
let _recorder = null;
let _recordChunks = [];
let _recordBlob = null;
let _recordTaskId = null;
let _recordTimer = null;
let _recordSeconds = 0;

/**
 * Ouvre le modal d'enregistrement audio pour une tâche donnée.
 * @param {number|string} taskId - ID de la tâche
 * @param {string} taskTitle - Titre affiché dans le modal
 */
export function openRecordModal(taskId, taskTitle) {
    _recordTaskId = taskId;
    _recordBlob = null;
    _recordSeconds = 0;
    document.getElementById('recording-task-name').textContent = taskTitle;
    document.getElementById('recording-timer').textContent = '00:00';
    document.getElementById('recording-status').textContent = 'اضغط للتسجيل';
    document.getElementById('recording-btn').classList.remove('recording-active');

    const preview = document.getElementById('recording-preview');
    if (preview) {
        preview.classList.add('hidden');
        preview.removeAttribute('src'); // Évite un 404 sur src vide
        try { preview.load(); } catch (e) {} // Stoppe l'audio précédent
    }

    document.getElementById('recording-submit-btn').classList.add('hidden');
    const modal = document.getElementById('audio-record-modal');
    modal.classList.remove('hidden');
    modal.classList.add('active');
}

/**
 * Démarre ou arrête l'enregistrement selon l'état courant du recorder.
 */
export async function toggleRecording() {
    if (_recorder && _recorder.state === 'recording') {
        stopRecording(false);
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        _recordChunks = [];
        _recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

        _recorder.ondataavailable = (e) => {
            if (e.data.size > 0) _recordChunks.push(e.data);
        };

        _recorder.onstop = () => {
            stream.getTracks().forEach(t => t.stop());
            _recordBlob = new Blob(_recordChunks, { type: 'audio/webm' });
            const url = URL.createObjectURL(_recordBlob);
            const preview = document.getElementById('recording-preview');
            preview.src = url;
            preview.classList.remove('hidden');
            document.getElementById('recording-submit-btn').classList.remove('hidden');
            document.getElementById('recording-status').textContent = 'تم التسجيل - يمكنك الاستماع أو الإرسال';
        };

        _recorder.start();
        _recordSeconds = 0;
        document.getElementById('recording-btn').classList.add('recording-active');
        document.getElementById('recording-status').textContent = 'جاري التسجيل...';

        _recordTimer = setInterval(() => {
            _recordSeconds++;
            if (_recordSeconds >= 300) { // 5 min max
                stopRecording(false);
                return;
            }
            const mins = String(Math.floor(_recordSeconds / 60)).padStart(2, '0');
            const secs = String(_recordSeconds % 60).padStart(2, '0');
            document.getElementById('recording-timer').textContent = `${mins}:${secs}`;
        }, 1000);
    } catch (error) {
        showNotification('لا يمكن الوصول إلى الميكروفون', 'error');
    }
}

/**
 * Arrête l'enregistrement en cours.
 * @param {boolean} cancel - Si true, ferme le modal et efface le blob
 */
export function stopRecording(cancel) {
    if (_recordTimer) {
        clearInterval(_recordTimer);
        _recordTimer = null;
    }
    if (_recorder && _recorder.state === 'recording') {
        _recorder.stop();
    }
    document.getElementById('recording-btn').classList.remove('recording-active');

    if (cancel) {
        const modal = document.getElementById('audio-record-modal');
        modal.classList.remove('active');
        modal.classList.add('hidden');
        _recordBlob = null;
    }
}

/**
 * Envoie l'enregistrement audio à l'API pour la tâche courante.
 */
export async function submitRecording() {
    if (!_recordBlob || !_recordTaskId) {
        Logger.error('RECORDING', 'Missing blob or task ID', { blob: !!_recordBlob, taskId: _recordTaskId });
        return;
    }

    const token = localStorage.getItem(config.apiTokenKey);
    if (!token) {
        Logger.error('RECORDING', 'No auth token found');
        return;
    }

    // Debug : détails du blob
    Logger.log('RECORDING', `Blob size: ${_recordBlob.size} bytes, type: ${_recordBlob.type}`);
    Logger.log('RECORDING', `Task ID: ${_recordTaskId}`);

    const formData = new FormData();
    formData.append('task_id', _recordTaskId);
    formData.append('audio_file', _recordBlob, `recording_${Date.now()}.webm`);

    try {
        document.getElementById('recording-submit-btn').disabled = true;

        Logger.log('RECORDING', 'Sending submission to API...');
        const response = await fetch(`${config.apiBaseUrl}/api/submissions/`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
        });

        Logger.log('RECORDING', `API Response status: ${response.status}`);

        if (!response.ok) {
            const data = await response.json();
            Logger.error('RECORDING', 'Submission failed', data);
            throw new Error(data.detail || data.non_field_errors?.[0] || 'خطأ في الإرسال');
        }

        const result = await response.json();
        Logger.log('RECORDING', 'Submission successful', result);

        showNotification('تم إرسال التسجيل بنجاح!', 'success');
        const modal = document.getElementById('audio-record-modal');
        modal.classList.remove('active');
        modal.classList.add('hidden');
        _recordBlob = null;

        // Invalider le cache pour forcer un rechargement des données fraîches
        apiCache.invalidate('my-submissions', 'tasks', 'points');

        // Rafraîchir le tableau de bord étudiant si disponible
        if (window.QuranReview?.loadStudentDashboard) {
            window.QuranReview.loadStudentDashboard();
        }
    } catch (error) {
        showNotification(error.message, 'error');
    } finally {
        document.getElementById('recording-submit-btn').disabled = false;
    }
}
