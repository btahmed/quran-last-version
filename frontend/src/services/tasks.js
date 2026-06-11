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

// switchTaskTab supprimée — remplacée par MyTasksPage.switchTaskTab (DS3)
