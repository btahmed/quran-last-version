// frontend/src/services/tasks.js
import { Logger } from '../core/logger.js';
import { config } from '../core/config.js';
import { state } from '../core/state.js';
import { showNotification } from '../core/ui.js';
import * as SupabaseTasks from './supabase-tasks.js';

// ===================================
// CHARGEMENT DES TÂCHES DEPUIS L'API
// ===================================

export async function loadTasksFromApi() {
    Logger.log('API', 'Loading tasks from Supabase...');

    try {
        const { data, error } = await SupabaseTasks.getMyTasks();

        if (error) {
            Logger.error('API', 'Failed to load tasks', error);
            return;
        }

        if (Array.isArray(data)) {
            Logger.log('API', `Loaded ${data.length} tasks`);
            state.tasks = data;
            localStorage.setItem(config.tasksKey, JSON.stringify(data));
        }
    } catch (error) {
        Logger.error('API', 'Failed to load tasks', error);
    }
}

// ===================================
// CRÉATION D'UNE TÂCHE (PROF)
// ===================================

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

    const payload = {
        title: document.getElementById('task-title').value.trim(),
        description: document.getElementById('task-description').value.trim(),
        type: document.getElementById('task-type').value,
        points: parseInt(document.getElementById('task-points').value) || 0,
        due_date: document.getElementById('task-due-date').value || null,
    };

    try {
        if (assignMode === 'all') {
            // Récupérer tous les étudiants et créer une tâche par étudiant
            const { getAllUsers } = await import('./supabase-admin.js');
            const { data: users } = await getAllUsers();
            const students = (users || []).filter(u => u.role === 'student');
            for (const student of students) {
                const { error } = await SupabaseTasks.createTask({ ...payload, user_id: student.id });
                if (error) throw new Error(error.message || 'خطأ في إنشاء المهمة');
            }
        } else {
            for (const studentId of studentIds) {
                const { error } = await SupabaseTasks.createTask({ ...payload, user_id: studentId });
                if (error) throw new Error(error.message || 'خطأ في إنشاء المهمة');
            }
        }

        showNotification('تم إنشاء المهمة بنجاح!', 'success');
        document.getElementById('teacher-create-task-form').reset();
        document.getElementById('student-select-container')?.classList.add('hidden');
        window.QuranReview.switchTeacherTab('pending');
        window.QuranReview.loadTeacherDashboard();
        window.QuranReview._teacherTasks = null;
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// handleDeleteAllTasks supprimée — utiliser TeacherPage.handleDeleteAllTasks()

// ===================================
// SWITCH ONGLET TÂCHES (ÉTUDIANT)
// ===================================

export function switchTaskTab(tabName) {
    // Mettre à jour les boutons onglet
    document.querySelectorAll('#mytasks-page .tab').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`#mytasks-page .tab[onclick*="${tabName}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    const tasksList = document.getElementById('student-tasks-list');
    if (!tasksList) return;

    // Tuer les tweens GSAP bloqués et forcer la visibilité
    if (window.gsap) {
        gsap.killTweensOf(tasksList);
        gsap.set(tasksList, { clearProps: 'opacity,transform,translate,rotate,scale' });
    }

    const tasks = window.QuranReview._studentTasks || [];
    const subByTask = window.QuranReview._studentSubByTask || {};

    if (!tasks.length) {
        tasksList.innerHTML = '<p class="empty-state">لا توجد مهام حالياً</p>';
        return;
    }

    // Filtrer les tâches selon l'onglet sélectionné
    const filtered = tasks.filter(task => {
        const sub = subByTask[task.id];
        const status = sub ? sub.status : 'new';
        return tabName === 'completed' ? status === 'approved' : status !== 'approved';
    });

    if (!filtered.length) {
        tasksList.innerHTML = `<p class="empty-state">${tabName === 'completed' ? 'لا توجد مهام مكتملة بعد' : 'لا توجد مهام قيد الانتظار'}</p>`;
        return;
    }

    // Re-rendre uniquement les tâches filtrées
    tasksList.innerHTML = filtered.map(task => {
        const sub = subByTask[task.id];
        let dotClass = 'task-status-pending';
        let statusBadge = '<span class="badge" style="background:rgba(59,130,246,0.15);color:#3b82f6;">لم يُسلَّم</span>';
        let actionBtn = `<button class="btn btn-primary btn-sm" onclick="QuranReview.openRecordModal(${task.id}, '${task.title.replace(/'/g, "\\'")}')">🎤 تسجيل</button>`;

        if (sub) {
            if (sub.status === 'approved') {
                dotClass = 'task-status-completed';
                statusBadge = '<span class="badge" style="background:rgba(16,185,129,0.15);color:#10b981;">مقبول ✓</span>';
                actionBtn = '';
            } else if (sub.status === 'rejected') {
                dotClass = 'task-status-pending';
                statusBadge = '<span class="badge" style="background:rgba(239,68,68,0.15);color:#ef4444;">مرفوض ✗</span>';
                actionBtn = `<button class="btn btn-primary btn-sm" onclick="QuranReview.openRecordModal(${task.id}, '${task.title.replace(/'/g, "\\'")}')">🎤 إعادة التسجيل</button>`;
            } else {
                dotClass = 'task-status-submitted';
                statusBadge = '<span class="badge badge-warning" style="font-size:0.7rem;padding:2px 8px;">بانتظار التصحيح</span>';
                actionBtn = '';
            }
        }

        const typeLabel = task.type_display || (task.task_type === 'memorization' ? 'حفظ' : task.task_type === 'recitation' ? 'تلاوة' : 'أخرى');
        const dueDate = task.due_date ? new Date(task.due_date).toLocaleDateString('ar-SA') : '';

        return `<div class="task-card">
            <span class="task-status ${dotClass}"></span>
            <div style="flex:1;min-width:0;">
                <div style="font-weight:600;margin-bottom:var(--space-1);">${task.title}</div>
                <div style="font-size:0.875rem;color:var(--color-text-secondary);display:flex;flex-wrap:wrap;gap:var(--space-2);align-items:center;">
                    <span class="badge badge-primary" style="font-size:0.7rem;">${typeLabel}</span>
                    🏆 ${task.points} نقطة
                    ${dueDate ? `<span>📅 ${dueDate}</span>` : ''}
                </div>
                ${task.description ? `<div style="font-size:0.8rem;color:var(--color-text-secondary);margin-top:var(--space-1);">${task.description}</div>` : ''}
                ${sub && sub.status === 'rejected' && sub.admin_feedback ? `<div style="font-size:0.8rem;color:#ef4444;margin-top:var(--space-1);">💬 ${sub.admin_feedback}</div>` : ''}
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:var(--space-2);flex-shrink:0;">
                ${statusBadge}
                ${actionBtn}
            </div>
        </div>`;
    }).join('');
}
