import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI ? 'github' : 'list',

    use: {
        baseURL: 'http://localhost:3456',
        trace: 'on-first-retry',
        // l'app a un loading screen GSAP avec fallback 5s
        navigationTimeout: 15000,
        actionTimeout: 8000,
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    webServer: {
        // serve gère correctement les MIME types ES modules
        command: 'npx serve frontend -l 3456 --no-clipboard',
        url: 'http://localhost:3456',
        reuseExistingServer: !process.env.CI,
        timeout: 15000,
    },
});
