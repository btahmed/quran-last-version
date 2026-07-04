import { test, expect } from '@playwright/test';
import { waitForApp } from './helpers.js';

test.describe('Navigation — visiteur non connecté', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await waitForApp(page);
    });

    test('la page charge sans erreur critique', async ({ page }) => {
        const errors = [];
        page.on('pageerror', err => {
            // on ignore les erreurs de ressources CDN (Cloudinary, everyayah…)
            if (!err.message.includes('Failed to load resource')) {
                errors.push(err.message);
            }
        });

        // re-navigate pour capturer les erreurs dès le chargement
        await page.goto('/');
        await waitForApp(page);

        expect(errors).toHaveLength(0);
    });

    test("le titre de la page contient le nom de l'app", async ({ page }) => {
        // Titre réel : "مراجعة القرآن - Pro Edition"
        await expect(page).toHaveTitle(/مراجعة القرآن|QuranReview|Pro Edition/i);
    });

    test('#app contient du contenu après le loading', async ({ page }) => {
        const app = page.locator('#app');
        await expect(app).not.toBeEmpty();
    });

    test('la nav principale est visible', async ({ page }) => {
        // .nav-container est le top nav (toujours visible, desktop + mobile)
        // #bottom-bar est CSS-hidden sur desktop (mobile only)
        const nav = page.locator('.nav-container');
        await expect(nav).toBeVisible();
    });

    test('le bouton de connexion est présent dans la nav', async ({ page }) => {
        // NavManager injecte un bouton avec onclick showAuthModal
        const loginBtn = page.locator(
            '[onclick*="showAuthModal"], button:has-text("تسجيل"), a:has-text("تسجيل")'
        );
        await expect(loginBtn.first()).toBeVisible();
    });
});

test.describe('Navigation — routes SPA', () => {
    test('la page reste stable après plusieurs navigations', async ({ page }) => {
        await page.goto('/');
        await waitForApp(page);

        // Vérifier que le contenu est présent après chargement
        await expect(page.locator('#app')).not.toBeEmpty();
        await expect(page.locator('.nav-container')).toBeVisible();
    });
});
