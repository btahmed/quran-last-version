/**
 * Student Profile Editor
 * Handles student profile viewing and editing functionality
 */

class StudentProfileEditor {
    constructor() {
        this.apiBaseUrl = '/api/admin';
        this.currentStudentId = null;
        this.currentProfileData = null;
        this.changedFields = new Set();
        this.historyPage = 1;
        
        this.init();
    }
    
    init() {
        console.log('🎓 Initializing StudentProfileEditor...');
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Real-time validation
        const emailInput = document.getElementById('profile-email');
        if (emailInput) {
            emailInput.addEventListener('input', () => this.validateEmail());
        }
        
        const phoneInput = document.getElementById('profile-phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', () => this.validatePhone());
        }
        
        // Track changes
        const formFields = ['profile-first-name', 'profile-last-name', 'profile-email', 
                           'profile-phone', 'profile-level', 'profile-status', 
                           'profile-notes', 'profile-objectives', 'profile-restrictions'];
        
        formFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('input', () => this.trackChange(fieldId));
            }
        });
    }
    
    /**
     * Open profile editor for a student
     */
    async openProfile(studentId) {
        console.log('📋 Opening profile for student:', studentId);
        
        this.currentStudentId = studentId;
        this.changedFields.clear();
        
        await this.loadStudentProfile(studentId);
        this.showModal('modal-student-profile');
    }
    
    /**
     * Load student profile data
     */
    async loadStudentProfile(studentId) {
        this.showLoading(true);
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/student-profile/${studentId}/`, {
                headers: {
                    'X-CSRFToken': this.getCSRFToken()
                },
                credentials: 'same-origin'
            });
            
            if (!response.ok) {
                throw new Error('Failed to load profile');
            }
            
            const data = await response.json();
            this.currentProfileData = data;
            
            this.populateForm(data);
            await this.loadHistory(studentId);
            
        } catch (error) {
            console.error('Error loading profile:', error);
            this.showToast('Erreur lors du chargement du profil', 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    /**
     * Populate form with profile data
     */
    populateForm(data) {
        // Basic info
        document.getElementById('profile-student-name').textContent = 
            `${data.first_name} ${data.last_name}`;
        
        // Form fields
        this.setFieldValue('profile-first-name', data.first_name);
        this.setFieldValue('profile-last-name', data.last_name);
        this.setFieldValue('profile-email', data.email);
        this.setFieldValue('profile-phone', data.phone || '');
        this.setFieldValue('profile-level', data.level || '');
        this.setFieldValue('profile-status', data.status || 'active');
        this.setFieldValue('profile-notes', data.notes || '');
        this.setFieldValue('profile-objectives', data.objectives || '');
        this.setFieldValue('profile-restrictions', data.restrictions || '');
        
        // Special case JSON editor
        const specialCase = data.special_case || {};
        document.getElementById('profile-special-case').value = 
            JSON.stringify(specialCase, null, 2);
        
        // Group info
        const groupName = data.group_name || 'Aucun groupe';
        document.getElementById('profile-group').textContent = groupName;
    }
    
    /**
     * Set field value helper
     */
    setFieldValue(fieldId, value) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.value = value || '';
        }
    }
    
    /**
     * Track field changes
     */
    trackChange(fieldId) {
        this.changedFields.add(fieldId);
        
        // Highlight changed field
        const field = document.getElementById(fieldId);
        if (field) {
            field.classList.add('field-changed');
        }
    }
    
    /**
     * Validate email
     */
    validateEmail() {
        const emailInput = document.getElementById('profile-email');
        const errorDiv = document.getElementById('email-error');
        
        if (!emailInput || !errorDiv) return true;
        
        const email = emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (email && !emailRegex.test(email)) {
            errorDiv.textContent = '❌ Email invalide';
            errorDiv.style.display = 'block';
            emailInput.classList.add('invalid');
            return false;
        } else {
            errorDiv.style.display = 'none';
            emailInput.classList.remove('invalid');
            return true;
        }
    }
    
    /**
     * Validate phone
     */
    validatePhone() {
        const phoneInput = document.getElementById('profile-phone');
        const errorDiv = document.getElementById('phone-error');
        
        if (!phoneInput || !errorDiv) return true;
        
        const phone = phoneInput.value.trim();
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        
        if (phone && !phoneRegex.test(phone)) {
            errorDiv.textContent = '❌ Téléphone invalide';
            errorDiv.style.display = 'block';
            phoneInput.classList.add('invalid');
            return false;
        } else {
            errorDiv.style.display = 'none';
            phoneInput.classList.remove('invalid');
            return true;
        }
    }
    
    /**
     * Update profile
     */
    async updateProfile() {
        console.log('💾 Updating profile...');
        
        // Validate
        if (!this.validateEmail() || !this.validatePhone()) {
            this.showToast('Veuillez corriger les erreurs de validation', 'warning');
            return;
        }
        
        // Collect changed data
        const updates = {};
        
        if (this.changedFields.has('profile-first-name')) {
            updates.first_name = document.getElementById('profile-first-name').value.trim();
        }
        if (this.changedFields.has('profile-last-name')) {
            updates.last_name = document.getElementById('profile-last-name').value.trim();
        }
        if (this.changedFields.has('profile-email')) {
            updates.email = document.getElementById('profile-email').value.trim();
        }
        if (this.changedFields.has('profile-phone')) {
            updates.phone = document.getElementById('profile-phone').value.trim();
        }
        if (this.changedFields.has('profile-level')) {
            updates.level = document.getElementById('profile-level').value;
        }
        if (this.changedFields.has('profile-status')) {
            updates.status = document.getElementById('profile-status').value;
        }
        if (this.changedFields.has('profile-notes')) {
            updates.notes = document.getElementById('profile-notes').value.trim();
        }
        if (this.changedFields.has('profile-objectives')) {
            updates.objectives = document.getElementById('profile-objectives').value.trim();
        }
        if (this.changedFields.has('profile-restrictions')) {
            updates.restrictions = document.getElementById('profile-restrictions').value.trim();
        }
        
        // Special case JSON
        try {
            const specialCaseText = document.getElementById('profile-special-case').value.trim();
            if (specialCaseText) {
                updates.special_case = JSON.parse(specialCaseText);
            }
        } catch (error) {
            this.showToast('❌ JSON invalide pour cas spécial', 'error');
            return;
        }
        
        if (Object.keys(updates).length === 0) {
            this.showToast('Aucune modification à enregistrer', 'warning');
            return;
        }
        
        this.showLoading(true);
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/student-profile/${this.currentStudentId}/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCSRFToken()
                },
                credentials: 'same-origin',
                body: JSON.stringify(updates)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erreur lors de la mise à jour');
            }
            
            this.showToast('✅ Profil mis à jour avec succès', 'success');
            this.changedFields.clear();
            
            // Remove highlight from changed fields
            document.querySelectorAll('.field-changed').forEach(field => {
                field.classList.remove('field-changed');
            });
            
            // Reload profile and history
            await this.loadStudentProfile(this.currentStudentId);
            
        } catch (error) {
            console.error('Error updating profile:', error);
            this.showToast(error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    /**
     * Load history (group changes and profile modifications)
     */
    async loadHistory(studentId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/student-profile/${studentId}/`, {
                headers: {
                    'X-CSRFToken': this.getCSRFToken()
                },
                credentials: 'same-origin'
            });
            
            if (!response.ok) throw new Error('Failed to load history');
            
            const data = await response.json();
            
            // Render group history
            this.renderGroupHistory(data.group_history || []);
            
            // Render profile modifications (from audit log)
            this.renderProfileHistory(data.profile_history || []);
            
        } catch (error) {
            console.error('Error loading history:', error);
        }
    }
    
    /**
     * Render group change history
     */
    renderGroupHistory(history) {
        const container = document.getElementById('group-history-list');
        if (!container) return;
        
        if (history.length === 0) {
            container.innerHTML = '<p class="empty-state">Aucun historique de groupe</p>';
            return;
        }
        
        container.innerHTML = history.map(item => `
            <div class="history-item">
                <div class="history-date">${this.formatDate(item.changed_at)}</div>
                <div class="history-content">
                    <strong>👨‍💼 ${item.changed_by}</strong>
                    <div>Groupe: ${item.old_group || 'Aucun'} → ${item.new_group}</div>
                </div>
            </div>
        `).join('');
    }
    
    /**
     * Render profile modification history
     */
    renderProfileHistory(history) {
        const container = document.getElementById('profile-history-list');
        if (!container) return;
        
        if (history.length === 0) {
            container.innerHTML = '<p class="empty-state">Aucun historique de modification</p>';
            return;
        }
        
        container.innerHTML = history.map(item => `
            <div class="history-item">
                <div class="history-date">${this.formatDate(item.timestamp)}</div>
                <div class="history-content">
                    <strong>👨‍💼 ${item.admin_user}</strong>
                    <div class="history-changes">
                        ${this.formatChanges(item.before_data, item.after_data)}
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    /**
     * Format changes for display
     */
    formatChanges(before, after) {
        const changes = [];
        
        for (const key in after) {
            if (before[key] !== after[key]) {
                changes.push(`
                    <div class="change-item">
                        <span class="field-name">${key}:</span>
                        <span class="old-value">${before[key] || '-'}</span>
                        →
                        <span class="new-value">${after[key] || '-'}</span>
                    </div>
                `);
            }
        }
        
        return changes.join('') || 'Aucun changement';
    }
    
    /**
     * Format date
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('fr-FR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    /**
     * Close profile editor
     */
    closeProfile() {
        if (this.changedFields.size > 0) {
            if (!confirm('Des modifications non enregistrées seront perdues. Continuer ?')) {
                return;
            }
        }
        
        this.closeModal('modal-student-profile');
        this.currentStudentId = null;
        this.currentProfileData = null;
        this.changedFields.clear();
    }
    
    /**
     * Utility: Show/hide modal
     */
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
        }
    }
    
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    /**
     * Utility: Show toast notification
     */
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
    
    /**
     * Utility: Show/hide loading spinner
     */
    showLoading(show) {
        const spinner = document.getElementById('loading-spinner');
        if (spinner) {
            spinner.style.display = show ? 'flex' : 'none';
        }
    }
    
    /**
     * Utility: Get CSRF token
     */
    getCSRFToken() {
        return document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';
    }
}

// Global instance
let profileEditor;

// Global functions for onclick handlers
function openStudentProfile(studentId) {
    if (!profileEditor) {
        profileEditor = new StudentProfileEditor();
    }
    profileEditor.openProfile(studentId);
}

function saveStudentProfile() {
    if (profileEditor) {
        profileEditor.updateProfile();
    }
}

function closeStudentProfile() {
    if (profileEditor) {
        profileEditor.closeProfile();
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    profileEditor = new StudentProfileEditor();
});
