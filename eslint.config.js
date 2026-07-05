import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';

export default [
    js.configs.recommended,
    prettierConfig,
    {
        ignores: [
            'node_modules/**',
            'frontend/src/lib/**',
            'backend/**',
            'coverage/**',
            '.husky/**',
        ],
    },
    {
        files: ['frontend/src/**/*.js', 'tests/**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                // Browser APIs
                window: 'readonly',
                document: 'readonly',
                localStorage: 'readonly',
                sessionStorage: 'readonly',
                navigator: 'readonly',
                location: 'readonly',
                history: 'readonly',
                fetch: 'readonly',
                console: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
                requestAnimationFrame: 'readonly',
                cancelAnimationFrame: 'readonly',
                performance: 'readonly',
                confirm: 'readonly',
                alert: 'readonly',
                prompt: 'readonly',
                Notification: 'readonly',
                MediaRecorder: 'readonly',
                Audio: 'readonly',
                Blob: 'readonly',
                URL: 'readonly',
                FormData: 'readonly',
                FileReader: 'readonly',
                Event: 'readonly',
                CustomEvent: 'readonly',
                MutationObserver: 'readonly',
                IntersectionObserver: 'readonly',
                indexedDB: 'readonly',
                caches: 'readonly',
                self: 'readonly',
                // Browser crypto / base64
                atob: 'readonly',
                btoa: 'readonly',
                crypto: 'readonly',
                // CDN globals
                gsap: 'readonly',
                Chart: 'readonly',
                workbox: 'readonly',
                supabase: 'readonly',
                QuranAudio: 'readonly',
            },
        },
        rules: {
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            'no-console': 'off',
            'no-eval': 'error',
            'no-implied-eval': 'error',
            'no-new-func': 'error',
            'no-script-url': 'error',
            eqeqeq: ['error', 'always', { null: 'ignore' }],
            'no-var': 'error',
            'prefer-const': 'warn',
        },
    },
    {
        files: ['tests/unit/**/*.js', 'tests/setup.js'],
        languageOptions: {
            globals: {
                describe: 'readonly',
                it: 'readonly',
                expect: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',
                vi: 'readonly',
                global: 'readonly',
                queueMicrotask: 'readonly',
            },
        },
    },
    {
        // Service Worker — environnement SW (self, caches, clients, Response, etc.)
        files: ['frontend/sw.js'],
        languageOptions: {
            globals: {
                self: 'readonly',
                caches: 'readonly',
                clients: 'readonly',
                fetch: 'readonly',
                Response: 'readonly',
                Request: 'readonly',
                URL: 'readonly',
                console: 'readonly',
                skipWaiting: 'readonly',
                importScripts: 'readonly',
            },
        },
    },
    {
        // Tests E2E Playwright — environnement Node.js (pas browser)
        files: ['tests/e2e/**/*.js', 'playwright.config.js'],
        languageOptions: {
            globals: {
                process: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
            },
        },
    },
];
