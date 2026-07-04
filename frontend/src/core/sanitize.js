// frontend/src/core/sanitize.js
// Sanitisation HTML — protège contre XSS avant injection dans le DOM.
// Règle : toujours préférer textContent. N'utiliser sanitizeHtml que si
// du balisage est vraiment nécessaire (notes enseignant, etc.)

const _ALLOWED = new Set(['B', 'I', 'BR', 'STRONG', 'EM']);

/**
 * Supprime tout HTML — retourne du texte pur.
 * Utilisation : afficher du contenu utilisateur sans formatage.
 */
export function sanitizeText(s) {
    const div = document.createElement('div');
    div.textContent = String(s ?? '');
    return div.innerHTML; // HTML-escaped, sans balises
}

/**
 * Autorise uniquement <b><i><br><strong><em> — supprime tout le reste.
 * Utilisation : notes enseignant qui peuvent contenir un peu de formatage.
 */
export function sanitizeHtml(s) {
    const div = document.createElement('div');
    div.innerHTML = String(s ?? '');

    div.querySelectorAll('*').forEach(el => {
        if (!_ALLOWED.has(el.tagName)) {
            el.replaceWith(document.createTextNode(el.textContent));
        }
        // Supprimer tous les attributs (onclick, style, etc.)
        [...el.attributes].forEach(attr => el.removeAttribute(attr.name));
    });

    return div.innerHTML;
}

/**
 * Escape HTML — alias de sanitizeText pour les templates littéraux.
 * Compatible avec la fonction escapeHtml() déjà présente dans les pages.
 */
export function escapeHtml(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
