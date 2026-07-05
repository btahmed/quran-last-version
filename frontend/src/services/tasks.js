// frontend/src/services/tasks.js
import { Logger } from '../core/logger.js';
import { config } from '../core/config.js';
import { state } from '../core/state.js';
import * as SupabaseTasks from './supabase-tasks.js';

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

// handleCreateTask → TeacherDevoirsSection.js
// handleDeleteAllTasks → TeacherPage.handleDeleteAllTasks()
// switchTaskTab → MyTasksPage.switchTaskTab()
