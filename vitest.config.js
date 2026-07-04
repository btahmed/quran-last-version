import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'jsdom',
        setupFiles: ['./tests/setup.js'],
        include: ['tests/**/*.test.js'],
        globals: true,
        coverage: {
            provider: 'v8',
            // Limiter aux modules qu'on possède et qu'on peut tester unitairement.
            // Les pages SPA (WardPage, MyTasksPage, etc.) dépendent du DOM complet
            // et de Supabase live — elles sont couvertes par les E2E Playwright.
            include: [
                'frontend/src/core/state.js',
                'frontend/src/core/apiCache.js',
                'frontend/src/core/validators.js',
                'frontend/src/core/sanitize.js',
                // ui.js et logger.js exclus : 100% DOM/console, couverts par E2E Playwright
                'frontend/src/services/auth.js',
                'frontend/src/services/tasks.js',
                'frontend/src/services/offline-queue.js',
                'frontend/src/pages/teacher/TeacherElevesSection.js',
            ],
            thresholds: {
                // auth.js et tasks.js sont DOM/Supabase-dépendants → couverts par E2E
                lines: 70,
                functions: 75,
                branches: 75,
                statements: 70,
            },
            reporter: ['text', 'lcov', 'html'],
        },
    },
});
