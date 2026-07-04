import { test, expect } from '@playwright/test';
import { waitForApp, openAuthModal } from './helpers.js';

test.describe('Auth — modal et formulaire', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await waitForApp(page);
    });

    test('le modal auth est caché au chargement', async ({ page }) => {
        const modal = page.locator('#auth-modal');
        await expect(modal).toHaveClass(/hidden/);
    });

    test('cliquer sur le bouton de connexion ouvre le modal', async ({ page }) => {
        await openAuthModal(page);
        const modal = page.locator('#auth-modal');
        await expect(modal).not.toHaveClass(/hidden/);
    });

    test('le formulaire de login contient les champs requis', async ({ page }) => {
        await openAuthModal(page);

        await expect(page.locator('#login-username')).toBeVisible();
        await expect(page.locator('#login-password')).toBeVisible();
        await expect(page.locator('#login-submit-btn')).toBeVisible();
    });

    test('le bouton submit est activé par défaut', async ({ page }) => {
        await openAuthModal(page);
        await expect(page.locator('#login-submit-btn')).toBeEnabled();
    });

    test('soumettre des identifiants invalides affiche une erreur', async ({ page }) => {
        test.setTimeout(20000); // appel Supabase réel → ~2-3s

        await openAuthModal(page);

        await page.fill('#login-username', 'utilisateur_inexistant_e2e');
        await page.fill('#login-password', 'motdepasse_invalide_xyz');
        await page.click('#login-submit-btn');

        // Attendre le retour Supabase et l'affichage de l'erreur
        const errorEl = page.locator(
            '#login-error, .notification-error, [class*="notification"][class*="error"]'
        );
        await expect(errorEl.first()).toBeVisible({ timeout: 10000 });
    });

    test("le modal se ferme en cliquant sur l'overlay", async ({ page }) => {
        await openAuthModal(page);

        // Le modal se ferme par clic sur l'overlay (#auth-modal) en dehors du contenu
        // On clique en haut à gauche (zone overlay, pas la carte centrale)
        await page.click('#auth-modal', { position: { x: 10, y: 10 } });

        await page.waitForFunction(
            () => document.getElementById('auth-modal')?.classList.contains('hidden'),
            { timeout: 3000 }
        );
        await expect(page.locator('#auth-modal')).toHaveClass(/hidden/);
    });
});

// ─── Tests avec vrais identifiants (seulement si env vars présentes) ──────────

const TEST_USER = process.env.E2E_USERNAME;
const TEST_PASS = process.env.E2E_PASSWORD;

test.describe('Auth — login réussi', () => {
    test.skip(!TEST_USER || !TEST_PASS, 'E2E_USERNAME / E2E_PASSWORD non définis');

    test('login avec identifiants valides charge le dashboard', async ({ page }) => {
        test.setTimeout(20000);

        await page.goto('/');
        await waitForApp(page);
        await openAuthModal(page);

        await page.fill('#login-username', TEST_USER);
        await page.fill('#login-password', TEST_PASS);
        await page.click('#login-submit-btn');

        // Après login réussi : modal fermé + dashboard visible
        await expect(page.locator('#auth-modal')).toHaveClass(/hidden/, { timeout: 10000 });
        await expect(page.locator('#app')).not.toBeEmpty();
    });
});
