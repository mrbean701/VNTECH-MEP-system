// ================================================================
// ADMIN HELPERS - Hàm tiện ích chung
// ================================================================

function safeArray(data) {
    return Array.isArray(data) ? data : [];
}

function safeObject(data) {
    return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
}

function getRoles() {
    return [
        { value: 'ADMIN', label: 'Admin' },
        { value: 'PLANNING', label: 'Kế hoạch' },
        { value: 'PROJECT', label: 'Dự án' },
        { value: 'CEO', label: 'CEO' },
        { value: 'PURCHASING', label: 'Mua hàng' },
        { value: 'SITE_COMMANDER', label: 'Chỉ huy' },
        { value: 'QC', label: 'QC' }
    ];
}

/**
 * Định nghĩa module và các action tương ứng
 */
function getModuleActions() {
    return {
        'dashboard': ['view'],
        'mr': ['view', 'create', 'edit', 'delete', 'approve', 'submit', 'reject'],
        'pr': ['view', 'create', 'edit', 'delete', 'approve', 'submit', 'reject'],
        'po': ['view', 'create', 'edit', 'delete', 'approve', 'submit', 'reject'],
        'inventory': ['view', 'edit', 'delete'],
        'grn': ['view', 'create', 'edit', 'delete', 'receive', 'qc', 'complete'],
        'sto': ['view', 'create', 'edit', 'delete', 'submit', 'approve', 'complete'],
        'issue': ['view', 'create', 'edit', 'delete', 'submit', 'approve', 'complete', 'confirm', 'reject'],
        'materialreturn': ['view', 'create', 'edit', 'delete', 'submit', 'approve', 'confirm', 'reject'],
        'admin': ['view']
    };
}

/**
 * Lấy danh sách tất cả permission keys (module.action)
 */
function getAllPermissionKeys() {
    const actions = getModuleActions();
    const keys = [];
    Object.keys(actions).forEach(module => {
        actions[module].forEach(action => {
            keys.push(`${module}.${action}`);
        });
    });
    return keys;
}

/**
 * Label hiển thị cho action
 */
function getActionLabel(action) {
    const map = {
        'view': '👁️ Xem',
        'create': '➕ Tạo',
        'edit': '✏️ Sửa',
        'delete': '🗑️ Xóa',
        'approve': '✅ Duyệt',
        'receive': '📥 Nhận',
        'qc': '🔬 QC',
        'complete': '✔️ Hoàn thành',
        'submit': '📤 Gửi duyệt',
        'confirm': '✅ Xác nhận',
        'reject': '❌ Từ chối'
    };
    return map[action] || action;
}

/**
 * Label hiển thị cho module
 */
function getModuleLabel(module) {
    const map = {
        'dashboard': 'Dashboard',
        'mr': 'MR',
        'pr': 'PR',
        'po': 'PO',
        'inventory': 'Kho / Tồn kho',
        'grn': 'GRN',
        'sto': 'STO',
        'issue': 'Cấp phát',
        'materialreturn': 'Hoàn trả',
        'admin': 'Admin'
    };
    return map[module] || module;
}

// Export ra window
window.safeArray = safeArray;
window.safeObject = safeObject;
window.getRoles = getRoles;
window.getModuleActions = getModuleActions;
window.getAllPermissionKeys = getAllPermissionKeys;
window.getActionLabel = getActionLabel;
window.getModuleLabel = getModuleLabel;