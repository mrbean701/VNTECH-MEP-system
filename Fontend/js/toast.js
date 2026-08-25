// ================================================================
// TOAST NOTIFICATION
// ================================================================

// Hàm hiển thị toast
function showToast(message, type = 'info', duration = 3000) {
    // Xóa toast cũ nếu có
    const oldToast = document.querySelector('.toast-container');
    if (oldToast) oldToast.remove();

    // Tạo container
    const container = document.createElement('div');
    container.className = 'toast-container';

    // Tạo toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    // Icon theo loại
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    toast.innerHTML = `
        <i class="fas ${icons[type] || icons.info} toast-icon"></i>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.closest('.toast-container').remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    container.appendChild(toast);
    document.body.appendChild(container);

    // Tự động ẩn sau duration
    setTimeout(() => {
        if (container.parentNode) {
            container.classList.add('toast-hide');
            setTimeout(() => {
                if (container.parentNode) container.remove();
            }, 300);
        }
    }, duration);
}

// Các hàm tiện ích
function showSuccess(message, duration) {
    showToast(message, 'success', duration);
}

function showError(message, duration) {
    showToast(message, 'error', duration);
}

function showWarning(message, duration) {
    showToast(message, 'warning', duration);
}

function showInfo(message, duration) {
    showToast(message, 'info', duration);
}

// Export ra window
window.showToast = showToast;
window.showSuccess = showSuccess;
window.showError = showError;
window.showWarning = showWarning;
window.showInfo = showInfo;

console.log('✅ Toast module loaded successfully.');