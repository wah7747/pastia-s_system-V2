/**
 * Toast Notification System
 * Replaces alert() popups with modern toast notifications
 */

class Toast {
    /**
     * Show a toast notification
     * @param {string} message - Message to display
     * @param {string} type - Type: 'success', 'error', 'warning', 'info'
     */
    static show(message, type = 'info', duration = 5000) {
        const container = this.getContainer();
        const toast = this.createToast(message, type);
        container.appendChild(toast);

        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 10);

        // Auto remove
        if (duration) {
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }
    }

    /**
     * Show confirmation toast with Yes/No buttons
     * @param {string} message - Confirmation message
     * @param {function} onConfirm - Callback for Yes button
     * @param {function} onCancel - Callback for No button (optional)
     */
    static confirm(message, onConfirm, onCancel = null) {
        const container = this.getContainer();
        const toast = this.createConfirmToast(message, onConfirm, onCancel);
        container.appendChild(toast);

        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 10);
    }

    /**
     * Create toast element
     */
    static createToast(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icon = this.getIcon(type);

        toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
      </div>
      <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
    `;

        return toast;
    }

    /**
     * Create confirmation toast
     */
    static createConfirmToast(message, onConfirm, onCancel) {
        const toast = document.createElement('div');
        toast.className = 'toast toast-confirm';

        toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">❓</span>
        <span class="toast-message">${message}</span>
      </div>
      <div class="toast-actions">
        <button class="toast-btn toast-btn-yes">Yes</button>
        <button class="toast-btn toast-btn-no">No</button>
      </div>
    `;

        // Add event listeners
        const yesBtn = toast.querySelector('.toast-btn-yes');
        const noBtn = toast.querySelector('.toast-btn-no');

        yesBtn.addEventListener('click', () => {
            if (onConfirm) onConfirm();
            toast.remove();
        });

        noBtn.addEventListener('click', () => {
            if (onCancel) onCancel();
            toast.remove();
        });

        return toast;
    }

    /**
     * Get icon for toast type
     */
    static getIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }

    /**
     * Get or create toast container
     */
    static getContainer() {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        return container;
    }

    /**
     * Convenience methods
     */
    static success(message) {
        this.show(message, 'success');
    }

    static error(message) {
        this.show(message, 'error');
    }

    static warning(message) {
        this.show(message, 'warning');
    }

    static info(message) {
        this.show(message, 'info');
    }
}

// Make Toast globally available
window.Toast = Toast;
