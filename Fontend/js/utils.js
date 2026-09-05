// ================================================================
// UTILITY FUNCTIONS - DÙNG CACHE TỪ API
// ================================================================

// ====== KHAI BÁO CACHE ======
let _statusesCache = {};
window._statusesCache = _statusesCache;

// ====== LẤY THÔNG TIN VẬT TƯ (TỪ CACHE) ======
function getItemName(id) {
    const cache = window._itemsCache || [];
    const found = cache.find(i => i.id === id);
    return found ? found.name : 'N/A';
}

function getItemCode(id) {
    const cache = window._itemsCache || [];
    const found = cache.find(i => i.id === id);
    return found ? found.code : 'N/A';
}

function getItemUnit(id) {
    const cache = window._itemsCache || [];
    const found = cache.find(i => i.id === id);
    return found ? found.unit : '';
}

function getItemModel(id) {
    const cache = window._itemsCache || [];
    const found = cache.find(i => i.id === id);
    return found ? found.model : '';
}

function getProjectNameByProjectId(id) {
    const cache = window._projectsCache || [];
    const p = cache.find(pr => pr.id === id);
    return p ? p.name : 'N/A';
}

function getProjectNameByCode(code) {
    const cache = window._projectsCache || [];
    const p = cache.find(pr => pr.code === code);
    return p ? p.name : code;
}

function getProjectIdByCode(code) {
    const cache = window._projectsCache || [];
    const found = cache.find(p => p.code === code);
    return found ? found.id : null;
}

function getVendorName(code) {
    const cache = window._vendorsCache || [];
    const v = cache.find(vn => vn.code === code);
    return v ? v.name : code;
}

function getWarehouseName(id) {
    const cache = window._warehousesCache || [];
    const wh = cache.find(w => w.id === id);
    return wh ? wh.name : 'N/A';
}

function getWarehouseCode(id) {
    const cache = window._warehousesCache || [];
    const wh = cache.find(w => w.id === id);
    return wh ? wh.code : 'N/A';
}

// ====== QUẢN LÝ CACHE STATUS ======
async function getStatusesForModule(moduleType) {
    if (!_statusesCache[moduleType]) {
        try {
            const data = await api.getStatuses(moduleType);
            _statusesCache[moduleType] = data || [];
        } catch (e) {
            console.warn('Không thể lấy statuses cho module:', moduleType, e);
            _statusesCache[moduleType] = [];
        }
    }
    return _statusesCache[moduleType];
}

function getStatusInfo(statusCode, statuses) {
    if (!statuses || !Array.isArray(statuses) || statuses.length === 0) {
        return {
            name: statusCode || '--',
            color: '#6b7280',
            isDefault: false,
            isFinal: false,
            sortOrder: 999
        };
    }
    const found = statuses.find(s => s.code === statusCode);
    if (found) {
        return {
            name: found.name || statusCode,
            color: found.color || '#6b7280',
            isDefault: found.isDefault || false,
            isFinal: found.isFinal || false,
            sortOrder: found.sortOrder || 0
        };
    }
    return {
        name: statusCode || '--',
        color: '#6b7280',
        isDefault: false,
        isFinal: false,
        sortOrder: 999
    };
}

// ====== BADGE TRẠNG THÁI (CẬP NHẬT) ======
function getStatusBadgeWithInfo(statusCode, statuses) {
    // Nếu không có statuses hoặc rỗng, trả về badge đơn giản với màu xám
    if (!statuses || !Array.isArray(statuses) || statuses.length === 0) {
        return `<span class="badge" style="background-color:#6b7280; color:white; border-radius:12px; padding:4px 12px; font-weight:600; font-size:12px; display:inline-block;">${statusCode || '--'}</span>`;
    }

    const info = getStatusInfo(statusCode, statuses);
    const displayName = info.name || statusCode || '--';
    const color = info.color || '#6b7280';

    return `<span class="badge" style="background-color:${color}; color:white; border-radius:12px; padding:4px 12px; font-weight:600; font-size:12px; display:inline-block;">${displayName}</span>`;
}

// ====== BADGE TRẠNG THÁI CŨ (FALLBACK) ======
function getStatusBadge(status, color = null) {
    if (color) {
        return `<span class="badge" style="background-color:${color}; color:white; border-radius:12px; padding:4px 12px; font-weight:600; font-size:12px; display:inline-block;">${status}</span>`;
    }
    const map = {
        'DRAFT': 'badge-draft',
        'PENDING': 'badge-pending',
        'PENDING_PLANNING': 'badge-pending',
        'PENDING_PROJECT': 'badge-pending',
        'PENDING_CEO': 'badge-pending',
        'PLANNING_APPROVED': 'badge-approved',
        'PROJECT_APPROVED': 'badge-approved',
        'APPROVED': 'badge-approved',
        'REJECTED': 'badge-rejected',
        'COMPLETED': 'badge-completed',
        'CANCELLED': 'badge-cancelled',
        'CANCEL': 'badge-cancelled',
        'CONFIRMED': 'badge-completed',
        'RECEIVED': 'badge-info',
        'QC_CHECKED': 'badge-info',
        'CEO_APPROVED': 'badge-approved',
        'CEO_PENDING': 'badge-pending',
        'PARTIALLY_FULFILLED': 'badge-pending'
    };
    return `<span class="badge ${map[status] || 'badge-draft'}">${status}</span>`;
}

// ====== LẤY THÔNG TIN USER ======
function getUserApprovalLevel() {
    const user = getUser();
    return user?.approvalLevel || 0;
}

function getUserDepartmentId() {
    const user = getUser();
    return user?.departmentId || null;
}

// ====== KIỂM TRA QUYỀN DUYỆT (FRONTEND) ======
function canApprove(step, permissionKey, departmentId) {
    const user = getUser();
    if (!user) return false;
    
    // ADMIN có toàn quyền
    if (user.role === 'ADMIN') return true;
    
    // 1. Kiểm tra permission (nếu có)
    if (permissionKey && !hasPermission(permissionKey)) {
        return false;
    }
    
    // 2. Kiểm tra department (nếu có yêu cầu)
    if (departmentId && user.departmentId !== departmentId) {
        return false;
    }
    
    // 3. Kiểm tra approval level: chỉ duyệt được bước đúng với cấp duyệt của mình
    // ✅ SỬA LỖI: level === step (thay vì level >= step)
    const level = user.approvalLevel || 0;
    if (step === 0) return true; // Bước 0 (không cần duyệt) thì cho phép nếu có quyền
    return level === step;
}

// ====== RENDER APPROVAL PROGRESS ======
function renderApprovalProgress(status, step, stepsConfig, statuses) {
    const defaultSteps = [
        { id: 1, label: 'Phòng Kế hoạch' },
        { id: 2, label: 'Phòng Dự án' },
        { id: 3, label: 'Tổng Giám đốc' }
    ];
    const steps = stepsConfig && stepsConfig.length > 0 ? stepsConfig : defaultSteps;

    let currentStep = step || 1;
    currentStep = Math.min(currentStep, steps.length);

    const statusInfo = getStatusInfo(status, statuses || []);
    const statusName = statusInfo.name || status;

    // Hoàn thành (approvalStep = 0)
    if (step === 0 && (status === 'APPROVED' || status === 'COMPLETE' || status === 'COMPLETED')) {
        let progressHtml = `<div style="display:flex; align-items:center; justify-content:space-between; width:100%; margin:8px 0;">`;
        steps.forEach((s, idx) => {
            progressHtml += `
                <div style="display:flex; flex-direction:column; align-items:center; flex:1; position:relative;">
                    <div style="width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; background:#22c55e; color:white; z-index:2;">✓</div>
                    ${idx < steps.length - 1 ? `<div style="flex:1; height:3px; background:#22c55e; position:absolute; left:calc(50% + 14px); right:calc(-50% + 14px); top:14px; z-index:1;"></div>` : ''}
                </div>
            `;
        });
        progressHtml += `</div>`;
        let labelsHtml = `<div style="display:flex; justify-content:space-between; width:100%; margin-top:4px;">`;
        steps.forEach(s => labelsHtml += `<span style="text-align:center; flex:1; font-size:12px; color:#15803d; font-weight:500;">${s.label}</span>`);
        labelsHtml += `</div>`;
        return `
            <div style="background:#f0fdf4; border:1px solid #bbf7d0; padding:12px 16px; border-radius:8px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                    <span style="font-size:14px; font-weight:500; color:#15803d;">✅ Đã hoàn thành</span>
                    <span style="font-size:13px; background:#dcfce7; padding:2px 12px; border-radius:12px; color:#15803d;">${statusName}</span>
                </div>
                ${progressHtml}
                ${labelsHtml}
            </div>
        `;
    }

    // Từ chối
    if (status === 'REJECTED' || status === 'CANCELLED') {
        return `
            <div style="background:#fef2f2; border:1px solid #fecaca; padding:10px 14px; border-radius:8px; display:flex; align-items:center; gap:8px; color:#b91c1c;">
                <span style="font-weight:600;">❌ Đã bị từ chối</span>
                <span style="flex:1;"></span>
                <span style="font-size:13px; background:#fee2e2; padding:2px 12px; border-radius:12px; color:#b91c1c;">${statusName}</span>
            </div>
        `;
    }

    // Đang xử lý
    let progressHtml = `<div style="display:flex; align-items:center; justify-content:space-between; width:100%; margin:8px 0;">`;
    steps.forEach((s, idx) => {
        let circleBg = '';
        let lineColor = '';
        const stepNum = s.id || (idx + 1);
        if (stepNum < currentStep) {
            circleBg = 'background:#22c55e; color:white;';
            lineColor = '#22c55e';
        } else if (stepNum === currentStep) {
            circleBg = 'background:#f59e0b; color:white; box-shadow:0 0 0 4px #fef3c7;';
            lineColor = '#e5e7eb';
        } else {
            circleBg = 'background:#e5e7eb; color:#9ca3af;';
            lineColor = '#e5e7eb';
        }
        progressHtml += `
            <div style="display:flex; flex-direction:column; align-items:center; flex:1; position:relative;">
                <div style="width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; ${circleBg} z-index:2;">
                    ${stepNum < currentStep ? '✓' : stepNum}
                </div>
                ${idx < steps.length - 1 ? `<div style="flex:1; height:3px; background:${lineColor}; position:absolute; left:calc(50% + 14px); right:calc(-50% + 14px); top:14px; z-index:1;"></div>` : ''}
            </div>
        `;
    });
    progressHtml += `</div>`;

    let labelsHtml = `<div style="display:flex; justify-content:space-between; width:100%; margin-top:4px;">`;
    steps.forEach((s, idx) => {
        const stepNum = s.id || (idx + 1);
        let color = stepNum < currentStep ? '#15803d' : (stepNum === currentStep ? '#d97706' : '#9ca3af');
        let weight = stepNum === currentStep ? '600' : '400';
        labelsHtml += `<span style="text-align:center; flex:1; font-size:12px; color:${color}; font-weight:${weight};">${s.label}</span>`;
    });
    labelsHtml += `</div>`;

    const stepName = steps.find(s => (s.id || s.step) === currentStep)?.label || `Bước ${currentStep}`;
    return `
        <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:12px 16px; border-radius:8px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <span style="font-size:14px; font-weight:500; color:#334155;">⏳ Đang thực hiện</span>
                <span style="font-size:13px; background:#fef3c7; padding:2px 12px; border-radius:12px; color:#b45309;">${stepName}</span>
            </div>
            ${progressHtml}
            ${labelsHtml}
        </div>
    `;
}

// ====== TÊN BƯỚC DUYỆT ======
function getApprovalStepName(step) {
    const map = {
        1: 'Phòng Kế hoạch',
        2: 'Phòng Dự án',
        3: 'Tổng Giám đốc'
    };
    return map[step] || 'Không xác định';
}

// ====== ĐỊNH DẠNG TIỀN TỆ ======
function formatCurrency(amount) {
    if (amount === undefined || amount === null) return '0';
    return amount.toLocaleString('vi-VN') + ' VND';
}

// ====== ĐỊNH DẠNG NGÀY THÁNG ======
function formatDate(dateStr) {
    if (!dateStr) return '--';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('vi-VN');
    } catch {
        return dateStr;
    }
}

// ================================================================
// MODAL - CẢI TIẾN
// ================================================================
function showModal(title, contentHtml) {
    const modal = document.getElementById('modal');
    const content = document.getElementById('modal-content');
    content.innerHTML = `<h3>${title}</h3>${contentHtml}`;
    modal.classList.add('active');
    
    setTimeout(() => {
        const firstInput = content.querySelector('input:not([readonly]):not([disabled]), select:not([disabled]), textarea:not([readonly]):not([disabled])');
        if (firstInput) firstInput.focus();
        const requiredFields = content.querySelectorAll('input[required], select[required], textarea[required]');
        requiredFields.forEach(field => {
            let label = null;
            if (field.id) label = content.querySelector(`label[for="${field.id}"]`);
            if (!label) {
                const parent = field.closest('.form-group');
                if (parent) label = parent.querySelector('label');
            }
            if (label) label.classList.add('required');
        });
        const allInputs = content.querySelectorAll('input, select, textarea');
        allInputs.forEach(input => {
            input.removeEventListener('blur', handleBlur);
            input.addEventListener('blur', handleBlur);
        });
    }, 50);
}

function handleBlur(e) {
    const input = e.target;
    const formGroup = input.closest('.form-group');
    if (!formGroup) return;
    formGroup.classList.remove('has-error');
    let errorMsg = '';
    if (input.hasAttribute('required') && input.value.trim() === '') errorMsg = 'Trường này là bắt buộc';
    if (input.type === 'email' && input.value.trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) errorMsg = 'Email không hợp lệ';
    if (input.type === 'number' && input.value.trim() !== '' && isNaN(parseFloat(input.value))) errorMsg = 'Vui lòng nhập số';
    if (errorMsg) {
        formGroup.classList.add('has-error');
        let errorEl = formGroup.querySelector('.field-error');
        if (!errorEl) {
            errorEl = document.createElement('div');
            errorEl.className = 'field-error';
            formGroup.appendChild(errorEl);
        }
        errorEl.textContent = errorMsg;
    } else {
        formGroup.classList.remove('has-error');
        const errorEl = formGroup.querySelector('.field-error');
        if (errorEl) errorEl.textContent = '';
    }
}

function closeModal() {
    const modal = document.getElementById('modal');
    modal.classList.remove('active');
    document.querySelectorAll('.form-group.has-error').forEach(el => el.classList.remove('has-error'));
}

document.getElementById('modal')?.addEventListener('click', function(e) {
    if (e.target === this) closeModal();
});

// ================================================================
// PHÂN TRANG (CLIENT-SIDE)
// ================================================================
const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

function getPageSize(storageKey = 'default') {
    try {
        const map = getData('page_size_map') || {};
        const val = parseInt(map[storageKey]);
        return PAGE_SIZE_OPTIONS.includes(val) ? val : DEFAULT_PAGE_SIZE;
    } catch (e) { return DEFAULT_PAGE_SIZE; }
}

function setPageSize(storageKey, size) {
    try {
        const map = getData('page_size_map') || {};
        map[storageKey] = parseInt(size);
        saveData('page_size_map', map);
    } catch (e) {}
}

function paginate(list, page, perPage) {
    const arr = list || [];
    const totalItems = arr.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * perPage;
    return {
        items: arr.slice(start, start + perPage),
        page: safePage,
        perPage,
        totalItems,
        totalPages
    };
}

function buildPaginationHTML(paging, targetFn, storageKey = 'default') {
    if (!paging || paging.totalItems <= DEFAULT_PAGE_SIZE) return '';
    let html = `<div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-top:12px; justify-content:flex-end;">`;
    html += `<span style="font-size:13px; color:#666; margin-right:8px;">${paging.totalItems} dòng</span>`;
    html += `<button class="btn btn-sm" onclick="${targetFn}(${paging.page - 1})" ${paging.page <= 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>`;
    const startPage = Math.max(1, paging.page - 2);
    const endPage = Math.min(paging.totalPages, paging.page + 2);
    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="btn btn-sm ${i === paging.page ? 'btn-primary' : ''}" onclick="${targetFn}(${i})">${i}</button>`;
    }
    html += `<button class="btn btn-sm" onclick="${targetFn}(${paging.page + 1})" ${paging.page >= paging.totalPages ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>`;
    html += ` <select class="btn btn-sm" onchange="window._changePageSize('${storageKey}', this.value, '${targetFn}')" style="width:auto;">`;
    PAGE_SIZE_OPTIONS.forEach(sz => {
        html += `<option value="${sz}" ${sz === paging.perPage ? 'selected' : ''}>${sz} dòng/trang</option>`;
    });
    html += `</select>`;
    html += `</div>`;
    return html;
}

window._changePageSize = function(storageKey, size, targetFn) {
    setPageSize(storageKey, size);
    try {
        if (typeof window[targetFn] === 'function') window[targetFn](1);
    } catch (e) {}
};

// ================================================================
// SHOW WAREHOUSE INFO MODAL
// ================================================================
async function showWarehouseInfoModal(whId) {
    if (!whId) {
        showError('ID kho không hợp lệ!');
        return;
    }

    let wh = (window._warehousesCache || []).find(w => w.id === whId);
    
    if (!wh) {
        try {
            const warehouses = await api.getWarehouses();
            window._warehousesCache = warehouses;
            wh = warehouses.find(w => w.id === whId);
            if (wh) {
                saveData('warehouses', warehouses);
            }
        } catch (e) {
            console.warn('Không thể lấy danh sách kho từ API:', e);
        }
    }

    if (!wh) {
        showError('Không tìm thấy kho!');
        return;
    }

    const inventory = window._inventoryCache || [];
    const itemCount = inventory.filter(i => i.warehouse_id === whId || i.warehouseId === whId).length;
    const totalQty = inventory.filter(i => i.warehouse_id === whId || i.warehouseId === whId).reduce((s, i) => s + (i.quantity || 0), 0);
    const projectName = wh.type === 'SITE' ? getProjectNameByProjectId(wh.projectId) : 'Không áp dụng';
    const statusLabel = wh.status === 'ACTIVE' ? '🟢 Đang hoạt động' : '🔴 Ngừng hoạt động';
    const typeLabel = wh.type === 'CENTRAL' ? 'Kho tổng' : 'Kho dự án';

    showModal('Thông tin kho', `
        <div class="detail-grid">
            <div><span class="label">Mã kho:</span> <span class="value">${wh.code}</span></div>
            <div><span class="label">Tên kho:</span> <span class="value">${wh.name}</span></div>
            <div><span class="label">Loại kho:</span> <span class="value">${typeLabel}</span></div>
            <div><span class="label">Trạng thái:</span> <span class="value">${statusLabel}</span></div>
            <div><span class="label">Thủ kho:</span> <span class="value">${wh.manager || 'Chưa có'}</span></div>
            <div><span class="label">Địa chỉ:</span> <span class="value">${wh.address || 'Chưa có'}</span></div>
            ${wh.type === 'SITE' ? `<div><span class="label">Dự án:</span> <span class="value">${projectName}</span></div>` : ''}
            <div><span class="label">Số loại vật tư:</span> <span class="value">${itemCount}</span></div>
            <div><span class="label">Tổng tồn (đvt):</span> <span class="value">${totalQty.toLocaleString()}</span></div>
            <div style="grid-column:1/-1;"><span class="label">Ghi chú:</span> <span class="value">${wh.note || ''}</span></div>
        </div>
        <div class="modal-actions"><button class="btn btn-danger" onclick="closeModal()">Đóng</button></div>
    `);
}

// ================================================================
// UTILITY FUNCTIONS - Caching & Debounce
// ================================================================
const _cache = {
    data: {},
    lastFetch: {},
    ttl: {}
};

function getCachedData(key, fetchFn, ttl = 60000, forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && _cache.data[key] && _cache.lastFetch[key] && (now - _cache.lastFetch[key] < ttl)) {
        return Promise.resolve(_cache.data[key]);
    }
    return fetchFn().then(data => {
        _cache.data[key] = data;
        _cache.lastFetch[key] = now;
        _cache.ttl[key] = ttl;
        return data;
    });
}

function clearCache(key) {
    if (key) {
        delete _cache.data[key];
        delete _cache.lastFetch[key];
        delete _cache.ttl[key];
    } else {
        _cache.data = {};
        _cache.lastFetch = {};
        _cache.ttl = {};
    }
}

function getCacheStatus() {
    return {
        keys: Object.keys(_cache.data),
        lastFetch: _cache.lastFetch,
        ttl: _cache.ttl
    };
}

function debounce(func, wait = 300, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
        const context = this;
        const later = () => {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

// ====== RENDER PROGRESS BAR TỪ WORKFLOW PROGRESS ======
function renderWorkflowProgressBar(progress) {
    if (!progress) {
        return `<div style="color:#999;">Chưa có thông tin tiến độ</div>`;
    }

    const { currentStep, totalSteps, approvalStep, status, isApproved, isCompleted } = progress;
    const percent = totalSteps > 0 ? Math.round((approvalStep / totalSteps) * 100) : 0;
    const isFinished = isCompleted || status === 'COMPLETED' || status === 'COMPLETE';

    let statusText = status;
    let statusColor = '#6b7280';
    if (isFinished) {
        statusText = '✅ Hoàn thành';
        statusColor = '#22c55e';
    } else if (isApproved) {
        statusText = '✅ Đã duyệt';
        statusColor = '#22c55e';
    } else if (status === 'PENDING') {
        statusText = `⏳ Đang chờ duyệt (bước ${currentStep}/${totalSteps})`;
        statusColor = '#f59e0b';
    } else if (status === 'DRAFT') {
        statusText = '📝 Nháp (chưa gửi duyệt)';
        statusColor = '#6b7280';
    } else if (status === 'REJECTED') {
        statusText = '❌ Từ chối';
        statusColor = '#ef4444';
    }

    let stepsHtml = '';
    for (let i = 1; i <= totalSteps; i++) {
        const isDone = i <= approvalStep;
        const isCurrent = i === currentStep && !isDone && !isFinished;
        let circleColor = isDone ? '#22c55e' : (isCurrent ? '#f59e0b' : '#e5e7eb');
        let labelColor = isDone ? '#15803d' : (isCurrent ? '#d97706' : '#9ca3af');
        let icon = isDone ? '✓' : i;
        stepsHtml += `
            <div style="display:flex; flex-direction:column; align-items:center; flex:1; position:relative;">
                <div style="width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; background:${circleColor}; color:white; z-index:2;">${icon}</div>
                ${i < totalSteps ? `<div style="flex:1; height:3px; background:${isDone ? '#22c55e' : '#e5e7eb'}; position:absolute; left:calc(50% + 14px); right:calc(-50% + 14px); top:14px; z-index:1;"></div>` : ''}
                <div style="font-size:11px; color:${labelColor}; margin-top:4px; text-align:center; max-width:80px;">Bước ${i}</div>
            </div>
        `;
    }

    return `
        <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:12px 16px; border-radius:8px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:4px;">
                <span style="font-size:14px; font-weight:500; color:#334155;">${statusText}</span>
                <span style="font-size:13px; color:#888;">${percent}%</span>
            </div>
            <div style="display:flex; align-items:center; justify-content:space-between; width:100%; margin:4px 0;">
                ${stepsHtml}
            </div>
            ${isFinished ? `<div style="margin-top:8px; font-size:13px; color:#15803d; font-weight:500;">✅ Đã hoàn thành toàn bộ quy trình</div>` : ''}
            ${isApproved && !isFinished ? `<div style="margin-top:8px; font-size:13px; color:#3b82f6; font-weight:500;">📌 Đã duyệt xong, chờ hoàn thành các bước tiếp theo (nhập kho...)</div>` : ''}
            ${status === 'PENDING' && !isApproved && !isFinished ? `<div style="margin-top:8px; font-size:13px; color:#f59e0b;">⏳ Chờ duyệt bước ${currentStep}/${totalSteps}</div>` : ''}
        </div>
    `;
}

// ================================================================
// EXPORT
// ================================================================
window.getItemName = getItemName;
window.getItemCode = getItemCode;
window.getItemUnit = getItemUnit;
window.getItemModel = getItemModel;
window.getProjectNameByProjectId = getProjectNameByProjectId;
window.getProjectNameByCode = getProjectNameByCode;
window.getProjectIdByCode = getProjectIdByCode;
window.getVendorName = getVendorName;
window.getWarehouseName = getWarehouseName;
window.getWarehouseCode = getWarehouseCode;
window.getStatusBadge = getStatusBadge;
window.getApprovalStepName = getApprovalStepName;
window.formatCurrency = formatCurrency;
window.formatDate = formatDate;
window.showModal = showModal;
window.closeModal = closeModal;
window.renderApprovalProgress = renderApprovalProgress;
window.showWarehouseInfoModal = showWarehouseInfoModal;
window.paginate = paginate;
window.buildPaginationHTML = buildPaginationHTML;
window.getPageSize = getPageSize;
window.setPageSize = setPageSize;
window.DEFAULT_PAGE_SIZE = DEFAULT_PAGE_SIZE;
window.PAGE_SIZE_OPTIONS = PAGE_SIZE_OPTIONS;
window.getCachedData = getCachedData;
window.clearCache = clearCache;
window.getCacheStatus = getCacheStatus;
window.debounce = debounce;
window.getStatusesForModule = getStatusesForModule;
window.getStatusInfo = getStatusInfo;
window.getStatusBadgeWithInfo = getStatusBadgeWithInfo;
window.getUserApprovalLevel = getUserApprovalLevel;
window.getUserDepartmentId = getUserDepartmentId;
window.canApprove = canApprove;
window.renderWorkflowProgressBar = renderWorkflowProgressBar;

console.log('✅ Utils updated with approval level and canApprove function.');