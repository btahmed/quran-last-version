// frontend/src/components/UserEditModal.js
// Gestion du modal d'édition utilisateur (Admin)
// handleUpdateUser est déjà extrait dans TeacherPage.js — on le réexporte ici pour centraliser.
import { config } from '../core/config.js';
import { showNotification } from '../core/ui.js';
import { Logger } from '../core/logger.js';
export { handleUpdateUser } from '../pages/TeacherPage.js';

/**
 * Ouvre le modal d'édition et pré-remplit les champs avec les données de l'utilisateur.
 * @param {number|string} userId
 * @param {string} username
 * @param {string} firstName
 * @param {string} lastName
 * @param {string} role - 'student' | 'teacher' | 'admin'
 * @param {boolean} isSuperuser
 */
export function openUserEditModal(userId, username, firstName, lastName, role, isSuperuser) {
    const modal = document.getElementById('user-edit-modal');
    document.getElementById('edit-user-id').value = userId;
    document.getElementById('edit-username').value = username;
    document.getElementById('edit-first-name').value = firstName;
    document.getElementById('edit-last-name').value = lastName;
    document.getElementById('edit-role').value = role;
    document.getElementById('edit-is-superuser').checked = isSuperuser;

    modal?.classList.remove('hidden');
    modal?.classList.add('active');
}

/**
 * Ferme le modal d'édition et réinitialise les messages d'erreur/succès.
 */
export function closeUserEditModal() {
    const modal = document.getElementById('user-edit-modal');
    modal?.classList.add('hidden');
    modal?.classList.remove('active');

    // Réinitialiser les messages de retour
    const errorEl = document.getElementById('user-edit-error');
    const successEl = document.getElementById('user-edit-success');
    if (errorEl) errorEl.classList.add('hidden');
    if (successEl) successEl.classList.add('hidden');
}
