// ================================================================
// UTILITY FUNCTIONS - DÙNG CACHE TỪ API
// ================================================================

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

// ====== BADGE TRẠNG THÁI ======
function getStatusBadge(status) {
    const map = {
        'DRAFT': 'badge-draft',
        'PENDING': 'badge-pending',
        'APPROVED': 'badge-approved',
        'REJECTED': 'badge-rejected',
        'COMPLETED': 'badge-completed',
        'CANCELLED': 'badge-cancelled',
        'CANCEL': 'badge-cancelled',
        'CONFIRMED': 'badge-completed',
        'RECEIVED': 'badge-received',
        'QC_CHECKED': 'badge-qc-checked',
        'PENDING_PLANNING': 'badge-pending',
        'PLANNING_APPROVED': 'badge-approved',
        'PENDING_PROJECT': 'badge-pending',
        'PROJECT_APPROVED': 'badge-approved',
        'PENDING_CEO': 'badge-pending'
    };
    return `<span class="badge ${map[status] || 'badge-draft'}">${status}</span>`;
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

/**
 * Danh sách roles dùng trong admin
 */
function getRoles() {
    return [
        { value: 'ADMIN', label: 'Admin' },
        { value: 'CEO', label: 'CEO' },
        { value: 'PLANNING', label: 'Kế hoạch' },
        { value: 'PROJECT', label: 'Dự án' },
        { value: 'PURCHASING', label: 'Mua hàng' },
        { value: 'SITE_COMMANDER', label: 'Chỉ huy' },
        { value: 'QC', label: 'QC' }
    ];
}
window.getRoles = getRoles;

function closeModal() {
    const modal = document.getElementById('modal');
    modal.classList.remove('active');
    document.querySelectorAll('.form-group.has-error').forEach(el => el.classList.remove('has-error'));
}

document.getElementById('modal')?.addEventListener('click', function(e) {
    if (e.target === this) closeModal();
});

// ================================================================
// RENDER PROGRESS (DÙNG CHO MR, PR, PO, GRN, STO, ISSUE, RETURN)
// ================================================================
function renderApprovalProgress(status, step, stepsConfig) {
    const defaultSteps = [
        { id: 1, label: 'Phòng Kế hoạch' },
        { id: 2, label: 'Phòng Dự án' },
        { id: 3, label: 'Tổng Giám đốc' }
    ];
    const steps = stepsConfig || defaultSteps;
    const currentStep = step || 1;

    if (status === 'APPROVED' || status === 'COMPLETED' || status === 'CONFIRMED') {
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
                    <span style="font-size:13px; background:#dcfce7; padding:2px 12px; border-radius:12px; color:#15803d;">Hoàn thành</span>
                </div>
                ${progressHtml}
                ${labelsHtml}
            </div>
        `;
    }

    if (status === 'REJECTED') {
        return `
            <div style="background:#fef2f2; border:1px solid #fecaca; padding:10px 14px; border-radius:8px; display:flex; align-items:center; gap:8px; color:#b91c1c;">
                <span style="font-weight:600;">❌ Đã bị từ chối</span>
                <span style="flex:1;"></span>
                <span style="font-size:13px; background:#fee2e2; padding:2px 12px; border-radius:12px;">Không duyệt</span>
            </div>
        `;
    }

    if (status === 'PENDING' || status === 'RECEIVED' || status === 'QC_CHECKED') {
        let progressHtml = `<div style="display:flex; align-items:center; justify-content:space-between; width:100%; margin:8px 0;">`;
        steps.forEach((s, idx) => {
            let circleBg = '';
            let lineColor = '';
            if (s.id < currentStep) {
                circleBg = 'background:#22c55e; color:white;';
                lineColor = '#22c55e';
            } else if (s.id === currentStep) {
                circleBg = 'background:#f59e0b; color:white; box-shadow:0 0 0 4px #fef3c7;';
                lineColor = '#e5e7eb';
            } else {
                circleBg = 'background:#e5e7eb; color:#9ca3af;';
                lineColor = '#e5e7eb';
            }
            progressHtml += `
                <div style="display:flex; flex-direction:column; align-items:center; flex:1; position:relative;">
                    <div style="width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; ${circleBg} z-index:2;">
                        ${s.id < currentStep ? '✓' : s.id}
                    </div>
                    ${idx < steps.length - 1 ? `<div style="flex:1; height:3px; background:${lineColor}; position:absolute; left:calc(50% + 14px); right:calc(-50% + 14px); top:14px; z-index:1;"></div>` : ''}
                </div>
            `;
        });
        progressHtml += `</div>`;
        let labelsHtml = `<div style="display:flex; justify-content:space-between; width:100%; margin-top:4px;">`;
        steps.forEach(s => {
            let color = s.id < currentStep ? '#15803d' : (s.id === currentStep ? '#d97706' : '#9ca3af');
            let weight = s.id === currentStep ? '600' : '400';
            labelsHtml += `<span style="text-align:center; flex:1; font-size:12px; color:${color}; font-weight:${weight};">${s.label}</span>`;
        });
        labelsHtml += `</div>`;
        const stepName = steps.find(s => s.id === currentStep)?.label || `Bước ${currentStep}`;
        return `
            <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:12px 16px; border-radius:8px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                    <span style="font-size:14px; font-weight:500; color:#334155;">⏳ Đang thực hiện bước ${currentStep}</span>
                    <span style="font-size:13px; background:#fef3c7; padding:2px 12px; border-radius:12px; color:#b45309;">${stepName}</span>
                </div>
                ${progressHtml}
                ${labelsHtml}
            </div>
        `;
    }
    return '';
}

function renderSTOProgress(status, sto) {
    const steps = [
        { id: 1, label: 'Lập phiếu', actor: sto?.requestedBy || 'Chưa có' },
        { id: 2, label: 'Duyệt', actor: sto?.approvedBy || 'Chưa duyệt' },
        { id: 3, label: 'Xuất kho', actor: sto?.warehouseStaff || 'Chưa xuất' }
    ];
    let currentStep = 1;
    if (status === 'PENDING') currentStep = 2;
    else if (status === 'APPROVED' || status === 'COMPLETED') currentStep = 3;
    return renderApprovalProgress(status, currentStep, steps);
}

function renderGRNProgress(status) {
    const steps = [
        { id: 1, label: 'Tạo phiếu' },
        { id: 2, label: 'Thủ kho nhận' },
        { id: 3, label: 'QC kiểm tra' },
        { id: 4, label: 'Hoàn thành' }
    ];
    let currentStep = 1;
    if (status === 'RECEIVED') currentStep = 2;
    else if (status === 'QC_CHECKED') currentStep = 3;
    else if (status === 'COMPLETED') currentStep = 4;
    return renderApprovalProgress(status, currentStep, steps);
}

// ====== SHOW WAREHOUSE INFO MODAL ======
function showWarehouseInfoModal(whId) {
    const wh = (window._warehousesCache || []).find(w => w.id === whId);
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

// ====== EXPORT RA WINDOW ======
window.getItemName = getItemName;
window.getItemCode = getItemCode;
window.getItemUnit = getItemUnit;
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
window.renderSTOProgress = renderSTOProgress;
window.renderGRNProgress = renderGRNProgress;
window.showWarehouseInfoModal = showWarehouseInfoModal;

console.log('✅ Utils module (using API cache) loaded successfully.');