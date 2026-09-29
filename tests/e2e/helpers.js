// Helpers communs aux specs E2E

/**
 * Attend que l'app soit prête : loading screen caché ET #app contient du contenu.
 * waitForSelector avec .hidden échoue car Playwright attend un élément visible.
 * waitForFunction évalue directement dans le navigateur (pas de contrainte de visibilité).
 */
export async function waitForApp(page) {
    await page.waitForFunction(
        () => {
            const app = document.getElementById('app');

            return app && document.body;
        },
        { timeout: 8000 }
    );
}

/**
 * Ouvre le modal d'authentification en cliquant sur le bouton de nav.
 */
export async function openAuthModal(page) {
    // NavManager injecte un bouton avec data-action ou onclick showAuthModal
    const loginBtn = page.locator(
        '[onclick*="showAuthModal"], button[data-action="login"], .nav-login-btn, [onclick*="showLoginForm"], [onclick*="QuranReview.showLoginForm()"]'
    );
    await loginBtn.first().click();

    await page.waitForFunction(
        () => {
            const modal = document.getElementById('auth-modal');
            return modal && !modal.classList.contains('hidden');
        },
        { timeout: 5000 }
    );
}
