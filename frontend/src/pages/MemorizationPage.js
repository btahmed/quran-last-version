// frontend/src/pages/MemorizationPage.js
import { state, saveData } from '../core/state.js';
import { config } from '../core/config.js';
import { showNotification } from '../core/ui.js';
import { Logger } from '../core/logger.js';

// Injection CSS
if (!document.querySelector('link[href*="MemorizationPage.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/src/pages/MemorizationPage.css';
    document.head.appendChild(link);
}

// ===================================
// RENDER — HTML template de la page
// ===================================

export function render() {
    return `
        <div id="memorization-page" class="page active">
            <section class="section-pro">
                <div class="container-pro">
                    <div class="flex-pro" style="justify-content: space-between; align-items: center; margin-bottom: var(--space-8); flex-wrap: wrap; gap: var(--space-4);">
                        <h2 class="section-title" style="margin: 0;">📖 قائمة الحفظ</h2>
                        <button class="btn btn-glow" onclick="MemorizationPage.showAddMemorization()">
                            <span>➕</span>
                            إضافة حفظ جديد
                        </button>
                    </div>

                    <!-- Add Form -->
                    <div class="card-glass-pro" id="add-memorization-form-container" style="margin-bottom: var(--space-6); display: none;">
                        <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: var(--space-6);">➕ إضافة حفظ جديد</h3>
                        <form id="add-memorization-form" onsubmit="MemorizationPage.handleAddMemorization(event)">
                            <div class="form-floating" style="margin-bottom: var(--space-4);">
                                <select id="surah-select" required>
                                    <option value="">-- اختر السورة --</option>
                                    <option value="1">1. الفاتحة (7 آيات)</option>
                                    <option value="2">2. البقرة (286 آية)</option>
                                    <option value="3">3. آل عمران (200 آية)</option>
                                    <option value="4">4. النساء (176 آية)</option>
                                    <option value="5">5. المائدة (120 آية)</option>
                                    <option value="6">6. الأنعام (165 آية)</option>
                                    <option value="7">7. الأعراف (206 آيات)</option>
                                    <option value="8">8. الأنفال (75 آية)</option>
                                    <option value="9">9. التوبة (129 آية)</option>
                                    <option value="10">10. يونس (109 آيات)</option>
                                </select>
                                <label for="surah-select">السورة</label>
                            </div>

                            <div class="grid-pro grid-cols-2" style="margin-bottom: var(--space-4);">
                                <div class="form-floating">
                                    <input type="number" id="from-ayah" min="1" placeholder=" " required>
                                    <label for="from-ayah">من الآية</label>
                                </div>
                                <div class="form-floating">
                                    <input type="number" id="to-ayah" min="1" placeholder=" " required>
                                    <label for="to-ayah">إلى الآية</label>
                                </div>
                            </div>

                            <div class="flex-pro" style="justify-content: flex-end; gap: var(--space-3);">
                                <button type="button" class="btn btn-outline-glow" onclick="MemorizationPage.hideAddMemorization()">إلغاء</button>
                                <button type="submit" class="btn btn-glow">إضافة</button>
                            </div>
                        </form>
                    </div>

                    <!-- Table -->
                    <div class="card-glass-pro">
                        <div class="flex-pro" style="justify-content: space-between; align-items: center; margin-bottom: var(--space-6);">
                            <h3 style="font-size: 1.125rem; font-weight: 600;">📋 جدول الحفظ</h3>
                            <span class="badge badge-glass" id="memorization-count">0 سور</span>
                        </div>

                        <div class="table-responsive">
                            <table class="memorization-table" id="memorization-table">
                                <thead>
                                    <tr>
                                        <th>السورة</th>
                                        <th>الآيات</th>
                                        <th>الحالة</th>
                                        <th>آخر مراجعة</th>
                                        <th>التالي</th>
                                        <th>الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody id="memorization-table-body">
                                    <!-- Rempli par JS -->
                                </tbody>
                            </table>
                        </div>

                        <div id="memorization-empty" style="text-align: center; padding: var(--space-10);">
                            <div style="font-size: 4rem; margin-bottom: var(--space-4);">📚</div>
                            <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: var(--space-2);">لا توجد سور محفوظة</h3>
                            <p style="color: var(--color-text-secondary); margin-bottom: var(--space-4);">ابدأ رحلة الحفظ بإضافة سورة جديدة</p>
                            <button class="btn btn-glow" onclick="MemorizationPage.showAddMemorization()">
                                <span>➕</span>
                                إضافة سورة
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    `;
}

// ===================================
// INIT — appelé par le router après injection du HTML
// ===================================

export function init() {
    Logger.log('MemorizationPage', 'init()');
    renderMemorizationTable();
    setupMemorizationActions();
}

// ===================================
// TABLE DE MÉMORISATION
// ===================================

function renderMemorizationTable() {
    const tableBody = document.getElementById('memorization-table-body');
    if (!tableBody) return;

    const todayData = getTodayMemorizationData();

    let html = '';

    // Section : محفوظ سابقًا (pour consolidation)
    if (todayData.previouslyMemorized.length > 0) {
        html += `
            <tr class="section-header">
                <td colspan="7" style="background: var(--accent-green); color: white; text-align: center; font-weight: bold;">
                    📚 محفوظ سابقًا (للتثبيت)
                </td>
            </tr>
        `;
        html += todayData.previouslyMemorized.map(item => createTableRow(item)).join('');
    }

    // Section : مراجعة اليوم
    if (todayData.todayReview.length > 0) {
        html += `
            <tr class="section-header">
                <td colspan="7" style="background: var(--accent-gold); color: white; text-align: center; font-weight: bold;">
                    📋 مراجعة اليوم
                </td>
            </tr>
        `;
        html += todayData.todayReview.map(item => createTableRow(item)).join('');
    }

    // Section : حفظ جديد
    if (todayData.newMemorization.length > 0) {
        html += `
            <tr class="section-header">
                <td colspan="7" style="background: var(--accent-red); color: white; text-align: center; font-weight: bold;">
                    ✨ حفظ جديد
                </td>
            </tr>
        `;
        html += todayData.newMemorization.map(item => createTableRow(item)).join('');
    }

    // Message vide
    if (
        todayData.previouslyMemorized.length === 0 &&
        todayData.todayReview.length === 0 &&
        todayData.newMemorization.length === 0
    ) {
        html += `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    لا توجد عناصر للحفظ اليوم. أضف حفظًا جديدًا للبدء!
                </td>
            </tr>
        `;
    }

    tableBody.innerHTML = html;

    // Mise à jour du compteur
    const countEl = document.getElementById('memorization-count');
    if (countEl) {
        countEl.textContent = `${state.memorizationData.length} سور`;
    }

    // Afficher/masquer le message vide global
    const emptyEl = document.getElementById('memorization-empty');
    if (emptyEl) {
        emptyEl.style.display = state.memorizationData.length === 0 ? 'block' : 'none';
    }
}

function createTableRow(item) {
    return `
        <tr>
            <td class="arabic-text">${escapeHtml(item.surahName)}</td>
            <td>${escapeHtml(item.fromAyah)} - ${escapeHtml(item.toAyah)}</td>
            <td>${getStatusBadge(item.status)}</td>
            <td>${item.lastReviewed ? new Date(item.lastReviewed).toLocaleDateString('ar-SA') : 'لم يراجع بعد'}</td>
            <td>${escapeHtml(item.reviewCount || 0)}</td>
            <td>${getNextReviewDate(item)}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="MemorizationPage.markAsReviewed(${item.id})" title="تسجيل المراجعة">
                    ✓ مراجعة
                </button>
                <button class="btn btn-sm btn-success" onclick="MemorizationPage.playSurahAudio(${item.surahId})" title="استماع للسورة">
                    🎵 استماع
                </button>
                <button class="btn btn-sm btn-secondary" onclick="MemorizationPage.openTarteel(${item.surahId}, ${item.fromAyah}, ${item.toAyah})" title="فتح في تطبيق ترتيل">
                    🎧 ترتيل
                </button>
                <button class="btn btn-sm btn-danger" onclick="MemorizationPage.deleteItem(${item.id})" title="حذف العنصر">
                    حذف
                </button>
            </td>
        </tr>
    `;
}

function getStatusBadge(status) {
    const badges = {
        mastered: '<span class="status-badge status-mastered">✓ متقن</span>',
        weak: '<span class="status-badge status-weak">⚠ ضعيف</span>',
        new: '<span class="status-badge status-new">+ جديد</span>'
    };
    return badges[status] || escapeHtml(status);
}

function getNextReviewDate(item) {
    if (!item.lastReviewed) return 'اليوم';

    const lastReview = new Date(item.lastReviewed);
    const today = new Date();
    const daysSinceReview = Math.floor((today - lastReview) / (1000 * 60 * 60 * 24));

    const reviewCount = item.reviewCount || 0;
    let requiredDays;

    if (reviewCount === 0) {
        requiredDays = 1;
    } else if (reviewCount === 1) {
        requiredDays = 2;
    } else if (reviewCount === 2) {
        requiredDays = 4;
    } else if (reviewCount === 3) {
        requiredDays = 7;
    } else if (reviewCount === 4) {
        requiredDays = 14;
    } else if (reviewCount >= 5 && reviewCount <= 7) {
        requiredDays = 21;
    } else if (reviewCount >= 8 && reviewCount <= 12) {
        requiredDays = 30;
    } else {
        requiredDays = 45;
    }

    if (item.status === 'weak') {
        requiredDays = Math.max(1, Math.floor(requiredDays * 0.5));
    }

    const daysUntilNext = requiredDays - daysSinceReview;

    if (daysUntilNext <= 0) return 'اليوم';
    if (daysUntilNext === 1) return 'غداً';
    if (daysUntilNext <= 7) return `بعد ${daysUntilNext} أيام`;
    if (daysUntilNext <= 30) return `بعد ${Math.floor(daysUntilNext / 7)} أسابيع`;
    return `بعد ${Math.floor(daysUntilNext / 30)} أشهر`;
}

// ===================================
// DONNÉES DU JOUR (répétition espacée)
// ===================================

function getTodayMemorizationData() {
    const today = state.todayDate;

    // Éléments maîtrisés mais pas à réviser aujourd'hui (pour consolidation)
    const previouslyMemorized = state.memorizationData.filter(item =>
        item.status === 'mastered' && !shouldReviewToday(item)
    );

    // Éléments à réviser aujourd'hui
    const todayReview = state.memorizationData.filter(item =>
        shouldReviewToday(item)
    );

    // Nouveaux ajouts du jour
    const newMemorization = state.memorizationData.filter(item =>
        item.status === 'new' && item.dateAdded === today
    );

    return { previouslyMemorized, todayReview, newMemorization };
}

function shouldReviewToday(item) {
    if (!item.lastReviewed) return true;

    const lastReview = new Date(item.lastReviewed);
    const today = new Date();
    const daysSinceReview = Math.floor((today - lastReview) / (1000 * 60 * 60 * 24));

    // Calendrier de répétition espacée
    const reviewCount = item.reviewCount || 0;
    let requiredDays;

    if (reviewCount === 0) {
        requiredDays = 1;
    } else if (reviewCount === 1) {
        requiredDays = 2;
    } else if (reviewCount === 2) {
        requiredDays = 4;
    } else if (reviewCount === 3) {
        requiredDays = 7;
    } else if (reviewCount === 4) {
        requiredDays = 14;
    } else if (reviewCount >= 5 && reviewCount <= 7) {
        requiredDays = 21;
    } else if (reviewCount >= 8 && reviewCount <= 12) {
        requiredDays = 30;
    } else {
        requiredDays = 45;
    }

    // Les éléments faibles nécessitent une révision plus fréquente
    if (item.status === 'weak') {
        requiredDays = Math.max(1, Math.floor(requiredDays * 0.5));
    }

    return daysSinceReview >= requiredDays;
}

// ===================================
// ACTIONS FORMULAIRE
// ===================================

function setupMemorizationActions() {
    // Le formulaire utilise onsubmit inline → pas besoin d'addEventListener ici
    // Les sélecteurs ward/reciter/quality sont gérés par WardPage/SettingsPage
    const surahSelect = document.getElementById('surah-select');
    if (surahSelect) {
        surahSelect.addEventListener('change', () => {
            updateAyahLimits();
        });
    }

    const fromAyahInput = document.getElementById('from-ayah');
    const toAyahInput = document.getElementById('to-ayah');

    // Validation en temps réel des bornes d'ayahs
    if (fromAyahInput) {
        fromAyahInput.addEventListener('input', () => {
            // validation silencieuse — la soumission du form la vérifie
        });
    }

    if (toAyahInput) {
        toAyahInput.addEventListener('input', () => {
            // validation silencieuse — la soumission du form la vérifie
        });
    }
}

function updateAyahLimits() {
    const surahSelect = document.getElementById('surah-select');
    const fromAyahInput = document.getElementById('from-ayah');
    const toAyahInput = document.getElementById('to-ayah');

    if (!surahSelect || !fromAyahInput || !toAyahInput) return;

    const surahId = parseInt(surahSelect.value);
    if (!surahId) return;

    const surah = config.surahs ? config.surahs.find(s => s.id === surahId) : null;
    if (!surah) return;

    fromAyahInput.max = surah.ayahs;
    toAyahInput.max = surah.ayahs;
}

// ===================================
// EXPORTS — handlers appelés depuis onclick HTML
// ===================================

export function showAddMemorization() {
    const container = document.getElementById('add-memorization-form-container');
    if (container) container.style.display = 'block';
}

export function hideAddMemorization() {
    const container = document.getElementById('add-memorization-form-container');
    if (container) container.style.display = 'none';
    const form = document.getElementById('add-memorization-form');
    if (form) form.reset();
}

export function handleAddMemorization(event) {
    event.preventDefault();

    const surahSelect = document.getElementById('surah-select');
    const fromAyahInput = document.getElementById('from-ayah');
    const toAyahInput = document.getElementById('to-ayah');

    const surahId = parseInt(surahSelect.value);
    const surah = config.surahs ? config.surahs.find(s => s.id === surahId) : null;
    const fromAyah = parseInt(fromAyahInput.value);
    const toAyah = parseInt(toAyahInput.value);

    if (!surah || fromAyah < 1 || toAyah < fromAyah || toAyah > surah.ayahs) {
        showNotification('بيانات غير صحيحة', 'error');
        return;
    }

    const newItem = {
        id: Date.now(),
        surahId: surahId,
        surahName: surah.name,
        fromAyah: fromAyah,
        toAyah: toAyah,
        status: 'new',
        dateAdded: state.todayDate,
        lastReviewed: null,
        reviewCount: 0
    };

    state.memorizationData.push(newItem);
    saveData();
    renderMemorizationTable();

    // Réinitialiser le formulaire et le fermer
    const form = document.getElementById('add-memorization-form');
    if (form) form.reset();
    hideAddMemorization();

    showNotification('تمت إضافة الحفظ الجديد', 'success');
}

export function markAsReviewed(itemId) {
    const item = state.memorizationData.find(i => i.id === itemId);
    if (!item) return;

    item.lastReviewed = state.todayDate;
    item.reviewCount = (item.reviewCount || 0) + 1;

    // Mise à jour du statut selon le nombre de révisions
    if (item.reviewCount >= 10) {
        item.status = 'mastered';
    } else if (item.reviewCount >= 3) {
        item.status = 'weak';
    }

    saveData();
    renderMemorizationTable();
    showNotification('تم تسجيل المراجعة', 'success');
}

export function deleteItem(itemId) {
    if (!confirm('هل أنت متأكد من حذف هذا العنصر؟')) return;

    state.memorizationData = state.memorizationData.filter(i => i.id !== itemId);
    saveData();
    renderMemorizationTable();
    showNotification('تم حذف العنصر', 'info');
}

export function playSurahAudio(surahNumber) {
    // Délègue à l'audio global si disponible
    if (window.QuranReview && typeof window.QuranReview.playSurahAudio === 'function') {
        window.QuranReview.playSurahAudio(surahNumber);
    } else {
        Logger.warn('MemorizationPage', 'playSurahAudio: QuranReview global non disponible');
    }
}

export function openTarteel(surahId, fromAyah, toAyah) {
    // Délègue à l'intégration Tarteel globale si disponible
    if (window.QuranReview && typeof window.QuranReview.openTarteel === 'function') {
        window.QuranReview.openTarteel(surahId, fromAyah, toAyah);
    } else {
        Logger.warn('MemorizationPage', 'openTarteel: QuranReview global non disponible');
    }
}

// ===================================
// UTILITAIRES internes
// ===================================

function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
