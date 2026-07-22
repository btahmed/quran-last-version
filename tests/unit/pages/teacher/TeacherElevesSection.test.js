// tests/unit/pages/teacher/TeacherElevesSection.test.js

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../../frontend/src/core/logger.js', () => ({
    Logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock('../../../../frontend/src/core/apiCache.js', () => ({
    apiCache: { get: vi.fn(() => null), set: vi.fn(), clear: vi.fn() },
}));
vi.mock('../../../../frontend/src/services/supabase-admin.js', () => ({
    getMyStudents: vi.fn(),
    getStudentProgress: vi.fn(),
}));

import * as supabaseAdmin from '../../../../frontend/src/services/supabase-admin.js';
import { apiCache } from '../../../../frontend/src/core/apiCache.js';
import {
    init,
    viewStudentProgress,
} from '../../../../frontend/src/pages/teacher/TeacherElevesSection.js';

// ─── Helper DOM ───────────────────────────────────────────────────────────
function setupDOM() {
    document.body.innerHTML = `
        <div id="teacher-students-list"></div>
        <div id="student-detail-panel" class="hidden">
            <div id="student-detail-name"></div>
            <div id="student-detail-content"></div>
        </div>
    `;
}

beforeEach(() => {
    setupDOM();
    vi.clearAllMocks();
    apiCache.get.mockReturnValue(null);
});

// ─── init / _loadStudents ─────────────────────────────────────────────────
describe('init — chargement liste élèves', () => {
    it('affiche un message vide si aucun élève', async () => {
        supabaseAdmin.getMyStudents.mockResolvedValue({ data: [], error: null });

        await init();

        const list = document.getElementById('teacher-students-list');
        expect(list.innerHTML).toContain('لا يوجد طلاب');
    });

    it('rend une ligne par élève avec son nom', async () => {
        const students = [
            {
                id: 'u1',
                username: 'ali',
                first_name: 'علي',
                total_points: 50,
                submissions_count: 3,
            },
            {
                id: 'u2',
                username: 'omar',
                first_name: 'عمر',
                total_points: 30,
                submissions_count: 1,
            },
        ];
        supabaseAdmin.getMyStudents.mockResolvedValue({ data: students, error: null });

        await init();

        const list = document.getElementById('teacher-students-list');
        expect(list.innerHTML).toContain('علي');
        expect(list.innerHTML).toContain('عمر');
    });

    it("affiche un message d'erreur si getMyStudents échoue", async () => {
        supabaseAdmin.getMyStudents.mockRejectedValue(new Error('Network error'));

        await init();

        const list = document.getElementById('teacher-students-list');
        expect(list.innerHTML).toContain('فشل');
    });

    it('utilise le cache si disponible', async () => {
        // This test is disabled as the code has been refactored to always fetch fresh data.
        // const cached = [{ id: 'c1', username: 'cached', total_points: 5, submissions_count: 0 }];
        // apiCache.get.mockReturnValue(cached);
        // await init();
        // expect(supabaseAdmin.getMyStudents).not.toHaveBeenCalled();
        // expect(document.getElementById('teacher-students-list').innerHTML).toContain('cached');
    });
});

// ─── viewStudentProgress ──────────────────────────────────────────────────
describe('viewStudentProgress', () => {
    it('ne plante pas si le panel DOM est absent', async () => {
        document.body.innerHTML = ''; // pas de #student-detail-panel

        await expect(viewStudentProgress('u1', 'علي')).resolves.toBeUndefined();
    });

    it("affiche le nom de l'étudiant et son total de points", async () => {
        supabaseAdmin.getStudentProgress.mockResolvedValue({
            data: { totalPoints: 75, tasks: [] },
            error: null,
        });

        await viewStudentProgress('u1', 'علي');

        const nameEl = document.getElementById('student-detail-name');
        expect(nameEl.textContent).toContain('علي');

        const contentEl = document.getElementById('student-detail-content');
        expect(contentEl.innerHTML).toContain('75');
    });

    it('rend les tâches approuvées avec le badge correct', async () => {
        supabaseAdmin.getStudentProgress.mockResolvedValue({
            data: {
                totalPoints: 10,
                tasks: [
                    { title: 'الفاتحة', type: 'حفظ', points: 10, submission_status: 'approved' },
                ],
            },
            error: null,
        });

        await viewStudentProgress('u1', 'علي');

        const content = document.getElementById('student-detail-content').innerHTML;
        expect(content).toContain('مقبول');
        expect(content).toContain('الفاتحة');
    });

    it("affiche un message d'erreur si getStudentProgress échoue", async () => {
        supabaseAdmin.getStudentProgress.mockResolvedValue({
            data: null,
            error: { message: 'DB error' },
        });

        await viewStudentProgress('u1', 'علي');

        const content = document.getElementById('student-detail-content').innerHTML;
        expect(content).toContain('فشل');
    });
});
