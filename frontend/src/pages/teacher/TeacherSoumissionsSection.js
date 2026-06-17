// frontend/src/pages/teacher/TeacherSoumissionsSection.js
// Section Soumissions — extraite de TeacherPage.js (Task 9 : lazy-loading)
// Responsabilités : lister les soumissions audio en attente, player audio, modal notation emoji, modal rejet
import { config }           from '../../core/config.js';
import { showNotification } from '../../core/ui.js';
import { Logger }           from '../../core/logger.js';
import { apiCache }         from '../../core/apiCache.js';
import * as supabaseSubmissions from '../../services/supabase-submissions.js';

// ─── CONSTANTES ───────────────────────────────────────────────────────────────

const GRADE_LABELS = {
    1: { emoji: '😟', text: 'ضعيف' },
    2: { emoji: '😐', text: 'مقبول' },
    3: { emoji: '🙂', text: 'جيد' },
    4: { emoji: '😊', text: 'جيد جداً' },
    5: { emoji: '🌟', text: 'ممتاز' },
};

// ─── ÉTAT LOCAL ───────────────────────────────────────────────────────────────

let _pendingGradeSubmissionId = null;
let _selectedGrade            = null;
let _pendingRejectSubmissionId = null;

// ─── UTILS ───────────────────────────────────────────────────────────────────

function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function escapeJs(text) {
    if (!text) return '';
    return String(text)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r');
}

// ─── RENDER ──────────────────────────────────────────────────────────────────

export function render() {
    return `
        <!-- Modal notation emoji -->
        <div id="grade-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:2000;align-items:center;justify-content:center;">
            <div class="card-glass-pro" style="max-width:420px;width:90%;padding:2rem;text-align:center;border-radius:1rem;">
                <h3 style="font-size:1.2rem;font-weight:700;margin-bottom:0.5rem;">⭐ تقييم التسليم</h3>
                <p id="grade-modal-subtitle" style="color:var(--color-text-secondary);margin-bottom:1.5rem;font-size:0.9rem;"></p>
                <div style="display:flex;justify-content:center;gap:0.75rem;margin-bottom:1rem;">
                    ${[1,2,3,4,5].map(g => `
                        <button onclick="QuranReview.selectGrade(${g})" data-grade="${g}"
                            style="font-size:2rem;background:none;border:2px solid transparent;border-radius:12px;padding:8px;cursor:pointer;transition:all 0.2s;line-height:1;"
                            title="${GRADE_LABELS[g].text}"
                            aria-label="${GRADE_LABELS[g].text}">
                            ${GRADE_LABELS[g].emoji}
                        </button>
                    `).join('')}
                </div>
                <div id="grade-label" style="font-size:1rem;font-weight:600;min-height:1.5em;margin-bottom:1.5rem;color:var(--color-primary);"></div>
                <div style="display:flex;gap:1rem;justify-content:center;">
                    <button class="btn btn-outline-glow btn-sm" onclick="QuranReview.closeGradeModal()">إلغاء</button>
                    <button class="btn btn-glow btn-sm" id="grade-confirm-btn" disabled onclick="QuranReview.confirmGrade()">✓ قبول</button>
                </div>
            </div>
        </div>

        <!-- Modal rejet -->
        <div id="reject-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:2000;align-items:center;justify-content:center;">
            <div class="card-glass-pro" style="max-width:420px;width:90%;padding:2rem;border-radius:1rem;">
                <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:0.75rem;">✗ رفض التسليم</h3>
                <p id="reject-modal-subtitle" style="color:var(--color-text-secondary);margin-bottom:1rem;font-size:0.9rem;"></p>
                <textarea id="reject-feedback" placeholder="سبب الرفض (اختياري)..."
                    dir="rtl"
                    style="width:100%;min-height:80px;border-radius:8px;padding:10px;border:1px solid var(--color-border);background:var(--glass-bg);color:var(--color-text);resize:vertical;font-family:inherit;font-size:0.95rem;"></textarea>
                <div style="display:flex;gap:1rem;justify-content:center;margin-top:1rem;">
                    <button class="btn btn-outline-glow btn-sm" onclick="QuranReview.closeRejectModal()">إلغاء</button>
                    <button class="btn btn-danger btn-sm" onclick="QuranReview.confirmReject()">✗ تأكيد الرفض</button>
                </div>
            </div>
        </div>

        <!-- Liste des soumissions en attente -->
        <section class="k-section">
            <h3 class="k-section-title">📥 تسليمات الطلاب</h3>
            <div id="teacher-tasks-list" class="k-stack">
                <div class="skeleton skeleton-card"></div>
                <div class="skeleton skeleton-card"></div>
            </div>
        </section>
    `;
}

// ─── INIT ─────────────────────────────────────────────────────────────────────

export async function init() {
    Logger.log('TEACHER-SOUMISSIONS', 'init');
    await _loadPendingSubmissions();
}

// ─── CHARGEMENT DES SOUMISSIONS EN ATTENTE ────────────────────────────────────

async function _loadPendingSubmissions() {
    const pendingList = document.getElementById('teacher-tasks-list');
    if (!pendingList) return;

    try {
        const { data, error } = await supabaseSubmissions.getPendingSubmissions();
        if (error) throw error;

        const pending = data || [];
        apiCache.set('pending-submissions', pending);
        _renderPendingList(pending);
    } catch (err) {
        Logger.error('TEACHER-SOUMISSIONS', 'Erreur chargement soumissions', err);
        if (pendingList) {
            pendingList.innerHTML = '<p class="empty-state" style="color:var(--color-danger);">فشل تحميل التسليمات</p>';
        }
    }
}

function _renderPendingList(pending) {
    const pendingList = document.getElementById('teacher-tasks-list');
    if (!pendingList) return;

    if (!pending.length) {
        pendingList.innerHTML = '<p class="empty-state">لا توجد تسليمات بانتظار التصحيح 🎉</p>';
        return;
    }

    pendingList.innerHTML = pending.map(s => {
        const date        = new Date(s.submitted_at).toLocaleDateString('ar-SA');
        const taskTitle   = s.task?.title || s.tasks?.title || 'تسليم';
        const taskPoints  = s.task?.points || s.tasks?.points || 0;
        const studentName = s.profiles?.first_name || s.profiles?.username || 'طالب';
        const initial     = escapeHtml(studentName.charAt(0) || '؟');
        const sid         = escapeHtml(String(s.id));

        // Construction de l'URL audio (Cloudinary ou backend local)
        const audioSrc = s.audio_url
            ? (s.audio_url.startsWith('http')
                ? s.audio_url
                : config.apiBaseUrl + (s.audio_url.startsWith('/') ? s.audio_url : '/' + s.audio_url))
            : null;

        return `<div class="k-pending-card">
            <div class="k-pending-head">
                <span class="k-avatar">${initial}</span>
                <div style="flex:1;min-width:0">
                    <div style="font-weight:600;font-size:var(--text-sm)">${escapeHtml(studentName)}</div>
                    <div style="font-size:var(--text-xs);color:var(--text-secondary)">${escapeHtml(taskTitle)}</div>
                </div>
                <span class="k-chip k-chip--warning">⏳ بانتظار</span>
            </div>
            <div class="k-pending-meta">
                <span>🏆 ${escapeHtml(String(taskPoints))} نقطة</span>
                <span>📅 ${date}</span>
            </div>
            ${audioSrc ? `
                <div class="k-pending-audio">
                    <audio controls preload="metadata"
                        onerror="this.closest('.k-pending-audio').innerHTML='<p class=\\'k-empty\\' style=\\'padding:var(--space-2)\\'>الملف الصوتي غير متاح</p>'">
                        <source src="${audioSrc}" type="audio/webm">
                        المتصفح لا يدعم تشغيل الصوت
                    </audio>
                </div>
            ` : '<p class="k-empty" style="padding:var(--space-2) var(--space-4)">لا يوجد ملف صوتي 🎙</p>'}
            <div class="k-pending-actions">
                <button class="k-quickbtn k-quickbtn--primary"
                    onclick="QuranReview.openGradeModal(&quot;${sid}&quot;,&quot;${escapeHtml(escapeJs(studentName))}&quot;,&quot;${escapeHtml(escapeJs(taskTitle))}&quot;)">⭐ قبول وتقييم</button>
                <button class="k-quickbtn k-quickbtn--danger"
                    onclick="QuranReview.openRejectModal(&quot;${sid}&quot;,&quot;${escapeHtml(escapeJs(studentName))}&quot;)">✗ رفض</button>
            </div>
        </div>`;
    }).join('');
}

// ─── MODAL NOTATION EMOJI ─────────────────────────────────────────────────────

export function openGradeModal(submissionId, studentName, taskTitle) {
    _pendingGradeSubmissionId = submissionId;
    _selectedGrade = null;

    const subtitle = document.getElementById('grade-modal-subtitle');
    if (subtitle) subtitle.textContent = `${studentName} — ${taskTitle}`;

    const label = document.getElementById('grade-label');
    if (label) label.textContent = '';

    const confirmBtn = document.getElementById('grade-confirm-btn');
    if (confirmBtn) confirmBtn.disabled = true;

    // Réinitialiser les boutons emoji
    document.querySelectorAll('[data-grade]').forEach(btn => {
        btn.style.border     = '2px solid transparent';
        btn.style.transform  = 'scale(1)';
    });

    const modal = document.getElementById('grade-modal');
    if (modal) modal.style.display = 'flex';
}

export function closeGradeModal() {
    const modal = document.getElementById('grade-modal');
    if (modal) modal.style.display = 'none';
    _pendingGradeSubmissionId = null;
    _selectedGrade = null;
}

export function selectGrade(grade) {
    _selectedGrade = grade;

    // Mettre en surbrillance le bouton sélectionné
    document.querySelectorAll('[data-grade]').forEach(btn => {
        const g = parseInt(btn.dataset.grade);
        if (g === grade) {
            btn.style.border    = '2px solid var(--color-primary, #6366f1)';
            btn.style.transform = 'scale(1.2)';
        } else {
            btn.style.border    = '2px solid transparent';
            btn.style.transform = 'scale(1)';
        }
    });

    const info = GRADE_LABELS[grade];
    const label = document.getElementById('grade-label');
    if (label) label.textContent = `${info.emoji} ${info.text}`;

    const confirmBtn = document.getElementById('grade-confirm-btn');
    if (confirmBtn) confirmBtn.disabled = false;
}

export async function confirmGrade() {
    if (!_pendingGradeSubmissionId || !_selectedGrade) return;
    const submissionId = _pendingGradeSubmissionId;
    const grade = _selectedGrade;
    closeGradeModal();
    await approveSubmission(submissionId, grade);
}

export async function approveSubmission(submissionId, grade) {
    const token = localStorage.getItem(config.apiTokenKey);
    if (!token) return;

    const gradeInfo = grade ? GRADE_LABELS[grade] : null;
    const feedback  = gradeInfo ? `${gradeInfo.emoji} ${gradeInfo.text} (${grade}/5)` : '';

    try {
        const points = grade ? grade * 2 : 10;
        const { error } = await supabaseSubmissions.approveSubmission(submissionId, points, feedback);
        if (error) throw new Error('فشل القبول');

        const gradeText = gradeInfo ? ` — ${gradeInfo.emoji} ${gradeInfo.text}` : '';
        showNotification(`تم قبول التسليم!${gradeText}`, 'success');
        apiCache.invalidate('pending-submissions', 'submissions', 'my-submissions');
        await init(); // recharger la liste
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// ─── MODAL REJET ─────────────────────────────────────────────────────────────

export function openRejectModal(submissionId, studentName) {
    _pendingRejectSubmissionId = submissionId;

    const subtitle = document.getElementById('reject-modal-subtitle');
    if (subtitle) subtitle.textContent = `رفض تسليم الطالب: ${studentName}`;

    const textarea = document.getElementById('reject-feedback');
    if (textarea) textarea.value = '';

    const modal = document.getElementById('reject-modal');
    if (modal) modal.style.display = 'flex';
}

export function closeRejectModal() {
    const modal = document.getElementById('reject-modal');
    if (modal) modal.style.display = 'none';
    _pendingRejectSubmissionId = null;
}

export async function confirmReject() {
    if (!_pendingRejectSubmissionId) return;
    const submissionId = _pendingRejectSubmissionId;
    const feedback = document.getElementById('reject-feedback')?.value?.trim() || '';
    closeRejectModal();
    await rejectSubmission(submissionId, feedback);
}

export async function rejectSubmission(submissionId, feedback) {
    const token = localStorage.getItem(config.apiTokenKey);
    if (!token) return;

    try {
        const { error } = await supabaseSubmissions.rejectSubmission(submissionId, feedback || '');
        if (error) throw new Error('فشل الرفض');

        showNotification('تم رفض التسليم', 'success');
        apiCache.invalidate('pending-submissions', 'submissions', 'my-submissions');
        await init(); // recharger la liste
    } catch (error) {
        showNotification(error.message, 'error');
    }
}
