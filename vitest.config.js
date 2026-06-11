import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'jsdom',
        setupFiles: ['./tests/setup.js'],
        include: ['tests/**/*.test.js'],
        globals: true,
        coverage: {
            provider: 'v8',
            include: ['frontend/src/**/*.js'],
            exclude: ['frontend/src/**/*.css', 'frontend/src/core/config.js'],
            thresholds: {
                lines: 80,
                functions: 80,
                branches: 70,
                statements: 80,
            },
            reporter: ['text', 'lcov', 'html'],
        },
    },
});
