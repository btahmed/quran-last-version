// frontend/src/core/ui.js
import { saveData } from './state.js';

export function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#17a2b8'};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 1000;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        animation: slideDown 0.3s ease;
    `;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

export function updateTodayDate() {
    const todayDateElement = document.getElementById('today-date');
    if (todayDateElement) {
        const today = new Date();
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        todayDateElement.textContent = today.toLocaleDateString('ar-SA', options);
    }
}

export function setupAutoSave() {
    // Auto-save every 30 seconds
    setInterval(() => {
        saveData();
    }, 30000);

    // Save before page unload
    window.addEventListener('beforeunload', () => {
        saveData();
    });
}
