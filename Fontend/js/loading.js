// ================================================================
// LOADING OVERLAY
// ================================================================

let loadingCount = 0;
let loadingTimeout = null;
const DEFAULT_TIMEOUT = 30000; // 30 giây

/**
 * Hiển thị loading overlay
 * @param {string} text - Nội dung hiển thị
 * @param {number} timeout - Tự động ẩn sau X ms (mặc định 30s)
 */
function showLoading(text = 'Đang xử lý...', timeout = DEFAULT_TIMEOUT) {
    loadingCount++;
    
    let overlay = document.getElementById('loading-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p class="loading-text">${text}</p>
                <p class="loading-sub" style="font-size:12px; color:#999; margin-top:8px;">Vui lòng đợi...</p>
            </div>
        `;
        document.body.appendChild(overlay);
    } else {
        const textEl = overlay.querySelector('.loading-text');
        if (textEl) textEl.textContent = text;
    }
    
    overlay.style.display = 'flex';
    overlay.style.opacity = '1';
    
    // Tự động ẩn sau timeout (phòng trường hợp lỗi không gọi hideLoading)
    if (loadingTimeout) clearTimeout(loadingTimeout);
    loadingTimeout = setTimeout(() => {
        if (loadingCount > 0) {
            console.warn('⚠️ Loading tự động ẩn sau timeout do lỗi hoặc quá lâu.');
            hideLoading();
        }
    }, timeout);
}

/**
 * Ẩn loading overlay
 */
function hideLoading() {
    loadingCount--;
    if (loadingCount <= 0) {
        loadingCount = 0;
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => {
                if (overlay) overlay.style.display = 'none';
            }, 300);
        }
        if (loadingTimeout) {
            clearTimeout(loadingTimeout);
            loadingTimeout = null;
        }
    }
}

/**
 * Reset loading (gọi khi cần xóa tất cả loading)
 */
function resetLoading() {
    loadingCount = 0;
    if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        loadingTimeout = null;
    }
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.display = 'none';
        overlay.style.opacity = '1';
    }
}

/**
 * Hàm bọc một async function với loading
 * @param {Function} fn - Hàm async cần chạy
 * @param {string} text - Nội dung loading
 * @param {number} timeout - Timeout tự động ẩn
 * @returns {Promise} Kết quả của fn
 */
async function withLoading(fn, text = 'Đang xử lý...', timeout = DEFAULT_TIMEOUT) {
    showLoading(text, timeout);
    try {
        const result = await fn();
        return result;
    } catch (error) {
        console.error('❌ Error in withLoading:', error);
        throw error;
    } finally {
        hideLoading();
    }
}

// ====== EXPORT GLOBAL ======
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.resetLoading = resetLoading;
window.withLoading = withLoading;

console.log('✅ Loading module loaded successfully.');