// frontend/src/pages/teacher/TeacherDevoirsSection.js
// Section Devoirs — extraite de TeacherPage.js (Task 9 : lazy-loading)
// Responsabilités : créer une tâche, lister les tâches assignées, supprimer par batch
import { config } from '../../core/config.js';
import { showNotification } from '../../core/ui.js';
import { Logger } from '../../core/logger.js';
import { apiCache } from '../../core/apiCache.js';
import { Validators } from '../../core/validators.js';
import * as supabaseTasks from '../../services/supabase-tasks.js';
import * as supabaseAdmin from '../../services/supabase-admin.js';

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

function _parseTaskDescription(desc) {
    if (!desc) return { text: '', hifz: null };
    try {
        const parsed = JSON.parse(desc);
        if (parsed?._hifz) return { text: parsed.text || '', hifz: parsed._hifz };
    } catch (_) {
        /* description non-JSON */
    }
    return { text: desc, hifz: null };
}

// ─── ÉTAT LOCAL ───────────────────────────────────────────────────────────────

let _students = [];
let _tasks = [];

// ─── RENDER ──────────────────────────────────────────────────────────────────

export function render() {
    return `
        <!-- Formulaire de création de tâche -->
        <div class="card-glass-pro" style="margin-bottom: var(--space-6);">
            <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: var(--space-4);">➕ إنشاء مهمة جديدة</h3>
            <form id="teacher-create-task-form" onsubmit="QuranReview.handleCreateTask(event)">
                <div class="form-floating" style="margin-bottom: var(--space-4);">
                    <input type="text" id="task-title" placeholder=" " required>
                    <label for="task-title">عنوان المهمة</label>
                </div>
                <div class="form-floating" style="margin-bottom: var(--space-4);">
                    <textarea id="task-description" placeholder=" " style="min-height: 80px; resize: vertical;"></textarea>
                    <label for="task-description">وصف المهمة</label>
                </div>
                <div class="k-grid2" style="margin-bottom: var(--space-4);">
                    <div class="form-floating">
                        <select id="task-type">
                            <option value="hifz">حفظ</option>
                            <option value="muraja">مراجعة</option>
                            <option value="tilawa">تلاوة</option>
                        </select>
                        <label for="task-type">نوع المهمة</label>
                    </div>
                    <div class="form-floating">
                        <input type="number" id="task-points" min="0" value="10" placeholder=" ">
                        <label for="task-points">النقاط</label>
                    </div>
                </div>
                <!-- Options spécifiques au type hifz -->
                <div id="hifz-task-options" style="display:none;margin-bottom:var(--space-4);">
                    <div class="form-floating" style="margin-bottom:var(--space-3);">
                        <select id="hifz-task-surah">
                            <option value="">-- اختر السورة --</option>
                        </select>
                        <label for="hifz-task-surah">السورة (للحفظ)</label>
                    </div>
                    <div class="k-grid2">
                        <div class="form-floating">
                            <input type="number" id="hifz-task-from" min="1" value="1" placeholder=" ">
                            <label for="hifz-task-from">من الآية</label>
                        </div>
                        <div class="form-floating">
                            <input type="number" id="hifz-task-to" min="1" value="7" placeholder=" ">
                            <label for="hifz-task-to">إلى الآية</label>
                        </div>
                    </div>
                </div>
                <div class="form-floating" style="margin-bottom: var(--space-4);">
                    <input type="date" id="task-due-date" placeholder=" ">
                    <label for="task-due-date">تاريخ التسليم</label>
                </div>
                <!-- Assignation des étudiants -->
                <div style="margin-bottom: var(--space-4);">
                    <p style="font-size: 0.875rem; font-weight: 600; margin-bottom: var(--space-2);">👥 تعيين إلى</p>
                    <div style="display: flex; gap: var(--space-4);">
                        <label style="display: flex; align-items: center; gap: var(--space-2); cursor: pointer;">
                            <input type="radio" name="assign-mode" value="all" checked
                                onchange="QuranReview.toggleAssignMode('all')">
                            <span>جميع الطلاب</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: var(--space-2); cursor: pointer;">
                            <input type="radio" name="assign-mode" value="select"
                                onchange="QuranReview.toggleAssignMode('select')">
                            <span>طلاب محددون</span>
                        </label>
                    </div>
                </div>
                <div id="student-select-container" class="hidden" style="margin-bottom: var(--space-4);">
                    <div id="student-checkboxes" style="display: flex; flex-wrap: wrap; gap: var(--space-2); padding: var(--space-3); background: var(--glass-bg); border-radius: var(--radius-lg);">
                        <p class="empty-state">جاري تحميل الطلاب...</p>
                    </div>
                </div>
                <button type="submit" class="btn btn-glow btn-full">إنشاء المهمة</button>
            </form>
        </div>

        <!-- Liste des tâches assignées -->
        <section class="k-section">
            <div id="teacher-assigned-tasks-list" class="k-stack">
                <div class="skeleton skeleton-card"></div>
                <div class="skeleton skeleton-card"></div>
            </div>
        </section>
    `;
}

// ─── INIT ─────────────────────────────────────────────────────────────────────

export async function init() {
    Logger.log('TEACHER-DEVOIRS', 'init');
    await _loadData();
    _initHifzForm();
}

function _initHifzForm() {
    const surahSelect = document.getElementById('hifz-task-surah');
    if (!surahSelect || surahSelect.options.length > 1) return;

    config.surahs.forEach(surah => {
        const option = document.createElement('option');
        option.value = surah.id;
        option.textContent = `${surah.name} (${surah.ayahs} آيات)`;
        surahSelect.appendChild(option);
    });

    const typeSelect = document.getElementById('task-type');
    const hifzOptions = document.getElementById('hifz-task-options');
    if (!typeSelect || !hifzOptions) return;

    const _toggleHifzFields = () => {
        hifzOptions.style.display = typeSelect.value === 'hifz' ? '' : 'none';
    };
    typeSelect.addEventListener('change', _toggleHifzFields);
    _toggleHifzFields();

    surahSelect.addEventListener('change', () => {
        const surahId = parseInt(surahSelect.value);
        const surah = config.surahs.find(s => s.id === surahId);
        const fromInput = document.getElementById('hifz-task-from');
        const toInput = document.getElementById('hifz-task-to');
        if (surah && fromInput && toInput) {
            fromInput.max = surah.ayahs;
            toInput.max = surah.ayahs;
        }
    });
}

// ─── CHARGEMENT DES DONNÉES ───────────────────────────────────────────────────

async function _loadData() {
    try {
        const [studentsResult, tasksResult] = await Promise.all([
            supabaseAdmin.getMyStudents(),
            supabaseTasks.getAllTasks(),
        ]);

        _students = studentsResult.data || [];
        _tasks = tasksResult.data || [];

        apiCache.set('my-students', _students);
        apiCache.set('tasks', _tasks);

        _renderStudentCheckboxes(_students);
        _renderTaskList(_tasks);
    } catch (err) {
        Logger.error('TEACHER-DEVOIRS', 'Erreur chargement données', err);
        showNotification('فشل تحميل بيانات الواجبات', 'error');
    }
}

// ─── RENDU DES CASES À COCHER ÉTUDIANTS ──────────────────────────────────────

function _renderStudentCheckboxes(students) {
    const container = document.getElementById('student-checkboxes');
    if (!container) return;

    if (!students.length) {
        container.innerHTML = '<p class="empty-state">لا يوجد طلاب</p>';
        return;
    }

    container.innerHTML = students
        .map(
            student => `
        <label class="student-checkbox-label">
            <input type="checkbox" name="student-ids" value="${student.id}">
            <span class="student-name">${escapeHtml(student.first_name || student.username)}</span>
        </label>
    `
        )
        .join('');
}

// ─── RENDU DE LA LISTE DES TÂCHES ────────────────────────────────────────────

function _renderTaskList(tasks) {
    const taskListEl = document.getElementById('teacher-assigned-tasks-list');
    if (!taskListEl) return;

    // En-tête avec bouton Supprimer tout
    const headerHtml = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-4)">
            <h3 class="k-section-title" style="margin:0">📋 قائمة المهام</h3>
            <button class="k-quickbtn k-quickbtn--danger"
                style="min-width:auto;padding:var(--space-2) var(--space-3);font-size:var(--text-xs)"
                onclick="QuranReview.handleDeleteAllTasks()">🗑 حذف الكل</button>
        </div>
    `;

    if (!tasks.length) {
        taskListEl.innerHTML = headerHtml + '<p class="empty-state">لا توجد مهام بعد</p>';
        return;
    }

    // Regrouper les tâches par batch (title + type + due_date + jour de création)
    const batches = new Map();
    tasks.forEach(task => {
        const day = task.created_at ? task.created_at.substring(0, 10) : '';
        const key = `${task.title}||${task.type}||${task.due_date || ''}||${day}`;
        if (!batches.has(key)) {
            batches.set(key, { task, count: 0, ids: [] });
        }
        batches.get(key).count++;
        batches.get(key).ids.push(task.id);
    });

    taskListEl.innerHTML =
        headerHtml +
        Array.from(batches.values())
            .map(({ task, count, ids }) => {
                const typeLabel = task.type || '';
                const dueDate = task.due_date
                    ? new Date(task.due_date).toLocaleDateString('ar-SA')
                    : '';
                const date = new Date(task.created_at).toLocaleDateString('ar-SA');
                const idsJson = JSON.stringify(ids);
                const safeTitle = escapeHtml(escapeJs(task.title));
                return `<div class="k-task-card">
            <div class="k-task-card-header">
                <h3 class="k-task-card-title">${escapeHtml(task.title)}</h3>
                <div style="display:flex;align-items:center;gap:var(--space-2);flex-shrink:0">
                    ${typeLabel ? `<span class="k-type-badge">${escapeHtml(typeLabel)}</span>` : ''}
                    <button class="k-quickbtn k-quickbtn--danger"
                        style="min-width:auto;padding:var(--space-1) var(--space-3);font-size:var(--text-xs)"
                        onclick="QuranReview.handleDeleteBatch(${idsJson},'${safeTitle}',${count})"
                        title="حذف هذه المهمة">🗑 حذف</button>
                </div>
            </div>
            ${(() => {
                const { text, hifz } = _parseTaskDescription(task.description);
                const surahName = hifz
                    ? config.surahs.find(s => s.id === hifz.surah_id)?.name || ''
                    : '';
                const display =
                    text + (hifz ? ` — سورة ${surahName} (${hifz.from_ayah}-${hifz.to_ayah})` : '');
                return display ? `<p class="k-task-card-desc">${escapeHtml(display)}</p>` : '';
            })()}
            <div class="k-task-card-meta">
                <span>🏆 ${escapeHtml(String(task.points))} نقطة</span>
                <span>👥 ${count} طالب</span>
                <span>📅 ${date}</span>
                ${dueDate ? `<span>⏰ ${dueDate}</span>` : ''}
            </div>
        </div>`;
            })
            .join('');
}

// ─── ACTIONS EXPORTÉES (utilisées via TeacherPage.js ou main.js) ──────────────

export function toggleAssignMode(mode) {
    const container = document.getElementById('student-select-container');
    if (!container) return;
    if (mode === 'select') {
        container.classList.remove('hidden');
    } else {
        container.classList.add('hidden');
    }
}

export async function handleCreateTask(event) {
    event.preventDefault();
    const token = localStorage.getItem(config.apiTokenKey);
    if (!token) return;

    const assignMode = document.querySelector('input[name="assign-mode"]:checked')?.value || 'all';
    const studentIds = [];
    if (assignMode === 'select') {
        document.querySelectorAll('input[name="student-ids"]:checked').forEach(cb => {
            studentIds.push(cb.value); // UUID string, pas parseInt
        });
        if (!studentIds.length) {
            showNotification('يرجى اختيار طالب واحد على الأقل', 'error');
            return;
        }
    }

    const title = document.getElementById('task-title').value.trim();
    const points = parseInt(document.getElementById('task-points').value) || 0;

    const titleCheck = Validators.text(title, { minLen: 2, maxLen: 200 });
    const pointsCheck = Validators.points(points);
    if (!titleCheck.valid) {
        showNotification(titleCheck.error, 'error');
        return;
    }
    if (!pointsCheck.valid) {
        showNotification(pointsCheck.error, 'error');
        return;
    }

    const taskType = document.getElementById('task-type').value;
    let description = document.getElementById('task-description').value.trim();
    if (taskType === 'hifz') {
        const hifzSurahId = parseInt(document.getElementById('hifz-task-surah')?.value || '0');
        const hifzFrom = parseInt(document.getElementById('hifz-task-from')?.value || '0');
        const hifzTo = parseInt(document.getElementById('hifz-task-to')?.value || '0');

        if (!hifzSurahId) {
            showNotification('يرجى اختيار السورة للواجب', 'error');
            return;
        }
        const hifzSurah = config.surahs.find(s => s.id === hifzSurahId);
        if (!hifzFrom || !hifzTo || hifzFrom < 1 || hifzTo < 1) {
            showNotification('أرقام الآيات غير صحيحة', 'error');
            return;
        }
        if (hifzFrom > hifzTo) {
            showNotification('الآية الأولى يجب أن تكون أصغر من أو تساوي الآية الأخيرة', 'error');
            return;
        }
        if (hifzSurah && hifzTo > hifzSurah.ayahs) {
            showNotification(
                `سورة ${hifzSurah.name} تحتوي على ${hifzSurah.ayahs} آية فقط`,
                'error'
            );
            return;
        }

        description = JSON.stringify({
            _hifz: { surah_id: hifzSurahId, from_ayah: hifzFrom, to_ayah: hifzTo },
            text: description,
        });
    }
    const body = {
        title,
        description,
        type: taskType,
        points,
        due_date: document.getElementById('task-due-date').value || null,
        assign_all: assignMode === 'all',
        student_ids: studentIds,
    };

    try {
        if (body.assign_all) {
            // Créer pour tous les étudiants
            const { data: students } = await supabaseAdmin.getMyStudents();
            if (students?.length) {
                const results = await Promise.all(
                    students.map(s => supabaseTasks.createTask({ ...body, user_id: s.id }))
                );
                const failed = results.filter(r => r.error).length;
                if (failed) showNotification(`فشل إنشاء ${failed} مهمة`, 'error');
                // Envoyer UNE notification push par élève
                students.forEach(s =>
                    supabaseTasks.notifyStudentNewTask(s.id, body.title, body.type)
                );
            }
        } else {
            // Créer pour les étudiants sélectionnés
            for (const studentId of studentIds) {
                const { error } = await supabaseTasks.createTask({ ...body, user_id: studentId });
                if (error) throw new Error(error.message || 'خطأ في إنشاء المهمة');
                // Envoyer UNE notification push à cet élève
                supabaseTasks.notifyStudentNewTask(studentId, body.title, body.type);
            }
        }

        showNotification('تم إنشاء المهمة بنجاح!', 'success');
        document.getElementById('teacher-create-task-form').reset();
        document.getElementById('student-select-container')?.classList.add('hidden');
        apiCache.invalidate('tasks', 'my-students');
        // Recharger la section
        await init();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

export async function handleDeleteBatch(ids, title, count) {
    if (!confirm(`حذف "${title}" لـ ${count} طالب؟\nلا يمكن التراجع عن هذا الإجراء.`)) return;

    try {
        const { error } = await supabaseTasks.deleteTasksByIds(ids);
        if (error) throw error;

        showNotification('تم حذف المهام بنجاح', 'success');
        apiCache.invalidate('tasks');
        await init();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

export async function handleDeleteAllTasks() {
    if (
        !confirm(
            '⚠️ تحذير خطير!\nهل أنت متأكد تماماً أنك تريد حذف جميع المهام؟\nهذا الإجراء سيحذف كل المهام وكل التسليمات المرتبطة بها ولا يمكن التراجع عنه.'
        )
    ) {
        return;
    }

    const token = localStorage.getItem(config.apiTokenKey);
    if (!token) return;

    try {
        const { data: students } = await supabaseAdmin.getMyStudents();
        if (!students?.length) {
            showNotification('لا يوجد طلاب', 'error');
            return;
        }

        const studentIds = students.map(s => s.id);
        const { error } = await supabaseTasks.deleteTasksByStudentIds(studentIds);

        if (error) throw error;

        showNotification('تم حذف جميع المهام بنجاح', 'success');
        apiCache.invalidate('tasks');
        await init();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}
